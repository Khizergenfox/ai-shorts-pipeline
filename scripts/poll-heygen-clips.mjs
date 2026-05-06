// Polls queued HeyGen video IDs until completed, then downloads MP4s.
//
// Usage:
//   node scripts/poll-heygen-clips.mjs <session-id> <jobs-json-path>
//
// jobs-json-path is a JSON file shaped like:
//   [
//     { "id": "s01_hook",   "videoId": "abc123..." },
//     { "id": "s10_outro",  "videoId": "def456..." }
//   ]
//
// Each id maps to public/sessions/<session-id>/avatar-clips/<id>.mp4
// after download. The id is the spec scene id you'll reference in your spec.
//
// Pair with `gen-heygen-clip.mjs` which queues a single avatar clip and
// returns its video_id — collect those into a jobs JSON, then poll here.

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const KEY = process.env.HEYGEN_API_KEY;
if (!KEY) {
  console.error("❌  HEYGEN_API_KEY not set");
  process.exit(1);
}

const SESSION_ID = process.argv[2];
const JOBS_PATH = process.argv[3];
if (!SESSION_ID || !JOBS_PATH) {
  console.error("Usage: node scripts/poll-heygen-clips.mjs <session-id> <jobs-json-path>");
  process.exit(1);
}

const outDir = path.join(projectRoot, "public/sessions", SESSION_ID, "avatar-clips");
fs.mkdirSync(outDir, { recursive: true });

const jobs = JSON.parse(fs.readFileSync(path.resolve(JOBS_PATH), "utf8"));
if (!Array.isArray(jobs) || jobs.length === 0) {
  console.error("❌  jobs JSON must be a non-empty array of { id, videoId }");
  process.exit(1);
}

async function getStatus(videoId) {
  const r = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
    headers: { "X-API-KEY": KEY },
  });
  return r.json();
}

async function download(url, dest) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download failed: ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

const start = Date.now();
const remaining = new Map(jobs.map((j) => [j.id, j]));
let lastLog = 0;

while (remaining.size > 0) {
  const elapsed = ((Date.now() - start) / 1000).toFixed(0);
  const lines = [];
  for (const [id, job] of remaining) {
    const j = await getStatus(job.videoId);
    const status = j.data?.status;
    lines.push(`  ${id}: ${status}`);
    if (status === "completed") {
      const dest = path.join(outDir, `${id}.mp4`);
      console.log(`\n✓ ${id} ready → downloading...`);
      await download(j.data.video_url, dest);
      const sizeMB = (fs.statSync(dest).size / 1024 / 1024).toFixed(2);
      console.log(`  saved ${path.relative(projectRoot, dest)} (${sizeMB} MB)`);
      remaining.delete(id);
    } else if (status === "failed") {
      console.error(`\n❌ ${id} failed:`, JSON.stringify(j.data, null, 2));
      remaining.delete(id);
    }
  }
  if (Date.now() - lastLog > 15000) {
    console.log(`\n[${elapsed}s] still pending:`);
    lines.forEach((l) => console.log(l));
    lastLog = Date.now();
  }
  if (remaining.size > 0) await new Promise((r) => setTimeout(r, 5000));
  if ((Date.now() - start) / 1000 > 600) {
    console.error("Timeout after 10 min");
    process.exit(1);
  }
}

console.log("\n✅ All clips downloaded!");
