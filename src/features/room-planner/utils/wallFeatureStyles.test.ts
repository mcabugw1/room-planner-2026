import { getDoorSwingStyle } from './wallFeatureStyles';
import { toPixels } from '../../../utils/coordinates';
import type { DoorSwingFeature } from '../types/room';

function door(overrides: Partial<DoorSwingFeature> = {}): DoorSwingFeature {
  return {
    type: 'door-swing',
    id: 1,
    wall: 'bottom',
    offsetIn: 12,
    swingIn: 36,
    hingeDirection: 'left',
    swingDirection: 'in',
    ...overrides,
  };
}

describe('getDoorSwingStyle', () => {
  describe('right wall', () => {
    it('swing in — hinge left → bottom-left quarter-circle', () => {
      const { posStyle, borderRadius } = getDoorSwingStyle(door({ wall: 'right', swingDirection: 'in', hingeDirection: 'left' }), 12);
      expect(posStyle).toMatchObject({ right: 0, top: toPixels(12) });
      expect(borderRadius).toBe('0 0 0 100%');
    });

    it('swing in — hinge right → top-left quarter-circle', () => {
      const { borderRadius } = getDoorSwingStyle(door({ wall: 'right', swingDirection: 'in', hingeDirection: 'right' }), 12);
      expect(borderRadius).toBe('100% 0 0 0');
    });

    it('swing out — hinge left → bottom-right quarter-circle', () => {
      const { posStyle, borderRadius } = getDoorSwingStyle(door({ wall: 'right', swingDirection: 'out', hingeDirection: 'left' }), 12);
      expect(posStyle).toMatchObject({ left: '100%', top: toPixels(12) });
      expect(borderRadius).toBe('0 0 100% 0');
    });

    it('swing out — hinge right → top-right quarter-circle', () => {
      const { borderRadius } = getDoorSwingStyle(door({ wall: 'right', swingDirection: 'out', hingeDirection: 'right' }), 12);
      expect(borderRadius).toBe('0 100% 0 0');
    });
  });

  describe('left wall', () => {
    it('swing in — hinge right → bottom-right quarter-circle', () => {
      const { posStyle, borderRadius } = getDoorSwingStyle(door({ wall: 'left', swingDirection: 'in', hingeDirection: 'right' }), 12);
      expect(posStyle).toMatchObject({ left: 0, top: toPixels(12) });
      expect(borderRadius).toBe('0 0 100% 0');
    });

    it('swing out — hinge right → bottom-left quarter-circle', () => {
      const { posStyle, borderRadius } = getDoorSwingStyle(door({ wall: 'left', swingDirection: 'out', hingeDirection: 'right' }), 12);
      expect(posStyle).toMatchObject({ right: '100%', top: toPixels(12) });
      expect(borderRadius).toBe('0 0 0 100%');
    });
  });

  describe('bottom wall', () => {
    it('swing in — hinge left → top-left quarter-circle', () => {
      const { posStyle, borderRadius } = getDoorSwingStyle(door({ wall: 'bottom', swingDirection: 'in', hingeDirection: 'left' }), 12);
      expect(posStyle).toMatchObject({ bottom: 0, left: toPixels(12) });
      expect(borderRadius).toBe('100% 0 0 0');
    });

    it('swing out — hinge left → bottom-left quarter-circle', () => {
      const { posStyle, borderRadius } = getDoorSwingStyle(door({ wall: 'bottom', swingDirection: 'out', hingeDirection: 'left' }), 12);
      expect(posStyle).toMatchObject({ top: '100%', left: toPixels(12) });
      expect(borderRadius).toBe('0 0 0 100%');
    });
  });

  describe('top wall', () => {
    it('swing in — hinge left → bottom-left quarter-circle', () => {
      const { posStyle, borderRadius } = getDoorSwingStyle(door({ wall: 'top', swingDirection: 'in', hingeDirection: 'left' }), 12);
      expect(posStyle).toMatchObject({ top: 0, left: toPixels(12) });
      expect(borderRadius).toBe('0 0 0 100%');
    });

    it('swing out — hinge left → top-left quarter-circle', () => {
      const { posStyle, borderRadius } = getDoorSwingStyle(door({ wall: 'top', swingDirection: 'out', hingeDirection: 'left' }), 12);
      expect(posStyle).toMatchObject({ bottom: '100%', left: toPixels(12) });
      expect(borderRadius).toBe('100% 0 0 0');
    });
  });

  it('passes live offsetIn into posStyle', () => {
    const { posStyle } = getDoorSwingStyle(door({ wall: 'bottom', swingDirection: 'in' }), 48);
    expect(posStyle).toMatchObject({ left: toPixels(48) });
  });
});
