import React from "react";
import { AbsoluteFill } from "remotion";
import { StatTriple } from "../components/StatTriple";
import { COLORS } from "../lib/constants";
import { Scene } from "../../orchestrator/types";

interface StatTripleSceneProps { scene: Scene; }

export const StatTripleScene: React.FC<StatTripleSceneProps> = ({ scene }) => {
  const data = scene.statData!;
  return (
    <AbsoluteFill style={{
      backgroundColor: COLORS.bgDark,
      justifyContent: "center",
      alignItems: "center",
    }}>
      <StatTriple stats={data.stats} title={data.title} />
    </AbsoluteFill>
  );
};
