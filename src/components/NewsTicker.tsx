import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  spring,
} from "remotion";
import { COLORS, FONTS } from "../lib/constants";

interface NewsTickerProps {
  /** Frame at which the ticker slides in. */
  startFrame: number;
  /** Total visible duration in frames. Default 75 ≈ 2.5s. */
  durationFrames?: number;
  /** Pulsing red badge text. Default "BREAKING". */
  badge?: string;
  /** Main headline text. */
  headline: string;
}

/**
 * Top-anchored news-bar overlay — Bloomberg / CNN style.
 *
 * Slides down from above frame, holds, slides back up. Positioned at the
 * top so it doesn't fight the lower-third caption. The bar has a coral
 * "BREAKING" pulse badge on the left and a bold headline filling the rest.
 *
 * Sits BELOW FilmGrain in z-order, so the same texture that grades the
 * scene also grades the ticker — keeps it from reading as "pasted on top."
 *
 * Subtle bottom border in coral matches the scene's accent color.
 */
export const NewsTicker: React.FC<NewsTickerProps> = ({
  startFrame,
  durationFrames = 75,
  badge = "BREAKING",
  headline,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - startFrame;
  if (localFrame < -2 || localFrame > durationFrames + 2) return null;

  const slideInFrames = 12;
  const slideOutFrames = 14;

  // Slide-in: translateY -120% → 0
  const slideIn = spring({
    frame: Math.max(0, localFrame),
    fps,
    config: { damping: 18, stiffness: 140, mass: 0.6 },
    durationInFrames: slideInFrames,
  });
  const slideInY = interpolate(slideIn, [0, 1], [-110, 0]);

  // Slide-out at the end
  const slideOutT = localFrame - (durationFrames - slideOutFrames);
  const slideOutY = interpolate(slideOutT, [0, slideOutFrames], [0, -110], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.6, 0.0, 0.8, 0.4),
  });

  // Combined Y offset (whichever is more "off")
  const totalY = slideOutT > 0 ? slideOutY : slideInY;

  // BREAKING badge pulse — sine wave
  const badgePulse = Math.sin(localFrame / 4) * 0.5 + 0.5;
  const badgeGlow = 0.7 + badgePulse * 0.5;

  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 30 }}>
      {/* The ticker bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 96,
          transform: `translateY(${totalY}%)`,
          display: "flex",
          alignItems: "center",
          padding: "0 32px",
          background:
            "linear-gradient(180deg, rgba(8, 9, 12, 0.97) 0%, rgba(14, 15, 20, 0.95) 100%)",
          borderBottom: `2px solid ${COLORS.accent}`,
          boxShadow: `0 6px 24px rgba(0,0,0,0.6), inset 0 -1px 0 ${COLORS.accent}55`,
        }}
      >
        {/* BREAKING badge — pulsing coral */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "8px 20px",
            borderRadius: 6,
            background: COLORS.accent,
            fontFamily: FONTS.display,
            fontSize: 26,
            fontWeight: 900,
            color: "#0a0a0c",
            letterSpacing: "2px",
            marginRight: 24,
            boxShadow: `0 0 ${24 * badgeGlow}px ${COLORS.accent}aa, 0 0 ${
              48 * badgeGlow
            }px ${COLORS.accent}55`,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#0a0a0c",
              marginRight: 10,
              opacity: badgePulse,
            }}
          />
          {badge}
        </div>

        {/* Headline — Inter Black, bright white, slight letter spacing */}
        <div
          style={{
            flex: 1,
            fontFamily: FONTS.display,
            fontSize: 32,
            fontWeight: 800,
            color: COLORS.white,
            letterSpacing: "-0.5px",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textShadow: "0 2px 8px rgba(0,0,0,0.8)",
          }}
        >
          {headline}
        </div>

        {/* LIVE dot pulsing on the right */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginLeft: 16,
            fontFamily: FONTS.sans,
            fontSize: 18,
            fontWeight: 700,
            color: COLORS.gray,
            letterSpacing: "2px",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: COLORS.accent,
              opacity: 0.4 + badgePulse * 0.6,
              boxShadow: `0 0 8px ${COLORS.accent}`,
            }}
          />
          LIVE
        </div>
      </div>
    </AbsoluteFill>
  );
};
