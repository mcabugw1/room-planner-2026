import { renderHook, act } from '@testing-library/react';
import { useFurniture } from './useFurniture';

describe('useFurniture', () => {
  describe('rotate', () => {
    it('cycles through all 8 steps and wraps around', () => {
      const { result } = renderHook(() => useFurniture());
      const id = result.current.furniture[0].id;
      const steps = [0, 45, 90, 135, 180, 225, 270, 315, 0];

      for (let i = 0; i < steps.length - 1; i++) {
        expect(result.current.furniture[0].rotation).toBe(steps[i]);
        act(() => result.current.rotate(id));
      }
      expect(result.current.furniture[0].rotation).toBe(0);
    });

    it('is a no-op for unknown id', () => {
      const { result } = renderHook(() => useFurniture());
      const before = result.current.furniture.map(f => f.rotation);
      act(() => result.current.rotate(999999));
      const after = result.current.furniture.map(f => f.rotation);
      expect(after).toEqual(before);
    });

    it('only rotates the targeted item', () => {
      const { result } = renderHook(() => useFurniture());
      const [a, b] = result.current.furniture;
      act(() => result.current.rotate(a.id));
      expect(result.current.furniture.find(f => f.id === a.id)?.rotation).toBe(45);
      expect(result.current.furniture.find(f => f.id === b.id)?.rotation).toBe(0);
    });
  });

  describe('remove', () => {
    it('removes the correct item and leaves others intact', () => {
      const { result } = renderHook(() => useFurniture());
      const [a, b] = result.current.furniture;
      act(() => result.current.remove(a.id));
      expect(result.current.furniture.find(f => f.id === a.id)).toBeUndefined();
      expect(result.current.furniture.find(f => f.id === b.id)).toBeDefined();
    });

    it('is a no-op for unknown id', () => {
      const { result } = renderHook(() => useFurniture());
      const count = result.current.furniture.length;
      act(() => result.current.remove(999999));
      expect(result.current.furniture.length).toBe(count);
    });
  });

  describe('snap bypass', () => {
    it('initial furniture has rotation 0', () => {
      const { result } = renderHook(() => useFurniture());
      result.current.furniture.forEach(f => {
        expect(f.rotation % 90).toBe(0);
      });
    });

    it('rotation is not a 90° multiple after one step from 0°', () => {
      const { result } = renderHook(() => useFurniture());
      const id = result.current.furniture[0].id;
      act(() => result.current.rotate(id));
      const item = result.current.furniture.find(f => f.id === id)!;
      expect(item.rotation % 90).not.toBe(0);
    });

    it('rotation is a 90° multiple after two steps from 0°', () => {
      const { result } = renderHook(() => useFurniture());
      const id = result.current.furniture[0].id;
      act(() => result.current.rotate(id));
      act(() => result.current.rotate(id));
      const item = result.current.furniture.find(f => f.id === id)!;
      expect(item.rotation % 90).toBe(0);
    });
  });
});
