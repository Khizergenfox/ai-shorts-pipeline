import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import type { Scene } from "../lib/constants";
import { FONTS } from "../lib/fonts";

/**
 * Story3DScene — v0.2.0 placeholder.
 *
 * The full variant library (math_race, cost_8x, token_burn, sonar_pulse,
 * stat_3d_extrude, logo_grid_3d, data_pulse, signal_highlight,
 * revenue_time_chart, protocol_hub, ctr_drop, logo_orbit, typo_neon_blue,
 * typo_flame) ships in v0.2.1. The variants depend on `public/refs/` SVG
 * logos and per-brand text that needs proper data-driven plumbing — that
 * pass is queued for the next release.
 *
 * What ships now: a clean placeholder that won't crash if a spec specifies
 * a story_3d scene, plus the variant interface + the underlying
 * Three.js components in `src/effects/three/` (use them directly in your
 * own scene types).
 *
 * To experiment now: write your own scene component in `src/scenes/`,
 * import the Three.js variant of your choice from `src/effects/three/`,
 * and register it in `MainVideo.tsx`'s scene-type switch.
 */
export type StoryVariant =
  | "math_race"
  | "cost_8x"
  | "token_burn"
  | "sonar_pulse"
  | "stat_3d_extrude"
  | "logo_grid_3d"
  | "data_pulse"
  | "signal_highlight"
  | "revenue_time_chart"
  | "protocol_hub"
  | "ctr_drop"
  | "logo_orbit"
  | "typo_neon_blue"
  | "typo_flame";

export const Story3DScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const variant = (scene as { variant?: StoryVariant }).variant ?? "math_race";

  const appear = spring({
    frame: frame - 4,
    fps,
    config: { damping: 18, stiffness: 90 },
  });

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse at center, #1a1f2e 0%, #07090f 70%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          opacity: appear,
          transform: `scale(${interpolate(appear, [0, 1], [0.85, 1])})`,
          textAlign: "center",
          padding: 40,
          border: "2px dashed rgba(255,255,255,0.25)",
          borderRadius: 24,
          maxWidth: "82%",
        }}
      >
        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: 22,
            letterSpacing: "4px",
            color: "rgba(255,255,255,0.55)",
            textTransform: "uppercase",
            marginBottom: 20,
          }}
        >
          story_3d · {variant}
        </div>
        <div
          style={{
            fontFamily: FONTS.display,
            fontWeight: 800,
            fontSize: 64,
            color: "#fff",
            lineHeight: 1.05,
            letterSpacing: "-1.5px",
            textShadow: "0 4px 24px rgba(0,0,0,0.7)",
          }}
        >
          Variant placeholder
        </div>
        <div
          style={{
            marginTop: 24,
            fontFamily: FONTS.sans,
            fontSize: 19,
            color: "rgba(255,255,255,0.7)",
            lineHeight: 1.5,
            maxWidth: 720,
          }}
        >
          The full Story3D variant library ships in v0.2.1. For now, write your
          own scene component in <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 4 }}>src/scenes/</code> and
          import the underlying Three.js piece from <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 4 }}>src/effects/three/</code>.
        </div>
      </div>
    </AbsoluteFill>
  );
};
