# Tova's Bakery — Recipe Book 🥖

A **bake-mode-first**, local-first recipe book built as an installable PWA for the kitchen at
Tova's Bakery. It is designed for one job above all others: being genuinely usable with floury,
wet hands in a hot, low-light kitchen — the thing every recipe app gets asked for and most get wrong.

Built by **[Kim Consultant](https://kimconsultant.net)**.

---

## Why this exists

Competitive research across Paprika, Crouton, Mela, Recipe Keeper, Meez and the self-hosted crowd
landed on one conclusion: the feature that wins in a real bakery is a focused, screen-stays-awake,
big-text, low-touch **cooking view** — and the gaps users complain about most are exactly the things
this app makes first-class:

- **Wet/dry colour-coding** (the two-bowl method, made visual) — never colour alone.
- **"Combine these together"** ingredient grouping.
- **Reminder photos** per step (tray layouts, "where the X is stored").
- A **dedicated notes page** per recipe.
- **Grams-first** weighing with correct **baker's percentages** and **hydration**.

## Features

### Bake mode (the centrepiece)
- **Screen Wake Lock** auto-acquired on entry, released on exit, re-acquired on return to foreground,
  with a **NoSleep.js** fallback for older iOS.
- One step at a time in large serif type, **56 px+ tap targets**, **swipe** or big Back/Next buttons,
  plus keyboard arrows.
- **Inline step ingredients** — tap a name to reveal its (scaled) amount and check it off; a "Show g"
  toggle reveals every amount at once.
- **Check-off and current step are persisted to IndexedDB** — navigating away, backgrounding, or
  reopening never loses your place.
- Wet/dry rows carry a **warm/cool tint + icon + amount**, so the signal survives greyscale and
  colour-blindness (WCAG 1.4.1).

### Recipes
- **Grouped ingredients** with subsection headers and a "combine together" instruction chip.
- **Grams-first** model. **Baker's percentage** (flour anchored at 100%) and **hydration**
  (total liquid ÷ **sum of all flours**) shown and correct.
- **Scaling** two ways bakers think: by multiplier (½×–3×) or by typing the **target total flour
  weight**. Baker % is scale-invariant.
- **Reminder photos** per step + a cover photo, captured from the camera and **compressed** before
  being stored as Blobs in IndexedDB.
- A focused, autosaving **notes page** per recipe.

### Timers
- Times in step text become one-tap **"Start 12:00"** chips, **auto-named** from the step's verb
  ("Bake", "Proof", "Chill"); ranges start at the lower bound.
- A **Web Worker** keeps multiple concurrent timers accurate even when the tab is throttled.
- A persistent **HUD** shows every running timer; finished timers **chime + vibrate + notify**.
- A **"Phone timer"** fallback copies the duration, since the web can't reliably alarm from the
  background on iOS.

### Platform
- **Installable PWA**: web manifest + service worker (Workbox) → Add to Home Screen, full-screen,
  offline.
- `navigator.storage.persist()` requested so data survives storage pressure.
- **Adjustable text size**, dark-first palette tuned for kitchen readability.
- **Export / import** everything (recipes, notes, photos) as a single JSON file — no lock-in.

## Tech stack

React 19 · Vite · TypeScript (strict) · Tailwind v4 · Motion · IndexedDB (`idb`) · vite-plugin-pwa ·
NoSleep.js. No backend required — it runs entirely on-device.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck (tsc -b) + production build to /dist
npm run preview    # serve the production build (service worker active here)
```

Icons are generated with no native dependencies:

```bash
node scripts/gen-icons.mjs   # regenerate /public/*.png from the embedded design
```

## Architecture

```
src/
  types/recipe.ts        Clean, serialisable data model (Railway-ready)
  db/                    IndexedDB (idb) + photo Blob storage/compression + object-URL cache
  lib/                   Baker's math, timer parsing, formatting, backup, text scale, seed data
  hooks/                 Wake lock, install prompt, bake progress, swipe, text size, persistence
  context/               RecipesProvider (store) + TimerProvider (Web Worker + HUD)
  workers/timer.worker.ts  Drift-free multi-timer ticker
  components/            Accessible UI (wet/dry cards, scale controls, timer HUD, photos…)
  pages/                 Cookbook · Recipe · Bake mode · Notes · Editor · Settings
```

### Data & the road to Railway
Recipes are stored as plain JSON in IndexedDB; images are Blobs keyed by recipe. The model maps 1:1
to a future document/Postgres schema, so a Railway backend can be added later as an **enhancement,
not a dependency** — add a sync layer (per-record timestamps), push images to object storage, and
keep local Blobs as cache. The app stays offline-first.

## iOS notes (the binding constraint)
- **Install to the Home Screen is mandatory.** Uninstalled-Safari, script-created storage is deleted
  after 7 days of no interaction; home-screen apps run a separate counter and are exempt.
- **Wake Lock** works in installed Home Screen web apps from **iOS/iPadOS 18.4+**; the NoSleep.js
  fallback covers older versions.
- Background timers/notifications are limited — the in-app chime + HUD and the phone-timer handoff
  are there for that reason. Test on the actual phone used at Tova's.

## Roadmap
- **Stage 1 (this MVP):** prove the kitchen experience, local-only. ✅
- **Stage 2:** more concurrent-timer polish, recipe duplicate/reorder, search/tags refinements, haptics.
- **Stage 3:** optional Railway account + multi-device sync + image object storage.

---

© Kim Consultant. Internal tool for Tova's Bakery.
