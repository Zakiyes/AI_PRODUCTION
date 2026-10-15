import React from 'react';
import { Composition } from 'remotion';
import { FPS, Film, H, W } from './Film';

export const RemotionRoot: React.FC = () => <Composition id="ChefPlating" component={Film} durationInFrames={30 * FPS} fps={FPS} width={W} height={H} />;
