import { describe, expect, it } from "vitest";
import type { CallOutcome, LeadStatus } from "@/lib/db/schema";
import { CLOSED_STATUSES, needsFollowUp, nextStatus } from "@/lib/outcomes";

const ALL_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "callback",
  "interested",
  "meeting_booked",
  "not_interested",
  "do_not_call",
  "bad_number",
];

describe("nextStatus", () => {
  it.each(["no_answer", "voicemail", "gatekeeper"] as CallOutcome[])(
    "%s moves a new lead to contacted and leaves any other status alone",
    (outcome) => {
      expect(nextStatus("new", outcome)).toBe("contacted");
      for (const status of ALL_STATUSES.filter((s) => s !== "new")) {
        expect(nextStatus(status, outcome)).toBe(status);
      }
    },
  );

  it("callback asks for a callback, unless the lead is already interested", () => {
    expect(nextStatus("new", "callback")).toBe("callback");
    expect(nextStatus("contacted", "callback")).toBe("callback");
    expect(nextStatus("meeting_booked", "callback")).toBe("callback");
    expect(nextStatus("interested", "callback")).toBe("interested");
  });

  it.each([
    ["interested", "interested"],
    ["meeting_booked", "meeting_booked"],
    ["not_interested", "not_interested"],
    ["wrong_number", "bad_number"],
    ["do_not_call", "do_not_call"],
  ] as [CallOutcome, LeadStatus][])("%s sets the status to %s", (outcome, status) => {
    expect(nextStatus("contacted", outcome)).toBe(status);
    expect(nextStatus("callback", outcome)).toBe(status);
  });

  it("never takes a lead out of do not call", () => {
    for (const outcome of [
      "no_answer",
      "callback",
      "interested",
      "meeting_booked",
      "not_interested",
      "wrong_number",
    ] as CallOutcome[]) {
      expect(nextStatus("do_not_call", outcome)).toBe("do_not_call");
    }
  });
});

describe("needsFollowUp", () => {
  it("is true for callback, interested and meeting booked only", () => {
    expect(needsFollowUp("callback")).toBe(true);
    expect(needsFollowUp("interested")).toBe(true);
    expect(needsFollowUp("meeting_booked")).toBe(true);
    for (const outcome of ["no_answer", "voicemail", "gatekeeper", "not_interested", "wrong_number", "do_not_call"]) {
      expect(needsFollowUp(outcome as CallOutcome)).toBe(false);
    }
  });
});

describe("CLOSED_STATUSES", () => {
  it("lists the statuses that leave the queue", () => {
    expect([...CLOSED_STATUSES].sort()).toEqual(["bad_number", "do_not_call", "meeting_booked", "not_interested"]);
  });
});
