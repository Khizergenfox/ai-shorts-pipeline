import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

/**
 * Stat3DExtrude — abstract 3D glow / depth backdrop for stat reveals.
 * The actual stat text ("11", "1✓") is rendered by an HTML overlay in
 * Story3DScene — this Three.js layer just provides depth + atmosphere.
 *
 * Visual: glowing radial discs that pulse outward, hot rim lighting.
 */
export const Stat3DExtrude: React.FC<{
  text?: string;
  accentColor?: string;
}> = ({ accentColor = "#FF5E3A" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Punch-in pulse
  const pulse = 1 + Math.sin(t * 3) * 0.1;

  return (
    <group>
      {/* Backplate that glows */}
      <mesh position={[0, 0, -1]} scale={[pulse, pulse, 1]}>
        <circleGeometry args={[2.4, 64]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={2.5}
          transparent
          opacity={0.45}
        />
      </mesh>

      {/* Inner ring */}
      <mesh position={[0, 0, -0.6]} rotation={[0, 0, t * 0.3]}>
        <torusGeometry args={[1.7, 0.06, 16, 64]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={2.0}
        />
      </mesh>

      {/* Outer ring */}
      <mesh position={[0, 0, -0.8]} rotation={[0, 0, -t * 0.2]}>
        <torusGeometry args={[2.2, 0.04, 16, 64]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={1.5}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Sparkle dots radiating */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2 + t * 0.5;
        const r = 2.4 + Math.sin(t * 2 + i) * 0.2;
        return (
          <mesh key={i} position={[Math.cos(angle) * r, Math.sin(angle) * r, -0.5]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial
              color="#FFE94A"
              emissive="#FFE94A"
              emissiveIntensity={2}
            />
          </mesh>
        );
      })}

      {/* Hot key light */}
      <pointLight position={[0, 0, 3]} intensity={2.5} color={accentColor} />
    </group>
  );
};
