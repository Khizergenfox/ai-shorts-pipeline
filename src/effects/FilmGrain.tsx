import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

interface FilmGrainProps {
  /** 0–1, how strong the grain is. Default 0.08 — subtle. */
  intensity?: number;
  /** Animation speed. Higher = faster shimmer. Default 1. */
  speed?: number;
}

/**
 * Frame-driven SVG turbulence overlay. Produces organic film-grain noise
 * that shimmers every frame. The seed is bumped every frame, which is what
 * makes it *feel* like grain instead of a static texture.
 *
 * Mounted globally over the whole composition with mix-blend-mode "overlay"
 * so it adds texture to lights without crushing shadows.
 */
export const FilmGrain: React.FC<FilmGrainProps> = ({
  intensity = 0.08,
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame * speed) % 256;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity: intensity,
        mixBlendMode: "overlay",
        zIndex: 9998,
      }}
    >
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%" }}
      >
        <filter id={`grain-${seed}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            seed={seed}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect
          width="100%"
          height="100%"
          filter={`url(#grain-${seed})`}
          opacity="1"
        />
      </svg>
    </AbsoluteFill>
  );
};
