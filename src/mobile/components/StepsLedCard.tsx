import type { ReactNode } from "react";
import { BIBLE_VERSION } from "../data/bible";
import type { Chapter } from "../data/chapters";
import { plural } from "../data/journeyPlans";
import { describeBookPosition } from "../data/stepsRule";
import AppIcon from "./AppIcon";
import BibleBooksGrid from "./BibleBooksGrid";

// Passage Ready: shows HOW the user's steps led to today's chapter (Kathy: "connect and share how their steps
// took them to that reading" so they learn the 66 books). Digit chips: gold = book digit, teal = chapter digit.
// Hidden for now (PM, 2026-11-12): the digit → book / chapter trail and the 66-book grid let the user
// guess the order (33-Day alternates Old / New Testament), so the next passage is no surprise.
// Only the result card (and a multi-chapter day's list) shows. Set to true to bring them back.
const SHOW_STEPS_TRAIL = false;

export default function StepsLedCard({ chapter, visitedBooks, isToday = true, children }: { chapter: Chapter; visitedBooks: number[]; isToday?: boolean; children?: ReactNode }) {
  const { explanation } = chapter;
  const unlock = explanation.mode === "unlock";
  // Whole Bible at a faster pace: the day reads several chapters, listed under the result.
  const several = chapter.parts.length > 1;
  const unlocked = `${isToday ? "TODAY'S" : "THIS DAY'S"} ${several ? "CHAPTERS" : "CHAPTER"}`;

  return (
    <section className={`steps-led-card ${unlock ? "unlock" : ""} ${SHOW_STEPS_TRAIL ? "" : "result-only"} ${several ? "several" : ""}`}>
      {children && <header className="steps-led-head">{children}</header>}
      {SHOW_STEPS_TRAIL && (<>
      <span className="steps-led-eyebrow">{unlock ? `YOUR STEPS UNLOCKED ${unlocked}` : "YOUR STEPS LED YOU HERE"}</span>

      {/* "In order": the step count unlocks the next chapter, so the digits don't matter — show the total. */}
      {unlock ? (
        <div className="steps-led-total"><strong>{Number(explanation.digits.join("")).toLocaleString("en-US")}</strong><em>{isToday ? "steps today" : "steps"}</em><i><AppIcon name="steps" /></i></div>
      ) : (
        <div className="steps-led-digits" aria-label={`${explanation.digits.join("")} steps`}>
          {explanation.digits.map((digit, index) => {
            const role = index === explanation.bookDigit ? "book" : index === explanation.chapterDigit ? "chapter" : "";
            return (
              <span className={role} key={index}>
                {digit}
                {role && <small>{role === "book" ? "BOOK" : "CH"}</small>}
              </span>
            );
          })}
          <em>steps</em>
        </div>
      )}

      <ol className="steps-led-lines">
        {explanation.lines.map((line, index) => (
          <li key={index}><b>{line.value}</b><span>{line.text}</span></li>
        ))}
      </ol>
      </>)}

      <div className="steps-led-result">
        <i><AppIcon name="book" /></i>
        <div>
          {/* Word joiners keep a range like "4–6" together, so a long title only wraps between words. */}
          <strong>{chapter.reference.replace(/–/g, "⁠–⁠")}</strong>
          <span>{describeBookPosition(chapter.bookIndex)}</span>
        </div>
        <em>{several ? `${chapter.parts.length} chapters` : `${chapter.verseCount} verses · ${BIBLE_VERSION.short}`}</em>
      </div>

      {several && (
        <ol className="steps-led-chapters" aria-label="Today's chapters">
          {chapter.parts.map((part) => (
            <li key={part.slot}><b>{part.slot + 1}</b><strong>{part.reference}</strong><span>{plural(part.verseCount, "verse")}</span></li>
          ))}
          <li className="total"><strong>{plural(chapter.verseCount, "verse")} in all</strong><span>{BIBLE_VERSION.short}</span></li>
        </ol>
      )}

      {SHOW_STEPS_TRAIL && <BibleBooksGrid current={chapter.bookIndex} visited={visitedBooks} compact />}
    </section>
  );
}
