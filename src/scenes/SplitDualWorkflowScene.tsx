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
 * SplitDualWorkflowScene — visual contrast between two workflow paradigms.
 *
 * Used at b27: "Every hour they don't spend on images is an hour they pull
 * further ahead." TOP half = image-gen world (chaotic, many small image
 * tiles spitting out, every-color, frenzied). BOTTOM half = Claude team
 * (organized, all in Anthropic coral, building structured agent workflows).
 *
 * The contrast tells the story without words: chaos above, focus below.
 */
export const SplitDualWorkflowScene: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const headerAppear = spring({ frame, fps, config: { damping: 22, stiffness: 90 } });

  // Image gen tile grid (top) — 6×4 = 24 tiles spitting out images at random rates
  const TOP_COLS = 6;
  const TOP_ROWS = 3;
  const tileColors = [
    "#5b6cff", "#10A37F", "#4285F4", "#FF2D78",
    "#FF8A00", "#9B72CB", "#3DDCC9", "#FFD700",
    "#F472B6", "#EF4444", "#22D3EE", "#A78BFA",
  ];

  // Each tile cycles its color/brightness on its own rhythm — looks chaotic
  const tiles: { row: number; col: number; color: string; phase: number }[] = [];
  for (let r = 0; r < TOP_ROWS; r++) {
    for (let c = 0; c < TOP_COLS; c++) {
      const idx = r * TOP_COLS + c;
      tiles.push({
        row: r,
        col: c,
        color: tileColors[idx % tileColors.length],
        phase: (idx * 0.37) % 1,
      });
    }
  }

  // Claude agent flow (bottom) — 5 nodes in a row, connected by lines, pulsing
  const AGENT_NODES = 5;
  const agentT = interpolate(t, [0.3, 2.0], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Top half height = 45% of frame, bottom half = 55%, with 4% divider
  const TOP_RATIO = 0.45;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0c10", overflow: "hidden" }}>
      {/* TOP HALF — image gen chaos */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: `${TOP_RATIO * 100}%`,
          background: "radial-gradient(ellipse at 50% 50%, #181a23 0%, #0d0e12 80%)",
          padding: "40px 50px 30px",
          overflow: "hidden",
        }}
      >
        {/* Top label */}
        <div
          style={{
            opacity: headerAppear,
            fontFamily: FONTS.sans,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "4px",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.4)",
            marginBottom: 16,
          }}
        >
          Image Gen Market · The Race
        </div>

        {/* Chaos tile grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${TOP_COLS}, 1fr)`,
            gridTemplateRows: `repeat(${TOP_ROWS}, 1fr)`,
            gap: 12,
            height: "calc(100% - 50px)",
          }}
        >
          {tiles.map((tile, i) => {
            const localPhase = (t * 0.6 + tile.phase) % 1;
            const flash = Math.abs(Math.sin(t * 1.4 + tile.phase * 6.28));
            const opacity = 0.4 + flash * 0.5;
            // Mock "image" inside — abstract gradient blocks
            return (
              <div
                key={i}
                style={{
                  background: `linear-gradient(135deg, ${tile.color}cc, ${tile.color}66)`,
                  borderRadius: 6,
                  opacity,
                  boxShadow: `0 0 ${4 + flash * 14}px ${tile.color}77`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Mock generated image — concentric circle pattern */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "60%",
                    height: "60%",
                    borderRadius: "50%",
                    background: `radial-gradient(circle, #fff 0%, transparent 70%)`,
                    opacity: 0.3 + flash * 0.3,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* DIVIDER seam */}
      <div
        style={{
          position: "absolute",
          top: `${TOP_RATIO * 100}%`,
          left: 0,
          width: "100%",
          height: 4,
          background: "linear-gradient(90deg, transparent 0%, #D97757 50%, transparent 100%)",
          boxShadow: "0 0 14px rgba(217,119,87,0.6)",
          zIndex: 5,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: `${TOP_RATIO * 100 - 1}%`,
          left: 0,
          width: "100%",
          height: 24,
          background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.5) 70%, transparent 100%)",
          zIndex: 4,
          pointerEvents: "none",
        }}
      />

      {/* BOTTOM HALF — Claude team building agents */}
      <div
        style={{
          position: "absolute",
          top: `${TOP_RATIO * 100}%`,
          left: 0,
          width: "100%",
          height: `${(1 - TOP_RATIO) * 100}%`,
          background: "linear-gradient(180deg, #1a0e0a 0%, #0a0c10 60%)",
          padding: "40px 50px",
        }}
      >
        {/* Bottom label */}
        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "4px",
            textTransform: "uppercase",
            color: "#D97757",
            marginBottom: 24,
          }}
        >
          Claude · Building Agents
        </div>

        {/* Agent flow diagram — bigger nodes + lines for more visual presence */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 320, position: "relative", marginTop: 30 }}>
          {Array.from({ length: AGENT_NODES }).map((_, i) => {
            const nodeT = interpolate(agentT, [i / AGENT_NODES, (i + 1) / AGENT_NODES], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const pulse = Math.abs(Math.sin(t * 2 + i * 0.6));
            return (
              <React.Fragment key={i}>
                {i > 0 && (
                  <div
                    style={{
                      width: 90,
                      height: 5,
                      background: nodeT > 0 ? "#D97757" : "rgba(217,119,87,0.15)",
                      borderRadius: 2,
                      boxShadow: nodeT > 0 ? "0 0 12px rgba(217,119,87,0.6)" : "none",
                      transition: "background 0.2s",
                    }}
                  />
                )}
                <div
                  style={{
                    width: 130,
                    height: 130,
                    borderRadius: 22,
                    background: nodeT > 0 ? "linear-gradient(135deg, #FF8A65, #D97757)" : "#2a1a14",
                    border: `2px solid ${nodeT > 0 ? "#FF8A65" : "rgba(217,119,87,0.3)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: FONTS.display,
                    fontSize: 48,
                    fontWeight: 900,
                    color: nodeT > 0 ? "#fff" : "rgba(255,255,255,0.3)",
                    boxShadow: nodeT > 0 ? `0 0 ${18 + pulse * 18}px rgba(217,119,87,0.7)` : "none",
                    transform: `scale(${nodeT > 0 ? 1 : 0.85})`,
                    transition: "all 0.2s",
                  }}
                >
                  {nodeT > 0 ? "✓" : i + 1}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Agent labels */}
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 18, gap: 12 }}>
          {["plan", "search", "code", "verify", "ship"].map((label, i) => (
            <div
              key={label}
              style={{
                fontFamily: FONTS.mono,
                fontSize: 16,
                fontWeight: 600,
                color: agentT > i / AGENT_NODES ? "#FF8A65" : "rgba(255,255,255,0.25)",
                letterSpacing: 2,
                textTransform: "uppercase",
                transition: "color 0.2s",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Footer line */}
        <div
          style={{
            marginTop: 34,
            fontFamily: FONTS.sans,
            fontSize: 24,
            fontWeight: 600,
            color: "rgba(255,255,255,0.85)",
            textAlign: "center",
            letterSpacing: "1px",
          }}
        >
          Focused. Compounding. Pulling ahead.
        </div>
      </div>
    </AbsoluteFill>
  );
};
