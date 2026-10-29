import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { AddLeadButton, LeadDialogShortcut } from "@/components/leads/lead-buttons";
import { LeadsTable } from "@/components/leads/leads-table";
import { PageBody, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { callWindowOf } from "@/lib/call-window";
import { findLeads, leadTags } from "@/lib/data/leads";
import { allLists } from "@/lib/data/lists";
import { getSettings } from "@/lib/data/settings";
import { getDb } from "@/lib/db/client";
import { parseLeadFilters } from "@/lib/lead-filters";
import { getLeadFormOptions } from "@/lib/lead-form-options";
import { formatPhone } from "@/lib/phone";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Leads" };

type SearchParams = PageProps<"/leads">["searchParams"];

export default function Page({ searchParams }: PageProps<"/leads">) {
  return (
    <LeadDialogShortcut shortcut="a">
      <PageHeader title="Leads">
        <Suspense
          fallback={
            <Button disabled>
              <Plus aria-hidden="true" />
              Add lead
            </Button>
          }
        >
          <AddLead searchParams={searchParams} />
        </Suspense>
      </PageHeader>
      <PageBody>
        <Suspense fallback={<LeadsSkeleton />}>
          <Leads searchParams={searchParams} />
        </Suspense>
      </PageBody>
    </LeadDialogShortcut>
  );
}

async function AddLead({ searchParams }: { searchParams: SearchParams }) {
  await requireUser();
  const filters = parseLeadFilters(await searchParams);
  const options = await getLeadFormOptions(getDb());
  return <AddLeadButton options={options} defaultListId={filters.list === "none" ? undefined : filters.list} />;
}

async function Leads({ searchParams }: { searchParams: SearchParams }) {
  await requireUser();
  const filters = parseLeadFilters(await searchParams);
  const db = getDb();
  const [result, lists, tags, settings] = await Promise.all([
    findLeads(db, filters),
    allLists(db),
    leadTags(db),
    getSettings(db),
  ]);
  return (
    <LeadsTable
      rows={result.rows.map((row) => ({ ...row, phone: formatPhone(row.phoneE164) }))}
      filters={{ ...filters, page: result.page }}
      lists={lists}
      tags={tags}
      total={result.total}
      matching={result.matching}
      page={result.page}
      pageCount={result.pageCount}
      callWindow={callWindowOf(settings)}
    />
  );
}

function LeadsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading leads">
      <div className="mb-3 flex flex-wrap gap-2">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="rounded-lg border bg-card p-3">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="my-3 h-5 w-full" />
        ))}
      </div>
    </div>
  );
}
