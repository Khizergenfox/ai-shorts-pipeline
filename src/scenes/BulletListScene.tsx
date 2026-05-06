import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { FONTS } from "../lib/constants";

interface BulletItem {
  marker: string;     // "1" / "2" / "3"
  heading: string;    // big bold heading
  detail?: string;    // smaller supporting line
}

interface BulletListSceneProps {
  eyebrow?: string;
  headline?: string;
  items: BulletItem[];   // typically a single item per beat in the new design
  accentColor?: string;
  staggerSec?: number;
}

/**
 * BulletListScene — single-item dramatic numbered card.
 *
 * Old version was a vertical list of 3 with little markers. New version
 * shows ONE item per beat, with a giant numeral on the left and the
 * heading/detail on the right. Reads as a hard cut between "1 / 2 / 3"
 * which matches the editor's framework: each bullet gets its own beat,
 * and the cut on each new bullet is the visual rhythm.
 *
 * Design: pure black background, giant coral number (one of: 1, 2, 3),
 * white heading in big sans, smaller gray detail below.
 */
export const BulletListScene: React.FC<BulletListSceneProps> = ({
  eyebrow,
  items,
  accentColor = "#FF5E3A",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Use only the first item — the new design is single-item-per-beat
  const item = items[0];
  if (!item) return <AbsoluteFill style={{ backgroundColor: "#000" }} />;

  const numberAppear = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });
  const numberScale = interpolate(numberAppear, [0, 1], [0.6, 1]);

  const eyebrowFx = stagger(frame, fps, 0.05);
  const headingFx = stagger(frame, fps, 0.18);
  const detailFx = stagger(frame, fps, 0.32);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
        padding: "100px 80px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {/* Eyebrow at the very top */}
      {eyebrow && (
        <div
          style={{
            opacity: eyebrowFx.opacity,
            transform: `translateY(${eyebrowFx.y}px)`,
            fontFamily: FONTS.sans,
            fontSize: 22,
            fontWeight: 700,
            color: accentColor,
            letterSpacing: "4px",
            textTransform: "uppercase",
            marginBottom: 80,
          }}
        >
          {eyebrow}
        </div>
      )}

      {/* The dramatic single bullet — giant number left, content right */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 56,
        }}
      >
        {/* Giant numeral */}
        <div
          style={{
            fontFamily: FONTS.display,
            fontSize: 320,
            fontWeight: 900,
            color: accentColor,
            lineHeight: 0.85,
            letterSpacing: "-12px",
            transform: `scale(${numberScale})`,
            opacity: numberAppear,
            transformOrigin: "left top",
            flexShrink: 0,
            minWidth: 200,
          }}
        >
          {item.marker}
        </div>

        {/* Heading + detail stacked */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            paddingTop: 30,
            flex: 1,
          }}
        >
          <div
            style={{
              opacity: headingFx.opacity,
              transform: `translateY(${headingFx.y}px)`,
              fontFamily: FONTS.display,
              fontSize: 80,
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "-2.5px",
              lineHeight: 1.0,
            }}
          >
            {item.heading}
          </div>
          {item.detail && (
            <div
              style={{
                opacity: detailFx.opacity * 0.85,
                transform: `translateY(${detailFx.y}px)`,
                fontFamily: FONTS.sans,
                fontSize: 32,
                fontWeight: 500,
                color: "#9aa0a8",
                lineHeight: 1.4,
                maxWidth: 600,
              }}
            >
              {item.detail}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Helper: staggered slide-up entry
function stagger(frame: number, fps: number, delaySec: number) {
  const local = frame - delaySec * fps;
  const s = spring({
    frame: Math.max(0, local),
    fps,
    config: { damping: 22, stiffness: 90 },
  });
  return {
    opacity: interpolate(s, [0, 1], [0, 1]),
    y: interpolate(s, [0, 1], [16, 0]),
  };
}
