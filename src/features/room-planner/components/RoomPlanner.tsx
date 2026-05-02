import { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { toPixels } from '../../../utils/coordinates';
import { useFurniture } from '../hooks/useFurniture';
import { useWallFeatures } from '../hooks/useWallFeatures';
import RoomCanvas from './RoomCanvas';
import { DEFAULT_ROOM } from '../data/room';
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

const SNAP_SIZES = [6, 12, 24] as const;

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
    <div style={{ border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
      <div
        onClick={onToggle}
        style={{
          background: '#f5f5f5',
          padding: '8px 12px',
          fontWeight: 'bold',
          fontSize: 13,
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          userSelect: 'none',
        }}
      >
        {title}
        <span style={{ color: '#888', fontSize: 11 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && <div style={{ padding: 12, fontSize: 13 }}>{children}</div>}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 3 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '5px 8px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 13,
  boxSizing: 'border-box' as const,
};

const WALL_LABELS: Record<WallSide, string> = { top: 'Top', right: 'Right', bottom: 'Bottom', left: 'Left' };

export default function RoomPlanner() {
  const { furniture, move, resize, add, update, remove, rotate } = useFurniture();
  const wallFeatures = useWallFeatures(DEFAULT_ROOM.features);

  const [layout, setLayout] = useState<RoomLayout>({ ...DEFAULT_ROOM, features: [] });
  const [selectedId, setSelectedId]   = useState<number | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [snapGridIn, setSnapGridIn]   = useState<typeof SNAP_SIZES[number]>(6);

  const [dimOpen,      setDimOpen]      = useState(true);
  const [gridOpen,     setGridOpen]     = useState(false);
  const [propOpen,     setPropOpen]     = useState(true);
  const [wallFeatOpen, setWallFeatOpen] = useState(false);
  const [legendOpen,   setLegendOpen]   = useState(true);

  // Wall feature form state
  const [newFeatType,   setNewFeatType]   = useState<'window' | 'door-swing' | 'wall-segment'>('window');
  const [newFeatWall,   setNewFeatWall]   = useState<WallSide>('bottom');
  const [newFeatOffset, setNewFeatOffset] = useState(12);
  const [newFeatLength, setNewFeatLength] = useState(36);
  const [newFeatHinge,  setNewFeatHinge]  = useState<'left' | 'right'>('left');
  const [newFeatSwingDir, setNewFeatSwingDir] = useState<'in' | 'out'>('in');

  const selectedItem    = furniture.find(f => f.id === selectedId) ?? null;
  const selectedFeature = wallFeatures.features.find(f => f.id === wallFeatures.selectedFeatureId) ?? null;
  const snapPx = toPixels(snapGridIn);
  const widthFt  = Math.round(layout.widthIn  / 12);
  const heightFt = Math.round(layout.heightIn / 12);

  function selectFurniture(id: number) {
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

  function setWidthFt(ft: number) {
    if (ft >= 4 && ft <= 60) setLayout(prev => ({ ...prev, widthIn: ft * 12 }));
  }

  function setHeightFt(ft: number) {
    if (ft >= 4 && ft <= 60) setLayout(prev => ({ ...prev, heightIn: ft * 12 }));
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
    const wall = WALL_LABELS[f.wall];
    if (f.type === 'window') return `Window — ${wall} +${f.offsetIn}"`;
    if (f.type === 'door-swing') return `Door — ${wall} +${f.offsetIn}"`;
    return `Wall — ${wall} +${f.offsetIn}"`;
  }

  return (
    <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 13, color: '#555' }}>
          {widthFt}' × {heightFt}' &nbsp;·&nbsp; Scale: 1" = 4px
          {snapEnabled && <span style={{ marginLeft: 8, color: '#0066ff' }}>⊞ {snapGridIn}" snap</span>}
        </p>
        <RoomCanvas
          layout={layout}
          features={wallFeatures.features}
          selectedFeatureId={wallFeatures.selectedFeatureId}
          onFeatureClick={selectFeature}
          onFeatureUpdate={wallFeatures.update}
          snapGridIn={snapEnabled ? snapGridIn : undefined}
        >
          {furniture.map((f) => {
            const isOdd = f.rotation === 90 || f.rotation === 270;
            const isSnappable = snapEnabled && f.rotation % 90 === 0;
            const rndW = toPixels(isOdd ? f.h : f.w);
            const rndH = toPixels(isOdd ? f.w : f.h);
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
                  border: selectedId === f.id ? '2px solid #0066ff' : '1px solid #000',
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
                    fontSize: 12,
                    fontWeight: 'bold',
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    {f.name}<br />{Math.round(f.w)}" × {Math.round(f.h)}"
                  </div>
                </div>
              </Rnd>
            );
          })}
        </RoomCanvas>
      </div>

      <div style={{ width: 220, flexShrink: 0 }}>

        {/* Room Dimensions */}
        <SectionPanel title="Room Dimensions" open={dimOpen} onToggle={() => setDimOpen(o => !o)}>
          <FieldRow label="Preset">
            <select
              style={inputStyle}
              onChange={e => applyPreset(Number(e.target.value))}
              value={PRESETS.findIndex(p => p.w === layout.widthIn && p.h === layout.heightIn)}
            >
              {PRESETS.map((p, i) => (
                <option key={i} value={i}>{p.label}</option>
              ))}
            </select>
          </FieldRow>
          <div style={{ display: 'flex', gap: 8 }}>
            <FieldRow label="Width (ft)">
              <input
                type="number"
                style={{ ...inputStyle, width: 80 }}
                min={4} max={60}
                value={widthFt}
                onChange={e => setWidthFt(Number(e.target.value))}
              />
            </FieldRow>
            <FieldRow label="Depth (ft)">
              <input
                type="number"
                style={{ ...inputStyle, width: 80 }}
                min={4} max={60}
                value={heightFt}
                onChange={e => setHeightFt(Number(e.target.value))}
              />
            </FieldRow>
          </div>
        </SectionPanel>

        {/* Grid & Snap */}
        <SectionPanel title="Grid & Snap" open={gridOpen} onToggle={() => setGridOpen(o => !o)}>
          <FieldRow label="">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
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
              <div style={{ display: 'flex', gap: 6 }}>
                {SNAP_SIZES.map(s => (
                  <button
                    key={s}
                    onClick={() => setSnapGridIn(s)}
                    style={{
                      padding: '4px 10px',
                      border: '1px solid #ccc',
                      borderRadius: 4,
                      background: snapGridIn === s ? '#0066ff' : '#fff',
                      color: snapGridIn === s ? '#fff' : '#333',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
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
          <button
            onClick={() => { add(); }}
            style={{
              width: '100%',
              padding: '8px 0',
              marginBottom: 12,
              background: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            + Add Furniture
          </button>

          {selectedItem ? (
            <div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>Selected item</div>
              <FieldRow label="Name">
                <input
                  type="text"
                  style={inputStyle}
                  value={selectedItem.name}
                  onChange={e => update(selectedItem.id, { name: e.target.value })}
                />
              </FieldRow>
              <div style={{ display: 'flex', gap: 8 }}>
                <FieldRow label="Width (in)">
                  <input
                    type="number"
                    style={{ ...inputStyle, width: 80 }}
                    min={6} max={layout.widthIn}
                    value={Math.round(selectedItem.w)}
                    onChange={e => update(selectedItem.id, { w: Number(e.target.value) })}
                  />
                </FieldRow>
                <FieldRow label="Depth (in)">
                  <input
                    type="number"
                    style={{ ...inputStyle, width: 80 }}
                    min={6} max={layout.heightIn}
                    value={Math.round(selectedItem.h)}
                    onChange={e => update(selectedItem.id, { h: Number(e.target.value) })}
                  />
                </FieldRow>
              </div>
              <FieldRow label="Color">
                <input
                  type="color"
                  style={{ ...inputStyle, height: 32, padding: 2, cursor: 'pointer' }}
                  value={selectedItem.color}
                  onChange={e => update(selectedItem.id, { color: e.target.value })}
                />
              </FieldRow>
              <FieldRow label="Rotation">
                <div style={{ fontSize: 13, padding: '4px 0', color: '#333' }}>
                  {selectedItem.rotation}° &nbsp;
                  <span style={{ fontSize: 11, color: '#999' }}>(press R to rotate)</span>
                </div>
              </FieldRow>
              <button
                onClick={() => { remove(selectedItem.id); setSelectedId(null); }}
                style={{
                  width: '100%',
                  padding: '6px 0',
                  marginTop: 4,
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Delete
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#aaa', textAlign: 'center', padding: '8px 0' }}>
              Click furniture to select
            </div>
          )}
        </SectionPanel>

        {/* Wall Features */}
        <SectionPanel title="Wall Features" open={wallFeatOpen} onToggle={() => setWallFeatOpen(o => !o)}>
          <FieldRow label="Type">
            <select
              style={inputStyle}
              value={newFeatType}
              onChange={e => setNewFeatType(e.target.value as 'window' | 'door-swing' | 'wall-segment')}
            >
              <option value="window">Window</option>
              <option value="door-swing">Door</option>
              <option value="wall-segment">Wall</option>
            </select>
          </FieldRow>
          <FieldRow label="Wall">
            <select
              style={inputStyle}
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
              style={inputStyle}
              min={0}
              value={newFeatOffset}
              onChange={e => setNewFeatOffset(Number(e.target.value))}
            />
          </FieldRow>
          <FieldRow label={newFeatType === 'door-swing' ? 'Swing radius (in)' : 'Width (in)'}>
            <input
              type="number"
              style={inputStyle}
              min={6}
              value={newFeatLength}
              onChange={e => setNewFeatLength(Number(e.target.value))}
            />
          </FieldRow>
          {newFeatType === 'door-swing' && (
            <>
              <FieldRow label="Hinge side">
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['left', 'right'] as const).map(side => (
                    <button
                      key={side}
                      onClick={() => setNewFeatHinge(side)}
                      style={{
                        flex: 1,
                        padding: '4px 0',
                        border: '1px solid #ccc',
                        borderRadius: 4,
                        background: newFeatHinge === side ? '#0066ff' : '#fff',
                        color: newFeatHinge === side ? '#fff' : '#333',
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      {side.charAt(0).toUpperCase() + side.slice(1)}
                    </button>
                  ))}
                </div>
              </FieldRow>
              <FieldRow label="Swing direction">
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['in', 'out'] as const).map(dir => (
                    <button
                      key={dir}
                      onClick={() => setNewFeatSwingDir(dir)}
                      style={{
                        flex: 1,
                        padding: '4px 0',
                        border: '1px solid #ccc',
                        borderRadius: 4,
                        background: newFeatSwingDir === dir ? '#0066ff' : '#fff',
                        color: newFeatSwingDir === dir ? '#fff' : '#333',
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      {dir === 'in' ? 'Into room' : 'Out of room'}
                    </button>
                  ))}
                </div>
              </FieldRow>
            </>
          )}
          <button
            onClick={addWallFeature}
            style={{
              width: '100%',
              padding: '7px 0',
              marginTop: 4,
              marginBottom: 12,
              background: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            + Add Feature
          </button>

          {wallFeatures.features.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Placed features</div>
              {wallFeatures.features.map(f => (
                <div
                  key={f.id}
                  onClick={() => selectFeature(f.id)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 6px',
                    marginBottom: 4,
                    borderRadius: 4,
                    background: f.id === wallFeatures.selectedFeatureId ? '#e8f0fe' : '#f9f9f9',
                    border: f.id === wallFeatures.selectedFeatureId ? '1px solid #0066ff' : '1px solid #eee',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  <span>{featureLabel(f)}</span>
                  <button
                    onClick={e => { e.stopPropagation(); wallFeatures.remove(f.id); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontSize: 14,
                      padding: '0 2px',
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {selectedFeature && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #eee' }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>
                    Selected {selectedFeature.type === 'window' ? 'window' : selectedFeature.type === 'wall-segment' ? 'wall segment' : 'door'}
                  </div>
                  <FieldRow label="Offset from corner (in)">
                    <input
                      type="number"
                      style={inputStyle}
                      min={0}
                      value={Math.round(selectedFeature.offsetIn)}
                      onChange={e => wallFeatures.update(selectedFeature.id, { offsetIn: Number(e.target.value) })}
                    />
                  </FieldRow>
                  {(selectedFeature.type === 'window' || selectedFeature.type === 'wall-segment') && (
                    <FieldRow label="Width (in)">
                      <input
                        type="number"
                        style={inputStyle}
                        min={6}
                        value={Math.round(selectedFeature.lengthIn)}
                        onChange={e => wallFeatures.update(selectedFeature.id, { lengthIn: Number(e.target.value) })}
                      />
                    </FieldRow>
                  )}
                  {selectedFeature.type === 'door-swing' && (
                    <>
                      <FieldRow label="Hinge side">
                        <div style={{ display: 'flex', gap: 6 }}>
                          {(['left', 'right'] as const).map(side => (
                            <button
                              key={side}
                              onClick={() => wallFeatures.update(selectedFeature.id, { hingeDirection: side })}
                              style={{
                                flex: 1, padding: '4px 0',
                                border: '1px solid #ccc', borderRadius: 4,
                                background: selectedFeature.hingeDirection === side ? '#0066ff' : '#fff',
                                color: selectedFeature.hingeDirection === side ? '#fff' : '#333',
                                cursor: 'pointer', fontSize: 12,
                              }}
                            >
                              {side.charAt(0).toUpperCase() + side.slice(1)}
                            </button>
                          ))}
                        </div>
                      </FieldRow>
                      <FieldRow label="Swing direction">
                        <div style={{ display: 'flex', gap: 6 }}>
                          {(['in', 'out'] as const).map(dir => (
                            <button
                              key={dir}
                              onClick={() => wallFeatures.update(selectedFeature.id, { swingDirection: dir })}
                              style={{
                                flex: 1, padding: '4px 0',
                                border: '1px solid #ccc', borderRadius: 4,
                                background: selectedFeature.swingDirection === dir ? '#0066ff' : '#fff',
                                color: selectedFeature.swingDirection === dir ? '#fff' : '#333',
                                cursor: 'pointer', fontSize: 12,
                              }}
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

        {/* Controls Legend */}
        <SectionPanel title="Controls" open={legendOpen} onToggle={() => setLegendOpen(o => !o)}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <tbody>
              {[
                ['Click',           'Select item'],
                ['Drag',            'Move furniture or wall feature'],
                ['Resize handles',  'Resize furniture or wall feature'],
                ['R',               'Rotate selected furniture'],
                ['Delete / ⌫',      'Remove selected item'],
              ].map(([key, desc]) => (
                <tr key={key} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '4px 6px 4px 0', fontFamily: 'monospace', color: '#0066ff', whiteSpace: 'nowrap' }}>
                    {key}
                  </td>
                  <td style={{ padding: '4px 0', color: '#555' }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionPanel>

      </div>
    </div>
  );
}
