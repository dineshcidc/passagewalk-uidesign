import { formatCount } from "./journeyPlans";
import { getActivePlan, getJourneyLength } from "./journeyStore";

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
    closing: "Keep walking. Keep reading.",
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

export function getMilestoneInfo(day: number): MilestoneInfo {
  const plan = getActivePlan();
  const length = getJourneyLength();
  const isThirtyThree = plan.type === "automatic";
  const phaseIndex = isThirtyThree ? PHASE_DAYS.indexOf(day) : -1;
  const final = day === length;
  const known = walks[day];
  // Longer journeys reuse the named walks for 3 / 7 / 12 / 21 / 33 and get a plain "N-Day Walk" otherwise.
  const walk: Walk = known && !(final && day !== 33 && !isThirtyThree) ? known : {
    name: final ? `The ${formatCount(day)}-Day PassageWalk Journey` : `The ${formatCount(day)}-Day Walk`,
    shortName: final ? "Journey Complete" : `${formatCount(day)}-Day Walk`,
    prompts: [`Take a moment to reflect on your ${formatCount(day)} days.`, "Look over your notes and think about how your body feels.", "Read the scripture on your certificate."],
    closing: final ? "Your journey is complete." : "Keep walking. Keep reading.",
    verse: walks[1].verse,
  };
  const phase = phaseIndex >= 0 ? { number: phaseIndex + 1, ordinal: PHASE_ORDINALS[phaseIndex], total: PHASE_DAYS.length } : null;
  const congrats = phase
    ? `You have now completed the ${phase.ordinal} phase of your 33-day PassageWalk Journey.`
    : day === 1
      ? "You have taken the first step of your PassageWalk Journey."
      : final
        ? `You have completed all ${formatCount(day)} days of your PassageWalk Journey.`
        : `You have now completed ${formatCount(day)} days of your PassageWalk Journey.`;
  const certificateLine = day === 1
    ? "has taken the First Step of the PassageWalk Journey."
    : final
    ? `has completed the entire ${isThirtyThree ? "33-Day" : `${formatCount(day)}-Day`} PassageWalk Journey.`
    : `has completed ${walk.name.replace(/^The /, "the ")} as part of the PassageWalk Journey.`;
  return { day, ...walk, phase, congrats, certificateLine };
}
