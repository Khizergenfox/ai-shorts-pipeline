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
 * ClaudeUiZoomScene — pixel-perfect replica of the Claude usage UI as
 * seen in claude.ai's settings, with a usage progress bar that fills
 * and turns red. Camera "zooms in" on the bar via CSS transform.
 *
 * Two states (set via scene.uiState):
 *   "fill"    — bar fills smoothly to ~95% (used at b6)
 *   "redspike" — bar snaps from green to deep red with a flash (used at b9)
 *
 * Reading scene.uiState makes the same scene render two different beats.
 */
export const ClaudeUiZoomScene: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const uiState = ((scene as any).uiState as "fill" | "redspike") ?? "fill";

  // Gentle zoom: 1.0→1.2 — keeps the whole card visible without cropping.
  // v3 was 1.3→1.8 which clipped the header + right edge per user feedback.
  const zoomT = interpolate(t, [0, scene.durationSeconds], [1.0, 1.18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.2, 0.8, 0.2, 1),
  });

  // Progress bar fill animation
  const fillT =
    uiState === "fill"
      ? interpolate(t, [0.1, scene.durationSeconds * 0.85], [0.2, 0.95], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0.95;

  // Red spike state: bar starts green, snaps red at 0.3s, then flickers
  const isRedState = uiState === "redspike";
  const redFlash = isRedState
    ? Math.max(0, Math.sin((t - 0.3) * 18)) * (t > 0.3 ? 1 : 0)
    : 0;
  // Fill state: bar stays a NEUTRAL Anthropic-coral throughout (not purple).
  // Red state: starts coral, snaps deep red at 0.3s, then flickers.
  const barColor = !isRedState
    ? "#D97757" // Anthropic coral — feels neutral, on-brand
    : t > 0.3
    ? `hsl(${5 + redFlash * 5}, 85%, 55%)`
    : "#D97757";

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1d24", overflow: "hidden" }}>
      {/* Soft ambient backdrop */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, #25272e 0%, #14161b 70%, #0a0c10 100%)",
        }}
      />

      {/* Zoomed UI surface — anchor at the progress bar (lower 60% of card) */}
      <AbsoluteFill
        style={{
          transform: `scale(${zoomT})`,
          transformOrigin: "50% 50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "84%",
            backgroundColor: "#1f2127",
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.05)",
            padding: "44px 48px",
            boxShadow: "0 24px 56px rgba(0,0,0,0.55)",
            color: "#e8e6df",
            fontFamily: FONTS.sans,
          }}
        >
          {/* Header — Claude-style sidebar mock */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 32,
              opacity: 0.85,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #D97757 0%, #c46544 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Georgia, serif",
                fontWeight: 800,
                fontSize: 22,
                color: "#fff",
              }}
            >
              ✱
            </div>
            <div style={{ fontWeight: 700, fontSize: 24, letterSpacing: "-0.5px" }}>
              Claude
            </div>
            <div
              style={{
                marginLeft: "auto",
                fontSize: 15,
                color: "#9aa0a8",
                background: "#2a2d35",
                padding: "6px 14px",
                borderRadius: 999,
              }}
            >
              Pro plan
            </div>
          </div>

          {/* Usage label */}
          <div
            style={{
              fontSize: 18,
              color: "#9aa0a8",
              marginBottom: 14,
              letterSpacing: "0.3px",
            }}
          >
            Weekly usage
          </div>

          {/* Progress bar */}
          <div
            style={{
              width: "100%",
              height: 36,
              backgroundColor: "#2a2d35",
              borderRadius: 18,
              overflow: "hidden",
              position: "relative",
              boxShadow: isRedState
                ? `0 0 ${24 + redFlash * 30}px rgba(255, 80, 60, ${0.5 + redFlash * 0.4})`
                : "0 0 14px rgba(0,0,0,0.4)",
            }}
          >
            <div
              style={{
                width: `${fillT * 100}%`,
                height: "100%",
                backgroundColor: barColor,
                borderRadius: 18,
                transition: "background-color 0.05s",
                boxShadow: isRedState
                  ? `inset 0 0 ${10 + redFlash * 12}px rgba(255,255,255,0.25)`
                  : "none",
              }}
            />
          </div>

          {/* Bar caption */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 16,
              color: "#9aa0a8",
              marginTop: 14,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <span>{Math.round(fillT * 100)}% used</span>
            <span>resets in 4 days</span>
          </div>

          {/* Empty space where breakdowns SHOULD be — adds height + drives the
              point home that there's no per-project/per-model split anywhere */}
          <div
            style={{
              marginTop: 28,
              padding: "26px 22px",
              borderRadius: 12,
              border: "1px dashed rgba(255,255,255,0.06)",
              color: "rgba(155,160,168,0.4)",
              fontSize: 14,
              letterSpacing: "1px",
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            ⊘ no per-project breakdown
          </div>
          <div
            style={{
              marginTop: 12,
              padding: "26px 22px",
              borderRadius: 12,
              border: "1px dashed rgba(255,255,255,0.06)",
              color: "rgba(155,160,168,0.4)",
              fontSize: 14,
              letterSpacing: "1px",
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            ⊘ no per-model breakdown
          </div>
          <div
            style={{
              marginTop: 12,
              padding: "26px 22px",
              borderRadius: 12,
              border: "1px dashed rgba(255,255,255,0.06)",
              color: "rgba(155,160,168,0.4)",
              fontSize: 14,
              letterSpacing: "1px",
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            ⊘ no per-task breakdown
          </div>

        </div>
      </AbsoluteFill>

      {/* Hot red overlay flash on redspike state */}
      {isRedState && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at 50% 50%, rgba(255,80,60,${redFlash * 0.18}) 0%, transparent 60%)`,
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};
