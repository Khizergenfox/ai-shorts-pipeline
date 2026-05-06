import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { WIDTH, HEIGHT } from "../lib/constants";
import { SPRINGS } from "../lib/springConfigs";

interface ZoomTarget {
  // Region in the screenshot's coordinate space to zoom into
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ZoomRegionProps {
  imageSrc: string;
  zoomTarget: ZoomTarget;
  // 0–1: when within the scene to start the zoom
  startFraction?: number;
  children?: React.ReactNode;
}

export const ZoomRegion: React.FC<ZoomRegionProps> = ({
  imageSrc,
  zoomTarget,
  startFraction = 0.4,
  children,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  const zoomStartFrame = Math.round(durationInFrames * startFraction);
  const localFrame = Math.max(0, frame - zoomStartFrame);

  const zoomProgress = spring({
    frame: localFrame,
    fps,
    config: SPRINGS.smooth,
  });

  // Calculate scale to fill canvas with the target region
  const targetScale = Math.min(
    WIDTH / zoomTarget.width,
    HEIGHT / zoomTarget.height
  ) * 0.95;

  const scale = interpolate(zoomProgress, [0, 1], [1, targetScale]);

  // Translate to center the zoom target
  const targetCenterX = zoomTarget.x + zoomTarget.width / 2;
  const targetCenterY = zoomTarget.y + zoomTarget.height / 2;

  const tx = interpolate(
    zoomProgress,
    [0, 1],
    [0, WIDTH / 2 - targetCenterX * scale]
  );
  const ty = interpolate(
    zoomProgress,
    [0, 1],
    [0, HEIGHT / 2 - targetCenterY * scale]
  );

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
      <img
        src={imageSrc}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: WIDTH,
          transformOrigin: "top left",
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          willChange: "transform",
        }}
      />
      {children}
    </div>
  );
};
