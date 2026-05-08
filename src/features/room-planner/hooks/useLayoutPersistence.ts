import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getAutosave,
  saveAutosave,
  listLayouts,
  saveLayout,
  loadLayout,
  renameLayout,
  deleteLayout,
  type LayoutSnapshot,
} from '../services/layoutDb';

export type SavedLayoutMeta = { id: number; name: string; savedAt: number };

interface UseLayoutPersistenceReturn {
  savedLayouts: SavedLayoutMeta[];
  isRestored: boolean;
  dbError: string | null;
  clearDbError: () => void;
  saveNamed: (name: string) => Promise<void>;
  loadNamed: (id: number) => Promise<LayoutSnapshot | null>;
  renameSaved: (id: number, name: string) => Promise<void>;
  deleteSaved: (id: number) => Promise<void>;
}

const DEBOUNCE_MS = 500;

export function useLayoutPersistence(
  snapshot: LayoutSnapshot,
  onRestore: (snapshot: LayoutSnapshot) => void,
): UseLayoutPersistenceReturn {
  const [savedLayouts, setSavedLayouts] = useState<SavedLayoutMeta[]>([]);
  const [isRestored, setIsRestored] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRestoredRef = useRef(false);

  useEffect(() => {
    getAutosave()
      .then(saved => {
        if (saved) onRestore(saved);
        setIsRestored(true);
        isRestoredRef.current = true;
      })
      .catch(() => {
        setIsRestored(true);
        isRestoredRef.current = true;
        setDbError('Failed to load your previous session.');
      });

    listLayouts()
      .then(setSavedLayouts)
      .catch(() => setDbError('Failed to load saved layouts.'));
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isRestoredRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveAutosave(snapshot).catch(() => setDbError('Autosave failed. Your latest changes may not be saved.'));
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [snapshot]);

  const saveNamed = useCallback(async (name: string) => {
    try {
      await saveLayout(name, snapshot);
      const updated = await listLayouts();
      setSavedLayouts(updated);
      setDbError(null);
    } catch {
      setDbError('Failed to save layout. Storage may be full or unavailable.');
    }
  }, [snapshot]);

  const loadNamed = useCallback(async (id: number) => {
    try {
      const result = await loadLayout(id);
      setDbError(null);
      return result;
    } catch {
      setDbError('Failed to load layout.');
      return null;
    }
  }, []);

  const renameSaved = useCallback(async (id: number, name: string) => {
    try {
      await renameLayout(id, name);
      setSavedLayouts(prev => prev.map(l => l.id === id ? { ...l, name } : l));
      setDbError(null);
    } catch {
      setDbError('Failed to rename layout.');
    }
  }, []);

  const deleteSaved = useCallback(async (id: number) => {
    try {
      await deleteLayout(id);
      setSavedLayouts(prev => prev.filter(l => l.id !== id));
      setDbError(null);
    } catch {
      setDbError('Failed to delete layout.');
    }
  }, []);

  const clearDbError = useCallback(() => setDbError(null), []);

  return { savedLayouts, isRestored, dbError, clearDbError, saveNamed, loadNamed, renameSaved, deleteSaved };
}
