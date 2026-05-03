import { useState } from 'react';
import { toInches } from '../../../utils/coordinates';
import { createId } from '../../../utils/createId';

export type RotationDeg = 0 | 90 | 180 | 270;

const ROTATION_STEPS: RotationDeg[] = [0, 90, 180, 270];

export interface FurnitureItem {
  id: number;
  name: string;
  w: number;
  h: number;
  x: number;
  y: number;
  color: string;
  rotation: RotationDeg;
}

const INITIAL_FURNITURE: FurnitureItem[] = [
  { id: 1, name: 'Bed',  w: 54, h: 75, x: 10, y: 10, color: '#ffcccb', rotation: 0 },
  { id: 2, name: 'Desk', w: 48, h: 24, x: 70, y: 10, color: '#add8e6', rotation: 0 },
];

export function useFurniture() {
  const [furniture, setFurniture] = useState<FurnitureItem[]>(INITIAL_FURNITURE);

  function move(id: number, px: number, py: number) {
    setFurniture(prev =>
      prev.map(f => f.id === id ? { ...f, x: toInches(px), y: toInches(py) } : f)
    );
  }

  function resize(id: number, pWidth: string, pHeight: string, px: number, py: number) {
    setFurniture(prev =>
      prev.map(f => {
        if (f.id !== id) return f;
        const isOdd = f.rotation === 90 || f.rotation === 270;
        return {
          ...f,
          w: toInches(parseInt(isOdd ? pHeight : pWidth)),
          h: toInches(parseInt(isOdd ? pWidth : pHeight)),
          x: toInches(px),
          y: toInches(py),
        };
      })
    );
  }

  function add() {
    setFurniture(prev => [...prev, {
      id: createId(),
      name: 'New Block',
      w: 24,
      h: 24,
      x: 40,
      y: 40,
      color: '#eee',
      rotation: 0,
    }]);
  }

  function update(id: number, changes: Partial<Omit<FurnitureItem, 'id'>>) {
    setFurniture(prev => prev.map(f => f.id === id ? { ...f, ...changes } : f));
  }

  function remove(id: number) {
    setFurniture(prev => prev.filter(f => f.id !== id));
  }

  function rotate(id: number) {
    setFurniture(prev =>
      prev.map(f => {
        if (f.id !== id) return f;
        const idx = ROTATION_STEPS.indexOf(f.rotation);
        const next = ROTATION_STEPS[(idx + 1) % ROTATION_STEPS.length];
        return { ...f, rotation: next };
      })
    );
  }

  function reset(items: FurnitureItem[]) {
    setFurniture(items);
  }

  return { furniture, move, resize, add, update, remove, rotate, reset };
}
