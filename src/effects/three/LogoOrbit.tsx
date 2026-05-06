import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

/**
 * LogoOrbit — atmospheric glow rings for the dual-brand beat. The actual
 * Claude + Cursor logos are rendered as HTML overlays in Story3DScene
 * (which loads real anthropic.svg + cursor.svg via CSS mask).
 *
 * This Three.js layer = ambient backdrop, two concentric ring halos
 * (one tinted Claude-coral, one tinted Cursor-silver) breathing.
 */
export const LogoOrbit: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const breathe = 1 + Math.sin(t * 0.8) * 0.08;

  return (
    <group>
      {/* Left side — Claude/Anthropic coral halo */}
      <group position={[-1.8, 0, -0.5]} scale={[breathe, breathe, 1]}>
        <mesh rotation={[0, 0, t * 0.15]}>
          <torusGeometry args={[1.0, 0.05, 16, 64]} />
          <meshStandardMaterial
            color="#D97757"
            emissive="#D97757"
            emissiveIntensity={1.8}
            transparent
            opacity={0.75}
          />
        </mesh>
        <mesh>
          <circleGeometry args={[1.0, 64]} />
          <meshStandardMaterial
            color="#D97757"
            emissive="#D97757"
            emissiveIntensity={0.8}
            transparent
            opacity={0.18}
          />
        </mesh>
      </group>

      {/* Right side — Cursor neutral halo */}
      <group position={[1.8, 0, -0.5]} scale={[breathe, breathe, 1]}>
        <mesh rotation={[0, 0, -t * 0.15]}>
          <torusGeometry args={[1.0, 0.05, 16, 64]} />
          <meshStandardMaterial
            color="#9aa0a8"
            emissive="#c8ccd2"
            emissiveIntensity={1.5}
            transparent
            opacity={0.8}
          />
        </mesh>
        <mesh>
          <circleGeometry args={[1.0, 64]} />
          <meshStandardMaterial
            color="#3a3a40"
            emissive="#9aa0a8"
            emissiveIntensity={0.5}
            transparent
            opacity={0.15}
          />
        </mesh>
      </group>

      {/* Center connector dot */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.1 + Math.sin(t * 4) * 0.02, 16, 16]} />
        <meshStandardMaterial
          color="#FF5E3A"
          emissive="#FF5E3A"
          emissiveIntensity={2.5}
        />
      </mesh>

      {/* Atmosphere */}
      <pointLight position={[-3, 0, 2]} intensity={1.2} color="#D97757" />
      <pointLight position={[3, 0, 2]} intensity={1.0} color="#c8ccd2" />
      <pointLight position={[0, 0, 3]} intensity={0.6} color="#FF5E3A" />
    </group>
  );
};
