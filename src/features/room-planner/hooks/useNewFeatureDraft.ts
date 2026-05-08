import { useState } from 'react';
import type { WallSide } from '../types/room';
import type { AddableFeature } from './useWallFeatures';

export interface FeatureDraft {
  type: 'window' | 'door-swing' | 'wall-segment';
  wall: WallSide;
  offsetIn: number;
  lengthIn: number;
  hinge: 'left' | 'right';
  swingDir: 'in' | 'out';
}

const DEFAULT_DRAFT: FeatureDraft = {
  type: 'window',
  wall: 'bottom',
  offsetIn: 12,
  lengthIn: 36,
  hinge: 'left',
  swingDir: 'in',
};

export function useNewFeatureDraft() {
  const [draft, setDraft] = useState<FeatureDraft>(DEFAULT_DRAFT);

  function buildFeature(): AddableFeature {
    if (draft.type === 'window') {
      return { type: 'window', wall: draft.wall, offsetIn: draft.offsetIn, lengthIn: draft.lengthIn };
    }
    if (draft.type === 'wall-segment') {
      return { type: 'wall-segment', wall: draft.wall, offsetIn: draft.offsetIn, lengthIn: draft.lengthIn };
    }
    return {
      type: 'door-swing',
      wall: draft.wall,
      offsetIn: draft.offsetIn,
      swingIn: draft.lengthIn,
      hingeDirection: draft.hinge,
      swingDirection: draft.swingDir,
    };
  }

  return { draft, setDraft, buildFeature };
}
