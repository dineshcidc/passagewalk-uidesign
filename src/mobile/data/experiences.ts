import { getBookChapterCount, getBookIndex } from "./bible";
import { bibleBooks } from "./bibleBooks";
import type { ReadingRef } from "./stepsRule";

// Designed Experiences (review call 3): ready-made walks of 3, 7, 8, 12, 40, 66 and 120 days through chosen books.
// Kathy will send the real books for each length; these are our placeholder plans — swap the data, the screens stay.
// One chapter = one day, so every plan's chapters add up to its days.
export type Experience = {
  id: string;
  days: number;
  name: string;
  theme: string; // Kathy's movement words: move, strengthen, build…
  tagline: string;
  description: string;
  verse: { text: string; reference: string }; // KJV
  books: { name: string; chapters: number[] }[];
};

const allChapters = (name: string) => Array.from({ length: getBookChapterCount(getBookIndex(name)) }, (_, index) => index + 1);
const whole = (...names: string[]) => names.map((name) => ({ name, chapters: allChapters(name) }));

export const experiences: Experience[] = [
  {
    id: "faith-in-the-waiting",
    days: 3,
    name: "Faith in the Waiting",
    theme: "TRUST",
    tagline: "From honest questions to quiet trust.",
    description: "Walk with the prophet Habakkuk as he brings his questions to God and finds strength to keep going.",
    verse: { text: "The LORD God is my strength, and he will make my feet like hinds' feet, and he will make me to walk upon mine high places.", reference: "Habakkuk 3:19" },
    books: whole("Habakkuk"),
  },
  {
    id: "walk-humbly",
    days: 7,
    name: "Walk Humbly",
    theme: "MOVE",
    tagline: "A week with Micah on what God asks of us.",
    description: "Seven days through Micah — a call to do justly, love mercy, and walk humbly with God.",
    verse: { text: "He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?", reference: "Micah 6:8" },
    books: whole("Micah"),
  },
  {
    id: "strength-for-the-walk",
    days: 8,
    name: "Strength for the Walk",
    theme: "STRENGTHEN",
    tagline: "Joy and strength from Paul's letters.",
    description: "Philippians and Colossians — letters written in chains that overflow with joy, strength, and hope.",
    verse: { text: "I can do all things through Christ which strengtheneth me.", reference: "Philippians 4:13" },
    books: whole("Philippians", "Colossians"),
  },
  {
    id: "courage-walk",
    days: 12,
    name: "Courage Walk",
    theme: "STAND",
    tagline: "Stand firm with Daniel in a foreign land.",
    description: "Twelve days with Daniel — faithfulness in a foreign land, courage in the lions' den, and hope for what is to come.",
    verse: { text: "O man greatly beloved, fear not: peace be unto thee, be strong, yea, be strong.", reference: "Daniel 10:19" },
    books: whole("Daniel"),
  },
  {
    id: "walking-with-jesus",
    days: 40,
    name: "Walking with Jesus",
    theme: "FOLLOW",
    tagline: "Forty days on the road with Jesus.",
    description: "Mark's fast-moving Gospel, then Luke's careful account — all the way to the road to Emmaus.",
    verse: { text: "And it came to pass, that, while they communed together and reasoned, Jesus himself drew near, and went with them.", reference: "Luke 24:15" },
    books: whole("Mark", "Luke"),
  },
  {
    id: "every-book-walk",
    days: 66,
    name: "Every Book Walk",
    theme: "DISCOVER",
    tagline: "One step into every book of the Bible.",
    description: "Read the first chapter of all 66 books, Genesis to Revelation, and learn where every book sits.",
    verse: { text: "Thy word is a lamp unto my feet, and a light unto my path.", reference: "Psalm 119:105" },
    books: bibleBooks.map((book) => ({ name: book.name, chapters: [1] })),
  },
  {
    id: "follow-me",
    days: 120,
    name: "Follow Me",
    theme: "BUILD",
    tagline: "The life of Jesus and the early church.",
    description: "All four Gospels and Acts, then Titus — from Jesus' first call to a church built to keep walking.",
    verse: { text: "And he saith unto them, Follow me, and I will make you fishers of men.", reference: "Matthew 4:19" },
    books: whole("Matthew", "Mark", "Luke", "John", "Acts", "Titus"),
  },
];

export const EXPERIENCE_LENGTHS = experiences.map((experience) => experience.days);

export const getExperience = (id?: string) => experiences.find((experience) => experience.id === id) ?? null;

// Day N of the experience reads the Nth chapter of this list (in order), or the steps pick from it (randomly).
export const getExperienceSequence = (experience: Experience): ReadingRef[] =>
  experience.books.flatMap((book) => book.chapters.map((chapter) => ({ bookIndex: getBookIndex(book.name), chapter })));

// "Habakkuk 1–3", "Mark 1–16", "Genesis 1"
export const formatBookChapters = (book: Experience["books"][number]) =>
  book.chapters.length === 1 ? `${book.name} ${book.chapters[0]}` : `${book.name} ${book.chapters[0]}–${book.chapters[book.chapters.length - 1]}`;
