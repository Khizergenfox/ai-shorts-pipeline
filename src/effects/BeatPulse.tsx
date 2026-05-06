import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface BeatPulseProps {
  /**
   * Total length of the scene this pulse applies to (frames).
   * Used to compute pulse positions evenly across the scene.
   */
  durationInFrames: number;
  /** Beats per scene. Default 0 = auto: one beat every ~2.5s. */
  beats?: number;
  /** Strength of the scale pulse. Default 0.025 (= 1.0 → 1.025). */
  strength?: number;
  /** Whether to also flash a small light leak on each beat. Default true. */
  flash?: boolean;
  children: React.ReactNode;
}

/**
 * Adds rhythmic micro-pulses inside a scene.
 *
 * Modern viral shorts feel "cut every 2-3s" even when they aren't, because
 * something visually punches at that cadence: a zoom hit, a flash, a brand
 * shake. This component synthesizes that rhythm without requiring real cuts.
 *
 * Each pulse:
 *   - 6-frame tighten: scale 1.0 → 1+strength → 1.0 with ease-in/out
 *   - 8-frame light flash (if enabled): warm glow fades in/out
 *
 * Beats are placed at evenly-spaced internal moments (skipping the first/last
 * second so they don't fight scene entry/exit).
 */
export const BeatPulse: React.FC<BeatPulseProps> = ({
  durationInFrames,
  beats = 0,
  strength = 0.025,
  flash = true,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Auto-pick beat count: one every ~2.5s, but never more than makes sense
  const autoBeats = Math.max(0, Math.floor((durationInFrames / fps - 1.0) / 2.5));
  const beatCount = beats > 0 ? beats : autoBeats;

  if (beatCount === 0) {
    return <>{children}</>;
  }

  // Compute beat positions — evenly distributed, skipping the first 0.6s
  // (scene entry punch is happening) and the last 0.4s (scene exit whip).
  const startFrame = Math.round(0.6 * fps);
  const endFrame = durationInFrames - Math.round(0.4 * fps);
  const span = Math.max(1, endFrame - startFrame);
  const beatFrames: number[] = [];
  for (let i = 0; i < beatCount; i++) {
    beatFrames.push(startFrame + Math.round((span * (i + 1)) / (beatCount + 1)));
  }

  // Find the closest beat to the current frame and compute proximity
  let bestProximity = 0;
  let nearestBeatFrame = -1;
  for (const bf of beatFrames) {
    const dist = Math.abs(frame - bf);
    if (dist <= 6) {
      const proximity = 1 - dist / 6;
      if (proximity > bestProximity) {
        bestProximity = proximity;
        nearestBeatFrame = bf;
      }
    }
  }

  // Sine-shaped pulse for smooth in/out
  const pulse = bestProximity > 0 ? Math.sin(bestProximity * Math.PI) : 0;
  const scale = 1 + pulse * strength;

  // Flash overlay opacity — peaks slightly after the scale peak
  const flashOpacity = flash && bestProximity > 0 ? pulse * 0.18 : 0;

  return (
    <>
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </AbsoluteFill>
      {flashOpacity > 0 && (
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255, 240, 200, 0.5) 0%, transparent 60%)",
            opacity: flashOpacity,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      )}
    </>
  );
};
