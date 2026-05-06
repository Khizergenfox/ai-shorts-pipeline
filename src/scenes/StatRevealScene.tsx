import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { FONTS, COLORS } from "../lib/constants";
import { Scene } from "../../orchestrator/types";

interface Props {
  scene: Scene;
}

/**
 * StatRevealScene — pure black background with a single GIANT stat.
 * Used to differentiate two adjacent beats that would otherwise share the
 * same 3D scene (e.g. b04 math_race continues with b05 reveal).
 *
 * Reads from scene.statRevealData:
 *   {
 *     prefix?: "+" | "-" | "$" | "×" | ""    // tiny accent before number
 *     value: "9"                                // the giant number
 *     unit?: "PTS"                              // small uppercase unit after
 *     headline?: "ON IMO ANSWER BENCH"          // line above the number
 *     subhead?: "vs Gemini 3.1 Pro"             // line below the number
 *     accentColor?: "#FF5E3A"                   // tint for prefix + unit
 *   }
 *
 * Layout: headline top center, giant numeral middle center, subhead bottom.
 * No glow, no shader, no decoration. The number IS the visual.
 */
export const StatRevealScene: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sd = (scene as any).statRevealData as
    | {
        prefix?: string;
        value: string;
        unit?: string;
        headline?: string;
        subhead?: string;
        accentColor?: string;
      }
    | undefined;

  if (!sd) {
    return (
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        <div style={{ color: "#fff", margin: "auto", opacity: 0.4 }}>
          (StatRevealScene: missing statRevealData)
        </div>
      </AbsoluteFill>
    );
  }

  const accent = sd.accentColor ?? COLORS.coral;

  // Springs: headline first, number explodes in second, subhead last.
  const headlineAppear = spring({ frame: frame - 2, fps, config: { damping: 20, stiffness: 90 } });
  const numberAppear = spring({ frame: frame - 6, fps, config: { damping: 14, stiffness: 110 } });
  const subheadAppear = spring({ frame: frame - 14, fps, config: { damping: 20, stiffness: 90 } });

  const numberScale = interpolate(numberAppear, [0, 1], [0.6, 1.0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 60px",
      }}
    >
      {/* Headline */}
      {sd.headline && (
        <div
          style={{
            fontFamily: FONTS.sans,
            fontWeight: 600,
            fontSize: 28,
            letterSpacing: "4px",
            color: "rgba(255,255,255,0.55)",
            textTransform: "uppercase",
            marginBottom: 32,
            opacity: headlineAppear,
            transform: `translateY(${interpolate(headlineAppear, [0, 1], [10, 0])}px)`,
          }}
        >
          {sd.headline}
        </div>
      )}

      {/* The giant number */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 18,
          transform: `scale(${numberScale})`,
          opacity: numberAppear,
        }}
      >
        {sd.prefix && (
          <span
            style={{
              fontFamily: FONTS.sans,
              fontWeight: 900,
              fontSize: 200,
              color: accent,
              letterSpacing: "-6px",
              lineHeight: 0.9,
            }}
          >
            {sd.prefix}
          </span>
        )}
        <span
          style={{
            fontFamily: FONTS.sans,
            fontWeight: 900,
            fontSize: 480,
            color: "#ffffff",
            letterSpacing: "-22px",
            lineHeight: 0.9,
          }}
        >
          {sd.value}
        </span>
        {sd.unit && (
          <span
            style={{
              fontFamily: FONTS.sans,
              fontWeight: 700,
              fontSize: 90,
              color: accent,
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginLeft: 12,
            }}
          >
            {sd.unit}
          </span>
        )}
      </div>

      {/* Subhead */}
      {sd.subhead && (
        <div
          style={{
            fontFamily: FONTS.sans,
            fontWeight: 500,
            fontSize: 36,
            color: "rgba(255,255,255,0.75)",
            marginTop: 36,
            opacity: subheadAppear,
            transform: `translateY(${interpolate(subheadAppear, [0, 1], [10, 0])}px)`,
          }}
        >
          {sd.subhead}
        </div>
      )}
    </AbsoluteFill>
  );
};
