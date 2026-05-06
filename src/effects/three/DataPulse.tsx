import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

/**
 * DataPulse — multiple traveling light pulses along a curved bus.
 * Color-coded: blue = request out, green = response back, white = data.
 * Used for "live access to your Meta marketing API" beat.
 *
 * The geometry is a horizontal pipe with bend, with N pulses moving
 * along it at different phases. Reads as "real-time data streaming."
 */
export const DataPulse: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const appear = interpolate(t, [0, 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Path defined as Bézier-ish curve from left to right with a slight downward bend
  const sample = (p: number): [number, number] => {
    // Quadratic bezier: P0 = (-3, 0.6), P1 = (0, -0.4), P2 = (3, 0.6)
    const x = (1 - p) * (1 - p) * -3 + 2 * (1 - p) * p * 0 + p * p * 3;
    const y = (1 - p) * (1 - p) * 0.6 + 2 * (1 - p) * p * -0.4 + p * p * 0.6;
    return [x, y];
  };

  // Render the pipe as a series of small spheres along the path
  const pipeBeads = 36;

  return (
    <group scale={[appear, appear, appear]}>
      {/* Left endpoint — MCP node */}
      <mesh position={[-3, 0.6, 0]}>
        <boxGeometry args={[0.7, 0.5, 0.3]} />
        <meshStandardMaterial color="#0866FF" emissive="#0866FF" emissiveIntensity={1.5} />
      </mesh>
      {/* Right endpoint — Meta API */}
      <mesh position={[3, 0.6, 0]}>
        <boxGeometry args={[0.7, 0.5, 0.3]} />
        <meshStandardMaterial color="#0866FF" emissive="#0866FF" emissiveIntensity={1.5} />
      </mesh>

      {/* Pipe rendered as bead chain */}
      {Array.from({ length: pipeBeads }).map((_, i) => {
        const p = i / (pipeBeads - 1);
        const [x, y] = sample(p);
        return (
          <mesh key={`bead-${i}`} position={[x, y, -0.05]}>
            <sphereGeometry args={[0.05, 6, 6]} />
            <meshStandardMaterial color="#3D8FFF" emissive="#3D8FFF" emissiveIntensity={0.5} transparent opacity={0.5} />
          </mesh>
        );
      })}

      {/* Multiple traveling pulses */}
      {[
        { phase: 0.0, color: "#3D8FFF", direction: 1 },    // request blue →
        { phase: 0.35, color: "#FFFFFF", direction: 1 },   // data white →
        { phase: 0.7, color: "#00FF88", direction: -1 },   // response green ←
        { phase: 1.05, color: "#3D8FFF", direction: 1 },
        { phase: 1.4, color: "#00FF88", direction: -1 },
      ].map((pulse, i) => {
        const speed = 0.45;
        const localT = (t * speed + pulse.phase) % 1.5;
        const p = pulse.direction === 1 ? localT / 1.5 : 1 - localT / 1.5;
        if (p < 0 || p > 1) return null;
        const [x, y] = sample(p);
        const opacity = interpolate(localT, [0, 0.1, 1.4, 1.5], [0, 1, 1, 0]);
        return (
          <mesh key={`pulse-${i}`} position={[x, y, 0.1]}>
            <sphereGeometry args={[0.16, 16, 16]} />
            <meshStandardMaterial
              color={pulse.color}
              emissive={pulse.color}
              emissiveIntensity={3.5}
              transparent
              opacity={opacity}
            />
          </mesh>
        );
      })}

      <pointLight position={[0, 1, 2]} intensity={1.5} color="#3D8FFF" />
      <pointLight position={[0, -1, 2]} intensity={0.8} color="#00FF88" />
    </group>
  );
};
