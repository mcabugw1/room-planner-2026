import { renderHook, act } from '@testing-library/react';
import { useRoomSession, PRESETS } from './useRoomSession';
import type { RoomLayout } from '../types/room';

const INITIAL: RoomLayout = { widthIn: 144, heightIn: 144, ceilingHeightIn: 96, features: [] };

describe('useRoomSession', () => {
  describe('setWidthDims', () => {
    it('sets width from ft+in', () => {
      const { result } = renderHook(() => useRoomSession(INITIAL));
      act(() => result.current.setWidthDims(10, 0));
      expect(result.current.layout.widthIn).toBe(120);
    });

    it('carries inch overflow into feet', () => {
      const { result } = renderHook(() => useRoomSession(INITIAL));
      act(() => result.current.setWidthDims(9, 12));
      expect(result.current.layout.widthIn).toBe(120);
    });

    it('rejects values below minimum (48")', () => {
      const { result } = renderHook(() => useRoomSession(INITIAL));
      act(() => result.current.setWidthDims(0, 0));
      expect(result.current.layout.widthIn).toBe(144);
    });

    it('rejects values above maximum (720")', () => {
      const { result } = renderHook(() => useRoomSession(INITIAL));
      act(() => result.current.setWidthDims(61, 0));
      expect(result.current.layout.widthIn).toBe(144);
    });
  });

  describe('setHeightDims', () => {
    it('sets height from ft+in', () => {
      const { result } = renderHook(() => useRoomSession(INITIAL));
      act(() => result.current.setHeightDims(12, 6));
      expect(result.current.layout.heightIn).toBe(150);
    });

    it('borrows from feet when inch is negative', () => {
      const { result } = renderHook(() => useRoomSession(INITIAL));
      act(() => result.current.setHeightDims(11, -6));
      expect(result.current.layout.heightIn).toBe(126);
    });
  });

  describe('applyPreset', () => {
    it('applies a valid preset', () => {
      const { result } = renderHook(() => useRoomSession(INITIAL));
      const idx = PRESETS.findIndex(p => p.label === '10 × 10 ft');
      act(() => result.current.applyPreset(idx));
      expect(result.current.layout.widthIn).toBe(120);
      expect(result.current.layout.heightIn).toBe(120);
    });

    it('ignores the Custom preset (w=0)', () => {
      const { result } = renderHook(() => useRoomSession(INITIAL));
      const idx = PRESETS.findIndex(p => p.w === 0);
      act(() => result.current.applyPreset(idx));
      expect(result.current.layout.widthIn).toBe(144);
    });
  });

  describe('applySnapshot', () => {
    it('updates layout and clears selection', () => {
      const { result } = renderHook(() => useRoomSession(INITIAL));
      act(() => result.current.setSelectedId(42));
      act(() => result.current.applySnapshot(168, 180));
      expect(result.current.layout.widthIn).toBe(168);
      expect(result.current.layout.heightIn).toBe(180);
      expect(result.current.selectedId).toBeNull();
    });
  });

  describe('derived dimensions', () => {
    it('widthFt and widthInchPart split correctly', () => {
      const { result } = renderHook(() => useRoomSession({ widthIn: 150, heightIn: 120, ceilingHeightIn: 96, features: [] }));
      expect(result.current.widthFt).toBe(12);
      expect(result.current.widthInchPart).toBe(6);
    });
  });
});
