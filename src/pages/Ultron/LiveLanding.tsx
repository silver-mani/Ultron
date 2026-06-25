/* ─────────────────────────────────────────────────────────────────────────────
   Ultron — Live landing.
   The default page state: Ultron's resting presence. A large Orbit identity
   mark (cells riding tilted rings around a luminous core) sits near the top of
   the page, over the Ultron name and a status line that cycles through what
   Ultron is watching (reusing the slide-up + blinking-ellipsis motion of the
   identity card). Below it, a live feed of event cards: a fixed set of rows,
   where one row at a time pops in (scale + fade) with the next event — no
   sliding, no layout shift. The user lands here; selecting a case in the
   sidebar leaves it, and clicking the identity returns to it.
   DEMO ONLY.
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { AgentMark } from './AgentMark';
import { INCOMING_EVENTS } from './fixtures';
import type { IncomingEvent } from './fixtures';

/** What Ultron is doing while it rests on the Live landing — cycled below the
 *  mark, matching the secondary-nav identity card's copy. */
const STATUS_MESSAGES = [
  'Monitoring 142 active shifts',
  'Scanning for coverage risks',
  'Analyzing attendance trends',
  'Optimizing open orders',
];

const STATUS_INTERVAL_MS = 2800;

/** Rendered px of the Circle identity hero mark — large enough to read as the
 *  page's hero, scaled down on short/narrow viewports via the responsive
 *  override. The landing shows Ultron's Circle identity motion (the same mark
 *  used in the nav), rendered at hero scale with its full lush treatment. */
const MARK_SIZE = 200;

/** How many event cards the feed shows at once, how often a new one arrives,
 *  and how long the enter/leave motion runs (kept shorter than the interval so
 *  each transition settles before the next event lands). */
const FEED_WINDOW = 6;
const FEED_INTERVAL_MS = 2200;
const FEED_ANIM_MS = 520;

/** Lifecycle phase of a feed card, driving its CSS transition. */
type CardPhase = 'entering' | 'in' | 'leaving';

/** What a settled card resolves to, shown in its trailing slot. A card flows in
 *  showing a progress loader ("coming in"), then — as it moves up — reveals one
 *  of these:
 *    · none   — "No action needed" (the calm majority)
 *    · action — "Action required"  (a nudge: a quiet blue dot)
 *    · risk   — "Risk detected"    (the hot one: orange Pulse mark; escalates) */
type CardOutcome = 'none' | 'action' | 'risk';

interface FeedCard {
  key: number;
  event: IncomingEvent;
  phase: CardPhase;
  /** The trailing identifier this card lands on once it settles. */
  outcome: CardOutcome;
  /** While false the trailing slot shows the progress loader (the card is still
   *  "coming in"); flips true as the card moves up and the outcome is revealed. */
  resolved: boolean;
}

interface LiveLandingProps {
  /** Fired the moment a "Risk detected" signal surfaces in the feed (its
   *  entering tick) — escalates it into a fresh New case. Each signal fires at
   *  most once. */
  onDetectRisk?: (event: IncomingEvent) => void;
}

export function LiveLanding({ onDetectRisk }: LiveLandingProps) {
  const [i, setI] = useState(0);

  // Latest detect callback held in a ref so the conveyor effect below never
  // re-runs (and re-seeds) just because the parent handed a new closure.
  const onDetectRef = useRef(onDetectRisk);
  onDetectRef.current = onDetectRisk;
  // Signals already escalated this session — each risk opens a case only once.
  const detectedRef = useRef<Set<string>>(new Set());

  // While a risk has just surfaced in the feed, the hero core blooms into its
  // colored gradient (alert) state, then settles back to mono.
  const [riskActive, setRiskActive] = useState(false);
  const riskTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setInterval(() => setI(x => (x + 1) % STATUS_MESSAGES.length), STATUS_INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  // The feed is a conveyor of cards. Each tick appends the next event at the
  // bottom (entering → it expands + pops + fades in, sliding the stack up) and
  // retires the oldest (leaving → it collapses + fades out at the top), then
  // drops the retired card once its exit motion finishes.
  const windowSize = Math.min(FEED_WINDOW, INCOMING_EVENTS.length);
  const [cards, setCards] = useState<FeedCard[]>([]);
  const keyRef = useRef(0);

  // Event sequencer: the feed is overwhelmingly routine "No action required"
  // signals, with a risk surfacing only every ~7 of them (randomised 5–9) so the
  // landing reads calm and a "Risk detected" lands as a rare, notable event.
  const routinePool = useRef(INCOMING_EVENTS.filter(e => !e.risk));
  const riskPool = useRef(INCOMING_EVENTS.filter(e => e.risk));
  const seqRef = useRef({ routine: 0, risk: 0, sinceRisk: 0, gap: 0 });
  const nextGap = () => 5 + Math.floor(Math.random() * 5); // 5–9, averaging 7
  const nextEvent = (): IncomingEvent => {
    const s = seqRef.current;
    const risks = riskPool.current;
    if (risks.length > 0 && s.sinceRisk >= s.gap) {
      s.sinceRisk = 0;
      s.gap = nextGap();
      return risks[s.risk++ % risks.length];
    }
    s.sinceRisk += 1;
    const routine = routinePool.current;
    return routine.length > 0
      ? routine[s.routine++ % routine.length]
      : risks[s.risk++ % risks.length];
  };

  // The outcome a card lands on, picked when it's created (revealed only once it
  // moves up). A real risk event always reads "Risk detected"; routine signals
  // are overwhelmingly "No action needed", with the occasional "Action required"
  // nudge so the feed isn't a single repeated label.
  const outcomeFor = (event: IncomingEvent): CardOutcome =>
    event.risk ? 'risk' : Math.random() < 0.28 ? 'action' : 'none';

  // The card currently sitting at the bottom showing its loader — held in a ref
  // so the next tick can reveal its outcome (and, if it's a risk, fire the
  // detection side-effects) as it moves up.
  const pendingRef = useRef<{ key: number; event: IncomingEvent; outcome: CardOutcome } | null>(null);

  useEffect(() => {
    if (INCOMING_EVENTS.length === 0) {
      setCards([]);
      return;
    }
    // Reset the sequencer, then seed a full window already settled in place
    // (begins mid-gap so the landing opens on routine signals), then run. Every
    // seeded card has already resolved except the last, which sits at the bottom
    // showing its loader — so the landing opens mid-conveyor with one signal
    // still "coming in".
    seqRef.current = { routine: 0, risk: 0, sinceRisk: 0, gap: nextGap() };
    keyRef.current = 0;
    const seeded: FeedCard[] = Array.from({ length: windowSize }, () => {
      const event = nextEvent();
      return {
        key: keyRef.current++,
        event,
        phase: 'in' as CardPhase,
        outcome: outcomeFor(event),
        resolved: true,
      };
    });
    if (seeded.length > 0) {
      const last = seeded[seeded.length - 1];
      last.resolved = false;
      pendingRef.current = { key: last.key, event: last.event, outcome: last.outcome };
    } else {
      pendingRef.current = null;
    }
    setCards(seeded);

    const timers: ReturnType<typeof setTimeout>[] = [];
    const t = setInterval(() => {
      const event = nextEvent();
      const newKey = keyRef.current++;
      const outcome = outcomeFor(event);

      // The card that was loading at the bottom is now moving up: reveal its
      // outcome. A "Risk detected" reveal is the detection moment — it pulses
      // the hero core and escalates into a fresh New case (once per signal).
      const resolving = pendingRef.current;
      if (resolving && resolving.outcome === 'risk') {
        setRiskActive(true);
        if (riskTimerRef.current) clearTimeout(riskTimerRef.current);
        riskTimerRef.current = setTimeout(() => setRiskActive(false), 2800);
        if (!detectedRef.current.has(resolving.event.id)) {
          detectedRef.current.add(resolving.event.id);
          onDetectRef.current?.(resolving.event);
        }
      }
      pendingRef.current = { key: newKey, event, outcome };

      setCards(prev => {
        const live = prev.filter(c => c.phase !== 'leaving');
        const retireKey = live.length >= windowSize ? live[0].key : null;
        const updated = prev.map(c => {
          if (c.key === retireKey) return { ...c, phase: 'leaving' as CardPhase };
          if (resolving && c.key === resolving.key && !c.resolved) return { ...c, resolved: true };
          return c;
        });
        return [...updated, { key: newKey, event, phase: 'entering' as CardPhase, outcome, resolved: false }];
      });

      // Promote the new card to its resting phase shortly after it mounts so
      // the collapsed → open transition actually animates (a short timeout is
      // used over rAF, which can stall when the page isn't actively painting).
      timers.push(
        setTimeout(() => {
          setCards(prev =>
            prev.map(c => (c.key === newKey ? { ...c, phase: 'in' as CardPhase } : c)),
          );
        }, 40),
      );

      // Remove cards once their exit motion has played out.
      timers.push(
        setTimeout(() => {
          setCards(prev => prev.filter(c => c.phase !== 'leaving'));
        }, FEED_ANIM_MS),
      );
    }, FEED_INTERVAL_MS);

    return () => {
      clearInterval(t);
      timers.forEach(clearTimeout);
      if (riskTimerRef.current) clearTimeout(riskTimerRef.current);
    };
  }, [windowSize]);

  return (
    <Stage>
      <Hero>
        <Mark>
          <AgentMark mark="circle" size={MARK_SIZE} tone="auto" state="active" coreGradient={riskActive} aria-label="Ultron" />
        </Mark>
        <Name>Ultron</Name>
        <Status role="status" aria-live="polite">
          {/* Text + dots share one keyed line so they slide up + fade in together
              on each swap; the dots keep their own blink inside. */}
          <StatusLine key={i}>
            <StatusText>{STATUS_MESSAGES[i]}</StatusText>
            <Dots aria-hidden="true"><span>.</span><span>.</span><span>.</span></Dots>
          </StatusLine>
        </Status>
      </Hero>

      {cards.length > 0 && (
        <Feed aria-label="Live event feed">
          {cards.map(c => (
            // The Row wrapper carries the lifecycle phase: it animates its
            // height (slide), opacity (fade) and scale (pop) as the phase moves
            // entering → in → leaving. The inner Clip hides the card while the
            // row is collapsed.
            <Row key={c.key} data-phase={c.phase} aria-hidden={c.phase === 'leaving' || undefined}>
              <Clip>
                <EventCard data-outcome={c.resolved ? c.outcome : 'pending'}>
                  <EventMain>
                    <EventCap>{c.event.capability}</EventCap>
                    <EventTitle>{c.event.title}</EventTitle>
                  </EventMain>
                  {/* Trailing identifier. While the card is coming in it shows an
                      animated 3-dot loader; once it moves up it resolves to one of
                      three: "No action needed", "Action required" (blue Pulse
                      mark), or the orange "Risk detected" Pulse mark. */}
                  <EventTrail>
                    {!c.resolved ? (
                      <TrailDots role="status" aria-label="Analyzing"><span /><span /><span /></TrailDots>
                    ) : c.outcome === 'risk' ? (
                      <>
                        <AgentMark
                          mark="pulse"
                          size={28}
                          tone="auto"
                          state="active"
                          color="var(--color-orange-content-tertiary)"
                          coreHalo={false}
                          aria-hidden="true"
                        />
                        <RiskLabel>Risk detected</RiskLabel>
                      </>
                    ) : c.outcome === 'action' ? (
                      <>
                        <AgentMark
                          mark="pulse"
                          size={28}
                          tone="auto"
                          state="active"
                          color="var(--color-blue-content-primary, var(--color-slate-content-secondary))"
                          coreHalo={false}
                          aria-hidden="true"
                        />
                        <ActionLabel>Action required</ActionLabel>
                      </>
                    ) : (
                      <NoActionLabel>No action needed</NoActionLabel>
                    )}
                  </EventTrail>
                </EventCard>
              </Clip>
            </Row>
          ))}
        </Feed>
      )}
    </Stage>
  );
}

// ── Styled ───────────────────────────────────────────────────────────────────

/* Fills the page: the hero sits near the top, the event feed flows beneath it
   (the feed auto-scrolls itself, so the stage doesn't scroll). Centered
   horizontally; content starts from the top (orbit moved up from the old
   vertical center to make room for the feed). */
const Stage = styled.div`
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-6);
  padding: var(--space-10) var(--space-6) 0;
  text-align: center;
  font-family: var(--font-sans);
`;

/* Landing entrance — the orbit and the list fade in while sliding up into
   place. Plays on mount, so it runs right after the case detail closes (the
   card eases down + out, then the landing rises in). */
const landingIn = keyframes`
  from { opacity: 0; transform: translateY(var(--space-5)); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* The identity block — orbit mark, name, status — held together at the top. */
const Hero = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  animation: ${landingIn} var(--duration-slow, 420ms) var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1)) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/* Soft halo behind the mark — a faint radial bloom so the sphere reads as lit
   on the flat page rather than floating in a void. */
const Mark = styled.div`
  display: grid;
  place-items: center;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: -20%;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      var(--color-bg-secondary, rgba(70, 108, 255, 0.06)) 0%,
      transparent 70%
    );
    pointer-events: none;
  }

  /* Canvas sits above the bloom. */
  & > canvas {
    position: relative;
    z-index: 1;
  }

  @media (max-height: 640px), (max-width: 560px) {
    & > canvas {
      width: 168px !important;
      height: 168px !important;
    }
  }
`;

const Name = styled.h1`
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--tracking-wide);
  color: var(--color-content-primary);
`;

const Status = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: center;
  min-height: var(--space-4);
`;

/* Each status line slides up + fades in as it swaps (keyed remount). The text
   AND its trailing dots ride this one element, so they move together. */
const statusIn = keyframes`
  from { opacity: 0; transform: translateY(var(--space-2)); }
  to   { opacity: 1; transform: translateY(0); }
`;

const StatusLine = styled.span`
  display: inline-flex;
  align-items: baseline;
  animation: ${statusIn} var(--duration-slow) var(--ease-out);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const StatusText = styled.span`
  font-size: var(--text-sm);
  color: var(--color-content-tertiary);
`;

/* Animated trailing ellipsis — three dots blink in sequence (typing). */
const blink = keyframes`
  0%, 100% { opacity: 0.2; }
  50%      { opacity: 1; }
`;

const Dots = styled.span`
  font-size: var(--text-sm);
  color: var(--color-content-tertiary);

  & > span {
    animation: ${blink} 1.2s ease-in-out infinite;
  }
  & > span:nth-child(2) { animation-delay: 0.15s; }
  & > span:nth-child(3) { animation-delay: 0.3s; }

  @media (prefers-reduced-motion: reduce) {
    & > span { animation: none; }
  }
`;

// ── Event feed ─────────────────────────────────────────────────────────────

/* Feed viewport — the conveyor window below the hero. Both edges are masked to
   transparent so cards fade in as they rise into the bottom and fade out as
   they leave the top, on top of each card's own enter/leave fade. */
const Feed = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  text-align: left;
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 12%, #000 80%, transparent 100%);
  mask-image: linear-gradient(to bottom, transparent 0%, #000 12%, #000 80%, transparent 100%);
  /* Rises in just after the hero (slight stagger) so the orbit leads and the
     list follows on the landing's entrance. */
  animation: ${landingIn} var(--duration-slow, 420ms) var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1)) both;
  animation-delay: 90ms;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/* Conveyor row. Drives all three motions off the data-phase attribute:
     • height  — grid-template-rows 1fr → 0fr collapses the row, so adding one
       at the bottom and collapsing one at the top slides the whole stack up;
     • opacity — fades the card in on entry and out on exit;
     • transform — a slight scale (+ lift on entry) for the pop.
   'in' is the resting state (full height, opaque, no transform). */
const Row = styled.div`
  display: grid;
  grid-template-rows: 1fr;
  opacity: 1;
  transform: scale(1);
  transition:
    grid-template-rows ${FEED_ANIM_MS}ms var(--ease-out, ease),
    opacity ${FEED_ANIM_MS}ms var(--ease-out, ease),
    transform ${FEED_ANIM_MS}ms var(--ease-out, ease);

  &[data-phase='entering'] {
    grid-template-rows: 0fr;
    opacity: 0;
    transform: scale(0.92) translateY(var(--space-2));
  }

  &[data-phase='leaving'] {
    grid-template-rows: 0fr;
    opacity: 0;
    transform: scale(0.98);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: opacity ${FEED_ANIM_MS}ms linear;
    &[data-phase='entering'],
    &[data-phase='leaving'] {
      transform: none;
    }
  }
`;

/* Clips the card while its row is collapsed, so height changes read cleanly.
   Bottom spacing lives here (inside the clip) so a collapsed row leaves no
   residual gap. */
const Clip = styled.div`
  overflow: hidden;
  padding-bottom: var(--space-3);
`;

/* Borderless card on the Alloy secondary surface, resting at 50% opacity.
   Hover lifts a card to full opacity. Risk signals carry a faint orange wash so
   they read a touch hotter than routine ones, even at rest (no left accent —
   the Pulse mark + label already mark them). */
const EventCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  opacity: 0.5;
  transition: opacity var(--duration-fast, 120ms) var(--ease-out, ease);

  &:hover { opacity: 1; }

  /* Risk signals carry a faint orange wash once resolved so they read a touch
     hotter than routine ones (the loader + routine states stay neutral). */
  &[data-outcome='risk'] {
    background: var(--color-orange-bg-tertiary, var(--color-bg-secondary));
  }
`;

/* The card's left column — capability eyebrow over the event title. */
const EventMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
`;

/* Trailing identifier slot — the mark + label, pinned to the right edge. */
const EventTrail = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
`;

/* Pending loader — three round dots that blink in sequence. Sized to match the
   28px height of the resolved Pulse marks and centred in the trail row so the
   loader sits on the card's vertical midline. */
const TrailDots = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  height: 28px;

  & > span {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--color-content-tertiary);
    animation: ${blink} 1.2s ease-in-out infinite;
  }
  & > span:nth-child(2) { animation-delay: 0.15s; }
  & > span:nth-child(3) { animation-delay: 0.3s; }

  @media (prefers-reduced-motion: reduce) {
    & > span { animation: none; }
  }
`;

/* "Risk detected" — orange, beside the Pulse mark. The Pulse draws a small
   core centred in a 28px canvas, so ~12px of dead space sits between the dot
   and the canvas edge; a negative margin crops it back so the visible gap from
   the dot to the label reads as the intended 8px. */
const RiskLabel = styled.span`
  margin-left: -12px;
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--tracking-wide);
  color: var(--color-orange-content-secondary, var(--color-orange-content-tertiary));
  white-space: nowrap;
`;

/* "No action needed" — quiet/muted for routine signals. */
const NoActionLabel = styled.span`
  font-size: var(--text-xs);
  font-weight: var(--font-weight-regular);
  color: var(--color-slate-content-tertiary);
  white-space: nowrap;
`;

/* "Action required" — a quiet blue nudge beside the same Pulse mark the "Risk
   detected" row uses, sitting between the calm "No action needed" and the hot
   orange "Risk detected". The negative margin crops the Pulse canvas dead space
   so the gap to the label reads as the intended 8px (see RiskLabel). */
const ActionLabel = styled.span`
  margin-left: -12px;
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--tracking-wide);
  color: var(--color-blue-content-primary, var(--color-slate-content-secondary));
  white-space: nowrap;
`;

/* Capability eyebrow above the event title. */
const EventCap = styled.span`
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-slate-content-tertiary);
`;

const EventTitle = styled.span`
  font-size: var(--text-sm);
  color: var(--color-slate-content-secondary);
`;
