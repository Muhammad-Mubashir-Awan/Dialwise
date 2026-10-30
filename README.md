# Dialwise

A cold-calling CRM for working through leads without losing track. Each lead is called only inside their local hours, retries wait the gap you set, and every outcome is logged in one key press. Follow-ups never slip. Built with Next.js, Neon Postgres and Google sign-in.

- What it does and why: [SPEC-core-crm.md](SPEC-core-crm.md)
- Modules and build order (core, then pipeline, dialer, email + calendar): [CAPABILITY-MAP.md](CAPABILITY-MAP.md)
- Plan and task list: [tasks/plan.md](tasks/plan.md), [tasks/todo.md](tasks/todo.md)
- Approved UI prototype and design tokens: [design/](design/)
- First-time setup (Google sign-in, Neon database): [docs/SETUP.md](docs/SETUP.md)

## Stack
Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS 4 + shadcn/ui, Neon Postgres + Drizzle (node-postgres driver), Auth.js with Google, Zod, libphonenumber-js, Vitest and Playwright.

## Commands
```bash
npm install          # install dependencies (Node 24+)
npm run dev          # dev server on http://localhost:3000
npm run check        # lint + typecheck + format check + unit and integration tests
npm run test:e2e     # production build + Playwright (desktop and phone)
npm run format       # format with Prettier
```

The first time you run the e2e tests, install the browser with `npx playwright install chromium`. No database is needed for any tests: integration tests use an in-memory Postgres (PGlite), and the e2e tests start one on port 54329 for the test server, so they never touch your Neon database.

## Keyboard
`Ctrl/⌘ K` search and commands · `G` then `Q/F/L/T/I/S/P` to switch pages · `?` all shortcuts.
