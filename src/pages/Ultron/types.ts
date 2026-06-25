/* ─────────────────────────────────────────────────────────────────────────────
   Ultron — workforce operations agent (demo)
   Data model for a Thread Item: a living, AI-managed case that tracks one
   operational event from detection through resolution. DEMO ONLY — all state
   is local/in-memory; no backend calls.
   ───────────────────────────────────────────────────────────────────────────── */

/** Lifecycle state of a thread. Drives deck membership, row treatment, filter. */
export type ThreadStatus =
  | 'analyzing'
  | 'needs_approval'
  | 'recommended'
  | 'in_progress'
  | 'monitoring'
  | 'unresolved'
  | 'resolved'
  | 'auto_resolved'
  | 'workflow_available';

/** Operational urgency. Maps to the leading severity dot + a severity StatusTag. */
export type ThreadSeverity = 'high' | 'medium' | 'low' | 'none';

/** A free-text turn in the operator ⇄ Ultron conversation typed into the composer
 *  at the foot of the event page. The operator's message is echoed back as a sent
 *  bubble; Ultron's reply is mocked (DEMO ONLY — no backend, no real generation). */
export interface ChatMessage {
  role: 'operator' | 'ultron';
  text: string;
}

/** One step in the case timeline (detected → assessment → recommendation → …). */
export interface ThreadTimelineStep {
  /** Lifecycle key, e.g. 'detected', 'assessment', 'recommendation', 'approval'. */
  state: string;
  /** Human-readable headline for the step. */
  headline: string;
  /** Whether this step has completed. The first not-done step is the live one. */
  done: boolean;
}

export interface ThreadItem {
  id: string;
  /** Case name, e.g. "Employee Call-Out Recovery". */
  name: string;
  /** Event headline shown on cards / rows. */
  title: string;
  /** Capability label, e.g. "Coverage Recovery", "Compliance". */
  capability: string;
  status: ThreadStatus;
  severity: ThreadSeverity;
  /** What Ultron detected. */
  event: string;
  /** Ultron's reasoning about the event. */
  assessment: string;
  /** The one-line conclusion of Ultron's analysis, surfaced in the event card
   *  while the case awaits a decision (the white result block under the header). */
  analysisResult?: string;
  /** Ultron's recommended action. */
  recommendation: string;
  /** Populated once the case resolves. */
  outcome: string | null;
  /** A recurring process Ultron could save as a workflow, if any. */
  workflowOpportunity: string | null;
  /** Ordered timeline. */
  timeline: ThreadTimelineStep[];
  /** Ordered action labels — the LAST entry is the primary action. */
  actions: string[];
  /** Mocked relative time, e.g. "18m ago". */
  timestamp: string;
}
