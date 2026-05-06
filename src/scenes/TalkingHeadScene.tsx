import React from "react";
import { AbsoluteFill, Video, staticFile } from "remotion";
import { KenBurns } from "../components/KenBurns";
import { COLORS, WIDTH, HEIGHT } from "../lib/constants";
import { Scene } from "../../orchestrator/types";

interface TalkingHeadSceneProps {
  scene: Scene;
}

export const TalkingHeadScene: React.FC<TalkingHeadSceneProps> = ({ scene }) => {
  if (!scene.videoClipPath) {
    // Fallback: dark bg with coral accent text
    return (
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.bgDark,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 6,
            height: 200,
            backgroundColor: COLORS.coral,
            borderRadius: 3,
          }}
        />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <KenBurns direction="left" scaleFrom={1.0} scaleTo={1.07}>
        <Video
          src={staticFile(scene.videoClipPath)}
          style={{ width: WIDTH, height: HEIGHT, objectFit: "cover" }}
          muted
        />
      </KenBurns>
    </AbsoluteFill>
  );
};
