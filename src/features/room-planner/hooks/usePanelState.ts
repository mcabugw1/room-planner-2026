import { useState } from 'react';
import type { DeviceType } from './useDeviceType';

export function usePanelState(deviceType: DeviceType = 'desktop') {
  const isPhone = deviceType === 'phone';
  const [layoutsOpen,       setLayoutsOpen]       = useState(!isPhone);
  const [dimOpen,           setDimOpen]            = useState(!isPhone);
  const [gridOpen,          setGridOpen]           = useState(false);
  const [propOpen,          setPropOpen]           = useState(!isPhone);
  const [wallFeatOpen,      setWallFeatOpen]       = useState(false);
  const [measureOpen,       setMeasureOpen]        = useState(false);
  const [legendOpen,        setLegendOpen]         = useState(!isPhone);
  const [mobileSidebarOpen, setMobileSidebarOpen]  = useState(false);
  const [viewMode,          setViewMode]           = useState<'floor' | '3d' | 'feng-shui'>('floor');

  return {
    layoutsOpen,  toggleLayouts:  () => setLayoutsOpen(o => !o),
    dimOpen,      toggleDim:      () => setDimOpen(o => !o),
    gridOpen,     toggleGrid:     () => setGridOpen(o => !o),
    propOpen,     toggleProp:     () => setPropOpen(o => !o),
    wallFeatOpen, toggleWallFeat: () => setWallFeatOpen(o => !o),
    measureOpen,  toggleMeasure:  () => setMeasureOpen(o => !o),
    legendOpen,   toggleLegend:   () => setLegendOpen(o => !o),
    mobileSidebarOpen, setMobileSidebarOpen,
    viewMode, setViewMode,
  };
}
