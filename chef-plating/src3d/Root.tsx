import React from 'react';
import { Composition } from 'remotion';
import { FPS, Film3D, H, W } from './Film3D';

export const Root3D: React.FC = () => <Composition id="ChefPlating3D" component={Film3D} durationInFrames={30 * FPS} fps={FPS} width={W} height={H} />;
