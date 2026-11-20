export type Testament = "All" | "Old" | "New";

export const bibleBooks = [
  { name: "Genesis", testament: "Old", chapters: 50 }, { name: "Exodus", testament: "Old", chapters: 40 },
  { name: "Leviticus", testament: "Old", chapters: 27 }, { name: "Numbers", testament: "Old", chapters: 36 },
  { name: "Deuteronomy", testament: "Old", chapters: 34 }, { name: "Joshua", testament: "Old", chapters: 24 },
  { name: "Judges", testament: "Old", chapters: 21 }, { name: "Ruth", testament: "Old", chapters: 4 },
  { name: "1 Samuel", testament: "Old", chapters: 31 }, { name: "2 Samuel", testament: "Old", chapters: 24 },
  { name: "1 Kings", testament: "Old", chapters: 22 }, { name: "2 Kings", testament: "Old", chapters: 25 },
  { name: "1 Chronicles", testament: "Old", chapters: 29 }, { name: "2 Chronicles", testament: "Old", chapters: 36 },
  { name: "Ezra", testament: "Old", chapters: 10 }, { name: "Nehemiah", testament: "Old", chapters: 13 },
  { name: "Esther", testament: "Old", chapters: 10 }, { name: "Job", testament: "Old", chapters: 42 },
  { name: "Psalms", testament: "Old", chapters: 150 }, { name: "Proverbs", testament: "Old", chapters: 31 },
  { name: "Ecclesiastes", testament: "Old", chapters: 12 }, { name: "Song of Solomon", testament: "Old", chapters: 8 },
  { name: "Isaiah", testament: "Old", chapters: 66 }, { name: "Jeremiah", testament: "Old", chapters: 52 },
  { name: "Lamentations", testament: "Old", chapters: 5 }, { name: "Ezekiel", testament: "Old", chapters: 48 },
  { name: "Daniel", testament: "Old", chapters: 12 }, { name: "Hosea", testament: "Old", chapters: 14 },
  { name: "Joel", testament: "Old", chapters: 3 }, { name: "Amos", testament: "Old", chapters: 9 },
  { name: "Obadiah", testament: "Old", chapters: 1 }, { name: "Jonah", testament: "Old", chapters: 4 },
  { name: "Micah", testament: "Old", chapters: 7 }, { name: "Nahum", testament: "Old", chapters: 3 },
  { name: "Habakkuk", testament: "Old", chapters: 3 }, { name: "Zephaniah", testament: "Old", chapters: 3 },
  { name: "Haggai", testament: "Old", chapters: 2 }, { name: "Zechariah", testament: "Old", chapters: 14 },
  { name: "Malachi", testament: "Old", chapters: 4 }, { name: "Matthew", testament: "New", chapters: 28 },
  { name: "Mark", testament: "New", chapters: 16 }, { name: "Luke", testament: "New", chapters: 24 },
  { name: "John", testament: "New", chapters: 21 }, { name: "Acts", testament: "New", chapters: 28 },
  { name: "Romans", testament: "New", chapters: 16 }, { name: "1 Corinthians", testament: "New", chapters: 16 },
  { name: "2 Corinthians", testament: "New", chapters: 13 }, { name: "Galatians", testament: "New", chapters: 6 },
  { name: "Ephesians", testament: "New", chapters: 6 }, { name: "Philippians", testament: "New", chapters: 4 },
  { name: "Colossians", testament: "New", chapters: 4 }, { name: "1 Thessalonians", testament: "New", chapters: 5 },
  { name: "2 Thessalonians", testament: "New", chapters: 3 }, { name: "1 Timothy", testament: "New", chapters: 6 },
  { name: "2 Timothy", testament: "New", chapters: 4 }, { name: "Titus", testament: "New", chapters: 3 },
  { name: "Philemon", testament: "New", chapters: 1 }, { name: "Hebrews", testament: "New", chapters: 13 },
  { name: "James", testament: "New", chapters: 5 }, { name: "1 Peter", testament: "New", chapters: 5 },
  { name: "2 Peter", testament: "New", chapters: 3 }, { name: "1 John", testament: "New", chapters: 5 },
  { name: "2 John", testament: "New", chapters: 1 }, { name: "3 John", testament: "New", chapters: 1 },
  { name: "Jude", testament: "New", chapters: 1 }, { name: "Revelation", testament: "New", chapters: 22 },
] as const;

export type BibleBook = (typeof bibleBooks)[number];

// Standard book abbreviations (client tracker, "Abbreviations" tab, column B — 2026-11-19). Shown in capitals on the
// book tiles (Choose your books, Experience details), e.g. GEN, EXOD, 1 THESS.
export const bookAbbreviations: Record<string, string> = {
  "Genesis": "Gen", "Exodus": "Exod", "Leviticus": "Lev", "Numbers": "Num", "Deuteronomy": "Deut", "Joshua": "Josh",
  "Judges": "Judg", "Ruth": "Ruth", "1 Samuel": "1 Sam", "2 Samuel": "2 Sam", "1 Kings": "1 Kgs", "2 Kings": "2 Kgs",
  "1 Chronicles": "1 Chr", "2 Chronicles": "2 Chr", "Ezra": "Ezra", "Nehemiah": "Neh", "Esther": "Esth", "Job": "Job",
  "Psalms": "Ps", "Proverbs": "Prov", "Ecclesiastes": "Eccl", "Song of Solomon": "Song", "Isaiah": "Isa", "Jeremiah": "Jer",
  "Lamentations": "Lam", "Ezekiel": "Ezek", "Daniel": "Dan", "Hosea": "Hos", "Joel": "Joel", "Amos": "Amos",
  "Obadiah": "Obad", "Jonah": "Jonah", "Micah": "Mic", "Nahum": "Nah", "Habakkuk": "Hab", "Zephaniah": "Zeph",
  "Haggai": "Hag", "Zechariah": "Zech", "Malachi": "Mal", "Matthew": "Matt", "Mark": "Mark", "Luke": "Luke",
  "John": "John", "Acts": "Acts", "Romans": "Rom", "1 Corinthians": "1 Cor", "2 Corinthians": "2 Cor", "Galatians": "Gal",
  "Ephesians": "Eph", "Philippians": "Phil", "Colossians": "Col", "1 Thessalonians": "1 Thess", "2 Thessalonians": "2 Thess", "1 Timothy": "1 Tim",
  "2 Timothy": "2 Tim", "Titus": "Titus", "Philemon": "Phlm", "Hebrews": "Heb", "James": "Jas", "1 Peter": "1 Pet",
  "2 Peter": "2 Pet", "1 John": "1 John", "2 John": "2 John", "3 John": "3 John", "Jude": "Jude", "Revelation": "Rev",
};
export const bookAbbreviation = (name: string) => (bookAbbreviations[name] ?? name.slice(0, 3)).toUpperCase();
