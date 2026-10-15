import React from 'react';
import { interpolateColors } from 'remotion';
import { PAL, SKY } from './theme';
import { hash } from './lib';
import { Leaf } from './Characters';
import { WINDOW, SILL_Y, FLOOR, breeze, lampOn, todAt } from './story';

const INK = PAL.ink;
const LEAF_COLS = [PAL.leafRed, PAL.leafOrange, PAL.leafGold, PAL.leafBrown];

export const skyCols = (tod: number) => ({
  top: interpolateColors(tod, [0, 0.5, 1], SKY.top),
  bottom: interpolateColors(tod, [0, 0.5, 1], SKY.bottom),
});

// The autumn view: sky, hills, a maple and falling leaves. Reused through the window.
export const AutumnView: React.FC<{ t: number; x0: number; y0: number; x1: number; y1: number; id: string }> = ({ t, x0, y0, x1, y1, id }) => {
  const tod = todAt(t);
  const sky = skyCols(tod);
  const w = x1 - x0;
  const h = y1 - y0;
  const b = breeze(t);
  const sunY = y0 + h * (0.28 + 0.5 * Math.min(1, tod * 1.3));
  const hill = interpolateColors(tod, [0, 0.5, 1], ['#d9b48c', '#d79a74', '#6f5d86']);
  const hill2 = interpolateColors(tod, [0, 0.5, 1], ['#c49a70', '#bf7f5e', '#594d75']);
  const fol = (c: string) => interpolateColors(tod, [0, 0.6, 1], [c, c, '#7a4a5a']);
  return (
    <g>
      <defs>
        <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky.top} />
          <stop offset="1" stopColor={sky.bottom} />
        </linearGradient>
      </defs>
      <rect x={x0} y={y0} width={w} height={h} fill={`url(#sky-${id})`} />
      <circle cx={x0 + w * 0.72} cy={sunY} r={h * 0.09} fill="#fff1c9" opacity={0.85 * (1 - Math.max(0, tod - 0.75) * 4)} />
      <circle cx={x0 + w * 0.72} cy={sunY} r={h * 0.16} fill="#ffe6b0" opacity={0.25 * (1 - tod)} />
      {/* moon & first stars at dusk */}
      <circle cx={x0 + w * 0.3} cy={y0 + h * 0.17} r={h * 0.04} fill="#f8ecd0" opacity={Math.max(0, tod - 0.7) * 3} />
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={x0 + w * (0.15 + hash(i) * 0.7)} cy={y0 + h * (0.06 + hash(i + 5) * 0.25)} r={2.2} fill="#fff4d8"
          opacity={Math.max(0, tod - 0.8) * 5 * (0.6 + 0.4 * Math.sin(t * 3 + i))} />
      ))}
      <path d={`M${x0},${y0 + h * 0.72} C${x0 + w * 0.2},${y0 + h * 0.6} ${x0 + w * 0.45},${y0 + h * 0.66} ${x0 + w * 0.6},${y0 + h * 0.64} C${x0 + w * 0.8},${y0 + h * 0.62} ${x0 + w * 0.9},${y0 + h * 0.6} ${x1},${y0 + h * 0.63} L${x1},${y1} L${x0},${y1} Z`} fill={hill} />
      <path d={`M${x0},${y0 + h * 0.82} C${x0 + w * 0.3},${y0 + h * 0.74} ${x0 + w * 0.6},${y0 + h * 0.8} ${x1},${y0 + h * 0.76} L${x1},${y1} L${x0},${y1} Z`} fill={hill2} />
      {/* maple tree */}
      <path d={`M${x0 + w * 0.2},${y1} C${x0 + w * 0.24},${y0 + h * 0.7} ${x0 + w * 0.2},${y0 + h * 0.5} ${x0 + w * 0.28},${y0 + h * 0.3} L${x0 + w * 0.33},${y0 + h * 0.32} C${x0 + w * 0.29},${y0 + h * 0.5} ${x0 + w * 0.32},${y0 + h * 0.7} ${x0 + w * 0.3},${y1} Z`} fill={PAL.trunk} />
      <path d={`M${x0 + w * 0.27},${y0 + h * 0.48} L${x0 + w * 0.12},${y0 + h * 0.3} M${x0 + w * 0.3},${y0 + h * 0.42} L${x0 + w * 0.5},${y0 + h * 0.24}`} stroke={PAL.trunk} strokeWidth={w * 0.02} strokeLinecap="round" />
      {Array.from({ length: 26 }).map((_, i) => {
        const a = hash(i) * Math.PI * 2;
        const r = Math.sqrt(hash(i + 40)) * w * 0.28;
        const cx = x0 + w * 0.3 + Math.cos(a) * r * 1.2 + Math.sin(t * 1.3 + i) * 4 * b;
        const cy = y0 + h * 0.22 + Math.sin(a) * r * 0.75 + Math.cos(t * 1.1 + i) * 2 * b;
        return <circle key={i} cx={cx} cy={cy} r={w * (0.06 + hash(i + 7) * 0.05)} fill={fol(LEAF_COLS[i % 3])} opacity={0.92} />;
      })}
      {/* leaves drifting down */}
      {Array.from({ length: 10 }).map((_, i) => {
        const period = 5 + hash(i + 20) * 4;
        const ph = ((t + hash(i + 30) * period) % period) / period;
        const lx = x0 + w * (0.1 + hash(i + 50) * 0.8) - ph * w * 0.25 * (0.5 + b) + Math.sin(ph * 12 + i) * w * 0.04;
        const ly = y0 + ph * h * 1.05;
        return <Leaf key={i} x={lx} y={ly} r={ph * 500 + i * 40} flip={Math.cos(ph * 14 + i)} s={0.45 + hash(i + 60) * 0.25} color={LEAF_COLS[i % 4]} outline={false} />;
      })}
    </g>
  );
};

const curtainPath = (x0: number, x1: number, top: number, bottom: number, sway: number, side: 1 | -1) => {
  const tie = top + (bottom - top) * 0.62;
  const inner = side === 1 ? x1 : x0;
  const outer = side === 1 ? x0 : x1;
  const pull = side * 38;
  return `M${outer},${top} L${inner},${top} C${inner - pull * 0.2 + sway},${top + 120} ${inner - pull + sway},${tie - 60} ${inner - pull * 1.3},${tie}
    C${inner - pull * 0.8 + sway * 1.4},${tie + 50} ${inner - pull * 0.2 + sway * 2},${bottom - 30} ${inner + sway * 2},${bottom}
    L${outer + sway},${bottom + 6} C${outer - side * 6},${bottom - 80} ${outer},${top + 200} ${outer},${top} Z`;
};

export const Room: React.FC<{ t: number }> = ({ t }) => {
  const { x0, y0, x1, y1, inset } = WINDOW;
  const b = breeze(t);
  const sway = 10 * Math.sin(t * 1.4) * b + 16 * b;
  const lamp = lampOn(t);
  const tod = todAt(t);
  const mob = Math.sin(t * 0.9) * 8;
  return (
    <g>
      {/* wall */}
      <rect x={-400} y={-300} width={2720} height={1040} fill={PAL.wall} />
      {Array.from({ length: 34 }).map((_, i) => (
        <rect key={i} x={-400 + i * 82} y={-300} width={34} height={1040} fill={PAL.wallStripe} opacity={0.55} />
      ))}
      {/* bunting garland */}
      <path d="M 40,70 Q 380,170 760,80" stroke={PAL.woodDark} strokeWidth={3} fill="none" />
      {Array.from({ length: 9 }).map((_, i) => {
        const u = (i + 0.5) / 9;
        const x = 40 + u * 720;
        const y = 70 + Math.sin(u * Math.PI) * 50 + (u - 0.5) * -10;
        const fl = Math.sin(t * 2 + i) * 4 * b;
        const c = [PAL.leafGold, PAL.dress, PAL.blocks[0], PAL.leafOrange][i % 4];
        return <path key={i} d={`M${x - 26},${y} L${x + 26},${y + 2} L${x + fl},${y + 56} Z`} fill={c} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />;
      })}
      {/* framed picture: moon over hills */}
      <rect x={760} y={210} width={150} height={190} rx={6} fill={PAL.frame} stroke={INK} strokeWidth={3.5} />
      <rect x={776} y={226} width={118} height={158} fill="#c9d6cf" />
      <circle cx={850} cy={276} r={22} fill="#f6e3b4" />
      <path d="M776,350 Q820,310 860,340 T894,330 L894,384 L776,384 Z" fill="#9db08f" />
      {/* shelf with a little plant & house */}
      <rect x={1700} y={300} width={190} height={14} rx={4} fill={PAL.wood} stroke={INK} strokeWidth={3} />
      <path d="M 1730,300 L 1730,262 L 1752,240 L 1774,262 L 1774,300 Z" fill={PAL.blocks[4]} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <rect x={1820} y={266} width={36} height={34} rx={5} fill={PAL.leafOrange} stroke={INK} strokeWidth={3} />
      <path d={`M 1838,266 C ${1826 + mob * 0.3},240 1820,232 1814,222 M 1838,266 C 1846,240 ${1856 + mob * 0.3},236 1862,226 M 1838,266 L 1838,230`} stroke="#7d9a5c" strokeWidth={6} fill="none" strokeLinecap="round" />
      {/* skirting & floor */}
      <rect x={-400} y={700} width={2720} height={36} fill={PAL.skirting} stroke={INK} strokeWidth={3} />
      <rect x={-400} y={736} width={2720} height={700} fill={PAL.floor} />
      {Array.from({ length: 16 }).map((_, i) => (
        <path key={i} d={`M ${-300 + i * 170},736 L ${-700 + i * 210},1440`} stroke={PAL.floorLine} strokeWidth={3} opacity={0.7} />
      ))}
      <path d="M -400,820 L 2320,820 M -400,940 L 2320,940" stroke={PAL.floorLine} strokeWidth={2} opacity={0.35} />
      {/* rug */}
      <ellipse cx={900} cy={918} rx={600} ry={132} fill={PAL.rug} stroke={INK} strokeWidth={3} />
      <ellipse cx={900} cy={918} rx={500} ry={104} fill="none" stroke={PAL.rugRing} strokeWidth={12} strokeDasharray="30 18" />
      <ellipse cx={900} cy={918} rx={390} ry={78} fill={PAL.rugInner} />

      {/* window */}
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={8} fill={PAL.frame} stroke={INK} strokeWidth={4} />
      <clipPath id="winclip">
        <rect x={x0 + inset} y={y0 + inset} width={x1 - x0 - inset * 2} height={y1 - y0 - inset * 2} />
      </clipPath>
      <g clipPath="url(#winclip)">
        <AutumnView t={t} x0={x0 + inset} y0={y0 + inset} x1={x1 - inset} y1={y1 - inset} id="room" />
        {/* left pane glass + reflection */}
        <rect x={x0 + inset} y={y0 + inset} width={(x1 - x0) / 2 - inset} height={y1 - y0 - inset * 2} fill="#ffffff" opacity={0.1} />
        <path d={`M${x0 + 60},${y0 + 60} l40,-40 l20,0 l-60,60 Z M${x0 + 90},${y0 + 90} l70,-70 l10,0 l-70,70 Z`} fill="#ffffff" opacity={0.25} />
      </g>
      <rect x={(x0 + x1) / 2 - 8} y={y0 + inset} width={16} height={y1 - y0 - inset * 2} fill={PAL.frame} stroke={INK} strokeWidth={3} />
      <rect x={x0 + inset} y={(y0 + y1) / 2 - 7} width={(x1 - x0) / 2 - inset} height={14} fill={PAL.frame} stroke={INK} strokeWidth={3} />
      {/* right sash swung open into the room */}
      <path d={`M${x1 - inset},${y0 + inset} L${x1 + 46},${y0 + inset + 26} L${x1 + 46},${y1 - inset - 26} L${x1 - inset},${y1 - inset} Z`} fill="#dfe9ea" opacity={0.85} stroke={INK} strokeWidth={3} />
      <path d={`M${x1 - 20},${(y0 + y1) / 2} L${x1 + 44},${(y0 + y1) / 2}`} stroke={PAL.frame} strokeWidth={10} />
      {/* sill */}
      <rect x={x0 - 26} y={SILL_Y} width={x1 - x0 + 52} height={28} rx={5} fill={PAL.frame} stroke={INK} strokeWidth={3.5} />
      {/* moon night-light on the sill */}
      <g transform="translate(1150,612)">
        <rect x={-22} y={-12} width={44} height={12} rx={4} fill={PAL.wood} stroke={INK} strokeWidth={3} />
        <path d="M 6,-74 C -34,-70 -38,-18 2,-14 C -16,-26 -18,-58 6,-74 Z" fill={interpolateColors(lamp, [0, 1], [PAL.lampShade, '#fff0b8'])} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      </g>
      {/* curtains + rod */}
      <path d={curtainPath(1000, 1130, 112, 700, sway, 1)} fill={PAL.curtain} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d={`M1030,120 C1036,300 ${1050 + sway},520 ${1060 + sway * 1.6},690 M1072,120 C1080,280 ${1094 + sway},400 1100,470`} stroke={PAL.curtainShade} strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d={curtainPath(1530, 1660, 112, 700, sway * 0.8, -1)} fill={PAL.curtain} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d={`M1630,120 C1624,300 ${1612 + sway},520 ${1604 + sway * 1.3},690 M1588,120 C1582,280 ${1572 + sway},400 1566,470`} stroke={PAL.curtainShade} strokeWidth={6} fill="none" strokeLinecap="round" />
      <rect x={980} y={100} width={700} height={14} rx={7} fill={PAL.wood} stroke={INK} strokeWidth={3} />
      <circle cx={980} cy={107} r={14} fill={PAL.wood} stroke={INK} strokeWidth={3} />
      <circle cx={1680} cy={107} r={14} fill={PAL.wood} stroke={INK} strokeWidth={3} />

      {/* crib */}
      <g>
        <rect x={150} y={540} width={400} height={170} fill="#f3d9de" />
        <path d="M 160,610 Q 260,570 360,600 T 540,590 L 540,700 L 160,700 Z" fill="#e8b2b7" stroke={INK} strokeWidth={3} />
        <ellipse cx={230} cy={598} rx={56} ry={22} fill={PAL.cream} stroke={INK} strokeWidth={3} />
        {Array.from({ length: 11 }).map((_, i) => (
          <rect key={i} x={176 + i * 34} y={500} width={11} height={250} rx={5} fill={PAL.frame} stroke={INK} strokeWidth={2.5} />
        ))}
        <rect x={140} y={486} width={420} height={22} rx={10} fill={PAL.wood} stroke={INK} strokeWidth={3} />
        <rect x={140} y={738} width={420} height={22} rx={8} fill={PAL.wood} stroke={INK} strokeWidth={3} />
        <rect x={132} y={440} width={26} height={400} rx={10} fill={PAL.woodDark} stroke={INK} strokeWidth={3} />
        <rect x={542} y={440} width={26} height={400} rx={10} fill={PAL.woodDark} stroke={INK} strokeWidth={3} />
        <circle cx={145} cy={436} r={15} fill={PAL.woodDark} stroke={INK} strokeWidth={3} />
        <circle cx={555} cy={436} r={15} fill={PAL.woodDark} stroke={INK} strokeWidth={3} />
      </g>
      {/* mobile above the crib */}
      <g transform={`rotate(${mob * 0.4} 350 -40)`}>
        <path d="M 350,-40 L 350,250" stroke={PAL.woodDark} strokeWidth={3} />
        <path d={`M 250,250 L 450,250`} stroke={PAL.woodDark} strokeWidth={5} strokeLinecap="round" />
        {[
          [250, 0],
          [350, 1],
          [450, 2],
        ].map(([x, k]) => {
          const dy = 60 + k * 18 + Math.sin(t * 1.6 + k) * 6;
          const sw = Math.sin(t * 1.2 + k * 2) * 6;
          return (
            <g key={k} transform={`translate(${x + sw},${250 + dy})`}>
              <path d={`M ${-sw},${-dy} L 0,-16`} stroke={PAL.woodDark} strokeWidth={2} />
              {k === 0 && <path d="M 0,-16 C -26,-12 -26,22 4,24 C -10,14 -12,-6 0,-16 Z" fill="#f2d68a" stroke={INK} strokeWidth={2.6} />}
              {k === 1 && <path d="M 0,-18 L 6,-4 L 20,-4 L 9,5 L 13,19 L 0,10 L -13,19 L -9,5 L -20,-4 L -6,-4 Z" fill={PAL.leafGold} stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />}
              {k === 2 && <path d="M -22,8 C -30,8 -30,-6 -20,-6 C -18,-18 0,-20 4,-10 C 14,-16 26,-6 20,8 Z" fill={PAL.cream} stroke={INK} strokeWidth={2.6} />}
            </g>
          );
        })}
      </g>
      {/* teddy bear */}
      <g transform={`translate(612,862) rotate(${Math.sin(t * 0.6) * 1.5})`}>
        <ellipse cx={0} cy={0} rx={46} ry={50} fill={PAL.teddy} stroke={INK} strokeWidth={3} />
        <ellipse cx={0} cy={8} rx={26} ry={30} fill={PAL.teddyLight} />
        <ellipse cx={-34} cy={42} rx={20} ry={14} fill={PAL.teddy} stroke={INK} strokeWidth={3} />
        <ellipse cx={34} cy={42} rx={20} ry={14} fill={PAL.teddy} stroke={INK} strokeWidth={3} />
        <circle cx={-30} cy={-82} r={14} fill={PAL.teddy} stroke={INK} strokeWidth={3} />
        <circle cx={30} cy={-82} r={14} fill={PAL.teddy} stroke={INK} strokeWidth={3} />
        <circle cx={0} cy={-58} r={40} fill={PAL.teddy} stroke={INK} strokeWidth={3} />
        <ellipse cx={0} cy={-46} rx={17} ry={13} fill={PAL.teddyLight} />
        <ellipse cx={0} cy={-51} rx={6} ry={4.5} fill={INK} />
        <circle cx={-14} cy={-66} r={4.5} fill={INK} />
        <circle cx={14} cy={-66} r={4.5} fill={INK} />
        <path d="M -16,-24 Q 0,-14 16,-24 L 10,-12 L 0,-18 L -10,-12 Z" fill={PAL.blocks[0]} stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      </g>
      {/* spare blocks lying by the girl */}
      {[
        [1272, FLOOR - 14, 18, PAL.blocks[3]],
        [1314, FLOOR - 4, -12, PAL.blocks[4]],
      ].map(([x, y, r, c], i) => (
        <g key={i} transform={`translate(${x},${y}) rotate(${r})`}>
          <rect x={-20} y={-20} width={40} height={40} rx={5} fill={c as string} stroke={INK} strokeWidth={3} />
          <circle cx={0} cy={0} r={7} fill={PAL.cream} opacity={0.8} />
        </g>
      ))}
      {/* side table + night lamp */}
      <g>
        <rect x={1700} y={700} width={170} height={18} rx={6} fill={PAL.wood} stroke={INK} strokeWidth={3} />
        <rect x={1716} y={716} width={14} height={150} fill={PAL.woodDark} stroke={INK} strokeWidth={3} />
        <rect x={1840} y={716} width={14} height={150} fill={PAL.woodDark} stroke={INK} strokeWidth={3} />
        <path d="M 1740,700 L 1750,640 L 1800,640 L 1810,700 Z" fill={PAL.blocks[4]} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        <path d={`M 1775,640 C ${1760 + mob * 0.4},600 1740,590 1730,570 M 1775,640 C 1790,600 ${1810 + mob * 0.4},590 1822,574 M 1775,640 L ${1776 + mob * 0.2},580`} stroke="#7d9a5c" strokeWidth={7} fill="none" strokeLinecap="round" />
      </g>
      {/* sunbeam through the window */}
      <defs>
        <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={interpolateColors(tod, [0, 0.5, 1], ['#fff0c4', '#ffc98a', '#c79ab0'])} stopOpacity={0.55} />
          <stop offset="1" stopColor={interpolateColors(tod, [0, 0.5, 1], ['#fff0c4', '#ffc98a', '#c79ab0'])} stopOpacity={0} />
        </linearGradient>
        <radialGradient id="lampglow">
          <stop offset="0" stopColor={PAL.glow} stopOpacity={0.9} />
          <stop offset="0.35" stopColor={PAL.glow} stopOpacity={0.35} />
          <stop offset="1" stopColor={PAL.glow} stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d="M 1104,154 L 1556,154 L 1240,1080 L 640,1080 Z" fill="url(#beam)" opacity={0.5 * (1 - Math.max(0, tod - 0.55) * 2.2)} style={{ mixBlendMode: 'screen' }} />
      {Array.from({ length: 18 }).map((_, i) => {
        const u = (t * 0.03 + hash(i)) % 1;
        const x = 1000 + hash(i + 3) * 420 - u * 240 + Math.sin(t + i) * 10;
        const y = 220 + u * 700;
        return <circle key={i} cx={x} cy={y} r={2 + hash(i + 8) * 2} fill="#fff6dc" opacity={0.5 * Math.sin(u * Math.PI) * (1 - tod)} />;
      })}
      {lamp > 0 && <circle cx={1140} cy={570} r={560} fill="url(#lampglow)" opacity={lamp * 0.8} style={{ mixBlendMode: 'screen' }} />}
    </g>
  );
};
