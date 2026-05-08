import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach } from 'vitest';
import { useRoomCoordinator } from './useRoomCoordinator';
import { DEFAULT_ROOM } from '../data/room';

vi.mock('../services/layoutDb', () => ({
  getAutosave:    vi.fn().mockResolvedValue(null),
  saveAutosave:   vi.fn().mockResolvedValue(undefined),
  listLayouts:    vi.fn().mockResolvedValue([]),
  saveLayout:     vi.fn().mockResolvedValue(undefined),
  loadLayout:     vi.fn().mockResolvedValue(null),
  renameLayout:   vi.fn().mockResolvedValue(undefined),
  deleteLayout:   vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./useCanvasViewport', () => ({
  useCanvasViewport: () => ({
    containerRef: { current: null },
    scale: 1, tx: 0, ty: 0,
    zoomIn: vi.fn(), zoomOut: vi.fn(), refit: vi.fn(),
  }),
}));

vi.mock('./useVirtualKeyboard', () => ({
  useVirtualKeyboard: () => undefined,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function renderCoordinator() {
  return renderHook(() => useRoomCoordinator(DEFAULT_ROOM));
}

describe('useRoomCoordinator', () => {
  describe('selectFurniture', () => {
    it('sets selectedId in normal mode', async () => {
      const { result } = renderCoordinator();
      const firstId = result.current.furniture.furniture[0].id;
      act(() => result.current.selectFurniture(firstId));
      expect(result.current.session.selectedId).toBe(firstId);
    });

    it('clears wall feature selection when furniture is selected', async () => {
      const { result } = renderCoordinator();
      const firstId = result.current.furniture.furniture[0].id;
      act(() => result.current.wallFeatures.select(result.current.wallFeatures.features[0].id));
      act(() => result.current.selectFurniture(firstId));
      expect(result.current.wallFeatures.selectedFeatureId).toBeNull();
    });

    it('fills pairIds instead of selecting when showPair is active', async () => {
      const { result } = renderCoordinator();
      act(() => result.current.measurement.togglePair());
      const firstId = result.current.furniture.furniture[0].id;
      act(() => result.current.selectFurniture(firstId));
      expect(result.current.measurement.pairIds[0]).toBe(firstId);
      expect(result.current.session.selectedId).toBeNull();
    });

    it('fills both pairIds on two successive selects in pair mode', async () => {
      const { result } = renderCoordinator();
      act(() => result.current.measurement.togglePair());
      const [a, b] = result.current.furniture.furniture;
      act(() => result.current.selectFurniture(a.id));
      act(() => result.current.selectFurniture(b.id));
      expect(result.current.measurement.pairIds).toEqual([a.id, b.id]);
    });
  });

  describe('selectFeature', () => {
    it('sets selectedFeatureId', () => {
      const { result } = renderCoordinator();
      const featId = result.current.wallFeatures.features[0].id;
      act(() => result.current.selectFeature(featId));
      expect(result.current.wallFeatures.selectedFeatureId).toBe(featId);
    });

    it('clears furniture selection when a feature is selected', () => {
      const { result } = renderCoordinator();
      const itemId = result.current.furniture.furniture[0].id;
      act(() => result.current.selectFurniture(itemId));
      const featId = result.current.wallFeatures.features[0].id;
      act(() => result.current.selectFeature(featId));
      expect(result.current.session.selectedId).toBeNull();
    });
  });

  describe('restore', () => {
    it('applies snapshot dimensions to session', () => {
      const { result } = renderCoordinator();
      act(() => result.current.restore({ widthIn: 200, heightIn: 250, ceilingHeightIn: 96, features: [], furniture: [] }));
      expect(result.current.session.layout.widthIn).toBe(200);
      expect(result.current.session.layout.heightIn).toBe(250);
    });

    it('resets furniture items from snapshot', () => {
      const { result } = renderCoordinator();
      const newItem = { id: 99, name: 'Test', w: 30, h: 30, x: 0, y: 0, color: '#fff', rotation: 0 as const, heightIn: 36, zOffsetIn: 0 };
      act(() => result.current.restore({ widthIn: 120, heightIn: 120, ceilingHeightIn: 96, features: [], furniture: [newItem] }));
      expect(result.current.furniture.furniture).toHaveLength(1);
      expect(result.current.furniture.furniture[0].id).toBe(99);
    });

    it('resets wall features from snapshot', () => {
      const { result } = renderCoordinator();
      act(() => result.current.restore({ widthIn: 120, heightIn: 120, ceilingHeightIn: 96, features: [], furniture: [] }));
      expect(result.current.wallFeatures.features).toHaveLength(0);
    });
  });

  describe('selectedItem', () => {
    it('is null when nothing selected', () => {
      const { result } = renderCoordinator();
      expect(result.current.selectedItem).toBeNull();
    });

    it('returns the furniture item matching selectedId', () => {
      const { result } = renderCoordinator();
      const item = result.current.furniture.furniture[0];
      act(() => result.current.selectFurniture(item.id));
      expect(result.current.selectedItem?.id).toBe(item.id);
    });
  });

  describe('measurementArrows', () => {
    it('is empty when no measurement mode is active', () => {
      const { result } = renderCoordinator();
      expect(result.current.measurementArrows).toHaveLength(0);
    });

    it('produces arrows when showNeighbors is enabled', () => {
      const { result } = renderCoordinator();
      act(() => result.current.measurement.setShowNeighbors(true));
      expect(result.current.measurementArrows.length).toBeGreaterThan(0);
    });
  });
});
