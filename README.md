# Passage Walk

Clickable mobile prototype for **Passage Walk** — a 33-day journey that combines daily step tracking with Bible chapter readings, verse highlights and personal reflections.

Front-end only: there is no backend, and all data is mock data in `src/mobile/data/`.

## Tech

React 19 · TypeScript · Vite · Tailwind CSS v4 (global styles in `src/index.css`)

## Run locally

Requires Node 22 and pnpm (or `npx pnpm`).

```bash
pnpm install
pnpm dev         # http://localhost:8443
pnpm typecheck   # TypeScript check
pnpm build       # typecheck + production build into dist/
pnpm preview     # serve the production build
```

## Deploy (Vercel)

Import the GitHub repo in Vercel. It detects Vite and pnpm automatically:

- Build command: `pnpm build`
- Output directory: `dist`

## Project structure

```
src/
  main.tsx               React entry
  App.tsx                Opens the mobile app (Splash screen first)
  index.css              All styles + design tokens (--app-*), kept in sync with the Figma Make design
  mobile/
    MobileApp.tsx        Splash → onboarding → auth → journey setup → main tabs
    components/          AppIcon, BottomNavigation, IOSDeviceFrame, HighlightedVersesCard
    data/                Mock data + prototype stores (chapters, journal, progress, reflections, bibleBooks, user)
    screens/
      onboarding/        Splash, onboarding slides
      auth/              Log in, sign up, forgot password
      setup/             First-time journey setup (choose → book → chapters)
      home/              Home dashboard + daily flow (steps → passage → reading → reflection)
      journey/           My Journey calendar + day details
      journal/           Journal entries + My Highlights
      milestones/        Milestones & badges + certificate
      profile/           Profile menu, settings, reminders, help, legal pages
    types.ts
```

## Mock progress rule

Today is Day 5 (Oct 4, 2026, steps not entered). Days 1–2 are complete, Day 3 was missed, and Day 4 has steps entered with its reflection pending. All screens read from `src/mobile/data/progress.ts`, so the numbers stay consistent everywhere.
