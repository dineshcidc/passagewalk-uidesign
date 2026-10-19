import { useState } from "react";
import AppIcon from "../../components/AppIcon";
import BottomNavigation from "../../components/BottomNavigation";
import BibleBooksGrid from "../../components/BibleBooksGrid";
import { getBookName } from "../../data/bible";
import { getChapter, getDayHighlights } from "../../data/chapters";
import { getJournalEntries } from "../../data/journal";
import { formatBookList, formatCount, journeyTypeLabels, plural, readingOrderLabel } from "../../data/journeyPlans";
import { getDayDate, getDayRecord, getRecordedDays } from "../../data/journeyStore";
import { getBookProgress, getDayStatus, getDayStepCount, getProgress, getTodayDay, isDayComplete, type DayStatus } from "../../data/progress";
import type { JourneyPlan, MainTab } from "../../types";
import DailyFlowScreen, { type DailyFlowEntry } from "../home/DailyFlowScreen";

type JourneyDayItem = {
  journeyDay: number;
  date: Date;
  weekday: string;
  month: string;
  dateNumber: number;
  // Calendar class: "current" = today with no steps yet, "reflection-pending" = steps entered, reflection not added.
  status: "complete" | "missed" | "reflection-pending" | "current" | "upcoming";
  state: DayStatus;
};

const calendarStatus: Record<DayStatus, JourneyDayItem["status"]> = {
  complete: "complete",
  "in-progress": "reflection-pending",
  missed: "missed",
  "not-entered": "current",
  upcoming: "upcoming",
};

function JourneyDayDetails({ day, onBack, onEnterSteps, onReadChapter }: { day: JourneyDayItem; onBack: () => void; onEnterSteps: () => void; onReadChapter: () => void }) {
  const isToday = day.journeyDay === getTodayDay();
  const missed = day.state === "missed";
  const notEntered = day.state === "not-entered";
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonAdded, setReasonAdded] = useState(false);
  const formattedDate = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(day.date);
  const passage = getChapter(day.journeyDay);
  const entry = getJournalEntries().find((item) => item.journeyDay === day.journeyDay);
  const inProgress = entry?.status !== "complete";
  const highlights = getDayHighlights(day.journeyDay);
  const chapterNumber = passage?.chapter;
  // First line of the steps → reading explanation, e.g. "4 · 4th book of the New Testament → John".
  const stepsLink = passage?.explanation.lines[0];

  return (
    <div className="journey-day-detail-screen">
      <header className="journey-day-detail-header">
        <button className="journey-day-back" onClick={onBack} aria-label="Back to My Journey"><AppIcon name="back" /></button>
        <div><h1>Day {day.journeyDay}{isToday ? " — Today" : ""}</h1><p>{formattedDate}</p></div>
      </header>

      {notEntered ? (
        <section className="journey-waiting-overview">
          <div className="journey-waiting-mark"><AppIcon name="steps" /></div>
          <span>NOT ENTERED YET</span>
          <h2>Today&apos;s walk is waiting</h2>
          <p>Enter today&apos;s steps to unlock your chapter and reflection.</p>

          <div className="journey-waiting-status">
            <div><span><AppIcon name="steps" /></span><div><small>DAILY STEPS</small><strong>Not entered</strong></div><i></i></div>
            <div><span><AppIcon name="book" /></span><div><small>BIBLE READING</small><strong>Unlocks after steps</strong></div><i></i></div>
          </div>

          <button className="journey-waiting-action" onClick={onEnterSteps}><AppIcon name="steps" />Enter Steps</button>
        </section>
      ) : missed && !entry ? (
        <section className="journey-missed-overview">
          <div className="journey-missed-mark"><AppIcon name="alert" /></div>
          <span>MISSED DAY</span>
          <h2>This day is still waiting</h2>
          <p>You didn&apos;t enter any steps or complete your Bible reading for this day.</p>

          <div className="journey-missed-status">
            <div><span><AppIcon name="steps" /></span><div><small>DAILY STEPS</small><strong>Not entered</strong></div><i></i></div>
            <div><span><AppIcon name="book" /></span><div><small>BIBLE READING</small><strong>Not completed</strong></div><i></i></div>
          </div>

          {reasonAdded && <div className="journey-reason-added">Your reason has been added to this day.</div>}
          <div className="journey-missed-actions">
            <button onClick={onEnterSteps}><AppIcon name="steps" />Enter Steps</button>
            <button onClick={() => setShowReason(true)}>Add Reason</button>
          </div>
        </section>
      ) : passage && (
        <section className="journey-activity-overview">
          <div className="journey-activity-heading">
            <span>ACTIVITY OVERVIEW</span>
            <strong>Your record for this journey day</strong>
          </div>

          <div className="journey-activity-section steps-activity">
            <div className="journey-activity-icon"><AppIcon name="steps" /></div>
            <div><span>STEPS COMPLETED</span><strong>{(getDayStepCount(day.journeyDay) ?? 0).toLocaleString("en-US")} <small>steps</small></strong></div>
            <i><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3.5 8 3 3 6-6" /></svg></i>
          </div>

          <div className="journey-activity-section reading-activity">
            <div className="journey-activity-section-head">
              <div className="journey-activity-icon"><AppIcon name="book" /></div>
              <div><span>READING STATUS</span><strong>{passage.reference}</strong></div>
              <b className={inProgress ? "pending" : ""}>{inProgress ? "Pending" : "Completed"}</b>
            </div>
            {stepsLink && (
              <p className="journey-steps-link"><span>{passage.testament}</span>{stepsLink.value} · {stepsLink.text}</p>
            )}
            {inProgress ? (
              <div className="journey-reading-pending">
                <p>Your steps are recorded. Read the chapter and highlight the verses that speak to you.</p>
                <button onClick={onReadChapter}>
                  <AppIcon name="book" />Read Chapter
                </button>
              </div>
            ) : (
              <>
                <div className="journey-highlighted-verses">
                  <div><span>HIGHLIGHTED VERSES</span><strong>{plural(highlights.length, "verse")} from {passage.reference}</strong></div>
                  {highlights.map((verse) => (
                    <article key={verse.number}>
                      <span>{chapterNumber}:{verse.number}</span>
                      <p>{verse.text}</p>
                    </article>
                  ))}
                </div>
                <div className="journey-chapter-count">{passage.verseCount} verses read</div>
              </>
            )}
          </div>

          <div className={`journey-activity-section reflection-activity ${inProgress ? "in-progress" : "completed"}`}>
            <div className="journey-activity-section-head">
              <div className="journey-activity-icon"><AppIcon name="journal" /></div>
              <div><span>REFLECTION STATUS</span><strong>{inProgress ? "In Progress" : "Completed"}</strong></div>
            </div>
            {inProgress ? (
              <div className="journey-reflection-pending">
                <p>You haven&apos;t added a reflection for this passage yet.</p>
              </div>
            ) : (
              <div className="journey-reflection-answer">
                <span>YOUR REFLECTION</span>
                <p>{entry?.answers.find(Boolean) ? `“${entry.answers.find(Boolean)}”` : "No notes were written for this reflection."}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {showReason && (
        <div className="reason-backdrop" onClick={() => setShowReason(false)}>
          <form className="reason-dialog" onSubmit={(event) => {
            event.preventDefault();
            setReasonAdded(true);
            setShowReason(false);
          }} onClick={(event) => event.stopPropagation()}>
            <span>ADD A REASON</span>
            <h2>What happened that day?</h2>
            <p>Add a short private note for your journey record.</p>
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Write your reason..." required></textarea>
            <div>
              <button type="button" onClick={() => setShowReason(false)}>Cancel</button>
              <button type="submit" disabled={!reason.trim()}>Submit Reason</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// Journeys up to 5 weeks (33-Day, short custom) fit on one page; longer journeys page month by month.
const SINGLE_PAGE_DAYS = 35;

type CalendarPage = { firstDay: number; lastDay: number; title: string | null };

function getCalendarPages(totalDays: number): CalendarPage[] {
  if (totalDays <= SINGLE_PAGE_DAYS) return [{ firstDay: 1, lastDay: totalDays, title: null }];
  const start = getDayDate(1);
  const end = getDayDate(totalDays);
  const dayOf = (date: Date) => Math.round((date.getTime() - start.getTime()) / 86400000) + 1;
  const pages: CalendarPage[] = [];
  for (let month = new Date(start.getFullYear(), start.getMonth(), 1); month <= end; month = new Date(month.getFullYear(), month.getMonth() + 1, 1)) {
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    pages.push({
      firstDay: Math.max(1, dayOf(month)),
      lastDay: Math.min(totalDays, dayOf(monthEnd)),
      title: new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(month),
    });
  }
  return pages;
}

function makeDay(journeyDay: number): JourneyDayItem {
  const date = getDayDate(journeyDay);
  const state = getDayStatus(journeyDay);
  return {
    journeyDay,
    date,
    weekday: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date),
    month: new Intl.DateTimeFormat("en-US", { month: "short" }).format(date),
    dateNumber: date.getDate(),
    status: calendarStatus[state],
    state,
  };
}

export default function JourneyScreen({ onNavigate, plan }: { onNavigate: (tab: MainTab) => void; plan: JourneyPlan }) {
  const today = getTodayDay();
  const pages = getCalendarPages(plan.days);
  const pageCount = pages.length;
  const todayPage = pages.findIndex((item) => today >= item.firstDay && today <= item.lastDay);
  const [page, setPage] = useState(todayPage);
  const { firstDay, lastDay, title } = pages[page];
  const journeyDays = Array.from({ length: lastDay - firstDay + 1 }, (_, index) => makeDay(firstDay + index));
  // Weeks stay journey weeks (Days 1–7, 8–14…); a week that crosses a month edge shows its days on both pages.
  const weeks = journeyDays.reduce<{ number: number; days: JourneyDayItem[] }[]>((list, day) => {
    const number = Math.ceil(day.journeyDay / 7);
    if (list[list.length - 1]?.number === number) list[list.length - 1].days.push(day);
    else list.push({ number, days: [day] });
    return list;
  }, []);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const selectedDay = selectedDayNumber === null ? null : makeDay(selectedDayNumber);
  const progress = getProgress();
  const [dailyFlow, setDailyFlow] = useState<{ journeyDay: number; phase: DailyFlowEntry } | null>(null);
  const pageStart = journeyDays[0];
  const pageEnd = journeyDays[journeyDays.length - 1];
  // One page = "Sep 30 – Nov 1"; month pages = "October 2026". The line under it ties the page to journey days.
  const pageLabel = title ?? `${pageStart.month} ${pageStart.dateNumber} – ${pageEnd.month} ${pageEnd.dateNumber}`;
  const pageRange = pageStart.journeyDay === pageEnd.journeyDay
    ? `Day ${formatCount(pageStart.journeyDay)} of ${formatCount(plan.days)}`
    : `Days ${formatCount(pageStart.journeyDay)}–${formatCount(pageEnd.journeyDay)} of ${formatCount(plan.days)}`;
  const pageDays = pageCount === 1
    ? `All ${plural(plan.days, "day")} · Today is Day ${formatCount(today)}`
    : page === todayPage ? `${pageRange} · Today is Day ${formatCount(today)}` : pageRange;
  // Books read so far (completed days) and the latest reading, for the book progress section.
  const readBooks = getRecordedDays().filter(isDayComplete).map((day) => getDayRecord(day)!.reading.bookIndex);
  const latestBook = getDayRecord(getRecordedDays().slice(-1)[0] ?? 0)?.reading.bookIndex ?? null;
  const bookProgress = getBookProgress();
  const chaptersRead = readBooks.length;
  const [booksOpen, setBooksOpen] = useState(false);
  const typeDetail = plan.type === "custom"
    ? `${formatBookList(plan.books)} · ${readingOrderLabel(plan)}`
    : plan.type === "bible" ? `All 66 books · ${readingOrderLabel(plan)}` : "Old & New Testaments, alternating";

  if (dailyFlow) {
    return <DailyFlowScreen journeyDay={dailyFlow.journeyDay} initialPhase={dailyFlow.phase} doneLabel="Back to My Journey" onBack={() => setDailyFlow(null)} />;
  }

  if (selectedDay) {
    return (
      <JourneyDayDetails
        day={selectedDay}
        onBack={() => setSelectedDayNumber(null)}
        onEnterSteps={() => setDailyFlow({ journeyDay: selectedDay.journeyDay, phase: "entry" })}
        onReadChapter={() => setDailyFlow({ journeyDay: selectedDay.journeyDay, phase: "reading" })}
      />
    );
  }

  return (
    <div className="journey-overview-screen">
      <div className="journey-overview-scroll">
        <header className="journey-overview-header">
          <span>PASSAGE WALK</span>
          <h1>My Journey</h1>
          <p>Your {formatCount(plan.days)}-day walk through scripture</p>
        </header>

        <section className="journey-summary-card">
          <div className="journey-summary-top">
            <div><span>CURRENT POSITION</span><strong>Day {today} of {formatCount(plan.days)}</strong><p>{plural(progress.completedDays, "day")} completed</p></div>
            <div className="journey-summary-percent"><strong>{progress.percent}%</strong><span>complete</span></div>
          </div>
          <div className="journey-summary-track"><span style={{ width: progress.barWidth }}></span></div>
          <div className="journey-summary-type">
            <div><AppIcon name={plan.type === "automatic" ? "spark" : plan.type === "bible" ? "library" : "book"} /></div>
            <span>Journey type</span>
            <strong>{journeyTypeLabels[plan.type]}</strong>
          </div>
          <p className="journey-summary-detail">{typeDetail}</p>
        </section>

        <section className={`journey-books-card ${plan.type === "custom" ? `accordion ${booksOpen ? "open" : ""}` : ""}`}>
          {plan.type === "custom" ? (
            // Choose Your Own can hold many books, so the per-book list opens and closes.
            <button className="journey-books-heading journey-books-toggle" onClick={() => setBooksOpen((open) => !open)} aria-expanded={booksOpen}>
              <div>
                <span>YOUR BOOKS · {plan.books.length}</span>
                <strong>Chapters read per book</strong>
                <p>{chaptersRead} of {plural(plan.days, "chapter")} read{latestBook !== null ? ` · Latest: ${getBookName(latestBook)}` : ""}</p>
              </div>
              <i><AppIcon name="chevron" /></i>
            </button>
          ) : (
            <div className="journey-books-heading">
              <div>
                <span>THE 66 BOOKS</span>
                <strong>{plan.type === "bible" ? "Your walk through the Bible" : "Where your steps have led"}</strong>
              </div>
              {latestBook !== null && <p>Latest: {getBookName(latestBook)}</p>}
            </div>
          )}
          {plan.type === "bible" && (
            <p className="journey-books-count">
              <span><strong>{chaptersRead} of {formatCount(plan.days)}</strong> {plan.days === 1 ? "chapter" : "chapters"} read</span>
              <i></i>
              <span><strong>{bookProgress.filter((book) => book.read > 0).length} of 66</strong> books started</span>
            </p>
          )}
          {plan.type === "custom" ? (
            booksOpen && <div className="journey-book-rows">
              {bookProgress.map((book) => (
                <div className={book.finished ? "finished" : ""} key={book.bookIndex}>
                  <strong>{getBookName(book.bookIndex)}</strong>
                  <i><b style={{ width: `${(book.read / book.total) * 100}%` }}></b></i>
                  <span>{book.read}/{book.total}</span>
                </div>
              ))}
            </div>
          ) : (
            <BibleBooksGrid current={latestBook} visited={readBooks} finished={bookProgress.filter((book) => book.finished).map((book) => book.bookIndex)} />
          )}
        </section>

        <section className="journey-calendar">
          <div className="journey-calendar-month-nav">
            <button aria-label="Previous weeks" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0}><AppIcon name="chevron" /></button>
            <strong>
              {pageLabel}
              <small>{pageDays}</small>
            </strong>
            <button aria-label="Next weeks" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={page === pageCount - 1}><AppIcon name="chevron" /></button>
          </div>
          {page !== todayPage && (
            <button className="journey-calendar-today" onClick={() => setPage(todayPage)}>Back to today · Day {formatCount(today)}</button>
          )}
          <div className="journey-calendar-legend" aria-label="Calendar status legend">
            <span><i className="complete"></i>Complete</span>
            <span><i className="in-progress"></i>In progress</span>
            <span><i className="missed"></i>Missed</span>
            <span><i className="not-entered"></i>Not entered</span>
          </div>
          <div className="journey-week-list">
            {weeks.map(({ number, days: week }) => (
              <div className="journey-week" key={number}>
                <div className="journey-week-label">
                  <span>WEEK {String(number).padStart(2, "0")}</span>
                  <p>{week.length === 1 ? `Day ${formatCount(week[0].journeyDay)} · ${week[0].month} ${week[0].dateNumber}` : `Day ${formatCount(week[0].journeyDay)}–${formatCount(week[week.length - 1].journeyDay)} · ${week[0].month} ${week[0].dateNumber} – ${week[week.length - 1].month} ${week[week.length - 1].dateNumber}`}</p>
                </div>
                <div className="journey-week-days">
                  {week.map((day) => (
                    <button
                      className={`journey-calendar-day ${day.status}`}
                      onClick={() => setSelectedDayNumber(day.journeyDay)}
                      disabled={day.status === "upcoming"}
                      key={day.journeyDay}
                    >
                      <strong>{day.dateNumber}</strong>
                      <span>{day.weekday}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
      <BottomNavigation active="journey" onSelect={onNavigate} />
    </div>
  );
}
