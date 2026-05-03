import { useState, useEffect, useMemo, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { toPixels, formatDim } from '../../../utils/coordinates';
import type { UnitSystem } from '../../../utils/coordinates';
import { useFurniture } from '../hooks/useFurniture';
import { useWallFeatures } from '../hooks/useWallFeatures';
import { useLayoutPersistence } from '../hooks/useLayoutPersistence';
import RoomCanvas from './RoomCanvas';
import LayoutsPanel from './LayoutsPanel';
import { DEFAULT_ROOM } from '../data/room';
import { findNearestNeighbors, measureTwoObjects } from '../utils/measurements';
import type { MeasurementArrow } from '../utils/measurements';
import type { LayoutSnapshot } from '../services/layoutDb';
import type { RoomLayout, WallSide } from '../types/room';

const PRESETS: { label: string; w: number; h: number }[] = [
  { label: '10 × 10 ft', w: 120, h: 120 },
  { label: '10 × 12 ft', w: 120, h: 144 },
  { label: '12 × 12 ft', w: 144, h: 144 },
  { label: '12 × 14 ft', w: 144, h: 168 },
  { label: '12 × 15 ft', w: 144, h: 180 },
  { label: '14 × 14 ft', w: 168, h: 168 },
  { label: '15 × 20 ft', w: 180, h: 240 },
  { label: 'Custom',     w: 0,   h: 0   },
];

const SNAP_SIZES = [0.5, 1, 6, 12, 24] as const;

const WALL_LABELS: Record<WallSide, string> = {
  top: 'Top', right: 'Right', bottom: 'Bottom', left: 'Left',
};

function SectionPanel({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="section-panel">
      <div
        onClick={onToggle}
        className={`section-header${open ? ' open' : ''}`}
      >
        <span>{title}</span>
        <span className="section-chevron">{open ? '▾' : '›'}</span>
      </div>
      {open && <div className="section-body">{children}</div>}
    </div>
  );
}

function FieldRow({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="field-row">
      {label && <label className="field-label">{label}</label>}
      {children}
    </div>
  );
}

export default function RoomPlanner() {
  const { furniture, move, resize, add, update, remove, rotate, reset: resetFurniture } = useFurniture();
  const wallFeatures = useWallFeatures(DEFAULT_ROOM.features);

  const [layout, setLayout]           = useState<RoomLayout>({ ...DEFAULT_ROOM, features: [] });
  const [selectedId, setSelectedId]   = useState<number | null>(null);

  const [unitSystem, setUnitSystemState] = useState<UnitSystem>(
    () => (localStorage.getItem('roomPlanner.unitSystem') as UnitSystem | null) ?? 'ft-in'
  );

  function setUnitSystem(u: UnitSystem) {
    setUnitSystemState(u);
    localStorage.setItem('roomPlanner.unitSystem', u);
  }

  const [snapEnabled, setSnapEnabled] = useState(false);
  const [snapGridIn, setSnapGridIn]   = useState<typeof SNAP_SIZES[number]>(6);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [layoutsOpen,  setLayoutsOpen]  = useState(true);
  const [dimOpen,      setDimOpen]      = useState(true);
  const [gridOpen,     setGridOpen]     = useState(false);
  const [propOpen,     setPropOpen]     = useState(true);
  const [wallFeatOpen, setWallFeatOpen] = useState(false);
  const [measureOpen,  setMeasureOpen]  = useState(false);
  const [legendOpen,   setLegendOpen]   = useState(true);

  const snapshot = useMemo<LayoutSnapshot>(() => ({
    widthIn: layout.widthIn,
    heightIn: layout.heightIn,
    features: wallFeatures.features,
    furniture,
  }), [layout.widthIn, layout.heightIn, wallFeatures.features, furniture]);

  const restore = useCallback((s: LayoutSnapshot) => {
    setLayout(prev => ({ ...prev, widthIn: s.widthIn, heightIn: s.heightIn }));
    wallFeatures.reset(s.features);
    resetFurniture(s.furniture);
    setSelectedId(null);
  }, [wallFeatures, resetFurniture]);

  const persistence = useLayoutPersistence(snapshot, restore);

  const [showNeighbors, setShowNeighbors] = useState(false);
  const [showPair,      setShowPair]      = useState(false);
  const [pairIds,       setPairIds]       = useState<[number | null, number | null]>([null, null]);

  const [newFeatType,     setNewFeatType]     = useState<'window' | 'door-swing' | 'wall-segment'>('window');
  const [newFeatWall,     setNewFeatWall]     = useState<WallSide>('bottom');
  const [newFeatOffset,   setNewFeatOffset]   = useState(12);
  const [newFeatLength,   setNewFeatLength]   = useState(36);
  const [newFeatHinge,    setNewFeatHinge]    = useState<'left' | 'right'>('left');
  const [newFeatSwingDir, setNewFeatSwingDir] = useState<'in' | 'out'>('in');

  const selectedItem    = furniture.find(f => f.id === selectedId) ?? null;
  const selectedFeature = wallFeatures.features.find(f => f.id === wallFeatures.selectedFeatureId) ?? null;
  const snapPx        = toPixels(snapGridIn);
  const widthFt       = Math.floor(layout.widthIn  / 12);
  const widthInchPart = layout.widthIn  - widthFt  * 12;
  const heightFt      = Math.floor(layout.heightIn / 12);
  const heightInchPart = layout.heightIn - heightFt * 12;

  const measurementArrows = useMemo<MeasurementArrow[]>(() => {
    const arrows: MeasurementArrow[] = [];
    if (showNeighbors) {
      arrows.push(...findNearestNeighbors(furniture, layout));
    }
    if (showPair && pairIds[0] !== null && pairIds[1] !== null) {
      const a = furniture.find(f => f.id === pairIds[0]);
      const b = furniture.find(f => f.id === pairIds[1]);
      if (a && b) arrows.push(measureTwoObjects(a, b));
    }
    return arrows.map(a => ({
      ...a,
      label: a.isOverlap ? 'overlap' : formatDim(a.gapIn, unitSystem),
    }));
  }, [showNeighbors, showPair, pairIds, furniture, layout, unitSystem]);

  function selectFurniture(id: number) {
    if (showPair) {
      setPairIds(prev => {
        if (prev[0] === null) return [id, null];
        return [prev[0], id];
      });
      return;
    }
    setSelectedId(id);
    wallFeatures.select(null);
  }

  function selectFeature(id: number) {
    wallFeatures.select(id);
    setSelectedId(null);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      if (e.key === 'r' || e.key === 'R') {
        if (selectedId !== null) rotate(selectedId);
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId !== null) {
          remove(selectedId);
          setSelectedId(null);
        } else if (wallFeatures.selectedFeatureId !== null) {
          wallFeatures.remove(wallFeatures.selectedFeatureId);
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, wallFeatures, rotate, remove]);

  function applyPreset(idx: number) {
    const p = PRESETS[idx];
    if (p.w > 0) setLayout(prev => ({ ...prev, widthIn: p.w, heightIn: p.h }));
  }

  function setWidthDims(ft: number, inch: number) {
    if (inch >= 12) { ft += Math.floor(inch / 12); inch = inch % 12; }
    if (inch < 0)   { const b = Math.ceil(-inch / 12); ft -= b; inch += b * 12; }
    const total = ft * 12 + inch;
    if (total >= 48 && total <= 720) setLayout(prev => ({ ...prev, widthIn: total }));
  }

  function setHeightDims(ft: number, inch: number) {
    if (inch >= 12) { ft += Math.floor(inch / 12); inch = inch % 12; }
    if (inch < 0)   { const b = Math.ceil(-inch / 12); ft -= b; inch += b * 12; }
    const total = ft * 12 + inch;
    if (total >= 48 && total <= 720) setLayout(prev => ({ ...prev, heightIn: total }));
  }

  function addWallFeature() {
    if (newFeatType === 'window') {
      wallFeatures.add({ type: 'window', wall: newFeatWall, offsetIn: newFeatOffset, lengthIn: newFeatLength });
    } else if (newFeatType === 'wall-segment') {
      wallFeatures.add({ type: 'wall-segment', wall: newFeatWall, offsetIn: newFeatOffset, lengthIn: newFeatLength });
    } else {
      wallFeatures.add({ type: 'door-swing', wall: newFeatWall, offsetIn: newFeatOffset, swingIn: newFeatLength, hingeDirection: newFeatHinge, swingDirection: newFeatSwingDir });
    }
  }

  function featureLabel(f: typeof wallFeatures.features[number]) {
    const wall   = WALL_LABELS[f.wall];
    const offset = formatDim(f.offsetIn, unitSystem);
    if (f.type === 'window')     return `Window — ${wall} +${offset}`;
    if (f.type === 'door-swing') return `Door — ${wall} +${offset}`;
    return `Wall — ${wall} +${offset}`;
  }

  return (
    <div className="planner">

      <div
        className={`sidebar-backdrop${mobileSidebarOpen ? ' sidebar-backdrop--visible' : ''}`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      {/* ── Left sidebar ── */}
      <aside className={`sidebar${mobileSidebarOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar-drag-handle" />

        {/* Unit system toggle */}
        <div className="unit-toggle-row">
          <div className="btn-toggle-group">
            <button
              onClick={() => setUnitSystem('ft-in')}
              className={`btn-toggle${unitSystem === 'ft-in' ? ' btn-toggle--active' : ''}`}
            >
              ft + in
            </button>
            <button
              onClick={() => setUnitSystem('in')}
              className={`btn-toggle${unitSystem === 'in' ? ' btn-toggle--active' : ''}`}
            >
              in only
            </button>
          </div>
        </div>

        {/* Layouts */}
        <SectionPanel title="Layouts" open={layoutsOpen} onToggle={() => setLayoutsOpen(o => !o)}>
          <LayoutsPanel
            savedLayouts={persistence.savedLayouts}
            onSave={name => persistence.saveNamed(name)}
            onLoad={async id => {
              const s = await persistence.loadNamed(id);
              if (s) restore(s);
            }}
            onRename={(id, name) => persistence.renameSaved(id, name)}
            onDelete={id => persistence.deleteSaved(id)}
          />
        </SectionPanel>

        {/* Room */}
        <SectionPanel title="Room" open={dimOpen} onToggle={() => setDimOpen(o => !o)}>
          <FieldRow label="Preset">
            <select
              className="input"
              onChange={e => applyPreset(Number(e.target.value))}
              value={PRESETS.findIndex(p => p.w === layout.widthIn && p.h === layout.heightIn)}
            >
              {PRESETS.map((p, i) => (
                <option key={i} value={i}>{p.label}</option>
              ))}
            </select>
          </FieldRow>
          {unitSystem === 'ft-in' ? (
            <div className="dim-pair">
              <FieldRow label="Width">
                <div className="ft-in-input-group">
                  <input
                    type="number"
                    className="input input--short"
                    min={0} max={60}
                    value={widthFt}
                    onChange={e => setWidthDims(Number(e.target.value), widthInchPart)}
                  />
                  <span className="dim-unit">ft</span>
                  <input
                    type="number"
                    className="input input--short"
                    min={0} step={0.5}
                    value={widthInchPart}
                    onChange={e => setWidthDims(widthFt, Number(e.target.value))}
                  />
                  <span className="dim-unit">in</span>
                </div>
              </FieldRow>
              <FieldRow label="Depth">
                <div className="ft-in-input-group">
                  <input
                    type="number"
                    className="input input--short"
                    min={0} max={60}
                    value={heightFt}
                    onChange={e => setHeightDims(Number(e.target.value), heightInchPart)}
                  />
                  <span className="dim-unit">ft</span>
                  <input
                    type="number"
                    className="input input--short"
                    min={0} step={0.5}
                    value={heightInchPart}
                    onChange={e => setHeightDims(heightFt, Number(e.target.value))}
                  />
                  <span className="dim-unit">in</span>
                </div>
              </FieldRow>
            </div>
          ) : (
            <div className="dim-pair">
              <FieldRow label="Width (in)">
                <input
                  type="number"
                  className="input"
                  min={48} max={720} step={0.5}
                  value={layout.widthIn}
                  onChange={e => {
                    const v = Number(e.target.value);
                    if (v >= 48 && v <= 720) setLayout(prev => ({ ...prev, widthIn: v }));
                  }}
                />
              </FieldRow>
              <FieldRow label="Depth (in)">
                <input
                  type="number"
                  className="input"
                  min={48} max={720} step={0.5}
                  value={layout.heightIn}
                  onChange={e => {
                    const v = Number(e.target.value);
                    if (v >= 48 && v <= 720) setLayout(prev => ({ ...prev, heightIn: v }));
                  }}
                />
              </FieldRow>
            </div>
          )}
        </SectionPanel>

        {/* Grid & Snap */}
        <SectionPanel title="Grid" open={gridOpen} onToggle={() => setGridOpen(o => !o)}>
          <FieldRow>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={snapEnabled}
                onChange={e => setSnapEnabled(e.target.checked)}
              />
              Snap to grid
            </label>
          </FieldRow>
          {snapEnabled && (
            <FieldRow label="Grid size">
              <div className="btn-toggle-group">
                {SNAP_SIZES.map(s => (
                  <button
                    key={s}
                    onClick={() => setSnapGridIn(s)}
                    className={`btn-toggle${snapGridIn === s ? ' btn-toggle--active' : ''}`}
                  >
                    {s}"
                  </button>
                ))}
              </div>
            </FieldRow>
          )}
        </SectionPanel>

        {/* Furniture */}
        <SectionPanel title="Furniture" open={propOpen} onToggle={() => setPropOpen(o => !o)}>
          <button className="btn-primary" onClick={() => add()}>
            + Add Furniture
          </button>

          {selectedItem ? (
            <div>
              <div className="selected-label">Selected item</div>
              <FieldRow label="Name">
                <input
                  type="text"
                  className="input"
                  value={selectedItem.name}
                  onChange={e => update(selectedItem.id, { name: e.target.value })}
                />
              </FieldRow>
              <div className="dim-pair">
                <FieldRow label="Width (in)">
                  <input
                    type="number"
                    className="input"
                    min={6} max={layout.widthIn} step={0.5}
                    value={selectedItem.w}
                    onChange={e => update(selectedItem.id, { w: Number(e.target.value) })}
                  />
                </FieldRow>
                <FieldRow label="Depth (in)">
                  <input
                    type="number"
                    className="input"
                    min={6} max={layout.heightIn} step={0.5}
                    value={selectedItem.h}
                    onChange={e => update(selectedItem.id, { h: Number(e.target.value) })}
                  />
                </FieldRow>
              </div>
              <FieldRow label="Color">
                <input
                  type="color"
                  className="input"
                  value={selectedItem.color}
                  onChange={e => update(selectedItem.id, { color: e.target.value })}
                />
              </FieldRow>
              <FieldRow label="Rotation">
                <div className="rotation-display">
                  {selectedItem.rotation}°
                  <span className="rotation-hint">(R to rotate)</span>
                </div>
              </FieldRow>
              <button
                className="btn-destructive"
                onClick={() => { remove(selectedItem.id); setSelectedId(null); }}
              >
                Delete
              </button>
            </div>
          ) : (
            <div className="empty-state">Click furniture to select</div>
          )}
        </SectionPanel>

        {/* Wall Features */}
        <SectionPanel title="Walls" open={wallFeatOpen} onToggle={() => setWallFeatOpen(o => !o)}>
          <FieldRow label="Type">
            <select
              className="input"
              value={newFeatType}
              onChange={e => setNewFeatType(e.target.value as 'window' | 'door-swing' | 'wall-segment')}
            >
              <option value="window">Window</option>
              <option value="door-swing">Door</option>
              <option value="wall-segment">Wall segment</option>
            </select>
          </FieldRow>
          <FieldRow label="Wall">
            <select
              className="input"
              value={newFeatWall}
              onChange={e => setNewFeatWall(e.target.value as WallSide)}
            >
              {(['top', 'right', 'bottom', 'left'] as WallSide[]).map(w => (
                <option key={w} value={w}>{WALL_LABELS[w]}</option>
              ))}
            </select>
          </FieldRow>
          <FieldRow label="Offset from corner (in)">
            <input
              type="number"
              className="input"
              min={0} step={0.5}
              value={newFeatOffset}
              onChange={e => setNewFeatOffset(Number(e.target.value))}
            />
          </FieldRow>
          <FieldRow label={newFeatType === 'door-swing' ? 'Swing radius (in)' : 'Width (in)'}>
            <input
              type="number"
              className="input"
              min={6} step={0.5}
              value={newFeatLength}
              onChange={e => setNewFeatLength(Number(e.target.value))}
            />
          </FieldRow>
          {newFeatType === 'door-swing' && (
            <>
              <FieldRow label="Hinge side">
                <div className="btn-toggle-group">
                  {(['left', 'right'] as const).map(side => (
                    <button
                      key={side}
                      onClick={() => setNewFeatHinge(side)}
                      className={`btn-toggle${newFeatHinge === side ? ' btn-toggle--active' : ''}`}
                    >
                      {side.charAt(0).toUpperCase() + side.slice(1)}
                    </button>
                  ))}
                </div>
              </FieldRow>
              <FieldRow label="Swing direction">
                <div className="btn-toggle-group">
                  {(['in', 'out'] as const).map(dir => (
                    <button
                      key={dir}
                      onClick={() => setNewFeatSwingDir(dir)}
                      className={`btn-toggle${newFeatSwingDir === dir ? ' btn-toggle--active' : ''}`}
                    >
                      {dir === 'in' ? 'Into room' : 'Out of room'}
                    </button>
                  ))}
                </div>
              </FieldRow>
            </>
          )}
          <button className="btn-primary" onClick={addWallFeature}>
            + Add Feature
          </button>

          {wallFeatures.features.length > 0 && (
            <div>
              <div className="feature-list-label">Placed features</div>
              {wallFeatures.features.map(f => (
                <div
                  key={f.id}
                  onClick={() => selectFeature(f.id)}
                  className={`feature-item${f.id === wallFeatures.selectedFeatureId ? ' feature-item--selected' : ''}`}
                >
                  <span>{featureLabel(f)}</span>
                  <button
                    className="feature-remove"
                    onClick={e => { e.stopPropagation(); wallFeatures.remove(f.id); }}
                    aria-label="Remove feature"
                  >
                    ×
                  </button>
                </div>
              ))}

              {selectedFeature && (
                <div className="feature-editor">
                  <span className="feature-editor-label">
                    {selectedFeature.type === 'window' ? 'Window' : selectedFeature.type === 'wall-segment' ? 'Wall segment' : 'Door'}
                  </span>
                  <FieldRow label="Offset from corner (in)">
                    <input
                      type="number"
                      className="input"
                      min={0} step={0.5}
                      value={selectedFeature.offsetIn}
                      onChange={e => wallFeatures.update(selectedFeature.id, { offsetIn: Number(e.target.value) })}
                    />
                  </FieldRow>
                  {(selectedFeature.type === 'window' || selectedFeature.type === 'wall-segment') && (
                    <FieldRow label="Width (in)">
                      <input
                        type="number"
                        className="input"
                        min={6} step={0.5}
                        value={selectedFeature.lengthIn}
                        onChange={e => wallFeatures.update(selectedFeature.id, { lengthIn: Number(e.target.value) })}
                      />
                    </FieldRow>
                  )}
                  {selectedFeature.type === 'door-swing' && (
                    <>
                      <FieldRow label="Hinge side">
                        <div className="btn-toggle-group">
                          {(['left', 'right'] as const).map(side => (
                            <button
                              key={side}
                              onClick={() => wallFeatures.update(selectedFeature.id, { hingeDirection: side })}
                              className={`btn-toggle${selectedFeature.hingeDirection === side ? ' btn-toggle--active' : ''}`}
                            >
                              {side.charAt(0).toUpperCase() + side.slice(1)}
                            </button>
                          ))}
                        </div>
                      </FieldRow>
                      <FieldRow label="Swing direction">
                        <div className="btn-toggle-group">
                          {(['in', 'out'] as const).map(dir => (
                            <button
                              key={dir}
                              onClick={() => wallFeatures.update(selectedFeature.id, { swingDirection: dir })}
                              className={`btn-toggle${selectedFeature.swingDirection === dir ? ' btn-toggle--active' : ''}`}
                            >
                              {dir === 'in' ? 'Into room' : 'Out of room'}
                            </button>
                          ))}
                        </div>
                      </FieldRow>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </SectionPanel>

        {/* Measurements */}
        <SectionPanel title="Measurements" open={measureOpen} onToggle={() => setMeasureOpen(o => !o)}>
          <FieldRow label="Mode">
            <div className="btn-toggle-group">
              <button
                className={`btn-toggle${showNeighbors ? ' btn-toggle--active' : ''}`}
                onClick={() => setShowNeighbors(o => !o)}
              >
                All gaps
              </button>
              <button
                className={`btn-toggle${showPair ? ' btn-toggle--active' : ''}`}
                onClick={() => {
                  setShowPair(o => !o);
                  setPairIds([null, null]);
                }}
              >
                Pair
              </button>
            </div>
          </FieldRow>
          {showPair && (
            <div className="empty-state">
              {pairIds[0] === null
                ? 'Click first object'
                : pairIds[1] === null
                ? 'Click second object'
                : 'Click any object to re-measure'}
            </div>
          )}
        </SectionPanel>

        {/* Controls legend */}
        <SectionPanel title="Controls" open={legendOpen} onToggle={() => setLegendOpen(o => !o)}>
          <table className="controls-table">
            <tbody>
              {[
                ['Click',          'Select item'],
                ['Drag',           'Move furniture or wall feature'],
                ['Resize handles', 'Resize furniture or wall feature'],
                ['R',              'Rotate selected furniture'],
                ['Delete / ⌫',    'Remove selected item'],
              ].map(([key, desc]) => (
                <tr key={key}>
                  <td className="controls-key">{key}</td>
                  <td className="controls-desc">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionPanel>

      </aside>

      {/* ── Canvas area ── */}
      <main className="canvas-area">
        <p className="canvas-meta">
          {formatDim(layout.widthIn, unitSystem)} × {formatDim(layout.heightIn, unitSystem)} · Scale: 1" = 4 px
          {snapEnabled && (
            <span className="canvas-snap-badge">⊞ {snapGridIn}" snap</span>
          )}
        </p>

        <RoomCanvas
          layout={layout}
          features={wallFeatures.features}
          selectedFeatureId={wallFeatures.selectedFeatureId}
          onFeatureClick={selectFeature}
          onFeatureUpdate={wallFeatures.update}
          snapGridIn={snapEnabled ? snapGridIn : undefined}
          measurementArrows={measurementArrows}
        >
          {furniture.map(f => {
            const isOdd      = f.rotation === 90 || f.rotation === 270;
            const isSnappable = snapEnabled && f.rotation % 90 === 0;
            const rndW = toPixels(isOdd ? f.h : f.w);
            const rndH = toPixels(isOdd ? f.w : f.h);
            const isSelected = selectedId === f.id;
            return (
              <Rnd
                key={f.id}
                bounds="parent"
                position={{ x: toPixels(f.x), y: toPixels(f.y) }}
                size={{ width: rndW, height: rndH }}
                dragGrid={isSnappable ? [snapPx, snapPx] : undefined}
                resizeGrid={isSnappable ? [snapPx, snapPx] : undefined}
                onMouseDown={() => selectFurniture(f.id)}
                onDragStop={(_, d) => move(f.id, d.x, d.y)}
                onResizeStop={(_, _dir, ref, _delta, pos) =>
                  resize(f.id, ref.style.width, ref.style.height, pos.x, pos.y)
                }
                style={{
                  border: isSelected
                    ? '2px solid var(--accent)'
                    : '1px solid var(--border-strong)',
                  cursor: 'grab',
                  overflow: 'visible',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    width: toPixels(f.w),
                    height: toPixels(f.h),
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%)${f.rotation !== 0 ? ` rotate(${f.rotation}deg)` : ''}`,
                    background: f.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: 'var(--font)',
                    color: 'var(--text-primary)',
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    {f.name}<br />{formatDim(f.w, unitSystem)} × {formatDim(f.h, unitSystem)}
                  </div>
                </div>
              </Rnd>
            );
          })}
        </RoomCanvas>
      </main>

      <button
        className="sidebar-fab"
        onClick={() => setMobileSidebarOpen(o => !o)}
        aria-label={mobileSidebarOpen ? 'Close controls' : 'Open controls'}
      >
        {mobileSidebarOpen ? '✕' : '☰'}
      </button>

    </div>
  );
}
