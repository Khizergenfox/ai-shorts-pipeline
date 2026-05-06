import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

/**
 * LogoGrid3D — floating grid of glowing product-logo cards in 3D space,
 * with depth-of-field and slow camera dolly. Used for "MCPs are the
 * reason every product you use will feel different" beat.
 *
 * Each logo represented as a glowing circular disc with a label tile.
 * Real SVG logos rendered via HTML overlay in Story3DScene.
 * Three.js handles the 3D positioning + ambient glow.
 */
export const LogoGrid3D: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const appear = interpolate(t, [0, 0.8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.2, 0.8, 0.2, 1),
  });

  // 3x3 grid of cards with varying depths
  const cards = useMemo(() => {
    const arr: { x: number; y: number; z: number; color: string; phase: number }[] = [];
    const colors = ["#D97757", "#10A37F", "#4285F4", "#0866FF", "#FF5E3A", "#3DDCC9", "#FFE94A", "#9aa0a8", "#FF2D78"];
    let i = 0;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        arr.push({
          x: (col - 1) * 1.7,
          y: (row - 1) * 1.4,
          z: -0.5 + Math.sin(i * 1.7) * 0.6,
          color: colors[i],
          phase: i * 0.13,
        });
        i++;
      }
    }
    return arr;
  }, []);

  // Slow camera dolly in
  const cameraZ = interpolate(t, [0, 3], [0, 0.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <group position={[0, 0, cameraZ]} scale={[appear, appear, appear]}>
      {cards.map((c, i) => {
        const breathe = 1 + Math.sin(t * 1.5 + c.phase) * 0.04;
        const yOffset = Math.sin(t * 0.6 + c.phase) * 0.06;
        return (
          <group key={i} position={[c.x, c.y + yOffset, c.z]} scale={[breathe, breathe, 1]}>
            {/* Card body — much darker now so the bright logo overlays read */}
            <mesh>
              <boxGeometry args={[1.3, 1.0, 0.12]} />
              <meshStandardMaterial
                color="#0a0c12"
                emissive={c.color}
                emissiveIntensity={0.12}
                metalness={0.3}
                roughness={0.5}
              />
            </mesh>
            {/* Thin color accent strip (subtle) */}
            <mesh position={[0, -0.46, 0.07]}>
              <boxGeometry args={[1.3, 0.04, 0.04]} />
              <meshStandardMaterial color={c.color} emissive={c.color} emissiveIntensity={1.4} transparent opacity={0.7} />
            </mesh>
          </group>
        );
      })}

      {/* Atmospheric lighting */}
      <pointLight position={[0, 3, 3]} intensity={1.5} color="#3D8FFF" />
      <pointLight position={[0, -3, 3]} intensity={1.0} color="#FF5E3A" />
      <pointLight position={[3, 0, 2]} intensity={0.6} color="#10A37F" />
    </group>
  );
};
