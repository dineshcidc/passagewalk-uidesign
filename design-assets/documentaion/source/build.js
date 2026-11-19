// Builds "Passage Walk – Frontend (UI) Documentation" as .docx (docx-js).
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Header, Footer, AlignmentType, HeadingLevel, LevelFormat,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, PageBreak, TableOfContents, PageNumber,
  VerticalAlign, TabStopType, TableLayoutType,
} = require("docx");

const D = __dirname;
const OUT = process.argv[2] || path.join(D, "PassageWalk-Frontend-Documentation.docx");

// ---------- brand ----------
const C = {
  green: "4F7029", greenDeep: "34501E", greenTint: "EFF5E8", greenLine: "C9D9B4",
  gold: "B8860B", goldSoft: "FBF3DF", ink: "1C2619", grey: "5F625E", line: "DADDD8", navy: "2A2C3E",
};
const SERIF = "Georgia";
const SANS = "Calibri";
const PAGE_W = 11906, MARGIN = 1247; // A4, 0.87"
const TEXT_W = PAGE_W - MARGIN * 2; // 9412 DXA

// ---------- helpers ----------
let numInstance = 0;
const runs = (text, base = {}) =>
  String(text).split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((part) =>
    part.startsWith("**") ? new TextRun({ ...base, text: part.slice(2, -2), bold: true }) : new TextRun({ ...base, text: part }));
const p = (text, opts = {}) => new Paragraph({ children: runs(text, opts.run), keepNext: /:$/.test(text), spacing: { after: 140, line: 300 }, ...opts.para });
const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)], pageBreakBefore: true });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
const h3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] });
const bullets = (items, level = 0) => items.flatMap((item) =>
  Array.isArray(item) ? bullets(item, level + 1)
    : [new Paragraph({ numbering: { reference: "bullets", level }, children: runs(item), spacing: { after: 70, line: 288 } })]);
const steps = (items) => {
  const instance = ++numInstance;
  return items.map((item) => new Paragraph({ numbering: { reference: "steps", level: 0, instance }, children: runs(item), spacing: { after: 70, line: 288 } }));
};
const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none };
const thin = (color = C.line) => ({ style: BorderStyle.SINGLE, size: 4, color });

// Data table: header row in green, light rows.
function table(head, rows, widths) {
  const total = widths.reduce((a, b) => a + b, 0);
  const cell = (text, i, isHead, shade, last = false) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, color: "auto", fill: isHead ? C.green : shade ? "F6F8F3" : "FFFFFF" },
    margins: { top: 90, bottom: 90, left: 130, right: 130 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ keepNext: !last, spacing: { after: 0, line: 270 }, children: runs(text, isHead ? { bold: true, color: "FFFFFF", size: 20 } : { size: 20 }) })],
  });
  return new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED,
    borders: { top: thin(C.greenLine), bottom: thin(C.greenLine), left: thin(C.greenLine), right: thin(C.greenLine), insideHorizontal: thin(C.line), insideVertical: thin(C.line) },
    rows: [
      new TableRow({ tableHeader: true, children: head.map((t, i) => cell(t, i, true)) }),
      ...rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((t, i) => cell(t, i, false, ri % 2 === 1, ri === rows.length - 1)) })),
    ],
  });
}
const gap = (after = 120) => new Paragraph({ spacing: { after, before: 0 }, children: [] });

// Callout: one-cell box, green tint with a green left rule.
function note(label, text, tone = "green") {
  const fill = tone === "gold" ? C.goldSoft : C.greenTint;
  const rule = tone === "gold" ? "D9A62E" : C.green;
  return new Table({
    width: { size: TEXT_W, type: WidthType.DXA }, columnWidths: [TEXT_W], layout: TableLayoutType.FIXED,
    borders: { top: none, bottom: none, right: none, left: { style: BorderStyle.SINGLE, size: 24, color: rule }, insideHorizontal: none, insideVertical: none },
    rows: [new TableRow({ cantSplit: true, children: [new TableCell({
      width: { size: TEXT_W, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, color: "auto", fill },
      margins: { top: 140, bottom: 140, left: 220, right: 220 },
      children: [new Paragraph({ spacing: { after: 0, line: 290 }, children: [
        new TextRun({ text: label.toUpperCase() + "   ", bold: true, size: 17, color: tone === "gold" ? "8A6410" : C.green, characterSpacing: 20 }),
        ...runs(text, { size: 21 })] })],
    })] })],
  });
}

// Phone screenshots in a row, each with an outline and a caption under it.
const SHOT_W = 150; // px at 96 dpi ≈ 1.75"
const SHOT_H = Math.round(SHOT_W * 1564 / 744);
function shots(list) {
  const cols = 3;
  const colW = Math.floor(TEXT_W / cols);
  const cells = list.map(([file, caption]) => new TableCell({
    width: { size: colW, type: WidthType.DXA }, borders: { top: none, bottom: none, left: none, right: none },
    margins: { top: 60, bottom: 60, left: 60, right: 60 },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new ImageRun({
        type: "jpg", data: fs.readFileSync(path.join(D, "shots", file + ".jpg")),
        transformation: { width: SHOT_W, height: SHOT_H }, altText: { title: caption, description: caption, name: file },
        outline: { type: "solidFill", solidFillType: "rgb", value: "D5D9D2" },
      })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: caption, size: 17, color: C.grey, italics: true })] }),
    ],
  }));
  while (cells.length < cols) cells.push(new TableCell({ width: { size: colW, type: WidthType.DXA }, borders: { top: none, bottom: none, left: none, right: none }, children: [new Paragraph("")] }));
  return [new Table({
    width: { size: colW * cols, type: WidthType.DXA }, columnWidths: Array(cols).fill(colW), layout: TableLayoutType.FIXED,
    alignment: AlignmentType.CENTER, borders: noBorders,
    rows: [new TableRow({ cantSplit: true, children: cells })],
  }), gap(160)];
}

// ---------- cover ----------
function coverStrip() {
  const files = ["13-home", "18-passage", "20-reading2", "27-milestones"]; const w = 104, h = Math.round(w * 1564 / 744), colW = 1900;
  return new Table({ width: { size: colW * files.length, type: WidthType.DXA }, columnWidths: files.map(() => colW), layout: TableLayoutType.FIXED, borders: noBorders,
    rows: [new TableRow({ children: files.map((f) => new TableCell({ width: { size: colW, type: WidthType.DXA }, borders: { top: none, bottom: none, left: none, right: none }, margins: { left: 0, right: 0, top: 0, bottom: 0 },
      children: [new Paragraph({ spacing: { after: 0 }, children: [new ImageRun({ type: "jpg", data: fs.readFileSync(path.join(D, "shots", f + ".jpg")), transformation: { width: w, height: h }, altText: { title: f, description: "App screen", name: "cover-" + f }, outline: { type: "solidFill", solidFillType: "rgb", value: "D5D9D2" } })] })] })) })] });
}
const concertLogo = fs.readFileSync(path.join(D, "concert-logo.png"));
const pwIcon = fs.readFileSync(path.join(D, "pw-icon.png"));
const metaRow = (k, v) => new TableRow({ children: [
  new TableCell({ width: { size: 2300, type: WidthType.DXA }, borders: { top: none, left: none, right: none, bottom: thin(C.line) }, margins: { top: 90, bottom: 90, left: 0, right: 100 },
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: k.toUpperCase(), size: 16, bold: true, color: C.grey, characterSpacing: 30 })] })] }),
  new TableCell({ width: { size: 4300, type: WidthType.DXA }, borders: { top: none, left: none, right: none, bottom: thin(C.line) }, margins: { top: 90, bottom: 90, left: 100, right: 0 },
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: v, size: 21, color: C.ink })] })] }),
] });
const cover = [
  new Paragraph({ spacing: { before: 0, after: 0 }, children: [new ImageRun({ type: "png", data: concertLogo, transformation: { width: 96, height: 73 }, altText: { title: "ConcertIDC", description: "ConcertIDC logo", name: "concertidc" } })] }),
  new Paragraph({ spacing: { before: 900, after: 260 }, children: [new ImageRun({ type: "png", data: pwIcon, transformation: { width: 104, height: 104 }, altText: { title: "Passage Walk", description: "Passage Walk app icon", name: "passagewalk" } })] }),
  new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "MOBILE APP  ·  FRONTEND (UI) DOCUMENTATION", font: SANS, size: 20, bold: true, color: C.gold, characterSpacing: 60 })] }),
  new Paragraph({ spacing: { after: 120, line: 240 }, children: [new TextRun({ text: "Passage Walk", font: SERIF, size: 84, italics: true, color: C.greenDeep })] }),
  new Paragraph({ spacing: { after: 160 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: "D9A62E", space: 12 } }, indent: { right: 5200 }, children: [] }),
  new Paragraph({ spacing: { after: 360, line: 320 }, children: [new TextRun({ text: "Walk. Read. Reflect. A guide to every screen, flow and rule in the Passage Walk mobile app — from the splash screen to the end of a journey.", font: SANS, size: 24, color: C.grey })] }),
  coverStrip(),
  gap(300),
  new Table({ width: { size: 6600, type: WidthType.DXA }, columnWidths: [2300, 4300], layout: TableLayoutType.FIXED, borders: noBorders, rows: [
    metaRow("Prepared by", "ConcertIDC"),
    metaRow("Product", "Passage Walk — iOS & Android mobile app"),
    metaRow("Document", "Frontend (UI) Documentation"),
    metaRow("Version", "1.0"),
    metaRow("Date", "November 19, 2026"),
  ] }),
];

// ---------- content ----------
const body = [];
const add = (...x) => body.push(...x.flat());

// Contents
add(
  new Paragraph({ pageBreakBefore: true, spacing: { after: 300 }, children: [new TextRun({ text: "Contents", font: SERIF, size: 44, italics: true, color: C.greenDeep })] }),
  new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-1" }),
);

// 1
add(
  h1("1. Introduction"),
  h2("1.1 Purpose of this document"),
  p("This document describes the frontend (user interface) of the **Passage Walk** mobile app. It walks through every screen in the order a user meets it, explains what each screen shows, and sets out the rules behind the screens — how steps choose the day's scripture, how progress is counted, and how milestones are earned."),
  p("It is written for the client team, product owners and the development team, and can be used as a shared reference for review, testing and future planning."),
  h2("1.2 About Passage Walk"),
  p("Passage Walk is a daily devotional app that connects physical movement with scripture. Each day the user walks, enters their step count, and the steps choose that day's Bible passage. The user reads the passage, highlights the verses that speak to them, writes a short reflection, and earns milestones as the days add up."),
  note("In one line", "**Walk** — enter today's steps.  **Read** — your steps unlock today's scripture.  **Reflect** — highlight a verse and write what God placed on your heart."),
  gap(),
  h2("1.3 Who the app is for"),
  bullets([
    "People who want a simple, steady daily rhythm of movement, scripture and reflection.",
    "Readers who want a guided path — a fixed 33-day walk, a designed experience, or a journey they build themselves.",
    "Users who are motivated by visible progress: a journey calendar, a personal journal, badges and certificates.",
  ]),
);

// 2
add(
  h1("2. Application Overview"),
  h2("2.1 Technology"),
  table(["Area", "Detail"], [
    ["Frontend", "React 19 with TypeScript"],
    ["Build tool", "Vite"],
    ["Styling", "Tailwind CSS v4 plus a shared set of design tokens (colours, type, spacing)"],
    ["Layout", "Mobile-first, designed at iPhone size (390 × 844) and shown inside a device frame on desktop"],
    ["Scripture text", "King James Version (public domain), loaded one book at a time"],
    ["Data", "Prototype data stores for the user, the active journey, steps, reflections, highlights and milestones"],
    ["Hosting", "Vercel (shared review link)"],
  ], [2300, TEXT_W - 2300]),
  gap(200),
  h2("2.2 Design system"),
  p("The interface uses the client green as its primary colour, warm cream backgrounds and gold for achievements. The look is flat and calm: cards use thin outlines instead of shadows, and dark green is kept for headers and main buttons so content stays light and easy to read. All text is checked against WCAG contrast rules."),
  table(["Token", "Colour", "Used for"], [
    ["Primary green", "#6C8F3E", "Progress bars, radio buttons, switches, charts"],
    ["Primary strong", "#5B7F34", "Buttons and chips with white text"],
    ["Hero gradient", "#34501E → #4F7029", "Headers, hero cards and selected cards"],
    ["Ink", "#1C2619", "Headings and body text"],
    ["Success", "#34A76D", "Completed states"],
    ["Gold", "#E8C94A", "Milestone badges and celebrations"],
    ["Purple", "#7E00FC", "Designed Experience completion badge"],
  ], [2300, 2300, TEXT_W - 4600]),
  gap(160),
  p("**Typography:** Newsreader (italic serif) for screen titles and scripture headings, DM Sans for all interface text, and a blackletter face on the completion certificate."),
  h2("2.3 Navigation"),
  p("After setup, the app is organised around a bottom navigation bar with five tabs:"),
  table(["Tab", "What it holds"], [
    ["Home", "Today's walk, steps, latest reflection, journey progress, next milestone, Bible progress"],
    ["Journey", "The journey calendar, day details, and reading progress by book"],
    ["Journal", "All reflections and saved highlights"],
    ["Milestones", "Badges earned and still to come, and the completion certificate"],
    ["You", "Profile, reminders, settings, help, about, terms and privacy, log out"],
  ], [2000, TEXT_W - 2000]),
);

// 3
add(
  h1("3. Onboarding & Account"),
  h2("3.1 Splash screen"),
  p("The app opens on a cream splash screen with the Passage Walk mark (an open book with a path) and the line **Walk. Read. Reflect.** It moves on to onboarding by itself."),
  h2("3.2 Onboarding carousel"),
  p("Three pages introduce the idea of the app. Each page has a photo banner at the top that slowly cross-fades between client photos, a title, a short description and a **Next** button (the last page says **Get Started**)."),
  table(["Page", "Title", "Message"], [
    ["1", "Walk With Purpose", "Passage Walk connects the steps you take with scripture — a rhythm of movement, reflection and faith."],
    ["2", "Your Steps, Your Scripture", "Enter your daily steps and receive a meaningful passage selected for your journey."],
    ["3", "A 33-Day Walk", "Build a lasting devotional habit through daily reading and personal reflection."],
  ], [900, 2700, TEXT_W - 3600]),
  gap(160),
  ...shots([["00-splash", "Splash"], ["01-onb1", "Onboarding · page 1"], ["03-onb3", "Onboarding · page 3"]]),
  h2("3.3 Welcome & Learn more"),
  p("The Welcome screen offers **Create Account** and **Log in**. A link, **Learn how Passage Walk works**, opens an explainer page that covers the daily rhythm, the journey types and how milestones work."),
  h2("3.4 Create account"),
  p("New users enter the following details:"),
  bullets(["First name and last name", "Email address", "Password and confirm password (with show / hide)", "Age range, gender and birthday month (optional selectors)", "Agreement to the Terms and Privacy Policy (required)"]),
  p("**Create Account** stays disabled until the required fields are valid and the terms box is ticked."),
  h2("3.5 Log in, forgot and reset password"),
  bullets([
    "**Log in:** email, password and a **Keep me logged in** option.",
    "**Forgot password:** the user enters their email and receives a reset link.",
    "**Reset password:** new password and confirm password, then back to Log in.",
    "**Welcome back:** a returning user sees where they left off, with **Start / Continue Today's Walk** or **Go to Dashboard**.",
  ]),
  h2("3.6 Account ready"),
  p("After sign up, a confirmation screen welcomes the user by name and shows three simple steps: account created, choose your journey, then walk, read and reflect. **Choose My Journey** starts setup."),
  ...shots([["04-welcome", "Welcome"], ["06-signup2", "Create account"], ["07-ready", "Account ready"]]),
);

// 4
add(
  h1("4. Choosing a Journey"),
  h2("4.1 Journey types"),
  p("Setup begins on **Choose your journey**. A step counter in the header shows where the user is in setup. There are three journey types:"),
  table(["Journey type", "Length", "How it works"], [
    ["33-Day Walk", "33 days", "One chapter a day, alternating Old and New Testament. Your daily steps choose the book and chapter — one day for each year of Christ's life."],
    ["Designed Experience", "2 to 150 days", "A ready-made walk built from books that share the same number of chapters (for example, five one-chapter books make a 5-Day experience). 31 experiences in total."],
    ["Create a Journey", "Your choice", "Pick your own books, or read the whole Bible. Choose to read in order or let your steps choose."],
  ], [2300, 1500, TEXT_W - 3800]),
  gap(200),
  h2("4.2 Designed Experiences"),
  p("The Designed Experience list can be filtered by length (**All**, **Under 10 days**, **10–30 days**, **31–60 days**, **60+ days**) and is sorted shortest first. Each card shows the number of days, the books it covers and a tag such as **One of a kind** or **3 chapters each**. Opening a card shows its details: days, books, chapters per book and the badges that can be earned along the way."),
  h2("4.3 Create a Journey"),
  bullets([
    "**Your books:** search and pick books from the Old and New Testament grid.",
    "**The whole Bible:** read all 1,189 chapters at a pace the user picks — about 1 year (3–4 chapters a day), 2 years (1–2 a day) or about 3 years (1 a day).",
    "**Reading order:** **In order** (chapter by chapter) or **Read randomly** (your steps choose).",
  ]),
  h2("4.4 Bible version"),
  p("The user chooses a Bible version, with a short preview of Psalm 119:105 in the selected version. The **King James Version** is available now. Other versions (NIV, NLT, NKJV, The Message, ESV, Amplified) are shown as **Coming soon**. The version can be changed later in Settings."),
  h2("4.5 You're set"),
  p("A summary card confirms the journey: type, testaments, daily reading, how readings are chosen and the Bible version. **Start My Journey** opens the Home screen."),
  ...shots([["08-choose", "Choose your journey"], ["09-designed", "Designed Experiences"], ["11-version", "Bible version"]]),
  ...shots([["10-choose33", "33-Day Walk selected"], ["12-set", "You're set"]]),
);

// 5
add(
  h1("5. Home Dashboard"),
  h2("5.1 Overview"),
  p("Home is the user's daily starting point. From top to bottom it shows:"),
  bullets([
    "A time-of-day greeting with the user's name, the notification bell and profile photo.",
    "The journey band: current day, days completed and percentage of the journey.",
    "**Today's Steps** — a ring that fills as steps are entered, with **Enter Steps**.",
    "**Your latest reflection** and any reflections not yet added.",
    "**Keep walking with purpose** — days completed, total steps, total passages and verses read.",
    "**Next milestone** — how many days to the next badge.",
    "**Bible progress** — chapters read across the whole Bible, Old and New Testament, and books visited.",
  ]),
  h2("5.2 Notifications"),
  p("The bell opens Notifications with **All** and **Unread** filters. Notifications are grouped into **Needs your attention** and **Earlier**, and each one has an action button."),
  table(["Notification", "Action"], [
    ["Today's walk is waiting", "Enter Steps"],
    ["Today's walk is complete", "See Milestones"],
    ["Reflection not added", "Write Reflection"],
    ["N days to the next milestone", "View Milestones"],
    ["You missed Day N", "Catch Up"],
    ["You earned a badge", "View Badge"],
  ], [5200, TEXT_W - 5200]),
  gap(160),
  ...shots([["13-home", "Home"], ["14-home2", "Home · journey progress"], ["15-notifications", "Notifications"]]),
);

// 6
add(
  h1("6. The Daily Walk"),
  p("The daily walk is the heart of the app. It takes the user from their step count to a finished reflection in six screens."),
  h2("6.1 Enter steps"),
  p("**How many steps did you walk today?** The user types their steps on a large keypad. The ring around the number fills as digits are added (1, 2, 3 and 4+ digits fill 25%, 50%, 75% and 100%). This is a visual cue only — there is no step goal and any number can continue. **Generate My Passage** moves on."),
  h2("6.2 How steps choose the scripture"),
  p("A short **Finding today's passage** screen plays while the passage is chosen. The rule depends on the journey type:"),
  table(["Journey", "Rule"], [
    ["33-Day Walk", "Odd days read the Old Testament, even days the New. The first digit of the steps picks the book in that testament, the next digit picks the chapter. A book already read moves on to the next new book."],
    ["Designed Experience", "Works like Create a Journey, over the experience's own list of chapters."],
    ["Create a Journey · in order", "Day N reads the Nth chapter of the chosen books. Steps unlock the day."],
    ["Create a Journey · randomly", "The first digit picks the book in your list, the next digit picks the chapter. A chapter already read moves to the next unread one."],
    ["Whole Bible", "In order: the day reads its share of Genesis 1 → Revelation 22. Randomly: the steps pick the first chapter and the day reads on from there."],
  ], [2700, TEXT_W - 2700]),
  gap(160),
  note("Rule", "**One day = one passage.** Once a passage is generated for the day, it stays the same for that day."),
  gap(),
  h2("6.3 Passage ready"),
  p("**Your Passage Is Ready** shows today's scripture in a green card (for example, Deuteronomy 4 · 49 verses · KJV) with **Based on your 5,432 steps today**. The user can **Read Chapter**, go straight to **Write Reflection**, or choose **Do this later** — the reflection is then kept under Reflections on Home."),
  h2("6.4 Reading & highlighting"),
  bullets([
    "The passage is shown in a clean reading view with verse numbers.",
    "Tapping a verse highlights it in gold. Highlights are saved to the Journal.",
    "On multi-chapter days, chapter tabs appear at the top and a gold dot marks chapters with highlights.",
    "The bottom bar counts verses highlighted. **Write Reflection** unlocks once at least one verse is highlighted in **every chapter** of the day.",
  ]),
  h2("6.5 Reflection"),
  p("The reflection screen shows the highlighted verses and three guided questions:"),
  steps([
    "As you moved through your steps and passages today, what did God place on your heart?",
    "What did this passage teach you today?",
    "How can you apply this to your life?",
  ]),
  p("**Save Reflection** completes the day."),
  h2("6.6 Celebration & reflection saved"),
  p("When a day completes a milestone, a full-screen celebration shows the new badge (for example, **Day 3 · The Three-Day Resurrection Walk**) and the next one to aim for. **Reflection Saved** then confirms the day with a summary: steps entered, chapter, verses read, verses highlighted and date."),
  h2("6.7 Missed days & catch up"),
  p("If a day is missed, it is marked on the calendar and in notifications. The user can **Catch Up** a missed or pending day later, using the same steps → passage → reflection flow."),
  ...shots([["16-steps", "Enter steps"], ["18-passage", "Passage ready"], ["20-reading2", "Reading + highlights"]]),
  ...shots([["21-reflection", "Write reflection"], ["22-celebration", "Milestone celebration"], ["23-saved", "Reflection saved"]]),
);

// 7
add(
  h1("7. Journey & Journal"),
  h2("7.1 Journey calendar"),
  p("The Journey tab shows the whole journey as a calendar, week by week, with today highlighted. Each day has a clear state, explained by a legend:"),
  table(["State", "Meaning"], [
    ["Complete", "Steps entered, passage read and reflection saved"],
    ["In progress", "Steps entered or passage read, reflection still to do"],
    ["Missed", "The day passed without a walk — can be caught up"],
    ["Not entered", "A future day, or today before steps are entered"],
  ], [2300, TEXT_W - 2300]),
  gap(160),
  p("Tapping a day opens its details: steps, passage, highlights and reflection. Journeys built from chosen books also show **Chapters read per book**; whole-Bible journeys show progress across all 1,189 chapters."),
  h2("7.2 Journal"),
  p("**My Journal** is a private place for everything written on the journey. Entries can be filtered by **All**, **Completed** and **In progress**, and each entry shows the date, passage, the start of the reflection and its stats. Entries can be opened or deleted."),
  h2("7.3 Highlights"),
  p("**Your Highlights** collects every verse the user saved, grouped by passage, with the date and version label. Highlights can be printed or downloaded."),
  ...shots([["24-journey", "Journey calendar"], ["25-journal", "My Journal"], ["26-highlights", "Your Highlights"]]),
);

// 8
add(
  h1("8. Milestones & Badges"),
  h2("8.1 The milestone ladder"),
  p("Milestones are counted in **Passage Walk days** — every completed day counts, in any journey, and the count carries on when the user starts a new journey. Every journey uses the same ladder:"),
  table(["Day", "Badge"], [
    ["1", "The First Step"],
    ["3", "The Three-Day Resurrection Walk"],
    ["7", "The Seven-Day Creation Walk"],
    ["12", "The Twelve-Day Apostle Walk"],
    ["21", "The Twenty-One Day Trinity Walk"],
    ["33", "The 33-Day Power Walk"],
    ["40, 66, 70, 120, 150 … 365", "N Days of PassageWalk"],
  ], [3000, TEXT_W - 3000]),
  gap(160),
  p("The Milestones screen shows only the badges this journey can reach, with earned badges in gold and the next locked badge showing **N days to go**. A green progress card at the top shows days completed and days left in this journey."),
  h2("8.2 Journey badges"),
  bullets([
    "**33-Day Walk:** finishing the walk earns The 33-Day Power Walk.",
    "**Designed Experience:** finishing earns a purple **Experience Complete** badge.",
    "**Create a Journey / Whole Bible:** finishing earns an **N-Day PassageWalk Journey** badge.",
  ]),
  h2("8.3 Certificate of completion"),
  p("Each earned badge opens a **Milestone Achieved** page with a short reflection prompt and a personalised **Certificate of Completion** in the user's name, which can be downloaded."),
  ...shots([["27-milestones", "Milestones & Badges"], ["28-badge", "Milestone certificate"]]),
);

// 9
add(
  h1("9. Profile & Settings"),
  h2("9.1 You"),
  p("The You tab shows the user's photo, name and email, and a menu:"),
  table(["Page", "What it does"], [
    ["My Profile", "View and edit name, email and personal details"],
    ["Reminders", "Daily Scripture Reminder and Reflection Reminder, each with its own time"],
    ["Settings", "Current journey, Change Journey, Bible version and completed journeys"],
    ["Help & Support", "FAQ, contact us and report a problem"],
    ["About Passage Walk", "The story and purpose of the app"],
    ["Terms and Privacy", "Terms of use and privacy policy"],
    ["Log Out", "Confirms before logging out"],
  ], [2600, TEXT_W - 2600]),
  gap(200),
  ...shots([["29-you", "You"], ["30-settings", "Settings"]]),
  h2("9.2 Settings"),
  bullets([
    "**Current Journey:** type, length, books and reading order.",
    "**Change Journey:** opens journey setup again. A confirmation explains what happens before anything changes.",
    "**Reading:** the Bible version in use, which can be changed at any time.",
    "**Your Journeys:** completed journeys. A new user sees the empty state, **No completed journeys yet**.",
  ]),
  h2("9.3 Change Journey rules"),
  bullets([
    "The new journey starts **today as Day 1**.",
    "Days not completed in the old journey stay incomplete; completed days keep their real dates.",
    "Steps do not carry over to the new journey.",
    "Badges, Passage Walk days and Bible progress are kept — they are cumulative.",
    "Journal entries and highlights keep their original dates.",
  ]),
);

// 10
add(
  h1("10. Journey Complete"),
  p("When the last day of a journey is completed, the user moves through a short closing sequence:"),
  steps([
    "**Celebration:** \"You did it\" with the journey badge and totals for days, steps and verses.",
    "**Your Story:** a look back at the journey — best day, average steps, books visited across the Old and New Testament, and the books the user went furthest in.",
    "**Your Next Walk:** a recommended next journey (the 66-Day walk through Isaiah — the only book of the Bible with 66 chapters, one for each day), or **Choose your own journey**, or **Maybe later**.",
  ]),
  p("Badges and the certificate stay with the user in Milestones, and Passage Walk days keep counting in the next journey."),
  ...shots([["31-complete", "Journey complete"], ["32-story", "Your story"]]),
);

// 11
add(
  h1("11. User Journey Summary"),
  h3("First-time user"),
  steps(["Splash → onboarding (3 pages)", "Welcome → Create account", "Account ready → Choose your journey", "Pick a journey type, reading order and Bible version", "You're set → Home"]),
  h3("Daily walk"),
  steps(["Home → Enter Steps", "Generate My Passage → Passage ready", "Read the passage and highlight verses", "Write reflection → Save", "Celebration (on a milestone day) → Reflection saved → Home"]),
  h3("Looking back"),
  steps(["Journey tab: calendar and day details", "Journal: reflections and highlights", "Milestones: badges and certificates"]),
  h3("Returning user"),
  steps(["Log in (optionally Keep me logged in)", "Welcome back → Continue today's walk or Go to Dashboard"]),
  h3("End of a journey"),
  steps(["Last day completed → Journey complete celebration", "Your story", "Your next walk → start a new journey"]),
);

// 12
add(
  h1("12. Key Features Summary"),
  bullets([
    "Steps-driven scripture: the user's own steps choose each day's passage.",
    "Three journey types: 33-Day Walk, 31 Designed Experiences, and Create a Journey (your books or the whole Bible at your pace).",
    "Clean reading view with verse highlighting, chapter tabs and saved highlights.",
    "Guided three-question reflection, saved to a private journal.",
    "Journey calendar with clear day states and catch up for missed days.",
    "One cumulative milestone ladder across all journeys, with badges and downloadable certificates.",
    "Notifications for today's walk, reflections, milestones and missed days.",
    "Change Journey at any time without losing badges or progress.",
    "Journey complete story and a recommended next walk.",
    "Calm, flat design in the client green, checked for WCAG contrast.",
  ]),
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("13. Conclusion")], spacing: { before: 600, after: 220 } }),
  p("The Passage Walk frontend turns a simple daily habit — walking — into a guided time with scripture. Each screen has one clear purpose, the daily flow takes only a few minutes, and progress is always visible through the calendar, the journal and the milestones."),
  p("This document reflects the approved user interface and flows, and is the reference for development, testing and future phases of the product."),
  gap(400),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new ImageRun({ type: "png", data: concertLogo, transformation: { width: 66, height: 50 }, altText: { title: "ConcertIDC", description: "ConcertIDC logo", name: "concertidc-end" } })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Prepared by ConcertIDC for Passage Walk", size: 18, color: C.grey })] }),
);

// ---------- header / footer ----------
const header = new Header({ children: [new Paragraph({
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.line, space: 6 } },
  tabStops: [{ type: TabStopType.RIGHT, position: TEXT_W }],
  children: [
    new ImageRun({ type: "png", data: concertLogo, transformation: { width: 30, height: 23 }, altText: { title: "ConcertIDC", description: "ConcertIDC logo", name: "hdr" } }),
    new TextRun({ text: "\tPassage Walk  ·  Frontend (UI) Documentation", size: 17, color: C.grey }),
  ] })] });
const footer = new Footer({ children: [new Paragraph({
  tabStops: [{ type: TabStopType.RIGHT, position: TEXT_W }],
  children: [
    new TextRun({ text: "ConcertIDC", size: 17, bold: true, color: C.green }),
    new TextRun({ text: "  |  Confidential", size: 17, color: C.grey }),
    new TextRun({ children: ["\tPage ", PageNumber.CURRENT], size: 17, color: C.grey }),
  ] })] });

// ---------- document ----------
const doc = new Document({
  creator: "ConcertIDC", title: "Passage Walk – Frontend (UI) Documentation", description: "Passage Walk mobile app frontend documentation",
  features: { updateFields: true },
  styles: {
    default: { document: { run: { font: SANS, size: 22, color: C.ink } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: SERIF, size: 40, italics: true, color: C.greenDeep },
        paragraph: { spacing: { before: 0, after: 220 }, keepNext: true, outlineLevel: 0, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "D9A62E", space: 8 } } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: SANS, size: 26, bold: true, color: C.green },
        paragraph: { spacing: { before: 300, after: 110 }, keepNext: true, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: SANS, size: 22, bold: true, color: C.gold, allCaps: true, characterSpacing: 20 },
        paragraph: { spacing: { before: 220, after: 80 }, keepNext: true, outlineLevel: 2 } },
      { id: "TOC1", name: "toc 1", basedOn: "Normal", next: "Normal", run: { font: SANS, size: 23, bold: true, color: C.greenDeep }, paragraph: { spacing: { before: 140, after: 40 } } },
      { id: "TOC2", name: "toc 2", basedOn: "Normal", next: "Normal", run: { font: SANS, size: 21, color: C.ink }, paragraph: { spacing: { before: 0, after: 30 }, indent: { left: 360 } } },
    ],
  },
  numbering: { config: [
    { reference: "bullets", levels: [
      { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { run: { color: C.green }, paragraph: { indent: { left: 400, hanging: 260 } } } },
      { level: 1, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT, style: { run: { color: C.grey }, paragraph: { indent: { left: 800, hanging: 260 } } } },
    ] },
    { reference: "steps", levels: [
      { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { run: { bold: true, color: C.green }, paragraph: { indent: { left: 440, hanging: 320 } } } },
    ] },
  ] },
  sections: [{
    properties: { titlePage: true, page: { size: { width: PAGE_W, height: 16838 }, margin: { top: 1300, bottom: 1150, left: MARGIN, right: MARGIN, header: 560, footer: 520 } } },
    headers: { default: header, first: new Header({ children: [new Paragraph("")] }) },
    footers: { default: footer, first: new Footer({ children: [new Paragraph("")] }) },
    children: [...cover, ...body],
  }],
});

Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(OUT, buf); console.log("wrote", OUT, buf.length); });
