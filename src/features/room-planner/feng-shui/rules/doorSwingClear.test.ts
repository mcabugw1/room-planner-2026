import { describe, it, expect } from 'vitest';
import { checkDoorSwingClear } from './doorSwingClear';
import type { FurnitureItem, DoorSwingFeature, RoomLayout } from '../../types/room';

const layout: RoomLayout = {
  widthIn: 180, heightIn: 180, ceilingHeightIn: 96,
  roomType: 'bedroom', features: [],
};

// Door on top wall, hinge at left (x=60), swing right and into room
// Sector: hinge=(60,0), radius=36, SE quadrant (x≥60, y≥0)
const door: DoorSwingFeature = {
  type: 'door-swing', id: 1, wall: 'top',
  offsetIn: 60, swingIn: 36,
  hingeDirection: 'left', swingDirection: 'in', doorHeightIn: 80,
};

function makeItem(x: number, y: number, w = 30, h = 30): FurnitureItem {
  return {
    id: 10, name: 'Chair', category: 'other',
    x, y, w, h,
    color: '#aaa', rotation: 0, heightIn: 18, zOffsetIn: 0,
  };
}

describe('checkDoorSwingClear', () => {
  it('flags item squarely inside swing arc', () => {
    // Point (70, 10) is inside SE quadrant from (60,0) within radius 36
    const item = makeItem(62, 2, 20, 20);
    const issues = checkDoorSwingClear([item], door, layout);
    expect(issues.some(i => i.ruleId === 'door-swing-clear' && i.affectedItemId === 10)).toBe(true);
  });

  it('no issue for item far from swing arc', () => {
    // Item at (10, 100) — far from hinge at (60,0), well outside radius 36
    const item = makeItem(10, 100);
    expect(checkDoorSwingClear([item], door, layout)).toHaveLength(0);
  });

  it('no issue for item on wrong side of hinge (west of hinge = not in SE quadrant)', () => {
    // Item at (20, 2) — west of hinge (x=60), not in SE quadrant
    const item = makeItem(20, 2, 30, 20);
    expect(checkDoorSwingClear([item], door, layout)).toHaveLength(0);
  });
});
