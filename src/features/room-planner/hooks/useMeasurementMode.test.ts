import { renderHook, act } from '@testing-library/react';
import { useMeasurementMode } from './useMeasurementMode';

describe('useMeasurementMode', () => {
  describe('togglePair', () => {
    it('toggles showPair on', () => {
      const { result } = renderHook(() => useMeasurementMode());
      act(() => result.current.togglePair());
      expect(result.current.showPair).toBe(true);
    });

    it('toggles showPair off', () => {
      const { result } = renderHook(() => useMeasurementMode());
      act(() => result.current.togglePair());
      act(() => result.current.togglePair());
      expect(result.current.showPair).toBe(false);
    });

    it('always resets pairIds when toggling', () => {
      const { result } = renderHook(() => useMeasurementMode());
      act(() => result.current.fillPairId(1));
      act(() => result.current.fillPairId(2));
      act(() => result.current.togglePair());
      expect(result.current.pairIds).toEqual([null, null]);
    });
  });

  describe('fillPairId', () => {
    it('fills first slot when both are null', () => {
      const { result } = renderHook(() => useMeasurementMode());
      act(() => result.current.fillPairId(10));
      expect(result.current.pairIds).toEqual([10, null]);
    });

    it('fills second slot when first is set', () => {
      const { result } = renderHook(() => useMeasurementMode());
      act(() => result.current.fillPairId(10));
      act(() => result.current.fillPairId(20));
      expect(result.current.pairIds).toEqual([10, 20]);
    });

    it('overwrites second slot on third call', () => {
      const { result } = renderHook(() => useMeasurementMode());
      act(() => result.current.fillPairId(10));
      act(() => result.current.fillPairId(20));
      act(() => result.current.fillPairId(30));
      expect(result.current.pairIds).toEqual([10, 30]);
    });
  });

  describe('setShowNeighbors', () => {
    it('enables neighbor mode', () => {
      const { result } = renderHook(() => useMeasurementMode());
      act(() => result.current.setShowNeighbors(true));
      expect(result.current.showNeighbors).toBe(true);
    });

    it('disables neighbor mode', () => {
      const { result } = renderHook(() => useMeasurementMode());
      act(() => result.current.setShowNeighbors(true));
      act(() => result.current.setShowNeighbors(false));
      expect(result.current.showNeighbors).toBe(false);
    });
  });
});
