/* ─────────────────────────────────────────────────────────────────────────────
   Ultron demo fixtures
   Sourced from the activity-feed seed data (20 simulated events). Each event
   carries a trigger, Ultron's silent investigation (the "Analyzing event"
   steps), the recommended plan ("What I'd do"), the one-tap question ("Ask:"),
   and an outcome state.

   The seed data's own state field (action · wait · none) describes whether
   Ultron can act, needs a person, or has nothing to do. For a realistic demo
   the cases are spread across the three lifecycle groups instead — New (needs
   attention), Working, and Done — so every component path is exercised:
     · New  → analyzing / needs_approval / recommended
     · Working → in_progress / monitoring
     · Done → resolved / auto_resolved / workflow_available / unresolved
   The "no action needed" (none) events land in Done as clean auto-resolutions.

   Notes:
   · `status` drives deck membership / row treatment; it is the only field that
     diverges from the seed data's own state, by design (see above).
   · A resolved case with a non-null `workflowOpportunity` renders purple
     (save-as-workflow). `workflow_available` always renders purple.
   · Array order is authored most-recent-first; recency sorting relies on it.
   ───────────────────────────────────────────────────────────────────────────── */

import type { ThreadItem, ThreadSeverity } from './types';

export const ultronThreads: ThreadItem[] = [
  // ── New · Needs attention (needs_approval) ─────────────────────────────────
  {
    id: 'shift_drop_maria',
    name: 'Shift Drop Recovery',
    title: 'Maria Ellis dropped her 2pm shift at Riverside Clinic',
    capability: 'Coverage Recovery',
    status: 'needs_approval',
    severity: 'high',
    event: 'Maria dropped her 2:00 PM RN shift at Riverside Clinic.',
    assessment: 'Urgent fill — the shift starts in under 12 hours and still has no replacement.',
    analysisResult: '8 available RNs match, with no overtime or do-not-return conflicts.',
    recommendation: 'Find a qualified replacement and fill it.',
    outcome: null,
    workflowOpportunity: 'Automate urgent shift-drop recovery.',
    timeline: [
      { state: 'detected', headline: 'RN dropped this afternoon’s shift', done: true },
      { state: 'assessment', headline: 'Starts in under 12 hours — urgent fill', done: true },
      { state: 'recommendation', headline: '8 qualified RNs identified', done: true },
      { state: 'approval', headline: 'Approval required before outreach', done: false },
    ],
    actions: ['Message replacements', 'Assign first yes', 'Notify scheduler'],
    timestamp: '8:02 AM',
  },
  {
    id: 'timeoff_sofia',
    name: 'Time-Off Coverage Check',
    title: 'Sofia Marin requested time off next Thursday–Friday',
    capability: 'Time Off',
    status: 'needs_approval',
    severity: 'medium',
    event: 'Sofia requested time off next Thursday and Friday.',
    assessment: 'Two assigned shifts fall inside the window — Thursday is covered, Friday is thin.',
    analysisResult: 'PTO balance covers it; only one backup is available for Friday.',
    recommendation: 'Approve Thursday and hold Friday for your call.',
    outcome: null,
    workflowOpportunity: null,
    timeline: [
      { state: 'detected', headline: 'Time-off request for Thu–Fri', done: true },
      { state: 'assessment', headline: 'Friday coverage is thin', done: true },
      { state: 'recommendation', headline: 'Approve Thursday, hold Friday', done: true },
      { state: 'approval', headline: 'Approval required for the split decision', done: false },
    ],
    actions: ['Approve Thursday', 'Hold Friday for you'],
    timestamp: '10:12 AM',
  },
  {
    id: 'document_kenji',
    name: 'Document Filing',
    title: 'Kenji Tanaka uploaded a document to his profile',
    capability: 'Compliance',
    status: 'needs_approval',
    severity: 'low',
    event: 'Kenji uploaded a document to his profile.',
    assessment: 'Read as a valid CPR certification that expires in 3 weeks.',
    analysisResult: 'Name matches the uploader; the credential is valid but expires soon.',
    recommendation: 'File it as a CPR cert and flag the renewal.',
    outcome: null,
    workflowOpportunity: null,
    timeline: [
      { state: 'detected', headline: 'New document on Kenji’s profile', done: true },
      { state: 'assessment', headline: 'Valid CPR cert, expires in 3 weeks', done: true },
      { state: 'recommendation', headline: 'File the cert + flag the renewal', done: true },
      { state: 'approval', headline: 'Approval required before filing', done: false },
    ],
    actions: ['File as CPR cert', 'Mark verified', 'Flag renewal'],
    timestamp: '11:48 AM',
  },

  // ── New · Needs attention (recommended) ────────────────────────────────────
  {
    id: 'application_priya',
    name: 'New Lead Screening',
    title: 'New application: Priya R. — status New Lead',
    capability: 'Recruiting',
    status: 'recommended',
    severity: 'low',
    event: 'Priya R. submitted an application — status New Lead.',
    assessment: 'Strong match for the linked CNA Night Shift role downtown.',
    analysisResult: 'CNA license valid, availability matches — scored a 92% match.',
    recommendation: 'Screen the lead and reach out if qualified.',
    outcome: null,
    workflowOpportunity: 'Auto-screen and advance qualified leads.',
    timeline: [
      { state: 'detected', headline: 'New application received', done: true },
      { state: 'assessment', headline: '92% match for CNA · Night · Downtown', done: true },
      { state: 'recommendation', headline: 'Screen and reach out', done: false },
    ],
    actions: ['Mark qualified', 'Send intro', 'Ask screening questions'],
    timestamp: '8:41 AM',
  },
  {
    id: 'new_shift_forklift',
    name: 'Shift Offer',
    title: 'New shift created: Forklift Op, Friday 6am, Bay 4',
    capability: 'Fill Optimization',
    status: 'recommended',
    severity: 'low',
    event: 'A Forklift Op shift was created for Friday 6:00 AM, Bay 4.',
    assessment: 'Certified-only shift with a healthy pool of available workers.',
    analysisResult: '11 certified, available workers — top 6 ranked by proximity and reliability.',
    recommendation: 'Offer it to the best-matched workers.',
    outcome: null,
    workflowOpportunity: null,
    timeline: [
      { state: 'detected', headline: 'New forklift shift created', done: true },
      { state: 'assessment', headline: '11 certified workers available', done: true },
      { state: 'recommendation', headline: 'Offer to the top 6 matches', done: false },
    ],
    actions: ['Offer to top matches', 'Assign first claim', 'Confirm and update calendar'],
    timestamp: '9:30 AM',
  },
  {
    id: 'new_user_luis',
    name: 'Candidate Onboarding',
    title: 'New user created — Candidate: Luis M.',
    capability: 'Onboarding',
    status: 'recommended',
    severity: 'low',
    event: 'A new Candidate record was created for Luis M.',
    assessment: 'No tasks yet — ready for the standard intake set.',
    analysisResult: 'Pulled the 5 standard intake tasks; nothing pre-fillable on file.',
    recommendation: 'Kick off onboarding.',
    outcome: null,
    workflowOpportunity: 'Auto-start onboarding for new candidates.',
    timeline: [
      { state: 'detected', headline: 'New candidate record created', done: true },
      { state: 'assessment', headline: '5 standard intake tasks ready', done: true },
      { state: 'recommendation', headline: 'Send welcome + assign intake', done: false },
    ],
    actions: ['Send welcome', 'Assign intake tasks', 'Follow up to completion'],
    timestamp: '1:40 PM',
  },

  // ── New · Needs attention (needs_approval) ─────────────────────────────────
  {
    id: 'missed_clockin_james',
    name: 'Missed Clock-In',
    title: 'James Okoro never started his 9am shift',
    capability: 'Attendance Recovery',
    status: 'needs_approval',
    severity: 'high',
    event: 'James never clocked in for his 9:00 AM shift.',
    assessment: 'The grace window has elapsed with no release on file — needs a quick check before it’s a no-show.',
    analysisResult: 'No time-off on file and the 5-minute grace elapsed — an unexplained gap.',
    recommendation: 'Check if he’s on the way and update the shift.',
    outcome: null,
    workflowOpportunity: null,
    timeline: [
      { state: 'detected', headline: '9am start passed with no clock-in', done: true },
      { state: 'assessment', headline: 'No release on file — grace window elapsed', done: true },
      { state: 'recommendation', headline: 'Check in with James and update the shift', done: true },
      { state: 'approval', headline: 'Approval required before outreach', done: false },
    ],
    actions: ['Text James', 'Update shift', 'Flag scheduling inbox'],
    timestamp: '9:03 AM',
  },
  {
    id: 'thread_cancel_wed',
    name: 'Informal Cancellation',
    title: 'Worker replied “I can’t make tomorrow” in a thread',
    capability: 'Coverage Recovery',
    status: 'needs_approval',
    severity: 'high',
    event: 'A worker replied “I can’t make tomorrow” in an Engage thread.',
    assessment: 'Matched to her assigned Wed 7:00 AM shift at Pier 9 — no formal release was filed.',
    analysisResult: 'An informal cancellation with no release on file — it needs to be recorded as a drop.',
    recommendation: 'Treat it as a drop and start a fill, with a heads-up.',
    outcome: null,
    workflowOpportunity: null,
    timeline: [
      { state: 'detected', headline: 'Inbound message reads as a cancellation', done: true },
      { state: 'assessment', headline: 'Matched to the assigned Wed shift', done: true },
      { state: 'recommendation', headline: 'Log the release and start a fill', done: true },
      { state: 'approval', headline: 'Approval required before recording it', done: false },
    ],
    actions: ['Log the release', 'Acknowledge reply', 'Start replacement search'],
    timestamp: '4:30 PM',
  },

  // ── New · Needs attention (needs_approval — moved from Working) ─────────────
  {
    id: 'job_event_staff',
    name: 'Bulk Fill',
    title: 'New job: Event Staff — 20 openings, Saturday',
    capability: 'Marketplace Optimization',
    status: 'needs_approval',
    severity: 'medium',
    event: 'An Event Staff job was created with 20 openings for Saturday 4:00 PM.',
    assessment: '63 eligible workers ranked; 9 double-booked candidates filtered out.',
    analysisResult: '63 eligible workers ranked and 9 double-bookings filtered out — ready to invite the top matches.',
    recommendation: 'Match the pool and invite the best candidates.',
    outcome: null,
    workflowOpportunity: 'Automate bulk-fill invitations.',
    timeline: [
      { state: 'detected', headline: 'New job · 20 openings · Saturday', done: true },
      { state: 'assessment', headline: '63 eligible workers ranked', done: true },
      { state: 'recommendation', headline: 'Invite the top matches to claim slots', done: true },
      { state: 'approval', headline: 'Approval required before inviting', done: false },
    ],
    actions: ['Invite top matches', 'Track responses', 'Keep a standby list'],
    timestamp: '1:05 PM',
  },
  {
    id: 'missed_clockout_bianca',
    name: 'Open Timesheet',
    title: 'Bianca Rossi missed her clock-out — no end time on the timesheet',
    capability: 'Payroll Operations',
    status: 'needs_approval',
    severity: 'medium',
    event: 'Bianca’s shift ended with no clock-out — her timesheet is open.',
    assessment: 'Last geofence ping puts her off-site ~6:05 PM; held from payroll for a real end time.',
    analysisResult: 'Held from payroll — the open punch needs a confirmed end time before the run.',
    recommendation: 'Confirm her real end time and fix the timesheet.',
    outcome: null,
    workflowOpportunity: null,
    timeline: [
      { state: 'detected', headline: 'Shift ended with no clock-out', done: true },
      { state: 'assessment', headline: 'Held from payroll — needs a real end time', done: true },
      { state: 'recommendation', headline: 'Confirm her end time and fix the timesheet', done: true },
      { state: 'approval', headline: 'Approval required before payroll', done: false },
    ],
    actions: ['Text Bianca', 'Update timesheet', 'Flag payroll'],
    timestamp: '3:10 PM',
  },

  // ── New · Needs attention (recommended — moved from Working) ────────────────
  {
    id: 'payroll_acme_invoice',
    name: 'Invoice Roll-Up',
    title: 'Shift marked payroll approved — Acme Logistics',
    capability: 'Payroll Operations',
    status: 'recommended',
    severity: 'low',
    event: 'A shift was marked payroll approved for Acme Logistics.',
    assessment: 'Bill rate read and matched to Acme’s open, net-30 draft invoice.',
    analysisResult: 'No duplicate line exists — the approved shift is safe to add to the open invoice.',
    recommendation: 'Roll it onto the client’s open invoice.',
    outcome: null,
    workflowOpportunity: 'Automate approved-shift invoicing.',
    timeline: [
      { state: 'detected', headline: 'Shift marked payroll approved', done: true },
      { state: 'assessment', headline: 'Matched to Acme’s open invoice', done: true },
      { state: 'recommendation', headline: 'Roll it onto the open invoice', done: false },
    ],
    actions: ['Add line item', 'Recalculate total'],
    timestamp: '11:00 AM',
  },
  {
    id: 'schedule_published',
    name: 'Schedule Confirmation',
    title: 'It’s Friday — next week’s schedule is published',
    capability: 'Scheduling',
    status: 'recommended',
    severity: 'medium',
    event: 'Next week’s schedule was published — 84 shifts across 31 workers.',
    assessment: '22 shifts are still unconfirmed, heaviest on Monday and Tuesday.',
    analysisResult: '22 of 84 shifts are unconfirmed — confirming now de-risks Monday and Tuesday.',
    recommendation: 'Confirm everyone before the weekend.',
    outcome: null,
    workflowOpportunity: 'Automate weekly schedule confirmations.',
    timeline: [
      { state: 'detected', headline: 'Next week’s schedule published', done: true },
      { state: 'assessment', headline: '22 shifts unconfirmed', done: true },
      { state: 'recommendation', headline: 'Confirm everyone before the weekend', done: false },
    ],
    actions: ['Confirm all shifts', 'Chase the unconfirmed', 'Send Monday-readiness summary'],
    timestamp: '8:00 AM',
  },

  // ── New · needs attention (coverage) ───────────────────────────────────────
  {
    id: 'shift_release_jenny',
    name: 'Shift Release Recovery',
    title: 'Jenny Park released her Saturday shift at Lakeside',
    capability: 'Coverage Recovery',
    status: 'needs_approval',
    severity: 'medium',
    event: 'Jenny released her Saturday 8:00 AM caregiver shift at Lakeside.',
    assessment: 'More than 12 hours out — standard fill path with 5 qualified caregivers.',
    recommendation: 'Find a qualified replacement and fill it.',
    outcome: null,
    workflowOpportunity: null,
    timeline: [
      { state: 'detected', headline: 'Saturday caregiver shift released', done: true },
      { state: 'assessment', headline: '5 qualified caregivers available', done: true },
      { state: 'recommendation', headline: 'Best matches identified', done: true },
      { state: 'approval', headline: 'Approval required before outreach', done: false },
    ],
    actions: ['Message replacements', 'Assign first yes'],
    timestamp: '2:22 PM',
  },
  {
    id: 'birthday_tomas',
    name: 'Birthday Greeting',
    title: 'Tomas Greco has a birthday today',
    capability: 'Engagement',
    status: 'needs_approval',
    severity: 'low',
    event: 'Today is Tomas’s birthday.',
    assessment: 'Active employee; preferred channel is in-app chat — a send is appropriate.',
    recommendation: 'Send a happy birthday from the team.',
    outcome: null,
    workflowOpportunity: null,
    timeline: [
      { state: 'detected', headline: 'Birthday matched to today', done: true },
      { state: 'assessment', headline: 'Active employee · in-app chat', done: true },
      { state: 'recommendation', headline: 'A warm note drafted', done: true },
      { state: 'approval', headline: 'Approval required before sending', done: false },
    ],
    actions: ['Send Birthday Note'],
    timestamp: '9:12 AM',
  },
  {
    id: 'weekly_fill_report',
    name: 'Scheduled Report',
    title: 'Next week’s fill-rate report is ready for review',
    capability: 'Reporting',
    status: 'needs_approval',
    severity: 'medium',
    event: 'The weekly fill-rate report ran — 22 shifts are under target for next week.',
    assessment: 'Coverage gaps cluster on Monday and Tuesday; scheduling should see them before the week starts.',
    recommendation: 'Publish the report and flag the gaps to scheduling.',
    outcome: null,
    workflowOpportunity: null,
    timeline: [
      { state: 'detected', headline: 'Weekly report generated', done: true },
      { state: 'assessment', headline: '22 shifts under target', done: true },
      { state: 'recommendation', headline: 'Gaps flagged for scheduling', done: true },
      { state: 'approval', headline: 'Approval required before sharing', done: false },
    ],
    actions: ['Publish & flag gaps'],
    timestamp: '5:00 PM',
  },

  // ── New · needs attention (attendance & records) ───────────────────────────
  {
    id: 'clockin_devon',
    name: 'Clock-In Approval',
    title: 'Devon Pierce’s clock-in is ready for payroll approval',
    capability: 'Attendance',
    status: 'needs_approval',
    severity: 'low',
    event: 'Devon clocked in at Eastgate Warehouse — the punch is clean and inside the geofence.',
    assessment: 'All required fields are present, so it’s ready to approve for the payroll run.',
    recommendation: 'Approve the clock-in for payroll.',
    outcome: null,
    workflowOpportunity: null,
    timeline: [
      { state: 'detected', headline: 'Clock-in at Eastgate Warehouse', done: true },
      { state: 'assessment', headline: 'Inside geofence · all fields present', done: true },
      { state: 'recommendation', headline: 'Ready for payroll approval', done: true },
      { state: 'approval', headline: 'Approval required before payroll', done: false },
    ],
    actions: ['Approve clock-in'],
    timestamp: '8:15 AM',
  },
  {
    id: 'phone_aisha',
    name: 'Profile Update',
    title: 'Aisha Bello changed her phone number',
    capability: 'Users',
    status: 'needs_approval',
    severity: 'low',
    event: 'Aisha updated her phone number on file.',
    assessment: 'It’s her notification contact, so it’s worth a quick verification before it goes live.',
    recommendation: 'Verify the new number and update her notification contact.',
    outcome: null,
    workflowOpportunity: null,
    timeline: [
      { state: 'detected', headline: 'Phone number updated', done: true },
      { state: 'assessment', headline: 'Used as her notification contact', done: true },
      { state: 'recommendation', headline: 'Verification ready to send', done: true },
      { state: 'approval', headline: 'Approval required before verifying', done: false },
    ],
    actions: ['Verify & update'],
    timestamp: '12:30 PM',
  },
  {
    id: 'fill_confirmed_maria',
    name: 'Autonomous Fill',
    title: 'The fill agent lined up a replacement for Maria’s shift',
    capability: 'Autonomous Operations',
    status: 'needs_approval',
    severity: 'high',
    event: 'The fill agent found Sarah Quinn for Maria’s open RN shift at Riverside Clinic.',
    assessment: 'Sarah clears policy and is available — the assignment just needs your confirmation.',
    recommendation: 'Confirm the assignment and notify the scheduler.',
    outcome: null,
    workflowOpportunity: null,
    timeline: [
      { state: 'detected', headline: 'Replacement found for Maria’s shift', done: true },
      { state: 'assessment', headline: 'Sarah Quinn clears policy · available', done: true },
      { state: 'recommendation', headline: 'Assignment ready to confirm', done: true },
      { state: 'approval', headline: 'Approval required before assigning', done: false },
    ],
    actions: ['Confirm assignment'],
    timestamp: '3:55 PM',
  },
  {
    id: 'invoice_paid_4821',
    name: 'Invoice Reconciliation',
    title: 'Client marked invoice #4821 as paid',
    capability: 'Invoicing',
    status: 'needs_approval',
    severity: 'low',
    event: 'A client marked invoice #4821 paid outside Teambridge.',
    assessment: 'The payment needs reconciling against the open balance before the invoice can close.',
    recommendation: 'Reconcile the payment and close the invoice.',
    outcome: null,
    workflowOpportunity: null,
    timeline: [
      { state: 'detected', headline: 'Invoice #4821 marked paid', done: true },
      { state: 'assessment', headline: 'Payment recorded outside Teambridge', done: true },
      { state: 'recommendation', headline: 'Ready to reconcile and close', done: true },
      { state: 'approval', headline: 'Approval required before closing', done: false },
    ],
    actions: ['Reconcile & close'],
    timestamp: '11:25 AM',
  },

  // ── New · needs attention (compliance — recurring pattern) ─────────────────
  {
    id: 'cred_expired_nadia',
    name: 'Credential Lapse',
    title: 'Nadia Haddad’s CPR cert expired overnight',
    capability: 'Compliance',
    status: 'needs_approval',
    severity: 'high',
    event: 'Nadia’s CPR certification expired overnight.',
    assessment: 'A blocking policy flagged the lapse — CPR is required for her role.',
    recommendation: 'Pull her from non-compliant shifts and start renewal.',
    outcome: null,
    workflowOpportunity: 'Monitor credential lapses and auto-start renewals.',
    timeline: [
      { state: 'detected', headline: 'CPR cert expired overnight', done: true },
      { state: 'assessment', headline: '3 upcoming shifts now at risk', done: true },
      { state: 'recommendation', headline: 'Renewal + backfills lined up', done: true },
      { state: 'approval', headline: 'Approval required before changes', done: false },
    ],
    actions: ['Start renewal', 'Line up backfills'],
    timestamp: '10:40 AM',
  },
];

/** Person each case is about — drives the deck card's profile avatar (with an
 *  initials fallback when the photo can't load). Only set where the case title
 *  already leads with that person's full name, so `threadDisplayTitle` leaves
 *  the title untouched. Event-type cases (a new application, an invoice, a
 *  published schedule) intentionally have no subject and display verbatim. */
export const THREAD_SUBJECTS: Record<string, string> = {
  shift_drop_maria: 'Maria Ellis',
  timeoff_sofia: 'Sofia Marin',
  document_kenji: 'Kenji Tanaka',
  missed_clockin_james: 'James Okoro',
  missed_clockout_bianca: 'Bianca Rossi',
  shift_release_jenny: 'Jenny Park',
  birthday_tomas: 'Tomas Greco',
  clockin_devon: 'Devon Pierce',
  phone_aisha: 'Aisha Bello',
  cred_expired_nadia: 'Nadia Haddad',
};

/** Glanceable case metadata for the collapsed card subtitle: a scannable
 *  Role · Shift time · Location line in place of the prose assessment. DEMO ONLY. */
export const THREAD_META: Record<string, { role: string; shiftTime: string; location: string }> = {
  shift_drop_maria:      { role: 'RN',          shiftTime: 'Today · 2:00 PM',     location: 'Riverside Clinic' },
  timeoff_sofia:         { role: 'PTO',         shiftTime: 'Next Thu–Fri',        location: '2 assigned shifts' },
  document_kenji:        { role: 'CPR cert',    shiftTime: 'Expires in 3 weeks',  location: 'Profile upload' },
  application_priya:     { role: 'CNA',         shiftTime: 'Night Shift',         location: 'Downtown' },
  new_shift_forklift:    { role: 'Forklift Op', shiftTime: 'Fri · 6:00 AM',       location: 'Bay 4' },
  new_user_luis:         { role: 'Candidate',   shiftTime: 'Onboarding',          location: '5 intake tasks' },
  missed_clockin_james:  { role: 'Worker',      shiftTime: 'Today · 9:00 AM',     location: 'No clock-in' },
  thread_cancel_wed:     { role: 'Worker',      shiftTime: 'Wed · 7:00 AM',       location: 'Pier 9' },
  payroll_acme_invoice:  { role: 'Invoice',     shiftTime: '$48/hr · 8 hrs',      location: 'Acme Logistics' },
  job_event_staff:       { role: 'Event Staff', shiftTime: 'Sat · 4:00 PM',       location: '20 openings' },
  missed_clockout_bianca:{ role: 'Timesheet',   shiftTime: 'Ended ~6:05 PM',      location: 'Open punch' },
  schedule_published:    { role: '31 workers',  shiftTime: 'Next week',           location: '84 shifts' },
  shift_release_jenny:   { role: 'Caregiver',   shiftTime: 'Sat · 8:00 AM',       location: 'Lakeside' },
  birthday_tomas:        { role: 'Employee',    shiftTime: 'Today',               location: 'In-app chat' },
  weekly_fill_report:    { role: 'Report',      shiftTime: 'Weekly',              location: 'Home dashboard' },
  clockin_devon:         { role: 'Clock-in',    shiftTime: 'Today · 8:15 AM',     location: 'Eastgate Warehouse' },
  phone_aisha:           { role: 'Profile',     shiftTime: 'Today',               location: 'Phone updated' },
  fill_confirmed_maria:  { role: 'RN',          shiftTime: 'Replacement',         location: 'Riverside Clinic' },
  invoice_paid_4821:     { role: 'Invoice',     shiftTime: '#4821',               location: 'Marked paid' },
  cred_expired_nadia:    { role: 'CPR cert',    shiftTime: 'Expired',             location: '3 shifts at risk' },
};

/** The glanceable metadata line for a case, e.g. "RN · Today · 2:00 PM ·
 *  Riverside Clinic". Empty string when the case has no metadata. */
export function threadMeta(id: string): string {
  const m = THREAD_META[id];
  return m ? [m.role, m.shiftTime, m.location].filter(Boolean).join(' · ') : '';
}

/** Card title prefixed with the subject's name, e.g. "Marcus Lee projected
 *  overtime exceeds budget this week". Titles that already lead with the name
 *  are left untouched; a leading acronym (RN, CNA) keeps its casing. */
export function threadDisplayTitle(thread: ThreadItem): string {
  const name = THREAD_SUBJECTS[thread.id];
  if (!name || thread.title.startsWith(name)) return thread.title;
  const firstWord = thread.title.split(' ')[0] ?? '';
  const keepCase = firstWord === firstWord.toUpperCase(); // acronym like "RN" / "CNA"
  const rest = keepCase ? thread.title : thread.title.charAt(0).toLowerCase() + thread.title.slice(1);
  return `${name} ${rest}`;
}

/** Demo placeholder profile photo, stable per case (seeded by thread id). */
export const threadAvatarUrl = (id: string): string =>
  `https://i.pravatar.cc/80?u=${id}`;

/** A single "thinking" step Ultron emits while analyzing a fresh event — a
 *  short headline plus a line of sub-context explaining what it found, so the
 *  stream reads like the activity trail (headline + detail) rather than a bare
 *  checklist. */
export interface AnalyzingStep {
  /** Leading icon when the step is folded into the accumulated activity trail. */
  icon: WorkingIcon;
  headline: string;
  detail: string;
}

/** Short "thinking" steps Ultron emits while analyzing a fresh event. They
 *  reveal one at a time (accumulating, growing the analyzing card) before the
 *  case flips to Needs approval. Falls back to a generic sequence. Sourced from
 *  each event's "Analyzing event" checklist in the seed data. */
export const ANALYZING_ACTIVITIES: Record<string, AnalyzingStep[]> = {
  shift_drop_maria: [
    { icon: 'clock', headline: 'Reviewed dropped shift', detail: 'I checked out the dropped shift: RN · Riverside Clinic · 2:00–10:00pm, in the ICU unit.' },
    { icon: 'chart', headline: 'Determine recommended course of action', detail: 'The start time is in 4 hours, so this is an urgent fill — it might be too late to find a replacement, and more urgency or incentive may be needed to staff it now. First I’ll evaluate whether there are suitable replacements. I could reach out in ranked order, but as this is urgent let me contact the top 20 best replacements all at once. This has worked in the past, so I won’t suggest a bonus incentive at this time.' },
    { icon: 'done', headline: 'Plan created and shared', detail: '' },
  ],
  timeoff_sofia: [
    { icon: 'clock', headline: 'Reviewed time-off request', detail: 'I looked at Sofia’s request — Thursday and Friday off, with two assigned shifts falling inside the window.' },
    { icon: 'chart', headline: 'Determine recommended course of action', detail: 'Her PTO balance covers the request and there’s no blackout rule, so this is approvable. Running coverage on both shifts: Thursday stays fully covered, but Friday only has a single backup and reads thin. Rather than risk an uncovered shift, I’ll recommend approving Thursday outright and holding Friday for your call.' },
    { icon: 'done', headline: 'Plan created and shared', detail: '' },
  ],
  document_kenji: [
    { icon: 'clock', headline: 'Reviewed uploaded document', detail: 'I opened the file on Kenji’s profile and read it as a valid CPR certification.' },
    { icon: 'chart', headline: 'Determine recommended course of action', detail: 'The name matches the uploader and the credential checks out, but it expires in 3 weeks. The right move is to file it as a CPR cert so the record is accurate, then set a renewal flag ahead of the expiry so it doesn’t lapse and block his shifts.' },
    { icon: 'done', headline: 'Plan created and shared', detail: '' },
  ],
  application_priya: [
    { icon: 'clock', headline: 'Reviewed new application', detail: 'I read Priya’s application against the linked role: CNA · Night Shift · Downtown.' },
    { icon: 'chart', headline: 'Determine recommended course of action', detail: 'Her CNA license is valid and her availability matches the shift, scoring a 92% match — a strong lead. Rather than let it sit in the queue, I’ll screen it as qualified and reach out with an intro so we move on a good candidate before someone else does.' },
    { icon: 'done', headline: 'Plan created and shared', detail: '' },
  ],
  new_shift_forklift: [
    { icon: 'clock', headline: 'Reviewed new shift', detail: 'I read the new shift: Forklift Op · Friday 6:00 AM · Bay 4, certified-only.' },
    { icon: 'chart', headline: 'Determine recommended course of action', detail: 'Matching the pool turned up 11 certified, available workers — a healthy field with no coverage risk. Since there’s plenty of supply I don’t need to widen the net; I’ll offer it to the top 6 ranked by proximity and reliability and let the first claim take it.' },
    { icon: 'done', headline: 'Plan created and shared', detail: '' },
  ],
  new_user_luis: [
    { icon: 'clock', headline: 'Reviewed new candidate', detail: 'I read the new Candidate record for Luis M. — no tasks on it yet.' },
    { icon: 'chart', headline: 'Determine recommended course of action', detail: 'Nothing is pre-fillable on file and this is a standard new-candidate setup, so the straightforward path is to kick off onboarding: send a welcome, assign the 5 standard intake tasks, and follow up to completion.' },
    { icon: 'done', headline: 'Plan created and shared', detail: '' },
  ],
  missed_clockin_james: [
    { icon: 'clock', headline: 'Reviewed missed clock-in', detail: 'I saw James’s 9:00 AM start pass with no clock-in after the 5-minute grace window; his preferred channel is SMS.' },
    { icon: 'chart', headline: 'Determine recommended course of action', detail: 'There’s no time-off or release on file, so this is an unexplained gap rather than a planned absence — but it’s early enough that he may simply be running late. Before treating it as a no-show I’ll text him to check if he’s on the way, update the shift with what I learn, and flag the scheduling inbox if he doesn’t respond.' },
    { icon: 'done', headline: 'Plan created and shared', detail: '' },
  ],
  thread_cancel_wed: [
    { icon: 'clock', headline: 'Reviewed inbound message', detail: 'I read the worker’s “I can’t make tomorrow” reply and matched it to her assigned Wed 7:00 AM shift at Pier 9.' },
    { icon: 'chart', headline: 'Determine recommended course of action', detail: 'It’s an informal cancellation with no formal release on file, so the shift still reads as covered when it isn’t. To keep the record honest I’ll log it as a release, acknowledge her reply, and start a replacement search right away since the shift is tomorrow.' },
    { icon: 'done', headline: 'Plan created and shared', detail: '' },
  ],
  payroll_acme_invoice: [
    { icon: 'clock', headline: 'Reviewed approved shift', detail: 'I read the approved bill rate — $48/hr · 8 hrs — and matched it to Acme’s open, net-30 draft invoice.' },
    { icon: 'chart', headline: 'Determine recommended course of action', detail: 'There’s no duplicate line for it yet, so it’s safe to add. Rather than open a new invoice, the clean move is to roll the approved shift onto Acme’s existing open invoice and recalculate the total so billing stays consolidated.' },
    { icon: 'done', headline: 'Plan created and shared', detail: '' },
  ],
  job_event_staff: [
    { icon: 'clock', headline: 'Reviewed new job', detail: 'I read the job: Event Staff · 20 openings · Saturday 4:00 PM.' },
    { icon: 'chart', headline: 'Determine recommended course of action', detail: 'Matching the pool ranked 63 eligible workers and filtered out 9 double-booked against Saturday shifts. With 20 slots to fill and good supply, the efficient path is to invite the top matches to claim slots first-come, track responses, and keep a standby list rather than hand-assigning each opening.' },
    { icon: 'done', headline: 'Plan created and shared', detail: '' },
  ],
  missed_clockout_bianca: [
    { icon: 'clock', headline: 'Reviewed open timesheet', detail: 'I saw Bianca’s shift end with no clock-out, leaving her timesheet open; her last geofence ping puts her off-site around 6:05 PM.' },
    { icon: 'chart', headline: 'Determine recommended course of action', detail: 'An open punch can’t go through payroll as-is, so I’ve held it from the run. The ping gives a likely end time, but I’d rather confirm it with her than guess — I’ll text Bianca, correct the timesheet with her real end time, and flag payroll so the run isn’t delayed.' },
    { icon: 'done', headline: 'Plan created and shared', detail: '' },
  ],
  schedule_published: [
    { icon: 'clock', headline: 'Reviewed published schedule', detail: 'I scanned next week’s schedule: 84 shifts across 31 workers.' },
    { icon: 'chart', headline: 'Determine recommended course of action', detail: '22 shifts are still unconfirmed, heaviest on Monday and Tuesday — that’s where the start-of-week risk sits. Confirming now, before the weekend, gives workers time to flag conflicts, so I’ll send confirmations to everyone, chase the unconfirmed, and prepare a Monday-readiness summary.' },
    { icon: 'done', headline: 'Plan created and shared', detail: '' },
  ],
  shift_release_jenny: [
    { icon: 'clock', headline: 'Reviewed released shift', detail: 'I read the released shift: Caregiver · Lakeside · Saturday 8:00 AM.' },
    { icon: 'chart', headline: 'Determine recommended course of action', detail: 'It’s more than 12 hours out, so this is a standard fill with no coverage risk. Matching the pool surfaced 5 qualified caregivers, so I’ll reach out to the best matches in ranked order and assign the first qualified yes.' },
    { icon: 'done', headline: 'Plan created and shared', detail: '' },
  ],
  birthday_tomas: [
    { icon: 'clock', headline: 'Reviewed birthday', detail: 'I matched today to Tomas Greco’s birthday — he’s an active employee on in-app chat.' },
    { icon: 'chart', headline: 'Determine recommended course of action', detail: 'He’s active and reachable on in-app chat, so a quick, warm send is appropriate. I’ll send a happy-birthday note from the team.' },
    { icon: 'done', headline: 'Plan created and shared', detail: '' },
  ],
  cred_expired_nadia: [
    { icon: 'clock', headline: 'Reviewed credential lapse', detail: 'A blocking policy flagged that Nadia’s CPR certification lapsed overnight; CPR is required for her role.' },
    { icon: 'chart', headline: 'Determine recommended course of action', detail: 'Three CPR-gated shifts in the next week are now at risk, but replacements are available for all three. The right move is to pull her from the non-compliant shifts, start a renewal, and line up backfills so coverage holds while she recertifies.' },
    { icon: 'done', headline: 'Plan created and shared', detail: '' },
  ],
  clockin_devon: [
    { icon: 'clock', headline: 'Reviewed clock-in', detail: 'Devon clocked in at Eastgate Warehouse; I checked it against the geofence and required fields.' },
    { icon: 'chart', headline: 'Determine recommended course of action', detail: 'It’s a clean punch inside the geofence with every required field present, so it’s payroll-ready. Rather than let it sit unapproved before the run, I’ll confirm the geofence and fields and approve it for payroll.' },
    { icon: 'done', headline: 'Plan created and shared', detail: '' },
  ],
  phone_aisha: [
    { icon: 'clock', headline: 'Reviewed profile update', detail: 'Aisha updated her phone number — it’s the contact her notifications go to.' },
    { icon: 'chart', headline: 'Determine recommended course of action', detail: 'Because it’s her notification contact, a wrong number means missed shift alerts. The safe move is to send a quick verification ping and, once it checks out, update the contact on file so alerts keep reaching her.' },
    { icon: 'done', headline: 'Plan created and shared', detail: '' },
  ],
  fill_confirmed_maria: [
    { icon: 'clock', headline: 'Reviewed autonomous fill', detail: 'My fill for Maria’s open RN shift surfaced Sarah Quinn — available and within radius for Riverside Clinic.' },
    { icon: 'chart', headline: 'Determine recommended course of action', detail: 'Sarah clears every policy and is available, so she’s a clean match. I’ll confirm the assignment and notify the scheduler so the roster reflects the coverage — pending your go-ahead since it commits a worker to the shift.' },
    { icon: 'done', headline: 'Plan created and shared', detail: '' },
  ],
  weekly_fill_report: [
    { icon: 'clock', headline: 'Reviewed scheduled report', detail: 'The weekly fill-rate report ran — 22 of next week’s shifts are under target, heaviest on Monday and Tuesday.' },
    { icon: 'chart', headline: 'Determine recommended course of action', detail: 'The gaps are concentrated early in the week, so they’re fixable if scheduling sees them now. I’ll publish the report and flag the at-risk shifts to the scheduling team so they can act before the week starts.' },
    { icon: 'done', headline: 'Plan created and shared', detail: '' },
  ],
  invoice_paid_4821: [
    { icon: 'clock', headline: 'Reviewed paid invoice', detail: 'A client marked invoice #4821 paid outside Teambridge; the open balance is still showing in the ledger.' },
    { icon: 'chart', headline: 'Determine recommended course of action', detail: 'The payment was recorded out-of-band, so the record won’t close on its own. I’ll reconcile the amount against the open balance and, once it matches, close the invoice so billing stays accurate.' },
    { icon: 'done', headline: 'Plan created and shared', detail: '' },
  ],
};

const GENERIC_ANALYZING: AnalyzingStep[] = [
  { icon: 'alert', headline: 'Reading the event', detail: 'Parsing what changed and which people, shifts, and policies it touches.' },
  { icon: 'clock', headline: 'Gathering related records', detail: 'Pulling the schedules, availability, and history relevant to this case.' },
  { icon: 'chart', headline: 'Weighing the options', detail: 'Comparing the viable responses by cost, coverage, and disruption.' },
  { icon: 'done',  headline: 'Preparing a recommendation', detail: 'Shaping the strongest option into a plan you can approve in one step.' },
];

/** The analyzing step sequence for a case (thread-specific or generic). */
export const analyzingSteps = (id: string): AnalyzingStep[] =>
  ANALYZING_ACTIVITIES[id] ?? GENERIC_ANALYZING;

/** The recommendation phrased as a question — a clear call to action that the
 *  decision buttons answer. Shown as the card prompt (falls back to the
 *  imperative `recommendation` if missing). Sourced from each event's "Ask:". */
export const THREAD_PROMPTS: Record<string, string> = {
  shift_drop_maria: 'Want me to reach out to the best replacements and get this shift filled?',
  timeoff_sofia: 'Friday’s coverage is thin — want me to approve Thursday and hold Friday for your call?',
  document_kenji: 'It’s a valid CPR cert expiring in 3 weeks — want me to file it and flag the renewal?',
  application_priya: 'Want me to screen this lead and reach out if they qualify?',
  new_shift_forklift: 'Want me to offer this shift to the best workers and get it claimed?',
  new_user_luis: 'Want me to kick off onboarding for Luis with a welcome and intake tasks?',
  missed_clockin_james: 'Want me to check in with James and update the shift?',
  thread_cancel_wed: 'She’s canceling tomorrow informally — want me to log the release and start a fill?',
  payroll_acme_invoice: 'Want me to roll this approved shift onto the client’s open invoice?',
  job_event_staff: 'Want me to invite the best-matched workers to fill these 20 openings?',
  missed_clockout_bianca: 'Want me to confirm Bianca’s end time and fix the timesheet before payroll?',
  schedule_published: 'Want me to confirm next week’s schedule and chase down the 22 unconfirmed shifts?',
  shift_release_jenny: 'Want me to reach out to the best replacements and get this shift filled?',
  birthday_tomas: 'Want me to send Tomas a happy birthday message from the team?',
  weekly_fill_report: '22 shifts are under target next week — want me to publish the report and flag the gaps to scheduling?',
  clockin_devon: 'Devon’s clock-in is clean and inside the geofence — want me to approve it for payroll?',
  phone_aisha: 'She changed her notification number — want me to verify it and update her contact?',
  fill_confirmed_maria: 'Sarah Quinn is a clean match — want me to confirm the assignment and notify the scheduler?',
  invoice_paid_4821: 'The client paid #4821 outside Teambridge — want me to reconcile it and close the invoice?',
  cred_expired_nadia: 'Her CPR lapsed — want me to start the renewal and line up backfills for the 3 shifts?',
};

/** Real, scenario-specific milestones shown one-by-one while a thread executes
 *  (Live stream): outreach → monitoring → acceptance. Three per case to match
 *  the execution timing. Falls back to generic labels if a case has none. */
/** `icon` is a key mapped to an Alloy icon in the view (fixtures can't hold JSX). */
export type WorkingIcon = 'send' | 'clock' | 'done' | 'rate' | 'chart' | 'edit' | 'alert';

export interface WorkingMilestone {
  icon: WorkingIcon;
  headline: string;
  detail: string;
}

export const WORKING_ACTIVITIES: Record<string, WorkingMilestone[]> = {
  shift_drop_maria: [
    { icon: 'send',  headline: 'Messaged the top replacements', detail: 'Sent the shift details to the best-matched RNs.' },
    { icon: 'clock', headline: 'Collecting confirmations', detail: 'Tracking replies for the first qualified yes.' },
    { icon: 'done',  headline: 'Shift filled', detail: 'Assigned the first qualified RN and notified the scheduler.' },
  ],
  timeoff_sofia: [
    { icon: 'done',  headline: 'Approved Thursday', detail: 'PTO balance confirmed and the Thursday shift is covered.' },
    { icon: 'edit',  headline: 'Held Friday for you', detail: 'Flagged the thin coverage with the one available backup.' },
    { icon: 'send',  headline: 'Sofia notified', detail: 'Confirmed Thursday and that Friday is pending your call.' },
  ],
  document_kenji: [
    { icon: 'edit',  headline: 'Filed as a CPR cert', detail: 'Set the document type and saved the expiry.' },
    { icon: 'done',  headline: 'Marked the credential verified', detail: 'Updated his profile.' },
    { icon: 'alert', headline: 'Flagged the renewal', detail: 'It expires in 3 weeks — surfaced for planning.' },
  ],
  application_priya: [
    { icon: 'edit',  headline: 'Marked Priya qualified', detail: 'Updated the application status.' },
    { icon: 'send',  headline: 'Sent a warm intro', detail: 'Confirmed interest and asked the two screening questions.' },
    { icon: 'done',  headline: 'Moved to the recruiter queue', detail: 'Ready once she replies.' },
  ],
  new_shift_forklift: [
    { icon: 'send',  headline: 'Offered to the top matches', detail: 'Sent the shift in ranked order.' },
    { icon: 'clock', headline: 'Tracking claims', detail: 'Watching for the first claim that clears policy.' },
    { icon: 'done',  headline: 'Shift claimed', detail: 'Assigned the first qualified claim and updated the calendar.' },
  ],
  new_user_luis: [
    { icon: 'send',  headline: 'Sent Luis a welcome', detail: 'Kicked off the candidate onboarding.' },
    { icon: 'edit',  headline: 'Assigned intake tasks', detail: 'Added the 5 required tasks.' },
    { icon: 'done',  headline: 'Following up', detail: 'Tracking each task through to completion.' },
  ],
  missed_clockin_james: [
    { icon: 'send',  headline: 'Texted James', detail: 'Asked whether he’s on his way.' },
    { icon: 'clock', headline: 'Awaiting his reply', detail: 'Will update the shift’s confirmation status from it.' },
    { icon: 'done',  headline: 'Shift updated', detail: 'Flagged the scheduling inbox in case of a no-show.' },
  ],
  thread_cancel_wed: [
    { icon: 'edit',  headline: 'Recorded the release', detail: 'Logged the Wed shift as released on her behalf.' },
    { icon: 'send',  headline: 'Acknowledged her', detail: 'Confirmed she’s off the shift.' },
    { icon: 'done',  headline: 'Replacement search started', detail: 'Opened a fill for the Wed 7:00 AM shift.' },
  ],
  payroll_acme_invoice: [
    { icon: 'edit',  headline: 'Adding the line item', detail: 'Posting the approved shift to Acme’s open invoice.' },
    { icon: 'rate',  headline: 'Recalculating the total', detail: 'Updating the invoice total and net terms.' },
    { icon: 'done',  headline: 'Draft ready', detail: 'Kept ready for your end-of-week review.' },
  ],
  job_event_staff: [
    { icon: 'send',  headline: 'Inviting the top 40 matches', detail: 'Sent slot invitations in ranked order.' },
    { icon: 'clock', headline: 'Tracking responses', detail: 'Filling the 20 openings first-come.' },
    { icon: 'done',  headline: 'Standby list kept', detail: 'Will notify you at 80% filled.' },
  ],
  missed_clockout_bianca: [
    { icon: 'send',  headline: 'Texted Bianca', detail: 'Asked her to confirm her actual end time.' },
    { icon: 'edit',  headline: 'Updating the timesheet', detail: 'Will apply her confirmed end time.' },
    { icon: 'alert', headline: 'Holding for payroll', detail: 'Will flag payroll if she doesn’t reply before the run.' },
  ],
  schedule_published: [
    { icon: 'send',  headline: 'Messaging workers to confirm', detail: 'Asked everyone to confirm next week’s shifts.' },
    { icon: 'clock', headline: 'Chasing the unconfirmed', detail: 'Sending reminders to the 22 outstanding.' },
    { icon: 'done',  headline: 'Readiness summary queued', detail: 'A Monday-readiness summary lands by end of day.' },
  ],
  shift_release_jenny: [
    { icon: 'send',  headline: 'Messaged the best matches', detail: 'Reached out to the qualified caregivers.' },
    { icon: 'clock', headline: 'Collecting confirmations', detail: 'Waiting on the first qualified yes.' },
    { icon: 'done',  headline: 'Shift filled', detail: 'Assigned the replacement and updated the schedule.' },
  ],
  birthday_tomas: [
    { icon: 'send',  headline: 'Sent the birthday note', detail: 'A warm message from the team via in-app chat.' },
  ],
  weekly_fill_report: [
    { icon: 'send',  headline: 'Published the report', detail: 'Posted next week’s fill-rate report to the Home dashboard.' },
    { icon: 'alert', headline: 'Flagged the at-risk shifts', detail: 'Surfaced the 22 under-target shifts to the scheduling team.' },
    { icon: 'done',  headline: 'Scheduling notified', detail: 'Sent the Mon–Tue gaps so they can act before the week starts.' },
  ],
  clockin_devon: [
    { icon: 'edit',  headline: 'Confirmed the punch', detail: 'Re-checked the geofence and required fields.' },
    { icon: 'done',  headline: 'Approved for payroll', detail: 'Released the clean clock-in into the payroll run.' },
  ],
  phone_aisha: [
    { icon: 'send',  headline: 'Sent a verification ping', detail: 'Texted the new number to confirm it reaches her.' },
    { icon: 'edit',  headline: 'Updated the contact', detail: 'Set the verified number as her notification contact.' },
    { icon: 'done',  headline: 'Alerts confirmed', detail: 'Shift notifications now route to the new number.' },
  ],
  fill_confirmed_maria: [
    { icon: 'edit',  headline: 'Confirmed Sarah Quinn', detail: 'Assigned her to Maria’s open RN shift.' },
    { icon: 'clock', headline: 'Updated the roster', detail: 'Posted the change so the schedule reflects it.' },
    { icon: 'done',  headline: 'Scheduler notified', detail: 'Coverage confirmed and the scheduler is in the loop.' },
  ],
  invoice_paid_4821: [
    { icon: 'rate',  headline: 'Reconciled the payment', detail: 'Matched the amount against #4821’s open balance.' },
    { icon: 'edit',  headline: 'Closed the invoice', detail: 'Marked it paid-in-full once the balance cleared.' },
    { icon: 'done',  headline: 'Ledger updated', detail: 'Billing now reflects the recorded payment.' },
  ],
  cred_expired_nadia: [
    { icon: 'alert', headline: 'Flagged the 3 shifts at-risk', detail: 'Marked the CPR-gated shifts.' },
    { icon: 'edit',  headline: 'Assigned a renewal task', detail: 'Added the upload step for Nadia.' },
    { icon: 'done',  headline: 'Backfills lined up', detail: 'Offered to cover the shifts she can’t legally work.' },
  ],
};

/** Multi-step cases: after the first action's work completes, Ultron asks a
 *  follow-up question (the case returns to "Needs attention") before the
 *  second action resolves it. */
/** A record the question references (a worker, shift, location, policy…),
 *  shown as a context card under the prompt. */
export interface RecordRef {
  eyebrow: string;
  title: string;
  meta: string[];
  avatarSeed: string;
}

export interface ThreadFollowUp {
  prompt: string;
  actions: string[];
  working: WorkingMilestone[];
  record?: RecordRef;
}

export const THREAD_FOLLOWUPS: Record<string, ThreadFollowUp> = {
  shift_drop_maria: {
    prompt: 'Renee Wallace replied yes — a strong match. Assign her to cover the shift?',
    actions: ['Review', 'Assign Renee'],
    working: [
      { icon: 'edit',  headline: 'Assigning Renee to the shift', detail: 'Adding Renee Wallace to the 2:00 PM RN shift.' },
      { icon: 'clock', headline: 'Updating the schedule', detail: 'Posting the change so the roster reflects it.' },
      { icon: 'done',  headline: 'Coverage confirmed', detail: 'Shift filled and the scheduler notified.' },
    ],
    record: { eyebrow: 'RN', title: 'Renee Wallace', meta: ['94% match', 'Available now', 'CPR current'], avatarSeed: 'renee_wallace' },
  },
  missed_clockin_james: {
    prompt: 'James says he’s 15 minutes out. Update the shift as confirmed-late?',
    actions: ['Review', 'Confirm late'],
    working: [
      { icon: 'edit',  headline: 'Updating the shift', detail: 'Marking James confirmed, arriving ~15 min late.' },
      { icon: 'send',  headline: 'Notifying the site', detail: 'Letting the location know to expect him shortly.' },
      { icon: 'done',  headline: 'Shift updated', detail: 'No replacement needed — coverage holds.' },
    ],
    record: { eyebrow: 'Worker', title: 'James Okoro', meta: ['On his way', '~15 min late', 'Replied via SMS'], avatarSeed: 'missed_clockin_james' },
  },
  application_priya: {
    prompt: 'Priya answered the screening questions and qualifies. Move her to the recruiter’s queue?',
    actions: ['Review', 'Move to queue'],
    working: [
      { icon: 'edit',  headline: 'Moving Priya to the queue', detail: 'Handing her off to the recruiter as Qualified.' },
      { icon: 'send',  headline: 'Notifying the recruiter', detail: 'Sharing her answers and the 92% match.' },
      { icon: 'done',  headline: 'In the recruiter’s queue', detail: 'Ready for the next step.' },
    ],
    record: { eyebrow: 'CNA', title: 'Priya Raman', meta: ['92% match', 'Screened', 'Night Shift'], avatarSeed: 'application_priya' },
  },
};

/** Stage-0 record(s) referenced by each thread's question. A single record for
 *  most cases; a short ranked list where the question is about choosing among
 *  candidates (rendered as a vertical stack of record cards). */
export const THREAD_RECORDS: Record<string, RecordRef | RecordRef[]> = {
  shift_drop_maria: [
    { eyebrow: 'RN', title: 'Renee Wallace', meta: ['94% match', 'Available now', 'CPR current'], avatarSeed: 'renee_wallace' },
    { eyebrow: 'RN', title: 'Carl Jensen',   meta: ['90% match', 'Available now', 'Within radius'], avatarSeed: 'carl_jensen' },
    { eyebrow: 'RN', title: 'Tina Boyd',     meta: ['87% match', 'Available now', 'No OT conflict'], avatarSeed: 'tina_boyd' },
  ],
  timeoff_sofia:        { eyebrow: 'PTO request', title: 'Sofia Marin', meta: ['Thu–Fri', '2 shifts inside', 'Balance OK'], avatarSeed: 'timeoff_sofia' },
  document_kenji:       { eyebrow: 'Document', title: 'CPR Certification', meta: ['Kenji Tanaka', 'Expires in 3 weeks', 'Valid'], avatarSeed: 'document_kenji' },
  application_priya:    { eyebrow: 'CNA · New Lead', title: 'Priya Raman', meta: ['92% match', 'Night Shift', 'Downtown'], avatarSeed: 'application_priya' },
  new_user_luis:        { eyebrow: 'Candidate', title: 'Luis Mendez', meta: ['New record', '5 intake tasks', 'No tasks yet'], avatarSeed: 'new_user_luis' },
  missed_clockin_james: { eyebrow: 'Worker', title: 'James Okoro', meta: ['9:00 AM shift', 'No clock-in', 'Grace elapsed'], avatarSeed: 'missed_clockin_james' },
  thread_cancel_wed:    { eyebrow: 'Open Wed shift', title: 'Wed · 7:00 AM', meta: ['Pier 9', 'Informal cancel', 'No release filed'], avatarSeed: 'thread_cancel_wed' },
  missed_clockout_bianca:{ eyebrow: 'Open timesheet', title: 'Bianca Rossi', meta: ['No clock-out', 'Off-site ~6:05 PM', 'Held from payroll'], avatarSeed: 'missed_clockout_bianca' },
  cred_expired_nadia:   { eyebrow: 'Policy', title: 'Nadia Haddad', meta: ['CPR expired', '3 shifts at risk', 'Backfills ready'], avatarSeed: 'cred_expired_nadia' },
  shift_release_jenny: [
    { eyebrow: 'Caregiver', title: 'Renee Wallace', meta: ['94% match', 'Available now', 'Within radius'], avatarSeed: 'renee_wallace' },
    { eyebrow: 'Caregiver', title: 'Carl Jensen',   meta: ['90% match', 'Available now', 'No OT conflict'], avatarSeed: 'carl_jensen' },
    { eyebrow: 'Caregiver', title: 'Tina Boyd',     meta: ['87% match', 'Available now', 'CPR current'], avatarSeed: 'tina_boyd' },
  ],
  fill_confirmed_maria: { eyebrow: 'RN', title: 'Sarah Quinn', meta: ['Clears policy', 'Available now', 'Within radius'], avatarSeed: 'sarah_quinn' },
};

/** A discrete step in a decision's plan — what Ultron will run, in order, if the
 *  operator approves. Replaces the flat candidate-card list on the decision
 *  surface so a bundled "do A and B" prompt reads as its constituent tasks. */
export interface PlanTask {
  label: string;
  /** A secondary line under the label — what the step actually does, in a
   *  sentence (shown muted beneath the task title). */
  detail?: string;
  /** When set, the task surfaces the thread's candidate records as a stacked
   *  avatar group (the people it would contact) instead of plain text. */
  showsCandidates?: boolean;
  /** A single person the task acts on (e.g. the manager to notify) — shown as
   *  one avatar + name in the trailing slot. */
  person?: { name: string; avatarSeed: string };
}

/** Per-thread task breakdown for the docked decision surface. A thread with an
 *  entry here renders its plan as tasks; others keep the candidate-card list.
 *  Sourced from each event's "What I'd do" steps. */
export const THREAD_TASKS: Record<string, PlanTask[]> = {
  shift_drop_maria: [
    { label: 'Message the best-matched replacements', detail: 'Reach out to the top qualified RNs (max 20 — based on 24 active scheduling policies) with the shift details.', showsCandidates: true },
    { label: 'Confirm and assign shift', detail: 'Communicate the need with staff, and assign them to the shift if they agree.' },
    { label: 'Notify the location manager', detail: 'Notify the location manager of the last-minute scheduling change.', person: { name: 'Dana Cole', avatarSeed: 'scheduler_dana' } },
  ],
  timeoff_sofia: [
    { label: 'Confirm the PTO balance covers it' },
    { label: 'Auto-approve the Thursday portion' },
    { label: 'Flag Friday for you', person: { name: 'You', avatarSeed: 'operator' } },
  ],
  document_kenji: [
    { label: 'Set the type to CPR Cert and save the expiry' },
    { label: 'Mark the credential verified' },
    { label: 'Flag that it expires soon' },
  ],
  application_priya: [
    { label: 'Update the status to Qualified' },
    { label: 'Send a warm intro message' },
    { label: 'Ask the two screening questions' },
    { label: 'Move to the recruiter’s queue on reply' },
  ],
  new_shift_forklift: [
    { label: 'Offer to the top matches in ranked order', showsCandidates: true },
    { label: 'Assign the first claim that clears policy' },
    { label: 'Confirm and update the calendar' },
  ],
  new_user_luis: [
    { label: 'Send Luis a welcome message' },
    { label: 'Assign the required intake tasks' },
    { label: 'Follow up until everything’s completed' },
  ],
  missed_clockin_james: [
    { label: 'Text James to ask if he’s on his way', person: { name: 'James Okoro', avatarSeed: 'missed_clockin_james' } },
    { label: 'Update the shift’s confirmation status' },
    { label: 'Flag the scheduling inbox if he’s a no-show' },
  ],
  thread_cancel_wed: [
    { label: 'Record the shift as released on her behalf' },
    { label: 'Reply to acknowledge she’s off it' },
    { label: 'Start a replacement search for the Wed shift' },
  ],
  payroll_acme_invoice: [
    { label: 'Add the shift as a line item' },
    { label: 'Recalculate the invoice total and terms' },
    { label: 'Keep the draft ready for your review' },
  ],
  job_event_staff: [
    { label: 'Invite the top 40 matches', showsCandidates: true },
    { label: 'Fill the 20 openings first-come' },
    { label: 'Keep a standby list and notify you at 80%' },
  ],
  missed_clockout_bianca: [
    { label: 'Text Bianca to confirm her actual end time' },
    { label: 'Update the timesheet from her reply' },
    { label: 'Flag payroll if she doesn’t respond' },
  ],
  schedule_published: [
    { label: 'Message all workers to confirm' },
    { label: 'Chase the unconfirmed with a reminder' },
    { label: 'Give you a Monday-readiness summary' },
  ],
  shift_release_jenny: [
    { label: 'Message the best-matched replacements', showsCandidates: true },
    { label: 'Assign the first qualified yes' },
    { label: 'Confirm the fill and update the schedule' },
  ],
  weekly_fill_report: [
    { label: 'Publish the report to the Home dashboard' },
    { label: 'Flag the 22 under-target shifts' },
    { label: 'Notify scheduling of the Mon–Tue gaps', person: { name: 'Dana Cole', avatarSeed: 'scheduler_dana' } },
  ],
  clockin_devon: [
    { label: 'Re-check the geofence and required fields' },
    { label: 'Approve the clock-in for payroll' },
  ],
  phone_aisha: [
    { label: 'Send a verification ping to the new number', person: { name: 'Aisha Bello', avatarSeed: 'phone_aisha' } },
    { label: 'Update her notification contact on reply' },
    { label: 'Confirm shift alerts route to it' },
  ],
  fill_confirmed_maria: [
    { label: 'Confirm Sarah Quinn for the shift', person: { name: 'Sarah Quinn', avatarSeed: 'sarah_quinn' } },
    { label: 'Update the roster' },
    { label: 'Notify the scheduler', person: { name: 'Dana Cole', avatarSeed: 'scheduler_dana' } },
  ],
  invoice_paid_4821: [
    { label: 'Reconcile the payment against the open balance' },
    { label: 'Close the invoice once it clears' },
    { label: 'Update the ledger' },
  ],
  cred_expired_nadia: [
    { label: 'Flag her 3 upcoming shifts as at-risk' },
    { label: 'Assign Nadia a renewal task with the upload' },
    { label: 'Offer to backfill the shifts she can’t work' },
  ],
};

/** One labelled fact about the event, shown as a label → value row in the flag
 *  card. `alert` marks the values that are *what's off* — the anomalous ones,
 *  rendered in the warning tone (e.g. the imminent start time, the missing
 *  coverage) so the problem reads at a glance. */
export interface FlagRow {
  label: string;
  value: string;
  alert?: boolean;
}

/** A compact facts card Ultron surfaces alongside its plan: a header naming the
 *  event, then a few labelled facts with the salient ones flagged. The tone sets
 *  the accent — `warning` highlights what's off, `positive` what's confirmed,
 *  `neutral` the routine read. */
export interface EventFlag {
  /** Accessible label for the card (the visible eyebrow text is omitted). */
  eyebrow: string;
  /** Accent + badge glyph. Defaults to `warning`. */
  tone?: 'warning' | 'positive' | 'neutral';
  title: string;
  subtitle: string;
  rows: FlagRow[];
}

/** Per-thread facts cards — one per event, surfaced inside Ultron's plan message.
 *  Problem cases lead with what's off (warning); resolved/healthy ones with what's
 *  confirmed (positive); routine ones read neutral. */
export const THREAD_FLAGS: Record<string, EventFlag> = {
  // ── New · needs attention ──
  shift_drop_maria: {
    eyebrow: 'What’s off', tone: 'warning',
    title: 'Uncovered shift · Maria Ellis',
    subtitle: 'Today · 2:00–10:00 PM',
    rows: [
      { label: 'Role', value: 'RN · ICU' },
      { label: 'Location', value: 'Riverside Clinic' },
      { label: 'Starts in', value: '4 hours', alert: true },
      { label: 'Coverage', value: 'None lined up', alert: true },
    ],
  },
  timeoff_sofia: {
    eyebrow: 'What’s off', tone: 'warning',
    title: 'Time-off request · Sofia Marin',
    subtitle: 'Next Thu–Fri',
    rows: [
      { label: 'PTO balance', value: 'Covers it' },
      { label: 'Thursday', value: 'Fully covered' },
      { label: 'Friday', value: 'Thin — 1 backup', alert: true },
    ],
  },
  document_kenji: {
    eyebrow: 'What’s off', tone: 'warning',
    title: 'CPR certification · Kenji Tanaka',
    subtitle: 'Profile upload',
    rows: [
      { label: 'Name match', value: 'Verified' },
      { label: 'Credential', value: 'Valid' },
      { label: 'Expires', value: 'In 3 weeks', alert: true },
    ],
  },
  application_priya: {
    eyebrow: 'What stands out', tone: 'positive',
    title: 'New application · Priya R.',
    subtitle: 'CNA · Night Shift · Downtown',
    rows: [
      { label: 'License', value: 'Valid' },
      { label: 'Availability', value: 'Matches shift' },
      { label: 'Match', value: '92%', alert: true },
    ],
  },
  new_shift_forklift: {
    eyebrow: 'What stands out', tone: 'neutral',
    title: 'New shift · Forklift Op',
    subtitle: 'Fri · 6:00 AM · Bay 4',
    rows: [
      { label: 'Requirement', value: 'Certified-only' },
      { label: 'Available pool', value: '11 certified', alert: true },
      { label: 'Coverage risk', value: 'None' },
    ],
  },
  new_user_luis: {
    eyebrow: 'What stands out', tone: 'neutral',
    title: 'New candidate · Luis M.',
    subtitle: 'Onboarding',
    rows: [
      { label: 'Record', value: 'Candidate' },
      { label: 'Tasks on file', value: 'None yet' },
      { label: 'Intake set', value: '5 standard', alert: true },
    ],
  },
  missed_clockin_james: {
    eyebrow: 'What’s off', tone: 'warning',
    title: 'Missed clock-in · James Okoro',
    subtitle: 'Today · 9:00 AM',
    rows: [
      { label: 'Grace window', value: 'Elapsed', alert: true },
      { label: 'Release on file', value: 'None' },
      { label: 'Channel', value: 'SMS' },
    ],
  },
  thread_cancel_wed: {
    eyebrow: 'What’s off', tone: 'warning',
    title: 'Informal cancellation · Wed shift',
    subtitle: 'Wed · 7:00 AM · Pier 9',
    rows: [
      { label: 'Message', value: '“Can’t make tomorrow”' },
      { label: 'Formal release', value: 'None', alert: true },
      { label: 'Record', value: 'Still shows covered', alert: true },
    ],
  },
  job_event_staff: {
    eyebrow: 'What stands out', tone: 'neutral',
    title: 'New job · Event Staff',
    subtitle: 'Sat · 4:00 PM',
    rows: [
      { label: 'Openings', value: '20' },
      { label: 'Eligible', value: '63 ranked', alert: true },
      { label: 'Filtered out', value: '9 double-booked' },
    ],
  },
  missed_clockout_bianca: {
    eyebrow: 'What’s off', tone: 'warning',
    title: 'Open timesheet · Bianca Rossi',
    subtitle: 'Shift ended ~6:05 PM',
    rows: [
      { label: 'Clock-out', value: 'Missing', alert: true },
      { label: 'Last ping', value: 'Off-site ~6:05 PM' },
      { label: 'Payroll', value: 'Held' },
    ],
  },
  payroll_acme_invoice: {
    eyebrow: 'What stands out', tone: 'neutral',
    title: 'Payroll approved · Acme Logistics',
    subtitle: '$48/hr · 8 hrs',
    rows: [
      { label: 'Invoice', value: 'Open · net-30' },
      { label: 'Duplicate line', value: 'None' },
      { label: 'Action', value: 'Roll onto invoice', alert: true },
    ],
  },
  schedule_published: {
    eyebrow: 'What’s off', tone: 'warning',
    title: 'Schedule published · Next week',
    subtitle: '84 shifts · 31 workers',
    rows: [
      { label: 'Unconfirmed', value: '22 shifts', alert: true },
      { label: 'Heaviest', value: 'Mon–Tue', alert: true },
      { label: 'Workers', value: '31' },
    ],
  },
  // ── New · needs attention (formerly Done) ──
  shift_release_jenny: {
    eyebrow: 'What’s off', tone: 'warning',
    title: 'Released shift · Jenny Park',
    subtitle: 'Sat · 8:00 AM · Lakeside',
    rows: [
      { label: 'Notice', value: 'More than 12 hours' },
      { label: 'Qualified', value: '5 caregivers' },
      { label: 'Coverage', value: 'None yet', alert: true },
    ],
  },
  birthday_tomas: {
    eyebrow: 'What stands out', tone: 'neutral',
    title: 'Birthday · Tomas Greco',
    subtitle: 'Today',
    rows: [
      { label: 'Employee', value: 'Active' },
      { label: 'Channel', value: 'In-app chat' },
      { label: 'Message', value: 'Not sent yet', alert: true },
    ],
  },
  weekly_fill_report: {
    eyebrow: 'What’s off', tone: 'warning',
    title: 'Fill-rate report · Next week',
    subtitle: '84 shifts · 31 workers',
    rows: [
      { label: 'Under target', value: '22 shifts', alert: true },
      { label: 'Heaviest', value: 'Mon–Tue', alert: true },
      { label: 'Status', value: 'Not shared yet' },
    ],
  },
  clockin_devon: {
    eyebrow: 'What stands out', tone: 'neutral',
    title: 'Clock-in · Devon Pierce',
    subtitle: 'Eastgate Warehouse',
    rows: [
      { label: 'Geofence', value: 'Inside' },
      { label: 'Required fields', value: 'Complete' },
      { label: 'Payroll', value: 'Awaiting approval', alert: true },
    ],
  },
  phone_aisha: {
    eyebrow: 'What stands out', tone: 'neutral',
    title: 'Phone change · Aisha Bello',
    subtitle: 'Today',
    rows: [
      { label: 'Field', value: 'Phone number' },
      { label: 'Used for', value: 'Shift alerts' },
      { label: 'Verification', value: 'Pending', alert: true },
    ],
  },
  fill_confirmed_maria: {
    eyebrow: 'What’s off', tone: 'warning',
    title: 'Open RN shift · Maria’s shift',
    subtitle: 'Riverside Clinic',
    rows: [
      { label: 'Candidate', value: 'Sarah Quinn' },
      { label: 'Policy', value: 'Clears · available' },
      { label: 'Assignment', value: 'Unconfirmed', alert: true },
    ],
  },
  invoice_paid_4821: {
    eyebrow: 'What stands out', tone: 'neutral',
    title: 'Paid invoice · #4821',
    subtitle: 'Marked paid by client',
    rows: [
      { label: 'Payment', value: 'Recorded out-of-band' },
      { label: 'Balance', value: 'Still open', alert: true },
      { label: 'Invoice', value: 'Not closed yet' },
    ],
  },
  cred_expired_nadia: {
    eyebrow: 'What’s off', tone: 'warning',
    title: 'Credential lapsed · Nadia Haddad',
    subtitle: 'CPR certification',
    rows: [
      { label: 'Status', value: 'Expired', alert: true },
      { label: 'Policy', value: 'Blocking' },
      { label: 'Shifts at risk', value: '3', alert: true },
    ],
  },
};

/** Ultron's full read on a case, communicated as a short message after the
 *  (collapsed) thinking group — returned as separate paragraphs so it reads in
 *  digestible beats: the reasoning from the start (how it sized up the situation
 *  and the risk), then a closing beat. For a case awaiting a decision that closing
 *  beat is the concrete plan it's asking to approve; for a resolved / workflow-ready
 *  case it's the outcome. The reasoning is the case's own analysis narrative; the
 *  plan mirrors the task breakdown (or the recommendation). */
export function caseSummary(thread: ThreadItem): string[] {
  // Each analysis step's detail line becomes its own paragraph, in order (the
  // closing "Plan created and shared" step carries no detail, so it drops).
  const paragraphs = analyzingSteps(thread.id).map(s => s.detail).filter(Boolean);

  const awaiting = thread.status === 'needs_approval' || thread.status === 'recommended';
  if (awaiting) {
    const tasks = THREAD_TASKS[thread.id];
    if (tasks?.length) {
      const steps = tasks.map(t => t.label.charAt(0).toLowerCase() + t.label.slice(1));
      const list = steps.length > 1
        ? `${steps.slice(0, -1).join(', ')}, and ${steps[steps.length - 1]}`
        : steps[0];
      paragraphs.push(`Here’s my plan — I’ll ${list}. Approve below and I’ll get started.`);
    } else {
      paragraphs.push(`Here’s my plan — ${thread.recommendation} Approve below and I’ll get started.`);
    }
  } else {
    // Resolved / workflow-ready: close on the outcome — unless the case needed no
    // action (its reasoning already concludes that, so an outcome line just repeats it).
    const noAction = thread.recommendation.trim().toLowerCase().startsWith('no action');
    if (!noAction && thread.outcome) paragraphs.push(thread.outcome);
  }

  return paragraphs;
}

/** Ultron's read on a case as a *persistent* message: the reasoning beats plus
 *  the plan it shaped — frozen, so it stays put through the case's lifecycle
 *  (awaiting → working → resolved) rather than being swapped for the outcome.
 *  The outcome is communicated by the trail's final step, so this message reads
 *  the same before and after the operator acts. `acted` drops the "Approve below"
 *  call-to-action once the operator has already responded. */
export function casePlan(thread: ThreadItem, acted: boolean): string[] {
  const paragraphs = analyzingSteps(thread.id).map(s => s.detail).filter(Boolean);

  const tasks = THREAD_TASKS[thread.id];
  let plan: string;
  if (tasks?.length) {
    const steps = tasks.map(t => t.label.charAt(0).toLowerCase() + t.label.slice(1));
    const list = steps.length > 1
      ? `${steps.slice(0, -1).join(', ')}, and ${steps[steps.length - 1]}`
      : steps[0];
    plan = `Here’s my plan — I’ll ${list}.`;
  } else {
    plan = `Here’s my plan — ${thread.recommendation}`;
  }
  if (!acted) plan += ' Approve below and I’ll get started.';
  paragraphs.push(plan);

  return paragraphs;
}

/** Past-activity breakdown shown (expandable) on a resolved card. A block is a
 *  paragraph, and/or a labeled bullet list, a labeled check list, and/or a list
 *  of referenced records (people/shifts) rendered as record cards. */
export interface ActivityBlock {
  text?: string;
  label?: string;
  bullets?: string[];
  checks?: string[];
  records?: RecordRef[];
}

export interface ActivityMilestone {
  icon: WorkingIcon;
  headline: string;
  blocks?: ActivityBlock[];
}

const THREAD_ACTIVITY: Record<string, ActivityMilestone[]> = {
  // New-group cases read as a tight thinking sequence: the detection facts are
  // folded into the analyzing steps (see ANALYZING_ACTIVITIES), so the event
  // trail carries no separate milestones — the reasoning IS the whole trail.
  shift_drop_maria: [],
  timeoff_sofia: [],
  document_kenji: [],
  application_priya: [],
  new_shift_forklift: [],
  new_user_luis: [],
  missed_clockin_james: [],
  thread_cancel_wed: [],
  payroll_acme_invoice: [],
  job_event_staff: [],
  missed_clockout_bianca: [],
  schedule_published: [],
  // Formerly Done — now pending New cases: the reasoning trail IS the whole
  // story (the executed work only appears after the operator approves).
  shift_release_jenny: [],
  fill_confirmed_maria: [],
  cred_expired_nadia: [],
  birthday_tomas: [],
  weekly_fill_report: [],
  clockin_devon: [],
  phone_aisha: [],
  invoice_paid_4821: [],
};

const STATE_ICON: Record<string, WorkingIcon> = {
  detected: 'clock', assessment: 'alert', recommendation: 'send',
  approval: 'edit', execution: 'edit', resolution: 'done',
  monitoring: 'clock', workflow: 'done',
};

/** Per-state detail sentence, sourced from the thread's own narrative fields so
 *  every derived milestone carries a sub-level explanation. Falls back to the
 *  assessment (always present) when the preferred field is empty. */
const STATE_DETAIL: Record<string, (t: ThreadItem) => string | null | undefined> = {
  detected:       t => t.event,
  assessment:     t => t.assessment,
  recommendation: t => t.recommendation,
  approval:       t => t.recommendation,
  execution:      t => t.recommendation,
  resolution:     t => t.outcome ?? t.recommendation,
  monitoring:     t => t.assessment,
  workflow:       t => t.workflowOpportunity ?? t.recommendation,
};

/** The activity breakdown for a thread: an authored rich version where one
 *  exists, otherwise derived from the timeline — each step gets a detail block
 *  drawn from the thread's narrative so no milestone is left bare. */
export function activityForThread(thread: ThreadItem): ActivityMilestone[] {
  // Normalize for the dedupe check below — ignore case and trailing punctuation
  // so "Two RNs called out…" and "Two RNs called out….​" count as the same line.
  const norm = (s: string) => s.trim().replace(/[.\s]+$/, '').toLowerCase();
  return THREAD_ACTIVITY[thread.id]
    ?? thread.timeline.map(s => {
      const detail = STATE_DETAIL[s.state]?.(thread) ?? thread.assessment;
      // Drop the sub-context when it just restates the headline (e.g. an
      // event-spawned case whose detected detail is the title verbatim) — a
      // repeated line reads as redundant noise.
      const redundant = detail != null && norm(detail) === norm(s.headline);
      return {
        icon: STATE_ICON[s.state] ?? 'clock',
        headline: s.headline,
        blocks: detail && !redundant ? [{ text: detail }] : undefined,
      };
    });
}

/** The tools, skills, and data sources an activity drew on — surfaced under each
 *  activity on demand. Keyed by the activity's icon (its kind) so every activity
 *  carries a plausible, relevant set without per-milestone authoring. */
export interface ActivityUsage { tools: string[]; skills: string[]; data: string[]; }

const USAGE_BY_ICON: Record<WorkingIcon, ActivityUsage> = {
  send:  { tools: ['Messaging', 'Push notifications'], skills: ['Outreach drafting', 'Recipient targeting'], data: ['Worker contacts', 'Shift details'] },
  clock: { tools: ['Schedule API', 'Time clock'],      skills: ['Shift monitoring'],                         data: ['Shift records', 'Punch history'] },
  done:  { tools: ['Schedule API'],                    skills: ['Shift assignment'],                         data: ['Shift records', 'Worker profiles'] },
  rate:  { tools: ['Pay engine'],                      skills: ['Rate optimization'],                        data: ['Pay rates', 'Budget headroom'] },
  chart: { tools: ['Analytics engine'],                skills: ['Demand forecasting', 'Scenario modeling'],  data: ['Historical fills', 'Staffing levels'] },
  edit:  { tools: ['Schedule API'],                    skills: ['Candidate ranking'],                        data: ['Worker profiles', 'Availability'] },
  alert: { tools: ['Policy engine'],                   skills: ['Risk assessment'],                          data: ['Policy rules', 'Staffing minimums'] },
};

/** The tools / skills / data an activity used, derived from its icon (kind). */
export const activityUsage = (icon: WorkingIcon): ActivityUsage => USAGE_BY_ICON[icon] ?? USAGE_BY_ICON.clock;

/** The combined, deduped usage across several activities — the full set of tools,
 *  skills, and data that applied to ALL activities in a group. Surfaced once,
 *  under the group's last activity, so it reads as the group's whole toolkit
 *  rather than a single step's. Order follows first appearance across the group. */
export const aggregateUsage = (icons: WorkingIcon[]): ActivityUsage => {
  const merge = (pick: (u: ActivityUsage) => string[]) =>
    [...new Set(icons.flatMap(i => pick(activityUsage(i))))];
  return {
    tools: merge(u => u.tools),
    skills: merge(u => u.skills),
    data: merge(u => u.data),
  };
};

// ── Live landing — incoming signal stream ──────────────────────────────────
// The Live landing feed is a conveyor of incoming operational signals Ultron is
// watching. Each carries a trailing identifier: most are routine ("No action
// required"), but some are real risks ("Risk detected") — those show the orange
// Pulse mark and, the moment they surface, escalate into a fresh New case.

/** One signal in the Live landing feed. */
export interface IncomingEvent {
  id: string;
  /** Capability eyebrow shown above the title. */
  capability: string;
  /** Event headline shown in the feed card. */
  title: string;
  /** Short case name used as the New-group nav label when a risk escalates. */
  name: string;
  /** A real risk: shows the orange Pulse mark and escalates into the New group
   *  as a fresh analyzing case. Routine signals (false) read "No action required". */
  risk: boolean;
  severity?: ThreadSeverity;
  assessment?: string;
  recommendation?: string;
}

/** The signal stream cycled through the Live landing feed (interleaved risk /
 *  routine so the conveyor reads as a live mix). Drawn from the same seed-data
 *  vocabulary as the cases above. */
export const INCOMING_EVENTS: IncomingEvent[] = [
  {
    id: 'riverside_shift_drop',
    capability: 'Coverage Recovery',
    title: 'An RN dropped this afternoon’s shift at Riverside Clinic',
    name: 'Shift Drop Recovery',
    risk: true,
    severity: 'high',
    assessment: 'Urgent fill — the shift starts in under 12 hours with no replacement.',
    recommendation: 'Reach out to the best-matched RNs and fill it.',
  },
  {
    id: 'eastgate_clockin',
    capability: 'Attendance',
    title: 'Clean clock-in at Eastgate Warehouse',
    name: 'Clean Clock-In',
    risk: false,
  },
  {
    id: 'missed_clockin_signal',
    capability: 'Attendance Recovery',
    title: 'A worker never started their 9am shift',
    name: 'Missed Clock-In',
    risk: true,
    severity: 'high',
    assessment: 'The start passed with no clock-in and the grace window has elapsed.',
    recommendation: 'Check if they’re on the way and update the shift.',
  },
  {
    id: 'schedule_published_signal',
    capability: 'Scheduling',
    title: 'Next week’s schedule published',
    name: 'Schedule Published',
    risk: false,
  },
  {
    id: 'cpr_lapse_signal',
    capability: 'Compliance',
    title: 'A CPR certification expired overnight',
    name: 'Credential Lapse',
    risk: true,
    severity: 'medium',
    assessment: 'CPR is required for the role and upcoming shifts would be non-compliant.',
    recommendation: 'Pull from the affected shifts and start renewal.',
  },
  {
    id: 'invoice_paid_signal',
    capability: 'Invoicing',
    title: 'Client marked an invoice as paid',
    name: 'Invoice Paid',
    risk: false,
  },
  {
    id: 'open_timesheet_signal',
    capability: 'Payroll Operations',
    title: 'A timesheet has no clock-out before the payroll run',
    name: 'Open Timesheet',
    risk: true,
    severity: 'medium',
    assessment: 'The shift ended with no clock-out — the open punch is held from payroll.',
    recommendation: 'Confirm the real end time and fix the timesheet.',
  },
  {
    id: 'birthday_signal',
    capability: 'Engagement',
    title: 'An employee’s birthday is today',
    name: 'Birthday Greeting',
    risk: false,
  },
];

/** Build a fresh analyzing case from a detected risk signal — the case that
 *  lands in the New group (orbit/working mark, typing title) the moment Ultron
 *  flags the risk. Minimal but complete enough to flow through the case
 *  pipeline (analyzing → Needs approval → …) via the generic fallbacks. */
export function spawnThreadFromEvent(ev: IncomingEvent): ThreadItem {
  return {
    id: `detected_${ev.id}`,
    name: ev.name,
    title: ev.title,
    capability: ev.capability,
    status: 'analyzing',
    severity: ev.severity ?? 'high',
    event: ev.title.endsWith('.') ? ev.title : `${ev.title}.`,
    assessment: ev.assessment ?? 'Assessing impact and weighing options before recommending a plan.',
    recommendation: ev.recommendation ?? 'Prepare a recommended plan for your approval.',
    outcome: null,
    workflowOpportunity: null,
    timeline: [
      { state: 'detected', headline: ev.title, done: true },
      { state: 'assessment', headline: 'Assessing impact and options', done: false },
    ],
    actions: ['Review plan', 'Approve plan'],
    timestamp: 'Just now',
  };
}

/** Outcome populated when an actioned thread auto-completes (demo lifecycle:
 *  Needs attention → Live stream → Resolved). */
export const RESOLVE_OUTCOMES: Record<string, string> = {
  shift_drop_maria: 'Replacement assigned — coverage restored and the scheduler notified.',
  timeoff_sofia: 'Thursday approved; Friday held for your call.',
  document_kenji: 'CPR cert filed and verified — renewal flagged for 3 weeks out.',
  application_priya: 'Priya screened and moved to the recruiter’s queue.',
  new_shift_forklift: 'Shift offered and claimed — calendar updated.',
  new_user_luis: 'Onboarding kicked off — welcome sent and intake tasks assigned.',
  missed_clockin_james: 'Checked in with James and updated the shift.',
  thread_cancel_wed: 'Release logged and a replacement search started for the Wed shift.',
  payroll_acme_invoice: 'Shift rolled onto Acme’s open invoice — total recalculated.',
  job_event_staff: 'Invitations sent — openings filling first-come with a standby list.',
  missed_clockout_bianca: 'End time confirmed and the timesheet corrected before payroll.',
  schedule_published: 'Confirmations sent — chasing the 22 unconfirmed shifts.',
  shift_release_jenny: 'Replacement assigned — coverage restored.',
  birthday_tomas: 'Birthday note sent to Tomas from the team.',
  weekly_fill_report: 'Report published and the 22 at-risk shifts flagged to scheduling.',
  clockin_devon: 'Clock-in approved and released into the payroll run.',
  phone_aisha: 'New number verified and set as her notification contact.',
  fill_confirmed_maria: 'Sarah Quinn confirmed — coverage restored and the scheduler notified.',
  invoice_paid_4821: 'Payment reconciled and invoice #4821 closed.',
  cred_expired_nadia: 'Renewal started and backfills lined up for the 3 affected shifts.',
};

// ── Ultron chat replies ───────────────────────────────────────────────────────
// DEMO ONLY — canned responses Ultron gives to a free-text message typed into the
// composer. There's no backend or real generation: the reply cycles through this
// pool (indexed by how many times Ultron has answered in the thread) so a short
// back-and-forth reads naturally instead of repeating the same line.
const ULTRON_REPLIES = [
  'Got it — I’ll factor that in and update my recommendation.',
  'Understood. Let me re-check the coverage with that in mind and flag anything that shifts.',
  'Thanks for the context — I’ll adjust the plan and keep you posted as it runs.',
  'Noted. I’ll hold that step for now and keep monitoring in the meantime.',
];

/** Pick Ultron's mocked reply to an operator message. `index` is the count of
 *  replies Ultron has already given in this thread, so consecutive answers walk
 *  through the pool rather than echoing one another. */
export function mockUltronReply(_text: string, index: number): string {
  return ULTRON_REPLIES[index % ULTRON_REPLIES.length];
}

/** Ultron's short text reply after it runs the work for an approved action — it
 *  sits beneath the activity group, closing the loop on the operator's message.
 *  Stage 0 is the first action, stage 1 the follow-up that wraps the case. */
export function actionAck(stage: number): string {
  return stage === 0
    ? 'That’s underway now — I’ll keep you posted as it runs.'
    : 'All done — I’ll keep monitoring and flag anything new.';
}
