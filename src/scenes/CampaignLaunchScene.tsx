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
 * CampaignLaunchScene — Meta Ads Manager-style launch panel showing
 * the best ad preview + Advantage+ launch button + click animation.
 * Used for "launch a new Advantage Plus campaign from your best ad" beat.
 */
export const CampaignLaunchScene: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const cardAppear = spring({ frame, fps, config: { damping: 22, stiffness: 90 } });
  const buttonHover = interpolate(t, [scene.durationSeconds * 0.4, scene.durationSeconds * 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const buttonClick = t > scene.durationSeconds * 0.7 ? 0.96 : 1;
  const launchFlash = interpolate(t, [scene.durationSeconds * 0.7, scene.durationSeconds * 0.9], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0d1117", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #161b22 0%, #0d1117 70%)" }} />

      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 30, transform: `scale(${interpolate(t, [0, scene.durationSeconds], [1.45, 1.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`, transformOrigin: "50% 50%" }}>
        <div
          style={{
            opacity: cardAppear,
            transform: `translateY(${interpolate(cardAppear, [0, 1], [40, 0])}px) scale(${interpolate(cardAppear, [0, 1], [0.96, 1])})`,
            width: "84%",
            background: "#1c2128",
            borderRadius: 18,
            border: "1px solid #30363d",
            padding: 36,
            color: "#e6edf3",
            fontFamily: FONTS.sans,
            boxShadow: "0 24px 56px rgba(0,0,0,0.55)",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "#0866FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff" }}>
              M
            </div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Meta Ads — Launch new campaign</div>
            <div style={{ marginLeft: "auto", fontSize: 12, color: "#0866FF", background: "#0d2b5c", padding: "4px 10px", borderRadius: 6 }}>Advantage+</div>
          </div>

          {/* Top performer card */}
          <div style={{ fontSize: 13, color: "#9aa0a8", marginBottom: 8, letterSpacing: "0.5px", textTransform: "uppercase" }}>
            Best performer (last 60 days)
          </div>
          <div
            style={{
              display: "flex",
              gap: 16,
              padding: 16,
              background: "#0d1117",
              borderRadius: 12,
              border: "1px solid #30363d",
              marginBottom: 22,
            }}
          >
            {/* Ad preview thumbnail */}
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: 10,
                background: "linear-gradient(135deg, #0866FF 0%, #3D8FFF 60%, #FFE94A 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                color: "#fff",
                fontWeight: 800,
              }}
            >
              ★
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>"Get 30% off — limited time"</div>
              <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#9aa0a8", marginBottom: 4 }}>
                <span>CTR <strong style={{ color: "#00FF88" }}>4.8%</strong></span>
                <span>ROAS <strong style={{ color: "#00FF88" }}>6.2×</strong></span>
                <span>Spend <strong style={{ color: "#e6edf3" }}>₹84k</strong></span>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Top 1% across all your campaigns</div>
            </div>
          </div>

          {/* Budget input */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 13, color: "#9aa0a8", marginBottom: 8, letterSpacing: "0.3px" }}>Daily budget</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 6, background: "#30363d", borderRadius: 3, position: "relative" }}>
                <div style={{ width: "65%", height: "100%", background: "linear-gradient(90deg, #0866FF, #3D8FFF)", borderRadius: 3 }} />
                <div style={{ position: "absolute", left: "65%", top: -7, width: 20, height: 20, borderRadius: "50%", background: "#3D8FFF", boxShadow: "0 0 12px rgba(61,143,255,0.6)" }} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#e6edf3", fontVariantNumeric: "tabular-nums", minWidth: 80, textAlign: "right" }}>
                ₹5,000
              </div>
            </div>
          </div>

          {/* Launch button */}
          <div style={{ position: "relative", display: "flex", justifyContent: "flex-end" }}>
            <button
              style={{
                background: launchFlash > 0
                  ? "linear-gradient(180deg, #4ec27d 0%, #00FF88 100%)"
                  : "linear-gradient(180deg, #0d6dff 0%, #0866FF 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "14px 32px",
                fontSize: 17,
                fontWeight: 700,
                transform: `scale(${buttonClick})`,
                boxShadow: buttonHover > 0
                  ? `0 0 ${16 + buttonHover * 30}px rgba(8, 102, 255, ${0.5 + buttonHover * 0.4})`
                  : "0 1px 0 rgba(255,255,255,0.04)",
                transition: "transform 0.05s, background 0.1s",
              }}
            >
              {launchFlash > 0 ? "✓ Launching…" : "🚀 Launch Advantage+"}
            </button>
          </div>
        </div>
      </AbsoluteFill>

      {/* Cursor pointing at button */}
      <div
        style={{
          position: "absolute",
          right: `calc(8% + ${interpolate(buttonHover, [0, 1], [120, 0])}px)`,
          bottom: `calc(34% + ${interpolate(buttonHover, [0, 1], [120, 0])}px)`,
          width: 38,
          height: 38,
          opacity: cardAppear,
          filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.85))",
          zIndex: 100,
          pointerEvents: "none",
        }}
      >
        <svg viewBox="0 0 32 32" fill="none">
          <path d="M5 3 L5 25 L11 19 L15 27 L19 25 L15 17 L23 17 Z" fill="#fff" stroke="#000" strokeWidth="1.5" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
