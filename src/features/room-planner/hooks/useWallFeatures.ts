import { useState } from 'react';
import type { RoomFeature, WallSide } from '../types/room';
import { createId } from '../../../utils/createId';

export type AddableFeature =
  | { type: 'window';       wall: WallSide; offsetIn: number; lengthIn: number }
  | { type: 'door-swing';   wall: WallSide; offsetIn: number; swingIn: number; hingeDirection: 'left' | 'right'; swingDirection: 'in' | 'out' }
  | { type: 'wall-segment'; wall: WallSide; offsetIn: number; lengthIn: number };

export type FeatureChanges = {
  wall?: WallSide;
  offsetIn?: number;
  lengthIn?: number;
  swingIn?: number;
  hingeDirection?: 'left' | 'right';
  swingDirection?: 'in' | 'out';
};

export function useWallFeatures(initialFeatures: RoomFeature[]) {
  const [features, setFeatures] = useState<RoomFeature[]>(initialFeatures);
  const [selectedFeatureId, setSelectedFeatureId] = useState<number | null>(null);

  function add(feature: AddableFeature) {
    const id = createId();
    const newFeature = { ...feature, id } as RoomFeature;
    setFeatures(prev => [...prev, newFeature]);
    setSelectedFeatureId(id);
  }

  function remove(id: number) {
    setFeatures(prev => prev.filter(f => f.id !== id));
    setSelectedFeatureId(prev => (prev === id ? null : prev));
  }

  function update(id: number, changes: FeatureChanges) {
    setFeatures(prev =>
      prev.map(f => (f.id === id ? ({ ...f, ...changes } as RoomFeature) : f))
    );
  }

  function select(id: number | null) {
    setSelectedFeatureId(id);
  }

  function reset(items: RoomFeature[]) {
    setFeatures(items);
    setSelectedFeatureId(null);
  }

  return { features, selectedFeatureId, add, remove, update, select, reset };
}
