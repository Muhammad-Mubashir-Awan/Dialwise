import { describe, expect, it } from "vitest";
import { chunkRows, csvLine, decodeCsv, guessMapping, parseCsv, planImport, rowsToRaw } from "@/lib/csv";

describe("parseCsv", () => {
  it("reads the header and rows, handling quotes, commas and line breaks in cells", () => {
    const text = 'Name,Company,Notes\n"Hart, Amelia",Brightpath,"Line one\nline two"\nOliver,Brandt & Wolf,\n';
    expect(parseCsv(text)).toEqual({
      ok: true,
      header: ["Name", "Company", "Notes"],
      rows: [
        ["Hart, Amelia", "Brightpath", "Line one\nline two"],
        ["Oliver", "Brandt & Wolf", ""],
      ],
    });
  });

  it("reads semicolon files from European Excel and drops a byte-order mark", () => {
    expect(parseCsv("﻿Name;Phone\nAmelia;020 7946 0118\n")).toMatchObject({
      ok: true,
      header: ["Name", "Phone"],
      rows: [["Amelia", "020 7946 0118"]],
    });
  });

  it("skips blank lines", () => {
    expect(parseCsv("Name\n\nAmelia\n   \n").ok && parseCsv("Name\n\nAmelia\n   \n")).toMatchObject({
      rows: [["Amelia"]],
    });
  });

  it("needs a header and at least one row, and at most 10,000 rows", () => {
    expect(parseCsv("")).toEqual({ ok: false, error: "That file is empty." });
    expect(parseCsv("Name,Phone\n")).toEqual({
      ok: false,
      error: "That file has no data rows. Check it has a header row and at least one lead.",
    });
    const big = "Phone\n" + "1\n".repeat(10_001);
    expect(parseCsv(big)).toEqual({ ok: false, error: "That file has 10,001 rows. Import up to 10,000 at a time." });
  });
});

describe("guessMapping", () => {
  it("guesses each column from its header", () => {
    expect(
      guessMapping([
        "Business Name",
        "Contact",
        "Job title",
        "Mobile",
        "E-mail",
        "Website",
        "Country",
        "Tags",
        "Comments",
        "ID",
      ]),
    ).toEqual(["company", "name", "role", "phone", "email", "website", "country", "tags", "notes", "ignore"]);
  });

  it.each(["Industry", "industry", "Sector", "Business sector", "Vertical"])("reads %s as the industry", (header) => {
    expect(guessMapping([header])).toEqual(["industry"]);
  });

  it("maps first and last name columns to the name", () => {
    expect(guessMapping(["First name", "Last name", "Phone number"])).toEqual(["name", "name", "phone"]);
  });
});

describe("rowsToRaw", () => {
  const mapping = ["name", "name", "phone", "phone", "tags", "tags", "notes", "notes"] as const;

  it("joins name parts, uses the first phone that has a value, and combines tags and notes", () => {
    const [raw] = rowsToRaw(
      [["Amelia", "Hart", "", "07700 900123", "saas", "warm", "Met at SaaStock", "Wants pricing"]],
      [...mapping],
    );
    expect(raw).toEqual({
      name: "Amelia Hart",
      company: "",
      role: "",
      industry: "",
      phone: "07700 900123",
      email: "",
      website: "",
      country: "",
      tags: "saas, warm",
      notes: "Met at SaaStock\nWants pricing",
    });
  });

  it("trims cells and drops the apostrophe Excel adds to keep numbers as text", () => {
    const [raw] = rowsToRaw([["  Amelia ", "'+44 20 7946 0118"]], ["name", "phone"]);
    expect(raw).toMatchObject({ name: "Amelia", phone: "+44 20 7946 0118" });
  });
});

describe("planImport", () => {
  const raw = (phone: string, more: Record<string, string> = {}) => ({
    name: "Lead",
    company: "",
    role: "",
    industry: "",
    phone,
    email: "",
    website: "",
    country: "",
    tags: "",
    notes: "",
    ...more,
  });

  it("sorts rows into valid, invalid phone and repeated in the file", () => {
    const plan = planImport(
      [raw("020 7946 0118"), raw("n/a"), raw("+44 20 7946 0118"), raw("(212) 555-0142", { country: "US" })],
      { defaultCountry: "GB", listId: null },
    );
    expect(plan.valid.map((v) => [v.row, v.values.phoneE164])).toEqual([
      [2, "+442079460118"],
      [5, "+12125550142"],
    ]);
    expect(plan.invalid.map((v) => v.row)).toEqual([3]);
    expect(plan.repeated).toBe(1);
  });
});

describe("chunkRows", () => {
  it("splits into batches of at most the row count", () => {
    expect(chunkRows([1, 2, 3, 4, 5], { maxRows: 2, maxBytes: 1_000 })).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("starts a new batch before one gets too big", () => {
    const rows = ["a".repeat(40), "b".repeat(40), "c".repeat(40)];
    expect(chunkRows(rows, { maxRows: 500, maxBytes: 100 }).map((c) => c.length)).toEqual([2, 1]);
  });
});

describe("csvLine", () => {
  it("quotes cells with commas, quotes or line breaks", () => {
    expect(csvLine(["Amelia", "Hart, Amelia", 'Said "call me"', "Line\nbreak", null, 3])).toBe(
      'Amelia,"Hart, Amelia","Said ""call me""","Line\nbreak",,3\r\n',
    );
  });

  it("stops spreadsheets running a cell as a formula", () => {
    expect(csvLine(['=HYPERLINK("http://x")', "+442079460118", "-5", "@SUM(A1)", "safe"])).toBe(
      '"\'=HYPERLINK(""http://x"")",\'+442079460118,\'-5,\'@SUM(A1),safe\r\n',
    );
  });
});

describe("decodeCsv", () => {
  it("reads UTF-8, the format of 'CSV UTF-8' in Excel and of most tools", () => {
    expect(decodeCsv(new TextEncoder().encode("Name\nJosé Müller\n"))).toBe("Name\nJosé Müller\n");
  });

  it("falls back to Windows-1252, which Excel on Windows uses for plain 'CSV'", () => {
    // "Müller" and "José" as Windows-1252 bytes (ü = 0xFC, é = 0xE9): not valid UTF-8.
    const bytes = new Uint8Array([
      0x4e, 0x61, 0x6d, 0x65, 0x0a, 0x4d, 0xfc, 0x6c, 0x6c, 0x65, 0x72, 0x0a, 0x4a, 0x6f, 0x73, 0xe9,
    ]);
    expect(decodeCsv(bytes)).toBe("Name\nMüller\nJosé");
  });
});
