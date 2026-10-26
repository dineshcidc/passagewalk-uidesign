# Passage Walk

React + Vite + Tailwind CSS v4 mobile prototype. Originally generated in Figma Make; now a standalone project deployed to Vercel. Since 2026-10-21 this app is the only UI (source of truth) — Figma Make is no longer updated or matched.

## Commands

- `npx pnpm dev` — dev server on http://localhost:8443 (pnpm is not installed globally, so use `npx pnpm`)
- `npx pnpm typecheck` — TypeScript check
- `npx pnpm build` — typecheck + production build into `dist/`

Run typecheck + build after every change.

## Project structure

- `src/main.tsx` — React entry; imports `src/index.css` and mounts `src/App.tsx`
- `src/App.tsx` — renders `src/mobile/MobileApp.tsx` (Splash screen first)
- `src/index.css` — all styles and `--app-*` design tokens; kept identical to the Figma Make CSS plus a few local rules at the end
- `src/mobile/components/` — shared UI (`AppIcon`, `BottomNavigation`, `IOSDeviceFrame`, `HighlightedVersesCard`)
- `src/mobile/data/` — mock data and prototype-only stores: `journeyStore.ts` (active journey + per-type mock scenario, steps/reflections/highlights), `stepsRule.ts` (steps → book + chapter for every journey type), `experiences.ts` (Designed Experiences = Kathy's "Targeted books" list: 31 groups of books with the same chapter count, 2–150 days), `milestones.ts` (one cumulative milestone ladder for every journey: 1, 3, 7, 12, 21, 33, 40 … 365, plus the journey-complete badge), `bible.ts` (on-demand KJV Bible text), `progress.ts` (progress, milestones in Passage Walk days, totals every screen uses)
- `public/bible/kjv/NN.json` — public-domain King James Version (client choice), one file per book (verse counts in `data/bibleVerseCounts.ts`)
- `src/mobile/screens/<feature>/` — one folder per feature (onboarding, auth, setup, home, journey, journal, milestones, profile)

## Code quality

- Use double quotes for strings containing apostrophes (`"We're here to help"`), or escape them in single-quoted strings.
- Ensure JSX tags are closed and braces are balanced.
- Export components as default exports.
- New screens go in `src/mobile/screens/<feature>/` and copy class/spacing patterns from sibling screens.
- When changing mock data, keep the progress rule in `src/mobile/data/journeyStore.ts` (Days 1–2 complete, Day 3 missed, Day 4 pending, Day 5 today) consistent across all screens and every journey type (33-Day Walk, Designed Experience, Create a Journey: your books / whole Bible).
