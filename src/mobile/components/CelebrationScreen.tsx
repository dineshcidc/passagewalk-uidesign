import { useEffect } from "react";
import { getBookChapterCount, getBookName } from "../data/bible";
import { getActivePlan } from "../data/journeyStore";
import { getJourneyCompleteInfo, getMilestoneInfo } from "../data/milestones";
import { playApplause } from "../sound";
import AppIcon from "./AppIcon";
import MilestoneBadge from "./MilestoneBadge";

export type Celebration =
  | { kind: "milestone"; day: number; nextDay: number | null }
  | { kind: "journey"; day: number }
  | { kind: "book"; bookIndex: number };

// Confetti pieces: position, colour, delay and drift are fixed so the burst looks the same every time.
const confetti = Array.from({ length: 28 }, (_, index) => ({
  left: (index * 37) % 100,
  delay: (index % 7) * 0.12,
  duration: 2.4 + (index % 5) * 0.35,
  drift: ((index % 9) - 4) * 9,
  color: ["#e7a83a", "#6c8f3e", "#f6cd7c", "#3b5622", "#bfd6a2"][index % 5],
  round: index % 3 === 0,
}));

// Shown after a reflection is saved when it earns something: a day badge, a finished book, or the whole journey.
// Kathy: "People need encouragement… hey, I'm proud of you."
export default function CelebrationScreen({ celebration, onContinue }: { celebration: Celebration; onContinue: () => void }) {
  // Applause as the badge pops in (journey complete gets a longer round).
  useEffect(() => {
    const timer = window.setTimeout(() => playApplause(celebration.kind === "journey" ? 2.4 : 1.6), 250);
    return () => window.clearTimeout(timer);
  }, [celebration.kind]);

  const copy = celebration.kind === "book"
    ? {
      eyebrow: "BOOK COMPLETE",
      title: `You finished ${getBookName(celebration.bookIndex)}!`,
      body: `${getBookChapterCount(celebration.bookIndex) === 1 ? "Its only chapter" : `Every one of its ${getBookChapterCount(celebration.bookIndex)} chapters`} — book ${celebration.bookIndex + 1} of the 66. I'm proud of you!`,
      chip: "BOOK BADGE EARNED",
    }
    : celebration.kind === "journey"
      ? (() => {
        // The journey itself (33-Day Walk: Kathy's Power Walk, the final phase; Designed: the experience by name).
        const info = getJourneyCompleteInfo();
        const plan = getActivePlan();
        return {
          eyebrow: plan.type === "automatic" ? "FINAL PHASE · JOURNEY COMPLETE" : plan.type === "designed" ? "EXPERIENCE COMPLETE" : "JOURNEY COMPLETE",
          title: plan.type === "custom" || plan.type === "bible" ? "You did it!" : info.name,
          body: celebration.day === 1
            ? "I'm proud of you — you completed your Passage Walk."
            : `Congratulations! ${info.congrats} I'm proud of you!`,
          chip: "CERTIFICATE OF COMPLETION EARNED",
        };
      })()
      : (() => {
        // Kathy's phases: "Congratulations! You have now completed the first phase…" (milestones.ts).
        const info = getMilestoneInfo(celebration.day);
        return {
          eyebrow: info.phase ? `PHASE ${info.phase.number} OF ${info.phase.total} COMPLETE` : "MILESTONE UNLOCKED",
          title: info.name,
          body: `Congratulations! ${info.congrats} I'm proud of you!`,
          chip: celebration.nextDay ? `NEXT · DAY ${celebration.nextDay.toLocaleString("en-US")} ${getMilestoneInfo(celebration.nextDay).shortName.toUpperCase()}` : "BADGE EARNED",
        };
      })();

  return (
    <div className="celebration-screen" role="dialog" aria-modal="true" aria-labelledby="celebration-title">
      <div className="celebration-confetti" aria-hidden="true">
        {confetti.map((piece, index) => (
          <i
            className={piece.round ? "round" : ""}
            key={index}
            style={{
              left: `${piece.left}%`,
              background: piece.color,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              "--drift": `${piece.drift}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="celebration-stage">
        <div className="celebration-rays" aria-hidden="true" />
        {celebration.kind === "book" ? (
          <div className="celebration-book-medal"><AppIcon name="book" /></div>
        ) : (
          // Passage Walk milestones are gold for every journey; only a finished Designed Experience is purple.
          <div className="celebration-badge"><MilestoneBadge milestone={{ day: celebration.day, unlocked: true }} large experience={celebration.kind === "journey" && getActivePlan().type === "designed"} /></div>
        )}
      </div>

      <div className="celebration-copy">
        <span>{copy.eyebrow}</span>
        <h1 id="celebration-title">{copy.title}</h1>
        <p>{copy.body}</p>
        <em><AppIcon name="spark" />{copy.chip}</em>
      </div>

      <div className="celebration-footer">
        <button type="button" className="moment-primary" onClick={onContinue}>
          <span>Continue</span>
          <AppIcon name="chevron" />
        </button>
      </div>
    </div>
  );
}
