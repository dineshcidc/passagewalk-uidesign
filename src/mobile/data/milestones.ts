import { getExperience } from "./experiences";
import { formatCount, plural } from "./journeyPlans";
import { getActivePlan, getJourneyLength } from "./journeyStore";
import type { JourneyPlan } from "../types";

// Milestone content from Kathy's journal ("Milestones Certificates & Badges" PDF): the 33-Day Journey has
// five phases — Day 3 Resurrection, Day 7 Creation, Day 12 Apostle, Day 21 Trinity, Day 33 Power Walk —
// each with a congratulations page, reflection prompts and a Certificate of Completion with a scripture.
// The printed certificates quote the NIV; the app shows the same verses in the King James Version.
// Day 1 "First Step" is our addition (pending client OK) so every journey starts with one earned badge.

export type MilestoneInfo = {
  day: number;
  name: string; // "The Three-Day Resurrection Walk"
  shortName: string; // "Resurrection Walk"
  phase: { number: number; ordinal: string; total: number } | null; // 33-Day phases only
  congrats: string;
  prompts: string[];
  closing: string;
  verse: { text: string; reference: string };
  certificateLine: string; // "has completed the Three-Day Resurrection Walk as part of the PassageWalk Journey."
};

type Walk = Pick<MilestoneInfo, "name" | "shortName" | "prompts" | "closing" | "verse">;

const walks: Record<number, Walk> = {
  1: {
    name: "The First Step",
    shortName: "First Step",
    prompts: ["Every journey begins with a single step — and you have taken yours.", "Look back at today's reading and the verses you highlighted."],
    closing: "Keep moving. Keep growing.",
    verse: { text: "Thy word is a lamp unto my feet, and a light unto my path.", reference: "Psalm 119:105" },
  },
  3: {
    name: "The Three-Day Resurrection Walk",
    shortName: "Resurrection Walk",
    prompts: ["Take a moment to reflect on the past three days.", "Look over your notes and think about how your body feels.", "Read the scripture on your certificate.", "Sincerely congratulate yourself on your accomplishment."],
    closing: "You have begun.",
    verse: {
      text: "For I delivered unto you first of all that which I also received, how that Christ died for our sins according to the scriptures; And that he was buried, and that he rose again the third day according to the scriptures: And that he was seen of Cephas, then of the twelve.",
      reference: "1 Corinthians 15:3–5",
    },
  },
  7: {
    name: "The Seven-Day Creation Walk",
    shortName: "Creation Walk",
    prompts: ["Just as you did after your first three days, take a moment now to reflect on the past week.", "Look over your notes and think about how your body feels.", "Read the familiar scripture on your certificate.", "And again, congratulate yourself on your accomplishment."],
    closing: "You are creating new, positive habits.",
    verse: { text: "And on the seventh day God ended his work which he had made; and he rested on the seventh day from all his work which he had made.", reference: "Genesis 2:2" },
  },
  12: {
    name: "The Twelve-Day Apostle Walk",
    shortName: "Apostle Walk",
    prompts: ["Consider the changes you have noticed in your body over the last 12 days. Perhaps you have made some discoveries about your spiritual health as well.", "Has your attitude changed since you began this program?", "What have you learned about your body?", "What have you learned about your spiritual self?"],
    closing: "You are over one-third of the way.",
    verse: {
      text: "Now the names of the twelve apostles are these; The first, Simon, who is called Peter, and Andrew his brother; James the son of Zebedee, and John his brother; Philip, and Bartholomew; Thomas, and Matthew the publican; James the son of Alpheus, and Lebbeus, whose surname was Thaddeus; Simon the Canaanite, and Judas Iscariot.",
      reference: "Matthew 10:2–4",
    },
  },
  21: {
    name: "The Twenty-One Day Trinity Walk",
    shortName: "Trinity Walk",
    prompts: ["Take a moment to reflect on the past week.", "Look over your notes.", "Think about the strength of your body."],
    closing: "Think about the other strengths you possess.",
    verse: { text: "Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost.", reference: "Matthew 28:19" },
  },
  33: {
    name: "The 33-Day Power Walk",
    shortName: "Power Walk",
    prompts: ["Review your journey by looking back through your reflections and reading some of the notes you made.", "What have you learned about yourself or your body over the past 33 days?", "What have you learned about your faith, or about God?"],
    closing: "Your journey is complete.",
    verse: {
      text: "If any man speak, let him speak as the oracles of God; if any man minister, let him do it as of the ability which God giveth: that God in all things may be glorified through Jesus Christ, to whom be praise and dominion for ever and ever. Amen.",
      reference: "1 Peter 4:11",
    },
  },
};

const PHASE_DAYS = [3, 7, 12, 21, 33];
const PHASE_ORDINALS = ["first", "second", "third", "fourth", "fifth and final"];

// One milestone ladder for every journey (review call 4 + Kathy's "PW Targeted Bible List" PDF): "Milestones will be
// cumulative based on bible reading days" — 33-Day milestones 3, 7, 12, 21, 33, then the Designed Experience additional
// milestones 40 … 365. Day 1 "First Step" is ours. They count Passage Walk days across journeys (progress.ts), so
// changing journey keeps what was earned: "they've still walked the 21 days… and they still just keep adding".
export const MILESTONE_LADDER = [1, ...PHASE_DAYS, 40, 66, 70, 120, 150, 180, 210, 240, 270, 300, 330, 365];

// Kathy (review call 4): "having badges with numbers… a consistent congratulations… somewhere in the congratulations,
// it just references passage walk" — e.g. "congratulations on 70 days of… walking through passages of scripture".
const numberedWalk = (day: number): Walk => ({
  name: `${formatCount(day)} Days of PassageWalk`,
  shortName: `${formatCount(day)}-Day Walk`,
  prompts: [`Take a moment to reflect on your ${plural(day, "day")} of steps and scripture.`, "Look over your notes and think about how your body feels.", "Read the scripture on your certificate."],
  closing: "Keep moving. Keep growing.",
  verse: walks[1].verse,
});

// A Passage Walk milestone (the ladder). plan defaults to the active journey: only the 33-Day Walk speaks of its
// five phases; the Journey Complete demo passes a finished 33-Day Walk.
export function getMilestoneInfo(day: number, plan: JourneyPlan = getActivePlan(), length = getJourneyLength()): MilestoneInfo {
  const isThirtyThree = plan.type === "automatic";
  const phaseIndex = isThirtyThree ? PHASE_DAYS.indexOf(day) : -1;
  const walk = walks[day] ?? numberedWalk(day);
  const phase = phaseIndex >= 0 ? { number: phaseIndex + 1, ordinal: PHASE_ORDINALS[phaseIndex], total: PHASE_DAYS.length } : null;
  const congrats = phase
    ? `You have now completed the ${phase.ordinal} phase of your 33-day PassageWalk Journey.`
    : day === 1
      ? "You have taken the first step of your PassageWalk Journey."
      : walks[day]
        ? `You have now walked ${formatCount(day)} days of your PassageWalk Journey.`
        : `You have now walked ${formatCount(day)} days through passages of scripture with PassageWalk.`;
  const certificateLine = day === 1
    ? "has taken the First Step of the PassageWalk Journey."
    : isThirtyThree && day === 33 && length === 33
    ? "has completed the entire 33-Day PassageWalk Journey."
    : walks[day]
    ? `has completed ${walk.name.replace(/^The /, "the ")} as part of the PassageWalk Journey.`
    : `has walked ${formatCount(day)} days of the PassageWalk Journey.`;
  return { day, ...walk, phase, congrats, certificateLine };
}

// The badge for finishing the journey itself ("This journey" on Milestones), separate from the ladder.
// 33-Day Walk: Kathy's Power Walk ("Your journey is complete."); Designed Experience: the experience by name.
export function getJourneyCompleteInfo(plan: JourneyPlan = getActivePlan(), length = getJourneyLength()): MilestoneInfo {
  if (plan.type === "automatic") return { ...getMilestoneInfo(33, plan, 33), day: length };
  const experience = plan.type === "designed" ? getExperience(plan.experience) : null;
  const name = experience ? experience.name : `The ${formatCount(length)}-Day PassageWalk Journey`;
  return {
    day: length,
    name,
    shortName: experience ? "Experience Complete" : "Journey Complete",
    phase: null,
    congrats: experience ? `You have completed all ${plural(length, "day")} of the ${experience.name}.` : `You have completed all ${plural(length, "day")} of your PassageWalk Journey.`,
    prompts: [`Take a moment to reflect on your ${plural(length, "day")}${experience ? ` of the ${experience.name}` : ""}.`, "Look over your notes and think about how your body feels.", "Read the scripture on your certificate."],
    closing: experience ? "Your experience is complete." : "Your journey is complete.",
    verse: experience?.verse ?? walks[1].verse,
    certificateLine: experience ? `has completed the ${experience.name} of the PassageWalk Journey.` : `has completed the entire ${formatCount(length)}-Day PassageWalk Journey.`,
  };
}
