import { useState } from "react";
import AppIcon from "../../components/AppIcon";
import BibleVersionList from "../../components/BibleVersionList";
import MilestoneBadge from "../../components/MilestoneBadge";
import JourneyCompleteFlow from "../complete/JourneyCompleteFlow";
import { BIBLE_VERSION } from "../../data/bible";
import { formatBookList, formatCount, getBiblePace, journeyName, journeyTypeIcons, journeyTypeLabels, planChaptersPerDay, plural, readingOrderLabel } from "../../data/journeyPlans";
import { getTodayDay } from "../../data/progress";
import type { JourneyPlan } from "../../types";
import JourneyReadyScreen from "../setup/JourneyReadyScreen";
import JourneySetupScreen from "../setup/JourneySetupScreen";
import ProfileSubpageHeader from "./ProfileSubpageHeader";

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
  const [step, setStep] = useState<"overview" | "setup" | "ready" | "bible" | "complete">("overview");
  const [nextPlan, setNextPlan] = useState<JourneyPlan | null>(null);
  const [confirmChange, setConfirmChange] = useState(false);

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

  const details = [
    { label: "Length", value: `${plural(plan.days, "day")} · ${planChaptersPerDay(plan)}` },
    ...(plan.type === "bible" ? [{ label: "Pace", value: getBiblePace(plan.pace).title }] : []),
    ...(plan.type === "designed" ? [{ label: "Walk", value: journeyName(plan) }] : []),
    plan.type === "custom" || plan.type === "designed"
      ? { label: "Books", value: plan.books.length === 66 ? "All 66 books" : formatBookList(plan.books) }
      : { label: "Books", value: plan.type === "bible" ? "All 66 books" : "Old & New Testaments, alternating" },
    { label: "Reading order", value: readingOrderLabel(plan) },
  ];

  return (
    <div className="profile-subpage">
      <ProfileSubpageHeader title="Settings" onBack={onBack} />
      <div className="settings-content">
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

        <div className="settings-section-label">READING</div>
        <button className="settings-version-row" onClick={() => setStep("bible")}>
          <i><AppIcon name="book" /></i>
          <div><span>BIBLE VERSION</span><strong>{BIBLE_VERSION.name}</strong></div>
          <em>{BIBLE_VERSION.short}</em>
          <AppIcon name="chevron" />
        </button>

        {/* Prototype only: the mock journey is on Day 5, so the end of a journey is shown from here. */}
        <div className="settings-section-label">PROTOTYPE DEMO</div>
        <button className="settings-demo-row" onClick={() => setStep("complete")}>
          <i><MilestoneBadge milestone={{ day: 33, unlocked: true }} /></i>
          <div><span>JOURNEY COMPLETE</span><strong>See what happens when a user finishes their last day</strong></div>
          <AppIcon name="chevron" />
        </button>
        <p className="settings-demo-note">Demo only. In the app, these screens open when the final day's reflection is saved.</p>
      </div>

      {/* Changing journey ends the current one, so ask first. */}
      {confirmChange && (
        <div className="logout-backdrop" onClick={() => setConfirmChange(false)}>
          <section className="logout-dialog change-journey-dialog" role="dialog" aria-modal="true" aria-labelledby="change-journey-title" onClick={(event) => event.stopPropagation()}>
            <div className="logout-dialog-icon"><AppIcon name="journey" /></div>
            <h2 id="change-journey-title">Start a new journey?</h2>
            <p>
              Your current journey ({journeyTypeLabels[plan.type]}) is on Day {getTodayDay()} of {formatCount(plan.days)}. Changing your journey
              will stop it here, and its progress won&apos;t carry over to the new one.
            </p>
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
