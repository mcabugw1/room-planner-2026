import { useState } from 'react';
import type { SavedLayoutMeta } from '../hooks/useLayoutPersistence';

interface Props {
  savedLayouts: SavedLayoutMeta[];
  onSave: (name: string) => void;
  onLoad: (id: number) => void;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
}

function defaultName() {
  return `Layout ${new Date().toLocaleDateString()}`;
}

export default function LayoutsPanel({ savedLayouts, onSave, onLoad, onRename, onDelete }: Props) {
  const [saveName, setSaveName] = useState('');
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');

  function handleSave() {
    const name = saveName.trim() || defaultName();
    onSave(name);
    setSaveName('');
  }

  function startRename(id: number, currentName: string) {
    setRenamingId(id);
    setRenameValue(currentName);
  }

  function commitRename(id: number) {
    const name = renameValue.trim();
    if (name) onRename(id, name);
    setRenamingId(null);
  }

  return (
    <div>
      <div className="field-row">
        <input
          type="text"
          className="input"
          placeholder={defaultName()}
          value={saveName}
          onChange={e => setSaveName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
      </div>
      <div className="field-row">
        <button className="btn-primary" onClick={handleSave}>
          Save layout
        </button>
      </div>

      {savedLayouts.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {savedLayouts.map(layout => (
            <div key={layout.id} className="feature-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
              {renamingId === layout.id ? (
                <input
                  className="input"
                  autoFocus
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitRename(layout.id);
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  onBlur={() => commitRename(layout.id)}
                />
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{layout.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {new Date(layout.savedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="btn-toggle"
                  style={{ flex: 1, fontSize: 11 }}
                  onClick={() => onLoad(layout.id)}
                >
                  Load
                </button>
                <button
                  className="btn-toggle"
                  style={{ flex: 1, fontSize: 11 }}
                  onClick={() => startRename(layout.id, layout.name)}
                >
                  Rename
                </button>
                <button
                  className="feature-remove"
                  onClick={() => onDelete(layout.id)}
                  aria-label="Delete layout"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {savedLayouts.length === 0 && (
        <div className="empty-state">No saved layouts</div>
      )}
    </div>
  );
}
