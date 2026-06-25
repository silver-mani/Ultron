/* ─────────────────────────────────────────────────────────────────────────────
   Ultron — Record card.
   A compact context reference to the record a question is about (worker, shift,
   location, policy…): avatar + role eyebrow + title + dot-separated meta, with
   an open-record affordance. Bordered, rounded, sits under the prompt.
   ───────────────────────────────────────────────────────────────────────────── */

import styled from 'styled-components';
import { Avatar, Button, ArrowUpRightIcon } from 'alloy-design-system';
import type { RecordRef } from './fixtures';
import { threadAvatarUrl } from './fixtures';

/** Semantic tone for a match score: stronger matches read greener, weaker ones
 *  step down through blue → amber → slate. */
function matchTone(score: number): 'green' | 'blue' | 'orange' | 'slate' {
  if (score >= 90) return 'green';
  if (score >= 80) return 'blue';
  if (score >= 70) return 'orange';
  return 'slate';
}

export function RecordCard({ record }: { record: RecordRef }) {
  // Lift a "NN% match" meta segment out of the inline dot-list and show it as a
  // trailing, score-coloured badge; the rest of the meta stays inline.
  const matchSeg = record.meta.find(m => /^\d+%\s*match$/i.test(m));
  const score = matchSeg ? parseInt(matchSeg, 10) : null;
  const rest = matchSeg ? record.meta.filter(m => m !== matchSeg) : record.meta;
  return (
    <Card>
      <Avatar size="md" src={threadAvatarUrl(record.avatarSeed)} name={record.title} alt={record.title} />
      <Body>
        <Title>{record.title}</Title>
        {/* Two-line card: the role eyebrow is folded into the meta line as its
            first segment rather than sitting on its own row. */}
        <Meta>{[record.eyebrow, ...rest].join(' · ')}</Meta>
      </Body>
      {score != null && <MatchBadge data-tone={matchTone(score)}>{score}% match</MatchBadge>}
      <Button variant="ghost" size="xs" iconOnly aria-label="Open record">
        <ArrowUpRightIcon size={16} />
      </Button>
    </Card>
  );
}

// ── Styled ───────────────────────────────────────────────────────────────────

const Card = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-opaque);
  /* 6px — the design system's --radius-button is the 6px step. */
  border-radius: var(--radius-button);
  font-family: var(--font-sans);
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
  flex: 1;
`;

const Title = styled.span`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-snug);
  color: var(--color-content-primary);
`;

const Meta = styled.span`
  font-size: var(--text-xs);
  line-height: var(--line-height-snug);
  color: var(--color-content-inverse-tertiary);
`;

/* Trailing match-score badge — a rounded pill whose fill/text follow the score's
   semantic tone (green = strong → slate = weak). Mirrors Alloy's Tag "subtle"
   variant: a light tinted surface (bg-tertiary) with dark on-tone text
   (content-primary) and a matching hairline (border-tertiary). */
const MatchBadge = styled.span`
  flex-shrink: 0;
  /* 2px keeps the pill tight vertically; Alloy has no 2px space token, but the
     4px grid still governs the horizontal padding. */
  padding: 2px var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-snug);
  white-space: nowrap;

  &[data-tone='green']  { background: var(--color-green-bg-tertiary);  border-color: var(--color-green-border-tertiary);  color: var(--color-green-content-primary); }
  &[data-tone='blue']   { background: var(--color-blue-bg-tertiary);   border-color: var(--color-blue-border-tertiary);   color: var(--color-blue-content-primary); }
  &[data-tone='orange'] { background: var(--color-orange-bg-tertiary); border-color: var(--color-orange-border-tertiary); color: var(--color-orange-content-primary); }
  &[data-tone='slate']  { background: var(--color-slate-bg-tertiary);  border-color: var(--color-slate-border-tertiary);  color: var(--color-slate-content-primary); }
`;
