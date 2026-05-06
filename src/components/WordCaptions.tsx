import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT_FAMILY } from "../lib/fonts";
import { COLORS } from "../lib/constants";

interface WordTimestamp {
  word: string;
  startTime: number;
  endTime: number;
}

interface Chunk {
  words: string[];
  highlightIdx: number; // which word in the chunk gets yellow highlight
  startTime: number;
  endTime: number;
}

interface Props {
  wordTimestamps: WordTimestamp[];
}

// Words too short / common to highlight
const SKIP_HIGHLIGHT = new Set([
  "the","a","an","and","or","but","is","of","to","in","on","at","for","with",
  "by","as","it","its","this","that","these","those","be","are","was","were",
  "you","your","i","we","our","my","me","us","him","her","he","she","they",
  "do","does","did","just","not","no","yes","so","if","when","then",
]);

function pickHighlight(words: string[]): number {
  // Prefer the LONGEST non-skip word (data-heavy words read as keywords)
  let bestIdx = 0;
  let bestLen = 0;
  words.forEach((w, i) => {
    const clean = w.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (SKIP_HIGHLIGHT.has(clean)) return;
    if (clean.length > bestLen) {
      bestLen = clean.length;
      bestIdx = i;
    }
  });
  return bestIdx;
}

/**
 * Splits the script into 2-4 word "phrase chunks" that read as a unit.
 * End a chunk on:
 *   1. Sentence-ending punctuation (. ! ?)
 *   2. Clause break (, ; —)
 *   3. Hard cap of MAX_WORDS_PER_CHUNK
 */
const MIN_WORDS_PER_CHUNK = 2;
const MAX_WORDS_PER_CHUNK = 4;

function buildChunks(words: WordTimestamp[]): Chunk[] {
  const chunks: Chunk[] = [];
  let current: WordTimestamp[] = [];
  for (const w of words) {
    // Skip filler "--" tokens that aren't displayed words
    if (w.word === "--" || w.word === "—") continue;
    current.push(w);
    const last = w.word;
    const endOfClause = /[,;]$/.test(last);
    const endOfSentence = /[.!?]$/.test(last.replace(/['"]+$/, ""));
    const tooLong = current.length >= MAX_WORDS_PER_CHUNK;
    const longEnough = current.length >= MIN_WORDS_PER_CHUNK;
    if ((endOfSentence && longEnough) || (endOfClause && longEnough) || tooLong) {
      const wordStrs = current.map(c => c.word);
      chunks.push({
        words: wordStrs,
        highlightIdx: pickHighlight(wordStrs),
        startTime: current[0].startTime,
        endTime: current[current.length - 1].endTime,
      });
      current = [];
    }
  }
  if (current.length) {
    const wordStrs = current.map(c => c.word);
    chunks.push({
      words: wordStrs,
      highlightIdx: pickHighlight(wordStrs),
      startTime: current[0].startTime,
      endTime: current[current.length - 1].endTime,
    });
  }
  return chunks;
}

/**
 * WordCaptions — MrBeast/Aevy-style word-by-word caption overlay.
 *
 * Reads from word-timestamps.json and chunks the script into 2-4 word phrases.
 * Each phrase displays for its time-window, with the longest meaningful word
 * highlighted in yellow.
 *
 * Style:
 *   - Anton font (heavy condensed sans), all caps
 *   - White text with thick black stroke for contrast over any background
 *   - Yellow highlight box on the keyword (white text inside)
 *   - Bottom-third center, doesn't compete with main viz
 */
export const WordCaptions: React.FC<Props> = ({ wordTimestamps }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const chunks = useMemo(() => buildChunks(wordTimestamps), [wordTimestamps]);

  // Find the active chunk
  const active = chunks.find(c => t >= c.startTime && t < c.endTime + 0.15);
  if (!active) return null;

  // Subtle pop-in for the chunk
  const localT = t - active.startTime;
  const popIn = Math.min(1, localT / 0.08);

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        paddingBottom: 220, // safe area above caption pill, but high enough to clear avatar bottom
      }}
    >
      <div
        style={{
          maxWidth: "92%",
          textAlign: "center",
          fontFamily: FONT_FAMILY.caption,
          fontWeight: 400, // Anton is naturally heavy; weight 400 IS its bold
          fontSize: 96,
          lineHeight: 1.0,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          color: "#ffffff",
          // Heavy black stroke for legibility on any background
          WebkitTextStroke: "6px #000000",
          // @ts-ignore — paintOrder helps stroke render BEHIND fill
          paintOrder: "stroke fill",
          textShadow: "0 6px 14px rgba(0,0,0,0.85)",
          opacity: popIn,
          transform: `scale(${0.96 + popIn * 0.04})`,
          transformOrigin: "50% 100%",
          display: "flex",
          flexWrap: "wrap",
          gap: "0 18px",
          justifyContent: "center",
        }}
      >
        {active.words.map((w, i) => {
          const isHighlight = i === active.highlightIdx;
          if (!isHighlight) {
            return (
              <span key={i} style={{ display: "inline-block" }}>
                {w}
              </span>
            );
          }
          // Highlighted word — yellow box behind, white text
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                position: "relative",
                padding: "4px 14px 0",
                background: COLORS.highlight, // bright yellow
                // The yellow box should sit BEHIND the stroke; we keep the
                // text styling but switch the bg to highlight color
                color: "#0a0a0a", // dark text inside yellow looks crisper
                WebkitTextStroke: "0",
                textShadow: "none",
                borderRadius: 4,
                marginTop: -2,
                lineHeight: 1.0,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
