import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { BloomHalo, SparkBurst } from "./Bloom";

/**
 * Glossy 3D card drops in from above and settles with a small bounce,
 * then slowly rotates with a subtle breath. Coral inset bar across top,
 * glowing yellow V chevron at center, cyan accent at bottom — three
 * accent colors in a deliberate hierarchy.
 *
 * On landing: a spark burst fires + the V chevron floods bright.
 */
export const DropCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const landTime = 0.55;

  // Spring drop-in
  const dropProgress = spring({
    frame,
    fps,
    config: { damping: 9, stiffness: 80, mass: 0.9 },
    durationInFrames: Math.round(landTime * fps),
  });
  const yPos = interpolate(dropProgress, [0, 1], [4.5, 0]);

  // Slow rotation after settled
  const rotY = Math.max(0, t - landTime) * 0.35;
  const breath = Math.sin(t * 1.5) * 0.04;

  // V chevron flood: brief flash on landing, then settle.
  const settleSec = t - landTime;
  const chevronFlash = settleSec > 0 ? Math.exp(-settleSec * 2.2) : 0;
  const chevronIntensity = 1.2 + chevronFlash * 3;

  // Coral inset bar pulses subtly forever
  const barIntensity = 0.85 + Math.sin(t * 1.8) * 0.25;

  return (
    <group position={[0, yPos + breath, 0]} rotation={[0.05, rotY, 0]}>
      {/* Main card body */}
      <mesh castShadow>
        <boxGeometry args={[2.4, 3.0, 0.22]} />
        <meshPhysicalMaterial
          color="#0c0d12"
          metalness={0.7}
          roughness={0.18}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          reflectivity={0.85}
        />
      </mesh>

      {/* Subtle bevel highlight along card edge */}
      <mesh position={[0, 0, 0.115]}>
        <boxGeometry args={[2.36, 2.96, 0.005]} />
        <meshStandardMaterial color="#1a1f2a" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Coral inset bar across top */}
      <mesh position={[0, 1.25, 0.121]}>
        <boxGeometry args={[2.0, 0.12, 0.02]} />
        <meshStandardMaterial
          color="#FF5E3A"
          emissive="#FF5E3A"
          emissiveIntensity={barIntensity}
        />
      </mesh>

      {/* Glowing V chevron */}
      <group position={[0, 0.1, 0.121]}>
        <mesh rotation={[0, 0, -0.6]} position={[-0.25, 0.15, 0]}>
          <boxGeometry args={[0.7, 0.16, 0.02]} />
          <meshStandardMaterial
            color="#FFE94A"
            emissive="#FFE94A"
            emissiveIntensity={chevronIntensity}
          />
        </mesh>
        <mesh rotation={[0, 0, 0.6]} position={[0.25, 0.15, 0]}>
          <boxGeometry args={[0.7, 0.16, 0.02]} />
          <meshStandardMaterial
            color="#FFE94A"
            emissive="#FFE94A"
            emissiveIntensity={chevronIntensity}
          />
        </mesh>
        {/* Bloom halo around V chevron */}
        <BloomHalo
          color="#FFE94A"
          innerRadius={0.5}
          outerRadius={1.2}
          intensity={0.25 + chevronFlash * 0.4}
          layers={4}
        />
      </group>

      {/* Cyan bottom accent */}
      <mesh position={[0, -1.35, 0.121]}>
        <boxGeometry args={[1.6, 0.04, 0.02]} />
        <meshStandardMaterial
          color="#3DDCC9"
          emissive="#3DDCC9"
          emissiveIntensity={0.7}
        />
      </mesh>

      {/* Spark burst when card lands */}
      <SparkBurst
        position={[0, -1.4, 0.2]}
        count={20}
        color="#FFE94A"
        triggerSec={landTime}
        t={t}
        durationSec={0.7}
        reach={1.8}
      />
    </group>
  );
};
