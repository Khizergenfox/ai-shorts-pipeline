import React from "react";
import { AbsoluteFill, Video, staticFile } from "remotion";
import { ScrollContainer } from "../components/ScrollContainer";
import { COLORS, WIDTH, HEIGHT } from "../lib/constants";
import { Scene } from "../../orchestrator/types";

interface SplitScreenProps {
  scene: Scene;
}

export const SplitScreen: React.FC<SplitScreenProps> = ({ scene }) => {
  const topHeight = Math.round(HEIGHT * 0.55);
  const bottomHeight = HEIGHT - topHeight;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDark }}>
      {/* Top: screenshot */}
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
        {scene.screenshotPath ? (
          <ScrollContainer
            imageSrc={staticFile(scene.screenshotPath)}
            scrollPx={scene.scrollHeightPx ?? 200}
          />
        ) : (
          <div style={{ width: WIDTH, height: topHeight, backgroundColor: COLORS.bgOlive }} />
        )}
      </div>

      {/* Divider line */}
      <div
        style={{
          position: "absolute",
          top: topHeight,
          left: 0,
          width: WIDTH,
          height: 3,
          backgroundColor: COLORS.coral,
          zIndex: 10,
        }}
      />

      {/* Bottom: video clip */}
      <div
        style={{
          position: "absolute",
          top: topHeight + 3,
          left: 0,
          width: WIDTH,
          height: bottomHeight - 3,
          overflow: "hidden",
          backgroundColor: "#000",
        }}
      >
        {scene.videoClipPath ? (
          <Video
            src={staticFile(scene.videoClipPath)}
            style={{ width: WIDTH, height: bottomHeight, objectFit: "cover" }}
            muted
          />
        ) : (
          <div style={{ width: WIDTH, height: bottomHeight, backgroundColor: "#111" }} />
        )}
      </div>
    </AbsoluteFill>
  );
};
