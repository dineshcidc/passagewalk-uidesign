import { useSyncExternalStore } from "react";
import { bibleBooks } from "./bibleBooks";
import { bibleVerseCounts } from "./bibleVerseCounts";

// Full King James Version text (public domain, client slide 17), one JSON file per book in public/bible/kjv/NN.json.
// Books load on demand; verse counts are bundled so totals never wait for text.

export type Verse = { number: number; text: string };
export type TestamentName = "Old" | "New";

// Shown on the Reading screen and Passage Ready card (client slide 17: "Leviticus 1 · King James Version").
export const BIBLE_VERSION = { name: "King James Version", short: "KJV" };

export const OLD_TESTAMENT_BOOKS = 39;
export const NEW_TESTAMENT_BOOKS = 27;

export const getBookName = (bookIndex: number) => bibleBooks[bookIndex].name;
export const getBookChapterCount = (bookIndex: number) => bibleBooks[bookIndex].chapters;
export const getBookTestament = (bookIndex: number): TestamentName => (bookIndex < OLD_TESTAMENT_BOOKS ? "Old" : "New");
// 1-based position inside its own testament, e.g. John → 4 (4th book of the New Testament).
export const getTestamentPosition = (bookIndex: number) => (bookIndex < OLD_TESTAMENT_BOOKS ? bookIndex + 1 : bookIndex - OLD_TESTAMENT_BOOKS + 1);
export const getTestamentBooks = (testament: TestamentName) =>
  testament === "Old" ? Array.from({ length: OLD_TESTAMENT_BOOKS }, (_, index) => index) : Array.from({ length: NEW_TESTAMENT_BOOKS }, (_, index) => index + OLD_TESTAMENT_BOOKS);
export const getVerseCount = (bookIndex: number, chapter: number) => bibleVerseCounts[bookIndex]?.[chapter - 1] ?? 0;
export const getBookIndex = (name: string) => bibleBooks.findIndex((book) => book.name === name);

const books = new Map<number, string[][]>();
const requests = new Map<number, Promise<void>>();
const listeners = new Set<() => void>();
let revision = 0;

export function loadBook(bookIndex: number): Promise<void> {
  if (books.has(bookIndex)) return Promise.resolve();
  const existing = requests.get(bookIndex);
  if (existing) return existing;
  const file = `${import.meta.env.BASE_URL}bible/kjv/${String(bookIndex + 1).padStart(2, "0")}.json`;
  const request = fetch(file)
    .then((response) => response.json() as Promise<string[][]>)
    .then((chapters) => {
      books.set(bookIndex, chapters);
      revision += 1;
      listeners.forEach((listener) => listener());
    })
    .catch(() => {
      // Let a later screen retry if the network dropped.
      requests.delete(bookIndex);
    });
  requests.set(bookIndex, request);
  return request;
}

// null = the book has not loaded yet (screens show a short loading state).
export function getChapterVerses(bookIndex: number, chapter: number): Verse[] | null {
  const chapters = books.get(bookIndex);
  if (!chapters) return null;
  return (chapters[chapter - 1] ?? []).flatMap((text, index) => (text ? [{ number: index + 1, text }] : []));
}

// Re-renders the caller whenever another book finishes loading.
export function useBibleRevision() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => revision,
  );
}
