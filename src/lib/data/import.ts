/** Saving imported leads. Duplicates are decided by the database's unique phone number, so overlapping imports are safe. */
import { and, count, eq, inArray, ne } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/client";
import { FOREIGN_KEY_VIOLATION, pgErrorCode } from "@/lib/db/errors";
import { leads } from "@/lib/db/schema";
import type { LeadValues } from "@/lib/lead-input";

export type ImportResult =
  { ok: true; added: number; duplicates: number; doNotCall: number } | { ok: false; error: string };

/**
 * Adds one batch of leads (up to 500). A number already in the CRM is skipped and the existing lead left as it
 * is; skipped do-not-call leads are counted on their own.
 */
export async function importLeads(
  db: AppDatabase,
  values: LeadValues[],
  { source }: { source: string | null },
): Promise<ImportResult> {
  if (values.length === 0) return { ok: true, added: 0, duplicates: 0, doNotCall: 0 };
  let inserted: { phoneE164: string }[];
  try {
    inserted = await db
      .insert(leads)
      .values(values.map((v) => ({ ...v, source })))
      .onConflictDoNothing({ target: leads.phoneE164 })
      .returning({ phoneE164: leads.phoneE164 });
  } catch (error) {
    if (pgErrorCode(error) === FOREIGN_KEY_VIOLATION) {
      return { ok: false, error: "That list was deleted. Pick another one." };
    }
    throw error;
  }

  const added = new Set(inserted.map((row) => row.phoneE164));
  const skipped = [...new Set(values.map((v) => v.phoneE164).filter((phone) => !added.has(phone)))];
  const [{ doNotCall }] = skipped.length
    ? await db
        .select({ doNotCall: count() })
        .from(leads)
        .where(and(inArray(leads.phoneE164, skipped), eq(leads.status, "do_not_call")))
    : [{ doNotCall: 0 }];
  return { ok: true, added: inserted.length, duplicates: values.length - inserted.length - doNotCall, doNotCall };
}

/** For the review step: how many of these numbers are already in the CRM, and how many of those are do not call. */
export async function phoneStatuses(
  db: AppDatabase,
  phones: string[],
): Promise<{ existing: number; doNotCall: number }> {
  if (phones.length === 0) return { existing: 0, doNotCall: 0 };
  const [[{ existing }], [{ doNotCall }]] = await Promise.all([
    db
      .select({ existing: count() })
      .from(leads)
      .where(and(inArray(leads.phoneE164, phones), ne(leads.status, "do_not_call"))),
    db
      .select({ doNotCall: count() })
      .from(leads)
      .where(and(inArray(leads.phoneE164, phones), eq(leads.status, "do_not_call"))),
  ]);
  return { existing, doNotCall };
}
