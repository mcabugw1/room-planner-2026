import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Manages draft string state for a ft+in input pair.
 * Allows intermediate values (e.g. "1" en route to "12") without snapping back.
 * Commits to setDims only when both fields hold valid numbers.
 * Resets to committed values on blur; syncs from props when not focused.
 */
export function useDimInput(
  ft: number,
  inch: number,
  setDims: (ft: number, inch: number) => void,
) {
  const [draftFt, setDraftFt] = useState(String(ft));
  const [draftIn, setDraftIn] = useState(String(inch));
  const ftFocused = useRef(false);
  const inFocused = useRef(false);

  useEffect(() => {
    if (!ftFocused.current) setDraftFt(String(ft));
    if (!inFocused.current) setDraftIn(String(inch));
  }, [ft, inch]);

  const tryCommit = useCallback(
    (rawFt: string, rawIn: string) => {
      const ftN = Number(rawFt);
      const inN = Number(rawIn);
      if (rawFt !== '' && rawIn !== '' && !isNaN(ftN) && !isNaN(inN)) {
        setDims(ftN, inN);
      }
    },
    [setDims],
  );

  const ftProps = {
    value: draftFt,
    onChange: useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setDraftFt(e.target.value);
        tryCommit(e.target.value, draftIn);
      },
      [draftIn, tryCommit],
    ),
    onFocus: () => { ftFocused.current = true; },
    onBlur: () => { ftFocused.current = false; setDraftFt(String(ft)); },
  };

  const inProps = {
    value: draftIn,
    onChange: useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setDraftIn(e.target.value);
        tryCommit(draftFt, e.target.value);
      },
      [draftFt, tryCommit],
    ),
    onFocus: () => { inFocused.current = true; },
    onBlur: () => { inFocused.current = false; setDraftIn(String(inch)); },
  };

  return { ftProps, inProps };
}
