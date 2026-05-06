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
import { COLORS, FONTS, FPS } from "../lib/constants";
import { SPRINGS } from "../lib/springConfigs";
import { CountUp } from "../components/CountUp";

interface PricingTier {
  /** Brand label (e.g. "DEEPSEEK V4"). */
  label: string;
  /** Logo SVG path (public/refs/<name>.svg). */
  logoSrc: string;
  /** Logo + accent color. */
  accentColor: string;
  /** Optional gradient (overrides single color for the logo recolor). */
  accentGradient?: { from: string; to: string; angle?: number };
  /** Numeric price in USD. */
  price: number;
  /** Unit label (e.g. "per million output tokens"). */
  unit: string;
}

interface PricingCompareSceneProps {
  eyebrow?: string;
  headline?: string;
  /** Left tier card. */
  left: PricingTier;
  /** Right tier card. */
  right: PricingTier;
  /** Big ratio number that slams in between cards (e.g. 8 for "8×"). */
  ratio?: number;
  /** Source attribution text at bottom. */
  source?: string;
}

/**
 * Side-by-side pricing comparison — like a Bloomberg or Stripe pricing
 * graphic. Two cards slide in from opposite sides, big "8×" badge slams
 * in between them.
 *
 * The right (more-expensive) tier renders slightly larger with a coral
 * glow to read as "burning money" vs the left's cool cyan ("good deal").
 */
export const PricingCompareScene: React.FC<PricingCompareSceneProps> = ({
  eyebrow = "Output token pricing",
  headline,
  left,
  right,
  ratio = 8,
  source,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stagger = (delaySec: number) => {
    const local = frame - delaySec * fps;
    const s = spring({
      frame: Math.max(0, local),
      fps,
      config: SPRINGS.snappy,
    });
    return {
      opacity: interpolate(s, [0, 1], [0, 1]),
      y: interpolate(s, [0, 1], [20, 0]),
      progress: s,
    };
  };

  const eyebrowFx = stagger(0.1);
  const headlineFx = stagger(0.25);
  const leftCardFx = stagger(0.4);
  const rightCardFx = stagger(0.55);
  const ratioFx = stagger(1.0);
  const sourceFx = stagger(1.6);

  // Cards slide in from sides
  const leftSlideX = interpolate(leftCardFx.progress, [0, 1], [-80, 0]);
  const rightSlideX = interpolate(rightCardFx.progress, [0, 1], [80, 0]);

  // Big ratio badge slams in with overshoot
  const ratioScale = interpolate(ratioFx.progress, [0, 1], [0.4, 1], {
    easing: Easing.out(Easing.back(2)),
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 30%, #131419 0%, #08090c 70%, #050507 100%)`,
        padding: "100px 60px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Eyebrow */}
      <div
        style={{
          opacity: eyebrowFx.opacity,
          transform: `translateY(${eyebrowFx.y}px)`,
          fontFamily: FONTS.sans,
          fontSize: 22,
          fontWeight: 700,
          color: COLORS.gray,
          letterSpacing: "5px",
          textTransform: "uppercase",
          marginBottom: 16,
        }}
      >
        {eyebrow}
      </div>

      {/* Headline */}
      {headline && (
        <div
          style={{
            opacity: headlineFx.opacity,
            transform: `translateY(${headlineFx.y}px)`,
            fontFamily: FONTS.display,
            fontSize: 84,
            fontWeight: 900,
            color: COLORS.white,
            letterSpacing: "-3px",
            lineHeight: 0.95,
            textTransform: "uppercase",
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          {headline}
        </div>
      )}

      {/* The two cards + ratio badge */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
          width: "100%",
          position: "relative",
        }}
      >
        <PricingCard
          tier={left}
          slideX={leftSlideX}
          opacity={leftCardFx.opacity}
          variant="cool"
        />

        {/* Ratio badge — center, between cards */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) scale(${ratioScale})`,
            opacity: ratioFx.opacity,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.display,
              fontSize: 110,
              fontWeight: 900,
              color: COLORS.highlight,
              letterSpacing: "-4px",
              lineHeight: 1,
              textShadow: `0 0 36px ${COLORS.highlight}aa, 0 0 64px ${COLORS.highlight}55, 0 6px 18px rgba(0,0,0,0.85)`,
            }}
          >
            <CountUp
              from={1}
              to={ratio}
              durationInFrames={Math.round(0.6 * FPS)}
              delay={Math.round(1.0 * FPS)}
            />×
          </div>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 22,
              fontWeight: 800,
              color: COLORS.highlight,
              letterSpacing: "4px",
              textTransform: "uppercase",
              opacity: 0.85,
            }}
          >
            Cheaper
          </div>
        </div>

        <PricingCard
          tier={right}
          slideX={rightSlideX}
          opacity={rightCardFx.opacity}
          variant="hot"
        />
      </div>

      {/* Source attribution */}
      {source && (
        <div
          style={{
            opacity: sourceFx.opacity * 0.6,
            fontFamily: FONTS.sans,
            fontSize: 18,
            color: COLORS.gray,
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginTop: 24,
          }}
        >
          {source}
        </div>
      )}
    </AbsoluteFill>
  );
};

interface PricingCardProps {
  tier: PricingTier;
  slideX: number;
  opacity: number;
  variant: "cool" | "hot";
}

const PricingCard: React.FC<PricingCardProps> = ({
  tier,
  slideX,
  opacity,
  variant,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isHot = variant === "hot";
  const cardWidth = isHot ? 380 : 340;

  // Hot card has a subtle "burning" pulse on the price
  const pulse = isHot ? Math.sin(frame / fps * 2) * 0.5 + 0.5 : 0;

  return (
    <div
      style={{
        width: cardWidth,
        background: `linear-gradient(180deg, rgba(20, 22, 28, 0.92) 0%, rgba(8, 10, 14, 0.95) 100%)`,
        border: `1px solid ${tier.accentColor}55`,
        borderRadius: 24,
        padding: "36px 28px",
        textAlign: "center",
        opacity,
        transform: `translateX(${slideX}px)`,
        boxShadow: `0 14px 48px rgba(0,0,0,0.55), 0 0 ${
          isHot ? 60 + pulse * 20 : 30
        }px ${tier.accentColor}${isHot ? "44" : "22"}`,
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: 80,
          height: 80,
          margin: "0 auto 20px",
          ...(tier.accentGradient
            ? {
                background: `linear-gradient(${
                  tier.accentGradient.angle ?? 135
                }deg, ${tier.accentGradient.from} 0%, ${tier.accentGradient.to} 100%)`,
              }
            : { backgroundColor: tier.accentColor }),
          WebkitMaskImage: `url(${staticFile(tier.logoSrc)})`,
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          WebkitMaskSize: "contain",
          maskImage: `url(${staticFile(tier.logoSrc)})`,
          maskRepeat: "no-repeat",
          maskPosition: "center",
          maskSize: "contain",
        }}
      />

      {/* Brand label */}
      <div
        style={{
          fontFamily: FONTS.display,
          fontSize: 24,
          fontWeight: 900,
          color: COLORS.white,
          letterSpacing: "-0.5px",
          textTransform: "uppercase",
          marginBottom: 28,
        }}
      >
        {tier.label}
      </div>

      {/* Price */}
      <div
        style={{
          fontFamily: FONTS.display,
          fontSize: 76,
          fontWeight: 900,
          color: tier.accentColor,
          letterSpacing: "-2px",
          lineHeight: 1,
          textShadow: `0 0 ${24 + pulse * 12}px ${tier.accentColor}${isHot ? "aa" : "66"}`,
        }}
      >
        ${tier.price.toFixed(2)}
      </div>

      {/* Unit */}
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: 16,
          fontWeight: 600,
          color: COLORS.gray,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          marginTop: 12,
          maxWidth: 260,
          marginLeft: "auto",
          marginRight: "auto",
          lineHeight: 1.4,
        }}
      >
        {tier.unit}
      </div>
    </div>
  );
};
