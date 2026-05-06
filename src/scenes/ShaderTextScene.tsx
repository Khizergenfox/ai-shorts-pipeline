import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { Scene } from "../../orchestrator/types";
import { COLORS, FONTS, WIDTH } from "../lib/constants";
import { SPRINGS } from "../lib/springConfigs";
import { ShaderBackground, ShaderPreset } from "../effects/ShaderBackground";

interface Props {
  scene: Scene;
}

/**
 * Shader-backed text scene.
 *
 * Layers:
 *   1. GLSL fragment shader (Three.js) — fullscreen animated background
 *   2. Dark vignette mask — improves text legibility on busy shaders
 *   3. Big display text overlay with **bold** word highlighting
 *
 * Use this scene type when you have NO external footage (no Veo, no
 * screenshot) but still want a visually rich, alive background.
 */
export const ShaderTextScene: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const preset: ShaderPreset = (scene.shaderPreset ?? "gradient") as ShaderPreset;
  const lines = (scene.textContent ?? "").split("\n").filter(Boolean);

  // Slow ambient drift on the text block
  const drift = Math.sin(frame / 38) * 5;

  return (
    <AbsoluteFill>
      {/* Layer 1: animated shader */}
      <ShaderBackground preset={preset} />

      {/* Layer 2: vignette / readability mask */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.55) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Layer 3: text overlay */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
            maxWidth: WIDTH - 160,
            transform: `translateY(${drift}px)`,
          }}
        >
          {lines.map((line, i) => {
            const entryProgress = spring({
              frame: Math.max(0, frame - i * 5),
              fps,
              config: SPRINGS.snappy,
            });

            const opacity = interpolate(entryProgress, [0, 1], [0, 1]);
            const translateY = interpolate(entryProgress, [0, 1], [40, 0]);
            const scale = interpolate(entryProgress, [0, 1], [0.92, 1]);

            return (
              <div
                key={i}
                style={{
                  opacity,
                  transform: `translateY(${translateY}px) scale(${scale})`,
                  transformOrigin: "left center",
                  fontFamily: FONTS.display,
                  fontSize: 104,
                  fontWeight: 900,
                  color: COLORS.white,
                  lineHeight: 1.0,
                  letterSpacing: "-3px",
                  textTransform: "uppercase",
                  textShadow:
                    "0 6px 18px rgba(0,0,0,0.8), 0 2px 6px rgba(0,0,0,0.9)",
                  WebkitTextStroke: "2px rgba(0,0,0,0.5)",
                  paintOrder: "stroke fill",
                }}
              >
                {renderLineWithHighlights(line)}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

function renderLineWithHighlights(line: string): React.ReactNode {
  const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const text = part.slice(2, -2);
      return (
        <span
          key={i}
          style={{
            color: COLORS.highlight,
            textShadow: `0 0 36px ${COLORS.highlight}cc, 0 0 14px ${COLORS.highlight}ff, 0 4px 12px rgba(0,0,0,0.7)`,
          }}
        >
          {text}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
