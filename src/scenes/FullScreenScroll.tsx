import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { ScrollContainer } from "../components/ScrollContainer";
import { COLORS, WIDTH, HEIGHT } from "../lib/constants";
import { Scene } from "../../orchestrator/types";

interface FullScreenScrollProps {
  scene: Scene;
}

export const FullScreenScroll: React.FC<FullScreenScrollProps> = ({ scene }) => {
  if (!scene.screenshotPath) {
    return (
      <AbsoluteFill style={{ backgroundColor: COLORS.bgDark, justifyContent: "center", alignItems: "center" }}>
        <span style={{ color: COLORS.gray, fontSize: 32 }}>No screenshot</span>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDark }}>
      <ScrollContainer
        imageSrc={staticFile(scene.screenshotPath)}
        scrollPx={scene.scrollHeightPx ?? 400}
      />
    </AbsoluteFill>
  );
};
