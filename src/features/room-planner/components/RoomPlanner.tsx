import React, { useState } from 'react';
import { Rnd } from 'react-rnd';

export default function RoomPlanner() {
  const SCALE = 4;
  const ROOM_INCHES = 120;
  const PIXELS = ROOM_INCHES * SCALE;

  const [furniture, setFurniture] = useState([
    { id: 1, name: 'Bed', w: 54, h: 75, x: 10, y: 10, color: '#ffcccb' },
    { id: 2, name: 'Desk', w: 48, h: 24, x: 70, y: 10, color: '#add8e6' }
  ]);

  return (
    <div style={{ display: 'flex', gap: '40px' }}>
      <div style={{ 
        width: PIXELS, height: PIXELS, 
        border: '5px solid #333', position: 'relative',
        background: '#fff', boxShadow: '0 0 20px rgba(0,0,0,0.1)'
      }}>
        {/* Left Wall: Sliding Window Pane */}
        <div style={{ position: 'absolute', left: -5, top: '25%', height: '50%', width: 10, background: '#87CEEB', border: '1px solid #555' }} title="Sliding Window" />

        {/* Right Wall: Doors */}
        <div style={{ position: 'absolute', right: -5, top: 0, height: 50*SCALE, width: 5, background: '#333' }} /> {/* 4'2" Wall */}
        {/* Exit Door Swing */}
        <div style={{ position: 'absolute', right: 0, top: 50*SCALE, height: 36*SCALE, width: 36*SCALE, border: '1px dashed #999', borderRadius: '0 0 0 100%' }} />
        <div style={{ position: 'absolute', right: -5, top: 86*SCALE, height: 29*SCALE, width: 5, background: '#333' }} /> {/* 29" Segment */}

        {/* Bottom Wall: Closet and Bathroom */}
        <div style={{ position: 'absolute', left: 34.5*SCALE, bottom: -5, width: 50.5*SCALE, height: 5, background: '#333' }} /> {/* 50.5" Gap */}

        {furniture.map((f, i) => (
          <Rnd
            key={f.id}
            bounds="parent"
            default={{ x: f.x * SCALE, y: f.y * SCALE, width: f.w * SCALE, height: f.h * SCALE }}
            onDragStop={(e, d) => {
              const next = [...furniture];
              next[i] = { ...next[i], x: d.x / SCALE, y: d.y / SCALE };
              setFurniture(next);
            }}
            onResizeStop={(e, dir, ref, delta, pos) => {
              const next = [...furniture];
              next[i] = { 
                ...next[i], 
                w: parseInt(ref.style.width) / SCALE, 
                h: parseInt(ref.style.height) / SCALE,
                x: pos.x / SCALE,
                y: pos.y / SCALE
              };
              setFurniture(next);
            }}
            style={{ 
              background: f.color, border: '1px solid #000', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 'bold'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              {f.name}<br/>{Math.round(f.w)}" x {Math.round(f.h)}"
            </div>
          </Rnd>
        ))}
      </div>
      
      <div style={{ flex: 1 }}>
        <h3>Room Details</h3>
        <ul style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <li>Total Size: 10' x 10' (120" x 120")</li>
          <li>Blank Wall (Bottom): 50.5"</li>
          <li>Wall Segment (Right): 29"</li>
        </ul>
        <button 
          onClick={() => setFurniture([...furniture, { id: Date.now(), name: 'New Block', w: 24, h: 24, x: 40, y: 40, color: '#eee' }])}
          style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}
        >
          Add Furniture
        </button>
      </div>
    </div>
  );
}
