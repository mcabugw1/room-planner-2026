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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRestoredRef = useRef(false);

  useEffect(() => {
    getAutosave().then(saved => {
      if (saved) onRestore(saved);
      setIsRestored(true);
      isRestoredRef.current = true;
    });
    listLayouts().then(setSavedLayouts);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isRestoredRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveAutosave(snapshot);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [snapshot]);

  const saveNamed = useCallback(async (name: string) => {
    await saveLayout(name, snapshot);
    const updated = await listLayouts();
    setSavedLayouts(updated);
  }, [snapshot]);

  const loadNamed = useCallback(async (id: number) => {
    return loadLayout(id);
  }, []);

  const renameSaved = useCallback(async (id: number, name: string) => {
    await renameLayout(id, name);
    setSavedLayouts(prev => prev.map(l => l.id === id ? { ...l, name } : l));
  }, []);

  const deleteSaved = useCallback(async (id: number) => {
    await deleteLayout(id);
    setSavedLayouts(prev => prev.filter(l => l.id !== id));
  }, []);

  return { savedLayouts, isRestored, saveNamed, loadNamed, renameSaved, deleteSaved };
}
