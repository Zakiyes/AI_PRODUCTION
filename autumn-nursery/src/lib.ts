export type Pt = [number, number];
export type Ease = (x: number) => number;

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const lerpPt = (a: Pt, b: Pt, p: number): Pt => [lerp(a[0], b[0], p), lerp(a[1], b[1], p)];

export const linear: Ease = (x) => x;
export const easeInOut: Ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOut: Ease = (x) => 1 - Math.pow(1 - x, 3);
export const easeIn: Ease = (x) => x * x * x;
export const sine: Ease = (x) => -(Math.cos(Math.PI * x) - 1) / 2;
export const backOut: Ease = (x) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

// 0..1 progress of t through [a, b], eased.
export const prog = (t: number, a: number, b: number, e: Ease = easeInOut) => e(clamp((t - a) / (b - a)));

// Keyframe track: [[time, value, ease?], ...]; ease applies to the segment ending at that key.
export type Key = [number, number, Ease?];
export function track(t: number, keys: Key[]): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1, e] = keys[i + 1];
    if (t <= t1) return lerp(v0, v1, (e ?? easeInOut)((t - t0) / (t1 - t0)));
  }
  return keys[keys.length - 1][1];
}

export type PtKey = [number, number, number, Ease?];
export function trackPt(t: number, keys: PtKey[]): Pt {
  return [track(t, keys.map((k) => [k[0], k[1], k[3]] as Key)), track(t, keys.map((k) => [k[0], k[2], k[3]] as Key))];
}

// Smooth path through timed points (Catmull-Rom): keeps velocity between keys, for floating things.
export function spline(t: number, keys: [number, number, number][]): Pt {
  if (t <= keys[0][0]) return [keys[0][1], keys[0][2]];
  const n = keys.length;
  if (t >= keys[n - 1][0]) return [keys[n - 1][1], keys[n - 1][2]];
  let i = 0;
  while (t > keys[i + 1][0]) i++;
  const u = (t - keys[i][0]) / (keys[i + 1][0] - keys[i][0]);
  const p0 = keys[Math.max(0, i - 1)];
  const p1 = keys[i];
  const p2 = keys[i + 1];
  const p3 = keys[Math.min(n - 1, i + 2)];
  const cr = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
  return [cr(p0[1], p1[1], p2[1], p3[1]), cr(p0[2], p1[2], p2[2], p3[2])];
}

// Stable per-index randomness (for things that must not boil).
export const hash = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export const rot = (p: Pt, deg: number): Pt => {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
};
export const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];

// Two-bone IK: shoulder S, target T. Picks the elbow that hangs lower (natural arms).
export function ik(S: Pt, T: Pt, L1: number, L2: number, up = false): { E: Pt; H: Pt } {
  const dx = T[0] - S[0];
  const dy = T[1] - S[1];
  const d = clamp(Math.hypot(dx, dy), Math.abs(L1 - L2) + 1, L1 + L2 - 0.5);
  const base = Math.atan2(dy, dx);
  const a = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const e1: Pt = [S[0] + L1 * Math.cos(base + a), S[1] + L1 * Math.sin(base + a)];
  const e2: Pt = [S[0] + L1 * Math.cos(base - a), S[1] + L1 * Math.sin(base - a)];
  const E = (e1[1] > e2[1]) !== up ? e1 : e2;
  return { E, H: [S[0] + d * Math.cos(base), S[1] + d * Math.sin(base)] };
}

// Blinks: a short lid closure every few seconds, offset per character.
export function blink(t: number, seed: number): number {
  const period = 3.4 + hash(seed) * 1.6;
  const ph = (t + hash(seed + 9) * period) % period;
  const d = 0.16;
  return ph < d ? Math.sin((ph / d) * Math.PI) : 0;
}

// Extra lid flick around expression changes, so faces never snap.
export function flick(t: number, times: number[]): number {
  let v = 0;
  for (const c of times) {
    const x = (t - c + 0.07) / 0.14;
    if (x > 0 && x < 1) v = Math.max(v, Math.sin(x * Math.PI));
  }
  return v;
}

export const pathPts = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
