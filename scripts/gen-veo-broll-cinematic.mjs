// Veo text-to-video for B-roll on Vertex AI. Concatenates the imagenSeed
// (scene description) + motion from BROLL_VEO_PROMPTS into a single rich
// prompt — same cinematic intent as the Imagen→Veo path, just collapsed
// into one Veo call. Faster + slightly cheaper.
//
// Usage:
//   node scripts/gen-veo-broll-cinematic.mjs <broll-key> <session-id> [slot]
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BROLL_VEO_PROMPTS } from "./figure-prompts.mjs";
import { generateVeo, ping } from "./lib/vertex.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const brollKey = process.argv[2];
const sessionId = process.argv[3];
const slotName = process.argv[4] ?? brollKey;

if (!brollKey || !sessionId) {
  console.error(`Usage:
  node scripts/gen-veo-broll-cinematic.mjs <broll-key> <session-id> [slot]

Available: ${Object.keys(BROLL_VEO_PROMPTS).join(", ")}`);
  process.exit(1);
}

const broll = BROLL_VEO_PROMPTS[brollKey];
if (!broll?.imagenSeed || !broll?.motion) {
  console.error(`❌  Unknown broll key "${brollKey}". Available: ${Object.keys(BROLL_VEO_PROMPTS).join(", ")}`);
  process.exit(1);
}

const outDir = path.join(projectRoot, "public/sessions", sessionId, "veo-clips");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `${slotName}.mp4`);
if (fs.existsSync(outPath)) {
  console.log(`✅  ${slotName}.mp4 exists — skipping. Delete to regenerate.`);
  process.exit(0);
}

// ─── Diagnostic ──────────────────────────────────────────────────────────
try {
  const info = await ping();
  console.log(`🔐  Vertex: ${info.projectId} (${info.location})\n`);
} catch (err) {
  console.error("❌  Vertex auth failed:", err.message);
  console.error("    Run: node scripts/test-vertex-auth.mjs to debug.");
  process.exit(1);
}

// Combine the scene description (imagenSeed) + motion into one rich prompt
const prompt = `${broll.imagenSeed}. ${broll.motion}`;

console.log(`🎬  B-roll: ${brollKey}`);
console.log(`📝  ${prompt.slice(0, 140)}...`);
console.log(`📁  Out: ${path.relative(projectRoot, outPath)}\n`);

let buf;
try {
  buf = await generateVeo({ prompt, durationSeconds: 8, aspectRatio: "9:16" });
} catch (err) {
  console.error("\n❌  Veo failed:", err.message);
  process.exit(1);
}

fs.writeFileSync(outPath, buf);
console.log(`\n✅  Saved ${(buf.length / 1024 / 1024).toFixed(2)} MB → ${path.relative(projectRoot, outPath)}`);
