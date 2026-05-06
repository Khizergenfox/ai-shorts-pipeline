import React from "react";
import { AbsoluteFill, Video, staticFile, useVideoConfig } from "remotion";
import { Scene } from "../../orchestrator/types";
import { Story3DScene } from "./Story3DScene";
import { HeadlineScene } from "./HeadlineScene";
import { NewsArticleScene } from "./NewsArticleScene";
import { MinimalTextScene } from "./MinimalTextScene";
import { WIDTH, HEIGHT } from "../lib/constants";

interface Props {
  scene: Scene;
}

/**
 * AvatarClipScene — plays a HeyGen-generated avatar MP4 (lip-synced to ElevenLabs audio).
 *
 * Modes:
 *   "avatar_fullscreen"     — avatar fills full 9:16 frame (hook/outro)
 *   "avatar_split_3d"       — top 62% = Story3DScene viz, bottom 38% = avatar
 *   "avatar_split_headline" — top 62% = HeadlineScene, bottom 38% = avatar
 *   "avatar_split_news"     — top 62% = NewsArticleScene, bottom 38% = avatar (with startFrom offset)
 *   "avatar_split_minimal"  — top 62% = MinimalTextScene, bottom 38% = avatar (with startFrom offset)
 *
 * For the *_news / *_minimal modes, scene.avatarStartFromSec lets sequential
 * beats share ONE long avatar mp4 — each beat shows its time-slice of the avatar
 * while the top scene content changes. This makes the bottom face look continuous
 * while the top swaps from TechCrunch → Bloomberg → "Not the real signal" etc.
 *
 * The avatar MP4 is muted because the master ElevenLabs audio.mp3 already plays
 * the same audio as the global track. The avatar's mouth IS lip-synced to that
 * audio — HeyGen generated it from the same MP3 we're playing globally.
 */
export const AvatarClipScene: React.FC<Props> = ({ scene }) => {
  // Hook called unconditionally at the top — required by React rules
  const { fps } = useVideoConfig();

  const isSplit3D = scene.type === "avatar_split_3d";
  const isSplitHeadline = scene.type === "avatar_split_headline";
  const isSplitNews = scene.type === "avatar_split_news";
  const isSplitMinimal = scene.type === "avatar_split_minimal";
  const isSplit = isSplit3D || isSplitHeadline || isSplitNews || isSplitMinimal;
  const videoSrc = scene.videoClipPath ? staticFile(scene.videoClipPath) : null;
  const avatarStartFromFrames = Math.round(((scene as any).avatarStartFromSec ?? 0) * fps);

  if (!videoSrc) {
    return (
      <AbsoluteFill style={{ backgroundColor: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#FF5E3A", fontFamily: "monospace", fontSize: 24 }}>
          (avatar clip missing: {(scene as any).id})
        </div>
      </AbsoluteFill>
    );
  }

  if (!isSplit) {
    // Fullscreen avatar mode — supports avatarStartFromSec so two sequential
    // beats can share one avatar mp4 (e.g. b29 minimal_text + b30 avatar_fullscreen
    // → b30 picks up at audio offset where its line begins within the shared mp4).
    return (
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        <Video
          src={videoSrc}
          startFrom={avatarStartFromFrames}
          style={{ width: WIDTH, height: HEIGHT, objectFit: "cover" }}
          muted
        />
      </AbsoluteFill>
    );
  }

  // Splitscreen mode: top 62% story_3d viz, bottom 38% avatar
  const TOP_RATIO = 0.62;
  const topHeight = Math.round(HEIGHT * TOP_RATIO);
  const bottomHeight = HEIGHT - topHeight;

  // No entrance animation on the avatar bottom — when chained across multiple
  // beats (b01→b02→b03), the avatar should appear continuous, not re-enter
  // every beat. Only the avatar mp4 plays naturally.

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {/* Top 62% — Story3D / Headline / News article / Minimal text, clipped */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: WIDTH,
          height: topHeight,
          overflow: "hidden",
        }}
      >
        {isSplitHeadline ? (
          <HeadlineScene
            eyebrow={(scene as any).headlineData?.eyebrow}
            headline={(scene as any).headlineData?.headline ?? ""}
            accentLine={(scene as any).headlineData?.accentLine}
            subcaption={(scene as any).headlineData?.subcaption}
            logoSrc={(scene as any).headlineData?.logoSrc}
            accentColor={(scene as any).headlineData?.accentColor}
          />
        ) : isSplitNews ? (
          <NewsArticleScene scene={scene} />
        ) : isSplitMinimal ? (
          <MinimalTextScene scene={scene} />
        ) : (
          /* Story3DScene renders at full WIDTHxHEIGHT internally; we just clip */
          <Story3DScene scene={scene} />
        )}
      </div>

      {/* Subtle gradient seam between top and bottom (less harsh than a hard line) */}
      <div
        style={{
          position: "absolute",
          top: topHeight - 24,
          left: 0,
          width: WIDTH,
          height: 48,
          background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 60%, rgba(0,0,0,1) 100%)",
          zIndex: 5,
          pointerEvents: "none",
        }}
      />

      {/* Bottom 38% — avatar clip. avatarStartFromSec lets sequential beats
          share ONE long avatar mp4 by each playing a different time-slice. */}
      <div
        style={{
          position: "absolute",
          top: topHeight,
          left: 0,
          width: WIDTH,
          height: bottomHeight,
          overflow: "hidden",
          backgroundColor: "#000",
        }}
      >
        <Video
          src={videoSrc}
          startFrom={Math.round(((scene as any).avatarStartFromSec ?? 0) * fps)}
          style={{
            width: WIDTH,
            height: bottomHeight * 1.4,
            objectFit: "cover",
            objectPosition: "center 30%",
            marginTop: -bottomHeight * 0.2,
          }}
          muted
        />
      </div>
    </AbsoluteFill>
  );
};
