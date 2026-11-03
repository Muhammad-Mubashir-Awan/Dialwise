# Tasks: Dialwise

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
- [x] Owner has set `.env.local` (Neon, Google OAuth, AUTH_SECRET, ALLOWED_EMAIL) and can sign in locally

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
- [x] Task: Outcome transitions (TDD)
  - Acceptance: transition table; attempts never downgrade interested/callback; DNC terminal
  - Verify: unit tests for every outcome × status pair that matters
  - Files: src/lib/outcomes.ts, tests/unit/outcomes.test.ts
- [x] Task: Queue + call logging (slice 5)
  - Acceptance: queue query per SPEC (terminal statuses, retry gap, local call window, ordering, list scope); `logCall` writes the call and the lead update atomically (see "Decide first" below); `/queue` UI with keys 1–9, note, follow-up picker
  - Verify: PGlite tests across time zones; `logCall` atomicity; DNC never served; e2e work-the-queue
  - Decided in slice 4: the app now uses node-postgres, so `logCall` uses `db.transaction` (also works on PGlite in tests).
  - The e2e database (pglite-socket) shares one Postgres session across connections, so the e2e server runs with `DATABASE_POOL_MAX=1`.
  - Files: src/lib/queue.ts, src/lib/data/queue.ts, src/lib/data/calls.ts, src/lib/actions/calls.ts, src/app/(app)/queue/, src/components/queue/
  - Result: 227 unit/integration and 61 e2e tests. Call hours are checked in the app per distinct time zone, then the query filters by open zones. Removing the transaction makes the atomicity test fail. Undo works on the latest call within 15 minutes. Keys aren't blocked while a call saves (Next.js queues server actions), so a quick second outcome isn't lost. Added "Call now" on the lead page and "Work list · N" on the lists page.
- [x] Task: `/review` on slices 4–5
  - Result: no blockers. Fixed: a lead whose call was still saving could come back on screen when an earlier call's data arrived, risking a double log. React's current batching of overlapping transitions hides it, but React calls that a limitation it may remove, so leads now stay hidden until their own call saves (new e2e test). Added the missing signed-out test for deleting a list. Shared `isUuid` and `callWindowOf` helpers. Mutation check: 11 of 11 rules caught once the missing test was added.
- [x] Task: Follow-ups (slice 6)
  - Acceptance: due today and overdue lists; new call clears/replaces follow-up
  - Verify: integration test; e2e follow-up appears in Due Today
  - Files: src/lib/follow-ups.ts, src/lib/data/follow-ups.ts, src/app/(app)/follow-ups/, src/components/follow-ups-view.tsx, src/components/app-shell/nav-counts.tsx
  - Result: Overdue, Due today and Next 7 days, grouped on your own clock in the browser (the server sends the next 8 days). Do not call, not interested and bad number leads are left out; booked meetings show as Meeting with Open. Sidebar counts for Queue (ready now), Follow-ups (due today, red when overdue) and Leads. 240 unit/integration and 67 e2e tests.
- [x] Task: CSV import/export (slice 7)
  - Acceptance: column mapping, validation, dedupe on E.164, DNC skip, 500-row chunks, summary; `/api/export` streams CSV
  - From the slice 4–5 review: validate imported time zones with `resolveTimeZone`. An unknown zone name in the database would break the local-time display (Intl throws on it).
  - Verify: 1,000-row import test with correct summary; export auth test
  - Files: src/lib/csv.ts, src/lib/data/import.ts, src/lib/data/export.ts, src/lib/actions/import.ts, src/app/(app)/import/, src/components/import/, src/app/api/export/route.ts, public/lead-template.csv
  - Result: 3 steps (upload, match columns, review counts) in the browser; the server checks every row again and saves batches of up to 500 rows and about 700 KB (server actions accept 1 MB). Duplicates are skipped by the database's unique phone number, so overlapping imports are safe; do-not-call leads are left untouched and counted. Time zones come from the country, never the file. Export streams leads or calls in batches of 1,000 with a byte-order mark for Excel, and cells that could run as formulas get a leading apostrophe. A downloadable template replaces the prototype's example file. 275 unit/integration and 75 e2e tests; the 1,000-row import gives the exact summary.
- [x] Task: `/review` + security-and-hardening pass on slices 6–7
  - Result: one critical bug fixed. Leads added in one import share a timestamp to the microsecond, but the export cursor is a JavaScript Date (milliseconds), so exports of more than one batch repeated rows and could stream forever; the cursor now compares at millisecond precision (test reproduces it). Also fixed: CSVs saved as plain "CSV" by Excel on Windows (Windows-1252) are now read correctly; security headers on every response (nosniff, frame denial, referrer and permissions policy, HSTS); a visible focus ring on Choose file. Mutation check: 12 of 12 rules caught. No rate limiting: single-user app behind Google sign-in.
- [x] Task: Stats (slice 8)
  - Acceptance: calls/day, connect rate, conversion by list and period
  - Verify: unit tests on aggregation; visual check against prototype
  - Files: src/lib/stats.ts, src/lib/data/stats.ts, src/components/stats/, src/app/(app)/stats/
  - Result: last 7 or 30 days, with the period before for comparison: four headline figures, calls per day, outcomes and a row per list. The chart also shows as a table. Checked by eye in light, dark and at phone width, which found axis text shrinking to about 5px on a phone, so the chart is now drawn at its real width.
- [x] Task: `/review` of Stats and Settings
  - Result: four bugs fixed, each reproduced in a browser first and each with a regression test. A just-logged call went missing from Stats because the page clock can lag by 30 seconds; two open Settings pages could silently undo each other; a failed save replaced the whole page, now it says so and can retry, and there is an error page for the signed-in app; an edit made before the form was live was never saved. Follow-up: tests now cover the meetings count and the by-list sort (both checked by breaking the code). Stats download measured with an e2e build: 31 KB gzipped with 3,700 calls, 76 KB with 12,000, so it stays as it is. Any save after the session has ended now goes to sign-in instead of an error page, and the import page no longer hangs when a request fails.
- [x] Task: Settings page
  - Acceptance: edit call window, call days, retry gap, default country
  - Files: src/app/(app)/settings/, src/components/settings/settings-form.tsx, src/lib/settings-input.ts, src/lib/actions/settings.ts
  - Result: each field saves on its own as you change it; nothing is saved while any field is wrong. `parseSettingsForm`
    checks the whole form, so an end time at or before the start, an empty day list, a retry gap outside 1-168 hours or an
    unknown country all say why and leave the saved settings alone. The browser tests run last and one at a time (the
    `settings` project), because saved settings change what every other test sees.

## Phase 4: Ship
- [ ] Task: `/ship` checklist
  - From the slice 6–7 security pass: add a Content-Security-Policy that limits scripts (needs a nonce per request from the proxy, which makes pages dynamic); today the policy only sets frame-ancestors, base-uri and object-src.
- [ ] Task: Deploy (slice 9)
  - Status: live at https://dialwise-beta.vercel.app (Vercel project `dialwise`, functions in `sin1` next to the Neon database, Node 24 pinned in package.json). Production keys are set and the owner signs in on prod. Pushing to `main` on GitHub deploys it. Still to do: the 10k-lead speed check and Lighthouse.
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
