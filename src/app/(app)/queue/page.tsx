import type { Metadata } from "next";
import { Suspense } from "react";
import { PageBody, PageHeader } from "@/components/page-header";
import { QueueHeader } from "@/components/queue/queue-header";
import type { QueueCard } from "@/components/queue/queue-lead-card";
import { QueueView } from "@/components/queue/queue-view";
import { Skeleton } from "@/components/ui/skeleton";
import { callsSince } from "@/lib/data/calls";
import { allLists } from "@/lib/data/lists";
import { callWindowOf, getQueue, type QueueLead } from "@/lib/data/queue";
import { getSettings } from "@/lib/data/settings";
import { getDb } from "@/lib/db/client";
import { websiteHref } from "@/lib/lead-input";
import { countryName, formatPhone } from "@/lib/phone";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Queue" };

type SearchParams = PageProps<"/queue">["searchParams"];

const param = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) || null;

export default function Page({ searchParams }: PageProps<"/queue">) {
  return (
    <>
      <PageHeader title="Queue">
        <Suspense fallback={null}>
          <Header searchParams={searchParams} />
        </Suspense>
      </PageHeader>
      <PageBody>
        <Suspense fallback={<QueueSkeleton />}>
          <Queue searchParams={searchParams} />
        </Suspense>
      </PageBody>
    </>
  );
}

async function Header({ searchParams }: { searchParams: SearchParams }) {
  await requireUser();
  const listId = param((await searchParams).list);
  const db = getDb();
  // The last 36 hours covers "today" in any time zone; the browser picks out today's calls.
  const now = new Date();
  const since = new Date(now.getTime() - 36 * 3_600_000);
  const [lists, recentCalls] = await Promise.all([allLists(db), callsSince(db, since)]);
  return <QueueHeader lists={lists} listId={listId} recentCalls={recentCalls} />;
}

async function Queue({ searchParams }: { searchParams: SearchParams }) {
  await requireUser();
  const params = await searchParams;
  const listId = param(params.list);
  const db = getDb();
  const settings = await getSettings(db);
  const now = new Date();
  const queue = await getQueue(db, { now, settings, listId, pinnedId: param(params.lead) });

  const card = (lead: QueueLead): QueueCard => ({
    ...lead,
    phone: formatPhone(lead.phoneE164),
    countryName: countryName(lead.country),
    websiteHref: lead.website ? websiteHref(lead.website) : null,
  });
  return (
    <QueueView
      ready={queue.ready.map(card)}
      pinned={queue.pinned && card(queue.pinned)}
      pinnedProblem={queue.pinnedProblem}
      counts={queue.counts}
      nextOpen={queue.nextOpen}
      callWindow={callWindowOf(settings)}
      retryGapHours={settings.retryGapHours}
      listId={listId}
      loadedAt={now.toISOString()}
    />
  );
}

function QueueSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading the queue"
      className="grid max-w-285 gap-4 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_340px]"
    >
      <Skeleton className="h-96 rounded-lg" />
      <Skeleton className="h-96 rounded-lg" />
    </div>
  );
}
