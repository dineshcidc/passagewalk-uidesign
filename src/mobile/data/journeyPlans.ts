import type { JourneyPlan, JourneyType, ReadingOrder } from "../types";
import { bibleBooks } from "./bibleBooks";

export const THIRTY_THREE_DAY_LENGTH = 33;
// 66 books · 1,189 chapters — one chapter a day.
export const BIBLE_CHAPTER_COUNT = bibleBooks.reduce((total, book) => total + book.chapters, 0);

export const journeyTypeLabels: Record<JourneyType, string> = {
  automatic: "33-Day Journey",
  custom: "Choose Your Own Journey",
  bible: "Read the Entire Bible",
};

const bookIndex = (name: string) => bibleBooks.findIndex((book) => book.name === name);
export const getBookChapters = (name: string) => bibleBooks[bookIndex(name)]?.chapters ?? 0;

// Books are kept in Bible order so "Read in order" walks Genesis → Revelation, whatever order they were tapped in.
export function sortBooks(books: string[]) {
  return [...books].sort((a, b) => bookIndex(a) - bookIndex(b));
}

export function getChapterTotal(books: string[]) {
  return books.reduce((total, name) => total + getBookChapters(name), 0);
}

export function createJourneyPlan(type: JourneyType, books: string[] = [], order: ReadingOrder = "in-order"): JourneyPlan {
  if (type === "automatic") return { type, books: [], order: "steps", days: THIRTY_THREE_DAY_LENGTH };
  // Entire Bible: in chapter order (Genesis → Revelation) or randomly, guided by the steps.
  if (type === "bible") return { type, books: [], order, days: BIBLE_CHAPTER_COUNT };
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
