import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { TokenCounter } from "../components/TokenCounter";
import { COLORS, FONTS, WIDTH } from "../lib/constants";
import { SPRINGS } from "../lib/springConfigs";
import { Scene } from "../../orchestrator/types";

interface TokenCounterSceneProps { scene: Scene; }

export const TokenCounterScene: React.FC<TokenCounterSceneProps> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const data = scene.tokenData!;

  // VS divider entrance
  const vsProg = spring({ frame: Math.max(0, frame - 10), fps, config: SPRINGS.snappy });

  return (
    <AbsoluteFill style={{
      backgroundColor: COLORS.bgDark,
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column",
      gap: 60,
      padding: 60,
    }}>
      {/* Headline */}
      <div style={{
        fontFamily: FONTS.sans,
        fontSize: 36,
        fontWeight: 700,
        color: "#555",
        textTransform: "uppercase" as const,
        letterSpacing: 3,
        opacity: interpolate(spring({ frame, fps, config: SPRINGS.snappy }), [0, 1], [0, 1]),
      }}>
        {data.headline ?? "Token comparison"}
      </div>

      {/* Side-by-side counters */}
      <div style={{ display: "flex", alignItems: "center", gap: 60 }}>
        <TokenCounter
          label={data.leftLabel ?? "Normal"}
          fromValue={data.leftFrom ?? 180}
          toValue={data.leftTo ?? 180}
          color="#e07070"
          suffix="tokens"
        />

        {/* VS */}
        <div style={{
          fontFamily: FONTS.sans,
          fontSize: 44,
          fontWeight: 900,
          color: "#333",
          opacity: interpolate(vsProg, [0, 1], [0, 1]),
          transform: `scale(${interpolate(vsProg, [0, 1], [0.5, 1])})`,
        }}>
          VS
        </div>

        <TokenCounter
          label={data.rightLabel ?? "Caveman"}
          fromValue={data.rightFrom ?? 0}
          toValue={data.rightTo ?? 45}
          color="#70c090"
          suffix="tokens"
          delayFraction={0.2}
        />
      </div>

      {/* Savings badge */}
      {data.savingsPct && (() => {
        const badgeProg = spring({ frame: Math.max(0, frame - 30), fps, config: SPRINGS.snappy });
        return (
          <div style={{
            opacity: interpolate(badgeProg, [0, 1], [0, 1]),
            transform: `scale(${interpolate(badgeProg, [0, 1], [0.7, 1])})`,
            backgroundColor: "rgba(112, 192, 112, 0.15)",
            border: "2px solid #70c090",
            borderRadius: 40,
            padding: "14px 40px",
            fontFamily: FONTS.sans,
            fontSize: 36,
            fontWeight: 800,
            color: "#70c090",
          }}>
            {data.savingsPct} less spend
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};
