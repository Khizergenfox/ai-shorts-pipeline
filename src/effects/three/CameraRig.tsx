import React from "react";
import { useThree } from "@react-three/fiber";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import * as THREE from "three";
import { StoryVariant } from "../../scenes/Story3DScene";

interface CameraRigProps {
  variant: StoryVariant;
  durationSeconds: number;
}

/**
 * Drives the Three.js camera per scene.
 *
 * Lessons learned from the previous build:
 *   - 9:16 portrait viewport has a NARROW horizontal field of view, so
 *     wide compositions (coin stacks, bar race, chip) get cropped if the
 *     camera is too close.
 *   - Aggressive push-in + FOV compression eats the subject. Keep FOV
 *     fixed and only do subtle dolly motion.
 *   - Static-with-tiny-orbit reads as "filmed", not "demo." Big arcs are
 *     more likely to crop the subject than to look cinematic.
 *
 * Distances below are tuned so each subject is fully framed at FOV 38°,
 * with margin for bloom halos and ambient particles.
 */
export const CameraRig: React.FC<CameraRigProps> = ({ variant, durationSeconds }) => {
  const { camera } = useThree();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const t = frame / fps;
  const progress = Math.min(1, t / Math.max(0.5, durationSeconds));
  const eased = Easing.bezier(0.4, 0.0, 0.2, 1)(progress);

  let camX = 0,
    camY = 0.3,
    camZ = 10;

  switch (variant) {
    case "v4_drop": {
      // Card is 2.4w × 3.0h. Pull back enough to frame fully + bloom halo.
      camZ = 8.0;
      camY = 0.4;
      // Tiny parallax sway — adds life without leaving the subject behind
      camX = Math.sin(t * 0.18) * 0.35;
      break;
    }
    case "cost_8x": {
      // Two stacks at x=±1.5 with bloom halos out to ~±2.7.
      // Need wide framing — pull back hard, keep camera dead center.
      camZ = 13.5;
      camY = 0.0;
      camX = 0;
      break;
    }
    case "math_race": {
      // Bars span x=-2.1 to x=+2.5 (full width 4.6).
      // Subtle dolly-in over the race for a hint of motion.
      camZ = interpolate(eased, [0, 1], [12.5, 11.5]);
      camY = 0.1;
      camX = 0;
      break;
    }
    case "huawei_chip": {
      // Chip is 3.2 × 3.2 — needs significant pullback in 9:16.
      // Very slow turntable + tiny vertical drift. NO push-in.
      const orbit = t * 0.08; // 0.08 rad/s = ~13° over a 3s scene
      camX = Math.sin(orbit) * 0.7;
      camY = 0.3 + Math.sin(t * 0.12) * 0.15;
      camZ = 11.5;
      break;
    }
    case "node_network": {
      // Network spans ~6 units across in 3D. Pull back, gentle reveal.
      camZ = interpolate(eased, [0, 1], [9.0, 7.5]);
      camY = 0.3;
      camX = Math.sin(t * 0.1) * 0.25;
      break;
    }
  }

  camera.position.set(camX, camY, camZ);
  camera.lookAt(0, 0, 0);

  // Constant FOV across all variants — animating it broke framing.
  if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
    const cam = camera as THREE.PerspectiveCamera;
    if (cam.fov !== 38) {
      cam.fov = 38;
      cam.updateProjectionMatrix();
    }
  }

  return null;
};
