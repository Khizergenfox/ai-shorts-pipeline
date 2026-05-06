import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
} from "remotion";
import { FONTS } from "../lib/constants";
import { Scene } from "../../orchestrator/types";

interface Props {
  scene: Scene;
}

interface BenchEntry {
  name: string;
  logoSrc?: string;
  logoColor?: string;
  score: number;
  brandColor: string;
  fallbackChar: string;
}

/**
 * BenchmarkLeaderboardScene — animated horizontal bar leaderboard with brand
 * logos. Used for b07 (SWE-bench, Claude #1 on top) and reusable for similar
 * leaderboard moments.
 *
 * Animation arc:
 *   0–0.4s   header eyebrow + "SWE-BENCH" headline slide in
 *   0.4–2s   bars race in from 0 → final width with stagger (lower-ranked first,
 *            so Claude lands LAST and feels like the winner reveal)
 *   2–end    pulse ring around Claude #1 to mark dominance
 *
 * Uses scene.benchData.entries to pass model rankings; first entry is the
 * winner (longest bar, gets the gold accent).
 */
export const BenchmarkLeaderboardScene: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Defaults shown only if no benchData is passed via the scene spec.
  // Replace these with your topic's actual contenders + scores.
  const data = (scene as any).benchData ?? {
    eyebrow: "Benchmark · Category",
    title: "Your Benchmark Name",
    subtitle: "What it measures",
    entries: [
      { name: "Contender A", logoSrc: "refs/contender-a.svg", brandColor: "#D97757", score: 78.0, fallbackChar: "A" },
      { name: "Contender B", logoSrc: "refs/contender-b.svg", brandColor: "#10A37F", score: 71.0, fallbackChar: "B" },
      { name: "Contender C", logoSrc: "refs/contender-c.svg", brandColor: "#4285F4", score: 67.0, fallbackChar: "C" },
      { name: "Contender D", logoSrc: "refs/contender-d.svg", brandColor: "#000000", score: 62.0, fallbackChar: "D" },
    ] as BenchEntry[],
  };

  const entries: BenchEntry[] = data.entries;
  const winnerScore = Math.max(...entries.map(e => e.score));

  const headerAppear = spring({ frame, fps, config: { damping: 22, stiffness: 90 } });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0c10", overflow: "hidden" }}>
      {/* Atmospheric background */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #131820 0%, #0a0c10 75%)" }} />

      {/* Subtle grid floor for "data ground" feel */}
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "100%",
          height: "30%",
          background: "linear-gradient(to top, rgba(217,119,87,0.08), transparent)",
          backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 80px), repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 60px)",
          opacity: 0.6,
        }}
      />

      <AbsoluteFill style={{ padding: "120px 80px", display: "flex", flexDirection: "column", gap: 28 }}>
        {/* Header */}
        <div
          style={{
            opacity: headerAppear,
            transform: `translateY(${interpolate(headerAppear, [0, 1], [-30, 0])}px)`,
          }}
        >
          <div style={{ fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700, letterSpacing: "5px", textTransform: "uppercase", color: "#FF5E3A", marginBottom: 10 }}>
            {data.eyebrow}
          </div>
          <div style={{ fontFamily: FONTS.display, fontSize: 96, fontWeight: 900, letterSpacing: "-3px", color: "#fff", lineHeight: 0.95 }}>
            {data.title}
          </div>
          {data.subtitle && (
            <div style={{ fontFamily: FONTS.sans, fontSize: 28, fontWeight: 500, color: "#9aa0a8", marginTop: 8 }}>
              {data.subtitle}
            </div>
          )}
        </div>

        {/* Bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 40 }}>
          {entries.map((e, i) => {
            // Reverse stagger — last (lowest) bar appears first, winner appears LAST
            const reverseIdx = entries.length - 1 - i;
            const barStart = 0.5 + reverseIdx * 0.25;
            const barProgress = interpolate(t, [barStart, barStart + 0.7], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const widthPct = (e.score / winnerScore) * 95 * barProgress;
            const isWinner = i === 0;

            // Pulse for the winner
            const pulse = isWinner && t > 2.0 ? Math.abs(Math.sin((t - 2.0) * 3)) : 0;

            return (
              <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 18 }}>
                {/* Rank badge */}
                <div
                  style={{
                    width: 52, height: 52, borderRadius: 12,
                    background: isWinner ? "linear-gradient(135deg, #FFD700, #FF8A00)" : "#2a2d35",
                    color: isWinner ? "#0a0c10" : "#9aa0a8",
                    fontFamily: FONTS.display, fontSize: 28, fontWeight: 900,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: isWinner ? `0 0 ${20 + pulse * 20}px rgba(255,215,0,${0.4 + pulse * 0.4})` : "none",
                  }}
                >
                  {i + 1}
                </div>

                {/* Bar */}
                <div style={{ flex: 1, height: 56, background: "#1a1d24", borderRadius: 10, position: "relative", overflow: "hidden", border: "1px solid #2a2d35" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${widthPct}%`,
                      background: isWinner
                        ? `linear-gradient(90deg, ${e.brandColor} 0%, ${e.brandColor}dd 70%, #FFD700 100%)`
                        : `linear-gradient(90deg, ${e.brandColor}cc 0%, ${e.brandColor} 100%)`,
                      borderRadius: 10,
                      boxShadow: isWinner ? `0 0 ${14 + pulse * 14}px ${e.brandColor}cc` : `0 0 8px ${e.brandColor}66`,
                      transition: "width 0.1s linear",
                    }}
                  />
                  {/* Bar label inside */}
                  <div
                    style={{
                      position: "absolute",
                      left: 18,
                      top: 0,
                      bottom: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      fontFamily: FONTS.sans,
                      fontSize: 22,
                      fontWeight: 700,
                      color: "#fff",
                      opacity: barProgress > 0.3 ? 1 : 0,
                      mixBlendMode: "normal",
                      textShadow: "0 1px 4px rgba(0,0,0,0.7)",
                    }}
                  >
                    {/* Logo (uses CSS mask for SVG recoloring; falls back to brand char) */}
                    {e.logoSrc ? (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          backgroundColor: "#fff",
                          WebkitMaskImage: `url(${staticFile(e.logoSrc)})`,
                          WebkitMaskRepeat: "no-repeat",
                          WebkitMaskPosition: "center",
                          WebkitMaskSize: "contain",
                          maskImage: `url(${staticFile(e.logoSrc)})`,
                          maskRepeat: "no-repeat",
                          maskPosition: "center",
                          maskSize: "contain",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: 6, background: "#fff", color: e.brandColor, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>
                        {e.fallbackChar}
                      </div>
                    )}
                    <span>{e.name}</span>
                  </div>
                </div>

                {/* Score sits OUTSIDE the bar on the right — never clipped */}
                <div
                  style={{
                    width: 110,
                    flexShrink: 0,
                    fontFamily: FONTS.display,
                    fontSize: 32,
                    fontWeight: 900,
                    color: isWinner ? "#FFD700" : "#fff",
                    opacity: barProgress,
                    fontVariantNumeric: "tabular-nums",
                    textAlign: "right",
                    textShadow: isWinner ? `0 0 ${10 + pulse * 12}px rgba(255,215,0,0.7)` : "none",
                  }}
                >
                  {(e.score * barProgress).toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
