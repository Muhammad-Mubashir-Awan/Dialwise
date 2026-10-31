import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { sql } from "drizzle-orm";
import { exportCsv } from "@/lib/data/export";
import { calls, leads, lists } from "@/lib/db/schema";
import { createTestDb, resetTestDb, type TestDb } from "../helpers/db";

// The route uses the app's database and session; point them at PGlite and a switchable sign-in.
const mocks = vi.hoisted(() => ({ db: undefined as unknown as TestDb, signedIn: true }));
vi.mock("@/lib/db/client", () => ({ getDb: () => mocks.db }));
vi.mock("@/lib/session", () => ({
  getCurrentUser: async () => (mocks.signedIn ? { email: "owner@example.test", name: "Owner", image: null } : null),
}));
const { GET } = await import("@/app/api/export/route");
const { NextRequest } = await import("next/server");

let close: () => Promise<void>;
beforeAll(async () => {
  ({ db: mocks.db, close } = await createTestDb());
});
beforeEach(async () => {
  await resetTestDb(mocks.db);
  mocks.signedIn = true;
});
afterAll(async () => {
  await close();
});

// Decode the raw bytes: Response.text() would drop the byte-order mark we want to check.
const read = async (stream: ReadableStream<Uint8Array>) =>
  new TextDecoder("utf-8", { ignoreBOM: true }).decode(await new Response(stream).arrayBuffer());

async function seed() {
  const [dentists] = await mocks.db.insert(lists).values({ name: "Dentists" }).returning();
  const rows = await mocks.db
    .insert(leads)
    .values([
      {
        name: "Priya Nair",
        company: "Smile Avenue",
        phoneE164: "+12125550142",
        phoneRaw: "(212) 555-0142",
        country: "US",
        listId: dentists.id,
        tags: ["dental", "warm"],
        status: "interested",
        notes: '=HYPERLINK("http://evil.example")',
        createdAt: new Date("2026-10-01T09:00:00Z"),
      },
      {
        name: "Marcus Reid",
        phoneE164: "+13125550178",
        phoneRaw: "x",
        listId: dentists.id,
        createdAt: new Date("2026-10-02T09:00:00Z"),
      },
      { name: "Amelia Hart", phoneE164: "+442079460118", phoneRaw: "x", createdAt: new Date("2026-10-03T09:00:00Z") },
    ])
    .returning();
  await mocks.db.insert(calls).values([
    { leadId: rows[0].id, outcome: "callback", note: "Call Monday", calledAt: new Date("2026-10-05T10:00:00Z") },
    { leadId: rows[2].id, outcome: "no_answer", calledAt: new Date("2026-10-06T10:00:00Z") },
  ]);
  return dentists.id;
}

describe("exportCsv", () => {
  it("writes every lead in batches, oldest first, with a header and a byte-order mark for Excel", async () => {
    await seed();
    const text = await read(exportCsv(mocks.db, { type: "leads", listId: null, batchSize: 2 }));
    const lines = text.split("\r\n");
    expect(text.startsWith("﻿Name,Company,Role,Industry,Phone,")).toBe(true);
    expect(lines.slice(1, 4).map((l) => l.split(",")[0])).toEqual(["Priya Nair", "Marcus Reid", "Amelia Hart"]);
    expect(lines[1]).toContain(',\'+12125550142,(212) 555-0142,US,,,,Dentists,"dental, warm",Interested,');
    expect(lines[1]).toContain('"\'=HYPERLINK(""http://evil.example"")"');
    expect(lines[4]).toBe("");
  });

  it("exports one list's leads, or its call history", async () => {
    const listId = await seed();
    const leadsText = await read(exportCsv(mocks.db, { type: "leads", listId }));
    expect(leadsText).toContain("Priya Nair");
    expect(leadsText).not.toContain("Amelia Hart");

    const callsText = await read(exportCsv(mocks.db, { type: "calls", listId }));
    const lines = callsText.split("\r\n");
    expect(lines[0]).toBe("﻿Called at,Lead,Company,Phone,Outcome,Note,Follow-up,List,Channel,Duration (s)");
    expect(lines[1]).toBe(
      "2026-10-05T10:00:00.000Z,Priya Nair,Smile Avenue,'+12125550142,Callback,Call Monday,,Dentists,manual,",
    );
    expect(lines).toHaveLength(3);
  });
});

describe("GET /api/export", () => {
  const request = (query: string) => new NextRequest(`http://localhost/api/export${query}`);

  it("downloads a CSV when signed in", async () => {
    await seed();
    const response = await GET(request("?type=leads"));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("content-disposition")).toMatch(
      /^attachment; filename="leads-\d{4}-\d{2}-\d{2}\.csv"$/,
    );
    expect(await response.text()).toContain("Amelia Hart");
  });

  it("refuses when nobody is signed in", async () => {
    await seed();
    mocks.signedIn = false;
    const response = await GET(request("?type=leads"));
    expect(response.status).toBe(401);
    expect(await response.text()).not.toContain("Amelia");
  });

  it("rejects an unknown type or list", async () => {
    expect((await GET(request("?type=everything"))).status).toBe(400);
    expect((await GET(request("?type=leads&list=nope"))).status).toBe(400);
  });
});

describe("exportCsv with leads added together", () => {
  it("writes each lead once when many share a timestamp finer than a millisecond", async () => {
    // One import batch is one INSERT, so its leads share now() to the microsecond; JavaScript dates keep milliseconds.
    await mocks.db.execute(sql`insert into leads (name, phone_e164, phone_raw, created_at) values
      ('A', '+442079460001', 'x', '2026-10-01 09:00:00.123456+00'),
      ('B', '+442079460002', 'x', '2026-10-01 09:00:00.123456+00'),
      ('C', '+442079460003', 'x', '2026-10-01 09:00:00.123456+00'),
      ('D', '+442079460004', 'x', '2026-10-01 09:00:00.123999+00')`);

    // Read at most 20 chunks, so a stream that never ends fails the test instead of hanging it.
    const reader = exportCsv(mocks.db, { type: "leads", listId: null, batchSize: 2 }).getReader();
    const decoder = new TextDecoder();
    let text = "";
    for (let i = 0; i < 20; i++) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value);
    }
    const names = text
      .trim()
      .split("\r\n")
      .slice(1)
      .map((line) => line.split(",")[0]);
    expect(names.sort()).toEqual(["A", "B", "C", "D"]);
  });
});
