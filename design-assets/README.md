# Passage Walk — Design assets for the dev team

## 1. App icon — `app-icon/`

The open Bible becoming a walking path, the same mark as the Splash and Welcome screens, in the client green theme.

| File | Size | Use |
|---|---|---|
| `passagewalk-app-icon.svg` | vector | Master file (full-bleed square). Export any other size from this. |
| `ios/AppIcon-1024.png` | 1024 × 1024 | iOS App Store / Xcode single-size app icon (square, no transparency — iOS rounds the corners). |
| `android/play-store-512.png` | 512 × 512 | Google Play Store listing icon. |
| `android/adaptive-foreground-432.png` + `.svg` | 432 × 432 | Android adaptive icon **foreground** layer (transparent, mark inside the safe zone). |
| `android/adaptive-background-432.png` + `.svg` | 432 × 432 | Android adaptive icon **background** layer (green gradient). |
| `web/icon-192.png`, `web/icon-512.png` | 192 / 512 | PWA / web manifest icons (rounded, transparent corners). |
| `web/apple-touch-icon-180.png` | 180 × 180 | iOS "Add to Home Screen" icon for the web build. |
| `passagewalk-app-icon-rounded.svg`, `passagewalk-app-icon-preview.png` | vector / 1024 | Rounded preview of the home-screen look (also used as the web favicon `public/favicon.svg`). |

**Icon colours**

| Part | Hex |
|---|---|
| Background gradient (145°) | `#34501e` → `#4f7029` (app `--app-hero-gradient`) |
| Bible pages | `#ffffff` (8% white fill) |
| Walking path | `#9ac268` |
| Footsteps | `#e7a83a` (app gold) |

Note: this is the app's current mark. If Kathy sends the final PassageWalk® logo, the icon will be replaced.

## 2. Fonts — all Google Fonts (free, SIL Open Font License)

| # | Font | Google Fonts link | Style / weights used | Where it is used |
|---|---|---|---|---|
| 1 | **DM Sans** | https://fonts.google.com/specimen/DM+Sans | Regular (normal) — 400, 500, 600, 700 | Main UI font: body text, buttons, labels, inputs, tabs, chips, small caps eyebrows, navigation. |
| 2 | **Newsreader** | https://fonts.google.com/specimen/Newsreader | **Italic only** — 400, 500 (optical size 6–72) | Editorial font: "Passage Walk" wordmark, page headings (e.g. *Walk With Purpose*), big numbers (day count, steps, %), Bible verse text, reflection / journal text, quotes. |
| 3 | **UnifrakturMaguntia** | https://fonts.google.com/specimen/UnifrakturMaguntia | Regular — 400 | Milestone certificate only: "Certificate of Completion" title and the day number seal. |

**Embed code (exactly what the prototype loads):**

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@1,6..72,400;1,6..72,500&family=UnifrakturMaguntia&display=swap" rel="stylesheet">
```

```css
--app-font-ui: "DM Sans", sans-serif;
--app-font-editorial: "Newsreader", serif;
```

**Notes for dev**

- Newsreader is loaded as italic only, so every Newsreader text in the app shows italic. That is the approved look.
- Some headings ask for Newsreader at weight 600 / 700. Only italic 400 / 500 are loaded, so the browser fakes the bold. For the real app, also bundle **Newsreader Italic 600 and 700** so those headings use real font files.
- For a native app (iOS / Android / React Native / Flutter), download the font files from each Google Fonts link above ("Get font" → "Download all") and bundle them.
- The downloadable certificate (SVG) also uses **Georgia** and **Arial**, which are system fonts, not Google Fonts.
