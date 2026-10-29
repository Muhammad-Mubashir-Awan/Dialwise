# Graph Report - CRM TOOL  (2026-10-30)

## Corpus Check
- 31 files · ~58,847 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 920 nodes · 2433 edges · 36 communities (34 shown, 2 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 183 edges (avg confidence: 0.9)
- Token cost: 136,624 tokens this run (the doc-extraction agent's total; no input/output split was reported). All runs so far: 738,756.

## Community Hubs (Navigation)
- Leads and Lists Pages
- Data Layer and Integration Tests
- Queue Page and Outcomes
- Google Sign-in and Session
- App Shell and Navigation
- Lead Input, Phones, Time Zones
- E2E Test Setup
- Queue Query and Call Hours
- Prototype Interactions
- Lead Display and Live Times
- Command Menu and Dialogs
- Follow-ups and Sidebar Counts
- shadcn Configuration
- Package Manifest
- Follow-ups View and Buttons
- Lead Form Dialog
- Queue and Call Logging Design
- Runtime Dependencies
- TypeScript Config
- Modules and Data Model
- Dev Dependencies
- CSV Import Plan
- Setup and Database Driver
- Root Layout and Theming
- Form Primitives
- npm Scripts
- Call Logging and Test Database
- Project Documents
- Testing Strategy and Scaffold
- Stats Plan
- Leads and Lists Scope
- Deploy Plan
- ESLint Config
- Prettier Config
- Shape and Spacing Tokens
- Auth Route Handlers

## God Nodes (most connected - your core abstractions)
1. `react` - 32 edges
2. `next` - 31 edges
3. `Tasks: Cold-Call CRM` - 25 edges
4. `Spec: core-crm (Cold-Call CRM)` - 23 edges
5. `vitest` - 22 edges
6. `cn` - 22 edges
7. `Queue + call logging task (slice 5, done)` - 21 edges
8. `Button()` - 20 edges
9. `lucide-react` - 20 edges
10. `getDb()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `nextStatus()` --semantically_similar_to--> `src/lib/outcomes.ts (outcome -> status transitions)`  [INFERRED] [semantically similar]
  design/prototype.html → SPEC-core-crm.md
- `Mutation checking of tests (drop a rule, expect a failing test)` --semantically_similar_to--> `Prove-It bug-fix rule (failing test first)`  [INFERRED] [semantically similar]
  tasks/todo.md → SPEC-core-crm.md
- `recordCall (call insert + lead update in one transaction)` --references--> `recordCall()`  [INFERRED]
  SPEC-core-crm.md → src/lib/data/calls.ts
- `logCall server action` --references--> `getDb()`  [INFERRED]
  SPEC-core-crm.md → src/lib/db/client.ts
- `parsePhone()` --implements--> `E.164 phone normalization and dedupe`  [INFERRED]
  src/lib/phone.ts → SPEC-core-crm.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Phase-2 modules built on core-crm** — capability_map_core_crm, capability_map_pipeline, capability_map_dialer, capability_map_email_calendar [EXTRACTED 1.00]
- **Single-email auth guard flow** — spec_core_crm_authjs, spec_core_crm_auth_module, tasks_plan_signin_callback, spec_core_crm_requireuser, spec_core_crm_proxy_ts [EXTRACTED 1.00]
- **Owner's Google sign-in setup flow** — docs_setup_google_auth_platform, docs_setup_google_oauth_client, docs_setup_env_local, docs_setup_allowed_email, spec_core_crm_authjs [INFERRED 0.85]
- **logCall write path (session check, Zod validation, atomic call + lead update)** — spec_core_crm_logcall, spec_core_crm_requireuser, spec_core_crm_zod, spec_core_crm_recordcall, spec_core_crm_db_transaction, spec_core_crm_calls_table, spec_core_crm_leads_table [EXTRACTED 1.00]
- **Queue eligibility and ordering rules** — spec_core_crm_call_queue, spec_core_crm_queue_query_module, spec_core_crm_call_window, spec_core_crm_per_zone_call_hours, spec_core_crm_retry_gap, spec_core_crm_follow_ups, spec_core_crm_closed_out_statuses, spec_core_crm_call_lists [EXTRACTED 1.00]
- **Follow-ups due-today flow (server sends 8 days, browser groups on the user's clock)** — spec_core_crm_follow_ups, spec_core_crm_follow_ups_browser_grouping, src_lib_data_follow_ups, src_lib_follow_ups, src_components_follow_ups_view, src_components_app_shell_nav_counts, tasks_todo_sidebar_nav_counts [INFERRED 0.85]

## Communities (36 total, 2 thin omitted)

### Community 0 - "Leads and Lists Pages"
Cohesion: 0.05
Nodes (70): nextConfig, next, server-only, FollowUps(), metadata, Page(), metadata, Page() (+62 more)

### Community 1 - "Data Layer and Integration Tests"
Cohesion: 0.06
Nodes (61): drizzle-orm, vitest, settings table (single row, id = 1), callsSince(), RecordCallInput, RecordCallResult, UndoCallResult, FollowUpItem (+53 more)

### Community 2 - "Queue Page and Outcomes"
Cohesion: 0.06
Nodes (54): STATUS map (labels and tones), Semantic tones (neutral, info, ok, accent, warn, danger), Call outcome enum, src/lib/outcomes.ts (outcome -> status transitions), Lead status enum, DOT, FollowUpPick, GROUPS (+46 more)

### Community 3 - "Google Sign-in and Session"
Cohesion: 0.08
Nodes (37): generate-agent-files.js (next dev), :root CSS custom properties (light/dark theme tokens), Semantic color tokens mapped to shadcn CSS variables, Typography (Geist / Geist Mono, 12-26px scale), next-auth, Google sign-in locked to one allowed email, src/auth.ts (Auth.js config + single-email allowlist), Auth.js v5 (Google provider, JWT sessions) (+29 more)

### Community 4 - "App Shell and Navigation"
Cohesion: 0.07
Nodes (28): AppLayout(), AppShell(), navCountsByHref, ShellContext, ShellContextValue, useShell(), ShortcutsDialog(), CurrentNavLinks() (+20 more)

### Community 5 - "Lead Input, Phones, Time Zones"
Cohesion: 0.08
Nodes (34): countriesAndZones(), ZoneChoice, LEAD_FIELDS, LeadErrors, LeadField, LeadForm, LeadFormResult, LeadValues (+26 more)

### Community 6 - "E2E Test Setup"
Cohesion: 0.11
Nodes (22): open(), E2E_AUTH_SECRET, E2E_OWNER_EMAIL, E2E_SERVER_ENV, E2E_STRANGER_EMAIL, OWNER_STATE, sessionState(), STRANGER_STATE (+14 more)

### Community 7 - "Queue Query and Call Hours"
Cohesion: 0.11
Nodes (34): Header(), metadata, Page(), param(), Queue(), QueueSkeleton(), SearchParams, QueueCard (+26 more)

### Community 8 - "Prototype Interactions"
Cohesion: 0.09
Nodes (27): bindImport(), bindQueue(), confirmLog(), CONVERSATION outcome set (connect rate), copyPhone(), counts(), cycleTheme(), doUndo() (+19 more)

### Community 9 - "Lead Display and Live Times"
Cohesion: 0.16
Nodes (26): DetailSkeleton(), LeadDetail(), metadata, None(), Page(), Chip(), OutcomeChip(), StatusChip() (+18 more)

### Community 10 - "Command Menu and Dialogs"
Cohesion: 0.15
Nodes (22): CommandMenu(), Props, SECTIONS, Command(), CommandDialog(), CommandEmpty(), CommandGroup(), CommandInput() (+14 more)

### Community 11 - "Follow-ups and Sidebar Counts"
Cohesion: 0.17
Nodes (17): Follow-ups and Due today list, DueCount(), NavCount(), FollowUpsCount(), getCounts, LeadsCount(), QueueCount(), Boundaries (+9 more)

### Community 12 - "shadcn Configuration"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 13 - "Package Manifest"
Cohesion: 0.09
Nodes (20): engines, node, name, private, version, cmdk, drizzle-kit, jsdom (+12 more)

### Community 14 - "Follow-ups View and Buttons"
Cohesion: 0.16
Nodes (15): class-variance-authority, cn, dayAndTime, timeOnly, Button(), buttonVariants, InputGroupAddon(), inputGroupAddonVariants (+7 more)

### Community 15 - "Lead Form Dialog"
Cohesion: 0.15
Nodes (17): lucide-react, AddLeadButton(), DialogState, EditLeadButton(), LeadDialogShortcut(), FIELD_ORDER, FormLead, INITIAL (+9 more)

### Community 16 - "Queue and Call Logging Design"
Cohesion: 0.17
Nodes (16): inWindow(), queueState(), settings object (call window, retry gap, default country), TERMINAL status set, viewLists(), core-crm acceptance criteria, Call queue (Next lead), Local call window (default 09:00-18:00 Mon-Fri) (+8 more)

### Community 17 - "Runtime Dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, cmdk, cn, drizzle-orm, libphonenumber-js, lucide-react, next (+11 more)

### Community 18 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 19 - "Modules and Data Model"
Cohesion: 0.20
Nodes (15): core-crm module, deals table (lead_id -> leads), dialer module, email-calendar module, Google token storage and refresh, Not planned features (SMS, automation, funnels, multi-user, white-label, AI notes), pipeline module, Twilio calling provider (+7 more)

### Community 20 - "Dev Dependencies"
Cohesion: 0.11
Nodes (18): devDependencies, drizzle-kit, @electric-sql/pglite, @electric-sql/pglite-socket, eslint, eslint-config-next, jsdom, @playwright/test (+10 more)

### Community 21 - "CSV Import Plan"
Cohesion: 0.22
Nodes (16): COUNTRIES (dial codes, single-zone time zones), countryOf(), importPlan(), normPhone(), openLeadForm(), prettyPhone(), libphonenumber-js, CSV import/export (column mapping, phone dedupe) (+8 more)

### Community 22 - "Setup and Database Driver"
Cohesion: 0.19
Nodes (16): Setting up CRM Tool on your machine, ALLOWED_EMAIL single-account allowlist, npm run db:migrate (create the tables), .env.local secrets (AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, ALLOWED_EMAIL, AUTH_SECRET, DATABASE_URL), Google Auth Platform consent screen (External audience, Testing mode, test users), Google OAuth web client (localhost:3000 origin and /api/auth/callback/google), Neon project with pooled connection string, Setup troubleshooting table (+8 more)

### Community 23 - "Root Layout and Theming"
Cohesion: 0.17
Nodes (9): next-themes, sonner, geistMono, geistSans, metadata, RootLayout(), ThemeProvider(), Toaster() (+1 more)

### Community 24 - "Form Primitives"
Cohesion: 0.19
Nodes (8): radix-ui, react, Field(), FieldLabel(), FieldSeparator(), fieldVariants, Label(), Separator()

### Community 25 - "npm Scripts"
Cohesion: 0.13
Nodes (15): scripts, build, check, db:generate, db:migrate, db:studio, dev, format (+7 more)

### Community 26 - "Call Logging and Test Database"
Cohesion: 0.20
Nodes (8): port, server, stop(), @electric-sql/pglite, @electric-sql/pglite-socket, logCall server action, PGlite (in-memory Postgres for integration tests), recordCall (call insert + lead update in one transaction)

### Community 27 - "Project Documents"
Cohesion: 0.28
Nodes (12): Capability Map: Cold-Call CRM, viewPrefs() (Settings screen), CRM Tool README, npm scripts (dev, check, test:e2e, format), Spec: core-crm (Cold-Call CRM), Objective: single-user hosted cold-calling app, Quick call logging (one-click outcome + note), Settings feature (call window, retry gap, default country) (+4 more)

### Community 28 - "Testing Strategy and Scaffold"
Cohesion: 0.28
Nodes (10): Cold-Call CRM Prototype (prototype.html), Design tokens: Cold-Call CRM, Playwright, Tailwind CSS + shadcn/ui, Testing strategy (unit, integration, e2e, Prove-It), Vitest, agent-skills usage per stage (TDD, review, security, ship), Slice 1: Scaffold (+2 more)

### Community 29 - "Stats Plan"
Cohesion: 0.31
Nodes (8): Stats dashboard (calls/day, connect rate, conversion), src/lib/stats.ts (stats queries and aggregation), graphify knowledge-graph workflow (/graphify . and --update), tests/helpers/db.ts PGlite test helper, Slice 2: DB layer, Slice 8: Stats, Run /graphify knowledge graph (done; --update after every slice from slice 3), Stats task (slice 8)

### Community 30 - "Leads and Lists Scope"
Cohesion: 0.36
Nodes (6): zod, Call lists / campaigns, Leads management feature, Zod validation, Slice 4: Leads and lists, Leads and lists CRUD task (slice 4, done)

### Community 31 - "Deploy Plan"
Cohesion: 0.60
Nodes (5): Success criteria (queue < 300 ms at 10k leads, Lighthouse >= 90), Vercel hosting, Slice 9: Deploy, Deploy task (slice 9), /ship checklist task

### Community 32 - "ESLint Config"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

### Community 33 - "Prettier Config"
Cohesion: 0.50
Nodes (3): plugins, printWidth, tailwindStylesheet

## Ambiguous Edges - Review These
- `OUTCOMES table (keys 1-9, tones, followUp flag)` → `Follow-ups and Due today list`  [AMBIGUOUS]
  design/prototype.html · relation: conceptually_related_to
- `TERMINAL status set` → `Lead status enum`  [AMBIGUOUS]
  design/prototype.html · relation: conceptually_related_to

## Knowledge Gaps
- **21 isolated node(s):** `jsdom`, `prettier`, `prettier-plugin-tailwindcss`, `react-dom`, `shadcn` (+16 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 264 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Leads and Lists Pages` to `Queue Page and Outcomes`, `Google Sign-in and Session`, `App Shell and Navigation`, `Queue Query and Call Hours`, `Lead Display and Live Times`, `Command Menu and Dialogs`, `Package Manifest`, `Follow-ups View and Buttons`, `Lead Form Dialog`, `Root Layout and Theming`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **What connects `jsdom`, `prettier`, `prettier-plugin-tailwindcss` to the rest of the system?**
  _21 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Leads and Lists Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.05255613951266125 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Form Primitives` to `Leads and Lists Pages`, `Queue Page and Outcomes`, `Google Sign-in and Session`, `App Shell and Navigation`, `Queue Query and Call Hours`, `Lead Display and Live Times`, `Command Menu and Dialogs`, `Follow-ups and Sidebar Counts`, `Package Manifest`, `Follow-ups View and Buttons`, `Lead Form Dialog`, `Root Layout and Theming`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Should `Data Layer and Integration Tests` be split into smaller, more focused modules?**
  _Cohesion score 0.05518207282913165 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `OUTCOMES table (keys 1-9, tones, followUp flag)` and `Follow-ups and Due today list`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `TERMINAL status set` and `Lead status enum`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._