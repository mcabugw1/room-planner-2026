import { describe, it, expect } from 'vitest';
import { checkWindowHead } from './windowHead';
import type { FurnitureItem, RoomFeature, RoomLayout } from '../../types/room';

const layout: RoomLayout = {
  widthIn: 180, heightIn: 180, ceilingHeightIn: 96,
  roomType: 'bedroom', features: [],
};

const window1: RoomFeature = {
  type: 'window', id: 5, wall: 'top',
  offsetIn: 40, lengthIn: 48,
  sillHeightIn: 36, openingHeightIn: 48,
};

describe('checkWindowHead', () => {
  it('flags warning when bed head is under a window on same wall', () => {
    // headAtStart=true, rotation=0: head at top (y≈0), span x=[50, 110]
    // Window at top wall, x=[40, 88] → overlaps
    const bed: FurnitureItem = {
      id: 10, name: 'Bed', category: 'bed',
      x: 50, y: 2, w: 60, h: 80,
      color: '#aaa', rotation: 0, heightIn: 24, zOffsetIn: 0,
      headAtStart: true,
    };
    const issues = checkWindowHead([bed], [window1], layout);
    expect(issues.some(i => i.ruleId === 'window-head' && i.affectedItemId === 10)).toBe(true);
  });

  it('no issue when bed head is not near a window', () => {
    // Bed head at top but x span [130, 180] — no overlap with window [40, 88]
    const bed: FurnitureItem = {
      id: 10, name: 'Bed', category: 'bed',
      x: 130, y: 2, w: 50, h: 80,
      color: '#aaa', rotation: 0, heightIn: 24, zOffsetIn: 0,
      headAtStart: true,
    };
    expect(checkWindowHead([bed], [window1], layout)).toHaveLength(0);
  });

  it('no issue when head is >6" from wall', () => {
    const bed: FurnitureItem = {
      id: 10, name: 'Bed', category: 'bed',
      x: 50, y: 20, w: 60, h: 80,
      color: '#aaa', rotation: 0, heightIn: 24, zOffsetIn: 0,
      headAtStart: true,
    };
    expect(checkWindowHead([bed], [window1], layout)).toHaveLength(0);
  });

  it('skips non-bed categories', () => {
    const desk: FurnitureItem = {
      id: 20, name: 'Desk', category: 'desk',
      x: 50, y: 2, w: 60, h: 40,
      color: '#bbb', rotation: 0, heightIn: 30, zOffsetIn: 0,
      headAtStart: true,
    };
    expect(checkWindowHead([desk], [window1], layout)).toHaveLength(0);
  });
});
