import { useMemo, useState } from "react";
import AppIcon from "../../components/AppIcon";
import { bibleBooks, type Testament } from "../../data/bibleBooks";
import { BIBLE_CHAPTER_COUNT, createJourneyPlan, formatBookList, formatCount, getChapterPreview, getChapterTotal, sortBooks, THIRTY_THREE_DAY_LENGTH } from "../../data/journeyPlans";
import type { JourneyPlan, JourneyType, ReadingOrder } from "../../types";

type SetupStep = "choose" | "books" | "order";

const stepLabels: Record<SetupStep, string> = { choose: "Journey type", books: "Your books", order: "Your reading order" };

// Header step count includes the "journey ready" screen that follows: 33-Day goes straight there (2 steps),
// Entire Bible adds the reading order (3 steps), Choose Your Own adds books + reading order (4 steps).
function SetupHeader({ step, journeyType, onBack }: { step: SetupStep; journeyType: JourneyType; onBack: () => void }) {
  const steps: SetupStep[] = journeyType === "custom" ? ["choose", "books", "order"] : journeyType === "bible" ? ["choose", "order"] : ["choose"];
  const number = String(steps.indexOf(step) + 1).padStart(2, "0");
  const total = String(steps.length + 1).padStart(2, "0");
  return (
    <div className="setup-header">
      <button className="setup-back" onClick={onBack} aria-label="Go back"><AppIcon name="back" /></button>
      <div><span>JOURNEY SETUP</span><strong>{stepLabels[step]}</strong></div>
      <div className="setup-step-number">{number}<span>/{total}</span></div>
    </div>
  );
}

const journeyOptions: { type: JourneyType; icon: "spark" | "book" | "library"; title: string; body: string; meta: [string, string]; tag?: string }[] = [
  {
    type: "automatic",
    icon: "spark",
    title: "33-Day Journey",
    body: "Your daily steps uniquely guide each scripture assignment.",
    meta: [`${THIRTY_THREE_DAY_LENGTH} DAYS`, "ONE FOR EACH YEAR OF CHRIST'S LIFE"],
  },
  {
    type: "custom",
    icon: "book",
    title: "Choose Your Own Journey",
    body: "Select the books you'd like to focus on. Their chapters create your personal journey.",
    meta: ["YOUR BOOKS", "ONE CHAPTER A DAY"],
  },
  {
    type: "bible",
    icon: "library",
    title: "Read the Entire Bible",
    body: "Walk through all 66 books, book by book in chapter order, or randomly as your steps choose.",
    meta: ["66 BOOKS", `${formatCount(BIBLE_CHAPTER_COUNT)} DAYS`],
    tag: "UNIQUE",
  },
];

// First-time journey setup: choose → (Choose Your Own) books → reading order. Finishes with a JourneyPlan.
export default function JourneySetupScreen({
  initialPlan,
  onComplete,
  onExit,
}: {
  initialPlan?: JourneyPlan | null;
  onComplete: (plan: JourneyPlan) => void;
  onExit: () => void;
}) {
  const [step, setStep] = useState<SetupStep>("choose");
  const [journeyType, setJourneyType] = useState<JourneyType>(initialPlan?.type ?? "automatic");
  const [testament, setTestament] = useState<Testament>("All");
  const [query, setQuery] = useState("");
  const [selectedBooks, setSelectedBooks] = useState<string[]>(initialPlan?.type === "custom" ? initialPlan.books : []);
  const [order, setOrder] = useState<ReadingOrder>(initialPlan && initialPlan.type !== "automatic" ? initialPlan.order : "in-order");

  const filteredBooks = useMemo(() => bibleBooks.filter((book) => {
    const matchesTestament = testament === "All" || book.testament === testament;
    return matchesTestament && book.name.toLowerCase().includes(query.trim().toLowerCase());
  }), [query, testament]);
  const sortedBooks = sortBooks(selectedBooks);
  const chapterTotal = getChapterTotal(selectedBooks);

  const toggleBook = (name: string) => {
    setSelectedBooks((current) => current.includes(name) ? current.filter((book) => book !== name) : [...current, name]);
  };

  const goBack = () => {
    if (step === "order") setStep(journeyType === "bible" ? "choose" : "books");
    else if (step === "books") setStep("choose");
    else onExit();
  };

  const continueFlow = () => {
    if (step === "choose") {
      // Defaults: Choose Your Own → in order (recommended); Entire Bible → randomly (the client's "unique experience").
      if (journeyType === "custom") {
        if (initialPlan?.type !== "custom") setOrder("in-order");
        setStep("books");
      } else if (journeyType === "bible") {
        if (initialPlan?.type !== "bible") setOrder("steps");
        setStep("order");
      }
      else onComplete(createJourneyPlan(journeyType));
    } else if (step === "books") {
      setStep("order");
    } else {
      onComplete(journeyType === "bible" ? createJourneyPlan("bible", [], order) : createJourneyPlan("custom", selectedBooks, order));
    }
  };

  const isBible = journeyType === "bible";
  // Client wording (slides 12 / 15): "Read in (chapter) order" / "Read randomly".
  const orderOptions: { value: ReadingOrder; icon: "book" | "steps"; title: string; body: string; tag?: string; preview: string[] }[] = isBible
    ? [
      { value: "in-order", icon: "book", title: "Read in chapter order", body: "Begin at Genesis 1 and walk book by book to Revelation.", preview: ["Genesis 1", "Genesis 2", "Genesis 3"] },
      { value: "steps", icon: "steps", title: "Read randomly", body: "Your daily steps point you to a book, alternating Old and New Testament. Every day a surprise.", tag: "UNIQUE", preview: ["Ruth 1", "Galatians 5", "Proverbs 3"] },
    ]
    : [
      { value: "in-order", icon: "book", title: "Read in order", body: `Begin at ${sortedBooks[0]} 1 and walk chapter by chapter.`, tag: "RECOMMENDED", preview: getChapterPreview(sortedBooks, "in-order") },
      { value: "steps", icon: "steps", title: "Read randomly", body: "Your daily steps pick an unread chapter. Every chapter once, every day a surprise.", preview: getChapterPreview(sortedBooks, "steps") },
    ];

  const continueLabel = step === "books"
    ? selectedBooks.length ? `Continue with ${formatCount(chapterTotal)} ${chapterTotal === 1 ? "day" : "days"}` : "Select at least one book"
    : "Continue";

  return (
    <div className={`setup-screen setup-screen-${step}`}>
      <SetupHeader step={step} journeyType={journeyType} onBack={goBack} />

      {step === "choose" && (
        <div className="setup-content setup-choice-content journey-options-content" key="choose">
          <div className="setup-heading"><span>YOUR WALK, YOUR WAY</span><h1>Choose your journey</h1><p>How would you like your steps to guide you through scripture?</p></div>
          <div className="journey-choice-list">
            {journeyOptions.map((option) => (
              <button className={`journey-choice-card ${journeyType === option.type ? "selected" : ""}`} onClick={() => setJourneyType(option.type)} key={option.type} aria-pressed={journeyType === option.type}>
                <div className="journey-choice-top">
                  <div className="journey-choice-icon"><AppIcon name={option.icon} /></div>
                  <div className="journey-choice-title"><strong>{option.title}</strong>{option.tag && <em>{option.tag}</em>}</div>
                  <span className="journey-radio"><i></i></span>
                </div>
                <p>{option.body}</p>
                <div className="journey-choice-meta"><span>{option.meta[0]}</span><i></i><span>{option.meta[1]}</span></div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "books" && (
        <div className="setup-content setup-book-content initial-book-content multi-book-content" key="books">
          <div className="setup-heading"><h1>Choose your books</h1><p>Pick one or more. Each chapter becomes one day of your walk.</p></div>
          <div className="book-search"><AppIcon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search 66 books" /></div>
          <div className="testament-filter">
            {(["All", "Old", "New"] as Testament[]).map((item) => <button className={testament === item ? "active" : ""} onClick={() => setTestament(item)} key={item}>{item === "All" ? "All Books" : `${item} Testament`}</button>)}
          </div>
          <div className="book-list book-list-multi">
            {filteredBooks.map((book) => {
              const selected = selectedBooks.includes(book.name);
              return (
                <button className={selected ? "selected" : ""} onClick={() => toggleBook(book.name)} key={book.name} aria-pressed={selected}>
                  <span>{(/^\d /.test(book.name) ? book.name[0] + book.name[2] : book.name.slice(0, 2)).toUpperCase()}</span>
                  <div><strong>{book.name}</strong><p>{book.testament} Testament · {book.chapters} {book.chapters === 1 ? "chapter" : "chapters"}</p></div>
                  <i><AppIcon name="check" /></i>
                </button>
              );
            })}
            {filteredBooks.length === 0 && <p className="book-list-empty">No books match "{query}".</p>}
          </div>
        </div>
      )}

      {step === "order" && (
        <div className="setup-content setup-order-content" key="order">
          <div className="setup-heading">
            {isBible ? (
              <>
                <span>66 BOOKS · {formatCount(BIBLE_CHAPTER_COUNT)} CHAPTERS</span>
                <h1>How should we walk through the Bible?</h1>
                <p>One chapter a day through the entire Bible. You can switch journeys later in Settings.</p>
              </>
            ) : (
              <>
                <span>{sortedBooks.length} {sortedBooks.length === 1 ? "BOOK" : "BOOKS"} · {formatCount(chapterTotal)} {chapterTotal === 1 ? "CHAPTER" : "CHAPTERS"}</span>
                <h1>How should we walk through them?</h1>
                <p>One chapter a day through {formatBookList(sortedBooks)}. You can switch journeys later in Settings.</p>
              </>
            )}
          </div>
          <div className="journey-choice-list order-choice-list">
            {orderOptions.map((option) => (
              <button className={`journey-choice-card ${order === option.value ? "selected" : ""}`} onClick={() => setOrder(option.value)} key={option.value} aria-pressed={order === option.value}>
                <div className="journey-choice-top">
                  <div className="journey-choice-icon"><AppIcon name={option.icon} /></div>
                  <div className="journey-choice-title"><strong>{option.title}</strong>{option.tag && <em>{option.tag}</em>}</div>
                  <span className="journey-radio"><i></i></span>
                </div>
                <p>{option.body}</p>
                <div className="order-preview" aria-label="First readings">
                  {option.preview.map((reading, index) => (
                    <span key={reading}>{index > 0 && <AppIcon name="chevron" />}<b>{reading}</b></span>
                  ))}
                  {(isBible || chapterTotal > 3) && <span className="order-preview-more">…</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="setup-footer">
        {step === "books" && (
          <div className={`book-selection-summary ${selectedBooks.length ? "" : "empty"}`} aria-live="polite">
            {selectedBooks.length ? (
              <>
                <div><strong>{formatCount(chapterTotal)}-day journey</strong><span>{formatBookList(sortedBooks)}</span></div>
                <p>{selectedBooks.length} {selectedBooks.length === 1 ? "book" : "books"} · {formatCount(chapterTotal)} {chapterTotal === 1 ? "chapter" : "chapters"}</p>
              </>
            ) : (
              <span>1 chapter = 1 day · e.g. Exodus + Leviticus = 67 days</span>
            )}
          </div>
        )}
        <button className="setup-continue" onClick={continueFlow} disabled={step === "books" && selectedBooks.length === 0}>
          <span>{continueLabel}</span>
          <AppIcon name="chevron" />
        </button>
      </div>
    </div>
  );
}
