import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { WIDTH, HEIGHT } from "../lib/constants";

interface ScrollContainerProps {
  imageSrc: string;
  // Total px to scroll upward over the scene duration
  scrollPx: number;
  // Natural width/height of the screenshot (before fitting to canvas)
  imageNaturalWidth?: number;
  imageNaturalHeight?: number;
  children?: React.ReactNode;
}

export const ScrollContainer: React.FC<ScrollContainerProps> = ({
  imageSrc,
  scrollPx,
  imageNaturalWidth,
  children,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Smooth scroll from 0 to -scrollPx over the scene duration
  const translateY = interpolate(
    frame,
    [0, durationInFrames],
    [0, -scrollPx],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Scale image to fill canvas width
  const scale = imageNaturalWidth ? WIDTH / imageNaturalWidth : 1;

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
          transform: `translateY(${translateY}px)`,
          willChange: "transform",
        }}
      >
        <img
          src={imageSrc}
          style={{
            width: WIDTH,
            display: "block",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
      {children}
    </div>
  );
};
