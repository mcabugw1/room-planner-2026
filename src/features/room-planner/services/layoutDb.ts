import type { RoomFeature } from '../types/room';
import type { FurnitureItem } from '../hooks/useFurniture';

export interface LayoutSnapshot {
  widthIn: number;
  heightIn: number;
  features: RoomFeature[];
  furniture: FurnitureItem[];
}

export interface SavedLayout {
  id: number;
  name: string;
  savedAt: number;
  data: LayoutSnapshot;
}

const DB_NAME = 'room-planner';
const DB_VERSION = 1;
const LAYOUTS_STORE = 'layouts';
const AUTOSAVE_STORE = 'autosave';
const AUTOSAVE_KEY = 'current';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(AUTOSAVE_STORE)) {
        db.createObjectStore(AUTOSAVE_STORE);
      }
      if (!db.objectStoreNames.contains(LAYOUTS_STORE)) {
        db.createObjectStore(LAYOUTS_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  db: IDBDatabase,
  stores: string | string[],
  mode: IDBTransactionMode,
  fn: (tx: IDBTransaction) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(stores, mode);
    const req = fn(t);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getAutosave(): Promise<LayoutSnapshot | null> {
  const db = await openDB();
  const result = await tx<LayoutSnapshot | undefined>(
    db, AUTOSAVE_STORE, 'readonly',
    t => t.objectStore(AUTOSAVE_STORE).get(AUTOSAVE_KEY),
  );
  return result ?? null;
}

export async function saveAutosave(snapshot: LayoutSnapshot): Promise<void> {
  const db = await openDB();
  await tx<IDBValidKey>(
    db, AUTOSAVE_STORE, 'readwrite',
    t => t.objectStore(AUTOSAVE_STORE).put(snapshot, AUTOSAVE_KEY),
  );
}

export async function listLayouts(): Promise<Omit<SavedLayout, 'data'>[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(LAYOUTS_STORE, 'readonly');
    const req = t.objectStore(LAYOUTS_STORE).getAll();
    req.onsuccess = () =>
      resolve((req.result as SavedLayout[]).map(({ id, name, savedAt }) => ({ id, name, savedAt })));
    req.onerror = () => reject(req.error);
  });
}

export async function saveLayout(name: string, snapshot: LayoutSnapshot): Promise<number> {
  const db = await openDB();
  const record = { name, savedAt: Date.now(), data: snapshot };
  const id = await tx<IDBValidKey>(
    db, LAYOUTS_STORE, 'readwrite',
    t => t.objectStore(LAYOUTS_STORE).add(record),
  );
  return id as number;
}

export async function loadLayout(id: number): Promise<LayoutSnapshot | null> {
  const db = await openDB();
  const result = await tx<SavedLayout | undefined>(
    db, LAYOUTS_STORE, 'readonly',
    t => t.objectStore(LAYOUTS_STORE).get(id),
  );
  return result?.data ?? null;
}

export async function renameLayout(id: number, name: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(LAYOUTS_STORE, 'readwrite');
    const store = t.objectStore(LAYOUTS_STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const record = getReq.result as SavedLayout;
      const putReq = store.put({ ...record, name });
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function deleteLayout(id: number): Promise<void> {
  const db = await openDB();
  await tx<undefined>(
    db, LAYOUTS_STORE, 'readwrite',
    t => t.objectStore(LAYOUTS_STORE).delete(id),
  );
}
