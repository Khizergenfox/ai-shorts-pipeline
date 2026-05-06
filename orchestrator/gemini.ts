import axios from "axios";
import { Scene } from "./types";

const API_KEY = process.env.GEMINI_API_KEY!;
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

// ─── Image generation (Imagen 4) ────────────────────────────────────────────

export async function generateImagenFrame(prompt: string): Promise<string> {
  console.log(`🖼️  Generating Imagen frame: "${prompt.slice(0, 60)}..."`);

  const response = await axios.post(
    `${BASE_URL}/models/imagen-4.0-generate-001:predict?key=${API_KEY}`,
    {
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: "9:16",
        safetyFilterLevel: "block_some",
      },
    }
  );

  const base64 =
    response.data?.predictions?.[0]?.bytesBase64Encoded ??
    response.data?.predictions?.[0]?.image?.imageBytes;

  if (!base64) {
    console.error("Imagen response:", JSON.stringify(response.data, null, 2));
    throw new Error("Imagen returned no image data");
  }

  console.log("✅  Imagen frame generated");
  return base64;
}

// ─── Video generation (Veo 3.1 Fast — standard Gemini API) ──────────────────

export async function generateVeoClip(
  prompt: string,
  imageBase64?: string  // Optional: base64 image for image-to-video
): Promise<Buffer> {
  console.log(`🎬  Generating Veo clip: "${prompt.slice(0, 60)}..."`);

  const instance: Record<string, unknown> = { prompt };
  if (imageBase64) {
    instance.image = { bytesBase64Encoded: imageBase64 };
  }

  const submitRes = await axios.post(
    `${BASE_URL}/models/veo-3.0-generate-001:predictLongRunning?key=${API_KEY}`,
    {
      instances: [instance],
      parameters: { sampleCount: 1, durationSeconds: 8, aspectRatio: "9:16" },
    }
  );

  const operationName: string = submitRes.data.name;
  console.log(`⏳  Veo operation started: ${operationName}`);

  const videoBuffer = await pollVeoOperation(operationName);
  console.log("✅  Veo clip downloaded");
  return videoBuffer;
}

async function pollVeoOperation(operationName: string): Promise<Buffer> {
  const maxAttempts = 72; // 6 minutes max
  const pollIntervalMs = 5000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, pollIntervalMs));

    // Operation name format: "models/veo-3.0-generate-001/operations/xxx"
    const opPath = operationName;

    const res = await axios.get(
      `${BASE_URL}/${opPath}?key=${API_KEY}`
    );

    if (res.data.done) {
      // Response has videos array with base64 or URI
      const videos = res.data.response?.generatedSamples ?? res.data.response?.videos;
      const firstVideo = videos?.[0];

      if (!firstVideo) {
        console.error("Veo done response:", JSON.stringify(res.data, null, 2));
        throw new Error("Veo operation done but no video in response");
      }

      // Handle base64 encoded video
      if (firstVideo.video?.encodedVideo) {
        return Buffer.from(firstVideo.video.encodedVideo, "base64");
      }

      // Handle URI download
      const videoUri = firstVideo.video?.uri ?? firstVideo.uri;
      if (videoUri) {
        const videoRes = await axios.get(videoUri, {
          responseType: "arraybuffer",
        });
        return Buffer.from(videoRes.data);
      }

      throw new Error("Veo done but no video data found in response");
    }

    const elapsed = ((attempt + 1) * pollIntervalMs) / 1000;
    process.stdout.write(`\r⏳  Veo generating... ${elapsed.toFixed(0)}s elapsed`);
  }

  throw new Error("Veo generation timed out after 6 minutes");
}

// ─── Batch asset generation ──────────────────────────────────────────────────

export async function generateAllImagenFrames(
  scenes: Scene[]
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const toGenerate = scenes.filter(
    (s) => (s.type === "infographic" || s.type === "beige_illustration") && s.imagenPrompt
  );

  await Promise.all(
    toGenerate.map(async (scene) => {
      try {
        const base64 = await generateImagenFrame(scene.imagenPrompt!);
        results.set(scene.id, base64);
      } catch (err) {
        console.error(`❌  Imagen failed for scene ${scene.id}:`, err);
      }
    })
  );

  return results;
}

export async function generateAllVeoClips(
  scenes: Scene[]
): Promise<Map<string, Buffer>> {
  const results = new Map<string, Buffer>();
  const toGenerate = scenes.filter(
    (s) => s.type === "veo_clip" && (s as any).veoPrompt
  );

  await Promise.all(
    toGenerate.map(async (scene) => {
      try {
        let imageBase64: string | undefined;

        // If a public image URL is provided, fetch and convert to base64
        if (scene.veoImageUrl) {
          const imgRes = await axios.get(scene.veoImageUrl, { responseType: "arraybuffer" });
          imageBase64 = Buffer.from(imgRes.data).toString("base64");
        }

        const veoPrompt = (scene as any).veoPrompt as string;
        const buf = await generateVeoClip(veoPrompt, imageBase64);
        results.set(scene.id, buf);
      } catch (err) {
        console.error(`❌  Veo failed for scene ${scene.id}:`, (err as Error).message);
      }
    })
  );

  return results;
}
