import { useState } from 'react';
import { toInches } from '../../../utils/coordinates';
import { createId } from '../../../utils/createId';
import type { FurnitureItem, RotationDeg } from '../types/room';
import { defaultFurnitureHeight } from '../utils/furniture';
import { INITIAL_FURNITURE } from '../data/furniture';

export type { FurnitureItem, RotationDeg };

const ROTATION_STEPS: RotationDeg[] = [0, 90, 180, 270];

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

  function add(name = 'New Block') {
    setFurniture(prev => [...prev, {
      id: createId(),
      name,
      w: 24,
      h: 24,
      x: 40,
      y: 40,
      color: '#eee',
      rotation: 0,
      heightIn: defaultFurnitureHeight(name),
      zOffsetIn: 0,
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
