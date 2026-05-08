import { useEffect } from 'react';

export function useVirtualKeyboard(): void {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    function update() {
      const offset = Math.max(0, window.innerHeight - vv!.height - vv!.offsetTop);
      document.documentElement.style.setProperty('--keyboard-offset', `${offset}px`);
    }

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv!.removeEventListener('resize', update);
      vv!.removeEventListener('scroll', update);
      document.documentElement.style.removeProperty('--keyboard-offset');
    };
  }, []);
}
