import { Component, type ReactNode } from 'react';
import RoomPlanner from '../features/room-planner/components/RoomPlanner';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app-error">
          <p>Something went wrong. Reload the page to continue.</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <div className="app-shell">
        <header className="app-header">
          <h1>Room Planner</h1>
        </header>
        <RoomPlanner />
      </div>
    </ErrorBoundary>
  );
}
