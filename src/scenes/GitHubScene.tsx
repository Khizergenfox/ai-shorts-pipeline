import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { ZoomRegion } from "../components/ZoomRegion";
import { ScrollContainer } from "../components/ScrollContainer";
import { COLORS } from "../lib/constants";
import { Scene } from "../../orchestrator/types";

interface GitHubSceneProps {
  scene: Scene;
}

export const GitHubScene: React.FC<GitHubSceneProps> = ({ scene }) => {
  if (!scene.screenshotPath) {
    return <AbsoluteFill style={{ backgroundColor: COLORS.bgDark }} />;
  }

  const src = staticFile(scene.screenshotPath);

  if (scene.zoomTarget) {
    return (
      <AbsoluteFill style={{ backgroundColor: COLORS.bgDark }}>
        <ZoomRegion
          imageSrc={src}
          zoomTarget={scene.zoomTarget}
          startFraction={0.45}
        />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDark }}>
      <ScrollContainer
        imageSrc={src}
        scrollPx={scene.scrollHeightPx ?? 300}
      />
    </AbsoluteFill>
  );
};
