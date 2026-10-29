"use client";

import { SkipForward } from "lucide-react";
import { cn } from "cn";
import { useNow } from "@/components/times";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Textarea } from "@/components/ui/textarea";
import type { CallOutcome } from "@/lib/db/schema";
import { needsFollowUp, OUTCOME_META, type Tone } from "@/lib/outcomes";
import { type FollowUpChoice, followUpChoices } from "@/lib/queue";

const GROUPS: [string, CallOutcome[]][] = [
  ["No conversation", ["no_answer", "voicemail", "gatekeeper"]],
  ["Conversation", ["callback", "interested", "meeting_booked"]],
  ["Close out", ["not_interested", "wrong_number", "do_not_call"]],
];

const DOT: Record<Tone, string> = {
  neutral: "bg-neutral",
  ok: "bg-ok",
  warn: "bg-warn",
  danger: "bg-danger",
  info: "bg-info",
  accent: "bg-primary",
};
const PRESSED: Record<Tone, string> = {
  neutral: "border-neutral bg-neutral-soft ring-1 ring-neutral",
  ok: "border-ok bg-ok-soft ring-1 ring-ok",
  warn: "border-warn bg-warn-soft ring-1 ring-warn",
  danger: "border-danger bg-danger-soft ring-1 ring-danger",
  info: "border-info bg-info-soft ring-1 ring-info",
  accent: "border-primary bg-accent ring-1 ring-primary",
};

/** The follow-up the user picked: one of the quick choices, or their own date and time. */
export type FollowUpPick = { id: FollowUpChoice["id"] } | { id: "custom"; value: string };

/** The browser's own zone, used for follow-up times when the lead's zone is unknown. */
export const ownZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export function LogPanel({
  zone,
  note,
  onNoteChange,
  noteRef,
  outcome,
  onPick,
  followUp,
  onFollowUpChange,
  onSkip,
  onConfirm,
  saving,
}: {
  /** The lead's time zone, or null when unknown. */
  zone: string | null;
  note: string;
  onNoteChange: (note: string) => void;
  noteRef: React.RefObject<HTMLTextAreaElement | null>;
  outcome: CallOutcome | null;
  onPick: (outcome: CallOutcome) => void;
  followUp: FollowUpPick;
  onFollowUpChange: (pick: FollowUpPick) => void;
  onSkip: () => void;
  onConfirm: () => void;
  /** A logged call is still being saved. */
  saving: boolean;
}) {
  const now = useNow();
  const selected = outcome && needsFollowUp(outcome) ? outcome : null;
  const theirs = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone ?? undefined,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const yours = new Intl.DateTimeFormat("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <aside aria-labelledby="log-title" className="rounded-lg border bg-card md:sticky md:top-0">
      <div className="flex items-center border-b px-4 py-3">
        <h2 id="log-title" className="text-sm font-semibold">
          Log the call
        </h2>
        <span aria-live="polite" className="ml-auto text-xs text-muted-foreground">
          {saving ? "Saving…" : ""}
        </span>
      </div>
      <div className="flex flex-col gap-3.5 p-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="queue-note" className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            Note <Kbd className="max-md:hidden">N</Kbd>
          </label>
          <Textarea
            ref={noteRef}
            id="queue-note"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="What happened on the call?"
            rows={3}
            maxLength={2000}
            aria-describedby="queue-note-help"
          />
          <p id="queue-note-help" className="text-xs text-muted-foreground">
            Write the note first, then pick an outcome. Outcomes 1–3 and 7–9 log straight away.
          </p>
        </div>

        {GROUPS.map(([group, outcomes]) => (
          <div key={group} role="group" aria-label={group} className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">{group}</span>
            {outcomes.map((o) => {
              const meta = OUTCOME_META[o];
              return (
                <button
                  key={o}
                  type="button"
                  aria-pressed={outcome === o}
                  onClick={() => onPick(o)}
                  className={cn(
                    "flex h-8.5 w-full items-center gap-2.5 rounded-md border bg-card px-2.5 text-left text-sm transition-colors hover:bg-muted disabled:opacity-60 pointer-coarse:min-h-11",
                    outcome === o && PRESSED[meta.tone],
                  )}
                >
                  <span aria-hidden="true" className={cn("size-1.75 shrink-0 rounded-full", DOT[meta.tone])} />
                  {meta.label}
                  {needsFollowUp(o) && <span className="text-xs text-subtle-foreground">+ date</span>}
                  <Kbd className="ml-auto max-md:hidden">{meta.key}</Kbd>
                </button>
              );
            })}
          </div>
        ))}

        {selected && now && (
          <div role="group" aria-labelledby="follow-up-title" className="flex flex-col gap-2 rounded-md bg-muted p-3">
            <span id="follow-up-title" className="text-xs font-medium">
              {selected === "meeting_booked" ? "Meeting time" : "Follow up"}{" "}
              <span className="font-normal text-subtle-foreground">
                · their time{zone ? "" : " unknown, using yours"}
              </span>
            </span>
            <div className="flex flex-col gap-1">
              {followUpChoices(zone ?? ownZone(), now).map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  aria-pressed={followUp.id === choice.id}
                  onClick={() => onFollowUpChange({ id: choice.id })}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md border bg-card px-2.5 py-1.5 text-left text-sm pointer-coarse:min-h-11",
                    followUp.id === choice.id && "border-primary ring-1 ring-primary",
                  )}
                >
                  <span>{choice.label}</span>
                  <small className="font-mono text-[11px] text-muted-foreground">
                    {theirs.format(choice.at)}
                    {zone && ` · you ${yours.format(choice.at)}`}
                  </small>
                </button>
              ))}
            </div>
            <label htmlFor="follow-up-custom" className="mt-1 text-xs text-muted-foreground">
              Or pick a date and time (your time)
            </label>
            <input
              id="follow-up-custom"
              type="datetime-local"
              value={followUp.id === "custom" ? followUp.value : ""}
              onChange={(e) =>
                onFollowUpChange(e.target.value ? { id: "custom", value: e.target.value } : { id: "tomorrow" })
              }
              className="h-8 rounded-lg border border-input bg-card px-2.5 text-sm max-md:h-11 max-md:text-base"
            />
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={onSkip}>
            <SkipForward aria-hidden="true" />
            Skip
            <Kbd className="max-md:hidden">S</Kbd>
          </Button>
          <Button className="flex-1" onClick={onConfirm} disabled={!selected}>
            Log and next
            <Kbd className="bg-primary-foreground/15 text-primary-foreground max-md:hidden">Enter</Kbd>
          </Button>
        </div>
      </div>
    </aside>
  );
}
