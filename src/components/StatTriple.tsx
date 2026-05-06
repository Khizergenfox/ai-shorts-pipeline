import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, FONTS } from "../lib/constants";
import { SPRINGS } from "../lib/springConfigs";

interface Stat {
  emoji: string;
  value: string;
  label: string;
  color?: string;
}

interface StatTripleProps {
  stats: Stat[];
  title?: string;
}

export const StatTriple: React.FC<StatTripleProps> = ({ stats, title }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const framesPerStat = durationInFrames / (stats.length + 1);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 32,
      alignItems: "center",
      padding: "0 40px",
    }}>
      {/* Title */}
      {title && (() => {
        const prog = spring({ frame, fps, config: SPRINGS.snappy });
        return (
          <div style={{
            fontFamily: FONTS.sans,
            fontSize: 36,
            fontWeight: 700,
            color: "#777",
            opacity: interpolate(prog, [0, 1], [0, 1]),
            textTransform: "uppercase" as const,
            letterSpacing: 3,
          }}>
            {title}
          </div>
        );
      })()}

      {/* Stats */}
      {stats.map((stat, i) => {
        const delay = Math.round(framesPerStat * (i + 0.5));
        const localFrame = Math.max(0, frame - delay);
        const prog = spring({ frame: localFrame, fps, config: SPRINGS.snappy });
        const opacity = interpolate(prog, [0, 1], [0, 1]);
        const scale = interpolate(prog, [0, 1], [0.85, 1]);
        const tx = interpolate(prog, [0, 1], [-40, 0]);
        const color = stat.color ?? COLORS.coral;

        return (
          <div
            key={i}
            style={{
              opacity,
              transform: `translateX(${tx}px) scale(${scale})`,
              display: "flex",
              alignItems: "center",
              gap: 24,
              backgroundColor: "#1a1a1a",
              border: `2px solid ${color}44`,
              borderRadius: 20,
              padding: "22px 36px",
              width: "100%",
            }}
          >
            <div style={{ fontSize: 52 }}>{stat.emoji}</div>
            <div>
              <div style={{
                fontFamily: FONTS.sans,
                fontSize: 52,
                fontWeight: 900,
                color,
                lineHeight: 1,
              }}>
                {stat.value}
              </div>
              <div style={{
                fontFamily: FONTS.sans,
                fontSize: 26,
                fontWeight: 500,
                color: "#888",
                marginTop: 4,
              }}>
                {stat.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
