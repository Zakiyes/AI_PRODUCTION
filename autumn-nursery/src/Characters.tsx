import React from 'react';
import { PAL } from './theme';
import { Pt, pathPts } from './lib';
import { GIRL_HEAD, GIRL_NECK, MOM, MOM_HEAD, MOM_NECK, BUN, girl, mom, Eyes } from './story';

const INK = PAL.ink;

// A limb: ink outline underneath, colour on top, round joints.
export const Limb: React.FC<{ pts: Pt[]; w: number; color: string }> = ({ pts, w, color }) => (
  <g strokeLinecap="round" strokeLinejoin="round" fill="none">
    <path d={pathPts(pts)} stroke={INK} strokeWidth={w + 6} />
    <path d={pathPts(pts)} stroke={color} strokeWidth={w} />
  </g>
);

const Eye: React.FC<{ x: number; y: number; mode: Eyes; lid: number; look: Pt; rx: number; ry: number; lash?: boolean; wide?: number }> = ({
  x, y, mode, lid, look, rx, ry, lash, wide = 0,
}) => {
  if (mode === 'happy')
    return <path d={`M${x - rx - 3},${y + 2} Q${x},${y - ry - 2} ${x + rx + 3},${y + 2}`} stroke={INK} strokeWidth={3.2} fill="none" strokeLinecap="round" />;
  if (lid > 0.85)
    return <path d={`M${x - rx - 2},${y} Q${x},${y + ry * 0.8} ${x + rx + 2},${y}`} stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />;
  const s = 1 + wide * 0.35;
  const h = ry * s * (1 - lid);
  return (
    <g>
      <ellipse cx={x + look[0]} cy={y + look[1] * 0.7} rx={rx * s} ry={Math.max(1, h)} fill={INK} />
      {h > 3 && <circle cx={x + look[0] + rx * 0.35} cy={y + look[1] * 0.7 - h * 0.4} r={rx * 0.38} fill={PAL.cream} />}
      {lash && <path d={`M${x + rx},${y - h + 1} l5,-4`} stroke={INK} strokeWidth={2.4} strokeLinecap="round" />}
    </g>
  );
};

// ---------------- MUM ----------------
// Split in layers so the girl can sit between mum's body and her near arm.
export const MomBack: React.FC<{ t: number }> = ({ t }) => {
  const m = mom(t);
  return (
    <g>
      <Limb pts={[m.sF, m.far.E, m.far.H]} w={30} color={PAL.sweaterShade} />
      <circle cx={m.far.H[0]} cy={m.far.H[1]} r={14} fill={PAL.skinShade} stroke={INK} strokeWidth={3} />
      <g transform={`translate(${MOM[0]},${MOM[1]}) rotate(${m.lean}) translate(${MOM_NECK[0]},${MOM_NECK[1]}) rotate(${m.headTilt}) translate(${MOM_HEAD[0]},${MOM_HEAD[1]})`}>
        <path
          d="M -50,-14 C -72,30 -70,86 -44,116 C -30,132 -8,124 -4,104 C 2,84 -6,60 6,36 L 20,10 Z"
          fill={PAL.momHair}
          stroke={INK}
          strokeWidth={3}
        />
        <path d="M -48,40 C -52,70 -44,94 -30,110" stroke={PAL.momHairHi} strokeWidth={4} fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
};

export const MomBody: React.FC<{ t: number }> = ({ t }) => {
  const m = mom(t);
  const mo = m.mouth;
  return (
    <g>
      {/* crossed legs under a long skirt */}
      <g transform={`translate(${MOM[0]},${MOM[1]})`}>
        <ellipse cx={176} cy={0} rx={19} ry={10} fill={PAL.collar} stroke={INK} strokeWidth={3} />
        <path
          d="M -80,6 C -96,-40 -62,-76 -10,-74 C 40,-72 92,-64 140,-50 C 174,-40 184,-8 166,6 C 120,16 -20,18 -80,6 Z"
          fill={PAL.skirt}
          stroke={INK}
          strokeWidth={3.5}
        />
        <path d="M 14,-60 C 46,-42 78,-22 108,4" stroke={PAL.skirtShade} strokeWidth={5} fill="none" strokeLinecap="round" />
        <path d="M -40,-60 C -30,-30 -36,-10 -46,6" stroke={PAL.skirtShade} strokeWidth={5} fill="none" strokeLinecap="round" />
      </g>
      {/* torso */}
      <g transform={`translate(${MOM[0]},${MOM[1]}) rotate(${m.lean})`}>
        <rect x={6} y={-252} width={26} height={34} rx={10} fill={PAL.skinShade} stroke={INK} strokeWidth={3} />
        <path
          d="M -58,-16 C -76,-92 -68,-172 -40,-214 C -18,-238 34,-242 60,-218 C 82,-172 86,-92 76,-20 C 40,-2 -20,-2 -58,-16 Z"
          fill={PAL.sweater}
          stroke={INK}
          strokeWidth={3.5}
        />
        <path d="M -54,-36 C -10,-24 40,-24 74,-38" stroke={PAL.sweaterShade} strokeWidth={4} fill="none" />
        <path d="M -54,-26 C -10,-14 40,-14 75,-28" stroke={PAL.sweaterShade} strokeWidth={4} fill="none" />
        <path d="M -2,-228 Q 22,-214 46,-226" stroke={PAL.sweaterShade} strokeWidth={6} fill="none" strokeLinecap="round" />
        {/* cable knit hint */}
        <path d="M 30,-196 C 22,-170 38,-150 30,-124 C 22,-100 38,-80 30,-56" stroke={PAL.sweaterShade} strokeWidth={4} fill="none" strokeLinecap="round" />
      </g>
      {/* head */}
      <g transform={`translate(${MOM[0]},${MOM[1]}) rotate(${m.lean}) translate(${MOM_NECK[0]},${MOM_NECK[1]}) rotate(${m.headTilt}) translate(${MOM_HEAD[0]},${MOM_HEAD[1]})`}>
        <circle cx={BUN[0]} cy={BUN[1]} r={27} fill={PAL.momHair} stroke={INK} strokeWidth={3} />
        <path d={`M ${BUN[0] - 14},${BUN[1] - 6} q 12,-14 24,0 q -8,12 -18,6`} stroke={PAL.momHairHi} strokeWidth={3.5} fill="none" strokeLinecap="round" />
        <ellipse cx={2} cy={2} rx={54} ry={58} fill={PAL.skin} stroke={INK} strokeWidth={3.5} />
        <path
          d="M -56,26 C -68,-30 -40,-64 4,-61 C 42,-58 62,-34 55,-6 C 44,-26 22,-36 2,-28 C -12,-18 -18,2 -24,22 C -32,34 -48,36 -56,26 Z"
          fill={PAL.momHair}
          stroke={INK}
          strokeWidth={3}
        />
        <path d="M 6,-50 C 22,-48 36,-40 44,-26" stroke={PAL.momHairHi} strokeWidth={4} fill="none" strokeLinecap="round" />
        <ellipse cx={-18} cy={14} rx={9} ry={13} fill={PAL.skinShade} stroke={INK} strokeWidth={3} />
        <circle cx={-18} cy={30} r={3.5} fill={PAL.tie} />
        {/* brows */}
        <path d={`M 4,-16 q 8,-5 16,-1`} stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round" />
        <path d={`M 32,-18 q 8,-4 14,1`} stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round" />
        <Eye x={12} y={2} mode={m.eyes} lid={m.lid} look={m.look} rx={4.5} ry={6.5} lash />
        <Eye x={38} y={0} mode={m.eyes} lid={m.lid} look={m.look} rx={4} ry={6} lash />
        <path d="M 52,6 Q 59,16 50,19" stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round" />
        <ellipse cx={40} cy={20} rx={10} ry={6} fill={PAL.blush} opacity={0.5} />
        <ellipse cx={6} cy={22} rx={9} ry={5.5} fill={PAL.blush} opacity={0.45} />
        {mo === 'smile' && <path d="M 22,30 Q 33,39 44,29" stroke={PAL.lips} strokeWidth={3.2} fill="none" strokeLinecap="round" />}
        {mo === 'soft' && <path d="M 26,31 Q 34,36 42,30" stroke={PAL.lips} strokeWidth={3} fill="none" strokeLinecap="round" />}
        {mo === 'laugh' && <path d="M 20,27 Q 33,48 46,26 Z" fill="#8f4441" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />}
        {mo === 'kiss' && <ellipse cx={47} cy={31} rx={4} ry={5} fill={PAL.lips} stroke={INK} strokeWidth={2} />}
      </g>
    </g>
  );
};

export const MomNear: React.FC<{ t: number }> = ({ t }) => {
  const m = mom(t);
  return (
    <g>
      <Limb pts={[m.sN, m.near.E, m.near.H]} w={32} color={PAL.sweater} />
      <circle cx={m.near.H[0]} cy={m.near.H[1]} r={15} fill={PAL.skin} stroke={INK} strokeWidth={3} />
    </g>
  );
};

// ---------------- GIRL ----------------
const DOTS: Pt[] = [[-20, -40], [4, -48], [20, -30], [-28, -12], [-4, -20], [16, -6], [32, -10], [-12, 2]];

export const Girl: React.FC<{ t: number }> = ({ t }) => {
  const g = girl(t);
  const L = g.legs;
  const pig = 7 * Math.sin(g.walk * 2) + 4 * Math.sin(t * 3);
  const hairBounce = g.walk ? 3 : 0;
  return (
    <g transform={`translate(${g.G[0]},${g.G[1]}) scale(${g.face},1) rotate(${g.lean})`}>
      {/* far arm */}
      <Limb pts={[[-10, -62], ikMid([-10, -62], g.farHand), g.farHand]} w={11} color={PAL.skinShade} />
      <circle cx={g.farHand[0]} cy={g.farHand[1]} r={7.5} fill={PAL.skinShade} stroke={INK} strokeWidth={2.6} />
      <circle cx={-10} cy={-62} r={11} fill={PAL.dressShade} stroke={INK} strokeWidth={2.6} />
      {/* legs */}
      <Limb pts={[[-5, -2], L.fk, L.ff]} w={15} color={PAL.tights} />
      <ellipse cx={L.ff[0] + 4} cy={L.ff[1] + 3} rx={12} ry={8} transform={`rotate(${L.footRot} ${L.ff[0]} ${L.ff[1]})`} fill={PAL.shoe} stroke={INK} strokeWidth={2.6} />
      <Limb pts={[[6, -2], L.nk, L.nf]} w={15} color={PAL.tights} />
      <ellipse cx={L.nf[0] + 4} cy={L.nf[1] + 3} rx={12} ry={8} transform={`rotate(${L.footRot} ${L.nf[0]} ${L.nf[1]})`} fill={PAL.shoe} stroke={INK} strokeWidth={2.6} />
      {/* dress */}
      <path
        d="M -22,-68 C -30,-40 -40,-12 -43,6 Q 2,18 47,6 C 43,-14 35,-40 27,-68 Q 2,-77 -22,-68 Z"
        fill={PAL.dress}
        stroke={INK}
        strokeWidth={3}
      />
      {DOTS.map((d, i) => (
        <circle key={i} cx={d[0]} cy={d[1]} r={2.6} fill={PAL.collar} opacity={0.9} />
      ))}
      <path d="M -40,0 Q 2,10 45,0" stroke={PAL.dressShade} strokeWidth={4} fill="none" />
      {/* head */}
      <g transform={`translate(${GIRL_NECK[0]},${GIRL_NECK[1]}) rotate(${g.headTilt}) translate(${GIRL_HEAD[0]},${GIRL_HEAD[1] - hairBounce * Math.abs(Math.sin(g.walk))})`}>
        <rect x={-8} y={24} width={16} height={18} rx={6} fill={PAL.skinShade} />
        <g transform={`rotate(${-20 + pig} -38 -30)`}>
          <path d="M -38,-30 C -62,-44 -70,-22 -60,-10 C -54,-2 -44,-12 -38,-30 Z" fill={PAL.girlHair} stroke={INK} strokeWidth={2.6} />
        </g>
        <g transform={`rotate(${10 - pig} 24 -40)`}>
          <path d="M 22,-40 C 30,-70 52,-66 50,-50 C 48,-40 36,-38 22,-40 Z" fill={PAL.girlHair} stroke={INK} strokeWidth={2.6} />
        </g>
        <circle cx={-38} cy={-30} r={4.5} fill={PAL.tie} stroke={INK} strokeWidth={1.6} />
        <circle cx={24} cy={-40} r={4.5} fill={PAL.tie} stroke={INK} strokeWidth={1.6} />
        <circle cx={-4} cy={-2} r={47} fill={PAL.girlHair} stroke={INK} strokeWidth={3} />
        <circle cx={3} cy={3} r={44} fill={PAL.skin} stroke={INK} strokeWidth={3} />
        <path
          d="M -46,8 C -54,-36 -20,-56 6,-50 C 32,-46 50,-30 46,-8 C 40,-16 32,-22 24,-17 C 18,-28 8,-26 2,-19 C -6,-28 -14,-24 -18,-13 C -24,-4 -30,2 -34,16 Z"
          fill={PAL.girlHair}
          stroke={INK}
          strokeWidth={3}
        />
        <path d="M -4,-44 C 10,-46 24,-40 32,-30" stroke={PAL.girlHairHi} strokeWidth={3.5} fill="none" strokeLinecap="round" />
        <ellipse cx={-22} cy={10} rx={7} ry={9} fill={PAL.skinShade} stroke={INK} strokeWidth={2.6} />
        <Eye x={8} y={4} mode={g.eyes} lid={g.lid} look={g.look} rx={5.5} ry={7} wide={g.wide} />
        <Eye x={30} y={2} mode={g.eyes} lid={g.lid} look={g.look} rx={5} ry={6.5} wide={g.wide} />
        <ellipse cx={34} cy={18} rx={8} ry={5} fill={PAL.blush} opacity={0.6} />
        <ellipse cx={2} cy={19} rx={8} ry={5} fill={PAL.blush} opacity={0.55} />
        <path d="M 41,10 q 4,4 0,7" stroke={INK} strokeWidth={2.2} fill="none" strokeLinecap="round" />
        {g.mouth === 'smile' && <path d="M 18,24 Q 25,31 32,23" stroke={PAL.lips} strokeWidth={3} fill="none" strokeLinecap="round" />}
        {g.mouth === 'small' && <path d="M 21,25 Q 26,28 31,24" stroke={PAL.lips} strokeWidth={2.6} fill="none" strokeLinecap="round" />}
        {g.mouth === 'laugh' && <path d="M 15,21 Q 25,40 36,20 Z" fill="#8f4441" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />}
        {g.mouth === 'o' && <ellipse cx={26} cy={26} rx={4 + g.wide * 1.5} ry={5 + g.wide * 2} fill="#8f4441" stroke={INK} strokeWidth={2} />}
        {g.mouth === 'sleep' && <ellipse cx={25} cy={26} rx={2.4} ry={3} fill="#8f4441" />}
      </g>
      {/* near arm */}
      <circle cx={10} cy={-60} r={12} fill={PAL.dress} stroke={INK} strokeWidth={2.6} />
      <Limb pts={[[10, -56], ikMid([10, -56], g.nearHand), g.nearHand]} w={11} color={PAL.skin} />
      <circle cx={g.nearHand[0]} cy={g.nearHand[1]} r={8} fill={PAL.skin} stroke={INK} strokeWidth={2.6} />
    </g>
  );
};

// Toddler arms: a soft elbow, bent downwards, 30+30 long.
function ikMid(S: Pt, T: Pt): Pt {
  const L = 31;
  const dx = T[0] - S[0];
  const dy = T[1] - S[1];
  const d = Math.min(Math.hypot(dx, dy), 2 * L - 0.5);
  if (d < 1) return [S[0], S[1] + L];
  const base = Math.atan2(dy, dx);
  const a = Math.acos(Math.min(1, d / (2 * L)));
  const e1: Pt = [S[0] + L * Math.cos(base + a), S[1] + L * Math.sin(base + a)];
  const e2: Pt = [S[0] + L * Math.cos(base - a), S[1] + L * Math.sin(base - a)];
  return e1[1] > e2[1] ? e1 : e2;
}

// ---------------- props ----------------
export const LEAF_D =
  'M0,22 L2,10 C10,14 18,12 23,15 C21,8 23,4 27,0 C19,-2 17,-6 19,-13 C13,-10 9,-12 6,-19 C4,-14 2,-22 0,-29 C-2,-22 -4,-14 -6,-19 C-9,-12 -13,-10 -19,-13 C-17,-6 -19,-2 -27,0 C-23,4 -21,8 -23,15 C-18,12 -10,14 -2,10 Z';

export const Leaf: React.FC<{ x: number; y: number; r: number; flip?: number; s?: number; color?: string; outline?: boolean }> = ({
  x, y, r, flip = 1, s = 1, color = PAL.leafRed, outline = true,
}) => (
  <g transform={`translate(${x},${y}) rotate(${r}) scale(${s * (Math.abs(flip) < 0.15 ? 0.15 * Math.sign(flip || 1) : flip)},${s})`}>
    <path d={LEAF_D} fill={color} stroke={outline ? PAL.ink : 'none'} strokeWidth={2.4} strokeLinejoin="round" />
    {outline && <path d="M0,24 L0,-20 M0,-2 L14,-8 M0,-2 L-14,-8 M0,6 L12,10 M0,6 L-12,10" stroke="#8e2f22" strokeWidth={1.6} fill="none" />}
  </g>
);

export const HEART_D = 'M 0,8 C -18,-6 -13,-22 0,-12 C 13,-22 18,-6 0,8 Z';
