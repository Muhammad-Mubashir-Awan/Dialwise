"use client";

import { useRouter } from "next/navigation";
import { useNow } from "@/components/times";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { CallOutcome } from "@/lib/db/schema";
import { CONVERSATION_OUTCOMES } from "@/lib/outcomes";
import { queueHref } from "@/lib/queue";

/** "Today N calls · M conversations" (today in your time zone) and the list to work. */
export function QueueHeader({
  lists,
  listId,
  recentCalls,
}: {
  lists: { id: string; name: string }[];
  listId: string | null;
  recentCalls: { calledAt: Date; outcome: CallOutcome }[];
}) {
  const router = useRouter();
  const now = useNow();
  const today = now ? new Date(now.getFullYear(), now.getMonth(), now.getDate()) : null;
  const todays = today ? recentCalls.filter((call) => call.calledAt >= today) : [];
  const conversations = todays.filter((call) => CONVERSATION_OUTCOMES.includes(call.outcome)).length;

  return (
    <>
      {today && (
        <span className="text-xs text-muted-foreground max-sm:hidden">
          Today <b className="font-mono font-medium text-foreground">{todays.length}</b> calls ·{" "}
          <b className="font-mono font-medium text-foreground">{conversations}</b> conversations
        </span>
      )}
      <label htmlFor="queue-list" className="sr-only">
        Work list
      </label>
      <NativeSelect
        id="queue-list"
        value={listId ?? ""}
        onChange={(e) => router.push(queueHref(e.target.value || null))}
      >
        <NativeSelectOption value="">All lists</NativeSelectOption>
        {lists.map((list) => (
          <NativeSelectOption key={list.id} value={list.id}>
            {list.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </>
  );
}
