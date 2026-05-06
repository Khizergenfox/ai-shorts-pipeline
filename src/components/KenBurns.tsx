import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { WIDTH, HEIGHT } from "../lib/constants";

type Direction = "left" | "right" | "up" | "down";

interface KenBurnsProps {
  children: React.ReactNode;
  direction?: Direction;
  scaleFrom?: number;
  scaleTo?: number;
}

export const KenBurns: React.FC<KenBurnsProps> = ({
  children,
  direction = "right",
  scaleFrom = 1.0,
  scaleTo = 1.08,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = interpolate(progress, [0, 1], [scaleFrom, scaleTo]);

  const panAmount = 20; // px
  const panX =
    direction === "left"
      ? interpolate(progress, [0, 1], [0, -panAmount])
      : direction === "right"
      ? interpolate(progress, [0, 1], [0, panAmount])
      : 0;
  const panY =
    direction === "up"
      ? interpolate(progress, [0, 1], [0, -panAmount])
      : direction === "down"
      ? interpolate(progress, [0, 1], [0, panAmount])
      : 0;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: WIDTH,
        height: HEIGHT,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale}) translate(${panX}px, ${panY}px)`,
          transformOrigin: "center center",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
};
