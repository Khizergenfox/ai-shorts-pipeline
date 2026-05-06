import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";

interface SceneTransitionProps {
  durationInFrames: number;
  /** Override the entry punch length (frames). Default 8. */
  entryFrames?: number;
  /** Override the exit whip length (frames). Default 5. */
  exitFrames?: number;
  /** Direction of exit whip. Default "left". */
  whipDirection?: "left" | "right" | "up" | "down";
  children: React.ReactNode;
}

/**
 * Wraps a scene with a hard-cut feel:
 *   ENTRY (first ~8 frames) — zoom-in punch from 1.12 to 1.0 with motion blur
 *                             and a tiny hand-held jitter
 *   EXIT  (last ~5 frames)  — whip-pan: scale up + blur + slide off + fade
 *
 * The combination makes non-overlapping `<Sequence>` cuts feel like real
 * camera cuts, even though Remotion's sequences don't actually overlap.
 *
 * IMPORTANT: this composes ON TOP of any existing transform on the child
 * (like Ken Burns zoom). It uses an additional wrapper div, so transforms
 * stack cleanly.
 */
export const SceneTransition: React.FC<SceneTransitionProps> = ({
  durationInFrames,
  entryFrames = 8,
  exitFrames = 5,
  whipDirection = "left",
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Entry punch: scale 1.12 → 1.0 with motion blur 8px → 0px ──
  // Uses a fast, slightly overshooting spring for that "smashed into place" feel.
  const entrySpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 220, mass: 0.5 },
    durationInFrames: entryFrames,
  });
  const entryScale = interpolate(entrySpring, [0, 1], [1.12, 1.0]);
  const entryBlur = interpolate(frame, [0, entryFrames], [8, 0], {
    extrapolateRight: "clamp",
  });

  // Tiny x/y jitter on impact (first 4 frames)
  const jitterAmt = interpolate(frame, [0, 4], [3, 0], {
    extrapolateRight: "clamp",
  });
  const jitterX = jitterAmt > 0 ? (Math.sin(frame * 9) * jitterAmt) : 0;
  const jitterY = jitterAmt > 0 ? (Math.cos(frame * 11) * jitterAmt) : 0;

  // ── Exit whip: last `exitFrames` frames blur + slide + scale up + fade ──
  const exitStart = durationInFrames - exitFrames;
  const exitProgress = interpolate(frame, [exitStart, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitScale = interpolate(exitProgress, [0, 1], [1, 1.08]);
  const exitBlur = interpolate(exitProgress, [0, 1], [0, 8]);
  const exitOpacity = interpolate(exitProgress, [0, 1], [1, 0.4]);

  const slideAmt = exitProgress * 80;
  const slideX =
    whipDirection === "left" ? -slideAmt : whipDirection === "right" ? slideAmt : 0;
  const slideY =
    whipDirection === "up" ? -slideAmt : whipDirection === "down" ? slideAmt : 0;

  const totalScale = entryScale * exitScale;
  const totalBlur = Math.max(entryBlur, exitBlur);
  const totalX = jitterX + slideX;
  const totalY = jitterY + slideY;

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${totalX}px, ${totalY}px) scale(${totalScale})`,
        filter: totalBlur > 0.1 ? `blur(${totalBlur}px)` : undefined,
        opacity: exitOpacity,
        transformOrigin: "center center",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
