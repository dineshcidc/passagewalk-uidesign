// "automatic" = the 33-Day Walk (steps choose each reading, Old/New Testament alternate).
// "designed" = a Designed Experience: a ready-made plan of books (data/experiences.ts).
export type JourneyType = "automatic" | "designed" | "custom" | "bible";
// "custom" and "bible" are both made with Create a Journey (your books / the whole Bible).
export type MainTab = "home" | "journey" | "journal" | "milestones" | "profile";
// "in-order" = chapter by chapter (chosen books, or the whole Bible); "steps" = "Read randomly", the day's steps pick an unread chapter.
export type ReadingOrder = "in-order" | "steps";
// One chapter = one day, so a custom journey lasts as many days as its books have chapters.
// experience = the Designed Experience id (designed journeys only).
export type JourneyPlan = { type: JourneyType; books: string[]; order: ReadingOrder; days: number; experience?: string };
