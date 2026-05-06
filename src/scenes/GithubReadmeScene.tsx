import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  spring,
} from "remotion";
import { FONTS } from "../lib/constants";
import { Scene } from "../../orchestrator/types";

interface Props {
  scene: Scene;
}

/**
 * GithubReadmeScene — pixel-perfect replica of a GitHub repo card with
 * README badges and an INSTALL button. Two states (set via scene.uiState):
 *
 *   "readme"  — shows the repo card with Free/Local/One-command badges (b26)
 *   "install" — same card zoomed onto the install button, cursor enters
 *               and clicks it, button presses + flashes (b27)
 */
export const GithubReadmeScene: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const uiState = ((scene as any).uiState as "readme" | "install") ?? "readme";

  // Camera zoom — install state zooms moderately (not too tight) so card+button stay framed
  const zoomT = uiState === "install"
    ? interpolate(t, [0, scene.durationSeconds], [1.05, 1.25], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      })
    : interpolate(t, [0, scene.durationSeconds], [1.0, 1.04], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

  // Cursor animation (install state only)
  const cursorAppear = uiState === "install"
    ? spring({ frame: frame - 6, fps, config: { damping: 18, stiffness: 80 } })
    : 0;
  // Cursor moves from off-screen into the button position
  const cursorX = interpolate(cursorAppear, [0, 1], [120, 0]);
  const cursorY = interpolate(cursorAppear, [0, 1], [120, 0]);

  // Button click flash (install state) — fires once cursor is over the button
  const clickFlashT = uiState === "install"
    ? interpolate(t, [scene.durationSeconds * 0.7, scene.durationSeconds * 0.85], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const buttonPress = uiState === "install" && t > scene.durationSeconds * 0.72 ? 0.96 : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0d1117", overflow: "hidden" }}>
      {/* GitHub-style backdrop */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, #161b22 0%, #0d1117 70%)",
        }}
      />

      {/* Zoomed repo card */}
      <AbsoluteFill
        style={{
          transform: `scale(${zoomT})`,
          transformOrigin: "50% 50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
        }}
      >
        <div
          style={{
            width: "92%",
            backgroundColor: "#0d1117",
            borderRadius: 14,
            border: "1px solid #30363d",
            padding: "36px 44px",
            color: "#e6edf3",
            fontFamily: FONTS.sans,
            boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
          }}
        >
          {/* Repo header — owner / repo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
              fontSize: 24,
              fontWeight: 600,
              color: "#58a6ff",
            }}
          >
            <span style={{ color: "#7d8590" }}>📦</span>
            <span style={{ color: "#7d8590" }}>opensource-dev</span>
            <span style={{ color: "#7d8590" }}>/</span>
            <span style={{ fontWeight: 700, color: "#58a6ff" }}>your-package</span>
            <span
              style={{
                marginLeft: 10,
                fontSize: 13,
                fontWeight: 500,
                color: "#7d8590",
                border: "1px solid #30363d",
                padding: "2px 8px",
                borderRadius: 999,
              }}
            >
              Public
            </span>
          </div>

          {/* Repo description */}
          <div
            style={{
              color: "#8b949e",
              fontSize: 16,
              marginBottom: 22,
              lineHeight: 1.4,
            }}
          >
            See exactly where your Claude &amp; Cursor tokens are vanishing.
            Open source. Local. Zero config.
          </div>

          {/* Badges row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            <Badge label="MIT" color="#3fb950" />
            <Badge label="100% local" color="#58a6ff" />
            <Badge label="No API key" color="#a371f7" />
            <Badge label="One command" color="#f0883e" />
          </div>

          {/* Install button + alternate "About" right-rail */}
          <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
            {/* Big install button */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  color: "#7d8590",
                  marginBottom: 10,
                  letterSpacing: "0.3px",
                }}
              >
                Install
              </div>
              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                  transform: `scale(${buttonPress})`,
                  transition: "transform 0.05s",
                }}
              >
                <button
                  style={{
                    background: clickFlashT > 0
                      ? "linear-gradient(180deg, #4ec27d 0%, #3fb950 100%)"
                      : "linear-gradient(180deg, #2da44e 0%, #238636 100%)",
                    color: "#fff",
                    border: "1px solid #2ea44f",
                    borderRadius: 8,
                    padding: "12px 28px",
                    fontSize: 18,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: clickFlashT > 0
                      ? `0 0 ${10 + clickFlashT * 24}px rgba(63, 185, 80, ${0.4 + clickFlashT * 0.5})`
                      : "0 1px 0 rgba(255,255,255,0.04)",
                  }}
                >
                  ⬇ Install your-package
                </button>
              </div>
              <div
                style={{
                  marginTop: 14,
                  background: "#161b22",
                  border: "1px solid #30363d",
                  borderRadius: 6,
                  padding: "10px 14px",
                  fontFamily: FONTS.mono,
                  fontSize: 14,
                  color: "#7d8590",
                }}
              >
                $ npx your-package
              </div>
            </div>

            {/* About panel */}
            <div style={{ width: 220 }}>
              <div
                style={{
                  fontSize: 13,
                  color: "#7d8590",
                  marginBottom: 8,
                  letterSpacing: "0.3px",
                }}
              >
                About
              </div>
              <div style={{ fontSize: 14, color: "#e6edf3", lineHeight: 1.5 }}>
                Live dashboard for Claude / Cursor token usage.
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 16,
                  fontSize: 13,
                  color: "#7d8590",
                }}
              >
                <span>★ 4.2k</span>
                <span>⑂ 312</span>
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>

      {/* Cursor (install state only) — positioned over install button.
          The card is centered, button is on the lower-left of card content.
          With zoomT around 1.05-1.25, button center is roughly 27% from left
          and 56% from top of the frame. Cursor lands precisely there. */}
      {uiState === "install" && cursorAppear > 0.05 && (
        <div
          style={{
            position: "absolute",
            left: `calc(27% + ${cursorX}px)`,
            top: `calc(56% + ${cursorY}px)`,
            width: 44,
            height: 44,
            zIndex: 100,
            pointerEvents: "none",
            filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.9))",
          }}
        >
          <svg viewBox="0 0 32 32" fill="none">
            <path d="M5 3 L5 25 L11 19 L15 27 L19 25 L15 17 L23 17 Z" fill="#fff" stroke="#000" strokeWidth="1.5" />
          </svg>
        </div>
      )}
    </AbsoluteFill>
  );
};

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <div
      style={{
        background: "#161b22",
        border: `1px solid ${color}`,
        color,
        padding: "4px 10px",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.3px",
        fontFamily: FONTS.mono,
      }}
    >
      {label}
    </div>
  );
}
