// Generate a HeyGen avatar clip lip-synced to a SLICE of our ElevenLabs audio.
//
// Path D: ElevenLabs voice (existing) → HeyGen audio-driven avatar mode → MP4
// This is the production architecture. Audio comes from us, face from HeyGen.
//
// Usage:
//   node scripts/gen-heygen-clip.mjs <sessionId> <clipId> <startSec> <endSec>
//
// Example:
//   node scripts/gen-heygen-clip.mjs ds-v4-full s01_hook 0.0 4.8
//
// Flow:
//   1. Slice public/sessions/<sessionId>/audio.mp3 [start..end] via ffmpeg
//   2. Upload slice as raw binary to upload.heygen.com/v1/asset (returns asset_id)
//   3. POST api.heygen.com/v2/video/generate with audio mode + avatar_id (1080×1920)
//   4. Poll api.heygen.com/v1/video_status.get?video_id=... until status=completed
//   5. Download finished mp4 → public/sessions/<sessionId>/avatar-clips/<clipId>.mp4

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// ── Args ─────────────────────────────────────────────────────────
const [, , SESSION_ID, CLIP_ID, START_SEC_RAW, END_SEC_RAW] = process.argv;
if (!SESSION_ID || !CLIP_ID || !START_SEC_RAW || !END_SEC_RAW) {
  console.error("Usage: node scripts/gen-heygen-clip.mjs <sessionId> <clipId> <startSec> <endSec>");
  process.exit(1);
}
const startSec = parseFloat(START_SEC_RAW);
const endSec = parseFloat(END_SEC_RAW);
const durationSec = endSec - startSec;
if (!(durationSec > 0)) {
  console.error(`Invalid duration: ${durationSec}s`);
  process.exit(1);
}

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const AVATAR_ID = process.env.HEYGEN_AVATAR_ID;
if (!HEYGEN_API_KEY || !AVATAR_ID) {
  console.error("HEYGEN_API_KEY and HEYGEN_AVATAR_ID must be set in .env");
  process.exit(1);
}

// ── Paths ────────────────────────────────────────────────────────
const sessionDir = path.join(projectRoot, "public/sessions", SESSION_ID);
const fullAudio = path.join(sessionDir, "audio.mp3");
if (!fs.existsSync(fullAudio)) {
  console.error(`Audio not found: ${fullAudio}`);
  process.exit(1);
}

const outDir = path.join(sessionDir, "avatar-clips");
fs.mkdirSync(outDir, { recursive: true });
const sliceAudio = path.join(outDir, `${CLIP_ID}.mp3`);
const finalMp4 = path.join(outDir, `${CLIP_ID}.mp4`);

// ── Step 1: Slice audio ──────────────────────────────────────────
console.log(`\n🎙   Slicing ${SESSION_ID}/audio.mp3  [${startSec.toFixed(2)}s → ${endSec.toFixed(2)}s, ${durationSec.toFixed(2)}s]`);
execFileSync(ffmpegPath, [
  "-y",
  "-ss", String(startSec),
  "-to", String(endSec),
  "-i", fullAudio,
  "-c:a", "libmp3lame",
  "-b:a", "192k",
  sliceAudio,
], { stdio: "ignore" });
const sliceBytes = fs.statSync(sliceAudio).size;
console.log(`    → ${path.relative(projectRoot, sliceAudio)} (${(sliceBytes / 1024).toFixed(1)} KB)`);

// ── Step 2: Upload slice to HeyGen asset endpoint ────────────────
console.log(`\n📤  Uploading slice to upload.heygen.com/v1/asset...`);
const uploadResp = await fetch("https://upload.heygen.com/v1/asset", {
  method: "POST",
  headers: {
    "X-API-KEY": HEYGEN_API_KEY,
    "Content-Type": "audio/mpeg",
  },
  body: fs.readFileSync(sliceAudio),
});
const uploadJson = await uploadResp.json();
if (!uploadResp.ok || uploadJson.code !== 100) {
  console.error("Upload failed:", JSON.stringify(uploadJson, null, 2));
  process.exit(1);
}
const audioAssetId = uploadJson.data.id;
console.log(`    → audio_asset_id = ${audioAssetId}`);

// ── Step 3: Generate avatar video (audio-driven mode, 9:16) ──────
console.log(`\n🎬  Generating avatar video (audio-driven, 9:16)...`);
const genBody = {
  video_inputs: [
    {
      character: {
        type: "avatar",
        avatar_id: AVATAR_ID,
        avatar_style: "normal",
      },
      voice: {
        type: "audio",
        audio_asset_id: audioAssetId,
      },
    },
  ],
  dimension: { width: 1080, height: 1920 },
  title: `${SESSION_ID}-${CLIP_ID}`,
};

const genResp = await fetch("https://api.heygen.com/v2/video/generate", {
  method: "POST",
  headers: {
    "X-API-KEY": HEYGEN_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(genBody),
});
const genJson = await genResp.json();
if (!genResp.ok) {
  console.error("Generate failed:", JSON.stringify(genJson, null, 2));
  process.exit(1);
}
const videoId = genJson.data?.video_id;
if (!videoId) {
  console.error("No video_id in response:", JSON.stringify(genJson, null, 2));
  process.exit(1);
}
console.log(`    → video_id = ${videoId}`);

// ── Step 4: Poll status until completed ──────────────────────────
console.log(`\n⏳  Polling status (this can take 1-5 min)...`);
let videoUrl = null;
const startTime = Date.now();
let lastStatus = "";
while (true) {
  await new Promise((r) => setTimeout(r, 5000));
  const statusResp = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
    headers: { "X-API-KEY": HEYGEN_API_KEY },
  });
  const statusJson = await statusResp.json();
  const status = statusJson.data?.status;
  if (status !== lastStatus) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    console.log(`    [${elapsed}s] status = ${status}`);
    lastStatus = status;
  }
  if (status === "completed") {
    videoUrl = statusJson.data.video_url;
    break;
  }
  if (status === "failed") {
    console.error("Generation failed:", JSON.stringify(statusJson, null, 2));
    process.exit(1);
  }
  if ((Date.now() - startTime) / 1000 > 600) {
    console.error("Timeout after 10 minutes");
    process.exit(1);
  }
}
console.log(`    → video_url = ${videoUrl}`);

// ── Step 5: Download MP4 ─────────────────────────────────────────
console.log(`\n⬇️   Downloading...`);
const dlResp = await fetch(videoUrl);
if (!dlResp.ok) {
  console.error("Download failed:", dlResp.status, dlResp.statusText);
  process.exit(1);
}
const buf = Buffer.from(await dlResp.arrayBuffer());
fs.writeFileSync(finalMp4, buf);
const mp4Bytes = fs.statSync(finalMp4).size;
console.log(`    → ${path.relative(projectRoot, finalMp4)} (${(mp4Bytes / 1024 / 1024).toFixed(2)} MB)`);

console.log(`\n✅  Done! Avatar clip ready at: ${path.relative(projectRoot, finalMp4)}`);
