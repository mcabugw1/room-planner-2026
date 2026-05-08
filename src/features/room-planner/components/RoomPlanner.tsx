import React, { Suspense } from 'react';
import { Rnd } from 'react-rnd';
import { toPixels } from '../../../utils/canvasCoords';
import { formatDim } from '../../../utils/displayUtils';
import { useRoomCoordinator } from '../hooks/useRoomCoordinator';
import { PRESETS, SNAP_SIZES } from '../hooks/useRoomSession';
import { useDimInput } from '../hooks/useDimInput';
import { effectiveW, effectiveH } from '../utils/furnitureGeometry';
import { DEFAULT_ROOM } from '../data/room';
import RoomCanvas from './RoomCanvas';
import LayoutsPanel from './LayoutsPanel';
const Room3DView = React.lazy(() => import('./Room3DView'));
import { FurnitureForm } from './FurnitureForm';
import { WallFeatureForm } from './WallFeatureForm';

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
  const id = `section-body-${title.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="section-panel">
      <div
        onClick={onToggle}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onToggle())}
        tabIndex={0}
        role="button"
        aria-expanded={open}
        aria-controls={id}
        className={`section-header${open ? ' open' : ''}`}
      >
        <span>{title}</span>
        <span className="section-chevron">{open ? '▾' : '›'}</span>
      </div>
      {open && <div id={id} className="section-body">{children}</div>}
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
  const {
    session, furniture, wallFeatures, measurement, persistence,
    ui, featDraft, drag, viewport,
    selectedItem, selectedFeature, measurementArrows,
    selectFeature, selectFurniture, restore,
  } = useRoomCoordinator(DEFAULT_ROOM);

  const isFloor = ui.viewMode === 'floor';

  const widthDim = useDimInput(session.widthFt, session.widthInchPart, session.setWidthDims);
  const heightDim = useDimInput(session.heightFt, session.heightInchPart, session.setHeightDims);

  return (
    <div className="planner">

      <div
        className={`sidebar-backdrop${ui.mobileSidebarOpen ? ' sidebar-backdrop--visible' : ''}`}
        onClick={() => ui.setMobileSidebarOpen(false)}
      />

      {/* ── Left sidebar (floor plan mode only) ── */}
      {isFloor && <aside className={`sidebar${ui.mobileSidebarOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar-drag-handle" />

        {/* Unit system toggle */}
        <div className="unit-toggle-row">
          <div className="btn-toggle-group" role="group" aria-label="Unit system">
            <button
              onClick={() => session.setUnitSystem('ft-in')}
              aria-label="Use feet and inches"
              aria-pressed={session.unitSystem === 'ft-in'}
              className={`btn-toggle${session.unitSystem === 'ft-in' ? ' btn-toggle--active' : ''}`}
            >
              ft + in
            </button>
            <button
              onClick={() => session.setUnitSystem('in')}
              aria-label="Use inches only"
              aria-pressed={session.unitSystem === 'in'}
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
            dbError={persistence.dbError}
            onSave={name => persistence.saveNamed(name)}
            onLoad={async id => {
              const s = await persistence.loadNamed(id);
              if (s) restore(s);
            }}
            onRename={(id, name) => persistence.renameSaved(id, name)}
            onDelete={id => persistence.deleteSaved(id)}
            onClearError={persistence.clearDbError}
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
                    inputMode="numeric"
                    className="input input--short"
                    min={0} max={60}
                    autoComplete="off"
                    {...widthDim.ftProps}
                  />
                  <span className="dim-unit">ft</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="input input--short"
                    min={0} step={0.5}
                    autoComplete="off"
                    {...widthDim.inProps}
                  />
                  <span className="dim-unit">in</span>
                </div>
              </FieldRow>
              <FieldRow label="Depth">
                <div className="ft-in-input-group">
                  <input
                    type="number"
                    inputMode="numeric"
                    className="input input--short"
                    min={0} max={60}
                    autoComplete="off"
                    {...heightDim.ftProps}
                  />
                  <span className="dim-unit">ft</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="input input--short"
                    min={0} step={0.5}
                    autoComplete="off"
                    {...heightDim.inProps}
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
                  inputMode="decimal"
                  className="input"
                  min={48} max={720} step={0.5}
                  autoComplete="off"
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
                  inputMode="decimal"
                  className="input"
                  min={48} max={720} step={0.5}
                  autoComplete="off"
                  value={session.layout.heightIn}
                  onChange={e => {
                    const v = Number(e.target.value);
                    if (v >= 48 && v <= 720) session.setHeightDims(Math.floor(v / 12), v % 12);
                  }}
                />
              </FieldRow>
            </div>
          )}
          <FieldRow label="Ceiling height (in)">
            <input
              type="number"
              inputMode="numeric"
              className="input"
              min={72} max={240} step={1}
              autoComplete="off"
              value={session.layout.ceilingHeightIn}
              onChange={e => session.setCeilingHeight(Number(e.target.value))}
            />
          </FieldRow>
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
          <button className="btn-primary" onClick={() => furniture.add()}>
            + Add Furniture
          </button>
          <FurnitureForm
            selectedItem={selectedItem}
            roomWidthIn={session.layout.widthIn}
            roomHeightIn={session.layout.heightIn}
            unitSystem={session.unitSystem}
            furnitureCount={furniture.furniture.length}
            onUpdate={furniture.update}
            onRotate={furniture.rotate}
            onRemove={id => { furniture.remove(id); session.setSelectedId(null); }}
          />
        </SectionPanel>

        {/* Wall Features */}
        <SectionPanel title="Walls" open={ui.wallFeatOpen} onToggle={ui.toggleWallFeat}>
          <WallFeatureForm
            draft={featDraft.draft}
            onDraftChange={changes => featDraft.setDraft(d => ({ ...d, ...changes }))}
            buildFeature={featDraft.buildFeature}
            features={wallFeatures.features}
            selectedFeature={selectedFeature}
            selectedFeatureId={wallFeatures.selectedFeatureId}
            unitSystem={session.unitSystem}
            onAdd={wallFeatures.add}
            onRemove={wallFeatures.remove}
            onUpdate={wallFeatures.update}
            onSelect={selectFeature}
          />
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
            <div className="empty-state" role="status" aria-live="polite">
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

      </aside>}

      {/* ── Canvas area ── */}
      <main className={`canvas-area${isFloor ? ' canvas-area--floor' : ''}`}>
        <div className={`canvas-frame${!isFloor ? ' canvas-frame--fill' : ''}`}>
          {/* View mode tabs */}
          <div className="view-mode-tabs">
            {(['floor', '3d'] as const).map(mode => (
              <button
                key={mode}
                className={`view-mode-tab${ui.viewMode === mode ? ' view-mode-tab--active' : ''}`}
                onClick={() => ui.setViewMode(mode)}
              >
                {mode === 'floor' ? 'Floor Plan' : '3D View'}
              </button>
            ))}
          </div>

          {isFloor && (
            <>
              <p className="canvas-meta">
                {formatDim(session.layout.widthIn, session.unitSystem)} × {formatDim(session.layout.heightIn, session.unitSystem)} · Scale: 1" = 4 px
                {session.snapEnabled && (
                  <span className="canvas-snap-badge">⊞ {session.snapGridIn}" snap</span>
                )}
              </p>

              <div
                ref={viewport.containerRef}
                className="canvas-viewport"
              >
                <div
                  className="canvas-viewport-inner"
                  style={{ transform: `translate(${viewport.tx}px, ${viewport.ty}px) scale(${viewport.scale})`, transformOrigin: '0 0' }}
                >
                <RoomCanvas
                  layout={session.layout}
                  features={wallFeatures.features}
                  selectedFeatureId={wallFeatures.selectedFeatureId}
                  onFeatureClick={selectFeature}
                  liveState={drag.liveState}
                  onFeaturePointerDown={drag.startDrag}
                  snapGridIn={session.snapEnabled ? session.snapGridIn : undefined}
                  measurementArrows={measurementArrows}
                >
                {furniture.furniture.map(item => {
                  const isSnappable = session.snapEnabled && item.rotation % 90 === 0;
                  const rndW = toPixels(effectiveW(item));
                  const rndH = toPixels(effectiveH(item));
                  const isSelected = session.selectedId === item.id;
                  const clipsThrough = item.heightIn + item.zOffsetIn > session.layout.ceilingHeightIn;
                  return (
                    <Rnd
                      key={item.id}
                      bounds="parent"
                      scale={viewport.scale}
                      position={{ x: toPixels(item.x), y: toPixels(item.y) }}
                      size={{ width: rndW, height: rndH }}
                      dragGrid={isSnappable ? [session.snapPx, session.snapPx] : undefined}
                      resizeGrid={isSnappable ? [session.snapPx, session.snapPx] : undefined}
                      onPointerDown={() => selectFurniture(item.id)}
                      onDragStop={(_, d) => furniture.move(item.id, d.x, d.y)}
                      onResizeStop={(_, _dir, ref, _delta, pos) =>
                        furniture.resize(item.id, ref.style.width, ref.style.height, pos.x, pos.y)
                      }
                      style={{
                        border: isSelected
                          ? '2px solid var(--accent)'
                          : clipsThrough
                          ? '2px solid #e53e3e'
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
                        <div style={{ textAlign: 'center', maxWidth: '100%', overflow: 'hidden', wordBreak: 'break-word' }}>
                          {item.name}<br />{formatDim(item.w, session.unitSystem)} × {formatDim(item.h, session.unitSystem)}
                        </div>
                      </div>
                    </Rnd>
                  );
                })}
              </RoomCanvas>
                </div>
                <div className="canvas-zoom-controls">
                  <button className="canvas-zoom-btn" onClick={viewport.zoomIn} aria-label="Zoom in">+</button>
                  <button className="canvas-zoom-btn" onClick={viewport.zoomOut} aria-label="Zoom out">−</button>
                  <button className="canvas-zoom-btn" onClick={viewport.refit} aria-label="Fit to screen">⤢</button>
                </div>
              </div>
            </>
          )}

          {ui.viewMode === '3d' && (
            <Suspense fallback={<div className="flex items-center justify-center h-full text-sm text-gray-400">Loading 3D view…</div>}>
              <Room3DView
                layout={session.layout}
                furniture={furniture.furniture}
                features={wallFeatures.features}
                unitSystem={session.unitSystem}
              />
            </Suspense>
          )}
        </div>
      </main>

      {isFloor && session.selectedId !== null && (
        <div className="selection-actions">
          <button
            className="selection-action-btn"
            onClick={() => furniture.rotate(session.selectedId!)}
            aria-label="Rotate 90°"
          >
            ↺ Rotate
          </button>
          <button
            className="selection-action-btn selection-action-btn--danger"
            onClick={() => { furniture.remove(session.selectedId!); session.setSelectedId(null); }}
            aria-label="Delete selected"
          >
            Delete
          </button>
        </div>
      )}

      {isFloor && (
        <button
          className="sidebar-fab"
          onClick={() => ui.setMobileSidebarOpen(o => !o)}
          aria-label={ui.mobileSidebarOpen ? 'Close controls' : 'Open controls'}
        >
          {ui.mobileSidebarOpen ? '✕' : '☰'}
        </button>
      )}

    </div>
  );
}
