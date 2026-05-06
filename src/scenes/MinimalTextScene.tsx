import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { COLORS, FONTS } from "../lib/constants";
import { Scene } from "../../orchestrator/types";

interface Props {
  scene: Scene;
}

/**
 * MinimalTextScene — pure black background + clean sans-serif typography.
 *
 * Replaces the decorative shader_bg presets. The Varun Mayya playbook is
 * journalistic minimalism: empty black space + 1-3 lines of text. No glow,
 * no neon, no kaleidoscope, no decoration. The text is the visual.
 *
 * Markup convention (in scene.textContent):
 *   "**Bold** for emphasis lines"
 *   "*Italic* for soft emphasis (rendered in serif italic)"
 *   "\n" for line breaks
 *
 * The first non-empty line renders bigger; subsequent lines render smaller.
 * Bold lines render in pure white at full weight; italic lines render in
 * Georgia serif italic at 0.85 opacity.
 */
export const MinimalTextScene: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const text = scene.textContent ?? scene.caption ?? "";

  // Parse into segments. Each line is independent — split on \n, keep markdown.
  const lines = text.split("\n").filter((l) => l.trim().length > 0);

  // Soft fade-in spring
  const appear = spring({ frame, fps, config: { damping: 18, stiffness: 80 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 80px",
      }}
    >
      <div
        style={{
          opacity: appear,
          transform: `translateY(${interpolate(appear, [0, 1], [12, 0])}px)`,
          textAlign: "center",
          maxWidth: 920,
        }}
      >
        {lines.map((line, idx) => (
          <Line key={idx} raw={line} index={idx} total={lines.length} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── Single line renderer with **bold** and *italic* support ──────────────────

function Line({
  raw,
  index,
  total,
}: {
  raw: string;
  index: number;
  total: number;
}) {
  // Detect line-level markup. If wrapped in **, treat the whole line as bold.
  // If wrapped in *, treat as italic serif. Otherwise plain.
  const isBold = /^\*\*.+\*\*$/.test(raw.trim());
  const isItalic = !isBold && /^\*.+\*$/.test(raw.trim());
  const cleaned = raw
    .trim()
    .replace(/^\*\*/, "")
    .replace(/\*\*$/, "")
    .replace(/^\*/, "")
    .replace(/\*$/, "");

  // Sizing — first line gets the biggest treatment, subsequent lines smaller.
  // Single-line scenes get the headline size.
  let size = total === 1 ? 130 : index === 0 ? 130 : 86;
  if (total >= 3) size = index === 0 ? 110 : 70;

  if (isItalic) {
    return (
      <div
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: size,
          lineHeight: 1.05,
          letterSpacing: "-1.5px",
          color: "rgba(255,255,255,0.86)",
          marginBottom: index < total - 1 ? 18 : 0,
        }}
      >
        {cleaned}
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: FONTS.sans,
        fontWeight: isBold ? 900 : 600,
        fontSize: size,
        lineHeight: 1.02,
        letterSpacing: isBold ? "-3px" : "-2px",
        color: "#ffffff",
        marginBottom: index < total - 1 ? 18 : 0,
      }}
    >
      {cleaned}
    </div>
  );
}

// Suppress unused-import warning when COLORS isn't read in some build modes
void COLORS;
