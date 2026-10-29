import type { Metadata } from "next";
import { Suspense } from "react";
import { FollowUpsView } from "@/components/follow-ups-view";
import { PageBody, PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { callWindowOf } from "@/lib/call-window";
import { listFollowUps } from "@/lib/data/follow-ups";
import { getSettings } from "@/lib/data/settings";
import { getDb } from "@/lib/db/client";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Follow-ups" };

export default function Page() {
  return (
    <>
      <PageHeader title="Follow-ups" />
      <PageBody>
        <Suspense
          fallback={<Skeleton aria-busy="true" aria-label="Loading follow-ups" className="h-64 max-w-250 rounded-lg" />}
        >
          <FollowUps />
        </Suspense>
      </PageBody>
    </>
  );
}

async function FollowUps() {
  await requireUser();
  const db = getDb();
  const now = new Date();
  // Eight days ahead covers "the next 7 days" after today in any time zone; the browser groups by its own day.
  const until = new Date(now.getTime() + 8 * 24 * 3_600_000);
  const [{ items, total }, settings] = await Promise.all([listFollowUps(db, { until }), getSettings(db)]);
  return <FollowUpsView items={items} total={total} callWindow={callWindowOf(settings)} />;
}
