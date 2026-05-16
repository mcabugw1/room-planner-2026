import { useState, useCallback } from 'react';
import type { FurnitureItem, RoomFeature, RoomLayout, FengShuiConfig } from '../types/room';
import type { FengShuiIssue } from '../feng-shui/types';
import { analyze } from '../feng-shui/engine';

export function useFengShuiEngine() {
  const [issues, setIssues] = useState<FengShuiIssue[] | null>(null);

  const run = useCallback((
    furniture: FurnitureItem[],
    features: RoomFeature[],
    layout: RoomLayout,
    config: FengShuiConfig,
  ) => {
    setIssues(analyze(furniture, features, layout, config));
  }, []);

  const reset = useCallback(() => setIssues(null), []);

  return { issues, run, reset };
}
