/* ─────────────────────────────────────────────────────────────────────────────
   Ultron — identity card.
   Sits at the top of the Ultron secondary-nav body. Shows the Ultron identity
   (animated gradient mark) over a soft drifting "working" aurora, with a status
   line that cycles through what Ultron is doing — typing-style, reusing the
   slide-up + blinking-ellipsis motion of the live activity trail.
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { AgentMark } from './AgentMark';

const STATUS_MESSAGES = [
  'Monitoring 142 active shifts',
  'Scanning for coverage risks',
  'Analyzing attendance trends',
  'Optimizing open orders',
];

const STATUS_INTERVAL_MS = 2800;

/** `hideActivity` drops the cycling "what Ultron is doing" status line — used on
 *  the Live landing, where that presence is already shown by the page itself. */
export function UltronIdentityCard({ hideActivity }: { hideActivity?: boolean }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (hideActivity) return;
    const t = setInterval(() => setI(x => (x + 1) % STATUS_MESSAGES.length), STATUS_INTERVAL_MS);
    return () => clearInterval(t);
  }, [hideActivity]);

  return (
    <Card>
      <Content>
        {/* On the Live landing (activity line hidden) the card collapses to a
            compact identity row, so the mark shrinks to keep the header short. */}
        <AgentMark mark="circle" size={hideActivity ? 36 : 48} tone="auto" state="active" aria-label="Ultron" />
        <TextGroup>
          <Name>Ultron</Name>
          {!hideActivity && (
            <Status role="status" aria-live="polite">
              {/* Text + dots share one keyed line so they slide up + fade in
                  together on each swap; the dots keep their own blink inside. */}
              <StatusLine key={i}>
                <StatusText>{STATUS_MESSAGES[i]}</StatusText>
                <Dots aria-hidden="true"><span>.</span><span>.</span><span>.</span></Dots>
              </StatusLine>
            </Status>
          )}
        </TextGroup>
      </Content>
    </Card>
  );
}

// ── Styled ───────────────────────────────────────────────────────────────────

const Card = styled.div`
  font-family: var(--font-sans);
`;

/* Mark on the left, text column on the right — vertically centered. */
const Content = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;

/* Title + status line share one left edge, stacked. */
const TextGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
`;

const Name = styled.span`
  min-width: 0;
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--tracking-wide);
  color: var(--color-content-primary);
`;

const Status = styled.div`
  display: flex;
  align-items: baseline;
  min-height: var(--space-4);
`;

/* Each status line slides up + fades in as it swaps (keyed remount). The text
   AND its trailing dots ride this one element, so they move together. */
const statusIn = keyframes`
  from { opacity: 0; transform: translateY(var(--space-2)); }
  to   { opacity: 1; transform: translateY(0); }
`;

const StatusLine = styled.span`
  display: inline-flex;
  align-items: baseline;
  min-width: 0;
  animation: ${statusIn} var(--duration-slow) var(--ease-out);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const StatusText = styled.span`
  font-size: var(--text-xs);
  color: var(--color-content-tertiary);
`;

/* Animated trailing ellipsis — three dots blink in sequence (typing). */
const blink = keyframes`
  0%, 100% { opacity: 0.2; }
  50%      { opacity: 1; }
`;

const Dots = styled.span`
  font-size: var(--text-xs);
  color: var(--color-content-tertiary);

  & > span {
    animation: ${blink} 1.2s ease-in-out infinite;
  }
  & > span:nth-child(2) { animation-delay: 0.15s; }
  & > span:nth-child(3) { animation-delay: 0.3s; }

  @media (prefers-reduced-motion: reduce) {
    & > span { animation: none; }
  }
`;
