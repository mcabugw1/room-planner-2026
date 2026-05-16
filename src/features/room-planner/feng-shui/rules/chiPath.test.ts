import { describe, it, expect } from 'vitest';
import { checkChiPath } from './chiPath';
import type { FurnitureItem, DoorSwingFeature, RoomFeature } from '../../types/room';

// Door on top wall, band x=[60,96]
const door: DoorSwingFeature = {
  type: 'door-swing', id: 1, wall: 'top',
  offsetIn: 60, swingIn: 36,
  hingeDirection: 'left', swingDirection: 'in', doorHeightIn: 80,
};

describe('checkChiPath', () => {
  it('warning when chi path is clear and hits plain wall', () => {
    const issues = checkChiPath([], [], door);
    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe('chi-path-open');
    expect(issues[0].severity).toBe('warning');
  });

  it('error when chi path is clear and hits opposite window', () => {
    const oppositeWindow: RoomFeature = {
      type: 'window', id: 99, wall: 'bottom',
      offsetIn: 65, lengthIn: 40,
      sillHeightIn: 36, openingHeightIn: 48,
    };
    const issues = checkChiPath([], [oppositeWindow], door);
    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe('chi-path-window');
    expect(issues[0].severity).toBe('error');
  });

  it('no issue when furniture breaks chi path', () => {
    const blocker: FurnitureItem = {
      id: 10, name: 'Sofa', category: 'sofa',
      x: 62, y: 80, w: 60, h: 36,
      color: '#aaa', rotation: 0, heightIn: 36, zOffsetIn: 0,
    };
    expect(checkChiPath([blocker], [], door)).toHaveLength(0);
  });

  it('no issue when opposite window is outside band', () => {
    const outsideWindow: RoomFeature = {
      type: 'window', id: 99, wall: 'bottom',
      offsetIn: 0, lengthIn: 30, // x=[0,30], band=[60,96] → no overlap
      sillHeightIn: 36, openingHeightIn: 48,
    };
    const issues = checkChiPath([], [outsideWindow], door);
    expect(issues[0].ruleId).toBe('chi-path-open'); // window doesn't overlap
  });
});
