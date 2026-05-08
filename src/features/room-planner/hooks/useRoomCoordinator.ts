import { useMemo, useCallback, useEffect } from 'react';
import { formatDim } from '../../../utils/coordinates';
import { findNearestNeighbors, measureTwoObjects } from '../utils/measurements';
import type { MeasurementArrow } from '../utils/measurements';
import type { LayoutSnapshot } from '../services/layoutDb';
import type { useFurniture } from './useFurniture';
import type { useWallFeatures } from './useWallFeatures';
import type { useRoomSession } from './useRoomSession';
import type { useMeasurementMode } from './useMeasurementMode';

export function useRoomCoordinator(
  furniture: ReturnType<typeof useFurniture>,
  wallFeatures: ReturnType<typeof useWallFeatures>,
  session: ReturnType<typeof useRoomSession>,
  measurement: ReturnType<typeof useMeasurementMode>,
) {
  const snapshot = useMemo<LayoutSnapshot>(() => ({
    widthIn: session.layout.widthIn,
    heightIn: session.layout.heightIn,
    ceilingHeightIn: session.layout.ceilingHeightIn,
    features: wallFeatures.features,
    furniture: furniture.furniture,
  }), [session.layout.widthIn, session.layout.heightIn, session.layout.ceilingHeightIn, wallFeatures.features, furniture.furniture]);

  const restore = useCallback((s: LayoutSnapshot) => {
    session.applySnapshot(s.widthIn, s.heightIn, s.ceilingHeightIn);
    wallFeatures.reset(s.features);
    furniture.reset(s.furniture);
  }, [session, wallFeatures, furniture]);

  const selectedItem = furniture.furniture.find(f => f.id === session.selectedId) ?? null;
  const selectedFeature = wallFeatures.features.find(f => f.id === wallFeatures.selectedFeatureId) ?? null;

  const measurementArrows = useMemo<MeasurementArrow[]>(() => {
    const arrows: MeasurementArrow[] = [];
    if (measurement.showNeighbors) {
      arrows.push(...findNearestNeighbors(furniture.furniture, session.layout));
    }
    if (measurement.showPair && measurement.pairIds[0] !== null && measurement.pairIds[1] !== null) {
      const a = furniture.furniture.find(f => f.id === measurement.pairIds[0]);
      const b = furniture.furniture.find(f => f.id === measurement.pairIds[1]);
      if (a && b) arrows.push(measureTwoObjects(a, b));
    }
    return arrows.map(a => ({
      ...a,
      label: a.isOverlap ? 'overlap' : formatDim(a.gapIn, session.unitSystem),
    }));
  }, [measurement.showNeighbors, measurement.showPair, measurement.pairIds, furniture.furniture, session.layout, session.unitSystem]);

  function selectFeature(id: number) {
    wallFeatures.select(id);
    session.setSelectedId(null);
  }

  function selectFurniture(id: number) {
    if (measurement.showPair) {
      measurement.fillPairId(id);
      return;
    }
    session.setSelectedId(id);
    wallFeatures.select(null);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.key === 'r' || e.key === 'R') {
        if (session.selectedId !== null) furniture.rotate(session.selectedId);
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (session.selectedId !== null) {
          furniture.remove(session.selectedId);
          session.setSelectedId(null);
        } else if (wallFeatures.selectedFeatureId !== null) {
          wallFeatures.remove(wallFeatures.selectedFeatureId);
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [session.selectedId, session, wallFeatures, furniture]);

  return {
    snapshot,
    restore,
    selectedItem,
    selectedFeature,
    measurementArrows,
    selectFeature,
    selectFurniture,
  };
}
