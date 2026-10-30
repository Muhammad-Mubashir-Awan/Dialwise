"use server";

import { z } from "zod";
import { importLeads, phoneStatuses } from "@/lib/data/import";
import { getDb } from "@/lib/db/client";
import { parseImportRow } from "@/lib/lead-input";
import { requireUser } from "@/lib/session";

const E164 = z.string().regex(/^\+[1-9][0-9]{7,14}$/);

/** For the review step: how many of the file's numbers are already in the CRM (and how many are do not call). */
export async function checkImportPhones(input: unknown): Promise<{ existing: number; doNotCall: number } | null> {
  await requireUser();
  const parsed = z.array(E164).max(10_000).safeParse(input);
  return parsed.success ? phoneStatuses(getDb(), parsed.data) : null;
}

const text = (max: number) => z.string().max(max);
const RawRow = z.object({
  name: text(1_000),
  company: text(1_000),
  role: text(1_000),
  phone: text(100),
  email: text(1_000),
  website: text(2_000),
  country: text(100),
  tags: text(5_000),
  notes: text(20_000),
});

const ImportBatch = z.object({
  listId: z.uuid().nullable(),
  defaultCountry: z.string().regex(/^[A-Z]{2}$/),
  fileName: text(200),
  rows: z.array(RawRow).max(500),
});

export type ImportBatchResult =
  { ok: true; added: number; duplicates: number; doNotCall: number; invalid: number } | { ok: false; error: string };

/** Imports one batch of rows. Every row is checked again here; the browser's checks are only a preview. */
export async function importBatchAction(input: unknown): Promise<ImportBatchResult> {
  await requireUser();
  const parsed = ImportBatch.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That batch couldn't be read. Try the import again." };
  const { listId, defaultCountry, fileName, rows } = parsed.data;

  const values = rows.flatMap((raw) => {
    const result = parseImportRow(raw, { defaultCountry, listId });
    return result.ok ? [result.values] : [];
  });
  const result = await importLeads(getDb(), values, { source: fileName ? `Import: ${fileName}` : "Import" });
  return result.ok ? { ...result, invalid: rows.length - values.length } : result;
}
