/** Validation for the lead and list forms. Pure: the server actions call these before touching the database. */
import { z } from "zod";
import { countryOptions, isCountryCode, parsePhone } from "./phone";
import { resolveTimeZone } from "./timezones";

const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 40;

const text = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`);
const optional = (max: number) => text(max).transform((v) => v || null);

/** "SaaS, warm,, saas" → ["saas", "warm"]. Tags are lower-case so filtering ignores case. */
export function parseTags(input: string): string[] {
  const tags = input.split(",").map((t) => t.trim().replace(/\s+/g, " ").toLowerCase());
  return [...new Set(tags.filter(Boolean))];
}

/**
 * The link for a lead's website: http(s) addresses as they are, bare domains with https:// added.
 * Null for anything else (other schemes such as javascript:, or no domain), so it is safe to use as an href.
 */
export function websiteHref(value: string): string | null {
  const site = value.trim();
  if (!site || /\s/.test(site)) return null;
  const hasScheme = /^[a-z][a-z\d+.-]*:(?!\d)/i.test(site);
  if (hasScheme && !/^https?:\/\//i.test(site)) return null;
  try {
    const url = new URL(hasScheme ? site : `https://${site}`);
    return url.hostname.includes(".") ? url.href : null;
  } catch {
    return null;
  }
}

const LeadForm = z.object({
  name: text(200).min(1, "Enter the person's name."),
  role: optional(200),
  company: optional(200),
  phone: text(50).min(1, "Enter a phone number."),
  country: z.string().trim().toUpperCase(),
  timezone: text(64),
  email: text(320)
    .refine((v) => v === "" || z.email().safeParse(v).success, "Enter an email address like name@example.com.")
    .transform((v) => v || null),
  website: optional(500).refine((v) => v === null || websiteHref(v) !== null, "Enter a web address like example.com."),
  listId: z
    .string()
    .trim()
    .refine((v) => v === "" || z.uuid().safeParse(v).success, "Pick a list from the menu.")
    .transform((v) => v || null),
  tags: z
    .string()
    .max(2000, `Use up to ${MAX_TAGS} tags of ${MAX_TAG_LENGTH} characters or less.`)
    .transform(parseTags)
    .refine(
      (tags) => tags.length <= MAX_TAGS && tags.every((t) => t.length <= MAX_TAG_LENGTH),
      `Use up to ${MAX_TAGS} tags of ${MAX_TAG_LENGTH} characters or less.`,
    ),
  notes: optional(10_000),
});

export type LeadField = keyof z.input<typeof LeadForm>;
const LEAD_FIELDS = Object.keys(LeadForm.shape) as LeadField[];

/** A lead ready to save: phone in E.164, country and time zone worked out. */
export type LeadValues = {
  name: string;
  role: string | null;
  company: string | null;
  phoneRaw: string;
  phoneE164: string;
  country: string | null;
  timezone: string | null;
  email: string | null;
  website: string | null;
  listId: string | null;
  tags: string[];
  notes: string | null;
};

export type LeadErrors = Partial<Record<LeadField, string>>;
export type LeadFormResult = { ok: true; values: LeadValues } | { ok: false; errors: LeadErrors };

/**
 * Validates the lead form. The phone's own +code decides the country; the picked country is only used to
 * read a local number. The time zone is kept if it belongs to that country, otherwise guessed from it.
 */
export function parseLeadForm(input: Record<string, unknown>): LeadFormResult {
  const raw = Object.fromEntries(LEAD_FIELDS.map((k) => [k, typeof input[k] === "string" ? input[k] : ""]));
  const result = LeadForm.safeParse(raw);
  const errors: LeadErrors = {};
  if (!result.success) {
    for (const [field, messages] of Object.entries(z.flattenError(result.error).fieldErrors)) {
      errors[field as LeadField] = (messages as string[])[0];
    }
  }

  const phone = errors.phone ? null : parsePhone(raw.phone, raw.country.trim().toUpperCase());
  if (!errors.phone && !phone) {
    errors.phone = "This doesn't look like a phone number. Check the digits, or pick the country for a local number.";
  }
  if (!result.success || !phone) return { ok: false, errors };

  const { name, role, company, email, website, listId, tags, notes } = result.data;
  return {
    ok: true,
    values: {
      name,
      role,
      company,
      phoneRaw: result.data.phone,
      phoneE164: phone.e164,
      country: phone.country,
      timezone: resolveTimeZone(phone.country, result.data.timezone),
      email,
      website,
      listId,
      tags,
      notes,
    },
  };
}

/** One CSV row after its columns are matched to lead fields (all text, possibly empty). */
export type RawImportLead = {
  name: string;
  company: string;
  role: string;
  phone: string;
  email: string;
  website: string;
  country: string;
  tags: string;
  notes: string;
};

const COUNTRY_ALIASES: Record<string, string> = {
  UK: "GB",
  "GREAT BRITAIN": "GB",
  ENGLAND: "GB",
  USA: "US",
  "UNITED STATES OF AMERICA": "US",
  UAE: "AE",
};

/** A country column's value as an ISO code: "GB", "gb", "United Kingdom" or "UK" give "GB". Null if unknown. */
export function countryFromText(text: string): string | null {
  const value = text.trim().toUpperCase();
  if (!value) return null;
  if (isCountryCode(value)) return value;
  return COUNTRY_ALIASES[value] ?? countryOptions().find((c) => c.name.toUpperCase() === value)?.code ?? null;
}

const clip = (text: string, max: number) => text.trim().slice(0, max) || null;

/**
 * A lead from an imported row. Only the phone must be usable; other fields are kept when valid and dropped (or
 * shortened) when not, so one bad email doesn't lose the lead. The time zone always comes from the country.
 */
export function parseImportRow(
  raw: RawImportLead,
  { defaultCountry, listId }: { defaultCountry: string; listId: string | null },
): { ok: true; values: LeadValues } | { ok: false } {
  const phone = parsePhone(raw.phone, countryFromText(raw.country) ?? defaultCountry);
  if (!phone) return { ok: false };
  const email = raw.email.trim();
  const website = raw.website.trim();
  const tags = parseTags(raw.tags.replaceAll(";", ","))
    .filter((t) => t.length <= MAX_TAG_LENGTH)
    .slice(0, MAX_TAGS);
  return {
    ok: true,
    values: {
      name: clip(raw.name, 200) ?? clip(raw.company, 200) ?? "Unnamed lead",
      role: clip(raw.role, 200),
      company: clip(raw.company, 200),
      phoneRaw: raw.phone.trim().slice(0, 50),
      phoneE164: phone.e164,
      country: phone.country,
      timezone: resolveTimeZone(phone.country, null),
      email: email.length <= 320 && z.email().safeParse(email).success ? email : null,
      website: website.length <= 500 && websiteHref(website) ? website : null,
      listId,
      tags,
      notes: clip(raw.notes, 10_000),
    },
  };
}

export type ListNameResult = { ok: true; name: string } | { ok: false; error: string };

export function parseListName(input: unknown): ListNameResult {
  const result = text(100)
    .min(1, "Enter a name for the list.")
    .safeParse(typeof input === "string" ? input : "");
  return result.success ? { ok: true, name: result.data } : { ok: false, error: result.error.issues[0].message };
}
