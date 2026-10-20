import { useEffect, useState } from "react";
import AppIcon from "../../components/AppIcon";
import BottomNavigation from "../../components/BottomNavigation";
import BibleBooksGrid from "../../components/BibleBooksGrid";
import CertificateViewer from "../../components/CertificateViewer";
import CompletionCertificate from "../../components/CompletionCertificate";
import MilestoneBadge from "../../components/MilestoneBadge";
import { getBookName } from "../../data/bible";
import { formatCount, plural } from "../../data/journeyPlans";
import { getMilestoneInfo } from "../../data/milestones";
import { getBookProgress, getJourneyLength, getMilestoneDate, getMilestoneDays, getProgress, getUnlockedMilestones } from "../../data/progress";
import { downloadCertificate } from "../../certificate";
import { playChime } from "../../sound";
import type { JourneyPlan, MainTab } from "../../types";

type Milestone = {
  day: number;
  unlocked: boolean;
  unlockedOn?: string;
  final: boolean;
};

// Day badges follow the journey length (see progress.ts) and unlock as days are completed —
// saving one more reflection in the mock scenario earns Day 3 (with the celebration screen).
function getMilestones(): Milestone[] {
  const unlocked = getUnlockedMilestones();
  const length = getJourneyLength();
  return getMilestoneDays().map((day) => ({ day, unlocked: unlocked.includes(day), unlockedOn: getMilestoneDate(day) ?? undefined, final: day === length }));
}

function MilestoneAchievement({ milestone, onBack }: { milestone: Milestone; onBack: () => void }) {
  const info = getMilestoneInfo(milestone.day);
  const [viewerOpen, setViewerOpen] = useState(false);

  // A soft bell chime as the earned badge opens (the celebration itself uses applause).
  useEffect(() => {
    const chime = window.setTimeout(() => playChime(), 250);
    return () => window.clearTimeout(chime);
  }, []);


  return (
    <div className="milestone-achievement-screen">
      <header className="achievement-header">
        <button onClick={onBack} aria-label="Back to milestones"><AppIcon name="back" /></button>
        <strong>Milestone Achieved</strong>
        <span></span>
      </header>

      <div className="achievement-scroll">
        <section className="achievement-hero">
          <div className="achievement-celebration" aria-hidden="true">
            <i></i><i></i><i></i><i></i><i></i><i></i>
          </div>
          <div className="achievement-badge-glow">
            <MilestoneBadge milestone={milestone} large />
          </div>
          <span className="achievement-eyebrow">{info.phase ? `PHASE ${info.phase.number} OF ${info.phase.total} · COMPLETE` : "MILESTONE UNLOCKED"}</span>
          <h1>{info.name}</h1>
          <p><strong>Congratulations!</strong> {info.congrats}</p>
          <div className="achievement-date">
            <span>COMPLETED</span>
            <strong>{milestone.unlockedOn}</strong>
          </div>
        </section>

        {/* Reflection prompts from the journal's congratulations page for this phase. */}
        <section className="achievement-reflect">
          <span>TAKE A MOMENT</span>
          <ul>
            {info.prompts.map((prompt) => <li className={prompt.endsWith("?") ? "question" : ""} key={prompt}>{prompt}</li>)}
          </ul>
          <p>{info.closing}</p>
        </section>

        <section className="certificate-section">
          <div className="certificate-section-heading">
            <div><span>YOUR CERTIFICATE</span><strong>Certificate of Completion</strong></div>
            <i><AppIcon name="spark" /></i>
          </div>
          <button className="certificate-preview" onClick={() => setViewerOpen(true)} aria-label="View certificate full screen">
            <CompletionCertificate day={milestone.day} completedOn={milestone.unlockedOn} info={info} />
          </button>
        </section>
      </div>

      {/* Sticky actions: full-screen view (eye) + download, always in reach while scrolling. */}
      <div className="achievement-dock">
        <button className="achievement-view-button" onClick={() => setViewerOpen(true)} aria-label="View certificate full screen"><AppIcon name="eye" /></button>
        <button className="download-certificate-button" onClick={() => downloadCertificate(milestone.day, milestone.unlockedOn, info)}>
          <AppIcon name="download" />
          Download Certificate
        </button>
      </div>

      {viewerOpen && <CertificateViewer day={milestone.day} completedOn={milestone.unlockedOn} info={info} onClose={() => setViewerOpen(false)} />}
    </div>
  );
}

export default function MilestonesScreen({ onNavigate, plan }: { onNavigate: (tab: MainTab) => void; plan: JourneyPlan }) {
  const progress = getProgress();
  const milestones = getMilestones();
  const length = formatCount(plan.days);
  const bookProgress = getBookProgress();
  const finishedBooks = bookProgress.filter((book) => book.finished);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  if (selectedMilestone) {
    return <MilestoneAchievement milestone={selectedMilestone} onBack={() => setSelectedMilestone(null)} />;
  }

  return (
    <div className="milestones-screen">
      <div className="milestones-scroll">
        <header className="milestones-header">
          <span>YOUR JOURNEY</span>
          <h1>Milestones &amp; Badges</h1>
          <p>Celebrate your progress along the journey.</p>
        </header>

        <section className="milestones-progress" aria-label={`${progress.completedDays} of ${length} days completed`}>
          <div>
            <span>JOURNEY PROGRESS</span>
            <strong>{progress.completedDays} of {length} days completed</strong>
          </div>
          <div className="milestones-progress-count"><strong>{progress.percent}%</strong><span>COMPLETE</span></div>
          <div className="milestones-progress-track"><i style={{ width: progress.barWidth }}></i></div>
        </section>

        <div className="milestones-section-title">
          <span>ACHIEVEMENTS</span>
          <p>{milestones.filter((milestone) => milestone.unlocked).length} of {milestones.length} unlocked</p>
        </div>

        <section className="milestones-grid">
          {milestones.map((milestone) => (
            <button
              className={`milestone-card ${milestone.unlocked ? "unlocked" : "locked"}`}
              disabled={!milestone.unlocked}
              onClick={() => setSelectedMilestone(milestone)}
              key={milestone.day}
            >
              <div className="milestone-art"><MilestoneBadge milestone={milestone} /></div>
              <strong>Day {formatCount(milestone.day)}</strong>
              <em>{getMilestoneInfo(milestone.day).shortName}</em>
              <span>{milestone.unlocked ? "Completed" : milestone.final ? "Final badge" : "Locked"}</span>
              {milestone.unlocked && <i><AppIcon name="chevron" /></i>}
            </button>
          ))}
        </section>

        {/* One book only: finishing it is the "Journey complete" badge above, so no separate book badges.
            A Designed Experience earns its own walk badges (often a chapter or two of a book), so no book badges either. */}
        {plan.type !== "automatic" && plan.type !== "designed" && bookProgress.length > 1 && (
          <>
            <div className="milestones-section-title">
              <span>BOOK BADGES</span>
              <p>{finishedBooks.length} of {bookProgress.length} {bookProgress.length === 1 ? "book" : "books"} finished</p>
            </div>
            <section className="book-badges">
              <p className="book-badges-intro">Finish every chapter of a book to earn its badge{plan.type === "bible" ? ". Earn all 66 to complete the whole Bible." : "."}</p>
              {plan.type === "custom" ? (
                <div className="book-badge-list">
                  {bookProgress.map((book) => (
                    <div className={`book-badge ${book.finished ? "finished" : book.read ? "started" : ""}`} key={book.bookIndex}>
                      <i><AppIcon name={book.finished ? "milestones" : "book"} /></i>
                      <div><strong>{getBookName(book.bookIndex)}</strong><span>{book.finished ? "Badge earned" : `${book.read} of ${plural(book.total, "chapter")}`}</span></div>
                      <b style={{ "--book-progress": `${(book.read / book.total) * 100}%` } as React.CSSProperties}></b>
                    </div>
                  ))}
                </div>
              ) : (
                <BibleBooksGrid current={bookProgress.find((book) => book.current)?.bookIndex ?? null} visited={bookProgress.filter((book) => book.read > 0).map((book) => book.bookIndex)} finished={finishedBooks.map((book) => book.bookIndex)} />
              )}
            </section>
          </>
        )}
      </div>

      <BottomNavigation active="milestones" onSelect={onNavigate} />
    </div>
  );
}
