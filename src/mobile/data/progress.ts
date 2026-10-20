import { getBookChapterCount, getBookIndex, getVerseCount, OLD_TESTAMENT_BOOKS } from "./bible";
import { bibleBooks } from "./bibleBooks";
import { getExperience } from "./experiences";
import type { JourneyType } from "../types";
import { formatDayDate, getActivePlan, getDayRecord, getJourneyLength, getRecordedDays, getTodayDay, isDayComplete } from "./journeyStore";

export { getJourneyLength, getTodayDay, isDayComplete };

// Day milestones. 33-Day follows Kathy's five phases; longer journeys use Bible "teaching numbers" that fit
// inside the journey, ending with the journey's own length (names, prompts and certificates: milestones.ts).
// Every journey starts with a Day 1 "first step" badge, so the mock scenario (2 days done) always shows one
// earned badge and its achievement page; Day 3 then unlocks with the celebration when a reflection is saved.
const TEACHING_NUMBERS = [1, 3, 7, 12, 21, 33, 40, 50, 70, 100, 150, 200, 365, 500, 1000];

// Also used to preview a plan's badges before it starts (Designed Experience details).
export function getMilestoneDaysFor(length: number, type: JourneyType) {
  // 33-Day: Kathy's five phases (Day 3 / 7 / 12 / 21 / 33, see milestones.ts) + our Day 1 "First Step" badge.
  if (type === "automatic") return [1, 3, 7, 12, 21, 33];
  return [...TEACHING_NUMBERS.filter((day) => day < length), length];
}

export const getMilestoneDays = () => getMilestoneDaysFor(getJourneyLength(), getActivePlan().type);

// A day badge unlocks once that many days are complete. Mock scenario: 2 days done, so saving one more
// reflection earns Day 3 and shows the celebration screen.
export function getUnlockedMilestones() {
  const completed = getProgress().completedDays;
  return getMilestoneDays().filter((day) => day <= completed);
}

// Date of the day that earned the badge (the Nth completed journey day), or null while locked.
export function getMilestoneDate(milestoneDay: number) {
  const completeDays = getRecordedDays().filter(isDayComplete);
  const earnedOn = completeDays[milestoneDay - 1];
  return earnedOn ? formatDayDate(earnedOn) : null;
}

const formatPercent = (value: number) => (value > 0 && value < 1 ? value.toFixed(1) : String(Math.round(value)));

// Progress rule: see journeyStore.ts (Days 1–2 complete, Day 3 missed, Day 4 pending, Day 5 today).
export function getProgress() {
  const length = getJourneyLength();
  const today = getTodayDay();
  const completedDays = Array.from({ length: today }, (_, index) => index + 1).filter(isDayComplete).length;
  const nextMilestone = getMilestoneDays().find((day) => day > completedDays) ?? length;
  const percent = (completedDays / length) * 100;
  return {
    completedDays,
    percent: formatPercent(percent),
    barWidth: `${percent}%`,
    todayPercent: formatPercent((today / length) * 100),
    todayBarWidth: `${(today / length) * 100}%`,
    nextMilestone,
    daysToGo: nextMilestone - completedDays,
  };
}

const toNumber = (value: string) => Number(value.replace(/,/g, ""));

// Steps entered for a day. null = no entry yet (not the same as 0): today starts "Not entered"
// and missed Day 3 has none until caught up.
export function getDayStepCount(journeyDay: number): number | null {
  const record = getDayRecord(journeyDay);
  return record ? toNumber(record.steps) : null;
}

// Same colour system as the My Journey calendar: complete (green), in progress = steps entered but
// no reflection yet (gold), missed = past day with no entry (red), not entered = today with no steps yet.
export type DayStatus = "complete" | "in-progress" | "missed" | "not-entered" | "upcoming";

export function getDayStatus(journeyDay: number): DayStatus {
  const today = getTodayDay();
  if (journeyDay > today) return "upcoming";
  if (isDayComplete(journeyDay)) return "complete";
  if (getDayStepCount(journeyDay) !== null) return "in-progress";
  return journeyDay === today ? "not-entered" : "missed";
}

// Days with steps but no saved reflection (e.g. "Do this later" on Passage Ready), newest first.
export function getPendingDays() {
  return getRecordedDays().filter((day) => !isDayComplete(day)).sort((a, b) => b - a);
}

// Client definition: passage = verse.
// Total steps = every day with steps entered (today's steps count as soon as they are entered).
// Total passages = verses of chapters actually completed (reflection saved).
export function getJourneyTotals() {
  const stepDays = getRecordedDays();
  const readDays = stepDays.filter(isDayComplete);
  const steps = stepDays.reduce((total, day) => total + (getDayStepCount(day) ?? 0), 0);
  const passages = readDays.reduce((total, day) => {
    const reading = getDayRecord(day)?.reading;
    return total + (reading ? getVerseCount(reading.bookIndex, reading.chapter) : 0);
  }, 0);
  return {
    steps: steps.toLocaleString("en-US"),
    stepDays: stepDays.length,
    passages: passages.toLocaleString("en-US"),
    readDays: readDays.length,
  };
}

// Home "always going up" chart (Kathy, review call 3: passages are "the one that never goes down… show where it
// goes up"). Day 1 → today: that day's steps (they vary) and the verses read so far (they only climb).
export function getPassagesGrowth() {
  let total = 0;
  return Array.from({ length: getTodayDay() }, (_, index) => {
    const day = index + 1;
    const reading = getDayRecord(day)?.reading;
    const complete = isDayComplete(day);
    if (complete && reading) total += getVerseCount(reading.bookIndex, reading.chapter);
    return { day, steps: getDayStepCount(day), total, complete, status: getDayStatus(day) };
  });
}

// Chapters read per book (Create a Journey: the chosen books; Whole Bible: all 66; Designed Experience: the
// plan's books, out of the plan's chapters). Drives book badges — finished always means the whole book.
export function getBookProgress() {
  const plan = getActivePlan();
  const bookIndexes = plan.type === "custom" || plan.type === "designed" ? plan.books.map(getBookIndex) : plan.type === "bible" ? bibleBooks.map((_, index) => index) : [];
  const experience = getExperience(plan.experience);
  const completeReadings = getRecordedDays().filter(isDayComplete).map((day) => getDayRecord(day)!.reading);
  const todayReading = getDayRecord(getTodayDay())?.reading;
  return bookIndexes.map((bookIndex) => {
    const read = new Set(completeReadings.filter((reading) => reading.bookIndex === bookIndex).map((reading) => reading.chapter)).size;
    const total = experience?.books.find((book) => getBookIndex(book.name) === bookIndex)?.chapters.length ?? getBookChapterCount(bookIndex);
    return { bookIndex, read, total, finished: read === getBookChapterCount(bookIndex), current: todayReading?.bookIndex === bookIndex };
  });
}

// Whole-Bible progress for the Home dashboard (client slide 20): every completed chapter counts,
// whatever the journey type. % Old / New Testament = how much of that testament has been read.
const OLD_TESTAMENT_CHAPTERS = bibleBooks.slice(0, OLD_TESTAMENT_BOOKS).reduce((total, book) => total + book.chapters, 0);
const BIBLE_CHAPTERS = bibleBooks.reduce((total, book) => total + book.chapters, 0);

export function getBibleProgress() {
  const chapters = new Set(getRecordedDays().filter(isDayComplete).map((day) => {
    const { bookIndex, chapter } = getDayRecord(day)!.reading;
    return `${bookIndex}:${chapter}`;
  }));
  const readings = [...chapters].map((key) => key.split(":").map(Number) as [number, number]);
  const oldRead = readings.filter(([bookIndex]) => bookIndex < OLD_TESTAMENT_BOOKS).length;
  const newRead = readings.length - oldRead;
  const newTotal = BIBLE_CHAPTERS - OLD_TESTAMENT_CHAPTERS;
  const books = [...new Set(readings.map(([bookIndex]) => bookIndex))].sort((a, b) => a - b).map((bookIndex) => {
    const read = readings.filter(([index]) => index === bookIndex).length;
    const total = getBookChapterCount(bookIndex);
    return { bookIndex, read, total, percent: formatPercent((read / total) * 100) };
  });
  return {
    chaptersRead: readings.length,
    totalChapters: BIBLE_CHAPTERS,
    biblePercent: formatPercent((readings.length / BIBLE_CHAPTERS) * 100),
    bibleBarWidth: `${(readings.length / BIBLE_CHAPTERS) * 100}%`,
    old: { read: oldRead, total: OLD_TESTAMENT_CHAPTERS, percent: formatPercent((oldRead / OLD_TESTAMENT_CHAPTERS) * 100), barWidth: `${(oldRead / OLD_TESTAMENT_CHAPTERS) * 100}%` },
    new: { read: newRead, total: newTotal, percent: formatPercent((newRead / newTotal) * 100), barWidth: `${(newRead / newTotal) * 100}%` },
    books,
    booksStarted: books.length,
  };
}
