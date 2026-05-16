import { useEffect } from 'react';
import { formatDim } from '../../../utils/displayUtils';
import type { UnitSystem } from '../../../utils/displayUtils';
import type { DoorSwingFeature, FengShuiConfig, RoomType } from '../types/room';

const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  'bedroom': 'Bedroom',
  'living-room': 'Living Room',
  'office': 'Office',
  'kitchen': 'Kitchen',
  'dining-room': 'Dining Room',
  'other': 'Other',
};

interface FengShuiTabProps {
  config: FengShuiConfig;
  doors: DoorSwingFeature[];
  roomType: RoomType;
  unitSystem: UnitSystem;
  onSetEntryDoor: (id: number | null) => void;
  onSetMode: (mode: 'simple' | 'advanced') => void;
  onAnalyze: () => void;
}

export function FengShuiTab({
  config,
  doors,
  roomType,
  unitSystem,
  onSetEntryDoor,
  onSetMode,
  onAnalyze,
}: FengShuiTabProps) {
  useEffect(() => {
    if (config.entryDoorId === null && doors.length === 1) {
      onSetEntryDoor(doors[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canAnalyze = config.entryDoorId !== null;

  function doorLabel(door: DoorSwingFeature): string {
    const wall = door.wall.charAt(0).toUpperCase() + door.wall.slice(1);
    return `${wall} wall, ${formatDim(door.offsetIn, unitSystem)}`;
  }

  return (
    <div className="feng-shui-tab">

      <div className="feng-shui-section">
        <div className="btn-toggle-group" role="group" aria-label="Analysis mode">
          {(['simple', 'advanced'] as const).map(m => (
            <button
              key={m}
              className={`btn-toggle${config.mode === m ? ' btn-toggle--active' : ''}`}
              aria-pressed={config.mode === m}
              onClick={() => onSetMode(m)}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="feng-shui-section">
        <label className="field-label">Entry door</label>
        {doors.length === 0 ? (
          <p className="feng-shui-hint">Add a door in the Walls section first</p>
        ) : (
          <select
            className="input"
            value={config.entryDoorId ?? ''}
            onChange={e => onSetEntryDoor(Number(e.target.value))}
          >
            {config.entryDoorId === null && (
              <option value="" disabled>Select entry door</option>
            )}
            {doors.map(door => (
              <option key={door.id} value={door.id}>
                {doorLabel(door)}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="feng-shui-section">
        <label className="field-label">Room type</label>
        <p className="feng-shui-room-type">
          {ROOM_TYPE_LABELS[roomType]}
          <span className="feng-shui-hint"> — change in Room settings</span>
        </p>
      </div>

      <div className="feng-shui-results-empty" role="status" aria-live="polite">
        <span>Run analysis to see results</span>
      </div>

      <button
        className="btn-primary feng-shui-analyze-btn"
        disabled={!canAnalyze}
        title={canAnalyze ? undefined : 'Select an entry door first'}
        onClick={onAnalyze}
      >
        Analyze
      </button>

    </div>
  );
}
