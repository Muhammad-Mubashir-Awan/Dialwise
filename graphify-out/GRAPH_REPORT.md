# Graph Report - CRM TOOL  (2026-10-30)

## Corpus Check
- 20 files · ~65,472 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 997 nodes · 2760 edges · 39 communities (36 shown, 3 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 232 edges (avg confidence: 0.9)
- Token cost: 241,839 tokens this run (the doc-extraction agent's total over two passes; no input/output split was reported). All runs so far: 980,595.

## Community Hubs (Navigation)
- App Pages
- UI Primitives and Lead Form
- Lead Display and Live Times
- CSV Import and Export
- App Shell and Navigation
- Google Sign-in and Session
- Lead Input, Phones, Time Zones
- E2E Test Setup
- Prototype Interactions
- Integration Test Helpers
- Lead Data and Import Save
- Queue Panel and Helpers
- Package Manifest
- Queue Query and Counts
- shadcn Configuration
- Queue and Call Logging Design
- Setup and Database Driver
- Call Logging
- Runtime Dependencies
- Dev Dependencies
- TypeScript Config
- Data Access Core
- Modules and Data Model
- Outcome Rules
- Project Documents
- npm Scripts
- Leads, Lists and Stats Plan
- Root Layout and Theming
- Queue View Internals
- E2E Database
- Follow-ups Data
- Testing Strategy and Scaffold
- Database Schema
- Import Tests
- Follow-ups Design
- ESLint Config
- Prettier Config
- Shape and Spacing Tokens
- Auth Route Handlers

## God Nodes (most connected - your core abstractions)
1. `react` - 34 edges
2. `next` - 33 edges
3. `Spec: core-crm (Cold-Call CRM)` - 26 edges
4. `vitest` - 25 edges
5. `Tasks: Cold-Call CRM` - 25 edges
6. `Queue + call logging task (slice 5, done)` - 25 edges
7. `cn` - 23 edges
8. `CSV import/export task (slice 7, done)` - 23 edges
9. `Button()` - 22 edges
10. `lucide-react` - 22 edges

## Surprising Connections (you probably didn't know these)
- `nextStatus()` --semantically_similar_to--> `src/lib/outcomes.ts (outcome -> status transitions)`  [INFERRED] [semantically similar]
  design/prototype.html → SPEC-core-crm.md
- `Mutation checking of tests (drop a rule, expect a failing test)` --semantically_similar_to--> `Prove-It bug-fix rule (failing test first)`  [INFERRED] [semantically similar]
  tasks/todo.md → SPEC-core-crm.md
- `Settings` --implements--> `settings table (single row, id = 1)`  [INFERRED]
  src/lib/db/schema.ts → SPEC-core-crm.md
- `logCall server action` --references--> `getDb()`  [INFERRED]
  SPEC-core-crm.md → src/lib/db/client.ts
- `Auth task (slice 3, done)` --references--> `requireUser()`  [INFERRED]
  tasks/todo.md → src/lib/session.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Phase-2 modules built on core-crm** — capability_map_core_crm, capability_map_pipeline, capability_map_dialer, capability_map_email_calendar [EXTRACTED 1.00]
- **Single-email auth guard flow** — spec_core_crm_authjs, spec_core_crm_auth_module, tasks_plan_signin_callback, spec_core_crm_requireuser, spec_core_crm_proxy_ts [EXTRACTED 1.00]
- **Owner's Google sign-in setup flow** — docs_setup_google_auth_platform, docs_setup_google_oauth_client, docs_setup_env_local, docs_setup_allowed_email, spec_core_crm_authjs [INFERRED 0.85]
- **logCall write path (session check, Zod validation, atomic call + lead update)** — spec_core_crm_logcall, spec_core_crm_requireuser, spec_core_crm_logcall_schema, spec_core_crm_zod, spec_core_crm_recordcall, spec_core_crm_db_transaction, spec_core_crm_calls_table, spec_core_crm_leads_table [EXTRACTED 1.00]
- **Queue eligibility and ordering rules** — spec_core_crm_call_queue, spec_core_crm_queue_query_module, spec_core_crm_call_window, spec_core_crm_per_zone_call_hours, spec_core_crm_retry_gap, spec_core_crm_follow_ups, spec_core_crm_closed_out_statuses, spec_core_crm_do_not_call, spec_core_crm_call_lists [EXTRACTED 1.00]
- **Follow-ups due-today flow (server sends 8 days, browser groups on the user's clock)** — spec_core_crm_follow_ups, spec_core_crm_follow_ups_browser_grouping, src_lib_data_follow_ups, src_lib_follow_ups, src_components_follow_ups_view, src_components_app_shell_nav_counts, tasks_todo_sidebar_nav_counts [INFERRED 0.85]

## Communities (39 total, 3 thin omitted)

### Community 0 - "App Pages"
Cohesion: 0.05
Nodes (72): nextConfig, next, FollowUps(), metadata, Page(), Import(), metadata, Page() (+64 more)

### Community 1 - "UI Primitives and Lead Form"
Cohesion: 0.05
Nodes (59): class-variance-authority, cn, radix-ui, react, CommandMenu(), Props, SECTIONS, AddLeadButton() (+51 more)

### Community 2 - "Lead Display and Live Times"
Cohesion: 0.07
Nodes (56): lucide-react, DetailSkeleton(), LeadDetail(), metadata, None(), Page(), DueCount(), Chip() (+48 more)

### Community 3 - "CSV Import and Export"
Cohesion: 0.06
Nodes (60): COUNTRIES (dial codes, single-zone time zones), countryOf(), importPlan(), normPhone(), openLeadForm(), prettyPhone(), libphonenumber-js, core-crm acceptance criteria (+52 more)

### Community 4 - "App Shell and Navigation"
Cohesion: 0.06
Nodes (34): server-only, AppLayout(), AppShell(), NavCount(), FollowUpsCount(), getCounts, LeadsCount(), navCountsByHref (+26 more)

### Community 5 - "Google Sign-in and Session"
Cohesion: 0.09
Nodes (37): generate-agent-files.js (next dev), :root CSS custom properties (light/dark theme tokens), Semantic color tokens mapped to shadcn CSS variables, Typography (Geist / Geist Mono, 12-26px scale), Google sign-in locked to one allowed email, src/auth.ts (Auth.js config + single-email allowlist), Auth.js v5 (Google provider, JWT sessions), Next.js 16 (App Router, RSC, Server Actions) (+29 more)

### Community 6 - "Lead Input, Phones, Time Zones"
Cohesion: 0.09
Nodes (36): countriesAndZones(), clip(), COUNTRY_ALIASES, countryFromText(), LEAD_FIELDS, LeadField, LeadForm, LeadFormResult (+28 more)

### Community 7 - "E2E Test Setup"
Cohesion: 0.11
Nodes (23): open(), E2E_AUTH_SECRET, E2E_OWNER_EMAIL, E2E_SERVER_ENV, E2E_STRANGER_EMAIL, OWNER_STATE, sessionState(), STRANGER_STATE (+15 more)

### Community 8 - "Prototype Interactions"
Cohesion: 0.08
Nodes (29): bindImport(), bindQueue(), confirmLog(), CONVERSATION outcome set (connect rate), copyPhone(), counts(), cycleTheme(), doUndo() (+21 more)

### Community 9 - "Integration Test Helpers"
Cohesion: 0.15
Nodes (14): vitest, calls, lists, DB layer task (slice 2, done), createTestDb(), migrationsFolder, pgErrorCode(), resetTestDb() (+6 more)

### Community 10 - "Lead Data and Import Save"
Cohesion: 0.14
Nodes (22): ImportResult, createLead(), escapeLike(), filterCondition(), findLeads(), LeadDetail, LeadFilters, LeadPage (+14 more)

### Community 11 - "Queue Panel and Helpers"
Cohesion: 0.15
Nodes (20): DOT, FollowUpPick, GROUPS, LogPanel(), ownZone(), PRESSED, QueueLeadCard(), Logged (+12 more)

### Community 12 - "Package Manifest"
Cohesion: 0.08
Nodes (22): engines, node, name, private, version, cmdk, drizzle-kit, jsdom (+14 more)

### Community 13 - "Queue Query and Counts"
Cohesion: 0.15
Nodes (21): Queue(), callWindowOf(), getQueue(), navCounts(), Parts, Queue, QueueCounts, QueueOptions (+13 more)

### Community 14 - "shadcn Configuration"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 15 - "Queue and Call Logging Design"
Cohesion: 0.20
Nodes (15): inWindow(), queueState(), settings object (call window, retry gap, default country), TERMINAL status set, Call queue (Next lead), Local call window (default 09:00-18:00 Mon-Fri), src/lib/queue.ts (browser queue helpers: order after skips, reasons, follow-up times), src/lib/data/queue.ts (queue query: eligibility, order, counts) (+7 more)

### Community 16 - "Setup and Database Driver"
Cohesion: 0.17
Nodes (19): Setting up CRM Tool on your machine, ALLOWED_EMAIL single-account allowlist, npm run db:migrate (create the tables), .env.local secrets (AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, ALLOWED_EMAIL, AUTH_SECRET, DATABASE_URL), Google Auth Platform consent screen (External audience, Testing mode, test users), Google OAuth web client (localhost:3000 origin and /api/auth/callback/google), Neon project with pooled connection string, Setup troubleshooting table (+11 more)

### Community 17 - "Call Logging"
Cohesion: 0.19
Nodes (17): zod, calls table, logCall server action, LogCall Zod schema, Call outcome enum, Quick call logging (one-click outcome + note), recordCall (call insert + lead update in one transaction), Zod validation (+9 more)

### Community 18 - "Runtime Dependencies"
Cohesion: 0.10
Nodes (20): dependencies, class-variance-authority, cmdk, cn, drizzle-orm, libphonenumber-js, lucide-react, next (+12 more)

### Community 19 - "Dev Dependencies"
Cohesion: 0.11
Nodes (19): devDependencies, drizzle-kit, @electric-sql/pglite, @electric-sql/pglite-socket, eslint, eslint-config-next, jsdom, @playwright/test (+11 more)

### Community 20 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 21 - "Data Access Core"
Cohesion: 0.18
Nodes (10): drizzle-orm, callsSince(), RecordCallInput, RecordCallResult, UndoCallResult, ListResult, DEFAULTS, AppDatabase (+2 more)

### Community 22 - "Modules and Data Model"
Cohesion: 0.18
Nodes (12): core-crm module, deals table (lead_id -> leads), dialer module, email-calendar module, Google token storage and refresh, pipeline module, Twilio calling provider, leads table (+4 more)

### Community 23 - "Outcome Rules"
Cohesion: 0.18
Nodes (14): STATUS map (labels and tones), Semantic tones (neutral, info, ok, accent, warn, danger), src/lib/outcomes.ts (outcome -> status transitions), Lead status enum, LEAD_STATUSES, CLOSED_STATUSES, CONVERSATION_OUTCOMES, FOLLOW_UP_OUTCOMES (+6 more)

### Community 24 - "Project Documents"
Cohesion: 0.28
Nodes (14): Capability Map: Cold-Call CRM, Not planned features (SMS, automation, funnels, multi-user, white-label, AI notes), Cold-Call CRM Prototype (prototype.html), Design tokens: Cold-Call CRM, CRM Tool README, npm scripts (dev, check, test:e2e, format), Spec: core-crm (Cold-Call CRM), Objective: single-user hosted cold-calling app (+6 more)

### Community 25 - "npm Scripts"
Cohesion: 0.13
Nodes (15): scripts, build, check, db:generate, db:migrate, db:studio, dev, format (+7 more)

### Community 26 - "Leads, Lists and Stats Plan"
Cohesion: 0.22
Nodes (12): Call lists / campaigns, Leads management feature, Stats dashboard (calls/day, connect rate, conversion), src/lib/stats.ts (stats queries and aggregation), graphify knowledge-graph workflow (/graphify . and --update), tests/helpers/db.ts PGlite test helper, Slice 2: DB layer, Slice 4: Leads and lists (+4 more)

### Community 27 - "Root Layout and Theming"
Cohesion: 0.23
Nodes (9): next-themes, sonner, geistMono, geistSans, metadata, RootLayout(), ThemeProvider(), Toaster() (+1 more)

### Community 28 - "Queue View Internals"
Cohesion: 0.27
Nodes (8): Count(), EmptyQueue(), QueueView(), confirm(), log(), pick(), undo(), UpNext()

### Community 29 - "E2E Database"
Cohesion: 0.31
Nodes (6): port, server, stop(), @electric-sql/pglite, @electric-sql/pglite-socket, PGlite (in-memory Postgres for integration tests)

### Community 30 - "Follow-ups Data"
Cohesion: 0.33
Nodes (5): followUpTimes(), listFollowUps(), pending(), Lead, NOW

### Community 31 - "Testing Strategy and Scaffold"
Cohesion: 0.39
Nodes (7): Playwright, Tailwind CSS + shadcn/ui, Testing strategy (unit, integration, e2e, Prove-It), Vitest, agent-skills usage per stage (TDD, review, security, ship), Slice 1: Scaffold, Scaffold task (slice 1, done)

### Community 32 - "Database Schema"
Cohesion: 0.32
Nodes (7): callChannel, createdAt(), List, NewCall, NewLead, timestamptz(), updatedAt()

### Community 34 - "Follow-ups Design"
Cohesion: 0.53
Nodes (5): Follow-ups and Due today list, Slice 6: Follow-ups, Follow-ups task (slice 6, done), /review + security-and-hardening pass on slices 6-7 (pending), Sidebar counts (Queue ready now, Follow-ups due today, Leads)

### Community 35 - "ESLint Config"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

### Community 36 - "Prettier Config"
Cohesion: 0.50
Nodes (3): plugins, printWidth, tailwindStylesheet

## Ambiguous Edges - Review These
- `TERMINAL status set` → `Lead status enum`  [AMBIGUOUS]
  design/prototype.html · relation: conceptually_related_to
- `OUTCOMES table (keys 1-9, tones, followUp flag)` → `Follow-ups and Due today list`  [AMBIGUOUS]
  design/prototype.html · relation: conceptually_related_to

## Knowledge Gaps
- **21 isolated node(s):** `{ GET, POST }`, `Not planned features (SMS, automation, funnels, multi-user, white-label, AI notes)`, `npm scripts (dev, check, test:e2e, format)`, `agent-skills usage per stage (TDD, review, security, ship)`, `generate-agent-files.js (next dev)` (+16 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 292 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `App Pages` to `UI Primitives and Lead Form`, `Lead Display and Live Times`, `CSV Import and Export`, `App Shell and Navigation`, `Google Sign-in and Session`, `Queue Panel and Helpers`, `Package Manifest`, `Call Logging`, `Root Layout and Theming`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **What connects `{ GET, POST }`, `Not planned features (SMS, automation, funnels, multi-user, white-label, AI notes)`, `npm scripts (dev, check, test:e2e, format)` to the rest of the system?**
  _21 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Why does `react` connect `UI Primitives and Lead Form` to `App Pages`, `Lead Display and Live Times`, `CSV Import and Export`, `App Shell and Navigation`, `Google Sign-in and Session`, `Queue Panel and Helpers`, `Package Manifest`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Should `UI Primitives and Lead Form` be split into smaller, more focused modules?**
  _Cohesion score 0.05286006128702758 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `TERMINAL status set` and `Lead status enum`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `OUTCOMES table (keys 1-9, tones, followUp flag)` and `Follow-ups and Due today list`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._