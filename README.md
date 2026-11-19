<div align="center">
  <img src="public/icons/icon.svg" alt="PulseTrack icon" width="80" height="80" />
  <h1>PulseTrack</h1>
  <p>A self-hosted workout tracker for building a consistent routine.</p>
  <p>Weekly sessions · Distance goals · Subscription costs · Progress charts</p>
</div>

---

PulseTrack is a responsive React app that keeps your workout history in your browser. Track multiple sports, review your progress, and see what each session costs—without an account or a backend.

## Features

- **Weekly workout tracker** — log sessions by day across multiple sports, with swipe navigation between weeks.
- **Session options** — hold a checked day (or right-click / Shift+F10) to highlight the session or exclude its payment. Tapping a session with an entered distance asks for confirmation before removing it; distance edits save immediately.
- **Earned medals** — sport-specific weekly miniature strips, a continuous scrolling interactive collection, a rotating full-size inspector, and a Stats collection with dated repeat counts. Daily, weekly, and monthly streak medals plus weekly, monthly, yearly, lifetime, and special awards are calculated from saved workouts. Yoga Day is not included.
- **Custom sports** — add sports in Settings to use them in the tracker and subscription selectors.
- **Optional distance tracking** — record metres per session and explore totals and rolling averages.
- **Weekly distance goals** — set goals per sport, with goal history used for past weeks.
- **Subscription cost tracker** — compare cost per session, follow break-even progress, and archive subscription periods while keeping lifetime statistics.
- **Progress dashboard** — explore workout charts, a monthly calendar, and exercise breakdowns with sport and date-range filters.
- **Workout export and restore** — download or share workout logs as JSON, merge or replace logs from a backup, and export an Excel-readable `.xls` table.
- **Mobile-friendly PWA** — home-screen installation where supported, cached offline access, and dark mode that follows your system.

## Quick start

Use **Node.js 22 or 24 LTS** and npm. No environment variables, database, or API keys are required.

```bash
git clone https://github.com/hadabalazs/PulseTrack.git
cd PulseTrack
npm ci
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

### Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Build the production app into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Check the source files covered by the ESLint configuration |
| `npm run lint:fix` | Apply automatic ESLint fixes |
| `npm run typecheck` | Run the existing JavaScript type checks; see development notes below |

## Project structure

```text
PulseTrack/
├── .github/workflows/ci.yml # Automated build and lint checks
├── .nvmrc                  # Node.js version for development and CI
├── public/
│   ├── icons/              # App icon
│   ├── manifest.json       # PWA name, appearance, and launch settings
│   └── sw.js               # Service worker and offline cache
├── src/
│   ├── components/
│   │   ├── layout/         # Shared navigation and app shell
│   │   ├── stats/          # Charts, goals, calendar, and exports
│   │   ├── tracker/        # Weekly logging and subscription tracking
│   │   └── ui/             # Reusable interface primitives
│   ├── hooks/              # Shared React hooks
│   ├── lib/                # Local storage, dates, and app state
│   ├── pages/              # Weekly tracker, statistics, and settings
│   ├── App.jsx             # Routes and system theme handling
│   ├── main.jsx            # App entry point and service worker registration
│   └── index.css           # Theme and global styles
├── index.html              # HTML entry point
├── package.json            # Dependencies and development commands
├── package-lock.json       # Reproducible npm dependency versions
├── vite.config.js          # Vite and source aliases
├── tailwind.config.js      # Design tokens and Tailwind configuration
├── postcss.config.js       # CSS processing
├── eslint.config.js        # Lint rules
├── jsconfig.json           # JavaScript type checking and editor aliases
└── netlify.toml            # Build settings and SPA redirects
```

## Data and backups

Data is stored in your browser's `localStorage`, separately for each site origin and browser profile. There is no account system or automatic sync between devices.

| Storage key | Contents |
| --- | --- |
| `workout_tracker_logs` | Logged workout sessions |
| `pulsetrack_app_settings` | Preferences, weekly goal history, and filters |
| `pulsetrack_cost_tracker` | Subscriptions and archived periods |
| `pulsetrack_tracker_sports` | Sports displayed on the tracker |
| `pulsetrack_custom_sports` | Custom sports added in Settings |

**JSON backups contain workout logs only.** Preferences, goal history, subscriptions, tracker sports, and custom sport lists are not included. In Settings, **Merge** adds logs with new IDs; **Replace** replaces the workout log list. **Clear All Data** currently clears workout logs only.

Clearing browser site data removes the stored data. Moving to another domain or browser does not transfer it. Keep backups of workout logs you want to retain.

Workout data stays in the browser. The app loads its fonts from Google Fonts, so it makes external font requests when online.

Streak medals progress from bronze to platinum: daily streaks of 3/7/14/30 active days, weekly streaks of 4/8/12/26/52 active Monday–Sunday weeks, and monthly streaks of 3/6/12/18/24 active calendar months. Weekly and monthly streaks require at least one workout in each period. They are evaluated for each sport and across all sports; each threshold is awarded once per uninterrupted run and can repeat after a gap. Existing history is included. The Stats collection shows all unlocked medals and counts without filters or explanatory copy.

Medal eligibility is derived from workout history rather than stored as a separate ledger, so log backups also restore eligible medals. Counts represent distinct qualifying periods, with separate medals for each sport and threshold. Editing or removing the supporting workouts recalculates awards. Highlighting and excluding a payment do not affect qualification. Existing history is credited quietly, without a queue of old award popups.

## Install and use offline

Open the deployed app over HTTPS and use your browser's install or **Add to Home Screen** option, where available. Visit the pages you need while online first: the service worker caches same-origin resources as they are requested. A page or asset that has not been cached may still require a connection; external fonts are not cached by this service worker.

For a local production preview:

```bash
npm run build
npm run preview
```

Service workers can retain earlier files during development. If an old version appears, unregister the service worker in browser developer tools and reload. Avoid clearing local storage unless you intend to remove your workout data.

Medal thumbnails are bundled locally. Bronze, silver, gold, and platinum finishes follow challenge difficulty; distance tiers follow each sport’s own ladder. Three.js is a separate lazy-loaded chunk fetched only when opening an interactive view. Once visited online, that view can work offline. An uncached renderer or unavailable WebGL falls back to medal images, names, counts, and rules. No API key, paid service, or external 3D app is required.

## Deployment

### Netlify

Import this repository into Netlify. The included `netlify.toml` configures:

- Build command: `npm run build`
- Publish directory: `dist`
- SPA fallback: all application routes serve `index.html`

You can also build locally and upload the `dist/` folder to Netlify.

### Other static hosts

Publish `dist/` over HTTPS and configure a fallback to `index.html` for routes such as `/stats` and `/settings`. The app currently assumes it is served at the domain root. Deployment under a subpath, such as a GitHub Pages project URL, requires changes to Vite's base path, routing, and PWA asset paths.

## Built with

React 18 · Vite 6 · Tailwind CSS 3 · React Router · Recharts · date-fns · Radix UI · Vaul · Lucide

## Development notes

The app uses JavaScript and JSX. The existing `typecheck` command is a work in progress, with limited coverage and outstanding typing errors; it is not a passing release gate. Production builds use Vite. GitHub Actions runs the build and lint checks on pushes to `main` and on pull requests.

To contribute, keep changes focused, run the build and lint checks, and describe how you verified changes to workout logging or stored data. Report bugs and suggest improvements through [GitHub Issues](https://github.com/hadabalazs/PulseTrack/issues).

### Medal assets and browser checks

`npm test` includes deterministic award and session-intent tests. Additional browser checks use an existing Playwright installation and Chrome; they never touch your normal browser profile or real workout data. Set `PULSETRACK_PLAYWRIGHT_MODULE` to the installed Playwright module's absolute path if it is outside this project.

- With the development server running on port 5173: `npm run test:browser`.
- With a production preview running on port 5174: `npm run test:offline`.
- With the development server running: `npm run render:medals` regenerates all posters from the same geometry/materials as the interactive renderer.

The scripts accept a preview URL as an additional argument. Browser screenshots default to a temporary `pulsetrack-session-medals` folder; set `PULSETRACK_SCREENSHOTS` to choose a destination. The medal renderer is demand-driven, with drag and keyboard arrow rotation, viewport-sized rendering, resource cleanup on close, and a fresh-context retry after WebGL loss.
