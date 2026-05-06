import { useMemo, useCallback, useEffect } from 'react';
import { formatDim } from '../../../utils/coordinates';
import { useFurniture } from './useFurniture';
import { useWallFeatures } from './useWallFeatures';
import { useRoomSession } from './useRoomSession';
import { useRoomUI } from './useRoomUI';
import { useMeasurementMode } from './useMeasurementMode';
import { useLayoutPersistence } from './useLayoutPersistence';
import { useWallFeatureDrag } from './useWallFeatureDrag';
import { DEFAULT_ROOM } from '../data/room';
import { findNearestNeighbors, measureTwoObjects } from '../utils/measurements';
import type { MeasurementArrow } from '../utils/measurements';
import type { LayoutSnapshot } from '../services/layoutDb';

export function useRoomState() {
  const furniture = useFurniture();
  const wallFeatures = useWallFeatures(DEFAULT_ROOM.features);
  const session = useRoomSession({ ...DEFAULT_ROOM, features: [] });
  const ui = useRoomUI();
  const measurement = useMeasurementMode();

  const snapshot = useMemo<LayoutSnapshot>(() => ({
    widthIn: session.layout.widthIn,
    heightIn: session.layout.heightIn,
    features: wallFeatures.features,
    furniture: furniture.furniture,
  }), [session.layout.widthIn, session.layout.heightIn, wallFeatures.features, furniture.furniture]);

  const restore = useCallback((s: LayoutSnapshot) => {
    session.applySnapshot(s.widthIn, s.heightIn);
    wallFeatures.reset(s.features);
    furniture.reset(s.furniture);
  }, [session, wallFeatures, furniture]);

  const persistence = useLayoutPersistence(snapshot, restore);

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

  const drag = useWallFeatureDrag(session.layout, wallFeatures.features, selectFeature, wallFeatures.update);

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
    furniture,
    wallFeatures,
    session,
    ui,
    measurement,
    persistence,
    drag,
    derived: {
      snapshot,
      measurementArrows,
      selectedItem,
      selectedFeature,
    },
    selectFurniture,
    selectFeature,
    restore,
  };
}
