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
 * ClaudeDesktopMockupScene — Claude Desktop with MCP server config.
 * Two states (driven by scene.uiState):
 *   "paste"  — user pastes endpoint URL into the MCP config field (b16)
 *   "tools"  — Meta Ads tool tray slides in showing all available tools (b17)
 */
export const ClaudeDesktopMockupScene: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const uiState = ((scene as any).uiState as "paste" | "tools") ?? "paste";

  const cardAppear = spring({ frame, fps, config: { damping: 22, stiffness: 90 } });

  // Paste state: text appears character-by-character
  const endpoint = "https://pipeboard.co/mcp/meta-ads";
  const typingProgress =
    uiState === "paste"
      ? interpolate(t, [0.2, scene.durationSeconds * 0.85], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;
  const visibleEndpoint = endpoint.slice(0, Math.floor(endpoint.length * typingProgress));

  // Tool tray slide-in (tools state)
  const toolsSlide = interpolate(t, [0.05, 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tools = [
    "meta_ads.list_campaigns",
    "meta_ads.get_performance",
    "meta_ads.compare_creatives",
    "meta_ads.detect_fatigue",
    "meta_ads.launch_advantage_plus",
    "meta_ads.update_budget",
    "meta_ads.export_report",
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1d24", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 30%, #25272e 0%, #14161b 70%)" }} />

      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 50, transform: `scale(${interpolate(t, [0, scene.durationSeconds], [1.18, 1.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`, transformOrigin: "50% 50%" }}>
        <div
          style={{
            opacity: cardAppear,
            transform: `translateY(${interpolate(cardAppear, [0, 1], [40, 0])}px) scale(${interpolate(cardAppear, [0, 1], [0.96, 1])})`,
            width: "85%",
            background: "#1f2127",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.06)",
            overflow: "hidden",
            color: "#e8e6df",
            fontFamily: FONTS.sans,
            boxShadow: "0 24px 56px rgba(0,0,0,0.55)",
          }}
        >
          {/* Title bar — Claude Desktop */}
          <div style={{ background: "#181a1f", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FF5E3A" }} />
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FFE94A" }} />
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#00FF88" }} />
            </div>
            <div style={{ marginLeft: 12, fontSize: 13, color: "#9aa0a8" }}>Claude Desktop · Settings · Developer</div>
          </div>

          {/* Body */}
          <div style={{ padding: "24px 28px" }}>
            <div style={{ fontSize: 12, color: "#9aa0a8", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 6 }}>
              MCP Servers
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 22 }}>
              Add a new server
            </div>

            {/* Server name */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#9aa0a8", marginBottom: 6 }}>Name</div>
              <div style={{ background: "#181a1f", border: "1px solid #2a2d35", borderRadius: 8, padding: "10px 14px", fontSize: 14, fontFamily: FONTS.mono, color: "#e8e6df" }}>
                meta-ads
              </div>
            </div>

            {/* Endpoint URL — actively typed in paste state */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#9aa0a8", marginBottom: 6 }}>Endpoint</div>
              <div
                style={{
                  background: "#181a1f",
                  border: uiState === "paste" && typingProgress < 1 ? "1px solid #D97757" : "1px solid #2a2d35",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 14,
                  fontFamily: FONTS.mono,
                  color: "#3D8FFF",
                  boxShadow: uiState === "paste" && typingProgress < 1 ? "0 0 14px rgba(217,119,87,0.3)" : "none",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {visibleEndpoint}
                {uiState === "paste" && typingProgress < 1 && Math.floor(t * 2) % 2 === 0 && (
                  <span style={{ color: "#D97757" }}>|</span>
                )}
              </div>
            </div>

            {/* Tools tray (tools state only) */}
            {uiState === "tools" && (
              <div
                style={{
                  marginTop: 18,
                  background: "#0d1117",
                  border: "1px solid #00FF88",
                  borderRadius: 10,
                  padding: "16px 18px",
                  opacity: toolsSlide,
                  transform: `translateY(${interpolate(toolsSlide, [0, 1], [20, 0])}px)`,
                  boxShadow: `0 0 ${14 + toolsSlide * 14}px rgba(0,255,136,${0.2 + toolsSlide * 0.3})`,
                }}
              >
                <div style={{ fontSize: 12, color: "#00FF88", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 12, fontWeight: 600 }}>
                  ✓ {tools.length} Meta Ads tools available
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {tools.map((tool, i) => {
                    const toolAppear = interpolate(t, [0.3 + i * 0.08, 0.5 + i * 0.08], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    });
                    return (
                      <div
                        key={i}
                        style={{
                          background: "#161b22",
                          border: "1px solid #2a3138",
                          color: "#3D8FFF",
                          padding: "6px 12px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontFamily: FONTS.mono,
                          opacity: toolAppear,
                          transform: `translateY(${interpolate(toolAppear, [0, 1], [10, 0])}px)`,
                        }}
                      >
                        {tool}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Save button (paste state) */}
            {uiState === "paste" && typingProgress >= 1 && (
              <button
                style={{
                  marginTop: 14,
                  background: "linear-gradient(180deg, #D97757, #c46544)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 22px",
                  fontSize: 14,
                  fontWeight: 600,
                  boxShadow: `0 0 ${12 + Math.abs(Math.sin(t * 4)) * 12}px rgba(217,119,87,0.5)`,
                }}
              >
                Save & connect
              </button>
            )}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
