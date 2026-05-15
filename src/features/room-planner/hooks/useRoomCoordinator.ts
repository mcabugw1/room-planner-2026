import { useMemo, useCallback, useEffect } from 'react';
import { formatDim } from '../../../utils/displayUtils';
import { toPixels } from '../../../utils/canvasCoords';
import { findNearestNeighbors, measureTwoObjects } from '../utils/measurements';
import type { MeasurementArrow } from '../utils/measurements';
import type { LayoutSnapshot } from '../services/layoutDb';
import type { RoomLayout } from '../types/room';
import { useFurniture } from './useFurniture';
import { useWallFeatures } from './useWallFeatures';
import { useRoomSession } from './useRoomSession';
import { useMeasurementMode } from './useMeasurementMode';
import { useLayoutPersistence } from './useLayoutPersistence';
import { useWallFeatureDrag } from './useWallFeatureDrag';
import { usePanelState } from './usePanelState';
import { useNewFeatureDraft } from './useNewFeatureDraft';
import { useDeviceType } from './useDeviceType';
import { useVirtualKeyboard } from './useVirtualKeyboard';
import { useCanvasViewport } from './useCanvasViewport';

export function useRoomCoordinator(initialRoom: RoomLayout) {
  const deviceType  = useDeviceType();
  const furniture   = useFurniture();
  const wallFeatures = useWallFeatures(initialRoom.features);
  const session     = useRoomSession({ ...initialRoom, features: [] });
  const ui          = usePanelState(deviceType);
  const featDraft   = useNewFeatureDraft();
  const measurement = useMeasurementMode();

  const snapshot = useMemo<LayoutSnapshot>(() => ({
    widthIn: session.layout.widthIn,
    heightIn: session.layout.heightIn,
    ceilingHeightIn: session.layout.ceilingHeightIn,
    roomType: session.layout.roomType,
    fengShuiConfig: session.layout.fengShuiConfig,
    features: wallFeatures.features,
    furniture: furniture.furniture,
  }), [session.layout.widthIn, session.layout.heightIn, session.layout.ceilingHeightIn, session.layout.roomType, session.layout.fengShuiConfig, wallFeatures.features, furniture.furniture]);

  const restore = useCallback((s: LayoutSnapshot) => {
    session.applySnapshot(s.widthIn, s.heightIn, s.ceilingHeightIn, s.roomType, s.fengShuiConfig);
    wallFeatures.reset(s.features);
    furniture.reset(s.furniture);
  }, [session, wallFeatures, furniture]);

  const persistence = useLayoutPersistence(snapshot, restore);

  const selectedItem    = furniture.furniture.find(f => f.id === session.selectedId) ?? null;
  const selectedFeature = wallFeatures.features.find(f => f.id === wallFeatures.selectedFeatureId) ?? null;

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

  const canvasW = toPixels(session.layout.widthIn);
  const canvasH = toPixels(session.layout.heightIn);
  const viewport = useCanvasViewport(canvasW, canvasH);

  const drag = useWallFeatureDrag(
    session.layout,
    wallFeatures.features,
    selectFeature,
    wallFeatures.update,
    viewport.scale,
  );

  useVirtualKeyboard();

  return {
    session,
    furniture,
    wallFeatures,
    measurement,
    persistence,
    ui,
    featDraft,
    drag,
    viewport,
    selectedItem,
    selectedFeature,
    measurementArrows,
    selectFeature,
    selectFurniture,
    restore,
  };
}
