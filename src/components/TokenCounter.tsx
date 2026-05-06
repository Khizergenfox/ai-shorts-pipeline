import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, FONTS } from "../lib/constants";
import { SPRINGS } from "../lib/springConfigs";

interface TokenCounterProps {
  label: string;          // e.g. "Normal Claude"
  fromValue: number;
  toValue: number;
  color?: string;         // accent color
  suffix?: string;        // e.g. "tokens"
  // 0–1: delay fraction before counter starts animating
  delayFraction?: number;
}

export const TokenCounter: React.FC<TokenCounterProps> = ({
  label,
  fromValue,
  toValue,
  color = COLORS.coral,
  suffix = "tokens",
  delayFraction = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const delayFrames = Math.round(durationInFrames * delayFraction);
  const localFrame = Math.max(0, frame - delayFrames);

  const entryProg = spring({ frame: localFrame, fps, config: SPRINGS.smooth });
  const counterProg = spring({ frame: localFrame, fps, config: { damping: 18, stiffness: 80 } });

  const displayValue = Math.round(interpolate(counterProg, [0, 1], [fromValue, toValue]));
  const opacity = interpolate(entryProg, [0, 1], [0, 1]);
  const scale = interpolate(entryProg, [0, 1], [0.8, 1]);

  return (
    <div style={{
      opacity,
      transform: `scale(${scale})`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
    }}>
      {/* Label */}
      <div style={{
        fontFamily: FONTS.sans,
        fontSize: 26,
        fontWeight: 600,
        color: "#888",
        textTransform: "uppercase",
        letterSpacing: 2,
      }}>
        {label}
      </div>

      {/* Number */}
      <div style={{
        fontFamily: FONTS.sans,
        fontSize: 110,
        fontWeight: 900,
        color,
        lineHeight: 1,
        letterSpacing: -4,
      }}>
        {displayValue}
      </div>

      {/* Suffix */}
      <div style={{
        fontFamily: FONTS.sans,
        fontSize: 28,
        fontWeight: 500,
        color: "#666",
      }}>
        {suffix}
      </div>

      {/* Accent bar */}
      <div style={{
        width: interpolate(counterProg, [0, 1], [0, 120]),
        height: 4,
        backgroundColor: color,
        borderRadius: 2,
      }} />
    </div>
  );
};
