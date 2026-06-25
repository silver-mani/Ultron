/* ─────────────────────────────────────────────────────────────────────────────
   Ultron — Decision list (pinned zone)

   A vertical list of decision cards (no pagination / stacking). The first card
   is expanded by default; the rest start collapsed. Each card can be toggled
   independently. Acting on a card transitions it (→ in_progress), animates it
   out, and it leaves the list (it reappears in the stream).

   Card bodies are hand-composed from Alloy primitives (Avatar, Button, Eyebrow,
   AIActivityTrail, AIAssistantMessage) per the feature spec — NOT the Alloy
   `Ultron*` card suite (that reuse path was explicitly declined for this build).
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  Button, Eyebrow, Badge, ArrowUpRightIcon,
} from 'alloy-design-system';
import { Avatar } from '../../components/Avatar';
import type { ThreadItem } from './types';
import { isRefinementAction, CaseBody } from './ultronShared';
import { THREAD_SUBJECTS, threadAvatarUrl } from './fixtures';

// Matches --duration-slow (250ms): the JS commit waits for the CSS exit
// transition to finish before the thread leaves the list. No invented easing.
const EXIT_MS = 250;

interface DecisionDeckProps {
  /** Deck threads, pre-sorted (severity → approval-before-recommended → recency). */
  deck: ThreadItem[];
  /** Commit the primary/secondary action: transition the case + demote it. */
  onAction: (threadId: string, actionLabel: string) => void;
  /** Refinement stub (e.g. "Review Plan", "Other"): toast only, no transition. */
  onRefinement: (actionLabel: string) => void;
}

export function DecisionDeck({ deck, onAction, onRefinement }: DecisionDeckProps) {
  // First card expanded by default; the rest collapsed. Toggling is free after.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(deck[0] ? [deck[0].id] : []),
  );
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const exitTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const timers = exitTimers.current;
    return () => { timers.forEach(t => clearTimeout(t)); };
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const triggerAction = (thread: ThreadItem, label: string) => {
    if (isRefinementAction(label)) {
      onRefinement(label);
      return;
    }
    // Play the exit transition, then commit so the card animates out and the
    // list closes the gap.
    setExitingIds(prev => new Set(prev).add(thread.id));
    const t = setTimeout(() => {
      setExitingIds(prev => { const n = new Set(prev); n.delete(thread.id); return n; });
      exitTimers.current.delete(thread.id);
      onAction(thread.id, label);
    }, EXIT_MS);
    exitTimers.current.set(thread.id, t);
  };

  if (deck.length === 0) {
    return (
      <Zone aria-label="Decisions">
        <DeckHeader>
          <Eyebrow>Needs your decision</Eyebrow>
        </DeckHeader>
        <EmptyState role="status">
          <EmptyTitle>Nothing needs your decision</EmptyTitle>
          <EmptyDesc>Ultron is monitoring activity and will surface anything that needs you here.</EmptyDesc>
        </EmptyState>
      </Zone>
    );
  }

  return (
    <Zone aria-label="Decisions">
      <DeckHeader>
        <Eyebrow>Needs your decision</Eyebrow>
        <Badge>{deck.length}</Badge>
      </DeckHeader>
      <CardList>
        {deck.map(thread => (
          <DecisionCard
            key={thread.id}
            thread={thread}
            expanded={expandedIds.has(thread.id)}
            exiting={exitingIds.has(thread.id)}
            onToggle={() => toggleExpand(thread.id)}
            onAction={label => triggerAction(thread, label)}
            onRefinement={onRefinement}
          />
        ))}
      </CardList>
    </Zone>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────

interface DecisionCardProps {
  thread: ThreadItem;
  expanded: boolean;
  exiting: boolean;
  onToggle: () => void;
  onAction: (label: string) => void;
  onRefinement: (label: string) => void;
}

function DecisionCard({ thread, expanded, exiting, onToggle, onAction, onRefinement }: DecisionCardProps) {
  // Primary action is the last entry; render it first as the filled pill.
  const primaryLabel = thread.actions[thread.actions.length - 1];
  const secondaryLabels = thread.actions.slice(0, -1);

  return (
    <Card data-exiting={exiting || undefined} data-severity={thread.severity}>
      <CardHeader>
        <HeaderLeft>
          <Glyph>
            <Avatar
              size="sm"
              src={threadAvatarUrl(thread.id)}
              name={THREAD_SUBJECTS[thread.id]}
              alt={THREAD_SUBJECTS[thread.id] ?? ''}
            />
          </Glyph>
          <HeaderTitle>{thread.title}</HeaderTitle>
        </HeaderLeft>
        <Button
          variant="ghost" size="xs"
          trailingArtwork={<ArrowUpRightIcon size={14} />}
          aria-expanded={expanded}
          onClick={onToggle}
        >
          {expanded ? 'Hide detail' : 'View detail'}
        </Button>
      </CardHeader>

      <CardBody>
        <Prompt>{thread.recommendation}</Prompt>

        {expanded && <CaseBody thread={thread} />}

        <Pills>
          {primaryLabel && (
            <Pill variant="primary" size="sm" onClick={() => onAction(primaryLabel)}>
              {primaryLabel}
            </Pill>
          )}
          {secondaryLabels.map(label => (
            <Pill key={label} variant="tertiary" size="sm" onClick={() => onAction(label)}>
              {label}
            </Pill>
          ))}
          <OtherPill variant="tertiary" size="sm" onClick={() => onRefinement('Other')}>
            Other
          </OtherPill>
        </Pills>
      </CardBody>
    </Card>
  );
}

// ── Styled ───────────────────────────────────────────────────────────────────

const Zone = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const DeckHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;

const CardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-opaque);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-below-low);
  overflow: hidden;
  transition:
    opacity var(--duration-slow) var(--ease-default),
    transform var(--duration-slow) var(--ease-default);

  /* Urgent decisions get a soft accent halo (matches the severity coloring
     used on the dots/tags elsewhere); routine ones stay neutral. */
  &[data-severity='high'] {
    border-color: var(--color-error-border);
    box-shadow: 0 0 0 var(--space-1) var(--color-error-bg), var(--shadow-below-low);
  }
  &[data-severity='medium'] {
    border-color: var(--color-warning-border);
    box-shadow: 0 0 0 var(--space-1) var(--color-warning-bg), var(--shadow-below-low);
  }

  &[data-exiting] {
    opacity: 0;
    transform: translateY(calc(-1 * var(--space-3))) scale(0.98);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: opacity var(--duration-fast) var(--ease-default);
    &[data-exiting] { transform: none; }
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  height: var(--space-8); /* 32px */
  padding: 0 var(--space-4);
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border-opaque);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
`;

const Glyph = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const HeaderTitle = styled.span`
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-snug);
  color: var(--color-content-primary);
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
`;

const Prompt = styled.p`
  margin: 0;
  font-family: var(--font-sans);
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-snug);
  color: var(--color-content-primary);
`;

const Pills = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
`;

const Pill = styled(Button)`
  border-radius: var(--radius-full);
`;

/* "Other" — a soft escape hatch (refinement surface, demo stub). */
const OtherPill = styled(Button)`
  border-radius: var(--radius-full);
  border-style: dashed;
  color: var(--color-content-secondary);
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-12) var(--space-6);
  border: 1px dashed var(--color-border-opaque);
  border-radius: var(--radius-xl);
  text-align: center;
`;

const EmptyTitle = styled.div`
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-content-secondary);
`;

const EmptyDesc = styled.div`
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-content-tertiary);
  max-width: 360px;
`;
