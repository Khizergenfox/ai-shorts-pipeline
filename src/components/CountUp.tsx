import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";

interface CountUpProps {
  /** Starting value. Default 0. */
  from?: number;
  /** Target value. */
  to: number;
  /** How long the count takes (frames). Default 30 (= 1s @ 30fps). */
  durationInFrames?: number;
  /** Frame at which the count begins. Default 0. */
  delay?: number;
  /** Decimal places. Default 0. */
  decimals?: number;
  /** Prefix string e.g. "$". */
  prefix?: string;
  /** Suffix string e.g. "%" or "M" or "x". */
  suffix?: string;
  /** Add thousands separators (1,234,567). Default true. */
  separator?: boolean;
  style?: React.CSSProperties;
}

/**
 * Animated number counter that rolls from `from` to `to` over `durationInFrames`.
 *
 * Uses ease-out cubic so the count decelerates naturally — feels punchier
 * than linear. Pair with a scale-pulse on the parent for extra impact.
 */
export const CountUp: React.FC<CountUpProps> = ({
  from = 0,
  to,
  durationInFrames = 30,
  delay = 0,
  decimals = 0,
  prefix = "",
  suffix = "",
  separator = true,
  style,
}) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - delay);

  const progress = interpolate(localFrame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const value = from + (to - from) * progress;

  const formatted = value.toFixed(decimals);
  const display = separator ? withSeparators(formatted) : formatted;

  return (
    <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
};

function withSeparators(s: string): string {
  const [intPart, decPart] = s.split(".");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
}
