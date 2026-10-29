# Graph Report - CRM TOOL  (2026-10-29)

## Corpus Check
- Corpus is ~27,084 words - fits in a single context window. You may not need a graph.

## Summary
- 448 nodes · 805 edges · 16 communities (15 shown, 1 thin omitted)
- Extraction: 90% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 73 edges (avg confidence: 0.9)
- Token cost: 203,516 input · 0 output

## Community Hubs (Navigation)
- Prototype Queue and UI Logic
- shadcn Dialogs and Command UI
- Specs, Modules and Plan
- App Shell and Navigation
- Database Schema and Clients
- Phones, Import and Lists
- Placeholder Pages and Config
- Build and Tooling Config
- shadcn Component Config
- TypeScript Config
- Root Layout and Theming
- Dev Dependencies
- Runtime Dependencies
- npm Scripts
- Prettier Config
- Spacing Tokens

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `scripts` - 15 edges
3. `next` - 15 edges
4. `PageHeader()` - 15 edges
5. `PageBody()` - 15 edges
6. `ComingSoon()` - 15 edges
7. `react` - 13 edges
8. `AppShell()` - 13 edges
9. `cn` - 11 edges
10. `lucide-react` - 11 edges

## Surprising Connections (you probably didn't know these)
- `nextStatus()` --semantically_similar_to--> `src/lib/outcomes.ts (outcome -> status transitions)`  [INFERRED] [semantically similar]
  design/prototype.html → SPEC-core-crm.md
- `Next.js agent rules (breaking-changes notice)` --semantically_similar_to--> `Context7 doc checks (proxy.ts replaces middleware.ts; neon-http lacks transactions)`  [INFERRED] [semantically similar]
  AGENTS.md → tasks/plan.md
- `Chunked CSV inserts (500 rows, onConflictDoNothing)` --shares_data_with--> `leads table`  [INFERRED]
  tasks/plan.md → SPEC-core-crm.md
- `TERMINAL status set` --conceptually_related_to--> `Lead status enum`  [AMBIGUOUS]
  design/prototype.html → SPEC-core-crm.md
- `importPlan()` --semantically_similar_to--> `src/lib/csv.ts (parse, validate, dedupe)`  [INFERRED] [semantically similar]
  design/prototype.html → SPEC-core-crm.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Queue eligibility and ordering rules** — spec_core_crm_call_queue, spec_core_crm_call_window, spec_core_crm_retry_gap, spec_core_crm_follow_ups, spec_core_crm_status_enum [EXTRACTED 1.00]
- **Phase-2 modules built on core-crm** — capability_map_core_crm, capability_map_pipeline, capability_map_dialer, capability_map_email_calendar [EXTRACTED 1.00]
- **Single-email auth guard flow** — spec_core_crm_authjs, spec_core_crm_auth_module, tasks_plan_signin_callback, spec_core_crm_requireuser, spec_core_crm_proxy_ts [EXTRACTED 1.00]

## Communities (16 total, 1 thin omitted)

### Community 0 - "Prototype Queue and UI Logic"
Cohesion: 0.05
Nodes (53): bindImport(), bindQueue(), confirmLog(), CONVERSATION outcome set (connect rate), copyPhone(), counts(), cycleTheme(), doUndo() (+45 more)

### Community 1 - "shadcn Dialogs and Command UI"
Cohesion: 0.09
Nodes (39): class-variance-authority, cn, radix-ui, react, LoginPage(), metadata, CommandMenu(), Props (+31 more)

### Community 2 - "Specs, Modules and Plan"
Cohesion: 0.07
Nodes (43): generate-agent-files.js (next dev), Capability Map: Cold-Call CRM, core-crm module, deals table (lead_id -> leads), dialer module, email-calendar module, Google token storage and refresh, Not planned features (SMS, automation, funnels, multi-user, white-label, AI notes) (+35 more)

### Community 3 - "App Shell and Navigation"
Cohesion: 0.10
Nodes (26): lucide-react, vitest, AppLayout(), AppShell(), onKeyDown(), ShellContext, ShellContextValue, useShell() (+18 more)

### Community 4 - "Database Schema and Clients"
Cohesion: 0.08
Nodes (29): drizzle-orm, @electric-sql/pglite, @neondatabase/serverless, AppDatabase, createDb(), getDb(), Call, CALL_CHANNELS (+21 more)

### Community 5 - "Phones, Import and Lists"
Cohesion: 0.10
Nodes (32): COUNTRIES (dial codes, single-zone time zones), countryOf(), importPlan(), normPhone(), openLeadForm(), prettyPhone(), npm scripts (dev, check, test:e2e, format), core-crm acceptance criteria (+24 more)

### Community 6 - "Placeholder Pages and Config"
Cohesion: 0.18
Nodes (19): nextConfig, next, metadata, Page(), metadata, Page(), metadata, Page() (+11 more)

### Community 7 - "Build and Tooling Config"
Cohesion: 0.07
Nodes (23): eslintConfig, engines, node, name, private, version, cmdk, drizzle-kit (+15 more)

### Community 8 - "shadcn Component Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 9 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 10 - "Root Layout and Theming"
Cohesion: 0.17
Nodes (9): next-themes, sonner, geistMono, geistSans, metadata, RootLayout(), ThemeProvider(), Toaster() (+1 more)

### Community 11 - "Dev Dependencies"
Cohesion: 0.12
Nodes (16): devDependencies, drizzle-kit, @electric-sql/pglite, eslint, eslint-config-next, jsdom, @playwright/test, prettier (+8 more)

### Community 12 - "Runtime Dependencies"
Cohesion: 0.13
Nodes (15): dependencies, class-variance-authority, cmdk, cn, drizzle-orm, lucide-react, @neondatabase/serverless, next (+7 more)

### Community 13 - "npm Scripts"
Cohesion: 0.13
Nodes (15): scripts, build, check, db:generate, db:migrate, db:studio, dev, format (+7 more)

### Community 14 - "Prettier Config"
Cohesion: 0.50
Nodes (3): plugins, printWidth, tailwindStylesheet

## Ambiguous Edges - Review These
- `CRM Tool README` → `Phase 1 UI design tasks (owner approval gate)`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to
- `Follow-ups and Due today list` → `OUTCOMES table (keys 1-9, tones, followUp flag)`  [AMBIGUOUS]
  design/prototype.html · relation: conceptually_related_to
- `Lead status enum` → `TERMINAL status set`  [AMBIGUOUS]
  design/prototype.html · relation: conceptually_related_to
- `logCall server action` → `db.batch() atomic multi-statement writes`  [AMBIGUOUS]
  SPEC-core-crm.md · relation: conceptually_related_to

## Knowledge Gaps
- **21 isolated node(s):** `react-dom`, `shadcn`, `tw-animate-css`, `@tailwindcss/turbopack`, `@types/node` (+16 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 168 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Placeholder Pages and Config` to `shadcn Dialogs and Command UI`, `Root Layout and Theming`, `App Shell and Navigation`, `Build and Tooling Config`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **What connects `react-dom`, `shadcn`, `tw-animate-css` to the rest of the system?**
  _21 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Prototype Queue and UI Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05499735589635114 - nodes in this community are weakly interconnected._
- **Why does `drizzle-orm` connect `Database Schema and Clients` to `Build and Tooling Config`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Should `shadcn Dialogs and Command UI` be split into smaller, more focused modules?**
  _Cohesion score 0.08944793850454227 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `CRM Tool README` and `Phase 1 UI design tasks (owner approval gate)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Follow-ups and Due today list` and `OUTCOMES table (keys 1-9, tones, followUp flag)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._