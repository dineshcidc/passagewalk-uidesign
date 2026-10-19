import { useEffect, useRef } from "react";
import AppIcon from "../../components/AppIcon";
import { getJourneyTotals, getProgress, getTodayDay } from "../../data/progress";
import { getUser } from "../../data/user";
import { playApplause } from "../../sound";

const AUTO_CONTINUE_MS = 5000;

// Returning user: a short applause moment after Log In, then straight to Home (no journey setup).
export default function WelcomeBackScreen({ onContinue }: { onContinue: () => void }) {
  const progress = getProgress();
  const totals = getJourneyTotals();

  const continueRef = useRef(onContinue);
  continueRef.current = onContinue;

  useEffect(() => {
    const timer = window.setTimeout(() => continueRef.current(), AUTO_CONTINUE_MS);
    // Kathy: "some little clapping hands, like applause" for a returning user — timed with the 👏 animation.
    const clap = window.setTimeout(() => playApplause(1.2, 0.4), 700);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(clap);
    };
  }, []);

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
        <p>I'm proud of you for showing up today. Every step brings you closer to God.</p>
      </div>

      <div className="moment-stats">
        <div><strong>{progress.completedDays}</strong><span>{progress.completedDays === 1 ? "day walked" : "days walked"}</span></div>
        <div><strong>{totals.passages}</strong><span>verses read</span></div>
        <div><strong>{getTodayDay()}</strong><span>journey day</span></div>
      </div>

      <div className="moment-today">
        <i><AppIcon name="steps" /></i>
        <p><strong>Day {getTodayDay()} is waiting for you.</strong> Enter today's steps to unlock your passage.</p>
      </div>

      <div className="moment-footer">
        <button type="button" className="moment-primary moment-primary-timed" onClick={onContinue} style={{ "--moment-timer": `${AUTO_CONTINUE_MS}ms` } as React.CSSProperties}>
          <span>Continue</span>
          <AppIcon name="chevron" />
        </button>
      </div>
    </div>
  );
}
