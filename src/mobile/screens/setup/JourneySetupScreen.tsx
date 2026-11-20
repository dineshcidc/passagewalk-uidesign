import { useMemo, useState } from "react";
import AppIcon, { type AppIconName } from "../../components/AppIcon";
import { bibleBooks, bookAbbreviation, type Testament } from "../../data/bibleBooks";
import BibleBooksGrid from "../../components/BibleBooksGrid";
import BibleVersionList from "../../components/BibleVersionList";
import { BIBLE_VERSION, getBookIndex, getBookName } from "../../data/bible";
import { EXPERIENCE_RANGES, experiences, formatBookChapters, getExperience, getExperienceSequence, type Experience } from "../../data/experiences";
import { BIBLE_CHAPTER_COUNT, biblePaces, chaptersPerDayLabel, createExperiencePlan, createJourneyPlan, DEFAULT_BIBLE_PACE, experienceThrough, formatBookList, formatChapterRun, formatCount, getBiblePace, getChapterPreview, getChapterTotal, getDayChapterCount, getDayChapterStart, plural, sortBooks, THIRTY_THREE_DAY_LENGTH } from "../../data/journeyPlans";
import { getMilestoneInfo } from "../../data/milestones";
import { getMilestonePreview, getWalkedDays } from "../../data/progress";
import type { ReadingRef } from "../../data/stepsRule";
import type { BiblePace, JourneyPlan, JourneyType, ReadingOrder } from "../../types";

// choose = the 3 ways to walk (review call 3: 33-Day Walk · Designed Experience · Create a Journey);
// experience → plan = Designed Experience list, then the chosen plan's details;
// build = Create a Journey → pick books or read the whole Bible;
// pace = whole Bible only: finish in 1, 2 or about 3 years (review call 4);
// bible = the Bible version, last step for every journey (review call 3: "where they select the version").
type SetupStep = "choose" | "experience" | "plan" | "build" | "books" | "order" | "pace" | "bible";
type WalkChoice = "automatic" | "designed" | "create";

const stepLabels: Record<SetupStep, string> = {
  choose: "Journey type",
  experience: "Designed experience",
  plan: "Experience details",
  build: "Create a journey",
  books: "Your books",
  order: "Your reading order",
  pace: "Your pace",
  bible: "Your Bible",
};

// Header step count includes the "journey ready" screen that follows: 33-Day Walk = Bible version + ready (3 steps),
// Designed Experience adds list + details + reading order (6 steps), Create a Journey adds build + reading order + pace
// (whole Bible, 6 steps) or build + books + reading order (6 steps).
function SetupHeader({ step, choice, journeyType, askVersion, onBack }: { step: SetupStep; choice: WalkChoice; journeyType: JourneyType; askVersion: boolean; onBack: () => void }) {
  const route: SetupStep[] = choice === "automatic" ? ["choose"]
    : choice === "designed" ? ["choose", "experience", "plan", "order"]
      : journeyType === "bible" ? ["choose", "build", "order", "pace"] : ["choose", "build", "books", "order"];
  const steps: SetupStep[] = askVersion ? [...route, "bible"] : route;
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

type ChoiceCard<T> = { value: T; icon: AppIconName; title: string; body: string; meta: [string] | [string, string]; tag?: string };

// Robin's naming (review call 3): three truly separate ways to walk.
const walkOptions: ChoiceCard<WalkChoice>[] = [
  {
    value: "automatic",
    icon: "butterfly",
    title: "33-Day Walk",
    body: "Your daily steps uniquely assign each Scripture reading.",
    meta: [`${THIRTY_THREE_DAY_LENGTH} DAYS`, "ONE FOR EACH YEAR OF CHRIST'S LIFE"],
  },
  {
    value: "designed",
    icon: "compass",
    title: "Choose a Designed Experience",
    body: "Choose to experience Scripture reading in a different way. Select books with the same number of chapters.",
    meta: ["2 TO 150 DAYS", "PLANNED FOR YOU"],
  },
  {
    value: "create",
    icon: "edit",
    title: "Create a Journey",
    body: "Select the books you want to explore, or journey through the entire Bible.",
    meta: ["YOUR DAYS, YOUR CHOICE"],
  },
];

// Client feedback 2026-11-19 (tracker row 34): "Selected books" / "Entire Bible". The short line under each title
// ("One chapter a day" / "66 Books") sits in the small tag next to the title, where "ALL 66" was.
const buildOptions: ChoiceCard<"custom" | "bible">[] = [
  {
    value: "custom",
    icon: "book",
    title: "Selected books",
    body: "Select one or more books. The total number of chapters sets the length of your walk.",
    meta: ["YOUR PATH", "EXODUS + LEVITICUS = 67 DAYS"],
    tag: "ONE CHAPTER A DAY",
  },
  {
    value: "bible",
    icon: "library",
    title: "Entire Bible",
    body: "The entire Bible at your own pace.",
    meta: ["ALL BOOKS", "YOUR PATH, YOUR CHOICE"],
    tag: "66 BOOKS",
  },
];

// Pace preview: the first two days' readings. In chapter order they are known ("Genesis 1–4");
// randomly, the steps pick the book, so only the day's chapter count is shown.
const pacePreview = (days: number, order: ReadingOrder) =>
  [1, 2].map((day) => {
    const count = getDayChapterCount(days, day);
    return `Day ${day} · ${order === "in-order" ? formatChapterRun(getDayChapterStart(days, day), count) : plural(count, "chapter")}`;
  });

function ChoiceList<T extends string>({ options, selected, onSelect }: { options: ChoiceCard<T>[]; selected: T; onSelect: (value: T) => void }) {
  return (
    <div className="journey-choice-list">
      {options.map((option) => (
        <button className={`journey-choice-card ${selected === option.value ? "selected" : ""}`} onClick={() => onSelect(option.value)} key={option.value} aria-pressed={selected === option.value}>
          <div className="journey-choice-top">
            <div className="journey-choice-icon"><AppIcon name={option.icon} /></div>
            <div className="journey-choice-title"><strong>{option.title}</strong>{option.tag && <em>{option.tag}</em>}</div>
            <span className="journey-radio"><i></i></span>
          </div>
          <p>{option.body}</p>
          {/* One tag, or two tags with a dot between. */}
          <div className="journey-choice-meta"><span>{option.meta[0]}</span>{option.meta[1] && <><i></i><span>{option.meta[1]}</span></>}</div>
        </button>
      ))}
    </div>
  );
}

// "Obadiah · Philemon · 2 John · 3 John · Jude" (or a one-liner for a plan through all 66 books).
const experienceBooksLine = (experience: Experience) =>
  experience.books.length === bibleBooks.length ? "All 66 books · chapter 1 of each" : experience.books.map((book) => book.name).join(" · ");

const readingName = (reading: ReadingRef) => `${getBookName(reading.bookIndex)} ${reading.chapter}`;

// Designed Experience list (Kathy's targeted books, review call 4): 31 walks, shortest first, filtered by length range.
function ExperienceList({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string) => void }) {
  const [range, setRange] = useState<number | null>(null);
  const shown = experiences.filter((experience) => range === null || (experience.days >= EXPERIENCE_RANGES[range].min && experience.days <= EXPERIENCE_RANGES[range].max));
  return (
    <div className="setup-content experience-list-content" key="experience">
      <div className="setup-heading"><span>DESIGNED EXPERIENCE</span><h1>Choose a Walk</h1><p>Travel through the Bible in a uniquely designed way, exploring books with similar chapter counts. Let curiosity guide your discoveries.</p></div>
      <div className="experience-length-filter" aria-label="Filter by length">
        <button className={range === null ? "active" : ""} onClick={() => setRange(null)} aria-pressed={range === null}>All · {experiences.length}</button>
        {EXPERIENCE_RANGES.map((option, index) => (
          <button className={range === index ? "active" : ""} onClick={() => setRange(index)} aria-pressed={range === index} key={option.label}>{option.label}</button>
        ))}
      </div>
      <div className="experience-list">
        {shown.map((experience) => (
          <button className={`experience-card ${selectedId === experience.id ? "selected" : ""}`} onClick={() => onSelect(experience.id)} aria-pressed={selectedId === experience.id} key={experience.id}>
            <div className="experience-days"><strong>{experience.days}</strong><span>DAYS</span></div>
            <div className="experience-card-copy">
              <em>{experience.theme}</em>
              <strong>{experience.name}</strong>
              <p>{experience.summary}</p>
              <small><AppIcon name="book" />{experienceBooksLine(experience)}</small>
            </div>
            <span className="journey-radio"><i></i></span>
          </button>
        ))}
      </div>
    </div>
  );
}

// The chosen walk before it starts: what it is, the verse, the books day by day, and the badges on the way.
// walked = PassageWalk days already done (Change Journey): milestones count on from there; first setup = 0.
function ExperienceDetails({ experience, walked }: { experience: Experience; walked: number }) {
  const everyBook = experience.books.length === bibleBooks.length;
  const milestoneDays = getMilestonePreview(walked, experience.days);
  return (
    <div className="setup-content experience-detail-content" key="plan">
      <section className="experience-hero">
        <div className="experience-hero-top"><span><AppIcon name="compass" />DESIGNED EXPERIENCE</span><em>{experience.theme}</em></div>
        <h1>{experience.name}</h1>
        <p>{experience.description}</p>
        {/* The common ground (Kathy): how many chapters each book has. */}
        <div className="experience-hero-stats">
          <div><strong>{experience.days}</strong><span>days</span></div>
          <div><strong>{experience.books.length}</strong><span>{experience.books.length === 1 ? "book" : "books"}</span></div>
          <div><strong>{experience.chaptersEach}</strong><span>{`${experience.chaptersEach === 1 ? "chapter" : "chapters"}${experience.books.length === 1 ? "" : " each"}`}</span></div>
        </div>
      </section>

      <blockquote className="experience-verse">
        <p>“{experience.verse.text}”</p>
        <cite>{experience.verse.reference} · {BIBLE_VERSION.short}</cite>
      </blockquote>

      <div className="experience-section-title"><span>WHAT YOU'LL WALK THROUGH</span><small>One chapter a day</small></div>
      {everyBook ? (
        <div className="experience-every-book">
          <p>Chapter 1 of every book, from Genesis to Revelation — learn where all 66 books sit.</p>
          <BibleBooksGrid visited={bibleBooks.map((_, index) => index)} visitedLabel="In this walk" compact />
        </div>
      ) : (
        <div className="experience-books">
          {experience.books.map((book, index) => {
            const startDay = experience.books.slice(0, index).reduce((total, item) => total + item.chapters.length, 0) + 1;
            const endDay = startDay + book.chapters.length - 1;
            const bookIndex = getBookIndex(book.name);
            return (
              <div key={book.name}>
                <span className={bookIndex < 39 ? "old" : "new"}>{bookAbbreviation(book.name)}</span>
                <div><strong>{formatBookChapters(book)}</strong><p>{bookIndex < 39 ? "Old" : "New"} Testament · {plural(book.chapters.length, "chapter")}</p></div>
                <em>{startDay === endDay ? `Day ${startDay}` : `Days ${startDay}–${endDay}`}</em>
              </div>
            );
          })}
        </div>
      )}

      {/* PassageWalk milestones this walk can reach (one ladder for every journey) + its own finishing badge. */}
      <div className="experience-section-title"><span>BADGES ALONG THE WAY</span><small>{plural(milestoneDays.length + 1, "badge")}</small></div>
      {walked > 0 && <p className="experience-milestones-note">Counting on from your {plural(walked, "PassageWalk day")} — every badge you've earned stays.</p>}
      <div className="experience-milestones">
        {milestoneDays.map((day) => (
          <div key={day}>
            <i><AppIcon name="milestones" /></i>
            <strong>Day {formatCount(day)}</strong>
            <span>{getMilestoneInfo(day, { type: "designed", books: [], order: "in-order", days: experience.days }).shortName}</span>
          </div>
        ))}
        <div className="final">
          <i><AppIcon name="milestones" /></i>
          <strong>{plural(experience.days, "day")}</strong>
          <span>Experience Complete</span>
        </div>
      </div>
    </div>
  );
}

// Journey setup: choose → (Designed Experience) list → details → reading order,
// or (Create a Journey) build → books → reading order; then (first time only) the Bible version. Finishes with a JourneyPlan.
export default function JourneySetupScreen({
  initialPlan,
  onComplete,
  onExit,
  askVersion = true,
}: {
  initialPlan?: JourneyPlan | null;
  onComplete: (plan: JourneyPlan) => void;
  onExit: () => void;
  askVersion?: boolean;
}) {
  // A recommended walk (Journey Complete → "Where to next", a plan with no days yet) opens straight on its details.
  const [step, setStep] = useState<SetupStep>(initialPlan?.type === "designed" && initialPlan.experience && initialPlan.days === 0 ? "plan" : "choose");
  const [choice, setChoice] = useState<WalkChoice>(!initialPlan || initialPlan.type === "automatic" ? "automatic" : initialPlan.type === "designed" ? "designed" : "create");
  const [experienceId, setExperienceId] = useState<string | null>(initialPlan?.experience ?? null);
  const experience = getExperience(experienceId ?? undefined);
  // Inside Create a Journey: your books (custom) or the whole Bible.
  const [journeyType, setJourneyType] = useState<JourneyType>(initialPlan?.type === "bible" ? "bible" : "custom");
  const [testament, setTestament] = useState<Testament>("All");
  const [query, setQuery] = useState("");
  const [selectedBooks, setSelectedBooks] = useState<string[]>(initialPlan?.type === "custom" ? initialPlan.books : []);
  const [order, setOrder] = useState<ReadingOrder>(initialPlan && initialPlan.type !== "automatic" ? initialPlan.order : "in-order");
  const [pace, setPace] = useState<BiblePace>(initialPlan?.pace ?? DEFAULT_BIBLE_PACE);

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
    if (step === "bible") setStep(choice === "automatic" ? "choose" : choice === "create" && journeyType === "bible" ? "pace" : "order");
    else if (step === "pace") setStep("order");
    else if (step === "order") setStep(choice === "designed" ? "plan" : journeyType === "bible" ? "build" : "books");
    else if (step === "plan") setStep("experience");
    else if (step === "books") setStep("build");
    else if (step === "build" || step === "experience") setStep("choose");
    else onExit();
  };

  const finish = () => {
    if (choice === "automatic") onComplete(createJourneyPlan("automatic"));
    else if (choice === "designed" && experience) onComplete(createExperiencePlan(experience, order));
    else onComplete(journeyType === "bible" ? createJourneyPlan("bible", [], order, pace) : createJourneyPlan("custom", selectedBooks, order));
  };
  // The Bible version is a reading preference, so only first-time setup asks; Change Journey keeps it (Settings has its own row).
  const toVersionOrFinish = () => (askVersion ? setStep("bible") : finish());

  const continueFlow = () => {
    if (step === "choose") {
      if (choice === "automatic") toVersionOrFinish();
      else if (choice === "designed") setStep("experience");
      else setStep("build");
    } else if (step === "experience") {
      setStep("plan");
    } else if (step === "plan") {
      // A Designed Experience follows its plan in order by default; changing back to the same plan keeps its order.
      if (initialPlan?.experience !== experienceId) setOrder("in-order");
      setStep("order");
    } else if (step === "build") {
      // Defaults: your books → in order (recommended); whole Bible → randomly (the client's "unique experience").
      if (journeyType === "custom") {
        if (initialPlan?.type !== "custom") setOrder("in-order");
        setStep("books");
      } else {
        if (initialPlan?.type !== "bible") setOrder("steps");
        setStep("order");
      }
    } else if (step === "books") {
      setStep("order");
    } else if (step === "order") {
      if (choice === "create" && journeyType === "bible") setStep("pace");
      else toVersionOrFinish();
    } else if (step === "pace") {
      toVersionOrFinish();
    } else {
      finish();
    }
  };

  const isDesigned = choice === "designed" && experience !== null;
  const isBible = !isDesigned && journeyType === "bible";
  const sequence = experience ? getExperienceSequence(experience) : [];
  // Client feedback 2026-11-19 (tracker rows 31, 47): "Sequential Reading" / "Step Guided Reading" (was "Read in order" / "Read randomly").
  const orderOptions: { value: ReadingOrder; icon: "book" | "steps"; title: string; body: string; tag?: string; preview: string[] }[] = isDesigned
    ? [
      { value: "in-order", icon: "book", title: "Sequential Reading", body: "Read through books in biblical order, 1 chapter a day.", tag: "RECOMMENDED", preview: sequence.slice(0, 3).map(readingName) },
      { value: "steps", icon: "steps", title: "Step Guided Reading", body: "Let your daily steps guide the next chapter in your journey. Every chapter once.", preview: [...new Set([0.62, 0.08, 0.85].map((ratio) => readingName(sequence[Math.floor(sequence.length * ratio)])))] },
    ]
    : isBible
    ? [
      { value: "in-order", icon: "book", title: "Sequential Reading", body: "Begin at Genesis 1 and walk book by book to Revelation.", preview: ["Genesis 1", "Genesis 2", "Genesis 3"] },
      { value: "steps", icon: "steps", title: "Step Guided Reading", body: "Your daily steps point you to a book, alternating Old and New Testament. Every day a surprise.", tag: "UNIQUE", preview: ["Ruth 1", "Galatians 5", "Proverbs 3"] },
    ]
    : [
      { value: "in-order", icon: "book", title: "Sequential Reading", body: "Read through books in biblical order.", tag: "RECOMMENDED", preview: getChapterPreview(sortedBooks, "in-order") },
      { value: "steps", icon: "steps", title: "Step Guided Reading", body: "Let your daily steps guide the next chapter in your journey. Every chapter once.", preview: getChapterPreview(sortedBooks, "steps") },
    ];

  const continueLabel = step === "books"
    ? selectedBooks.length ? `Continue with ${formatCount(chapterTotal)} ${chapterTotal === 1 ? "day" : "days"}` : "Select at least one book"
    : step === "experience" ? experience ? `View ${experience.name}` : "Choose a walk"
      : step === "plan" ? "Choose This Walk" : step === "pace" ? `Continue with ${plural(getBiblePace(pace).days, "day")}` : step === "bible" ? `Continue with ${BIBLE_VERSION.short}` : "Continue";
  const continueDisabled = (step === "books" && selectedBooks.length === 0) || (step === "experience" && !experience);

  return (
    <div className={`setup-screen setup-screen-${step}`}>
      <SetupHeader step={step} choice={choice} journeyType={journeyType} askVersion={askVersion} onBack={goBack} />

      {step === "choose" && (
        <div className="setup-content setup-choice-content journey-options-content" key="choose">
          <div className="setup-heading"><span>YOUR WALK, YOUR WAY</span><h1>Choose your journey</h1><p>How would you like your steps to guide you through Scripture?</p></div>
          <ChoiceList options={walkOptions} selected={choice} onSelect={setChoice} />
        </div>
      )}

      {step === "experience" && <ExperienceList selectedId={experienceId} onSelect={setExperienceId} />}

      {step === "plan" && experience && <ExperienceDetails experience={experience} walked={askVersion ? 0 : getWalkedDays()} />}

      {step === "build" && (
        <div className="setup-content journey-options-content" key="build">
          <div className="setup-heading"><span>CREATE A JOURNEY</span><h1>What path would you like to take?</h1><p>Follow a path through selected books or journey through the entire Bible. You can change journeys anytime in Settings.</p></div>
          <ChoiceList options={buildOptions} selected={journeyType === "bible" ? "bible" : "custom"} onSelect={setJourneyType} />
        </div>
      )}

      {step === "books" && (
        <div className="setup-content setup-book-content initial-book-content multi-book-content" key="books">
          <div className="setup-heading"><h1>Choose your books</h1><p>Select one or more. Each chapter becomes one day of your journey.</p></div>
          <div className="book-search"><AppIcon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search 66 books" /></div>
          <div className="testament-filter">
            {(["All", "Old", "New"] as Testament[]).map((item) => <button className={testament === item ? "active" : ""} onClick={() => setTestament(item)} key={item}>{item === "All" ? "All Books" : `${item} Testament`}</button>)}
          </div>
          <div className="book-list book-list-multi">
            {filteredBooks.map((book) => {
              const selected = selectedBooks.includes(book.name);
              return (
                <button className={selected ? "selected" : ""} onClick={() => toggleBook(book.name)} key={book.name} aria-pressed={selected}>
                  <span>{bookAbbreviation(book.name)}</span>
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
        // Client feedback 2026-11-19 (tracker rows 31, 47): one title for every journey's reading order step.
        <div className="setup-content setup-order-content" key="order">
          <div className="setup-heading">
            {isDesigned ? (
              <>
                <span>{experience.name.toUpperCase()} · {plural(experience.days, "DAY", "DAYS")}</span>
                <h1>Choose your reading experience.</h1>
                <p>One chapter a day through {experienceThrough(experience)}. You can change journeys anytime in Settings.</p>
              </>
            ) : isBible ? (
              <>
                <span>66 BOOKS · {formatCount(BIBLE_CHAPTER_COUNT)} CHAPTERS</span>
                <h1>Choose your reading experience.</h1>
                <p>Choose the order first — next, how fast you'd like to finish. You can change journeys anytime in Settings.</p>
              </>
            ) : (
              <>
                <span>{sortedBooks.length} {sortedBooks.length === 1 ? "BOOK" : "BOOKS"} · {formatCount(chapterTotal)} {chapterTotal === 1 ? "CHAPTER" : "CHAPTERS"}</span>
                <h1>Choose your reading experience.</h1>
                <p>One chapter a day through {formatBookList(sortedBooks)}. You can change journeys anytime in Settings.</p>
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
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "pace" && (
        <div className="setup-content setup-order-content setup-pace-content" key="pace">
          <div className="setup-heading">
            <span>THE WHOLE BIBLE · {order === "in-order" ? "IN CHAPTER ORDER" : "RANDOMLY"}</span>
            <h1>How fast do you want to finish?</h1>
            <p>Pick a daily pace for all {formatCount(BIBLE_CHAPTER_COUNT)} chapters. Each day of your walk reads that many.</p>
          </div>
          <div className="journey-choice-list order-choice-list">
            {biblePaces.map((option) => (
              <button className={`journey-choice-card pace-choice-card ${pace === option.value ? "selected" : ""}`} onClick={() => setPace(option.value)} key={option.value} aria-pressed={pace === option.value}>
                <div className="journey-choice-top">
                  <div className="journey-choice-icon pace-per-day" aria-hidden="true">
                    <strong>{chaptersPerDayLabel(option.days).split(" ")[0]}</strong>
                    <span>CH / DAY</span>
                  </div>
                  <div className="journey-choice-title"><strong>{option.title}</strong>{option.tag && <em>{option.tag}</em>}</div>
                  <span className="journey-radio"><i></i></span>
                </div>
                <p>{option.body}</p>
                <div className="journey-choice-meta"><span>{plural(option.days, "DAY", "DAYS")}</span><i></i><span>{chaptersPerDayLabel(option.days).toUpperCase()}</span></div>
                <div className="order-preview" aria-label="First days">
                  {pacePreview(option.days, order).map((reading, index) => (
                    <span key={reading}>{index > 0 && <AppIcon name="chevron" />}<b>{reading}</b></span>
                  ))}
                  <span className="order-preview-more">…</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "bible" && (
        <div className="setup-content bible-version-content" key="bible">
          <div className="setup-heading"><span>YOUR BIBLE</span><h1>Select your Bible version</h1><p>God's message remains the same. The wording may differ. Choose the translation that helps you read, reflect, and engage.</p><p>You can change it at any time.</p></div>          <BibleVersionList />
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
        <button className="setup-continue" onClick={continueFlow} disabled={continueDisabled}>
          <span>{continueLabel}</span>
          <AppIcon name="chevron" />
        </button>
      </div>
    </div>
  );
}
