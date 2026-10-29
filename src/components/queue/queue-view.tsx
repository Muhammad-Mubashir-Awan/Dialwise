"use client";

import { useEffect, useEffectEvent, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useShell } from "@/components/app-shell/shell-context";
import { useNow } from "@/components/times";
import { Button } from "@/components/ui/button";
import { type LogCallResult, logCallAction, undoCallAction } from "@/lib/actions/calls";
import type { CallWindow } from "@/lib/call-window";
import type { QueueCounts } from "@/lib/data/queue";
import type { CallOutcome } from "@/lib/db/schema";
import { relativeTime } from "@/lib/format";
import { isTypingTarget } from "@/lib/hotkeys";
import { needsFollowUp, OUTCOME_META } from "@/lib/outcomes";
import { arrangeQueue, followUpChoices, queueHref, queueReason } from "@/lib/queue";
import { timeZoneLabel } from "@/lib/timezones";
import { type FollowUpPick, LogPanel, ownZone } from "./log-panel";
import { type QueueCard, QueueLeadCard } from "./queue-lead-card";

const OUTCOME_BY_KEY = Object.fromEntries(
  Object.entries(OUTCOME_META).map(([outcome, meta]) => [meta.key, outcome as CallOutcome]),
);

type Logged = Extract<LogCallResult, { ok: true }> & { note: string };

type Props = {
  ready: QueueCard[];
  pinned: QueueCard | null;
  pinnedProblem: "do_not_call" | "not_found" | null;
  counts: QueueCounts;
  nextOpen: { leadId: string; name: string; timezone: string; at: Date } | null;
  callWindow: CallWindow;
  retryGapHours: number;
  listId: string | null;
  /** When the server built this queue; a new value means fresh data arrived. */
  loadedAt: string;
};

export function QueueView({
  ready,
  pinned,
  pinnedProblem,
  counts,
  nextOpen,
  callWindow,
  retryGapHours,
  listId,
  loadedAt,
}: Props) {
  const router = useRouter();
  const { isGoPending } = useShell();
  const [pending, startTransition] = useTransition();
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Skips last for this visit. Logged leads are hidden at once and stay hidden while their call saves:
  // fresh data from an earlier call must not bring back a lead whose own call hasn't landed yet.
  const [skipped, setSkipped] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [saving, setSaving] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(loadedAt);
  if (loaded !== loadedAt) {
    setLoaded(loadedAt);
    setHidden(hidden.filter((id) => saving.includes(id)));
  }

  const order = arrangeQueue(ready, { pinned, skipped, hidden });
  const lead = order[0] ?? null;

  // The note, outcome and follow-up belong to the lead on screen: start fresh when it changes,
  // except when a lead comes back (undo, or a failed save), which gets its note back.
  const [note, setNote] = useState("");
  const [outcome, setOutcome] = useState<CallOutcome | null>(null);
  const [followUp, setFollowUp] = useState<FollowUpPick>({ id: "tomorrow" });
  const [restore, setRestore] = useState<{ leadId: string; note: string } | null>(null);
  const [shownLead, setShownLead] = useState(lead?.id ?? null);
  if ((lead?.id ?? null) !== shownLead) {
    setShownLead(lead?.id ?? null);
    setNote(restore && restore.leadId === lead?.id ? restore.note : "");
    setOutcome(null);
    setFollowUp({ id: "tomorrow" });
  }
  const [lastLogged, setLastLogged] = useState<Logged | null>(null);

  // Not blocked while an earlier call is saving: the next lead is already on screen, and Next.js sends
  // server actions one at a time, so a quick second key press is queued rather than lost.
  function log(chosen: CallOutcome, followUpAt: Date | null) {
    if (!lead) return;
    const target = lead;
    const text = note.trim();
    setHidden((ids) => [...ids, target.id]);
    setSaving((ids) => [...ids, target.id]);
    startTransition(async () => {
      const result = await logCallAction({ leadId: target.id, outcome: chosen, note: text, followUpAt });
      setSaving((ids) => ids.filter((id) => id !== target.id));
      if (!result.ok) {
        setRestore({ leadId: target.id, note: text });
        setHidden((ids) => ids.filter((id) => id !== target.id));
        toast.error(result.error);
        return;
      }
      const logged = { ...result, note: text };
      setLastLogged(logged);
      toast.success(`${OUTCOME_META[chosen].label} logged for ${result.leadName}`, {
        action: { label: "Undo", onClick: () => undo(logged) },
      });
      if (pinned?.id === target.id) router.replace(queueHref(listId));
    });
  }

  function undo(logged: Logged | null) {
    if (!logged) return;
    setLastLogged(null);
    startTransition(async () => {
      const result = await undoCallAction({ callId: logged.callId, before: logged.before });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setRestore({ leadId: logged.leadId, note: logged.note });
      toast(`Call removed. ${result.leadName} is back on screen.`);
      router.replace(queueHref(listId, logged.leadId));
    });
  }

  function pick(chosen: CallOutcome) {
    if (!lead) return;
    if (needsFollowUp(chosen)) setOutcome(chosen);
    else log(chosen, null);
  }

  function confirm() {
    if (!lead || !outcome) return;
    let at: Date;
    if (followUp.id === "custom") {
      at = new Date(followUp.value);
      if (Number.isNaN(at.getTime())) {
        toast.error("Pick a date and time.");
        return;
      }
    } else {
      const id = followUp.id;
      at = followUpChoices(lead.timezone ?? ownZone(), new Date()).find((c) => c.id === id)!.at;
    }
    log(outcome, at);
  }

  function skip() {
    if (!lead) return;
    const { id, name } = lead;
    setSkipped((ids) => [...ids.filter((x) => x !== id), id]);
    toast(`Skipped ${name}. They're at the back of the queue.`);
    if (pinned?.id === id) router.replace(queueHref(listId));
  }

  async function copy() {
    if (!lead) return;
    try {
      await navigator.clipboard.writeText(lead.phoneE164);
      toast(`Copied ${lead.phoneE164}`);
    } catch {
      const phone = document.getElementById("queue-phone");
      if (phone) {
        const range = document.createRange();
        range.selectNodeContents(phone);
        getSelection()?.removeAllRanges();
        getSelection()?.addRange(range);
      }
      toast("Number selected. Press Ctrl+C to copy.");
    }
  }

  // Keys: 1–9 outcomes, N note, S skip, C copy, U undo, Enter confirm a follow-up, Esc back out.
  const onKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.querySelector("[role='dialog']")) return;
    if (isTypingTarget(e.target)) {
      if (e.key === "Escape") (e.target as HTMLElement).blur();
      return;
    }
    if (isGoPending()) return;
    const key = e.key.toLowerCase();
    const chosen = OUTCOME_BY_KEY[e.key];
    if (chosen) {
      e.preventDefault();
      pick(chosen);
    } else if (key === "n") {
      e.preventDefault();
      noteRef.current?.focus();
    } else if (key === "s") {
      e.preventDefault();
      skip();
    } else if (key === "c") {
      e.preventDefault();
      void copy();
    } else if (key === "u") {
      e.preventDefault();
      undo(lastLogged);
    } else if (e.key === "Enter" && outcome && !(e.target as Element | null)?.closest?.("button, a")) {
      e.preventDefault();
      confirm();
    } else if (e.key === "Escape" && outcome) {
      setOutcome(null);
    }
  });
  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    // Lets e2e tests wait until the keys are live (the queue streams in after the page).
    rootRef.current?.setAttribute("data-keys-ready", "true");
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div ref={rootRef} className="max-w-285">
      {pinnedProblem && (
        <p role="status" className="mb-3 rounded-md border bg-card px-3 py-2 text-[13px]">
          {pinnedProblem === "do_not_call"
            ? "That lead is marked do not call, so it can't be called from the queue."
            : "That lead no longer exists."}{" "}
          <Link href={queueHref(listId)} className="text-primary hover:underline">
            Back to the queue
          </Link>
        </p>
      )}

      {lead ? (
        <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_300px] lg:grid-cols-[minmax(0,1fr)_340px]">
          <QueueLeadCard lead={lead} picked={pinned?.id === lead.id} callWindow={callWindow} onCopy={copy} />
          <LogPanel
            zone={lead.timezone}
            note={note}
            onNoteChange={setNote}
            noteRef={noteRef}
            outcome={outcome}
            onPick={pick}
            followUp={followUp}
            onFollowUpChange={setFollowUp}
            onSkip={skip}
            onConfirm={confirm}
            saving={pending}
          />
        </div>
      ) : (
        <EmptyQueue counts={counts} nextOpen={nextOpen} callWindow={callWindow} listId={listId} />
      )}

      {lead && order.length > 1 && <UpNext leads={order.slice(1, 4)} />}

      <p aria-label="Queue summary" className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          <Count n={counts.ready} /> ready now
        </span>
        <span>
          <Count n={counts.outside} /> outside call hours
        </span>
        <span>
          <Count n={counts.waiting} /> waiting for retry ({retryGapHours}h after no answer)
        </span>
        <span>
          <Count n={counts.scheduled} /> follow-ups scheduled later
        </span>
      </p>
    </div>
  );
}

function Count({ n }: { n: number }) {
  return <b className="font-mono font-medium text-foreground">{n}</b>;
}

function UpNext({ leads }: { leads: QueueCard[] }) {
  const now = useNow();
  return (
    <div className="mt-4">
      <h2 id="up-next-title" className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
        Up next
      </h2>
      <ol aria-labelledby="up-next-title" className="m-0 grid list-none gap-2 p-0 md:grid-cols-3">
        {leads.map((lead) => (
          <li key={lead.id} className="min-w-0 rounded-md border bg-card px-3 py-2.5 text-sm">
            <strong className="font-medium">{lead.name}</strong>
            <span className="block truncate text-xs text-muted-foreground">
              {[lead.company, now && queueReason(lead, now).text].filter(Boolean).join(" · ")}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function EmptyQueue({
  counts,
  nextOpen,
  callWindow,
  listId,
}: Pick<Props, "counts" | "nextOpen" | "callWindow" | "listId">) {
  const now = useNow();
  const inList = listId ? " in this list" : "";
  const nothingLeft = counts.outside + counts.waiting + counts.scheduled === 0;
  const opensAt =
    nextOpen &&
    new Intl.DateTimeFormat("en-GB", {
      timeZone: nextOpen.timezone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(nextOpen.at);

  return (
    <div className="rounded-lg border bg-card px-4 py-7 text-center text-sm text-muted-foreground">
      <strong className="mb-1 block text-base font-medium text-foreground">
        {nothingLeft ? `No leads to call${inList}` : "Nobody to call right now"}
      </strong>
      {counts.outside > 0 ? (
        <p>
          No leads{inList} are inside their local call hours ({callWindow.start.slice(0, 5)}–
          {callWindow.end.slice(0, 5)}).
        </p>
      ) : nothingLeft ? (
        <p>Add leads, or import a CSV, to fill the queue.</p>
      ) : (
        <p>Everyone{inList} is waiting for a retry or for a follow-up later.</p>
      )}
      {nextOpen && now && (
        <p className="mt-1">
          Next call window opens {relativeTime(nextOpen.at, now)}: {nextOpen.name}, {timeZoneLabel(nextOpen.timezone)}{" "}
          {opensAt}.
        </p>
      )}
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {nextOpen && (
          <Button variant="outline" asChild>
            <Link href={queueHref(listId, nextOpen.leadId)}>Call {nextOpen.name} anyway</Link>
          </Button>
        )}
        {nothingLeft && (
          <Button variant="outline" asChild>
            <Link href="/leads">Add a lead</Link>
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href="/import">Import more leads</Link>
        </Button>
      </div>
    </div>
  );
}
