// The whole film as data: every value is a function of t (seconds).
// See STORYBOARD.md for the shots and reads these timings come from.
import {
  Pt, add, backOut, blink, clamp, ik, easeIn, easeInOut, easeOut, flick, hash, lerp, lerpPt, linear, prog, rot,
  sine, spline, sub, track, trackPt,
} from './lib';

export const FLOOR = 905;
export const MOM: Pt = [820, 900];
export const MOM_SHOULDER_NEAR: Pt = [44, -204];
export const MOM_SHOULDER_FAR: Pt = [-16, -212];
export const MOM_NECK: Pt = [18, -238];
export const MOM_HEAD: Pt = [4, -50];
export const BUN: Pt = [-42, -46];
export const GIRL_NECK: Pt = [4, -70];
export const GIRL_HEAD: Pt = [2, -42];
export const TOWER_X = 1085;
export const BLOCK = 40;
export const WINDOW = { x0: 1080, y0: 130, x1: 1580, y1: 620, inset: 24 };
export const SILL_Y = 612;

export type Legs = { nk: Pt; nf: Pt; fk: Pt; ff: Pt; footRot: number };
const LEGS: Record<string, Legs> = {
  sit: { nk: [28, 0], nf: [54, -4], fk: [24, -4], ff: [48, -8], footRot: -80 },
  stand: { nk: [7, 30], nf: [7, 56], fk: [-6, 30], ff: [-6, 56], footRot: 0 },
  dangle: { nk: [10, 28], nf: [5, 54], fk: [-5, 27], ff: [-11, 50], footRot: 14 },
  lap: { nk: [36, 4], nf: [42, 40], fk: [31, 0], ff: [36, 35], footRot: 6 },
};
const mixLegs = (a: Legs, b: Legs, p: number): Legs => ({
  nk: lerpPt(a.nk, b.nk, p),
  nf: lerpPt(a.nf, b.nf, p),
  fk: lerpPt(a.fk, b.fk, p),
  ff: lerpPt(a.ff, b.ff, p),
  footRot: lerp(a.footRot, b.footRot, p),
});

export type Eyes = 'open' | 'happy';
export type GirlMouth = 'smile' | 'laugh' | 'o' | 'small' | 'sleep';
export type MomMouth = 'smile' | 'laugh' | 'kiss' | 'soft';

export const momHeadWorld = (local: Pt, lean: number, tilt: number): Pt =>
  add(MOM, rot(add(MOM_NECK, rot(add(MOM_HEAD, local), tilt)), lean));
export const girlWorld = (G: Pt, face: number, lean: number, local: Pt): Pt => {
  const r = rot(local, lean);
  return [G[0] + face * r[0], G[1] + r[1]];
};
export const girlLocal = (G: Pt, face: number, lean: number, world: Pt): Pt => {
  const d = sub(world, G);
  return rot([d[0] * face, d[1]], -lean);
};
const girlHeadLocal = (tilt: number): Pt => add(GIRL_NECK, rot(GIRL_HEAD, tilt));

// Where a character looks: a small pupil offset (in the character's own facing frame).
const lookAt = (from: Pt, to: Pt, face: number, amt = 3.2): Pt => {
  const d = sub(to, from);
  const l = Math.hypot(d[0], d[1]) || 1;
  return [(d[0] / l) * amt * face, (d[1] / l) * amt];
};

// ---------- time of day & camera ----------
export const todAt = (t: number) => track(t, [[0, 0], [27, 0.04], [37, 0.5, sine], [43, 0.92, sine], [45, 1]]);

export function interiorCam(t: number) {
  const k: [number, number, number, number][] = [
    [5.4, 1330, 378, 2.9],
    [8.6, 960, 560, 1.0],
    [10.6, 1010, 735, 1.45],
    [14, 1030, 720, 1.42],
    [18, 1110, 625, 1.26],
    [22, 1000, 680, 1.3],
    [26, 960, 640, 1.26],
    [30, 930, 650, 1.3],
    [33.5, 885, 715, 1.85],
    [38, 880, 722, 1.95],
    [41, 900, 700, 1.8],
    [43.6, 1330, 378, 2.7],
  ];
  const cx = track(t, k.map((x) => [x[0], x[1]]));
  const cy = track(t, k.map((x) => [x[0], x[2]]));
  const z = track(t, k.map((x) => [x[0], x[3], x[0] === 43.6 ? easeIn : easeInOut]));
  // breathing, handheld drift so the frame is never frozen
  return { cx: cx + 5 * Math.sin(t * 0.37), cy: cy + 4 * Math.sin(t * 0.29 + 1), z: z * (1 + 0.004 * Math.sin(t * 0.5)) };
}

export function exteriorCam(t: number) {
  if (t < 20) {
    const z = track(t, [[0, 1.0], [2.8, 1.07, sine], [6.6, 3.6, easeIn]]);
    const cy = track(t, [[0, 545], [2.8, 535], [6.6, 505, easeIn]]);
    return { cx: 960 + 4 * Math.sin(t * 0.4), cy, z };
  }
  const z = track(t, [[43.0, 2.4], [45, 1.0, easeOut]]);
  const cy = track(t, [[43.0, 505], [45, 540, easeOut]]);
  return { cx: 960, cy, z };
}

export const interiorOpacity = (t: number) => track(t, [[5.5, 0], [6.4, 1, sine], [43.0, 1], [43.7, 0, sine]]);
export const paperFade = (t: number) => track(t, [[0, 1], [1.4, 0, sine], [43.6, 0], [44.4, 1, sine]]);

// Wind: a steady stir plus the gust that carries the leaf in (C).
export const breeze = (t: number) =>
  0.25 + 0.15 * Math.sin(t * 0.7) + 0.9 * Math.exp(-Math.pow((t - 15.4) / 1.1, 2)) + 0.3 * Math.exp(-Math.pow((t - 27.5) / 1.5, 2));

// ---------- the girl ----------
export function girl(t: number) {
  // position & pose
  let G: Pt;
  let legs: Legs;
  let lean = 0;
  let face = -1;
  let walk = 0;
  const standUp = prog(t, 19.0, 19.8);
  const walkP = prog(t, 19.8, 22.4, linear);
  if (t < 19.0) {
    G = [1200, FLOOR - 10];
    legs = LEGS.sit;
    // reaching for the tower top & settling back
    lean = track(t, [[7.6, 0], [8.6, 12], [9.3, 14], [9.8, -6, easeOut], [10.4, 0]]);
    lean += track(t, [[16.4, 0], [17.4, -8], [19.0, 4]]);
  } else if (t < 25.7) {
    const x = lerp(1200, 1005, walkP);
    const y = lerp(FLOOR - 10, FLOOR - 64, standUp);
    walk = t > 19.8 && t < 22.6 ? (t - 19.8) * Math.PI * 2 * 1.7 : 0;
    const bob = t > 19.8 && t < 22.6 ? -4 * Math.abs(Math.sin(walk)) : 0;
    const giggle = t > 24.5 && t < 25.9 ? -6 * Math.abs(Math.sin((t - 24.5) * Math.PI * 3.2)) : 0;
    G = [x, y + bob + giggle];
    legs = mixLegs(LEGS.sit, LEGS.stand, standUp);
    if (walk) {
      const s = Math.sin(walk);
      const c = Math.cos(walk);
      legs = {
        ...legs,
        nf: [legs.nf[0] + 11 * s, legs.nf[1] - Math.max(0, 9 * c)],
        nk: [legs.nk[0] + 7 * s, legs.nk[1] - Math.max(0, 5 * c)],
        ff: [legs.ff[0] - 11 * s, legs.ff[1] - Math.max(0, -9 * c)],
        fk: [legs.fk[0] - 7 * s, legs.fk[1] - Math.max(0, -5 * c)],
      };
    }
    lean = track(t, [[19.0, 4], [19.25, 16], [19.8, 6], [22.4, 6], [22.9, -4, backOut], [24.4, -2], [25.7, -6]]);
  } else if (t < 29.4) {
    // lifted on an arc, then swung
    const lift = prog(t, 25.7, 27.0);
    const a: Pt = [1005, FLOOR - 64];
    const c: Pt = [1030, 640];
    const b: Pt = [995, 598];
    const u = lift;
    const base: Pt = [
      (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0],
      (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1],
    ];
    const sw = clamp((t - 27.0) / 0.4) * clamp((29.4 - t) / 0.5);
    const ph = (t - 27.0) * Math.PI * 1.15;
    G = [base[0] + sw * 55 * Math.sin(ph), base[1] - sw * 16 * (1 - Math.cos(2 * ph)) * 0.5];
    legs = mixLegs(LEGS.stand, LEGS.dangle, prog(t, 25.9, 26.8));
    legs = { ...legs, nf: add(legs.nf, [sw * -8 * Math.sin(ph - 0.6), 0]), ff: add(legs.ff, [sw * -10 * Math.sin(ph - 0.9), 0]) };
    lean = track(t, [[25.7, -6], [26.4, 6], [27.0, 0]]) + sw * 9 * Math.sin(ph - 0.3);
  } else {
    // lowered onto mum's lap, turning to face the window
    const p = prog(t, 29.4, 30.8);
    const lap: Pt = [905, 852];
    G = lerpPt([995, 598], lap, p);
    G[1] -= Math.sin(p * Math.PI) * 25;
    legs = mixLegs(LEGS.dangle, LEGS.lap, prog(t, 30.0, 30.9));
    face = t < 30.0 ? -1 : -Math.cos(Math.PI * prog(t, 30.0, 30.3, easeInOut));
    if (Math.abs(face) < 0.25) face = face < 0 ? -0.25 : 0.25;
    // F: settles back against mum's chest, falls asleep
    lean = track(t, [[30.8, 0], [33, -3], [38.6, -3], [40.2, -14, easeInOut]]);
    lean += t > 40.2 ? 1.2 * Math.sin((t - 40.2) * 2 * Math.PI / 3.2) : 0;
    // gently rocked with mum
    G = add(G, [rockX(t), 0]);
  }

  const headTilt =
    t < 19
      ? track(t, [[6, 10], [9.6, 12], [10.0, -8, backOut], [11, 0], [14.5, 0], [16.4, -14], [18.6, -6]])
      : t < 30
      ? track(t, [[19, -4], [22.4, -10], [24.5, -16], [26, 4], [27, -6]]) + (t > 24.5 && t < 25.9 ? 5 * Math.sin((t - 24.5) * 20) : 0)
      : track(t, [[30, -6], [31.5, -14], [35.2, -14], [35.6, -4], [37.2, -8], [38.6, -8], [40.4, -22]]);

  // eyes & mouth
  const headW = girlWorld(G, face, lean, girlHeadLocal(headTilt));
  const leafNow = leaf(t);
  let eyes: Eyes = 'open';
  let mouth: GirlMouth = 'smile';
  let look: Pt = [2.5, 2];
  let wide = 0;
  if (t < 9.7) look = [3, 2.5];
  else if (t < 10.8) { mouth = 'o'; wide = prog(t, 9.7, 9.9, backOut) * (1 - prog(t, 10.5, 10.8)); look = [2, 3]; }
  else if (t < 13.8) { eyes = 'happy'; mouth = 'laugh'; }
  else if (t < 16.2) look = [3, -0.5];
  else if (t < 22.6) { look = lookAt(headW, [leafNow.x, leafNow.y], face); mouth = t < 19 ? 'o' : 'smile'; wide = t < 17.2 ? 0.6 * prog(t, 16.2, 16.5) : 0; }
  else if (t < 24.5) { look = lookAt(headW, momHeadWorld(BUN, momPose(t).lean, momPose(t).headTilt), face); mouth = 'o'; }
  else if (t < 30.2) { eyes = 'happy'; mouth = 'laugh'; }
  else if (t < 35.2) { look = [3, -2.5]; mouth = t > 31.5 && t < 34 ? 'o' : 'smile'; }
  else if (t < 37.4) { eyes = 'happy'; mouth = 'smile'; }
  else if (t < 39.2) { look = [2.5, -1]; mouth = t > 38.2 && t < 39 ? 'o' : 'small'; }
  else { mouth = 'sleep'; }
  const sleepLid = t < 38.2 ? 0 : t < 40.2 ? 0.35 + 0.35 * prog(t, 38.2, 40.2) + 0.25 * Math.max(0, Math.sin((t - 38.2) * 5)) : 1;
  const lid = clamp(Math.max(blink(t, 2), flick(t, [9.7, 10.8, 13.8, 16.2, 22.6, 24.5, 30.2, 35.2, 37.4]), sleepLid));

  // hands, in the girl's own frame (x forward)
  let nearHand: Pt = [30, -12];
  let farHand: Pt = [22, -16];
  let carry = false;
  const towerTop: Pt = [TOWER_X, FLOOR - BLOCK * 2 - BLOCK / 2];
  if (t < 9.25) {
    carry = true;
    const hold: Pt = [36, -44];
    const place = girlLocal(G, face, lean, towerTop);
    nearHand = lerpPt(hold, place, prog(t, 7.6, 9.1));
    farHand = [26, -20];
  } else if (t < 10.8) {
    nearHand = lerpPt(girlLocal(G, face, lean, towerTop), [24, -50], prog(t, 9.25, 10.0, easeOut));
    farHand = lerpPt([26, -20], [14, -54], prog(t, 9.7, 10.0, easeOut));
  } else if (t < 13.8) {
    const clap = Math.abs(Math.sin((t - 10.8) * Math.PI * 2.6));
    nearHand = [36 + 9 * clap, -50];
    farHand = [30 - 4 * clap, -52];
  } else if (t < 16.6) {
    nearHand = lerpPt([36, -50], [30, -14], prog(t, 13.8, 14.6));
  } else if (t < 19.0) {
    const toLeaf = girlLocal(G, face, lean, [leafNow.x, leafNow.y]);
    nearHand = lerpPt([30, -14], add([10, -62], [clamp(toLeaf[0] * 0.2, -20, 30), 0]), prog(t, 16.8, 17.6));
    farHand = [24, -20];
  } else if (t < 22.6) {
    const reach = 0.5 + 0.5 * Math.sin(t * 6);
    nearHand = lerpPt([20, -50], [28, -98 - 6 * reach], prog(t, 19.0, 19.9));
    farHand = [-6 + 10 * Math.sin(walk + Math.PI), -24];
  } else if (t < 24.5) {
    nearHand = lerpPt([28, -98], girlLocal(G, face, lean, momHeadWorld(add(BUN, [10, 20]), momPose(t).lean, momPose(t).headTilt)), prog(t, 22.6, 23.3));
    farHand = [10, -26];
  } else if (t < 25.6) {
    nearHand = lerpPt([40, -70], [20, -78], prog(t, 24.5, 24.8));
    farHand = lerpPt([10, -26], [14, -80], prog(t, 24.5, 24.85));
  } else if (t < 27.0) {
    nearHand = lerpPt([20, -78], [26, -108], prog(t, 25.6, 26.0, backOut));
    farHand = lerpPt([14, -80], [6, -110], prog(t, 25.7, 26.1, backOut));
  } else if (t < 29.6) {
    const o = prog(t, 27.0, 27.4, backOut);
    nearHand = lerpPt([26, -108], [52, -80 - 6 * Math.sin(t * 7)], o);
    farHand = lerpPt([6, -110], [-34, -84 + 6 * Math.sin(t * 7)], o);
  } else if (t < 31.6) {
    nearHand = lerpPt([52, -80], [32, -20], prog(t, 29.6, 30.6));
    farHand = lerpPt([-34, -84], [24, -24], prog(t, 29.6, 30.6));
  } else if (t < 34.2) {
    nearHand = lerpPt([32, -20], [58, -86], prog(t, 31.6, 32.2, backOut));
    nearHand = lerpPt(nearHand, [32, -20], prog(t, 33.5, 34.2));
    farHand = [24, -24];
  } else {
    nearHand = [32, -20];
    farHand = [24, -24];
    if (t > 40) { nearHand = [26, -14]; farHand = [20, -18]; }
  }

  nearHand = reach([10, -56], nearHand);
  farHand = reach([-10, -62], farHand);
  return { G, face, lean, legs, headTilt, eyes, mouth, look, wide, lid, nearHand, farHand, carry, walk };
}

// Toddler arms are short (31 + 31): a hand can't go further than that from its shoulder.
const reach = (S: Pt, T: Pt): Pt => {
  const d = sub(T, S);
  const l = Math.hypot(d[0], d[1]);
  const max = 60;
  return l <= max ? T : add(S, [(d[0] / l) * max, (d[1] / l) * max]);
};

// Mum rocks gently once the girl is drowsy.
export const rockX = (t: number) => (t > 38.5 ? 3 * Math.sin((t - 38.5) * 2 * Math.PI / 3.2) * prog(t, 38.5, 40) : 0);

// ---------- mum ----------
export function momPose(t: number) {
  let lean = 2 + 1.2 * Math.sin(t * 0.8);
  lean += track(t, [[10.6, 0], [11.1, -5, backOut], [13.4, -3], [14.2, 0]]);
  lean += track(t, [[25.2, 0], [25.9, 9], [27.0, -6, backOut], [29.3, -4], [30.6, 4], [34.9, 4], [35.6, 9], [37.2, 9], [38.0, 5]]);
  lean += t > 27 && t < 29.6 ? -3 * Math.sin((t - 27) * Math.PI * 1.15 - 0.4) : 0;
  lean += t > 38.5 ? 2.5 * Math.sin((t - 38.5) * 2 * Math.PI / 3.2) * prog(t, 38.5, 40) : 0;

  const headTilt =
    track(t, [[6, 14], [9.8, 14], [10.6, 2, backOut], [13.8, 8], [16.5, 6], [17.4, -12], [21.5, -6], [22.6, -14], [24.4, -10], [24.8, 0], [25.6, 4], [26.5, -14], [29.6, -10], [31.2, -12], [34.8, -10], [35.6, 26], [37.2, 26], [38.2, 16]]) +
    (t > 10.8 && t < 13.2 ? 2.5 * Math.sin((t - 10.8) * 16) : 0) +
    (t > 24.8 && t < 25.8 ? 2 * Math.sin((t - 24.8) * 16) : 0);

  return { lean, headTilt };
}

export function mom(t: number) {
  const { lean, headTilt } = momPose(t);
  let eyes: Eyes = 'open';
  let mouth: MomMouth = 'smile';
  let look: Pt = [2.5, 2];
  if (t < 9.8) look = [3, 2.5];
  else if (t < 10.8) look = [3, 2];
  else if (t < 13.4) { eyes = 'happy'; mouth = 'laugh'; }
  else if (t < 16.6) look = [3, 1.5];
  else if (t < 22.4) {
    const l = leaf(t);
    look = lookAt(momHeadWorld([20, 0], lean, headTilt), [l.x, l.y], 1);
  } else if (t < 24.6) { look = [1.5, -3.2]; mouth = 'soft'; }
  else if (t < 26.0) { eyes = 'happy'; mouth = 'laugh'; }
  else if (t < 29.8) { look = [2.6, -2.6]; eyes = t > 27.2 && t < 29.4 ? 'happy' : 'open'; mouth = 'laugh'; }
  else if (t < 35.4) { look = [3, -2]; mouth = 'smile'; }
  else if (t < 37.2) { eyes = 'happy'; mouth = 'kiss'; }
  else { eyes = 'happy'; mouth = 'soft'; }
  const lid = clamp(Math.max(blink(t, 5), flick(t, [9.8, 10.8, 13.4, 22.4, 24.6, 26, 29.8, 35.4, 37.2])));

  // hands (world)
  const sN = add(MOM, rot(MOM_SHOULDER_NEAR, lean));
  const sF = add(MOM, rot(MOM_SHOULDER_FAR, lean));
  let nearT: Pt = add(MOM, [128, -46]);
  let farT: Pt = add(MOM, [-74, -6]);
  if (t > 10.8 && t < 13.4) {
    const c = Math.abs(Math.sin((t - 10.8) * Math.PI * 2.2));
    const p = prog(t, 10.8, 11.1) * (1 - prog(t, 13.0, 13.4));
    nearT = lerpPt(nearT, add(MOM, [104 + 10 * c, -168]), p);
    farT = lerpPt(farT, add(MOM, [92 - 4 * c, -172]), p);
  }
  if (t > 16.8 && t < 19.6) {
    const l = leaf(t);
    const d = sub([l.x, l.y], sN);
    const len = Math.hypot(d[0], d[1]) || 1;
    const point: Pt = add(sN, [(d[0] / len) * 215, (d[1] / len) * 215]);
    nearT = lerpPt(nearT, point, prog(t, 16.8, 17.4) * (1 - prog(t, 19.0, 19.6)));
  }
  const g = girl(t);
  const holdN = girlWorld(g.G, g.face, g.lean, [-4, -42]);
  const holdF = girlWorld(g.G, g.face, g.lean, [-22, -46]);
  if (t > 25.2 && t < 30.8) {
    const p = prog(t, 25.2, 25.8);
    nearT = lerpPt(nearT, [holdN[0] - 6, holdN[1]], p);
    farT = lerpPt(farT, [holdF[0] + 30, holdF[1] - 4], p);
  }
  if (t >= 30.8 || (t > 29.8 && t < 30.8)) {
    const p = prog(t, 29.8, 30.8);
    const wrapN = girlWorld(g.G, g.face, g.lean, [26, -30]);
    const wrapF = girlWorld(g.G, g.face, g.lean, [14, -40]);
    const pat = t > 38.6 ? 5 * Math.max(0, Math.sin((t - 38.6) * 2 * Math.PI / 1.6)) : 0;
    nearT = lerpPt(t < 30.8 ? [holdN[0] - 6, holdN[1]] : wrapN, add(wrapN, [0, -pat]), t < 30.8 ? p : 1);
    farT = lerpPt(t < 30.8 ? [holdF[0] + 30, holdF[1] - 4] : wrapF, wrapF, t < 30.8 ? p : 1);
  }
  const near = ik(sN, nearT, 108, 100);
  const far = ik(sF, farT, 108, 100);
  return { lean, headTilt, eyes, mouth, look, lid, sN, sF, near, far };
}

// ---------- the red leaf (motif) ----------
const LEAF_IN: [number, number, number][] = [
  [14.9, 1520, 175],
  [15.9, 1430, 330],
  [16.9, 1300, 450],
  [17.9, 1205, 600],
  [18.7, 1150, 690],
  [19.6, 1095, 610],
  [20.6, 1000, 545],
  [21.5, 930, 520],
];
export function leaf(t: number) {
  const LAND = 22.3;
  const OFF = 27.0;
  const SILL = 30.6;
  if (t < 14.9) return { x: 1520, y: 175, rot: 0, flip: 1, scale: 1, visible: false };
  if (t < LAND) {
    const m = momHeadWorld(add(BUN, [6, -22]), 2, -14);
    const keys = [...LEAF_IN, [LAND, m[0], m[1]] as [number, number, number]];
    const [x, y] = spline(t, keys);
    const fl = clamp((LAND - t) / 1.2);
    return {
      x: x + 16 * Math.sin(t * 4.2) * fl,
      y: y + 6 * Math.sin(t * 8.4) * fl,
      rot: 40 * Math.sin(t * 3.1) + 15 * t * fl,
      flip: lerp(1, Math.cos(t * 4.2), fl),
      scale: 1,
      visible: true,
    };
  }
  if (t < OFF) {
    const mm = momPose(t);
    const p = momHeadWorld(add(BUN, [6, -22]), mm.lean, mm.headTilt);
    const settle = Math.exp(-(t - LAND) * 4) * Math.sin((t - LAND) * 18);
    return { x: p[0], y: p[1], rot: 30 + mm.headTilt + mm.lean + 20 * settle, flip: 1, scale: 1, visible: true };
  }
  if (t < SILL) {
    const mm = momPose(OFF);
    const p0 = momHeadWorld(add(BUN, [6, -22]), mm.lean, mm.headTilt);
    const [x, y] = spline(t, [
      [OFF, p0[0], p0[1]],
      [27.9, 930, 360],
      [28.9, 1110, 430],
      [29.8, 1250, 560],
      [SILL, 1338, SILL_Y - 6],
    ]);
    const fl = clamp((SILL - t) / 0.8);
    return { x: x + 14 * Math.sin(t * 4) * fl, y, rot: lerp(95, 30 * Math.sin(t * 3.4) + 160 * (t - OFF), fl), flip: lerp(0.55, Math.cos(t * 4.6), fl), scale: 1, visible: true };
  }
  const rustle = 3 * Math.sin(t * 2.3) * (0.3 + breeze(t));
  return { x: 1338, y: SILL_Y - 6, rot: 95 + rustle, flip: 0.55, scale: 1, visible: true };
}

// ---------- blocks ----------
export function blocks(t: number) {
  const g = girl(t);
  const res: { x: number; y: number; r: number; c: string; i: number }[] = [];
  const fall = prog(t, 9.75, 10.55, linear);
  const wob = t > 9.3 && t < 9.75 ? 5 * Math.sin((t - 9.3) * 40) * prog(t, 9.3, 9.6) : 0;
  const finals: [number, number, number][] = [
    [1060, FLOOR - 18, 14],
    [1010, FLOOR - 14, -28],
    [1140, FLOOR - 10, 52],
  ];
  for (let i = 0; i < 3; i++) {
    const stackY = FLOOR - BLOCK / 2 - BLOCK * i;
    let x = TOWER_X;
    let y = stackY;
    let r = wob * (i / 2);
    if (i === 2 && t < 9.25) {
      // carried in the girl's hand
      const h = girlWorld(g.G, g.face, g.lean, g.nearHand);
      x = h[0];
      y = h[1] - 8;
      r = -8;
    } else if (fall > 0) {
      const [fx, fy, fr] = finals[i];
      const d = clamp(fall * (1.1 + i * 0.25) - i * 0.08);
      x = lerp(TOWER_X, fx, easeOut(d));
      // ballistic arc + bounce
      const arc = -(28 + i * 14) * Math.sin(Math.min(1, d) * Math.PI);
      y = lerp(stackY, fy, easeIn(d)) + arc * (1 - d * 0.4);
      const bounce = t > 10.55 ? -10 * Math.exp(-(t - 10.55) * 7) * Math.abs(Math.sin((t - 10.55) * 18)) : 0;
      y += bounce;
      r = lerp(0, fr, easeOut(d));
    }
    res.push({ x, y, r, c: PALBLOCKS[i], i });
  }
  return res;
}
const PALBLOCKS = ['#7fa8a0', '#e4a958', '#d97b6d'];

// ---------- hearts & giggles ----------
export function hearts(t: number) {
  const out: { x: number; y: number; s: number; o: number; r: number }[] = [];
  const spawn = (t0: number, from: Pt, i: number) => {
    const a = t - t0;
    if (a < 0 || a > 2.0) return;
    const s = backOut(clamp(a / 0.35)) * (0.7 + 0.4 * hash(i));
    out.push({
      x: from[0] + 22 * Math.sin(a * 3 + i) + (hash(i + 3) - 0.5) * 40,
      y: from[1] - a * 70,
      s,
      o: 1 - prog(a, 1.3, 2.0),
      r: 12 * Math.sin(a * 2.5 + i),
    });
  };
  const times = [27.3, 27.8, 28.3, 28.9, 29.4];
  times.forEach((t0, i) => {
    const g = girl(t0);
    spawn(t0, girlWorld(g.G, g.face, g.lean, [10, -170]), i);
  });
  [35.8, 36.2, 36.7].forEach((t0, i) => {
    const m = momPose(t0);
    spawn(t0, momHeadWorld([95, -70], m.lean, m.headTilt), i + 10);
  });
  return out;
}

export const lampOn = (t: number) => {
  const p = prog(t, 40.6, 41.4, easeOut);
  const flickr = t > 40.6 && t < 41.0 ? 0.6 + 0.4 * Math.sin((t - 40.6) * 60) : 1;
  return p * flickr;
};
