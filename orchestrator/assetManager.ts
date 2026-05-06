import fs from "fs";
import path from "path";
import { VideoSpec, Scene } from "./types";

const PUBLIC_DIR = path.resolve(__dirname, "../public");

export function createSession(sessionId: string): string {
  const sessionDir = path.join(PUBLIC_DIR, "sessions", sessionId);
  fs.mkdirSync(path.join(sessionDir, "screenshots"), { recursive: true });
  fs.mkdirSync(path.join(sessionDir, "veo-clips"), { recursive: true });
  fs.mkdirSync(path.join(sessionDir, "imagen-frames"), { recursive: true });
  return sessionDir;
}

export function writeSpec(sessionDir: string, spec: VideoSpec): void {
  fs.writeFileSync(
    path.join(sessionDir, "spec.json"),
    JSON.stringify(spec, null, 2)
  );
}

export function writeAudio(sessionDir: string, audioBuffer: Buffer): string {
  const audioPath = path.join(sessionDir, "audio.mp3");
  fs.writeFileSync(audioPath, audioBuffer);
  return audioPath;
}

export function writeTimestamps(sessionDir: string, timestamps: object): void {
  fs.writeFileSync(
    path.join(sessionDir, "audio-timing.json"),
    JSON.stringify(timestamps, null, 2)
  );
}

export function writeScreenshot(
  sessionDir: string,
  sceneId: string,
  buffer: Buffer
): string {
  const filePath = path.join(sessionDir, "screenshots", `${sceneId}.png`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

export function writeImagenFrame(
  sessionDir: string,
  sceneId: string,
  base64: string
): string {
  const filePath = path.join(sessionDir, "imagen-frames", `${sceneId}.png`);
  fs.writeFileSync(filePath, Buffer.from(base64, "base64"));
  return filePath;
}

export function writeVeoClip(
  sessionDir: string,
  sceneId: string,
  buffer: Buffer
): string {
  const filePath = path.join(sessionDir, "veo-clips", `${sceneId}.mp4`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

/** Converts an absolute filesystem path to a public/-relative path for Remotion staticFile() */
export function toPublicRelative(absolutePath: string): string {
  const rel = path.relative(PUBLIC_DIR, absolutePath);
  // Always use forward slashes for Remotion's static file server
  return rel.split(path.sep).join("/");
}
