// "automatic" = the 33-Day Journey (steps choose each reading, Old/New Testament alternate).
export type JourneyType = "automatic" | "custom" | "bible";
export type MainTab = "home" | "journey" | "journal" | "milestones" | "profile";
// "in-order" = chapter by chapter (chosen books, or the whole Bible); "steps" = "Read randomly", the day's steps pick an unread chapter.
export type ReadingOrder = "in-order" | "steps";
// One chapter = one day, so a custom journey lasts as many days as its books have chapters.
export type JourneyPlan = { type: JourneyType; books: string[]; order: ReadingOrder; days: number };
