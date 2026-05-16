import { describe, it, expect } from 'vitest';
import { checkCommandPosition } from './commandPosition';
import type { FurnitureItem, DoorSwingFeature, RoomLayout } from '../../types/room';

const layout: RoomLayout = {
  widthIn: 180, heightIn: 180, ceilingHeightIn: 96,
  roomType: 'bedroom', features: [],
};

const door: DoorSwingFeature = {
  type: 'door-swing', id: 1, wall: 'top',
  offsetIn: 60, swingIn: 36,
  hingeDirection: 'left', swingDirection: 'in', doorHeightIn: 80,
};

function makeItem(overrides: Partial<FurnitureItem> = {}): FurnitureItem {
  return {
    id: 10, name: 'Bed', category: 'bed',
    x: 20, y: 100, w: 60, h: 80,
    color: '#aaa', rotation: 0, heightIn: 24, zOffsetIn: 0,
    ...overrides,
  };
}

describe('checkCommandPosition', () => {
  it('flags no issues when bed has clear sightline and is off-axis', () => {
    // Bed AABB x=[0,50], door band x=[60,96] → no overlap (50 < 60)
    const bed = makeItem({ x: 0, y: 100, w: 50 });
    const issues = checkCommandPosition([bed], door, layout);
    expect(issues.filter(i => i.ruleId === 'command-position')).toHaveLength(0);
    expect(issues.filter(i => i.ruleId === 'door-direct-line')).toHaveLength(0);
  });

  it('flags error when sightline is blocked by another piece', () => {
    // Bed at x=0,y=100 → center=(25,140). Door threshold=(78,6).
    // Blocker at x=0,y=50,w=80,h=40 → spans the ray path.
    const bed = makeItem({ x: 0, y: 100, w: 50 });
    const blocker: FurnitureItem = {
      id: 20, name: 'Dresser', category: 'other',
      x: 0, y: 50, w: 80, h: 40,
      color: '#bbb', rotation: 0, heightIn: 36, zOffsetIn: 0,
    };
    const issues = checkCommandPosition([bed, blocker], door, layout);
    expect(issues.some(i => i.ruleId === 'command-position' && i.affectedItemId === 10)).toBe(true);
  });

  it('flags warning when bed is in direct line with clear sightline', () => {
    // Door band is x=[60,96]. Bed centered in that band.
    const bed = makeItem({ x: 60, y: 100, w: 36, h: 40 });
    const issues = checkCommandPosition([bed], door, layout);
    expect(issues.some(i => i.ruleId === 'door-direct-line' && i.affectedItemId === 10)).toBe(true);
  });

  it('skips category "other"', () => {
    const shelf = makeItem({ category: 'other', x: 60, y: 100 });
    const issues = checkCommandPosition([shelf], door, layout);
    expect(issues).toHaveLength(0);
  });
});
