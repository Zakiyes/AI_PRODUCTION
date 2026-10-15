import React from 'react';
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { SHOTS, Shot } from './shots';

export const FPS = 24;
export const W = 1080;
export const H = 1920;
const ease = Easing.bezier(0.45, 0, 0.55, 1);
// set false for the final export once all clips are in
const SHOW_LABELS = SHOTS.some((s) => !s.clip);

const IMG_SIZE: Record<string, [number, number]> = {
  'ref/restaurant-green.jpg': [1016, 1317],
  'ref/dish-angle.jpg': [1206, 1091],
  'ref/dish-top.jpg': [1206, 1197],
};

// Placeholder: the reference photo with a slow, eased camera move (cover-fit, then zoom on a focus point).
const Placeholder: React.FC<{ s: Shot; p: number }> = ({ s, p }) => {
  const [iw, ih] = IMG_SIZE[s.ref];
  const fx = s.f0[0] + (s.f1[0] - s.f0[0]) * p;
  const fy = s.f0[1] + (s.f1[1] - s.f0[1]) * p;
  const z = s.f0[2] + (s.f1[2] - s.f0[2]) * p;
  const cover = Math.max(W / iw, H / ih) * z;
  const w = iw * cover;
  const h = ih * cover;
  const x = Math.min(0, Math.max(W - w, W / 2 - fx * w));
  const y = Math.min(0, Math.max(H - h, H / 2 - fy * h));
  const rotate = s.id === 8 ? 3 * p : 0;
  // tiny handheld drift so nothing feels like a still
  const t = p * (s.to - s.from);
  const hx = Math.sin(t * 1.3 + s.id) * 3;
  const hy = Math.cos(t * 1.1 + s.id * 2) * 3;
  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#f4f1ec' }}>
      <Img
        src={staticFile(s.ref)}
        style={{ position: 'absolute', left: x + hx, top: y + hy, width: w, height: h, transform: `rotate(${rotate}deg)`, transformOrigin: `${fx * 100}% ${fy * 100}%`, filter: s.id === 6 ? 'blur(0px)' : undefined }}
      />
    </AbsoluteFill>
  );
};

const ShotView: React.FC<{ s: Shot }> = ({ s }) => {
  const frame = useCurrentFrame();
  const len = (s.to - s.from) * FPS;
  const p = ease(Math.min(1, frame / len));
  return (
    <AbsoluteFill>
      {s.clip ? (
        <OffthreadVideo src={staticFile(s.clip)} muted style={{ width: W, height: H, objectFit: 'cover' }} />
      ) : (
        <Placeholder s={s} p={p} />
      )}
      {SHOW_LABELS && !s.clip && (
        <div style={{ position: 'absolute', left: 36, bottom: 120, right: 36, padding: '14px 20px', borderRadius: 14, background: 'rgba(20,20,20,0.55)', color: '#fff', fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 30, lineHeight: 1.3 }}>
          <b>SHOT {s.id}</b> · {s.from}–{s.to}s · placeholder
          <br />
          <span style={{ opacity: 0.85 }}>{s.note}</span>
        </div>
      )}
    </AbsoluteFill>
  );
};

// Logo: written on in the white negative space above the dish in the hero shot.
const Signature: React.FC<{ t: number }> = ({ t }) => {
  const a = 26.3;
  const write = interpolate(t, [a, a + 1.3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  if (write <= 0) return null;
  const w = 760;
  const h = (w * 344) / 875;
  return (
    <Img
      src={staticFile('signature.png')}
      style={{
        position: 'absolute',
        left: (W - w) / 2,
        top: 250 + (1 - write) * 10,
        width: w,
        height: h,
        opacity: Math.min(1, write * 2.5) * 0.95,
        clipPath: `inset(0 ${(1 - write) * 100}% 0 0)`,
        mixBlendMode: 'multiply',
      }}
    />
  );
};

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const fadeIn = interpolate(t, [0, 0.8], [1, 0], { extrapolateRight: 'clamp' });
  const toWhite = interpolate(t, [29.2, 30], [0, 0.85], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // dissolve 7 -> 8
  const dissolve = interpolate(t, [24.2, 24.8], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const grainShift = (frame * 137) % 400;
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <AbsoluteFill style={{ zIndex: 0 }}>
      {SHOTS.map((s) => (
        <Sequence key={s.id} from={Math.round(s.from * FPS)} durationInFrames={Math.round((s.to - s.from + (s.id === 7 ? 0.3 : 0)) * FPS)}>
          <AbsoluteFill style={{ opacity: s.id === 7 ? (t > 24.2 ? dissolve : 1) : 1, zIndex: s.id === 7 ? 2 : 1 }}>
            <ShotView s={s} />
          </AbsoluteFill>
        </Sequence>
      ))}
      </AbsoluteFill>
      <Signature t={t} />
      {/* one grade for every shot: warm highlights, soft contrast, vignette, film grain */}
      <AbsoluteFill style={{ background: 'rgba(255,190,130,0.10)', mixBlendMode: 'soft-light' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 55%, rgba(30,20,10,0.35) 100%)' }} />
      <Img src={staticFile('grain.png')} style={{ position: 'absolute', left: -grainShift, top: -((grainShift * 3) % 400), width: W + 400, height: H + 400, opacity: 0.12, mixBlendMode: 'overlay' }} />
      <AbsoluteFill style={{ backgroundColor: '#000', opacity: fadeIn }} />
      <AbsoluteFill style={{ backgroundColor: '#f6f3ee', opacity: toWhite }} />
      <Audio src={staticFile('mellow-jazz.wav')} />
    </AbsoluteFill>
  );
};
