# Design tokens: Dialwise

Source: `design/prototype.html` (approved prototype). Direction: clean and dense, Linear-like, keyboard-first, light and dark, one teal accent on cool (teal-biased) neutrals. Slice 1 applies these to `src/app/globals.css` as shadcn CSS variables.

## Type
- Sans: **Geist** (400, 500, 600). Mono: **Geist Mono** (400, 500) for phone numbers, times, counts and table numbers (`tabular-nums`).
- Loaded with `next/font` (`geist` package): no Google Fonts request at runtime.
- Scale (px): 12 xs · 13 sm · 14 md (base) · 16 lg · 20 xl · 26 2xl. Inputs are 16px on phones to stop iOS zoom.
- Weights: 600 titles, 500 labels/buttons, 400 body.

## Shape and spacing
- Radius: 4 (tags, kbd) · 6 (controls) · 8 (panels) · 10 (dialogs).
- Spacing on a 4px grid. Controls 32px tall (44px on touch). Table rows 44px.
- Sidebar 224px; collapses to a drawer below 860px.
- Shadows only on overlays (dialogs, palette, toast, mobile drawer).

## Color: semantic tokens → shadcn variables

| Token | shadcn var | Light | Dark |
|---|---|---|---|
| bg | `--background` | `#F7F9F9` | `#0B1111` |
| fg | `--foreground` | `#0E1717` | `#E4EDED` |
| surface | `--card`, `--popover` | `#FFFFFF` | `#111A1A` |
| surface-2 | `--muted`, `--secondary` | `#F0F4F4` | `#172222` |
| surface-3 | (chart "no conversation") | `#E4EBEB` | `#1F2C2C` |
| fg-muted | `--muted-foreground` | `#526464` | `#9BB0B0` |
| fg-subtle | placeholders, hints | `#667777` | `#7F9595` |
| border | `--border` | `#DFE6E6` | `#223030` |
| border-strong | `--input` | `#C3CFCF` | `#314242` |
| accent | `--primary` | `#0F766E` | `#2DD4BF` |
| accent-fg | `--primary-foreground` | `#FFFFFF` | `#04201D` |
| accent-hover | primary hover | `#0B5F58` | `#5EEAD4` |
| accent-soft | `--accent` (selection, current nav) | `#E2F2F0` | `#0F2E2B` |
| accent-text | `--accent-foreground` | `#0F766E` | `#5EEAD4` |
| ring | `--ring` | `#14B8A6` | `#2DD4BF` |
| danger | `--destructive` | `#B91C1C` | `#F87171` |

Semantic tones (each has a text color and a soft background; used for status chips, outcome buttons, chart bars):

| Tone | Text light / dark | Soft light / dark | Used for |
|---|---|---|---|
| neutral | `#526464` / `#9BB0B0` | `#ECF1F1` / `#1A2525` | New, Contacted, No answer, Voicemail |
| info | `#1D4ED8` / `#8AB4FF` | `#E6EDFC` / `#14213D` | Callback |
| ok | `#15803D` / `#4ADE80` | `#E4F4E9` / `#0F2A1A` | Interested, in call hours |
| accent | `#0F766E` / `#5EEAD4` | `#E2F2F0` / `#0F2E2B` | Meeting booked |
| warn | `#8A5300` / `#FBBF24` | `#FAF0D9` / `#2E2410` | Gatekeeper, Wrong number, Bad number, outside call hours |
| danger | `#B91C1C` / `#F87171` | `#FAE8E8` / `#331617` | Not interested, Do not call, overdue |

Contrast: all text pairs ≥ 4.5:1 in both themes (fg-muted 6.2:1 on white; accent 5.5:1 on white; warn text darkened to `#8A5300` to pass on its soft background). Status is never shown by color alone: every chip has a text label, and the call-hours dot has screen-reader text.

## Interaction rules
- Keyboard: `Ctrl/⌘ K` command menu, `G` then a letter to navigate, `?` shortcut sheet. Queue: `1–9` outcomes (numpad layout, grouped No conversation / Conversation / Close out), `N` note, `S` skip, `C` copy number, `Enter` confirm, `U` undo. Leads: `/` search, `J/K` move, `Enter` open, `A` add.
- Outcomes without a date (1–3, 7–9) log straight away with a 6-second Undo toast; outcomes 4–6 open the follow-up picker (times shown in the lead's time zone and yours).
- Focus ring: 2px `ring`, 2px offset, on every control. Motion ≤ 200ms, off under `prefers-reduced-motion`.
- Icons: one stroke set (Lucide in the app), 16px, 1.75 stroke.
