import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  spring,
  useVideoConfig,
  interpolate,
} from "remotion";
import { COLORS, FONTS, WIDTH, HEIGHT } from "../lib/constants";
import { SPRINGS } from "../lib/springConfigs";
import { Scene } from "../../orchestrator/types";

interface TextSlideSceneProps {
  scene: Scene;
}

/**
 * Modern text slide.
 *
 * Replaces the old "flat gray + thin coral bar" 2015-keynote look with:
 *   - Deep radial-gradient background (cinematic, not flat)
 *   - Huge Inter Black display type
 *   - Per-word stagger with scale + slide entrance
 *   - **Wrapped** words render as a glowing electric-coral highlight
 *   - Subtle slow drift (ambient motion) on the whole block
 *
 * Markdown-style emphasis still works:
 *   line text "Some **bold** word" — the **bold** part renders highlighted
 */
export const TextSlideScene: React.FC<TextSlideSceneProps> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lines = (scene.textContent ?? "").split("\n").filter(Boolean);

  // Slow ambient drift on the whole text block — adds life
  const drift = Math.sin(frame / 40) * 6;

  return (
    <AbsoluteFill
      style={{
        // Deep cinematic background: dark radial vignette over near-black
        background: `radial-gradient(ellipse at 30% 20%, ${COLORS.bgPanel} 0%, ${COLORS.bgDark} 60%, #000000 100%)`,
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        overflow: "hidden",
      }}
    >
      {/* Soft accent glow blob — adds depth, anchors the eye */}
      <div
        style={{
          position: "absolute",
          top: HEIGHT * 0.15,
          right: -200,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.accent}33 0%, transparent 70%)`,
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

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
                fontSize: 96,
                fontWeight: 900,
                color: COLORS.white,
                lineHeight: 1.02,
                letterSpacing: "-3px",
                textTransform: "uppercase",
                textShadow: "0 8px 24px rgba(0,0,0,0.6)",
              }}
            >
              {renderLineWithHighlights(line)}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/**
 * Splits a line on **bold** markers and renders bold segments
 * as glowing electric-coral highlights.
 */
function renderLineWithHighlights(line: string): React.ReactNode {
  // Split on **...** while keeping the markers in the result
  const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const text = part.slice(2, -2);
      return (
        <span
          key={i}
          style={{
            color: COLORS.accent,
            textShadow: `0 0 32px ${COLORS.accent}88, 0 0 12px ${COLORS.accent}aa, 0 4px 12px rgba(0,0,0,0.4)`,
          }}
        >
          {text}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
