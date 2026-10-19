import { getChapter } from "./chapters";
import { deleteEntry, formatDayDate, formatShortDate, getDayRecord, getDayReflection, getRecordedDays, isDayComplete, isEntryDeleted, type ReflectionAnswers } from "./journeyStore";

export type JournalEntry = {
  id: number;
  journeyDay: number;
  date: string;
  shortDate: string;
  time: string;
  steps: string;
  reference: string;
  verseCount: number;
  testament: string;
  status: "complete" | "in-progress";
  answers: ReflectionAnswers;
};

// One entry per day that has steps: "Completed" once the reflection is saved, otherwise "In progress"
// (e.g. pending Day 4, or today / a caught-up Day 3 before reflecting). Newest journey day first.
export function getJournalEntries(): JournalEntry[] {
  return getRecordedDays()
    .map((journeyDay): JournalEntry => {
      const record = getDayRecord(journeyDay)!;
      const chapter = getChapter(journeyDay)!;
      const reflection = getDayReflection(journeyDay);
      return {
        id: journeyDay,
        journeyDay,
        date: formatDayDate(journeyDay),
        shortDate: formatShortDate(journeyDay),
        time: reflection?.time ?? record.time,
        steps: record.steps,
        reference: chapter.reference,
        verseCount: chapter.verseCount,
        testament: chapter.testament,
        status: isDayComplete(journeyDay) ? "complete" : "in-progress",
        answers: reflection?.answers ?? ["", "", ""],
      };
    })
    .sort((a, b) => b.journeyDay - a.journeyDay);
}

// Prototype-only: entries deleted from the Journal stay hidden across screens.
export function deleteJournalEntry(id: number) {
  deleteEntry(id);
}

export function getVisibleJournalEntries(): JournalEntry[] {
  return getJournalEntries().filter((entry) => !isEntryDeleted(entry.id));
}

export function getLastCompletedEntry(): JournalEntry | null {
  return getVisibleJournalEntries().find((entry) => entry.status === "complete") ?? null;
}
