import { useEffect, useLayoutEffect, useRef, useState } from "react";
import AppIcon from "../../components/AppIcon";
import BottomNavigation from "../../components/BottomNavigation";
import BibleBooksGrid from "../../components/BibleBooksGrid";
import MilestoneBadge from "../../components/MilestoneBadge";
import { BIBLE_VERSION, getBookName } from "../../data/bible";
import { formatCount, plural } from "../../data/journeyPlans";
import { getMilestoneInfo, type MilestoneInfo } from "../../data/milestones";
import { getFullName } from "../../data/user";
import { getBookProgress, getJourneyLength, getMilestoneDate, getMilestoneDays, getProgress, getUnlockedMilestones } from "../../data/progress";
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

// Certificate of Completion — layout from Kathy's journal certificates: blackletter title, "Be it known to all that",
// the name on a line over a faded day-number seal, the walk, a scripture and Kathy Boswell's PassageWalk signature.
function CompletionCertificate({ milestone, info }: { milestone: Milestone; info: MilestoneInfo }) {
  return (
    <article className="completion-certificate">
      <div className="completion-certificate-frame">
        <h2>Certificate of Completion</h2>
        <p className="cc-known">Be it known to all that</p>
        <div className="cc-name">
          <span className="cc-seal" aria-hidden="true"><b>{formatCount(milestone.day)}</b></span>
          <strong>{getFullName()}</strong>
        </div>
        <p className="cc-line">{info.certificateLine}</p>
        <div className="cc-bottom">
          <blockquote>
            <p>{info.verse.text}</p>
            <cite>~ {info.verse.reference}<br />({BIBLE_VERSION.name})</cite>
          </blockquote>
          <div className="cc-sign">
            <span>KATHY BOSWELL</span>
            <strong>PassageWalk<sup>®</sup></strong>
            <small>Completed {milestone.unlockedOn}</small>
          </div>
        </div>
      </div>
      <small className="cc-copyright">© 2009–2013 Kathy Boswell, All Rights Reserved.</small>
    </article>
  );
}

// Full-screen certificate (eye button): the landscape certificate turned sideways to fill the phone, like a photo
// viewer — the user turns the phone to read it. Rotate turns it 90° each tap (all 4 sides); Close (or Esc) returns.
function CertificateViewer({ milestone, info, onClose }: { milestone: Milestone; info: MilestoneInfo; onClose: () => void }) {
  // Total turn in degrees (keeps counting so the animation always turns the short way).
  const [angle, setAngle] = useState(90);
  const sideways = Math.abs(angle % 180) === 90;
  const [scale, setScale] = useState(1);
  const stageRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  // Scale the certificate to the largest size that fits the viewer in the current orientation.
  useLayoutEffect(() => {
    const fit = () => {
      // Layout sizes (not screen rects), so the fit is right even when the device frame itself is scaled.
      const stage = stageRef.current;
      const paper = paperRef.current;
      if (!stage || !paper) return;
      const width = paper.offsetWidth;
      const height = paper.offsetHeight;
      const [fitWidth, fitHeight] = sideways ? [height, width] : [width, height];
      setScale(Math.min((stage.clientWidth - 24) / fitWidth, (stage.clientHeight - 24) / fitHeight));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [sideways]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="certificate-viewer" role="dialog" aria-modal="true" aria-label="Certificate of Completion, full screen">
      <div className="certificate-viewer-bar">
        <div className="certificate-viewer-rotate">
          <button onClick={() => setAngle((value) => value + 90)} aria-label="Rotate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></svg>
          </button>
        </div>
        <strong>{info.shortName}</strong>
        <button className="certificate-viewer-close" onClick={onClose} aria-label="Close full screen certificate">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </div>
      <div className="certificate-viewer-stage" ref={stageRef}>
        <div className="certificate-viewer-paper" ref={paperRef} style={{ transform: `translate(-50%, -50%) rotate(${angle}deg) scale(${scale})` }}>
          <CompletionCertificate milestone={milestone} info={info} />
        </div>
      </div>
      <p className="certificate-viewer-hint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="7" y="3" width="10" height="18" rx="2.5" /><path d="M11 18h2" /></svg>
        {sideways ? "Turn your phone sideways to read your certificate" : "Tap rotate to turn it to any side"}
      </p>
    </div>
  );
}

const escapeXml =(text: string) => text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

// Splits text into lines of about `width` characters for the downloadable SVG.
function wrapText(text: string, width: number) {
  return text.split(" ").reduce<string[]>((lines, word) => {
    const last = lines[lines.length - 1];
    if (last !== undefined && `${last} ${word}`.length <= width) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
    return lines;
  }, []);
}

function MilestoneAchievement({ milestone, onBack }: { milestone: Milestone; onBack: () => void }) {
  const info = getMilestoneInfo(milestone.day);
  const [viewerOpen, setViewerOpen] = useState(false);

  // A soft bell chime as the earned badge opens (the celebration itself uses applause).
  useEffect(() => {
    const chime = window.setTimeout(() => playChime(), 250);
    return () => window.clearTimeout(chime);
  }, []);

  const downloadCertificate = () => {
    const verseLines = wrapText(info.verse.text, 60);
    const walkLines = wrapText(info.certificateLine, 72);
    const certificate = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="850" viewBox="0 0 1200 850">
        <style>@import url("https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&amp;display=swap");</style>
        <rect width="1200" height="850" fill="#ffffff"/>
        <rect x="40" y="40" width="1120" height="770" fill="none" stroke="#172a46" stroke-width="8"/>
        <rect x="56" y="56" width="1088" height="738" fill="none" stroke="#172a46" stroke-width="2"/>
        <rect x="64" y="64" width="1072" height="722" fill="none" stroke="#172a46" stroke-width="2"/>
        <text x="600" y="175" text-anchor="middle" fill="#172a46" font-family="UnifrakturMaguntia, 'Old English Text MT', Georgia, serif" font-size="84">Certificate of Completion</text>
        <text x="600" y="245" text-anchor="middle" fill="#172a46" font-family="Georgia, serif" font-size="28">Be it known to all that</text>
        <circle cx="600" cy="335" r="82" fill="none" stroke="#dfe3e7" stroke-width="12" stroke-dasharray="2 5"/>
        <circle cx="600" cy="335" r="64" fill="none" stroke="#e5e8eb" stroke-width="3"/>
        <text x="600" y="372" text-anchor="middle" fill="#e2e5e9" font-family="UnifrakturMaguntia, Georgia, serif" font-size="104">${formatCount(milestone.day)}</text>
        <text x="600" y="360" text-anchor="middle" fill="#172a46" font-family="Georgia, serif" font-size="44" font-style="italic">${escapeXml(getFullName())}</text>
        <path d="M340 384h520" stroke="#9aa3ad" stroke-width="2"/>
        ${walkLines.map((line, index) => `<text x="600" y="${440 + index * 34}" text-anchor="middle" fill="#172a46" font-family="Georgia, serif" font-size="26">${escapeXml(line)}</text>`).join("")}
        ${verseLines.map((line, index) => `<text x="110" y="${575 + index * 25}" fill="#425166" font-family="Georgia, serif" font-size="18" font-style="italic">${escapeXml(line)}</text>`).join("")}
        <text x="110" y="${590 + verseLines.length * 25}" fill="#425166" font-family="Georgia, serif" font-size="18" font-style="italic">~ ${escapeXml(info.verse.reference)} (${BIBLE_VERSION.name})</text>
        <text x="940" y="640" text-anchor="middle" fill="#172a46" font-family="Arial, sans-serif" font-size="16" letter-spacing="2">KATHY BOSWELL</text>
        <text x="940" y="700" text-anchor="middle" fill="#172a46" font-family="Georgia, serif" font-size="52">PassageWalk<tspan font-size="18" dy="-26">®</tspan></text>
        <text x="940" y="738" text-anchor="middle" fill="#637083" font-family="Arial, sans-serif" font-size="16">Completed ${escapeXml(milestone.unlockedOn ?? "")}</text>
        <text x="1136" y="834" text-anchor="end" fill="#8a94a0" font-family="Arial, sans-serif" font-size="13" font-style="italic">© 2009–2013 Kathy Boswell, All Rights Reserved.</text>
      </svg>
    `;
    const file = new Blob([certificate], { type: "image/svg+xml" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `passagewalk-${info.shortName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-certificate.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

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
            <CompletionCertificate milestone={milestone} info={info} />
          </button>
        </section>
      </div>

      {/* Sticky actions: full-screen view (eye) + download, always in reach while scrolling. */}
      <div className="achievement-dock">
        <button className="achievement-view-button" onClick={() => setViewerOpen(true)} aria-label="View certificate full screen"><AppIcon name="eye" /></button>
        <button className="download-certificate-button" onClick={downloadCertificate}>
          <AppIcon name="download" />
          Download Certificate
        </button>
      </div>

      {viewerOpen && <CertificateViewer milestone={milestone} info={info} onClose={() => setViewerOpen(false)} />}
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

        {/* One book only: finishing it is the "Journey complete" badge above, so no separate book badges. */}
        {plan.type !== "automatic" && bookProgress.length > 1 && (
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
