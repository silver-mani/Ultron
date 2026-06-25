/* ─────────────────────────────────────────────────────────────────────────────
   Ultron — secondary-nav body (Ultron toggle state).
   Threads grouped into Needs attention / Live stream / Resolved. Selecting a
   thread opens it in the main detail view. Rendered via SecondaryNav's
   `bodyContent` slot, so it replaces the default menu.
   ───────────────────────────────────────────────────────────────────────────── */

import styled from 'styled-components';
import { ListItem, Badge } from 'alloy-design-system';
import type { UltronGroup } from './store';

interface UltronSidebarProps {
  groups: UltronGroup[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function UltronSidebar({ groups, selectedId, onSelect }: UltronSidebarProps) {
  return (
    <Body>
      {groups.map(group => (
        <Section key={group.id}>
          <GroupHeader>
            <GroupLabel>{group.label}</GroupLabel>
            <Badge>{group.threads.length}</Badge>
          </GroupHeader>
          {group.threads.length === 0 ? (
            <EmptyRow>Nothing here</EmptyRow>
          ) : (
            group.threads.map(t => (
              <ListItem
                key={t.id}
                label={<RowLabel>{t.name}</RowLabel>}
                leadingSlot={<Dot data-severity={t.severity} aria-hidden="true" />}
                selected={selectedId === t.id}
                onClick={() => onSelect(t.id)}
                divider={false}
                size="md"
                aria-current={selectedId === t.id ? 'page' : undefined}
              />
            ))
          )}
        </Section>
      ))}
    </Body>
  );
}

// ── Styled ───────────────────────────────────────────────────────────────────

const Body = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-2) var(--space-3) var(--space-4);
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const GroupHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-2);
  margin-bottom: var(--space-1);
`;

const GroupLabel = styled.span`
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-content-tertiary);
`;

const RowLabel = styled.span`
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-content-secondary);
`;

const Dot = styled.span`
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

const EmptyRow = styled.div`
  padding: var(--space-1) var(--space-2);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-content-tertiary);
`;
