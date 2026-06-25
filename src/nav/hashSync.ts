// Hash-based URL sync for Teambridge nav state.
//
// Format: #{activeId}/{secActiveId}[/persona/{id}][/page/{pageId}]
// Example: #ai-home/ai-personas/persona/erin
//
// The hook reads the hash once on mount and on `hashchange` (browser
// back/forward), and writes back via history.replaceState so routine
// secondary navigation doesn't pollute the history stack.

import { useEffect, useRef } from 'react';

export interface NavHashState {
  activeId: string;
  secActiveId: string;
  selectedPersonaId: string | null;
  activePageId: string | null;
}

export interface NavHashSetters {
  setActiveId: (id: string) => void;
  setSecActiveId: (id: string) => void;
  setSelectedPersonaId: (id: string | null) => void;
  setActivePageId: (id: string | null) => void;
}

export function encode(state: NavHashState): string {
  const parts: string[] = [state.activeId, state.secActiveId];
  if (state.selectedPersonaId) parts.push('persona', state.selectedPersonaId);
  if (state.activePageId) parts.push('page', state.activePageId);
  return '#' + parts.map(encodeURIComponent).join('/');
}

export function decode(hash: string): Partial<NavHashState> {
  const trimmed = hash.replace(/^#/, '').trim();
  if (!trimmed) return {};
  const segs = trimmed.split('/').map(s => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  });

  const out: Partial<NavHashState> = {};
  if (segs[0]) out.activeId = segs[0];
  if (segs[1]) out.secActiveId = segs[1];

  // Scan remaining segments for labeled pairs (order-independent).
  for (let i = 2; i < segs.length - 1; i += 2) {
    const key = segs[i];
    const val = segs[i + 1];
    if (key === 'persona') out.selectedPersonaId = val;
    else if (key === 'page') out.activePageId = val;
  }
  return out;
}

/**
 * Keeps `state` in sync with `window.location.hash`.
 * - On mount and on `hashchange`, applies any decoded fields via setters.
 * - When `state` changes, rewrites the hash with history.replaceState.
 */
export function useHashSync(
  state: NavHashState,
  setters: NavHashSetters,
): void {
  // Avoid re-applying an incoming hash that we just wrote ourselves, which
  // would cause a read→write→read loop on React strict-mode double renders.
  const lastWrittenRef = useRef<string>('');

  // ── Read on mount + on hashchange ────────────────────────────────────────
  useEffect(() => {
    const apply = () => {
      const parsed = decode(window.location.hash);
      if (parsed.activeId !== undefined) setters.setActiveId(parsed.activeId);
      if (parsed.secActiveId !== undefined) setters.setSecActiveId(parsed.secActiveId);
      setters.setSelectedPersonaId(parsed.selectedPersonaId ?? null);
      setters.setActivePageId(parsed.activePageId ?? null);
    };

    if (window.location.hash) apply();
    const onHashChange = () => {
      if (window.location.hash === lastWrittenRef.current) return;
      apply();
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
    // Setters are stable by convention (useState setters); re-running on
    // identity changes would reset the hash on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Write on state change ────────────────────────────────────────────────
  useEffect(() => {
    const next = encode(state);
    if (next === window.location.hash) return;
    lastWrittenRef.current = next;
    window.history.replaceState(null, '', next);
  }, [state.activeId, state.secActiveId, state.selectedPersonaId, state.activePageId]);
}
