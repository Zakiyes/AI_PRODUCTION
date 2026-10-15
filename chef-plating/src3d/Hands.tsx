import React from 'react';
import * as THREE from 'three';
import { Petal, Sprig } from './Set';

// Black nitrile glove + white chef-jacket sleeve.
// Hand frame: wrist at origin, fingers along +Z, palm facing -Y, right hand (thumb on -X).
const GLOVE = { color: '#18181b', roughness: 0.52, clearcoat: 0.22, clearcoatRoughness: 0.55, sheen: 0.5, sheenColor: '#4a4a55' } as const;

type Curl = [number, number, number];
export type Pose = { fingers: [Curl, Curl, Curl, Curl]; spread: number; thumb: [number, number, number] };

export const POSES: Record<string, Pose> = {
  grip: { fingers: [[1.25, 1.25, 0.9], [1.3, 1.25, 0.9], [1.35, 1.25, 0.9], [1.4, 1.2, 0.85]], spread: 0.02, thumb: [0.9, 0.6, 0.6] },
  pinch: { fingers: [[0.55, 0.55, 0.35], [0.85, 0.85, 0.55], [1.15, 1.1, 0.8], [1.3, 1.15, 0.85]], spread: 0.05, thumb: [0.55, 0.35, 0.35] },
  hold: { fingers: [[0.35, 0.25, 0.15], [0.4, 0.3, 0.15], [0.45, 0.3, 0.2], [0.5, 0.35, 0.2]], spread: 0.12, thumb: [0.15, 0.1, 0.1] },
};

const Seg: React.FC<{ len: number; r: number }> = ({ len, r }) => (
  <mesh position={[0, 0, len / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
    <capsuleGeometry args={[r, Math.max(0.01, len - r), 8, 16]} />
    <meshPhysicalMaterial {...GLOVE} />
  </mesh>
);

const Finger: React.FC<{ base: [number, number, number]; lens: number[]; r: number; curl: Curl; yaw: number }> = ({ base, lens, r, curl, yaw }) => (
  <group position={base} rotation={[curl[0], yaw, 0]}>
    <Seg len={lens[0]} r={r} />
    <group position={[0, 0, lens[0]]} rotation={[curl[1], 0, 0]}>
      <Seg len={lens[1]} r={r * 0.9} />
      <group position={[0, 0, lens[1]]} rotation={[curl[2], 0, 0]}>
        <Seg len={lens[2]} r={r * 0.8} />
      </group>
    </group>
  </group>
);

export const Hand: React.FC<{ pose: Pose; left?: boolean; sleeve?: number }> = ({ pose, left = false, sleeve = 26 }) => {
  const s = left ? -1 : 1;
  const F = pose.fingers;
  return (
    <group scale={[s, 1, 1]}>
      {/* sleeve + cuff */}
      <mesh position={[0, 0.3, -2.5 - sleeve / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[4.1, 4.5, sleeve, 40, 1, false]} />
        <meshStandardMaterial color="#f4f2ee" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.3, -2.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[4.05, 0.35, 12, 48]} />
        <meshStandardMaterial color="#e9e6e0" roughness={0.9} />
      </mesh>
      {/* wrist & palm */}
      <mesh position={[0, 0, -0.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[2.2, 3.2, 8, 24]} />
        <meshPhysicalMaterial {...GLOVE} />
      </mesh>
      <mesh position={[0, 0, 4.0]} scale={[3.95, 1.4, 4.7]} castShadow>
        <sphereGeometry args={[1, 40, 28]} />
        <meshPhysicalMaterial {...GLOVE} />
      </mesh>
      <Finger base={[-2.3, 0.1, 7.7]} lens={[3.7, 2.4, 2.0]} r={0.78} curl={F[0]} yaw={-pose.spread} />
      <Finger base={[-0.76, 0.15, 8.1]} lens={[4.1, 2.7, 2.1]} r={0.8} curl={F[1]} yaw={0} />
      <Finger base={[0.76, 0.1, 7.9]} lens={[3.8, 2.5, 2.0]} r={0.77} curl={F[2]} yaw={pose.spread} />
      <Finger base={[2.25, 0.0, 7.3]} lens={[3.0, 2.0, 1.7]} r={0.68} curl={F[3]} yaw={pose.spread * 2} />
      {/* thumb: comes out of the palm side, swings under toward the fingers */}
      <group position={[-3.3, -0.5, 2.6]} rotation={[pose.thumb[0] * 0.6, -0.75 + pose.thumb[0] * 0.5, -0.5 - pose.thumb[0] * 0.4]}>
        <Seg len={3.3} r={1.02} />
        <group position={[0, 0, 3.3]} rotation={[pose.thumb[1], 0, 0]}>
          <Seg len={2.6} r={0.95} />
          <group position={[0, 0, 2.6]} rotation={[pose.thumb[2], 0, 0]}>
            <Seg len={1.4} r={0.9} />
          </group>
        </group>
      </group>
    </group>
  );
};

const METAL = { color: '#d9dbde', metalness: 1, roughness: 0.18 } as const;

// ---------- tools (tip at origin, tool runs up +Y) ----------
export const PipingBag: React.FC = () => (
  <group>
    <mesh position={[0, 0.75, 0]} rotation={[Math.PI, 0, 0]} castShadow>
      <coneGeometry args={[0.6, 1.5, 24, 1, true]} />
      <meshStandardMaterial {...METAL} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, 1.5 + 6.5, 0]} rotation={[Math.PI, 0, 0]}>
      <coneGeometry args={[2.25, 13, 40, 1, true]} />
      <meshStandardMaterial color="#f5f0e4" roughness={0.6} />
    </mesh>
    <mesh position={[0, 1.4 + 6.8, 0]} rotation={[Math.PI, 0, 0]} castShadow>
      <coneGeometry args={[2.7, 13.6, 48, 1, true]} />
      <meshPhysicalMaterial color="#ffffff" transmission={0.75} roughness={0.35} thickness={0.1} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, 15.6, 0]} castShadow>
      <cylinderGeometry args={[0.9, 2.3, 1.6, 24]} />
      <meshPhysicalMaterial color="#ffffff" transmission={0.7} roughness={0.4} thickness={0.1} />
    </mesh>
  </group>
);

export const Spoon: React.FC = () => (
  <group>
    <mesh position={[0, 0.35, 0.9]} scale={[0.95, 0.28, 1.25]} castShadow>
      <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
      <meshStandardMaterial {...METAL} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, 0.25, 0.9]} scale={[0.8, 0.12, 1.05]}>
      <sphereGeometry args={[1, 24, 12]} />
      <meshPhysicalMaterial color="#5c1410" roughness={0.12} clearcoat={1} />
    </mesh>
    <mesh position={[0, 7, -0.6]} rotation={[0.18, 0, 0]} castShadow>
      <boxGeometry args={[0.5, 13, 0.22]} />
      <meshStandardMaterial {...METAL} />
    </mesh>
  </group>
);

export const Tweezers: React.FC<{ grip: number; carry: 'greens' | 'petal' | null }> = ({ grip, carry }) => {
  const open = 0.32 * (1 - grip) + 0.04;
  return (
    <group>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (open + 0.12), 6.6, 0]} rotation={[0, 0, s * -(open * 0.06)]} castShadow>
          <boxGeometry args={[0.2, 13.2, 0.55]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
      ))}
      <mesh position={[0, 13.2, 0]} castShadow>
        <boxGeometry args={[0.9, 0.5, 0.6]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      {carry === 'greens' && (
        <group position={[0, -0.2, 0]} rotation={[0.2, 0, 0.3]}>
          <Sprig seed={99} />
        </group>
      )}
      {carry === 'petal' && (
        <group position={[0, -0.1, 0]} rotation={[-1.2, 0.4, 0]}>
          <Petal color="#c22a78" s={0.85} />
        </group>
      )}
    </group>
  );
};

export const Bottle: React.FC = () => (
  <group>
    <mesh position={[0, 0.9, 0]} rotation={[Math.PI, 0, 0]} castShadow>
      <coneGeometry args={[0.5, 1.8, 20]} />
      <meshPhysicalMaterial color="#f4f4f0" roughness={0.3} transmission={0.5} thickness={0.2} />
    </mesh>
    <mesh position={[0, 7.5, 0]} castShadow>
      <cylinderGeometry args={[2.0, 2.0, 11, 36]} />
      <meshPhysicalMaterial color="#ffffff" transmission={0.85} roughness={0.25} thickness={0.3} />
    </mesh>
    <mesh position={[0, 5.5, 0]}>
      <cylinderGeometry args={[1.8, 1.8, 6.5, 36]} />
      <meshPhysicalMaterial color="#9fbe2a" transmission={0.5} roughness={0.1} thickness={2} />
    </mesh>
  </group>
);

// Place a tool by its tip; the gloved hand holds it. `lean` tilts the tool top away from camera.
export const HeldTool: React.FC<{
  tip: THREE.Vector3;
  yaw: number;
  lean: number;
  roll?: number;
  grip: { pos: [number, number, number]; rot: [number, number, number]; pose: Pose };
  children: React.ReactNode;
}> = ({ tip, yaw, lean, roll = 0, grip, children }) => (
  <group position={tip} rotation={[lean, yaw, roll, 'YXZ']}>
    {children}
    <group position={grip.pos} rotation={grip.rot}>
      <Hand pose={grip.pose} />
    </group>
  </group>
);
