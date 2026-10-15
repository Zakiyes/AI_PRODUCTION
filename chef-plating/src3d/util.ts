import * as THREE from 'three';

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const smooth = (x: number) => {
  const c = clamp(x);
  return c * c * (3 - 2 * c);
};
export const smoother = (x: number) => {
  const c = clamp(x);
  return c * c * c * (c * (c * 6 - 15) + 10);
};
export const prog = (t: number, a: number, b: number) => smoother((t - a) / (b - a));
export const easeOutBack = (x: number) => {
  const c = clamp(x);
  const k = 1.4;
  return 1 + (k + 1) * Math.pow(c - 1, 3) + k * Math.pow(c - 1, 2);
};

// deterministic random
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export const rng = (seed: number) => {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
};

// smooth 3D value noise
const h3 = (x: number, y: number, z: number) => hash(x * 157 + y * 113 + z * 271);
export function noise3(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const l = (a: number, b: number, p: number) => a + (b - a) * p;
  return l(
    l(l(h3(xi, yi, zi), h3(xi + 1, yi, zi), u), l(h3(xi, yi + 1, zi), h3(xi + 1, yi + 1, zi), u), v),
    l(l(h3(xi, yi, zi + 1), h3(xi + 1, yi, zi + 1), u), l(h3(xi, yi + 1, zi + 1), h3(xi + 1, yi + 1, zi + 1), u), v),
    w,
  );
}
export const fbm = (x: number, y: number, z: number, oct = 3) => {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) {
    s += a * noise3(x * f, y * f, z * f);
    a *= 0.5;
    f *= 2;
  }
  return s;
};

// Keyframed vector path: [[t, x, y, z], ...] with smooth easing between keys
export type K3 = [number, number, number, number];
export function path3(t: number, keys: K3[]): THREE.Vector3 {
  if (t <= keys[0][0]) return new THREE.Vector3(keys[0][1], keys[0][2], keys[0][3]);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t <= b[0]) {
      const p = smoother((t - a[0]) / (b[0] - a[0]));
      return new THREE.Vector3(lerp(a[1], b[1], p), lerp(a[2], b[2], p), lerp(a[3], b[3], p));
    }
  }
  const z = keys[keys.length - 1];
  return new THREE.Vector3(z[1], z[2], z[3]);
}
export function track(t: number, keys: [number, number][]): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t <= b[0]) return lerp(a[1], b[1], smoother((t - a[0]) / (b[0] - a[0])));
  }
  return keys[keys.length - 1][1];
}

// canvas texture helper
export function canvasTex(size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void, repeat = 1, srgb = false) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  draw(ctx, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
