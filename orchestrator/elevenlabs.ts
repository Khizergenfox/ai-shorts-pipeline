import axios from "axios";
import { WordTimestamp } from "./types";
import { parseElevenLabsAlignment } from "../src/lib/captionUtils";

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const API_KEY = process.env.ELEVENLABS_API_KEY;

export interface VoiceSynthResult {
  audioBuffer: Buffer;
  wordTimestamps: WordTimestamp[];
  durationSeconds: number;
}

export async function synthesizeVoiceover(
  script: string
): Promise<VoiceSynthResult> {
  if (!VOICE_ID) throw new Error("ELEVENLABS_VOICE_ID not set in env");
  if (!API_KEY) throw new Error("ELEVENLABS_API_KEY not set in env");

  console.log("🎙️  Synthesizing voiceover with ElevenLabs...");

  const response = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps`,
    {
      text: script,
      model_id: "eleven_multilingual_v2",
      // Voice settings — tune these to your specific voice clone via env vars.
      // Defaults below are ElevenLabs' documented neutral starting point.
      // See gen-audio.mjs for a longer note on why script structure matters
      // more than these numbers.
      voice_settings: {
        stability: Number(process.env.ELEVENLABS_STABILITY) || 0.5,
        similarity_boost: Number(process.env.ELEVENLABS_SIMILARITY_BOOST) || 0.75,
        style: Number(process.env.ELEVENLABS_STYLE) || 0.0,
        use_speaker_boost: process.env.ELEVENLABS_USE_SPEAKER_BOOST !== "false",
      },
    },
    {
      headers: {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  const { audio_base64, normalized_alignment } = response.data;
  const audioBuffer = Buffer.from(audio_base64, "base64");

  const wordTimestamps = parseElevenLabsAlignment(normalized_alignment);

  // Estimate total duration from last word's end time
  const durationSeconds =
    wordTimestamps.length > 0
      ? wordTimestamps[wordTimestamps.length - 1].endTime + 0.3
      : 60;

  console.log(
    `✅ Voiceover synthesized — ${wordTimestamps.length} words, ~${durationSeconds.toFixed(1)}s`
  );

  return { audioBuffer, wordTimestamps, durationSeconds };
}
