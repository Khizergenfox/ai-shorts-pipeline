import React from "react";
import { Composition, getInputProps } from "remotion";
import { MainVideo } from "./compositions/MainVideo";
import { WIDTH, HEIGHT, FPS } from "./lib/constants";
import "./lib/fonts";

export const RemotionRoot: React.FC = () => {
  const inputProps = getInputProps() as { specPath?: string };
  const specPath = inputProps?.specPath ?? "sessions/example/spec.json";

  return (
    <>
      <Composition
        id="MainVideo"
        component={MainVideo}
        width={WIDTH}
        height={HEIGHT}
        fps={FPS}
        durationInFrames={FPS * 62} // 62s max, actual duration set by spec
        defaultProps={{ specPath }}
      />

      {/*
        Thumbnail compositions live in your private fork.
        Drop a Composition entry per thumbnail React component you create.
        Render via: node scripts/render-thumbnail.mjs (also in your private fork).
      */}
    </>
  );
};
