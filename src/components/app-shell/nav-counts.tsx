import "server-only";
import { cache, Suspense } from "react";
import { followUpTimes } from "@/lib/data/follow-ups";
import { navCounts } from "@/lib/data/queue";
import { getSettings } from "@/lib/data/settings";
import { getDb } from "@/lib/db/client";
import { requireUser } from "@/lib/session";
import { DueCount, NavCount } from "./due-count";
import type { NavCounts } from "./sidebar-nav";

/** One set of queries per request, shared by the three counts. */
const getCounts = cache(async () => {
  await requireUser();
  const db = getDb();
  const now = new Date();
  const settings = await getSettings(db);
  // A day ahead covers "due by the end of today" in any time zone; the browser does the cut-off.
  const until = new Date(now.getTime() + 24 * 3_600_000);
  const [counts, times] = await Promise.all([navCounts(db, { now, settings }), followUpTimes(db, { until })]);
  return { ...counts, times };
});

async function QueueCount() {
  return <NavCount n={(await getCounts()).ready} />;
}

async function FollowUpsCount() {
  return <DueCount times={(await getCounts()).times} />;
}

async function LeadsCount() {
  return <NavCount n={(await getCounts()).leads} />;
}

/** The sidebar counts, each streamed in after the page shell. */
export const navCountsByHref: NavCounts = {
  "/queue": (
    <Suspense fallback={null}>
      <QueueCount />
    </Suspense>
  ),
  "/follow-ups": (
    <Suspense fallback={null}>
      <FollowUpsCount />
    </Suspense>
  ),
  "/leads": (
    <Suspense fallback={null}>
      <LeadsCount />
    </Suspense>
  ),
};
