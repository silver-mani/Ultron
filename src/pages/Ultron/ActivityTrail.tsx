/* ─────────────────────────────────────────────────────────────────────────────
   Ultron — past-activity trail.
   A vertical timeline of milestones with a connector line. Milestones that
   carry detail blocks are individually collapsible (paragraph / labeled bullet
   list / labeled check list).
   ───────────────────────────────────────────────────────────────────────────── */

import { useState, useEffect, useRef, useLayoutEffect, type ReactNode } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  Button, CheckIcon, ChevronRightIcon,
  AIMessageActions, ThumbsUpIcon, ThumbsDownIcon, RefreshCw04Icon,
} from 'alloy-design-system';
import type { ActivityMilestone, RecordRef, ActivityUsage as ActivityUsageData } from './fixtures';
import { aggregateUsage } from './fixtures';
import { AgentMark } from './AgentMark';
import { RecordCard } from './RecordCard';

/* The live agent mark's footprint (36px) and the gap it leaves below the last
   step when it settles into its resting magnetic state. Used both to position
   the floating mark (computed transforms) and to reserve room for it. */
const MARK_PX = 36;
const REST_GAP_PX = 8; // var(--space-2)

export function ActivityTrail({ milestones }: { milestones: ActivityMilestone[] }) {
  return (
    <Trail>
      {milestones.map((m, i) => (
        <MilestoneRow key={i} milestone={m} last={i === milestones.length - 1} />
      ))}
    </Trail>
  );
}

/** A "session": one chunk of Ultron's activity — the run of milestones that
 *  happened together (the reasoning before a prompt answer, or the work that
 *  followed one). Rendered as a single collapsible card.
 *   · collapsed — a one-line summary of the activities it collected.
 *   · expanded  — every activity in full (icon + headline + sub-context), with
 *                 no per-activity chevron; the whole session toggles as a unit.
 *  `typingIndex` types out that activity's headline (the one Ultron is mid-thought
 *  on); `workingIndex` marks the step the live agent mark currently rides (the
 *  mark glides down to it as each step completes); `settled` drops the mark just
 *  below the last step and morphs it into the resting magnetic mark once the work
 *  is done; `collapsed` starts the session shut (used for reasoning the operator
 *  has already acted past — the active session streams open). */
export function ActivityTrailCards({ milestones, typingIndex, collapsed, workingIndex, settled }: {
  milestones: ActivityMilestone[];
  typingIndex?: number;
  collapsed?: boolean;
  workingIndex?: number;
  settled?: boolean;
}) {
  return (
    <ActivitySession
      milestones={milestones}
      typingIndex={typingIndex}
      workingIndex={workingIndex}
      settled={settled}
      defaultCollapsed={collapsed}
    />
  );
}

function ActivitySession({ milestones, typingIndex, workingIndex, settled, defaultCollapsed }: {
  milestones: ActivityMilestone[];
  typingIndex?: number;
  workingIndex?: number;
  settled?: boolean;
  defaultCollapsed?: boolean;
}) {
  const [open, setOpen] = useState(!defaultCollapsed);
  // Once the operator acts past a session it settles shut — one-way, so they can
  // still reopen it; the active session stays open as it streams.
  useEffect(() => { if (defaultCollapsed) setOpen(false); }, [defaultCollapsed]);

  // ── Live agent mark ──
  // A single persistent mark rides the icon column rather than swapping between
  // per-step icon slots: it parks over the active step's icon and, because its
  // position animates, glides down to the next step as each one completes. When
  // the work settles it leaves the icons behind, dropping just below the last
  // step where it morphs from the working "lines" mark into a resting "magnetic"
  // field. We measure the live geometry (icons + last row) so the glide lands
  // exactly on the icon centers regardless of how tall each step renders.
  const showMark = open && workingIndex != null;
  const activeRow = workingIndex ?? -1;
  const bodyRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<(HTMLElement | null)[]>([]);
  const rowRefs = useRef<(HTMLElement | null)[]>([]);
  // The feedback row, when shown — the settled mark rests just below it (rather
  // than below the last step, which the feedback row now sits under).
  const actionsRef = useRef<HTMLDivElement>(null);
  const [markPos, setMarkPos] = useState<{ x: number; y: number; ready: boolean }>({ x: 0, y: 0, ready: false });

  // Keep the mark mounted briefly after it should hide (the work caught up and
  // the resting magnetic mark takes over below) so it fades out in place rather
  // than vanishing — the two cross-fade. It holds its last measured position
  // while fading since the measure effect bails when showMark is false.
  const [linger, setLinger] = useState(false);
  useEffect(() => {
    if (showMark) { setLinger(true); return; }
    if (!linger) return;
    const t = setTimeout(() => setLinger(false), 280);
    return () => clearTimeout(t);
  }, [showMark]); // eslint-disable-line react-hooks/exhaustive-deps
  const renderMark = showMark || linger;

  // The mark's first appearance should just fade in at its spot — not glide in
  // from the corner (its pre-measure 0,0 origin). So the gliding transform
  // transition stays OFF for the initial placement and switches ON one frame
  // after the mark is first positioned, leaving step-to-step moves animated.
  const [glide, setGlide] = useState(false);
  useEffect(() => {
    if (!renderMark) { setGlide(false); return; }
    if (!markPos.ready) return;
    const r = requestAnimationFrame(() => setGlide(true));
    return () => cancelAnimationFrame(r);
  }, [renderMark, markPos.ready]);

  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body || !showMark) return;
    const measure = () => {
      const bRect = body.getBoundingClientRect();
      const lastIcon = iconRefs.current[milestones.length - 1] ?? iconRefs.current.find(Boolean) ?? null;
      const refIcon = settled ? lastIcon : iconRefs.current[activeRow];
      const ic = refIcon?.getBoundingClientRect();
      // Horizontal: center on the icon column (the same x whether riding a step
      // or resting below the trail).
      const x = ic ? ic.left - bRect.left + ic.width / 2 : MARK_PX / 2;
      // Vertical: the active icon's center, or — when settled — a small gap below
      // the last step's full height.
      let y: number;
      if (settled) {
        // Rest just below the trail's full content — beneath the feedback row when
        // it's present, else the last step — so the mark glides down to the foot in
        // one continuous move rather than landing on top of the feedback row.
        const anchor = actionsRef.current ?? rowRefs.current[milestones.length - 1];
        const ar = anchor?.getBoundingClientRect();
        y = (ar ? ar.bottom - bRect.top : 0) + REST_GAP_PX + MARK_PX / 2;
      } else {
        y = ic ? ic.top - bRect.top + ic.height / 2 : 0;
      }
      setMarkPos({ x, y, ready: true });
    };
    measure();
    // Re-measure when a step expands/collapses or the card reflows, so the glide
    // (and the resting position) track the live layout.
    const ro = new ResizeObserver(measure);
    ro.observe(body);
    return () => ro.disconnect();
  }, [showMark, settled, activeRow, milestones.length, open]);

  // The session header is identical whether open or shut: a meta summary of the
  // activities — how many, and how long Ultron "thought" — plus a trailing
  // chevron. Toggling only rotates the chevron and reveals/hides the list below.
  const count = milestones.length;
  // Synthesised thinking time for the demo, derived deterministically from the
  // activities so it stays stable across renders (no Math.random).
  const thinkSecs = count * 6 + (milestones.reduce((s, m) => s + m.headline.length, 0) % 18);
  const thought = thinkSecs < 60 ? `${thinkSecs} sec` : `${Math.round(thinkSecs / 60)} min`;
  const summary = `Thought for ${thought}`;

  return (
    <SessionShell>
      <SessionHeader type="button" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <SummaryText>{summary}</SummaryText>
        <Chevron data-open={open || undefined} aria-hidden="true"><ChevronRightIcon size={14} /></Chevron>
      </SessionHeader>

      {open && (
        <SessionBody ref={bodyRef} $reserve={!!settled}>
          {milestones.map((m, i) => (
            <RowAnchor key={i} ref={el => { rowRefs.current[i] = el; }}>
              {i < milestones.length - 1 && <SessionConnector aria-hidden="true" />}
              <MilestoneContent
                milestone={m}
                last
                collapsible={false}
                typing={i === typingIndex}
                /* Combined usage for the whole group, shown once under its last
                   activity — the full set of tools/skills/data Ultron drew on.
                   Held back until the group finishes (no live mark riding it), so
                   it appears only after the last activity is done. */
                usage={i === milestones.length - 1 && (workingIndex == null || settled) ? aggregateUsage(milestones.map(m => m.icon)) : undefined}
                icon={
                  <MilestoneIcon
                    icon={m.icon}
                    slotRef={el => { iconRefs.current[i] = el; }}
                    /* The icon the mark is currently riding hides behind it so it
                       reappears (as the completed step's icon) once the mark glides on. */
                    hidden={showMark && !settled && i === activeRow}
                  />
                }
              />
            </RowAnchor>
          ))}
          {/* Feedback row for the whole group — thumbs up/down, rerun, and a
              timestamp. Shown once the group is no longer actively streaming (no
              live mark riding it), so it reads as actions on a finished response. */}
          {(workingIndex == null || settled) && (
            <div ref={actionsRef}><SessionActions time={synthClock(milestones)} /></div>
          )}
          {renderMark && (
            <FloatingMark
              role="img"
              aria-label={settled ? 'Ultron monitoring' : 'Ultron is working'}
              $glide={glide}
              style={{
                transform: `translate(${markPos.x - MARK_PX / 2}px, ${markPos.y - MARK_PX / 2}px)`,
                opacity: showMark && markPos.ready ? 1 : 0,
              }}
            >
              <AgentMark
                mark={settled ? 'magnetic' : 'lines'}
                size={MARK_PX}
                tone="auto"
                state="active"
                motionSpeed={settled ? 1.2 : 2}
                coreHalo={false}
                aria-hidden="true"
              />
            </FloatingMark>
          )}
        </SessionBody>
      )}
    </SessionShell>
  );
}

/** A deterministic "h:mm AM/PM" clock label for a group, derived from its
 *  activities so it stays stable across renders (no Date/Math.random in the
 *  demo). Anchored at 9:41 AM and nudged by the combined headline length. */
function synthClock(milestones: ActivityMilestone[]): string {
  const offset = milestones.reduce((s, m) => s + m.headline.length, 0) % 200;
  const total = 9 * 60 + 41 + offset; // base 9:41 AM
  const h24 = Math.floor(total / 60) % 24;
  const min = total % 60;
  const period = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(min).padStart(2, '0')} ${period}`;
}

/** The AI action cluster beneath a finished activity group: a thumbs up/down
 *  rating, a rerun, and a trailing timestamp. The thumbs are a single toggle —
 *  picking one clears the other, clicking the active one clears it. Local,
 *  self-contained state (demo feedback only). */
function SessionActions({ time }: { time: string }) {
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const toggle = (v: 'up' | 'down') => setVote(c => (c === v ? null : v));
  return (
    <ActionsRow>
      <AIMessageActions visibility="always" time={time}>
        <RateButton
          variant="ghost" size="xs" iconOnly
          aria-label="Good response" aria-pressed={vote === 'up'}
          data-active={vote === 'up' || undefined}
          onClick={() => toggle('up')}
        >
          <ThumbsUpIcon size={14} />
        </RateButton>
        <RateButton
          variant="ghost" size="xs" iconOnly
          aria-label="Bad response" aria-pressed={vote === 'down'}
          data-active={vote === 'down' || undefined}
          onClick={() => toggle('down')}
        >
          <ThumbsDownIcon size={14} />
        </RateButton>
        <Button variant="ghost" size="xs" iconOnly aria-label="Rerun">
          <RefreshCw04Icon size={14} />
        </Button>
      </AIMessageActions>
    </ActionsRow>
  );
}

function MilestoneRow({ milestone, last }: { milestone: ActivityMilestone; last: boolean }) {
  return (
    <Row>
      <IconCol>
        <MilestoneIcon icon={milestone.icon} />
        {!last && <Connector />}
      </IconCol>
      <MilestoneContent milestone={milestone} last={last} />
    </Row>
  );
}

/** A block's referenced records as record cards. Shows a few by default with a
 *  "Show more" toggle to reveal the full set (and "Show less" to collapse). */
function BlockRecords({ records, initial = 3 }: { records: RecordRef[]; initial?: number }) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? records : records.slice(0, initial);
  const hidden = records.length - initial;
  return (
    <RecordCardList>
      {shown.map((r, k) => <RecordCard key={k} record={r} />)}
      {hidden > 0 && (
        <ShowMore type="button" onClick={() => setShowAll(v => !v)}>
          {showAll ? 'Show less' : `Show ${hidden} more`}
        </ShowMore>
      )}
    </RecordCardList>
  );
}

function MilestoneIcon({ slotRef, hidden }: {
  icon: ActivityMilestone['icon'];
  slotRef?: (el: HTMLElement | null) => void;
  hidden?: boolean;
}) {
  // Settled activities read as completed steps — a success checkmark on the icon
  // rail. The live agent mark is no longer drawn here — it floats over the column
  // (see ActivitySession). `slotRef` lets that mark measure this icon's position
  // so it can glide onto it; `hidden` keeps the icon's layout while the mark
  // covers it, so geometry stays measurable (the check reappears once it glides on).
  return <IconBadge ref={slotRef} aria-hidden="true" $hidden={hidden}><CheckIcon size={16} /></IconBadge>;
}

/** A milestone's headline + (collapsible) detail blocks. Shared by the inline
 *  trail row and the standalone step card. While `typing`, the headline pulses
 *  (a live "thinking" blink) and the secondary text types out beneath it —
 *  Ultron mid-thought. */
function MilestoneContent({ milestone, last, typing, icon, collapsible = true, usage }: { milestone: ActivityMilestone; last?: boolean; typing?: boolean; icon?: ReactNode; collapsible?: boolean; usage?: ActivityUsageData }) {
  const hasBlocks = !!milestone.blocks?.length;
  const [open, setOpen] = useState(true);

  // Inside a session the activity is never individually collapsible: it shows its
  // full sub-context with no chevron (the session toggles as a unit). The
  // connected trail keeps the per-row toggle. While typing, the toggle is inert.
  const interactive = collapsible && hasBlocks && !typing;
  // Blocks reveal immediately (even while typing) so the secondary text can type
  // out in place rather than popping in after the headline.
  const showBlocks = hasBlocks && (collapsible ? open : true);

  return (
    <Content $last={last}>
      <Header
        as={interactive ? 'button' : 'div'}
        type={interactive ? 'button' : undefined}
        $interactive={interactive}
        aria-expanded={interactive ? open : undefined}
        onClick={interactive ? () => setOpen(o => !o) : undefined}
      >
        {/* Card layout rides the icon inline here, so it centers against the
            title (top row: icon + title); the connected trail leaves it out
            (the icon lives in the left rail instead). */}
        {icon}
        <Headline $blink={!!typing}>{milestone.headline}</Headline>
        {interactive && (
          <Chevron data-open={open || undefined} aria-hidden="true"><ChevronRightIcon size={14} /></Chevron>
        )}
      </Header>

      {showBlocks && (
        <Blocks $indent={!!icon}>
          {milestone.blocks!.map((b, j) => (
            <Block key={j}>
              {b.text && <BlockText>{typing ? <Typewriter text={b.text} /> : b.text}</BlockText>}
              {b.label && <BlockLabel>{b.label}</BlockLabel>}
              {b.bullets && (
                <BulletList>
                  {b.bullets.map((x, k) => <li key={k}>{x}</li>)}
                </BulletList>
              )}
              {b.checks && (
                <CheckList>
                  {b.checks.map((x, k) => (
                    <li key={k}><CheckDot aria-hidden="true" /><span>{x}</span></li>
                  ))}
                </CheckList>
              )}
              {b.records && <BlockRecords records={b.records} />}
            </Block>
          ))}
        </Blocks>
      )}

      {/* Card/session layout (icon mode): a toggle that reveals the tools, skills,
          and data the group drew on. Shown only under the last activity in a
          group (where `usage` is passed), and only once the headline finishes
          typing so it doesn't pop in mid-thought. */}
      {icon && !typing && usage && <ActivityUsage usage={usage} />}
    </Content>
  );
}

/** A 24px tertiary toggle that shows/hides the tools, skills, and data a group
 *  of activities drew on (the combined, deduped set). Collapsed by default. */
function ActivityUsage({ usage }: { usage: ActivityUsageData }) {
  const [open, setOpen] = useState(false);
  // Label is a verb-led summary of what the activity drew on — "ran N skills,
  // read N data, used N tools" — with empty categories omitted.
  const plural = (n: number, s: string) => `${n} ${n === 1 ? s : s + 's'}`;
  const label = [
    usage.skills.length ? `ran ${plural(usage.skills.length, 'skill')}` : null,
    usage.data.length ? `read ${usage.data.length} data` : null,
    usage.tools.length ? `used ${plural(usage.tools.length, 'tool')}` : null,
  ].filter(Boolean).join(', ');
  if (!label) return null;
  // Capitalize the leading verb (the first segment, whichever it is).
  const labelText = label.charAt(0).toUpperCase() + label.slice(1);
  return (
    <Usage>
      <UsageToggle
        type="button"
        variant="tertiary"
        size="xs"
        aria-expanded={open}
        trailingArtwork={<UsageChevron data-open={open || undefined}><ChevronRightIcon size={12} /></UsageChevron>}
        onClick={() => setOpen(o => !o)}
      >
        {labelText}
      </UsageToggle>
      {open && (
        <UsagePanel>
          <UsageGroup label="Tools" items={usage.tools} />
          <UsageGroup label="Skills" items={usage.skills} />
          <UsageGroup label="Data" items={usage.data} />
        </UsagePanel>
      )}
    </Usage>
  );
}

function UsageGroup({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <UsageRow>
      <UsageLabel>{label}</UsageLabel>
      <UsageChips>
        {items.map((t, i) => <Chip key={i}>{t}</Chip>)}
      </UsageChips>
    </UsageRow>
  );
}

// ── Styled ───────────────────────────────────────────────────────────────────

const Trail = styled.div`
  display: flex;
  flex-direction: column;
  font-family: var(--font-sans);
`;

/* Each session slides up + fades in as it's revealed, so the trail grows. */
const cardIn = keyframes`
  from { opacity: 0; transform: translateY(var(--space-2)); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* A session — one collapsible run of activities, sitting flush in the feed (no
   padded card frame) so its header and steps line up with the rest of the trail. */
const SessionShell = styled.div`
  display: flex;
  flex-direction: column;
  font-family: var(--font-sans);
  animation: ${cardIn} var(--duration-base) var(--ease-out);

  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

/* The session toggle: the one-line summary row, identical whether the session
   is open or shut — only the chevron rotates and the activity list below it
   reveals. */
const SessionHeader = styled.button`
  all: unset;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;

  &:focus-visible {
    box-shadow: 0 0 0 2px var(--color-border-focus);
    border-radius: var(--radius-sm);
  }
`;

/* Sizes to its content (no flex-grow) so the trailing chevron sits right after
   the label rather than at the far edge of the row. */
const SummaryText = styled.span`
  min-width: 0;
  text-align: left;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-snug);
  color: var(--color-content-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/* Condensed activity stack inside an expanded session. Positioned so the live
   agent mark can be absolutely placed over the icon column; when the mark settles
   it rests below the last step, so we reserve room for it (animated, so the trail
   eases open rather than jumping). */
const SessionBody = styled.div<{ $reserve?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-3);
  /* space-8 (mark) + space-2 (rest gap), via the same calc the mark box uses. */
  padding-bottom: ${p => (p.$reserve ? 'calc(var(--space-8) + var(--space-2) + var(--space-1))' : '0')};
  transition: padding-bottom var(--duration-slow) var(--ease-out);

  @media (prefers-reduced-motion: reduce) { transition: none; }
`;

/* Wraps each step so the floating mark can measure the step's full extent (to
   land its resting position just below the last one). */
const RowAnchor = styled.div`
  min-width: 0;
  position: relative;
`;

/* Dashed vertical line linking one session step's leading icon to the next,
   running down the icon column and bridging the inter-row gap. Uses the neutral
   divider stroke so it reads on both light and dark surfaces. Inset top/bottom by
   space-1 for breathing room. */
const SessionConnector = styled.span`
  position: absolute;
  /* Centered on the 32px icon column. */
  left: calc(var(--space-8) / 2);
  top: calc(var(--space-8) + var(--space-1));
  bottom: calc(var(--space-1) - var(--space-3));
  width: 0;
  border-left: 1.5px dashed var(--color-border-opaque);
  pointer-events: none;
`;

/* The single live agent mark. Absolutely placed within the session body and
   moved via a transform that animates, so it glides from step to step and then
   down to its resting spot. 36px = space-8 + space-1. */
const FloatingMark = styled.span<{ $glide?: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: calc(var(--space-8) + var(--space-1));
  height: calc(var(--space-8) + var(--space-1));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  /* Gentle ease-in-out so the glide between steps accelerates and settles
     smoothly rather than snapping; a softer opacity fade lets it cross-fade with
     the resting magnetic mark on handoff. The transform transition is withheld
     for the first placement ($glide false) so the mark fades in where it belongs
     instead of sliding in from the corner. */
  transition: ${p => (p.$glide ? 'transform 460ms cubic-bezier(0.4, 0, 0.2, 1), ' : '')}opacity 260ms var(--ease-out);
  will-change: transform, opacity;

  @media (prefers-reduced-motion: reduce) {
    transition: opacity 200ms var(--ease-out);
  }
`;

/* The group's feedback footer — sits below the last activity with quiet top
   spacing so it reads as a trailing action row rather than another step. Hung
   under the headline (clears the inline icon column like Blocks/Usage) so the
   cluster lines up with the sub-context text above it. */
const ActionsRow = styled.div`
  padding-top: var(--space-4);
  /* Nudge the action cluster 8px further below the usage toggle. */
  margin-top: var(--space-2);
  /* Sit on the group's left rail — flush with the session summary and the
     activity icon column — rather than indented onto the content rail. */

  /* Size the action buttons (thumbs up/down + rerun) to a 32px tap target,
     keeping their icons centered. The min-width override beats the design
     system's icon-only width rule. */
  & button {
    width: 32px;
    min-width: 32px;
    height: 32px;
    padding: 0;
  }
`;

/* A thumbs button that lights up when it's the active rating; otherwise it
   matches the tertiary chrome of the rest of the cluster. */
const RateButton = styled(Button)`
  &[data-active] { color: var(--color-content-brand); }
`;

/* Types a string out character-by-character with a blinking caret. The full
   text is always laid out (the un-typed tail is rendered transparent) so the
   line never re-wraps as it fills in — the reveal stays smooth and jump-free. */
function Typewriter({ text, onDone, speed = 30 }: { text: string; onDone?: () => void; speed?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => { setN(0); }, [text]);
  useEffect(() => {
    if (n >= text.length) return;
    const t = setTimeout(() => setN(v => v + 1), speed);
    return () => clearTimeout(t);
  }, [n, text, speed]);
  const done = n >= text.length;
  useEffect(() => { if (done) onDone?.(); }, [done]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      {text.slice(0, n)}
      <Caret $blink={done} aria-hidden="true" />
      {!done && <Pending aria-hidden="true">{text.slice(n)}</Pending>}
    </>
  );
}

const caretBlink = keyframes`
  0%, 100% { opacity: 1; }
  50%      { opacity: 0; }
`;

const Caret = styled.span<{ $blink?: boolean }>`
  display: inline-block;
  width: 1px;
  height: 1em;
  margin-left: 1px;
  /* Centre on the text rather than the line box — text-bottom anchored the caret
     to the line-box bottom (the leading/descender gap), leaving it sitting low. */
  vertical-align: middle;
  background: currentColor;
  animation: ${p => (p.$blink ? caretBlink : 'none')} 1s step-end infinite;

  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

/* The not-yet-typed tail — kept in the layout but invisible, so the headline
   reserves its full width up front and never re-wraps mid-type. */
const Pending = styled.span`
  opacity: 0;
`;

const Row = styled.div`
  display: flex;
  align-items: stretch;
  /* space-4 (not space-3) so the headline clears the icon column and lands
     under the header title while the icon stays centered under the avatar. */
  gap: var(--space-4);
`;

const IconCol = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: var(--space-8);
`;

/* 32px leading-icon slot — the icon (16px) centers within it, giving each step
   a badge-sized icon column that lines up under the header avatar. `$hidden`
   keeps the slot's layout (so the floating mark can still measure it) while the
   mark visually stands in for it. */
const IconBadge = styled.span<{ $hidden?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: var(--space-8);
  height: var(--space-8);
  color: var(--color-success-content);
  visibility: ${p => (p.$hidden ? 'hidden' : 'visible')};
`;

/* Dashed vertical line connecting one milestone's icon to the next. Multiply
   blend lets the light slate dashes darken against the card's tonal background
   instead of sitting on top as a flat gray. */
const Connector = styled.span`
  flex: 1;
  width: 0;
  margin: var(--space-1) 0;
  border-left: 1.5px dashed var(--color-slate-border-tertiary);
  mix-blend-mode: multiply;
`;

const Content = styled.div<{ $last?: boolean }>`
  flex: 1;
  min-width: 0;
  padding-bottom: ${p => (p.$last ? '0' : 'var(--space-4)')};
`;

const Header = styled.div<{ $interactive?: boolean }>`
  all: unset;
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

/* While the row is the one Ultron is mid-thought on, the label pulses (a soft
   opacity blink) to read as live, then settles solid once the row finishes. */
const labelBlink = keyframes`
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.4; }
`;

const Headline = styled.span<{ $blink?: boolean }>`
  font-size: var(--text-sm); /* 14px */
  font-weight: var(--font-weight-medium);
  color: var(--color-content-primary);
  line-height: var(--line-height-snug);
  animation: ${p => (p.$blink ? labelBlink : 'none')} 1.1s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

/* Chevron points right when collapsed, rotates to point down when expanded. */
const Chevron = styled.span`
  display: inline-flex;
  color: var(--color-content-tertiary);
  transition: transform var(--duration-base) var(--ease-default);
  &[data-open] { transform: rotate(90deg); }
`;

/* The sub-context eases in once the headline finishes typing, rather than
   popping in — a soft fade + small upward settle. */
const blocksIn = keyframes`
  from { opacity: 0; transform: translateY(calc(-1 * var(--space-1))); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Blocks = styled.div<{ $indent?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-1);
  /* Card layout: hang the sub-context under the title by clearing the inline
     icon column (icon width --space-8 + header gap --space-3). */
  padding-left: ${p => (p.$indent ? 'calc(var(--space-8) + var(--space-3))' : '0')};
  animation: ${blocksIn} var(--duration-base) var(--ease-out);

  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

const Block = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

/* Per-activity usage disclosure — sits under the activity's sub-context, hung
   under the headline (clears the inline icon column like Blocks). */
const Usage = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-3);
  padding-left: calc(var(--space-8) + var(--space-3));
`;

/* The 24px tertiary toggle. Its left edge lines up with the headline label and
   sub-context text above it (no negative inset). */
const UsageToggle = styled(Button)`
  align-self: flex-start;
  /* The usage summary is the faintest text on the card — one step lighter than
     the tertiary captions around it. */
  color: var(--color-content-disabled);
`;

/* Trailing chevron — points right, rotates down when the panel is open. */
const UsageChevron = styled.span`
  display: inline-flex;
  transition: transform var(--duration-base) var(--ease-default);
  &[data-open] { transform: rotate(90deg); }
`;

const UsagePanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  animation: ${blocksIn} var(--duration-base) var(--ease-out);

  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

const UsageRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
`;

const UsageLabel = styled.span`
  flex-shrink: 0;
  width: var(--space-10);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-content-secondary);
`;

const UsageChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
`;

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  background: var(--color-bg-tertiary);
  font-size: var(--text-xs);
  line-height: var(--line-height-snug);
  color: var(--color-content-secondary);
`;

const BlockText = styled.p`
  margin: 0;
  font-size: var(--text-xs);
  line-height: var(--line-height-normal);
  color: var(--color-content-tertiary);
`;

const BlockLabel = styled.span`
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-content-secondary);
`;

/* Referenced records (people/shifts) rendered as compact record cards. */
const RecordCardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-1);
`;

/* Inline text toggle to reveal the rest of a long record list. */
const ShowMore = styled.button`
  align-self: flex-start;
  margin: 0;
  padding: var(--space-1) 0;
  background: none;
  border: none;
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-content-secondary);
  cursor: pointer;

  &:hover { color: var(--color-content-primary); }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-border-focus);
    border-radius: var(--radius-sm);
  }
`;

const BulletList = styled.ul`
  margin: 0;
  padding-left: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  list-style: disc;

  & li {
    font-size: var(--text-xs);
    line-height: var(--line-height-normal);
    color: var(--color-content-tertiary);
  }
`;

const CheckList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);

  & li {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
    line-height: var(--line-height-normal);
    color: var(--color-content-tertiary);
  }
`;

/* The leading marker for a check-list item — a small dot in place of a check
   glyph, matching the disc bullets used elsewhere in the trail. */
const CheckDot = styled.span`
  flex-shrink: 0;
  width: 4px;
  height: 4px;
  border-radius: var(--radius-full);
  background: currentColor;
`;
