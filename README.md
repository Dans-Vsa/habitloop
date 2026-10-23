# habitloop

A local-first daily habit tracker built with React and TypeScript. Add the habits you want to build, check them off once a day, and watch your streaks grow — everything is stored in your browser, with no account and no server.

> Status: **v0.2.0 — milestone 2 of 4.** The tracker, year heatmap and habit detail view work; stats and offline/PWA support are on the roadmap below.

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
- [ ] Stats dashboard (completion rate, weekday breakdown)
- [ ] Weekly targets (e.g. 3× per week)
- [ ] JSON import / export
- [ ] Installable PWA with offline support, deployed to GitHub Pages

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
| `npm run preview` | Serve the production build locally |

## How streaks work

Each completion is stored as a local calendar day (`YYYY-MM-DD`), not a timestamp, so streaks do not shift with time zones or daylight-saving changes.

- **Current streak** counts consecutive completed days ending today. If today is not checked yet, it counts from yesterday — the streak only breaks once a full day is missed.
- **Best streak** is the longest run of consecutive days in the whole history.

## History heatmap

The heatmap shows the last 53 weeks, one column per week (Sunday to Saturday), like a GitHub contribution graph. Color intensity is relative to your busiest day in that range, in four steps. Hover a square to see the date and number of check-ins. On the home screen it combines all active habits; on a habit's page it uses that habit's color. On small screens the grid scrolls sideways and opens at the most recent weeks.

Click a habit's name to open its page, where you can also rename it, change its color, archive it or delete it. Archived habits are listed at the bottom of the home screen with a **Restore** button.

## Project structure

```
habitloop/
├── public/favicon.svg
├── src/
│   ├── App.tsx               # Page layout, list/detail view switch, archived list
│   ├── components/
│   │   ├── ColorPicker.tsx   # Shared color swatch radio group
│   │   ├── HabitDetail.tsx   # Habit page: stats, heatmap, edit, archive, delete
│   │   ├── HabitForm.tsx     # Add-habit form with validation and color picker
│   │   ├── HabitRow.tsx      # One habit: today check, 7-day strip, streaks, reorder, delete
│   │   └── Heatmap.tsx       # SVG year heatmap
│   ├── hooks/useHabits.ts    # Reducer + localStorage persistence
│   ├── lib/
│   │   ├── dates.ts          # Local date keys and calendar helpers
│   │   ├── habits.ts         # Habit model, streaks, completion rate, edit/archive/move
│   │   ├── heatmap.ts        # Calendar grid, per-day counts and intensity levels
│   │   └── storage.ts        # Versioned, validated localStorage format
│   ├── test/setup.ts         # Test environment (jest-dom, in-memory storage)
│   └── index.css             # Design tokens and styles
├── DESIGN.md                 # Design system the UI follows
└── vite.config.ts            # Vite + Vitest config
```

## Data format

Habits are saved under the `habitloop:v1` key:

```json
{
  "version": 1,
  "habits": [
    { "id": "…", "name": "Read 20 pages", "color": "#5e6ad2", "createdOn": "2026-10-22", "completions": ["2026-10-22"] },
    { "id": "…", "name": "Learn Japanese", "color": "#a46ad2", "createdOn": "2026-09-01", "completions": [], "archived": true }
  ]
}
```

The array order is the display order. `archived` is optional and only written when `true`, so data saved by v0.1.0 loads unchanged.

## Roadmap

1. **Core tracker** — habits, daily check-in, streaks, persistence ✅
2. **History** — year heatmap, habit detail view, edit / archive / reorder ✅
3. **Insights** — stats dashboard, weekly targets, JSON import / export
4. **Ship** — PWA + offline, GitHub Pages deploy, CI, v1.0.0

## Credits

`DESIGN.md` comes from [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (MIT). habitloop is not affiliated with Linear.

## License

[MIT](LICENSE) © Dans-Vsa
