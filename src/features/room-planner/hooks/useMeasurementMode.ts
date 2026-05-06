import { useState } from 'react';

export function useMeasurementMode() {
  const [showNeighbors, setShowNeighbors] = useState(false);
  const [showPair, setShowPair] = useState(false);
  const [pairIds, setPairIds] = useState<[number | null, number | null]>([null, null]);

  function togglePair() {
    setShowPair(o => !o);
    setPairIds([null, null]);
  }

  function fillPairId(id: number) {
    setPairIds(prev => prev[0] === null ? [id, null] : [prev[0], id]);
  }

  return {
    showNeighbors, setShowNeighbors,
    showPair,
    pairIds, setPairIds,
    togglePair,
    fillPairId,
  };
}
