/** Time zones per country, from the runtime's built-in time zone data (Node's ICU). Server-side only in practice. */

type LocaleWithZones = Intl.Locale & { getTimeZones?: () => string[] | undefined };

/** ICU still uses some old zone names; store and show today's. */
const CURRENT_NAMES: Record<string, string> = {
  "America/Buenos_Aires": "America/Argentina/Buenos_Aires",
  "America/Catamarca": "America/Argentina/Catamarca",
  "America/Coral_Harbour": "America/Atikokan",
  "America/Cordoba": "America/Argentina/Cordoba",
  "America/Godthab": "America/Nuuk",
  "America/Indianapolis": "America/Indiana/Indianapolis",
  "America/Jujuy": "America/Argentina/Jujuy",
  "America/Louisville": "America/Kentucky/Louisville",
  "America/Mendoza": "America/Argentina/Mendoza",
  "Asia/Calcutta": "Asia/Kolkata",
  "Asia/Katmandu": "Asia/Kathmandu",
  "Asia/Rangoon": "Asia/Yangon",
  "Asia/Saigon": "Asia/Ho_Chi_Minh",
  "Atlantic/Faeroe": "Atlantic/Faroe",
  "Europe/Kiev": "Europe/Kyiv",
  "Pacific/Enderbury": "Pacific/Kanton",
  "Pacific/Ponape": "Pacific/Pohnpei",
  "Pacific/Truk": "Pacific/Chuuk",
};

/** The main zone where outlying areas keep a different time, or where the first zone by name isn't the main one. */
const MAIN_ZONE: Record<string, string> = {
  AR: "America/Argentina/Buenos_Aires",
  CL: "America/Santiago",
  CN: "Asia/Shanghai",
  EC: "America/Guayaquil",
  ES: "Europe/Madrid",
  NZ: "Pacific/Auckland",
  PG: "Pacific/Port_Moresby",
  PT: "Europe/Lisbon",
  UA: "Europe/Kyiv",
};

const currentName = (zone: string) => CURRENT_NAMES[zone] ?? zone;

export function isTimeZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** The country's time zones under today's names, e.g. "US" → ["America/Adak", …]. */
export function countryTimeZones(country: string | null | undefined): string[] {
  if (!country || !/^[A-Z]{2}$/.test(country)) return [];
  const zones = (new Intl.Locale(`und-${country}`) as LocaleWithZones).getTimeZones?.() ?? [];
  return [...new Set(zones.map(currentName))].sort();
}

/** Offsets in January and July, so zones that differ only in summer still count as different. */
function offsets(zone: string): string {
  return [Date.UTC(2026, 0, 15), Date.UTC(2026, 6, 15)]
    .map(
      (at) =>
        new Intl.DateTimeFormat("en", { timeZone: zone, timeZoneName: "longOffset" })
          .formatToParts(at)
          .find((p) => p.type === "timeZoneName")?.value,
    )
    .join();
}

/** The country's time zone when it has one (or all its zones keep the same time); null otherwise. */
export function guessTimeZone(country: string | null | undefined): string | null {
  if (country && MAIN_ZONE[country]) return MAIN_ZONE[country];
  const zones = countryTimeZones(country);
  if (zones.length === 0) return null;
  if (zones.length === 1) return zones[0];
  return new Set(zones.map(offsets)).size === 1 ? zones[0] : null;
}

/**
 * The zone to store for a lead: the chosen one if it belongs to the lead's country (any real zone when the
 * country is unknown), otherwise the country's guess.
 */
export function resolveTimeZone(country: string | null | undefined, chosen: string | null | undefined): string | null {
  const zone = chosen ? currentName(chosen.trim()) : "";
  if (zone) {
    if (country ? countryTimeZones(country).includes(zone) : isTimeZone(zone)) return zone;
  }
  return guessTimeZone(country);
}

/** "America/New_York" → "New York". */
export function timeZoneLabel(zone: string): string {
  return zone.split("/").pop()!.replaceAll("_", " ");
}
