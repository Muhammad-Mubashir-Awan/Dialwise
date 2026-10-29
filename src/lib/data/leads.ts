/** Lead reads and writes. Each function takes the database, so tests can pass PGlite; callers check the session first. */
import { and, arrayContains, count, desc, eq, ilike, isNull, like, or, sql, type SQL } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/client";
import { isUuid } from "@/lib/ids";
import { FOREIGN_KEY_VIOLATION, pgErrorCode, UNIQUE_VIOLATION } from "@/lib/db/errors";
import { calls, type Call, type Lead, type LeadStatus, leads, lists } from "@/lib/db/schema";
import type { LeadErrors, LeadValues } from "@/lib/lead-input";

export const PAGE_SIZE = 50;

export type LeadFilters = {
  q?: string;
  status?: LeadStatus;
  /** A list id, or "none" for leads in no list. */
  list?: string;
  tag?: string;
  /** 1-based. */
  page?: number;
};

/** Escapes LIKE wildcards so a search for "%" finds a literal %. */
const escapeLike = (text: string) => text.replace(/[\\%_]/g, "\\$&");

function searchCondition(q: string): SQL | undefined {
  const text = q.trim();
  if (!text) return undefined;
  const pattern = `%${escapeLike(text)}%`;
  const conditions = [ilike(leads.name, pattern), ilike(leads.company, pattern), ilike(leads.email, pattern)];
  // Phone searches: match digits in the stored E.164, dropping leading zeros so "020 7946" finds +44 20 7946.
  const digits = text.replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length >= 3 && /^[\d\s()+.-]+$/.test(text)) conditions.push(like(leads.phoneE164, `%${digits}%`));
  return or(...conditions);
}

function filterCondition(filters: LeadFilters): SQL | undefined {
  return and(
    searchCondition(filters.q ?? ""),
    filters.status ? eq(leads.status, filters.status) : undefined,
    filters.list === "none" ? isNull(leads.listId) : filters.list ? eq(leads.listId, filters.list) : undefined,
    filters.tag ? arrayContains(leads.tags, [filters.tag]) : undefined,
  );
}

export type LeadRow = Pick<
  Lead,
  "id" | "name" | "company" | "phoneE164" | "timezone" | "status" | "tags" | "lastCalledAt" | "nextFollowUpAt"
> & { listName: string | null };

export type LeadPage = { rows: LeadRow[]; total: number; matching: number; page: number; pageCount: number };

/** One page of leads matching the filters, newest first, with counts for "N of M leads". */
export async function findLeads(
  db: AppDatabase,
  filters: LeadFilters,
  { pageSize = PAGE_SIZE }: { pageSize?: number } = {},
): Promise<LeadPage> {
  const where = filterCondition(filters);
  const [[{ total }], [{ matching }]] = await Promise.all([
    db.select({ total: count() }).from(leads),
    db.select({ matching: count() }).from(leads).where(where),
  ]);
  const pageCount = Math.max(1, Math.ceil(matching / pageSize));
  const page = Math.min(Math.max(1, Math.floor(filters.page ?? 1)), pageCount);

  const rows = await db
    .select({
      id: leads.id,
      name: leads.name,
      company: leads.company,
      phoneE164: leads.phoneE164,
      timezone: leads.timezone,
      status: leads.status,
      tags: leads.tags,
      lastCalledAt: leads.lastCalledAt,
      nextFollowUpAt: leads.nextFollowUpAt,
      listName: lists.name,
    })
    .from(leads)
    .leftJoin(lists, eq(lists.id, leads.listId))
    .where(where)
    .orderBy(desc(leads.createdAt), desc(leads.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return { rows, total, matching, page, pageCount };
}

export type LeadDetail = Lead & { listName: string | null; calls: Call[] };

/** A lead with its list name and call history (newest first), or null. */
export async function getLead(db: AppDatabase, id: string): Promise<LeadDetail | null> {
  if (!isUuid(id)) return null;
  const [[row], history] = await Promise.all([
    db
      .select({ lead: leads, listName: lists.name })
      .from(leads)
      .leftJoin(lists, eq(lists.id, leads.listId))
      .where(eq(leads.id, id)),
    db.select().from(calls).where(eq(calls.leadId, id)).orderBy(desc(calls.calledAt)),
  ]);
  return row ? { ...row.lead, listName: row.listName, calls: history } : null;
}

export type SaveLeadResult =
  { ok: true; id: string; name: string } | { ok: false; errors: LeadErrors; notFound?: true };

/** Turns a rejected write into a message next to the field that caused it. */
async function saveError(db: AppDatabase, error: unknown, values: LeadValues): Promise<SaveLeadResult> {
  const code = pgErrorCode(error);
  if (code === UNIQUE_VIOLATION) {
    const [owner] = await db.select({ name: leads.name }).from(leads).where(eq(leads.phoneE164, values.phoneE164));
    return { ok: false, errors: { phone: `${owner?.name ?? "Another lead"} already has this number.` } };
  }
  if (code === FOREIGN_KEY_VIOLATION) {
    return { ok: false, errors: { listId: "That list was deleted. Pick another one." } };
  }
  throw error;
}

export async function createLead(db: AppDatabase, values: LeadValues): Promise<SaveLeadResult> {
  try {
    const [lead] = await db.insert(leads).values(values).returning({ id: leads.id, name: leads.name });
    return { ok: true, ...lead };
  } catch (error) {
    return saveError(db, error, values);
  }
}

/** Saves the form's fields. Status, call times and history only change when calls are logged. */
export async function updateLead(db: AppDatabase, id: string, values: LeadValues): Promise<SaveLeadResult> {
  if (!isUuid(id)) return { ok: false, errors: {}, notFound: true };
  try {
    const [lead] = await db
      .update(leads)
      .set(values)
      .where(eq(leads.id, id))
      .returning({ id: leads.id, name: leads.name });
    return lead ? { ok: true, ...lead } : { ok: false, errors: {}, notFound: true };
  } catch (error) {
    return saveError(db, error, values);
  }
}

/** Deletes the lead and (by cascade) its calls. Returns the deleted lead's name, or null if there was none. */
export async function deleteLead(db: AppDatabase, id: string): Promise<string | null> {
  if (!isUuid(id)) return null;
  const [lead] = await db.delete(leads).where(eq(leads.id, id)).returning({ name: leads.name });
  return lead?.name ?? null;
}

/** Every tag in use, sorted, for the tag filter. */
export async function leadTags(db: AppDatabase): Promise<string[]> {
  const tag = sql<string>`unnest(${leads.tags})`;
  const rows = await db.selectDistinct({ tag }).from(leads).orderBy(tag);
  return rows.map((r) => r.tag);
}
