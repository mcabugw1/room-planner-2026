import { computeMoveOffset, computeResizeEnd, computeResizeStart, featureLenIn } from './useWallFeatureDrag';
import type { RoomFeature } from '../types/room';

function window_(id: number, offset: number, len: number): RoomFeature {
  return { type: 'window', id, wall: 'bottom', offsetIn: offset, lengthIn: len };
}

describe('featureLenIn', () => {
  it('returns lengthIn for window', () => {
    expect(featureLenIn(window_(1, 0, 36))).toBe(36);
  });

  it('returns swingIn for door-swing', () => {
    const door: RoomFeature = { type: 'door-swing', id: 1, wall: 'bottom', offsetIn: 0, swingIn: 32, hingeDirection: 'left', swingDirection: 'in' };
    expect(featureLenIn(door)).toBe(32);
  });
});

describe('computeMoveOffset', () => {
  it('clamps to wall bounds', () => {
    expect(computeMoveOffset(-10, 24, 120, [])).toBe(0);
    expect(computeMoveOffset(110, 24, 120, [])).toBe(96);
  });

  it('snaps to wall start (within SNAP_IN = 3.75")', () => {
    expect(computeMoveOffset(2, 24, 120, [])).toBe(0);
  });

  it('snaps to wall end (within SNAP_IN = 3.75")', () => {
    // desired=94: |94+24-120|=2 < 3.75, should snap to 96
    expect(computeMoveOffset(94, 24, 120, [])).toBe(96);
  });

  it('cannot overlap a sibling to the right', () => {
    // center of dragged (30+12=42) < sibling.offsetIn (60), so hi=60
    const sibling = window_(2, 60, 24);
    const offset = computeMoveOffset(30, 24, 120, [sibling]);
    expect(offset + 24).toBeLessThanOrEqual(60);
  });

  it('snaps to sibling end edge', () => {
    const sibling = window_(2, 0, 24);
    const offset = computeMoveOffset(26, 24, 120, [sibling]);
    expect(offset).toBe(24);
  });
});

describe('computeResizeEnd', () => {
  it('enforces minimum length', () => {
    expect(computeResizeEnd(0, 0, 120, [])).toBe(6);
  });

  it('cannot extend past wall end', () => {
    expect(computeResizeEnd(100, 40, 120, [])).toBe(20);
  });

  it('cannot extend into a right sibling', () => {
    const sibling = window_(2, 60, 24);
    expect(computeResizeEnd(20, 60, 120, [sibling])).toBe(40);
  });

  it('snaps to wall end', () => {
    const len = computeResizeEnd(100, 18, 120, []);
    expect(len).toBe(20);
  });
});

describe('computeResizeStart', () => {
  it('enforces minimum length', () => {
    const [, len] = computeResizeStart(114, 120, []);
    expect(len).toBeGreaterThanOrEqual(6);
  });

  it('snaps start to wall origin', () => {
    const [off] = computeResizeStart(2, 60, []);
    expect(off).toBe(0);
  });

  it('cannot overlap a left sibling', () => {
    const sibling = window_(2, 0, 20);
    const [off] = computeResizeStart(10, 60, [sibling]);
    expect(off).toBeGreaterThanOrEqual(20);
  });
});
