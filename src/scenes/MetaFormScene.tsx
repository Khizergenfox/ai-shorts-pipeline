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
 * MetaFormScene — Meta's "give us a URL and a budget, AI handles the rest"
 * form mockup. Two animated inputs (URL typing + budget slider) plus an
 * "AI working" indicator. Used for "Give a URL and a budget" beat.
 */
export const MetaFormScene: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const cardAppear = spring({ frame, fps, config: { damping: 22, stiffness: 90 } });

  // URL field types in
  const url = "yourbrand.com/summer-sale";
  const urlProgress = interpolate(t, [0.1, scene.durationSeconds * 0.55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const visibleUrl = url.slice(0, Math.floor(url.length * urlProgress));

  // Budget slider animates from 0 to 65%
  const budgetT = interpolate(t, [scene.durationSeconds * 0.4, scene.durationSeconds * 0.85], [0, 0.65], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const budgetValue = Math.round(budgetT * 30000); // 0 to ₹19,500

  return (
    <AbsoluteFill style={{ backgroundColor: "#0d1117", overflow: "hidden" }}>
      {/* Meta blue background gradient */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 30%, #0d2b5c 0%, #0a1428 60%, #050a14 100%)" }} />

      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 30, transform: `scale(${interpolate(t, [0, scene.durationSeconds], [1.45, 1.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`, transformOrigin: "50% 50%" }}>
        <div
          style={{
            opacity: cardAppear,
            transform: `translateY(${interpolate(cardAppear, [0, 1], [40, 0])}px) scale(${interpolate(cardAppear, [0, 1], [0.96, 1])})`,
            width: "82%",
            background: "#1c2030",
            borderRadius: 18,
            border: "1px solid #2a3050",
            padding: "36px 40px",
            color: "#e6edf3",
            fontFamily: FONTS.sans,
            boxShadow: "0 28px 64px rgba(0,0,0,0.6)",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, background: "#0866FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#fff" }}>
              M
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Meta — Auto Campaign</div>
            <div style={{ marginLeft: "auto", fontSize: 11, color: "#3D8FFF", background: "#0d2b5c", padding: "4px 10px", borderRadius: 6, letterSpacing: "0.5px", textTransform: "uppercase" }}>
              AI-only
            </div>
          </div>
          <div style={{ fontSize: 14, color: "#9aa0a8", marginBottom: 28 }}>
            Just two inputs. We do the rest.
          </div>

          {/* URL field */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 13, color: "#9aa0a8", marginBottom: 8, letterSpacing: "0.3px" }}>1. Your URL</div>
            <div
              style={{
                background: "#0d1320",
                border: urlProgress < 1 ? "1px solid #3D8FFF" : "1px solid #2a3050",
                borderRadius: 10,
                padding: "12px 16px",
                fontSize: 16,
                fontFamily: FONTS.mono,
                color: "#3D8FFF",
                display: "flex",
                alignItems: "center",
                boxShadow: urlProgress < 1 ? "0 0 16px rgba(61,143,255,0.3)" : "none",
              }}
            >
              <span style={{ color: "#6b7280", marginRight: 6 }}>https://</span>
              {visibleUrl}
              {urlProgress < 1 && Math.floor(t * 2) % 2 === 0 && <span>|</span>}
            </div>
          </div>

          {/* Budget slider */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: "#9aa0a8", letterSpacing: "0.3px" }}>2. Daily budget</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#e6edf3", fontVariantNumeric: "tabular-nums" }}>
                ₹{budgetValue.toLocaleString("en-IN")}
              </div>
            </div>
            <div style={{ height: 8, background: "#0d1320", borderRadius: 4, position: "relative", border: "1px solid #2a3050" }}>
              <div
                style={{
                  width: `${budgetT * 100}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #0866FF, #3D8FFF)",
                  borderRadius: 4,
                  boxShadow: "0 0 14px rgba(61,143,255,0.6)",
                }}
              />
              {budgetT > 0.05 && (
                <div
                  style={{
                    position: "absolute",
                    left: `${budgetT * 100}%`,
                    top: -8,
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "#3D8FFF",
                    transform: "translateX(-50%)",
                    boxShadow: "0 0 16px rgba(61,143,255,0.8)",
                  }}
                />
              )}
            </div>
          </div>

          {/* AI working indicator (appears when both inputs are filled) */}
          {urlProgress >= 1 && budgetT > 0.5 && (
            <div
              style={{
                background: "#0d1320",
                border: "1px solid #00FF88",
                borderRadius: 10,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                boxShadow: `0 0 ${12 + Math.abs(Math.sin(t * 3)) * 14}px rgba(0,255,136,0.3)`,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#00FF88",
                  opacity: 0.4 + Math.abs(Math.sin(t * 5)) * 0.6,
                  boxShadow: "0 0 10px rgba(0,255,136,0.8)",
                }}
              />
              <div style={{ fontSize: 14, fontWeight: 600, color: "#00FF88", letterSpacing: "0.3px" }}>
                AI is generating creatives, choosing audiences, and launching campaigns…
              </div>
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
