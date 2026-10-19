import AppIcon, { type AppIconName } from "../../components/AppIcon";

// Welcome → "Learn more" (client slide 7): explains the app before a new user signs up.
const steps: { icon: AppIconName; title: string; body: string }[] = [
  { icon: "steps", title: "Walk and enter your steps", body: "Walk as you normally do, then enter your step count for the day." },
  { icon: "library", title: "Your steps point to a book", body: "The numbers in your steps lead you to one of the 66 books of the Bible — 5,326 steps can point to Deuteronomy, the 5th book." },
  { icon: "book", title: "Read and highlight", body: "Read the full chapter at your own pace and tap the verses that speak to you." },
  { icon: "edit", title: "Reflect and celebrate", body: "Pause for a quiet reflection, then celebrate milestones along the way." },
];

const journeys: { icon: AppIconName; title: string; body: string }[] = [
  { icon: "spark", title: "33-Day Journey", body: "One day for each year of Christ's life." },
  { icon: "book", title: "Choose Your Own Journey", body: "Pick the books — their chapters set your days." },
  { icon: "library", title: "Read the Entire Bible", body: "All 66 books, in order or as your steps choose." },
];

export default function LearnMoreScreen({ onBack, onCreateAccount, onSignIn }: { onBack: () => void; onCreateAccount: () => void; onSignIn: () => void }) {
  return (
    <div className="learn-screen">
      <div className="auth-top learn-top">
        <button type="button" className="auth-back" onClick={onBack} aria-label="Back to Welcome"><AppIcon name="back" /></button>
        <div className="learn-top-title"><span>LEARN MORE</span><strong>How Passage Walk works</strong></div>
      </div>

      <div className="learn-content">
        <div className="learn-intro">
          <span>BODY · MIND · SPIRIT</span>
          <h1>Your steps, God&apos;s Word</h1>
          <p>Passage Walk strengthens your body through the steps you take and your spirit through the passages of scripture they lead you to.</p>
        </div>

        <ol className="learn-steps">
          {steps.map((step, index) => (
            <li key={step.title}>
              <div className="learn-step-marker"><i><AppIcon name={step.icon} /></i></div>
              <div className="learn-step-copy">
                <div className="learn-step-head">
                  <span>STEP {String(index + 1).padStart(2, "0")}</span>
                  <strong>{step.title}</strong>
                </div>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <section className="learn-journeys">
          <span className="learn-label">CHOOSE YOUR JOURNEY</span>
          {journeys.map((journey) => (
            <div className="learn-journey" key={journey.title}>
              <i><AppIcon name={journey.icon} /></i>
              <div><strong>{journey.title}</strong><p>{journey.body}</p></div>
            </div>
          ))}
        </section>

        <section className="learn-bible-facts" aria-label="The Bible in numbers">
          <div><strong>66</strong><span>books</span></div>
          <div><strong>1,189</strong><span>chapters</span></div>
          <div><strong>31,102</strong><span>verses</span></div>
          <p><AppIcon name="spark" />Learn the books of the Bible, one step at a time.</p>
        </section>
      </div>

      <div className="learn-footer">
        <button type="button" className="welcome-primary" onClick={onCreateAccount}>
          <span>Create Account</span>
          <AppIcon name="chevron" />
        </button>
        <button type="button" className="auth-switch" onClick={onSignIn}>Already have an account?<strong>Log In</strong></button>
      </div>
    </div>
  );
}
