import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { COLORS, FONTS } from "../lib/constants";
import { SPRINGS } from "../lib/springConfigs";

interface TakeawaySceneProps {
  /** Small intro line above the headline (e.g. "If you're building"). */
  intro?: string;
  /** Big headline (e.g. "This changes the math"). */
  headline: string;
  /** Optional channel handle at the bottom. */
  handle?: string;
  /** Brand accent color. Default coral. */
  accentColor?: string;
}

/**
 * Closing takeaway card — bold editorial typography on dark.
 *
 * Structure:
 *   - Intro line (small, gray, all-caps with letter-spacing)
 *   - Massive headline (Inter Black, white with one coral word)
 *   - Channel handle at bottom
 *   - Subtle accent: thin coral line above handle, light shaft from
 *     headline area
 *
 * Reads like the closing slide of an Apple keynote — clean, confident,
 * no decoration competing with the message.
 */
export const TakeawayScene: React.FC<TakeawaySceneProps> = ({
  intro = "If you're building",
  headline,
  handle,
  accentColor = "#FF5E3A",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stagger = (delaySec: number) => {
    const local = frame - delaySec * fps;
    const s = spring({
      frame: Math.max(0, local),
      fps,
      config: SPRINGS.snappy,
    });
    return {
      opacity: interpolate(s, [0, 1], [0, 1]),
      y: interpolate(s, [0, 1], [30, 0]),
    };
  };

  const introFx = stagger(0.05);
  const headlineFx = stagger(0.25);
  const lineFx = stagger(0.6);
  const handleFx = stagger(0.75);

  // Slow ambient drift — keeps the close from feeling static
  const driftY = Math.sin(frame / fps * 0.6) * 6;

  // Render headline with the LAST word as accent
  const words = headline.trim().split(/\s+/);
  const accentWord = words.pop() ?? "";
  const headlineLeft = words.join(" ");

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 50%, #131419 0%, #08090c 60%, #050507 100%)`,
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      {/* Subtle light shaft from above */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "55%",
          height: "100%",
          background: `linear-gradient(180deg, ${accentColor}18 0%, transparent 65%)`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          textAlign: "center",
          transform: `translateY(${driftY}px)`,
          maxWidth: 920,
        }}
      >
        {/* Intro */}
        <div
          style={{
            opacity: introFx.opacity,
            transform: `translateY(${introFx.y}px)`,
            fontFamily: FONTS.sans,
            fontSize: 26,
            fontWeight: 700,
            color: COLORS.gray,
            letterSpacing: "5px",
            textTransform: "uppercase",
            marginBottom: 36,
          }}
        >
          {intro}
        </div>

        {/* Headline — last word in accent color */}
        <div
          style={{
            opacity: headlineFx.opacity,
            transform: `translateY(${headlineFx.y}px)`,
            fontFamily: FONTS.display,
            fontSize: 116,
            fontWeight: 900,
            color: COLORS.white,
            letterSpacing: "-3px",
            lineHeight: 0.95,
            textTransform: "uppercase",
            textShadow: "0 6px 24px rgba(0,0,0,0.85)",
          }}
        >
          {headlineLeft && <span>{headlineLeft} </span>}
          <span
            style={{
              color: accentColor,
              textShadow: `0 0 36px ${accentColor}aa, 0 0 64px ${accentColor}55, 0 4px 18px rgba(0,0,0,0.8)`,
            }}
          >
            {accentWord}
          </span>
        </div>
      </div>

      {/* Coral underline accent */}
      <div
        style={{
          position: "absolute",
          bottom: 200,
          left: "50%",
          width: 100,
          height: 4,
          background: accentColor,
          marginLeft: -50,
          opacity: lineFx.opacity,
          boxShadow: `0 0 18px ${accentColor}aa`,
        }}
      />

      {/* Handle */}
      {handle && (
        <div
          style={{
            position: "absolute",
            bottom: 130,
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: handleFx.opacity * 0.8,
            transform: `translateY(${handleFx.y}px)`,
            fontFamily: FONTS.sans,
            fontSize: 24,
            fontWeight: 700,
            color: COLORS.white,
            letterSpacing: "3px",
            textTransform: "uppercase",
          }}
        >
          {handle}
        </div>
      )}
    </AbsoluteFill>
  );
};
