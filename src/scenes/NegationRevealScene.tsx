import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { FONTS } from "../lib/constants";
import { Scene } from "../../orchestrator/types";

interface Props {
  scene: Scene;
}

/**
 * NegationRevealScene — typographic creative variant for "NOT X" / "NOT X. Y." moments.
 *
 * Used at:
 *   b06: "Not a capability problem." — single denial, no replacement
 *   b20: "Not a limitation."          — single denial, leads into b21 "A philosophy."
 *
 * Animation:
 *   0.0–0.3s   small "NOT A" label fades in from above
 *   0.3–0.7s   denied word slams in with scale-up
 *   0.7–1.1s   red diagonal strike-through draws across the denied word
 *   1.1+       (if affirmText provided) replacement word fades in below
 *
 * Style: deep black bg, white denied word, coral strike, optional cyan affirm
 */
export const NegationRevealScene: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const data = (scene as any).negationData ?? {
    preLabel: "Not a",
    deniedText: "CAPABILITY PROBLEM",
    affirmText: null, // optional follow-up word
    strikeColor: "#FF5E3A",
    affirmColor: "#3DDCC9",
  };

  // Pre-label
  const preAppear = spring({ frame, fps, config: { damping: 20, stiffness: 120 } });

  // Denied word slams in
  const denyStart = 0.3;
  const denySpring = spring({
    frame: Math.max(0, frame - Math.round(denyStart * fps)),
    fps,
    config: { damping: 14, stiffness: 180 },
  });
  const denyScale = interpolate(denySpring, [0, 1], [1.4, 1]);
  const denyOpacity = denySpring;

  // Strike-through draws across after denied word lands
  const strikeStart = 0.75;
  const strikeProgress = interpolate(t, [strikeStart, strikeStart + 0.35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Affirm text appears after strike completes
  const affirmStart = strikeStart + 0.45;
  const affirmAppear = spring({
    frame: Math.max(0, frame - Math.round(affirmStart * fps)),
    fps,
    config: { damping: 18, stiffness: 100 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 60px",
      }}
    >
      {/* Subtle ambient gradient — black-on-black with hint of warmth */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(217,119,87,0.08) 0%, transparent 70%)" }} />

      {/* Pre-label */}
      <div
        style={{
          opacity: preAppear,
          transform: `translateY(${interpolate(preAppear, [0, 1], [-12, 0])}px)`,
          fontFamily: FONTS.sans,
          fontSize: 30,
          fontWeight: 600,
          color: "rgba(255,255,255,0.55)",
          letterSpacing: "5px",
          textTransform: "uppercase",
          marginBottom: 26,
        }}
      >
        {data.preLabel}
      </div>

      {/* Denied word with strike */}
      <div
        style={{
          position: "relative",
          opacity: denyOpacity,
          transform: `scale(${denyScale})`,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.display,
            fontSize: 130,
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-3px",
            lineHeight: 1.0,
            textAlign: "center",
            textTransform: "uppercase",
            // Faint stroke for sound-off legibility on any background
            textShadow: "0 4px 16px rgba(0,0,0,0.7)",
          }}
        >
          {data.deniedText}
        </div>

        {/* Diagonal strike-through line */}
        {strikeProgress > 0 && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: 8,
              background: data.strikeColor,
              transformOrigin: "left center",
              transform: `translateY(-50%) scaleX(${strikeProgress})`,
              boxShadow: `0 0 20px ${data.strikeColor}cc`,
              borderRadius: 4,
            }}
          />
        )}
      </div>

      {/* Optional affirm replacement */}
      {data.affirmText && (
        <div
          style={{
            opacity: affirmAppear,
            transform: `translateY(${interpolate(affirmAppear, [0, 1], [16, 0])}px)`,
            fontFamily: FONTS.display,
            fontSize: 100,
            fontWeight: 900,
            color: data.affirmColor,
            letterSpacing: "-2px",
            lineHeight: 1.0,
            textAlign: "center",
            marginTop: 38,
            textTransform: "uppercase",
            textShadow: `0 0 30px ${data.affirmColor}66, 0 4px 16px rgba(0,0,0,0.7)`,
          }}
        >
          {data.affirmText}
        </div>
      )}
    </AbsoluteFill>
  );
};
