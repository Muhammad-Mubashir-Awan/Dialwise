# CRM Tool

A personal CRM for cold calling: a call queue that respects each lead's local call hours, one-key outcome logging, follow-ups, call lists, CSV import/export and stats.

- What it does and why: [SPEC-core-crm.md](SPEC-core-crm.md)
- Modules and build order (core, then pipeline, dialer, email + calendar): [CAPABILITY-MAP.md](CAPABILITY-MAP.md)
- Plan and task list: [tasks/plan.md](tasks/plan.md), [tasks/todo.md](tasks/todo.md)
- Approved UI prototype and design tokens: [design/](design/)
- First-time setup (Google sign-in, Neon database): [docs/SETUP.md](docs/SETUP.md)

## Stack
Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS 4 + shadcn/ui, Neon Postgres + Drizzle (from slice 2), Auth.js with Google (from slice 3), Vitest and Playwright.

## Commands
```bash
npm install          # install dependencies (Node 24+)
npm run dev          # dev server on http://localhost:3000
npm run check        # lint + typecheck + format check + unit tests
npm run test:e2e     # production build + Playwright (desktop and phone)
npm run format       # format with Prettier
```

The first time you run the e2e tests, install the browser with `npx playwright install chromium`.

## Keyboard
`Ctrl/⌘ K` search and commands · `G` then `Q/F/L/T/I/S/P` to switch pages · `?` all shortcuts.
