// Shared Vertex AI client — handles auth + the Imagen + Veo endpoints we
// use across the daily-video pipeline. Replaces the AI Studio (Gemini API)
// path so we can leverage the Google Cloud credits attached to the project.
//
// Auth: uses a service-account JSON key file. Path is read from
// VERTEX_SERVICE_ACCOUNT_JSON in .env (default: .gcp-service-account.json
// at project root).
//
// Project + region: read from VERTEX_PROJECT_ID + VERTEX_LOCATION in .env.
// Defaults to us-central1 if unset.

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleAuth } from "google-auth-library";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");

// ── Configuration ─────────────────────────────────────────────────────────

const SA_KEY_PATH = process.env.VERTEX_SERVICE_ACCOUNT_JSON
  ? path.resolve(projectRoot, process.env.VERTEX_SERVICE_ACCOUNT_JSON)
  : path.resolve(projectRoot, ".gcp-service-account.json");

const LOCATION = process.env.VERTEX_LOCATION ?? "us-central1";

let _projectId = process.env.VERTEX_PROJECT_ID;

// Lazy: only check the SA file when we actually call Vertex
function ensureSaFile() {
  if (!fs.existsSync(SA_KEY_PATH)) {
    throw new Error(
      `❌  Service account JSON not found at: ${SA_KEY_PATH}\n` +
      `    Set VERTEX_SERVICE_ACCOUNT_JSON in .env to the file path,\n` +
      `    or save the JSON to .gcp-service-account.json in the project root.`,
    );
  }
}

function getProjectId() {
  if (_projectId) return _projectId;
  ensureSaFile();
  const sa = JSON.parse(fs.readFileSync(SA_KEY_PATH, "utf8"));
  _projectId = sa.project_id;
  if (!_projectId) {
    throw new Error("❌  Service account JSON missing project_id");
  }
  return _projectId;
}

// ── Auth ──────────────────────────────────────────────────────────────────

let _authClient;

async function getAuthClient() {
  if (_authClient) return _authClient;
  ensureSaFile();
  const auth = new GoogleAuth({
    keyFile: SA_KEY_PATH,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  _authClient = await auth.getClient();
  return _authClient;
}

async function getAccessToken() {
  const client = await getAuthClient();
  const { token } = await client.getAccessToken();
  if (!token) throw new Error("❌  Failed to obtain access token");
  return token;
}

// ── HTTP helper ────────────────────────────────────────────────────────────

export async function vertexRequest(url, body) {
  const token = await getAccessToken();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, ok: res.ok, json: await res.json() };
}

export async function vertexGet(url) {
  const token = await getAccessToken();
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, ok: res.ok, json: await res.json() };
}

// ── Imagen 4: text-to-image ────────────────────────────────────────────────

/**
 * Generate a single 9:16 image from a text prompt using Imagen 4 on Vertex.
 * Returns base64-encoded PNG bytes.
 */
export async function generateImagen({
  prompt,
  aspectRatio = "9:16",
  model = "imagen-4.0-generate-001",
}) {
  const projectId = getProjectId();
  const url =
    `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${projectId}` +
    `/locations/${LOCATION}/publishers/google/models/${model}:predict`;

  const { ok, status, json } = await vertexRequest(url, {
    instances: [{ prompt }],
    parameters: { sampleCount: 1, aspectRatio },
  });
  if (!ok) {
    throw new Error(`Imagen ${status}: ${JSON.stringify(json).slice(0, 600)}`);
  }
  const b64 =
    json?.predictions?.[0]?.bytesBase64Encoded ??
    json?.predictions?.[0]?.image?.imageBytes;
  if (!b64) {
    throw new Error(`Imagen returned no image data: ${JSON.stringify(json).slice(0, 400)}`);
  }
  return b64;
}

// ── Veo: text-to-video and image-to-video ──────────────────────────────────

/**
 * Submit a Veo generation job. Returns the long-running operation name to poll.
 * @param prompt           Text prompt
 * @param imageBase64      Optional seed image for image-to-video (base64 PNG)
 * @param model            Default veo-3.0-fast-generate-001 (no audio synthesis,
 *                          avoids the audio safety filter)
 */
export async function submitVeoJob({
  prompt,
  imageBase64,
  durationSeconds = 8,
  aspectRatio = "9:16",
  model = "veo-3.0-fast-generate-001",
}) {
  const projectId = getProjectId();
  const url =
    `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${projectId}` +
    `/locations/${LOCATION}/publishers/google/models/${model}:predictLongRunning`;

  const instance = { prompt };
  if (imageBase64) {
    instance.image = { bytesBase64Encoded: imageBase64, mimeType: "image/png" };
  }

  const { ok, status, json } = await vertexRequest(url, {
    instances: [instance],
    parameters: { sampleCount: 1, durationSeconds, aspectRatio },
  });
  if (!ok || !json.name) {
    throw new Error(`Veo submit ${status}: ${JSON.stringify(json).slice(0, 600)}`);
  }
  return json.name; // operation name like projects/.../operations/<id>
}

/**
 * Poll a Veo operation until done. Returns the video as a Buffer.
 * Vertex Veo operations have a different fetch-result endpoint than AI Studio:
 * we POST to ":fetchPredictOperation" to get the response.
 */
export async function pollVeoOperation(operationName, {
  maxAttempts = 72,
  pollIntervalMs = 5000,
  model = "veo-3.0-fast-generate-001",
} = {}) {
  const projectId = getProjectId();
  const fetchUrl =
    `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${projectId}` +
    `/locations/${LOCATION}/publishers/google/models/${model}:fetchPredictOperation`;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, pollIntervalMs));
    const { ok, status, json } = await vertexRequest(fetchUrl, {
      operationName,
    });
    if (!ok) {
      throw new Error(`Veo poll ${status}: ${JSON.stringify(json).slice(0, 400)}`);
    }
    process.stdout.write(`\r⏳  ${i + 1}/${maxAttempts}  (${(i + 1) * 5}s)`);
    if (json.done) {
      console.log("");
      const samples =
        json.response?.videos ??
        json.response?.generatedSamples ??
        json.response?.generateVideoResponse?.generatedSamples;
      const first = samples?.[0];
      if (!first) {
        throw new Error(`Veo done but no samples: ${JSON.stringify(json).slice(0, 600)}`);
      }
      // Vertex returns base64 video bytes inline most commonly
      if (first.bytesBase64Encoded) {
        return Buffer.from(first.bytesBase64Encoded, "base64");
      }
      if (first.video?.encodedVideo) {
        return Buffer.from(first.video.encodedVideo, "base64");
      }
      if (first.video?.bytesBase64Encoded) {
        return Buffer.from(first.video.bytesBase64Encoded, "base64");
      }
      // Fall back to URI download (Vertex sometimes returns gs:// uris)
      const uri = first.gcsUri ?? first.video?.uri ?? first.uri;
      if (!uri) {
        throw new Error(`Veo done but no video data found: ${JSON.stringify(first).slice(0, 400)}`);
      }
      // For gs:// uris we'd need to fetch via Storage API — out of scope.
      // For https URIs, do an authenticated GET.
      if (uri.startsWith("gs://")) {
        throw new Error(`Veo returned gs:// URI ${uri} — not implemented (would need Storage API)`);
      }
      const token = await getAccessToken();
      const dl = await fetch(uri, { headers: { Authorization: `Bearer ${token}` } });
      return Buffer.from(await dl.arrayBuffer());
    }
  }
  throw new Error("Veo timed out");
}

/**
 * One-shot helper: submit a Veo job, poll until done, return Buffer.
 */
export async function generateVeo(opts) {
  const operation = await submitVeoJob(opts);
  console.log(`⏳  Operation: ${operation}`);
  return pollVeoOperation(operation, { model: opts.model });
}

// ── Gemini 2.5 Flash Image (Nano Banana) — image-to-image via Vertex ─────

/**
 * Edit an image using Gemini 2.5 Flash Image via Vertex AI.
 * Takes a source image (base64) + text prompt, returns the edited image
 * as a base64 string. Useful for "place this person in a different scene"
 * style transformations that text-only Imagen can't do.
 *
 * @param imageBase64  Source image as base64 (no data URI prefix)
 * @param mimeType     "image/jpeg" or "image/png"
 * @param prompt       Edit instruction
 * @param model        Default "gemini-2.5-flash-image-preview"
 */
export async function geminiEditImage({
  imageBase64,
  mimeType = "image/jpeg",
  prompt,
  model = "gemini-2.5-flash-image-preview",
}) {
  const projectId = getProjectId();
  const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${LOCATION}/publishers/google/models/${model}:generateContent`;
  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: prompt },
        ],
      },
    ],
    generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
  };
  const { ok, status, json } = await vertexRequest(url, body);
  if (!ok) {
    throw new Error(
      `Gemini edit HTTP ${status}: ${JSON.stringify(json).slice(0, 400)}`,
    );
  }
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  const imgPart = parts.find((p) => p.inlineData?.data || p.inline_data?.data);
  if (!imgPart) {
    throw new Error(
      `Gemini edit returned no image. Response: ${JSON.stringify(json).slice(0, 500)}`,
    );
  }
  return imgPart.inlineData?.data ?? imgPart.inline_data?.data;
}

// ── Diagnostic ────────────────────────────────────────────────────────────

export async function ping() {
  const projectId = getProjectId();
  const token = await getAccessToken();
  return {
    projectId,
    location: LOCATION,
    saKeyPath: path.relative(projectRoot, SA_KEY_PATH),
    tokenPrefix: token.slice(0, 16) + "…",
  };
}
