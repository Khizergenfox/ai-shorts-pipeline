// Render the full ~60s vertical video for a session.
//
// Usage:
//   node scripts/render-full.mjs <session-id> [tag] [spec-file] [out-prefix]
//
// Defaults:
//   session-id  = "example"
//   tag         = "v1"
//   spec-file   = "spec-full.json" (read from public/sessions/<session-id>/)
//   out-prefix  = derived from session-id (strips trailing -YYYYMMDD)
//
// Output: out/<out-prefix>-<tag>.mp4
// Uses swiftshader for the final render — no WebGL Context Lost drops.
import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const SESSION = process.argv[2] ?? "example";
const SPEC_FILE = process.argv[4] ?? "spec-full.json";
const SPEC_PATH = `sessions/${SESSION}/${SPEC_FILE}`;
const ABS_SPEC = path.join(projectRoot, "public", SPEC_PATH);

const tag = process.argv[3] ?? "v1";
// Output prefix: use arg[5] if provided, else derive from session
// (strips trailing -YYYYMMDD if present).
const outPrefix = process.argv[5] ?? SESSION.replace(/-\d{8}$/, "");
const OUT_PATH = path.join(projectRoot, "out", `${outPrefix}-${tag}.mp4`);

const spec = JSON.parse(fs.readFileSync(ABS_SPEC, "utf8"));
const fps = 30;
const totalSec = spec.totalDurationSeconds || 60;
const durationInFrames = Math.ceil(totalSec * fps) + 6;

console.log(`📦  Spec: ${SPEC_PATH}`);
console.log(`⏱   Audio: ${totalSec.toFixed(2)}s → ${durationInFrames} frames\n`);

console.log("📦  Bundling...");
const bundled = await bundle({
  entryPoint: path.join(projectRoot, "src/index.ts"),
  webpackOverride: (c) => c,
});

const composition = await selectComposition({
  serveUrl: bundled,
  id: "MainVideo",
  inputProps: { specPath: SPEC_PATH },
});

console.log(`🎬  Rendering ${durationInFrames} frames @ ${fps}fps → ${path.relative(projectRoot, OUT_PATH)}`);
console.log(`    Backend: swiftshader (final ship quality, no WebGL drops)\n`);

let lastPct = -1;
await renderMedia({
  composition: { ...composition, durationInFrames },
  serveUrl: bundled,
  codec: "h264",
  outputLocation: OUT_PATH,
  inputProps: { specPath: SPEC_PATH },
  concurrency: 1,
  chromiumOptions: { gl: "swiftshader" },
  onProgress: ({ progress }) => {
    const pct = Math.floor(progress * 100);
    if (pct !== lastPct) {
      process.stdout.write(`\r🎬  ${pct}%`);
      lastPct = pct;
    }
  },
});

console.log(`\n\n✅  Done! → ${OUT_PATH}`);
