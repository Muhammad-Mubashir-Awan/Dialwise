import type { Metadata } from "next";
import { Suspense } from "react";
import { PageBody, PageHeader } from "@/components/page-header";
import { StatsView } from "@/components/stats/stats-view";
import { Skeleton } from "@/components/ui/skeleton";
import { getStatsCalls } from "@/lib/data/stats";
import { getDb } from "@/lib/db/client";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Stats" };

/** Two 30-day periods for the comparison, plus a couple of days so any time zone's midnight is covered. */
const HISTORY_DAYS = 62;

export default function Page() {
  return (
    <>
      <PageHeader title="Stats" />
      <PageBody>
        <Suspense
          fallback={<Skeleton aria-busy="true" aria-label="Loading stats" className="h-80 max-w-285 rounded-lg" />}
        >
          <Stats />
        </Suspense>
      </PageBody>
    </>
  );
}

async function Stats() {
  await requireUser();
  const since = new Date();
  since.setDate(since.getDate() - HISTORY_DAYS);
  const { calls, lists } = await getStatsCalls(getDb(), since);
  return <StatsView calls={calls} lists={lists} />;
}
