import React from 'react';
import RoomPlanner from '../features/room-planner/components/RoomPlanner';

export default function App() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1>Room Layout Planner</h1>
        <p>10' x 10' Floor Plan (Scale: 1" = 4px)</p>
      </header>
      <RoomPlanner />
    </div>
  );
}
