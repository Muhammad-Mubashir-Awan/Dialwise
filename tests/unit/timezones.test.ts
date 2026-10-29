import { describe, expect, it } from "vitest";
import { countryTimeZones, guessTimeZone, resolveTimeZone, timeZoneLabel } from "@/lib/timezones";

describe("guessTimeZone", () => {
  it.each([
    ["GB", "Europe/London"],
    ["DE", "Europe/Berlin"],
    ["PK", "Asia/Karachi"],
    ["AE", "Asia/Dubai"],
    ["NL", "Europe/Amsterdam"],
  ])("gives %s its only time zone", (country, zone) => {
    expect(guessTimeZone(country)).toBe(zone);
  });

  it("uses today's name for renamed zones", () => {
    expect(guessTimeZone("IN")).toBe("Asia/Kolkata");
    expect(guessTimeZone("UA")).toBe("Europe/Kyiv");
  });

  it("picks the main zone where outlying areas keep a different time", () => {
    expect(guessTimeZone("ES")).toBe("Europe/Madrid");
    expect(guessTimeZone("CN")).toBe("Asia/Shanghai");
    expect(guessTimeZone("PT")).toBe("Europe/Lisbon");
  });

  it("picks the main zone when every zone keeps the same time", () => {
    expect(guessTimeZone("AR")).toBe("America/Argentina/Buenos_Aires");
  });

  it.each(["US", "CA", "AU", "BR", "MX", "RU"])("leaves %s unknown: it has several time zones", (country) => {
    expect(guessTimeZone(country)).toBeNull();
  });

  it("leaves unknown or missing countries unknown", () => {
    expect(guessTimeZone("XX")).toBeNull();
    expect(guessTimeZone(null)).toBeNull();
  });
});

describe("countryTimeZones", () => {
  it("lists a country's zones under today's names", () => {
    const us = countryTimeZones("US");
    expect(us).toContain("America/New_York");
    expect(us).toContain("America/Los_Angeles");
    expect(countryTimeZones("IN")).toEqual(["Asia/Kolkata"]);
    expect(countryTimeZones("AR")).toContain("America/Argentina/Buenos_Aires");
  });

  it("is empty for an unknown country", () => {
    expect(countryTimeZones("XX")).toEqual([]);
    expect(countryTimeZones(null)).toEqual([]);
  });
});

describe("resolveTimeZone", () => {
  it("keeps a chosen zone that belongs to the country", () => {
    expect(resolveTimeZone("US", "America/Chicago")).toBe("America/Chicago");
  });

  it("accepts an old zone name and stores today's name", () => {
    expect(resolveTimeZone("IN", "Asia/Calcutta")).toBe("Asia/Kolkata");
  });

  it("guesses from the country when no zone is chosen", () => {
    expect(resolveTimeZone("GB", null)).toBe("Europe/London");
    expect(resolveTimeZone("US", "")).toBeNull();
  });

  it("replaces a chosen zone from another country with the country's guess", () => {
    expect(resolveTimeZone("GB", "America/Chicago")).toBe("Europe/London");
    expect(resolveTimeZone("US", "Europe/London")).toBeNull();
  });

  it("keeps any real zone when the country is unknown", () => {
    expect(resolveTimeZone(null, "Asia/Tokyo")).toBe("Asia/Tokyo");
    expect(resolveTimeZone(null, "Mars/Olympus")).toBeNull();
  });
});

describe("timeZoneLabel", () => {
  it("names a zone by its city", () => {
    expect(timeZoneLabel("America/New_York")).toBe("New York");
    expect(timeZoneLabel("America/Argentina/Buenos_Aires")).toBe("Buenos Aires");
    expect(timeZoneLabel("Asia/Kolkata")).toBe("Kolkata");
  });
});
