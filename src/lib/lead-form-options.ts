import "server-only";
import { allLists } from "@/lib/data/lists";
import { getSettings } from "@/lib/data/settings";
import type { AppDatabase } from "@/lib/db/client";
import { type CountryOption, countryOptions } from "@/lib/phone";
import { countryTimeZones, guessTimeZone } from "@/lib/timezones";

/** A country's time zones and the one the server picks when none is chosen. */
export type ZoneChoice = { zones: string[]; guess: string | null };

/** What the lead form's menus need. Time zone data comes from the server's ICU, which browsers don't all expose. */
export type LeadFormOptions = {
  lists: { id: string; name: string }[];
  countries: CountryOption[];
  zones: Record<string, ZoneChoice>;
  defaultCountry: string;
};

let countryData: Pick<LeadFormOptions, "countries" | "zones"> | undefined;

function countriesAndZones() {
  return (countryData ??= {
    countries: countryOptions(),
    zones: Object.fromEntries(
      countryOptions().map(({ code }) => [code, { zones: countryTimeZones(code), guess: guessTimeZone(code) }]),
    ),
  });
}

export async function getLeadFormOptions(db: AppDatabase): Promise<LeadFormOptions> {
  const [lists, settings] = await Promise.all([allLists(db), getSettings(db)]);
  return { lists, defaultCountry: settings.defaultCountry, ...countriesAndZones() };
}
