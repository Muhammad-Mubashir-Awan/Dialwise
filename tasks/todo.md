# Tasks: Cold-Call CRM

Source of truth: `SPEC-core-crm.md` (module `core-crm` in `CAPABILITY-MAP.md`). Plan: `tasks/plan.md`. Each task ends green: `npm run lint && npx tsc --noEmit && npm test`.

## Phase 0: Setup
- [x] Task: Spec written and decisions recorded
  - Acceptance: the core spec has no open questions
  - Files: SPEC-core-crm.md
- [x] Task: Git repo and ignore rules
  - Acceptance: `git init`, `.gitignore` covers `.env*`, `node_modules`, `.next`, `graphify-out/cache`; `.gitattributes` keeps LF line endings
  - Files: .gitignore, .gitattributes
- [x] Task: Capability map for core + phase-2 modules
  - Files: CAPABILITY-MAP.md

## Phase 1: UI design (gate: owner approval)
- [x] Task: Design system
  - Acceptance: palette (neutral + one accent, light/dark), type scale, spacing, density, status/outcome colors, focus states; mapped to shadcn CSS variables
  - Verify: contrast ≥ 4.5:1 for text in both themes
  - Files: design/tokens.md
- [x] Task: Clickable prototype of all screens
  - Acceptance: login, queue, leads, lead detail, lists, follow-ups, import, stats, settings; keyboard hints visible; works at 375px wide
  - Verify: published Artifact reviewed and approved by owner
  - Files: design/prototype.html

## Phase 2: Foundation
- [x] Task: Scaffold (slice 1)
  - Acceptance: Next 16 + TS strict + Tailwind + shadcn with approved tokens; app shell (sidebar, theme toggle, command palette); Vitest + Playwright wired
  - Verify: `npm run build`, `npm test`, `npx playwright test` (smoke)
  - Files: package.json, src/app/layout.tsx, src/app/globals.css, vitest.config.ts, playwright.config.ts
- [x] Task: DB layer (slice 2)
  - Acceptance: schema per SPEC (including dialer-ready `calls.channel`, `calls.duration_sec`, `calls.external_id`), first migration generated, PGlite test helper
  - Verify: integration test inserts and reads a lead
  - Files: drizzle.config.ts, src/lib/db/schema.ts, src/lib/db/client.ts, tests/helpers/db.ts
- [x] Task: Run `/graphify .` to build the codebase knowledge graph
- [x] Task: Auth (slice 3)
  - Acceptance: Google sign-in; only `ALLOWED_EMAIL` with verified email; `requireUser()` guards every action/page/route; `proxy.ts` early redirect; login page
  - Verify: unit test on signIn callback; e2e unauthenticated redirect
  - Files: src/auth.ts, src/app/api/auth/[...nextauth]/route.ts, src/proxy.ts, src/app/login/page.tsx, .env.example
- [x] Task: `/review` on slices 1–3
  - Result: no blockers. Fixed during review: the proxy only reads the session cookie (NextAuth's proxy wrapper re-sends it on every request, which could undo sign-out). Sessions last 30 days from sign-in. Mutation check: dropping the verified-email rule fails a test.

### Checkpoint: foundation
- [ ] Owner has set `.env.local` (Neon, Google OAuth, AUTH_SECRET, ALLOWED_EMAIL) and can sign in locally

## Phase 3: Core features
- [x] Task: Phone utilities (TDD)
  - Acceptance: normalize to E.164 with default country, detect country, guess time zone when the country has one zone
  - Verify: unit tests for US, UK, PK, IN, AU, DE numbers and invalid input
  - Files: src/lib/phone.ts, src/lib/timezones.ts, tests/unit/phone.test.ts, tests/unit/timezones.test.ts
  - Result: "00" prefixes work whatever the default country; zones come from the server's ICU data with today's names (Asia/Kolkata, Europe/Kyiv); mutation-checked.
- [x] Task: Leads and lists CRUD (slice 4)
  - Acceptance: create/edit/delete with Zod; leads table filters (list, status, tag, search); lead detail with call history
  - Verify: integration tests on actions; e2e create lead
  - Files: src/lib/lead-input.ts, src/lib/data/, src/lib/actions/leads.ts, src/lib/actions/lists.ts, src/app/(app)/leads/, src/app/(app)/lists/, src/components/leads/, src/components/lists/
  - Result: 162 unit/integration and 48 e2e tests (desktop and phone). Switched the database driver to node-postgres (real transactions; e2e runs on an in-memory PGlite over TCP). Status only changes through logged calls. The lists table's "Work list" and "Export" buttons come with slices 5 and 7.
- [ ] Task: Outcome transitions (TDD)
  - Acceptance: transition table; attempts never downgrade interested/callback; DNC terminal
  - Verify: unit tests for every outcome × status pair that matters
  - Files: src/lib/outcomes.ts, tests/outcomes.test.ts
- [ ] Task: Queue + call logging (slice 5)
  - Acceptance: queue query per SPEC (terminal statuses, retry gap, local call window, ordering, list scope); `logCall` writes the call and the lead update atomically (see "Decide first" below); `/queue` UI with keys 1–9, note, follow-up picker
  - Verify: PGlite tests across time zones; `logCall` atomicity; DNC never served; e2e work-the-queue
  - Decided in slice 4: the app now uses node-postgres, so `logCall` uses `db.transaction` (also works on PGlite in tests).
  - Watch: the e2e database (pglite-socket) shares one Postgres session across connections, so concurrent transactions can interleave there. If e2e tests start mixing transactions, run the test server with a pool of one connection.
  - Files: src/lib/queue.ts, src/lib/actions/calls.ts, src/app/queue/
- [ ] Task: `/review` on slices 4–5
- [ ] Task: Follow-ups (slice 6)
  - Acceptance: due today and overdue lists; new call clears/replaces follow-up
  - Verify: integration test; e2e follow-up appears in Due Today
  - Files: src/app/follow-ups/
- [ ] Task: CSV import/export (slice 7)
  - Acceptance: column mapping, validation, dedupe on E.164, DNC skip, 500-row chunks, summary; `/api/export` streams CSV
  - Verify: 1,000-row import test with correct summary; export auth test
  - Files: src/lib/csv.ts, src/lib/actions/import.ts, src/app/import/, src/app/api/export/route.ts
- [ ] Task: `/review` + security-and-hardening pass on slices 6–7
- [ ] Task: Stats (slice 8)
  - Acceptance: calls/day, connect rate, conversion by list and period
  - Verify: unit tests on aggregation; visual check against prototype
  - Files: src/lib/stats.ts, src/app/stats/
- [ ] Task: Settings page
  - Acceptance: edit call window, call days, retry gap, default country
  - Files: src/app/settings/, src/lib/actions/settings.ts

## Phase 4: Ship
- [ ] Task: `/ship` checklist
- [ ] Task: Deploy (slice 9)
  - Acceptance: Vercel project, env vars, prod migration, prod OAuth redirect
  - Check: whether to add Vercel's `attachDatabasePool` (closes idle connections before a function sleeps). Left out in slice 4 because its dependency pulled in an old Zod with a known advisory.
  - Verify: owner signs in on prod; 10k seeded leads on a Neon branch → queue < 300 ms; Lighthouse ≥ 90 on `/queue`

Run `/graphify . --update` after every slice from slice 3 on.

## Phase 2 modules (after core-crm is deployed and in use)
Each module: write `SPEC-<id>.md` → add its screens to the prototype and get approval → plan and tasks → build with tests → `/review`.

- [ ] `pipeline`: deals, stages, board view (keyboard and drag), pipeline value in stats
- [ ] `dialer`: Twilio browser calling, auto-logged calls, recordings, recording notice, voicemail drop, caller ID per country
  - Before building: check current Twilio prices and the recording-consent rules for each country you call; owner creates the Twilio account
- [ ] `email-calendar`: Gmail templates logged on the lead, Google Calendar invite on "Meeting booked"
  - Before building: settle how Google tokens are stored and refreshed, and Gmail vs Resend for sending
