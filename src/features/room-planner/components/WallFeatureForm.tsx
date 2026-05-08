import { formatDim } from '../../../utils/displayUtils';
import type { UnitSystem } from '../../../utils/displayUtils';
import type { RoomFeature, WallSide, WindowFeature, DoorSwingFeature } from '../types/room';
import type { AddableFeature, FeatureChanges } from '../hooks/useWallFeatures';
import type { FeatureDraft } from '../hooks/useNewFeatureDraft';

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
  draft: FeatureDraft;
  onDraftChange: (changes: Partial<FeatureDraft>) => void;
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
  draft,
  onDraftChange,
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
          value={draft.type}
          onChange={e => onDraftChange({ type: e.target.value as FeatureDraft['type'] })}
        >
          <option value="window">Window</option>
          <option value="door-swing">Door</option>
          <option value="wall-segment">Wall segment</option>
        </select>
      </FieldRow>
      <FieldRow label="Wall">
        <select
          className="input"
          value={draft.wall}
          onChange={e => onDraftChange({ wall: e.target.value as WallSide })}
        >
          {(['top', 'right', 'bottom', 'left'] as WallSide[]).map(w => (
            <option key={w} value={w}>{WALL_LABELS[w]}</option>
          ))}
        </select>
      </FieldRow>
      <FieldRow label="Offset from corner (in)">
        <input
          type="number"
          inputMode="decimal"
          className="input"
          min={0} step={0.5}
          autoComplete="off"
          value={draft.offsetIn}
          onChange={e => onDraftChange({ offsetIn: Number(e.target.value) })}
        />
      </FieldRow>
      <FieldRow label={draft.type === 'door-swing' ? 'Swing radius (in)' : 'Width (in)'}>
        <input
          type="number"
          inputMode="decimal"
          className="input"
          min={6} step={0.5}
          autoComplete="off"
          value={draft.lengthIn}
          onChange={e => onDraftChange({ lengthIn: Number(e.target.value) })}
        />
      </FieldRow>
      {draft.type === 'door-swing' && (
        <>
          <FieldRow label="Hinge side">
            <div className="btn-toggle-group">
              {(['left', 'right'] as const).map(side => (
                <button
                  key={side}
                  onClick={() => onDraftChange({ hinge: side })}
                  className={`btn-toggle${draft.hinge === side ? ' btn-toggle--active' : ''}`}
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
                  onClick={() => onDraftChange({ swingDir: dir })}
                  className={`btn-toggle${draft.swingDir === dir ? ' btn-toggle--active' : ''}`}
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
                  inputMode="decimal"
                  className="input"
                  min={0} step={0.5}
                  autoComplete="off"
                  value={selectedFeature.offsetIn}
                  onChange={e => onUpdate(selectedFeature.id, { offsetIn: Number(e.target.value) })}
                />
              </FieldRow>
              {(selectedFeature.type === 'window' || selectedFeature.type === 'wall-segment') && (
                <FieldRow label="Width (in)">
                  <input
                    type="number"
                    inputMode="decimal"
                    className="input"
                    min={6} step={0.5}
                    autoComplete="off"
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
                      <input type="number" inputMode="decimal" className="input" min={0} max={120} step={0.5}
                        autoComplete="off" value={win.sillHeightIn}
                        onChange={e => onUpdate(win.id, { sillHeightIn: Number(e.target.value) })} />
                    </FieldRow>
                    <FieldRow label="Opening height (in)">
                      <input type="number" inputMode="decimal" className="input" min={6} max={120} step={0.5}
                        autoComplete="off" value={win.openingHeightIn}
                        onChange={e => onUpdate(win.id, { openingHeightIn: Number(e.target.value) })} />
                    </FieldRow>
                  </>
                );
              })()}
              {selectedFeature.type === 'wall-segment' && (
                <FieldRow label="Height (in)">
                  <input type="number" inputMode="decimal" className="input" min={1} max={240} step={0.5}
                    autoComplete="off" value={(selectedFeature as { heightIn: number }).heightIn}
                    onChange={e => onUpdate(selectedFeature.id, { heightIn: Number(e.target.value) })} />
                </FieldRow>
              )}
              {selectedFeature.type === 'door-swing' && (() => {
                const door = selectedFeature as DoorSwingFeature;
                return (
                  <>
                    <FieldRow label="Door height (in)">
                      <input type="number" inputMode="decimal" className="input" min={60} max={120} step={0.5}
                        autoComplete="off" value={door.doorHeightIn}
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
