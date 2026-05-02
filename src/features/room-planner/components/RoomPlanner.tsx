import { Rnd } from 'react-rnd';
import { toPixels } from '../../../utils/coordinates';
import { useFurniture } from '../hooks/useFurniture';
import RoomCanvas from './RoomCanvas';
import { DEFAULT_ROOM } from '../data/room';

export default function RoomPlanner() {
  const { furniture, move, resize, add } = useFurniture();

  return (
    <div style={{ display: 'flex', gap: '40px' }}>
      <RoomCanvas layout={DEFAULT_ROOM}>
        {furniture.map((f) => (
          <Rnd
            key={f.id}
            bounds="parent"
            default={{ x: toPixels(f.x), y: toPixels(f.y), width: toPixels(f.w), height: toPixels(f.h) }}
            onDragStop={(_, d) => move(f.id, d.x, d.y)}
            onResizeStop={(_, _dir, ref, _delta, pos) => resize(f.id, ref.style.width, ref.style.height, pos.x, pos.y)}
            style={{
              background: f.color,
              border: '1px solid #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              {f.name}<br />{Math.round(f.w)}" x {Math.round(f.h)}"
            </div>
          </Rnd>
        ))}
      </RoomCanvas>

      <div style={{ flex: 1 }}>
        <h3>Room Details</h3>
        <ul style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <li>Total Size: 10' x 10' (120" x 120")</li>
          <li>Blank Wall (Bottom): 50.5"</li>
          <li>Wall Segment (Right): 29"</li>
        </ul>
        <button
          onClick={add}
          style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}
        >
          Add Furniture
        </button>
      </div>
    </div>
  );
}
