import type { FurnitureItem } from '../types/room';
import type { UnitSystem } from '../../../utils/coordinates';

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
}

export function FurnitureForm({
  selectedItem,
  roomWidthIn,
  roomHeightIn,
  unitSystem: _unitSystem,
  furnitureCount,
  onUpdate,
  onRemove,
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
          value={selectedItem.name}
          onChange={e => onUpdate(selectedItem.id, { name: e.target.value })}
        />
      </FieldRow>
      <div className="dim-pair">
        <FieldRow label="Width (in)">
          <input
            type="number"
            className="input"
            min={6} max={roomWidthIn} step={0.5}
            value={selectedItem.w}
            onChange={e => onUpdate(selectedItem.id, { w: Number(e.target.value) })}
          />
        </FieldRow>
        <FieldRow label="Depth (in)">
          <input
            type="number"
            className="input"
            min={6} max={roomHeightIn} step={0.5}
            value={selectedItem.h}
            onChange={e => onUpdate(selectedItem.id, { h: Number(e.target.value) })}
          />
        </FieldRow>
      </div>
      <div className="dim-pair">
        <FieldRow label="Height (in)">
          <input
            type="number"
            className="input"
            min={1} max={240} step={0.5}
            value={selectedItem.heightIn}
            onChange={e => onUpdate(selectedItem.id, { heightIn: Number(e.target.value) })}
          />
        </FieldRow>
        <FieldRow label="Floor offset (in)">
          <input
            type="number"
            className="input"
            min={0} max={120} step={0.5}
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
        <div className="rotation-display">
          {selectedItem.rotation}°
          <span className="rotation-hint">(R to rotate)</span>
        </div>
      </FieldRow>
      <button
        className="btn-destructive"
        onClick={() => onRemove(selectedItem.id)}
      >
        Delete
      </button>
    </div>
  );
}
