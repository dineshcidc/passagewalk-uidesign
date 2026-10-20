import type { JourneyPlan } from "../types";
import { getVerseCount, loadBook } from "./bible";
import { defaultJourneyPlan } from "./journeyPlans";
import { resolveReading, type ReadingAssignment } from "./stepsRule";

// Prototype-only journey state. Every journey type opens on the same progress rule:
//   Days 1–2 complete · Day 3 missed · Day 4 steps entered, reflection pending · Day 5 today, not entered.
// (Journeys shorter than 5 days: every earlier day complete, the last day is today.)
// The readings come from the steps → reading rule (stepsRule.ts), so each type shows its own chapters:
//   33-Day:              Genesis 1 · Matthew 5 · (missed) · Romans 8 pending · today Old Testament
//   Entire Bible random: Ruth 1 · Galatians 5 · (missed) · Luke 1 pending · today Old Testament
//   Entire Bible order:  Genesis 1 · Genesis 2 · (missed) · Genesis 4 pending · today Genesis 5
//   Own, in order:       chapter 1 · chapter 2 · (missed) · chapter 4 pending · today chapter 5
//   Own, steps choose:   e.g. Exodus + Leviticus → Leviticus 3 · Exodus 1 · (missed) · Leviticus 7 pending
//   Designed:            the plan's chapters, in order (Courage Walk: Daniel 1 · 2 · missed · 4 pending) or by steps

export type ReflectionAnswers = [string, string, string];
export type DayRecord = { steps: string; time: string; reading: ReadingAssignment };
export type SavedReflection = { answers: ReflectionAnswers; time: string };

type Seed = { steps: string; time: string; highlights?: number[]; answers?: ReflectionAnswers };

const JOURNEY_START = new Date(2026, 8, 30); // Day 1 = September 30, 2026
const seedTimes = ["7:20 AM", "6:35 PM", "", "7:42 PM"];

const seedSteps: Record<"automatic" | "bible" | "in-order" | "steps", string[]> = {
  automatic: ["11,940", "15,672", "", "6,812"],
  bible: ["8,120", "9,512", "", "3,016"],
  "in-order": ["3,940", "4,672", "", "6,208"],
  steps: ["2,350", "5,180", "", "4,720"],
};

const seedHighlights: Partial<Record<JourneyPlan["type"], number[][]>> = {
  automatic: [[1, 3], [14, 16]],
  bible: [[16, 17], [22, 23]],
};

const seedAnswers: Record<Exclude<JourneyPlan["type"], "designed">, ReflectionAnswers[]> = {
  automatic: [
    ["Walking this morning felt like a quiet beginning — God was already there before I took the first step.", "The words “in the beginning” made this journey feel like a fresh start.", "God can create something meaningful even when I cannot see the full shape of it yet."],
    ["Every step felt like a reminder to be salt and light in the places I walk each day.", "I was reminded that faith is meant to shape how I show up for other people.", "I can bring more encouragement into the conversations I usually rush through."],
  ],
  bible: [
    ["Walking alongside a friend today, I thought of Ruth walking beside Naomi — faithfulness one step at a time.", "Ruth’s loyalty showed me what faithful love looks like when it costs something.", "I can stay close to someone in my family who is going through a hard season."],
    ["Long walks build strength slowly, and so does the Spirit’s fruit in me.", "The fruit of the Spirit grows slowly, through daily walking, not one big effort.", "I want to practice patience in the small frustrations of my day."],
  ],
  custom: [
    ["Each step today felt like a small act of trust — God was patient with me as I walked.", "This chapter reminded me that God is patient with His people, even when they struggle to trust Him.", "I want to hand God one worry I keep trying to carry on my own."],
    ["My walk felt unhurried, and I sensed God guiding each step the way He guided His people.", "I noticed how carefully God guides each step — nothing in this chapter felt random.", "I can slow down today and notice where God is already at work."],
  ],
};

let plan: JourneyPlan = defaultJourneyPlan;
let today = 5;
let seededComplete = new Set<number>();
const records = new Map<number, DayRecord>();
const reflections = new Map<number, SavedReflection>();
const highlights = new Map<number, number[]>();
const deletedEntries = new Set<number>();

const nowTime = () => new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date());
const toNumber = (steps: string) => Number(steps.replace(/,/g, ""));

function assign(journeyDay: number, steps: string) {
  const taken = [...records.entries()].filter(([day]) => day !== journeyDay).map(([, record]) => record.reading);
  return resolveReading(plan, journeyDay, toNumber(steps), taken);
}

// Starts a journey on the mock scenario above. Called when setup finishes, on Log In, and from Settings → Change Journey.
export function activateJourney(nextPlan: JourneyPlan) {
  plan = nextPlan;
  records.clear();
  reflections.clear();
  highlights.clear();
  deletedEntries.clear();

  const standard = plan.days >= 5;
  today = standard ? 5 : plan.days;
  const completeDays = standard ? [1, 2] : Array.from({ length: today - 1 }, (_, index) => index + 1);
  const pendingDays = standard ? [4] : [];
  seededComplete = new Set(completeDays);

  const stepsKey = plan.type === "custom" || plan.type === "designed" ? plan.order : plan.type;
  // Entire Bible in chapter order and Designed Experiences use the general (custom) reflections, not Ruth / Galatians.
  const seedKind = (plan.type === "bible" && plan.order === "in-order") || plan.type === "designed" ? "custom" : plan.type as keyof typeof seedAnswers;
  const stepsPool = seedSteps[stepsKey].filter(Boolean);
  const seeds = new Map<number, Seed>();
  [...completeDays, ...pendingDays].forEach((day, index) => {
    seeds.set(day, {
      steps: seedSteps[stepsKey][day - 1] || stepsPool[index % stepsPool.length],
      time: seedTimes[day - 1] || seedTimes[index % 2],
      highlights: seedHighlights[seedKind]?.[day - 1],
      answers: completeDays.includes(day) ? seedAnswers[seedKind][index % 2] : undefined,
    });
  });

  [...seeds.entries()].sort(([a], [b]) => a - b).forEach(([day, seed]) => {
    const reading = assign(day, seed.steps);
    records.set(day, { steps: seed.steps, time: seed.time, reading });
    if (seed.answers) {
      reflections.set(day, { answers: seed.answers, time: seed.time });
      const count = getVerseCount(reading.bookIndex, reading.chapter);
      highlights.set(day, seed.highlights ?? [...new Set([1, Math.max(1, Math.ceil(count / 2))])]);
    }
  });

  records.forEach((record) => void loadBook(record.reading.bookIndex));
}

activateJourney(defaultJourneyPlan);

export const getActivePlan = () => plan;
export const getJourneyLength = () => plan.days;
export const getTodayDay = () => today;

export function getDayDate(journeyDay: number) {
  const date = new Date(JOURNEY_START);
  date.setDate(date.getDate() + journeyDay - 1);
  return date;
}
export const formatDayDate = (journeyDay: number) => new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(getDayDate(journeyDay));
export const formatShortDate = (journeyDay: number) => {
  const date = getDayDate(journeyDay);
  return `${new Intl.DateTimeFormat("en-US", { month: "short" }).format(date).toUpperCase()} ${String(date.getDate()).padStart(2, "0")}`;
};

export const getDayRecord = (journeyDay: number) => records.get(journeyDay) ?? null;
export const getRecordedDays = () => [...records.keys()].sort((a, b) => a - b);

// Steps entered in the daily flow decide (or, for "In order", unlock) the day's reading. Once a reflection
// is saved the reading is kept; changing steps before that re-runs the rule and clears old highlights.
export function saveDaySteps(journeyDay: number, steps: string) {
  const existing = records.get(journeyDay);
  if (existing && isDayComplete(journeyDay)) {
    records.set(journeyDay, { ...existing, steps, time: nowTime() });
    return existing.reading;
  }
  const reading = assign(journeyDay, steps);
  if (existing && (existing.reading.bookIndex !== reading.bookIndex || existing.reading.chapter !== reading.chapter)) highlights.delete(journeyDay);
  records.set(journeyDay, { steps, time: nowTime(), reading });
  void loadBook(reading.bookIndex);
  return reading;
}

export function saveDayReflection(journeyDay: number, answers: ReflectionAnswers) {
  reflections.set(journeyDay, { answers, time: nowTime() });
}
export const getDayReflection = (journeyDay: number) => reflections.get(journeyDay) ?? null;

export function isDayComplete(journeyDay: number) {
  return seededComplete.has(journeyDay) || (reflections.has(journeyDay) && records.has(journeyDay));
}

export const getHighlightNumbers = (journeyDay: number) => highlights.get(journeyDay) ?? [];
export const setHighlightNumbers = (journeyDay: number, numbers: number[]) => highlights.set(journeyDay, numbers);

export const deleteEntry = (journeyDay: number) => deletedEntries.add(journeyDay);
export const isEntryDeleted = (journeyDay: number) => deletedEntries.has(journeyDay);
