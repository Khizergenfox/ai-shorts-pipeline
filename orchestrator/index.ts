import "dotenv/config";
import path from "path";
import fs from "fs";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { nanoid } from "nanoid";
import { VideoSpec, Scene, WordTimestamp } from "./types";
import * as assetManager from "./assetManager";
import * as elevenlabs from "./elevenlabs";
import * as puppeteer from "./puppeteer";
import * as gemini from "./gemini";
import { generateSpecFromScript } from "./specGenerator";

/**
 * AI Shorts Pipeline — audio-first, word-timestamp-driven scene timing.
 *
 * Usage (two modes):
 *   Mode A — existing spec JSON:
 *     npx tsx orchestrator/index.ts specs/caveman-claude-v3.json
 *
 *   Mode B — raw script file (AI generates the spec):
 *     npx tsx orchestrator/index.ts scripts/my-topic.txt "Topic Name"
 *
 *   Mode C — inline script string:
 *     npx tsx orchestrator/index.ts --script "Your narration script here" --topic "Topic Name"
 */
async function main() {
  const arg1 = process.argv[2];
  const arg2 = process.argv[3];

  let inputSpec: VideoSpec;

  // Detect mode from argument
  if (arg1 === "--script") {
    // Mode C: inline script
    const script = arg2!;
    const topic = process.argv[5] ?? "AI Shorts";
    console.log(`\n🚀  AI Shorts Pipeline — Script Mode`);
    console.log(`📝  Topic: ${topic}\n`);
    const generated = await generateSpecFromScript(script, topic);
    inputSpec = {
      ...generated,
      sessionId: "",
      audioPath: "",
      wordTimestamps: [],
      totalDurationSeconds: 0,
    } as unknown as VideoSpec;
  } else if (arg1 && (arg1.endsWith(".txt") || arg1.endsWith(".md"))) {
    // Mode B: script file
    const script = fs.readFileSync(path.resolve(arg1), "utf8").trim();
    const topic = arg2 ?? path.basename(arg1, path.extname(arg1));
    console.log(`\n🚀  AI Shorts Pipeline — Script File Mode`);
    console.log(`📝  Topic: ${topic}\n`);
    const generated = await generateSpecFromScript(script, topic);
    inputSpec = {
      ...generated,
      sessionId: "",
      audioPath: "",
      wordTimestamps: [],
      totalDurationSeconds: 0,
    } as unknown as VideoSpec;
  } else {
    // Mode A: existing spec JSON (default)
    const specInputPath = arg1 ?? path.resolve(__dirname, "../specs/caveman-claude-v3.json");
    console.log(`\n🚀  AI Shorts Pipeline`);
    console.log(`📄  Spec: ${specInputPath}\n`);
    inputSpec = require(specInputPath);
  }
  const sessionId = nanoid(8);
  const sessionDir = assetManager.createSession(sessionId);

  console.log(`📁  Session: ${sessionId}`);
  console.log(`📂  Session dir: ${sessionDir}\n`);

  // ── STEP 1: AUDIO FIRST ──────────────────────────────────────────────────
  console.log("🎙️  Generating voiceover...");
  const { audioBuffer, wordTimestamps, durationSeconds } =
    await elevenlabs.synthesizeVoiceover(inputSpec.narrationScript);

  const audioAbsPath = assetManager.writeAudio(sessionDir, audioBuffer);
  assetManager.writeTimestamps(sessionDir, wordTimestamps);
  console.log(`✅  Audio: ${durationSeconds.toFixed(1)}s  |  ${wordTimestamps.length} words\n`);

  // ── STEP 2: COMPUTE SCENE TIMINGS FROM WORD TIMESTAMPS ──────────────────
  const resolvedTimings = computeSceneTimings(inputSpec.scenes, wordTimestamps, durationSeconds);

  // Log timing plan
  console.log("📐  Scene timing plan:");
  resolvedTimings.forEach((s) => {
    console.log(`   ${s.id.padEnd(30)} start=${s.startSec.toFixed(2)}s  dur=${s.durationSeconds.toFixed(2)}s  words[${s.startWordIndex ?? "?"}→${s.endWordIndex ?? "?"}]`);
  });
  console.log();

  // ── STEP 3: ASSET GENERATION (parallel) ─────────────────────────────────
  console.log("⚡  Generating assets in parallel...\n");

  const scenesWithTiming = resolvedTimings;

  const [screenshotMap, imagenMap] = await Promise.all([
    puppeteer.captureAllScreenshots(scenesWithTiming),
    gemini.generateAllImagenFrames(scenesWithTiming),
  ]);

  // Veo: only generate if scenes have veoPrompt (saves cost)
  const veoScenes = scenesWithTiming.filter((s) => s.veoPrompt);
  const veoMap = veoScenes.length > 0
    ? await gemini.generateAllVeoClips(veoScenes)
    : new Map<string, Buffer>();

  await puppeteer.closeBrowser();

  // ── STEP 4: WRITE ASSETS, RESOLVE PATHS ─────────────────────────────────
  const resolvedScenes: Scene[] = scenesWithTiming.map((scene) => {
    const resolved = { ...scene };

    if (screenshotMap.has(scene.id)) {
      const buf = screenshotMap.get(scene.id)!;
      const absPath = assetManager.writeScreenshot(sessionDir, scene.id, buf);
      resolved.screenshotPath = assetManager.toPublicRelative(absPath);
    }

    if (imagenMap.has(scene.id)) {
      const base64 = imagenMap.get(scene.id)!;
      const absPath = assetManager.writeImagenFrame(sessionDir, scene.id, base64);
      resolved.imagenFramePath = assetManager.toPublicRelative(absPath);
    }

    if (veoMap.has(scene.id)) {
      const buf = veoMap.get(scene.id)!;
      const absPath = assetManager.writeVeoClip(sessionDir, scene.id, buf);
      resolved.videoClipPath = assetManager.toPublicRelative(absPath);
    }

    return resolved;
  });

  // ── STEP 5: WRITE FINAL SPEC ─────────────────────────────────────────────
  const finalSpec: VideoSpec = {
    ...inputSpec,
    sessionId,
    audioPath: assetManager.toPublicRelative(audioAbsPath),
    wordTimestamps,
    totalDurationSeconds: durationSeconds,
    scenes: resolvedScenes,
  };

  assetManager.writeSpec(sessionDir, finalSpec);
  const specPublicPath = `sessions/${sessionId}/spec.json`;
  console.log(`\n📋  Final spec written: public/${specPublicPath}`);

  // ── STEP 6: RENDER ───────────────────────────────────────────────────────
  const totalFrames = Math.ceil(durationSeconds * 30);
  const slug = inputSpec.topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40);
  const outPath = path.resolve(__dirname, `../out/${slug}.mp4`);

  console.log(`\n🎬  Rendering ${totalFrames} frames → ${outPath}\n`);
  await renderVideo(specPublicPath, totalFrames, outPath);

  console.log(`\n✅  Done! → ${outPath}`);
}

/**
 * Given scenes with startWordIndex/endWordIndex, compute actual durationSeconds
 * from the real ElevenLabs word timestamps.
 *
 * Rules:
 * - If a scene has startWordIndex + endWordIndex: use those timestamps
 * - If a scene has only durationSeconds: keep it as-is
 * - Last scene extends to cover the full audio duration
 */
function computeSceneTimings(
  scenes: Scene[],
  wordTimestamps: WordTimestamp[],
  totalDuration: number
): (Scene & { startSec: number })[] {
  const result: (Scene & { startSec: number })[] = [];
  let cursor = 0; // running start time in seconds

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    let startSec = cursor;
    let durationSeconds: number;

    if (
      scene.startWordIndex !== undefined &&
      scene.endWordIndex !== undefined &&
      wordTimestamps.length > 0
    ) {
      // Clamp to valid range
      const startIdx = Math.min(scene.startWordIndex, wordTimestamps.length - 1);
      const endIdx = Math.min(scene.endWordIndex, wordTimestamps.length - 1);

      startSec = wordTimestamps[startIdx].startTime;
      const endSec = wordTimestamps[endIdx].endTime;
      durationSeconds = endSec - startSec;

      // Last scene: extend to full audio
      if (i === scenes.length - 1) {
        durationSeconds = totalDuration - startSec;
      }
    } else {
      // Fallback: use manual durationSeconds
      durationSeconds = scene.durationSeconds;
    }

    // Minimum 1 frame
    durationSeconds = Math.max(durationSeconds, 1 / 30);

    result.push({ ...scene, startSec, durationSeconds });
    cursor = startSec + durationSeconds;
  }

  return result;
}

async function renderVideo(
  specPath: string,
  durationInFrames: number,
  outPath: string
): Promise<void> {
  const projectRoot = path.resolve(__dirname, "..");
  const entryPoint = path.join(projectRoot, "src", "index.ts");

  console.log("📦  Bundling Remotion project...");
  const bundleLocation = await bundle({
    entryPoint,
    webpackOverride: (config) => config,
  });

  const inputProps = { specPath };
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "MainVideo",
    inputProps,
  });

  composition.durationInFrames = durationInFrames;

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: outPath,
    inputProps,
    concurrency: 2,
    onProgress: ({ progress }) => {
      process.stdout.write(`\r🎬  Rendering... ${(progress * 100).toFixed(0)}%`);
    },
  });
  console.log("\n");
}

main().catch((err) => {
  console.error("\n❌  Pipeline failed:", err);
  process.exit(1);
});
