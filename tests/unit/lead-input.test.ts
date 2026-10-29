import { describe, expect, it } from "vitest";
import { parseLeadForm, parseListName, parseTags, websiteHref } from "@/lib/lead-input";

const LIST_ID = "6f1c2a4e-8b0d-4c3e-9f7a-1b2c3d4e5f60";

const form = (overrides: Record<string, string> = {}) => ({
  name: "Amelia Hart",
  role: "",
  company: "",
  phone: "020 7946 0118",
  country: "GB",
  timezone: "",
  email: "",
  website: "",
  listId: "",
  tags: "",
  notes: "",
  ...overrides,
});

describe("parseLeadForm", () => {
  it("normalizes the phone and fills country and time zone from it", () => {
    const result = parseLeadForm(form());
    expect(result).toEqual({
      ok: true,
      values: {
        name: "Amelia Hart",
        role: null,
        company: null,
        phoneRaw: "020 7946 0118",
        phoneE164: "+442079460118",
        country: "GB",
        timezone: "Europe/London",
        email: null,
        website: null,
        listId: null,
        tags: [],
        notes: null,
      },
    });
  });

  it("trims every field and keeps the optional ones", () => {
    const result = parseLeadForm(
      form({
        name: "  Amelia Hart ",
        role: " Founder ",
        company: " Brightpath ",
        email: " amelia@brightpath.example ",
        website: " brightpath.example ",
        listId: LIST_ID,
        tags: "SaaS, warm",
        notes: " Runs a team of 12. ",
      }),
    );
    expect(result.ok && result.values).toMatchObject({
      name: "Amelia Hart",
      role: "Founder",
      company: "Brightpath",
      email: "amelia@brightpath.example",
      website: "brightpath.example",
      listId: LIST_ID,
      tags: ["saas", "warm"],
      notes: "Runs a team of 12.",
    });
  });

  it("takes the country from an international number, not the picked country", () => {
    const result = parseLeadForm(form({ phone: "+1 212 555 0142", country: "GB", timezone: "Europe/London" }));
    expect(result.ok && result.values).toMatchObject({ phoneE164: "+12125550142", country: "US", timezone: null });
  });

  it("keeps a chosen time zone that fits the country", () => {
    const result = parseLeadForm(form({ phone: "(212) 555-0142", country: "US", timezone: "America/New_York" }));
    expect(result.ok && result.values.timezone).toBe("America/New_York");
  });

  it("explains each problem next to its field", () => {
    const result = parseLeadForm(form({ name: " ", phone: "", email: "not-an-email", listId: "nope" }));
    expect(result).toEqual({
      ok: false,
      errors: {
        name: "Enter the person's name.",
        phone: "Enter a phone number.",
        email: "Enter an email address like name@example.com.",
        listId: "Pick a list from the menu.",
      },
    });
  });

  it("rejects a number it can't read", () => {
    const result = parseLeadForm(form({ phone: "12345" }));
    expect(!result.ok && result.errors.phone).toBe(
      "This doesn't look like a phone number. Check the digits, or pick the country for a local number.",
    );
  });

  it("rejects a website that isn't a web address", () => {
    for (const website of ["javascript:alert(1)", "not a site", "ftp://files.example"]) {
      const result = parseLeadForm(form({ website }));
      expect(!result.ok && result.errors.website).toBe("Enter a web address like example.com.");
    }
  });

  it("rejects text that is too long", () => {
    const result = parseLeadForm(form({ name: "x".repeat(201), notes: "y".repeat(10_001) }));
    expect(!result.ok && result.errors).toMatchObject({
      name: "Keep this under 200 characters.",
      notes: "Keep this under 10000 characters.",
    });
  });

  it("treats missing fields as empty", () => {
    const result = parseLeadForm({ name: "Amelia", phone: "+44 20 7946 0118" });
    expect(result.ok && result.values).toMatchObject({ country: "GB", tags: [], listId: null });
  });
});

describe("parseTags", () => {
  it("splits on commas, trims, lower-cases and drops duplicates and blanks", () => {
    expect(parseTags(" SaaS, warm ,, saas,  Multi  Site ")).toEqual(["saas", "warm", "multi site"]);
  });

  it("is empty for blank input", () => {
    expect(parseTags("")).toEqual([]);
  });
});

describe("parseLeadForm tags", () => {
  it("limits the number and length of tags", () => {
    const many = Array.from({ length: 21 }, (_, i) => `t${i}`).join(",");
    for (const tags of [many, "x".repeat(41)]) {
      const result = parseLeadForm(form({ tags }));
      expect(!result.ok && result.errors.tags).toBe("Use up to 20 tags of 40 characters or less.");
    }
  });
});

describe("websiteHref", () => {
  it("adds https:// to a bare domain and keeps http(s) addresses", () => {
    expect(websiteHref("brightpath.example")).toBe("https://brightpath.example/");
    expect(websiteHref("http://brightpath.example/about")).toBe("http://brightpath.example/about");
  });

  it("returns null for anything else", () => {
    expect(websiteHref("javascript:alert(1)")).toBeNull();
    expect(websiteHref("localhost")).toBeNull();
    expect(websiteHref("")).toBeNull();
  });
});

describe("parseListName", () => {
  it("trims the name", () => {
    expect(parseListName("  Dental clinics ")).toEqual({ ok: true, name: "Dental clinics" });
  });

  it("rejects a blank or very long name", () => {
    expect(parseListName("  ")).toEqual({ ok: false, error: "Enter a name for the list." });
    expect(parseListName("x".repeat(101))).toEqual({ ok: false, error: "Keep this under 100 characters." });
    expect(parseListName(null)).toEqual({ ok: false, error: "Enter a name for the list." });
  });
});
