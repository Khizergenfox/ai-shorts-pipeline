import React from "react";
import {
  AbsoluteFill,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { COLORS, FONTS } from "../lib/constants";

interface PortraitInsertProps {
  src: string;
  startFrame: number;
  /** How long the portrait stays visible in frames. Default 60 ≈ 2s. */
  durationFrames?: number;
  name: string;
  subtitle?: string;
  /** Kept for backward-compatibility with the spec; new design ignores side. */
  side?: "left" | "right";
}

/**
 * Editorial portrait insert — a SQUARE card that rises from the bottom of
 * the frame, holds, then descends. Sized for face photos (square aspect
 * fits portraits naturally without cropping the face).
 *
 * Layered treatment:
 *   1. Card backdrop: dark navy + coral radial gradient (this is the
 *      visible state when no photo file exists — looks intentional)
 *   2. Photo (background-image, cover): the user-supplied portrait
 *   3. Duotone overlay: coral × multiply blend so the photo feels lit
 *      by the same scene's accent palette
 *   4. Vignette: pushes attention to the face
 *   5. Coral edge accent + drop shadow: card feels physical
 *   6. Caption below: eyebrow + big name
 *
 * If `public/refs/xi.jpg` (or whatever src) doesn't exist, the photo
 * layer is invisible — but the coral radial gradient backdrop still
 * reads as a meaningful "subject card" with the name. No empty hole.
 */
export const PortraitInsert: React.FC<PortraitInsertProps> = ({
  src,
  startFrame,
  durationFrames = 60,
  name,
  subtitle,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const localFrame = frame - startFrame;
  if (localFrame < -2 || localFrame > durationFrames + 2) return null;

  // Card sizing: square at ~58% of frame width
  const cardSize = Math.round(width * 0.58);

  // Rise from bottom
  const riseFrames = 14;
  const fallFrames = 14;

  const rise = spring({
    frame: Math.max(0, localFrame),
    fps,
    config: { damping: 16, stiffness: 130, mass: 0.7 },
    durationInFrames: riseFrames,
  });
  const risePct = interpolate(rise, [0, 1], [120, 0]); // off-frame → settled

  const fallT = localFrame - (durationFrames - fallFrames);
  const fallPct = interpolate(fallT, [0, fallFrames], [0, 130], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.6, 0, 0.8, 0.4),
  });
  const yPct = fallT > 0 ? fallPct : risePct;

  // Caption fades in slightly after the card lands
  const captionFade = spring({
    frame: Math.max(0, localFrame - 8),
    fps,
    config: { damping: 16, stiffness: 180, mass: 0.5 },
    durationInFrames: 12,
  });
  const captionFadeOut = interpolate(
    fallT,
    [0, fallFrames - 4],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const captionOpacity = Math.min(captionFade, captionFadeOut);

  const url = staticFile(src);

  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 60 }}>
      {/* Card — anchored slightly above middle, rises from below */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          marginLeft: -cardSize / 2,
          width: cardSize,
          height: cardSize,
          transform: `translateY(${yPct}%)`,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: `0 18px 60px rgba(0,0,0,0.7), 0 0 60px ${COLORS.accent}33`,
          border: `1px solid ${COLORS.accent}66`,
        }}
      >
        {/* Layer 1: backdrop (visible if photo missing — coral name plate) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at 50% 30%, ${COLORS.accent}88 0%, ${COLORS.accent}33 35%, #1a0e10 75%, #0a0a0e 100%)`,
          }}
        />

        {/* Layer 2: photo (cover) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${url})`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center 30%",
            backgroundSize: "cover",
            filter: "grayscale(0.85) contrast(1.25) brightness(0.82)",
          }}
        />

        {/* Layer 3: coral duotone wash (multiply) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, ${COLORS.accent}55 0%, #1a1a22 100%)`,
            mixBlendMode: "multiply",
            pointerEvents: "none",
          }}
        />

        {/* Layer 4: warm side-light wash (screen) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at 30% 25%, ${COLORS.accent}50 0%, transparent 55%)`,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />

        {/* Layer 5: heavy vignette */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 35%, transparent 30%, rgba(0,0,0,0.85) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Layer 6: subtle inner border highlight */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px ${COLORS.accent}33`,
            pointerEvents: "none",
            borderRadius: 20,
          }}
        />

        {/* Empty-state name plate: dominant typography rendered BEHIND the
            photo layer. If a photo exists at `src`, the photo's grayscale
            cover-fit obscures this. If not, this reads as an intentional
            editorial name plate, not a missing-photo placeholder. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: -2,
            padding: cardSize * 0.08,
          }}
        >
          {/* Stylized silhouette ring (subject icon) */}
          <div
            style={{
              width: cardSize * 0.32,
              height: cardSize * 0.32,
              borderRadius: "50%",
              border: `3px solid ${COLORS.accent}`,
              boxShadow: `0 0 28px ${COLORS.accent}88, inset 0 0 24px ${COLORS.accent}55`,
              marginBottom: cardSize * 0.05,
              background: `radial-gradient(circle, ${COLORS.accent}33 0%, transparent 70%)`,
              opacity: 0.85,
            }}
          />
          {/* Big stacked name */}
          <div
            style={{
              fontFamily: FONTS.display,
              fontSize: cardSize * 0.16,
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "-3px",
              textTransform: "uppercase",
              lineHeight: 0.92,
              textAlign: "center",
              textShadow: `0 0 32px ${COLORS.accent}aa, 0 4px 16px rgba(0,0,0,0.85)`,
              opacity: 0.95,
            }}
          >
            {name.split(" ").map((part, i) => (
              <div key={i}>{part}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Caption backdrop — subtle dark gradient strip so the name reads
          clean over the network's glowing nodes behind */}
      <div
        style={{
          position: "absolute",
          top: `calc(20% + ${cardSize}px)`,
          left: 0,
          right: 0,
          height: 200,
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)",
          opacity: captionOpacity,
          pointerEvents: "none",
        }}
      />

      {/* Caption block — eyebrow + big name, BELOW the card */}
      <div
        style={{
          position: "absolute",
          top: `calc(20% + ${cardSize}px + 24px)`,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: captionOpacity,
          transform: `translateY(${interpolate(captionFade, [0, 1], [16, 0])}px)`,
        }}
      >
        {/* Coral accent line above caption */}
        <div
          style={{
            width: 60,
            height: 3,
            background: COLORS.accent,
            margin: "0 auto 14px",
            borderRadius: 2,
            boxShadow: `0 0 12px ${COLORS.accent}`,
          }}
        />
        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: 22,
            fontWeight: 700,
            color: COLORS.accent,
            letterSpacing: "5px",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          {subtitle ?? "Profile"}
        </div>
        <div
          style={{
            fontFamily: FONTS.display,
            fontSize: 64,
            fontWeight: 900,
            color: COLORS.white,
            letterSpacing: "-2px",
            lineHeight: 0.95,
            textTransform: "uppercase",
            textShadow: "0 4px 18px rgba(0,0,0,0.85)",
          }}
        >
          {name}
        </div>
      </div>
    </AbsoluteFill>
  );
};
