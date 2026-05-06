import { Rnd } from 'react-rnd';
import { toPixels, formatDim } from '../../../utils/coordinates';
import { useRoomState } from '../hooks/useRoomState';
import { PRESETS, SNAP_SIZES } from '../hooks/useRoomSession';
import RoomCanvas from './RoomCanvas';
import LayoutsPanel from './LayoutsPanel';
import type { WallSide, DoorSwingFeature } from '../types/room';

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
  const room = useRoomState();
  const { session, ui, measurement, persistence, drag, derived, selectFurniture, selectFeature, restore } = room;
  const f = room.furniture;
  const wf = room.wallFeatures;

  function featureLabel(feat: typeof wf.features[number]) {
    const wall   = WALL_LABELS[feat.wall];
    const offset = formatDim(feat.offsetIn, session.unitSystem);
    if (feat.type === 'window')     return `Window — ${wall} +${offset}`;
    if (feat.type === 'door-swing') return `Door — ${wall} +${offset}`;
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
          <button className="btn-primary" onClick={() => f.add()}>
            + Add Furniture
          </button>

          {derived.selectedItem ? (
            <div>
              <div className="selected-label">Selected item</div>
              <FieldRow label="Name">
                <input
                  type="text"
                  className="input"
                  value={derived.selectedItem.name}
                  onChange={e => f.update(derived.selectedItem!.id, { name: e.target.value })}
                />
              </FieldRow>
              <div className="dim-pair">
                <FieldRow label="Width (in)">
                  <input
                    type="number"
                    className="input"
                    min={6} max={session.layout.widthIn} step={0.5}
                    value={derived.selectedItem.w}
                    onChange={e => f.update(derived.selectedItem!.id, { w: Number(e.target.value) })}
                  />
                </FieldRow>
                <FieldRow label="Depth (in)">
                  <input
                    type="number"
                    className="input"
                    min={6} max={session.layout.heightIn} step={0.5}
                    value={derived.selectedItem.h}
                    onChange={e => f.update(derived.selectedItem!.id, { h: Number(e.target.value) })}
                  />
                </FieldRow>
              </div>
              <FieldRow label="Color">
                <input
                  type="color"
                  className="input"
                  value={derived.selectedItem.color}
                  onChange={e => f.update(derived.selectedItem!.id, { color: e.target.value })}
                />
              </FieldRow>
              <FieldRow label="Rotation">
                <div className="rotation-display">
                  {derived.selectedItem.rotation}°
                  <span className="rotation-hint">(R to rotate)</span>
                </div>
              </FieldRow>
              <button
                className="btn-destructive"
                onClick={() => { f.remove(derived.selectedItem!.id); session.setSelectedId(null); }}
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
          <button className="btn-primary" onClick={() => wf.add(ui.buildFeature())}>
            + Add Feature
          </button>

          {wf.features.length > 0 && (
            <div>
              <div className="feature-list-label">Placed features</div>
              {wf.features.map(feat => (
                <div
                  key={feat.id}
                  onClick={() => selectFeature(feat.id)}
                  className={`feature-item${feat.id === wf.selectedFeatureId ? ' feature-item--selected' : ''}`}
                >
                  <span>{featureLabel(feat)}</span>
                  <button
                    className="feature-remove"
                    onClick={e => { e.stopPropagation(); wf.remove(feat.id); }}
                    aria-label="Remove feature"
                  >
                    ×
                  </button>
                </div>
              ))}

              {derived.selectedFeature && (
                <div className="feature-editor">
                  <span className="feature-editor-label">
                    {derived.selectedFeature.type === 'window' ? 'Window' : derived.selectedFeature.type === 'wall-segment' ? 'Wall segment' : 'Door'}
                  </span>
                  <FieldRow label="Offset from corner (in)">
                    <input
                      type="number"
                      className="input"
                      min={0} step={0.5}
                      value={derived.selectedFeature.offsetIn}
                      onChange={e => wf.update(derived.selectedFeature!.id, { offsetIn: Number(e.target.value) })}
                    />
                  </FieldRow>
                  {(derived.selectedFeature.type === 'window' || derived.selectedFeature.type === 'wall-segment') && (
                    <FieldRow label="Width (in)">
                      <input
                        type="number"
                        className="input"
                        min={6} step={0.5}
                        value={derived.selectedFeature.lengthIn}
                        onChange={e => wf.update(derived.selectedFeature!.id, { lengthIn: Number(e.target.value) })}
                      />
                    </FieldRow>
                  )}
                  {derived.selectedFeature.type === 'door-swing' && (() => {
                    const door = derived.selectedFeature as DoorSwingFeature;
                    return (
                      <>
                        <FieldRow label="Hinge side">
                          <div className="btn-toggle-group">
                            {(['left', 'right'] as const).map(side => (
                              <button
                                key={side}
                                onClick={() => wf.update(door.id, { hingeDirection: side })}
                                className={`btn-toggle${door.hingeDirection === side ? ' btn-toggle--active' : ''}`}
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
                                onClick={() => wf.update(door.id, { swingDirection: dir })}
                                className={`btn-toggle${door.swingDirection === dir ? ' btn-toggle--active' : ''}`}
                              >
                                {dir === 'in' ? 'Into room' : 'Out of room'}
                              </button>
                            ))}
                          </div>
                        </FieldRow>
                      </>
                    );
                  })()}
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
                className={`btn-toggle${measurement.showNeighbors ? ' btn-toggle--active' : ''}`}
                onClick={() => measurement.setShowNeighbors(o => !o)}
              >
                All gaps
              </button>
              <button
                className={`btn-toggle${measurement.showPair ? ' btn-toggle--active' : ''}`}
                onClick={measurement.togglePair}
              >
                Pair
              </button>
            </div>
          </FieldRow>
          {measurement.showPair && (
            <div className="empty-state">
              {measurement.pairIds[0] === null
                ? 'Click first object'
                : measurement.pairIds[1] === null
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
          features={wf.features}
          selectedFeatureId={wf.selectedFeatureId}
          onFeatureClick={selectFeature}
          liveState={drag.liveState}
          onFeatureMouseDown={drag.startDrag}
          snapGridIn={session.snapEnabled ? session.snapGridIn : undefined}
          measurementArrows={derived.measurementArrows}
        >
          {f.furniture.map(item => {
            const isOdd       = item.rotation === 90 || item.rotation === 270;
            const isSnappable = session.snapEnabled && item.rotation % 90 === 0;
            const rndW = toPixels(isOdd ? item.h : item.w);
            const rndH = toPixels(isOdd ? item.w : item.h);
            const isSelected = session.selectedId === item.id;
            return (
              <Rnd
                key={item.id}
                bounds="parent"
                position={{ x: toPixels(item.x), y: toPixels(item.y) }}
                size={{ width: rndW, height: rndH }}
                dragGrid={isSnappable ? [session.snapPx, session.snapPx] : undefined}
                resizeGrid={isSnappable ? [session.snapPx, session.snapPx] : undefined}
                onMouseDown={() => selectFurniture(item.id)}
                onDragStop={(_, d) => f.move(item.id, d.x, d.y)}
                onResizeStop={(_, _dir, ref, _delta, pos) =>
                  f.resize(item.id, ref.style.width, ref.style.height, pos.x, pos.y)
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
                    width: toPixels(item.w),
                    height: toPixels(item.h),
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%)${item.rotation !== 0 ? ` rotate(${item.rotation}deg)` : ''}`,
                    background: item.color,
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
                    {item.name}<br />{formatDim(item.w, session.unitSystem)} × {formatDim(item.h, session.unitSystem)}
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
