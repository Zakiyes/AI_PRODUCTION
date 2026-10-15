import React from 'react';
import { AbsoluteFill, Audio, Img, interpolateColors, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { H, PAL, W } from './theme';
import { easeIn, easeInOut, prog } from './lib';
import { Girl, HEART_D, Leaf, MomBack, MomBody, MomNear } from './Characters';
import { Room } from './Room';
import { Exterior } from './Exterior';
import { blocks, exteriorCam, girl, girlWorld, hearts, interiorCam, interiorOpacity, leaf, paperFade, todAt } from './story';

// Signature: always on a bright, calm part of the frame, written on like ink.
// Slots chosen by measuring corner brightness/busyness of every second of the film.
const SIG_W = 875;
const SIG_H = 344;
const SIG_SLOTS = [
  { a: 0.8, b: 5.3, x: 1460, y: 34, w: 410 }, // A: over the sky, top right
  { a: 6.9, b: 31.0, x: 52, y: 34, w: 400 }, // B-D: plain wall, top left
  { a: 31.8, b: 41.5, x: 750, y: 26, w: 420 }, // E-F: above the heads, top centre
  { a: 43.9, b: 99, x: 600, y: 368, w: 720 }, // end card on paper
];

const Signature: React.FC<{ t: number }> = ({ t }) => {
  const s = SIG_SLOTS.find((k) => t >= k.a && t < k.b + 0.45);
  if (!s) return null;
  const write = prog(t, s.a, s.a + (s.w > 500 ? 0.9 : 1.1), easeInOut);
  const out = s.b > 90 ? 1 : 1 - prog(t, s.b, s.b + 0.45, easeIn);
  const h = (s.w * SIG_H) / SIG_W;
  const wash = s.b > 90 ? 0 : Math.min(1, prog(t, s.a - 0.3, s.a + 0.5, easeInOut)) * out;
  return (
    <>
      {/* soft watercolour wash in paper colour, so the ink reads on any background */}
      <div
        style={{
          position: 'absolute',
          left: s.x - s.w * 0.12,
          top: s.y - h * 0.18,
          width: s.w * 1.24,
          height: h * 1.36,
          borderRadius: '50%',
          background: `radial-gradient(ellipse at 50% 50%, ${PAL.paper}f0 0%, ${PAL.paper}c8 45%, ${PAL.paper}00 72%)`,
          opacity: wash * 0.95,
          filter: 'blur(6px)',
        }}
      />
    <Img
      src={staticFile('signature.png')}
      style={{
        position: 'absolute',
        left: s.x,
        top: s.y + Math.sin(t * 0.8) * 2 + (1 - out) * -8,
        width: s.w,
        height: h,
        opacity: 0.92 * Math.min(1, write * 3) * out,
        clipPath: `inset(0 ${(1 - write) * 100}% 0 0)`,
        mixBlendMode: 'multiply',
      }}
    />
    </>
  );
};

const cam = (c: { cx: number; cy: number; z: number }) => `translate(${W / 2},${H / 2}) scale(${c.z}) translate(${-c.cx},${-c.cy})`;

const Giggles: React.FC<{ t: number }> = ({ t }) => {
  const on = (t > 10.9 && t < 13.6) || (t > 24.6 && t < 26.0);
  if (!on) return null;
  const g = girl(t);
  const p = girlWorld(g.G, g.face, g.lean, [62, -150]);
  return (
    <g transform={`translate(${p[0]},${p[1]}) scale(${g.face < 0 ? -1 : 1},1)`} stroke={PAL.ink} strokeWidth={3.5} fill="none" strokeLinecap="round">
      {[0, 1, 2].map((i) => {
        const k = (Math.sin(t * 14 + i * 2) + 1) / 2;
        return <path key={i} d={`M ${i * 6},${-18 + i * 18} q ${10 + k * 6},${-4} ${18 + k * 8},${-12 + i * 8}`} />;
      })}
    </g>
  );
};

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tod = todAt(t);
  const io = interiorOpacity(t);
  const showExt = t < 6.6 || t > 42.9;
  const lf = leaf(t);
  // boil: linework re-drawn 12 times a second, like hand animation
  const boilSeed = Math.floor(t * 12);
  const tint = interpolateColors(tod, [0, 0.5, 1], ['#ffffff', '#ffdcb6', '#b8a5d4']);
  return (
    <AbsoluteFill style={{ backgroundColor: PAL.paper }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <filter id="boil" x="-2%" y="-2%" width="104%" height="104%">
            <feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves={2} seed={boilSeed} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={5} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g filter="url(#boil)">
          {showExt && (
            <g transform={cam(exteriorCam(t))}>
              <Exterior t={t} />
            </g>
          )}
          {io > 0 && (
            <g transform={cam(interiorCam(t))} opacity={io}>
              <Room t={t} />
              {blocks(t).map((b) => (
                <g key={b.i} transform={`translate(${b.x},${b.y}) rotate(${b.r})`}>
                  <rect x={-20} y={-20} width={40} height={40} rx={5} fill={b.c} stroke={PAL.ink} strokeWidth={3} />
                  <path d="M -8,-2 L 0,-10 L 8,-2 L 0,8 Z" fill={PAL.cream} opacity={0.85} />
                </g>
              ))}
              <MomBack t={t} />
              <MomBody t={t} />
              <Girl t={t} />
              <MomNear t={t} />
              {lf.visible && <Leaf x={lf.x} y={lf.y} r={lf.rot} flip={lf.flip} s={1.35} />}
              <Giggles t={t} />
              {hearts(t).map((h, i) => (
                <g key={i} transform={`translate(${h.x},${h.y}) rotate(${h.r}) scale(${h.s * 1.3})`} opacity={h.o}>
                  <path d={HEART_D} fill={PAL.heart} stroke={PAL.ink} strokeWidth={2.4} strokeLinejoin="round" />
                </g>
              ))}
            </g>
          )}
        </g>
        {/* colour arc: golden afternoon -> amber sunset -> lilac dusk */}
        <rect width={W} height={H} fill={tint} style={{ mixBlendMode: 'multiply' }} />
      </svg>
      <Img src={staticFile('paper.png')} style={{ position: 'absolute', inset: 0, width: W, height: H, mixBlendMode: 'multiply', opacity: 0.9 }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 55%, rgba(70,40,40,0.28) 100%)' }} />
      <AbsoluteFill style={{ backgroundColor: PAL.paper, opacity: paperFade(t) }} />
      <Signature t={t} />
      <Audio src={staticFile('autumn-lullaby.wav')} />
    </AbsoluteFill>
  );
};
