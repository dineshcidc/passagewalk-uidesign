// Each journey day reads one full chapter — or several on a faster whole-Bible pace (1 year = 3–4 a day).
// "Passages read" = their verse count (client definition: passage = verse).
// The chapters for a day come from the steps → reading rule (journeyStore + stepsRule); text from the bundled King James Version.
import { getBookName, getBookTestament, getChapterVerses, getVerseCount, type Verse } from "./bible";
import { formatDayDate, getDayRecord, getHighlightNumbers, getRecordedDays, isEntryDeleted, setHighlightNumbers } from "./journeyStore";
import { formatReadingRefs, type StepsExplanation } from "./stepsRule";

export type { Verse };

// A verse of the day's reading. key = chapter slot × 1000 + verse number, so a one-chapter day keeps plain verse
// numbers as keys (highlights store keys). label = "2:7" ("Genesis 2:7" when the day crosses books);
// tag = what sits beside a highlighted verse: "7" on a one-chapter day, else the label.
export type DayVerse = Verse & { key: number; slot: number; label: string; tag: string };

export type ChapterPart = {
  slot: number;
  bookIndex: number;
  book: string;
  chapter: number;
  reference: string;
  verseCount: number;
  // null while the book's text is still loading.
  verses: DayVerse[] | null;
};

export type Chapter = {
  journeyDay: number;
  // The first chapter of the day.
  bookIndex: number;
  book: string;
  chapter: number;
  // "Genesis 1–4" on a several-chapter day.
  reference: string;
  testament: string;
  // Every chapter of the day, in reading order (one for most journeys).
  parts: ChapterPart[];
  verseCount: number;
  // null until every chapter of the day has loaded.
  verses: DayVerse[] | null;
  explanation: StepsExplanation;
};

export type HighlightGroup = {
  journeyDay: number;
  date: string;
  reference: string;
  verses: DayVerse[];
};

// null = no steps entered for this day yet, so no reading has been given.
export function getChapter(journeyDay: number): Chapter | null {
  const record = getDayRecord(journeyDay);
  if (!record) return null;
  const { bookIndex, chapter, chapters, explanation } = record.reading;
  const several = chapters.length > 1;
  const crossesBooks = new Set(chapters.map((ref) => ref.bookIndex)).size > 1;
  const parts = chapters.map((ref, slot): ChapterPart => {
    const book = getBookName(ref.bookIndex);
    const verses = getChapterVerses(ref.bookIndex, ref.chapter);
    return {
      slot,
      bookIndex: ref.bookIndex,
      book,
      chapter: ref.chapter,
      reference: `${book} ${ref.chapter}`,
      verseCount: getVerseCount(ref.bookIndex, ref.chapter),
      verses: verses?.map((verse) => {
        const label = `${crossesBooks ? `${book} ` : ""}${ref.chapter}:${verse.number}`;
        return { ...verse, key: slot * 1000 + verse.number, slot, label, tag: several ? label : String(verse.number) };
      }) ?? null,
    };
  });
  const testaments = new Set(chapters.map((ref) => getBookTestament(ref.bookIndex)));
  return {
    journeyDay,
    bookIndex,
    book: getBookName(bookIndex),
    chapter,
    reference: formatReadingRefs(chapters),
    testament: testaments.size > 1 ? "OLD & NEW TESTAMENTS" : `${getBookTestament(bookIndex).toUpperCase()} TESTAMENT`,
    parts,
    verseCount: parts.reduce((total, part) => total + part.verseCount, 0),
    verses: parts.every((part) => part.verses) ? parts.flatMap((part) => part.verses!) : null,
    explanation,
  };
}

// verseKeys = DayVerse keys (plain verse numbers on a one-chapter day).
export function saveDayHighlights(journeyDay: number, verseKeys: number[]) {
  setHighlightNumbers(journeyDay, verseKeys);
}

export function getDayHighlights(journeyDay: number): DayVerse[] {
  const verses = getChapter(journeyDay)?.verses ?? [];
  const keys = getHighlightNumbers(journeyDay);
  return verses.filter((verse) => keys.includes(verse.key));
}

// The verse quoted on a Journal entry: the first highlight, else the day's first verse.
export function getKeyVerse(journeyDay: number) {
  return getDayHighlights(journeyDay)[0]?.text ?? getChapter(journeyDay)?.verses?.[0]?.text ?? "";
}

export function getHighlightGroups(): HighlightGroup[] {
  return getRecordedDays()
    .filter((journeyDay) => !isEntryDeleted(journeyDay))
    .map((journeyDay) => ({ journeyDay, date: formatDayDate(journeyDay), reference: getChapter(journeyDay)?.reference ?? "", verses: getDayHighlights(journeyDay) }))
    .filter((group) => group.verses.length)
    .sort((a, b) => b.journeyDay - a.journeyDay);
}
