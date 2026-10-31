import { describe, expect, it } from "vitest";
import { parseSettingsForm } from "@/lib/settings-input";

const form = (fields: Record<string, unknown> = {}) => ({
  callWindowStart: "08:30",
  callWindowEnd: "17:00",
  callDays: ["1", "2", "3"],
  retryGapHours: "48",
  defaultCountry: "US",
  ...fields,
});

const errorsOf = (fields: Record<string, unknown>) => {
  const result = parseSettingsForm(form(fields));
  return result.ok ? {} : result.errors;
};

describe("parseSettingsForm", () => {
  it("returns the values ready to save", () => {
    expect(parseSettingsForm(form())).toEqual({
      ok: true,
      values: {
        callWindowStart: "08:30",
        callWindowEnd: "17:00",
        callDays: [1, 2, 3],
        retryGapHours: 48,
        defaultCountry: "US",
      },
    });
  });

  it("sorts the days and drops repeats", () => {
    const result = parseSettingsForm(form({ callDays: ["5", "0", "5"] }));
    expect(result.ok && result.values.callDays).toEqual([0, 5]);
  });

  it.each(["", "9am", "24:00", "12:60", "9:00"])("refuses the time %j", (time) => {
    expect(errorsOf({ callWindowStart: time }).callWindowStart).toBe("Enter a time, like 09:00.");
    expect(errorsOf({ callWindowEnd: time }).callWindowEnd).toBe("Enter a time, like 09:00.");
  });

  it.each([
    ["the same as", "09:00"],
    ["before", "08:00"],
  ])("refuses an end time %s the start", (_, end) => {
    expect(errorsOf({ callWindowStart: "09:00", callWindowEnd: end }).callWindowEnd).toBe(
      "Must be later than the start time.",
    );
  });

  it("still compares the times when another field is wrong", () => {
    expect(errorsOf({ callWindowStart: "18:00", callWindowEnd: "09:00", retryGapHours: "0" })).toEqual({
      callWindowEnd: "Must be later than the start time.",
      retryGapHours: "Enter a whole number of hours from 1 to 168.",
    });
  });

  it("needs at least one call day", () => {
    expect(errorsOf({ callDays: [] }).callDays).toBe("Pick at least one day.");
    expect(errorsOf({ callDays: undefined }).callDays).toBe("Pick at least one day.");
  });

  it.each([["7"], ["-1"], ["1.5"], ["Mon"], [""]])("refuses the day %j", (day) => {
    expect(errorsOf({ callDays: [day] }).callDays).toBeDefined();
  });

  it.each(["1", "168"])("accepts a retry gap of %s hours", (hours) => {
    const result = parseSettingsForm(form({ retryGapHours: hours }));
    expect(result.ok && result.values.retryGapHours).toBe(Number(hours));
  });

  it.each(["", "0", "169", "1.5", "-1", "abc", "1e2"])("refuses a retry gap of %j", (hours) => {
    expect(errorsOf({ retryGapHours: hours }).retryGapHours).toBe("Enter a whole number of hours from 1 to 168.");
  });

  it.each(["", "gb", "XX", "GBR"])("refuses the country %j", (country) => {
    expect(errorsOf({ defaultCountry: country }).defaultCountry).toBe("Pick a country.");
  });

  it("treats anything that isn't text as empty", () => {
    expect(errorsOf({ callWindowStart: null, retryGapHours: 24, defaultCountry: undefined })).toEqual({
      callWindowStart: "Enter a time, like 09:00.",
      retryGapHours: "Enter a whole number of hours from 1 to 168.",
      defaultCountry: "Pick a country.",
    });
  });
});
