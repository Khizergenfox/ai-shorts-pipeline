import React, { useEffect, useState } from "react";
import {
  AbsoluteFill, Audio, Sequence,
  delayRender, continueRender, staticFile,
  useCurrentFrame, interpolate, useVideoConfig
} from "remotion";
import { VideoSpec, Scene } from "../../orchestrator/types";
import { COLORS, FPS } from "../lib/constants";

// Global effects (kept lean — clean editorial look, no neon decoration)
import { FilmGrain } from "../effects/FilmGrain";
import { SceneTransition } from "../effects/SceneTransition";
import { BeatPulse } from "../effects/BeatPulse";
import { ContextOverlay } from "../components/ContextOverlay";
import { PortraitInsert } from "../components/PortraitInsert";

// Scene components
import { FullScreenScroll } from "../scenes/FullScreenScroll";
import { GitHubScene } from "../scenes/GitHubScene";
import { TerminalScene } from "../scenes/TerminalScene";
import { InfographicScene } from "../scenes/InfographicScene";
import { TalkingHeadScene } from "../scenes/TalkingHeadScene";
import { TextSlideScene } from "../scenes/TextSlideScene";
import { SplitScreen } from "../scenes/SplitScreen";
import { RedditScene } from "../scenes/RedditScene";
import { ClaudeChatScene } from "../scenes/ClaudeChatScene";
import { TokenCounterScene } from "../scenes/TokenCounterScene";
import { DataTableScene } from "../scenes/DataTableScene";
import { LogoGridScene } from "../scenes/LogoGridScene";
import { StatTripleScene } from "../scenes/StatTripleScene";
import { ScreenshotScene } from "../scenes/ScreenshotScene";
import { BeigeIllustrationScene } from "../scenes/BeigeIllustrationScene";
import { VeoScene } from "../scenes/VeoScene";
import { ShaderTextScene } from "../scenes/ShaderTextScene";
import { Story3DScene } from "../scenes/Story3DScene";
import { HeadlineScene } from "../scenes/HeadlineScene";
import { PricingCompareScene } from "../scenes/PricingCompareScene";
import { TakeawayScene } from "../scenes/TakeawayScene";
import { BulletListScene } from "../scenes/BulletListScene";
import { FigureClipScene } from "../scenes/FigureClipScene";
import { MinimalTextScene } from "../scenes/MinimalTextScene";
import { StatRevealScene } from "../scenes/StatRevealScene";
import { NewsArticleScene } from "../scenes/NewsArticleScene";
import { ClaudeUiZoomScene } from "../scenes/ClaudeUiZoomScene";
import { GithubReadmeScene } from "../scenes/GithubReadmeScene";
import { ClaudeChatMockupScene } from "../scenes/ClaudeChatMockupScene";
import { CampaignLaunchScene } from "../scenes/CampaignLaunchScene";
import { PipeboardMockupScene } from "../scenes/PipeboardMockupScene";
import { ClaudeDesktopMockupScene } from "../scenes/ClaudeDesktopMockupScene";
import { MetaFormScene } from "../scenes/MetaFormScene";
import { AvatarClipScene } from "../scenes/AvatarClipScene";
import { ClaudeRefusalMockupScene } from "../scenes/ClaudeRefusalMockupScene";
import { BenchmarkLeaderboardScene } from "../scenes/BenchmarkLeaderboardScene";
import { CompanyValueChartScene } from "../scenes/CompanyValueChartScene";
import { SafetyLevelsScene } from "../scenes/SafetyLevelsScene";
import { ImageGenRaceScene } from "../scenes/ImageGenRaceScene";
import { AgentTerminalScene } from "../scenes/AgentTerminalScene";
import { SplitDualWorkflowScene } from "../scenes/SplitDualWorkflowScene";
import { NegationRevealScene } from "../scenes/NegationRevealScene";

/**
 * Pick the right SFX for a scene cut. Maps scene type/variant to one of
 * the 4 synthesized SFX files in public/sfx/:
 *   - thump.mp3   — heavy impact (hook intro, big stat reveals, takeaway)
 *   - riser.mp3   — atmospheric/cinematic builds (Veo b-roll, sonar pulse)
 *   - click.mp3   — decisive ticks (numbered bullet items)
 *   - whoosh.mp3  — default cut between general scenes
 */
function pickSfx(scene: Scene, isFirst: boolean): string {
  // Per-beat override wins
  if (scene.sfx) return scene.sfx;

  if (isFirst) return "thump.mp3";

  const variant = (scene as any).storyVariant as string | undefined;

  // Heavy-impact reveals get a thump
  if (scene.type === "stat_reveal") return "thump.mp3";
  if (scene.type === "takeaway_card") return "thump.mp3";
  // story_3d "impact" variants get the thump too — extend this list as you
  // add custom 3D variants. (Default story_3d falls through to whoosh below.)
  if (scene.type === "story_3d" && (scene as any).sfxImpact === true) {
    return "thump.mp3";
  }

  // Numbered list items get a decisive click
  if (scene.type === "bullet_list") return "click.mp3";

  // Atmospheric cinematics get a slow riser
  if (scene.type === "veo_clip" || scene.type === "figure_clip") return "riser.mp3";
  if (scene.type === "story_3d" && variant === "sonar_pulse") return "riser.mp3";

  // Everything else (news_article, headline_card, minimal_text, other 3D) gets the whoosh
  return "whoosh.mp3";
}

function SceneComponent({ scene }: { scene: Scene }) {
  switch (scene.type) {
    case "veo_clip":             return <VeoScene scene={scene} />;
    case "screenshot":          return <ScreenshotScene scene={scene} />;
    case "beige_illustration":  return <BeigeIllustrationScene scene={scene} />;
    case "terminal":            return <TerminalScene scene={scene} />;
    case "reddit_native":       return <RedditScene scene={scene} />;
    case "claude_native":       return <ClaudeChatScene scene={scene} />;
    case "text_card":           return <TextSlideScene scene={scene} />;
    case "shader_bg":           return <ShaderTextScene scene={scene} />;
    case "story_3d":            return <Story3DScene scene={scene} />;
    case "headline_card":       return scene.headlineData ? <HeadlineScene {...scene.headlineData} /> : null;
    case "pricing_compare":     return scene.pricingData ? <PricingCompareScene {...scene.pricingData} /> : null;
    case "takeaway_card":       return scene.takeawayData ? <TakeawayScene {...scene.takeawayData} /> : null;
    case "bullet_list":         return scene.bulletData ? <BulletListScene {...scene.bulletData} /> : null;
    case "figure_clip":         return <FigureClipScene scene={scene} />;
    case "minimal_text":        return <MinimalTextScene scene={scene} />;
    case "stat_reveal":         return <StatRevealScene scene={scene} />;
    case "news_article":        return <NewsArticleScene scene={scene} />;
    case "claude_ui_zoom":      return <ClaudeUiZoomScene scene={scene} />;
    case "github_readme":       return <GithubReadmeScene scene={scene} />;
    case "claude_chat_mockup":  return <ClaudeChatMockupScene scene={scene} />;
    case "campaign_launch":     return <CampaignLaunchScene scene={scene} />;
    case "pipeboard_mockup":    return <PipeboardMockupScene scene={scene} />;
    case "claude_desktop_mockup": return <ClaudeDesktopMockupScene scene={scene} />;
    case "meta_form":           return <MetaFormScene scene={scene} />;
    case "avatar_fullscreen":     return <AvatarClipScene scene={scene} />;
    case "avatar_split_3d":       return <AvatarClipScene scene={scene} />;
    case "avatar_split_headline": return <AvatarClipScene scene={scene} />;
    case "avatar_split_news":     return <AvatarClipScene scene={scene} />;
    case "avatar_split_minimal":  return <AvatarClipScene scene={scene} />;
    case "claude_refusal_mockup": return <ClaudeRefusalMockupScene scene={scene} />;
    case "benchmark_leaderboard": return <BenchmarkLeaderboardScene scene={scene} />;
    case "company_value_chart":   return <CompanyValueChartScene scene={scene} />;
    case "safety_levels":         return <SafetyLevelsScene scene={scene} />;
    case "image_gen_race":        return <ImageGenRaceScene scene={scene} />;
    case "agent_terminal":        return <AgentTerminalScene scene={scene} />;
    case "split_dual_workflow":   return <SplitDualWorkflowScene scene={scene} />;
    case "negation_reveal":       return <NegationRevealScene scene={scene} />;
    case "data_table":          return <DataTableScene scene={scene} />;
    // Legacy
    case "full_scroll":         return <FullScreenScroll scene={scene} />;
    case "github":              return <GitHubScene scene={scene} />;
    case "infographic":         return <InfographicScene scene={scene} />;
    case "talking_head":        return <TalkingHeadScene scene={scene} />;
    case "text_slide":          return <TextSlideScene scene={scene} />;
    case "split_screen":        return <SplitScreen scene={scene} />;
    case "reddit_card":         return <RedditScene scene={scene} />;
    case "claude_chat":         return <ClaudeChatScene scene={scene} />;
    case "token_counter":       return <TokenCounterScene scene={scene} />;
    case "logo_grid":           return <LogoGridScene scene={scene} />;
    case "stat_triple":         return <StatTripleScene scene={scene} />;
    default:                    return <AbsoluteFill style={{ backgroundColor: COLORS.bgDark }} />;
  }
}

/**
 * Zoom wrapper — applies a smooth scale+translate animation over the scene duration.
 * Used for Ken Burns effect on full-bleed assets.
 */
function ZoomedScene({
  scene,
  durationInFrames,
  children,
}: {
  scene: Scene;
  durationInFrames: number;
  children: React.ReactNode;
}) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const zoom = scene.zoom;

  if (!zoom) return <>{children}</>;

  const { fromScale, toScale, focusX, focusY } = zoom;

  const scale = interpolate(frame, [0, durationInFrames], [fromScale, toScale], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateX = (0.5 - focusX) * (scale - 1) * width;
  const translateY = (0.5 - focusY) * (scale - 1) * height;

  return (
    <AbsoluteFill
      style={{
        transform: `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`,
        transformOrigin: "center center",
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

interface MainVideoProps { specPath?: string; }

export const MainVideo: React.FC<MainVideoProps> = ({ specPath = "sessions/mock/spec.json" }) => {
  const [spec, setSpec] = useState<VideoSpec | null>(null);
  const [handle] = useState(() => delayRender("Loading video spec"));

  useEffect(() => {
    fetch(staticFile(specPath))
      .then((r) => r.json())
      .then((data: VideoSpec) => { setSpec(data); continueRender(handle); })
      .catch(() => continueRender(handle));
  }, [handle, specPath]);

  if (!spec) return null;

  // Compute frame offsets from scene durationSeconds (already resolved by orchestrator)
  const frameOffsets: number[] = [];
  let cumulative = 0;
  for (const scene of spec.scenes) {
    frameOffsets.push(cumulative);
    cumulative += Math.round(scene.durationSeconds * FPS);
  }

  // Resolve overlays — translate word-index to frame number using spec.wordTimestamps.
  const resolvedOverlays = (spec.overlays ?? []).map((o, i) => {
    let startSec = o.startSec ?? 0;
    if (o.startWordIndex !== undefined && spec.wordTimestamps[o.startWordIndex]) {
      startSec = spec.wordTimestamps[o.startWordIndex].startTime;
    }
    return {
      key: i,
      src: o.src,
      startFrame: Math.round(startSec * FPS),
      durationFrames: o.durationFrames ?? 24,
      anchor: (o as any).anchor ?? "topRight",
      size: (o as any).size ?? 180,
      recolor: o.recolor,
      recolorGradient: o.recolorGradient,
      label: (o as any).label,
      fallbackText: o.fallbackText,
    };
  });

  // Resolve portrait inserts (editorial side-panel photos at key beats)
  const resolvedPortraits = (spec.portraits ?? []).map((p, i) => {
    let startSec = p.startSec ?? 0;
    if (p.startWordIndex !== undefined && spec.wordTimestamps[p.startWordIndex]) {
      startSec = spec.wordTimestamps[p.startWordIndex].startTime;
    }
    return {
      key: i,
      src: p.src,
      startFrame: Math.round(startSec * FPS),
      durationFrames: p.durationFrames ?? 60,
      name: p.name,
      subtitle: p.subtitle,
      side: p.side ?? "left",
    };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* ── LAYER 0: Master ElevenLabs voice ────────────────────
          Music bed is intentionally NOT baked into the render. For Reels,
          add trending audio at upload time (free Meta licensing). For YT
          Shorts, drop a track at public/music/bed.mp3 and re-enable
          MusicTrack import (we built it but un-wired to avoid breaking
          renders when the file isn't present). */}
      {spec.audioPath && (
        <Audio src={staticFile(spec.audioPath)} startFrom={0} />
      )}

      {/* ── LAYER 2: Scenes (no ambient bg — clean editorial look) ── */}
      {spec.scenes.map((scene, i) => {
        const durationInFrames = Math.round(scene.durationSeconds * FPS);
        const fromFrame = frameOffsets[i];

        // Alternate whip direction by scene index — gives a sense of movement
        const whipDirections = ["left", "right", "up", "down"] as const;
        const whipDirection = whipDirections[i % whipDirections.length];

        return (
          <Sequence
            key={scene.id}
            from={fromFrame}
            durationInFrames={durationInFrames}
            name={scene.id}
          >
            {/* Outer: hard-cut transition (entry punch + exit whip) */}
            <SceneTransition
              durationInFrames={durationInFrames}
              whipDirection={whipDirection}
            >
              {/* Inner: rhythmic beat pulse every ~2.5s within the scene */}
              <BeatPulse durationInFrames={durationInFrames}>
                <ZoomedScene scene={scene} durationInFrames={durationInFrames}>
                  <SceneComponent scene={scene} />
                </ZoomedScene>
              </BeatPulse>
            </SceneTransition>
          </Sequence>
        );
      })}

      {/* ── LAYER 3a: Brand-logo overlays anchored per scene ── */}
      {resolvedOverlays.map((o) => (
        <ContextOverlay
          key={o.key}
          src={o.src}
          startFrame={o.startFrame}
          durationFrames={o.durationFrames}
          anchor={o.anchor}
          size={o.size}
          recolor={o.recolor}
          recolorGradient={o.recolorGradient}
          label={o.label}
          fallbackText={o.fallbackText}
        />
      ))}

      {/* ── LAYER 3b: Editorial portrait inserts (e.g. Xi at China beat) ── */}
      {resolvedPortraits.map((p) => (
        <PortraitInsert
          key={p.key}
          src={p.src}
          startFrame={p.startFrame}
          durationFrames={p.durationFrames}
          name={p.name}
          subtitle={p.subtitle}
          side={p.side}
        />
      ))}

      {/* ── LAYER 4: SFX layer — scene-aware SFX on every cut ──
          The SFX is picked from {thump, whoosh, click, riser} based on
          the scene's type/variant so 29 cuts don't all sound identical. */}
      {spec.scenes.map((scene, i) => {
        const startFrame = frameOffsets[i];
        const sfxFile = pickSfx(scene, i === 0);
        return (
          <Sequence
            key={`sfx-${i}`}
            from={startFrame}
            durationInFrames={Math.round(0.7 * FPS)}
            name={`sfx-${i}-${sfxFile}`}
            layout="none"
          >
            <Audio src={staticFile(`sfx/${sfxFile}`)} volume={0.65} />
          </Sequence>
        );
      })}

      {/* ── LAYER 5: Film grain (subtle tactile texture) ───── */}
      <FilmGrain intensity={0.04} speed={1} />
    </AbsoluteFill>
  );
};
