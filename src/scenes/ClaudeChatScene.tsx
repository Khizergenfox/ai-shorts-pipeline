import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { ClaudeChat } from "../components/ClaudeChat";
import { SAFE_AREA, FPS } from "../lib/constants";
import { Scene } from "../../orchestrator/types";

interface ClaudeChatSceneProps { scene: Scene; }

/**
 * ClaudeChatScene
 *
 * Normal mode: shows Claude.ai dark UI with chat messages.
 *
 * Headline overlay mode (when scene.headlineText is set):
 *   - Chat content is dimmed to 30% opacity (stays as background context)
 *   - Large white serif heading appears at top (builds word by word as narration plays)
 *   - salmonHighlightLine: the matching text in the response gets a salmon (#E8907A) highlight box
 *
 * This matches the editing pattern from the reference videos where "Saves almost 75%"
 * appears as a large heading on top of the dimmed Claude response text.
 */
export const ClaudeChatScene: React.FC<ClaudeChatSceneProps> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const data = scene.chatData;

  const hasHeadline = !!scene.headlineText;

  // Headline animation: fade + slide up
  const headlineAppear = spring({
    frame,
    fps,
    config: { damping: 22, stiffness: 90, mass: 0.8 },
  });
  const headlineY = interpolate(headlineAppear, [0, 1], [40, 0]);
  const headlineOpacity = headlineAppear;

  // Scroll for long messages
  const scrollY = data?.scrollPx
    ? interpolate(frame, [0, Math.max(1, fps * scene.durationSeconds)], [0, data.scrollPx], {
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#111111" }}>
      {/* Chat content — dimmed when headline overlay is active */}
      <AbsoluteFill
        style={{
          padding: `${SAFE_AREA.top}px ${SAFE_AREA.left}px`,
          opacity: hasHeadline ? 0.28 : 1,
        }}
      >
        {data && (
          <div style={{ transform: `translateY(-${scrollY}px)` }}>
            <ClaudeChat
              messages={data.messages}
              model={data.model ?? "Claude Sonnet 4.6"}
              revealMode={data.revealMode ?? false}
              salmonHighlightLine={hasHeadline ? scene.salmonHighlightLine : undefined}
            />
          </div>
        )}
      </AbsoluteFill>

      {/* Headline overlay — only shown when headlineText is set */}
      {hasHeadline && (
        <AbsoluteFill
          style={{
            padding: `${SAFE_AREA.top + 24}px 48px 0`,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              transform: `translateY(${headlineY}px)`,
              opacity: headlineOpacity,
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "normal",
              fontWeight: 700,
              fontSize: 72,
              lineHeight: 1.1,
              color: "#ffffff",
              letterSpacing: "-1.5px",
            }}
          >
            {scene.headlineText}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
