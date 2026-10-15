import React from 'react';
import * as THREE from 'three';
import { ThreeCanvas } from '@remotion/three';
import { AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { Scene } from './Scene';

export const FPS = 24;
export const W = 1080;
export const H = 1920;
const ease = Easing.bezier(0.45, 0, 0.55, 1);

// Logo written into the white tablecloth above the dish in the closing top-down shot.
const Signature: React.FC<{ t: number }> = ({ t }) => {
  const a = 26.4;
  const write = interpolate(t, [a, a + 1.4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  if (write <= 0) return null;
  const w = 720;
  const h = (w * 344) / 875;
  return (
    <Img
      src={staticFile('signature.png')}
      style={{
        position: 'absolute', left: (W - w) / 2, top: 230, width: w, height: h,
        opacity: Math.min(1, write * 2.5) * 0.92,
        clipPath: `inset(0 ${(1 - write) * 100}% 0 0)`,
        mixBlendMode: 'multiply',
      }}
    />
  );
};

// hard cuts get a 2-frame soft blend, like a real edit with a tiny dissolve
const CUTS = [3, 6, 10, 14, 19, 22, 25];

export const Film3D: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const fadeIn = interpolate(t, [0, 0.9], [1, 0], { extrapolateRight: 'clamp' });
  const toWhite = interpolate(t, [29.3, 30], [0, 0.8], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const grainShift = (frame * 137) % 400;
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <ThreeCanvas
        width={W}
        height={H}
        shadows={{ type: THREE.VSMShadowMap }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.86, preserveDrawingBuffer: true }}
        camera={{ fov: 30, near: 1, far: 1500, position: [0, 30, 60] }}
      >
        <Scene t={t} />
      </ThreeCanvas>
      <Signature t={t} />
      {/* one grade: warm highlights, gentle vignette, film grain, slight halation */}
      <AbsoluteFill style={{ background: 'rgba(255,186,120,0.09)', mixBlendMode: 'soft-light' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 52%, rgba(25,16,8,0.38) 100%)' }} />
      <Img src={staticFile('grain.png')} style={{ position: 'absolute', left: -grainShift, top: -((grainShift * 3) % 400), width: W + 400, height: H + 400, opacity: 0.13, mixBlendMode: 'overlay' }} />
      <AbsoluteFill style={{ backgroundColor: '#000', opacity: fadeIn }} />
      <AbsoluteFill style={{ backgroundColor: '#f6f3ee', opacity: toWhite }} />
      <Audio src={staticFile('mellow-jazz.wav')} />
    </AbsoluteFill>
  );
};

export { CUTS };
