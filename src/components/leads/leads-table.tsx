"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "cn";
import { StatusChip, Tags } from "@/components/chips";
import { FollowUpTime, LeadLocalTime, RelativeTime } from "@/components/times";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { CallWindow } from "@/lib/call-window";
import type { LeadRow } from "@/lib/data/leads";
import type { LeadStatus } from "@/lib/db/schema";
import { isTypingTarget } from "@/lib/hotkeys";
import { type LeadFilterValues, leadsHref } from "@/lib/lead-filters";
import { LEAD_STATUS_OPTIONS, STATUS_META } from "@/lib/outcomes";

/** A lead row with its phone already formatted on the server. */
export type LeadTableRow = LeadRow & { phone: string };

type Props = {
  rows: LeadTableRow[];
  filters: LeadFilterValues;
  lists: { id: string; name: string }[];
  tags: string[];
  total: number;
  matching: number;
  page: number;
  pageCount: number;
  callWindow: CallWindow;
};

export function LeadsTable({ rows, filters, lists, tags, total, matching, page, pageCount, callWindow }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(filters.q ?? "");
  // The search last sent to the URL. When the URL changes for another reason (Clear filters, Back), show its search.
  const [sentQ, setSentQ] = useState(filters.q ?? "");
  const [urlQ, setUrlQ] = useState(filters.q ?? "");
  if ((filters.q ?? "") !== urlQ) {
    setUrlQ(filters.q ?? "");
    if ((filters.q ?? "") !== sentQ) {
      setQ(filters.q ?? "");
      setSentQ(filters.q ?? "");
    }
  }
  const [focus, setFocus] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const rowsRef = useRef<HTMLTableSectionElement>(null);

  const go = (changes: Partial<LeadFilterValues>) =>
    startTransition(() => router.replace(leadsHref(filters, changes), { scroll: false }));

  // Search as you type, a moment after the last key.
  useEffect(() => {
    const next = q.trim();
    if (next === sentQ) return;
    const timer = setTimeout(() => {
      setSentQ(next);
      startTransition(() => router.replace(leadsHref(filters, { q: next || undefined }), { scroll: false }));
    }, 250);
    return () => clearTimeout(timer);
  }, [q, sentQ, filters, router]);

  // Keyboard: / search, J and K move, Enter opens.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (document.querySelector("[role='dialog']")) return;
      const key = e.key.toLowerCase();
      if (key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if ((key === "j" || key === "k") && rows.length > 0) {
        e.preventDefault();
        const current = Math.min(focus, rows.length - 1);
        const next = Math.max(0, Math.min(rows.length - 1, current + (key === "j" ? 1 : -1)));
        setFocus(next);
        rowsRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
      } else if (key === "enter" && rows.length > 0 && (e.target === document.body || e.target === null)) {
        e.preventDefault();
        router.push(`/leads/${rows[Math.min(focus, rows.length - 1)].id}`);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    // Lets e2e tests wait until the table shortcuts are live (the table streams in after the page).
    rowsRef.current?.closest("table")?.setAttribute("data-keys-ready", "true");
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [rows, focus, router]);

  const filtered = !!(filters.q || filters.status || filters.list || filters.tag);
  const focusedRow = Math.min(focus, Math.max(rows.length - 1, 0));

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex items-center max-md:flex-[1_1_200px]">
          <Search aria-hidden="true" className="pointer-events-none absolute left-2.5 size-4 text-subtle-foreground" />
          <label htmlFor="lead-search" className="sr-only">
            Search leads
          </label>
          <Input
            ref={searchRef}
            id="lead-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") e.currentTarget.blur();
            }}
            placeholder="Search name, company, phone"
            autoComplete="off"
            className="w-72 pr-8 pl-8 max-md:w-full"
          />
          <Kbd className="absolute right-2 max-md:hidden">/</Kbd>
        </div>
        <label htmlFor="filter-status" className="sr-only">
          Status
        </label>
        <NativeSelect
          id="filter-status"
          value={filters.status ?? ""}
          onChange={(e) => go({ status: (e.target.value || undefined) as LeadStatus | undefined })}
        >
          <NativeSelectOption value="">All statuses</NativeSelectOption>
          {LEAD_STATUS_OPTIONS.map((status) => (
            <NativeSelectOption key={status} value={status}>
              {STATUS_META[status].label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <label htmlFor="filter-list" className="sr-only">
          List
        </label>
        <NativeSelect
          id="filter-list"
          value={filters.list ?? ""}
          onChange={(e) => go({ list: e.target.value || undefined })}
        >
          <NativeSelectOption value="">All lists</NativeSelectOption>
          {lists.map((list) => (
            <NativeSelectOption key={list.id} value={list.id}>
              {list.name}
            </NativeSelectOption>
          ))}
          <NativeSelectOption value="none">No list</NativeSelectOption>
        </NativeSelect>
        <label htmlFor="filter-tag" className="sr-only">
          Tag
        </label>
        <NativeSelect
          id="filter-tag"
          value={filters.tag ?? ""}
          onChange={(e) => go({ tag: e.target.value || undefined })}
        >
          <NativeSelectOption value="">All tags</NativeSelectOption>
          {tags.map((tag) => (
            <NativeSelectOption key={tag} value={tag}>
              {tag}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <span id="lead-count" aria-live="polite" className="ml-auto text-xs text-muted-foreground">
          {matching} of {total} leads
        </span>
      </div>

      <div
        className={cn("relative overflow-x-auto rounded-lg border bg-card transition-opacity", pending && "opacity-60")}
      >
        <table className="w-full border-collapse text-sm" aria-describedby="lead-count">
          <thead>
            <tr className="[&>th]:h-8.5 [&>th]:border-b [&>th]:px-3 [&>th]:text-left [&>th]:text-xs [&>th]:font-medium [&>th]:whitespace-nowrap [&>th]:text-muted-foreground">
              <th>Name</th>
              <th>Phone</th>
              <th>Their time</th>
              <th>Status</th>
              <th className="max-md:hidden">Tags</th>
              <th className="max-md:hidden">List</th>
              <th>Last call</th>
              <th>Follow-up</th>
            </tr>
          </thead>
          <tbody ref={rowsRef}>
            {rows.map((lead, i) => (
              <tr
                key={lead.id}
                onClick={(e) => {
                  if (!(e.target as Element).closest("a")) router.push(`/leads/${lead.id}`);
                }}
                className={cn(
                  "cursor-pointer [&>td]:h-11 [&>td]:border-b [&>td]:px-3 [&>td]:py-1 [&>td]:whitespace-nowrap last:[&>td]:border-b-0 hover:[&>td]:bg-muted",
                  i === focusedRow && "[&>td]:bg-accent! [&>td:first-child]:shadow-[inset_2px_0_0_var(--primary)]",
                )}
              >
                <td>
                  <Link href={`/leads/${lead.id}`} className="block text-inherit no-underline">
                    <strong className="block font-medium">{lead.name}</strong>
                    {lead.company && <span className="text-xs text-muted-foreground">{lead.company}</span>}
                  </Link>
                </td>
                <td className="font-mono tabular-nums">{lead.phone}</td>
                <td>
                  <LeadLocalTime zone={lead.timezone} window={callWindow} />
                </td>
                <td>
                  <StatusChip status={lead.status} />
                </td>
                <td className="max-md:hidden">
                  <Tags tags={lead.tags} />
                </td>
                <td className="text-muted-foreground max-md:hidden">{lead.listName ?? "No list"}</td>
                <td className="text-muted-foreground">
                  {lead.lastCalledAt ? <RelativeTime at={lead.lastCalledAt} /> : "Never"}
                </td>
                <td>
                  <FollowUpTime at={lead.nextFollowUpAt} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="px-4 py-7 text-center text-sm text-muted-foreground">
                    {filtered ? (
                      <>
                        <strong className="mb-1 block text-base font-medium text-foreground">No leads match</strong>
                        Clear a filter or search for something else.{" "}
                        <Link href="/leads" className="text-primary underline-offset-4 hover:underline">
                          Clear filters
                        </Link>
                      </>
                    ) : (
                      <>
                        <strong className="mb-1 block text-base font-medium text-foreground">No leads yet</strong>
                        Add your first lead with the button above, or import a CSV.
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <p className="max-md:hidden">
          <Kbd>J</Kbd> <Kbd>K</Kbd> move · <Kbd>Enter</Kbd> open · <Kbd>/</Kbd> search · <Kbd>A</Kbd> add lead
        </p>
        {pageCount > 1 && (
          <nav aria-label="Pages" className="ml-auto flex items-center gap-3">
            {page > 1 ? (
              <Link href={leadsHref(filters, { page: page - 1 })} className="text-primary hover:underline">
                Previous
              </Link>
            ) : (
              <span className="text-subtle-foreground">Previous</span>
            )}
            <span>
              Page {page} of {pageCount}
            </span>
            {page < pageCount ? (
              <Link href={leadsHref(filters, { page: page + 1 })} className="text-primary hover:underline">
                Next
              </Link>
            ) : (
              <span className="text-subtle-foreground">Next</span>
            )}
          </nav>
        )}
      </div>
    </>
  );
}
