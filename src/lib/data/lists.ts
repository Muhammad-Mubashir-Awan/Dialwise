/** Call list reads and writes. Each function takes the database; callers check the session first. */
import { and, asc, count, eq, inArray, ne, sql } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/client";
import { calls, leads, lists } from "@/lib/db/schema";
import { isUuid } from "@/lib/ids";
import { CONVERSATION_OUTCOMES, WON_STATUSES } from "@/lib/outcomes";

export type ListResult = { ok: true } | { ok: false; error: string };

const NAME_TAKEN = "You already have a list called that.";

async function nameTaken(db: AppDatabase, name: string, exceptId?: string): Promise<boolean> {
  const [row] = await db
    .select({ id: lists.id })
    .from(lists)
    .where(and(sql`lower(${lists.name}) = lower(${name})`, exceptId ? ne(lists.id, exceptId) : undefined))
    .limit(1);
  return !!row;
}

/** Lists by name, for menus. */
export async function allLists(db: AppDatabase): Promise<{ id: string; name: string }[]> {
  return db.select({ id: lists.id, name: lists.name }).from(lists).orderBy(asc(lists.name));
}

export async function createList(
  db: AppDatabase,
  name: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (await nameTaken(db, name)) return { ok: false, error: NAME_TAKEN };
  const [list] = await db.insert(lists).values({ name }).returning({ id: lists.id });
  return { ok: true, id: list.id };
}

export async function renameList(db: AppDatabase, id: string, name: string): Promise<ListResult> {
  if (!isUuid(id)) return { ok: false, error: "That list was deleted." };
  if (await nameTaken(db, name, id)) return { ok: false, error: NAME_TAKEN };
  const [list] = await db.update(lists).set({ name }).where(eq(lists.id, id)).returning({ id: lists.id });
  return list ? { ok: true } : { ok: false, error: "That list was deleted." };
}

/** Deletes the list; its leads stay, with no list. Returns the list's name, or null if there was none. */
export async function deleteList(db: AppDatabase, id: string): Promise<string | null> {
  if (!isUuid(id)) return null;
  const [list] = await db.delete(lists).where(eq(lists.id, id)).returning({ name: lists.name });
  return list?.name ?? null;
}

export type ListSummary = {
  id: string;
  name: string;
  leads: number;
  neverCalled: number;
  calls: number;
  /** Calls where the lead talked to you (see CONVERSATION_OUTCOMES). */
  conversations: number;
  interestedOrBooked: number;
};

/** Every list by name with its lead and call counts. */
export async function listSummaries(db: AppDatabase): Promise<ListSummary[]> {
  const countDistinctLeads = (where: ReturnType<typeof sql>) =>
    sql<number>`count(distinct ${leads.id}) filter (where ${where})`.mapWith(Number);
  return db
    .select({
      id: lists.id,
      name: lists.name,
      leads: sql<number>`count(distinct ${leads.id})`.mapWith(Number),
      neverCalled: countDistinctLeads(sql`${leads.id} is not null and ${calls.id} is null`),
      calls: count(calls.id),
      conversations:
        sql<number>`count(${calls.id}) filter (where ${inArray(calls.outcome, CONVERSATION_OUTCOMES)})`.mapWith(Number),
      interestedOrBooked: countDistinctLeads(inArray(leads.status, WON_STATUSES)),
    })
    .from(lists)
    .leftJoin(leads, eq(leads.listId, lists.id))
    .leftJoin(calls, eq(calls.leadId, leads.id))
    .groupBy(lists.id)
    .orderBy(asc(lists.name));
}
