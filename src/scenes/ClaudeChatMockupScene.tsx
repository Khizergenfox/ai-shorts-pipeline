import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import { FONTS } from "../lib/constants";
import { Scene } from "../../orchestrator/types";

interface Props {
  scene: Scene;
}

/**
 * ClaudeChatMockupScene — pixel-perfect replica of Claude.ai chat with
 * 3 states (driven by scene.uiState):
 *   "prompt"    — user types a prompt with cursor + send button glow (b9)
 *   "thinking"  — Claude shows "Thinking..." spinner (b2 / part of b13)
 *   "result"    — Claude returns a campaign analysis (b2 / b13)
 *
 * Custom prompt/response text via scene.chatData.{prompt,response}.
 */
export const ClaudeChatMockupScene: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const uiState = ((scene as any).uiState as "prompt" | "thinking" | "result") ?? "prompt";
  const chat = ((scene as any).claudeChatData as { prompt?: string; response?: string }) ?? {};
  const promptText = chat.prompt ?? "show me the last 60 days of ad performance";
  const responseText = chat.response ?? "Here's your performance breakdown:";

  // Pull camera in so card fills more of the frame (was 1.0→1.06 — too small)
  const zoomT = interpolate(t, [0, scene.durationSeconds], [1.18, 1.32], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.2, 0.8, 0.2, 1),
  });

  // Typing animation: how many characters of the prompt are visible
  const typingProgress =
    uiState === "prompt"
      ? interpolate(t, [0.2, scene.durationSeconds * 0.85], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;
  const visiblePrompt = promptText.slice(0, Math.floor(promptText.length * typingProgress));

  // Send button glow when prompt is fully typed
  const sendGlow = typingProgress >= 1 ? Math.max(0, Math.sin(t * 4)) : 0;

  // Cursor blink
  const cursorOn = Math.floor(t * 2) % 2 === 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1d24", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #25272e 0%, #14161b 70%, #0a0c10 100%)" }} />

      <AbsoluteFill
        style={{
          transform: `scale(${zoomT})`,
          transformOrigin: "50% 50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 40px",
        }}
      >
        <div
          style={{
            width: "85%",
            backgroundColor: "#1f2127",
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.05)",
            padding: "36px 40px",
            boxShadow: "0 24px 56px rgba(0,0,0,0.55)",
            color: "#e8e6df",
            fontFamily: FONTS.sans,
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: "linear-gradient(135deg, #D97757 0%, #c46544 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "Georgia, serif", fontWeight: 800, fontSize: 22, color: "#fff",
              }}
            >
              ✱
            </div>
            <div style={{ fontWeight: 700, fontSize: 22 }}>Claude</div>
            <div style={{ marginLeft: "auto", fontSize: 14, color: "#9aa0a8", background: "#2a2d35", padding: "5px 12px", borderRadius: 999 }}>
              + Meta Ads MCP
            </div>
          </div>

          {/* Result bubble (only in result state) */}
          {uiState === "result" && (
            <div
              style={{
                background: "#2a2d35",
                borderRadius: 14,
                padding: "18px 22px",
                marginBottom: 22,
                fontSize: 17,
                lineHeight: 1.5,
                color: "#e8e6df",
              }}
            >
              <div style={{ marginBottom: 10, opacity: 0.85 }}>{responseText}</div>
              {/* Mini chart */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 72, marginTop: 14 }}>
                {[42, 65, 51, 78, 88, 95, 70].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${h}%`,
                      background: i === 5 ? "#0866FF" : "#3D8FFF",
                      borderRadius: 4,
                      opacity: 0.85,
                    }}
                  />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#9aa0a8", marginTop: 8 }}>
                <span>Last 60 days</span>
                <span>↑ 23% growth</span>
              </div>
            </div>
          )}

          {/* "Thinking" indicator */}
          {uiState === "thinking" && (
            <div style={{ background: "#2a2d35", borderRadius: 14, padding: "18px 22px", marginBottom: 22, fontSize: 16, color: "#9aa0a8", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#D97757", opacity: 0.4 + Math.abs(Math.sin(t * 4)) * 0.6 }} />
              <span>Thinking…</span>
            </div>
          )}

          {/* Input box */}
          <div
            style={{
              border: "1px solid #2a2d35",
              borderRadius: 14,
              padding: "16px 18px",
              background: "#181a1f",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: sendGlow > 0 ? `0 0 ${20 + sendGlow * 24}px rgba(217,119,87,${0.4 + sendGlow * 0.4})` : "none",
            }}
          >
            <div style={{ flex: 1, fontSize: 18, color: "#e8e6df" }}>
              {visiblePrompt}
              {uiState === "prompt" && cursorOn && <span style={{ color: "#D97757" }}>|</span>}
              {uiState !== "prompt" && (
                <span style={{ color: "#6b6f78", fontStyle: "italic" }}>{!visiblePrompt && "Ask Claude..."}</span>
              )}
            </div>
            <button
              style={{
                background: typingProgress >= 1 ? "linear-gradient(135deg, #D97757, #c46544)" : "#2a2d35",
                color: typingProgress >= 1 ? "#fff" : "#6b6f78",
                border: "none",
                borderRadius: 10,
                padding: "10px 16px",
                fontSize: 15,
                fontWeight: 600,
                boxShadow: sendGlow > 0 ? `0 0 ${10 + sendGlow * 14}px rgba(217,119,87,0.6)` : "none",
              }}
            >
              ↗ Send
            </button>
          </div>

          {/* Available tools (only in result state) */}
          {uiState === "result" && (
            <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
              {["meta_ads.list", "meta_ads.compare", "meta_ads.launch", "+5 more"].map((tool, i) => (
                <div key={i} style={{ background: "#181a1f", border: "1px solid #2a2d35", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontFamily: FONTS.mono, color: "#3D8FFF" }}>
                  {tool}
                </div>
              ))}
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
