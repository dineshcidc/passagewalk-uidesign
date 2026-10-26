import AppIcon from "../../components/AppIcon";
import { BIBLE_VERSION } from "../../data/bible";
import { getExperience } from "../../data/experiences";
import { BIBLE_CHAPTER_COUNT, chaptersPerDayLabel, experienceThrough, formatBookList, formatCount, getBiblePace, journeyTypeIcons, journeyTypeLabels, plural, readingOrderLabel, readingStyle, withArticle } from "../../data/journeyPlans";
import type { JourneyPlan } from "../../types";

// Journey confirmation after setup (client slide 16): "You're set for a 67-day sequential Passage Walk".
export default function JourneyReadyScreen({ plan, onStart, onChange, startLabel = "Start My Journey" }: { plan: JourneyPlan; onStart: () => void; onChange: () => void; startLabel?: string }) {
  const days = formatCount(plan.days);
  const experience = getExperience(plan.experience);
  // "One chapter a day through Exodus and Leviticus." + how the steps work for this journey.
  const through = experience ? experienceThrough(experience) : plan.type === "custom" ? formatBookList(plan.books) : plan.type === "bible" ? "the whole Bible" : "the Old and New Testaments";
  // Whole Bible at its pace: "3–4 chapters a day"; every other journey reads one chapter a day.
  const pace = plan.type === "bible" ? getBiblePace(plan.pace) : null;
  const perDay = pace ? chaptersPerDayLabel(plan.days) : "one chapter a day";
  const dayReading = pace && pace.days < BIBLE_CHAPTER_COUNT ? "chapters" : "chapter";
  const stepsLine = plan.type !== "automatic" && plan.order === "in-order"
    ? `Your steps unlock each day's ${dayReading}, in order.`
    : `Your steps will guide you to each day's ${dayReading}.`;
  const details: { label: string; value: string; note?: string }[] = experience
    ? [
      { label: "Walk", value: experience.name },
      { label: "Books", value: plan.books.length === 66 ? "All 66 books" : plan.books.length > 3 ? `${plan.books.length} books` : plan.books.join(" · ") },
      { label: "Chapters", value: `${plural(plan.days, "chapter")} · one a day` },
      { label: "Reading order", value: readingOrderLabel(plan) },
    ]
    : plan.type === "custom"
    ? [
      { label: "Books", value: plan.books.length > 3 ? `${plan.books.length} books` : plan.books.join(" · ") },
      { label: "Chapters", value: `${plural(plan.days, "chapter")} · one a day` },
      { label: "Reading order", value: readingOrderLabel(plan) },
    ]
    : plan.type === "bible"
      ? [
        { label: "Books", value: "All 66 books", note: `${formatCount(BIBLE_CHAPTER_COUNT)} chapters` },
        { label: "Pace", value: pace!.title, note: perDay },
        { label: "Reading order", value: readingOrderLabel(plan) },
      ]
      : [
        { label: "Testaments", value: "Old & New Testaments", note: "(alternating)" },
        { label: "Daily reading", value: "One chapter a day" },
        { label: "Chosen by", value: "Your daily steps" },
      ];
  const fact = experience
    ? `${experience.tagline} Walk all ${days} days to earn the ${experience.name} badge.`
    : plan.type === "automatic"
    ? "Did you know? Christ was 33 years old when He died — one day for each year of His life."
    : plan.type === "bible"
      ? "66 books, written over many centuries. Your steps will take you to every one."
      : plan.books.length > 1
        ? "Finish a book and you'll earn a milestone along the way."
        : plan.days === 1
          ? `Read the one chapter of ${plan.books[0]} to complete your journey.`
          : `Read all ${days} chapters of ${plan.books[0]} to complete your journey.`;

  return (
    <div className="moment-screen journey-ready-screen">
      <div className="moment-visual">
        <div className="moment-sparkles" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <i key={index} />)}</div>
        <div className="journey-ready-medallion">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle className="journey-ready-track" cx="60" cy="60" r="54" />
            <circle className="journey-ready-arc" cx="60" cy="60" r="54" pathLength={100} />
          </svg>
          <div><strong className={days.length > 3 ? "long" : ""}>{days}</strong><span>{plan.days === 1 ? "DAY" : "DAYS"}</span></div>
        </div>
      </div>

      <div className="moment-copy">
        <span>YOUR JOURNEY IS READY</span>
        <h1>You're set for {withArticle(plan.days)}-day {readingStyle(plan) && `${readingStyle(plan)} `}Passage Walk</h1>
        <p>{experience ? `${experience.name}: one chapter a day through ${through}.` : `${perDay[0].toUpperCase()}${perDay.slice(1)} through ${through}.`} {stepsLine}</p>
      </div>

      <div className="journey-ready-card">
        <div className="journey-ready-card-head">
          <i><AppIcon name={journeyTypeIcons[plan.type]} /></i>
          <div><span>JOURNEY TYPE</span><strong>{journeyTypeLabels[plan.type]}</strong></div>
        </div>
        <dl>
          {[...details, { label: "Bible", value: BIBLE_VERSION.name }].map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}{item.note && <small>{item.note}</small>}</dd></div>)}
        </dl>
        <p className="journey-ready-fact"><AppIcon name="spark" />{fact}</p>
      </div>

      <div className="moment-footer">
        <button type="button" className="moment-primary" onClick={onStart}>
          <span>{startLabel}</span>
          <AppIcon name="chevron" />
        </button>
        <button type="button" className="moment-link" onClick={onChange}>Change Journey</button>
      </div>
    </div>
  );
}
