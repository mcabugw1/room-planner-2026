import { useState } from 'react';
import { toInches } from '../../../utils/coordinates';

export interface FurnitureItem {
  id: number;
  name: string;
  w: number;
  h: number;
  x: number;
  y: number;
  color: string;
}

const INITIAL_FURNITURE: FurnitureItem[] = [
  { id: 1, name: 'Bed',  w: 54, h: 75, x: 10, y: 10, color: '#ffcccb' },
  { id: 2, name: 'Desk', w: 48, h: 24, x: 70, y: 10, color: '#add8e6' },
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
      prev.map(f => f.id === id ? {
        ...f,
        w: toInches(parseInt(pWidth)),
        h: toInches(parseInt(pHeight)),
        x: toInches(px),
        y: toInches(py),
      } : f)
    );
  }

  function add() {
    setFurniture(prev => [...prev, {
      id: Date.now(),
      name: 'New Block',
      w: 24,
      h: 24,
      x: 40,
      y: 40,
      color: '#eee',
    }]);
  }

  return { furniture, move, resize, add };
}
