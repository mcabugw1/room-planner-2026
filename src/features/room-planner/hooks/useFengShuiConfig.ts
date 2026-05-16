import { useState } from 'react';
import type { FengShuiConfig } from '../types/room';

export function useFengShuiConfig(initial: FengShuiConfig | undefined) {
  const [config, setConfig] = useState<FengShuiConfig>(() => ({
    entryDoorId: initial?.entryDoorId ?? null,
    mode: initial?.mode ?? 'simple',
  }));

  function setEntryDoor(id: number | null) {
    setConfig(c => ({ ...c, entryDoorId: id }));
  }

  function setMode(mode: 'simple' | 'advanced') {
    setConfig(c => ({ ...c, mode }));
  }

  function reset(next: FengShuiConfig | undefined) {
    setConfig({
      entryDoorId: next?.entryDoorId ?? null,
      mode: next?.mode ?? 'simple',
    });
  }

  return { config, setEntryDoor, setMode, reset };
}
