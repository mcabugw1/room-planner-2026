import type { FurnitureItem, FurnitureCategory } from '../types/room';
import type { UnitSystem } from '../../../utils/displayUtils';

interface FieldRowProps { label?: string; children: React.ReactNode }
function FieldRow({ label, children }: FieldRowProps) {
  return (
    <div className="field-row">
      {label && <label className="field-label">{label}</label>}
      {children}
    </div>
  );
}

interface FurnitureFormProps {
  selectedItem: FurnitureItem | null;
  roomWidthIn: number;
  roomHeightIn: number;
  unitSystem: UnitSystem;
  furnitureCount: number;
  onUpdate: (id: number, changes: Partial<Omit<FurnitureItem, 'id'>>) => void;
  onRemove: (id: number) => void;
  onRotate: (id: number) => void;
}

export function FurnitureForm({
  selectedItem,
  roomWidthIn,
  roomHeightIn,
  unitSystem: _unitSystem,
  furnitureCount,
  onUpdate,
  onRemove,
  onRotate,
}: FurnitureFormProps) {
  if (!selectedItem) {
    return (
      <div className="empty-state">
        {furnitureCount === 0
          ? 'No furniture added yet. Click + Add Furniture above.'
          : 'Click furniture on the canvas to select it.'}
      </div>
    );
  }

  return (
    <div>
      <div className="selected-label">Selected item</div>
      <FieldRow label="Name">
        <input
          type="text"
          className="input"
          maxLength={50}
          autoComplete="off"
          value={selectedItem.name}
          onChange={e => onUpdate(selectedItem.id, { name: e.target.value })}
        />
      </FieldRow>
      <FieldRow label="Category">
        <select
          className="input"
          value={selectedItem.category}
          onChange={e => onUpdate(selectedItem.id, { category: e.target.value as FurnitureCategory })}
        >
          <option value="bed">Bed</option>
          <option value="desk">Desk</option>
          <option value="sofa">Sofa</option>
          <option value="stove">Stove</option>
          <option value="other">Other</option>
        </select>
      </FieldRow>
      <div className="dim-pair">
        <FieldRow label="Width (in)">
          <input
            type="number"
            inputMode="decimal"
            className="input"
            min={6} max={roomWidthIn} step={0.5}
            autoComplete="off"
            value={selectedItem.w}
            onChange={e => onUpdate(selectedItem.id, { w: Number(e.target.value) })}
          />
        </FieldRow>
        <FieldRow label="Depth (in)">
          <input
            type="number"
            inputMode="decimal"
            className="input"
            min={6} max={roomHeightIn} step={0.5}
            autoComplete="off"
            value={selectedItem.h}
            onChange={e => onUpdate(selectedItem.id, { h: Number(e.target.value) })}
          />
        </FieldRow>
      </div>
      <div className="dim-pair">
        <FieldRow label="Height (in)">
          <input
            type="number"
            inputMode="decimal"
            className="input"
            min={1} max={240} step={0.5}
            autoComplete="off"
            value={selectedItem.heightIn}
            onChange={e => onUpdate(selectedItem.id, { heightIn: Number(e.target.value) })}
          />
        </FieldRow>
        <FieldRow label="Floor offset (in)">
          <input
            type="number"
            inputMode="decimal"
            className="input"
            min={0} max={120} step={0.5}
            autoComplete="off"
            value={selectedItem.zOffsetIn}
            onChange={e => onUpdate(selectedItem.id, { zOffsetIn: Number(e.target.value) })}
          />
        </FieldRow>
      </div>
      <FieldRow label="Color">
        <input
          type="color"
          className="input"
          value={selectedItem.color}
          onChange={e => onUpdate(selectedItem.id, { color: e.target.value })}
        />
      </FieldRow>
      <FieldRow label="Rotation">
        <div className="rotation-row">
          <span className="rotation-value">{selectedItem.rotation}°</span>
          <button
            className="btn-rotate"
            onClick={() => onRotate(selectedItem.id)}
            aria-label="Rotate 90°"
          >
            ↺ Rotate
          </button>
          <span className="rotation-hint">(R)</span>
        </div>
      </FieldRow>
      {selectedItem.category !== 'other' && (
        <FieldRow label={selectedItem.category === 'bed' ? 'Head / Foot' : 'Back / Front'}>
          <div className="btn-toggle-group" role="group" aria-label="Orientation">
            <button
              className={`btn-toggle${(selectedItem.headAtStart ?? false) ? ' btn-toggle--active' : ''}`}
              aria-pressed={selectedItem.headAtStart ?? false}
              onClick={() => onUpdate(selectedItem.id, { headAtStart: true })}
            >
              {selectedItem.category === 'bed' ? 'Head at top' : 'Back at top'}
            </button>
            <button
              className={`btn-toggle${!(selectedItem.headAtStart ?? false) ? ' btn-toggle--active' : ''}`}
              aria-pressed={!(selectedItem.headAtStart ?? false)}
              onClick={() => onUpdate(selectedItem.id, { headAtStart: false })}
            >
              {selectedItem.category === 'bed' ? 'Head at bottom' : 'Back at bottom'}
            </button>
          </div>
        </FieldRow>
      )}
      <button
        className="btn-destructive"
        onClick={() => onRemove(selectedItem.id)}
      >
        Delete
      </button>
    </div>
  );
}
