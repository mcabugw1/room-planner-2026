import { useState, useEffect } from 'react';

export type DeviceType = 'phone' | 'tablet' | 'desktop';

function detect(): DeviceType {
  const touch = navigator.maxTouchPoints > 0;
  const w = window.innerWidth;
  if (touch && w < 768) return 'phone';
  if (touch && w < 1024) return 'tablet';
  return 'desktop';
}

export function useDeviceType(): DeviceType {
  const [device, setDevice] = useState<DeviceType>(detect);
  useEffect(() => {
    const handler = () => setDevice(detect());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return device;
}
