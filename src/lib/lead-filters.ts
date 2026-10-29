/** The leads page's filters, kept in the URL so they survive reloads and can be shared. Pure. */
import type { LeadStatus } from "@/lib/db/schema";
import { LEAD_STATUS_OPTIONS } from "@/lib/outcomes";

export type LeadFilterValues = {
  q?: string;
  status?: LeadStatus;
  /** A list id, or "none". */
  list?: string;
  tag?: string;
  page: number;
};

type Params = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseLeadFilters(params: Params): LeadFilterValues {
  const status = first(params.status);
  const list = first(params.list);
  const page = Number(first(params.page));
  const filters: LeadFilterValues = { page: Number.isInteger(page) && page > 0 ? page : 1 };
  const q = first(params.q);
  if (q) filters.q = q.slice(0, 200);
  if (status && (LEAD_STATUS_OPTIONS as string[]).includes(status)) filters.status = status as LeadStatus;
  if (list && (list === "none" || UUID.test(list))) filters.list = list;
  const tag = first(params.tag);
  if (tag) filters.tag = tag.toLowerCase();
  return filters;
}

/** A link to the leads page with `changes` applied; changing any filter goes back to page 1. */
export function leadsHref(current: LeadFilterValues, changes: Partial<LeadFilterValues> = {}): string {
  const next = { ...current, page: 1, ...changes };
  const params = new URLSearchParams();
  for (const key of ["q", "status", "list", "tag"] as const) {
    const value = next[key];
    if (value) params.set(key, value);
  }
  if (next.page > 1) params.set("page", String(next.page));
  const query = params.toString();
  return query ? `/leads?${query}` : "/leads";
}
