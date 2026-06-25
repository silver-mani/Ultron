import React, { useState } from 'react';
import styled from 'styled-components';
import { AppShell } from './components/AppShell';
import type { PrimaryNavItem, SecondaryNavMenuEntry, SecondaryNavPageEntry } from './types/nav';
import {
  HomeIcon, MessageCircleIcon, InboxIcon, ReceiptCheckIcon, AIStarIcon,
  MarketplaceIcon,
  DocumentIcon, FormIcon, TasksIcon, PolicyIcon, AutomationIcon, PayrollIcon, ESignIcon,
} from './components/PrimaryNav/NavIcons';
import {
  SettingsGearIcon, CheckCircleIcon,
  Badge, AlertTriangleIcon, Save01Icon,
} from 'alloy-design-system';
import { HeadingText } from './components/TopNav/TopNav.styles';
import policyActiveUrl from './assets/policy-icon-active.svg';
import automationActiveUrl from './assets/automation-icon-active.svg';
import {
  UltronPage, MemoryPage, AccountDatabasePage, useUltronStore, ACCOUNT_COLLECTIONS, AgentMark,
  UltronIdentityCard, TypingText,
  type UltronSection, type ThreadStatus,
} from './pages/Ultron';
import { useHashSync } from './nav/hashSync';
import type { MobileModuleGroup } from './components/AppShell/MobileShell';

// ── Nav item definitions ──────────────────────────────────────────────────
// The full primary rail is kept for chrome fidelity, but Ultron is the only
// wired module — selecting any other rail item is inert (no navigation, no
// page). Those experiences live in the parent Teambridge app. Ultron's app
// icon is its own identity mark (the Circle AgentMark).

const PRIMARY_ITEMS: Omit<PrimaryNavItem, 'isActive' | 'onClick'>[] = [
  { id: 'ultron',   label: 'Ultron',  icon: <AgentMark mark="circle" size={32} tone="auto" state="idle" aria-label="Ultron" /> },
  { id: 'home',     label: 'Home',    icon: <HomeIcon /> },
  { id: 'engaged',  label: 'Engaged', icon: <MessageCircleIcon />, hasUnread: true },
  { id: 'inbox',    label: 'Inbox',   icon: <InboxIcon />, hasUnread: true },
  { id: 'invoice',  label: 'Invoice', icon: <ReceiptCheckIcon /> },
  { id: 'ai-home',  label: 'AI Home', icon: <AIStarIcon /> },
];

const TOOL_ITEMS: Omit<PrimaryNavItem, 'isActive' | 'onClick'>[] = [
  { id: 'apps', label: 'Apps', icon: <MarketplaceIcon /> },
];

const BOTTOM_ITEMS: Omit<PrimaryNavItem, 'isActive' | 'onClick'>[] = [
  { id: 'docs',       label: 'Document Studio', icon: <DocumentIcon /> },
  { id: 'form',       label: 'Form',            icon: <FormIcon /> },
  { id: 'tasks',      label: 'Tasks',           icon: <TasksIcon /> },
  { id: 'policy',     label: 'Policy',          icon: <PolicyIcon />, activeIcon: <img src={policyActiveUrl} width={16} height={16} style={{ display: 'block' }} alt="" /> },
  { id: 'automation', label: 'Automation',      icon: <AutomationIcon />, activeIcon: <img src={automationActiveUrl} width={16} height={16} style={{ display: 'block' }} alt="" /> },
  { id: 'payroll',    label: 'Payroll',         icon: <PayrollIcon /> },
  { id: 'esign',      label: 'E-Sign Studio',   icon: <ESignIcon /> },
];

// ── Helpers ────────────────────────────────────────────────────────────────

/** Ultron's identity (circle mark + title + live activity) pinned to the top of
 *  the Home secondary nav, above the case groups. Clickable — returns to the
 *  Live landing (Ultron's resting presence); highlights while it's the active
 *  page. */
const UltronNavCard = styled.button<{ $active: boolean }>`
  display: block;
  width: 100%;
  margin-bottom: var(--space-2);
  /* On the Live landing the card is a compact identity row, so trim the
     vertical padding to keep the header short. */
  padding: ${p => (p.$active ? 'var(--space-1) var(--space-2)' : 'var(--space-2)')};
  border: none;
  border-radius: var(--radius-md, 8px);
  background: ${p => (p.$active ? 'var(--color-bg-secondary, rgba(70, 108, 255, 0.06))' : 'transparent')};
  text-align: left;
  cursor: pointer;
  transition: background var(--duration-fast, 120ms) var(--ease-out, ease);

  &:hover { background: var(--color-bg-secondary, rgba(70, 108, 255, 0.06)); }
`;

// Group icons for the Ultron secondary-nav groups (Needs attention / Live
// stream / Resolved), keyed by the store group id.
const HOME_GROUP_ICON: Record<string, React.ReactNode> = {
  needs_attention: <AlertTriangleIcon size={16} />,
  live:            <AgentMark mark="lines" size={32} tone="auto" state="active" />,
  resolved:        <CheckCircleIcon size={16} />,
};

// Which feed section a case's status belongs to. The page always follows the
// selected case: as its status shifts, the section (and the sidebar group it
// sits under) moves with it — Needs attention (New) → Working → Done.
const STATUS_SECTION: Record<ThreadStatus, UltronSection> = {
  analyzing:          'new',
  needs_approval:     'new',
  recommended:        'new',
  in_progress:        'working',
  monitoring:         'working',
  resolved:           'done',
  auto_resolved:      'done',
  workflow_available: 'done',
  unresolved:         'done',
};

// ── App ───────────────────────────────────────────────────────────────────

export default function App() {
  // The rail is kept for fidelity but Ultron is the only wired module, so
  // `activeId` never leaves 'ultron'. The other nav-state fields are retained
  // only to satisfy the hash-sync + mobile-shell contracts.
  const [activeId, setActiveId] = useState('ultron');
  const [secActiveId, setSecActiveId] = useState('home-overview');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  // Home secondary-nav body toggle: 'ultron' shows Ultron threads grouped by
  // lifecycle; 'account' shows the (stubbed) Account database collections.
  const [homeView, setHomeView] = useState<'ultron' | 'account' | 'memory'>('ultron');
  const [accountCollection, setAccountCollection] = useState('employees');
  // Shared Ultron store (threads + grouping + selection) — drives both the
  // sidebar and the main detail view.
  const ultron = useUltronStore();
  // Live landing — the default page state: Ultron's resting presence (large
  // Circle mark, no case open). The user lands here; opening any case in the
  // sidebar leaves it, and clicking the identity returns to it.
  const [onLive, setOnLive] = useState(true);
  // The feed section follows the selected case: it's derived from that case's
  // current status, so acting on a case (which shifts its status) carries the
  // view — and the active sidebar group — along with it. Until the user opens a
  // case, the page rests on the Live landing.
  const homeSection: UltronSection = onLive
    ? 'live'
    : ultron.selectedThread
    ? STATUS_SECTION[ultron.selectedThread.status]
    : 'new';

  // URL-hash sync — kept so deep links survive refresh on both chromes.
  useHashSync(
    { activeId, secActiveId, selectedPersonaId, activePageId },
    { setActiveId, setSecActiveId, setSelectedPersonaId, setActivePageId },
  );

  // Rail rendering: only Ultron is selectable. Other items render for
  // fidelity but are inert (no onClick).
  const withActive = (items: typeof PRIMARY_ITEMS): PrimaryNavItem[] =>
    items.map(item => ({
      ...item,
      isActive: item.id === activeId,
      onClick: item.id === 'ultron' ? () => setActiveId('ultron') : undefined,
    }));

  const pageEntries: SecondaryNavPageEntry[] = [
    {
      id: 'memory',
      label: 'Memory',
      icon: <Save01Icon size={16} />,
      isActive: homeView === 'memory',
      onClick: () => setHomeView('memory'),
    },
    { id: 'settings', label: 'Settings', icon: <SettingsGearIcon size={16} /> },
  ];

  const topNavHeading: React.ReactNode = (
    <HeadingText>{homeView === 'memory' ? 'Memory' : homeView === 'account' ? 'Account database' : 'Ultron'}</HeadingText>
  );

  // Home renders its secondary-nav menu through the standard pipeline (same
  // MenuGroupItem / MenuSingleItem components as every other app) so the rows
  // match: collapsible groups, 32px rows, tertiary labels, Tag counts.
  const homeMenuEntries: SecondaryNavMenuEntry[] = homeView === 'account'
    ? ACCOUNT_COLLECTIONS.map(c => ({
        type: 'single' as const,
        item: {
          id: c.id, label: c.label, icon: c.icon,
          isActive: accountCollection === c.id,
          onClick: () => setAccountCollection(c.id),
        },
      }))
    : ultron.groups.flatMap<SecondaryNavMenuEntry>(g => {
        // Each group lists its cases as children; clicking one opens that case
        // on the group's page. New and Done are paged one case per page; the
        // New group relabels the needs-attention bucket.
        const childSection: UltronSection =
          g.id === 'needs_attention' ? 'new' : g.id === 'resolved' ? 'done' : 'working';
        const groupEntry = {
          type: 'group' as const,
          group: {
            id: g.id,
            label: g.id === 'needs_attention' ? 'New' : g.label,
            icon: HOME_GROUP_ICON[g.id],
            trailingBadge: <Badge>{g.threads.length}</Badge>,
            defaultExpanded: true,
            outlined: false,
            // New can get long — show the first 5, collapse the rest behind
            // a "Show N more" row (covers needs-attention + analyzing alike).
            maxVisible: g.id === 'needs_attention' ? 5 : undefined,
            children: g.threads.map(t => ({
              id: t.id,
              // Cases Ultron just detected on the Live landing type their title
              // in (the moment of detection); authored cases show it plainly.
              label: t.id.startsWith('detected_') ? <TypingText text={t.name} /> : t.name,
              // Needs-attention cases carry an orange Pulse mark — a breathing
              // core that flags the case for the user — except while Ultron is
              // still analyzing, which keeps the orbiting mark. Working cases
              // use the orbiting/idling identity mark; Done cases the Pulse
              // mark (orange while unresolved, muted once settled).
              icon: childSection === 'new'
                ? (t.status === 'analyzing'
                    ? <AgentMark mark="orbit" size={32} tone="auto" state="active" aria-label="Analyzing" />
                    : <AgentMark mark="pulse" size={32} tone="auto" state="active" color="var(--color-orange-content-tertiary)" aria-label="Needs attention" />)
                : childSection === 'working'
                ? <AgentMark mark="lines" size={32} tone="auto" state={t.status === 'in_progress' ? 'active' : 'idle'} aria-label="Working" />
                : <AgentMark mark="pulse" size={32} tone="auto" state={t.status === 'unresolved' ? 'idle' : 'static'} color={t.status === 'unresolved' ? 'var(--color-orange-content-tertiary)' : ultron.viewedIds.includes(t.id) ? 'var(--color-slate-content-tertiary)' : 'var(--color-green-content-tertiary)'} aria-label="Done" />,
              isActive: homeView === 'ultron' && !onLive && homeSection === childSection && ultron.selectedId === t.id,
              onClick: () => { setHomeView('ultron'); setOnLive(false); ultron.setSelectedId(t.id); },
            })),
          },
        };
        // Divider above the Working and Done groups.
        return g.id === 'resolved'
          ? [{ type: 'divider' as const, id: 'done-divider' }, groupEntry]
          : g.id === 'live'
          ? [{ type: 'divider' as const, id: 'working-divider' }, groupEntry]
          : [groupEntry];
      });

  // Module catalog for PrimarySheet + ModuleDrawer. Groups mirror the
  // three-tier layout of the desktop PrimaryNav (main / tools / bottom).
  const mobileModuleGroups: MobileModuleGroup[] = [
    { id: 'main',   label: 'Workspace', items: withActive(PRIMARY_ITEMS) },
    { id: 'tools',  label: 'Tools',     items: withActive(TOOL_ITEMS) },
    { id: 'bottom', label: 'Apps',      items: withActive(BOTTOM_ITEMS) },
  ];

  return (
    <AppShell
      // PrimaryNav
      items={withActive(PRIMARY_ITEMS)}
      toolItems={withActive(TOOL_ITEMS)}
      bottomItems={withActive(BOTTOM_ITEMS)}
      workspace={{ id: 'acme', name: '{Account.name}', initial: 'A' }}
      user={{ name: 'Tito Goldstein', initials: 'TG', avatarColor: '#ee9c2d' }}
      newItemId="app-tool"
      aiItemId="ai-home"
      // SecondaryNav — always the Ultron sidebar; no header bar (heading +
      // header slot omitted), so the identity card sits at the very top.
      secNavHeading=""
      menuEntries={homeMenuEntries}
      // Ultron's identity (circle mark + title + live activity) rides the top of
      // the Home secondary nav as a card, above the case groups.
      menuHeader={homeView === 'ultron'
        ? (
            <UltronNavCard
              $active={onLive}
              onClick={() => { setHomeView('ultron'); setOnLive(true); }}
              aria-label="Live — Ultron presence"
              aria-current={onLive ? 'page' : undefined}
            >
              <UltronIdentityCard hideActivity={onLive} />
            </UltronNavCard>
          )
        : undefined}
      pageEntries={pageEntries}
      showSecondaryNav
      showTopNav={homeView !== 'ultron'}
      showSearch={false}
      // TopNav
      heading={topNavHeading}
      actions={[]}
      showActivityButton
      showPonderButton
      // Mobile chrome opt-in
      mobileNav={{
        activeId,
        secActiveId,
        activePageId,
        selectedPersonaId,
        moduleGroups: mobileModuleGroups,
        primaryLabel: 'Ultron',
        secondaryLabel: undefined,
        onMobileNavigate: (id) => { if (id === 'ultron') setActiveId('ultron'); },
        onSelectPersona: setSelectedPersonaId,
      }}
    >
      {homeView === 'memory' ? (
        <MemoryPage />
      ) : homeView === 'account' ? (
        <AccountDatabasePage collectionId={accountCollection} />
      ) : (
        <UltronPage
          threads={ultron.threads}
          stageById={ultron.stageById}
          section={homeSection}
          analyzedIds={ultron.analyzedIds}
          outboundByThread={ultron.outboundByThread}
          chatByThread={ultron.chatByThread}
          selectedId={ultron.selectedId}
          onDecide={ultron.decide}
          onAction={ultron.commit}
          onRefinement={ultron.refine}
          onSaveWorkflow={ultron.saveWorkflow}
          onSend={ultron.sendMessage}
          replyingIds={ultron.replyingIds}
          onStop={ultron.stopReply}
          onClose={() => { setHomeView('ultron'); setOnLive(true); }}
          onDetectRisk={ultron.detectRisk}
        />
      )}
    </AppShell>
  );
}
