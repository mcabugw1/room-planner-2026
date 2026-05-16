import { describe, it, expect } from 'vitest';
import { checkWallBacking } from './wallBacking';
import type { FurnitureItem, RoomLayout } from '../../types/room';

const layout: RoomLayout = {
  widthIn: 180, heightIn: 180, ceilingHeightIn: 96,
  roomType: 'bedroom', features: [],
};

describe('checkWallBacking', () => {
  it('no issue when headAtStart=true, rotation=0, bed within 6" of top wall', () => {
    const bed: FurnitureItem = {
      id: 10, name: 'Bed', category: 'bed',
      x: 50, y: 3, w: 60, h: 80, // y=3 → 3" from top wall ✓
      color: '#aaa', rotation: 0, heightIn: 24, zOffsetIn: 0,
      headAtStart: true,
    };
    expect(checkWallBacking([bed], layout)).toHaveLength(0);
  });

  it('flags warning when headAtStart=true, rotation=0, bed 30" from top wall', () => {
    const bed: FurnitureItem = {
      id: 10, name: 'Bed', category: 'bed',
      x: 50, y: 30, w: 60, h: 80,
      color: '#aaa', rotation: 0, heightIn: 24, zOffsetIn: 0,
      headAtStart: true,
    };
    const issues = checkWallBacking([bed], layout);
    expect(issues.some(i => i.ruleId === 'wall-backing' && i.affectedItemId === 10)).toBe(true);
  });

  it('skips items with headAtStart undefined', () => {
    const bed: FurnitureItem = {
      id: 10, name: 'Bed', category: 'bed',
      x: 50, y: 30, w: 60, h: 80,
      color: '#aaa', rotation: 0, heightIn: 24, zOffsetIn: 0,
      // headAtStart not set
    };
    expect(checkWallBacking([bed], layout)).toHaveLength(0);
  });

  it('skips category "other"', () => {
    const shelf: FurnitureItem = {
      id: 20, name: 'Shelf', category: 'other',
      x: 50, y: 30, w: 30, h: 12,
      color: '#aaa', rotation: 0, heightIn: 36, zOffsetIn: 0,
      headAtStart: true,
    };
    expect(checkWallBacking([shelf], layout)).toHaveLength(0);
  });
});
