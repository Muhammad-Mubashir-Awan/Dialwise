/** Phone numbers and countries. Pure functions; numbers are stored as E.164 ("+442079460118"). */
import {
  type CountryCode,
  getCountries,
  getCountryCallingCode,
  isSupportedCountry,
  parsePhoneNumberFromString,
} from "libphonenumber-js";

export type ParsedPhone = { e164: string; country: string | null };

export function isCountryCode(code: string | null | undefined): code is CountryCode {
  return !!code && /^[A-Z]{2}$/.test(code) && isSupportedCountry(code);
}

function read(raw: string, defaultCountry: CountryCode | undefined): ParsedPhone | null {
  const phone = parsePhoneNumberFromString(raw, defaultCountry);
  if (!phone?.isValid()) return null;
  return { e164: phone.number, country: phone.country ?? null };
}

/**
 * Reads a number typed or imported in local or international format. `defaultCountry` is used for
 * local numbers; a number with its own +code keeps that country. Returns null if it isn't a valid number.
 */
export function parsePhone(raw: string, defaultCountry?: string | null): ParsedPhone | null {
  const text = raw.trim();
  if (!text) return null;
  const upper = defaultCountry?.toUpperCase();
  const country = isCountryCode(upper) ? upper : undefined;
  // "00" is the international prefix in most countries but not all (the US uses 011), so try it as "+".
  return read(text, country) ?? (text.startsWith("00") ? read(`+${text.slice(2)}`, undefined) : null);
}

/** "+442079460118" → "+44 20 7946 0118". */
export function formatPhone(e164: string): string {
  return parsePhoneNumberFromString(e164)?.formatInternational() ?? e164;
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export function countryName(code: string | null | undefined): string {
  if (!code) return "Unknown";
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

export type CountryOption = { code: string; name: string; dial: string };

let options: CountryOption[] | undefined;

/** Every country the phone library knows, sorted by name, e.g. { code: "GB", name: "United Kingdom", dial: "44" }. */
export function countryOptions(): CountryOption[] {
  return (options ??= getCountries()
    .map((code) => ({ code, name: countryName(code), dial: getCountryCallingCode(code) }))
    .sort((a, b) => a.name.localeCompare(b.name)));
}
