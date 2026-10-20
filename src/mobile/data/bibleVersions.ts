// Bible versions the client asked for (review call 3: NIV, NLT, New King James, The Message, ESV, King James, Amplified).
// Only the King James Version is in the app today (public domain, public/bible/kjv); the others need licences / an API,
// which the development team will scope, so they are shown as "Coming soon".
export type BibleVersion = { id: string; short: string; name: string; description: string; available: boolean };

export const bibleVersions: BibleVersion[] = [
  { id: "kjv", short: "KJV", name: "King James Version", description: "The classic 1611 translation — rich and poetic.", available: true },
  { id: "niv", short: "NIV", name: "New International Version", description: "Clear, readable modern English.", available: false },
  { id: "nlt", short: "NLT", name: "New Living Translation", description: "Warm, everyday language.", available: false },
  { id: "nkjv", short: "NKJV", name: "New King James Version", description: "The King James in updated English.", available: false },
  { id: "msg", short: "MSG", name: "The Message", description: "A conversational paraphrase.", available: false },
  { id: "esv", short: "ESV", name: "English Standard Version", description: "Word-for-word accuracy, smooth to read.", available: false },
  { id: "amp", short: "AMP", name: "Amplified Bible", description: "Expanded wording that brings out deeper meaning.", available: false },
];

// Sample verse on the version picker, in the selected version.
export const VERSION_SAMPLE = { text: "Thy word is a lamp unto my feet, and a light unto my path.", reference: "Psalm 119:105" };
