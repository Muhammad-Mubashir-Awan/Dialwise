/** Labels and colors for lead statuses and call outcomes. Pure, and safe to import in client components. */
import type { CallOutcome, LeadStatus } from "@/lib/db/schema";

export type Tone = "neutral" | "ok" | "warn" | "danger" | "info" | "accent";

export const STATUS_META: Record<LeadStatus, { label: string; tone: Tone }> = {
  new: { label: "New", tone: "neutral" },
  contacted: { label: "Contacted", tone: "neutral" },
  callback: { label: "Callback", tone: "info" },
  interested: { label: "Interested", tone: "ok" },
  meeting_booked: { label: "Meeting booked", tone: "accent" },
  not_interested: { label: "Not interested", tone: "danger" },
  do_not_call: { label: "Do not call", tone: "danger" },
  bad_number: { label: "Bad number", tone: "warn" },
};

/** In key order: the queue logs them with keys 1–9. */
export const OUTCOME_META: Record<CallOutcome, { label: string; tone: Tone; key: string }> = {
  no_answer: { label: "No answer", tone: "neutral", key: "1" },
  voicemail: { label: "Voicemail", tone: "neutral", key: "2" },
  gatekeeper: { label: "Gatekeeper", tone: "warn", key: "3" },
  callback: { label: "Callback", tone: "info", key: "4" },
  interested: { label: "Interested", tone: "ok", key: "5" },
  meeting_booked: { label: "Meeting booked", tone: "accent", key: "6" },
  not_interested: { label: "Not interested", tone: "danger", key: "7" },
  wrong_number: { label: "Wrong number", tone: "warn", key: "8" },
  do_not_call: { label: "Do not call", tone: "danger", key: "9" },
};

export const LEAD_STATUS_OPTIONS = Object.keys(STATUS_META) as LeadStatus[];

/** Outcomes where you spoke with the lead (used for conversation rate). */
export const CONVERSATION_OUTCOMES: CallOutcome[] = [
  "callback",
  "interested",
  "meeting_booked",
  "not_interested",
  "do_not_call",
];

/** Statuses that count as a win in lists and stats. */
export const WON_STATUSES: LeadStatus[] = ["interested", "meeting_booked"];

/** Statuses that take a lead out of the queue. A booked meeting still shows in Follow-ups. */
export const CLOSED_STATUSES: LeadStatus[] = ["meeting_booked", "not_interested", "do_not_call", "bad_number"];

/** No answer and voicemail wait for the retry gap before the lead comes back. */
export const RETRY_OUTCOMES: CallOutcome[] = ["no_answer", "voicemail"];

const FOLLOW_UP_OUTCOMES: CallOutcome[] = ["callback", "interested", "meeting_booked"];

/** Outcomes that need a time: the follow-up, or the meeting for meeting_booked. */
export function needsFollowUp(outcome: CallOutcome): boolean {
  return FOLLOW_UP_OUTCOMES.includes(outcome);
}

/**
 * The lead's status after a call. Attempts (no answer, voicemail, gatekeeper) only move a new lead to
 * contacted, a callback doesn't downgrade an interested lead, and do not call is permanent.
 */
export function nextStatus(current: LeadStatus, outcome: CallOutcome): LeadStatus {
  if (current === "do_not_call") return current;
  switch (outcome) {
    case "no_answer":
    case "voicemail":
    case "gatekeeper":
      return current === "new" ? "contacted" : current;
    case "callback":
      return current === "interested" ? current : "callback";
    case "wrong_number":
      return "bad_number";
    case "interested":
    case "meeting_booked":
    case "not_interested":
    case "do_not_call":
      return outcome;
  }
}
