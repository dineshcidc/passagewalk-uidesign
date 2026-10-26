import { useState } from "react";
import AppIcon from "../../components/AppIcon";
import BottomNavigation from "../../components/BottomNavigation";
import { useBibleRevision } from "../../data/bible";
import { getChapter, getDayHighlights } from "../../data/chapters";
import { getLastCompletedEntry } from "../../data/journal";
import { formatDayDate, formatShortDate } from "../../data/journeyStore";
import { formatBookList, formatCount, getBiblePace, journeyName, journeyTypeLabels, planChaptersPerDay, plural } from "../../data/journeyPlans";
import { getBookName } from "../../data/bible";
import { getMilestoneInfo } from "../../data/milestones";
import { getUnreadCount } from "../../data/notifications";
import { getBibleProgress, getDayStatus, getDayStepCount, getJourneyLength, getJourneyTotals, getMilestoneDays, getPendingDays, getProgress, getTodayDay, getUnlockedMilestones } from "../../data/progress";
import { getUser } from "../../data/user";
import type { JourneyPlan, MainTab } from "../../types";
import JournalScreen from "../journal/JournalScreen";
import JourneyScreen from "../journey/JourneyScreen";
import MilestonesScreen from "../milestones/MilestonesScreen";
import ProfileScreen from "../profile/ProfileScreen";
import DailyFlowScreen, { type DailyFlowEntry } from "./DailyFlowScreen";
import PassagesGrowthChart from "../../components/PassagesGrowthChart";
import NotificationsScreen from "./NotificationsScreen";

// Greeting follows the phone's local time (client slide 20).
function getGreeting(hour = new Date().getHours()) {
  if (hour >= 5 && hour < 12) return "GOOD MORNING";
  if (hour >= 12 && hour < 17) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

// The whole app follows the chosen journey (plan): day count, readings, milestones and Settings.
export default function HomeScreen({
  plan,
  onLogout,
  onChangeJourney,
  initialFlow,
}: {
  plan: JourneyPlan;
  onLogout: () => void;
  onChangeJourney: (plan: JourneyPlan) => void;
  // Welcome back → Start Today's Walk opens the daily flow straight away.
  initialFlow?: DailyFlowEntry;
}) {
  useBibleRevision();
  const [dailyFlow, setDailyFlow] = useState<{ phase: DailyFlowEntry; journeyDay?: number } | null>(initialFlow ? { phase: initialFlow } : null);
  const [activeTab, setActiveTab] = useState<MainTab>("home");
  const [viewEntryId, setViewEntryId] = useState<number | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [booksOpen, setBooksOpen] = useState(false);
  const user = getUser();
  const unreadCount = getUnreadCount();
  const bible = getBibleProgress();
  const progress = getProgress();
  const totals = getJourneyTotals();
  const lastEntry = getLastCompletedEntry();
  const lastHighlights = lastEntry ? getDayHighlights(lastEntry.journeyDay).length : 0;
  const today = getTodayDay();
  const length = getJourneyLength();
  const journeyLabel = plan.type === "designed" ? journeyName(plan).toUpperCase() : plan.type === "custom" ? formatBookList(plan.books).toUpperCase() : plan.type === "bible" ? `THE WHOLE BIBLE · ${getBiblePace(plan.pace).years.toUpperCase()}` : `YOUR ${length}-DAY WALK`;
  // Milestone track in Passage Walk days (milestones count across journeys): up to Day 33 first, then up to the
  // next milestone, with the four milestones before its end as dots.
  const trackDays = progress.walkedDays < 33 ? 33 : progress.nextMilestone || 365;
  const trackMilestones = getMilestoneDays().filter((day) => day > 1 && day < trackDays).slice(-4);
  const unlockedMilestones = getUnlockedMilestones();
  // A day is pending when steps were entered but no reflection was saved,
  // e.g. the user tapped "Do this later" on the Passage Ready screen.
  const pendingReflections = getPendingDays().map((journeyDay) => {
    const [month, day] = formatShortDate(journeyDay).split(" ");
    return { journeyDay, date: formatDayDate(journeyDay), month, day, reference: getChapter(journeyDay)?.reference ?? "" };
  });
  // No entry yet is shown as "Not entered", never as 0 steps.
  const todayStepCount = getDayStepCount(today);
  const todayStatus = getDayStatus(today);
  // Ring: grey dashed (not entered) → gold (steps saved, reflection waiting) → green (complete).
  const walkStatus = todayStatus === "complete" ? "complete" : todayStatus === "in-progress" ? "steps-saved" : "not-entered";

  const navigateMain = (tab: MainTab) => {
    setActiveTab(tab);
  };

  if (dailyFlow) {
    return <DailyFlowScreen initialPhase={dailyFlow.phase} journeyDay={dailyFlow.journeyDay} onBack={() => setDailyFlow(null)} />;
  }

  if (showNotifications) {
    return (
      <NotificationsScreen
        onBack={() => setShowNotifications(false)}
        onOpen={(action) => {
          setShowNotifications(false);
          if (action.kind === "milestones") navigateMain("milestones");
          else setDailyFlow({ phase: action.kind, journeyDay: action.journeyDay });
        }}
      />
    );
  }

  if (activeTab === "journey") {
    return <JourneyScreen onNavigate={navigateMain} plan={plan} />;
  }

  if (viewEntryId !== null) {
    return (
      <JournalScreen
        openEntryId={viewEntryId}
        onExitEntry={() => setViewEntryId(null)}
        onNavigate={(tab) => { setViewEntryId(null); navigateMain(tab); }}
      />
    );
  }

  if (activeTab === "journal") {
    return <JournalScreen onNavigate={navigateMain} />;
  }

  if (activeTab === "milestones") {
    return <MilestonesScreen onNavigate={navigateMain} plan={plan} />;
  }

  if (activeTab === "profile") {
    return <ProfileScreen onNavigate={navigateMain} onLogout={onLogout} plan={plan} onChangeJourney={onChangeJourney} />;
  }

  return (
    <div className="journey-home">
      <div className="home-scroll">
        <header className="home-header">
          <div>
            <span>{getGreeting()}</span>
            <h1>{user.firstName} <span aria-hidden="true">👋</span></h1>
          </div>
          <div className="home-header-actions">
            <button className="home-bell" onClick={() => setShowNotifications(true)} aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}>
              <AppIcon name="bell" />
              {unreadCount > 0 && <span>{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </button>
            <button className="home-profile" onClick={() => navigateMain("profile")} aria-label="Open You">
              <img src={user.photo} alt={`${user.firstName}'s profile`} />
              <span></span>
            </button>
          </div>
        </header>

        <section className="home-day-band">
          <div className="home-day-number"><span>DAY</span><strong>{String(today).padStart(2, "0")}</strong></div>
          <div className="home-day-copy"><span title={journeyTypeLabels[plan.type]}>{journeyLabel}</span><strong>{today} of {plural(length, "day")}</strong><div><i style={{ width: progress.todayBarWidth }}></i></div></div>
          <div className="home-day-percent"><strong>{progress.todayPercent}%</strong><span>of the way</span></div>
        </section>

        <section className="home-steps-section">
          <div className="home-section-title"><div><span>DAILY MOVEMENT</span><strong>Today&apos;s Steps</strong></div></div>
          <div className={`home-steps-layout ${walkStatus}`}>
            <div className={`home-step-ring ${walkStatus}`}>
              <div>
                <strong>{todayStepCount === null ? "—" : todayStepCount.toLocaleString("en-US")}</strong>
                <span>{todayStepCount === null ? "NOT ENTERED" : "STEPS"}</span>
              </div>
            </div>
            <div className={`home-step-detail ${walkStatus}`}>
              {walkStatus === "not-entered" && (
                <>
                  <p className="home-steps-empty-copy"><i></i>You haven&apos;t entered today&apos;s steps yet.</p>
                  <div className="home-passage-lock"><AppIcon name="book" /><span>Passage unlocks after steps</span></div>
                </>
              )}
              {walkStatus === "steps-saved" && <p>Steps saved. Your reflection is still waiting.</p>}
              {walkStatus === "complete" && <p>Today&apos;s walk is complete. You moved, you read, you grew.</p>}
              <button onClick={() => setDailyFlow({ phase: "entry" })}>
                <AppIcon name="steps" />{walkStatus === "not-entered" ? "Enter Steps" : "Update Steps"}
              </button>
            </div>
          </div>
        </section>

        <section className="home-daily-flow">
          {lastEntry && (
            <>
              <div className="home-section-title"><div><span>LAST COMPLETED</span><strong>Your latest reflection</strong></div></div>
              <button className="home-latest-reflection" onClick={() => setViewEntryId(lastEntry.id)}>
                <span className="home-latest-date"><i>{lastEntry.shortDate.split(" ")[0]}</i><strong>{lastEntry.shortDate.split(" ")[1]}</strong><small>DAY {lastEntry.journeyDay}</small></span>
                <span className="home-latest-copy">
                  <strong>{lastEntry.reference}</strong>
                  <q>{lastEntry.answers.find(Boolean) ?? "Reflection saved."}</q>
                  <small>
                    <span>{lastEntry.steps} {lastEntry.steps === "1" ? "step" : "steps"}</span><b></b>
                    <span>{lastEntry.verseCount} verses</span><b></b>
                    <span>{lastHighlights} {lastHighlights === 1 ? "highlight" : "highlights"}</span>
                  </small>
                </span>
                <span className="home-latest-arrow"><AppIcon name="chevron" /></span>
              </button>
            </>
          )}
          <div className="home-pending-reflections">
            <div className="home-pending-heading">
              <div><span>REFLECTIONS</span><strong>{pendingReflections.length ? "Reflection not added" : "All reflections added"}</strong></div>
              <p className={pendingReflections.length ? "" : "up-to-date"}>{pendingReflections.length ? `${pendingReflections.length} pending` : "Up to date"}</p>
            </div>
            {pendingReflections.length > 0 ? (
              <div className="home-pending-list">
                {pendingReflections.map((item) => (
                  <button
                    key={`${item.date}-${item.reference}`}
                    onClick={() => setDailyFlow({ phase: "reflection", journeyDay: item.journeyDay })}
                  >
                    <span className="home-pending-date"><i>{item.month}</i><strong>{item.day}</strong></span>
                    <span className="home-pending-copy"><i>BIBLE PASSAGE</i><strong>{item.reference}</strong><small>Reflection not added</small></span>
                    <span className="home-pending-arrow"><AppIcon name="chevron" /></span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="home-pending-empty">You&apos;re all caught up. Days you save for later will wait here.</p>
            )}
          </div>
        </section>

        <div className="home-section-title home-progress-section-title">
          <div><span>JOURNEY PROGRESS</span><strong>Keep walking with purpose</strong></div>
        </div>
        <section className="home-progress-panel">
          <div className="home-progress-panel-head">
            <div className="home-progress-title">
              <span>DAYS COMPLETED</span>
              <strong>{plural(progress.completedDays, "day")} complete</strong>
            </div>
            <div className="home-progress-count"><strong>{progress.completedDays}</strong><span>of {formatCount(length)}</span></div>
          </div>
          <div className="home-milestone-track">
            <span style={{ width: `${Math.min(progress.walkedDays / trackDays, 1) * 100}%` }}></span>
            {trackMilestones.map((day) => (
              <i
                className={`milestone-dot ${unlockedMilestones.includes(day) ? "completed" : day === progress.nextMilestone ? "next" : ""}`}
                style={{ left: `${(day / trackDays) * 100}%` }}
                key={day}
              ></i>
            ))}
          </div>
          <div className="home-progress-stats">
            <div className="home-progress-stat">
              <span>TOTAL STEPS</span>
              <strong>{totals.steps}</strong>
              <small>steps recorded</small>
              <i><AppIcon name="steps" /></i>
            </div>
            <div className="home-progress-stat passages">
              <span>TOTAL PASSAGES</span>
              <strong>{totals.passages}</strong>
              <small>verses read</small>
              <i><AppIcon name="book" /></i>
            </div>
          </div>
          <PassagesGrowthChart />
          <div className="home-progress-next">
            <div><AppIcon name="spark" /></div>
            {progress.daysToGo > 0 ? (
              <>
                <div><span>NEXT MILESTONE</span><strong>Day {formatCount(progress.nextMilestone)} · {getMilestoneInfo(progress.nextMilestone).shortName}</strong></div>
                <p>{plural(progress.daysToGo, "day")} to go</p>
              </>
            ) : (
              <div><span>MILESTONES</span><strong>Every badge earned</strong></div>
            )}
          </div>
          <div className="home-progress-encouragement">
            <strong>Well done — keep it up!</strong>
            <p>Your steps may vary. Your scripture never does.</p>
          </div>
        </section>

        {/* Whole-Bible progress (client slide 20): total chapters, % of Bible, % Old / New Testament, % by book. */}
        <div className="home-section-title home-progress-section-title">
          <div><span>BIBLE PROGRESS · YOUR WHOLE BIBLE</span><strong>Learning the 66 books</strong></div>
        </div>
        <section className="home-bible-panel">
          {/* Whole-Bible totals, so "of 1,189" is never read as the journey length. */}
          <p className="home-bible-intro">
            <AppIcon name="library" />
            <span>
              {plan.type === "bible"
                ? `Your journey through all 66 books and 1,189 chapters of the Bible — ${planChaptersPerDay(plan)}.`
                : `Every chapter you've read across the whole Bible — not just your ${plan.type === "designed" ? journeyName(plan) : plan.type === "custom" ? formatBookList(plan.books) : `${formatCount(length)}-day walk`}.`}
            </span>
          </p>
          <div className="home-bible-head">
            <div>
              <span>TOTAL CHAPTERS READ</span>
              <strong>{formatCount(bible.chaptersRead)}<small> of {formatCount(bible.totalChapters)}</small></strong>
            </div>
            <div className="home-bible-percent"><strong>{bible.biblePercent}%</strong><span>of the Bible</span></div>
          </div>
          <div className="home-bible-track"><i style={{ width: bible.bibleBarWidth }}></i></div>
          <div className="home-bible-testaments">
            <div className="old">
              <span>OLD TESTAMENT</span>
              <strong>{bible.old.percent}%</strong>
              <div className="home-bible-track"><i style={{ width: bible.old.barWidth }}></i></div>
              <small>{formatCount(bible.old.read)} of {plural(bible.old.total, "chapter")}</small>
            </div>
            <div className="new">
              <span>NEW TESTAMENT</span>
              <strong>{bible.new.percent}%</strong>
              <div className="home-bible-track"><i style={{ width: bible.new.barWidth }}></i></div>
              <small>{formatCount(bible.new.read)} of {plural(bible.new.total, "chapter")}</small>
            </div>
          </div>
          {plan.type === "automatic" || plan.books.length === 66 ? (
            // 33-Day (or any plan through all 66 books): a different book each day, so books are visited, not finished —
            // show which of the 66 books the steps have led to (client goal: learn the 66 books).
            <div className="home-bible-books home-bible-visited">
              <div className="home-bible-visited-head">
                <span><b>BOOKS YOUR STEPS HAVE VISITED</b>{bible.booksStarted ? `${formatCount(bible.booksStarted)} of 66 books` : "Complete a reading to visit your first book"}</span>
                {bible.booksStarted > 0 && <em>{formatCount(66 - bible.booksStarted)} to discover</em>}
              </div>
              {bible.booksStarted > 0 && (
                <div className="home-bible-visited-chips">
                  {bible.books.map((book) => <span className={book.bookIndex < 39 ? "old" : "new"} key={book.bookIndex}>{getBookName(book.bookIndex)}</span>)}
                </div>
              )}
            </div>
          ) : (
          <div className="home-bible-books">
            <button className="home-bible-books-toggle" onClick={() => setBooksOpen((open) => !open)} aria-expanded={booksOpen} disabled={!bible.booksStarted}>
              <span><b>COMPLETION BY BOOK</b>{bible.booksStarted ? `${plural(bible.booksStarted, "book")} started` : "Complete a reading to start your first book"}</span>
              {bible.booksStarted > 0 && <i className={booksOpen ? "open" : ""}><AppIcon name="chevron" /></i>}
            </button>
            {booksOpen && (
              <div className="home-bible-book-rows">
                {bible.books.map((book) => (
                  <div className={book.read === book.total ? "finished" : ""} key={book.bookIndex}>
                    <strong>{getBookName(book.bookIndex)}</strong>
                    <i><b style={{ width: `${(book.read / book.total) * 100}%` }}></b></i>
                    <span>{book.percent}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
        </section>
      </div>

      <BottomNavigation active="home" onSelect={navigateMain} />
    </div>
  );
}
