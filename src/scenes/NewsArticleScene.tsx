import React from "react";
import {
  AbsoluteFill,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { FONTS } from "../lib/constants";
import { Scene } from "../../orchestrator/types";

interface Props {
  scene: Scene;
}

/**
 * NewsArticleScene — fake-but-realistic news article look.
 *
 * Mimics a real news source (NY Post / TechCrunch / Bloomberg style) so
 * claims in the script feel SOURCED. The signature move is BLACK BLOCK
 * highlights on specific phrases — same technique Varun/Aevy use to draw
 * the eye to the quoted line.
 *
 * Reads from scene.articleData:
 *   {
 *     source: "TECHCRUNCH" | "NEW YORK POST" | "BLOOMBERG" | string,
 *     sourceColor?: "#000" | "#FF6B00" | "#0F1419"   // brand color of the source
 *     eyebrow?: "BREAKING · TODAY"                    // small uppercase tag
 *     headline: "DeepSeek launches V4 model"
 *     byline?: "By Sarah Perez · 2 hrs ago"
 *     body: "Multi-line body text in normal serif..."
 *     blackBlocks?: ["specific phrase to highlight"]   // these get black-block + white-text
 *     strikethrough?: "phrase to cross out in red"     // for the "China is winning" beat
 *     style?: "techcrunch" | "nypost" | "bloomberg" | "neutral"
 *   }
 *
 * Animation: card slides up + scales in with a slight tilt-correction.
 * Black blocks fade in staggered AFTER the body is visible (the eye-direct
 * principle — the editor is telling you which phrase matters).
 */
export const NewsArticleScene: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ad = (scene as any).articleData as
    | {
        source: string;
        sourceColor?: string;
        eyebrow?: string;
        headline: string;
        byline?: string;
        body?: string;
        blackBlocks?: string[];
        strikethrough?: string;
        style?: "techcrunch" | "nypost" | "bloomberg" | "neutral" | "verge" | "wired" | "nytimes" | "anthropic";
      }
    | undefined;

  if (!ad) {
    return (
      <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
        <div style={{ color: "#fff", margin: "auto", opacity: 0.4 }}>
          (NewsArticleScene: missing articleData)
        </div>
      </AbsoluteFill>
    );
  }

  // Card entrance — slides up with a soft spring, very Bloomberg
  const cardAppear = spring({ frame, fps, config: { damping: 22, stiffness: 90 } });
  const cardY = interpolate(cardAppear, [0, 1], [40, 0]);
  const cardScale = interpolate(cardAppear, [0, 1], [0.96, 1]);

  // Black-block highlights fade in slightly later — the eye reads the body first
  const blockAppear = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 18, stiffness: 110 },
  });

  const sourceColor = ad.sourceColor ?? styleSourceColor(ad.style);
  const accent = styleAccent(ad.style);
  const cardBg = styleCardBg(ad.style);
  const headlineFont = styleHeadlineFont(ad.style);
  const headlineSize = styleHeadlineSize(ad.style);
  const headlineWeight = styleHeadlineWeight(ad.style);
  const headlineStyle = styleHeadlineFontStyle(ad.style);
  const bodySize = styleBodySize(ad.style);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 40px",
        transform: "scale(1.15)",
        transformOrigin: "50% 50%",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 980,
          backgroundColor: cardBg,
          borderRadius: 6,
          padding: "56px 56px 64px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.55)",
          opacity: cardAppear,
          transform: `translateY(${cardY}px) scale(${cardScale})`,
          fontFamily: FONTS.sans,
          color: "#0a0a0a",
          position: "relative",
        }}
      >
        {/* Source bar (top) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 14,
            borderBottom: `2px solid ${sourceColor}`,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.display,
              fontWeight: 900,
              fontSize: 32,
              color: sourceColor,
              letterSpacing: ad.style === "nypost" ? "-1px" : "1.5px",
              textTransform: "uppercase",
              fontStyle: ad.style === "nypost" ? "italic" : "normal",
            }}
          >
            {ad.source}
          </div>
          {ad.eyebrow && (
            <div
              style={{
                fontFamily: FONTS.sans,
                fontWeight: 700,
                fontSize: 16,
                color: accent,
                letterSpacing: "2.5px",
                textTransform: "uppercase",
              }}
            >
              {ad.eyebrow}
            </div>
          )}
        </div>

        {/* Headline — font/size/weight varies per source style */}
        <div
          style={{
            fontFamily: headlineFont,
            fontWeight: headlineWeight,
            fontStyle: headlineStyle,
            fontSize: headlineSize,
            lineHeight: 1.04,
            letterSpacing: ad.style === "nypost" ? "-2px" : "-1.5px",
            color: "#0a0a0a",
            marginBottom: 22,
            position: "relative",
            textTransform: ad.style === "nypost" ? "uppercase" : "none",
          }}
        >
          {ad.strikethrough ? (
            highlightPhrases(ad.headline, [], ad.strikethrough, accent, blockAppear)
          ) : (
            ad.headline
          )}
        </div>

        {/* Byline */}
        {ad.byline && (
          <div
            style={{
              fontFamily: FONTS.sans,
              fontWeight: 500,
              fontSize: 17,
              color: "#5a5a5a",
              marginBottom: 30,
              letterSpacing: "0.2px",
            }}
          >
            {ad.byline}
          </div>
        )}

        {/* Body text */}
        {ad.body && (
          <div
            style={{
              fontFamily: ad.style === "bloomberg" ? FONTS.sans : "Georgia, 'Times New Roman', serif",
              fontSize: bodySize,
              fontWeight: ad.style === "bloomberg" ? 400 : 400,
              lineHeight: 1.5,
              color: "#1a1a1a",
              letterSpacing: "0.1px",
            }}
          >
            {highlightPhrases(
              ad.body,
              ad.blackBlocks ?? [],
              undefined,
              accent,
              blockAppear,
            )}
          </div>
        )}

        {/* Tiny page footer accent — feels real */}
        <div
          style={{
            marginTop: 40,
            paddingTop: 16,
            borderTop: "1px solid #d8d4ca",
            display: "flex",
            justifyContent: "space-between",
            fontFamily: FONTS.sans,
            fontSize: 12,
            color: "#888",
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          <span>{ad.source}</span>
          <span>1 / 1</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Phrase highlighting (black blocks + optional red strikethrough) ───────

function highlightPhrases(
  text: string,
  blackBlocks: string[],
  strikethrough: string | undefined,
  accent: string,
  appear: number,
): React.ReactNode {
  // Build a regex that splits the text on any of the highlight phrases,
  // keeping the captured groups so we know which span hit.
  const allPhrases = [...blackBlocks, ...(strikethrough ? [strikethrough] : [])];
  if (allPhrases.length === 0) return text;

  // Escape regex special chars and build alternation
  const escaped = allPhrases.map((p) => escapeRegex(p));
  const re = new RegExp(`(${escaped.join("|")})`, "gi");

  const parts = text.split(re);

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;
        const lower = part.toLowerCase();
        const isBlock = blackBlocks.some((b) => b.toLowerCase() === lower);
        const isStrike = strikethrough && strikethrough.toLowerCase() === lower;

        if (isStrike) {
          return (
            <span
              key={i}
              style={{
                position: "relative",
                color: "#0a0a0a",
                opacity: 0.88,
              }}
            >
              {part}
              {/* Hand-drawn-feel red strikethrough that draws in over time */}
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: "55%",
                  height: 6,
                  backgroundColor: accent,
                  transformOrigin: "left center",
                  transform: `scaleX(${appear})`,
                  borderRadius: 3,
                  boxShadow: `0 1px 0 ${accent}, 0 0 12px ${accent}66`,
                }}
              />
            </span>
          );
        }

        if (isBlock) {
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                backgroundColor: "#0a0a0a",
                color: "#fff",
                padding: "2px 12px",
                marginRight: 2,
                marginLeft: 2,
                borderRadius: 2,
                opacity: appear,
                transform: `scale(${interpolate(appear, [0, 1], [0.95, 1])})`,
                transformOrigin: "left center",
              }}
            >
              {part}
            </span>
          );
        }

        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function styleSourceColor(style?: string): string {
  switch (style) {
    case "techcrunch": return "#0A9F4F";
    case "nypost":     return "#cc0000";
    case "bloomberg":  return "#000000";
    case "verge":      return "#E03E2C";   // red/black editorial
    case "wired":      return "#000000";   // black logo, content uses teal accent
    case "nytimes":    return "#000000";   // classic black
    case "anthropic":  return "#D97757";   // Anthropic coral
    default:           return "#0a0a0a";
  }
}

function styleAccent(style?: string): string {
  switch (style) {
    case "techcrunch": return "#0A9F4F";
    case "nypost":     return "#cc0000";
    case "bloomberg":  return "#FF6B00";
    case "verge":      return "#E03E2C";   // red accents
    case "wired":      return "#00A6A6";   // teal accent
    case "nytimes":    return "#000000";   // black accents (classic)
    case "anthropic":  return "#D97757";
    default:           return "#FF5E3A";
  }
}

// ── Per-style layout differentiation ────────────────────────────────────
// Each style maps to a recognizable editorial archetype (tabloid / terminal
// / web mag / classic newspaper / clean blog) so b16-b19 read as distinctly
// different sources at a glance — even though all are scene mockups, never
// copy of any specific publication's actual content.

function styleCardBg(style?: string): string {
  switch (style) {
    case "bloomberg": return "#fff8eb";
    case "nypost":    return "#ffffff";
    case "techcrunch":return "#fbfaf6";
    case "verge":     return "#f6f3eb";   // warm off-white with vintage feel
    case "wired":     return "#0a0a0a";   // dark mode magazine
    case "nytimes":   return "#fbfaf2";   // newspaper cream
    case "anthropic": return "#f8f4ed";   // Anthropic blog cream/clay
    default:          return "#fbfaf6";
  }
}

function styleHeadlineFont(style?: string): string {
  switch (style) {
    case "bloomberg": return "Helvetica, Arial, sans-serif";
    case "nypost":    return "'Impact', 'Arial Black', sans-serif";
    case "techcrunch":return "Georgia, 'Times New Roman', serif";
    case "verge":     return "Georgia, 'Times New Roman', serif";  // Verge uses serif headlines
    case "wired":     return "Georgia, 'Times New Roman', serif";  // Wired Headline serif
    case "nytimes":   return "Georgia, 'Times New Roman', serif";  // Cheltenham-ish
    case "anthropic": return "Georgia, 'Times New Roman', serif";  // editorial blog serif
    default:          return "Georgia, 'Times New Roman', serif";
  }
}

function styleHeadlineSize(style?: string): number {
  switch (style) {
    case "bloomberg": return 56;
    case "nypost":    return 92;
    case "techcrunch":return 64;
    case "verge":     return 76;
    case "wired":     return 70;
    case "nytimes":   return 80;
    case "anthropic": return 60;   // Anthropic blog reads quieter
    default:          return 70;
  }
}

function styleHeadlineWeight(style?: string): number {
  switch (style) {
    case "bloomberg": return 700;
    case "nypost":    return 900;
    case "techcrunch":return 700;
    case "verge":     return 800;
    case "wired":     return 700;
    case "nytimes":   return 700;
    case "anthropic": return 600;
    default:          return 700;
  }
}

function styleHeadlineFontStyle(style?: string): "normal" | "italic" {
  return style === "nypost" ? "italic" : "normal";
}

function styleBodySize(style?: string): number {
  switch (style) {
    case "bloomberg": return 24;
    case "nypost":    return 26;
    case "techcrunch":return 28;
    case "verge":     return 26;
    case "wired":     return 24;
    case "nytimes":   return 26;
    case "anthropic": return 26;
    default:          return 28;
  }
}
