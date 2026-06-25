/* ─────────────────────────────────────────────────────────────────────────────
   Ultron — secondary-nav body (Account database toggle state).
   A mock list of account collections. DEMO stub — selecting one shows a
   placeholder in the main area.
   ───────────────────────────────────────────────────────────────────────────── */

import styled from 'styled-components';
import type { ReactNode } from 'react';
import {
  ListItem,
  Users03Icon, ClockIcon, Map01Icon, ClipboardCheckIcon, CheckVerified01Icon,
} from 'alloy-design-system';

export interface AccountCollection {
  id: string;
  label: string;
  icon: ReactNode;
}

export const ACCOUNT_COLLECTIONS: AccountCollection[] = [
  { id: 'employees',   label: 'Employees',   icon: <Users03Icon size={16} /> },
  { id: 'shifts',      label: 'Shifts',      icon: <ClockIcon size={16} /> },
  { id: 'locations',   label: 'Locations',   icon: <Map01Icon size={16} /> },
  { id: 'timesheets',  label: 'Timesheets',  icon: <ClipboardCheckIcon size={16} /> },
  { id: 'credentials', label: 'Credentials', icon: <CheckVerified01Icon size={16} /> },
];

interface AccountDbSidebarProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function AccountDbSidebar({ selectedId, onSelect }: AccountDbSidebarProps) {
  return (
    <Body>
      <GroupLabel>Collections</GroupLabel>
      {ACCOUNT_COLLECTIONS.map(c => (
        <ListItem
          key={c.id}
          label={<RowLabel>{c.label}</RowLabel>}
          leadingSlot={c.icon}
          selected={selectedId === c.id}
          onClick={() => onSelect(c.id)}
          divider={false}
          size="md"
          aria-current={selectedId === c.id ? 'page' : undefined}
        />
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
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3) var(--space-4);
`;

const GroupLabel = styled.span`
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-content-tertiary);
  padding: 0 var(--space-2);
  margin-bottom: var(--space-1);
`;

const RowLabel = styled.span`
  color: var(--color-content-secondary);
`;
