// One-shot audio generation: takes a text script, calls ElevenLabs with
// word-level timestamps, post-processes the audio with ffmpeg's loudnorm
// filter to boost loudness to TikTok/Reels broadcast level.
//
// Usage:
//   node scripts/gen-audio.mjs <script-path> <session-id>
// Example:
//   node scripts/gen-audio.mjs scripts/example.txt example
//
// Outputs:
//   public/sessions/<session-id>/audio.mp3       — loudness-normalized
//   public/sessions/<session-id>/audio-raw.mp3   — pre-normalization (for debugging)
//   public/sessions/<session-id>/word-timestamps.json
//   public/sessions/<session-id>/audio-meta.json (script, duration, etc.)
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const scriptPath = process.argv[2] ?? "scripts/example.txt";
const sessionId = process.argv[3] ?? "example";

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("❌  ELEVENLABS_API_KEY not set");
  process.exit(1);
}
if (!VOICE_ID) {
  console.error("❌  ELEVENLABS_VOICE_ID not set — clone or pick a voice in ElevenLabs and copy its ID");
  process.exit(1);
}

// Read script
const scriptAbs = path.resolve(projectRoot, scriptPath);
const scriptText = fs.readFileSync(scriptAbs, "utf8").trim();
console.log(`📝  Script: ${scriptText.length} chars`);

// Output paths
const sessionDir = path.join(projectRoot, "public/sessions", sessionId);
fs.mkdirSync(sessionDir, { recursive: true });
const rawAudioPath = path.join(sessionDir, "audio-raw.mp3");
const finalAudioPath = path.join(sessionDir, "audio.mp3");
const wordsPath = path.join(sessionDir, "word-timestamps.json");
const metaPath = path.join(sessionDir, "audio-meta.json");

console.log(`🎙️  Calling ElevenLabs (voice ${VOICE_ID.slice(0, 8)}...)`);
const res = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps`,
  {
    method: "POST",
    headers: { "xi-api-key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      text: scriptText,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        // Voice settings are TUNING the framework can't do for you — they're
        // tied to a specific cloned voice and a specific delivery style.
        //
        // The bigger lesson learned shipping daily videos: settings rarely
        // matter as much as script structure. Lists ("X has it. Y has it.
        // Z has it.") sound robotic regardless of settings. Thinking-flow
        // prose (varied sentence length, connecting phrases, storytelling
        // arc) sounds natural even at default settings.
        //
        // Tune these via env vars to match your voice. ElevenLabs' default
        // values (0.5 / 0.75 / 0) are the safe starting place — adjust
        // upward toward 1.0 for stability/clarity, downward for expressiveness.
        stability: Number(process.env.ELEVENLABS_STABILITY) || 0.5,
        similarity_boost: Number(process.env.ELEVENLABS_SIMILARITY_BOOST) || 0.75,
        style: Number(process.env.ELEVENLABS_STYLE) || 0.0,
        use_speaker_boost: process.env.ELEVENLABS_USE_SPEAKER_BOOST !== "false",
      },
    }),
  },
);
if (!res.ok) {
  console.error(`❌  ElevenLabs ${res.status}:`, await res.text());
  process.exit(1);
}
const json = await res.json();
const audioB64 = json.audio_base64;
const alignment = json.normalized_alignment ?? json.alignment;
if (!audioB64 || !alignment) {
  console.error("❌  Missing audio or alignment in response");
  process.exit(1);
}

// Save raw audio
fs.writeFileSync(rawAudioPath, Buffer.from(audioB64, "base64"));
console.log(`✅  Raw audio: ${(fs.statSync(rawAudioPath).size / 1024 / 1024).toFixed(2)} MB`);

// Convert character-level alignment → word-level timestamps
const words = parseElevenLabsAlignment(alignment);
fs.writeFileSync(wordsPath, JSON.stringify(words, null, 2));
console.log(`✅  Word timestamps: ${words.length} words`);

const durationSec = words.length > 0 ? words[words.length - 1].endTime + 0.3 : 0;
console.log(`⏱   Audio duration: ${durationSec.toFixed(2)}s`);

// Loudness-normalize with ffmpeg loudnorm (broadcast standard)
//   I=-14   target integrated loudness in LUFS (TikTok/IG/YouTube standard)
//   TP=-1   true peak ceiling, prevents clipping
//   LRA=11  loudness range
console.log(`🔊  Loudness-normalizing to -14 LUFS (TikTok/Reels broadcast level)...`);
const ffmpeg = path.join(projectRoot, "node_modules/ffmpeg-static/ffmpeg.exe");
const r = spawnSync(
  ffmpeg,
  [
    "-y",
    "-i", rawAudioPath,
    "-af", "loudnorm=I=-14:TP=-1:LRA=11,volume=1.5",
    "-codec:a", "libmp3lame",
    "-b:a", "192k",
    finalAudioPath,
  ],
  { stdio: ["ignore", "ignore", "pipe"] },
);
if (r.status !== 0) {
  console.error("❌  ffmpeg loudnorm failed:", r.stderr?.toString().slice(-500));
  process.exit(1);
}
console.log(`✅  Final audio: ${(fs.statSync(finalAudioPath).size / 1024 / 1024).toFixed(2)} MB`);

// Save metadata
fs.writeFileSync(
  metaPath,
  JSON.stringify(
    { sessionId, scriptPath, durationSeconds: durationSec, wordCount: words.length, voiceId: VOICE_ID },
    null,
    2,
  ),
);

console.log(`\n✅  Session ready: public/sessions/${sessionId}/`);

// ── helpers ──────────────────────────────────────────────────────────────

function parseElevenLabsAlignment(alignment) {
  const { characters, character_start_times_seconds, character_end_times_seconds } = alignment;
  const out = [];
  let cur = "";
  let startT = 0;
  for (let i = 0; i < characters.length; i++) {
    const c = characters[i];
    if (c === " " || i === characters.length - 1) {
      if (i === characters.length - 1 && c !== " ") cur += c;
      if (cur.trim()) {
        out.push({
          word: cur.trim(),
          startTime: startT,
          endTime: character_end_times_seconds[i - 1] ?? character_end_times_seconds[i],
        });
      }
      cur = "";
      startT = character_start_times_seconds[i + 1] ?? 0;
    } else {
      if (!cur) startT = character_start_times_seconds[i];
      cur += c;
    }
  }
  return out;
}
