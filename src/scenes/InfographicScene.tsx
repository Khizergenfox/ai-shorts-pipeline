import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { KenBurns } from "../components/KenBurns";
import { COLORS, WIDTH, HEIGHT } from "../lib/constants";
import { Scene } from "../../orchestrator/types";

interface InfographicSceneProps {
  scene: Scene;
}

export const InfographicScene: React.FC<InfographicSceneProps> = ({ scene }) => {
  if (!scene.imagenFramePath) {
    return <AbsoluteFill style={{ backgroundColor: COLORS.bgLight }} />;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgLight }}>
      <KenBurns direction="right" scaleFrom={1.0} scaleTo={1.06}>
        <Img
          src={staticFile(scene.imagenFramePath)}
          style={{ width: WIDTH, height: HEIGHT, objectFit: "cover" }}
        />
      </KenBurns>
    </AbsoluteFill>
  );
};
