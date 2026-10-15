// Everything in the film is a pure function of t (seconds). Units: centimetres, table top at y = 0.
import * as THREE from 'three';
import { K3, clamp, lerp, path3, prog, smoother, track } from './util';

export const PLATE_TOP = 0.75;
export const SAUCE_TOP = PLATE_TOP + 0.28;

export type Ball = { x: number; z: number; r: number; kind: 'meat' | 'rice'; seed: number };
export const BALLS: Ball[] = [
  { x: 0.2, z: -3.3, r: 2.1, kind: 'meat', seed: 1 },
  { x: 3.4, z: 0.1, r: 2.25, kind: 'rice', seed: 2 },
  { x: -0.1, z: 3.4, r: 2.1, kind: 'meat', seed: 3 },
  { x: -3.4, z: -0.1, r: 2.25, kind: 'rice', seed: 4 },
];
export const ballY = (b: Ball) => SAUCE_TOP + b.r * 0.9;
export const ballTop = (b: Ball) => new THREE.Vector3(b.x, ballY(b) + b.r * 0.97, b.z);
// order the chef works in (back-left to front, so the hand never covers finished work)
export const ORDER = [0, 1, 3, 2];

export const GLASS_POS = new THREE.Vector3(16.5, 0, -9);

// ---------- plate entrance (shot 2) ----------
export function plateY(t: number) {
  return track(t, [[3.0, 34], [4.6, 0.0]]);
}
export const plateVisible = (t: number) => t >= 3.0;

// ---------- topping progress ----------
const CREAM_T0 = 6.55, CREAM_DT = 0.82, CREAM_LEN = 0.55;
const JAM_T0 = 10.5, JAM_DT = 0.85, JAM_LEN = 0.3;
const GARN_T0 = 14.5, GARN_DT = 1.12;
export const creamP = (t: number, k: number) => prog(t, CREAM_T0 + k * CREAM_DT, CREAM_T0 + k * CREAM_DT + CREAM_LEN);
export const jamP = (t: number, k: number) => prog(t, JAM_T0 + k * JAM_DT + 0.12, JAM_T0 + k * JAM_DT + 0.12 + JAM_LEN);
export const greensP = (t: number, k: number) => prog(t, GARN_T0 + k * GARN_DT + 0.2, GARN_T0 + k * GARN_DT + 0.45);
export const petalP = (t: number, k: number) => prog(t, GARN_T0 + k * GARN_DT + 0.7, GARN_T0 + k * GARN_DT + 0.95);
export const OIL_DROPS = Array.from({ length: 7 }, (_, i) => {
  const a = (i / 7) * Math.PI * 2 + 0.4;
  return { x: Math.cos(a) * 7.3, z: Math.sin(a) * 7.3, t0: 19.25 + i * 0.17, r: 0.32 + ((i * 37) % 10) / 60 };
});
export const oilP = (t: number, i: number) => prog(t, OIL_DROPS[i].t0, OIL_DROPS[i].t0 + 0.18);

// ---------- tool paths: tip position over time ----------
// each action: hover above target, dip, lift, move on.
function actionKeys(t0: number, dt: number, dipAt: number, dipLen: number, hover: number, order: number[], targets: THREE.Vector3[], enter: THREE.Vector3, exit: THREE.Vector3, tIn: number, tOut: number): K3[] {
  const keys: K3[] = [[tIn, enter.x, enter.y, enter.z]];
  order.forEach((bi, k) => {
    const p = targets[bi];
    const s = t0 + k * dt;
    keys.push([s + dipAt - 0.22, p.x, p.y + hover, p.z]);
    keys.push([s + dipAt, p.x, p.y + 0.15, p.z]);
    keys.push([s + dipAt + dipLen, p.x, p.y + 0.35, p.z]);
    keys.push([s + dipAt + dipLen + 0.18, p.x, p.y + hover, p.z]);
  });
  keys.push([tOut, exit.x, exit.y, exit.z]);
  return keys;
}

const tops = BALLS.map(ballTop);
export function pipingTip(t: number) {
  // cream rises 1.2 above the ball top while piping
  const keys = actionKeys(CREAM_T0, CREAM_DT, 0, CREAM_LEN, 2.4, ORDER, tops.map((v) => v.clone().add(new THREE.Vector3(0, 0.25, 0))), new THREE.Vector3(-14, 18, 6), new THREE.Vector3(-10, 22, 10), 6.0, 10.0);
  const p = path3(t, keys);
  // the nozzle lifts as the swirl builds
  ORDER.forEach((bi, k) => {
    const c = creamP(t, k);
    if (c > 0 && c < 1) p.y += c * 1.0;
  });
  return p;
}
export function spoonTip(t: number) {
  const jamTops = tops.map((v) => v.clone().add(new THREE.Vector3(0, 1.35, 0)));
  return path3(t, actionKeys(JAM_T0, JAM_DT, 0.12, JAM_LEN, 2.0, ORDER, jamTops, new THREE.Vector3(16, 16, 8), new THREE.Vector3(16, 20, 6), 10.0, 14.0));
}
export function tweezerTip(t: number) {
  const gTops = tops.map((v) => v.clone().add(new THREE.Vector3(0.15, 1.7, 0.1)));
  const keys: K3[] = [[14.0, -12, 14, 9]];
  ORDER.forEach((bi, k) => {
    const p = gTops[bi];
    const s = GARN_T0 + k * GARN_DT;
    keys.push([s + 0.05, p.x - 0.3, p.y + 2.2, p.z + 0.3]);
    keys.push([s + 0.3, p.x - 0.1, p.y + 0.2, p.z]);
    keys.push([s + 0.5, p.x - 0.2, p.y + 1.8, p.z + 0.4]);
    keys.push([s + 0.78, p.x + 0.2, p.y + 0.25, p.z - 0.1]);
    keys.push([s + 1.0, p.x + 0.2, p.y + 2.2, p.z + 0.2]);
  });
  keys.push([19.0, -12, 16, 10]);
  return path3(t, keys);
}
// tweezer jaws close while carrying something
export function tweezerGrip(t: number) {
  let g = 0.0;
  for (let k = 0; k < 4; k++) {
    const s = GARN_T0 + k * GARN_DT;
    if ((t > s - 0.3 && t < s + 0.3) || (t > s + 0.4 && t < s + 0.78)) g = 1;
  }
  return g;
}
// whether the tweezers currently carry greens / a petal (drawn in the jaws)
export function tweezerCarry(t: number): 'greens' | 'petal' | null {
  for (let k = 0; k < 4; k++) {
    const s = GARN_T0 + k * GARN_DT;
    if (t > s - 0.35 && t < s + 0.28) return 'greens';
    if (t > s + 0.42 && t < s + 0.76) return 'petal';
  }
  return null;
}
export function bottleTip(t: number) {
  const keys: K3[] = [[18.9, 20, 14, 10]];
  OIL_DROPS.forEach((d) => keys.push([d.t0, d.x, SAUCE_TOP + 3.2, d.z]));
  keys.push([20.7, 14, 9, 4]);
  keys.push([21.1, GLASS_POS.x - 4.5, 9, GLASS_POS.z + 2]); // reaches for the glass stem
  keys.push([21.6, GLASS_POS.x - 4.5, 9, GLASS_POS.z + 2]);
  keys.push([22.2, 24, 16, 10]);
  return path3(t, keys);
}
export const glassTurn = (t: number) => track(t, [[21.1, 0], [21.6, 0.35]]);

// ---------- camera ----------
export type Cam = { pos: THREE.Vector3; look: THREE.Vector3; fov: number; up?: THREE.Vector3; focusRange: number; bokeh: number };
export function camera(t: number): Cam {
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  // tiny operator drift: real cameras breathe
  const d = v(Math.sin(t * 0.7) * 0.3, Math.sin(t * 0.53 + 1) * 0.25, 0);
  if (t < 3) {
    const p = smoother(t / 3);
    return { pos: v(lerp(-8, -3, p), lerp(44, 36, p), lerp(100, 76, p)).add(d), look: v(6, 4, -6), fov: 32, focusRange: 40, bokeh: 3 };
  }
  if (t < 6) {
    const p = smoother((t - 3) / 3);
    const bump = t > 4.6 ? Math.exp(-(t - 4.6) * 9) * Math.sin((t - 4.6) * 40) * 0.12 : 0;
    return { pos: v(lerp(-3, -1, p), lerp(36, 32, p) + bump, lerp(50, 44, p)).add(d), look: v(3, lerp(6, 3, p), -2), fov: 32, focusRange: 22, bokeh: 3 };
  }
  if (t < 10) {
    const tip = pipingTip(t);
    const p = (t - 6) / 4;
    return { pos: v(lerp(-16, -12, p), 22, lerp(27, 25, p)).add(d), look: v(tip.x * 0.3, 7.5, tip.z * 0.3), fov: 32, focusRange: 4, bokeh: 8 };
  }
  if (t < 14) {
    const tip = spoonTip(t);
    const p = (t - 10) / 4;
    return { pos: v(lerp(19, 15, p), 20, lerp(24, 26, p)).add(d), look: v(tip.x * 0.3, 7.5, tip.z * 0.3), fov: 32, focusRange: 4, bokeh: 8 };
  }
  if (t < 19) {
    const tip = tweezerTip(t);
    const p = (t - 14) / 5;
    const lx = clamp(tip.x, -4, 4) * 0.5;
    const lz = clamp(tip.z, -4, 4) * 0.5;
    return { pos: v(lerp(-10, -7, p) + lx * 0.4, 17, lerp(20, 18, p) + lz * 0.4).add(d.multiplyScalar(0.5)), look: v(lx, 7.2, lz), fov: 30, focusRange: 3, bokeh: 9 };
  }
  if (t < 22) {
    const p = smoother((t - 19) / 3);
    return { pos: v(lerp(28, 30, p), 18, lerp(26, 20, p)).add(d), look: v(lerp(5, 11, p), 6, lerp(0, -5, p)), fov: 32, focusRange: 14, bokeh: 4 };
  }
  if (t < 25) {
    const p = smoother((t - 22) / 3);
    return { pos: v(lerp(4, 2, p), lerp(27, 23, p), lerp(38, 32, p)).add(d), look: v(4, 3, -3), fov: 32, focusRange: 14, bokeh: 3.5 };
  }
  // top-down hero, rotating slowly; plate sits low in frame, white cloth above for the logo
  const p = (t - 25) / 5;
  const a = lerp(-0.08, 0.1, smoother(p));
  return { pos: v(4, lerp(110, 102, smoother(p)), -12), look: v(4, 0, -12), fov: 32, up: v(Math.sin(a), 0, -Math.cos(a)), focusRange: 60, bokeh: 1 };
}

// warm light drifts a little warmer toward the end
export const warmth = (t: number) => track(t, [[0, 0], [22, 0.2], [26, 0.55], [30, 0.6]]);
