import { useEffect } from "react";
import AppIcon from "../../components/AppIcon";
import { planDayChapterCount } from "../../data/journeyPlans";
import { getActivePlan } from "../../data/journeyStore";
import { getDayStatus, getJourneyTotals, getProgress, getTodayDay } from "../../data/progress";
import { getUser } from "../../data/user";
import { playApplause } from "../../sound";
import type { DailyFlowEntry } from "../home/DailyFlowScreen";

// Returning user: a short applause moment after Log In, then a landing that starts today's reading
// (review call 3, Kathy: "a landing page that simply says, start your reading journey versus going straight to this dashboard").
// Start Today's Walk opens step entry (or the reading, if steps are in); Go to Dashboard opens Home.
export default function WelcomeBackScreen({ onContinue, onStartWalk }: { onContinue: () => void; onStartWalk: (phase: DailyFlowEntry) => void }) {
  const progress = getProgress();
  const totals = getJourneyTotals();
  const today = getTodayDay();
  const status = getDayStatus(today);

  useEffect(() => {
    // Kathy: "some little clapping hands, like applause" for a returning user — timed with the 👏 animation.
    const clap = window.setTimeout(() => playApplause(1.2, 0.4), 700);
    return () => window.clearTimeout(clap);
  }, []);

  const todayLine = status === "complete"
    ? { title: `Day ${today} is complete.`, body: "Your walk and reflection are done for today. Well done!" }
    : status === "in-progress"
      ? { title: `Day ${today} is waiting for you.`, body: `Your steps are in. Read your ${planDayChapterCount(getActivePlan(), today) > 1 ? "chapters" : "chapter"} and add your reflection.` }
      : { title: `Day ${today} is waiting for you.`, body: "Enter today's steps to unlock your passage." };

  return (
    <div className="moment-screen moment-welcome-back">
      <div className="moment-visual">
        <div className="moment-sparkles" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <i key={index} />)}</div>
        <div className="moment-ring moment-ring-gold">
          <div className="moment-badge moment-badge-clap" role="img" aria-label="Clapping hands">👏</div>
        </div>
      </div>

      <div className="moment-copy">
        <span>GOOD TO SEE YOU</span>
        <h1>Welcome back, {getUser().firstName}!</h1>
        <p>I'm proud of you for showing up today. Every step moves you closer to God.</p>
      </div>

      <div className="moment-stats">
        <div><strong>{progress.completedDays}</strong><span>{progress.completedDays === 1 ? "day walked" : "days walked"}</span></div>
        <div><strong>{totals.passages}</strong><span>verses read</span></div>
        <div><strong>{getTodayDay()}</strong><span>journey day</span></div>
      </div>

      <div className="moment-today">
        <i><AppIcon name={status === "complete" ? "check" : "steps"} /></i>
        <p><strong>{todayLine.title}</strong> {todayLine.body}</p>
      </div>

      <div className="moment-footer">
        {status === "complete" ? (
          <button type="button" className="moment-primary" onClick={onContinue}>
            <span>Go to Dashboard</span>
            <AppIcon name="chevron" />
          </button>
        ) : (
          <>
            <button type="button" className="moment-primary" onClick={() => onStartWalk(status === "in-progress" ? "reading" : "entry")}>
              <AppIcon name="steps" />
              <span>{status === "in-progress" ? "Continue Today's Walk" : "Start Today's Walk"}</span>
              <AppIcon name="chevron" />
            </button>
            <button type="button" className="moment-link" onClick={onContinue}>Go to Dashboard</button>
          </>
        )}
      </div>
    </div>
  );
}
