import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

/**
 * TypoNeonBlue — electric particle field for the Meta Ads MCP brand reveal.
 * Three.js handles the BACKGROUND particles (Meta-blue electric energy).
 * The "META ADS MCP" wordmark is rendered by an HTML overlay in
 * Story3DScene's VariantOverlay. (Lesson from a previous video: never try to
 * fake letters with Three.js primitives.)
 */
export const TypoNeonBlue: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const sparks = useMemo(() => {
    const arr: { x: number; y: number; speed: number; phase: number; size: number }[] = [];
    for (let i = 0; i < 50; i++) {
      arr.push({
        x: (Math.sin(i * 17.3) - 0.5) * 8,
        y: (Math.cos(i * 11.7) - 0.5) * 5,
        speed: 0.6 + (i % 7) * 0.1,
        phase: i * 0.27,
        size: 0.05 + Math.sin(i * 5.1) * 0.04,
      });
    }
    return arr;
  }, []);

  const ignite = interpolate(t, [0, 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <group>
      {/* Center glow disc — Meta blue */}
      <mesh position={[0, 0, -1.5]} scale={[1 + Math.sin(t * 2) * 0.05, 1 + Math.sin(t * 2) * 0.05, 1]}>
        <circleGeometry args={[3.0, 64]} />
        <meshStandardMaterial
          color="#0866FF"
          emissive="#0866FF"
          emissiveIntensity={1.8}
          transparent
          opacity={0.35 * ignite}
        />
      </mesh>

      {/* Inner blue ring */}
      <mesh position={[0, 0, -0.8]} rotation={[0, 0, t * 0.4]}>
        <torusGeometry args={[2.0, 0.05, 16, 64]} />
        <meshStandardMaterial color="#3D8FFF" emissive="#3D8FFF" emissiveIntensity={2.0 * ignite} />
      </mesh>

      {/* Electric sparks scattered */}
      {sparks.map((s, i) => {
        const localPhase = ((t * s.speed + s.phase) % 2.0) / 2.0;
        const opacity = interpolate(localPhase, [0, 0.1, 0.7, 1], [0, 1, 0.4, 0]);
        const wobble = Math.sin(t * 4 + i) * 0.15;
        return (
          <mesh key={i} position={[s.x + wobble, s.y + Math.cos(t + i) * 0.1, 0]}>
            <sphereGeometry args={[s.size, 8, 8]} />
            <meshStandardMaterial
              color={i % 3 === 0 ? "#FFFFFF" : "#3D8FFF"}
              emissive={i % 3 === 0 ? "#FFFFFF" : "#3D8FFF"}
              emissiveIntensity={3.0}
              transparent
              opacity={opacity * ignite}
            />
          </mesh>
        );
      })}

      <pointLight position={[0, 0, 3]} intensity={2.5} color="#0866FF" />
      <pointLight position={[3, 2, 2]} intensity={0.8} color="#FFFFFF" />
    </group>
  );
};
