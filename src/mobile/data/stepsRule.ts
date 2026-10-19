import type { JourneyPlan } from "../types";
import { getBookChapterCount, getBookIndex, getBookName, getTestamentBooks, getTestamentPosition, type TestamentName } from "./bible";
import { bibleBooks } from "./bibleBooks";

// Steps → reading rules for the three journey types (prototype proposal; Kathy's journal PDF may refine the maths,
// the screens stay the same). Explained for the team in Client-call/Journey-types/.
//
// 33-Day:          odd day = Old Testament, even day = New. 1st digit = that testament's Nth book, next digit = chapter.
//                  A book already read → add all digits → that book; still read → next new book.
// Choose Your Own: "In order" → Day N reads chapter N of the chosen books (steps unlock it).
//                  "Read randomly" → 1st digit = your Nth book (counting around your list), next digit = chapter;
//                  one book only → 1st digit = chapter. A chapter already read → next unread one.
// Entire Bible:    "Read randomly" → like 33-Day, but books may come back; a chapter already read → next unread chapter.
//                  "Read in chapter order" → Day N reads chapter N of the Bible (Genesis 1 → Revelation 22), steps unlock it.

export type ReadingRef = { bookIndex: number; chapter: number };

export type StepsExplanation = {
  mode: "digits" | "unlock";
  digits: string[];
  bookDigit: number | null;
  chapterDigit: number | null;
  // Shown top to bottom on the "Your steps led you here" card: value chip + sentence.
  lines: { value: string; text: string }[];
};

export type ReadingAssignment = ReadingRef & { explanation: StepsExplanation };

const ordinal = (value: number) => {
  const tens = value % 100;
  if (tens >= 11 && tens <= 13) return `${value}th`;
  return `${value}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[value % 10] ?? "th"}`;
};

export const getDayTestament = (journeyDay: number): TestamentName => (journeyDay % 2 === 1 ? "Old" : "New");

// Wraps a 1-based number into 1..size ("counting around" a list).
const wrap = (value: number, size: number) => ((value - 1) % size) + 1;

function readDigits(steps: number) {
  const digits = String(steps).split("");
  const chapterDigit = digits.findIndex((digit, index) => index > 0 && digit !== "0");
  return { digits, chapterDigit: chapterDigit === -1 ? null : chapterDigit, sum: digits.reduce((total, digit) => total + Number(digit), 0) };
}

// Chapter from a digit, wrapped to the book's chapter count, then moved to the next unread chapter if needed.
function pickChapter(bookIndex: number, raw: number, isRead: (chapter: number) => boolean, lines: StepsExplanation["lines"], digitLabel: string) {
  const total = getBookChapterCount(bookIndex);
  const name = getBookName(bookIndex);
  let chapter = wrap(raw, total);
  const reason = digitLabel === "—" ? "No chapter digit → " : "";
  lines.push({ value: digitLabel, text: chapter === raw ? `${reason}Chapter ${chapter}` : `${name} has ${total} ${total === 1 ? "chapter" : "chapters"} → counting around → Chapter ${chapter}` });
  if (isRead(chapter)) {
    const start = chapter;
    for (let step = 1; step <= total; step += 1) {
      const next = wrap(start + step, total);
      if (!isRead(next)) { chapter = next; break; }
    }
    lines.push({ value: "↻", text: `${name} ${start} already read → next unread: Chapter ${chapter}` });
  }
  return chapter;
}

function resolveThirtyThree(journeyDay: number, steps: number, taken: ReadingRef[]): ReadingAssignment {
  const testament = getDayTestament(journeyDay);
  const list = getTestamentBooks(testament);
  const { digits, chapterDigit, sum } = readDigits(steps);
  const usedBooks = new Set(taken.map((reading) => reading.bookIndex));
  const lines: StepsExplanation["lines"] = [];
  const first = Number(digits[0]);
  let bookIndex = list[wrap(first, list.length) - 1];
  lines.push({ value: digits[0], text: `${ordinal(first)} book of the ${testament} Testament → ${getBookName(bookIndex)}` });
  if (usedBooks.has(bookIndex)) {
    const walked = getBookName(bookIndex);
    const position = wrap(sum, list.length);
    bookIndex = list[position - 1];
    lines.push({ value: `${digits.join("+")} = ${sum}`, text: `${walked} already read → ${ordinal(position)} book → ${getBookName(bookIndex)}` });
    if (usedBooks.has(bookIndex)) {
      const again = getBookName(bookIndex);
      const start = list.indexOf(bookIndex);
      bookIndex = list.map((_, step) => list[(start + step + 1) % list.length]).find((index) => !usedBooks.has(index)) ?? bookIndex;
      lines.push({ value: "↻", text: `${again} already read → next new book: ${getBookName(bookIndex)}` });
    }
  }
  const raw = chapterDigit === null ? 1 : Number(digits[chapterDigit]);
  const chapter = pickChapter(bookIndex, raw, () => false, lines, chapterDigit === null ? "—" : digits[chapterDigit]);
  return { bookIndex, chapter, explanation: { mode: "digits", digits, bookDigit: 0, chapterDigit, lines } };
}

function resolveEntireBible(journeyDay: number, steps: number, taken: ReadingRef[]): ReadingAssignment {
  const isRead = (bookIndex: number, chapter: number) => taken.some((reading) => reading.bookIndex === bookIndex && reading.chapter === chapter);
  const unreadIn = (bookIndex: number) => Array.from({ length: getBookChapterCount(bookIndex) }, (_, index) => index + 1).some((chapter) => !isRead(bookIndex, chapter));
  const { digits, chapterDigit, sum } = readDigits(steps);
  const lines: StepsExplanation["lines"] = [];
  let testament = getDayTestament(journeyDay);
  if (!getTestamentBooks(testament).some(unreadIn)) {
    const finished = testament;
    testament = testament === "Old" ? "New" : "Old";
    lines.push({ value: "✓", text: `${finished} Testament fully read → ${testament} Testament today` });
  }
  const list = getTestamentBooks(testament);
  const first = Number(digits[0]);
  let bookIndex = list[wrap(first, list.length) - 1];
  lines.push({ value: digits[0], text: `${ordinal(first)} book of the ${testament} Testament → ${getBookName(bookIndex)}` });
  if (!unreadIn(bookIndex)) {
    const done = getBookName(bookIndex);
    const position = wrap(sum, list.length);
    bookIndex = list[position - 1];
    lines.push({ value: `${digits.join("+")} = ${sum}`, text: `${done} fully read → ${ordinal(position)} book → ${getBookName(bookIndex)}` });
    if (!unreadIn(bookIndex)) {
      const start = list.indexOf(bookIndex);
      bookIndex = list.map((_, step) => list[(start + step + 1) % list.length]).find(unreadIn) ?? bookIndex;
      lines.push({ value: "↻", text: `Next book with chapters left → ${getBookName(bookIndex)}` });
    }
  }
  const raw = chapterDigit === null ? 1 : Number(digits[chapterDigit]);
  const chapter = pickChapter(bookIndex, raw, (value) => isRead(bookIndex, value), lines, chapterDigit === null ? "—" : digits[chapterDigit]);
  return { bookIndex, chapter, explanation: { mode: "digits", digits, bookDigit: 0, chapterDigit, lines } };
}

function resolveCustomInOrder(plan: JourneyPlan, journeyDay: number, steps: number): ReadingAssignment {
  const sequence = plan.books.flatMap((name) => {
    const bookIndex = getBookIndex(name);
    return Array.from({ length: getBookChapterCount(bookIndex) }, (_, index) => ({ bookIndex, chapter: index + 1 }));
  });
  const reading = sequence[Math.min(journeyDay, sequence.length) - 1];
  const name = getBookName(reading.bookIndex);
  return {
    ...reading,
    explanation: {
      mode: "unlock",
      digits: String(steps).split(""),
      bookDigit: null,
      chapterDigit: null,
      lines: [
        { value: "✓", text: "Steps entered — this day's chapter is unlocked" },
        { value: `${Math.min(journeyDay, sequence.length).toLocaleString("en-US")} / ${sequence.length.toLocaleString("en-US")}`, text: `Next in your journey, in order → ${name} ${reading.chapter}` },
      ],
    },
  };
}

function resolveCustomSteps(plan: JourneyPlan, steps: number, taken: ReadingRef[]): ReadingAssignment {
  const list = plan.books.map(getBookIndex);
  const isRead = (bookIndex: number, chapter: number) => taken.some((reading) => reading.bookIndex === bookIndex && reading.chapter === chapter);
  const unreadIn = (bookIndex: number) => Array.from({ length: getBookChapterCount(bookIndex) }, (_, index) => index + 1).some((chapter) => !isRead(bookIndex, chapter));
  const { digits, chapterDigit } = readDigits(steps);
  const lines: StepsExplanation["lines"] = [];
  const first = Number(digits[0]);

  // One book: the first digit is already the chapter (Jonah example in the team doc).
  if (list.length === 1) {
    const bookIndex = list[0];
    const chapter = pickChapter(bookIndex, first, (value) => isRead(bookIndex, value), lines, digits[0]);
    // When the digit wraps, lines[0] already names the book ("Jonah has 4 chapters → …"), so don't repeat it.
    lines[0] = { value: digits[0], text: lines[0].text.startsWith("Chapter") ? `${getBookName(bookIndex)} — your book → ${lines[0].text}` : `Your book · ${lines[0].text}` };
    return { bookIndex, chapter, explanation: { mode: "digits", digits, bookDigit: null, chapterDigit: 0, lines } };
  }

  const position = wrap(first, list.length);
  let bookIndex = list[position - 1];
  lines.push({
    value: digits[0],
    // Two books read as odd → 1st book, even → 2nd book (same as the team doc).
    text: list.length === 2
      ? `${first} is ${first % 2 === 1 ? "odd" : "even"} → your ${ordinal(position)} book → ${getBookName(bookIndex)}`
      : `${ordinal(position)} of your ${list.length} books${first > list.length ? " (counting around your list)" : ""} → ${getBookName(bookIndex)}`,
  });
  if (!unreadIn(bookIndex)) {
    const done = getBookName(bookIndex);
    const start = list.indexOf(bookIndex);
    bookIndex = list.map((_, step) => list[(start + step + 1) % list.length]).find(unreadIn) ?? bookIndex;
    lines.push({ value: "↻", text: `${done} fully read → next of your books: ${getBookName(bookIndex)}` });
  }
  const raw = chapterDigit === null ? 1 : Number(digits[chapterDigit]);
  const chapter = pickChapter(bookIndex, raw, (value) => isRead(bookIndex, value), lines, chapterDigit === null ? "—" : digits[chapterDigit]);
  return { bookIndex, chapter, explanation: { mode: "digits", digits, bookDigit: 0, chapterDigit, lines } };
}

// taken = readings already given on other days of this journey.
export function resolveReading(plan: JourneyPlan, journeyDay: number, steps: number, taken: ReadingRef[]): ReadingAssignment {
  if (plan.type === "automatic") return resolveThirtyThree(journeyDay, steps, taken);
  if (plan.type === "bible") {
    return plan.order === "in-order" ? resolveCustomInOrder({ ...plan, books: bibleBooks.map((book) => book.name) }, journeyDay, steps) : resolveEntireBible(journeyDay, steps, taken);
  }
  return plan.order === "in-order" ? resolveCustomInOrder(plan, journeyDay, steps) : resolveCustomSteps(plan, steps, taken);
}

export const describeBookPosition = (bookIndex: number) =>
  `Book ${bookIndex + 1} of 66 · ${ordinal(getTestamentPosition(bookIndex))} book of the ${bookIndex < 39 ? "Old" : "New"} Testament`;
