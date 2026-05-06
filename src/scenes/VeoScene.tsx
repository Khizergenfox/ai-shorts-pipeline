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

interface Props {
  scene: Scene;
}

/**
 * VeoScene — renders a Veo-generated cinematic B-roll clip.
 *
 * Two styles (set via scene.clipStyle):
 *   "fullbleed"  — video fills the entire 9:16 frame (default)
 *                  Used for: stock-footage-style visuals (hospital monitor, code screen, city, etc.)
 *   "centered"   — video shown in a rounded center box with black bars top/bottom + italic serif word overlay
 *                  Used for: emotional human moments (person worried, person happy)
 *
 * Caption pill is always rendered by MainVideo.tsx on top — no need to add it here.
 */
export const VeoScene: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const clipStyle = (scene as any).clipStyle ?? "fullbleed";

  // No clip available — show cinematic placeholder
  if (!scene.videoClipPath) {
    return <VeoPlaceholder scene={scene} clipStyle={clipStyle} />;
  }

  if (clipStyle === "centered") {
    return <CenteredClip scene={scene} frame={frame} fps={fps} />;
  }

  return <FullBleedClip scene={scene} />;
};

// ── Full-bleed clip ───────────────────────────────────────────────────────────

function FullBleedClip({ scene }: { scene: Scene }) {
  return (
    <AbsoluteFill>
      <Video
        src={staticFile(scene.videoClipPath!)}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      {/* Subtle gradient vignette at bottom for caption readability */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.6) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
}

// ── Centered clip with black bars + italic serif word overlay ─────────────────

function CenteredClip({
  scene,
  frame,
  fps,
}: {
  scene: Scene;
  frame: number;
  fps: number;
}) {
  const wordOverlay = (scene as any).clipWordOverlay as string | undefined;

  const appear = spring({ frame, fps, config: { damping: 18, stiffness: 70 } });
  const scale = interpolate(appear, [0, 1], [0.92, 1.0]);
  const opacity = appear;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* Centered video box */}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "88%",
            height: "62%",
            borderRadius: 18,
            overflow: "hidden",
            transform: `scale(${scale})`,
            opacity,
            position: "relative",
          }}
        >
          <Video
            src={staticFile(scene.videoClipPath!)}
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          {/* Italic serif word overlaid on the clip */}
          {wordOverlay && (
            <div
              style={{
                position: "absolute",
                bottom: "15%",
                left: 0,
                right: 0,
                textAlign: "center",
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontStyle: "italic",
                fontSize: 72,
                fontWeight: 400,
                color: "#ffffff",
                textShadow: "0 2px 12px rgba(0,0,0,0.8)",
                letterSpacing: "-1px",
              }}
            >
              {wordOverlay}
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ── Placeholder when no Veo clip is available ─────────────────────────────────

function VeoPlaceholder({
  scene,
  clipStyle,
}: {
  scene: Scene;
  clipStyle: string;
}) {
  const prompt = (scene as any).veoPrompt as string | undefined;
  const wordOverlay = (scene as any).clipWordOverlay as string | undefined;
  const iscentered = clipStyle === "centered";

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Subtle film-grain texture via radial gradients */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 30% 40%, rgba(40,40,50,0.8) 0%, transparent 70%), radial-gradient(ellipse at 70% 60%, rgba(30,35,45,0.6) 0%, transparent 70%)",
        }}
      />

      {iscentered ? (
        /* Centered box placeholder */
        <div
          style={{
            width: "88%",
            height: "62%",
            borderRadius: 18,
            backgroundColor: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            position: "relative",
          }}
        >
          <div style={{ fontSize: 48, opacity: 0.4 }}>🎬</div>
          {prompt && (
            <div
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 18,
                textAlign: "center",
                padding: "0 24px",
                fontFamily: "system-ui, sans-serif",
                lineHeight: 1.4,
              }}
            >
              {prompt.slice(0, 80)}...
            </div>
          )}
          {wordOverlay && (
            <div
              style={{
                position: "absolute",
                bottom: "15%",
                fontFamily: "Georgia, serif",
                fontStyle: "italic",
                fontSize: 72,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              {wordOverlay}
            </div>
          )}
        </div>
      ) : (
        /* Full-bleed placeholder */
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            opacity: 0.35,
          }}
        >
          <div style={{ fontSize: 64 }}>🎬</div>
          {prompt && (
            <div
              style={{
                color: "#ffffff",
                fontSize: 22,
                textAlign: "center",
                padding: "0 48px",
                fontFamily: "system-ui, sans-serif",
                lineHeight: 1.5,
                maxWidth: 500,
              }}
            >
              {prompt.slice(0, 100)}
            </div>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
}
