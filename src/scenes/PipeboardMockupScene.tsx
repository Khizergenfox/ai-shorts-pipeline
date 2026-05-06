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
 * PipeboardMockupScene — fake-but-realistic MCP server marketplace.
 * Shows a list of available MCP servers with Pipeboard branding,
 * Meta Ads MCP highlighted/selected.
 */
export const PipeboardMockupScene: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const cardAppear = spring({ frame, fps, config: { damping: 22, stiffness: 90 } });
  const highlightT = interpolate(t, [scene.durationSeconds * 0.4, scene.durationSeconds * 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const servers = [
    { name: "Meta Ads MCP", desc: "Live access to your Meta marketing API", color: "#0866FF", icon: "M", highlighted: true },
    { name: "Stripe MCP", desc: "Manage subscriptions + payments", color: "#635bff", icon: "S" },
    { name: "Notion MCP", desc: "Read & write your Notion databases", color: "#000000", icon: "N" },
    { name: "GitHub MCP", desc: "Issues, PRs, code search", color: "#1f6feb", icon: "G" },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#0e1218", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 30%, #1a1f2a 0%, #0e1218 75%)" }} />

      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 50, transform: `scale(${interpolate(t, [0, scene.durationSeconds], [1.15, 1.25], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`, transformOrigin: "50% 50%" }}>
        <div
          style={{
            opacity: cardAppear,
            transform: `translateY(${interpolate(cardAppear, [0, 1], [40, 0])}px) scale(${interpolate(cardAppear, [0, 1], [0.96, 1])})`,
            width: "86%",
            background: "#161b22",
            borderRadius: 16,
            border: "1px solid #2a3138",
            padding: "32px 32px 24px",
            color: "#e6edf3",
            fontFamily: FONTS.sans,
            boxShadow: "0 24px 56px rgba(0,0,0,0.55)",
          }}
        >
          {/* Pipeboard header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #5b8def, #3D8FFF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#fff" }}>
              ⊜
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.3px" }}>
              <span style={{ color: "#5b8def" }}>Pipeboard</span>
            </div>
            <div style={{ marginLeft: "auto", fontSize: 12, color: "#9aa0a8", background: "#0d1117", padding: "4px 12px", borderRadius: 999, border: "1px solid #2a3138" }}>
              MCP marketplace
            </div>
          </div>

          {/* Search bar */}
          <div style={{ background: "#0d1117", border: "1px solid #2a3138", borderRadius: 10, padding: "10px 14px", marginBottom: 18, display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#6b7280" }}>
            <span>🔍</span>
            <span>Search MCP servers…</span>
          </div>

          {/* Server list */}
          <div style={{ fontSize: 12, color: "#9aa0a8", marginBottom: 10, letterSpacing: "0.5px", textTransform: "uppercase" }}>
            Popular this week
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {servers.map((s, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 14,
                  padding: "14px 16px",
                  background: s.highlighted && highlightT > 0 ? "#0d2b5c" : "#0d1117",
                  border: `1px solid ${s.highlighted && highlightT > 0 ? "#0866FF" : "#2a3138"}`,
                  borderRadius: 10,
                  alignItems: "center",
                  boxShadow: s.highlighted && highlightT > 0
                    ? `0 0 ${10 + highlightT * 18}px rgba(8,102,255,${0.3 + highlightT * 0.4})`
                    : "none",
                  transition: "background 0.2s",
                }}
              >
                <div
                  style={{
                    width: 38, height: 38, borderRadius: 8,
                    background: s.color, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 800, color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {s.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: "#9aa0a8" }}>{s.desc}</div>
                </div>
                {s.highlighted ? (
                  <div
                    style={{
                      background: "#0866FF",
                      color: "#fff",
                      padding: "6px 14px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    ✓ Connected
                  </div>
                ) : (
                  <div style={{ background: "#0d1117", border: "1px solid #2a3138", color: "#9aa0a8", padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500 }}>
                    Connect
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer hint */}
          <div style={{ marginTop: 18, fontSize: 11, color: "#6b7280", letterSpacing: "0.3px" }}>
            pipeboard.co/mcp
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
