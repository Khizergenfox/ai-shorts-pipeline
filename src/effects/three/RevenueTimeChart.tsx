import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

/**
 * RevenueTimeChart — split scene for "this changes everything" beat.
 * Left: revenue line chart climbing UP (green).
 * Right: clock dial with time-saving sweep (blue).
 * Both anchored on a clean dark stage.
 */
export const RevenueTimeChart: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const drawT = interpolate(t, [0, 1.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.2, 0.8, 0.2, 1),
  });

  // Revenue curve sample points — climbing
  const revPoints = useMemo(() => {
    const n = 24;
    const arr: { x: number; y: number }[] = [];
    for (let i = 0; i < n; i++) {
      const p = i / (n - 1);
      const x = -2.6 + p * 2.0; // confined to left side (-2.6 to -0.6)
      const y = -1.0 + p * 1.8 + Math.sin(p * 6) * 0.1; // -1.0 → 0.8
      arr.push({ x, y });
    }
    return arr;
  }, []);

  // Clock sweep — angle goes from 0 to 270deg (saving time)
  const clockSweep = drawT * Math.PI * 1.5;

  return (
    <group>
      {/* ── LEFT HALF: revenue chart climbing up ───────────── */}
      <group>
        {/* Grid floor */}
        <gridHelper args={[2.4, 6, "#1a3322", "#0d1f15"]} position={[-1.6, -1.4, -0.2]} />

        {/* Chart segments */}
        {revPoints.map((p, i) => {
          if (i === 0) return null;
          const drawnUpTo = drawT * revPoints.length;
          if (i > drawnUpTo) return null;
          const prev = revPoints[i - 1];
          const dx = p.x - prev.x;
          const dy = p.y - prev.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          return (
            <mesh
              key={`rev-${i}`}
              position={[(prev.x + p.x) / 2, (prev.y + p.y) / 2, 0]}
              rotation={[0, 0, angle]}
            >
              <boxGeometry args={[len, 0.08, 0.08]} />
              <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={2.4} />
            </mesh>
          );
        })}

        {/* Leading dot */}
        {(() => {
          const idx = Math.min(revPoints.length - 1, Math.floor(drawT * revPoints.length));
          const p = revPoints[idx];
          return (
            <mesh position={[p.x, p.y, 0.1]}>
              <sphereGeometry args={[0.16, 16, 16]} />
              <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={3.5} />
            </mesh>
          );
        })()}

        {/* Up-arrow at top end */}
        {drawT > 0.95 && (
          <mesh position={[-0.5, 0.95, 0.15]} rotation={[0, 0, 0.55]}>
            <coneGeometry args={[0.18, 0.4, 4]} />
            <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={3.0} />
          </mesh>
        )}
      </group>

      {/* ── DIVIDER ───────────────────────────────────────── */}
      <mesh position={[0.05, 0, 0]}>
        <boxGeometry args={[0.02, 2.4, 0.04]} />
        <meshStandardMaterial color="#3D8FFF" emissive="#3D8FFF" emissiveIntensity={0.8} transparent opacity={0.5} />
      </mesh>

      {/* ── RIGHT HALF: clock with sweep ───────────────────── */}
      <group position={[1.7, 0, 0]}>
        {/* Clock face — outer ring */}
        <mesh>
          <torusGeometry args={[1.0, 0.05, 16, 64]} />
          <meshStandardMaterial color="#3D8FFF" emissive="#3D8FFF" emissiveIntensity={1.6} />
        </mesh>

        {/* Filled sweep arc — represented as overlapping ring segments */}
        {Array.from({ length: 24 }).map((_, i) => {
          const segAngle = (i / 24) * Math.PI * 2;
          if (segAngle > clockSweep) return null;
          return (
            <mesh
              key={`s-${i}`}
              position={[Math.cos(segAngle) * 0.75, Math.sin(segAngle) * 0.75, 0]}
            >
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshStandardMaterial color="#3D8FFF" emissive="#3D8FFF" emissiveIntensity={2.2} />
            </mesh>
          );
        })}

        {/* Tick marks at 12-3-6-9 */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
          <mesh key={i} position={[Math.cos(-angle + Math.PI / 2) * 1.05, Math.sin(-angle + Math.PI / 2) * 1.05, 0]}>
            <boxGeometry args={[0.08, 0.08, 0.08]} />
            <meshStandardMaterial color="#9aa0a8" emissive="#9aa0a8" emissiveIntensity={1.0} />
          </mesh>
        ))}

        {/* Center hub */}
        <mesh>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#3D8FFF" emissiveIntensity={2.5} />
        </mesh>

        {/* Hand sweeping */}
        <mesh rotation={[0, 0, Math.PI / 2 - clockSweep]}>
          <boxGeometry args={[0.85, 0.06, 0.06]} />
          <meshStandardMaterial color="#3D8FFF" emissive="#3D8FFF" emissiveIntensity={2.5} />
        </mesh>
      </group>

      <pointLight position={[-1.5, 1, 2]} intensity={1.4} color="#00FF88" />
      <pointLight position={[1.5, 1, 2]} intensity={1.2} color="#3D8FFF" />
    </group>
  );
};
