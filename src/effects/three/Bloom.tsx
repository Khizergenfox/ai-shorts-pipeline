import React from "react";
import * as THREE from "three";

interface BloomHaloProps {
  /** Color of the halo glow. */
  color: string;
  /** Inner radius — should match (or slightly exceed) the source object's radius. */
  innerRadius: number;
  /** Outer radius — how far the glow extends. */
  outerRadius: number;
  /** Center opacity. Default 0.35. */
  intensity?: number;
  /** Number of halo layers stacked for falloff. Default 3. */
  layers?: number;
}

/**
 * A stack of additive transparent spheres around a glowing source —
 * fakes the look of a bloom post-process without a postprocessing pass.
 *
 * Each layer is larger and more transparent than the previous, creating
 * a smooth radial falloff. The stack uses additive blending so multiple
 * halos in a scene stack into stronger glow without over-saturating.
 *
 * Wrap your glowing emissive mesh with `<BloomHalo>` next to it (same
 * world position) — typically done by placing both inside a <group>.
 */
export const BloomHalo: React.FC<BloomHaloProps> = ({
  color,
  innerRadius,
  outerRadius,
  intensity = 0.35,
  layers = 3,
}) => {
  return (
    <>
      {Array.from({ length: layers }, (_, i) => {
        const t = (i + 1) / layers;
        const radius = innerRadius + (outerRadius - innerRadius) * t;
        const opacity = intensity * (1 - t * 0.85);
        return (
          <mesh key={i}>
            <sphereGeometry args={[radius, 16, 12]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={opacity}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </>
  );
};

interface SparkBurstProps {
  /** Burst origin */
  position?: [number, number, number];
  /** Particle count. Default 16. */
  count?: number;
  /** Spark color. */
  color?: string;
  /** Time at which the burst should fire (seconds from scene start). */
  triggerSec: number;
  /** Current scene time (seconds from scene start). */
  t: number;
  /** How long the burst lasts in seconds. Default 0.6. */
  durationSec?: number;
  /** Maximum spark distance from origin. Default 1.5. */
  reach?: number;
}

/**
 * A radial burst of additive sparks that fires once at `triggerSec`,
 * with each spark flying outward and fading over `durationSec`.
 *
 * Used for impact moments — a card landing, a comet streak crossing
 * the finish line, a chip flickering on for the first time.
 */
export const SparkBurst: React.FC<SparkBurstProps> = ({
  position = [0, 0, 0],
  count = 16,
  color = "#FFE94A",
  triggerSec,
  t,
  durationSec = 0.6,
  reach = 1.5,
}) => {
  const local = t - triggerSec;
  if (local < 0 || local > durationSec) return null;
  const progress = local / durationSec;
  const fade = 1 - progress;

  return (
    <group position={position}>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + (i % 2) * 0.3;
        const elev = (rng(i * 5.1) - 0.5) * 0.8;
        const dist = reach * progress * (0.7 + rng(i * 7.3) * 0.6);
        const x = Math.cos(angle) * dist;
        const y = elev * progress + Math.sin(angle) * dist * 0.4;
        const z = Math.sin(angle) * dist * 0.6;
        const sz = 0.05 * (1 - progress * 0.5);
        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[sz, 6, 6]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={fade * 0.9}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
};

function rng(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
