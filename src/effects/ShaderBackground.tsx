import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";

export type ShaderPreset = "gradient" | "plasma" | "network" | "neongrid";

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// ── PRESET 1: GRADIENT ─────────────────────────────────────────────
// Animated palette-driven color blob mesh. Smooth and modern.
const FRAG_GRADIENT = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uResolution;
  varying vec2 vUv;

  vec3 palette(float t) {
    vec3 a = vec3(0.55, 0.4, 0.5);
    vec3 b = vec3(0.45, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.0, 0.2, 0.5);
    return a + b * cos(6.28318 * (c * t + d));
  }

  void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    uv.x *= uResolution.x / uResolution.y;
    vec2 uv0 = uv;
    vec3 col = vec3(0.0);

    for (float i = 0.0; i < 3.0; i++) {
      uv = fract(uv * 1.4) - 0.5;
      float d = length(uv) * exp(-length(uv0));
      vec3 c = palette(length(uv0) + i * 0.3 + uTime * 0.15);
      d = sin(d * 8.0 + uTime * 0.8) / 8.0;
      d = abs(d);
      d = pow(0.012 / d, 1.4);
      col += c * d;
    }

    col *= 0.55;
    gl_FragColor = vec4(col, 1.0);
  }
`;

// ── PRESET 2: PLASMA ──────────────────────────────────────────────
// Flowing rays from center, three-color plasma. Energetic.
const FRAG_PLASMA = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uResolution;
  varying vec2 vUv;

  void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    uv.x *= uResolution.x / uResolution.y;
    float t = uTime * 0.4;

    float r = length(uv);
    float a = atan(uv.y, uv.x);

    float rays = sin(a * 8.0 + t * 2.0) * 0.5 + 0.5;
    float waves = sin(r * 8.0 - t * 3.0) * 0.5 + 0.5;
    float drift = sin(uv.x * 3.0 + t) * cos(uv.y * 3.0 - t * 1.3) * 0.5 + 0.5;

    vec3 coral = vec3(1.0, 0.37, 0.23);
    vec3 cyan = vec3(0.24, 0.86, 0.79);
    vec3 yellow = vec3(1.0, 0.91, 0.29);

    vec3 col = mix(coral, cyan, rays);
    col = mix(col, yellow, waves * 0.4);
    col = mix(col, coral, drift * 0.25);

    float vig = 1.0 - smoothstep(0.6, 1.6, r);
    col *= vig * 0.6;

    gl_FragColor = vec4(col, 1.0);
  }
`;

// ── PRESET 3: NETWORK ─────────────────────────────────────────────
// Voronoi cells with glowing cyan edges + coral pulses on random cells.
// Reads as a neural network / connection graph — perfect for AI topics.
const FRAG_NETWORK = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uResolution;
  varying vec2 vUv;

  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv;
    uv.x *= uResolution.x / uResolution.y;
    uv *= 5.0;

    vec2 i = floor(uv);
    vec2 f = fract(uv);

    float minDist = 1.0;
    float secondDist = 1.0;
    vec2 closestCell = vec2(0.0);

    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        vec2 o = hash2(i + g);
        o = 0.5 + 0.5 * sin(uTime * 0.6 + 6.28318 * o);
        vec2 r = g + o - f;
        float d = length(r);
        if (d < minDist) {
          secondDist = minDist;
          minDist = d;
          closestCell = i + g;
        } else if (d < secondDist) {
          secondDist = d;
        }
      }
    }

    float edge = secondDist - minDist;
    float edgeGlow = 1.0 - smoothstep(0.0, 0.06, edge);

    vec3 bg = mix(vec3(0.04, 0.05, 0.1), vec3(0.08, 0.12, 0.22), minDist);
    vec3 edgeColor = vec3(0.24, 0.86, 0.79);

    vec3 col = mix(bg, edgeColor, edgeGlow);

    // Pulse some cells in coral
    float pulseSeed = hash2(closestCell).x;
    float pulse = sin(uTime * 1.4 + pulseSeed * 12.0) * 0.5 + 0.5;
    pulse = smoothstep(0.7, 1.0, pulse);
    col = mix(col, vec3(1.0, 0.37, 0.23), pulse * (1.0 - edgeGlow) * 0.8);

    gl_FragColor = vec4(col * 0.75, 1.0);
  }
`;

// ── PRESET 4: NEONGRID ────────────────────────────────────────────
// Synthwave perspective grid floor + horizon glow. Tech / cyberpunk.
const FRAG_NEONGRID = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uResolution;
  varying vec2 vUv;

  void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    uv.x *= uResolution.x / uResolution.y;

    // Sky gradient
    vec3 skyTop = vec3(0.05, 0.02, 0.15);
    vec3 skyBot = vec3(0.6, 0.1, 0.4);
    vec3 sky = mix(skyBot, skyTop, smoothstep(-0.05, 1.2, uv.y));

    vec3 col = sky;

    // Horizon glow
    float horizon = 1.0 - smoothstep(0.0, 0.4, abs(uv.y + 0.05));
    col += vec3(1.0, 0.5, 0.2) * horizon * 0.8;

    // Ground perspective grid (only below horizon)
    if (uv.y < -0.05) {
      float persp = 1.0 / (-uv.y + 0.05);
      vec2 g = vec2(uv.x * persp * 0.5, uv.y * persp * 0.5 + uTime * 0.6);
      vec2 grid = abs(fract(g) - 0.5);
      float lineX = smoothstep(0.48, 0.5, max(grid.x, grid.y));
      vec3 gridColor = vec3(0.24, 0.86, 0.79);
      float fade = smoothstep(0.0, 0.4, -uv.y);
      col = mix(col, gridColor, lineX * fade * 0.9);
    }

    col *= 0.7;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const FRAGMENT: Record<ShaderPreset, string> = {
  gradient: FRAG_GRADIENT,
  plasma: FRAG_PLASMA,
  network: FRAG_NETWORK,
  neongrid: FRAG_NEONGRID,
};

interface ShaderBackgroundProps {
  preset: ShaderPreset;
}

const ShaderQuad: React.FC<ShaderBackgroundProps> = ({ preset }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(width, height) },
        },
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT[preset],
      }),
    [preset, width, height],
  );

  // Drive uniforms from the current Remotion frame
  material.uniforms.uTime.value = frame / fps;

  return (
    <mesh material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
};

/**
 * Fullscreen Three.js shader background.
 *
 * Renders a frame-driven GLSL fragment shader as a fullscreen quad.
 * The shader's `uTime` uniform is synced to Remotion's `useCurrentFrame()`,
 * so output is deterministic for headless render.
 *
 * Pick a preset based on scene mood:
 *   - gradient  → smooth flowing color blobs (intros, outros, calm beats)
 *   - plasma    → energetic rays + waves (stat reveals, "wow" moments)
 *   - network   → voronoi cells with glowing edges (AI / tech / connection)
 *   - neongrid  → synthwave horizon + grid floor (cyberpunk / China angle)
 */
export const ShaderBackground: React.FC<ShaderBackgroundProps> = ({ preset }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill>
      <ThreeCanvas width={width} height={height}>
        <ShaderQuad preset={preset} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
