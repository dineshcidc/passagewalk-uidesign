import { getBookChapterCount, getBookIndex } from "./bible";
import type { ReadingRef } from "./stepsRule";

// Designed Experiences = Kathy's "Targeted books of the Bible" (review call 4,
// Client-call/Review-calls/Review-call-4/PW Targeted Bible List.pdf). Books with the same number of chapters walk
// together, so the experience teaches the books people rarely open AND what they have in common
// (Obadiah, Philemon, 2 John, 3 John and Jude all have one chapter → a 5-day experience).
// 31 experiences, 2 to 150 days; all of them together = the whole Bible (1,189 chapters).
// One chapter = one day; "Read in order" follows Kathy's book order within the group.
// Names, taglines and verses are ours until Kathy sends her own copy ("we might create verbiage… at some point").
export type Experience = {
  id: string;
  days: number;
  name: string;
  // The common ground, shown as the card's tag: "3 CHAPTERS EACH", or "ONE OF A KIND" for a book that stands alone.
  theme: string;
  chaptersEach: number;
  tagline: string;
  description: string;
  verse: { text: string; reference: string }; // KJV
  books: { name: string; chapters: number[] }[];
};

// Kathy's list, in her order (grouped by chapters per book).
const targetedGroups: string[][] = [
  ["Obadiah", "Philemon", "2 John", "3 John", "Jude"],
  ["Haggai"],
  ["Joel", "Nahum", "Habakkuk", "Zephaniah", "2 Thessalonians", "Titus", "2 Peter"],
  ["Ruth", "Jonah", "Malachi", "Philippians", "Colossians", "2 Timothy"],
  ["Lamentations", "1 Thessalonians", "James", "1 Peter", "1 John"],
  ["Galatians", "Ephesians", "1 Timothy"],
  ["Micah"],
  ["Song of Solomon"],
  ["Amos"],
  ["Ezra", "Esther"],
  ["Ecclesiastes", "Daniel"],
  ["Nehemiah", "2 Corinthians", "Hebrews"],
  ["Hosea", "Zechariah"],
  ["Mark", "Romans", "1 Corinthians"],
  ["Judges", "John"],
  ["1 Kings", "Revelation"],
  ["Joshua", "2 Samuel", "Luke"],
  ["2 Kings"],
  ["Leviticus"],
  ["Matthew", "Acts"],
  ["1 Chronicles"],
  ["1 Samuel", "Proverbs"],
  ["Deuteronomy"],
  ["Numbers", "2 Chronicles"],
  ["Exodus"],
  ["Job"],
  ["Ezekiel"],
  ["Genesis"],
  ["Jeremiah"],
  ["Isaiah"],
  ["Psalms"],
];

// Until Kathy chooses a verse per experience, every walk opens with the same one.
const SHARED_VERSE = { text: "Thy word is a lamp unto my feet, and a light unto my path.", reference: "Psalm 119:105" };

const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const inWords = (value: number) => words[value] ?? String(value);
const capitalize = (value: string) => value[0].toUpperCase() + value.slice(1);
const listBooks = (names: string[]) => (names.length === 2 ? `${names[0]} and ${names[1]}` : `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`);

function createExperience(names: string[]): Experience {
  const chaptersEach = getBookChapterCount(getBookIndex(names[0]));
  const days = chaptersEach * names.length;
  const single = names.length === 1;
  const chapterWord = chaptersEach === 1 ? "chapter" : "chapters";
  return {
    id: `targeted-${names[0].toLowerCase().replace(/\s+/g, "-")}`,
    days,
    // Kathy's wording: "5 Day Designed Experience".
    name: `${days}-Day Designed Experience`,
    theme: single ? "ONE OF A KIND" : `${chaptersEach} ${chapterWord.toUpperCase()} EACH`,
    chaptersEach,
    tagline: single
      ? `The whole book of ${names[0]}, ${days} ${chapterWord}.`
      : `${capitalize(inWords(names.length))} books, ${inWords(chaptersEach)} ${chapterWord} each.`,
    description: single
      ? `${names[0]} is the only book of the Bible with ${inWords(chaptersEach)} ${chapterWord}. Walk it one chapter a day.`
      : `${listBooks(names)} each have exactly ${inWords(chaptersEach)} ${chapterWord}. Walk them together — books you may never have opened, side by side.`,
    verse: SHARED_VERSE,
    books: names.map((name) => ({ name, chapters: Array.from({ length: chaptersEach }, (_, index) => index + 1) })),
  };
}

// Shortest first; equal lengths keep Kathy's order (e.g. the two 24-day experiences: 4-chapter books, then Ecclesiastes + Daniel).
export const experiences: Experience[] = targetedGroups.map(createExperience).map((experience, index) => ({ experience, index }))
  .sort((a, b) => a.experience.days - b.experience.days || a.index - b.index)
  .map(({ experience }) => experience);

// List filter (31 walks, 25 different lengths, so ranges instead of one chip per length).
export const EXPERIENCE_RANGES: { label: string; min: number; max: number }[] = [
  { label: "Under 10 days", min: 1, max: 9 },
  { label: "10–30 days", min: 10, max: 30 },
  { label: "31–60 days", min: 31, max: 60 },
  { label: "60+ days", min: 61, max: Infinity },
];

export const getExperience = (id?: string) => experiences.find((experience) => experience.id === id) ?? null;

// Day N of the experience reads the Nth chapter of this list (in order), or the steps pick from it (randomly).
export const getExperienceSequence = (experience: Experience): ReadingRef[] =>
  experience.books.flatMap((book) => book.chapters.map((chapter) => ({ bookIndex: getBookIndex(book.name), chapter })));

// "Habakkuk 1–3", "Mark 1–16", "Jude 1"
export const formatBookChapters = (book: Experience["books"][number]) =>
  book.chapters.length === 1 ? `${book.name} ${book.chapters[0]}` : `${book.name} ${book.chapters[0]}–${book.chapters[book.chapters.length - 1]}`;
