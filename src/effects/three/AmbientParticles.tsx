import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";

interface AmbientParticlesProps {
  /** Number of motes. Default 120. */
  count?: number;
  /** Size of the volume (cube half-extent). Default 8. */
  spread?: number;
  /** Mote color. Default warm white. */
  color?: string;
  /** Base size of each mote. Default 0.025. */
  size?: number;
}

/**
 * A field of slow-drifting dust motes filling the 3D scene volume.
 *
 * Reads as atmospheric depth — the eye perceives 3D space because there
 * are objects at varying distances moving at varying parallax rates.
 *
 * Each mote drifts on a slow, deterministic sin/cos path so the field
 * never repeats but doesn't fully randomize either. Additive blending
 * gives a soft glow without over-saturation.
 */
export const AmbientParticles: React.FC<AmbientParticlesProps> = ({
  count = 120,
  spread = 8,
  color = "#ffe7c2",
  size = 0.025,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Deterministic positions + per-mote drift seeds
  const motes = useMemo(() => {
    const arr: {
      basePos: [number, number, number];
      driftAmp: number;
      driftFreq: number;
      phase: number;
      sizeMul: number;
    }[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        basePos: [
          (rng(i * 1.7) - 0.5) * spread * 2,
          (rng(i * 3.1) - 0.5) * spread * 1.4,
          (rng(i * 5.3) - 0.5) * spread * 1.4,
        ],
        driftAmp: 0.15 + rng(i * 7.7) * 0.4,
        driftFreq: 0.15 + rng(i * 11.3) * 0.4,
        phase: rng(i * 13.5) * Math.PI * 2,
        sizeMul: 0.5 + rng(i * 17.1) * 1.1,
      });
    }
    return arr;
  }, [count, spread]);

  return (
    <group>
      {motes.map((m, i) => {
        const driftX = Math.sin(t * m.driftFreq + m.phase) * m.driftAmp;
        const driftY = Math.cos(t * m.driftFreq * 0.7 + m.phase * 1.3) * m.driftAmp * 0.6;
        const driftZ = Math.sin(t * m.driftFreq * 0.5 + m.phase * 0.5) * m.driftAmp * 0.4;
        const x = m.basePos[0] + driftX;
        const y = m.basePos[1] + driftY;
        const z = m.basePos[2] + driftZ;

        // Subtle twinkle
        const twinkle = 0.4 + (Math.sin(t * 2 + m.phase * 3) * 0.5 + 0.5) * 0.6;

        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[size * m.sizeMul, 6, 6]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={twinkle * 0.45}
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
