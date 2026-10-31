/** Validates the settings form. Pure, so it can be tested without the framework. */
import { z } from "zod";
import { isCountryCode } from "./phone";

const RETRY_GAP_ERROR = "Enter a whole number of hours from 1 to 168.";

const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a time, like 09:00.");

const SettingsForm = z.object({
  callWindowStart: clock,
  callWindowEnd: clock,
  callDays: z
    .array(z.string().regex(/^[0-6]$/, "Pick days from the list."))
    .min(1, "Pick at least one day.")
    .transform((days) => [...new Set(days.map(Number))].sort((a, b) => a - b)),
  retryGapHours: z
    .string()
    .regex(/^\d+$/, RETRY_GAP_ERROR)
    .transform(Number)
    .refine((hours) => hours >= 1 && hours <= 168, RETRY_GAP_ERROR),
  defaultCountry: z.string().refine((code) => isCountryCode(code), "Pick a country."),
});

/** Settings ready to save; times are "HH:MM". */
export type SettingsValues = z.output<typeof SettingsForm>;
export type SettingsField = keyof SettingsValues;
export type SettingsErrors = Partial<Record<SettingsField, string>>;
export type SettingsFormResult = { ok: true; values: SettingsValues } | { ok: false; errors: SettingsErrors };

const textOf = (value: unknown) => (typeof value === "string" ? value : "");

export function parseSettingsForm(input: Record<string, unknown>): SettingsFormResult {
  const raw = {
    callWindowStart: textOf(input.callWindowStart),
    callWindowEnd: textOf(input.callWindowEnd),
    callDays: Array.isArray(input.callDays) ? input.callDays.map(textOf) : [],
    retryGapHours: textOf(input.retryGapHours),
    defaultCountry: textOf(input.defaultCountry),
  };
  const result = SettingsForm.safeParse(raw);
  const errors: SettingsErrors = {};
  if (!result.success) {
    for (const [field, messages] of Object.entries(z.flattenError(result.error).fieldErrors)) {
      errors[field as SettingsField] = (messages as string[])[0];
    }
  }
  // Checked here, not in the schema, so it still shows when another field is wrong. "HH:MM" sorts as time.
  if (!errors.callWindowStart && !errors.callWindowEnd && raw.callWindowStart >= raw.callWindowEnd) {
    errors.callWindowEnd = "Must be later than the start time.";
  }
  return result.success && !errors.callWindowEnd ? { ok: true, values: result.data } : { ok: false, errors };
}
