// Generic `window.matchMedia` subscription hook. Returns true when the
// query currently matches and updates synchronously when it changes.
// `MOBILE_BREAKPOINT_PX` is the single source of truth for the mobile
// breakpoint — shell chooser, sheets, drawer, and tests all import from
// here so there's no drift.

import { useEffect, useState } from 'react';

export const MOBILE_BREAKPOINT_PX = 768;
export const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`;

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Sync current value in case the query string changed.
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** Shorthand for the mobile breakpoint used across the app shell. */
export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_MEDIA_QUERY);
}
