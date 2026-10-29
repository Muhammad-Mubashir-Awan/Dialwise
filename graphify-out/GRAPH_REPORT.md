# Graph Report - CRM TOOL  (2026-10-29)

## Corpus Check
- 56 files · ~45,419 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 767 nodes · 1797 edges · 33 communities (30 shown, 3 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 126 edges (avg confidence: 0.91)
- Token cost: 130,650 tokens this run (the doc-extraction agent's total; no input/output split was reported). All runs so far: 443,586.

## Community Hubs (Navigation)
- Lead Form and UI Primitives
- Lead Data Layer and Tests
- Lead Pages and Display
- Lists and Data Access
- Prototype Interactions
- App Shell and Navigation
- Google Sign-in and Session
- E2E Test Setup
- Page Layout Placeholders
- shadcn Configuration
- Package Manifest
- Runtime Dependencies
- TypeScript Config
- Modules and Data Model
- Dev Dependencies
- Root Layout and Theming
- Slices and Stats Plan
- npm Scripts
- Database and Test Strategy
- Time Zone Helpers
- Scaffold and Stack
- Queue and Call Window
- Setup and Deployment
- Project Documents
- Outcomes and Call Logging
- Auth Design
- Leads and Lists Scope
- E2E Database Server
- ESLint Config
- Prettier Config
- Not Planned Features
- Shape and Spacing Tokens
- Auth Route Handlers

## God Nodes (most connected - your core abstractions)
1. `react` - 28 edges
2. `next` - 25 edges
3. `Spec: core-crm (Cold-Call CRM)` - 23 edges
4. `LeadDetail()` - 21 edges
5. `Tasks: Cold-Call CRM` - 21 edges
6. `cn` - 19 edges
7. `lucide-react` - 17 edges
8. `compilerOptions` - 16 edges
9. `getDb()` - 16 edges
10. `requireUser()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `nextStatus()` --semantically_similar_to--> `src/lib/outcomes.ts (outcome -> status transitions)`  [INFERRED] [semantically similar]
  design/prototype.html → SPEC-core-crm.md
- `isAllowedEmail()` --implements--> `Google sign-in locked to one allowed email`  [INFERRED]
  src/lib/auth-rules.ts → SPEC-core-crm.md
- `Proxy reads only the session cookie` --rationale_for--> `proxy()`  [INFERRED]
  tasks/todo.md → src/proxy.ts
- `calls` --implements--> `calls table`  [INFERRED]
  src/lib/db/schema.ts → SPEC-core-crm.md
- `leads` --implements--> `leads table`  [INFERRED]
  src/lib/db/schema.ts → SPEC-core-crm.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Phase-2 modules built on core-crm** — capability_map_core_crm, capability_map_pipeline, capability_map_dialer, capability_map_email_calendar [EXTRACTED 1.00]
- **Single-email auth guard flow** — spec_core_crm_authjs, spec_core_crm_auth_module, tasks_plan_signin_callback, spec_core_crm_requireuser, spec_core_crm_proxy_ts [EXTRACTED 1.00]
- **Queue eligibility and ordering rules** — spec_core_crm_call_queue, spec_core_crm_call_window, spec_core_crm_retry_gap, spec_core_crm_follow_ups, spec_core_crm_closed_out_statuses, spec_core_crm_call_lists [EXTRACTED 1.00]
- **logCall write path (session check, validation, one transaction)** — spec_core_crm_logcall, spec_core_crm_requireuser, spec_core_crm_zod, spec_core_crm_recordcall, spec_core_crm_db_transaction, spec_core_crm_calls_table, spec_core_crm_leads_table [EXTRACTED 1.00]
- **Owner's Google sign-in setup flow** — docs_setup_google_auth_platform, docs_setup_google_oauth_client, docs_setup_env_local, docs_setup_allowed_email, spec_core_crm_authjs [INFERRED 0.85]

## Communities (33 total, 3 thin omitted)

### Community 0 - "Lead Form and UI Primitives"
Cohesion: 0.06
Nodes (55): class-variance-authority, cn, radix-ui, react, sonner, CommandMenu(), Props, SECTIONS (+47 more)

### Community 1 - "Lead Data Layer and Tests"
Cohesion: 0.05
Nodes (62): drizzle-orm, vitest, deleteLeadAction(), LeadFormState, saveLead(), createLead(), deleteLead(), escapeLike() (+54 more)

### Community 2 - "Lead Pages and Display"
Cohesion: 0.07
Nodes (52): lucide-react, DetailSkeleton(), LeadDetail(), metadata, None(), Page(), Chip(), OutcomeChip() (+44 more)

### Community 3 - "Lists and Data Access"
Cohesion: 0.07
Nodes (56): pg, zod, AddLead(), Leads(), LeadsSkeleton(), metadata, Page(), SearchParams (+48 more)

### Community 4 - "Prototype Interactions"
Cohesion: 0.06
Nodes (47): bindImport(), bindQueue(), confirmLog(), CONVERSATION outcome set (connect rate), copyPhone(), COUNTRIES (dial codes, single-zone time zones), countryOf(), counts() (+39 more)

### Community 5 - "App Shell and Navigation"
Cohesion: 0.08
Nodes (27): AppLayout(), AppShell(), onKeyDown(), ShellContext, ShellContextValue, useShell(), ShortcutsDialog(), CurrentNavLinks() (+19 more)

### Community 6 - "Google Sign-in and Session"
Cohesion: 0.12
Nodes (26): next-auth, server-only, first(), GoogleButton(), LoginPage(), metadata, SearchParams, SignInForm() (+18 more)

### Community 7 - "E2E Test Setup"
Cohesion: 0.13
Nodes (21): open(), E2E_AUTH_SECRET, E2E_OWNER_EMAIL, E2E_SERVER_ENV, E2E_STRANGER_EMAIL, OWNER_STATE, sessionState(), STRANGER_STATE (+13 more)

### Community 8 - "Page Layout Placeholders"
Cohesion: 0.19
Nodes (15): nextConfig, next, metadata, Page(), metadata, Page(), metadata, Page() (+7 more)

### Community 9 - "shadcn Configuration"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 10 - "Package Manifest"
Cohesion: 0.10
Nodes (19): engines, node, name, private, version, cmdk, jsdom, prettier (+11 more)

### Community 11 - "Runtime Dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, cmdk, cn, drizzle-orm, libphonenumber-js, lucide-react, next (+11 more)

### Community 12 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 13 - "Modules and Data Model"
Cohesion: 0.18
Nodes (14): core-crm module, deals table (lead_id -> leads), dialer module, email-calendar module, Google token storage and refresh, pipeline module, Twilio calling provider, drizzle-kit (+6 more)

### Community 14 - "Dev Dependencies"
Cohesion: 0.11
Nodes (18): devDependencies, drizzle-kit, @electric-sql/pglite, @electric-sql/pglite-socket, eslint, eslint-config-next, jsdom, @playwright/test (+10 more)

### Community 15 - "Root Layout and Theming"
Cohesion: 0.18
Nodes (8): next-themes, geistMono, geistSans, metadata, RootLayout(), ThemeProvider(), Toaster(), TooltipProvider()

### Community 16 - "Slices and Stats Plan"
Cohesion: 0.15
Nodes (14): viewFollowups(), npm run db:migrate (create the tables), Drizzle ORM (drizzle-orm/node-postgres + drizzle-kit), Follow-ups and Due today list, Stats dashboard (calls/day, connect rate, conversion), src/lib/stats.ts (stats queries and aggregation), graphify knowledge-graph workflow (/graphify . and --update), tests/helpers/db.ts PGlite test helper (+6 more)

### Community 17 - "npm Scripts"
Cohesion: 0.13
Nodes (15): scripts, build, check, db:generate, db:migrate, db:studio, dev, format (+7 more)

### Community 18 - "Database and Test Strategy"
Cohesion: 0.23
Nodes (8): Neon project with pooled connection string, Neon Postgres, PGlite (in-memory Postgres for integration tests), Testing strategy (unit, integration, e2e, Prove-It), agent-skills usage per stage (TDD, review, security, ship), Owner-supplied secrets (.env.local: DATABASE_URL, AUTH_*, ALLOWED_EMAIL), signIn callback (email_verified && email === ALLOWED_EMAIL), Verification plan (unit, integration, e2e, auth, deploy)

### Community 19 - "Time Zone Helpers"
Cohesion: 0.27
Nodes (11): countryTimeZones(), CURRENT_NAMES, currentName(), guessTimeZone(), isTimeZone(), LocaleWithZones, MAIN_ZONE, offsets() (+3 more)

### Community 20 - "Scaffold and Stack"
Cohesion: 0.19
Nodes (10): generate-agent-files.js (next dev), :root CSS custom properties (light/dark theme tokens), Semantic color tokens mapped to shadcn CSS variables, Typography (Geist / Geist Mono, 12-26px scale), Next.js 16 (App Router, RSC, Server Actions), Playwright, Tailwind CSS + shadcn/ui, Vitest (+2 more)

### Community 21 - "Queue and Call Window"
Cohesion: 0.24
Nodes (11): viewPrefs() (Settings screen), core-crm acceptance criteria, Call queue (Next lead), Local call window (default 09:00-18:00 Mon-Fri), src/lib/queue.ts (next-lead selection), Retry gap (default 24h after no_answer/voicemail), Settings feature (call window, retry gap, default country), Queue as one SQL query (now() AT TIME ZONE timezone) (+3 more)

### Community 22 - "Setup and Deployment"
Cohesion: 0.32
Nodes (11): Setting up CRM Tool on your machine, ALLOWED_EMAIL single-account allowlist, .env.local secrets (AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, ALLOWED_EMAIL, AUTH_SECRET, DATABASE_URL), Google Auth Platform consent screen (External audience, Testing mode, test users), Google OAuth web client (localhost:3000 origin and /api/auth/callback/google), Setup troubleshooting table, Success criteria (queue < 300 ms at 10k leads, Lighthouse >= 90), Vercel hosting (+3 more)

### Community 23 - "Project Documents"
Cohesion: 0.44
Nodes (9): Capability Map: Cold-Call CRM, Cold-Call CRM Prototype (prototype.html), Design tokens: Cold-Call CRM, CRM Tool README, npm scripts (dev, check, test:e2e, format), Spec: core-crm (Cold-Call CRM), Plan: Cold-Call CRM, Tasks: Cold-Call CRM (+1 more)

### Community 24 - "Outcomes and Call Logging"
Cohesion: 0.29
Nodes (9): STATUS map (labels and tones), Semantic tones (neutral, info, ok, accent, warn, danger), logCall server action, Objective: single-user hosted cold-calling app, Call outcome enum, src/lib/outcomes.ts (outcome -> status transitions), Quick call logging (one-click outcome + note), Lead status enum (+1 more)

### Community 25 - "Auth Design"
Cohesion: 0.31
Nodes (9): Google sign-in locked to one allowed email, src/auth.ts (Auth.js config + single-email allowlist), Auth.js v5 (Google provider, JWT sessions), proxy.ts (early auth redirect), requireUser() session guard, Context7 doc checks (proxy.ts replaces middleware.ts; neon-http lacks transactions), Slice 3: Auth, Auth task (slice 3, done) (+1 more)

### Community 26 - "Leads and Lists Scope"
Cohesion: 0.32
Nodes (6): Call lists / campaigns, Leads management feature, lists table, Zod validation, Slice 4: Leads and lists, Leads and lists CRUD task (slice 4, done)

### Community 27 - "E2E Database Server"
Cohesion: 0.33
Nodes (5): port, server, stop(), @electric-sql/pglite, @electric-sql/pglite-socket

### Community 28 - "ESLint Config"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

### Community 29 - "Prettier Config"
Cohesion: 0.50
Nodes (3): plugins, printWidth, tailwindStylesheet

## Ambiguous Edges - Review These
- `OUTCOMES table (keys 1-9, tones, followUp flag)` → `Follow-ups and Due today list`  [AMBIGUOUS]
  design/prototype.html · relation: conceptually_related_to
- `TERMINAL status set` → `Lead status enum`  [AMBIGUOUS]
  design/prototype.html · relation: conceptually_related_to

## Knowledge Gaps
- **21 isolated node(s):** `{ GET, POST }`, `Not planned features (SMS, automation, funnels, multi-user, white-label, AI notes)`, `Shape and spacing (radius scale, 4px grid, 224px sidebar)`, `generate-agent-files.js (next dev)`, `agent-skills usage per stage (TDD, review, security, ship)` (+16 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 223 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Page Layout Placeholders` to `Lead Form and UI Primitives`, `Lead Data Layer and Tests`, `Lead Pages and Display`, `Lists and Data Access`, `App Shell and Navigation`, `Google Sign-in and Session`, `Package Manifest`, `Root Layout and Theming`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **What connects `{ GET, POST }`, `Not planned features (SMS, automation, funnels, multi-user, white-label, AI notes)`, `Shape and spacing (radius scale, 4px grid, 224px sidebar)` to the rest of the system?**
  _21 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Lead Form and UI Primitives` be split into smaller, more focused modules?**
  _Cohesion score 0.06264199935086011 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Lead Form and UI Primitives` to `Lead Pages and Display`, `Lists and Data Access`, `App Shell and Navigation`, `Google Sign-in and Session`, `Package Manifest`, `Root Layout and Theming`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Should `Lead Data Layer and Tests` be split into smaller, more focused modules?**
  _Cohesion score 0.053946053946053944 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `OUTCOMES table (keys 1-9, tones, followUp flag)` and `Follow-ups and Due today list`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `TERMINAL status set` and `Lead status enum`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._