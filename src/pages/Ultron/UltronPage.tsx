/* ─────────────────────────────────────────────────────────────────────────────
   Ultron — sectioned feed (Live / Working / Done).
   One scrolling page whose content depends on the active section:
     · live    — cases that need attention (the entry feed)
     · working — cases Ultron is actively working (in-progress / monitoring)
     · done    — terminal cases (resolved / auto-resolved / unresolved / workflow)
   The Ultron identity card heads every section; the cases below are laid out as
   a vertical accordion (one card open at a time). DEMO ONLY — state lives in the
   shared store hook.
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import type { ChatMessage, ThreadItem, ThreadStatus } from './types';
import { SEVERITY_RANK, isPurpleRow } from './ultronShared';
import { UltronCard, UltronActionCard, UltronActivityCards, UltronAnalyzingTrigger } from './UltronCard';
import { UltronComposer } from './UltronComposer';
import { LiveLanding } from './LiveLanding';
import type { IncomingEvent } from './fixtures';

/** Which lifecycle bucket the page is showing. Mirrors the sidebar groups.
 *  `live` — the default landing: Ultron's resting presence (large Circle mark).
 *  `new`  — needs-attention cases, paged one per page (the New group). */
export type UltronSection = 'new' | 'live' | 'working' | 'done';

const SECTION_STATUSES: Record<UltronSection, ThreadStatus[]> = {
  new:     ['analyzing', 'needs_approval', 'recommended'],
  live:    ['analyzing', 'needs_approval', 'recommended'],
  working: ['in_progress', 'monitoring'],
  done:    ['resolved', 'auto_resolved', 'workflow_available', 'unresolved'],
};

const EMPTY_COPY: Record<UltronSection, string> = {
  new:     'Nothing new needs your attention right now.',
  live:    'Nothing needs your attention right now.',
  working: 'Ultron isn’t actively working anything right now.',
  done:    'No completed cases yet.',
};

/** Sections paged one case at a time (a single card per page). */
const PAGED_SECTIONS: UltronSection[] = ['new', 'working', 'done'];

interface UltronPageProps {
  /** Full thread list from the store (current state per thread). */
  threads: ThreadItem[];
  /** Decision stage per thread id (0 = first CTA, 1 = follow-up CTA). */
  stageById: Record<string, number>;
  /** Active section — Live, Working, or Done. */
  section: UltronSection;
  /** Ids whose analysis finished — keep an "Analyzed" summary card on the page. */
  analyzedIds: string[];
  /** Outbound messages per thread — the operator's approved replies, shown as
   *  sent bubbles in the message thread under the activities. */
  outboundByThread: Record<string, string[]>;
  /** Free-text conversation per thread — the operator's typed messages and
   *  Ultron's mocked replies, shown as a chat below the activity trail. */
  chatByThread: Record<string, ChatMessage[]>;
  /** Thread the sidebar has selected — expanded + scrolled into view. */
  selectedId: string | null;
  /** DEMO ONLY — advance an analyzing case to Needs approval. */
  onDecide: (threadId: string) => void;
  onAction: (threadId: string, label: string) => void;
  onRefinement: (label: string) => void;
  onSaveWorkflow: (thread: ThreadItem) => void;
  /** Send a free-text chat message to Ultron from the composer at the page foot. */
  onSend: (threadId: string, text: string) => void;
  /** Threads where Ultron is mid-reply — flips the composer into a stop control. */
  replyingIds: string[];
  /** Interrupt Ultron's in-flight reply for a thread. */
  onStop: (threadId: string) => void;
  /** Close the case detail and return to the Live landing. */
  onClose: () => void;
  /** Fired when a risk signal surfaces on the Live landing — opens a New case. */
  onDetectRisk: (event: IncomingEvent) => void;
}

/** How long the close animation plays before the page swaps to Live. Kept in
 *  sync with the `pageOut` keyframe duration below. */
const CLOSE_MS = 280;

export function UltronPage({
  threads, stageById, section, analyzedIds, outboundByThread, chatByThread, selectedId, onDecide, onAction, onRefinement, onSaveWorkflow, onSend, replyingIds, onStop, onClose, onDetectRisk,
}: UltronPageProps) {
  // While true, the paged case detail plays its exit animation; once it finishes
  // we hand off to the parent, which swaps the page to the Live landing.
  const [closing, setClosing] = useState(false);
  const handleClose = () => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(() => { setClosing(false); onClose(); }, CLOSE_MS);
  };
  const bySeverity = (a: { t: ThreadItem; index: number }, b: { t: ThreadItem; index: number }) =>
    // Needs-attention cases float above still-analyzing ones, then severity, then recency.
    ((a.t.status === 'analyzing' ? 1 : 0) - (b.t.status === 'analyzing' ? 1 : 0)) ||
    (SEVERITY_RANK[a.t.severity] - SEVERITY_RANK[b.t.severity]) || (a.index - b.index);

  // Cases shown in the active section. Each case appears in exactly one section
  // — the one its current status maps to — so a single card travels Needs
  // attention → Working → Done as the user acts on it (no lingering copies).
  const ids = threads
    .map((t, index) => ({ t, index }))
    .filter(({ t }) => SECTION_STATUSES[section].includes(t.status))
    .sort(bySeverity)
    .map(({ t }) => t.id);

  // Accordion: at most one card open at a time, defaulting to the selected case.
  const [expandedId, setExpandedId] = useState<string | null>(() => selectedId ?? null);
  // Cases whose docked decision surface the user has dismissed.
  const [dismissedDockIds, setDismissedDockIds] = useState<string[]>([]);

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // The scroll viewport and its feed content — used to follow the stream: as new
  // activities/messages appear, keep the latest in view (above the docked prompt).
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // The last selection we scrolled to. Seeded on first run with the initial
  // selection so the feed opens at the top (the Ultron identity card — the
  // entry point) instead of jumping to the default case. Comparing values
  // (rather than a mount flag) also makes this safe under StrictMode's
  // double-invoked effects.
  const lastScrolledId = useRef<string | null | undefined>(undefined);

  // Selecting a case in the sidebar expands it (collapsing any other) and
  // scrolls it into view within the section.
  useEffect(() => {
    if (lastScrolledId.current === undefined) { lastScrolledId.current = selectedId; return; }
    if (!selectedId || selectedId === lastScrolledId.current) return;
    lastScrolledId.current = selectedId;
    setExpandedId(selectedId);
    cardRefs.current[selectedId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedId]);

  // New and Done are paged one case at a time: the page shows a single event,
  // and the pager steps to the previous/next case. The current case is the
  // sidebar selection when it's in the section, otherwise the first one.
  const paged = PAGED_SECTIONS.includes(section);
  const pagedCurrentId = paged
    ? (selectedId && ids.includes(selectedId) ? selectedId : ids[0] ?? null)
    : null;

  // Follow the stream: as the thread grows (a new activity reveals or the
  // operator's message lands), keep the latest entry in view so the prompt dock
  // never hides it. Only auto-follows when the operator is already near the
  // bottom — if they've scrolled up to read, we leave their position alone.
  useEffect(() => {
    const scroller = scrollRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const behavior: ScrollBehavior = reduce ? 'auto' : 'smooth';
    // px from the bottom within which we consider the operator "following along".
    const NEAR = 160;
    let stick = true;
    let prevH = scroller.scrollHeight;
    const onScroll = () => {
      stick = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= NEAR;
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    // Only chase the bottom when the content actually grew — not on a reflow
    // (e.g. expanding a usage panel) or the initial layout, so opening a case
    // still lands at the top with the event card in view.
    const ro = new ResizeObserver(() => {
      const h = scroller.scrollHeight;
      if (h > prevH + 1 && stick) scroller.scrollTo({ top: h, behavior });
      prevH = h;
    });
    ro.observe(content);
    return () => { scroller.removeEventListener('scroll', onScroll); ro.disconnect(); };
  }, [pagedCurrentId, section]);

  // Rule: every event page opens anchored at the latest message / activity.
  // Streaming cases get there via the follow-the-stream chase above, but a case
  // whose trail is already laid out on open wouldn't trigger that — so here we
  // jump straight to the bottom on open, revealing the newest entry above the
  // dock instead of stranding the operator at the top. The event card stays
  // pinned at the top regardless (sticky).
  //
  // The jump is instant (not smooth) and repeated across the first beats: the
  // trail's candidate avatars load asynchronously and grow its height after the
  // first paint, so a single jump would land at a stale, too-short bottom.
  useEffect(() => {
    if (!paged || !pagedCurrentId) return;
    const scroller = scrollRef.current;
    if (!scroller) return;
    const jump = () => scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'auto' });
    const raf = requestAnimationFrame(jump);
    const timers = [80, 240, 480].map(ms => window.setTimeout(jump, ms));
    return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout); };
  }, [pagedCurrentId, paged]); // eslint-disable-line react-hooks/exhaustive-deps

  // On a paged page, the decision surface (prompt + buttons) is detached from
  // the event card and docked at the page bottom. Only cases that actually need
  // a decision (or can be saved as a workflow) get a dock.
  const pagedThread = pagedCurrentId ? threads.find(t => t.id === pagedCurrentId) ?? null : null;
  // Every resolved case offers to save its play as a reusable workflow, so it
  // gets a dock too — even when it carries no explicit workflowOpportunity.
  const dockEligible = !!pagedThread &&
    (['needs_approval', 'recommended', 'unresolved', 'resolved', 'auto_resolved', 'monitoring'].includes(pagedThread.status)
      || isPurpleRow(pagedThread));
  // The dock can be dismissed per case; once dismissed the prompt card is gone
  // but the event card stays in its docked (collapsed) treatment — the actions
  // don't pop back inline.
  const dockThread = dockEligible && pagedThread && !dismissedDockIds.includes(pagedThread.id)
    ? pagedThread : null;
  // When the decision is docked and the event card has no body of its own, the
  // card collapses to a compact summary (title + recommendation, flat tonal bg,
  // no border). Resolved/settled cases stay expanded to show their outcome — as
  // do cases carrying an analysis result, so its white result block can show.
  const eventExpanded = !(dockEligible && pagedThread &&
    ['needs_approval', 'recommended', 'unresolved', 'monitoring'].includes(pagedThread.status))
    || !!pagedThread?.analysisResult;

  // Live — the default landing: Ultron's resting presence, a large Circle
  // identity mark centered in the page (no feed, no dock).
  if (section === 'live') {
    return (
      <Page key="live" $static>
        <LiveLanding onDetectRisk={onDetectRisk} />
      </Page>
    );
  }

  return (
    <Page key="feed" $closing={closing}>
      <Scroll ref={scrollRef}>
      {/* The Ultron identity now lives at the top of the secondary nav (see
          App's menuHeader); the feed scrolls cases directly. */}
      {paged ? (
        <Feed ref={contentRef}>
          {pagedCurrentId === null ? (
            <Empty role="status">{EMPTY_COPY[section]}</Empty>
          ) : (() => {
            const thread = threads.find(t => t.id === pagedCurrentId);
            if (!thread) return null;
            // One event per page: the single case is always open (no accordion).
            // Navigation between cases is the sidebar group — no pager.
            // While analyzing, the thinking block is lifted out of the event card
            // into its own card directly below (the feed gap sets the spacing),
            // leaving the event card as a compact collapsed summary.
            const analyzing = thread.status === 'analyzing';
            // Resolved cases lift their activity trail out of the event card into
            // individual per-step cards (8px gaps) placed directly below it.
            const resolved = thread.status === 'resolved' || thread.status === 'auto_resolved';
            // Working cases lift their live execution activities out into
            // per-activity cards below, accumulating as Ultron works.
            const executing = thread.status === 'in_progress';
            // Cases awaiting a decision have already been reasoned through — show
            // that completed thinking as an activity trail below the event card
            // (the pending question lives in the docked decision surface).
            const awaitingDecision = thread.status === 'needs_approval' || thread.status === 'recommended';
            // Escalated Working case: it has surfaced a needs-attention prompt but
            // stays in the Working group. Show its completed trail (like a working
            // case) with the decision docked at the foot.
            const monitoring = thread.status === 'monitoring';
            // Workflow-ready cases are terminal too — they show the same completed
            // think → plan → execute trail as a resolved case, with the
            // Save-as-workflow surface docked at the foot.
            const workflowReady = thread.status === 'workflow_available';
            return (
              <>
                {/* The event card pins to the top of the scroll area; the
                    activity cards below scroll underneath it. */}
                {/* Event card + lifecycle stepper pin together at the top of the
                    scroll area; the activity cards below scroll underneath them. */}
                <StickyEvent>
                  <UltronCard
                    key={thread.id}
                    thread={thread}
                    stage={stageById[thread.id] ?? 0}
                    expanded={executing ? false : eventExpanded}
                    detachActionable={dockEligible}
                    detachAnalyzing={analyzing}
                    detachTrail={resolved || workflowReady}
                    onToggle={() => {}}
                    onClose={handleClose}
                    onDecide={onDecide}
                    onAction={onAction}
                    onRefinement={onRefinement}
                    onSaveWorkflow={onSaveWorkflow}
                  />
                </StickyEvent>
                {/* One accumulating trail across analyzing → awaiting → executing →
                    resolved. While analyzing it runs live (the reasoning streams in
                    with the working mark); the analysis steps are part of the same
                    group, so there's no separate analyzing card. Keyed by case id so
                    it remounts only when the case changes, not when it advances. */}
                {(analyzing || awaitingDecision || executing || resolved || monitoring || workflowReady) && (
                  <UltronActivityCards
                    key={thread.id}
                    thread={thread}
                    outbound={outboundByThread[thread.id] ?? []}
                    chat={chatByThread[thread.id] ?? []}
                    replying={replyingIds.includes(thread.id)}
                    analyzing={analyzing}
                  />
                )}
              </>
            );
          })()}
        </Feed>
      ) : (
        <Feed ref={contentRef}>
          {ids.length === 0 ? (
            <Empty role="status">{EMPTY_COPY[section]}</Empty>
          ) : (
            ids.map(id => {
              const thread = threads.find(t => t.id === id);
              if (!thread) return null;
              return (
                <CardSlot key={id} ref={el => { cardRefs.current[id] = el; }}>
                  <UltronCard
                    thread={thread}
                    stage={stageById[id] ?? 0}
                    expanded={expandedId === id}
                    onToggle={() => setExpandedId(cur => (cur === id ? null : id))}
                    onDecide={onDecide}
                    onAction={onAction}
                    onRefinement={onRefinement}
                    onSaveWorkflow={onSaveWorkflow}
                  />
                </CardSlot>
              );
            })
          )}
        </Feed>
      )}
      </Scroll>
      {/* The page foot: the (optional) decision surface or demo analyzing trigger
          stacked above the always-present chat composer, so every event page is a
          complete chat interface — free-text replies alongside the action pills.
          The bottom dissolve is handled by the Scroll mask above. */}
      {paged && pagedCurrentId && pagedThread && (
        <ActionDock>
          <ActionDockInner>
            {dockThread && (
              <UltronActionCard
                key={`action-${dockThread.id}`}
                thread={dockThread}
                stage={stageById[dockThread.id] ?? 0}
                onAction={onAction}
                onRefinement={onRefinement}
                onSaveWorkflow={onSaveWorkflow}
                onDismiss={id => setDismissedDockIds(prev => prev.includes(id) ? prev : [...prev, id])}
              />
            )}
            {/* DEMO ONLY — while a case is analyzing, its "Trigger Needs approval"
                control docks here (mirrors the decision dock) instead of sitting
                inside the scrolling analyzing card. */}
            {pagedThread.status === 'analyzing' && !analyzedIds.includes(pagedThread.id) && (
              <UltronAnalyzingTrigger thread={pagedThread} onDecide={onDecide} />
            )}
            <UltronComposer
              key={`composer-${pagedCurrentId}`}
              onSend={text => onSend(pagedCurrentId, text)}
              working={replyingIds.includes(pagedCurrentId)}
              onStop={() => onStop(pagedCurrentId)}
            />
          </ActionDockInner>
        </ActionDock>
      )}
    </Page>
  );
}

// ── Styled ───────────────────────────────────────────────────────────────────

/* Close motion: the case detail eases down + fades out as it hands off to the
   Live landing. Duration mirrors CLOSE_MS so the handoff lands as the fade ends. */
const pageOut = keyframes`
  from { opacity: 1; transform: translateY(0)            scale(1);    }
  to   { opacity: 0; transform: translateY(var(--space-4)) scale(0.98); }
`;

/* Enter motion: the case detail rises + fades in as it takes over from the Live
   landing (the inverse of pageOut). Plays on mount, so switching from the
   landing into a case eases in rather than cutting. The landing keeps its own
   Hero entrance ($static suppresses this page-level one to avoid double motion).
   Each branch is keyed (live / feed) so React remounts on the on/off switch and
   replays the entrance; switching between cases reuses the same Page (no key
   change), so it doesn't re-animate. */
const pageIn = keyframes`
  from { opacity: 0; transform: translateY(var(--space-3)) scale(0.99); }
  to   { opacity: 1; transform: translateY(0)            scale(1);    }
`;

/* Relative shell: a column holding the scroll area above the (optional) docked
   actionable card / bottom band. */
const Page = styled.div<{ $closing?: boolean; $static?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  /* Cancel the shell's ContentMain bottom padding for Ultron only: this page
     owns its full height and snaps the action dock / bottom fade to the very
     foot. Reclaim the 32px the padding carves off the content box, then pull the
     margin box back up by the same amount so it adds no scroll overflow. */
  height: calc(100% + var(--space-8));
  margin-bottom: calc(-1 * var(--space-8));
  min-height: 0;
  overflow: hidden;
  font-family: var(--font-sans);
  color: var(--color-content-primary);
  transform-origin: 50% 30%;
  will-change: opacity, transform;

  ${p => !p.$static && !p.$closing && css`
    animation: ${pageIn} 280ms var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1)) both;
  `}

  ${p => p.$closing && css`
    animation: ${pageOut} 280ms var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1)) forwards;
  `}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/* The actual scroller — the feed lives here. A thin always-styled scrollbar
   (matching the shell's ContentMain / NavMiddle) makes the vertical scroll
   obvious instead of relying on macOS's invisible overlay scrollbar. */
const Scroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  /* No top padding so the pinned event card sits flush at the top (0px); the
     sides + bottom keep the feed's reading inset. */
  padding: 0 var(--space-5) var(--space-5);
  scrollbar-gutter: stable;

  /* Bottom dissolve so thread content fades into the dock / page foot as it
     scrolls out. The top stays solid: the pinned event card's bg-primary panel
     (see StickyEvent) now covers the space above it, so content scrolling up
     disappears behind that surface rather than needing a top fade. */
  --scroll-fade: var(--space-12);
  -webkit-mask-image: linear-gradient(to bottom, #000 0, #000 calc(100% - var(--scroll-fade)), transparent 100%);
          mask-image: linear-gradient(to bottom, #000 0, #000 calc(100% - var(--scroll-fade)), transparent 100%);

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: var(--color-border-opaque, #e8eaee);
    border-radius: 99px;
  }
`;

/* Actionable card dock — a fixed section at the foot of the page (snapped to
   bottom), the event card scrolling independently above it. */
const ActionDock = styled.div`
  flex-shrink: 0;
  padding: var(--space-6) var(--space-5) var(--space-5);
`;

const ActionDockInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-width: 720px;
  margin: 0 auto;
`;

/* Vertical feed column — centered, comfortable reading width. A small bottom
   padding (on top of the scroller's own --space-5) lifts the last activity/message
   clear of the bottom fade so the newest entry stays readable rather than
   dissolving into the docked prompt. */
const Feed = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding-bottom: var(--space-4);
`;

/* Anchor for scroll-into-view; scroll-margin keeps the card clear of the top
   edge when the sidebar selects it. */
const CardSlot = styled.div`
  scroll-margin-top: var(--space-5);
`;

/* Pins the paged event card to the top of the scroll area; the activity cards
   below scroll underneath it (the card is opaque, so they dissolve under it). */
const StickyEvent = styled.div`
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--color-bg-primary);

  /* Soft gradient just below the pinned card so content scrolling up dissolves
     into the page background instead of colliding with the card's bottom edge.
     Rides with the sticky card and sits above the scrolling content. */
  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 100%;
    height: var(--space-6);
    background: linear-gradient(to bottom, var(--color-bg-primary), transparent);
    pointer-events: none;
  }
`;

const Empty = styled.div`
  padding: var(--space-12) var(--space-4);
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-content-tertiary);
`;

