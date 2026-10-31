/** CSV import and export helpers. Pure: the import page runs these in the browser, the export route on the server. */
import Papa from "papaparse";
import { type LeadValues, parseImportRow, type RawImportLead } from "@/lib/lead-input";

export const MAX_IMPORT_ROWS = 10_000;

/** Lead fields a CSV column can be imported as, with their labels. */
export const IMPORT_FIELDS = [
  ["ignore", "Don't import"],
  ["name", "Name"],
  ["company", "Company"],
  ["role", "Role"],
  ["industry", "Industry"],
  ["phone", "Phone"],
  ["email", "Email"],
  ["website", "Website"],
  ["country", "Country"],
  ["tags", "Tags"],
  ["notes", "Notes"],
] as const;

export type ImportField = (typeof IMPORT_FIELDS)[number][0];

export type ParsedCsv = { ok: true; header: string[]; rows: string[][] } | { ok: false; error: string };

/** Reads a CSV (comma, semicolon or tab separated). The first row must be the header. */
export function parseCsv(text: string): ParsedCsv {
  const clean = text.replace(/^﻿/, "");
  if (!clean.trim()) return { ok: false, error: "That file is empty." };
  const { data } = Papa.parse<string[]>(clean, { skipEmptyLines: "greedy" });
  const [header, ...rows] = data;
  if (!header || rows.length === 0) {
    return { ok: false, error: "That file has no data rows. Check it has a header row and at least one lead." };
  }
  if (rows.length > MAX_IMPORT_ROWS) {
    return {
      ok: false,
      error: `That file has ${rows.length.toLocaleString("en-GB")} rows. Import up to ${MAX_IMPORT_ROWS.toLocaleString("en-GB")} at a time.`,
    };
  }
  return { ok: true, header: header.map((h) => h.trim()), rows };
}

function guessField(header: string): ImportField {
  const h = header.toLowerCase();
  if (/phone|tel|mobile|cell|number/.test(h)) return "phone";
  if (/e-?mail/.test(h)) return "email";
  if (/web|url|site|domain/.test(h)) return "website";
  if (/industry|sector|vertical/.test(h)) return "industry";
  if (/business|company|organi[sz]ation|firm|account/.test(h)) return "company";
  if (/title|role|position|job/.test(h)) return "role";
  if (/name|contact|person/.test(h)) return "name";
  if (/country/.test(h)) return "country";
  if (/tag/.test(h)) return "tags";
  if (/note|comment|remark/.test(h)) return "notes";
  return "ignore";
}

/** A first guess at what each column holds, from its header. The user can change any of them. */
export function guessMapping(header: string[]): ImportField[] {
  return header.map(guessField);
}

/** Excel adds a leading apostrophe to keep values like +44… as text. */
const cell = (value: string | undefined) => (value ?? "").trim().replace(/^'/, "");

/**
 * Turns rows into lead fields using the mapping. Several name columns (first, last) are joined, tags and notes
 * from several columns are combined, and for anything else the first column with a value wins.
 */
export function rowsToRaw(rows: string[][], mapping: ImportField[]): RawImportLead[] {
  return rows.map((row) => {
    const values = (field: ImportField) =>
      mapping.flatMap((f, i) => (f === field && cell(row[i]) ? [cell(row[i])] : []));
    const first = (field: ImportField) => values(field)[0] ?? "";
    return {
      name: values("name").join(" "),
      company: first("company"),
      role: first("role"),
      industry: first("industry"),
      phone: first("phone"),
      email: first("email"),
      website: first("website"),
      country: first("country"),
      tags: values("tags").join(", "),
      notes: values("notes").join("\n"),
    };
  });
}

export type ImportPlan = {
  valid: { row: number; raw: RawImportLead; values: LeadValues }[];
  /** Rows without a usable phone number. */
  invalid: { row: number; raw: RawImportLead }[];
  /** Rows whose number already appeared earlier in the file. */
  repeated: number;
};

/** Checks every row; `row` is the line number in the file (the header is line 1). */
export function planImport(
  raws: RawImportLead[],
  options: { defaultCountry: string; listId: string | null },
): ImportPlan {
  const plan: ImportPlan = { valid: [], invalid: [], repeated: 0 };
  const seen = new Set<string>();
  raws.forEach((raw, i) => {
    const result = parseImportRow(raw, options);
    if (!result.ok) plan.invalid.push({ row: i + 2, raw });
    else if (seen.has(result.values.phoneE164)) plan.repeated += 1;
    else {
      seen.add(result.values.phoneE164);
      plan.valid.push({ row: i + 2, raw, values: result.values });
    }
  });
  return plan;
}

/** Splits rows into batches with at most `maxRows` rows and roughly `maxBytes` of JSON each. */
export function chunkRows<T>(items: T[], { maxRows, maxBytes }: { maxRows: number; maxBytes: number }): T[][] {
  const chunks: T[][] = [];
  let current: T[] = [];
  let size = 0;
  for (const item of items) {
    const itemSize = JSON.stringify(item).length;
    if (current.length > 0 && (current.length >= maxRows || size + itemSize > maxBytes)) {
      chunks.push(current);
      current = [];
      size = 0;
    }
    current.push(item);
    size += itemSize;
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

/** Cells starting with these can run as formulas when the file is opened in a spreadsheet. */
const FORMULA_START = /^[=+\-@\t\r]/;

function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (typeof value === "string" && FORMULA_START.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** One CSV line (with CRLF, which Excel expects). Text that could run as a formula gets a leading apostrophe. */
export function csvLine(values: (string | number | null | undefined)[]): string {
  return `${values.map(csvCell).join(",")}\r\n`;
}

/**
 * The file's text. UTF-8 when the bytes are valid UTF-8 ("CSV UTF-8" in Excel, Google Sheets, most tools);
 * otherwise Windows-1252, which Excel on Windows uses for plain "CSV", so names like Müller survive.
 */
export function decodeCsv(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}
