import { formatDim } from '../../../utils/coordinates';
import type { UnitSystem } from '../../../utils/coordinates';
import type { RoomFeature, WallSide, WindowFeature, DoorSwingFeature } from '../types/room';
import type { AddableFeature, FeatureChanges } from '../hooks/useWallFeatures';

const WALL_LABELS: Record<WallSide, string> = {
  top: 'Top', right: 'Right', bottom: 'Bottom', left: 'Left',
};

interface FieldRowProps { label?: string; children: React.ReactNode }
function FieldRow({ label, children }: FieldRowProps) {
  return (
    <div className="field-row">
      {label && <label className="field-label">{label}</label>}
      {children}
    </div>
  );
}

function featureLabel(feat: RoomFeature, unitSystem: UnitSystem): string {
  const wall   = WALL_LABELS[feat.wall];
  const offset = formatDim(feat.offsetIn, unitSystem);
  if (feat.type === 'window')     return `Window — ${wall} +${offset}`;
  if (feat.type === 'door-swing') return `Door — ${wall} +${offset}`;
  return `Wall — ${wall} +${offset}`;
}

interface WallFeatureFormProps {
  newFeatType: 'window' | 'door-swing' | 'wall-segment';
  newFeatWall: WallSide;
  newFeatOffset: number;
  newFeatLength: number;
  newFeatHinge: 'left' | 'right';
  newFeatSwingDir: 'in' | 'out';
  onSetFeatType: (v: 'window' | 'door-swing' | 'wall-segment') => void;
  onSetFeatWall: (v: WallSide) => void;
  onSetFeatOffset: (v: number) => void;
  onSetFeatLength: (v: number) => void;
  onSetFeatHinge: (v: 'left' | 'right') => void;
  onSetFeatSwingDir: (v: 'in' | 'out') => void;
  buildFeature: () => AddableFeature;
  features: RoomFeature[];
  selectedFeature: RoomFeature | null;
  selectedFeatureId: number | null;
  unitSystem: UnitSystem;
  onAdd: (feature: AddableFeature) => void;
  onRemove: (id: number) => void;
  onUpdate: (id: number, changes: FeatureChanges) => void;
  onSelect: (id: number) => void;
}

export function WallFeatureForm({
  newFeatType,
  newFeatWall,
  newFeatOffset,
  newFeatLength,
  newFeatHinge,
  newFeatSwingDir,
  onSetFeatType,
  onSetFeatWall,
  onSetFeatOffset,
  onSetFeatLength,
  onSetFeatHinge,
  onSetFeatSwingDir,
  buildFeature,
  features,
  selectedFeature,
  selectedFeatureId,
  unitSystem,
  onAdd,
  onRemove,
  onUpdate,
  onSelect,
}: WallFeatureFormProps) {
  return (
    <>
      <FieldRow label="Type">
        <select
          className="input"
          value={newFeatType}
          onChange={e => onSetFeatType(e.target.value as 'window' | 'door-swing' | 'wall-segment')}
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
          onChange={e => onSetFeatWall(e.target.value as WallSide)}
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
          onChange={e => onSetFeatOffset(Number(e.target.value))}
        />
      </FieldRow>
      <FieldRow label={newFeatType === 'door-swing' ? 'Swing radius (in)' : 'Width (in)'}>
        <input
          type="number"
          className="input"
          min={6} step={0.5}
          value={newFeatLength}
          onChange={e => onSetFeatLength(Number(e.target.value))}
        />
      </FieldRow>
      {newFeatType === 'door-swing' && (
        <>
          <FieldRow label="Hinge side">
            <div className="btn-toggle-group">
              {(['left', 'right'] as const).map(side => (
                <button
                  key={side}
                  onClick={() => onSetFeatHinge(side)}
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
                  onClick={() => onSetFeatSwingDir(dir)}
                  className={`btn-toggle${newFeatSwingDir === dir ? ' btn-toggle--active' : ''}`}
                >
                  {dir === 'in' ? 'Into room' : 'Out of room'}
                </button>
              ))}
            </div>
          </FieldRow>
        </>
      )}
      <button className="btn-primary" onClick={() => onAdd(buildFeature())}>
        + Add Feature
      </button>

      {features.length > 0 && (
        <div>
          <div className="feature-list-label">Placed features</div>
          {features.map(feat => (
            <div
              key={feat.id}
              onClick={() => onSelect(feat.id)}
              className={`feature-item${feat.id === selectedFeatureId ? ' feature-item--selected' : ''}`}
            >
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {featureLabel(feat, unitSystem)}
              </span>
              <button
                className="feature-remove"
                onClick={e => { e.stopPropagation(); onRemove(feat.id); }}
                aria-label={`Remove ${featureLabel(feat, unitSystem)}`}
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
                  onChange={e => onUpdate(selectedFeature.id, { offsetIn: Number(e.target.value) })}
                />
              </FieldRow>
              {(selectedFeature.type === 'window' || selectedFeature.type === 'wall-segment') && (
                <FieldRow label="Width (in)">
                  <input
                    type="number"
                    className="input"
                    min={6} step={0.5}
                    value={selectedFeature.lengthIn}
                    onChange={e => onUpdate(selectedFeature.id, { lengthIn: Number(e.target.value) })}
                  />
                </FieldRow>
              )}
              {selectedFeature.type === 'window' && (() => {
                const win = selectedFeature as WindowFeature;
                return (
                  <>
                    <FieldRow label="Sill height (in)">
                      <input type="number" className="input" min={0} max={120} step={0.5}
                        value={win.sillHeightIn}
                        onChange={e => onUpdate(win.id, { sillHeightIn: Number(e.target.value) })} />
                    </FieldRow>
                    <FieldRow label="Opening height (in)">
                      <input type="number" className="input" min={6} max={120} step={0.5}
                        value={win.openingHeightIn}
                        onChange={e => onUpdate(win.id, { openingHeightIn: Number(e.target.value) })} />
                    </FieldRow>
                  </>
                );
              })()}
              {selectedFeature.type === 'wall-segment' && (
                <FieldRow label="Height (in)">
                  <input type="number" className="input" min={1} max={240} step={0.5}
                    value={(selectedFeature as { heightIn: number }).heightIn}
                    onChange={e => onUpdate(selectedFeature.id, { heightIn: Number(e.target.value) })} />
                </FieldRow>
              )}
              {selectedFeature.type === 'door-swing' && (() => {
                const door = selectedFeature as DoorSwingFeature;
                return (
                  <>
                    <FieldRow label="Door height (in)">
                      <input type="number" className="input" min={60} max={120} step={0.5}
                        value={door.doorHeightIn}
                        onChange={e => onUpdate(door.id, { doorHeightIn: Number(e.target.value) })} />
                    </FieldRow>
                    <FieldRow label="Hinge side">
                      <div className="btn-toggle-group">
                        {(['left', 'right'] as const).map(side => (
                          <button
                            key={side}
                            onClick={() => onUpdate(door.id, { hingeDirection: side })}
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
                            onClick={() => onUpdate(door.id, { swingDirection: dir })}
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
    </>
  );
}
