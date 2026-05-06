import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { COLORS, FONTS } from "../lib/constants";
import { Scene } from "../../orchestrator/types";

interface TerminalSceneProps {
  scene: Scene;
}

export const TerminalScene: React.FC<TerminalSceneProps> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const lines = scene.terminalLines ?? [];

  // Reveal lines progressively
  const framesPerLine = durationInFrames / (lines.length + 1);
  const visibleLineCount = Math.floor(frame / framesPerLine);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0d1117",
        padding: 80,
        justifyContent: "center",
      }}
    >
      {/* Terminal window chrome */}
      <div
        style={{
          backgroundColor: "#1c1f26",
          borderRadius: 12,
          overflow: "hidden",
          border: `2px solid ${COLORS.coral}`,
        }}
      >
        {/* Title bar */}
        <div
          style={{
            backgroundColor: "#262a33",
            padding: "16px 24px",
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => (
            <div
              key={i}
              style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: c }}
            />
          ))}
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 22,
              color: "#666",
              marginLeft: 12,
            }}
          >
            terminal
          </span>
        </div>

        {/* Terminal body */}
        <div style={{ padding: "32px 40px", minHeight: 400 }}>
          {lines.slice(0, visibleLineCount + 1).map((line, i) => {
            const isHighlighted = i === scene.terminalHighlightLine;
            return (
              <div
                key={i}
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 34,
                  color: isHighlighted ? "#000" : "#e0e0e0",
                  backgroundColor: isHighlighted ? "#39d353" : "transparent",
                  lineHeight: 1.8,
                  opacity: i <= visibleLineCount ? 1 : 0,
                  borderRadius: isHighlighted ? 6 : 0,
                  padding: isHighlighted ? "0 12px" : "0",
                  display: "inline-block",
                  width: "100%",
                }}
              >
                {line}
              </div>
            );
          })}
          {/* Blinking cursor */}
          <span
            style={{
              display: "inline-block",
              width: 18,
              height: 34,
              backgroundColor: COLORS.green,
              marginLeft: 4,
              opacity: Math.floor(frame / 15) % 2 === 0 ? 1 : 0,
              verticalAlign: "middle",
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
