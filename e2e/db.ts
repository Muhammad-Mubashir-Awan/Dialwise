import pg from "pg";

/** The in-memory database started by e2e/db-server.mts. Never the real one: the app gets this URL in tests. */
export const E2E_DB_PORT = 54329;
export const E2E_DATABASE_URL = `postgresql://postgres@127.0.0.1:${E2E_DB_PORT}/postgres`;

/** Tests share one database and run in parallel, so each one names its data uniquely and only checks that. */
export const unique = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const digits = (count: number) => Array.from({ length: count }, () => Math.floor(Math.random() * 10)).join("");

/** A random valid London number, as stored and as typed. */
export function randomUkPhone() {
  const d = digits(7);
  return { e164: `+44207${d}`, local: `020 7${d.slice(0, 3)} ${d.slice(3)}` };
}

/** A random valid New York number, as stored and as typed. */
export function randomUsPhone() {
  const d = digits(6);
  return { e164: `+12125${d}`, local: `(212) 5${d.slice(0, 2)}-${d.slice(2)}` };
}

async function query<T extends pg.QueryResultRow>(text: string, values: unknown[] = []): Promise<T[]> {
  const client = new pg.Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  try {
    return (await client.query<T>(text, values)).rows;
  } finally {
    await client.end();
  }
}

export async function seedList(name: string): Promise<string> {
  const [row] = await query<{ id: string }>("insert into lists (name) values ($1) returning id", [name]);
  return row.id;
}

type SeedLead = {
  name: string;
  phoneE164?: string;
  company?: string;
  listId?: string;
  tags?: string[];
  status?: string;
  country?: string;
  timezone?: string;
};

export async function seedLead(lead: SeedLead): Promise<{ id: string; phoneE164: string }> {
  const phoneE164 = lead.phoneE164 ?? randomUkPhone().e164;
  const [row] = await query<{ id: string }>(
    `insert into leads (name, company, phone_e164, phone_raw, country, timezone, list_id, tags, status)
     values ($1, $2, $3, $3, $4, $5, $6, $7, $8) returning id`,
    [
      lead.name,
      lead.company ?? null,
      phoneE164,
      lead.country ?? "GB",
      lead.timezone ?? "Europe/London",
      lead.listId ?? null,
      lead.tags ?? [],
      lead.status ?? "new",
    ],
  );
  return { id: row.id, phoneE164 };
}

export async function seedCall(leadId: string, outcome: string, calledAt: Date, note = "") {
  await query("insert into calls (lead_id, outcome, note, called_at) values ($1, $2, $3, $4)", [
    leadId,
    outcome,
    note,
    calledAt,
  ]);
}
