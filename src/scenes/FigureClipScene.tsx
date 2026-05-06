import React from "react";
import {
  AbsoluteFill,
  Video,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { Scene } from "../../orchestrator/types";
import { COLORS, FONTS } from "../lib/constants";

interface Props {
  scene: Scene;
}

/**
 * FigureClipScene — full-bleed cinematic Veo clip of a named figure
 * (e.g. Sam Altman, Sundar Pichai, Jensen Huang) with a Bloomberg-style
 * name lower-third so the audience instantly knows who they're seeing.
 *
 * Layout (default `style: "fullbleed"`):
 *   ┌─────────────────────┐
 *   │  Veo clip fills     │
 *   │  the whole frame    │
 *   │                     │
 *   │  ▌ SAM ALTMAN       │   ← coral side bar + name (lower-third)
 *   │     CEO, OPENAI     │
 *   └─────────────────────┘
 *
 * Layout when `style: "split"`:
 *   ┌─────────────────────┐
 *   │  Veo clip (top 55%) │
 *   │ ─ ─ coral line ─ ─  │
 *   │  Bottom slot for    │   ← creator can drop A-roll later, or
 *   │  creator's A-roll   │     Story3D fallback runs here
 *   └─────────────────────┘
 *
 * Reads from scene.figureData:
 *   {
 *     videoSrc: "sessions/<id>/veo-clips/<slot>.mp4",
 *     titleLine: "SAM ALTMAN  ·  CEO, OPENAI",
 *     style?: "fullbleed" | "split",
 *     duotone?: boolean,    // editorial coral wash
 *   }
 */
export const FigureClipScene: React.FC<Props> = ({ scene }) => {
  const fd = (scene as any).figureData as
    | {
        videoSrc: string;
        titleLine: string;
        style?: "fullbleed" | "split";
        duotone?: boolean;
        bottomVideoSrc?: string; // optional creator A-roll for split mode
      }
    | undefined;

  if (!fd?.videoSrc) {
    return <FigurePlaceholder titleLine={fd?.titleLine ?? "FIGURE"} />;
  }

  const style = fd.style ?? "fullbleed";

  if (style === "split") {
    return <SplitFigure fd={fd} />;
  }
  return <FullBleedFigure fd={fd} />;
};

// ── Full-bleed figure with lower-third ───────────────────────────────────────

function FullBleedFigure({
  fd,
}: {
  fd: { videoSrc: string; titleLine: string; duotone?: boolean };
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Lower-third slides up from the bottom
  const lowerThirdAppear = spring({
    frame: frame - 8,
    fps,
    config: { damping: 18, stiffness: 80 },
  });
  const lowerThirdY = interpolate(lowerThirdAppear, [0, 1], [60, 0]);
  const lowerThirdOpacity = lowerThirdAppear;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Video
        src={staticFile(fd.videoSrc)}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: fd.duotone ? "grayscale(0.55) contrast(1.08)" : "none",
        }}
      />

      {/* Editorial coral wash for duotone treatment */}
      {fd.duotone && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at 70% 30%, rgba(255,94,58,0.28) 0%, transparent 60%)`,
            mixBlendMode: "multiply",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Bottom gradient for legibility */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, transparent 55%, rgba(0,0,0,0.7) 88%, rgba(0,0,0,0.85) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Lower third: coral bar + name */}
      <div
        style={{
          position: "absolute",
          left: 56,
          right: 56,
          bottom: 280, // sits above the karaoke caption band
          transform: `translateY(${lowerThirdY}px)`,
          opacity: lowerThirdOpacity,
          display: "flex",
          alignItems: "stretch",
          gap: 18,
        }}
      >
        <div
          style={{
            width: 8,
            backgroundColor: COLORS.coral,
            borderRadius: 4,
            boxShadow: "0 0 18px rgba(255,94,58,0.55)",
          }}
        />
        <div
          style={{
            backgroundColor: "rgba(10,10,10,0.78)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "14px 22px",
            borderRadius: 6,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <TitleSplit line={fd.titleLine} />
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── Split figure: top = clip, bottom = creator slot ──────────────────────────

function SplitFigure({
  fd,
}: {
  fd: {
    videoSrc: string;
    titleLine: string;
    duotone?: boolean;
    bottomVideoSrc?: string;
  };
}) {
  const TOP_FRACTION = 0.58;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Top: figure clip */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: `${TOP_FRACTION * 100}%`,
          overflow: "hidden",
        }}
      >
        <Video
          src={staticFile(fd.videoSrc)}
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: fd.duotone ? "grayscale(0.55) contrast(1.08)" : "none",
          }}
        />
        {/* Lower-third inside top slot */}
        <div
          style={{
            position: "absolute",
            left: 32,
            bottom: 24,
            display: "flex",
            alignItems: "stretch",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 6,
              backgroundColor: COLORS.coral,
              borderRadius: 3,
            }}
          />
          <div
            style={{
              backgroundColor: "rgba(10,10,10,0.78)",
              padding: "10px 16px",
              borderRadius: 4,
            }}
          >
            <TitleSplit line={fd.titleLine} compact />
          </div>
        </div>
      </div>

      {/* Coral divider */}
      <div
        style={{
          position: "absolute",
          top: `${TOP_FRACTION * 100}%`,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: COLORS.coral,
          boxShadow: "0 0 24px rgba(255,94,58,0.45)",
        }}
      />

      {/* Bottom: creator A-roll OR styled placeholder */}
      <div
        style={{
          position: "absolute",
          top: `calc(${TOP_FRACTION * 100}% + 3px)`,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#0a0a0a",
          overflow: "hidden",
        }}
      >
        {fd.bottomVideoSrc ? (
          <Video
            src={staticFile(fd.bottomVideoSrc)}
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <CreatorSlotPlaceholder />
        )}
      </div>
    </AbsoluteFill>
  );
}

// ── Title splitter: "SAM ALTMAN  ·  CEO, OPENAI" → big name + thin role ──────

function TitleSplit({ line, compact = false }: { line: string; compact?: boolean }) {
  const parts = line.split(/\s*·\s*/);
  const name = parts[0] ?? line;
  const role = parts.slice(1).join(" · ");
  return (
    <>
      <div
        style={{
          fontFamily: FONTS.sans,
          fontWeight: 900,
          fontSize: compact ? 26 : 38,
          letterSpacing: "1.5px",
          color: "#fff",
          lineHeight: 1.0,
        }}
      >
        {name}
      </div>
      {role && (
        <div
          style={{
            fontFamily: FONTS.sans,
            fontWeight: 500,
            fontSize: compact ? 14 : 18,
            letterSpacing: "1.5px",
            color: COLORS.coral,
            marginTop: compact ? 4 : 6,
            textTransform: "uppercase",
          }}
        >
          {role}
        </div>
      )}
    </>
  );
}

// ── Placeholders ─────────────────────────────────────────────────────────────

function CreatorSlotPlaceholder() {
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 50% 60%, rgba(255,94,58,0.12) 0%, transparent 70%), #0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: 20,
          fontWeight: 600,
          color: "rgba(255,255,255,0.25)",
          letterSpacing: "3px",
          textTransform: "uppercase",
        }}
      >
        ⏵  A-ROLL  SLOT
      </div>
    </AbsoluteFill>
  );
}

function FigurePlaceholder({ titleLine }: { titleLine: string }) {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div style={{ fontSize: 56, opacity: 0.35 }}>🎬</div>
      <div
        style={{
          fontFamily: FONTS.sans,
          fontWeight: 800,
          color: "rgba(255,255,255,0.4)",
          fontSize: 24,
          letterSpacing: "2px",
        }}
      >
        {titleLine}
      </div>
      <div
        style={{
          fontFamily: FONTS.sans,
          color: "rgba(255,255,255,0.2)",
          fontSize: 14,
          marginTop: 8,
          letterSpacing: "1.5px",
        }}
      >
        Run gen-veo-figure.mjs to generate this clip
      </div>
    </AbsoluteFill>
  );
}
