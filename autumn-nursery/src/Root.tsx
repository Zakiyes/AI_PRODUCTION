import React from 'react';
import { Composition } from 'remotion';
import { Film } from './Film';
import { DURATION_S, FPS, H, W } from './theme';

export const RemotionRoot: React.FC = () => (
  <Composition id="AutumnNursery" component={Film} durationInFrames={DURATION_S * FPS} fps={FPS} width={W} height={H} />
);
