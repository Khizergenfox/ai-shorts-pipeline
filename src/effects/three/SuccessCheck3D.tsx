import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

/**
 * SuccessCheck3D — a giant green 3D checkmark that punches in with
 * scale + rotation. Used for b20 "AI nailed it the first try".
 *
 * The checkmark is built from two extruded boxes joined at an angle
 * (the L-shape of a check). Lit hot green with bloom.
 */
export const SuccessCheck3D: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Punch-in animation
  const punch = interpolate(t, [0.05, 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.1, 0.9, 0.2, 1.05),
  });
  const scale = interpolate(punch, [0, 1], [0.3, 1]);

  // Subtle glow pulse after punch-in
  const glowPulse = punch >= 1 ? 1 + Math.sin((t - 0.5) * 3) * 0.2 : 1;

  // Slow rotation for "alive" feel
  const rotY = Math.sin(t * 0.6) * 0.08;
  const rotX = -0.1;

  return (
    <group rotation={[rotX, rotY, 0]} scale={[scale, scale, scale]}>
      {/* Short stroke (left bottom of check) */}
      <mesh position={[-0.65, -0.35, 0]} rotation={[0, 0, -0.85]}>
        <boxGeometry args={[0.35, 1.2, 0.32]} />
        <meshStandardMaterial
          color="#aaff7a"
          emissive="#00FF88"
          emissiveIntensity={2.0 * glowPulse}
          metalness={0.3}
          roughness={0.35}
        />
      </mesh>

      {/* Long stroke (right top of check) */}
      <mesh position={[0.4, 0.3, 0]} rotation={[0, 0, 0.6]}>
        <boxGeometry args={[0.35, 2.4, 0.32]} />
        <meshStandardMaterial
          color="#aaff7a"
          emissive="#00FF88"
          emissiveIntensity={2.0 * glowPulse}
          metalness={0.3}
          roughness={0.35}
        />
      </mesh>

      {/* Hot rim glow particles around the check */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 1.8 + Math.sin(t * 1.5 + i) * 0.1;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        return (
          <mesh key={i} position={[x, y, -0.4]} scale={[scale * 0.6, scale * 0.6, scale * 0.6]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial
              color="#00FF88"
              emissive="#00FF88"
              emissiveIntensity={2.5}
              transparent
              opacity={0.6 * punch}
            />
          </mesh>
        );
      })}

      {/* Hot key light */}
      <pointLight position={[0, 0, 3]} intensity={2.5} color="#00FF88" />
      <pointLight position={[2, 2, 1]} intensity={0.6} color="#FFE94A" />
    </group>
  );
};
