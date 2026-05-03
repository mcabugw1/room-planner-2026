import { renderHook, act } from '@testing-library/react';
import { useFurniture } from './useFurniture';

describe('useFurniture', () => {
  describe('rotate', () => {
    it('cycles through 90° steps and wraps around', () => {
      const { result } = renderHook(() => useFurniture());
      const id = result.current.furniture[0].id;
      const steps = [0, 90, 180, 270, 0];

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
      expect(result.current.furniture.find(f => f.id === a.id)?.rotation).toBe(90);
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

  describe('rotation steps', () => {
    it('initial furniture has rotation 0', () => {
      const { result } = renderHook(() => useFurniture());
      result.current.furniture.forEach(f => {
        expect(f.rotation).toBe(0);
      });
    });

    it('rotation after one step is 90°', () => {
      const { result } = renderHook(() => useFurniture());
      const id = result.current.furniture[0].id;
      act(() => result.current.rotate(id));
      expect(result.current.furniture.find(f => f.id === id)?.rotation).toBe(90);
    });

    it('rotation after two steps is 180°', () => {
      const { result } = renderHook(() => useFurniture());
      const id = result.current.furniture[0].id;
      act(() => result.current.rotate(id));
      act(() => result.current.rotate(id));
      expect(result.current.furniture.find(f => f.id === id)?.rotation).toBe(180);
    });
  });
});
