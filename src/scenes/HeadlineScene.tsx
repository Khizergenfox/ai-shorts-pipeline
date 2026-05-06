import React from "react";
import {
  AbsoluteFill,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { COLORS, FONTS } from "../lib/constants";

interface HeadlineSceneProps {
  /** Eyebrow line above the headline (e.g. "GOOGLE · WORLD KNOWLEDGE"). */
  eyebrow?: string;
  /** Main headline. */
  headline: string;
  /** Accent word(s) on a second line. */
  accentLine?: string;
  /** Sub-caption under the headline. */
  subcaption?: string;
  /** Optional logo SVG path (public/refs/<name>.svg). */
  logoSrc?: string;
  /** Brand color for accent + logo. Default coral. */
  accentColor?: string;
}

/**
 * BrandCardScene (rebuild of HeadlineScene) — clean editorial brand card.
 *
 * The old version had radial gradients, neon glow, animated dot, and felt
 * "tech demo". This rebuild is closer to a Bloomberg lower-third or a
 * Verge product card: pure black, big sans-serif type, ONE accent line,
 * brand logo above. No glow, no neon, no shadow stacking.
 *
 * Design rules:
 *   - Pure black background
 *   - Brand logo (recolored to brand accent) at top center, large
 *   - Eyebrow tag below logo, small caps, accent color
 *   - Main headline — big sans (white)
 *   - Accent line — big sans (accent color)
 *   - Subcaption — single line, gray
 *   - Tiny accent bar at bottom
 *
 * Animation: each layer slides up with a stagger. No scaling. No bobbing.
 */
export const HeadlineScene: React.FC<HeadlineSceneProps> = ({
  eyebrow,
  headline,
  accentLine,
  subcaption,
  logoSrc,
  accentColor = "#FF5E3A",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stagger = (delaySec: number) => {
    const local = frame - delaySec * fps;
    const s = spring({
      frame: Math.max(0, local),
      fps,
      config: { damping: 22, stiffness: 90 },
    });
    return {
      opacity: interpolate(s, [0, 1], [0, 1]),
      y: interpolate(s, [0, 1], [22, 0]),
    };
  };

  const a = stagger(0.0);   // logo
  const b = stagger(0.12);  // eyebrow
  const c = stagger(0.22);  // headline
  const d = stagger(0.36);  // accent line
  const e = stagger(0.5);   // subcaption + bar

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      {/* Logo — recolored to brand accent */}
      {logoSrc && (
        <div
          style={{
            opacity: a.opacity,
            transform: `translateY(${a.y}px)`,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 180,
              height: 180,
              backgroundColor: accentColor,
              WebkitMaskImage: `url(${staticFile(logoSrc)})`,
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              WebkitMaskSize: "contain",
              maskImage: `url(${staticFile(logoSrc)})`,
              maskRepeat: "no-repeat",
              maskPosition: "center",
              maskSize: "contain",
            }}
          />
        </div>
      )}

      {/* Eyebrow */}
      {eyebrow && (
        <div
          style={{
            opacity: b.opacity,
            transform: `translateY(${b.y}px)`,
            fontFamily: FONTS.sans,
            fontSize: 22,
            fontWeight: 700,
            color: accentColor,
            letterSpacing: "4px",
            textTransform: "uppercase",
            marginBottom: 28,
          }}
        >
          {eyebrow}
        </div>
      )}

      {/* Headline — clean white sans */}
      <div
        style={{
          opacity: c.opacity,
          transform: `translateY(${c.y}px)`,
          fontFamily: FONTS.display,
          fontSize: 130,
          fontWeight: 900,
          color: COLORS.white,
          letterSpacing: "-4px",
          lineHeight: 0.92,
          textAlign: "center",
        }}
      >
        {headline}
      </div>

      {/* Accent line — flat color, no glow */}
      {accentLine && (
        <div
          style={{
            opacity: d.opacity,
            transform: `translateY(${d.y}px)`,
            fontFamily: FONTS.display,
            fontSize: 110,
            fontWeight: 900,
            color: accentColor,
            letterSpacing: "-3.5px",
            lineHeight: 0.95,
            textAlign: "center",
            marginTop: 6,
          }}
        >
          {accentLine}
        </div>
      )}

      {/* Subcaption — single line, simple gray */}
      {subcaption && (
        <div
          style={{
            opacity: e.opacity * 0.85,
            transform: `translateY(${e.y}px)`,
            fontFamily: FONTS.sans,
            fontSize: 28,
            fontWeight: 500,
            color: "#9aa0a8",
            letterSpacing: "0.5px",
            textAlign: "center",
            marginTop: 36,
            maxWidth: 820,
            lineHeight: 1.35,
          }}
        >
          {subcaption}
        </div>
      )}

      {/* Bottom accent bar — flat, no shadow */}
      <div
        style={{
          position: "absolute",
          bottom: 110,
          left: "50%",
          width: 64,
          height: 3,
          background: accentColor,
          marginLeft: -32,
          opacity: e.opacity,
        }}
      />
    </AbsoluteFill>
  );
};
