import { useEffect, useState } from "react";
import AppIcon from "../../components/AppIcon";
import BibleVersionList from "../../components/BibleVersionList";
import HighlightedVersesCard from "../../components/HighlightedVersesCard";
import CelebrationScreen, { type Celebration } from "../../components/CelebrationScreen";
import StepsLedCard from "../../components/StepsLedCard";
import { getBookProgress, getJourneyLength, getMilestoneDays, getUnlockedMilestones } from "../../data/progress";
import { BIBLE_VERSION, useBibleRevision } from "../../data/bible";
import { getChapter, saveDayHighlights } from "../../data/chapters";
import { formatDayDate, getActivePlan, getDayRecord, getHighlightNumbers, getRecordedDays, getTodayDay } from "../../data/journeyStore";
import { getDayReflection, reflectionQuestions, saveDayReflection, saveDaySteps, type ReflectionAnswers } from "../../data/reflections";

export type DailyFlowEntry = "entry" | "reading" | "reflection";
type DailyFlowPhase = DailyFlowEntry | "generating" | "ready" | "celebration" | "reflectionSuccess";

// What a save newly earned: finished books first, then day badges (the final one = journey complete).
// Designed Experiences have no book badges (Milestones screen), so only their walk badges celebrate.
function getEarned() {
  return {
    milestones: getUnlockedMilestones(),
    books: getActivePlan().type === "designed" ? [] : getBookProgress().filter((book) => book.finished).map((book) => book.bookIndex),
  };
}

// Encouragement on Passage Ready, based on the day's steps — Kathy's movement words (move, strengthen, build).
function walkMessage(steps: number, isToday: boolean) {
  if (!isToday) return "Thanks for catching up — every day counts 👣";
  if (steps >= 10000) return "10,000+ steps — you're on the move! 👣";
  if (steps >= 5000) return "Great walk — keep moving forward! 👣";
  return "Every step builds strength 👣";
}

export default function DailyFlowScreen({
  onBack,
  initialPhase = "entry",
  journeyDay = getTodayDay(),
  doneLabel = "Back to Home",
}: {
  onBack: () => void;
  initialPhase?: DailyFlowEntry;
  // Today, or a missed day caught up from My Journey.
  journeyDay?: number;
  doneLabel?: string;
}) {
  useBibleRevision();
  // null until steps are entered: the steps decide (or unlock) the day's chapter.
  const chapter = getChapter(journeyDay);
  const verses = chapter?.verses ?? [];
  const isToday = journeyDay === getTodayDay();
  const savedReflection = getDayReflection(journeyDay);
  const [stepValue, setStepValue] = useState(() => getDayRecord(journeyDay)?.steps.replace(/,/g, "") ?? "");
  // "" = no entry yet, which is not the same as a recorded 0.
  const [phase, setPhase] = useState<DailyFlowPhase>(initialPhase);
  const [passageCopied, setPassageCopied] = useState(false);
  const [reflectionSource, setReflectionSource] = useState<"home" | "ready" | "reading">(initialPhase === "reflection" ? "home" : "ready");
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [answers, setAnswers] = useState<ReflectionAnswers>(() => savedReflection?.answers ?? ["", "", ""]);
  const [highlightedVerses, setHighlightedVerses] = useState<number[]>(() => getHighlightNumbers(journeyDay));
  const [readingReturn, setReadingReturn] = useState<"reflection" | null>(null);
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [versionSheet, setVersionSheet] = useState(false);

  const saveReflection = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const before = getEarned();
    saveDayReflection(journeyDay, answers);
    const after = getEarned();
    const length = getJourneyLength();
    const milestoneDays = getMilestoneDays();
    const earned: Celebration[] = [
      ...after.books.filter((book) => !before.books.includes(book)).map((bookIndex): Celebration => ({ kind: "book", bookIndex })),
      ...after.milestones.filter((day) => !before.milestones.includes(day)).map((day): Celebration => (
        day === length ? { kind: "journey", day } : { kind: "milestone", day, nextDay: milestoneDays.find((next) => next > day) ?? null }
      )),
    ];
    setReflectionSaved(true);
    setCelebrations(earned);
    setPhase(earned.length ? "celebration" : "reflectionSuccess");
  };

  // One celebration at a time; Continue shows the next, then the Reflection Saved summary.
  const nextCelebration = () => {
    const rest = celebrations.slice(1);
    setCelebrations(rest);
    if (!rest.length) setPhase("reflectionSuccess");
  };

  useEffect(() => {
    if (phase !== "generating") return;
    const timer = window.setTimeout(() => setPhase("ready"), 5000);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const enterDigit = (digit: number) => {
    setStepValue((current) => {
      const next = current === "" || current === "0" ? String(digit) : `${current}${digit}`;
      return next.slice(0, 6);
    });
  };

  const deleteDigit = () => {
    setStepValue((current) => current.length <= 1 ? "" : current.slice(0, -1));
  };

  const stepsEntered = stepValue !== "";
  const formattedSteps = Number(stepValue).toLocaleString("en-US");
  const currentDate = formatDayDate(journeyDay);
  const shortDate = currentDate.replace(/, \d{4}$/, "");
  const dayLabel = `DAY ${String(journeyDay).padStart(2, "0")}`;
  const verseCount = chapter?.verseCount ?? 0;
  const reference = chapter?.reference ?? "";
  const selectedVerses = verses.filter((verse) => highlightedVerses.includes(verse.number));
  // Books read on other days, shown on the 66-book grid next to today's book.
  const visitedBooks = getRecordedDays().filter((day) => day !== journeyDay).map((day) => getDayRecord(day)!.reading.bookIndex);

  // Highlights save as soon as a verse is tapped, so Journal sees them even before the reflection is saved.
  useEffect(() => {
    saveDayHighlights(journeyDay, highlightedVerses);
  }, [journeyDay, highlightedVerses]);

  const generatePassage = () => {
    saveDaySteps(journeyDay, formattedSteps);
    // New steps can lead to a different chapter, which starts with no highlights.
    setHighlightedVerses(getHighlightNumbers(journeyDay));
    setPhase("generating");
  };

  const toggleVerse = (verseNumber: number) => {
    setReflectionSaved(false);
    setHighlightedVerses((current) => current.includes(verseNumber)
      ? current.filter((number) => number !== verseNumber)
      : [...current, verseNumber].sort((a, b) => a - b));
  };

  const openChapterFromReflection = () => {
    setReadingReturn("reflection");
    setPhase("reading");
  };

  const leaveReading = () => {
    if (readingReturn === "reflection") {
      setReadingReturn(null);
      setPhase("reflection");
    } else if (initialPhase === "reading") {
      onBack();
    } else {
      setPhase("ready");
    }
  };

  const reflectFromReading = () => {
    if (readingReturn === "reflection") setReadingReturn(null);
    else setReflectionSource("reading");
    setPhase("reflection");
  };

  const copyPassage = async () => {
    const versesToCopy = selectedVerses.length ? selectedVerses : verses;
    await navigator.clipboard?.writeText(`${reference}\n${versesToCopy.map((verse) => `${verse.number} ${verse.text}`).join("\n")}`);
    setPassageCopied(true);
    window.setTimeout(() => setPassageCopied(false), 1800);
  };

  if (phase === "generating") {
    return (
      <div className="passage-generating-screen">
        <button className="step-entry-back" onClick={() => setPhase("entry")} aria-label="Back to step entry"><AppIcon name="back" /></button>
        <div className="passage-generating-content">
          <div className="passage-generation-orbit">
            <i className="generation-dot generation-dot-one"></i>
            <i className="generation-dot generation-dot-two"></i>
            <i className="generation-dot generation-dot-three"></i>
            <div className="generation-book"><AppIcon name="book" /></div>
          </div>
          <span>PASSAGE WALK</span>
          <h1>{isToday ? "Finding today's passage" : `Finding Day ${journeyDay}'s passage`}</h1>
          <p>Bringing your steps and your scripture journey together.</p>
          <div className="generation-progress"><i></i></div>
        </div>
      </div>
    );
  }

  if (phase === "ready" && chapter) {
    return (
      <div className="passage-ready-screen">
        <button className="step-entry-back" onClick={() => setPhase("entry")} aria-label="Back to step entry"><AppIcon name="back" /></button>
        <div className="passage-ready-content with-steps">
          <p className="walk-encouragement">{walkMessage(Number(stepValue), isToday)}</p>
          <span className="passage-ready-label">{isToday ? "TODAY'S SCRIPTURE" : `${dayLabel} · CATCH UP`}</span>
          <h1>Your Passage Is Ready</h1>
          <p className="passage-ready-steps">{chapter.explanation.mode === "unlock" ? "Unlocked by" : "Based on"} your {formattedSteps} {Number(stepValue) === 1 ? "step" : "steps"} {isToday ? "today" : `on ${shortDate}`}</p>
          <StepsLedCard chapter={chapter} visitedBooks={visitedBooks} isToday={isToday} />
          <div className="passage-ready-actions">
            <button className="passage-read-button" onClick={() => setPhase("reading")}><AppIcon name="book" />Read Chapter</button>
            <button className="passage-reflect-button" onClick={() => { setReflectionSource("ready"); setPhase("reflection"); }}><AppIcon name="journal" />Write Reflection</button>
          </div>
          <button className="passage-later-button" onClick={onBack}>Do this later</button>
          <p className="passage-later-note">We&apos;ll keep it under Reflections on Home for later.</p>
        </div>
      </div>
    );
  }

  if (phase === "reading" && chapter) {
    return (
      <div className="scripture-reading-screen">
        <header className="scripture-reading-header">
          <button className="scripture-reading-back" onClick={leaveReading} aria-label="Back"><AppIcon name="back" /></button>
          <div><strong>{reference}</strong><span>{verseCount} VERSES · {chapter.testament} · {BIBLE_VERSION.short}</span></div>
          <div className="scripture-reading-actions">
            <button className={passageCopied ? "active" : ""} onClick={copyPassage} aria-label={passageCopied ? "Passage copied" : "Copy passage"}>
              {passageCopied ? (
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m4 10 4 4 8-9" /></svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2" /><path d="M13 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /></svg>
              )}
            </button>
          </div>
        </header>

        <main className="scripture-reading-content">
          <div className="scripture-reading-label"><span>PASSAGE WALK</span><i></i><span>{dayLabel}</span></div>
          <h1>{reference}</h1>
          <button className="scripture-reading-version" onClick={() => setVersionSheet(true)} aria-label={`${BIBLE_VERSION.name}. Change Bible version`}>
            <AppIcon name="book" />{BIBLE_VERSION.name}<AppIcon name="chevron" />
          </button>
          <p className="scripture-reading-intro">Tap any verse to highlight what speaks to you.</p>

          <div className="scripture-chapter-list">
            {chapter.verses === null && <p className="scripture-loading">Opening {reference}…</p>}
            {verses.map((verse) => {
              const highlighted = highlightedVerses.includes(verse.number);
              return (
                <button
                  className={`scripture-chapter-verse ${highlighted ? "highlighted" : ""}`}
                  onClick={() => toggleVerse(verse.number)}
                  aria-pressed={highlighted}
                  key={verse.number}
                >
                  <span>{verse.number}</span>
                  <p>{verse.text}</p>
                </button>
              );
            })}
          </div>
        </main>

        <div className="scripture-highlight-bar">
          <div><strong>{selectedVerses.length}</strong><span>{selectedVerses.length === 1 ? "verse highlighted" : "verses highlighted"}</span></div>
          <button onClick={reflectFromReading}><AppIcon name="journal" />Write Reflection</button>
        </div>

        {/* Version pill → change the Bible version without leaving the chapter. */}
        {versionSheet && (
          <div className="version-sheet-backdrop" onClick={() => setVersionSheet(false)}>
            <section className="version-sheet" role="dialog" aria-modal="true" aria-labelledby="version-sheet-title" onClick={(event) => event.stopPropagation()}>
              <i className="version-sheet-grip" aria-hidden="true"></i>
              <div className="version-sheet-head">
                <div><span>READING</span><h2 id="version-sheet-title">Bible version</h2></div>
                <button onClick={() => setVersionSheet(false)}>Done</button>
              </div>
              <BibleVersionList preview={false} />
            </section>
          </div>
        )}
      </div>
    );
  }

  if (phase === "reflection") {
    return (
      <div className="reflection-entry-screen">
        <button className="reflection-entry-back" onClick={() => reflectionSource === "home" ? onBack() : setPhase(reflectionSource)} aria-label="Back"><AppIcon name="back" /></button>

        <header className="reflection-entry-header">
          <span>PRIVATE JOURNAL</span>
          <h1>Write Reflection</h1>
          <div><span>{currentDate}</span><i></i><strong>{reference}</strong></div>
        </header>

        <form className="reflection-form" onSubmit={saveReflection}>
          <HighlightedVersesCard reference={reference} verses={selectedVerses} onReadChapter={openChapterFromReflection} />
          {reflectionQuestions.map((question, index) => (
            <label key={question.label}>
              <span>{question.label}</span>
              <textarea
                value={answers[index]}
                onChange={(event) => {
                  const value = event.target.value;
                  setReflectionSaved(false);
                  setAnswers((current) => current.map((answer, position) => (position === index ? value : answer)) as ReflectionAnswers);
                }}
                placeholder={question.placeholder}
              />
            </label>
          ))}

          {/* A reflection needs at least one highlighted verse (pending client confirmation). */}
          <div className="reflection-save-dock">
            {selectedVerses.length === 0 && <p>Highlight at least one verse to save your reflection.</p>}
            <button className={`reflection-save-button ${reflectionSaved ? "saved" : ""}`} type="submit" disabled={selectedVerses.length === 0}>
              {reflectionSaved ? (
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m4 9 3 3 7-7" /></svg>
              ) : <AppIcon name="journal" />}
              <span>{reflectionSaved ? "Reflection Saved" : "Save Reflection"}</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (phase === "celebration" && celebrations[0]) {
    return <CelebrationScreen celebration={celebrations[0]} key={celebrations.length} onContinue={nextCelebration} />;
  }

  if (phase === "reflectionSuccess") {
    return (
      <div className="reflection-success-screen">
        <div className="reflection-success-content">
          <div className="reflection-success-mark">
            <i className="success-particle particle-one"></i>
            <i className="success-particle particle-two"></i>
            <i className="success-particle particle-three"></i>
            <i className="success-particle particle-four"></i>
            <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m17 33 10 10 21-23" /></svg>
          </div>
          <span>JOURNAL UPDATED</span>
          <h1>Reflection Saved</h1>
          <p className="reflection-proud">Day {journeyDay} is complete — you're growing stronger!</p>
          <p>Your thoughts are safely stored as part of {isToday ? "today's" : `Day ${journeyDay}'s`} scripture journey.</p>

          <div className="reflection-success-summary">
            <div><span>Steps Entered</span><strong>{formattedSteps}</strong></div>
            <div><span>Chapter</span><strong>{reference}</strong></div>
            <div><span>Passage Read</span><strong>{verseCount} verses</strong></div>
            <div><span>Verses Highlighted</span><strong>{selectedVerses.length}</strong></div>
            <div><span>Date</span><strong>{currentDate}</strong></div>
          </div>

          <button className="reflection-home-button" onClick={onBack}>{doneLabel}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="step-entry-screen">
      <button className="step-entry-back" onClick={onBack} aria-label="Back"><AppIcon name="back" /></button>

      <div className="step-entry-heading">
        <h1>{isToday ? "How many steps did you walk today?" : `How many steps did you walk on ${shortDate}?`}</h1>
        <p>{isToday ? "Enter today's total to continue your scripture journey." : `Enter that day's total to catch up on Day ${journeyDay}.`}</p>
      </div>

      <div className={`step-entry-ring ${stepsEntered && Number(stepValue) > 0 ? "has-value" : "empty"}`}>
        <div>
          <strong>{formattedSteps}</strong>
          <span>{isToday ? "STEPS TODAY" : `STEPS · ${shortDate.toUpperCase()}`}</span>
        </div>
      </div>

      <div className="step-keypad" aria-label="Step number keypad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
          <button key={number} onClick={() => enterDigit(number)}>{number}</button>
        ))}
        <span></span>
        <button onClick={() => enterDigit(0)}>0</button>
        <button className="step-keypad-delete" onClick={deleteDigit} aria-label="Delete last digit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 6-6 6 6 6h10a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H9Z" />
            <path d="m13 10 4 4M17 10l-4 4" />
          </svg>
        </button>
      </div>

      <button className="step-generate-button" disabled={!stepsEntered || Number(stepValue) === 0} onClick={generatePassage}>
        <AppIcon name="spark" />
        <span>Generate My Passage</span>
      </button>
    </div>
  );
}
