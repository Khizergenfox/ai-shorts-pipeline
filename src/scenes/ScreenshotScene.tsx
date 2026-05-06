import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { Scene } from "../../orchestrator/types";
import { COLORS } from "../lib/constants";

interface Props { scene: Scene; }

/**
 * Full-screen screenshot scene.
 * Shows a Puppeteer-captured screenshot filling the 9:16 frame.
 * If no screenshot available, shows a placeholder.
 */
export const ScreenshotScene: React.FC<Props> = ({ scene }) => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();

  if (!scene.screenshotPath) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#0d1117",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            color: "#58a6ff",
            fontSize: 28,
            fontFamily: "monospace",
            textAlign: "center",
            padding: 40,
          }}
        >
          {scene.screenshotUrl ?? "Screenshot loading..."}
        </div>
      </AbsoluteFill>
    );
  }

  // Slow vertical scroll if screenshotScrollPx is set
  const scrollProgress = scene.screenshotScrollPx
    ? interpolate(frame, [0, 30 * scene.durationSeconds], [0, scene.screenshotScrollPx], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0d1117", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: -scrollProgress,
          left: 0,
          width: "100%",
        }}
      >
        <Img
          src={staticFile(scene.screenshotPath)}
          style={{
            width: "100%",
            display: "block",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
