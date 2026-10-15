import React from 'react';
import { interpolateColors } from 'remotion';
import { PAL } from './theme';
import { hash } from './lib';
import { Leaf } from './Characters';
import { AutumnView } from './Room';
import { breeze, todAt } from './story';

const INK = PAL.ink;
const LEAF_COLS = [PAL.leafRed, PAL.leafOrange, PAL.leafGold, PAL.leafBrown];

// Outside the house: the opening shot (A), and the closing shot (F) rhymes with it at dusk.
export const Exterior: React.FC<{ t: number }> = ({ t }) => {
  const tod = todAt(t);
  const b = breeze(t);
  const dusk = Math.max(0, tod - 0.5) * 2;
  const wall = interpolateColors(tod, [0, 0.5, 1], [PAL.houseWall, '#efc19c', '#8f7895']);
  const line = interpolateColors(tod, [0, 0.5, 1], [PAL.houseLine, '#dca784', '#7b6584']);
  const glow = interpolateColors(tod, [0, 1], ['#fbe3b6', '#ffc56e']);
  const fol = (c: string) => interpolateColors(tod, [0, 0.6, 1], [c, c, '#7b465a']);
  const late = t > 30;
  return (
    <g>
      {/* whole backdrop = the same autumn view, big */}
      <AutumnView t={t + 3.3} x0={-300} y0={-200} x1={2220} y1={1100} id="ext" />
      {/* house wall */}
      <rect x={560} y={150} width={820} height={1000} fill={wall} stroke={INK} strokeWidth={4} />
      {Array.from({ length: 22 }).map((_, i) => (
        <path key={i} d={`M560,${190 + i * 44} L1380,${190 + i * 44}`} stroke={line} strokeWidth={3} />
      ))}
      <path d="M 500,170 L 1440,170 L 1400,110 L 540,110 Z" fill={PAL.roof} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {/* the window, glowing */}
      <rect x={772} y={312} width={376} height={386} rx={8} fill={PAL.frame} stroke={INK} strokeWidth={4} />
      <rect x={790} y={330} width={340} height={350} fill={glow} />
      <rect x={790} y={330} width={340} height={350} fill="#ffb86a" opacity={0.25 + dusk * 0.4} />
      {/* curtains inside */}
      <path d={`M790,330 L850,330 C846,420 ${830 + b * 6},540 820,680 L790,680 Z`} fill={PAL.curtain} />
      <path d={`M1130,330 L1070,330 C1074,420 ${1090 - b * 6},540 1100,680 L1130,680 Z`} fill={PAL.curtain} />
      {/* silhouettes: playing in A, holding the sleeping girl in F */}
      <g fill="#b98a7a" opacity={0.75}>
        {!late && (
          <>
            <ellipse cx={905} cy={600} rx={26} ry={30} />
            <path d="M 870,690 C 870,640 890,628 908,628 C 930,628 950,650 950,690 Z" />
            <circle cx={1010} cy={640} r={20} transform={`translate(0,${-6 * Math.abs(Math.sin(t * 4))})`} />
            <path d={`M 994,690 C 994,665 1000,${660 - 6 * Math.abs(Math.sin(t * 4))} 1010,${660 - 6 * Math.abs(Math.sin(t * 4))} C 1022,660 1028,670 1028,690 Z`} />
          </>
        )}
        {late && (
          <>
            <ellipse cx={935} cy={590} rx={26} ry={30} />
            <path d="M 890,690 C 890,640 910,620 935,620 C 965,620 985,650 985,690 Z" />
            <circle cx={970} cy={640} r={19} />
          </>
        )}
      </g>
      <rect x={952} y={330} width={16} height={350} fill={PAL.frame} stroke={INK} strokeWidth={3} />
      <rect x={790} y={498} width={340} height={14} fill={PAL.frame} stroke={INK} strokeWidth={3} />
      <rect x={750} y={692} width={420} height={26} rx={5} fill={PAL.frame} stroke={INK} strokeWidth={4} />
      {/* flower box */}
      <rect x={780} y={718} width={360} height={56} rx={6} fill={PAL.wood} stroke={INK} strokeWidth={3.5} />
      {Array.from({ length: 9 }).map((_, i) => (
        <circle key={i} cx={800 + i * 40} cy={712 + Math.sin(t * 2 + i) * 2 * b} r={17} fill={[PAL.leafOrange, PAL.leafGold, PAL.dress][i % 3]} stroke={INK} strokeWidth={2.5} />
      ))}
      {/* window glow onto the wall at dusk */}
      <defs>
        <radialGradient id="wallglow">
          <stop offset="0" stopColor="#ffcf85" stopOpacity={1} />
          <stop offset="1" stopColor="#ffcf85" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={960} cy={505} rx={420} ry={380} fill="url(#wallglow)" opacity={0.1 + dusk * 0.4} style={{ mixBlendMode: 'screen' }} />
      {/* ground, leaf piles, pumpkins */}
      <path d="M -300,1000 C 300,960 900,990 1500,960 C 1900,950 2100,980 2220,970 L 2220,1300 L -300,1300 Z" fill={interpolateColors(tod, [0, 1], [PAL.grass, '#5d5a62'])} stroke={INK} strokeWidth={3} />
      {Array.from({ length: 30 }).map((_, i) => (
        <Leaf key={i} x={-200 + hash(i + 70) * 2300} y={995 + hash(i + 80) * 60} r={hash(i) * 360} s={0.7} color={fol(LEAF_COLS[i % 4])} outline={false} />
      ))}
      {[
        [1450, 990, 46],
        [1530, 1000, 32],
      ].map(([x, y, r], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y - r * 0.7} rx={r * 1.25} ry={r * 0.85} fill={interpolateColors(tod, [0, 1], [PAL.leafOrange, '#a85a4a'])} stroke={INK} strokeWidth={3} />
          <path d={`M${x},${y - r * 1.4} L${x},${y - r * 0.1} M${x - r * 0.5},${y - r * 1.35} Q${x - r * 0.7},${y - r * 0.7} ${x - r * 0.5},${y - r * 0.05} M${x + r * 0.5},${y - r * 1.35} Q${x + r * 0.7},${y - r * 0.7} ${x + r * 0.5},${y - r * 0.05}`} stroke={INK} strokeWidth={2} fill="none" opacity={0.6} />
          <path d={`M${x},${y - r * 1.5} q 4,-14 12,-16`} stroke={PAL.trunk} strokeWidth={6} fill="none" strokeLinecap="round" />
        </g>
      ))}
      {/* big maple in the foreground, left */}
      <path d="M 210,1100 C 250,860 220,640 300,420 L 360,430 C 310,640 340,860 330,1100 Z" fill={interpolateColors(tod, [0, 1], [PAL.trunk, '#3f2f3a'])} stroke={INK} strokeWidth={4} />
      <path d="M 300,560 C 220,500 140,470 60,420 M 330,500 C 420,430 470,380 520,300" stroke={interpolateColors(tod, [0, 1], [PAL.trunk, '#3f2f3a'])} strokeWidth={26} fill="none" strokeLinecap="round" />
      {Array.from({ length: 38 }).map((_, i) => {
        const a = hash(i + 100) * Math.PI * 2;
        const r = Math.sqrt(hash(i + 140)) * 340;
        const cx = 300 + Math.cos(a) * r * 1.3 + Math.sin(t * 1.2 + i) * 5 * b;
        const cy = 250 + Math.sin(a) * r * 0.7 + Math.cos(t + i) * 3 * b;
        return <circle key={i} cx={cx} cy={cy} r={60 + hash(i + 7) * 50} fill={fol(LEAF_COLS[i % 3])} opacity={0.95} />;
      })}
      {/* leaves falling across the frame */}
      {Array.from({ length: 22 }).map((_, i) => {
        const period = 6 + hash(i + 200) * 5;
        const ph = ((t + hash(i + 210) * period) % period) / period;
        const x = -100 + hash(i + 220) * 1500 + ph * 500 * (0.4 + b) + Math.sin(ph * 10 + i) * 50;
        const y = 150 + ph * 980;
        return <Leaf key={i} x={x} y={y} r={ph * 600 + i * 30} flip={Math.cos(ph * 12 + i)} s={0.8 + hash(i + 230) * 0.6} color={fol(LEAF_COLS[i % 4])} />;
      })}
    </g>
  );
};
