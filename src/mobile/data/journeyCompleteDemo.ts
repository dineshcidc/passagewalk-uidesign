import { getBookChapterCount, getBookIndex, getVerseCount, OLD_TESTAMENT_BOOKS } from "./bible";
import { defaultJourneyPlan, formatCount } from "./journeyPlans";
import { formatDayDate } from "./journeyStore";
import { getMilestoneInfo } from "./milestones";
import { getMilestoneDaysFor } from "./progress";

// Prototype demo (Settings → Prototype demo → Journey complete): what a user sees after saving the last
// day of a 33-Day Walk. The app's mock journey is on Day 5, so this uses a finished sample walk instead.
// The developers show the same screens when the final day's reflection is saved.

// 33 readings as the 33-Day rule gives them: odd days Old Testament, even days New, a new book every day.
const readings: [string, number][] = [
  ["Genesis", 1], ["Matthew", 5], ["Ruth", 1], ["John", 3], ["Psalms", 23], ["Romans", 8], ["Proverbs", 3], ["James", 1],
  ["Isaiah", 40], ["Philippians", 4], ["Jonah", 2], ["Luke", 15], ["Exodus", 14], ["Hebrews", 11], ["Joshua", 1], ["Philemon", 1],
  ["1 Samuel", 17], ["Ephesians", 6], ["Daniel", 6], ["Mark", 4], ["Micah", 6], ["Acts", 2], ["Nehemiah", 8], ["1 Corinthians", 13],
  ["Habakkuk", 3], ["Galatians", 5], ["Esther", 4], ["Colossians", 3], ["Jeremiah", 29], ["Jude", 1], ["Ecclesiastes", 3], ["Revelation", 21],
  ["Lamentations", 3],
];

const LENGTH = readings.length;
// Steps per day: a steady rhythm between about 6,000 and 13,000, with one big day (Day 18).
const steps = readings.map((_, index) => (index === 17 ? 15204 : 6000 + ((index * 2731 + 1500) % 7000)));
const verses = readings.map(([book, chapter]) => getVerseCount(getBookIndex(book), chapter));

export function getJourneyCompleteDemo() {
  const plan = defaultJourneyPlan;
  const totalSteps = steps.reduce((total, value) => total + value, 0);
  const totalVerses = verses.reduce((total, value) => total + value, 0);
  const bestIndex = steps.indexOf(Math.max(...steps));
  // Verses read so far, day by day — "the one that never goes down" (Kathy), so it only climbs.
  const growth = verses.reduce<number[]>((list, value) => [...list, (list[list.length - 1] ?? 0) + value], []);
  const books = readings.map(([book, chapter]) => {
    const total = getBookChapterCount(getBookIndex(book));
    return { book, chapter, total, percent: Math.round((1 / total) * 100) };
  });
  const oldCount = readings.filter(([book]) => getBookIndex(book) < OLD_TESTAMENT_BOOKS).length;
  const finished = books.filter((book) => book.total === 1).map((book) => book.book);
  // Robin: "you completed 20% of John and 15% of James" — the books they went furthest in.
  const furthest = [...books].sort((a, b) => b.percent - a.percent || a.total - b.total).slice(0, 5);
  const badges = getMilestoneDaysFor(LENGTH, "automatic").map((day) => ({ day, name: getMilestoneInfo(day, plan, LENGTH).shortName }));
  const finalInfo = getMilestoneInfo(LENGTH, plan, LENGTH);

  return {
    plan,
    days: LENGTH,
    startDate: formatDayDate(1),
    endDate: formatDayDate(LENGTH),
    totalSteps,
    miles: Math.round(totalSteps / 2000), // about 2,000 steps to a mile
    totalVerses,
    chapters: LENGTH,
    booksVisited: books.length,
    visitedBooks: readings.map(([book]) => getBookIndex(book)),
    oldCount,
    newCount: LENGTH - oldCount,
    highlights: 74,
    reflections: LENGTH,
    best: { day: bestIndex + 1, steps: steps[bestIndex] },
    steps,
    growth,
    finished,
    furthest,
    badges,
    finalInfo,
    favourite: { text: "I can do all things through Christ which strengtheneth me.", reference: "Philippians 4:13", day: 10 },
    summary: `${formatCount(LENGTH)} days · ${formatCount(totalSteps)} steps · ${formatCount(totalVerses)} verses`,
  };
}

export type JourneyCompleteDemo = ReturnType<typeof getJourneyCompleteDemo>;
