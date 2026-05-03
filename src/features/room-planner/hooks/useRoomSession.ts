import { useState } from 'react';
import { toPixels } from '../../../utils/coordinates';
import type { UnitSystem } from '../../../utils/coordinates';
import type { RoomLayout } from '../types/room';

export const PRESETS: { label: string; w: number; h: number }[] = [
  { label: '10 × 10 ft', w: 120, h: 120 },
  { label: '10 × 12 ft', w: 120, h: 144 },
  { label: '12 × 12 ft', w: 144, h: 144 },
  { label: '12 × 14 ft', w: 144, h: 168 },
  { label: '12 × 15 ft', w: 144, h: 180 },
  { label: '14 × 14 ft', w: 168, h: 168 },
  { label: '15 × 20 ft', w: 180, h: 240 },
  { label: 'Custom',     w: 0,   h: 0   },
];

export const SNAP_SIZES = [0.5, 1, 6, 12, 24] as const;
export type SnapSize = typeof SNAP_SIZES[number];

const DIM_MIN = 48;
const DIM_MAX = 720;

function parseDims(ft: number, inch: number): number | null {
  if (inch >= 12) { const carry = Math.floor(inch / 12); ft += carry; inch -= carry * 12; }
  if (inch < 0)   { const borrow = Math.ceil(-inch / 12); ft -= borrow; inch += borrow * 12; }
  const total = ft * 12 + inch;
  return total >= DIM_MIN && total <= DIM_MAX ? total : null;
}

export function useRoomSession(initialLayout: RoomLayout) {
  const [layout, setLayout] = useState<RoomLayout>(initialLayout);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [unitSystem, setUnitSystemState] = useState<UnitSystem>(
    () => (localStorage.getItem('roomPlanner.unitSystem') as UnitSystem | null) ?? 'ft-in'
  );
  function setUnitSystem(u: UnitSystem) {
    setUnitSystemState(u);
    localStorage.setItem('roomPlanner.unitSystem', u);
  }

  const [snapEnabled, setSnapEnabled] = useState(false);
  const [snapGridIn, setSnapGridIn] = useState<SnapSize>(6);

  const [showNeighbors, setShowNeighbors] = useState(false);
  const [showPair, setShowPair] = useState(false);
  const [pairIds, setPairIds] = useState<[number | null, number | null]>([null, null]);

  const snapPx = toPixels(snapGridIn);
  const widthFt = Math.floor(layout.widthIn / 12);
  const widthInchPart = layout.widthIn - widthFt * 12;
  const heightFt = Math.floor(layout.heightIn / 12);
  const heightInchPart = layout.heightIn - heightFt * 12;

  function setWidthDims(ft: number, inch: number) {
    const total = parseDims(ft, inch);
    if (total !== null) setLayout(prev => ({ ...prev, widthIn: total }));
  }

  function setHeightDims(ft: number, inch: number) {
    const total = parseDims(ft, inch);
    if (total !== null) setLayout(prev => ({ ...prev, heightIn: total }));
  }

  function applyPreset(idx: number) {
    const p = PRESETS[idx];
    if (p.w > 0) setLayout(prev => ({ ...prev, widthIn: p.w, heightIn: p.h }));
  }

  function applySnapshot(widthIn: number, heightIn: number) {
    setLayout(prev => ({ ...prev, widthIn, heightIn }));
    setSelectedId(null);
  }

  return {
    layout,
    selectedId, setSelectedId,
    unitSystem, setUnitSystem,
    snapEnabled, setSnapEnabled,
    snapGridIn, setSnapGridIn,
    snapPx,
    showNeighbors, setShowNeighbors,
    showPair, setShowPair,
    pairIds, setPairIds,
    widthFt, widthInchPart, heightFt, heightInchPart,
    setWidthDims, setHeightDims, applyPreset, applySnapshot,
  };
}
