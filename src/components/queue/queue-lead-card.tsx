"use client";

import Link from "next/link";
import { Clock, Copy, Phone } from "lucide-react";
import { cn } from "cn";
import { OutcomeChip, StatusChip, Tags } from "@/components/chips";
import { CallWindowChip, DateTime, LeadLocalTime, RelativeTime, useNow } from "@/components/times";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import type { CallWindow } from "@/lib/call-window";
import type { QueueLead } from "@/lib/data/queue";
import { queueReason } from "@/lib/queue";

/** A queue lead with its phone, country and website link worked out on the server (keeps those libraries off the page). */
export type QueueCard = QueueLead & { phone: string; countryName: string; websiteHref: string | null };

export function QueueLeadCard({
  lead,
  picked,
  callWindow,
  onCopy,
}: {
  lead: QueueCard;
  picked: boolean;
  callWindow: CallWindow;
  onCopy: () => void;
}) {
  const now = useNow();
  const reason = now ? queueReason(lead, now) : null;
  const site = lead.websiteHref;

  return (
    <section
      aria-labelledby="queue-lead-name"
      className="flex min-w-0 flex-col gap-4.5 rounded-lg border bg-card p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              "mb-1.5 flex min-h-4 items-center gap-1.5 text-xs text-muted-foreground",
              reason?.due && "font-medium text-danger",
            )}
          >
            <Clock aria-hidden="true" className="size-3.5" />
            {reason?.text}
            {picked && " · picked by you"}
          </p>
          <h2 id="queue-lead-name" className="text-2xl leading-tight font-semibold tracking-tight text-balance">
            {lead.name}
          </h2>
          <p className="mt-1 text-muted-foreground">
            {[lead.role, lead.company].filter(Boolean).join(" at ")}
            {(lead.role || lead.company) && " · "}
            <Link href={`/leads/${lead.id}`} className="underline-offset-4 hover:underline">
              Lead page
            </Link>
          </p>
        </div>
        <StatusChip status={lead.status} />
      </div>

      <div className="flex flex-wrap items-center gap-2.5 rounded-md bg-muted px-3.5 py-3">
        <span id="queue-phone" className="font-mono text-[22px] tracking-wide tabular-nums select-all">
          {lead.phone}
        </span>
        <span className="flex-1" />
        <Button variant="outline" onClick={onCopy}>
          <Copy aria-hidden="true" />
          Copy
          <Kbd className="max-md:hidden">C</Kbd>
        </Button>
        <Button variant="outline" asChild>
          <a href={`tel:${lead.phoneE164}`}>
            <Phone aria-hidden="true" />
            Dial
          </a>
        </Button>
      </div>

      <dl className="m-0 grid grid-cols-[92px_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm sm:grid-cols-[112px_minmax(0,1fr)] [&>dd]:m-0 [&>dd]:flex [&>dd]:min-w-0 [&>dd]:flex-wrap [&>dd]:items-center [&>dd]:gap-2 [&>dd]:wrap-anywhere [&>dt]:text-muted-foreground">
        <dt>Their time</dt>
        <dd>
          <LeadLocalTime zone={lead.timezone} window={callWindow} />
          {lead.timezone && <CallWindowChip zone={lead.timezone} window={callWindow} />}
        </dd>
        <dt>Country</dt>
        <dd>{lead.countryName}</dd>
        <dt>List</dt>
        <dd>{lead.listName ?? "No list"}</dd>
        <dt>Tags</dt>
        <dd>
          <Tags tags={lead.tags} />
        </dd>
        {lead.email && (
          <>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${lead.email}`} className="hover:underline">
                {lead.email}
              </a>
            </dd>
          </>
        )}
        {lead.website && (
          <>
            <dt>Website</dt>
            <dd>
              {site ? (
                <a href={site} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {lead.website}
                </a>
              ) : (
                lead.website
              )}
            </dd>
          </>
        )}
      </dl>

      {lead.notes && (
        <div>
          <h3 className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">Notes</h3>
          <p className="max-w-[65ch] text-sm leading-relaxed whitespace-pre-wrap">{lead.notes}</p>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">Call history</h3>
        {lead.recentCalls.length === 0 ? (
          <p className="m-0 text-[13px] text-muted-foreground">No calls yet.</p>
        ) : (
          <ol className="m-0 flex list-none flex-col p-0">
            {lead.recentCalls.map((call) => (
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
  );
}
