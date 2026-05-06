import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

/**
 * SignalHighlight — for the "but here's the real signal" beat.
 * A faint screen frame in 3D space with a moving spotlight/cursor
 * pointer pinpointing a critical detail. The italic "the real signal?"
 * wordmark is rendered by HTML overlay in Story3DScene.
 */
export const SignalHighlight: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const appear = interpolate(t, [0, 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.2, 0.8, 0.2, 1),
  });
  // Spotlight reaches its highlight position
  const spotlightT = interpolate(t, [0.3, 1.2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  // Spotlight position — sweeps in from left
  const spotX = interpolate(spotlightT, [0, 1], [-2.5, 0.6]);
  const spotY = interpolate(spotlightT, [0, 1], [0.3, -0.2]);

  return (
    <group>
      {/* Screen frame — like a TV monitor floating in space */}
      <group position={[0, 0, -0.3]}>
        {/* Screen body */}
        <mesh>
          <boxGeometry args={[5.5, 3.2, 0.12]} />
          <meshStandardMaterial
            color="#0a0c10"
            emissive="#0a0c10"
            emissiveIntensity={0.2}
            metalness={0.5}
            roughness={0.4}
          />
        </mesh>
        {/* Screen frame ring */}
        <mesh position={[0, 0, 0.06]}>
          <boxGeometry args={[5.6, 3.3, 0.04]} />
          <meshStandardMaterial color="#1a1d24" metalness={0.6} roughness={0.4} />
        </mesh>

        {/* Faint "content lines" suggesting an article/ui inside the screen */}
        {[1.0, 0.6, 0.2, -0.4, -0.8, -1.2].map((y, i) => (
          <mesh key={i} position={[-1.4 + i * 0.05, y, 0.07]}>
            <boxGeometry args={[2.5 - i * 0.2, 0.06, 0.02]} />
            <meshStandardMaterial
              color="#3a3f48"
              emissive="#3a3f48"
              emissiveIntensity={0.4}
              transparent
              opacity={0.5}
            />
          </mesh>
        ))}
      </group>

      {/* Highlight box — appears around the "important" detail when spotlight arrives */}
      {spotlightT > 0.85 && (
        <mesh position={[spotX, spotY, 0.05]} scale={[spotlightT, spotlightT, 1]}>
          <boxGeometry args={[1.6, 0.32, 0.04]} />
          <meshStandardMaterial
            color="#FF5E3A"
            emissive="#FF5E3A"
            emissiveIntensity={2.5}
            transparent
            opacity={0.5}
          />
        </mesh>
      )}

      {/* Spotlight cone — bright glow at the detail */}
      <mesh position={[spotX, spotY, 0.2]} scale={[appear, appear, 1]}>
        <circleGeometry args={[0.5, 32]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive="#FF5E3A"
          emissiveIntensity={3.5}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Cursor pointer arrow */}
      <group position={[spotX + 0.3, spotY - 0.15, 0.3]} rotation={[0, 0, -0.5]} scale={[appear, appear, appear]}>
        <mesh>
          <coneGeometry args={[0.15, 0.4, 4]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={2.0} />
        </mesh>
      </group>

      {/* Pulsing emphasis ring around highlighted area */}
      {spotlightT > 0.95 && (
        <mesh position={[spotX, spotY, 0.4]}>
          <torusGeometry
            args={[0.7 + Math.sin((t - 1.2) * 4) * 0.1, 0.03, 12, 32]}
          />
          <meshStandardMaterial color="#FF5E3A" emissive="#FF5E3A" emissiveIntensity={3.0} />
        </mesh>
      )}

      <pointLight position={[spotX, spotY, 2]} intensity={2.5} color="#FF5E3A" />
      <pointLight position={[0, 0, 2]} intensity={0.6} color="#FFFFFF" />
    </group>
  );
};
