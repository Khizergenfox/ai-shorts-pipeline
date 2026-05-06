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
 * SafetyLevelsScene — visual metaphor for "safety gets stricter as models get smarter".
 *
 * Concept: a glowing AI capability core in the center, surrounded by 5 concentric
 * ASL (AI Safety Level) rings. As time progresses, the core pulses brighter
 * (capability grows) and the rings light up sequentially with lock icons at
 * compass points. The OUTER rings always exceed the core — visualizing how
 * Anthropic's safety boundary grows faster than capability.
 *
 * Caption row at bottom: ASL-1 → ASL-2 → ASL-3 → ASL-4 → ASL-5
 * Final state: bright core inside fully-lit safety lattice.
 *
 * Used at b14: "As their models get smarter, safety gets stricter."
 */
export const SafetyLevelsScene: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const centerX = 540;
  const centerY = 880;

  const headerAppear = spring({ frame, fps, config: { damping: 22, stiffness: 90 } });

  // Core grows over scene duration
  const coreT = interpolate(t, [0.2, scene.durationSeconds * 0.85], [0.4, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const coreRadius = 60 + coreT * 80; // 60 → 140

  // Pulse on core
  const corePulse = Math.abs(Math.sin(t * 2.2));

  // 5 ASL ring radii
  const ringBaseRadii = [180, 240, 305, 375, 450];

  // Each ring lights up at a staggered time
  const ringActivations = ringBaseRadii.map((_, i) => {
    const start = 0.3 + i * 0.45;
    return interpolate(t, [start, start + 0.4], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0c10", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, #131820 0%, #0a0c10 70%)" }} />

      {/* Header */}
      <AbsoluteFill style={{ padding: "100px 80px", pointerEvents: "none" }}>
        <div
          style={{
            opacity: headerAppear,
            transform: `translateY(${interpolate(headerAppear, [0, 1], [-20, 0])}px)`,
          }}
        >
          <div style={{ fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700, letterSpacing: "5px", textTransform: "uppercase", color: "#3DDCC9", marginBottom: 12 }}>
            Responsible Scaling
          </div>
          <div style={{ fontFamily: FONTS.display, fontSize: 70, fontWeight: 900, letterSpacing: "-2px", color: "#fff", lineHeight: 0.95 }}>
            Smarter AI.
          </div>
          <div style={{ fontFamily: FONTS.display, fontSize: 70, fontWeight: 900, letterSpacing: "-2px", color: "#3DDCC9", lineHeight: 0.95, marginTop: 6 }}>
            Stricter Safety.
          </div>
        </div>
      </AbsoluteFill>

      {/* SVG diagram */}
      <svg width={1080} height={1920} style={{ position: "absolute", top: 0, left: 0 }}>
        {/* Outermost faint guide ring */}
        <circle
          cx={centerX}
          cy={centerY}
          r={500}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={1}
          strokeDasharray="3 6"
        />

        {/* The 5 ASL rings */}
        {ringBaseRadii.map((r, i) => {
          const active = ringActivations[i];
          if (active === 0) return null;
          // Rings get progressively cyan-brighter
          const ringColor = "#3DDCC9";
          return (
            <g key={`ring-${i}`}>
              <circle
                cx={centerX}
                cy={centerY}
                r={r}
                fill="none"
                stroke={ringColor}
                strokeWidth={3}
                strokeDasharray="14 10"
                opacity={active * 0.7}
                style={{ filter: `drop-shadow(0 0 ${8 + active * 8}px ${ringColor})` }}
              />
              {/* Lock icons at 4 compass points */}
              {[0, 90, 180, 270].map((deg) => {
                const rad = (deg * Math.PI) / 180;
                const lx = centerX + r * Math.cos(rad);
                const ly = centerY + r * Math.sin(rad);
                return (
                  <g key={`lock-${i}-${deg}`} transform={`translate(${lx} ${ly})`} opacity={active}>
                    <circle r={14} fill="#0a0c10" stroke={ringColor} strokeWidth={2} />
                    {/* Lock body */}
                    <rect x={-6} y={-2} width={12} height={9} rx={2} fill={ringColor} />
                    {/* Lock shackle */}
                    <path d={`M -4 -2 V -5 A 4 4 0 0 1 4 -5 V -2`} fill="none" stroke={ringColor} strokeWidth={1.8} strokeLinecap="round" />
                  </g>
                );
              })}
              {/* ASL label staggered around ring at unique angles so labels
                  don't pile up on the right side */}
              {(() => {
                // Each ring's label sits at a different angle (clockwise from
                // top-right). Anchor adjusts so text doesn't overflow off-screen.
                const labelAngles = [-30, -10, 10, 30, 50]; // degrees from horizontal right
                const angleDeg = labelAngles[i] ?? 0;
                const rad = (angleDeg * Math.PI) / 180;
                const lx = centerX + (r + 28) * Math.cos(rad);
                const ly = centerY + (r + 28) * Math.sin(rad) + 6;
                return (
                  <text
                    x={lx}
                    y={ly}
                    fill={ringColor}
                    fontFamily={FONTS.mono}
                    fontSize={22}
                    fontWeight={700}
                    opacity={active}
                    letterSpacing={2}
                    textAnchor="start"
                  >
                    ASL-{i + 1}
                  </text>
                );
              })()}
            </g>
          );
        })}

        {/* Glow halo around the core */}
        <defs>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF8A65" stopOpacity={0.95} />
            <stop offset="40%" stopColor="#FF5E3A" stopOpacity={0.7} />
            <stop offset="100%" stopColor="#FF5E3A" stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle
          cx={centerX}
          cy={centerY}
          r={coreRadius * 1.7}
          fill="url(#coreGlow)"
          opacity={0.55 + corePulse * 0.2}
        />

        {/* The capability core */}
        <circle
          cx={centerX}
          cy={centerY}
          r={coreRadius}
          fill="#FF5E3A"
          style={{ filter: `drop-shadow(0 0 ${24 + corePulse * 18}px #FF5E3A)` }}
        />
        <circle
          cx={centerX - coreRadius * 0.25}
          cy={centerY - coreRadius * 0.25}
          r={coreRadius * 0.55}
          fill="#FFAA85"
          opacity={0.7}
        />

        {/* Core label */}
        <text
          x={centerX}
          y={centerY + coreRadius + 50}
          fill="#fff"
          fontFamily={FONTS.sans}
          fontSize={22}
          fontWeight={700}
          textAnchor="middle"
          letterSpacing={4}
        >
          AI CAPABILITY
        </text>
      </svg>

      {/* Bottom narrative line */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 80,
          textAlign: "center",
          fontFamily: FONTS.sans,
          fontSize: 26,
          fontWeight: 600,
          color: "#9aa0a8",
          letterSpacing: "2px",
        }}
      >
        Capability rises. Safety rises faster.
      </div>
    </AbsoluteFill>
  );
};
