# Graph Report - CRM TOOL  (2026-10-30)

## Corpus Check
- 30 files · ~55,515 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 874 nodes · 2262 edges · 45 communities (42 shown, 3 thin omitted)
- Extraction: 92% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 168 edges (avg confidence: 0.9)
- Token cost: 158,546 tokens this run (the doc-extraction agent's total; no input/output split was reported). All runs so far: 602,132.

## Community Hubs (Navigation)
- Data Layer and Integration Tests
- Google Sign-in and Session
- Page Layout and Lists Page
- E2E Test Setup
- Queue Page and Call Actions
- Prototype Domain Model
- Lead Form Dialog
- Lead Display and Live Times
- App Shell and Hotkeys
- Project Documents
- shadcn Configuration
- Package Manifest
- Root Layout and Theming
- Queue and Call Logging Design
- Leads Table and Filters
- Prototype Interactions
- Runtime Dependencies
- UI Primitives
- Time Zones and Form Options
- TypeScript Config
- Dev Dependencies
- Lead Data Functions
- Modules and Data Model
- CSV Import Plan
- Leads Page
- Dialogs and Shortcuts Help
- Outcomes and Chips
- npm Scripts
- Command Menu
- Call Window Math
- Lead Form Validation
- Setup and Deployment
- Testing Strategy
- Queue Helpers and Formatting
- Database Driver and logCall
- Stats Plan
- Lead Actions
- Sidebar Navigation
- Phone Utilities
- E2E Database Server
- ESLint Config
- Prettier Config
- Not Planned Features
- Shape and Spacing Tokens
- Auth Route Handlers

## God Nodes (most connected - your core abstractions)
1. `react` - 30 edges
2. `next` - 30 edges
3. `Tasks: Cold-Call CRM` - 25 edges
4. `Spec: core-crm (Cold-Call CRM)` - 24 edges
5. `QueueView()` - 23 edges
6. `getDb()` - 22 edges
7. `cn` - 21 edges
8. `vitest` - 20 edges
9. `Queue + call logging task (slice 5, done)` - 20 edges
10. `Button()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `nextStatus()` --semantically_similar_to--> `src/lib/outcomes.ts (outcome -> status transitions)`  [INFERRED] [semantically similar]
  design/prototype.html → SPEC-core-crm.md
- `parsePhone()` --implements--> `E.164 phone normalization and dedupe`  [INFERRED]
  src/lib/phone.ts → SPEC-core-crm.md
- `calls` --implements--> `calls table`  [INFERRED]
  src/lib/db/schema.ts → SPEC-core-crm.md
- `leads` --implements--> `leads table`  [INFERRED]
  src/lib/db/schema.ts → SPEC-core-crm.md
- `lists` --implements--> `lists table`  [INFERRED]
  src/lib/db/schema.ts → SPEC-core-crm.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Phase-2 modules built on core-crm** — capability_map_core_crm, capability_map_pipeline, capability_map_dialer, capability_map_email_calendar [EXTRACTED 1.00]
- **Single-email auth guard flow** — spec_core_crm_authjs, spec_core_crm_auth_module, tasks_plan_signin_callback, spec_core_crm_requireuser, spec_core_crm_proxy_ts [EXTRACTED 1.00]
- **Owner's Google sign-in setup flow** — docs_setup_google_auth_platform, docs_setup_google_oauth_client, docs_setup_env_local, docs_setup_allowed_email, spec_core_crm_authjs [INFERRED 0.85]
- **logCall write path (session check, Zod validation, atomic call + lead update)** — spec_core_crm_logcall, spec_core_crm_requireuser, spec_core_crm_zod, spec_core_crm_recordcall, spec_core_crm_db_transaction, spec_core_crm_calls_table, spec_core_crm_leads_table [EXTRACTED 1.00]
- **Queue eligibility and ordering rules** — spec_core_crm_call_queue, spec_core_crm_queue_query_module, spec_core_crm_call_window, spec_core_crm_per_zone_call_hours, spec_core_crm_retry_gap, spec_core_crm_follow_ups, spec_core_crm_closed_out_statuses, spec_core_crm_call_lists [EXTRACTED 1.00]
- **Slice 5 queue + call logging delivery files** — tasks_todo_queue_call_logging_slice_5, src_lib_queue, src_lib_data_queue, src_lib_data_calls, src_lib_actions_calls, src_app_app_queue_page, src_components_queue_queue_view [EXTRACTED 1.00]

## Communities (45 total, 3 thin omitted)

### Community 0 - "Data Layer and Integration Tests"
Cohesion: 0.05
Nodes (75): drizzle-orm, vitest, settings table (single row, id = 1), Header(), metadata, Page(), param(), Queue() (+67 more)

### Community 1 - "Google Sign-in and Session"
Cohesion: 0.07
Nodes (40): generate-agent-files.js (next dev), :root CSS custom properties (light/dark theme tokens), Semantic color tokens mapped to shadcn CSS variables, Typography (Geist / Geist Mono, 12-26px scale), next-auth, server-only, Google sign-in locked to one allowed email, src/auth.ts (Auth.js config + single-email allowlist) (+32 more)

### Community 2 - "Page Layout and Lists Page"
Cohesion: 0.12
Nodes (26): nextConfig, next, metadata, Page(), metadata, Page(), Lists(), metadata (+18 more)

### Community 3 - "E2E Test Setup"
Cohesion: 0.12
Nodes (22): open(), E2E_AUTH_SECRET, E2E_OWNER_EMAIL, E2E_SERVER_ENV, E2E_STRANGER_EMAIL, OWNER_STATE, sessionState(), STRANGER_STATE (+14 more)

### Community 4 - "Queue Page and Call Actions"
Cohesion: 0.12
Nodes (29): useShell(), DOT, FollowUpPick, GROUPS, LogPanel(), ownZone(), PRESSED, QueueLeadCard() (+21 more)

### Community 5 - "Prototype Domain Model"
Cohesion: 0.10
Nodes (23): bindImport(), inWindow(), loadImport(), nextWindowOpen(), OUTCOMES table (keys 1-9, tones, followUp flag), queueState(), renderView(), settings object (call window, retry gap, default country) (+15 more)

### Community 6 - "Lead Form Dialog"
Cohesion: 0.13
Nodes (19): AddLeadButton(), EditLeadButton(), FIELD_ORDER, FormLead, INITIAL, LeadForm(), LeadFormDialog(), Props (+11 more)

### Community 7 - "Lead Display and Live Times"
Cohesion: 0.18
Nodes (21): DetailSkeleton(), LeadDetail(), metadata, None(), Page(), Chip(), OutcomeChip(), StatusChip() (+13 more)

### Community 8 - "App Shell and Hotkeys"
Cohesion: 0.14
Nodes (13): AppLayout(), AppShell(), onKeyDown(), ShellContext, ShellContextValue, Sheet(), SheetContent(), SheetOverlay() (+5 more)

### Community 9 - "Project Documents"
Cohesion: 0.19
Nodes (18): Capability Map: Cold-Call CRM, Cold-Call CRM Prototype (prototype.html), Design tokens: Cold-Call CRM, CRM Tool README, npm scripts (dev, check, test:e2e, format), zod, Spec: core-crm (Cold-Call CRM), Call lists / campaigns (+10 more)

### Community 10 - "shadcn Configuration"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 11 - "Package Manifest"
Cohesion: 0.09
Nodes (20): engines, node, name, private, version, cmdk, drizzle-kit, jsdom (+12 more)

### Community 12 - "Root Layout and Theming"
Cohesion: 0.13
Nodes (13): next-themes, geistMono, geistSans, metadata, RootLayout(), ICONS, LABELS, ORDER (+5 more)

### Community 13 - "Queue and Call Logging Design"
Cohesion: 0.19
Nodes (15): viewPrefs() (Settings screen), core-crm acceptance criteria, Call queue (Next lead), Local call window (default 09:00-18:00 Mon-Fri), src/lib/outcomes.ts (outcome -> status transitions), src/lib/queue.ts (browser queue helpers: order after skips, reasons, follow-up times), src/lib/data/queue.ts (queue query: eligibility, order, counts), Quick call logging (one-click outcome + note) (+7 more)

### Community 14 - "Leads Table and Filters"
Cohesion: 0.16
Nodes (13): lucide-react, LeadTableRow, Props, Kbd(), NativeSelect(), NativeSelectOption(), NativeSelectProps, LeadStatus (+5 more)

### Community 15 - "Prototype Interactions"
Cohesion: 0.18
Nodes (16): bindQueue(), confirmLog(), copyPhone(), counts(), cycleTheme(), doUndo(), Global keydown shortcut handler, logCall() (prototype, with undo snapshot) (+8 more)

### Community 16 - "Runtime Dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, cmdk, cn, drizzle-orm, libphonenumber-js, lucide-react, next (+11 more)

### Community 17 - "UI Primitives"
Cohesion: 0.22
Nodes (12): class-variance-authority, cn, radix-ui, react, Button(), buttonVariants, InputGroupButton(), inputGroupButtonVariants (+4 more)

### Community 18 - "Time Zones and Form Options"
Cohesion: 0.20
Nodes (15): allLists(), countriesAndZones(), getLeadFormOptions(), ZoneChoice, CountryOption, countryTimeZones(), CURRENT_NAMES, currentName() (+7 more)

### Community 19 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 20 - "Dev Dependencies"
Cohesion: 0.11
Nodes (18): devDependencies, drizzle-kit, @electric-sql/pglite, @electric-sql/pglite-socket, eslint, eslint-config-next, jsdom, @playwright/test (+10 more)

### Community 21 - "Lead Data Functions"
Cohesion: 0.17
Nodes (16): escapeLike(), filterCondition(), getLead(), isUuid(), LeadDetail, LeadFilters, LeadPage, LeadRow (+8 more)

### Community 22 - "Modules and Data Model"
Cohesion: 0.22
Nodes (13): core-crm module, deals table (lead_id -> leads), dialer module, email-calendar module, Google token storage and refresh, pipeline module, Twilio calling provider, calls table (+5 more)

### Community 23 - "CSV Import Plan"
Cohesion: 0.24
Nodes (15): COUNTRIES (dial codes, single-zone time zones), countryOf(), importPlan(), normPhone(), openLeadForm(), prettyPhone(), libphonenumber-js, CSV import/export (column mapping, phone dedupe) (+7 more)

### Community 24 - "Leads Page"
Cohesion: 0.21
Nodes (13): AddLead(), Leads(), LeadsSkeleton(), metadata, Page(), SearchParams, DialogState, LeadDialogShortcut() (+5 more)

### Community 25 - "Dialogs and Shortcuts Help"
Cohesion: 0.22
Nodes (12): SECTIONS, ShortcutsDialog(), CommandDialog(), Dialog(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader() (+4 more)

### Community 26 - "Outcomes and Chips"
Cohesion: 0.21
Nodes (13): TONES, recordCall(), CallOutcome, CLOSED_STATUSES, FOLLOW_UP_OUTCOMES, needsFollowUp(), nextStatus(), OUTCOME_META (+5 more)

### Community 27 - "npm Scripts"
Cohesion: 0.13
Nodes (15): scripts, build, check, db:generate, db:migrate, db:studio, dev, format (+7 more)

### Community 28 - "Command Menu"
Cohesion: 0.29
Nodes (12): CommandMenu(), Props, Command(), CommandEmpty(), CommandGroup(), CommandInput(), CommandItem(), CommandList() (+4 more)

### Community 29 - "Call Window Math"
Cohesion: 0.27
Nodes (13): calendars, clocks, isInCallWindow(), localClock(), LocalDate, nextWindowOpen(), offsetAt(), parseClock() (+5 more)

### Community 30 - "Lead Form Validation"
Cohesion: 0.19
Nodes (11): LEAD_FIELDS, LeadErrors, LeadField, LeadForm, LeadFormResult, LeadValues, ListNameResult, optional() (+3 more)

### Community 31 - "Setup and Deployment"
Cohesion: 0.28
Nodes (12): Setting up CRM Tool on your machine, ALLOWED_EMAIL single-account allowlist, .env.local secrets (AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, ALLOWED_EMAIL, AUTH_SECRET, DATABASE_URL), Google Auth Platform consent screen (External audience, Testing mode, test users), Google OAuth web client (localhost:3000 origin and /api/auth/callback/google), Setup troubleshooting table, Success criteria (queue < 300 ms at 10k leads, Lighthouse >= 90), Vercel hosting (+4 more)

### Community 32 - "Testing Strategy"
Cohesion: 0.24
Nodes (11): PGlite (in-memory Postgres for integration tests), Playwright, Tailwind CSS + shadcn/ui, Testing strategy (unit, integration, e2e, Prove-It), Vitest, agent-skills usage per stage (TDD, review, security, ship), Owner-supplied secrets (.env.local: DATABASE_URL, AUTH_*, ALLOWED_EMAIL), signIn callback (email_verified && email === ALLOWED_EMAIL) (+3 more)

### Community 33 - "Queue Helpers and Formatting"
Cohesion: 0.21
Nodes (7): duration(), relativeTime(), arrangeQueue(), FollowUpChoice, ReasonLead, NOW, NOW

### Community 34 - "Database Driver and logCall"
Cohesion: 0.24
Nodes (8): npm run db:migrate (create the tables), Neon project with pooled connection string, pg, Drizzle ORM (drizzle-orm/node-postgres + drizzle-kit), logCall server action, Neon Postgres, recordCall (call insert + lead update in one transaction), LogCall

### Community 35 - "Stats Plan"
Cohesion: 0.21
Nodes (11): CONVERSATION outcome set (connect rate), periodData(), viewStats(), Stats dashboard (calls/day, connect rate, conversion), src/lib/stats.ts (stats queries and aggregation), graphify knowledge-graph workflow (/graphify . and --update), tests/helpers/db.ts PGlite test helper, Slice 2: DB layer (+3 more)

### Community 36 - "Lead Actions"
Cohesion: 0.30
Nodes (10): sonner, DeleteLead(), deleteLeadAction(), saveLead(), createLead(), deleteLead(), createDb(), getDb() (+2 more)

### Community 37 - "Sidebar Navigation"
Cohesion: 0.29
Nodes (7): CurrentNavLinks(), NavLinks(), SidebarNav(), isActivePath(), NAV_ITEMS, navHrefForKey(), NavItem

### Community 38 - "Phone Utilities"
Cohesion: 0.38
Nodes (8): countryName(), countryOptions(), formatPhone(), isCountryCode(), ParsedPhone, parsePhone(), read(), regionNames

### Community 39 - "E2E Database Server"
Cohesion: 0.33
Nodes (5): port, server, stop(), @electric-sql/pglite, @electric-sql/pglite-socket

### Community 40 - "ESLint Config"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

### Community 41 - "Prettier Config"
Cohesion: 0.50
Nodes (3): plugins, printWidth, tailwindStylesheet

## Ambiguous Edges - Review These
- `OUTCOMES table (keys 1-9, tones, followUp flag)` → `Follow-ups and Due today list`  [AMBIGUOUS]
  design/prototype.html · relation: conceptually_related_to
- `TERMINAL status set` → `Lead status enum`  [AMBIGUOUS]
  design/prototype.html · relation: conceptually_related_to

## Knowledge Gaps
- **21 isolated node(s):** `jsdom`, `prettier`, `prettier-plugin-tailwindcss`, `react-dom`, `shadcn` (+16 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 250 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Page Layout and Lists Page` to `Data Layer and Integration Tests`, `Google Sign-in and Session`, `Lead Actions`, `Sidebar Navigation`, `Lead Form Dialog`, `Lead Display and Live Times`, `App Shell and Hotkeys`, `Queue Page and Call Actions`, `Package Manifest`, `Root Layout and Theming`, `Leads Table and Filters`, `Leads Page`, `Command Menu`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **What connects `jsdom`, `prettier`, `prettier-plugin-tailwindcss` to the rest of the system?**
  _21 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Data Layer and Integration Tests` be split into smaller, more focused modules?**
  _Cohesion score 0.05133599831685252 - nodes in this community are weakly interconnected._
- **Why does `react` connect `UI Primitives` to `Data Layer and Integration Tests`, `Google Sign-in and Session`, `Page Layout and Lists Page`, `Lead Actions`, `Sidebar Navigation`, `Lead Form Dialog`, `Lead Display and Live Times`, `App Shell and Hotkeys`, `Queue Page and Call Actions`, `Package Manifest`, `Root Layout and Theming`, `Leads Table and Filters`, `Leads Page`, `Dialogs and Shortcuts Help`, `Command Menu`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Should `Google Sign-in and Session` be split into smaller, more focused modules?**
  _Cohesion score 0.07474600870827286 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `OUTCOMES table (keys 1-9, tones, followUp flag)` and `Follow-ups and Due today list`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `TERMINAL status set` and `Lead status enum`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._