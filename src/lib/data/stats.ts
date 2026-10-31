import { asc, eq, gte } from "drizzle-orm";
import { allLists } from "@/lib/data/lists";
import type { AppDatabase } from "@/lib/db/client";
import { calls, leads } from "@/lib/db/schema";
import type { StatsCall } from "@/lib/stats";

/**
 * Every call since `since`, with the lead's list as an index into `lists` (-1 for no list). The browser works
 * out the periods and totals, since only it knows where its days start.
 */
export async function getStatsCalls(db: AppDatabase, since: Date): Promise<{ calls: StatsCall[]; lists: string[] }> {
  const [rows, allNamed] = await Promise.all([
    db
      .select({ calledAt: calls.calledAt, outcome: calls.outcome, listId: leads.listId })
      .from(calls)
      .innerJoin(leads, eq(leads.id, calls.leadId))
      .where(gte(calls.calledAt, since))
      .orderBy(asc(calls.calledAt)),
    allLists(db),
  ]);
  const index = new Map(allNamed.map((list, i) => [list.id, i]));
  return {
    lists: allNamed.map((list) => list.name),
    calls: rows.map((row) => ({
      at: row.calledAt.getTime(),
      outcome: row.outcome,
      list: row.listId ? (index.get(row.listId) ?? -1) : -1,
    })),
  };
}
