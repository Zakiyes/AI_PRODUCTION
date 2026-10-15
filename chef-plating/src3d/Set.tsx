import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useLoader, useThree } from '@react-three/fiber';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { continueRender, delayRender, staticFile } from 'remotion';
import { canvasTex, fbm, hash, noise3, rng } from './util';
import {
  BALLS, Ball, GLASS_POS, OIL_DROPS, ORDER, PLATE_TOP, SAUCE_TOP, ballY, creamP, glassTurn, greensP, jamP, oilP, petalP, plateY,
} from './timeline';

// ---------- textures ----------
export function useImageTexture(url: string) {
  return useMemo(() => {
    const handle = delayRender('texture ' + url);
    const tex = new THREE.TextureLoader().load(staticFile(url), () => continueRender(handle), undefined, () => continueRender(handle));
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [url]);
}

const weaveTex = () =>
  canvasTex(512, (c, s) => {
    const img = c.createImageData(s, s);
    const r = rng(7);
    for (let y = 0; y < s; y++)
      for (let x = 0; x < s; x++) {
        const w = 0.5 + 0.25 * Math.sin(x * 1.6) * Math.sin(y * 1.6 + 1.5) + (r() - 0.5) * 0.35;
        const v = Math.round(128 + 70 * (w - 0.5));
        const i = (y * s + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
    c.putImageData(img, 0, 0);
  }, 60);

const crumbTex = (seed: number, light: boolean) =>
  canvasTex(512, (c, s) => {
    const r = rng(seed);
    c.fillStyle = light ? '#c9893d' : '#7a4120';
    c.fillRect(0, 0, s, s);
    for (let i = 0; i < 9000; i++) {
      const x = r() * s, y = r() * s, rad = 0.6 + r() * (light ? 3.2 : 2.4);
      const k = r();
      c.fillStyle = light
        ? k < 0.5 ? `rgba(232,178,96,${0.5 + r() * 0.5})` : k < 0.85 ? `rgba(160,92,36,${0.4 + r() * 0.5})` : 'rgba(250,215,140,0.8)'
        : k < 0.5 ? `rgba(150,84,40,${0.5 + r() * 0.5})` : k < 0.85 ? `rgba(70,34,16,${0.4 + r() * 0.5})` : 'rgba(190,120,60,0.8)';
      c.beginPath();
      if (light) c.ellipse(x, y, rad * 1.8, rad * 0.7, r() * Math.PI, 0, Math.PI * 2);
      else c.arc(x, y, rad, 0, Math.PI * 2);
      c.fill();
    }
  }, 2, true);

const crumbBump = (seed: number) =>
  canvasTex(512, (c, s) => {
    const r = rng(seed + 50);
    c.fillStyle = '#808080';
    c.fillRect(0, 0, s, s);
    for (let i = 0; i < 12000; i++) {
      const v = Math.floor(r() * 255);
      c.fillStyle = `rgb(${v},${v},${v})`;
      c.beginPath();
      c.arc(r() * s, r() * s, 0.8 + r() * 2.6, 0, Math.PI * 2);
      c.fill();
    }
  }, 2);

// ---------- backdrop: the restaurant, out of focus ----------
export const Backdrop: React.FC = () => {
  const tex = useLoader(THREE.TextureLoader, staticFile('ref/backdrop-blur.jpg'));
  tex.colorSpace = THREE.SRGBColorSpace;
  return (
    <mesh position={[8, 55, -140]}>
      <planeGeometry args={[193, 250]} />
      <meshBasicMaterial map={tex} toneMapped={false} color="#cfc6b8" />
    </mesh>
  );
};

// ---------- table with a long white cloth ----------
export const Table: React.FC = () => {
  const { top, bump } = useMemo(() => {
    const g = new THREE.CircleGeometry(80, 160, 0, Math.PI * 2);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      p.setY(i, (fbm(x * 0.03, 0, z * 0.03) - 0.5) * 0.25);
    }
    g.computeVertexNormals();
    return { top: g, bump: weaveTex() };
  }, []);
  return (
    <group>
      <mesh geometry={top} receiveShadow>
        <meshStandardMaterial color="#e6dfd2" roughness={0.95} bumpMap={bump} bumpScale={0.8} />
      </mesh>
      <mesh position={[0, -40, 0]} receiveShadow>
        <cylinderGeometry args={[80.2, 82, 80, 160, 1, true]} />
        <meshStandardMaterial color="#ddd5c7" roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// ---------- minimal round plate ----------
const plateGeom = () => {
  // closed profile (radius, height): flat well, gentle rise, thin rim, underside with a foot ring
  const pts = [
    [0, PLATE_TOP], [8.6, PLATE_TOP], [10.4, 0.95], [12.2, 1.45], [12.9, 1.62], [13.05, 1.55], [12.9, 1.35],
    [11.6, 0.85], [9.6, 0.42], [8.8, 0.0], [8.2, 0.0], [7.9, 0.22], [0, 0.22],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(pts.reverse(), 160);
};

const wobblyDisk = (r: number, amp: number, seed: number, h: number, inner = 0) => {
  const shape = new THREE.Shape();
  const N = 140;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const rr = r + amp * (fbm(Math.cos(a) * 1.6 + seed, Math.sin(a) * 1.6, seed) - 0.5) * 2 + amp * 0.35 * Math.sin(a * 9 + seed);
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  if (inner > 0) {
    const hole = new THREE.Path();
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const rr = inner + amp * 0.5 * (fbm(Math.cos(a) + seed * 3, Math.sin(a), 2) - 0.5);
      const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
      if (i === 0) hole.moveTo(x, y);
      else hole.lineTo(x, y);
    }
    shape.holes.push(hole);
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: true, bevelThickness: h * 0.8, bevelSize: Math.min(0.35, h * 1.2), bevelSegments: 4, curveSegments: 4 });
  g.rotateX(-Math.PI / 2);
  return g;
};

// ---------- the four balls ----------
const ballGeom = (b: Ball) => {
  const g = new THREE.SphereGeometry(b.r, 96, 72);
  const p = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = v.clone().normalize();
    const k = fbm(n.x * 2.2 + b.seed, n.y * 2.2, n.z * 2.2, 4) - 0.5;
    const fine = noise3(n.x * 14 + b.seed, n.y * 14, n.z * 14) - 0.5;
    const flat = n.y < -0.55 ? (n.y + 0.55) * 0.5 : 0; // sits on the sauce
    v.addScaledVector(n, k * 0.38 + fine * (b.kind === 'rice' ? 0.12 : 0.08) + flat);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
};

// piped cream swirl, grows with its draw range
const creamGeom = (seed: number) => {
  const pts: THREE.Vector3[] = [];
  const N = 90;
  for (let k = 0; k <= N; k++) {
    const u = k / N;
    const a = u * Math.PI * 2 * 2.4 + seed;
    const r = 0.95 * (1 - u) + 0.08;
    pts.push(new THREE.Vector3(Math.cos(a) * r, 0.2 + 0.9 * Math.pow(u, 0.9), Math.sin(a) * r));
  }
  pts.push(new THREE.Vector3(0.05, 1.32, 0.02));
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, 0.33, 18, false);
  // taper the tip and add tiny ridges like a star nozzle
  const p = g.attributes.position as THREE.BufferAttribute;
  return g;
};

const jamGeom = (seed: number) => {
  const g = new THREE.SphereGeometry(0.62, 40, 24);
  const p = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = v.clone().normalize();
    v.multiplyScalar(1 + (noise3(n.x * 3 + seed, n.y * 3, n.z * 3) - 0.5) * 0.6);
    v.y *= 0.42;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
};

const leafGeom = () => {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.35, 0.05, 0.42, 0.55, 0, 0.62);
  s.bezierCurveTo(-0.42, 0.55, -0.35, 0.05, 0, 0);
  const g = new THREE.ShapeGeometry(s, 12);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setZ(i, -0.25 * p.getX(i) * p.getX(i) + 0.1 * p.getY(i));
  g.computeVertexNormals();
  return g;
};
const petalGeom = () => {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.45, 0.2, 0.62, 0.95, 0.12, 1.25);
  s.bezierCurveTo(0.0, 1.3, -0.05, 1.3, -0.12, 1.25);
  s.bezierCurveTo(-0.62, 0.95, -0.45, 0.2, 0, 0);
  const g = new THREE.ShapeGeometry(s, 16);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setZ(i, 0.35 * p.getX(i) * p.getX(i) + 0.12 * p.getY(i) * p.getY(i));
  g.computeVertexNormals();
  return g;
};

export const Sprig: React.FC<{ seed: number }> = ({ seed }) => {
  const leaf = useMemo(leafGeom, []);
  const lean = (hash(seed) - 0.5) * 0.6;
  return (
    <group rotation={[lean, hash(seed + 1) * 6.28, lean * 0.6]}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.05, 1.4, 6]} />
        <meshStandardMaterial color="#d9e6b8" roughness={0.6} />
      </mesh>
      {[0, Math.PI].map((r, i) => (
        <mesh key={i} geometry={leaf} position={[0, 1.38, 0]} rotation={[-0.9, r, 0]} castShadow>
          <meshPhysicalMaterial color={i ? '#7aa83a' : '#86b443'} roughness={0.45} sheen={0.4} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
};
export const Petal: React.FC<{ color: string; s?: number }> = ({ color, s = 1 }) => {
  const g = useMemo(petalGeom, []);
  return (
    <mesh geometry={g} scale={s} castShadow>
      <meshPhysicalMaterial color={color} roughness={0.5} sheen={0.6} sheenColor="#ffffff" side={THREE.DoubleSide} transmission={0.15} thickness={0.05} />
    </mesh>
  );
};

// ---------- the dish ----------
export const Dish: React.FC<{ t: number }> = ({ t }) => {
  const g = useMemo(() => {
    const balls = BALLS.map(ballGeom);
    return {
      plate: plateGeom(),
      sauce: wobblyDisk(6.4, 0.45, 2, 0.12),
      oil: wobblyDisk(7.9, 0.55, 5, 0.03, 6.0),
      balls,
      cream: BALLS.map((b) => creamGeom(b.seed)),
      jam: BALLS.map((b) => jamGeom(b.seed)),
      tex: { meat: crumbTex(3, false), rice: crumbTex(9, true), bump: crumbBump(4) },
    };
  }, []);
  const y = plateY(t);
  return (
    <group position={[0, y, 0]}>
      <mesh geometry={g.plate} castShadow receiveShadow>
        <meshPhysicalMaterial color="#f8f6f1" roughness={0.32} clearcoat={0.4} clearcoatRoughness={0.25} />
      </mesh>
      <mesh geometry={g.oil} position={[0, PLATE_TOP + 0.02, 0]} receiveShadow>
        <meshPhysicalMaterial color="#9fbe2a" roughness={0.05} clearcoat={1} transparent opacity={0.88} />
      </mesh>
      <mesh geometry={g.sauce} position={[0, PLATE_TOP + 0.03, 0]} receiveShadow>
        <meshPhysicalMaterial color="#c2321c" roughness={0.18} clearcoat={0.9} clearcoatRoughness={0.1} />
      </mesh>
      {OIL_DROPS.map((d, i) => {
        const p = oilP(t, i);
        return p > 0 ? (
          <mesh key={i} position={[d.x, PLATE_TOP + 0.18, d.z]} scale={[d.r * p * 1.2, 0.12 * p, d.r * p]}>
            <sphereGeometry args={[1, 24, 12]} />
            <meshPhysicalMaterial color="#a8c22c" roughness={0.03} clearcoat={1} />
          </mesh>
        ) : null;
      })}
      {BALLS.map((b, i) => {
        const k = ORDER.indexOf(i);
        const cp = creamP(t, k);
        const jp = jamP(t, k);
        const gp = greensP(t, k);
        const pp = petalP(t, k);
        const by = ballY(b);
        const top = by + b.r * 0.94;
        const creamIndex = g.cream[i].index!.count;
        g.cream[i].setDrawRange(0, Math.floor(creamIndex * cp / 6) * 6);
        return (
          <group key={i}>
            <mesh geometry={g.balls[i]} position={[b.x, by, b.z]} rotation={[0, b.seed, 0]} castShadow receiveShadow>
              <meshPhysicalMaterial map={b.kind === 'meat' ? g.tex.meat : g.tex.rice} bumpMap={g.tex.bump} bumpScale={b.kind === 'meat' ? 2.4 : 3} roughness={0.78} sheen={0.3} sheenColor="#ffcc88" />
            </mesh>
            {cp > 0 && (
              <mesh geometry={g.cream[i]} position={[b.x, top - 0.25, b.z]} castShadow>
                <meshPhysicalMaterial color="#f7f2e6" roughness={0.42} sheen={0.5} sheenColor="#ffffff" clearcoat={0.2} />
              </mesh>
            )}
            {jp > 0 && (
              <mesh geometry={g.jam[i]} position={[b.x + 0.1, top + 1.05, b.z]} scale={[jp, 0.6 + 0.4 * jp, jp]} castShadow>
                <meshPhysicalMaterial color="#5c1410" roughness={0.12} clearcoat={1} clearcoatRoughness={0.05} />
              </mesh>
            )}
            {gp > 0 &&
              [0, 1, 2].map((s) => (
                <group key={s} position={[b.x + (s - 1) * 0.35, top + 1.15 + (1 - gp) * 0.8, b.z + (s % 2) * 0.3 - 0.1]} scale={gp * 1.6}>
                  <Sprig seed={b.seed * 10 + s} />
                </group>
              ))}
            {pp > 0 && (
              <group position={[b.x - 0.25, top + 1.3 + (1 - pp) * 0.7, b.z + 0.15]} scale={pp * 1.5}>
                <group rotation={[-1.05, b.seed * 1.7, 0.2]}>
                  <Petal color="#f7f1f3" />
                </group>
                <group rotation={[-1.1, b.seed * 1.7 + 2.3, -0.1]}>
                  <Petal color="#c22a78" s={0.85} />
                </group>
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
};

// ---------- coupe glass with an amber drink ----------
export const Glass: React.FC<{ t: number }> = ({ t }) => {
  const g = useMemo(() => {
    const outer = [
      [0, 0], [3.9, 0], [4.0, 0.15], [3.7, 0.35], [1.0, 0.7], [0.32, 1.4], [0.28, 9.5], [0.5, 10.4], [2.6, 11.2], [4.6, 12.3], [5.8, 13.6], [6.1, 14.3],
      [5.95, 14.35], [5.6, 13.8], [4.4, 12.6], [2.5, 11.6], [0.6, 11.0], [0, 10.9],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    const drink = [[0, 11.0], [0.6, 11.08], [2.5, 11.68], [4.35, 12.62], [5.05, 13.15], [0, 13.15]].map(([r, y]) => new THREE.Vector2(r * 0.985, y));
    const peel = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(Array.from({ length: 30 }, (_, i) => {
        const u = i / 29;
        return new THREE.Vector3(4.6 + Math.cos(u * 7) * 0.4, 13.4 - u * 3.2 + Math.sin(u * 7) * 0.3, Math.sin(u * 7) * 0.4);
      })),
      80, 0.16, 8, false,
    );
    return { outer: new THREE.LatheGeometry(outer, 120), drink: new THREE.LatheGeometry(drink, 120), peel };
  }, []);
  return (
    <group position={GLASS_POS} rotation={[0, glassTurn(t), 0]}>
      <mesh geometry={g.drink} castShadow>
        <meshPhysicalMaterial color="#e9a53f" transmission={0.75} thickness={2.5} roughness={0.05} ior={1.34} attenuationColor="#d9822a" attenuationDistance={4} clearcoat={1} />
      </mesh>
      <mesh geometry={g.peel} castShadow>
        <meshStandardMaterial color="#e5832a" roughness={0.5} />
      </mesh>
      <mesh geometry={g.outer} castShadow>
        <meshPhysicalMaterial color="#ffffff" transmission={1} thickness={0.3} roughness={0.02} ior={1.5} specularIntensity={1} clearcoat={1} side={THREE.DoubleSide} transparent opacity={1} envMapIntensity={1.6} />
      </mesh>
      {/* condensation: tiny drops on the bowl */}
      {Array.from({ length: 40 }).map((_, i) => {
        const a = hash(i) * Math.PI * 2;
        const y = 11.6 + hash(i + 9) * 2.4;
        const r = 2.6 + (y - 11.2) * 1.3;
        return (
          <mesh key={i} position={[Math.cos(a) * r, y, Math.sin(a) * r]} scale={0.06 + hash(i + 3) * 0.07}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshPhysicalMaterial color="#ffffff" transmission={1} roughness={0} thickness={0.1} />
          </mesh>
        );
      })}
    </group>
  );
};

// a soft studio environment so metal, glass and sauce get real reflections
export const Env: React.FC<{ intensity: number }> = ({ intensity }) => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  }, [gl, scene]);
  scene.environmentIntensity = intensity;
  return null;
};

// ---------- place setting: napkin, fork & knife, a small silver vase with red flowers ----------
export const Setting: React.FC = () => {
  const metal = { color: '#d8d9dc', metalness: 1, roughness: 0.2 } as const;
  return (
    <group>
      {/* linen napkin, folded */}
      <mesh position={[-20.5, 0.45, 2]} rotation={[0, 0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.5, 0.9, 16]} />
        <meshStandardMaterial color="#efe9de" roughness={0.95} />
      </mesh>
      {/* fork on the napkin */}
      <group position={[-20.5, 1.0, 3]} rotation={[0, 0.04, 0]}>
        <mesh position={[0, 0, 2]} castShadow>
          <boxGeometry args={[0.7, 0.15, 11]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        {[-0.75, -0.25, 0.25, 0.75].map((x) => (
          <mesh key={x} position={[x, 0, -6]} castShadow>
            <boxGeometry args={[0.22, 0.12, 4.5]} />
            <meshStandardMaterial {...metal} />
          </mesh>
        ))}
        <mesh position={[0, 0, -3.6]} castShadow>
          <boxGeometry args={[1.9, 0.14, 1.2]} />
          <meshStandardMaterial {...metal} />
        </mesh>
      </group>
      {/* knife */}
      <group position={[17.5, 0.12, 4]} rotation={[0, -0.03, 0]}>
        <mesh position={[0, 0, 4]} castShadow>
          <boxGeometry args={[0.9, 0.3, 9]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        <mesh position={[-0.15, 0, -4.5]} castShadow>
          <boxGeometry args={[1.5, 0.08, 9]} />
          <meshStandardMaterial {...metal} roughness={0.12} />
        </mesh>
      </group>
      {/* silver bud vase with red flowers, back of the table */}
      <group position={[-15, 0, -24]}>
        <mesh position={[0, 4, 0]} castShadow>
          <cylinderGeometry args={[1.4, 2.6, 8, 40]} />
          <meshStandardMaterial {...metal} roughness={0.25} />
        </mesh>
        {Array.from({ length: 7 }).map((_, i) => {
          const a = (i / 7) * Math.PI * 2;
          const r = i === 0 ? 0 : 2.2;
          return (
            <mesh key={i} position={[Math.cos(a) * r, 11 + (hash(i) - 0.5) * 2, Math.sin(a) * r]} scale={[2.0, 1.7, 2.0]} castShadow>
              <icosahedronGeometry args={[1, 3]} />
              <meshPhysicalMaterial color={i % 3 ? '#a4152a' : '#c22a4a'} roughness={0.6} sheen={0.8} sheenColor="#ff6680" />
            </mesh>
          );
        })}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[Math.cos(i * 1.7) * 2.8, 8.6, Math.sin(i * 1.7) * 2.8]} rotation={[Math.cos(i * 1.7) * 0.8, 0, Math.sin(i * 1.7) * 0.8]} scale={[1.4, 0.15, 2.6]} castShadow>
            <sphereGeometry args={[1, 16, 10]} />
            <meshStandardMaterial color="#3f6b35" roughness={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
};
