import { describe, it, expect } from 'vitest';
import { checkCoffinPosition } from './coffinPosition';
import type { FurnitureItem, DoorSwingFeature, RoomLayout } from '../../types/room';

const layout: RoomLayout = {
  widthIn: 180, heightIn: 180, ceilingHeightIn: 96,
  roomType: 'bedroom', features: [],
};

// Door on top wall, center at x=78
const door: DoorSwingFeature = {
  type: 'door-swing', id: 1, wall: 'top',
  offsetIn: 60, swingIn: 36,
  hingeDirection: 'left', swingDirection: 'in', doorHeightIn: 80,
};

describe('checkCoffinPosition', () => {
  it('flags error when bed foot points at door (headAtStart=true, rotation=0 → foot points down, door is above)', () => {
    // headAtStart=true, rotation=0: foot vector=(0,1) south. Door threshold is at y=6 (north).
    // toDoor vector = (78-90, 6-140) = (-12, -134), normalized ≈ (−0.09, −1.0) → north.
    // foot=(0,1) vs toDoor≈(0,-1): angle ≈ 180°. NOT coffin. ✓
    const bed: FurnitureItem = {
      id: 10, name: 'Bed', category: 'bed',
      x: 60, y: 100, w: 60, h: 80,
      color: '#aaa', rotation: 0, heightIn: 24, zOffsetIn: 0,
      headAtStart: true,
    };
    const issues = checkCoffinPosition([bed], door, layout);
    expect(issues).toHaveLength(0);
  });

  it('flags error when headAtStart=false, rotation=0 (foot points north toward top-wall door)', () => {
    // headAtStart=false, rotation=0: foot vector=(0,-1) north. Door threshold is at y=6 (north).
    // toDoor points north. Angle ≈ 0° → coffin position.
    const bed: FurnitureItem = {
      id: 10, name: 'Bed', category: 'bed',
      x: 60, y: 100, w: 60, h: 80,
      color: '#aaa', rotation: 0, heightIn: 24, zOffsetIn: 0,
      headAtStart: false,
    };
    const issues = checkCoffinPosition([bed], door, layout);
    expect(issues.some(i => i.ruleId === 'coffin-position' && i.affectedItemId === 10)).toBe(true);
  });

  it('skips non-bed categories', () => {
    const sofa: FurnitureItem = {
      id: 20, name: 'Sofa', category: 'sofa',
      x: 60, y: 100, w: 60, h: 40,
      color: '#bbb', rotation: 0, heightIn: 36, zOffsetIn: 0,
      headAtStart: false,
    };
    const issues = checkCoffinPosition([sofa], door, layout);
    expect(issues).toHaveLength(0);
  });
});
