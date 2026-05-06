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
 * CompanyValueChartScene — rising-stock-chart visualization with counter below.
 *
 * Used at b09: "Claude Code crossed a billion dollars in just six months."
 *
 * Design:
 *   - Top half: animated upward-curving line/area chart with 6 month markers,
 *     line draws on with a sweep stroke from left to right, area fills underneath
 *     in brand coral with gradient
 *   - Bottom half: giant counter counting from $0 → $1,000,000,000 in sync with
 *     the line draw, plus "IN 6 MONTHS" subtitle
 *
 * The math: revenue curve uses an exponential growth shape (slow start, fast
 * end) — feels like the real "hockey stick" Claude Code growth.
 */
export const CompanyValueChartScene: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const data = (scene as any).chartData ?? {
    eyebrow: "Claude Code Revenue",
    targetValue: 1_000_000_000,
    targetLabel: "$1B",
    duration: "IN 6 MONTHS",
    months: ["M1", "M2", "M3", "M4", "M5", "M6"],
    accentColor: "#D97757",
  };

  const headerAppear = spring({ frame, fps, config: { damping: 22, stiffness: 90 } });

  // Chart line draws from left to right between t=0.4s and t=2.4s
  const drawStart = 0.4;
  const drawDur = 2.0;
  const drawProgress = interpolate(t, [drawStart, drawStart + drawDur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Exponential-ish growth curve (hockey stick)
  // 6 data points (M1..M6) with exponential growth, normalized 0..1
  const dataPoints = [0.04, 0.10, 0.18, 0.34, 0.62, 1.0];

  // Chart geometry — larger so it's the visual anchor of the frame
  const chartW = 1000;
  const chartH = 600;
  const padX = 50;
  const padY = 40;

  // Build the polyline points based on data — only show points up to drawProgress
  const visibleEnd = drawProgress * (dataPoints.length - 1);
  const linePoints: { x: number; y: number }[] = [];
  for (let i = 0; i < dataPoints.length; i++) {
    if (i > visibleEnd) {
      // Interpolate the partial last segment
      if (i - 1 < visibleEnd && i > visibleEnd) {
        const prev = dataPoints[i - 1];
        const curr = dataPoints[i];
        const segT = visibleEnd - (i - 1);
        const partialVal = prev + (curr - prev) * segT;
        const partialX = padX + ((i - 1 + segT) / (dataPoints.length - 1)) * (chartW - 2 * padX);
        const partialY = padY + (1 - partialVal) * (chartH - 2 * padY);
        linePoints.push({ x: partialX, y: partialY });
      }
      break;
    }
    const x = padX + (i / (dataPoints.length - 1)) * (chartW - 2 * padX);
    const y = padY + (1 - dataPoints[i]) * (chartH - 2 * padY);
    linePoints.push({ x, y });
  }

  const lineD = linePoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  // Area fill goes down to the bottom from the last drawn point
  let areaD = "";
  if (linePoints.length > 0) {
    const lastP = linePoints[linePoints.length - 1];
    const baseY = chartH - padY;
    areaD = `${linePoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")} L ${lastP.x.toFixed(1)} ${baseY} L ${padX} ${baseY} Z`;
  }

  // Counter — synced with chart progress, formatted with commas
  const counterValue = Math.round(drawProgress * data.targetValue);
  const formattedCounter = "$" + counterValue.toLocaleString("en-US");

  // Final value glow when chart completes
  const completeT = drawStart + drawDur;
  const completePulse = t > completeT ? Math.abs(Math.sin((t - completeT) * 3)) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0c10", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 35%, #1a1d24 0%, #0a0c10 75%)" }} />

      <AbsoluteFill style={{ padding: "100px 80px", display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Eyebrow + period header */}
        <div
          style={{
            opacity: headerAppear,
            transform: `translateY(${interpolate(headerAppear, [0, 1], [-20, 0])}px)`,
          }}
        >
          <div style={{ fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700, letterSpacing: "5px", textTransform: "uppercase", color: data.accentColor, marginBottom: 12 }}>
            {data.eyebrow}
          </div>
        </div>

        {/* Chart SVG */}
        <div style={{ alignSelf: "center", width: chartW, height: chartH, position: "relative" }}>
          <svg width={chartW} height={chartH} style={{ display: "block" }}>
            {/* Faint grid lines */}
            {[0.25, 0.5, 0.75, 1.0].map((g, i) => (
              <line
                key={`grid-${i}`}
                x1={padX}
                y1={padY + (1 - g) * (chartH - 2 * padY)}
                x2={chartW - padX}
                y2={padY + (1 - g) * (chartH - 2 * padY)}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="4 8"
                strokeWidth={1}
              />
            ))}

            {/* Area fill */}
            {areaD && (
              <defs>
                <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={data.accentColor} stopOpacity="0.55" />
                  <stop offset="100%" stopColor={data.accentColor} stopOpacity="0" />
                </linearGradient>
              </defs>
            )}
            {areaD && <path d={areaD} fill="url(#areaGrad)" />}

            {/* Line */}
            {lineD && (
              <path
                d={lineD}
                fill="none"
                stroke={data.accentColor}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: `drop-shadow(0 0 ${10 + completePulse * 14}px ${data.accentColor})` }}
              />
            )}

            {/* Final dot at last visible point */}
            {linePoints.length > 0 && (
              <circle
                cx={linePoints[linePoints.length - 1].x}
                cy={linePoints[linePoints.length - 1].y}
                r={drawProgress >= 1 ? 12 + completePulse * 4 : 8}
                fill={data.accentColor}
                style={{ filter: `drop-shadow(0 0 ${10 + completePulse * 16}px ${data.accentColor})` }}
              />
            )}

            {/* Month markers along bottom */}
            {data.months.map((m: string, i: number) => {
              const x = padX + (i / (data.months.length - 1)) * (chartW - 2 * padX);
              return (
                <text
                  key={`m-${i}`}
                  x={x}
                  y={chartH - 6}
                  fill="rgba(255,255,255,0.4)"
                  fontFamily={FONTS.sans}
                  fontSize={14}
                  fontWeight={600}
                  textAnchor="middle"
                  letterSpacing={1.5}
                >
                  {m}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Big counter */}
        <div style={{ alignSelf: "center", textAlign: "center", marginTop: 40 }}>
          <div
            style={{
              fontFamily: FONTS.display,
              fontSize: 110,
              fontWeight: 900,
              letterSpacing: "-3px",
              color: "#fff",
              fontVariantNumeric: "tabular-nums",
              textShadow: `0 0 ${28 + completePulse * 28}px ${data.accentColor}88`,
              lineHeight: 1.0,
            }}
          >
            {drawProgress < 0.95 ? formattedCounter : data.targetLabel}
          </div>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: "4px",
              textTransform: "uppercase",
              color: data.accentColor,
              marginTop: 14,
            }}
          >
            {data.duration}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
