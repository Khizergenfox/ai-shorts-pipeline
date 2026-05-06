import React from "react";
import { AbsoluteFill } from "remotion";
import { LogoGrid } from "../components/LogoGrid";
import { COLORS } from "../lib/constants";
import { Scene } from "../../orchestrator/types";

interface LogoGridSceneProps { scene: Scene; }

export const LogoGridScene: React.FC<LogoGridSceneProps> = ({ scene }) => {
  const data = scene.logoData ?? {};
  return (
    <AbsoluteFill style={{
      backgroundColor: COLORS.bgDark,
      justifyContent: "center",
      alignItems: "center",
      padding: 60,
    }}>
      <LogoGrid tools={data.tools} headline={data.headline} />
    </AbsoluteFill>
  );
};
