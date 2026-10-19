# Passage Walk — Project Overview

## App enna? (Purpose)

**Passage Walk** oru **33-day devotional mobile app** (iOS & Android).
Simple idea: **Nadakkura steps + Bible scripture + reflection**.

Daily routine idhu dhaan:
1. Indaiku evlo steps nadandhom nu enter pannuvom
2. Andha steps vachu oru **Bible passage** varum
3. Passage padippom
4. Private journal la **reflection** ezhudhuvom
5. Day complete → progress update → **milestones** (Day 3, 7, 14, 21) unlock aagum

Goal: 33 days la oru **daily devotional habit** build pannradhu. Social feed, Apple Health, public profile — idhellam **MVP la illa**.

---

## Namma enna build pannirukom?

Idhu **UI prototype** — backend, database, real login illa. Ella data um **hardcoded** (user "Dinesh", passage "John 3:16" maadhiri). Client ku flow & design kaatradhuku dhaan idhu.

Rendu part irukku:

| Part | Enna | Eppadi open panradhu |
|---|---|---|
| **Project Brief** | Stakeholder web page — overview, colors, fonts, screen list, MVP scope, open decisions | `http://localhost:8443` |
| **Mobile App** | iPhone frame kulla clickable app prototype | `http://localhost:8443` (Splash screen first; stakeholder brief 2026-10-14 remove pannom) |

---

## Full Flow — Splash to Logout

```
Splash (2.6 sec auto)
  → Onboarding 1: Walk With Purpose
  → Onboarding 2: Your Steps, Your Scripture
  → Onboarding 3: A 33-Day Journey
      ├─ "Get Started"          → Login
      └─ "Create an account"    → Sign Up

Login  ⇄  Sign Up
Login → Forgot Password → Reset Password → Login (success message oda)

Login / Sign Up submit → Journey Setup
  01 Choose journey
      ├─ Automatic Journey        → direct ah Home
      └─ Choose Your Own Journey  → 02 Select Bible Book → 03 Chapter range → Home

Main App (Bottom Nav: Home · Journey · Journal · Milestones · Profile)
```

### 🏠 Home
- Day 5 of 33 progress, today's steps, next milestone
- **Enter Steps** → keypad la steps type → *Generate My Passage* → "Finding passage" loading (5 sec) → **Passage Ready**
  - **Read Scripture** → reading page (copy, bookmark) → Write Reflection
  - **Write Reflection** → 3 questions → Save → **Reflection Saved** success → Back to Home
- Scripture card click → direct ah reading page
- Pending reflections list → direct ah reflection page

### 🗺️ Journey
- 33-day calendar, week by week (complete / missed / today / upcoming)
- Completed day click → steps, reading, reflection details
- **Missed day** click → *Enter Steps* (catch-up) or *Add Reason* popup

### 📓 Journal
- Filter: All / Completed / In progress
- Entry click → date, steps, passage, 3 reflection answers

### 🏅 Milestones
- Day 3, 7 unlocked; Day 14, 21 locked
- Unlocked badge click → celebration page + **certificate** + *Download Certificate* (SVG file)

### 👤 Profile
- **My Profile** → Edit name, email, photo
- **Reminders** → Scripture & Reflection reminder on/off + time
- **Settings** → Journey type change (Automatic ⇄ Choose Your Own). Choose Your Own select pannina → same setup design la Book → Chapter range → *Update My Journey*
- **Help & Support** → FAQs, Contact Support (email), Report a Problem
- **About** → app version
- **Terms and Privacy** → Terms of Use, Privacy Policy
- **Log out** → confirm popup → "Logging out..." → **Login screen** ku pogum ✅

---

## Design System (pudhu screen panna idhu follow pannanum)

| Token | Color | Use |
|---|---|---|
| Primary (Teal) | `#2A908F` | Buttons, active states |
| Deep Navy | `#172A46` | Text |
| Light Teal | `#E6F5F2` | Soft background |
| Cream | `#F8F6F1` | App background |
| Success | `#34A76D` | Completed |
| Accent Gold | `#E7A83A` | Milestones, rewards |

Fonts: **DM Sans** (UI) + **Newsreader** italic (headings, scripture).

---

## Folder Structure

```
src/
  App.tsx                 → Brief ah, Mobile App ah nu decide pannum
  index.css               → Ella styles um inga (design tokens top la)
  mobile/
    MobileApp.tsx         → Splash → Onboarding start
    types.ts              → JourneyType, MainTab
    components/           → AppIcon, BottomNavigation, IOSDeviceFrame
    data/                 → bibleBooks, chapters, journal, progress, reflections, user photo
    screens/
      onboarding/         → Splash, Onboarding
      auth/               → Login, Sign Up, Forgot, Reset
      setup/              → Journey Setup (choose / book / range)
      home/               → Home, Daily flow (steps → passage → reading → reflection)
      journey/            → 33-day calendar, day details
      journal/            → Journal list, entry details
      milestones/         → Badges, certificate
      profile/            → Profile + ella sub pages
```

**Run panna:** `npx pnpm dev` → browser la `http://localhost:8443`

---

## Gavanikka vendiyadhu (Prototype limits)

Flow check panna podhu idhellam note pannen — client kitta kaatum podhu therinjirukanum:

- **Real data illa** — login la edhu type pannalum ulla pogum, save panna data refresh panna pogidum.
- **Plan la irukka, aana build pannala:** Account Setup / Basic Profile, Journey Introduction, Automatic Journey Intro, Journey Confirmation, Mark Day Complete screen.
- **Bottom nav** la "Milestones" irukku — brief la "Progress" nu irukku. Client kitta confirm pannanum.
- **Work aagadha buttons:** Journal entry la Edit / Share / Delete, "Continue Reflection", Journey day la "Write Reflection", calendar month arrows, Profile main page camera icon.
- Journey calendar header **"September"** nu kaatum, aana days Sep 30 – Nov 1 varaikkum pogum.
- Login page la **Back** arrow → Sign Up ku pogum (Onboarding ku illa).
- Logout pannitu thirumba login panna, **Journey Setup thirumba varum**.
