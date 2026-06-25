/* ─────────────────────────────────────────────────────────────────────────────
   Ultron — single case card.
   Renders one thread: header (avatar + title + status), the optional past-
   activity trail (resolved), and the case body (prompt + records + action pills,
   or live execution activities, or the resolved outcome). One card per feed row.
   DEMO ONLY — state lives in the shared store hook.
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useState, Fragment } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  Button, Save01Icon, MinusIcon, ChevronDownIcon, ChevronRightIcon, CheckIcon, LinkExternal01Icon, XCloseIcon, AlertTriangleIcon,
} from 'alloy-design-system';
import { Avatar } from '../../components/Avatar';
import type { ChatMessage, ThreadItem } from './types';
import {
  THREAD_SUBJECTS, threadAvatarUrl, THREAD_PROMPTS, threadDisplayTitle, threadMeta,
  THREAD_FOLLOWUPS, THREAD_RECORDS, activityForThread, analyzingSteps,
  WORKING_ACTIVITIES, THREAD_TASKS, casePlan, THREAD_FLAGS, actionAck,
} from './fixtures';
import type { ActivityMilestone, WorkingMilestone, PlanTask, RecordRef, AnalyzingStep, EventFlag } from './fixtures';
import { RecordCard } from './RecordCard';
import {
  isPurpleRow, isRefinementAction, toneFor, UNRESOLVED_ACTIONS,
  hasMultipleCtas, DO_IT_ALL_LABEL, deriveStepLabels,
} from './ultronShared';
import { ACTIVITY_STEP_MS } from './store';
import { ActivityTrail, ActivityTrailCards } from './ActivityTrail';
import { AgentMark } from './AgentMark';

/** How soon the first work step appears after the operator's reply — a short
 *  beat so the response feels acknowledged immediately, before the remaining
 *  steps pace in at the slower ACTIVITY_STEP_MS cadence. */
const POST_REPLY_MS = 450;

interface UltronCardProps {
  thread: ThreadItem;
  stage: number;
  /** Whether this card is the one expanded in the feed (accordion). */
  expanded: boolean;
  /** Toggle this card open/closed — the feed collapses any other open card. */
  onToggle: () => void;
  /** When set, the header button becomes a Close control: it dismisses the case
   *  detail and returns to the Live landing (paged view only). */
  onClose?: () => void;
  /** When true, the recommendation prompt + action buttons are NOT rendered here
   *  — they live in a separate <UltronActionCard> snapped to the page bottom.
   *  The event card keeps its header + context records. */
  detachActionable?: boolean;
  /** When true, the "Ultron is analyzing…" block is NOT rendered here — it lives
   *  in a separate <UltronAnalyzingCard> placed directly below this card. */
  detachAnalyzing?: boolean;
  /** When true, the resolved activity trail is NOT rendered here — it lives in
   *  separate per-step cards (<UltronTrailCards>) placed below this card. */
  detachTrail?: boolean;
  /** DEMO ONLY — advance an analyzing case to Needs approval. */
  onDecide: (threadId: string) => void;
  onAction: (threadId: string, label: string) => void;
  onRefinement: (label: string) => void;
  onSaveWorkflow: (thread: ThreadItem) => void;
}

/** Derive the decision shape of a case: the prompt question, the context
 *  records it references, and the action labels (primary / secondary / purple),
 *  honouring the follow-up stage. Shared by the event card and the detached
 *  <UltronActionCard>. */
function deriveCase(thread: ThreadItem, stage: number) {
  const needsDecision = thread.status === 'needs_approval' || thread.status === 'recommended';
  // `monitoring` is a Working-group case that has surfaced a needs-attention
  // prompt (e.g. the escalated attendance case): it stays in Working but asks
  // the operator for a decision, so it's actionable too.
  const actionable = needsDecision || thread.status === 'unresolved' || thread.status === 'monitoring';
  const followUp = THREAD_FOLLOWUPS[thread.id];
  const onFollowUp = stage === 1 && !!followUp;
  const prompt = onFollowUp ? followUp!.prompt : (THREAD_PROMPTS[thread.id] ?? thread.recommendation);
  // The record(s) the question references (worker / shift / candidates …).
  const recordRef = onFollowUp ? followUp!.record : THREAD_RECORDS[thread.id];
  const records = recordRef ? (Array.isArray(recordRef) ? recordRef : [recordRef]) : [];
  // Unresolved cases share one generic set of resolution options.
  const actions = thread.status === 'unresolved'
    ? UNRESOLVED_ACTIONS
    : onFollowUp ? followUp!.actions : thread.actions;
  // A multi-step case collapses its actions to a single "Approve all" primary
  // plus the "Other" escape hatch. It's multi-step when the base prompt has an
  // authored task breakdown of 2+ steps, or — for cases without one — when the
  // prompt itself conjoins clauses ("X and Y"). Follow-ups stay single-action.
  const multiCta = needsDecision && (
    (!onFollowUp && (THREAD_TASKS[thread.id]?.length ?? 0) > 1) || hasMultipleCtas(prompt)
  );
  const primaryLabel = multiCta ? DO_IT_ALL_LABEL : actions[actions.length - 1];
  const secondaryLabels = multiCta ? [] : actions.slice(0, -1);
  const purple = isPurpleRow(thread);
  return { needsDecision, actionable, onFollowUp, followUp, prompt, records, primaryLabel, secondaryLabels, purple };
}

export function UltronCard({ thread, stage, expanded, detachActionable, detachAnalyzing, detachTrail, onToggle, onClose, onDecide, onAction, onRefinement, onSaveWorkflow }: UltronCardProps) {
  const [savedWorkflow, setSavedWorkflow] = useState(false);

  const { actionable, prompt, records, primaryLabel, secondaryLabels, purple } = deriveCase(thread, stage);
  // Intermediate state: the event has arrived and Ultron is still thinking — no
  // actionables or questions decided yet.
  const analyzing = thread.status === 'analyzing';
  // The analyzing block renders in-card unless it's been detached to a separate
  // card placed below (see <UltronAnalyzingCard>).
  const showAnalyzing = analyzing && !detachAnalyzing;
  const isResolved = thread.status === 'resolved' || thread.status === 'auto_resolved';

  // When the actionable block is detached (rendered at the page bottom), the
  // prompt, context records, and action buttons all move there — the event card
  // is left with just its header (plus any resolved/analyzing activity).
  const showActions = !detachActionable && (actionable || purple);

  // The resolved activity trail renders in-card (above the body) unless it's been
  // detached into separate per-step cards below.
  const showInCardTrail = isResolved && !detachTrail;

  // Whether the card has any body content. Monitoring / in-progress threads carry
  // no in-card body (their live activity renders below as <UltronWorkingCards>),
  // so we skip the body wrapper rather than render an empty white box. Resolved
  // cases no longer carry an outcome line in the body, so they only get a body
  // when they have actions to offer (e.g. Save as workflow).
  const hasBody = detachActionable
    ? showAnalyzing
    : (actionable || showAnalyzing || showActions);

  // A header-only case (monitoring / in-progress, whose activity streams below
  // as separate cards) has no in-card body to expand into, so it always reads as
  // a collapsed event row — flat tonal chrome + meta subtitle, no gradient border
  // ring — matching the rest of the feed instead of a glowing bordered pill. The
  // in-card trail counts as expandable content too.
  const effectiveExpanded = expanded && (hasBody || showInCardTrail);

  // Card tone (shared with the sidebar dots): green / orange / slate.
  const tone = toneFor(thread);

  // Glanceable sub-context under the title (Role · Shift time · Location). The
  // structured meta shows in every state — it's useful context whether the case
  // is collapsed, working, or resolved. Only the prose-assessment fallback (for
  // cases with no structured meta) is limited to the collapsed state, where it
  // stands in for the body.
  const metaLine = threadMeta(thread.id);
  const subtitle = metaLine || (!effectiveExpanded ? thread.assessment : '');

  const trigger = (label: string) => {
    if (isRefinementAction(label)) onRefinement(label);
    else onAction(thread.id, label);
  };

  // The deconstructed (transparent, flat) treatment follows the focused/detail
  // card — `expanded` — not whether it has in-card body content, so removing the
  // analysis-result banner doesn't snap it back to the collapsed tonal fill.
  return (
    <Card data-tone={tone} $expanded={expanded}>
      <CardHeader>
        <HeaderToggle
          type="button"
          aria-expanded={effectiveExpanded}
          aria-label={effectiveExpanded ? 'Collapse case' : 'Expand case'}
          onClick={onToggle}
        >
          <Avatar
            size="md"
            src={threadAvatarUrl(thread.id)}
            name={THREAD_SUBJECTS[thread.id]}
            alt={THREAD_SUBJECTS[thread.id] ?? ''}
          />
          <HeaderText>
            <CardTitle>{threadDisplayTitle(thread)}</CardTitle>
            {/* Glanceable case IA — Role · Shift time · Location — so the row
                scans at a glance across every status (working, resolved, …).
                Falls back to Ultron's prose read only when a case carries no
                structured metadata and the card is collapsed. */}
            {subtitle && <CardSubtitle>{subtitle}</CardSubtitle>}
          </HeaderText>
        </HeaderToggle>
        <Button
          variant="ghost"
          size="xs"
          iconOnly
          aria-label={onClose ? 'Close case and return to Live' : effectiveExpanded ? 'Collapse case' : 'Expand case'}
          tabIndex={onClose ? undefined : -1}
          onClick={onClose ?? onToggle}
        >
          {onClose ? <LinkExternal01Icon size={16} /> : effectiveExpanded ? <ChevronDownIcon size={16} /> : <MinusIcon size={16} />}
        </Button>
      </CardHeader>

      {effectiveExpanded && showInCardTrail && (
        <TrailRegion>
          <TrailInner>
            <ActivityTrail milestones={activityForThread(thread)} />
          </TrailInner>
        </TrailRegion>
      )}

      {effectiveExpanded && hasBody && (
      <CardBody>
        {actionable && !detachActionable && <Prompt>{prompt}</Prompt>}

        {actionable && !detachActionable && records.length > 0 && (
          <RecordList>
            {records.map((r, i) => <RecordCard key={i} record={r} />)}
          </RecordList>
        )}


        {showAnalyzing && (
          <Analyzing role="status" aria-live="polite">
            <AnalyzingBody thread={thread} onDecide={onDecide} />
          </Analyzing>
        )}

        {showActions && (
          <Actions>
            {actionable && primaryLabel && (
              <Pill variant="primary" size="sm" onClick={() => trigger(primaryLabel)}>
                {primaryLabel}
              </Pill>
            )}
            {actionable && secondaryLabels.map(label => (
              <Pill key={label} variant="tertiary" size="sm" onClick={() => trigger(label)}>
                {label}
              </Pill>
            ))}
            {actionable && (
              <OtherPill variant="tertiary" size="sm" onClick={() => onRefinement('Other')}>
                Other
              </OtherPill>
            )}
            {purple && (
              savedWorkflow ? (
                <Button
                  variant="secondary" size="sm"
                  leadingArtwork={<CheckIcon size={14} />}
                  trailingArtwork={<LinkExternal01Icon size={14} />}
                  onClick={() => onSaveWorkflow(thread)}
                >
                  Saved
                </Button>
              ) : (
                <Button
                  variant="secondary" size="sm"
                  leadingArtwork={<Save01Icon size={14} />}
                  onClick={() => { onSaveWorkflow(thread); setSavedWorkflow(true); }}
                >
                  Save as workflow
                </Button>
              )
            )}
          </Actions>
        )}
      </CardBody>
      )}
    </Card>
  );
}

// ── Actionable card ─────────────────────────────────────────────────────────────
// The detached decision surface: the recommendation prompt + action buttons,
// rendered as its own card (snapped to the page bottom by the feed). Mirrors the
// in-card Actions block; shares deriveCase with the event card.
interface UltronActionCardProps {
  thread: ThreadItem;
  stage: number;
  onAction: (threadId: string, label: string) => void;
  onRefinement: (label: string) => void;
  onSaveWorkflow: (thread: ThreadItem) => void;
  /** Dismiss the decision surface (hides this card). */
  onDismiss?: (threadId: string) => void;
}

export function UltronActionCard({ thread, stage, onAction, onRefinement, onSaveWorkflow, onDismiss }: UltronActionCardProps) {
  const [savedWorkflow, setSavedWorkflow] = useState(false);
  const { actionable, onFollowUp, prompt, records, primaryLabel, secondaryLabels, purple } = deriveCase(thread, stage);

  // Cases with a task breakdown render their plan as discrete step cards (the
  // bundled "do A and B" prompt as its steps) instead of a flat candidate-card
  // list. Authored tasks win; otherwise a bundled prompt is split into steps on
  // the fly (so detected/spawned cases get step cards too). Only on the base
  // prompt — a follow-up keeps the plain record list.
  const tasks = actionable && !onFollowUp
    ? (THREAD_TASKS[thread.id] ?? deriveStepLabels(prompt).map(label => ({ label })))
    : undefined;

  // Every resolved case can be saved as a workflow — purple rows surface it
  // explicitly, but any resolved/auto-resolved outcome offers it too.
  const isResolved = thread.status === 'resolved' || thread.status === 'auto_resolved';
  const offerWorkflow = purple || isResolved;

  const trigger = (label: string) => {
    if (isRefinementAction(label)) onRefinement(label);
    else onAction(thread.id, label);
  };

  return (
    <ActionCard data-tone={toneFor(thread)}>
      {onDismiss && (
        <DismissSlot>
          <Button
            variant="ghost"
            size="xs"
            iconOnly
            aria-label="Dismiss"
            onClick={() => onDismiss(thread.id)}
          >
            <XCloseIcon size={16} />
          </Button>
        </DismissSlot>
      )}
      {actionable && <Prompt>{prompt}</Prompt>}
      {/* Workflow-ready / resolved rows aren't a decision — they just offer to
          save the resolved play. Ask for it explicitly above the Save button. */}
      {offerWorkflow && !actionable && <Prompt>Want me to save this as a reusable workflow?</Prompt>}
      {tasks && tasks.length > 0 ? (
        <PlanTaskList tasks={tasks} records={records} />
      ) : actionable && records.length > 0 ? (
        <RecordList>
          {records.map((r, i) => <RecordCard key={i} record={r} />)}
        </RecordList>
      ) : null}
      <Actions>
        {actionable && primaryLabel && (
          <Pill variant="primary" size="sm" onClick={() => trigger(primaryLabel)}>
            {primaryLabel}
          </Pill>
        )}
        {actionable && secondaryLabels.map(label => (
          <Pill key={label} variant="tertiary" size="sm" onClick={() => trigger(label)}>
            {label}
          </Pill>
        ))}
        {actionable && (
          <OtherPill variant="tertiary" size="sm" onClick={() => onRefinement('Other')}>
            Other
          </OtherPill>
        )}
        {offerWorkflow && (
          savedWorkflow ? (
            <Button
              variant="secondary" size="sm"
              leadingArtwork={<CheckIcon size={14} />}
              trailingArtwork={<LinkExternal01Icon size={14} />}
              onClick={() => onSaveWorkflow(thread)}
            >
              Saved
            </Button>
          ) : (
            <Button
              variant="secondary" size="sm"
              leadingArtwork={<Save01Icon size={14} />}
              onClick={() => { onSaveWorkflow(thread); setSavedWorkflow(true); }}
            >
              Save as workflow
            </Button>
          )
        )}
      </Actions>
      {/* TODO: wire ESC to skip/dismiss the case. */}
      <SkipHint>ESC to Skip</SkipHint>
    </ActionCard>
  );
}

// ── Plan tasks ──────────────────────────────────────────────────────────────
// The decision's plan as a checklist of discrete tasks Ultron will run if
// approved. A `showsCandidates` task swaps inline text for a stacked avatar
// group of the people it would contact (drawn from the thread's records).
function PlanTaskList({ tasks, records }: { tasks: PlanTask[]; records: RecordRef[] }) {
  return (
    <TaskList>
      {tasks.map((task, i) => (
        <TaskRow key={i}>
          <TaskMarker aria-hidden="true">{i + 1}</TaskMarker>
          <TaskText>
            <TaskLabel>{task.label}</TaskLabel>
            {task.detail && <TaskDetail>{task.detail}</TaskDetail>}
          </TaskText>
          {task.showsCandidates && records.length > 0 && (
            <TaskTrailing>
              <AvatarStack records={records} />
              <TaskCount>{records.length} candidates</TaskCount>
            </TaskTrailing>
          )}
          {/* A named-person task shows its subject (avatar + name) in the same
             right-aligned trailing slot as the candidate group above. */}
          {task.person && (
            <TaskTrailing>
              <Avatar size="sm" src={threadAvatarUrl(task.person.avatarSeed)} name={task.person.name} alt={task.person.name} />
              <TaskCount>{task.person.name}</TaskCount>
            </TaskTrailing>
          )}
        </TaskRow>
      ))}
    </TaskList>
  );
}

/** Overlapping avatar group — the first few people, then a "+N" overflow chip
 *  when the list runs longer than the cap. */
function AvatarStack({ records }: { records: RecordRef[] }) {
  const MAX = 4;
  const shown = records.slice(0, MAX);
  const extra = records.length - shown.length;
  return (
    <Stack>
      {shown.map((r, i) => (
        <StackItem key={r.avatarSeed} style={{ zIndex: shown.length - i }}>
          <Avatar size="sm" src={threadAvatarUrl(r.avatarSeed)} name={r.title} alt={r.title} />
        </StackItem>
      ))}
      {extra > 0 && <StackOverflow>+{extra}</StackOverflow>}
    </Stack>
  );
}

// ── Analyzing ─────────────────────────────────────────────────────────────────
// The "Ultron is thinking" content (orbit mark + headline + assessment + demo
// trigger). Shared by the in-card analyzing block and the detached card below.
// Accumulating "thinking" stream: reveals one step at a time on a timer. Earlier
// steps settle to a check; the newest pulses. Each new row animates in, so the
// analyzing card grows in height as Ultron's work unfolds. The final step stays
// in-progress (Ultron is still analyzing) until the case flips to Needs approval.
function AnalyzingStream({ steps, completed }: { steps: AnalyzingStep[]; completed?: boolean }) {
  const [count, setCount] = useState(completed ? steps.length : 1);

  useEffect(() => {
    if (completed) { setCount(steps.length); return; }
    if (count >= steps.length) return;
    const t = setTimeout(() => setCount(c => c + 1), 1600);
    return () => clearTimeout(t);
  }, [count, steps.length, completed]);

  const shown = steps.slice(0, count);
  return (
    <Stream role="status" aria-live="polite">
      {shown.map((step, i) => {
        // Once analysis is complete every step reads as done (checked).
        const inProgress = !completed && i === count - 1;
        // The dashed rail connects each step down to the next revealed one; the
        // last visible row has nothing below it yet, so it drops the connector.
        const last = i === shown.length - 1;
        return (
          <StreamRow key={i}>
            <StreamIconCol>
              <StreamMark $done={!inProgress} aria-hidden="true">
                {inProgress
                  ? <WorkingMarkAbs><AgentMark mark="lines" size={36} tone="auto" state="active" motionSpeed={2} coreHalo={false} aria-label="In progress" /></WorkingMarkAbs>
                  : <CheckIcon size={16} />}
              </StreamMark>
              {!last && <StreamConnector />}
            </StreamIconCol>
            <StreamContent $last={last}>
              <StreamHeadline>{step.headline}</StreamHeadline>
              <StreamDetail>{step.detail}</StreamDetail>
            </StreamContent>
          </StreamRow>
        );
      })}
    </Stream>
  );
}

function AnalyzingBody({ thread, onDecide, analyzed, hideDetail, hideTrigger }: { thread: ThreadItem; onDecide: (threadId: string) => void; analyzed?: boolean; hideDetail?: boolean; hideTrigger?: boolean }) {
  // The thinking steps form a collapsible group, mirroring the activity-trail
  // session: the header row toggles the stream open/shut. It stays open while
  // analysis streams; once analyzed, the operator can collapse the recap.
  const [open, setOpen] = useState(true);
  return (
    <>
      {/* The mark + headline double as the group's toggle (like the session
          header), with a trailing chevron. When the event card already carries
          the assessment in its white block (the detached/paged layout), the
          detail is hidden here to avoid repeating it. */}
      <AnalyzingRow as="button" type="button" $interactive aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <AgentMark mark="orbit" size={40} tone="auto" state={analyzed ? 'idle' : 'active'} coreHalo={false} aria-hidden="true" />
        <AnalyzingText>
          <AnalyzingHeadline>
            {analyzed ? (
              'Ultron analyzed this event'
            ) : (
              <>Ultron is analyzing this event<Dots aria-hidden="true"><span>.</span><span>.</span><span>.</span></Dots></>
            )}
          </AnalyzingHeadline>
          {!hideDetail && <AnalyzingDetail>{thread.assessment}</AnalyzingDetail>}
        </AnalyzingText>
        <AnalyzingChevron data-open={open || undefined} aria-hidden="true"><ChevronRightIcon size={14} /></AnalyzingChevron>
      </AnalyzingRow>
      {/* Thinking stream — reveals step-by-step while analyzing; all steps read
          as complete once analyzed. Collapses with the group header above. */}
      {open && <AnalyzingStream steps={analyzingSteps(thread.id)} completed={analyzed} />}
      {/* DEMO ONLY — skip the wait and reveal the recommendation prompt. Gone
          once analysis has completed. In the paged layout the trigger is lifted
          into a bottom-fixed dock (see UltronAnalyzingTrigger), so it's hidden here. */}
      {!analyzed && !hideTrigger && (
        <DemoTrigger variant="secondary" size="sm" onClick={() => onDecide(thread.id)}>
          Trigger Needs approval (demo)
        </DemoTrigger>
      )}
    </>
  );
}

/* DEMO ONLY — the analyzing "Trigger Needs approval" control, lifted out of the
   analyzing card so the paged layout can dock it at the page bottom (mirrors the
   decision surface's dock). */
export function UltronAnalyzingTrigger({ thread, onDecide }: { thread: ThreadItem; onDecide: (threadId: string) => void }) {
  return (
    <DemoTrigger variant="secondary" size="sm" onClick={() => onDecide(thread.id)}>
      Trigger Needs approval (demo)
    </DemoTrigger>
  );
}

// The detached analyzing surface — the same thinking block, lifted out of the
// event card into its own card placed directly below it (the feed's gap sets
// the spacing). Same radius as the event card, a small drop shadow, no border.
// `analyzed` switches it to the completed summary that persists after the case
// has moved on to Needs approval.
export function UltronAnalyzingCard({ thread, onDecide, analyzed, hideTrigger }: { thread: ThreadItem; onDecide: (threadId: string) => void; analyzed?: boolean; hideTrigger?: boolean }) {
  return (
    <AnalyzingCard role="status" aria-live="polite">
      <AnalyzingBody thread={thread} onDecide={onDecide} analyzed={analyzed} hideDetail hideTrigger={hideTrigger} />
    </AnalyzingCard>
  );
}

// Unified, ACCUMULATING activity trail — one component covering the awaiting-
// decision, executing, and resolved phases. It's rendered in a single stable
// slot (keyed by the case id) so it never unmounts as the case moves between
// those phases: the revealed cards persist and the trail only ever GROWS.
//
//   · awaiting  — shows the reasoning Ultron has already completed (the settled
//                 timeline steps); the pending question lives in the docked
//                 decision surface, so it isn't repeated here.
//   · executing — once an action is taken, the remaining steps stream in BELOW
//                 the existing ones (newest types out) — nothing is cleared or
//                 restarted, so the trail accumulates continuously.
//   · resolved  — the full trail, settled.
//
// All three draw from one source (activityForThread), so moving between phases
// just reveals more of the same list — taking an action appends, never refreshes.
/** A trail entry — either one of Ultron's activity cards or the operator's
 *  sent message bubble. The trail is a single chronological stream of these. */
type TrailItem =
  | { kind: 'activity'; milestone: ActivityMilestone }
  | { kind: 'message'; text: string }
  | { kind: 'reply'; text: string };

/** Working milestones carry a flat `detail` string; activity cards take blocks. */
function workingToMilestone(w: WorkingMilestone): ActivityMilestone {
  return { icon: w.icon, headline: w.headline, blocks: w.detail ? [{ text: w.detail }] : undefined };
}

/** Analyzing "thinking" steps carry a headline + detail; fold them into the
 *  accumulated trail as activity milestones so the analysis reads as part of the
 *  one event-activity stream (rather than a separate card above it). */
function analyzingToMilestone(s: AnalyzingStep): ActivityMilestone {
  return { icon: s.icon, headline: s.headline, blocks: s.detail ? [{ text: s.detail }] : undefined };
}

/** Build the chronological trail for a case. With no operator action yet (or a
 *  case resolved without one, e.g. autonomous/historical), it's just the full
 *  activity trail. Once the operator acts, the trail interleaves: the reasoning
 *  Ultron did BEFORE each decision, then the sent message, then the work Ultron
 *  ran as a RESULT of it — repeating per stage (first action, then follow-up). */
function buildTrail(thread: ThreadItem, outbound: string[]): { items: TrailItem[]; reasoningCount: number } {
  const eventMilestones = activityForThread(thread);
  const doneCount = thread.timeline.filter(s => s.done).length;
  const eventCount = doneCount > 0 ? Math.min(doneCount, eventMilestones.length) : eventMilestones.length;
  // The trail reads as a thinking sequence first — the analysis steps Ultron
  // worked through (Reviewed… → Determine course of action → Plan created and
  // shared) — followed by any executed work the case carries (the authored event
  // milestones, e.g. messaged matches / assigned / outcome). Thinking before
  // doing, so a resolved case reads think → plan → execute.
  const milestones = [
    ...analyzingSteps(thread.id).map(analyzingToMilestone),
    ...eventMilestones.slice(0, eventCount),
  ];
  const reasoningCount = milestones.length;

  // No action taken this session → keep the full trail as-is (no messages).
  if (outbound.length === 0) {
    const items: TrailItem[] = milestones.map(m => ({ kind: 'activity', milestone: m }));
    // A case already executing autonomously (working state, no operator action
    // this session) continues the trail with the work Ultron is running — no
    // sent-message bubble, since the operator didn't kick it off here. A case
    // that has since escalated to `monitoring` keeps that completed work shown.
    if (thread.status === 'in_progress' || thread.status === 'monitoring') {
      (WORKING_ACTIVITIES[thread.id] ?? []).map(workingToMilestone)
        .forEach(m => items.push({ kind: 'activity', milestone: m }));
    }
    return { items, reasoningCount };
  }

  // The execution sequence Ultron runs after each decision: stage 0 is the
  // case's own working sequence, stage 1 the follow-up's.
  const followUp = THREAD_FOLLOWUPS[thread.id];
  const segments: ActivityMilestone[][] = [
    (WORKING_ACTIVITIES[thread.id] ?? []).map(workingToMilestone),
    (followUp?.working ?? []).map(workingToMilestone),
  ];

  const items: TrailItem[] = milestones
    .slice(0, reasoningCount)
    .map(m => ({ kind: 'activity', milestone: m } as TrailItem));
  outbound.forEach((text, stage) => {
    items.push({ kind: 'message', text });
    // The work runs first, then Ultron closes with a short text reply beneath it —
    // so each activity group sits above its response to the operator's action.
    (segments[stage] ?? []).forEach(m => items.push({ kind: 'activity', milestone: m }));
    items.push({ kind: 'reply', text: actionAck(stage) });
  });
  return { items, reasoningCount };
}

export function UltronActivityCards({ thread, outbound = [], chat = [], replying = false, analyzing = false }: { thread: ThreadItem; outbound?: string[]; chat?: ChatMessage[]; replying?: boolean; analyzing?: boolean }) {
  // `monitoring` (escalated Working case) reveals its full completed trail, like
  // an executing/resolved case rather than stalling at the reasoning steps.
  const executing = thread.status === 'in_progress' || thread.status === 'monitoring';
  const resolved = thread.status === 'resolved' || thread.status === 'auto_resolved';

  const { items, reasoningCount } = buildTrail(thread, outbound);

  // Revealed-item count: seeded with the reasoning steps, then only ever grows
  // toward the full trail. Because this component stays mounted across phases,
  // the count persists — so acting on a case appends new entries rather than
  // clearing and re-growing the trail from scratch. While analyzing, it streams
  // the reasoning in from the first step (so the group runs live, like Ultron
  // thinking) rather than appearing all at once.
  const [count, setCount] = useState(analyzing ? Math.min(1, reasoningCount) : reasoningCount);
  // Once the operator has acted, every available entry (their message + the
  // resulting work) streams in; otherwise only the reasoning shows until the
  // case actually executes/resolves.
  const target = outbound.length > 0
    ? items.length
    : (executing || resolved ? items.length : reasoningCount);

  useEffect(() => {
    if (count >= target) return;
    const cur = items[count];
    const prev = items[count - 1];
    // The operator's sent message pops in immediately.
    if (cur?.kind === 'message') {
      const t = setTimeout(() => setCount(c => c + 1), 0);
      return () => clearTimeout(t);
    }
    // After the message, the work group (collapsed) and Ultron's text reply appear
    // TOGETHER: reveal the whole execution segment — its activity steps plus the
    // trailing reply — in one beat, so the "Thought for X" summary and the response
    // land in the same frame rather than the text trailing the steps.
    if (prev?.kind === 'message') {
      let end = count;
      while (end < items.length && items[end].kind === 'activity') end++;
      if (end < items.length && items[end].kind === 'reply') end++;
      const t = setTimeout(() => setCount(Math.min(end, target)), POST_REPLY_MS);
      return () => clearTimeout(t);
    }
    // Otherwise pace one item at a time — the live reasoning stream during analysis.
    const t = setTimeout(() => setCount(c => c + 1), ACTIVITY_STEP_MS);
    return () => clearTimeout(t);
  }, [count, target]); // eslint-disable-line react-hooks/exhaustive-deps

  // Group the revealed stream into runs of consecutive activity cards split by
  // message bubbles, so each run renders as one flush activity block and the
  // messages sit between them.
  const revealed = items.slice(0, count);
  const groups: ({ type: 'acts'; milestones: ActivityMilestone[] } | { type: 'msg'; text: string } | { type: 'reply'; text: string })[] = [];
  for (const it of revealed) {
    if (it.kind === 'message') { groups.push({ type: 'msg', text: it.text }); continue; }
    if (it.kind === 'reply') { groups.push({ type: 'reply', text: it.text }); continue; }
    const last = groups[groups.length - 1];
    if (last && last.type === 'acts') last.milestones.push(it.milestone);
    else groups.push({ type: 'acts', milestones: [it.milestone] });
  }

  // The newest activity card types its headline out while Ultron is actively
  // working and the stream is still growing — never re-typing settled cards.
  const streaming = count < items.length;
  const newestIsActivity = revealed.length > 0 && revealed[revealed.length - 1].kind === 'activity';
  // Ultron has caught up with everything available for the current phase.
  const atRest = count >= target;
  // The newest activity always runs its own type-in (blink + typewriter) before
  // the group settles — including the final 'done' step. That last step is
  // revealed with the stream already at its end (streaming=false), so without
  // this it would skip straight to the settled state. Hold a one-beat typing
  // window open once the last revealed item is a fresh activity in a live
  // (working/analyzing) phase; when it elapses the group settles to standby.
  const [newestTyping, setNewestTyping] = useState(false);
  useEffect(() => {
    if (!(atRest && newestIsActivity && (executing || analyzing) && !resolved)) {
      setNewestTyping(false);
      return;
    }
    setNewestTyping(true);
    const t = setTimeout(() => setNewestTyping(false), ACTIVITY_STEP_MS);
    return () => clearTimeout(t);
  }, [atRest, newestIsActivity, count, executing, analyzing, resolved]);
  const typingOn = (executing || analyzing) && (streaming || newestTyping) && newestIsActivity;
  let lastActsIdx = -1;
  groups.forEach((g, i) => { if (g.type === 'acts') lastActsIdx = i; });

  // Once the operator has acted, the reasoning that preceded their first reply
  // is "legacy" — collapse it so the live work stays the focus. Activity groups
  // before the first message bubble are that pre-action reasoning.
  let seenMessage = false;

  // The step Ultron is actively working is the newest revealed activity — but
  // only when it's genuinely the latest item in the trail (the last group is an
  // activity run, not a just-sent message awaiting its first execution card).
  const lastIdx = groups.length - 1;

  // Ultron has caught up with everything available for the current phase (done
  // streaming the reasoning, the working steps, etc.). When it has — and the case
  // isn't resolved — its mark rests at the foot of the trail as a "monitoring"
  // presence, the magnetic form, just below the last completed activity. It stays
  // there across the wait (operator decision, follow-up) until the case resolves.
  // (atRest is computed above, alongside the typing window.)
  // While analyzing, the live working mark rides the reasoning (see below), so the
  // resting "monitoring" mark holds off until analysis settles into a decision.
  // While executing, the working group settles its OWN mark in place (it glides
  // down + morphs lines → magnetic), so the separate foot mark stays out of the
  // way — otherwise the in-trail mark would vanish and this one would pop in below.
  // Once Ultron has finished reasoning a case it communicates its read as a short
  // message right after the (collapsed) thinking group: the situation + the plan
  // it shaped. This message is PERSISTENT — it stays put through the whole
  // lifecycle (awaiting → working → resolved) rather than vanishing the moment the
  // operator acts, so the thread keeps its history (the read + flag card) as new
  // messages and work land below it. Shown once the reasoning has finished
  // streaming, on any post-analysis case (awaiting, executing, or resolved).
  const awaitingDecision = thread.status === 'needs_approval' || thread.status === 'recommended';
  const concluded = awaitingDecision || resolved || thread.status === 'workflow_available';
  const reasoningRevealed = count >= reasoningCount;
  const showPlanMessage = (concluded || executing) && reasoningRevealed && revealed.length > 0;
  // Position the plan message right after the reasoning group(s) and before the
  // first sent message, so it reads chronologically: think → plan → act → work.
  const firstMsgIdx = groups.findIndex(g => g.type === 'msg');
  const planAnchorIdx = firstMsgIdx === -1 ? groups.length - 1 : firstMsgIdx - 1;
  const planNode = showPlanMessage
    ? <UltronPlanMessage paragraphs={casePlan(thread, outbound.length > 0)} flag={THREAD_FLAGS[thread.id]} />
    : null;


  // Ultron's identity mark lives at the very bottom of the thread, travelling with
  // the content as it grows rather than sitting beside any one message. It animates
  // while Ultron composes a chat reply or runs work, and rests idle otherwise.
  // (While analyzing, the live analysis group carries its own mark, so the foot
  // mark holds off until that settles into a plan.)
  const showFootMark = revealed.length > 0 && !analyzing;
  const footActive = replying || executing;

  return (
    <>
      {planAnchorIdx < 0 && planNode}
      {groups.map((g, i) => {
        if (g.type === 'msg') { seenMessage = true; return <UltronOutboundMessages key={`m${i}`} messages={[g.text]} />; }
        // Ultron's text reply to the operator's action — plain prose (its chat
        // voice), introducing the work that streams in below it.
        if (g.type === 'reply') {
          return (
            <InboundRow key={`r${i}`}>
              <InboundBubble><InboundText>{g.text}</InboundText></InboundBubble>
            </InboundRow>
          );
        }
        // Its leading icon slot shows the animated agent mark, gliding down to the
        // newest step — but only while the working group is actively streaming.
        // Once it catches up, the in-trail mark gives way to the resting magnetic
        // mark at the foot of the trail (below).
        // While analyzing, the reasoning group itself is the live "running" group:
        // the working mark rides its newest revealed step and stays there until
        // analysis settles (it doesn't require a preceding message like work does).
        const isAnalyzingGroup = analyzing && i === lastActsIdx;
        // A case executing autonomously (no operator message this session) makes
        // its single trail group the live working group too.
        const isAutonomousWorking = executing && outbound.length === 0 && i === lastActsIdx;
        const isWorkingGroup = isAnalyzingGroup || isAutonomousWorking || (executing && seenMessage && i === lastIdx);
        // The newest-typing window keeps the group "live" (its mark rides the
        // final step) until the type-in finishes, so it settles after — not before.
        const isStreamingGroup = isWorkingGroup && (streaming || newestTyping || isAnalyzingGroup);
        // Once a (non-analyzing) working group catches up, it holds its own mark
        // and settles it: the SAME mark glides just below the last step and morphs
        // lines → magnetic, rather than disappearing while a separate foot mark
        // pops in below. Analysis never settles here — it hands off to the awaiting
        // state's foot mark instead.
        const groupSettling = isWorkingGroup && !isAnalyzingGroup && !streaming && !newestTyping && !resolved;
        const markIndex = (isStreamingGroup || groupSettling) ? g.milestones.length - 1 : undefined;
        // Activity groups stay folded to their "Thought for X" summary by default —
        // even the live working trail while it runs in the background — so the prose
        // messages (the plan above, the reply below) carry the story and the steps
        // tuck away, reopenable on click. The one exception is the live analysis
        // reasoning, which streams open: it has no plan message yet, so watching
        // Ultron think IS the content at that point.
        const collapsed = !isAnalyzingGroup;
        const card = (
          <ActivityTrailCards
            key={`a${i}`}
            milestones={g.milestones}
            typingIndex={i === lastActsIdx && typingOn ? g.milestones.length - 1 : undefined}
            collapsed={collapsed}
            workingIndex={markIndex}
            settled={groupSettling}
          />
        );
        // Ultron's read on the case — the situation + plan it shaped — sits right
        // after the reasoning group and persists through the case's lifecycle, so
        // it isn't lost when the operator acts and work lands below it.
        return planNode && i === planAnchorIdx
          ? <Fragment key={`g${i}`}>{card}{planNode}</Fragment>
          : card;
      })}
      {/* The free-text conversation sits at the foot of the trail: the operator's
          typed messages and Ultron's replies, the latest landing just above the
          composer dock. */}
      <UltronChatThread messages={chat} />
      {/* Ultron's single identity mark — at the very bottom of the thread, after
          every message and work group, so it travels with the content. */}
      {showFootMark && (
        <ChatFootMark role={footActive ? 'status' : 'img'} aria-label={replying ? 'Ultron is replying' : footActive ? 'Ultron is working' : 'Ultron'}>
          <AgentMark mark="circle" size={28} tone="auto" state={footActive ? 'active' : 'idle'} coreHalo={false} aria-hidden="true" />
          {replying && <Dots aria-hidden="true"><span>.</span><span>.</span><span>.</span></Dots>}
        </ChatFootMark>
      )}
    </>
  );
}

// Ultron's plan, shown as a persistent inbound message directly after the
// reasoning group — the prose statement of what it intends to do, which the
// operator then approves (or adjusts) in the docked decision surface. Its
// identity mark is no longer attached here; a single mark rests at the foot of
// the whole thread instead.
function UltronPlanMessage({ paragraphs, flag }: { paragraphs: string[]; flag?: EventFlag }) {
  if (!paragraphs.length) return null;
  return (
    <PlanBlock>
      <PlanBody>
        {paragraphs.map((p, i) => (
          <Fragment key={i}>
            <PlanText>{p}</PlanText>
            {/* The "what's off" card sits right after the opening beat — Ultron
                names the event in prose, then lays out the off-kilter facts before
                walking through its reasoning and plan. */}
            {i === 0 && flag && <FlagCard flag={flag} />}
          </Fragment>
        ))}
      </PlanBody>
    </PlanBlock>
  );
}

/** An info-circle glyph for the neutral tone — drawn inline (Alloy's
 *  InfoCircleIcon isn't reliably re-exported) on the same 24px icon grid. */
function InfoGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" strokeWidth={1.75} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" />
      <path d="M12 11v5M12 8h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The badge glyph per tone: a warning triangle for problems, a check for
 *  resolved/healthy events, an info circle for routine ones. */
const FLAG_TONE_ICON = {
  warning: AlertTriangleIcon,
  positive: CheckIcon,
  neutral: InfoGlyph,
} as const;

/** A compact card surfacing the key facts of an event: a tonal badge + event
 *  header, then a divider and a list of labelled facts — the salient ones (what's
 *  off on a problem, what's confirmed on a resolution) drawn in the tone colour so
 *  they read at a glance. Modelled on Ultron's record/context cards. */
function FlagCard({ flag }: { flag: EventFlag }) {
  const tone = flag.tone ?? 'warning';
  const ToneIcon = FLAG_TONE_ICON[tone];
  return (
    <FlagShell role="group" aria-label={flag.eyebrow} data-tone={tone}>
      <FlagHeader>
        <FlagBadge aria-hidden="true"><ToneIcon size={16} /></FlagBadge>
        <FlagHeadings>
          <FlagTitle>{flag.title}</FlagTitle>
          <FlagSubtitle>{flag.subtitle}</FlagSubtitle>
        </FlagHeadings>
      </FlagHeader>
      <FlagDivider aria-hidden="true" />
      <FlagRows>
        {flag.rows.map((r, i) => (
          <FlagRowEl key={i}>
            <FlagRowLabel>{r.label}</FlagRowLabel>
            <FlagRowValue data-alert={r.alert || undefined}>{r.value}</FlagRowValue>
          </FlagRowEl>
        ))}
      </FlagRows>
    </FlagShell>
  );
}

// The free-text conversation — the operator's typed messages (right, dark
// bubbles) interleaved with Ultron's plain-text replies. Ultron's presence (the
// identity mark / typing indicator) is rendered once at the foot of the whole
// thread by the parent, not per reply here.
export function UltronChatThread({ messages }: { messages: ChatMessage[] }) {
  if (!messages.length) return null;
  return (
    <ChatList>
      {messages.map((m, i) =>
        m.role === 'operator' ? (
          <OutboundRow key={i}>
            <OutboundBubble>
              <OutboundText>{m.text}</OutboundText>
            </OutboundBubble>
          </OutboundRow>
        ) : (
          <InboundRow key={i}>
            <InboundBubble>
              <InboundText>{m.text}</InboundText>
            </InboundBubble>
          </InboundRow>
        ),
      )}
    </ChatList>
  );
}

// Outbound messages — the operator's replies in the thread. Each label the user
// approved from the prompt card lands here as a right-aligned sent bubble,
// placed directly under the existing activities so the middle space reads as a
// conversation between the operator and Ultron.
export function UltronOutboundMessages({ messages }: { messages: string[] }) {
  if (!messages.length) return null;
  return (
    <OutboundList>
      {messages.map((text, i) => (
        <OutboundRow key={i}>
          <OutboundBubble>
            <OutboundText>{text}</OutboundText>
          </OutboundBubble>
        </OutboundRow>
      ))}
    </OutboundList>
  );
}


// ── Styled ───────────────────────────────────────────────────────────────────

const Card = styled.div<{ $expanded: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-lg);
  overflow: hidden;
  /* The expanded event card is deconstructed: transparent, no tonal fill, no
     shadow/border — its content sits flat on the page. Collapsed list cards keep
     their solid surface + flat tonal status fill, and lift on hover. */
  background: ${p => (p.$expanded ? 'transparent' : 'var(--color-bg-primary)')};
  box-shadow: none;
  transition: transform var(--duration-base) var(--ease-out),
              box-shadow var(--duration-base) var(--ease-out);

  ${p => (p.$expanded ? '' : `
  &:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-below-md);
  }`)}

  @media (prefers-reduced-motion: reduce) {
    transition: box-shadow var(--duration-base) var(--ease-out);
    &:hover { transform: none; }
  }

  /* Semantic card tone: high severity → orange, resolved-family → green,
     actively-working (in_progress / monitoring) → blue, everything else
     (medium / low / none) → slate. Only collapsed cards take the flat tonal
     fill; the expanded event card stays transparent. */
  &[data-tone='orange'] { ${p => (p.$expanded ? '' : `background-color: var(--color-orange-bg-tertiary);`)} }
  &[data-tone='green']  { ${p => (p.$expanded ? '' : `background-color: var(--color-green-bg-tertiary);`)} }
  &[data-tone='blue']   { ${p => (p.$expanded ? '' : `background-color: var(--color-blue-bg-tertiary);`)} }
  &[data-tone='slate']  { ${p => (p.$expanded ? '' : `background-color: var(--color-slate-bg-tertiary);`)} }
`;

/* Detached actionable card — the prompt + decision buttons, docked at the page
   bottom. Solid surface with a neutral opaque border + small lift shadow so it
   reads above the scrolling feed without a heavy drop. */
const ActionCard = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-opaque);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-below-low);

  /* Reserve room so the prompt never slides under the absolute dismiss button. */
  > p { padding-right: var(--space-8); }
`;

/* Keyboard hint under the action row — Alloy paragraph / small, muted. */
const SkipHint = styled.p`
  margin: 0;
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-relaxed);
  letter-spacing: var(--tracking-normal);
  color: var(--color-content-inverse-tertiary);
`;

/* Dismiss button — pinned to the card's top-right corner, inset by the card padding. */
const DismissSlot = styled.div`
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
`;

/* The whole header is the accordion toggle — a real button reset to look like
   the row it replaces. */
const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-2) 0;
`;

/* The title region is the accordion toggle — a real button reset to look like
   the row it replaces. The trailing icon is a separate ghost Button (sibling),
   so neither button nests inside the other. */
const HeaderToggle = styled.button`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
  min-width: 0;
  margin: 0;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-border-focus);
  }
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const CardTitle = styled.span`
  /* Alloy label / medium: 14px · medium · relaxed · wide tracking */
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-relaxed);
  letter-spacing: var(--tracking-wide);
  color: var(--color-content-primary);
`;

/* One-line summary of Ultron's question/suggestion — Alloy paragraph / small,
   muted (content-inverse-tertiary), truncated to a single line. */
const CardSubtitle = styled.span`
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-relaxed);
  letter-spacing: var(--tracking-normal);
  color: var(--color-content-inverse-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/* Past-activity trail, rendered on the card's tonal background ABOVE the white
   body. Only mounts while the card is expanded, so it needs no collapse anim.
   The left inset (space-4) centers the trail icons under the header avatar; the
   trail's own icon→text gap then carries the headline text out to align with
   the header title. */
const TrailRegion = styled.div`
  overflow: hidden;
`;

const TrailInner = styled.div`
  padding: var(--space-1) var(--space-4) var(--space-3);
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  /* 8px padding all around for a tight body. A 4px margin all around insets the
     body as a framed panel within the card. */
  padding: var(--space-2);
  margin: var(--space-1);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
`;

/* Intermediate "Ultron is thinking" block — the orbit mark beside a processing
   headline + the event assessment, with the demo trigger below. No prompt,
   records, or actions yet. */
const Analyzing = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  font-family: var(--font-sans);
`;

/* Mark + text row — the orbit mark centers on the headline + assessment. Doubles
   as the collapsible group's toggle (reset button chrome), so it sits flush like
   the activity-trail session header with a trailing chevron. */
const AnalyzingRow = styled.div<{ $interactive?: boolean }>`
  all: ${p => (p.$interactive ? 'unset' : 'revert')};
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  box-sizing: border-box;
  cursor: ${p => (p.$interactive ? 'pointer' : 'default')};

  &:focus-visible {
    box-shadow: 0 0 0 2px var(--color-border-focus);
    border-radius: var(--radius-sm);
  }
`;

/* Chevron points right when collapsed, rotates down when expanded — matches the
   activity-trail session header's disclosure affordance. Pushed to the far right. */
const AnalyzingChevron = styled.span`
  display: inline-flex;
  margin-left: auto;
  color: var(--color-content-tertiary);
  transition: transform var(--duration-base) var(--ease-default);
  &[data-open] { transform: rotate(90deg); }
`;

/* Detached analyzing surface — the in-card thinking block lifted into its own
   card below the event card. Flat white surface (no shadow, no border), matching
   the activity-trail step cards and message bubbles it threads into below. */
const AnalyzingCard = styled(Analyzing)`
  padding: var(--space-4);
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
`;

const AnalyzingText = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
`;

const AnalyzingHeadline = styled.span`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-content-secondary);
`;

/* Alloy paragraph / small. */
const AnalyzingDetail = styled.span`
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-relaxed);
  letter-spacing: var(--tracking-normal);
  color: var(--color-content-tertiary);
`;

/* Accumulating thinking-stream — its 32px mark column sits flush at the card's
   content-left edge so the steps align with the activity-trail step cards below
   (their leading icon rides the same rail). */
const Stream = styled.div`
  display: flex;
  flex-direction: column;
`;

/* Each step slides up + fades in as it arrives (so the card grows). */
const streamIn = keyframes`
  from { opacity: 0; transform: translateY(var(--space-2)); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* Mirrors the activity trail's row: a left icon rail (mark + dashed connector)
   beside a content column (headline + sub-context). */
const StreamRow = styled.div`
  display: flex;
  align-items: stretch;
  gap: var(--space-4);
  animation: ${streamIn} var(--duration-base) var(--ease-out);

  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

const StreamIconCol = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: var(--space-8);
`;

/* Dashed vertical line linking one step's mark down to the next, matching the
   activity trail's connector. */
const StreamConnector = styled.span`
  flex: 1;
  width: 0;
  margin: var(--space-1) 0;
  border-left: 1.5px dashed var(--color-slate-border-tertiary);
  mix-blend-mode: multiply;
`;

const StreamContent = styled.div<{ $last?: boolean }>`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding-bottom: ${p => (p.$last ? '0' : 'var(--space-4)')};
`;

const StreamHeadline = styled.span`
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-snug);
  color: var(--color-content-primary);
`;

const StreamDetail = styled.p`
  margin: 0;
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  line-height: var(--line-height-normal);
  color: var(--color-content-tertiary);
`;

const StreamMark = styled.span<{ $done?: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  color: ${p => (p.$done ? 'var(--color-success-content)' : 'var(--color-content-tertiary)')};
`;

/* In-progress agent mark — overlaid (absolutely centered) on the 32px slot so the
   larger mark can spill past it without growing the row or shifting the headline,
   matching the activity trail's working step. */
const WorkingMarkAbs = styled.span`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: inline-flex;
  pointer-events: none;
`;

/* Resting agent mark — the magnetic form parked at the foot of the trail once
   Ultron has caught up, marking it as present/monitoring below the last activity.
   Left-aligned to sit roughly under the trail's icon column. */
/* DEMO ONLY — manual trigger to flip an analyzing case to Needs approval.
   Sits at the content-left edge, on the same rail as the thinking-stream marks. */
const DemoTrigger = styled(Button)`
  align-self: flex-start;
`;

/* Animated trailing ellipsis — three dots blink in sequence. */
const blink = keyframes`
  0%, 100% { opacity: 0.2; }
  50%      { opacity: 1; }
`;

const Dots = styled.span`
  & > span {
    animation: ${blink} 1.2s ease-in-out infinite;
  }
  & > span:nth-child(2) { animation-delay: 0.15s; }
  & > span:nth-child(3) { animation-delay: 0.3s; }

  @media (prefers-reduced-motion: reduce) {
    & > span { animation: none; }
  }
`;

/* Vertical stack of context record cards (e.g. ranked candidate matches). */
const RecordList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

/* Plan tasks — the decision broken into discrete steps, each a bordered row
   matching the candidate cards' weight. */
const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

const TaskRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-opaque);
  border-radius: var(--radius-button);
`;

/* Numbered step marker — a small circle carrying the task's order. */
const TaskMarker = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: var(--space-6);
  height: var(--space-6);
  border-radius: var(--radius-full);
  background: var(--color-bg-tertiary);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-content-secondary);
`;

/* The task's text column — title above its optional secondary line, taking the
   row's flexible width between the marker and the trailing slot. */
const TaskText = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const TaskLabel = styled.span`
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-snug);
  color: var(--color-content-primary);
`;

/* Secondary line under a task — what the step does, muted. */
const TaskDetail = styled.span`
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-normal);
  color: var(--color-content-tertiary);
`;

/* Trailing slot — the candidate avatar stack + count, right-aligned. */
const TaskTrailing = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
`;

const TaskCount = styled.span`
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  line-height: var(--line-height-snug);
  color: var(--color-content-inverse-tertiary);
  white-space: nowrap;
`;

/* Overlapping avatar group — each avatar tucks under the previous one, ringed in
   the card surface so the overlap reads as a stack. */
const Stack = styled.div`
  display: flex;
  align-items: center;
`;

const StackItem = styled.span`
  display: inline-flex;
  border-radius: var(--radius-full);
  box-shadow: 0 0 0 2px var(--color-bg-primary);

  &:not(:first-child) { margin-left: calc(var(--space-2) * -1); }
`;

/* "+N" overflow chip — same diameter as an xs avatar, tucked under the stack. */
const StackOverflow = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--space-6);
  height: var(--space-6);
  margin-left: calc(var(--space-2) * -1);
  border-radius: var(--radius-full);
  background: var(--color-bg-tertiary);
  box-shadow: 0 0 0 2px var(--color-bg-primary);
  font-family: var(--font-sans);
  font-size: var(--text-2xs, 10px);
  font-weight: var(--font-weight-semibold);
  color: var(--color-content-secondary);
`;

const Prompt = styled.p`
  margin: 0;
  /* Alloy "Label large" type style */
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-relaxed);
  letter-spacing: var(--tracking-normal);
  color: var(--color-content-primary);
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin-top: var(--space-3);
`;

const Pill = styled(Button)`
  border-radius: var(--radius-full);
  padding-left: var(--space-3);
  padding-right: var(--space-3);

  /* Primary pill rides the inverse surface token so it flips with the theme
     (dark fill in light mode, light fill in dark mode). !important is needed to
     beat Alloy's higher-specificity dark-scope rule, which otherwise forces the
     fill back to the page surface token. */
  &[data-variant='primary'] {
    background: var(--color-bg-inverse-primary) !important;
    color: var(--color-content-inverse-primary) !important;
  }

  /* Outlined (secondary) pills get a strong dark border. */
  &[data-variant='tertiary'] {
    border-color: var(--color-content-primary);
  }
`;

const OtherPill = styled(Button)`
  border-radius: var(--radius-full);
  border-style: dashed;
  color: var(--color-content-secondary);
  padding-left: var(--space-3);
  padding-right: var(--space-3);
`;

/* Outbound (sent) messages — right-aligned chat bubbles, stacked below the
   activity trail. A small top gap separates them from the last activity card. */
const OutboundList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-2);
`;

const OutboundRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

/* Each sent bubble glides up + fades in from fully transparent as it's appended. */
const bubbleIn = keyframes`
  from { opacity: 0; transform: translateY(var(--space-4)); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* Dark inverse fill, right side — the operator's voice in the thread. */
const OutboundBubble = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  max-width: 80%;
  padding: var(--space-2) var(--space-4);
  background: var(--color-bg-inverse-primary);
  border-radius: var(--radius-full);
  animation: ${bubbleIn} 460ms cubic-bezier(0.16, 1, 0.3, 1) both;

  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

const OutboundText = styled.span`
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-relaxed);
  color: var(--color-content-inverse-primary);
`;

/* The conversation block — operator + Ultron turns stacked below the trail. The
   top gap lifts it clear of the last activity card / resting mark. */
const ChatList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-2);
`;

/* Inbound (Ultron) turn — left-aligned, the identity mark riding the bubble's
   leading edge so the reply reads as Ultron speaking back. */
const InboundRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: var(--space-3);
`;

/* Ultron's single identity mark at the foot of the thread — left-aligned to the
   conversation's leading edge, with the typing dots beside it while it replies. */
const ChatFootMark = styled.span`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: var(--space-2);
  padding-top: var(--space-1);
`;

/* Ultron's voice in the thread — plain prose on its identity mark (no bubble),
   mirroring the plan message; only the operator's outbound side keeps a bubble.
   Shares the sent-bubble glide-in. */
const InboundBubble = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 80%;
  padding: var(--space-1) 0;
  animation: ${bubbleIn} 460ms cubic-bezier(0.16, 1, 0.3, 1) both;

  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

const InboundText = styled.span`
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  line-height: var(--line-height-relaxed);
  color: var(--color-content-primary);
`;

/* Ultron's plan as plain prose (no bubble) — the paragraphs stacked with the
   identity mark resting below them, left-aligned, reading as a closing statement
   of the trail rather than a chat reply. */
const PlanBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-2);
  animation: ${bubbleIn} 460ms cubic-bezier(0.16, 1, 0.3, 1) both;

  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

/* The plan's paragraph column — reasoning beats stacked above the plan line. */
const PlanBody = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const PlanText = styled.p`
  margin: 0;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  line-height: var(--line-height-relaxed);
  color: var(--color-content-primary);
`;

/* The event-facts card — a bordered, rounded surface sitting between the plan's
   prose beats. A small top/bottom margin lifts it clear of the paragraphs so it
   reads as an inset reference rather than another line of text. `data-tone` sets
   the accent (badge + salient values): warning → orange (what's off), positive →
   green (confirmed), neutral → slate (routine). */
const FlagShell = styled.div`
  --flag-accent: var(--color-orange-content-secondary);
  --flag-badge-bg: var(--color-orange-bg-tertiary);

  display: flex;
  flex-direction: column;
  margin: var(--space-1) 0;
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-opaque);
  border-radius: var(--radius-lg);
  font-family: var(--font-sans);

  &[data-tone='positive'] {
    --flag-accent: var(--color-green-content-secondary);
    --flag-badge-bg: var(--color-green-bg-tertiary);
  }
  &[data-tone='neutral'] {
    --flag-accent: var(--color-slate-content-secondary);
    --flag-badge-bg: var(--color-slate-bg-tertiary);
  }
`;

const FlagHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
`;

/* Tonal badge — a rounded square carrying the tone glyph, tinted by the card's
   accent so it matches the event's severity (orange / green / slate). */
const FlagBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: var(--space-8);
  height: var(--space-8);
  border-radius: var(--radius-md);
  background: var(--flag-badge-bg);
  color: var(--flag-accent);
`;

const FlagHeadings = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const FlagTitle = styled.span`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-snug);
  color: var(--color-content-primary);
`;

const FlagSubtitle = styled.span`
  font-size: var(--text-xs);
  line-height: var(--line-height-snug);
  color: var(--color-content-tertiary);
`;

/* Hairline separating the header from the labelled facts. */
const FlagDivider = styled.span`
  height: 1px;
  margin: var(--space-3) 0;
  background: var(--color-border-opaque);
`;

const FlagRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

/* One labelled fact — label on the left, value on the right. */
const FlagRowEl = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
`;

const FlagRowLabel = styled.span`
  font-size: var(--text-sm);
  color: var(--color-content-tertiary);
`;

/* The value — primary content by default; the *off* facts switch to the warning
   tone and bold so the problem stands out. */
const FlagRowValue = styled.span`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  text-align: right;
  color: var(--color-content-primary);

  &[data-alert] {
    font-weight: var(--font-weight-semibold);
    color: var(--flag-accent);
  }
`;
