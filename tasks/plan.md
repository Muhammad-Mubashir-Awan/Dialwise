# Plan: Dialwise (personal cold-calling CRM, hosted)

> Update (2026-10-29): this plan covers module `core-crm`. Phase 2 adds `pipeline`, `dialer` and `email-calendar`, each with its own spec and plan. See `CAPABILITY-MAP.md`. The core spec is now `SPEC-core-crm.md`, and `calls` gets dialer-ready fields (`channel`, `duration_sec`, `external_id`).

## Context
You make cold calls to sell a service/product and need a personal customer-management tool for that work: leads, a call queue, quick outcome logging, follow-ups, call lists, CSV import/export and stats. SPEC.md is written but still in a temporary session folder. You asked for the project to live in **`D:\Work Files\AAM\CRM TOOL`** (renamed from `CMS TOOL` on 2026-10-29), and for Context7, agent-skills and graphify to be used throughout.

Decisions so far: Next.js on Vercel, Neon Postgres, Drizzle ORM, Auth.js with Google locked to one email, leads in multiple countries, tags on leads, and per-lead time zone with call-hour rules.

Checked with Context7 (current docs):
- **Next.js 16.2**: `proxy.ts` replaces `middleware.ts`.
- **Auth.js v5**: `NextAuth({ providers:[Google], callbacks:{ signIn } })` exporting `handlers, auth, signIn, signOut`. Google's profile has `email_verified`.
- **Drizzle + Neon**: `drizzle-orm/neon-http` with `neon(DATABASE_URL)`. neon-http has **no interactive transactions**, so multi-statement writes use `db.batch([...])`, which is atomic.

Installed locally: Node 24.22, npm 11.19, git 2.55.

## Step 0: Move and update the spec
1. Move the session to `D:\Work Files\AAM\CRM TOOL` (`change_directory`). SPEC.md comes with it.
2. Run `git init`, add a `.gitignore` (`.env*`, `node_modules`, `.next`, `graphify-out/cache`), and make the first commit with SPEC.md.
3. Update SPEC.md with the answers:
   - Neon and Drizzle are confirmed.
   - Multiple countries: phone stored as E.164 via `libphonenumber-js`, with `country` (ISO-2) per lead.
   - `tags text[]` (GIN index).
   - `timezone` (IANA) per lead, defaulted from the phone's country when it maps to a single zone.
   - Global call window (default 09:00–18:00 local, Mon–Fri).
   - Retry gap (default 24h) after `no_answer`/`voicemail`, so the queue doesn't loop on the same lead.
   - Remove the resolved open questions.
4. Save this plan as `tasks/plan.md` and the task list as `tasks/todo.md` (agent-skills convention).

## Step 1: Design the UI first (gate: your approval before any app code)
- **Tools:** the `ui-ux-pro-max` skill for the design system (palette, type, spacing, density, states) and the `frontend-ui-engineering` skill for accessibility and responsive rules. `dataviz` for the stats screen.
- **Direction:** clean and dense, Linear-like. Neutral palette with one accent, compact tables, keyboard-first (outcome keys 1–9, `J`/`K` navigation, `/` search), light and dark themes, works at phone width.
- **Deliverable:** a clickable HTML prototype published as a private Artifact, with mock data. Screens:
  - Login
  - Queue (the core screen: lead card, outcome buttons with key hints, note, follow-up picker, local time and call-window badge)
  - Leads table with filters and tags
  - Lead detail with call history
  - Lists
  - Follow-ups (due today and overdue)
  - Import (upload, column mapping, summary)
  - Stats
  - Settings (call window, retry gap)
- **Saved in repo:**
  - Source in `design/prototype.html`.
  - Design tokens in `design/tokens.md`, mapped to shadcn CSS variables, so slice 1 applies them directly.
- You review and comment; I iterate until you approve, then the build starts.

## You need to do these (I can't enter secrets)
- Create a Neon project, or add it through the Vercel Neon integration. Paste `DATABASE_URL` into `.env.local`.
- In Google Cloud, create an OAuth client (Web). Redirect URIs: `http://localhost:3000/api/auth/callback/google` and later `https://<your-app>.vercel.app/api/auth/callback/google`.
- Fill `.env.local` from the `.env.example` I'll write: `AUTH_SECRET` (`npx auth secret`), `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ALLOWED_EMAIL`, `DATABASE_URL`.

## Data model (`src/lib/db/schema.ts`)
- `lists`: id uuid, name, created_at
- `leads`: id, list_id → lists (nullable), name, company, phone_e164 (unique), phone_raw, country, timezone, email, website, notes, source, tags text[], status enum, last_called_at, next_follow_up_at, created_at, updated_at
  - Indexes: status, list_id, next_follow_up_at, last_called_at, GIN(tags)
- `calls`: id, lead_id → leads (cascade), outcome enum, note, follow_up_at, called_at
- `settings`: one row with call_window_start, call_window_end, call_days, retry_gap_hours, default_country
- Status enum: new, contacted, callback, interested, meeting_booked, not_interested, do_not_call, bad_number
- Outcome enum: no_answer, voicemail, gatekeeper, callback, interested, meeting_booked, not_interested, wrong_number, do_not_call
- Auth uses JWT sessions, so there are no auth tables.

## Build order (vertical slices; each ends green: lint, typecheck, tests)
1. **Scaffold**: `create-next-app` (TS, App Router, `src/`, Tailwind, ESLint), Prettier, shadcn/ui init with the approved design tokens, app shell (sidebar, theme toggle, command palette), Vitest, Playwright. Check: `npm run build` and `npm test` pass.
2. **DB layer**:
   - `drizzle.config.ts` and `src/lib/db/{schema,client}.ts` (neon-http), first migration.
   - `tests/helpers/db.ts` uses **PGlite** (`drizzle-orm/pglite`): in-memory Postgres for integration tests, no Docker needed on Windows.
3. **Auth**:
   - `src/auth.ts`: Google provider; the `signIn` callback requires `email_verified && email === ALLOWED_EMAIL`.
   - `requireUser()` data-access helper, called first in every server action, page and route handler.
   - `proxy.ts` only does an early redirect to `/login`; the real check is `requireUser()`.
   - Login page.
4. **Leads and lists**:
   - Pure `src/lib/phone.ts` (normalize, country, time zone guess).
   - CRUD server actions with Zod.
   - Leads table with filters (list, status, tag, search).
   - Lead detail page with call history.
5. **Queue and call logging** (the core loop):
   - `src/lib/outcomes.ts` holds the outcome→status transition table (attempts never downgrade interested/callback; DNC is terminal).
   - `src/lib/queue.ts` is one SQL query:
     - Excludes terminal statuses.
     - Excludes leads within the retry gap.
     - Excludes leads outside their local call window, using `now() AT TIME ZONE timezone`; leads with an unknown time zone are allowed.
     - Order: due follow-ups, then never called, then oldest `last_called_at`.
     - Can be scoped to one list.
   - `logCall` uses `db.batch` to insert the call and update the lead.
   - `/queue` page with one-click outcome buttons and keyboard shortcuts (1–9), a note field, and a follow-up picker for callback/interested.
6. **Follow-ups**: `/follow-ups` shows due today and overdue (highlighted). A new call clears or replaces `next_follow_up_at`.
7. **CSV import/export**:
   - `src/lib/csv.ts` (Papa Parse) handles column mapping, validation, normalized-phone dedupe and DNC skip, and returns a summary.
   - Inserts are chunked (500 rows) with `onConflictDoNothing`.
   - Import UI has a mapping step.
   - `/api/export` route streams leads and calls as CSV.
8. **Stats**:
   - `src/lib/stats.ts`: SQL aggregation of calls/day, connect rate and conversion by list and by period.
   - `/stats` page uses shadcn charts (Recharts). Built using the `dataviz` skill.
9. **Deploy**:
   - Vercel project, env vars, `drizzle-kit migrate` against prod, production OAuth redirect URI.
   - Seed 10k fake leads on a Neon branch to check the queue target (< 300 ms).
   - Lighthouse check on `/queue`.

## Skills and tools at each stage
- **Context7**: before writing code against each library (Next 16, Auth.js v5, Drizzle/Neon, shadcn, Papa Parse, libphonenumber-js, Playwright).
- **agent-skills**:
  - `planning-and-task-breakdown` writes tasks/todo.md.
  - `incremental-implementation` and `test-driven-development` for each slice (failing test first for queue, outcomes, csv, phone and stats).
  - `frontend-ui-engineering` and `ui-ux-pro-max`: design phase (Step 1), then each screen is built to match the approved prototype.
  - `security-and-hardening` for auth, input validation and CSV.
  - `code-review-and-quality` (`/review`) after slices 3, 5 and 7.
  - `/ship` before deploy.
- **graphify**:
  - After slice 2, run `/graphify .` to build the knowledge graph of the codebase.
  - After each later slice, run `/graphify . --update`.
  - `graphify-out/GRAPH_REPORT.md` is committed, and graph queries are used to answer architecture questions in later sessions.
- **dataviz**: stats charts.

## Critical files
`SPEC.md`, `tasks/plan.md`, `tasks/todo.md`, `src/auth.ts`, `proxy.ts`, `src/lib/db/schema.ts`, `src/lib/db/client.ts`, `src/lib/{phone,outcomes,queue,csv,stats}.ts`, `src/lib/actions/{leads,lists,calls,import}.ts`, `src/app/{queue,leads,lists,follow-ups,stats,import,login}/page.tsx`, `.env.example`.

## Verification
- Every slice: `npm run lint && npx tsc --noEmit && npm test` passes.
- Unit tests (Vitest):
  - Queue ordering and call-window filtering across time zones.
  - Outcome→status transitions.
  - CSV dedupe and DNC handling.
  - Phone normalization for several countries.
  - Stats math.
- Integration tests (Vitest + PGlite): `logCall` atomicity, import of a 1,000-row CSV with a correct summary, DNC never queued, follow-up cleared on the next call.
- E2E (Playwright, auth mocked by a test-only session cookie): import CSV, work queue, log outcomes, follow-up appears in Due Today, stats update.
- Auth: a request without a session to a page, an action or `/api/export` gets a redirect or 401. A non-allowed Google email is rejected (unit test on the `signIn` callback).
- Deployed: sign in with your Google account on Vercel, run the core loop on real data, check queue latency with 10k seeded leads on a Neon branch.
