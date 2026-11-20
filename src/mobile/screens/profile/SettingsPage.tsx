import { useMemo, useState } from "react";
import AppIcon from "../../components/AppIcon";
import BibleVersionList from "../../components/BibleVersionList";
import MilestoneBadge from "../../components/MilestoneBadge";
import JourneyCompleteFlow from "../complete/JourneyCompleteFlow";
import { getJourneyCompleteDemo } from "../../data/journeyCompleteDemo";
import { BIBLE_VERSION } from "../../data/bible";
import { formatBookList, formatCount, getBiblePace, journeyName, journeyTypeIcons, journeyTypeLabels, planChaptersPerDay, plural, readingOrderLabel } from "../../data/journeyPlans";
import { getTodayDay } from "../../data/progress";
import type { JourneyPlan } from "../../types";
import JourneyReadyScreen from "../setup/JourneyReadyScreen";
import JourneySetupScreen from "../setup/JourneySetupScreen";
import ProfileSubpageHeader from "./ProfileSubpageHeader";

// "September 30, 2026" → "Sep 30" (or "Sep 30, 2026" with the year).
const shortDate = (date: string, withYear = false) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", ...(withYear ? { year: "numeric" } : {}) });

// PM (2026-11-19): the "Journey in progress / Journey completed" prototype tabs were for the dev team only and
// would confuse the client — the completed state is shared with dev as screenshots. Hidden, so Settings always
// shows the running journey and YOUR JOURNEYS = 0 (empty state). Set true to bring the tabs back.
const SHOW_SETTINGS_STATE_TABS = false;

// Settings → Change Journey reuses the first-time setup (3 journey types → books → order → journey ready),
// so the team sees one flow. Starting the new journey switches the whole app to it.
export default function SettingsPage({
  plan,
  onChangeJourney,
  onBack,
}: {
  plan: JourneyPlan;
  onChangeJourney: (plan: JourneyPlan) => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState<"overview" | "setup" | "ready" | "bible" | "complete" | "history" | "story" | "next">("overview");
  const [nextPlan, setNextPlan] = useState<JourneyPlan | null>(null);
  const [confirmChange, setConfirmChange] = useState(false);
  // Dev team (2026-11-16): a user who closes the Journey Complete screens (Maybe later, app closed…) can still
  // open the story later. The real app lists every finished journey, newest first.
  // Prototype-only tabs show the two Settings states to the dev team:
  //   "active"    = a journey is running (first-time user on Day 33 before saving): Change Journey on top, 0 completed.
  //   "completed" = that journey is finished: no Change Journey; "Choose Your Next Journey" instead, 1 completed.
  const [demoState, setDemoState] = useState<"active" | "completed">("active");
  const [flowReturn, setFlowReturn] = useState<"overview" | "history">("history");
  const completed = useMemo(getJourneyCompleteDemo, []);
  const completedJourneys = demoState === "completed" ? [completed] : [];

  if (step === "story" || step === "next") {
    return (
      <JourneyCompleteFlow
        startAt={step}
        onExit={() => setStep(flowReturn)}
        onChoose={(chosen) => {
          setNextPlan(chosen);
          setStep("setup");
        }}
      />
    );
  }

  if (step === "history") {
    return (
      <div className="profile-subpage">
        <ProfileSubpageHeader title="Completed Journeys" backLabel="Back to Settings" onBack={() => setStep("overview")} />
        <div className="settings-content">
          <div className="profile-subpage-intro">
            <span>YOUR HISTORY</span>
            <h1>Completed Journeys</h1>
            <p>Every journey you finish is kept here. Tap one to see its full story.</p>
          </div>
          <div className="completed-journeys-list">
            {completedJourneys.length === 0 && (
              <div className="completed-journeys-empty">
                <i><AppIcon name="milestones" /></i>
                <strong>No completed journeys yet</strong>
                <p>When you finish your current journey, its story will be kept here.</p>
              </div>
            )}
            {completedJourneys.map((journey) => (
              <div className="completed-journey-item" key={journey.endDate}>
                <button className="completed-journey-card" onClick={() => { setFlowReturn("history"); setStep("story"); }}>
                  <i><MilestoneBadge milestone={{ day: journey.days, unlocked: true }} /></i>
                  <div>
                    <span>COMPLETED</span>
                    <strong>{journeyTypeLabels[journey.plan.type]}</strong>
                    <small>{shortDate(journey.startDate)} – {shortDate(journey.endDate, true)} · {journey.days} of {journey.days} days</small>
                  </div>
                  <AppIcon name="chevron" />
                </button>
                <div className="completed-journey-or" aria-hidden="true"><span>or</span></div>
                <button className="completed-journey-next" onClick={() => { setFlowReturn("history"); setStep("next"); }}>Where to Next?<AppIcon name="chevron" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Prototype demo: the Journey Complete screens; choosing a next walk continues into Change Journey.
  if (step === "complete") {
    return (
      <JourneyCompleteFlow
        onExit={() => setStep("overview")}
        onChoose={(chosen) => {
          setNextPlan(chosen);
          setStep("setup");
        }}
      />
    );
  }

  if (step === "bible") {
    return (
      <div className="profile-subpage">
        <ProfileSubpageHeader title="Bible Version" onBack={() => setStep("overview")} />
        <div className="settings-content">
          <div className="profile-subpage-intro">
            <span>READING SETTINGS</span>
            <h1>Bible Version</h1>
            <p>Choose the version for your daily readings and highlights.</p>
          </div>
          <BibleVersionList />
        </div>
      </div>
    );
  }

  if (step === "ready" && nextPlan) {
    return <JourneyReadyScreen plan={nextPlan} startLabel="Start This Journey" onStart={() => onChangeJourney(nextPlan)} onChange={() => setStep("setup")} />;
  }

  if (step === "setup") {
    return (
      <JourneySetupScreen
        initialPlan={nextPlan ?? plan}
        askVersion={false}
        onExit={() => { setNextPlan(null); setStep("overview"); }}
        onComplete={(chosen) => {
          setNextPlan(chosen);
          setStep("ready");
        }}
      />
    );
  }

  // Same rows on both tabs: the running journey, or the finished one.
  const journeyDetails = (journey: JourneyPlan) => [
    { label: "Length", value: `${plural(journey.days, "day")} · ${planChaptersPerDay(journey)}` },
    ...(journey.type === "bible" ? [{ label: "Pace", value: getBiblePace(journey.pace).title }] : []),
    ...(journey.type === "designed" ? [{ label: "Walk", value: journeyName(journey) }] : []),
    journey.type === "custom" || journey.type === "designed"
      ? { label: "Books", value: journey.books.length === 66 ? "All 66 books" : formatBookList(journey.books) }
      : { label: "Books", value: journey.type === "bible" ? "All 66 books" : "Old & New Testaments, alternating" },
    { label: "Reading order", value: readingOrderLabel(journey) },
  ];
  const details = journeyDetails(plan);

  return (
    <div className="profile-subpage">
      <ProfileSubpageHeader title="Settings" onBack={onBack} />
      <div className="settings-content">
        {/* Prototype only: switch between the two Settings states (not part of the real app). */}
        {SHOW_SETTINGS_STATE_TABS && (
          <div className="settings-state-demo">
            <span>PROTOTYPE · SETTINGS STATE</span>
            <div className="notifications-tabs" role="tablist" aria-label="Settings state">
              <button role="tab" aria-selected={demoState === "active"} className={demoState === "active" ? "active" : ""} onClick={() => setDemoState("active")}>Journey in progress</button>
              <button role="tab" aria-selected={demoState === "completed"} className={demoState === "completed" ? "active" : ""} onClick={() => setDemoState("completed")}>Journey completed</button>
            </div>
          </div>
        )}

        {demoState === "active" ? (
          <>
            <div className="profile-subpage-intro">
              <span>JOURNEY SETTINGS</span>
              <h1>Current Journey</h1>
              <p>Review the journey type guiding your daily scripture assignments.</p>
            </div>

            <section className="current-journey-card">
              <div className="current-journey-icon"><AppIcon name={journeyTypeIcons[plan.type]} /></div>
              <div>
                <span>CURRENT JOURNEY</span>
                <strong>{journeyTypeLabels[plan.type]}</strong>
              </div>
              <i>{formatCount(plan.days)} {plan.days === 1 ? "DAY" : "DAYS"}</i>
            </section>

            <dl className="current-journey-details">
              {details.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
            </dl>

            <button className="change-journey-button" onClick={() => setConfirmChange(true)}>
              Change Journey
              <AppIcon name="chevron" />
            </button>
            <p className="change-journey-note">Choose from the 33-Day Walk, a Designed Experience, or create your own journey.</p>
          </>
        ) : (
          <>
            {/* Finished journey: nothing is running, so there is no "Change Journey" — only the next step. */}
            <div className="profile-subpage-intro">
              <span>JOURNEY SETTINGS</span>
              <h1>Journey Complete</h1>
              <p>You finished your journey. Choose where your steps lead next.</p>
            </div>

            <section className="current-journey-card">
              <div className="current-journey-icon"><AppIcon name={journeyTypeIcons[completed.plan.type]} /></div>
              <div>
                <span>LAST JOURNEY</span>
                <strong>{journeyTypeLabels[completed.plan.type]}</strong>
              </div>
              <i className="done"><AppIcon name="check" />COMPLETED</i>
            </section>

            <dl className="current-journey-details">
              {journeyDetails(completed.plan).map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
            </dl>

            <button className="change-journey-button" onClick={() => { setFlowReturn("overview"); setStep("next"); }}>
              Choose Your Next Journey
              <AppIcon name="chevron" />
            </button>
            <p className="change-journey-note">Your badges and PassageWalk days carry on into your next journey.</p>
          </>
        )}

        {/* Bible version only matters while a journey is running (nothing to read once it is finished). */}
        {demoState === "active" && (
          <>
            <div className="settings-section-label">READING</div>
            <button className="settings-version-row" onClick={() => setStep("bible")}>
              <i><AppIcon name="book" /></i>
              <div><span>BIBLE VERSION</span><strong>{BIBLE_VERSION.name}</strong></div>
              <em>{BIBLE_VERSION.short}</em>
              <AppIcon name="chevron" />
            </button>
          </>
        )}

        <div className="settings-section-label">YOUR JOURNEYS</div>
        <button className="settings-version-row" onClick={() => setStep("history")}>
          <i><AppIcon name="milestones" /></i>
          <div><span>COMPLETED JOURNEYS</span><strong>{completedJourneys.length ? "See the story of each journey you finished" : "No completed journeys yet"}</strong></div>
          <em>{completedJourneys.length}</em>
          <AppIcon name="chevron" />
        </button>

        {/* Prototype only: the mock journey is on Day 5, so the end of a journey is shown from here.
            Hidden on the "Journey completed" tab — that journey has already ended. */}
        {demoState === "active" && (
          <>
            <div className="settings-section-label">PROTOTYPE DEMO</div>
            <button className="settings-demo-row" onClick={() => setStep("complete")}>
              <i><MilestoneBadge milestone={{ day: 33, unlocked: true }} /></i>
              <div><span>JOURNEY COMPLETE</span><strong>See what happens when a user finishes their last day</strong></div>
              <AppIcon name="chevron" />
            </button>
            <p className="settings-demo-note">Demo only. In the app, these screens open when the final day's reflection is saved.</p>
          </>
        )}
      </div>

      {/* Changing journey ends the current one, so ask first. */}
      {confirmChange && (
        <div className="logout-backdrop" onClick={() => setConfirmChange(false)}>
          <section className="logout-dialog change-journey-dialog" role="dialog" aria-modal="true" aria-labelledby="change-journey-title" onClick={(event) => event.stopPropagation()}>
            <div className="logout-dialog-icon"><AppIcon name="journey" /></div>
            <h2 id="change-journey-title">Start a new journey?</h2>
            <p>
              {/* PW-281: completed days stay in the old journey; days not completed stay incomplete; new journey = Day 1 today. */}
              Your {journeyTypeLabels[plan.type]} ends at Day {getTodayDay()} of {formatCount(plan.days)}. Days not completed will <strong>stay incomplete</strong>.
            </p>
            <p>Your new journey starts <strong>today as Day 1</strong>.</p>
            <p className="change-journey-dialog-keep">Completed days and badges stay with you.</p>
            <div>
              <button onClick={() => setConfirmChange(false)}>Keep Current</button>
              <button onClick={() => { setConfirmChange(false); setStep("setup"); }}>Yes, Change</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
