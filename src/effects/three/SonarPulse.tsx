import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

/**
 * SonarPulse — concentric expanding rings emanating from a single point,
 * like a radar/sonar ping. Used for the "the real signal?" beat — the
 * visual literally becomes a signal pulse.
 *
 * Three rings phased apart, each expanding + fading. A bright core dot
 * pulses underneath. Reads as "something is being detected."
 */
export const SonarPulse: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Three rings phased 0.5s apart, each lifecycles in 1.8s
  const rings = [0, 0.5, 1.0].map((phase) => {
    const local = ((t - phase) % 1.8 + 1.8) % 1.8;
    const lifecycle = local / 1.8;
    return {
      scale: interpolate(lifecycle, [0, 1], [0.2, 4.5]),
      opacity: interpolate(lifecycle, [0, 0.15, 0.85, 1], [0, 1, 0.15, 0]),
    };
  });

  // Core dot pulses with a subtle heartbeat
  const corePulse = 0.85 + 0.15 * Math.sin(t * 4);

  return (
    <group rotation={[Math.PI / 2.05, 0, 0]} position={[0, 0, 0]}>
      {/* Bright core dot */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.12 * corePulse, 32, 32]} />
        <meshStandardMaterial
          color="#FF5E3A"
          emissive="#FF5E3A"
          emissiveIntensity={3}
        />
      </mesh>

      {/* Soft halo around core */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshStandardMaterial
          color="#FF5E3A"
          emissive="#FF5E3A"
          emissiveIntensity={1.4}
          transparent
          opacity={0.25}
        />
      </mesh>

      {/* Three expanding sonar rings */}
      {rings.map((r, i) => (
        <mesh key={i} position={[0, 0, 0]} scale={[r.scale, r.scale, 1]}>
          <ringGeometry args={[0.45, 0.5, 64]} />
          <meshStandardMaterial
            color="#FF5E3A"
            emissive="#FF5E3A"
            emissiveIntensity={2}
            transparent
            opacity={r.opacity}
            side={2}
          />
        </mesh>
      ))}

      {/* Faint floor grid lines suggesting "scanning surface" */}
      <gridHelper
        args={[10, 20, "#3DDCC9", "#1a2630"]}
        position={[0, 0, -0.5]}
      />

      {/* Atmosphere lighting */}
      <pointLight position={[0, 0, 1.2]} intensity={1.4} color="#FF5E3A" />
      <pointLight position={[0, 0, -1.2]} intensity={0.4} color="#3DDCC9" />
    </group>
  );
};
