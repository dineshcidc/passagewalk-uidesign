// Each journey day reads one full chapter; "passages read" = its verse count (client definition: passage = verse).
// The chapter for a day comes from the steps → reading rule (journeyStore + stepsRule); text from the bundled King James Version.
import { getBookName, getBookTestament, getChapterVerses, getVerseCount, type Verse } from "./bible";
import { formatDayDate, getDayRecord, getHighlightNumbers, getRecordedDays, isEntryDeleted, setHighlightNumbers } from "./journeyStore";
import type { StepsExplanation } from "./stepsRule";

export type { Verse };

export type Chapter = {
  journeyDay: number;
  bookIndex: number;
  book: string;
  chapter: number;
  reference: string;
  testament: string;
  verseCount: number;
  // null while the book's text is still loading.
  verses: Verse[] | null;
  explanation: StepsExplanation;
};

export type HighlightGroup = {
  journeyDay: number;
  date: string;
  reference: string;
  verses: Verse[];
};

// null = no steps entered for this day yet, so no reading has been given.
export function getChapter(journeyDay: number): Chapter | null {
  const record = getDayRecord(journeyDay);
  if (!record) return null;
  const { bookIndex, chapter, explanation } = record.reading;
  const book = getBookName(bookIndex);
  return {
    journeyDay,
    bookIndex,
    book,
    chapter,
    reference: `${book} ${chapter}`,
    testament: `${getBookTestament(bookIndex).toUpperCase()} TESTAMENT`,
    verseCount: getVerseCount(bookIndex, chapter),
    verses: getChapterVerses(bookIndex, chapter),
    explanation,
  };
}

export function saveDayHighlights(journeyDay: number, verseNumbers: number[]) {
  setHighlightNumbers(journeyDay, verseNumbers);
}

export function getDayHighlights(journeyDay: number): Verse[] {
  const verses = getChapter(journeyDay)?.verses ?? [];
  const numbers = getHighlightNumbers(journeyDay);
  return verses.filter((verse) => numbers.includes(verse.number));
}

// The verse quoted on a Journal entry: the first highlight, else the chapter's first verse.
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
