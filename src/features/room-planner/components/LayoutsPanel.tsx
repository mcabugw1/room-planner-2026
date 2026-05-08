import { useState } from 'react';
import type { SavedLayoutMeta } from '../hooks/useLayoutPersistence';

interface Props {
  savedLayouts: SavedLayoutMeta[];
  dbError: string | null;
  onSave: (name: string) => Promise<void>;
  onLoad: (id: number) => Promise<void>;
  onRename: (id: number, name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onClearError: () => void;
}

function defaultName() {
  return `Layout ${new Date().toLocaleDateString()}`;
}

export default function LayoutsPanel({ savedLayouts, dbError, onSave, onLoad, onRename, onDelete, onClearError }: Props) {
  const [saveName, setSaveName] = useState('');
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  async function handleSave() {
    if (isSaving) return;
    setIsSaving(true);
    const name = saveName.trim() || defaultName();
    try {
      await onSave(name);
      setSaveName('');
    } finally {
      setIsSaving(false);
    }
  }

  function startRename(id: number, currentName: string) {
    setRenamingId(id);
    setRenameValue(currentName);
  }

  async function commitRename(id: number) {
    const name = renameValue.trim();
    setRenamingId(null);
    if (name) await onRename(id, name);
  }

  async function handleLoad(id: number) {
    if (loadingId !== null) return;
    setLoadingId(id);
    try {
      await onLoad(id);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await onDelete(id);
  }

  return (
    <div>
      {dbError && (
        <div className="db-error-banner" role="alert">
          <span style={{ flex: 1 }}>{dbError}</span>
          <button onClick={onClearError} aria-label="Dismiss error">×</button>
        </div>
      )}

      <div className="field-row">
        <input
          type="text"
          className="input"
          placeholder={defaultName()}
          value={saveName}
          maxLength={60}
          onChange={e => setSaveName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          aria-label="Layout name"
        />
      </div>
      <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Saving…' : 'Save layout'}
      </button>

      {savedLayouts.length > 0 && (
        <div className="layout-list">
          {savedLayouts.map(layout => (
            <div key={layout.id} className="layout-item">
              {renamingId === layout.id ? (
                <input
                  className="input"
                  autoFocus
                  maxLength={60}
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitRename(layout.id);
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  onBlur={() => commitRename(layout.id)}
                  aria-label="Rename layout"
                />
              ) : (
                <div className="layout-item-header">
                  <span className="layout-item-name" title={layout.name}>
                    {layout.name}
                  </span>
                  <span className="layout-item-date">
                    {new Date(layout.savedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="layout-item-actions">
                <button
                  className="btn-toggle"
                  onClick={() => handleLoad(layout.id)}
                  disabled={loadingId !== null}
                  aria-label={`Load ${layout.name}`}
                >
                  {loadingId === layout.id ? 'Loading…' : 'Load'}
                </button>
                <button
                  className="btn-toggle"
                  onClick={() => startRename(layout.id, layout.name)}
                  disabled={loadingId !== null}
                  aria-label={`Rename ${layout.name}`}
                >
                  Rename
                </button>
                <button
                  className="feature-remove"
                  onClick={() => handleDelete(layout.id, layout.name)}
                  aria-label={`Delete ${layout.name}`}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {savedLayouts.length === 0 && (
        <div className="empty-state">No saved layouts. Enter a name above and click Save layout.</div>
      )}
    </div>
  );
}
