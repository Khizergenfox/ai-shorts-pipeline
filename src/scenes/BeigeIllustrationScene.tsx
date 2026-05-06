import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { Scene } from "../../orchestrator/types";
import { FPS } from "../lib/constants";

interface Props { scene: Scene; }

/**
 * Beige illustration scene — shows an Imagen-generated illustration
 * on a warm beige background (#EDE8DF), matching the Varun Mayya aesthetic.
 */
export const BeigeIllustrationScene: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const appear = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 80, mass: 1 },
  });

  const scale = 0.92 + 0.08 * appear;
  const opacity = appear;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#EDE8DF",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {scene.imagenFramePath ? (
        <div
          style={{
            transform: `scale(${scale})`,
            opacity,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Img
            src={staticFile(scene.imagenFramePath)}
            style={{
              width: "80%",
              maxHeight: "80%",
              objectFit: "contain",
            }}
          />
        </div>
      ) : (
        // Fallback: minimalist abstract face drawn in SVG
        <div style={{ opacity, transform: `scale(${scale})` }}>
          <svg width={220} height={280} viewBox="0 0 220 280" fill="none">
            {/* Abstract face outline */}
            <path
              d="M110 40 C60 40 40 90 40 130 C40 180 70 220 110 230 C150 220 180 180 180 130 C180 90 160 40 110 40Z"
              stroke="#1a1a1a"
              strokeWidth={3}
              fill="none"
            />
            {/* Eye dot — coral */}
            <circle cx={110} cy={115} r={12} fill="#C97060" />
            {/* Chin line */}
            <path
              d="M90 200 Q110 215 130 200"
              stroke="#1a1a1a"
              strokeWidth={2.5}
              fill="none"
            />
          </svg>
        </div>
      )}
    </AbsoluteFill>
  );
};
