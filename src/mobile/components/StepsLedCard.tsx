import { BIBLE_VERSION } from "../data/bible";
import type { Chapter } from "../data/chapters";
import { describeBookPosition } from "../data/stepsRule";
import AppIcon from "./AppIcon";
import BibleBooksGrid from "./BibleBooksGrid";

// Passage Ready: shows HOW the user's steps led to today's chapter (Kathy: "connect and share how their steps
// took them to that reading" so they learn the 66 books). Digit chips: gold = book digit, teal = chapter digit.
export default function StepsLedCard({ chapter, visitedBooks, isToday = true }: { chapter: Chapter; visitedBooks: number[]; isToday?: boolean }) {
  const { explanation } = chapter;
  const unlock = explanation.mode === "unlock";

  return (
    <section className={`steps-led-card ${unlock ? "unlock" : ""}`}>
      <span className="steps-led-eyebrow">{unlock ? (isToday ? "YOUR STEPS UNLOCKED TODAY'S CHAPTER" : "YOUR STEPS UNLOCKED THIS DAY'S CHAPTER") : "YOUR STEPS LED YOU HERE"}</span>

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

      <div className="steps-led-result">
        <i><AppIcon name="book" /></i>
        <div>
          <strong>{chapter.reference}</strong>
          <span>{describeBookPosition(chapter.bookIndex)}</span>
        </div>
        <em>{chapter.verseCount} verses · {BIBLE_VERSION.short}</em>
      </div>

      <BibleBooksGrid current={chapter.bookIndex} visited={visitedBooks} compact />
    </section>
  );
}
