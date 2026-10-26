import type { AppIconName } from "../components/AppIcon";
import type { BiblePace, JourneyPlan, JourneyType, ReadingOrder } from "../types";
import { bibleBooks } from "./bibleBooks";
import { getExperience, type Experience } from "./experiences";

export const THIRTY_THREE_DAY_LENGTH = 33;
// 66 books · 1,189 chapters — read at the chosen pace (one chapter a day = about 3 years).
export const BIBLE_CHAPTER_COUNT = bibleBooks.reduce((total, book) => total + book.chapters, 0);

// Both "Your Own" and "Whole Bible" journeys are made with Create a Journey.
export const journeyTypeLabels: Record<JourneyType, string> = {
  automatic: "33-Day Walk",
  designed: "Designed Experience",
  custom: "Your Own Journey",
  bible: "Whole Bible Journey",
};

export const journeyTypeIcons: Record<JourneyType, AppIconName> = {
  automatic: "spark",
  designed: "compass",
  custom: "book",
  bible: "library",
};

// The plan's own name where it has one: "21-Day Designed Experience" for a Designed Experience, else the type label.
export const journeyName = (plan: JourneyPlan) => getExperience(plan.experience)?.name ?? journeyTypeLabels[plan.type];

export function createExperiencePlan(experience: Experience, order: ReadingOrder): JourneyPlan {
  return { type: "designed", books: experience.books.map((book) => book.name), order, days: experience.days, experience: experience.id };
}

const bookIndex = (name: string) => bibleBooks.findIndex((book) => book.name === name);
export const getBookChapters = (name: string) => bibleBooks[bookIndex(name)]?.chapters ?? 0;

// Books are kept in Bible order so "Read in order" walks Genesis → Revelation, whatever order they were tapped in.
export function sortBooks(books: string[]) {
  return [...books].sort((a, b) => bookIndex(a) - bookIndex(b));
}

export function getChapterTotal(books: string[]) {
  return books.reduce((total, name) => total + getBookChapters(name), 0);
}

// Whole Bible pace (review call 4, Kathy: "give them the option… finish in a year or three years if they read one chapter").
export const biblePaces: { value: BiblePace; days: number; title: string; years: string; body: string; tag?: string }[] = [
  { value: "1-year", days: 365, title: "Finish in 1 year", years: "1 year", body: "Three or four chapters a day — the classic Bible-in-a-year pace.", tag: "POPULAR" },
  { value: "2-years", days: 730, title: "Finish in 2 years", years: "2 years", body: "One or two chapters a day — a steady middle pace." },
  { value: "3-years", days: BIBLE_CHAPTER_COUNT, title: "Finish in about 3 years", years: "About 3 years", body: "One chapter a day — a gentle walk through every chapter." },
];
export const DEFAULT_BIBLE_PACE: BiblePace = "1-year";
export const getBiblePace = (pace: BiblePace = DEFAULT_BIBLE_PACE) => biblePaces.find((option) => option.value === pace)!;

// Chapters spread evenly over the days: 1,189 over 365 = 94 days of 4 and 271 of 3 (Day 1 reads 4).
export function getDayChapterCount(days: number, journeyDay: number, total = BIBLE_CHAPTER_COUNT) {
  return Math.ceil((journeyDay * total) / days) - Math.ceil(((journeyDay - 1) * total) / days);
}
// First chapter (1-based, Genesis 1 = 1) a day reads, counted through the whole Bible.
export const getDayChapterStart = (days: number, journeyDay: number, total = BIBLE_CHAPTER_COUNT) => Math.ceil(((journeyDay - 1) * total) / days) + 1;

// "3–4 chapters a day", "1–2 chapters a day", "1 chapter a day".
export function chaptersPerDayLabel(days: number) {
  const counts = Array.from({ length: Math.min(days, 12) }, (_, index) => getDayChapterCount(days, index + 1));
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  return min === max ? `${plural(min, "chapter")} a day` : `${min}–${max} chapters a day`;
}

// A journey's daily reading in words: "3–4 chapters a day" (whole Bible at its pace) or "one chapter a day".
export const planChaptersPerDay = (plan: JourneyPlan) => (plan.type === "bible" ? chaptersPerDayLabel(plan.days) : "one chapter a day");
// How many chapters a given day reads (several only on a faster whole-Bible pace).
export const planDayChapterCount = (plan: JourneyPlan, journeyDay: number) => (plan.type === "bible" ? getDayChapterCount(plan.days, Math.min(journeyDay, plan.days)) : 1);

// Whole Bible chapter N (1-based) → "Genesis 4"; a day's run → "Genesis 1–4" or "Genesis 49 – Exodus 2".
function bibleChapterAt(position: number) {
  let left = position;
  for (const book of bibleBooks) {
    if (left <= book.chapters) return { book: book.name, chapter: left };
    left -= book.chapters;
  }
  return { book: "Revelation", chapter: 22 };
}
export function formatChapterRun(start: number, count: number) {
  const first = bibleChapterAt(start);
  const last = bibleChapterAt(start + count - 1);
  if (count === 1) return `${first.book} ${first.chapter}`;
  return first.book === last.book ? `${first.book} ${first.chapter}–${last.chapter}` : `${first.book} ${first.chapter} – ${last.book} ${last.chapter}`;
}

export function createJourneyPlan(type: Exclude<JourneyType, "designed">, books: string[] = [], order: ReadingOrder = "in-order", pace: BiblePace = DEFAULT_BIBLE_PACE): JourneyPlan {
  if (type === "automatic") return { type, books: [], order: "steps", days: THIRTY_THREE_DAY_LENGTH };
  // Entire Bible: in chapter order (Genesis → Revelation) or randomly, guided by the steps, at the chosen pace.
  if (type === "bible") return { type, books: [], order, days: getBiblePace(pace).days, pace };
  const sorted = sortBooks(books);
  return { type, books: sorted, order, days: getChapterTotal(sorted) };
}

export const defaultJourneyPlan = createJourneyPlan("automatic");

// Reading order wording (client slides 12 / 15 / 16). The 33-Day Journey is always guided by the steps.
export const readingOrderLabel = (plan: JourneyPlan) =>
  plan.order === "in-order" ? (plan.type === "bible" ? "In chapter order" : "In order") : "Randomly, by your steps";
export const readingStyle = (plan: JourneyPlan) => (plan.type === "automatic" ? "" : plan.order === "in-order" ? "sequential" : "random");

export const formatCount = (value: number) => value.toLocaleString("en-US");

// "1 day", "67 days", "1,189 days" — keeps 1-chapter books (Obadiah, Jude…) grammatical.
export const plural = (value: number, one: string, many = `${one}s`) => `${formatCount(value)} ${value === 1 ? one : many}`;

// "a 67-day" / "an 8-day" / "an 11-day" / "an 80-day"
export const withArticle = (value: number) => `${/^8/.test(String(value)) || value === 11 || value === 18 ? "an" : "a"} ${formatCount(value)}`;

// "Exodus", "Exodus and Leviticus", "Genesis, Exodus, and Leviticus", "Genesis, Exodus, and 3 more books"
export function formatBookList(books: string[]) {
  if (books.length <= 1) return books[0] ?? "";
  if (books.length === 2) return `${books[0]} and ${books[1]}`;
  if (books.length === 3) return `${books[0]}, ${books[1]}, and ${books[2]}`;
  if (books.length === bibleBooks.length) return "every book of the Bible";
  return `${books[0]}, ${books[1]}, and ${books.length - 2} more books`;
}

// First few readings of a custom journey, used to preview the two reading orders.
export function getChapterPreview(books: string[], order: ReadingOrder, count = 3) {
  const chapters = sortBooks(books).flatMap((name) => Array.from({ length: getBookChapters(name) }, (_, index) => `${name} ${index + 1}`));
  if (order === "in-order") return chapters.slice(0, count);
  // A fixed spread across the list stands in for step-chosen chapters (stable between renders).
  const picks = [0.62, 0.08, 0.85, 0.37].map((ratio) => chapters[Math.floor(chapters.length * ratio)]);
  return [...new Set(picks)].slice(0, count);
}

// "Daniel", "Mark and Luke", "all 66 books, Genesis to Revelation" — a Designed Experience's reading, in a sentence.
export function experienceThrough(experience: Experience) {
  return experience.books.length === bibleBooks.length ? "all 66 books, Genesis to Revelation" : formatBookList(experience.books.map((book) => book.name));
}
