// Direct render using @remotion/bundler + @remotion/renderer.
// Bypasses the orchestrator entirely — uses the existing audio session
// at public/sessions/oat8bl5C/ and the spec-3d.json scene definitions.
//
// No ElevenLabs API call. No Veo. Just: bundle → render → MP4.
import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const SPEC_PATH = "sessions/oat8bl5C/spec-3d.json";
const ABS_SPEC = path.join(projectRoot, "public", SPEC_PATH);
// Timestamped output filename so each render is preserved.
// Pass a tag via CLI (e.g. `node render-3d.mjs v3`) to use a custom suffix.
const tag = process.argv[2] ?? new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
const OUT_PATH = path.join(projectRoot, "out", `output-3d-${tag}.mp4`);

// Read the spec to compute exact duration from word timestamps
const spec = JSON.parse(fs.readFileSync(ABS_SPEC, "utf8"));
const fps = 30;
const totalSec = spec.totalDurationSeconds || 19;
const durationInFrames = Math.ceil(totalSec * fps) + 6; // +6 for tail

console.log(`📦  Spec: ${SPEC_PATH}`);
console.log(`⏱  Audio duration: ${totalSec.toFixed(2)}s → ${durationInFrames} frames\n`);

console.log("📦  Bundling Remotion project...");
const bundled = await bundle({
  entryPoint: path.join(projectRoot, "src/index.ts"),
  webpackOverride: (c) => c,
});

console.log("🎯  Selecting composition...");
const composition = await selectComposition({
  serveUrl: bundled,
  id: "MainVideo",
  inputProps: { specPath: SPEC_PATH },
});

console.log(`🎬  Rendering ${durationInFrames} frames @ ${fps}fps → ${OUT_PATH}\n`);

let lastPct = -1;
await renderMedia({
  composition: {
    ...composition,
    durationInFrames,
  },
  serveUrl: bundled,
  codec: "h264",
  outputLocation: OUT_PATH,
  inputProps: { specPath: SPEC_PATH },
  concurrency: 1,
  // Final ship render: swiftshader (CPU-rasterized) eliminates all WebGL
  // Context Lost drops at the cost of ~3x slower render. Worth it for the
  // final cut since it guarantees no black-frame glitches in shipped content.
  chromiumOptions: {
    gl: "swiftshader",
  },
  onProgress: ({ progress }) => {
    const pct = Math.floor(progress * 100);
    if (pct !== lastPct) {
      process.stdout.write(`\r🎬  ${pct}%`);
      lastPct = pct;
    }
  },
});

console.log(`\n\n✅  Done! → ${OUT_PATH}`);
