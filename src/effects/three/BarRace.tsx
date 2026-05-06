import React, { useMemo } from "react";
import * as THREE from "three";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { BloomHalo, SparkBurst } from "./Bloom";

/**
 * Two horizontal benchmark bars racing — winner (top, emissive yellow)
 * overtakes loser (bottom, gray). Demo defaults: 0.92 vs 0.60. Override
 * via props if you wire them up; the visual is the same regardless of
 * what brands the bars represent.
 *
 * Polish: particle trail streams from the leading bar's tip, a spark
 * burst fires the moment winner crosses loser's height, and bloom
 * halos give the tip a "comet" feel.
 */
export const BarRace: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const targetLoser = 0.6;
  const targetWinner = 0.92;
  const startupDelay = 0.25;
  const growDuration = 1.6;
  const local = t - startupDelay;

  const progress = interpolate(local, [0, growDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.2, 0.8, 0.2, 1),
  });

  const fullWidth = 4.6;
  const barHeight = 0.55;
  const barDepth = 0.35;

  const loserW = targetLoser * progress * fullWidth;
  const winnerW = targetWinner * progress * fullWidth;

  // Overtake moment: when winner crosses loser's *width*
  const overtakeProgress = targetLoser / targetWinner;
  const overtakeTime = startupDelay + growDuration * overtakeProgress;
  const winPulse = t > overtakeTime ? Math.exp(-(t - overtakeTime) * 3) : 0;

  // Origin offset to center the chart
  const originX = -fullWidth / 2 + 0.2;

  return (
    <group rotation={[0.05, 0, 0]} position={[originX, 0, 0]}>
      {/* Winner bar — emissive yellow on top */}
      <mesh position={[winnerW / 2, 0.55, 0]} castShadow>
        <boxGeometry args={[winnerW || 0.001, barHeight, barDepth]} />
        <meshStandardMaterial
          color="#FFE94A"
          emissive="#FFCC1A"
          emissiveIntensity={0.6 + winPulse * 1.8}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>

      {/* Tip glow + bloom halo (the "comet head") */}
      {winnerW > 0.05 && (
        <group position={[winnerW, 0.55, 0]}>
          <mesh>
            <sphereGeometry args={[barHeight * 0.55, 16, 16]} />
            <meshStandardMaterial
              color="#FFE94A"
              emissive="#FFE94A"
              emissiveIntensity={2.5 + winPulse * 2.5}
              transparent
              opacity={0.85}
            />
          </mesh>
          <BloomHalo
            color="#FFE94A"
            innerRadius={barHeight * 0.55}
            outerRadius={barHeight * 1.6}
            intensity={0.4 + winPulse * 0.5}
            layers={4}
          />
        </group>
      )}

      {/* Comet trail — particles streaming back from the tip */}
      <CometTrail
        tipX={winnerW}
        y={0.55}
        progress={progress}
        t={local}
        color="#FFE94A"
      />

      {/* Spark burst at overtake moment */}
      <SparkBurst
        position={[targetLoser * fullWidth, 0.55, 0.2]}
        count={24}
        color="#FFE94A"
        triggerSec={overtakeTime}
        t={t}
        durationSec={0.55}
        reach={1.2}
      />

      {/* Comet trail — particles streaming back from the tip */}
      <CometTrail
        tipX={winnerW}
        y={0.55}
        progress={progress}
        t={local}
        color="#FFE94A"
      />

      {/* Spark burst at overtake moment */}
      <SparkBurst
        position={[targetLoser * fullWidth, 0.55, 0.2]}
        count={24}
        color="#FFE94A"
        triggerSec={overtakeTime}
        t={t}
        durationSec={0.55}
        reach={1.2}
      />

      {/* Loser bar — medium gray on the bottom track */}
      <mesh position={[loserW / 2, -0.55, 0]} castShadow>
        <boxGeometry args={[loserW || 0.001, barHeight, barDepth]} />
        <meshStandardMaterial
          color="#9ca0a8"
          metalness={0.1}
          roughness={0.5}
        />
      </mesh>

      {/* Track baselines — dark slate visible on white */}
      <mesh position={[fullWidth / 2, 0.55, -0.3]}>
        <boxGeometry args={[fullWidth, 0.04, 0.04]} />
        <meshStandardMaterial color="#c8c8cc" />
      </mesh>
      <mesh position={[fullWidth / 2, -0.55, -0.3]}>
        <boxGeometry args={[fullWidth, 0.04, 0.04]} />
        <meshStandardMaterial color="#c8c8cc" />
      </mesh>

      {/* Tick marks */}
      {[0.2, 0.4, 0.6, 0.8, 1.0].map((tick) => (
        <group key={tick} position={[tick * fullWidth, 0, -0.3]}>
          <mesh position={[0, 0.55, 0]}>
            <boxGeometry args={[0.02, 0.18, 0.05]} />
            <meshStandardMaterial color="#a8a8b0" />
          </mesh>
          <mesh position={[0, -0.55, 0]}>
            <boxGeometry args={[0.02, 0.18, 0.05]} />
            <meshStandardMaterial color="#a8a8b0" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

interface CometTrailProps {
  tipX: number;
  y: number;
  progress: number;
  t: number;
  color: string;
}

const CometTrail: React.FC<CometTrailProps> = ({ tipX, y, progress, t, color }) => {
  const particles = useMemo(() => Array.from({ length: 18 }, (_, i) => i), []);

  if (progress <= 0 || progress >= 1) return null;

  return (
    <group>
      {particles.map((i) => {
        const seed = rng(i * 5.7);
        // Each particle was emitted at a slightly different past time
        const age = (i / particles.length) * 0.6 + seed * 0.1;
        // Particle's emission point trails behind the tip
        const offset = age * 1.4;
        const px = Math.max(0, tipX - offset);
        const py = y + (rng(i * 11.3) - 0.5) * 0.4 * age;
        const pz = (rng(i * 7.1) - 0.5) * 0.3 * age;
        const sz = 0.08 * (1 - age);
        const opacity = (1 - age) * 0.7;
        return (
          <mesh key={i} position={[px, py, pz]}>
            <sphereGeometry args={[sz, 6, 6]} />
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
    </group>
  );
};

function rng(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
