import type { JourneyPlan } from "../types";
import { getBookChapterCount, getBookIndex, getBookName, getTestamentBooks, getTestamentPosition, type TestamentName } from "./bible";
import { bibleBooks } from "./bibleBooks";
import { getExperience, getExperienceSequence } from "./experiences";
import { formatCount, getDayChapterCount, getDayChapterStart } from "./journeyPlans";

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
// Designed:        like Choose Your Own, over the plan's own chapter list (experiences.ts).
// Whole Bible pace (review call 4): a day can read several chapters (1 year = 3–4 a day). In chapter order the
//                  day reads its share of Genesis 1 → Revelation 22; randomly, the steps pick the first chapter
//                  and the day reads on from there, skipping chapters already read.

export type ReadingRef = { bookIndex: number; chapter: number };

export type StepsExplanation = {
  mode: "digits" | "unlock";
  digits: string[];
  bookDigit: number | null;
  chapterDigit: number | null;
  // Shown top to bottom on the "Your steps led you here" card: value chip + sentence.
  lines: { value: string; text: string }[];
};

// bookIndex / chapter = the day's first chapter; chapters = every chapter the day reads (one for most journeys).
export type ReadingAssignment = ReadingRef & { chapters: ReadingRef[]; explanation: StepsExplanation };
type SingleAssignment = ReadingRef & { explanation: StepsExplanation };

const withChapters = (reading: SingleAssignment): ReadingAssignment => ({ ...reading, chapters: [{ bookIndex: reading.bookIndex, chapter: reading.chapter }] });

// Genesis 1 → Revelation 22, the whole Bible as one list of 1,189 chapters.
const bibleSequence: ReadingRef[] = bibleBooks.flatMap((book, bookIndex) => Array.from({ length: book.chapters }, (_, index) => ({ bookIndex, chapter: index + 1 })));

// "Genesis 1–4", "Galatians 5 – Ephesians 1", "Genesis 1, 3–4", "Ruth 4, Matthew 1".
export function formatReadingRefs(refs: ReadingRef[]) {
  if (refs.length === 0) return "";
  const position = (ref: ReadingRef) => bibleSequence.findIndex((item) => item.bookIndex === ref.bookIndex && item.chapter === ref.chapter);
  const contiguous = refs.every((ref, index) => index === 0 || position(ref) === position(refs[index - 1]) + 1);
  const first = refs[0];
  const last = refs[refs.length - 1];
  if (refs.length === 1) return `${getBookName(first.bookIndex)} ${first.chapter}`;
  if (contiguous) {
    return first.bookIndex === last.bookIndex
      ? `${getBookName(first.bookIndex)} ${first.chapter}–${last.chapter}`
      : `${getBookName(first.bookIndex)} ${first.chapter} – ${getBookName(last.bookIndex)} ${last.chapter}`;
  }
  // Not one run: each book with its chapter ranges.
  const groups: { bookIndex: number; chapters: number[] }[] = [];
  refs.forEach((ref) => {
    const group = groups[groups.length - 1];
    if (group && group.bookIndex === ref.bookIndex) group.chapters.push(ref.chapter);
    else groups.push({ bookIndex: ref.bookIndex, chapters: [ref.chapter] });
  });
  return groups.map(({ bookIndex, chapters }) => {
    const ranges: string[] = [];
    chapters.forEach((chapter, index) => {
      if (index > 0 && chapter === chapters[index - 1] + 1) ranges[ranges.length - 1] = `${ranges[ranges.length - 1].split("–")[0]}–${chapter}`;
      else ranges.push(String(chapter));
    });
    return `${getBookName(bookIndex)} ${ranges.join(", ")}`;
  }).join(", ");
}

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

function resolveThirtyThree(journeyDay: number, steps: number, taken: ReadingRef[]): SingleAssignment {
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

function resolveEntireBible(journeyDay: number, steps: number, taken: ReadingRef[]): SingleAssignment {
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

function resolveCustomInOrder(plan: JourneyPlan, journeyDay: number, steps: number): SingleAssignment {
  const sequence = plan.books.flatMap((name) => {
    const bookIndex = getBookIndex(name);
    return Array.from({ length: getBookChapterCount(bookIndex) }, (_, index) => ({ bookIndex, chapter: index + 1 }));
  });
  return resolveInOrder(sequence, journeyDay, steps);
}

function resolveInOrder(sequence: ReadingRef[], journeyDay: number, steps: number): SingleAssignment {
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

function resolveCustomSteps(plan: JourneyPlan, steps: number, taken: ReadingRef[]): SingleAssignment {
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

// Designed Experience, "Read randomly": like Create a Journey, but only the plan's own chapters count
// (Every Book Walk reads chapter 1 of each book, so there the steps pick the book only).
function resolveExperienceSteps(sequence: ReadingRef[], steps: number, taken: ReadingRef[]): SingleAssignment {
  const books = [...new Set(sequence.map((reading) => reading.bookIndex))];
  const chaptersIn = (bookIndex: number) => sequence.filter((reading) => reading.bookIndex === bookIndex).map((reading) => reading.chapter);
  const isRead = (bookIndex: number, chapter: number) => taken.some((reading) => reading.bookIndex === bookIndex && reading.chapter === chapter);
  const unreadIn = (bookIndex: number) => chaptersIn(bookIndex).some((chapter) => !isRead(bookIndex, chapter));
  const { digits, chapterDigit } = readDigits(steps);
  const lines: StepsExplanation["lines"] = [];
  const first = Number(digits[0]);

  // Chapter from a digit, counted around the plan's chapters of that book, then the next unread one.
  const pick = (bookIndex: number, raw: number, digitLabel: string, prefix: string) => {
    const options = chaptersIn(bookIndex);
    const name = getBookName(bookIndex);
    let chapter = options[wrap(raw, options.length) - 1];
    lines.push({ value: digitLabel, text: chapter === raw ? `${prefix}Chapter ${chapter}` : `${name} has ${options.length} chapters in this walk → counting around → Chapter ${chapter}` });
    if (isRead(bookIndex, chapter)) {
      const start = options.indexOf(chapter);
      const next = options.map((_, step) => options[(start + step + 1) % options.length]).find((value) => !isRead(bookIndex, value));
      lines.push({ value: "↻", text: `${name} ${chapter} already read → next unread: Chapter ${next ?? chapter}` });
      chapter = next ?? chapter;
    }
    return chapter;
  };

  // One book: the first digit is already the chapter (same as Create a Journey).
  if (books.length === 1) {
    const bookIndex = books[0];
    const chapter = pick(bookIndex, first, digits[0], `${getBookName(bookIndex)} — your experience book → `);
    return { bookIndex, chapter, explanation: { mode: "digits", digits, bookDigit: null, chapterDigit: 0, lines } };
  }

  const position = wrap(first, books.length);
  let bookIndex = books[position - 1];
  lines.push({
    value: digits[0],
    text: books.length === 2
      ? `${first} is ${first % 2 === 1 ? "odd" : "even"} → the ${ordinal(position)} book of this walk → ${getBookName(bookIndex)}`
      : `${ordinal(position)} of the ${books.length} books in this walk${first > books.length ? " (counting around)" : ""} → ${getBookName(bookIndex)}`,
  });
  if (!unreadIn(bookIndex)) {
    const done = getBookName(bookIndex);
    const start = books.indexOf(bookIndex);
    bookIndex = books.map((_, step) => books[(start + step + 1) % books.length]).find(unreadIn) ?? bookIndex;
    lines.push({ value: "↻", text: `${done} already read → next book in this walk: ${getBookName(bookIndex)}` });
  }
  const options = chaptersIn(bookIndex);
  if (options.length === 1) {
    lines.push({ value: String(options[0]), text: `This walk reads ${getBookName(bookIndex)} ${options[0]}` });
    return { bookIndex, chapter: options[0], explanation: { mode: "digits", digits, bookDigit: 0, chapterDigit: null, lines } };
  }
  const raw = chapterDigit === null ? 1 : Number(digits[chapterDigit]);
  const chapter = pick(bookIndex, raw, chapterDigit === null ? "—" : digits[chapterDigit], chapterDigit === null ? "No chapter digit → " : "");
  return { bookIndex, chapter, explanation: { mode: "digits", digits, bookDigit: 0, chapterDigit, lines } };
}

// Whole Bible, in chapter order: the day's share of the 1,189 chapters (1 year: Day 1 = Genesis 1–4, Day 2 = Genesis 5–7).
function resolveBibleInOrder(plan: JourneyPlan, journeyDay: number, steps: number): ReadingAssignment {
  const day = Math.min(journeyDay, plan.days);
  const start = getDayChapterStart(plan.days, day);
  const chapters = bibleSequence.slice(start - 1, start - 1 + getDayChapterCount(plan.days, day));
  const end = start + chapters.length - 1;
  const several = chapters.length > 1;
  return {
    ...chapters[0],
    chapters,
    explanation: {
      mode: "unlock",
      digits: String(steps).split(""),
      bookDigit: null,
      chapterDigit: null,
      lines: [
        { value: "✓", text: several ? `Steps entered — this day's ${chapters.length} chapters are unlocked` : "Steps entered — this day's chapter is unlocked" },
        { value: `${several ? `${formatCount(start)}–${formatCount(end)}` : formatCount(start)} / ${formatCount(bibleSequence.length)}`, text: `Next in your journey, in order → ${formatReadingRefs(chapters)}` },
      ],
    },
  };
}

// Whole Bible, randomly: the steps pick the first chapter (Entire Bible rule), then the day reads on from there —
// through the rest of that book and into the next — skipping chapters already read.
function resolveBibleSteps(plan: JourneyPlan, journeyDay: number, steps: number, taken: ReadingRef[]): ReadingAssignment {
  const first = resolveEntireBible(journeyDay, steps, taken);
  const count = getDayChapterCount(plan.days, Math.min(journeyDay, plan.days));
  if (count === 1) return withChapters(first);
  const isRead = (ref: ReadingRef) => taken.some((reading) => reading.bookIndex === ref.bookIndex && reading.chapter === ref.chapter);
  const startAt = bibleSequence.findIndex((ref) => ref.bookIndex === first.bookIndex && ref.chapter === first.chapter);
  const chapters: ReadingRef[] = [{ bookIndex: first.bookIndex, chapter: first.chapter }];
  for (let step = 1; step < bibleSequence.length && chapters.length < count; step += 1) {
    const next = bibleSequence[(startAt + step) % bibleSequence.length];
    if (!isRead(next)) chapters.push(next);
  }
  const lines = [...first.explanation.lines, { value: `+${chapters.length - 1}`, text: `Your pace reads ${chapters.length} chapters a day → reading on: ${formatReadingRefs(chapters)}` }];
  return { ...first, chapters, explanation: { ...first.explanation, lines } };
}

// taken = chapters already given on other days of this journey.
export function resolveReading(plan: JourneyPlan, journeyDay: number, steps: number, taken: ReadingRef[]): ReadingAssignment {
  if (plan.type === "bible") return plan.order === "in-order" ? resolveBibleInOrder(plan, journeyDay, steps) : resolveBibleSteps(plan, journeyDay, steps, taken);
  if (plan.type === "automatic") return withChapters(resolveThirtyThree(journeyDay, steps, taken));
  if (plan.type === "designed") {
    const experience = getExperience(plan.experience);
    const sequence = experience ? getExperienceSequence(experience) : [];
    return withChapters(plan.order === "in-order" ? resolveInOrder(sequence, journeyDay, steps) : resolveExperienceSteps(sequence, steps, taken));
  }
  return withChapters(plan.order === "in-order" ? resolveCustomInOrder(plan, journeyDay, steps) : resolveCustomSteps(plan, steps, taken));
}

export const describeBookPosition = (bookIndex: number) =>
  `Book ${bookIndex + 1} of 66 · ${ordinal(getTestamentPosition(bookIndex))} book of the ${bookIndex < 39 ? "Old" : "New"} Testament`;
