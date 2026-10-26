import { useState } from "react";
import AppIcon from "../../components/AppIcon";
import BottomNavigation from "../../components/BottomNavigation";
import HighlightedVersesCard from "../../components/HighlightedVersesCard";
import DailyFlowScreen, { type DailyFlowEntry } from "../home/DailyFlowScreen";
import { getChapter, getDayHighlights, getHighlightGroups, getKeyVerse, type HighlightGroup } from "../../data/chapters";
import { deleteJournalEntry, getVisibleJournalEntries, type JournalEntry } from "../../data/journal";
import { reflectionQuestions } from "../../data/reflections";
import type { MainTab } from "../../types";

function JournalEntryDetails({
  entry,
  onBack,
  onReadChapter,
  onContinueReflection,
  onDelete,
}: {
  entry: JournalEntry;
  onBack: () => void;
  onReadChapter: () => void;
  onContinueReflection: () => void;
  onDelete: () => void;
}) {
  const isInProgress = entry.status === "in-progress";
  const keyVerse = getKeyVerse(entry.journeyDay);
  const highlights = getDayHighlights(entry.journeyDay);
  const several = (getChapter(entry.journeyDay)?.parts.length ?? 1) > 1;
  // Days 1–2 are seeded history; from Day 3 on (caught-up Day 3, pending Day 4, today) the daily flow can be reopened.
  const canEdit = entry.journeyDay >= 3;
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className={`journal-detail-screen ${isInProgress ? "journal-detail-in-progress" : ""}`}>
      <div className="journal-detail-scroll">
        <header className="journal-detail-header">
          <button className="journal-back" onClick={onBack} aria-label="Back to Journal"><AppIcon name="back" /></button>
          <div><span>JOURNEY DAY {String(entry.journeyDay).padStart(2, "0")}</span><h1>{isInProgress ? "Reflection in progress" : "Your reflection"}</h1></div>
          <i className={isInProgress ? "in-progress" : "complete"} aria-hidden="true"></i>
        </header>

        <section className="journal-detail-meta">
          <div><span>DATE</span><strong>{entry.date}</strong></div>
          <div><span>TIME</span><strong>{entry.time}</strong></div>
          <div><span>STEPS</span><strong>{entry.steps}</strong></div>
        </section>

        <section className="journal-passage-card">
          <div className="journal-passage-top">
            <div className="journal-passage-icon"><AppIcon name="book" /></div>
            <div><span>{entry.testament}</span><strong>{entry.reference}</strong></div>
            <b>{entry.verseCount} verses</b>
          </div>
          {keyVerse && <blockquote>“{keyVerse}”</blockquote>}
        </section>

        {isInProgress && <HighlightedVersesCard className="journal-detail-highlights" reference={entry.reference} verses={highlights} onReadChapter={onReadChapter} readLabel={several ? "Read Chapters" : "Read Chapter"} />}

        {!isInProgress && highlights.length > 0 && (
          <HighlightedVersesCard className="journal-completed-highlights" reference={entry.reference} verses={highlights} verseLabel={(verse) => verse.label} />
        )}

        <section className="journal-reflections">
          <div className="journal-reflections-heading">
            <div><span>YOUR REFLECTIONS</span><strong>Three moments of pause</strong></div>
            <p>{entry.answers.filter(Boolean).length}/{reflectionQuestions.length} answered</p>
          </div>
          <div className="journal-answer-list">
            <div className="journal-answer-toolbar">
              <span>REFLECTION NOTES</span>
              <div>
                {canEdit && <button type="button" onClick={onContinueReflection} aria-label="Edit reflection"><AppIcon name="edit" /></button>}
                <button type="button" className="delete" onClick={() => setConfirmDelete(true)} aria-label="Delete reflection"><AppIcon name="delete" /></button>
              </div>
            </div>
            {reflectionQuestions.map((question, index) => {
              const answer = entry.answers[index];
              return (
                <div className={`journal-answer ${answer ? "answered" : "unanswered"}`} key={question.label}>
                  <div className="journal-answer-copy"><strong>{question.label}</strong><p>{answer || "Your answer is waiting for you."}</p></div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
      {isInProgress && (
        <div className="journal-continue-dock">
          <button className="journal-continue-button" onClick={onContinueReflection}>
            <AppIcon name="journal" /><span>Continue Reflection</span>
          </button>
        </div>
      )}

      {confirmDelete && (
        <div className="reason-backdrop" onClick={() => setConfirmDelete(false)}>
          <div className="reason-dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <span>DELETE REFLECTION</span>
            <h2>Delete this reflection?</h2>
            <p>Your notes for {entry.reference} on {entry.date} will be removed from your journal.</p>
            <div>
              <button type="button" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button type="button" className="danger" onClick={onDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function JournalHighlights({ groups, onBack }: { groups: HighlightGroup[]; onBack: () => void }) {
  const [openDay, setOpenDay] = useState<number | null>(groups[0]?.journeyDay ?? null);

  return (
    <div className="journal-detail-screen">
      <div className="journal-detail-scroll">
        <header className="journal-highlights-header">
          <button className="journal-back" onClick={onBack} aria-label="Back to Journal"><AppIcon name="back" /></button>
          <div><span>SAVED VERSES</span><h1>Your Highlights</h1></div>
        </header>

        <section className="journal-highlights-section">
          <div className="journal-highlights-top">
            <div><span>FROM YOUR JOURNEY</span><strong>Verses that spoke to you</strong></div>
            <button onClick={() => window.print()}><AppIcon name="download" />Print / Download</button>
          </div>
          <div className="journal-highlight-groups">
            {groups.length === 0 && <p className="journal-empty">No highlighted verses yet. Tap verses while you read to save them here.</p>}
            {groups.map((group) => (
              <article className={`journal-highlight-group ${openDay === group.journeyDay ? "open" : "closed"}`} key={group.journeyDay}>
                <header>
                  <div>
                    <span>DAY {String(group.journeyDay).padStart(2, "0")}</span>
                    <strong>{group.reference}</strong>
                    <p>{group.date}</p>
                  </div>
                  <button
                    onClick={() => setOpenDay((current) => current === group.journeyDay ? null : group.journeyDay)}
                    aria-expanded={openDay === group.journeyDay}
                    aria-label={`${openDay === group.journeyDay ? "Hide" : "View"} ${group.reference} highlights`}
                  >
                    <AppIcon name={openDay === group.journeyDay ? "eye" : "eyeOff"} />
                  </button>
                </header>
                {openDay === group.journeyDay && <div>
                  {group.verses.map((verse) => (
                    <div className="journal-highlight-verse" key={verse.key}>
                      <span>{verse.label}</span>
                      <p>{verse.text}</p>
                    </div>
                  ))}
                </div>}
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// openEntryId opens one entry directly (e.g. from the Home "last completed" card); Back then calls onExitEntry.
export default function JournalScreen({
  onNavigate,
  openEntryId,
  onExitEntry,
}: {
  onNavigate: (tab: MainTab) => void;
  openEntryId?: number;
  onExitEntry?: () => void;
}) {
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(openEntryId ?? null);
  const [filter, setFilter] = useState<"all" | "complete" | "in-progress">("all");
  const [showHighlights, setShowHighlights] = useState(false);
  const [dailyFlow, setDailyFlow] = useState<DailyFlowEntry | null>(null);
  const entries = getVisibleJournalEntries();
  const selectedEntry = entries.find((entry) => entry.id === selectedEntryId) ?? null;
  const visibleEntries = entries.filter((entry) => filter === "all" || entry.status === filter);
  const highlightGroups = getHighlightGroups();
  const highlightCount = highlightGroups.reduce((total, group) => total + group.verses.length, 0);

  if (selectedEntry && dailyFlow) {
    return (
      <DailyFlowScreen
        initialPhase={dailyFlow}
        journeyDay={selectedEntry.journeyDay}
        doneLabel="Back to Journal"
        onBack={() => setDailyFlow(null)}
      />
    );
  }

  if (selectedEntry) {
    return (
      <JournalEntryDetails
        entry={selectedEntry}
        onBack={() => (onExitEntry && selectedEntryId === openEntryId ? onExitEntry() : setSelectedEntryId(null))}
        onReadChapter={() => setDailyFlow("reading")}
        onContinueReflection={() => setDailyFlow("reflection")}
        onDelete={() => { deleteJournalEntry(selectedEntry.id); if (onExitEntry && selectedEntry.id === openEntryId) onExitEntry(); else setSelectedEntryId(null); }}
      />
    );
  }
  if (showHighlights) return <JournalHighlights groups={highlightGroups} onBack={() => setShowHighlights(false)} />;

  return (
    <div className="journal-screen">
      <div className="journal-scroll">
        <header className="journal-header">
          <div>
            <span>PRIVATE &amp; PERSONAL</span><h1>My Journal</h1><p>A quiet place for what scripture is stirring in you.</p>
          </div>
          <button className="journal-highlights-link" onClick={() => setShowHighlights(true)} aria-label={`View ${highlightCount} highlighted ${highlightCount === 1 ? "verse" : "verses"}`}>
            <AppIcon name="spark" />
            <span>{highlightCount}</span>
          </button>
        </header>

        <div className="journal-filter" aria-label="Filter journal entries">
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All <span>{entries.length}</span></button>
          <button className={filter === "complete" ? "active" : ""} onClick={() => setFilter("complete")}>Completed <span>{entries.filter((entry) => entry.status === "complete").length}</span></button>
          <button className={filter === "in-progress" ? "active" : ""} onClick={() => setFilter("in-progress")}>In progress <span>{entries.filter((entry) => entry.status === "in-progress").length}</span></button>
        </div>

        <section className="journal-entry-section">
          <div className="journal-list-heading"><span>RECENT ENTRIES</span><p>Newest first</p></div>
          <div className="journal-entry-list">
            {visibleEntries.length === 0 && <p className="journal-empty">{filter === "all" ? "No journal entries yet. Enter your steps to begin today's reading." : `No ${filter === "complete" ? "completed" : "in-progress"} entries right now.`}</p>}
            {visibleEntries.map((entry) => (
              <button className={`journal-entry-card ${entry.status}`} onClick={() => setSelectedEntryId(entry.id)} key={entry.id}>
                <div className="journal-date-tile"><span>{entry.shortDate.split(" ")[0]}</span><strong>{entry.shortDate.split(" ")[1]}</strong><i>DAY {entry.journeyDay}</i></div>
                <div className="journal-entry-copy">
                  <div className="journal-entry-title"><strong>{entry.reference}</strong></div>
                  <p>{entry.answers.find(Boolean) ?? "No reflection written yet."}</p>
                  <div className="journal-entry-meta"><span>{entry.verseCount} {entry.verseCount === 1 ? "verse" : "verses"}</span><i></i><span>{entry.time}</span><i></i><span>{entry.steps} {entry.steps === "1" ? "step" : "steps"}</span></div>
                </div>
                <div className="journal-entry-arrow"><AppIcon name="chevron" /></div>
              </button>
            ))}
          </div>
        </section>
      </div>
      <BottomNavigation active="journal" onSelect={onNavigate} />
    </div>
  );
}
