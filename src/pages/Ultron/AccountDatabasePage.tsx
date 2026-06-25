/* ─────────────────────────────────────────────────────────────────────────────
   Ultron — Account database (DEMO STUB).
   Placeholder destination for the "Account database" toggle. No real data
   source is wired — this just confirms the collection selection.
   ───────────────────────────────────────────────────────────────────────────── */

import styled from 'styled-components';
import { Badge, BankIcon } from 'alloy-design-system';
import { ACCOUNT_COLLECTIONS } from './AccountDbSidebar';

interface AccountDatabasePageProps {
  collectionId: string;
}

export function AccountDatabasePage({ collectionId }: AccountDatabasePageProps) {
  const collection = ACCOUNT_COLLECTIONS.find(c => c.id === collectionId) ?? ACCOUNT_COLLECTIONS[0];

  return (
    <Page>
      <Header>
        <Title>{collection.label}</Title>
        <Badge>Account database</Badge>
      </Header>
      <Placeholder role="status">
        <Glyph aria-hidden="true"><BankIcon size={24} /></Glyph>
        <PlaceholderTitle>{collection.label} — demo stub</PlaceholderTitle>
        <PlaceholderDesc>
          Connect a data source to browse {collection.label.toLowerCase()}. This Account
          database surface is a placeholder for the demo.
        </PlaceholderDesc>
      </Placeholder>
    </Page>
  );
}

// ── Styled ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-8) var(--space-4);
  @media (min-width: 1001px) {
    padding-left: 120px;
    padding-right: 120px;
  }
  height: 100%;
  min-height: 0;
  font-family: var(--font-sans);
  color: var(--color-content-primary);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
`;

const Title = styled.h1`
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
`;

const Placeholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-16) var(--space-6);
  border: 1px dashed var(--color-border-opaque);
  border-radius: var(--radius-xl);
  text-align: center;
`;

const Glyph = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--space-12);
  height: var(--space-12);
  border-radius: var(--radius-full);
  background: var(--color-bg-secondary);
  color: var(--color-content-secondary);
`;

const PlaceholderTitle = styled.div`
  font-size: var(--text-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-content-secondary);
`;

const PlaceholderDesc = styled.div`
  font-size: var(--text-sm);
  color: var(--color-content-tertiary);
  max-width: 360px;
`;
