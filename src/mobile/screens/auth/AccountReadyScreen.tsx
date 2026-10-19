import { useEffect } from "react";
import AppIcon from "../../components/AppIcon";
import { playApplause } from "../../sound";

const nextSteps = [
  { title: "Account created", body: "Your private space is ready.", state: "done" },
  { title: "Choose your journey", body: "33 days, your own books, or the entire Bible.", state: "next" },
  { title: "Walk, read, reflect", body: "Your steps will lead you to each day's chapter.", state: "later" },
];

// Shown once, right after Create Account. The journey choice comes next.
export default function AccountReadyScreen({ name, onContinue }: { name: string; onContinue: () => void }) {
  const firstName = name.trim().split(/\s+/)[0] || "Dinesh";

  // Same applause as Welcome back, timed with the check-mark pop.
  useEffect(() => {
    const clap = window.setTimeout(() => playApplause(1.2, 0.4), 700);
    return () => window.clearTimeout(clap);
  }, []);

  return (
    <div className="moment-screen moment-account-ready">
      <div className="moment-visual">
        <div className="moment-sparkles" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <i key={index} />)}</div>
        <div className="moment-ring">
          <div className="moment-badge moment-badge-check"><AppIcon name="check" /></div>
        </div>
      </div>

      <div className="moment-copy">
        <span>YOU'RE ALL SET</span>
        <h1>Welcome to Passage Walk, {firstName}!</h1>
        <p>Your account is ready. Now let's choose how your steps will guide you through scripture.</p>
      </div>

      <ol className="moment-steps">
        {nextSteps.map((step, index) => (
          <li className={step.state} key={step.title}>
            <i>{step.state === "done" ? <AppIcon name="check" /> : index + 1}</i>
            <div><strong>{step.title}</strong><p>{step.body}</p></div>
            {step.state === "next" && <em>NEXT</em>}
          </li>
        ))}
      </ol>

      <div className="moment-footer">
        <button type="button" className="moment-primary" onClick={onContinue}>
          <span>Choose My Journey</span>
          <AppIcon name="chevron" />
        </button>
      </div>
    </div>
  );
}
