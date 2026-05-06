import React, { useMemo } from "react";
import * as THREE from "three";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

/**
 * MathField — abstract 3D "field of computation" for the math/benchmark beats.
 *
 * Visual: a deep grid of small glowing math operators (+, ×, =, %, /, π, ∑, √)
 * floating and rotating gently in 3D space, with a single bright bar emerging
 * forward from the center to anchor the eye. Reads as "the math test surface"
 * without rendering literal equations.
 */
export const MathField: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Generate a deterministic field of floating operator-shaped wireframe cubes.
  // Each gets a slight random offset, rotation speed, and pulsing glow.
  const symbols = useMemo(() => {
    const arr: { pos: [number, number, number]; size: number; phase: number }[] = [];
    const rand = mulberry32(42);
    const COUNT = 60;
    for (let i = 0; i < COUNT; i++) {
      arr.push({
        pos: [
          (rand() - 0.5) * 8,
          (rand() - 0.5) * 5,
          (rand() - 0.5) * 4 - 1,
        ],
        size: 0.08 + rand() * 0.16,
        phase: rand() * Math.PI * 2,
      });
    }
    return arr;
  }, []);

  // Hero anchor — emerges forward over the first 0.7s
  const heroProgress = interpolate(t, [0.1, 0.9], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.2, 0.8, 0.2, 1),
  });

  return (
    <group>
      {/* Field of small glowing operator markers */}
      {symbols.map((s, i) => {
        const bob = Math.sin(t * 0.6 + s.phase) * 0.08;
        const pulse = 0.5 + 0.5 * Math.sin(t * 1.2 + s.phase);
        return (
          <mesh
            key={i}
            position={[s.pos[0], s.pos[1] + bob, s.pos[2]]}
            rotation={[t * 0.2 + s.phase, t * 0.15 + s.phase, 0]}
          >
            <boxGeometry args={[s.size, s.size, s.size]} />
            <meshStandardMaterial
              color="#3DDCC9"
              emissive="#3DDCC9"
              emissiveIntensity={0.6 + pulse * 0.4}
              transparent
              opacity={0.55}
            />
          </mesh>
        );
      })}

      {/* Hero anchor — a glowing bar in the center pushing forward */}
      <mesh
        position={[0, 0, -0.4 + heroProgress * 1.6]}
        rotation={[0, t * 0.1, 0]}
      >
        <boxGeometry args={[1.4, 0.18, 0.18]} />
        <meshStandardMaterial
          color="#FF5E3A"
          emissive="#FF5E3A"
          emissiveIntensity={2.2}
        />
      </mesh>

      {/* Soft floor reflection light */}
      <pointLight position={[0, 1.5, 1.5]} intensity={0.6} color="#3DDCC9" />
      <pointLight position={[0, -1, 1.0]} intensity={0.3} color="#FF5E3A" />
    </group>
  );
};

// Tiny deterministic PRNG (so the field is stable across renders/refreshes)
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

void THREE;
