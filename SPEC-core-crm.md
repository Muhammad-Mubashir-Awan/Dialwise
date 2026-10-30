# Spec: core-crm (Cold-Call CRM, personal)

Module `core-crm` in [CAPABILITY-MAP.md](CAPABILITY-MAP.md). The phase-2 modules (`pipeline`, `dialer`, `email-calendar`) build on this one and get their own specs.

## Objective
A hosted, single-user web app for managing cold-calling prospects when selling a service/product. It replaces spreadsheets and sticky notes with a fast call workflow.

**User:** one person (the owner), on desktop mostly, usable on phone.
**Success looks like:** from "next lead" to "outcome logged" in under 10 seconds and 3 clicks, and no follow-up is ever forgotten.

### Features (v1)
1. **Leads**: create/edit/delete leads (name, company, phone, country, time zone, email, website, notes, source, tags, status). Leads span multiple countries; phones are stored as E.164.
2. **Call queue**: "Next lead" view that serves the next lead to call.
   - Priority: due follow-ups, then never-called, then oldest last-call.
   - Skips leads outside their local call window (default 09:00–18:00, Mon–Fri, configurable).
   - Skips leads still inside the retry gap (default 24h after `no_answer`/`voicemail`).
3. **Quick call logging**: log an outcome with one click plus an optional note. Outcomes: `no_answer`, `voicemail`, `gatekeeper`, `callback`, `interested`, `meeting_booked`, `not_interested`, `wrong_number`, `do_not_call`.
4. **Follow-ups**: `callback` and `interested` outcomes set a follow-up date/time; `meeting_booked` sets the meeting time the same way. Times are picked in the lead's time zone and shown in yours too. A "Due today" list, with overdue items highlighted.
5. **Call lists**: group leads into named lists/campaigns; the queue can be scoped to one list.
6. **CSV import/export**: import leads into a list (column mapping, duplicate detection by phone); export leads and call history.
7. **Stats dashboard**: calls/day, connect rate, conversion (interested + meeting_booked) per list and per period.
8. **Auth**: Google sign-in via Auth.js, locked to a single allowed email.
9. **Settings**: call window (hours and days), retry gap, default country for phone parsing.

### Acceptance criteria
- Logging an outcome updates lead status and `lastCalledAt`, and advances the queue.
- A `do_not_call` lead never appears in the queue and is skipped on import-duplicates.
- Leads that are closed out never appear in the queue: `meeting_booked`, `not_interested`, `do_not_call`, `bad_number`. A booked meeting still shows in Follow-ups at its meeting time.
- Follow-up shown in "Due today" at/after its due time, and removed once a new call is logged.
- Import of a 1,000-row CSV completes with a summary (added / duplicates / invalid).
- A lead whose local time is outside the call window is not served by the queue; a lead with no known time zone is.
- A lead called with `no_answer`/`voicemail` does not reappear in the queue until the retry gap has passed.
- A lead with a follow-up set in the future is not served by the queue until that time; once due, it goes to the front.
- Phone numbers from different countries are normalized to E.164 and deduplicated on that value.
- Any request without the allowed Google account is rejected (401/redirect), including API routes and server actions.

### Out of scope for this module
- Phase 2 modules, each with its own spec (see [CAPABILITY-MAP.md](CAPABILITY-MAP.md)):
  - browser dialer, call recording and voicemail drop (`dialer`)
  - deals pipeline (`pipeline`)
  - Gmail templates and Google Calendar invites (`email-calendar`)
- Not planned: SMS, automation workflows, funnels/websites, multi-user/teams, AI features.
- This module keeps calls dialer-ready: `calls.channel`, `calls.duration_sec` and `calls.external_id` exist from the first migration, so `dialer` needs no change to existing data.

## Tech Stack
- Next.js 16 (App Router) + TypeScript (strict), React Server Components + Server Actions; `src/proxy.ts` for early auth redirects
- Postgres on **Neon**; **Drizzle ORM** via `drizzle-orm/node-postgres` (a small `pg` pool on Neon's pooled connection string, Neon's recommended setup for Vercel) + drizzle-kit migrations. Writes that must be atomic, such as `logCall`, use `db.transaction`, which works the same on PGlite in tests.
- Auth.js (NextAuth v5) with Google provider, JWT sessions (no auth tables)
- Tailwind CSS + shadcn/ui; design tokens from `design/tokens.md`
- Zod for validation; Papa Parse for CSV; libphonenumber-js for phone parsing
- Tests: Vitest, PGlite (in-memory Postgres for integration tests), Playwright
- Hosting: Vercel
- Versions are pinned at scaffold time after checking current docs via Context7.

## Commands
```
Install:   npm install
Dev:       npm run dev
Build:     npm run build
Lint:      npm run lint
Typecheck: npm run typecheck   (next typegen + tsc)
All checks:npm run check       (lint + typecheck + format check + unit/integration tests)
Tests:     npm test            (Vitest; integration tests use PGlite, no database needed)
E2E:       npm run test:e2e    (production build + Playwright, desktop and phone)
DB gen:    npm run db:generate (new migration in drizzle/ from schema changes)
DB migrate:npm run db:migrate  (apply migrations to DATABASE_URL from .env.local)
```

## Project Structure
```
src/app/              → routes (queue, leads, lists, follow-ups, stats, import, login)
src/app/api/auth/     → Auth.js handlers
src/components/       → UI components (shadcn in components/ui)
src/lib/db/           → Drizzle schema and client
drizzle/              → generated SQL migrations (+ hand-written data migrations)
src/lib/actions/      → server actions (leads, calls, lists, import)
src/lib/data/         → database reads and writes; each takes the db, so tests pass PGlite
src/lib/queue.ts      → queue helpers for the browser: order after skips, reasons, follow-up times (pure)
src/lib/data/queue.ts → the queue query (eligibility, order, counts)
src/lib/csv.ts        → CSV parse/validate/dedupe (pure, unit tested)
src/lib/stats.ts      → stats queries/aggregation
src/auth.ts           → Auth.js config + single-email allowlist
tests/                → unit + integration tests (Vitest)
e2e/                  → Playwright tests
docs/                 → notes, ADRs
CAPABILITY-MAP.md     → modules and build order
SPEC-core-crm.md      → this file (one SPEC-<module>.md per module)
design/               → approved prototype and design tokens
tasks/                → plan.md and todo.md
```

## Data Model
- `lists`: id uuid, name, created_at
- `leads`: id, list_id → lists (nullable, set null when the list is deleted), name, role (job title, shown in the prototype), company, phone_e164 (unique, checked as `+` and 8–15 digits), phone_raw, country (ISO-2), timezone (IANA, defaulted from the phone's country when it maps to one zone), email, website, notes, source, tags text[], status, last_called_at, next_follow_up_at, created_at, updated_at
  - Indexes: status, list_id, next_follow_up_at, last_called_at, GIN(tags)
- `calls`: id, lead_id → leads (cascade), outcome, note, follow_up_at, called_at, channel (`manual` | `dialer`, default `manual`), duration_sec (nullable), external_id (nullable; the provider's call id, set by `dialer`)
- `settings` (single row, id = 1, seeded by migration): call_window_start (09:00), call_window_end (18:00, must be after start), call_days (0 = Sun … 6 = Sat; default Mon–Fri), retry_gap_hours (1–168, default 24), default_country (default GB)
- Status: new, contacted, callback, interested, meeting_booked, not_interested, do_not_call, bad_number
- Outcome: no_answer, voicemail, gatekeeper, callback, interested, meeting_booked, not_interested, wrong_number, do_not_call
- Outcome → status transitions live in `src/lib/outcomes.ts`. Call attempts (`no_answer`, `voicemail`, `gatekeeper`) never downgrade a lead past `contacted`, and `callback` doesn't downgrade `interested`. Closed-out statuses (`meeting_booked`, `not_interested`, `do_not_call`, `bad_number`) leave the queue; `do_not_call` is permanent.

## Code Style
TypeScript strict, no `any`. Server actions validate input with Zod and check the session first. Pure logic lives in `src/lib` so it can be tested without the framework.

```ts
// src/lib/actions/calls.ts
"use server";
import { z } from "zod";
import { requireUser } from "@/lib/session";

const LogCall = z.object({
  leadId: z.string().uuid(),
  outcome: z.enum(OUTCOMES),
  note: z.string().max(2000).optional(),
  followUpAt: z.coerce.date().optional(),
});

export async function logCall(input: unknown) {
  await requireUser();
  const data = LogCall.parse(input);
  // recordCall writes the call and the lead update in one transaction.
  return recordCall(getDb(), data);
}
```
Conventions: files kebab-case, components PascalCase, functions camelCase, DB columns snake_case, named exports, Prettier + ESLint (next/core-web-vitals).

## Testing Strategy
- **Unit (Vitest):** queue ordering, CSV parsing/dedupe, phone normalization, stats aggregation, outcome → status transitions. Target ≥ 90% on `src/lib` pure modules.
- **Integration (Vitest + PGlite):** data functions and server actions against an in-memory Postgres with the real migrations (log call, import, do-not-call rules); actions are tested signed out too.
- **E2E (Playwright):** the core loop: sign in (mocked auth), import CSV, work queue, log outcomes, see follow-up due, view stats. Runs a production build against an in-memory Postgres (PGlite over TCP), on desktop and phone sizes.
- Bug fixes follow Prove-It: failing test first.

## Boundaries
- **Always:** validate input with Zod; check the session in every action/route; run lint, typecheck and tests before committing; keep migrations in version control; normalize phone numbers on write.
- **Ask first:** schema changes after first migration, adding dependencies, changing auth config, anything touching the production database, changing hosting.
- **Never:** commit secrets or `.env`; store the real lead data in the repo or test fixtures; skip auth on any route; delete/disable failing tests without approval; add features outside v1 scope.

**Legal note (not code):** cold calling is regulated, and the rules differ per country (do-not-call registries, calling-hour limits, e.g. TCPA in the US, PECR/TPS in the UK). The app records `do_not_call` and enforces a call window, but compliance with each country's rules is up to you.

## Success Criteria
- All v1 acceptance criteria above pass in automated tests.
- Lint, typecheck, unit/integration and e2e pass in CI.
- Deployed on Vercel; unauthorized Google accounts cannot read any data.
- Queue "next lead" responds in < 300 ms with 10k leads.
- Lighthouse performance ≥ 90 on the queue page (mobile).

## Decisions (resolved questions)
- Region: multiple countries → E.164 + country per lead.
- Database: Neon. ORM: Drizzle.
- Tags on leads: yes (v1). Custom fields: no.
- Per-lead time zone and call window: yes (v1).
- UI: designed first as a clickable HTML prototype (clean and dense, Linear-like, keyboard-first, light and dark), approved before app code.
- Database driver: node-postgres instead of Neon's HTTP driver (slice 4). It gives real transactions and lets e2e tests run on a local in-memory Postgres. Vercel's `attachDatabasePool` helper was left out for now: it pulls in an old Zod with a known advisory; revisit at deploy (slice 9).
- A lead's status changes only through logged calls; the lead form edits contact details, list, tags, time zone and notes (slice 4, as in the prototype).
- Queue call hours are checked in the app for each distinct time zone in use (the same code as the leads table), and the query then keeps leads in open zones, so it doesn't depend on the database's time zone data (slice 5).
- CSV import: columns are matched and rows checked in the browser for the review step, then checked again on the server, which saves batches of up to 500 rows. Time zones are guessed from the country, never taken from the file. Exported cells that could run as spreadsheet formulas get a leading apostrophe (slice 7).
- Follow-ups and the sidebar's "due today" count are grouped in the browser, on your own clock: the server doesn't know your time zone, so it sends the next 8 days of follow-ups (slice 6).
- Undo removes the lead's latest call and restores its status and times, within 15 minutes of logging (slice 5).
- Time zones per country come from the server's built-in ICU data. A lead's zone is guessed when its country keeps one time (or has one main zone, e.g. Spain → Madrid); otherwise it stays unknown until picked in the form.

## Open Questions
None for v1.
