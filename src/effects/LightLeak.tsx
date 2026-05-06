import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface LightLeakProps {
  /** Seconds between leaks. Default 6s. */
  intervalSeconds?: number;
  /** Length of each leak (frames). Default 18 (= 0.6s @ 30fps). */
  durationFrames?: number;
  /** Peak strength 0–1. Default 0.35 — visible but not blinding. */
  strength?: number;
}

/**
 * Periodic warm light leaks across the frame — those analog film flares
 * you see in cinematic edits. Each leak sweeps in from a different angle
 * and color (warm orange, soft pink, pale gold) so the effect feels organic
 * rather than mechanical.
 *
 * Mounted globally over the whole composition.
 */
export const LightLeak: React.FC<LightLeakProps> = ({
  intervalSeconds = 6,
  durationFrames = 18,
  strength = 0.35,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const intervalFrames = Math.round(intervalSeconds * fps);
  const cycleIndex = Math.floor(frame / intervalFrames);
  const cycleFrame = frame % intervalFrames;

  // Are we inside an active leak window?
  if (cycleFrame >= durationFrames) return null;

  // Sine envelope: in/out
  const env = Math.sin((cycleFrame / durationFrames) * Math.PI);
  const opacity = env * strength;

  // Pick a leak preset based on cycle index — rotates through warm tones
  const presets: { color: string; angle: number; from: string }[] = [
    { color: "#FF9A55", angle: 35, from: "10% 0%" },   // warm orange, top-left
    { color: "#FFD180", angle: -25, from: "90% 100%" }, // golden, bottom-right
    { color: "#FF7AA8", angle: 70, from: "0% 50%" },    // soft pink, left
    { color: "#FFC3A0", angle: -40, from: "100% 20%" }, // peach, top-right
  ];
  const preset = presets[cycleIndex % presets.length];

  // Slight slide across the frame during the leak
  const slide = interpolate(cycleFrame, [0, durationFrames], [-30, 30]);

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity,
        mixBlendMode: "screen",
        transform: `translate(${slide}px, ${slide * 0.3}px)`,
        zIndex: 9997,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -100,
          background: `linear-gradient(${preset.angle}deg, transparent 0%, ${preset.color}55 35%, ${preset.color}aa 50%, ${preset.color}55 65%, transparent 100%)`,
          filter: "blur(40px)",
          transformOrigin: preset.from,
        }}
      />
    </AbsoluteFill>
  );
};
