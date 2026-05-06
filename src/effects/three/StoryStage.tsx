import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { CameraRig } from "./CameraRig";
import { AmbientParticles } from "./AmbientParticles";
import { StoryVariant } from "../../scenes/Story3DScene";

interface StoryStageProps {
  variant: StoryVariant;
  durationSeconds: number;
  bg?: string;
  keyColor?: string;
  fillColor?: string;
  accentColor?: string;
  particles?: boolean;
  /** If true, the stage's bg + floor are rendered transparent so a video
   *  layer behind shows through. Used when a Veo cinematic clip provides
   *  the actual background (e.g. silicon wafer for chip beat). */
  transparent?: boolean;
  children: React.ReactNode;
}

/**
 * Cinematic Three.js stage — dark v4 theme with bloom + dust + reflective floor.
 *
 * Floor color is matched EXACTLY to bg so the floor edge doesn't read as a
 * horizon line in the rendered frame (the v4 divider issue). Contact shadows
 * still render because they're projected onto the floor plane regardless.
 */
export const StoryStage: React.FC<StoryStageProps> = ({
  variant,
  durationSeconds,
  bg = "#06070A",
  keyColor = "#fff5e0",
  fillColor = "#a8c8ff",
  accentColor = "#ff5e3a",
  particles = true,
  transparent = false,
  children,
}) => {
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={transparent ? undefined : { backgroundColor: bg }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [0, 0.4, 6], fov: 30 }}
        gl={transparent ? { alpha: true, premultipliedAlpha: false } : undefined}
      >
        <CameraRig variant={variant} durationSeconds={durationSeconds} />

        {/* Lights */}
        <ambientLight intensity={0.18} color={fillColor} />
        <directionalLight position={[4, 6, 5]} intensity={2.0} color={keyColor} />
        <directionalLight position={[-5, 3, 2]} intensity={0.6} color={fillColor} />
        <pointLight
          position={[0, -3, -2]}
          intensity={1.2}
          color={accentColor}
          distance={12}
          decay={1.5}
        />

        {particles && (
          <AmbientParticles count={130} spread={9} color="#ffe7c2" />
        )}

        {/* Floor — color matches bg exactly so no visible horizon line.
            Hidden in transparent mode so the Veo video bg shows fully. */}
        {!transparent && (
          <mesh
            position={[0, -3.5, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[40, 40]} />
            <meshPhysicalMaterial
              color={bg}
              metalness={0.6}
              roughness={0.5}
              clearcoat={0.3}
              clearcoatRoughness={0.4}
            />
          </mesh>
        )}

        {children}

        {/* Bloom — v4 levels (the user's preferred dark look) */}
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.55}
            luminanceThreshold={0.55}
            luminanceSmoothing={0.4}
            mipmapBlur
            kernelSize={3}
          />
          <Vignette eskil={false} offset={0.25} darkness={0.45} />
        </EffectComposer>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
