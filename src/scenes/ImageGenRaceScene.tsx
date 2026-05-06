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

interface Racer {
  name: string;
  brandColor: string;
  fallbackChar: string;
  // Each racer has its own pacing signature so the field looks chaotic, not lockstep
  pace: number; // 0.4..1.0 — how fast it advances over scene time
}

/**
 * ImageGenRaceScene — many image-gen tools all racing horizontally as bars.
 *
 * Used at b23: "The image gen market is crowded."
 *
 * Visual logic: 8 horizontal bars, each a different brand color with the
 * tool name + fallback brand letter. Each bar advances at its OWN pace, so
 * lead changes happen mid-scene (chaotic, no clear winner). The point is:
 * crowded. No one's pulling away. Claude is intentionally NOT in this race.
 *
 * Background tag: "IMAGE GEN MARKET" — sets context.
 */
export const ImageGenRaceScene: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const racers: Racer[] = (scene as any).raceData?.racers ?? [
    { name: "Midjourney",       brandColor: "#5b6cff", fallbackChar: "M", pace: 0.92 },
    { name: "DALL-E 4",         brandColor: "#10A37F", fallbackChar: "D", pace: 0.85 },
    { name: "Imagen 4",         brandColor: "#4285F4", fallbackChar: "I", pace: 0.88 },
    { name: "Flux Pro",         brandColor: "#FF2D78", fallbackChar: "F", pace: 0.83 },
    { name: "Stable Diffusion", brandColor: "#FF8A00", fallbackChar: "S", pace: 0.78 },
    { name: "Ideogram",         brandColor: "#9B72CB", fallbackChar: "Id", pace: 0.74 },
    { name: "Recraft",          brandColor: "#3DDCC9", fallbackChar: "R", pace: 0.71 },
    { name: "Leonardo",         brandColor: "#FFD700", fallbackChar: "L", pace: 0.67 },
  ];

  const headerAppear = spring({ frame, fps, config: { damping: 22, stiffness: 90 } });

  // Each bar's progress = pace * scene-time fraction with sinusoidal jitter
  // so they appear to lead-change mid-race (chaos)
  const sceneT = t / scene.durationSeconds;
  const startStagger = 0.3;
  const racerProgress = racers.map((r, i) => {
    const localT = Math.max(0, t - i * 0.05);
    const base = Math.min(1, (localT / scene.durationSeconds) * r.pace * 1.4);
    const wobble = Math.sin(t * 1.6 + i * 0.7) * 0.05;
    return Math.max(0, Math.min(1, base + wobble));
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0c10", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 35%, #1a1d24 0%, #0a0c10 75%)" }} />

      <AbsoluteFill style={{ padding: "100px 80px 80px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {/* Header */}
        <div
          style={{
            opacity: headerAppear,
            transform: `translateY(${interpolate(headerAppear, [0, 1], [-20, 0])}px)`,
            marginBottom: 26,
          }}
        >
          <div style={{ fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700, letterSpacing: "5px", textTransform: "uppercase", color: "#FF5E3A", marginBottom: 10 }}>
            Image Gen Market
          </div>
          <div style={{ fontFamily: FONTS.display, fontSize: 80, fontWeight: 900, letterSpacing: "-2px", color: "#fff", lineHeight: 0.95 }}>
            Brutally Crowded.
          </div>
        </div>

        {/* Racing bars — bigger gap + bar heights so 8 bars fill the middle */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {racers.map((r, i) => {
            const widthPct = racerProgress[i] * 92;
            return (
              <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {/* Brand letter chip */}
                <div
                  style={{
                    width: 46, height: 46, borderRadius: 10,
                    background: r.brandColor,
                    color: "#fff",
                    fontFamily: FONTS.display, fontSize: 22, fontWeight: 900,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: `0 0 12px ${r.brandColor}99`,
                  }}
                >
                  {r.fallbackChar}
                </div>

                {/* Track + bar */}
                <div style={{ flex: 1, height: 46, background: "#1a1d24", borderRadius: 8, position: "relative", overflow: "hidden", border: "1px solid #2a2d35" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${widthPct}%`,
                      background: `linear-gradient(90deg, ${r.brandColor}99 0%, ${r.brandColor} 100%)`,
                      borderRadius: 8,
                      boxShadow: `0 0 8px ${r.brandColor}88`,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: 14,
                      top: 0,
                      bottom: 0,
                      display: "flex",
                      alignItems: "center",
                      fontFamily: FONTS.sans,
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#fff",
                      opacity: widthPct > 8 ? 1 : 0,
                      textShadow: "0 1px 3px rgba(0,0,0,0.7)",
                    }}
                  >
                    {r.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer caption */}
        <div
          style={{
            marginTop: 30,
            fontFamily: FONTS.sans,
            fontSize: 22,
            fontWeight: 500,
            color: "#9aa0a8",
            letterSpacing: "1.5px",
            textAlign: "center",
          }}
        >
          Everyone's racing. No one's clearly winning.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
