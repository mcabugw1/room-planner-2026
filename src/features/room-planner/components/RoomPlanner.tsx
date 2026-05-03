import { useEffect, useMemo, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { toPixels, formatDim } from '../../../utils/coordinates';
import { useFurniture } from '../hooks/useFurniture';
import { useWallFeatures } from '../hooks/useWallFeatures';
import { useLayoutPersistence } from '../hooks/useLayoutPersistence';
import { useRoomSession, PRESETS, SNAP_SIZES } from '../hooks/useRoomSession';
import { useRoomUI } from '../hooks/useRoomUI';
import RoomCanvas from './RoomCanvas';
import LayoutsPanel from './LayoutsPanel';
import { DEFAULT_ROOM } from '../data/room';
import { findNearestNeighbors, measureTwoObjects } from '../utils/measurements';
import type { MeasurementArrow } from '../utils/measurements';
import type { LayoutSnapshot } from '../services/layoutDb';
import type { WallSide } from '../types/room';

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
  const session = useRoomSession({ ...DEFAULT_ROOM, features: [] });
  const ui = useRoomUI();

  const snapshot = useMemo<LayoutSnapshot>(() => ({
    widthIn: session.layout.widthIn,
    heightIn: session.layout.heightIn,
    features: wallFeatures.features,
    furniture,
  }), [session.layout.widthIn, session.layout.heightIn, wallFeatures.features, furniture]);

  const restore = useCallback((s: LayoutSnapshot) => {
    session.applySnapshot(s.widthIn, s.heightIn);
    wallFeatures.reset(s.features);
    resetFurniture(s.furniture);
  }, [session, wallFeatures, resetFurniture]);

  const persistence = useLayoutPersistence(snapshot, restore);

  const selectedItem    = furniture.find(f => f.id === session.selectedId) ?? null;
  const selectedFeature = wallFeatures.features.find(f => f.id === wallFeatures.selectedFeatureId) ?? null;

  const measurementArrows = useMemo<MeasurementArrow[]>(() => {
    const arrows: MeasurementArrow[] = [];
    if (session.showNeighbors) {
      arrows.push(...findNearestNeighbors(furniture, session.layout));
    }
    if (session.showPair && session.pairIds[0] !== null && session.pairIds[1] !== null) {
      const a = furniture.find(f => f.id === session.pairIds[0]);
      const b = furniture.find(f => f.id === session.pairIds[1]);
      if (a && b) arrows.push(measureTwoObjects(a, b));
    }
    return arrows.map(a => ({
      ...a,
      label: a.isOverlap ? 'overlap' : formatDim(a.gapIn, session.unitSystem),
    }));
  }, [session.showNeighbors, session.showPair, session.pairIds, furniture, session.layout, session.unitSystem]);

  function selectFurniture(id: number) {
    if (session.showPair) {
      session.setPairIds(prev => prev[0] === null ? [id, null] : [prev[0], id]);
      return;
    }
    session.setSelectedId(id);
    wallFeatures.select(null);
  }

  function selectFeature(id: number) {
    wallFeatures.select(id);
    session.setSelectedId(null);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.key === 'r' || e.key === 'R') {
        if (session.selectedId !== null) rotate(session.selectedId);
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (session.selectedId !== null) {
          remove(session.selectedId);
          session.setSelectedId(null);
        } else if (wallFeatures.selectedFeatureId !== null) {
          wallFeatures.remove(wallFeatures.selectedFeatureId);
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [session.selectedId, session, wallFeatures, rotate, remove]);

  function featureLabel(f: typeof wallFeatures.features[number]) {
    const wall   = WALL_LABELS[f.wall];
    const offset = formatDim(f.offsetIn, session.unitSystem);
    if (f.type === 'window')     return `Window — ${wall} +${offset}`;
    if (f.type === 'door-swing') return `Door — ${wall} +${offset}`;
    return `Wall — ${wall} +${offset}`;
  }

  return (
    <div className="planner">

      <div
        className={`sidebar-backdrop${ui.mobileSidebarOpen ? ' sidebar-backdrop--visible' : ''}`}
        onClick={() => ui.setMobileSidebarOpen(false)}
      />

      {/* ── Left sidebar ── */}
      <aside className={`sidebar${ui.mobileSidebarOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar-drag-handle" />

        {/* Unit system toggle */}
        <div className="unit-toggle-row">
          <div className="btn-toggle-group">
            <button
              onClick={() => session.setUnitSystem('ft-in')}
              className={`btn-toggle${session.unitSystem === 'ft-in' ? ' btn-toggle--active' : ''}`}
            >
              ft + in
            </button>
            <button
              onClick={() => session.setUnitSystem('in')}
              className={`btn-toggle${session.unitSystem === 'in' ? ' btn-toggle--active' : ''}`}
            >
              in only
            </button>
          </div>
        </div>

        {/* Layouts */}
        <SectionPanel title="Layouts" open={ui.layoutsOpen} onToggle={ui.toggleLayouts}>
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
        <SectionPanel title="Room" open={ui.dimOpen} onToggle={ui.toggleDim}>
          <FieldRow label="Preset">
            <select
              className="input"
              onChange={e => session.applyPreset(Number(e.target.value))}
              value={PRESETS.findIndex(p => p.w === session.layout.widthIn && p.h === session.layout.heightIn)}
            >
              {PRESETS.map((p, i) => (
                <option key={i} value={i}>{p.label}</option>
              ))}
            </select>
          </FieldRow>
          {session.unitSystem === 'ft-in' ? (
            <div className="dim-pair">
              <FieldRow label="Width">
                <div className="ft-in-input-group">
                  <input
                    type="number"
                    className="input input--short"
                    min={0} max={60}
                    value={session.widthFt}
                    onChange={e => session.setWidthDims(Number(e.target.value), session.widthInchPart)}
                  />
                  <span className="dim-unit">ft</span>
                  <input
                    type="number"
                    className="input input--short"
                    min={0} step={0.5}
                    value={session.widthInchPart}
                    onChange={e => session.setWidthDims(session.widthFt, Number(e.target.value))}
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
                    value={session.heightFt}
                    onChange={e => session.setHeightDims(Number(e.target.value), session.heightInchPart)}
                  />
                  <span className="dim-unit">ft</span>
                  <input
                    type="number"
                    className="input input--short"
                    min={0} step={0.5}
                    value={session.heightInchPart}
                    onChange={e => session.setHeightDims(session.heightFt, Number(e.target.value))}
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
                  value={session.layout.widthIn}
                  onChange={e => {
                    const v = Number(e.target.value);
                    if (v >= 48 && v <= 720) session.setWidthDims(Math.floor(v / 12), v % 12);
                  }}
                />
              </FieldRow>
              <FieldRow label="Depth (in)">
                <input
                  type="number"
                  className="input"
                  min={48} max={720} step={0.5}
                  value={session.layout.heightIn}
                  onChange={e => {
                    const v = Number(e.target.value);
                    if (v >= 48 && v <= 720) session.setHeightDims(Math.floor(v / 12), v % 12);
                  }}
                />
              </FieldRow>
            </div>
          )}
        </SectionPanel>

        {/* Grid & Snap */}
        <SectionPanel title="Grid" open={ui.gridOpen} onToggle={ui.toggleGrid}>
          <FieldRow>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={session.snapEnabled}
                onChange={e => session.setSnapEnabled(e.target.checked)}
              />
              Snap to grid
            </label>
          </FieldRow>
          {session.snapEnabled && (
            <FieldRow label="Grid size">
              <div className="btn-toggle-group">
                {SNAP_SIZES.map(s => (
                  <button
                    key={s}
                    onClick={() => session.setSnapGridIn(s)}
                    className={`btn-toggle${session.snapGridIn === s ? ' btn-toggle--active' : ''}`}
                  >
                    {s}"
                  </button>
                ))}
              </div>
            </FieldRow>
          )}
        </SectionPanel>

        {/* Furniture */}
        <SectionPanel title="Furniture" open={ui.propOpen} onToggle={ui.toggleProp}>
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
                    min={6} max={session.layout.widthIn} step={0.5}
                    value={selectedItem.w}
                    onChange={e => update(selectedItem.id, { w: Number(e.target.value) })}
                  />
                </FieldRow>
                <FieldRow label="Depth (in)">
                  <input
                    type="number"
                    className="input"
                    min={6} max={session.layout.heightIn} step={0.5}
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
                onClick={() => { remove(selectedItem.id); session.setSelectedId(null); }}
              >
                Delete
              </button>
            </div>
          ) : (
            <div className="empty-state">Click furniture to select</div>
          )}
        </SectionPanel>

        {/* Wall Features */}
        <SectionPanel title="Walls" open={ui.wallFeatOpen} onToggle={ui.toggleWallFeat}>
          <FieldRow label="Type">
            <select
              className="input"
              value={ui.newFeatType}
              onChange={e => ui.setNewFeatType(e.target.value as 'window' | 'door-swing' | 'wall-segment')}
            >
              <option value="window">Window</option>
              <option value="door-swing">Door</option>
              <option value="wall-segment">Wall segment</option>
            </select>
          </FieldRow>
          <FieldRow label="Wall">
            <select
              className="input"
              value={ui.newFeatWall}
              onChange={e => ui.setNewFeatWall(e.target.value as WallSide)}
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
              value={ui.newFeatOffset}
              onChange={e => ui.setNewFeatOffset(Number(e.target.value))}
            />
          </FieldRow>
          <FieldRow label={ui.newFeatType === 'door-swing' ? 'Swing radius (in)' : 'Width (in)'}>
            <input
              type="number"
              className="input"
              min={6} step={0.5}
              value={ui.newFeatLength}
              onChange={e => ui.setNewFeatLength(Number(e.target.value))}
            />
          </FieldRow>
          {ui.newFeatType === 'door-swing' && (
            <>
              <FieldRow label="Hinge side">
                <div className="btn-toggle-group">
                  {(['left', 'right'] as const).map(side => (
                    <button
                      key={side}
                      onClick={() => ui.setNewFeatHinge(side)}
                      className={`btn-toggle${ui.newFeatHinge === side ? ' btn-toggle--active' : ''}`}
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
                      onClick={() => ui.setNewFeatSwingDir(dir)}
                      className={`btn-toggle${ui.newFeatSwingDir === dir ? ' btn-toggle--active' : ''}`}
                    >
                      {dir === 'in' ? 'Into room' : 'Out of room'}
                    </button>
                  ))}
                </div>
              </FieldRow>
            </>
          )}
          <button className="btn-primary" onClick={() => wallFeatures.add(ui.buildFeature())}>
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
        <SectionPanel title="Measurements" open={ui.measureOpen} onToggle={ui.toggleMeasure}>
          <FieldRow label="Mode">
            <div className="btn-toggle-group">
              <button
                className={`btn-toggle${session.showNeighbors ? ' btn-toggle--active' : ''}`}
                onClick={() => session.setShowNeighbors(o => !o)}
              >
                All gaps
              </button>
              <button
                className={`btn-toggle${session.showPair ? ' btn-toggle--active' : ''}`}
                onClick={() => {
                  session.setShowPair(o => !o);
                  session.setPairIds([null, null]);
                }}
              >
                Pair
              </button>
            </div>
          </FieldRow>
          {session.showPair && (
            <div className="empty-state">
              {session.pairIds[0] === null
                ? 'Click first object'
                : session.pairIds[1] === null
                ? 'Click second object'
                : 'Click any object to re-measure'}
            </div>
          )}
        </SectionPanel>

        {/* Controls legend */}
        <SectionPanel title="Controls" open={ui.legendOpen} onToggle={ui.toggleLegend}>
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
          {formatDim(session.layout.widthIn, session.unitSystem)} × {formatDim(session.layout.heightIn, session.unitSystem)} · Scale: 1" = 4 px
          {session.snapEnabled && (
            <span className="canvas-snap-badge">⊞ {session.snapGridIn}" snap</span>
          )}
        </p>

        <RoomCanvas
          layout={session.layout}
          features={wallFeatures.features}
          selectedFeatureId={wallFeatures.selectedFeatureId}
          onFeatureClick={selectFeature}
          onFeatureUpdate={wallFeatures.update}
          snapGridIn={session.snapEnabled ? session.snapGridIn : undefined}
          measurementArrows={measurementArrows}
        >
          {furniture.map(f => {
            const isOdd       = f.rotation === 90 || f.rotation === 270;
            const isSnappable = session.snapEnabled && f.rotation % 90 === 0;
            const rndW = toPixels(isOdd ? f.h : f.w);
            const rndH = toPixels(isOdd ? f.w : f.h);
            const isSelected = session.selectedId === f.id;
            return (
              <Rnd
                key={f.id}
                bounds="parent"
                position={{ x: toPixels(f.x), y: toPixels(f.y) }}
                size={{ width: rndW, height: rndH }}
                dragGrid={isSnappable ? [session.snapPx, session.snapPx] : undefined}
                resizeGrid={isSnappable ? [session.snapPx, session.snapPx] : undefined}
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
                    {f.name}<br />{formatDim(f.w, session.unitSystem)} × {formatDim(f.h, session.unitSystem)}
                  </div>
                </div>
              </Rnd>
            );
          })}
        </RoomCanvas>
      </main>

      <button
        className="sidebar-fab"
        onClick={() => ui.setMobileSidebarOpen(o => !o)}
        aria-label={ui.mobileSidebarOpen ? 'Close controls' : 'Open controls'}
      >
        {ui.mobileSidebarOpen ? '✕' : '☰'}
      </button>

    </div>
  );
}
