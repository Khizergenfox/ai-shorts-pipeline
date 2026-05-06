import { FPS } from "./constants";

export interface WordTimestamp {
  word: string;
  startTime: number; // seconds
  endTime: number;   // seconds
}

export interface CaptionWord {
  word: string;
  startFrame: number;
  endFrame: number;
}

export interface CaptionChunk {
  text: string;
  startFrame: number;
  endFrame: number;
  words: CaptionWord[];
}

/**
 * Groups word-level timestamps into phrase chunks of 2–4 words each.
 * Each chunk fits within a scene's time window.
 */
export function buildCaptionChunks(
  wordTimestamps: WordTimestamp[],
  sceneStartSec: number,
  sceneDurationSec: number,
  wordsPerChunk = 3
): CaptionChunk[] {
  const sceneEnd = sceneStartSec + sceneDurationSec;

  const sceneWords = wordTimestamps.filter(
    (w) => w.startTime >= sceneStartSec && w.startTime < sceneEnd
  );

  const chunks: CaptionChunk[] = [];
  for (let i = 0; i < sceneWords.length; i += wordsPerChunk) {
    const group = sceneWords.slice(i, i + wordsPerChunk);
    if (group.length === 0) continue;
    chunks.push({
      text: group.map((w) => w.word).join(" "),
      startFrame: Math.round(group[0].startTime * FPS),
      endFrame: Math.round(group[group.length - 1].endTime * FPS) + 3,
      words: group.map((w) => ({
        word: w.word,
        startFrame: Math.round(w.startTime * FPS),
        endFrame: Math.round(w.endTime * FPS),
      })),
    });
  }
  return chunks;
}

/**
 * Returns the active caption text for a given absolute frame number.
 */
export function getActiveCaptionChunk(
  chunks: CaptionChunk[],
  absoluteFrame: number
): string | null {
  const active = chunks.find(
    (c) => absoluteFrame >= c.startFrame && absoluteFrame <= c.endFrame
  );
  return active?.text ?? null;
}

/**
 * Converts ElevenLabs normalized_alignment (character-level) to word-level timestamps.
 */
export function parseElevenLabsAlignment(alignment: {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}): WordTimestamp[] {
  const { characters, character_start_times_seconds, character_end_times_seconds } = alignment;
  const words: WordTimestamp[] = [];
  let currentWord = "";
  let wordStart = 0;

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    if (char === " " || i === characters.length - 1) {
      if (i === characters.length - 1 && char !== " ") {
        currentWord += char;
      }
      if (currentWord.trim()) {
        words.push({
          word: currentWord.trim(),
          startTime: wordStart,
          endTime: character_end_times_seconds[i - 1] ?? character_end_times_seconds[i],
        });
      }
      currentWord = "";
      wordStart = character_start_times_seconds[i + 1] ?? 0;
    } else {
      if (!currentWord) wordStart = character_start_times_seconds[i];
      currentWord += char;
    }
  }
  return words;
}
