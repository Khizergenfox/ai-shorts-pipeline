import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

/**
 * AutomationFlow — particles converging into a finished campaign artifact.
 * Inputs (URL + Budget) flow as glowing particles toward a central node,
 * then a finished "campaign card" emerges. Used for "AI handles
 * everything else" beat. Complex layered animation per user request.
 */
export const AutomationFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const converge = interpolate(t, [0, 1.0], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const reveal = interpolate(t, [0.9, 1.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.2, 0.8, 0.2, 1),
  });

  // Particles starting from left/right edges, converging on center
  const particles = useMemo(() => {
    const arr: { startX: number; startY: number; phase: number; color: string }[] = [];
    const colors = ["#0866FF", "#3D8FFF", "#FFFFFF", "#FFE94A", "#00FF88"];
    for (let i = 0; i < 36; i++) {
      arr.push({
        startX: i % 2 === 0 ? -3.5 : 3.5,
        startY: ((i * 0.31) % 4) - 2,
        phase: i * 0.05,
        color: colors[i % colors.length],
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {/* Converging particles */}
      {particles.map((p, i) => {
        const localT = Math.max(0, Math.min(1, converge - p.phase * 0.3));
        if (localT <= 0) return null;
        const x = p.startX * (1 - localT);
        const y = p.startY * (1 - localT);
        const opacity = interpolate(localT, [0, 0.1, 0.85, 1], [0, 1, 1, 0]);
        return (
          <mesh key={`p-${i}`} position={[x, y, 0]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial
              color={p.color}
              emissive={p.color}
              emissiveIntensity={3.0}
              transparent
              opacity={opacity}
            />
          </mesh>
        );
      })}

      {/* Center burst (when particles converge) */}
      {converge > 0.7 && (
        <mesh scale={[converge, converge, converge]}>
          <sphereGeometry args={[0.4 + (converge - 0.7) * 1.5, 32, 32]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#0866FF"
            emissiveIntensity={3.5}
            transparent
            opacity={interpolate(converge, [0.7, 0.95, 1.1], [0, 0.9, 0])}
          />
        </mesh>
      )}

      {/* Finished campaign artifact emerging */}
      {reveal > 0.05 && (
        <group scale={[reveal, reveal, reveal]} position={[0, 0, 0.1]}>
          {/* Card body */}
          <mesh>
            <boxGeometry args={[2.4, 1.5, 0.15]} />
            <meshStandardMaterial
              color="#1a1d24"
              emissive="#0866FF"
              emissiveIntensity={0.7}
              metalness={0.5}
              roughness={0.3}
            />
          </mesh>
          {/* Card title bar */}
          <mesh position={[0, 0.55, 0.08]}>
            <boxGeometry args={[2.3, 0.28, 0.04]} />
            <meshStandardMaterial color="#0866FF" emissive="#0866FF" emissiveIntensity={1.5} />
          </mesh>
          {/* Stat lines */}
          {[0.18, -0.05, -0.28, -0.5].map((y, i) => (
            <mesh key={i} position={[-0.7, y, 0.08]}>
              <boxGeometry args={[1.0 - i * 0.15, 0.06, 0.03]} />
              <meshStandardMaterial color="#9aa0a8" emissive="#9aa0a8" emissiveIntensity={0.5} />
            </mesh>
          ))}
          {/* Green checkmark indicator */}
          <mesh position={[0.85, 0.0, 0.1]}>
            <torusGeometry args={[0.15, 0.04, 12, 24]} />
            <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={2.0} />
          </mesh>
        </group>
      )}

      <pointLight position={[0, 0, 3]} intensity={2.0} color="#0866FF" />
      <pointLight position={[2, 1, 2]} intensity={0.6} color="#FFE94A" />
    </group>
  );
};
