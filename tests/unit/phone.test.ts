import { describe, expect, it } from "vitest";
import { countryName, countryOptions, formatPhone, isCountryCode, parsePhone } from "@/lib/phone";

describe("parsePhone", () => {
  it.each([
    ["UK local", "020 7946 0118", "GB", "+442079460118", "GB"],
    ["UK international with (0)", "+44 (0) 20 7946 0118", "GB", "+442079460118", "GB"],
    ["US local", "(212) 555-0142", "US", "+12125550142", "US"],
    ["Canada by area code", "+1 416 555 0155", "GB", "+14165550155", "CA"],
    ["Pakistan mobile", "0300 1234567", "PK", "+923001234567", "PK"],
    ["India mobile", "098765 43210", "IN", "+919876543210", "IN"],
    ["Australia landline", "02 5550 1234", "AU", "+61255501234", "AU"],
    ["Germany landline", "030 55550142", "DE", "+493055550142", "DE"],
    ["UAE international", "+971 4 555 0186", "GB", "+97145550186", "AE"],
  ])("reads a %s number", (_, raw, defaultCountry, e164, country) => {
    expect(parsePhone(raw, defaultCountry)).toEqual({ e164, country });
  });

  it("uses the number's own country code over the default country", () => {
    expect(parsePhone("+44 20 7946 0118", "US")).toEqual({ e164: "+442079460118", country: "GB" });
  });

  it("reads a 00 international prefix whatever the default country", () => {
    expect(parsePhone("00442079460902", "GB")?.e164).toBe("+442079460902");
    expect(parsePhone("0044 20 7946 0118", "US")?.e164).toBe("+442079460118");
  });

  it("drops an extension, which E.164 can't hold", () => {
    expect(parsePhone("+44 20 7946 0118 ext. 12", "GB")?.e164).toBe("+442079460118");
  });

  it("keeps numbers that belong to no single country, with no country", () => {
    expect(parsePhone("+800 1234 5678", "GB")).toEqual({ e164: "+80012345678", country: null });
  });

  it.each([
    ["empty", ""],
    ["blank", "   "],
    ["words", "n/a"],
    ["too short", "12"],
    ["too short with a code", "+44 123"],
  ])("rejects %s input", (_, raw) => {
    expect(parsePhone(raw, "GB")).toBeNull();
  });

  it("can't read a local number without a default country", () => {
    expect(parsePhone("020 7946 0118", null)).toBeNull();
    expect(parsePhone("020 7946 0118", "XX")).toBeNull();
  });

  it("accepts a lower-case default country", () => {
    expect(parsePhone("020 7946 0118", "gb")?.e164).toBe("+442079460118");
  });
});

describe("formatPhone", () => {
  it("shows a stored number in international format", () => {
    expect(formatPhone("+442079460118")).toBe("+44 20 7946 0118");
    expect(formatPhone("+12125550142")).toBe("+1 212 555 0142");
  });

  it("returns anything it can't read unchanged", () => {
    expect(formatPhone("not a number")).toBe("not a number");
  });
});

describe("countries", () => {
  it("knows supported country codes", () => {
    expect(isCountryCode("GB")).toBe(true);
    expect(isCountryCode("XX")).toBe(false);
    expect(isCountryCode("gb")).toBe(false);
    expect(isCountryCode("")).toBe(false);
  });

  it("names countries in English", () => {
    expect(countryName("GB")).toBe("United Kingdom");
    expect(countryName("PK")).toBe("Pakistan");
    expect(countryName(null)).toBe("Unknown");
  });

  it("lists every country with its calling code, sorted by name", () => {
    const options = countryOptions();
    expect(options.length).toBeGreaterThan(200);
    expect(options).toContainEqual({ code: "GB", name: "United Kingdom", dial: "44" });
    const names = options.map((o) => o.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});
