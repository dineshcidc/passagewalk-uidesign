import { useEffect, useMemo, useState } from "react";
import AppIcon, { type AppIconName } from "../../components/AppIcon";
import BibleBooksGrid from "../../components/BibleBooksGrid";
import CertificateViewer from "../../components/CertificateViewer";
import CompletionCertificate from "../../components/CompletionCertificate";
import MilestoneBadge from "../../components/MilestoneBadge";
import { downloadCertificate } from "../../certificate";
import { experiences, getExperience } from "../../data/experiences";
import { getJourneyCompleteDemo } from "../../data/journeyCompleteDemo";
import { createJourneyPlan, formatCount } from "../../data/journeyPlans";
import { getUser } from "../../data/user";
import { playApplause, playChime, playFanfare } from "../../sound";
import type { JourneyPlan } from "../../types";

// Journey Complete (review call 3 — Jessica: "a page that prompts them what to do next"; Robin: "this is what you
// accomplished in 33 days… where do you want to go next?"; Kathy: "with confetti… we are so proud of you").
// Prototype demo opened from Settings; in the real app it follows the last day's saved reflection.
// celebrate → story (the summary report) → next (choose the next walk, which opens the normal setup).
type Stage = "celebrate" | "story" | "next";

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Numbers that count up when the screen opens.
function useCountUp(target: number, duration = 1500, delay = 0) {
  const [value, setValue] = useState(() => (reducedMotion() ? target : 0));
  useEffect(() => {
    if (reducedMotion()) return;
    let frame = 0;
    const begin = performance.now() + delay;
    const tick = (now: number) => {
      const progress = Math.min(1, Math.max(0, (now - begin) / duration));
      setValue(Math.round(target * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, delay]);
  return value;
}

// Confetti in the client's accent colours (gold, purple) with our teal — falls for as long as the screen is open.
const confetti = Array.from({ length: 46 }, (_, index) => ({
  left: (index * 23 + 7) % 100,
  delay: (index % 11) * 0.27,
  duration: 3.2 + (index % 6) * 0.45,
  drift: ((index % 9) - 4) * 11,
  color: ["#e7a83a", "#9b6dff", "#6c8f3e", "#f6cd7c", "#ffffff", "#c9b2ff"][index % 6],
  shape: index % 4 === 0 ? "round" : index % 4 === 1 ? "ribbon" : "",
}));

function Celebrate({ demo, onNext, onExit }: { demo: ReturnType<typeof getJourneyCompleteDemo>; onNext: () => void; onExit: () => void }) {
  const firstName = getUser().firstName || "Dinesh";
  const days = useCountUp(demo.days, 1200, 900);
  const steps = useCountUp(demo.totalSteps, 1800, 1000);
  const verses = useCountUp(demo.totalVerses, 1600, 1100);

  // Fanfare as the medal lands, then a long round of applause.
  const celebrate = () => {
    playFanfare();
    window.setTimeout(() => playApplause(3.2, 0.55), 900);
  };
  useEffect(() => {
    const timer = window.setTimeout(celebrate, 300);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="jc-celebrate" role="dialog" aria-modal="true" aria-labelledby="jc-title">
      <div className="jc-confetti" aria-hidden="true">
        {confetti.map((piece, index) => (
          <i
            className={piece.shape}
            key={index}
            style={{ left: `${piece.left}%`, background: piece.color, animationDelay: `${piece.delay}s`, animationDuration: `${piece.duration}s`, "--drift": `${piece.drift}px` } as React.CSSProperties}
          />
        ))}
      </div>
      <button className="jc-close" onClick={onExit} aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>

      <div className="jc-stage">
        <div className="jc-rays" aria-hidden="true" />
        <div className="jc-rings" aria-hidden="true"><i /><i /><i /></div>
        <div className="jc-sparkles" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <i key={index}><AppIcon name="spark" /></i>)}</div>
        <div className="jc-medal"><MilestoneBadge milestone={{ day: demo.days, unlocked: true }} large /></div>
      </div>

      <div className="jc-copy">
        <span>JOURNEY COMPLETE · {demo.days} OF {demo.days} DAYS</span>
        <h1 id="jc-title">You did it, {firstName}!</h1>
        <p>You walked all {demo.days} days of {demo.finalInfo.name.replace(/^The /, "the ")} — one for each year of Christ's life. <strong>We are so proud of you.</strong></p>
      </div>

      <div className="jc-counters">
        <div><strong>{formatCount(days)}</strong><span>days</span></div>
        <div><strong>{formatCount(steps)}</strong><span>steps</span></div>
        <div><strong>{formatCount(verses)}</strong><span>verses</span></div>
      </div>

      <div className="jc-actions">
        <button className="jc-primary" onClick={onNext}><span>See What You Accomplished</span><AppIcon name="chevron" /></button>
        <button className="jc-again" onClick={celebrate}><span aria-hidden="true">👏</span>Celebrate again</button>
      </div>
    </div>
  );
}

function Story({ demo, onBack, onNext }: { demo: ReturnType<typeof getJourneyCompleteDemo>; onBack: () => void; onNext: () => void }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const maxSteps = Math.max(...demo.steps);
  const average = Math.round(demo.totalSteps / demo.days);
  const tiles: { icon: AppIconName; value: string; label: string; note: string }[] = [
    { icon: "steps", value: formatCount(demo.totalSteps), label: "steps walked", note: `About ${formatCount(demo.miles)} miles` },
    { icon: "book", value: formatCount(demo.totalVerses), label: "verses read", note: "Every one counted" },
    { icon: "journal", value: formatCount(demo.reflections), label: "reflections", note: `${formatCount(demo.highlights)} verses highlighted` },
    { icon: "library", value: `${demo.booksVisited}`, label: "books visited", note: "of the 66 books" },
  ];

  useEffect(() => {
    const timer = window.setTimeout(() => playChime(0.22), 200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="jc-story">
      <header className="jc-header">
        <button onClick={onBack} aria-label="Back"><AppIcon name="back" /></button>
        <strong>Your {demo.days}-Day Story</strong>
        <span></span>
      </header>

      <div className="jc-scroll">
        <section className="jc-hero-card">
          <div className="jc-hero-top">
            <div className="jc-hero-medal"><MilestoneBadge milestone={{ day: demo.days, unlocked: true }} large /></div>
            <div>
              <span>{demo.finalInfo.name.toUpperCase()}</span>
              <h1>{demo.days} of {demo.days} days</h1>
              <p>{demo.startDate.replace(/, \d{4}$/, "")} – {demo.endDate}</p>
            </div>
          </div>
          <div className="jc-hero-track"><i /></div>
          <div className="jc-hero-foot"><em><AppIcon name="check" />Journey complete</em><strong>100%</strong></div>
        </section>

        <section className="jc-tiles">
          {tiles.map((tile, index) => (
            <div style={{ animationDelay: `${0.1 + index * 0.08}s` }} key={tile.label}>
              <i><AppIcon name={tile.icon} /></i>
              <strong>{tile.value}</strong>
              <span>{tile.label}</span>
              <small>{tile.note}</small>
            </div>
          ))}
        </section>

        {/* Kathy: total passages "never goes down… the more we can show where it goes up is the key visual". */}
        <section className="jc-card">
          <div className="jc-card-head"><div><span>VERSES READ · ALWAYS GOING UP</span><strong>Your scripture grew every day</strong></div><b>{formatCount(demo.totalVerses)}</b></div>
          <div className="jc-growth" aria-label={`Verses read grew from ${demo.growth[0]} on Day 1 to ${formatCount(demo.totalVerses)} on Day ${demo.days}`}>
            {demo.growth.map((value, index) => (
              <i className={index === demo.growth.length - 1 ? "last" : ""} style={{ height: `${Math.max(4, (value / demo.totalVerses) * 100)}%`, animationDelay: `${index * 0.025}s` }} key={index} />
            ))}
          </div>
          <div className="jc-axis"><span>Day 1</span><span>Day {Math.ceil(demo.days / 2)}</span><span>Day {demo.days}</span></div>
        </section>

        <section className="jc-card">
          <div className="jc-card-head"><div><span>YOUR STEPS</span><strong>Best day: Day {demo.best.day} · {formatCount(demo.best.steps)} steps</strong></div></div>
          <div className="jc-steps-chart" aria-label={`Steps each day, average ${formatCount(average)}`}>
            {demo.steps.map((value, index) => (
              <i className={index === demo.best.day - 1 ? "best" : ""} style={{ height: `${(value / maxSteps) * 100}%`, animationDelay: `${index * 0.025}s` }} key={index} />
            ))}
          </div>
          <p className="jc-note"><AppIcon name="steps" />Average {formatCount(average)} steps a day — {formatCount(demo.days)} days without stopping.</p>
        </section>

        <section className="jc-card">
          <div className="jc-card-head"><div><span>WHERE YOUR STEPS LED</span><strong>{demo.booksVisited} books, Genesis to Revelation</strong></div></div>
          <div className="jc-split">
            <div className="old" style={{ flex: demo.oldCount }}><b>{demo.oldCount}</b> Old Testament</div>
            <div className="new" style={{ flex: demo.newCount }}><b>{demo.newCount}</b> New Testament</div>
          </div>
          <BibleBooksGrid visited={demo.visitedBooks} visitedLabel="Visited on this walk" compact />
          <div className="jc-furthest">
            <span>BOOKS YOU WENT FURTHEST IN</span>
            {demo.furthest.map((book) => (
              <div key={book.book}>
                <strong>{book.book}</strong>
                <i><b style={{ width: `${book.percent}%` }} /></i>
                <em>{book.percent}%</em>
              </div>
            ))}
          </div>
          {demo.finished.length > 0 && <p className="jc-note gold"><AppIcon name="milestones" />Books finished: {demo.finished.join(" · ")}</p>}
        </section>

        <section className="jc-card jc-verse-card">
          <span>YOUR MOST LOVED VERSE</span>
          <blockquote>“{demo.favourite.text}”</blockquote>
          <cite>{demo.favourite.reference} · highlighted on Day {demo.favourite.day}</cite>
        </section>

        <section className="jc-card">
          <div className="jc-card-head"><div><span>BADGES EARNED</span><strong>All {demo.badges.length} badges collected</strong></div></div>
          <div className="jc-badges">
            {demo.badges.map((badge) => (
              <div key={badge.day}>
                <MilestoneBadge milestone={{ day: badge.day, unlocked: true }} />
                <strong>Day {badge.day}</strong>
                <span>{badge.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="jc-card jc-certificate">
          <div className="jc-card-head"><div><span>YOUR CERTIFICATE</span><strong>Certificate of Completion</strong></div></div>
          <button className="certificate-preview" onClick={() => setViewerOpen(true)} aria-label="View certificate full screen">
            <CompletionCertificate day={demo.days} completedOn={demo.endDate} info={demo.finalInfo} />
          </button>
          <div className="jc-certificate-actions">
            <button onClick={() => setViewerOpen(true)}><AppIcon name="eye" />View</button>
            <button onClick={() => downloadCertificate(demo.days, demo.endDate, demo.finalInfo)}><AppIcon name="download" />Download</button>
          </div>
        </section>
      </div>

      <div className="jc-dock">
        <button className="jc-primary" onClick={onNext}><span>Where to Next?</span><AppIcon name="chevron" /></button>
      </div>

      {viewerOpen && <CertificateViewer day={demo.days} completedOn={demo.endDate} info={demo.finalInfo} onClose={() => setViewerOpen(false)} />}
    </div>
  );
}

// "Where do you want to walk next?" — Kathy: after the 33 "they can go to that 66, that 120, or… choose your own journey".
function NextWalk({ demo, onBack, onChoose, onExit }: { demo: ReturnType<typeof getJourneyCompleteDemo>; onBack: () => void; onChoose: (plan: JourneyPlan) => void; onExit: () => void }) {
  const designed = (experience?: string): JourneyPlan => ({ type: "designed", books: [], order: "in-order", days: 0, experience });
  const recommended = getExperience("targeted-isaiah")!;
  const options: { icon: AppIconName; title: string; body: string; meta: string[]; plan: JourneyPlan }[] = [
    { icon: "spark", title: "Walk the 33 days again", body: "A new 33-Day Walk — your steps will choose fresh readings.", meta: ["33 DAYS"], plan: createJourneyPlan("automatic") },
    { icon: "compass", title: "Choose a Designed Experience", body: "Books with the same number of chapters, walked together.", meta: ["2 TO 150 DAYS", `${experiences.length} WALKS`], plan: designed() },
    { icon: "edit", title: "Create a Journey", body: "Focus on the books you love — like Matthew, Mark, Luke, and John.", meta: ["YOUR BOOKS", "WHOLE BIBLE"], plan: createJourneyPlan("custom", ["Matthew", "Mark", "Luke", "John"]) },
  ];

  return (
    <div className="jc-next">
      <header className="jc-header">
        <button onClick={onBack} aria-label="Back"><AppIcon name="back" /></button>
        <strong>Your Next Walk</strong>
        <span></span>
      </header>

      <div className="jc-scroll">
        <div className="jc-next-intro">
          <span>KEEP WALKING</span>
          <h1>Where will your steps lead next?</h1>
          <p>You built a beautiful rhythm — {demo.days} days of steps, scripture, and reflection. Choose your next walk.</p>
        </div>

        {/* Kathy (review call 4): after the 33 "they may decide… I really want to go to this 66 day experience and keep this going". */}
        <button className="jc-recommended" onClick={() => onChoose(designed(recommended.id))}>
          <em><AppIcon name="spark" />RECOMMENDED FOR YOU</em>
          <div className="jc-recommended-body">
            <div className="jc-recommended-days"><strong>{recommended.days}</strong><span>DAYS</span></div>
            <div>
              <strong>{recommended.name}</strong>
              <p>You've visited {demo.booksVisited} books. Keep going with Isaiah — the only book of the Bible with 66 chapters.</p>
              <small>DESIGNED EXPERIENCE</small>
            </div>
            <i><AppIcon name="chevron" /></i>
          </div>
        </button>

        <span className="jc-next-label">OR CHOOSE YOUR WAY</span>
        <div className="jc-next-list">
          {options.map((option) => (
            <button onClick={() => onChoose(option.plan)} key={option.title}>
              <i><AppIcon name={option.icon} /></i>
              <div>
                <strong>{option.title}</strong>
                <p>{option.body}</p>
                <span>{option.meta.map((item) => <b key={item}>{item}</b>)}</span>
              </div>
              <AppIcon name="chevron" />
            </button>
          ))}
        </div>

        <p className="jc-next-badges"><AppIcon name="milestones" />Your {demo.badges.length} badges and certificate stay with you in Milestones.</p>
        <button className="jc-later" onClick={onExit}>Maybe later</button>
      </div>
    </div>
  );
}

export default function JourneyCompleteFlow({ onExit, onChoose }: { onExit: () => void; onChoose: (plan: JourneyPlan) => void }) {
  const demo = useMemo(getJourneyCompleteDemo, []);
  const [stage, setStage] = useState<Stage>("celebrate");

  if (stage === "story") return <Story demo={demo} onBack={() => setStage("celebrate")} onNext={() => setStage("next")} />;
  if (stage === "next") return <NextWalk demo={demo} onBack={() => setStage("story")} onChoose={onChoose} onExit={onExit} />;
  return <Celebrate demo={demo} onNext={() => setStage("story")} onExit={onExit} />;
}
