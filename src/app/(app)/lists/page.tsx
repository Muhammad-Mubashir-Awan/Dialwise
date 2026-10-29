import type { Metadata } from "next";
import { Suspense } from "react";
import { ListsPageProvider, ListsTable, NewListButton, NewListForm } from "@/components/lists/lists-ui";
import { PageBody, PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { listSummaries } from "@/lib/data/lists";
import { getDb } from "@/lib/db/client";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Lists" };

export default function Page() {
  return (
    <ListsPageProvider>
      <PageHeader title="Lists">
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
  return <ListsTable lists={await listSummaries(getDb())} />;
}
