# habitloop

[![CI](https://github.com/Dans-Vsa/habitloop/actions/workflows/ci.yml/badge.svg)](https://github.com/Dans-Vsa/habitloop/actions/workflows/ci.yml)
[![Deploy](https://github.com/Dans-Vsa/habitloop/actions/workflows/deploy.yml/badge.svg)](https://github.com/Dans-Vsa/habitloop/actions/workflows/deploy.yml)

A local-first daily habit tracker built with React and TypeScript. Add the habits you want to build, check them off once a day, and watch your streaks grow — everything is stored in your browser, with no account and no server.

**Live demo:** https://dans-vsa.github.io/habitloop/ — installable as an app and works offline after the first visit.

> Status: **v1.0.0** — all four milestones are done. See the [changelog](CHANGELOG.md).

## Features

- [x] Add habits with a name and a color (duplicate and empty names are rejected)
- [x] One-tap "done today" check for every habit
- [x] 7-day strip per habit — fix a missed check-in for any of the last seven days
- [x] Current streak (an unfinished today never breaks a streak) and best streak
- [x] Daily progress bar ("2 of 5 done")
- [x] Delete with inline confirmation
- [x] Data persisted in `localStorage`, validated on load (corrupt data never crashes the app)
- [x] Keyboard and screen-reader friendly controls (`aria-pressed`, labels, focus rings)
- [x] GitHub-style year heatmap for all habits combined (on the home screen) and per habit
- [x] Habit detail view: current / best streak, total check-ins, 30-day completion rate, history heatmap
- [x] Edit a habit's name and color (same validation as when adding)
- [x] Archive habits (history is kept, they leave the daily list) and restore them later
- [x] Reorder habits with move up / down buttons (order is saved)
- [x] Insights dashboard: completion rate for the last 7 / 30 days and all time, total check-ins, active days, top streak
- [x] Check-ins by weekday bar chart (SVG) and a per-habit table (goal, 30-day rate, streak)
- [x] Weekly goals — "every day" or 1–6× per week; streaks for weekly habits are counted in weeks
- [x] JSON export and import (merge into current habits or replace all), validated before anything changes
- [x] Storage schema v2 with automatic migration of data saved by earlier versions
- [x] Installable PWA (manifest, icons) with offline support via a build-generated service worker
- [x] Keyboard shortcuts with a help dialog (press `?`)
- [x] Unreadable stored data (corrupt, or from a newer version) is kept aside instead of overwritten
- [x] CI on every push (lint, typecheck, tests, build on Node 22 and 24) and automatic deploy to GitHub Pages

## Tech stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite 8](https://vite.dev) for dev server and builds
- [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) + jsdom for tests
- [oxlint](https://oxc.rs) for linting
- Plain CSS with design tokens from [`DESIGN.md`](DESIGN.md) (a Linear-inspired dark system)

No backend, no external APIs, no tracking.

## Getting started

Requires Node.js 20.19+ (tested on Node 25).

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint with oxlint |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build locally (service worker enabled) |
| `npm run icons` | Regenerate the PNG app icons in `public/icons/` |

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `N` | New habit (focuses the name field) |
| `1` – `9` | Check off / un-check the 1st – 9th habit for today |
| `T` / `I` | Go to Today / Insights |
| `?` | Show the shortcuts dialog |
| `Esc` | Close the dialog, or go back from a habit page |

Shortcuts are ignored while you type in a field and when Ctrl, Alt or ⌘ is held.

## Offline and install

The production build is a Progressive Web App:

- `public/manifest.webmanifest` + icons make it installable ("Install app" in Chrome / Edge, "Add to Home Screen" on mobile).
- A small Vite plugin ([`plugins/service-worker.ts`](plugins/service-worker.ts)) writes `sw.js` during `npm run build`, with the exact list of built files to precache and a cache name derived from their content. Page loads are network-first with the cached app shell as fallback, other files are cache-first (their names are content-hashed), and caches from older builds are deleted when a new version activates.
- The service worker is only registered in production builds, so `npm run dev` is never cached.

## Deployment

Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which tests, builds and publishes `dist/` to GitHub Pages. The Vite `base` is `./`, so the same build works at a domain root or under `/habitloop/`. To deploy a fork, enable **Settings → Pages → Source: GitHub Actions**.

## How streaks work

Each completion is stored as a local calendar day (`YYYY-MM-DD`), not a timestamp, so streaks do not shift with time zones or daylight-saving changes.

- **Current streak** counts consecutive completed days ending today. If today is not checked yet, it counts from yesterday — the streak only breaks once a full day is missed.
- **Best streak** is the longest run of consecutive days in the whole history.

### Weekly goals

On a habit's page you can change its **Goal** from *Every day* to *1–6× per week*. Weeks run Monday to Sunday.

- The home screen shows progress for the current week, e.g. `2/3 this week`.
- **Streaks are counted in weeks** that reached the goal. As with daily habits, the current week never breaks a streak while it is still going — it only adds to it once the goal is reached.
- Completion rates expect `goal ÷ 7` check-ins per day, and extra check-ins beyond the goal do not push a rate above 100%.

## Insights

The **Insights** tab sums up all active (non-archived) habits:

| Metric | Meaning |
| --- | --- |
| Last 7 / 30 days, All time | Check-ins compared with what each habit's goal asked for, counted only from the day the habit was created |
| Total check-ins | Every completed day across habits |
| Active days | Days with at least one check-in |
| Top streak | The longest streak that is still running, and which habit has it |

Below that are a **by weekday** chart (busiest day highlighted) and a **per-habit** table; click a habit name to open its page.

## Backups

Under **Insights → Backup**:

- **Export JSON** downloads `habitloop-backup-YYYY-MM-DD.json` with every habit, including archived ones.
- **Import JSON…** reads a backup (or raw data copied from `localStorage`), validates it, and asks before changing anything:
  - **Merge** — habits are matched by id, or else by name; matches keep their current name, color and goal and gain any missing check-ins. New habits are added at the end.
  - **Replace all** — your current habits are replaced by the file's.
- Invalid JSON, unrelated files, files from a newer habitloop version and files over 5 MB are rejected with a message, and nothing is changed.

## History heatmap

The heatmap shows the last 53 weeks, one column per week (Sunday to Saturday), like a GitHub contribution graph. Color intensity is relative to your busiest day in that range, in four steps. Hover a square to see the date and number of check-ins. On the home screen it combines all active habits; on a habit's page it uses that habit's color. On small screens the grid scrolls sideways and opens at the most recent weeks.

Click a habit's name to open its page, where you can also rename it, change its color, archive it or delete it. Archived habits are listed at the bottom of the home screen with a **Restore** button.

## Project structure

```
habitloop/
├── .github/workflows/        # CI and GitHub Pages deploy
├── plugins/
│   ├── service-worker.ts     # Vite plugin that generates sw.js with a precache list
│   └── sw-template.js        # Service worker source (offline caching)
├── public/
│   ├── favicon.svg
│   ├── icons/                # PNG app icons (generated by scripts/generate-icons.mjs)
│   └── manifest.webmanifest  # PWA manifest
├── scripts/generate-icons.mjs # Draws the PNG icons with plain Node (no dependencies)
├── src/
│   ├── App.tsx               # Page layout, Today / Insights tabs, detail view, shortcuts
│   ├── components/
│   │   ├── BackupPanel.tsx   # JSON export / import with merge-or-replace confirmation
│   │   ├── ColorPicker.tsx   # Shared color swatch radio group
│   │   ├── HabitDetail.tsx   # Habit page: stats, heatmap, edit name/color/goal, archive, delete
│   │   ├── HabitForm.tsx     # Add-habit form with validation and color picker
│   │   ├── HabitRow.tsx      # One habit: today check, 7-day strip, streaks, reorder, delete
│   │   ├── Heatmap.tsx       # SVG year heatmap
│   │   ├── Insights.tsx      # Stats dashboard
│   │   ├── ShortcutsHelp.tsx # Keyboard shortcuts dialog
│   │   └── WeekdayChart.tsx  # SVG bar chart of check-ins per weekday
│   ├── hooks/
│   │   ├── useHabits.ts      # Reducer + localStorage persistence
│   │   └── useShortcuts.ts   # Global keydown listener
│   ├── lib/
│   │   ├── backup.ts         # Backup file format, parsing and merging
│   │   ├── dates.ts          # Local date keys and calendar helpers
│   │   ├── download.ts       # Save text as a file in the browser
│   │   ├── habits.ts         # Habit model, streaks, completion rate, edit/archive/move
│   │   ├── heatmap.ts        # Calendar grid, per-day counts and intensity levels
│   │   ├── serviceWorker.ts  # Service worker registration (production only)
│   │   ├── shortcuts.ts      # Key → shortcut mapping
│   │   ├── stats.ts          # Completion rates, weekday counts, dashboard summary
│   │   ├── storage.ts        # Versioned, validated localStorage format + migrations
│   │   └── weekly.ts         # Weekly goals: weeks, per-week counts, week streaks
│   ├── test/setup.ts         # Test environment (jest-dom, in-memory storage)
│   └── index.css             # Design tokens and styles
├── CHANGELOG.md
├── DESIGN.md                 # Design system the UI follows
└── vite.config.ts            # Vite + Vitest config
```

## Data format

Habits are saved in `localStorage` under the `habitloop` key:

```json
{
  "version": 2,
  "habits": [
    { "id": "…", "name": "Read 20 pages", "color": "#5e6ad2", "createdOn": "2026-10-22", "completions": ["2026-10-22"] },
    { "id": "…", "name": "Gym", "color": "#27a644", "createdOn": "2026-10-01", "completions": ["2026-10-20"], "target": 3 },
    { "id": "…", "name": "Learn Japanese", "color": "#a46ad2", "createdOn": "2026-09-01", "completions": [], "archived": true }
  ]
}
```

The array order is the display order. `archived` (only written when `true`) and `target` (times per week, 1–6; missing means every day) are optional. Backup files use the same habit objects, wrapped as `{ "format": "habitloop-backup", "version": 2, "exportedAt": "…", "habits": [...] }`.

**Migrations:** v0.1/v0.2 stored schema version 1 under `habitloop:v1`. On first load habitloop reads that key, migrates the data (v1 habits become daily habits, nothing is dropped) and saves it under `habitloop` as version 2. Backup files from a newer version are rejected instead of being half-imported.

**Unreadable data:** if the stored value is corrupt JSON or was written by a newer habitloop, the app starts empty but first copies the raw value to `habitloop:unreadable` (only if that key is empty), so nothing is lost by opening an older build.

## Roadmap

1. **Core tracker** — habits, daily check-in, streaks, persistence ✅
2. **History** — year heatmap, habit detail view, edit / archive / reorder ✅
3. **Insights** — stats dashboard, weekly goals, JSON import / export ✅
4. **Ship** — PWA + offline, keyboard shortcuts, GitHub Pages deploy, CI, v1.0.0 ✅

Future ideas: optional reminders via the Notifications API, sync between devices through a user-provided file.

## Credits

`DESIGN.md` comes from [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (MIT). habitloop is not affiliated with Linear.

## License

[MIT](LICENSE) © Dans-Vsa
