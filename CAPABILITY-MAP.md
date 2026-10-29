# Capability Map: Cold-Call CRM

One personal CRM for cold calling, built as modules. Each module has its own spec (`SPEC-<module-id>.md`), its screens added to `design/prototype.html`, and its own plan and tasks. Module ids are fixed; they never get renamed.

| Module id | Responsibility | Depends on | Spec |
|---|---|---|---|
| `core-crm` | Leads, lists, call queue, outcome logging, follow-ups, CSV import/export, stats, settings, Google sign-in | — | [SPEC-core-crm.md](SPEC-core-crm.md) |
| `pipeline` | Deals created from interested leads; stages Qualified → Proposal → Negotiation → Won / Lost; deal value and expected close; board view; pipeline value in stats | core-crm | to write |
| `dialer` | Calls from the browser through a calling provider (Twilio planned); calls logged automatically with duration; recordings on the lead page; recording notice to the callee; voicemail drop; caller ID per country | core-crm | to write |
| `email-calendar` | Email templates sent from the owner's Gmail and logged on the lead; "Meeting booked" creates a Google Calendar invite | core-crm | to write |

Build order: `core-crm` → `pipeline` → `dialer` → `email-calendar`

- `pipeline` first: no outside accounts, small.
- `dialer` once the core is in daily use: it brings accounts, per-minute costs and recording-consent rules.
- The three phase-2 modules don't depend on each other, so their order can change.

## Boundaries between modules
- `core-crm` owns `leads`, `lists`, `calls`, `settings`. Other modules read these and add their own tables. They change core rows only through core's functions (for example `logCall`), so outcome → status rules stay in one place (`src/lib/outcomes.ts`).
- `calls` already has `channel`, `duration_sec` and `external_id` for `dialer`.
- `pipeline` adds `deals` (lead_id → leads).
- `email-calendar` adds templates and a sent-email log. It extends the Google sign-in with send-email and calendar permissions, so its spec must also cover how Google tokens are stored and refreshed.

## Not planned
SMS campaigns, automation workflows, funnels and website builders, review management, multi-user/teams, white-labelling, AI call notes.
