import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import type { Scene } from "../../orchestrator/types";
import { FONTS } from "../lib/fonts";

/**
 * Story3DScene — the extension point for narrative 3D variants.
 *
 * The skill ships the architecture: a single scene type that picks a
 * variant from your library of Three.js components. The toolkit lives in
 * `src/effects/three/` — `BarRace`, `MathField`, `NodeNetwork`,
 * `Stat3DExtrude`, `LogoOrbit`, `LogoGrid3D`, `RevenueTimeChart`,
 * `SignalHighlight`, `SuccessCheck3D`, `TypoNeonBlue`, `BloomHalo`,
 * `CameraRig`, and friends.
 *
 * Compose those primitives into the variants your channel actually
 * needs — the variant registry is yours to define. This file is the
 * wiring point: take a `scene.storyVariant`, return the React
 * composition that renders for that variant.
 *
 * The default render (when a variant has no implementation yet)
 * shows the variant name in a clean dashed-border card so you can
 * see which beats still need a custom variant during your build pass.
 */
export const Story3DScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const variant = (scene as { storyVariant?: string }).storyVariant ?? "default";

  const appear = spring({
    frame: frame - 4,
    fps,
    config: { damping: 18, stiffness: 90 },
  });

  // To add a custom variant, branch on `variant` here and return your
  // composed Three.js + HTML overlay. Keep the two-layer pattern:
  // Three.js for backdrop / particles / geometry, HTML for text + logos.
  //
  //   if (variant === "your_variant_name") {
  //     return <YourComposition scene={scene} />;
  //   }

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
          Variant slot
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
          Define this variant by composing the Three.js primitives in <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 4 }}>src/effects/three/</code>. Add a branch in <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 4 }}>Story3DScene.tsx</code> that returns your composition for this variant name.
        </div>
      </div>
    </AbsoluteFill>
  );
};
