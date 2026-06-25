/* ─────────────────────────────────────────────────────────────────────────────
   Ultron — Thread Stream row.

   ListItem-based row + a locally-built inline expansion. Alloy's <Accordion>
   was evaluated and declined for the row: its AccordionItem forces the chevron
   to the LEFT and lays a full-row hit-target button over the header, so the
   required row layout (leading severity dot → title → capability → StatusTag →
   inline action buttons → trailing chevron) and the click-without-toggling
   inline buttons can't live in its header slot. So we compose the header from
   <ListItem> and render the expansion body as a sibling, toggled in place.
   ───────────────────────────────────────────────────────────────────────────── */

import styled from 'styled-components';
import {
  ListItem, StatusTag, Button, AILoader,
  ChevronRightIcon, Save01Icon,
} from 'alloy-design-system';
import type { ThreadItem } from './types';
import {
  STATUS_META, isPurpleRow, isRefinementAction, CaseBody,
} from './ultronShared';

interface ThreadStreamRowProps {
  thread: ThreadItem;
  expanded: boolean;
  onToggle: (id: string) => void;
  onAction: (threadId: string, actionLabel: string) => void;
  onRefinement: (actionLabel: string) => void;
  onSaveWorkflow: (thread: ThreadItem) => void;
}

export function ThreadStreamRow({
  thread, expanded, onToggle, onAction, onRefinement, onSaveWorkflow,
}: ThreadStreamRowProps) {
  const purple = isPurpleRow(thread);
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const trailing = (
    <Trailing>
      {/* recommended rows surface their actions inline (last = primary) */}
      {thread.status === 'recommended' && thread.actions.map((label, i) => (
        <Button
          key={label}
          size="xs"
          variant={i === thread.actions.length - 1 ? 'primary' : 'secondary'}
          onClick={(e) => {
            stop(e);
            if (isRefinementAction(label)) onRefinement(label);
            else onAction(thread.id, label);
          }}
        >
          {label}
        </Button>
      ))}

      {purple && (
        <Button
          size="sm"
          variant="secondary"
          leadingArtwork={<Save01Icon size={14} />}
          onClick={(e) => { stop(e); onSaveWorkflow(thread); }}
        >
          Save as workflow
        </Button>
      )}

      {thread.status === 'in_progress' && (
        <AILoader size="sm" variant="gradient" state="loading" aria-label="Working" />
      )}
      {thread.status === 'auto_resolved' && (
        <AILoader size="xs" variant="gradient" state="ready" aria-label="Resolved by Ultron" />
      )}

      <StatusTag status={STATUS_META[thread.status].tag} size="sm">
        {STATUS_META[thread.status].label}
      </StatusTag>

      <ChevronWrap data-expanded={expanded || undefined} aria-hidden="true">
        <ChevronRightIcon size={16} />
      </ChevronWrap>
    </Trailing>
  );

  return (
    <RowShell data-purple={purple || undefined}>
      <ListItem
        label={thread.title}
        description={thread.capability}
        leadingSlot={<SeverityDot data-severity={thread.severity} aria-hidden="true" />}
        trailingSlot={trailing}
        divider={false}
        interactive
        selected={expanded}
        aria-expanded={expanded}
        onClick={() => onToggle(thread.id)}
      />
      {expanded && (
        <ExpansionBody>
          <CaseBody thread={thread} />
        </ExpansionBody>
      )}
    </RowShell>
  );
}

// ── Styled ───────────────────────────────────────────────────────────────────

const RowShell = styled.div`
  border-radius: var(--radius-md);
  border: 1px solid transparent;

  &[data-purple] {
    background: var(--color-purple-bg-tertiary);
    border-color: var(--color-purple-border-tertiary);
  }
`;

const SeverityDot = styled.span`
  display: inline-block;
  width: var(--space-2);
  height: var(--space-2);
  border-radius: var(--radius-full);
  background: var(--color-slate-bg-secondary);

  &[data-severity='high']   { background: var(--color-error-fill); }
  &[data-severity='medium'] { background: var(--color-warning-fill); }
  &[data-severity='low']    { background: var(--color-slate-bg-secondary); }
  &[data-severity='none']   { background: var(--color-slate-bg-tertiary); }
`;

const Trailing = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;

const ChevronWrap = styled.span`
  display: inline-flex;
  color: var(--color-content-tertiary);
  transition: transform var(--duration-base) var(--ease-default);
  &[data-expanded] { transform: rotate(90deg); }
`;

const ExpansionBody = styled.div`
  padding: var(--space-2) var(--space-4) var(--space-5) var(--space-6);
`;
