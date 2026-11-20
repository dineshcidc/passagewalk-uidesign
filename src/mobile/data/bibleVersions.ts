// Bible versions the client asked for (review call 3: NIV, NLT, New King James, The Message, ESV, King James, Amplified).
// Only the King James Version is in the app today (public domain, public/bible/kjv); the others need licences / an API,
// which the development team will scope, so they are shown as "Coming soon".
export type BibleVersion = { id: string; short: string; name: string; description: string; available: boolean };

export const bibleVersions: BibleVersion[] = [
  { id: "kjv", short: "KJV", name: "King James Version", description: "Classic and poetic English.", available: true },
  { id: "niv", short: "NIV", name: "New International Version", description: "Clear and balanced reading.", available: false },
  { id: "nlt", short: "NLT", name: "New Living Translation", description: "Modern and easy to read.", available: false },
  { id: "nkjv", short: "NKJV", name: "New King James Version", description: "Classic with updated language.", available: false },
  { id: "msg", short: "MSG", name: "The Message", description: "Conversational and relatable.", available: false },
  { id: "esv", short: "ESV", name: "English Standard Version", description: "Precise and literary.", available: false },
  { id: "amp", short: "AMP", name: "Amplified Bible", description: "Expanded for deeper understanding.", available: false },
];

// Sample verse on the version picker, in the selected version.
export const VERSION_SAMPLE = { text: "Thy word is a lamp unto my feet, and a light unto my path.", reference: "Psalm 119:105" };
