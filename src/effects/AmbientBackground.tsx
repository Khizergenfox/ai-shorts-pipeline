import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../lib/constants";

interface AmbientBackgroundProps {
  /** Hex/rgb color of the orbiting glow. Default = accent coral. */
  color?: string;
  /** Strength 0–1. Default 0.35. */
  strength?: number;
  /** Seconds for one full orbit. Default 14s — slow and ambient. */
  orbitSeconds?: number;
}

/**
 * A blurred glow that slowly orbits an elliptical path.
 *
 * Adds living, breathing light to dark scenes without competing with content.
 * Layered behind every scene via MainVideo.
 */
export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({
  color = COLORS.accent,
  strength = 0.35,
  orbitSeconds = 14,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const t = (frame / fps / orbitSeconds) * Math.PI * 2;

  // Elliptical orbit, off-center, large radius
  const cx = width * 0.5 + Math.cos(t) * width * 0.35;
  const cy = height * 0.45 + Math.sin(t * 0.7) * height * 0.22;

  // Breathing scale — pulses every ~6s
  const breathe = 1 + Math.sin(t * 1.5) * 0.12;

  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: cx - 500,
          top: cy - 500,
          width: 1000,
          height: 1000,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}${alphaHex(strength)} 0%, ${color}00 65%)`,
          filter: "blur(80px)",
          transform: `scale(${breathe})`,
          mixBlendMode: "screen",
        }}
      />
      {/* Counter-orbiting smaller secondary glow in cyan for color depth */}
      <div
        style={{
          position: "absolute",
          left: width * 0.5 - Math.cos(t * 1.3) * width * 0.4 - 350,
          top: height * 0.55 - Math.sin(t * 0.9) * height * 0.18 - 350,
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.cyan}${alphaHex(strength * 0.6)} 0%, ${COLORS.cyan}00 65%)`,
          filter: "blur(70px)",
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
};

// Convert 0-1 alpha to 2-digit hex
function alphaHex(a: number): string {
  const v = Math.max(0, Math.min(1, a));
  return Math.round(v * 255)
    .toString(16)
    .padStart(2, "0");
}
