// Imagen → Veo pipeline (Vertex AI). Generates a polished cinematic still
// via Imagen 4 from a TEXT description, then animates it via Veo 3 fast.
// This is the Varun Mayya / Aevy "Flux→Veo" approach but on Vertex AI so
// it draws from the project's Cloud credits.
//
// Usage:
//   node scripts/gen-veo-from-imagen.mjs <key> <session-id> [slot]
//
// <key> can be a figure key (FIGURE_PROMPTS) or a b-roll key (BROLL_VEO_PROMPTS).
// Cost is billed against the Vertex project linked in .gcp-service-account.json.
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FIGURE_PROMPTS, BROLL_VEO_PROMPTS } from "./figure-prompts.mjs";
import { generateImagen, generateVeo, ping } from "./lib/vertex.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const figureKey = process.argv[2];
const sessionId = process.argv[3];
const slotName = process.argv[4] ?? figureKey;

if (!figureKey || !sessionId) {
  console.error(`Usage:
  node scripts/gen-veo-from-imagen.mjs <key> <session-id> [slot]

Available figures: ${Object.keys(FIGURE_PROMPTS).join(", ")}
Available b-rolls: ${Object.keys(BROLL_VEO_PROMPTS).join(", ")}`);
  process.exit(1);
}

const figure = FIGURE_PROMPTS[figureKey] ?? BROLL_VEO_PROMPTS[figureKey];
if (!figure?.imagenSeed || !figure?.motion) {
  console.error(`❌  Key "${figureKey}" missing imagenSeed or motion in figure-prompts.mjs`);
  process.exit(1);
}

const sessionDir = path.join(projectRoot, "public/sessions", sessionId, "veo-clips");
fs.mkdirSync(sessionDir, { recursive: true });
const seedImgPath = path.join(sessionDir, `${slotName}-seed.png`);
const outVideoPath = path.join(sessionDir, `${slotName}.mp4`);

if (fs.existsSync(outVideoPath)) {
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

// ─── Step 1: Generate cinematic still via Imagen (or reuse if cached) ─────
let seedB64;
if (fs.existsSync(seedImgPath)) {
  console.log(`✅  Reusing existing seed: ${path.relative(projectRoot, seedImgPath)}`);
  seedB64 = fs.readFileSync(seedImgPath).toString("base64");
} else {
  console.log(`🖼️   Step 1/2: Generating Imagen seed for ${figureKey}...`);
  console.log(`   Prompt: ${figure.imagenSeed.slice(0, 120)}...`);
  try {
    seedB64 = await generateImagen({ prompt: figure.imagenSeed });
  } catch (err) {
    console.error("❌  Imagen failed:", err.message);
    process.exit(1);
  }
  fs.writeFileSync(seedImgPath, Buffer.from(seedB64, "base64"));
  const seedSize = (fs.statSync(seedImgPath).size / 1024).toFixed(1);
  console.log(`✅  Seed image saved: ${path.relative(projectRoot, seedImgPath)} (${seedSize} KB)`);
}

// ─── Step 2: Animate seed via Veo image-to-video ──────────────────────────
console.log(`\n🎬  Step 2/2: Animating seed via Veo...`);
console.log(`   Motion: ${figure.motion.slice(0, 120)}...`);

let buf;
try {
  buf = await generateVeo({
    prompt: figure.motion,
    imageBase64: seedB64,
    durationSeconds: 8,
    aspectRatio: "9:16",
  });
} catch (err) {
  console.error("\n❌  Veo failed:", err.message);
  process.exit(1);
}

fs.writeFileSync(outVideoPath, buf);
console.log(`\n✅  Saved ${(buf.length / 1024 / 1024).toFixed(2)} MB → ${path.relative(projectRoot, outVideoPath)}`);
if (figure.titleLine) console.log(`📛  Title:  ${figure.titleLine}`);
