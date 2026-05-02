import { renderHook, act } from '@testing-library/react';
import { useWallFeatures } from './useWallFeatures';
import type { RoomFeature } from '../types/room';

const INITIAL: RoomFeature[] = [
  { type: 'window',       id: 1, wall: 'left',   offsetIn: 30, lengthIn: 60 },
  { type: 'door-swing',   id: 2, wall: 'right',  offsetIn: 50, swingIn: 36, hingeDirection: 'right' },
  { type: 'wall-segment', id: 3, wall: 'bottom',  offsetIn: 10, lengthIn: 20 },
];

describe('useWallFeatures', () => {
  describe('add', () => {
    it('appends a new feature with a unique id', () => {
      const { result } = renderHook(() => useWallFeatures(INITIAL));
      act(() => result.current.add({ type: 'window', wall: 'top', offsetIn: 12, lengthIn: 24 }));
      expect(result.current.features).toHaveLength(INITIAL.length + 1);
      const added = result.current.features.at(-1)!;
      expect(added.type).toBe('window');
      expect(typeof added.id).toBe('number');
    });

    it('auto-selects the newly added feature', () => {
      const { result } = renderHook(() => useWallFeatures(INITIAL));
      act(() => result.current.add({ type: 'window', wall: 'top', offsetIn: 12, lengthIn: 24 }));
      const added = result.current.features.at(-1)!;
      expect(result.current.selectedFeatureId).toBe(added.id);
    });
  });

  describe('remove', () => {
    it('removes the correct feature and leaves others intact', () => {
      const { result } = renderHook(() => useWallFeatures(INITIAL));
      act(() => result.current.remove(1));
      expect(result.current.features.find(f => f.id === 1)).toBeUndefined();
      expect(result.current.features.find(f => f.id === 2)).toBeDefined();
      expect(result.current.features.find(f => f.id === 3)).toBeDefined();
    });

    it('clears selection when the selected feature is removed', () => {
      const { result } = renderHook(() => useWallFeatures(INITIAL));
      act(() => result.current.select(2));
      act(() => result.current.remove(2));
      expect(result.current.selectedFeatureId).toBeNull();
    });

    it('keeps selection when a different feature is removed', () => {
      const { result } = renderHook(() => useWallFeatures(INITIAL));
      act(() => result.current.select(2));
      act(() => result.current.remove(1));
      expect(result.current.selectedFeatureId).toBe(2);
    });

    it('is a no-op for unknown id', () => {
      const { result } = renderHook(() => useWallFeatures(INITIAL));
      act(() => result.current.remove(999999));
      expect(result.current.features).toHaveLength(INITIAL.length);
    });
  });

  describe('update', () => {
    it('applies partial changes to the correct feature', () => {
      const { result } = renderHook(() => useWallFeatures(INITIAL));
      act(() => result.current.update(2, { hingeDirection: 'left' }));
      const door = result.current.features.find(f => f.id === 2)!;
      expect(door.type).toBe('door-swing');
      if (door.type === 'door-swing') expect(door.hingeDirection).toBe('left');
    });

    it('does not mutate other features', () => {
      const { result } = renderHook(() => useWallFeatures(INITIAL));
      act(() => result.current.update(2, { offsetIn: 99 }));
      const window = result.current.features.find(f => f.id === 1)!;
      expect(window.offsetIn).toBe(30);
    });
  });

  describe('select', () => {
    it('sets selectedFeatureId', () => {
      const { result } = renderHook(() => useWallFeatures(INITIAL));
      act(() => result.current.select(3));
      expect(result.current.selectedFeatureId).toBe(3);
    });

    it('clears selection when called with null', () => {
      const { result } = renderHook(() => useWallFeatures(INITIAL));
      act(() => result.current.select(3));
      act(() => result.current.select(null));
      expect(result.current.selectedFeatureId).toBeNull();
    });
  });
});
