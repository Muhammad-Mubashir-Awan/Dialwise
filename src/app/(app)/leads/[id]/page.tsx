import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone } from "lucide-react";
import { OutcomeChip, StatusChip, Tags } from "@/components/chips";
import { DeleteLead } from "@/components/leads/delete-lead";
import { EditLeadButton, LeadDialogShortcut } from "@/components/leads/lead-buttons";
import { PageBody, PageHeader } from "@/components/page-header";
import { CallWindowChip, DateTime, FollowUpTime, LeadLocalTime, RelativeTime } from "@/components/times";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getLead } from "@/lib/data/leads";
import { getSettings } from "@/lib/data/settings";
import { getDb } from "@/lib/db/client";
import { websiteHref } from "@/lib/lead-input";
import { getLeadFormOptions } from "@/lib/lead-form-options";
import { countryName, formatPhone } from "@/lib/phone";
import { queueHref } from "@/lib/queue";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Lead" };

export default function Page({ params }: PageProps<"/leads/[id]">) {
  return (
    <LeadDialogShortcut shortcut="e">
      <Suspense fallback={<DetailSkeleton />}>
        <LeadDetail params={params} />
      </Suspense>
    </LeadDialogShortcut>
  );
}

async function LeadDetail({ params }: { params: PageProps<"/leads/[id]">["params"] }) {
  await requireUser();
  const { id } = await params;
  const db = getDb();
  const [lead, options, settings] = await Promise.all([getLead(db, id), getLeadFormOptions(db), getSettings(db)]);
  if (!lead) notFound();

  const callWindow = { start: settings.callWindowStart, end: settings.callWindowEnd, days: settings.callDays };
  const phone = formatPhone(lead.phoneE164);
  const site = lead.website ? websiteHref(lead.website) : null;
  const headline = [lead.role, lead.company].filter(Boolean).join(" at ");

  return (
    <>
      <PageHeader title={lead.name}>
        <EditLeadButton
          options={options}
          lead={{
            id: lead.id,
            name: lead.name,
            role: lead.role,
            company: lead.company,
            phone,
            country: lead.country,
            timezone: lead.timezone,
            email: lead.email,
            website: lead.website,
            listId: lead.listId,
            tags: lead.tags,
            notes: lead.notes,
          }}
        />
        {lead.status !== "do_not_call" && (
          <Button asChild>
            <Link href={queueHref(null, lead.id)}>
              <Phone aria-hidden="true" />
              Call now
            </Link>
          </Button>
        )}
      </PageHeader>
      <PageBody>
        <Link
          href="/leads"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          All leads
        </Link>
        <div className="mb-4 max-w-275">
          {headline && <p className="mb-1.5 text-muted-foreground">{headline}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={lead.status} />
            <CallWindowChip zone={lead.timezone} window={callWindow} />
          </div>
        </div>

        <div className="grid max-w-275 items-start gap-4 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <section aria-labelledby="details-title" className="rounded-lg border bg-card">
            <h2 id="details-title" className="border-b px-4 py-3 text-sm font-semibold">
              Details
            </h2>
            <div className="p-4">
              <dl className="m-0 grid grid-cols-[92px_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm sm:grid-cols-[112px_minmax(0,1fr)] [&>dd]:m-0 [&>dd]:flex [&>dd]:min-w-0 [&>dd]:flex-wrap [&>dd]:items-center [&>dd]:gap-2 [&>dd]:wrap-anywhere [&>dt]:text-muted-foreground">
                <dt>Phone</dt>
                <dd>
                  <a href={`tel:${lead.phoneE164}`} className="font-mono text-foreground tabular-nums hover:underline">
                    {phone}
                  </a>
                </dd>
                <dt>Saved as</dt>
                <dd className="font-mono text-muted-foreground">{lead.phoneE164}</dd>
                <dt>Country</dt>
                <dd>{countryName(lead.country)}</dd>
                <dt>Time zone</dt>
                <dd>
                  {lead.timezone ? (
                    <>
                      {lead.timezone} <LeadLocalTime zone={lead.timezone} window={callWindow} showCity={false} />
                    </>
                  ) : (
                    <span className="text-muted-foreground">Unknown</span>
                  )}
                </dd>
                <dt>Email</dt>
                <dd>
                  {lead.email ? (
                    <a href={`mailto:${lead.email}`} className="hover:underline">
                      {lead.email}
                    </a>
                  ) : (
                    <None />
                  )}
                </dd>
                <dt>Website</dt>
                <dd>
                  {site ? (
                    <a href={site} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {lead.website}
                    </a>
                  ) : (
                    (lead.website ?? <None />)
                  )}
                </dd>
                <dt>List</dt>
                <dd>
                  {lead.listId ? (
                    <Link href={`/leads?list=${lead.listId}`} className="hover:underline">
                      {lead.listName}
                    </Link>
                  ) : (
                    "No list"
                  )}
                </dd>
                <dt>Tags</dt>
                <dd>
                  <Tags tags={lead.tags} />
                </dd>
                {lead.source && (
                  <>
                    <dt>Source</dt>
                    <dd>{lead.source}</dd>
                  </>
                )}
                <dt>Follow-up</dt>
                <dd>
                  {lead.nextFollowUpAt ? (
                    <>
                      <DateTime at={lead.nextFollowUpAt} /> <FollowUpTime at={lead.nextFollowUpAt} />
                    </>
                  ) : (
                    <None />
                  )}
                </dd>
                <dt>Added</dt>
                <dd>
                  <DateTime at={lead.createdAt} dateOnly />
                </dd>
              </dl>
              {lead.notes && (
                <>
                  <h3 className="mt-4 mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    Notes
                  </h3>
                  <p className="max-w-[65ch] text-sm leading-relaxed whitespace-pre-wrap">{lead.notes}</p>
                </>
              )}
              <div className="mt-5 border-t pt-4">
                <DeleteLead id={lead.id} name={lead.name} />
              </div>
            </div>
          </section>

          <section aria-labelledby="history-title" className="rounded-lg border bg-card">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <h2 id="history-title" className="text-sm font-semibold">
                Call history
              </h2>
              <span className="ml-auto font-mono text-xs text-muted-foreground">
                {lead.calls.length} {lead.calls.length === 1 ? "call" : "calls"}
              </span>
            </div>
            <div className="p-4">
              {lead.calls.length === 0 ? (
                <p className="m-0 text-[13px] text-muted-foreground">No calls yet.</p>
              ) : (
                <ol className="m-0 flex list-none flex-col p-0">
                  {lead.calls.map((call) => (
                    <li
                      key={call.id}
                      className="grid gap-1 border-t py-2.5 text-sm first:border-t-0 sm:grid-cols-[128px_minmax(0,1fr)] sm:gap-3"
                    >
                      <span className="pt-0.5 font-mono text-xs text-muted-foreground">
                        <DateTime at={call.calledAt} />
                        <br />
                        <RelativeTime at={call.calledAt} className="text-subtle-foreground" />
                      </span>
                      <span className="flex flex-col items-start gap-1">
                        <OutcomeChip outcome={call.outcome} />
                        {call.note && <span className="whitespace-pre-wrap">{call.note}</span>}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        </div>
      </PageBody>
    </>
  );
}

function None() {
  return <span className="text-subtle-foreground">None</span>;
}

function DetailSkeleton() {
  return (
    <>
      <PageHeader title="Lead" />
      <PageBody>
        <div aria-busy="true" aria-label="Loading lead" className="grid max-w-275 gap-4 md:grid-cols-[360px_1fr]">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </PageBody>
    </>
  );
}
