import React, { useMemo } from "react";
import * as THREE from "three";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BloomHalo } from "./Bloom";

/**
 * Constellation of glowing nodes connected by faint cyan threads, slowly
 * rotating around a hot coral epicenter.
 *
 * Polish layer: small light packets travel along each connection from
 * the epicenter outward — looks like data flowing through the network.
 * Multiple bloom halos around the central node give it real "sun" weight.
 *
 * Used for the takeaway shot: "China shipped frontier AI without American
 * silicon" — the network is the symbolic image.
 */
export const NodeNetwork: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Node positions
  const nodes = useMemo(() => {
    const arr: { pos: [number, number, number]; seed: number }[] = [];
    const count = 36;
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(2 * rng(i * 1.7) - 1);
      const theta = rng(i * 3.1) * Math.PI * 2;
      const r = 2.0 + rng(i * 5.3) * 1.4;
      arr.push({
        pos: [
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta) * 0.7,
          r * Math.cos(phi),
        ],
        seed: rng(i * 7.7),
      });
    }
    return arr;
  }, []);

  // Connections — each node to its 2 nearest neighbors
  const connections = useMemo(() => {
    const conns: { from: number; to: number; dist: number }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      const dists = nodes
        .map((n, j) => {
          if (j === i) return { j, d: Infinity };
          const dx = n.pos[0] - nodes[i].pos[0];
          const dy = n.pos[1] - nodes[i].pos[1];
          const dz = n.pos[2] - nodes[i].pos[2];
          return { j, d: Math.sqrt(dx * dx + dy * dy + dz * dz) };
        })
        .sort((a, b) => a.d - b.d);
      for (let k = 0; k < 2; k++) {
        const target = dists[k].j;
        if (i < target) conns.push({ from: i, to: target, dist: dists[k].d });
      }
    }
    return conns;
  }, [nodes]);

  // Connections from epicenter (origin) to closest 8 nodes — these get light packets
  const epicenterConns = useMemo(() => {
    return nodes
      .map((n, i) => ({
        i,
        d: Math.sqrt(n.pos[0] ** 2 + n.pos[1] ** 2 + n.pos[2] ** 2),
      }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 10);
  }, [nodes]);

  const rotY = t * 0.2;
  const rotX = Math.sin(t * 0.3) * 0.1;

  return (
    <group rotation={[rotX, rotY, 0]}>
      {/* Central epicenter — dark v4: bright glowing sun + bloom halo */}
      <group>
        <mesh>
          <sphereGeometry args={[0.22, 24, 24]} />
          <meshStandardMaterial
            color="#FF5E3A"
            emissive="#FF5E3A"
            emissiveIntensity={2.5 + Math.sin(t * 3) * 0.7}
          />
        </mesh>
        <BloomHalo
          color="#FF5E3A"
          innerRadius={0.3}
          outerRadius={1.4}
          intensity={0.45 + Math.sin(t * 3) * 0.1}
          layers={5}
        />
      </group>

      {/* Light packets traveling outward from epicenter */}
      {epicenterConns.map((ec, i) => {
        const target = nodes[ec.i].pos;
        // Each packet has a phase — stagger so they don't all fire at once
        const period = 1.6;
        const phase = (i / epicenterConns.length) * period;
        const packetT = ((t + phase) % period) / period;

        const x = target[0] * packetT;
        const y = target[1] * packetT;
        const z = target[2] * packetT;
        const sz = 0.07 * (0.6 + 0.4 * Math.sin(packetT * Math.PI));

        return (
          <mesh key={`pkt-${i}`} position={[x, y, z]}>
            <sphereGeometry args={[sz, 8, 8]} />
            <meshBasicMaterial
              color="#FFE94A"
              transparent
              opacity={0.9 * Math.sin(packetT * Math.PI)}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        );
      })}

      {/* Nodes */}
      {nodes.map((n, i) => {
        const fadeDelay = i * 0.04;
        const fadeIn = interpolate(t - fadeDelay, [0, 0.5], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const pulse = Math.sin(t * 1.8 + n.seed * 12) * 0.5 + 0.5;
        const intensity = (0.5 + pulse * 1.4) * fadeIn;
        const isHot = n.seed > 0.78;
        const col = isHot ? "#FF8A65" : "#3DDCC9";

        return (
          <group key={i} position={n.pos}>
            <mesh>
              <sphereGeometry args={[0.07, 8, 8]} />
              <meshStandardMaterial
                color={col}
                emissive={col}
                emissiveIntensity={intensity}
                transparent
                opacity={fadeIn}
              />
            </mesh>
            {fadeIn > 0.7 && (
              <BloomHalo
                color={col}
                innerRadius={0.08}
                outerRadius={0.22}
                intensity={0.18 + pulse * 0.15}
                layers={2}
              />
            )}
          </group>
        );
      })}

      {/* Connection lines — cyan threads on dark bg */}
      {connections.map((c, i) => {
        const fromPos = new THREE.Vector3(...nodes[c.from].pos);
        const toPos = new THREE.Vector3(...nodes[c.to].pos);
        const mid = new THREE.Vector3().addVectors(fromPos, toPos).multiplyScalar(0.5);
        const dir = new THREE.Vector3().subVectors(toPos, fromPos);
        const len = dir.length();
        const quat = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          dir.clone().normalize(),
        );

        const fadeDelay = 0.4 + i * 0.025;
        const fadeIn = interpolate(t - fadeDelay, [0, 0.4], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <mesh
            key={i}
            position={mid.toArray()}
            quaternion={quat.toArray() as [number, number, number, number]}
          >
            <cylinderGeometry args={[0.008, 0.008, len, 4]} />
            <meshBasicMaterial
              color="#3DDCC9"
              transparent
              opacity={0.22 * fadeIn}
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
