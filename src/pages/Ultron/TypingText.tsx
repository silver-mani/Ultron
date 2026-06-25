/* ─────────────────────────────────────────────────────────────────────────────
   Ultron — TypingText.
   Reveals a string one character at a time, with a blinking caret while it
   types, then settles to the full static text. Used for the secondary-nav row
   of a case Ultron has just detected — the title "types in" as the risk lands.
   Types once per `text`; honours prefers-reduced-motion (shows it in full).
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

/** Per-character reveal cadence. */
const TYPE_MS = 45;

export function TypingText({ text, className }: { text: string; className?: string }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    const reduced = (() => {
      try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
    })();
    if (reduced) { setN(text.length); return; }
    setN(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) clearInterval(id);
    }, TYPE_MS);
    return () => clearInterval(id);
  }, [text]);

  const done = n >= text.length;
  return (
    <Type className={className}>
      {text.slice(0, n)}
      {!done && <Caret aria-hidden="true">|</Caret>}
    </Type>
  );
}

// ── Styled ───────────────────────────────────────────────────────────────────

const Type = styled.span`
  white-space: nowrap;
`;

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50%      { opacity: 0; }
`;

/* Thin caret that blinks while the title types out. Inherits the row's color. */
const Caret = styled.span`
  display: inline-block;
  margin-left: 1px;
  font-weight: var(--font-weight-regular);
  animation: ${blink} 1s steps(1) infinite;

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`;
