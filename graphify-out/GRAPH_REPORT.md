# Graph Report - CRM TOOL  (2026-10-29)

## Corpus Check
- 16 files · ~28,994 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 505 nodes · 978 edges · 21 communities (18 shown, 3 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 1% AMBIGUOUS · INFERRED: 84 edges (avg confidence: 0.88)
- Token cost: 109,420 input · 0 output

## Community Hubs (Navigation)
- Modules, Spec and Plan
- shadcn Dialogs and Command UI
- Docs, Design Tokens and Tasks
- App Shell and Navigation
- Database Schema and Clients
- Google Sign-in and Session
- Prototype UI Logic
- Placeholder Pages and Config
- Build and Tooling Config
- shadcn Component Config
- Phones, Import and Lists
- TypeScript Config
- E2E Test Sessions
- Runtime Dependencies
- Root Layout and Theming
- Dev Dependencies
- npm Scripts
- Prettier Config
- Not Planned Features
- Spacing Tokens
- Auth Route Handlers

## God Nodes (most connected - your core abstractions)
1. `Spec: core-crm (Cold-Call CRM)` - 23 edges
2. `next` - 17 edges
3. `compilerOptions` - 16 edges
4. `ComingSoon()` - 15 edges
5. `PageBody()` - 15 edges
6. `PageHeader()` - 15 edges
7. `scripts` - 15 edges
8. `react` - 14 edges
9. `AppShell()` - 13 edges
10. `Tasks: Cold-Call CRM` - 13 edges

## Surprising Connections (you probably didn't know these)
- `nextStatus()` --semantically_similar_to--> `src/lib/outcomes.ts (outcome -> status transitions)`  [INFERRED] [semantically similar]
  design/prototype.html → SPEC-core-crm.md
- `logCall() (prototype, with undo snapshot)` --semantically_similar_to--> `logCall server action`  [INFERRED] [semantically similar]
  design/prototype.html → SPEC-core-crm.md
- `inWindow()` --semantically_similar_to--> `Queue as one SQL query (now() AT TIME ZONE timezone)`  [INFERRED] [semantically similar]
  design/prototype.html → tasks/plan.md
- `TERMINAL status set` --conceptually_related_to--> `Lead status enum`  [AMBIGUOUS]
  design/prototype.html → SPEC-core-crm.md
- `viewFollowups()` --implements--> `Follow-ups and Due today list`  [INFERRED]
  design/prototype.html → SPEC-core-crm.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Phase-2 modules built on core-crm** — capability_map_core_crm, capability_map_pipeline, capability_map_dialer, capability_map_email_calendar [EXTRACTED 1.00]
- **Single-email auth guard flow** — spec_core_crm_authjs, spec_core_crm_auth_module, tasks_plan_signin_callback, spec_core_crm_requireuser, spec_core_crm_proxy_ts [EXTRACTED 1.00]
- **logCall write path (session check, Zod parse, single-statement atomic write)** — spec_core_crm_logcall, spec_core_crm_requireuser, spec_core_crm_zod, spec_core_crm_recordcall, spec_core_crm_calls_table, spec_core_crm_leads_table [INFERRED 0.85]
- **Queue eligibility and ordering rules** — spec_core_crm_call_queue, spec_core_crm_call_window, spec_core_crm_retry_gap, spec_core_crm_follow_ups, spec_core_crm_closed_out_statuses, spec_core_crm_call_lists [EXTRACTED 1.00]
- **Foundation slices 1-3 and their review** — tasks_todo_scaffold_slice_1, tasks_todo_db_layer_slice_2, tasks_todo_auth_slice_3, tasks_todo_review_slices_1_3 [EXTRACTED 1.00]

## Communities (21 total, 3 thin omitted)

### Community 0 - "Modules, Spec and Plan"
Cohesion: 0.07
Nodes (51): core-crm module, deals table (lead_id -> leads), dialer module, email-calendar module, Google token storage and refresh, pipeline module, Twilio calling provider, inWindow() (+43 more)

### Community 1 - "shadcn Dialogs and Command UI"
Cohesion: 0.10
Nodes (36): cn, radix-ui, react, CommandMenu(), Props, SECTIONS, ShortcutsDialog(), Button() (+28 more)

### Community 2 - "Docs, Design Tokens and Tasks"
Cohesion: 0.09
Nodes (38): generate-agent-files.js (next dev), Capability Map: Cold-Call CRM, Cold-Call CRM Prototype (prototype.html), :root CSS custom properties (light/dark theme tokens), Design tokens: Cold-Call CRM, Semantic color tokens mapped to shadcn CSS variables, Typography (Geist / Geist Mono, 12-26px scale), CRM Tool README (+30 more)

### Community 3 - "App Shell and Navigation"
Cohesion: 0.09
Nodes (25): lucide-react, AppLayout(), AppShell(), onKeyDown(), ShellContext, ShellContextValue, useShell(), SidebarNav() (+17 more)

### Community 4 - "Database Schema and Clients"
Cohesion: 0.08
Nodes (30): drizzle-orm, @electric-sql/pglite, @neondatabase/serverless, vitest, AppDatabase, createDb(), getDb(), Call (+22 more)

### Community 5 - "Google Sign-in and Session"
Cohesion: 0.12
Nodes (27): next-auth, server-only, first(), GoogleButton(), LoginPage(), metadata, SearchParams, SignInForm() (+19 more)

### Community 6 - "Prototype UI Logic"
Cohesion: 0.10
Nodes (25): bindImport(), bindQueue(), confirmLog(), CONVERSATION outcome set (connect rate), copyPhone(), counts(), cycleTheme(), doUndo() (+17 more)

### Community 7 - "Placeholder Pages and Config"
Cohesion: 0.18
Nodes (19): nextConfig, next, metadata, Page(), metadata, Page(), metadata, Page() (+11 more)

### Community 8 - "Build and Tooling Config"
Cohesion: 0.08
Nodes (23): eslintConfig, engines, node, name, private, version, class-variance-authority, cmdk (+15 more)

### Community 9 - "shadcn Component Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 10 - "Phones, Import and Lists"
Cohesion: 0.16
Nodes (18): COUNTRIES (dial codes, single-zone time zones), countryOf(), importPlan(), normPhone(), openLeadForm(), prettyPhone(), Call lists / campaigns, CSV import/export (column mapping, phone dedupe) (+10 more)

### Community 11 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 12 - "E2E Test Sessions"
Cohesion: 0.20
Nodes (9): E2E_AUTH_SECRET, E2E_OWNER_EMAIL, E2E_SERVER_ENV, E2E_STRANGER_EMAIL, OWNER_STATE, sessionState(), STRANGER_STATE, globalSetup() (+1 more)

### Community 13 - "Runtime Dependencies"
Cohesion: 0.12
Nodes (17): dependencies, class-variance-authority, cmdk, cn, drizzle-orm, lucide-react, @neondatabase/serverless, next (+9 more)

### Community 14 - "Root Layout and Theming"
Cohesion: 0.17
Nodes (9): next-themes, sonner, geistMono, geistSans, metadata, RootLayout(), ThemeProvider(), Toaster() (+1 more)

### Community 15 - "Dev Dependencies"
Cohesion: 0.12
Nodes (16): devDependencies, drizzle-kit, @electric-sql/pglite, eslint, eslint-config-next, jsdom, @playwright/test, prettier (+8 more)

### Community 16 - "npm Scripts"
Cohesion: 0.13
Nodes (15): scripts, build, check, db:generate, db:migrate, db:studio, dev, format (+7 more)

### Community 17 - "Prettier Config"
Cohesion: 0.50
Nodes (3): plugins, printWidth, tailwindStylesheet

## Ambiguous Edges - Review These
- `OUTCOMES table (keys 1-9, tones, followUp flag)` → `Follow-ups and Due today list`  [AMBIGUOUS]
  design/prototype.html · relation: conceptually_related_to
- `TERMINAL status set` → `Lead status enum`  [AMBIGUOUS]
  design/prototype.html · relation: conceptually_related_to
- `CRM Tool README` → `Phase 1 UI design tasks (owner approval gate)`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to
- `db.batch() atomic multi-statement writes` → `logCall server action`  [AMBIGUOUS]
  SPEC-core-crm.md · relation: conceptually_related_to
- `recordCall (call insert + lead update in one SQL statement)` → `Queue + call logging task (slice 5)`  [AMBIGUOUS]
  tasks/todo.md · relation: conceptually_related_to

## Knowledge Gaps
- **22 isolated node(s):** `CONVERSATION outcome set (connect rate)`, `Shape and spacing (radius scale, 4px grid, 224px sidebar)`, `generate-agent-files.js (next dev)`, `Google token storage and refresh`, `Not planned features (SMS, automation, funnels, multi-user, white-label, AI notes)` (+17 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 176 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Placeholder Pages and Config` to `shadcn Dialogs and Command UI`, `App Shell and Navigation`, `Google Sign-in and Session`, `Build and Tooling Config`, `Root Layout and Theming`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **What connects `CONVERSATION outcome set (connect rate)`, `Shape and spacing (radius scale, 4px grid, 224px sidebar)`, `generate-agent-files.js (next dev)` to the rest of the system?**
  _22 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Modules, Spec and Plan` be split into smaller, more focused modules?**
  _Cohesion score 0.06954997077732321 - nodes in this community are weakly interconnected._
- **Why does `drizzle-orm` connect `Database Schema and Clients` to `Build and Tooling Config`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Should `shadcn Dialogs and Command UI` be split into smaller, more focused modules?**
  _Cohesion score 0.10204081632653061 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `OUTCOMES table (keys 1-9, tones, followUp flag)` and `Follow-ups and Due today list`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `TERMINAL status set` and `Lead status enum`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._