import React from "react";
import {
  AbsoluteFill,
  staticFile,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { COLORS, FONTS } from "../lib/constants";

export type AnchorPosition =
  | "topLeft"
  | "topCenter"
  | "topRight"
  | "middleLeft"
  | "center"
  | "middleRight"
  | "bottomLeft"
  | "bottomCenter"
  | "bottomRight";

interface ContextOverlayProps {
  src: string;
  startFrame: number;
  durationFrames?: number;
  /**
   * Where in the frame to position the overlay. 9-position grid lets
   * each scene anchor logos near their relevant 3D object instead of
   * always living in a corner.
   */
  anchor?: AnchorPosition;
  /** Size in px. Default 180. */
  size?: number;
  /** Recolor monochrome SVG to a single color (CSS mask). */
  recolor?: string;
  /** Recolor with a two-stop gradient (e.g. Gemini blue→purple). */
  recolorGradient?: { from: string; to: string; angle?: number };
  /** Optional text label that renders alongside the logo. */
  label?: string;
  /** Optional fallback text if the SVG fails to load. */
  fallbackText?: string;
}

/**
 * Brand-logo overlay with a 9-position anchor system. Lives where the
 * scene's hero is — top of a coin stack, next to a benchmark bar, on
 * the chip's surface — instead of always top-right corner.
 *
 * Soft drop shadow tinted to the brand color makes the logo feel lit
 * by the same scene light, not pasted on. Subtle sine sway keeps it
 * from reading as screen-locked.
 */
export const ContextOverlay: React.FC<ContextOverlayProps> = ({
  src,
  startFrame,
  durationFrames = 24,
  anchor = "topRight",
  size = 180,
  recolor,
  recolorGradient,
  label,
  fallbackText,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - startFrame;
  if (localFrame < -2 || localFrame > durationFrames + 2) return null;

  const entry = spring({
    frame: Math.max(0, localFrame),
    fps,
    config: { damping: 14, stiffness: 220, mass: 0.5 },
    durationInFrames: 8,
  });
  const exitFade = interpolate(
    localFrame,
    [durationFrames - 6, durationFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const opacity = Math.min(entry, exitFade);
  const scale = interpolate(entry, [0, 1], [0.65, 1]);

  // Subtle organic sway
  const swayT = localFrame / fps;
  const swayX = Math.sin(swayT * 1.6) * 4;
  const swayY = Math.cos(swayT * 1.2) * 3;

  const shadowColor = recolorGradient?.from ?? recolor ?? "#FF5E3A";

  const positionStyle = anchorToStyle(anchor, size);

  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 50 }}>
      <div
        style={{
          ...positionStyle,
          width: size,
          height: size + (label ? 36 : 0),
          opacity,
          transform: `translate(${swayX}px, ${swayY}px) scale(${scale})`,
          transformOrigin: "center",
          filter: `drop-shadow(0 4px 18px ${shadowColor}aa) drop-shadow(0 0 24px ${shadowColor}55)`,
        }}
      >
        <div style={{ width: size, height: size }}>
          <SvgGlyph
            src={src}
            recolor={recolor}
            recolorGradient={recolorGradient}
            fallbackText={fallbackText}
          />
        </div>
        {label && (
          <div
            style={{
              fontFamily: FONTS.display,
              fontSize: 22,
              fontWeight: 800,
              color: COLORS.white,
              textAlign: "center",
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginTop: 8,
              textShadow: "0 2px 8px rgba(0,0,0,0.9)",
            }}
          >
            {label}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

function anchorToStyle(anchor: AnchorPosition, size: number): React.CSSProperties {
  // Inset from frame edges
  const edge = 70;
  switch (anchor) {
    case "topLeft":      return { position: "absolute", top: edge, left: edge };
    case "topCenter":    return { position: "absolute", top: edge, left: "50%", marginLeft: -size / 2 };
    case "topRight":     return { position: "absolute", top: edge, right: edge };
    case "middleLeft":   return { position: "absolute", top: "50%", left: edge, marginTop: -size / 2 };
    case "center":       return { position: "absolute", top: "50%", left: "50%", marginTop: -size / 2, marginLeft: -size / 2 };
    case "middleRight":  return { position: "absolute", top: "50%", right: edge, marginTop: -size / 2 };
    case "bottomLeft":   return { position: "absolute", bottom: edge, left: edge };
    case "bottomCenter": return { position: "absolute", bottom: edge, left: "50%", marginLeft: -size / 2 };
    case "bottomRight":  return { position: "absolute", bottom: edge, right: edge };
  }
}

const SvgGlyph: React.FC<{
  src: string;
  recolor?: string;
  recolorGradient?: { from: string; to: string; angle?: number };
  fallbackText?: string;
}> = ({ src, recolor, recolorGradient, fallbackText }) => {
  const url = staticFile(src);
  const useFullColor = !recolor && !recolorGradient;

  if (useFullColor) {
    // Full-color SVG via background-image — more reliable in headless
    // Chromium than <img> tag for SVG sources.
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundImage: `url(${url})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "contain",
          borderRadius: 12,
        }}
      />
    );
  }

  const fill: React.CSSProperties = recolorGradient
    ? {
        background: `linear-gradient(${recolorGradient.angle ?? 135}deg, ${
          recolorGradient.from
        } 0%, ${recolorGradient.to} 100%)`,
      }
    : { backgroundColor: recolor };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          ...fill,
          WebkitMaskImage: `url(${url})`,
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          WebkitMaskSize: "contain",
          maskImage: `url(${url})`,
          maskRepeat: "no-repeat",
          maskPosition: "center",
          maskSize: "contain",
        }}
      />
      {fallbackText && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONTS.display,
            fontSize: 24,
            fontWeight: 900,
            color: recolor ?? "#fff",
            opacity: 0,
          }}
        >
          {fallbackText}
        </div>
      )}
    </div>
  );
};
