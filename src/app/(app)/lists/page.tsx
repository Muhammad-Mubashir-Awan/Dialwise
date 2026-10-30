import type { Metadata } from "next";
import { Suspense } from "react";
import { Download } from "lucide-react";
import { ListsPageProvider, ListsTable, NewListButton, NewListForm } from "@/components/lists/lists-ui";
import { PageBody, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listSummaries } from "@/lib/data/lists";
import { readyCountsByList } from "@/lib/data/queue";
import { getSettings } from "@/lib/data/settings";
import { getDb } from "@/lib/db/client";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Lists" };

export default function Page() {
  return (
    <ListsPageProvider>
      <PageHeader title="Lists">
        <Button variant="outline" asChild>
          <a href="/api/export?type=leads" download>
            <Download aria-hidden="true" />
            Export leads
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/api/export?type=calls" download>
            <Download aria-hidden="true" />
            Export calls
          </a>
        </Button>
        <NewListButton />
      </PageHeader>
      <PageBody>
        <NewListForm />
        <Suspense
          fallback={
            <div aria-busy="true" aria-label="Loading lists" className="max-w-250 rounded-lg border bg-card p-3">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="my-3 h-5 w-full" />
              ))}
            </div>
          }
        >
          <Lists />
        </Suspense>
      </PageBody>
    </ListsPageProvider>
  );
}

async function Lists() {
  await requireUser();
  const db = getDb();
  const now = new Date();
  const [lists, settings] = await Promise.all([listSummaries(db), getSettings(db)]);
  return <ListsTable lists={lists} ready={await readyCountsByList(db, { now, settings })} />;
}
