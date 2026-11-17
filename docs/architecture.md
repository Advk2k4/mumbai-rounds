# Architecture

Mumbai Rounds is a dependency-free, vanilla-JavaScript single-page app. There's no framework, bundler or package install. The source is split into small classic scripts under `src/js/` that share one global scope and load in a fixed order. `scripts/build.py` inlines everything into a single HTML file for publishing.

## Source layout

```
src/
├── index.html              Page shell and script load order
├── styles/app.css          Design tokens (light + dark), layout, components
└── js/
    ├── core/helpers.js     Formatting (₹, times, dates), haversine distance
    ├── data/
    │   ├── accounts.js     82 hospital/clinic accounts + 16 area clusters
    │   └── network.js      Rail & metro lines, station coordinates, routing graph
    ├── engine/
    │   ├── fares.js        Fare tables, road speeds, island-city / Navi Mumbai rules
    │   └── routing.js      Option builder: road modes + Dijkstra transit, scoring, tags
    ├── state/
    │   ├── storage.js      App state `S`, localStorage, synced database, plan autosave
    │   ├── sync.js         Offline-to-synced upload, backup codes
    │   ├── places.js       Accounts with the user's location fixes applied
    │   └── budget.js       Budget-cycle maths, trip logging
    └── ui/
        ├── components.js   Route strips, step lists, tag pills
        ├── trip.js         Trip tab
        ├── plan.js         Day plan tab (timeline, meeting checks, best visit order)
        ├── accounts.js     Accounts tab (clusters, "Please check", "Needs a location")
        ├── budget.js       Budget tab (KPIs, pace chart, breakdown, trip list)
        ├── settings.js     Settings tab (preferences, budget cycle, sync & backup)
        ├── sheet.js        Bottom sheet: location editor, add account, add expense
        └── app.js          Navigation, render loop, event delegation, boot
```

**Load order matters.** Each file's top-level `const`/`let` is visible to the later files. That's why `index.html` lists them explicitly, and why the build script concatenates them in the same order into one `<script>`.

## Rendering

- All state lives in one object, `S` (in `state/storage.js`).
- `render()` batches through `requestAnimationFrame`. It rebuilds `<main>` from the current tab's `render*()` function, which returns an HTML string. Every interpolated value goes through `esc()`.
- Events are delegated at `document` level:
  - `data-act="…"` → `ACT` handlers (clicks)
  - `data-ch="…"` → `CH` handlers (change events)
  - `data-in="…"` (search input)
- Route options are memoised in `OPT_CACHE`, keyed on endpoints, a 15-minute time slot, weekday or Sunday, and the preferences that affect scoring.

## Data and storage

The app runs in one of three modes, shown by the badge in the header:

| Badge | When | Where data goes |
|---|---|---|
| **Synced** | Published as a Claude artifact and the viewer can write | Claude artifact database (shared across devices) |
| **View only** | Published, but the viewer can't write (e.g. invited by link only) | This browser's `localStorage` |
| **This device only** | Opened as a plain file or on another host | This browser's `localStorage` |

When the artifact runtime is present (`window.claude.use('db')`), the app checks write access through `claude.use('user').can('data.write')` before it chooses a mode.

### Database documents

| Path | Contents |
|---|---|
| `config/prefs` | Home location, train class, priority, crowd preference, max walk, budget, work week, budget-cycle day, default visit length |
| `config/places` | `overrides` (location/area fixes per account id) and `custom` (accounts the user added) |
| `days/{YYYY-MM-DD}` | `{date, month, trips: [{id, t, from, to, mode, label, cost, parts}]}`. One doc per day keeps the store well under its 5,000-document cap. |
| `plans/{YYYY-MM-DD}` | `{date, start, ret, stops: [{id, meet, visit}], choice: {legIndex: optionKey}}` |

The `days` collection is queried by a `date` range covering the current cycle, the cycle on screen and the planned day's cycle. Writes to any one document are serialised, and the day plan autosaves 0.9 s after the last edit.

### Moving data between devices

- **Offline → synced:** if a device saved data locally before sync was available, the app offers a one-tap upload. Trips are merged by id and never duplicated.
- **Backup code:** Settings can export everything as an `MR1.`-prefixed base64 JSON string and import one on another device. This works even without sync.

## Building

```bash
python3 scripts/build.py               # dist/mumbai-rounds.html: artifact-ready fragment
python3 scripts/build.py --standalone  # dist/mumbai-rounds.standalone.html: full HTML document
```

`dist/` is git-ignored.
