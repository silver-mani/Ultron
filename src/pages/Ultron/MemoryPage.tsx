/* ─────────────────────────────────────────────────────────────────────────────
   Ultron — Memory.
   What Ultron has learned and carries between sessions: durable facts and
   preferences it applies when handling cases. DEMO ONLY — static content.
   ───────────────────────────────────────────────────────────────────────────── */

import styled from 'styled-components';
import { AgentMark } from './AgentMark';

interface Memory {
  title: string;
  detail: string;
  tag: string;
}

const MEMORIES: Memory[] = [
  { tag: 'Pattern',    title: 'Monday night call-outs spike', detail: 'RN call-outs run ~40% higher on Sunday→Monday nights; pre-stage replacements earlier.' },
  { tag: 'Worker',     title: 'Sarah Kim — reliable backfill', detail: 'Accepts last-minute RN shifts within commute radius; 94% match on coverage cases.' },
  { tag: 'Preference', title: 'Notify managers before outreach', detail: 'This org prefers a manager heads-up before Ultron contacts replacement candidates.' },
  { tag: 'Policy',     title: 'Overtime ceiling = $4,200/wk', detail: 'Rebalance schedules before projected overtime crosses the weekly budget threshold.' },
  { tag: 'Workflow',   title: 'Auto call-out recovery', detail: 'Saved from the Maria Lopez case — runs the recovery playbook end-to-end overnight.' },
];

export function MemoryPage() {
  return (
    <Page>
      <Column>
        <Header>
          <AgentMark mark="circle" size={40} tone="auto" state="active" aria-label="Ultron" />
          <HeaderText>
            <Title>Memory</Title>
            <Subtitle>What Ultron has learned and carries between sessions.</Subtitle>
          </HeaderText>
        </Header>

        <List>
          {MEMORIES.map((m, i) => (
            <Item key={i}>
              <ItemTag>{m.tag}</ItemTag>
              <ItemBody>
                <ItemTitle>{m.title}</ItemTitle>
                <ItemDetail>{m.detail}</ItemDetail>
              </ItemBody>
            </Item>
          ))}
        </List>
      </Column>
    </Page>
  );
}

// ── Styled ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-5);
  font-family: var(--font-sans);
  color: var(--color-content-primary);
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const Title = styled.h1`
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-snug);
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-content-tertiary);
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

const Item = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-border-opaque);
  border-radius: var(--radius-lg);
  background: var(--color-bg-primary);
`;

const ItemTag = styled.span`
  flex-shrink: 0;
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  background: var(--color-slate-bg-tertiary);
  color: var(--color-content-secondary);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
`;

const ItemBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
`;

const ItemTitle = styled.span`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-content-primary);
`;

const ItemDetail = styled.span`
  font-size: var(--text-sm);
  line-height: var(--line-height-normal);
  color: var(--color-content-secondary);
`;
