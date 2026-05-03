import { useState } from 'react';
import type { WallSide } from '../types/room';
import type { AddableFeature } from './useWallFeatures';

export function useRoomUI() {
  const [layoutsOpen,  setLayoutsOpen]  = useState(true);
  const [dimOpen,      setDimOpen]      = useState(true);
  const [gridOpen,     setGridOpen]     = useState(false);
  const [propOpen,     setPropOpen]     = useState(true);
  const [wallFeatOpen, setWallFeatOpen] = useState(false);
  const [measureOpen,  setMeasureOpen]  = useState(false);
  const [legendOpen,   setLegendOpen]   = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [newFeatType,     setNewFeatType]     = useState<'window' | 'door-swing' | 'wall-segment'>('window');
  const [newFeatWall,     setNewFeatWall]     = useState<WallSide>('bottom');
  const [newFeatOffset,   setNewFeatOffset]   = useState(12);
  const [newFeatLength,   setNewFeatLength]   = useState(36);
  const [newFeatHinge,    setNewFeatHinge]    = useState<'left' | 'right'>('left');
  const [newFeatSwingDir, setNewFeatSwingDir] = useState<'in' | 'out'>('in');

  function buildFeature(): AddableFeature {
    if (newFeatType === 'window') {
      return { type: 'window', wall: newFeatWall, offsetIn: newFeatOffset, lengthIn: newFeatLength };
    }
    if (newFeatType === 'wall-segment') {
      return { type: 'wall-segment', wall: newFeatWall, offsetIn: newFeatOffset, lengthIn: newFeatLength };
    }
    return {
      type: 'door-swing',
      wall: newFeatWall,
      offsetIn: newFeatOffset,
      swingIn: newFeatLength,
      hingeDirection: newFeatHinge,
      swingDirection: newFeatSwingDir,
    };
  }

  return {
    layoutsOpen,  toggleLayouts:  () => setLayoutsOpen(o => !o),
    dimOpen,      toggleDim:      () => setDimOpen(o => !o),
    gridOpen,     toggleGrid:     () => setGridOpen(o => !o),
    propOpen,     toggleProp:     () => setPropOpen(o => !o),
    wallFeatOpen, toggleWallFeat: () => setWallFeatOpen(o => !o),
    measureOpen,  toggleMeasure:  () => setMeasureOpen(o => !o),
    legendOpen,   toggleLegend:   () => setLegendOpen(o => !o),
    mobileSidebarOpen, setMobileSidebarOpen,
    newFeatType, setNewFeatType,
    newFeatWall, setNewFeatWall,
    newFeatOffset, setNewFeatOffset,
    newFeatLength, setNewFeatLength,
    newFeatHinge, setNewFeatHinge,
    newFeatSwingDir, setNewFeatSwingDir,
    buildFeature,
  };
}
