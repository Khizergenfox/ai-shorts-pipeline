import React from "react";
import { useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { FONTS, HEIGHT } from "../lib/constants";
import { CaptionChunk } from "../lib/captionUtils";

interface CaptionPillProps {
  chunks: CaptionChunk[];
  // absoluteFrameOffset: frame number where the parent Sequence starts
  absoluteFrameOffset: number;
}

/**
 * Caption pill — Varun Mayya style.
 *
 * A small black rounded rectangle with white sans-serif text inside, 1-3
 * words per pill, centered horizontally. Replaces the previous huge
 * stroked-text karaoke that read as "look at me" instead of "read this".
 *
 * The pill cycles through chunks (each chunk is 1-3 words from
 * captionUtils). Each chunk gets a snappy spring-in, holds for its
 * duration, then springs back out.
 *
 * Sentence-case (NOT uppercase) — matches the journalistic feel.
 */
export const CaptionPill: React.FC<CaptionPillProps> = ({
  chunks,
  absoluteFrameOffset,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const absoluteFrame = frame + absoluteFrameOffset;

  const activeChunk = chunks.find(
    (c) => absoluteFrame >= c.startFrame && absoluteFrame <= c.endFrame + 2,
  );
  if (!activeChunk) return null;

  const localFrame = absoluteFrame - activeChunk.startFrame;
  const chunkDuration = activeChunk.endFrame - activeChunk.startFrame;

  // Snap-in spring at chunk start
  const enter = spring({
    frame: Math.max(0, localFrame),
    fps,
    config: { damping: 16, stiffness: 220, mass: 0.5 },
  });

  // Snap-out at the end (last 3 frames)
  const exit = interpolate(
    localFrame,
    [chunkDuration - 3, chunkDuration + 2],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const opacity = Math.min(enter, exit);
  const scale = interpolate(enter, [0, 1], [0.85, 1]);

  // Recombine words into the readable pill text. Lower-case keeps the
  // journalistic vibe — the pill is meant to feel like a callout, not a chyron.
  const text = activeChunk.words.map((w) => w.word).join(" ").toLowerCase().trim();

  return (
    <div
      style={{
        position: "absolute",
        top: HEIGHT * 0.78, // sits in the lower-third, like Varun's
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 100,
        pointerEvents: "none",
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(15, 15, 15, 0.92)",
          color: "#ffffff",
          padding: "14px 28px",
          borderRadius: 14,
          fontFamily: FONTS.sans,
          fontSize: 38,
          fontWeight: 700,
          letterSpacing: "-0.5px",
          lineHeight: 1.0,
          // Subtle backdrop & shadow so the pill reads on any bg
          backdropFilter: "blur(6px)",
          boxShadow: "0 8px 28px rgba(0,0,0,0.45)",
          maxWidth: "85%",
          textAlign: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {text}
      </div>
    </div>
  );
};
