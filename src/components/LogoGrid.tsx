import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, FONTS } from "../lib/constants";
import { SPRINGS } from "../lib/springConfigs";

interface LogoItem {
  name: string;
  emoji: string;
  color: string;
}

const DEFAULT_TOOLS: LogoItem[] = [
  { name: "Claude Code", emoji: "🤖", color: "#d97070" },
  { name: "Cursor", emoji: "⚡", color: "#7090d9" },
  { name: "Cline", emoji: "🔧", color: "#70c090" },
  { name: "GitHub", emoji: "🐙", color: "#9070d9" },
  { name: "Codex", emoji: "💡", color: "#d9c070" },
  { name: "Windsurf", emoji: "🌊", color: "#70c0d9" },
];

interface LogoGridProps {
  tools?: LogoItem[];
  headline?: string;
}

export const LogoGrid: React.FC<LogoGridProps> = ({
  tools = DEFAULT_TOOLS,
  headline = "40+ agents supported",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40, alignItems: "center" }}>
      {/* Headline */}
      {(() => {
        const prog = spring({ frame, fps, config: SPRINGS.snappy });
        return (
          <div style={{
            fontFamily: FONTS.sans,
            fontSize: 38,
            fontWeight: 800,
            color: COLORS.white,
            opacity: interpolate(prog, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(prog, [0, 1], [20, 0])}px)`,
            textAlign: "center" as const,
          }}>
            {headline}
          </div>
        );
      })()}

      {/* Grid */}
      <div style={{
        display: "flex",
        flexWrap: "wrap" as const,
        gap: 24,
        justifyContent: "center",
        maxWidth: 900,
      }}>
        {tools.map((tool, i) => {
          const delay = i * 4;
          const prog = spring({ frame: Math.max(0, frame - delay), fps, config: SPRINGS.snappy });
          const opacity = interpolate(prog, [0, 1], [0, 1]);
          const scale = interpolate(prog, [0, 1], [0.6, 1]);

          return (
            <div
              key={tool.name}
              style={{
                opacity,
                transform: `scale(${scale})`,
                display: "flex",
                flexDirection: "column" as const,
                alignItems: "center",
                gap: 10,
                backgroundColor: "#1e1e1e",
                border: `2px solid ${tool.color}33`,
                borderRadius: 20,
                padding: "20px 24px",
                minWidth: 160,
              }}
            >
              <div style={{ fontSize: 44 }}>{tool.emoji}</div>
              <div style={{
                fontFamily: FONTS.sans,
                fontSize: 22,
                fontWeight: 600,
                color: tool.color,
                textAlign: "center" as const,
              }}>
                {tool.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
