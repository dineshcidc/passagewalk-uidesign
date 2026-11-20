import { useState } from "react";
// Onboarding top banner photos — all client images (src/assets/onboarding/). Originals: Client-call/Onboarding-images/.
import onboarding1a from "../../../assets/onboarding/onboarding-1a.jpg";
import onboarding2a from "../../../assets/onboarding/onboarding-2a.jpg";
import onboarding2b from "../../../assets/onboarding/onboarding-2b.jpg";
import onboarding2c from "../../../assets/onboarding/onboarding-2c.jpg";
import onboarding2d from "../../../assets/onboarding/onboarding-2d.jpg";
import onboarding3a from "../../../assets/onboarding/onboarding-3a.jpg";
import onboarding3c from "../../../assets/onboarding/onboarding-3c.jpg";
import AppIcon from "../../components/AppIcon";
import IOSDeviceFrame from "../../components/IOSDeviceFrame";
import { defaultJourneyPlan } from "../../data/journeyPlans";
import { activateJourney } from "../../data/journeyStore";
import type { JourneyPlan } from "../../types";
import AccountReadyScreen from "../auth/AccountReadyScreen";
import AuthFlow from "../auth/AuthFlow";
import WelcomeBackScreen from "../auth/WelcomeBackScreen";
import type { DailyFlowEntry } from "../home/DailyFlowScreen";
import HomeScreen from "../home/HomeScreen";
import JourneySetupFlow from "../setup/JourneySetupFlow";
import LearnMoreScreen from "./LearnMoreScreen";
import OnboardingCarousel from "./OnboardingCarousel";
import WelcomeScreen from "./WelcomeScreen";

const onboardingContent = [
  {
    eyebrow: "A DAILY DEVOTIONAL RHYTHM",
    title: "Walk With Purpose",
    body: "PassageWalk intentionally connects the steps you take with Scripture, creating a rhythm of movement, faith and reflection, bringing you closer to God each day.",
    // Top banner carousel: first image shows first, the rest follow in random order (slow fade).
    // Client feedback 2026-11-19 (tracker row 3): page 1 = option A only (1A boardwalk), old photo removed — one image, no rotation.
    images: [
      { src: onboarding1a, alt: "A wooden boardwalk winding through tall grass toward morning light", position: "55% center" },
    ],
  },
  {
    eyebrow: "HOW PASSAGEWALK WORKS",
    title: "Your Steps, Your Scripture",
    // Blank line ("\n\n") = new paragraph.
    body: "Enter your daily steps to receive a meaningful passage.\n\nRead at your own pace, then pause for a quiet moment of reflection.",
    // Client feedback 2026-11-19 (tracker row 4): old photo removed; options D, E, F, G = 2A, 2D, 2B, 2C (2A shows first).
    images: [
      { src: onboarding2a, alt: "A quiet pond below green hills and an oak tree under a blue sky", position: "60% center" },
      { src: onboarding2d, alt: "Sunlight on a green meadow and pond beneath a rocky mountainside", position: "60% center" },
      { src: onboarding2b, alt: "A stream rushing under a small bridge through a mossy forest" },
      { src: onboarding2c, alt: "Pine trees and mountain peaks reflected in a still pond" },
    ],
  },
  {
    eyebrow: "ONE DAY AT A TIME",
    title: "A 33-Day Walk",
    body: "Your PassageWalk is designed to build a lasting devotional habit.\n\nEach day’s steps will uniquely guide your Bible reading.\n\nFollow your progress and celebrate meaningful milestones along the way.",
    // Client feedback 2026-11-19 (tracker row 5): old photo and 3B (people hiking) removed; options = 3A, 3C (3A shows first).
    images: [
      { src: onboarding3a, alt: "A forested mountain valley with a small pond below the trail" },
      { src: onboarding3c, alt: "A green meadow and rocky path below a tall mountain peak" },
    ],
  },
];

// Onboarding → Welcome (→ Learn more) → first-time user: Create Account → "Welcome to PassageWalk" → Choose Your Journey → Journey ready → Home
//                      → returning user:  Log In → "Welcome back 👏" → Home (journey setup is skipped)
type Stage = "onboarding" | "welcome" | "learn-more" | "login" | "signup" | "account-ready" | "setup" | "welcome-back" | "app";

export default function OnboardingFlow() {
  const [stage, setStage] = useState<Stage>("onboarding");
  const [activeScreen, setActiveScreen] = useState(0);
  const [userName, setUserName] = useState("");
  // Owned here so the journey survives Log Out → Log In.
  const [journey, setJourney] = useState<JourneyPlan | null>(null);
  const [journeyRun, setJourneyRun] = useState(0);
  // Set on Welcome back: open today's walk (Start Today's Walk) or the dashboard (Go to Dashboard).
  const [openWalk, setOpenWalk] = useState<DailyFlowEntry | undefined>();
  const content = onboardingContent[activeScreen];
  const isLastSlide = activeScreen === onboardingContent.length - 1;

  const goNext = () => {
    if (isLastSlide) setStage("welcome");
    else setActiveScreen((current) => current + 1);
  };

  // Starting a journey resets the prototype data to that journey's mock scenario; the key remounts every tab.
  // walk = Welcome back → Start Today's Walk; any other start (setup, Change Journey) opens Home.
  // carryOver = Change Journey: PassageWalk days (and the badges they earned) continue into the new journey.
  const startJourney = (plan: JourneyPlan, walk?: DailyFlowEntry, carryOver = false) => {
    activateJourney(plan, carryOver);
    setOpenWalk(walk);
    setJourney(plan);
    setJourneyRun((run) => run + 1);
    setStage("app");
  };

  if (stage === "app" && journey) {
    return (
      <IOSDeviceFrame>
        <HomeScreen key={journeyRun} plan={journey} initialFlow={openWalk} onLogout={() => setStage("login")} onChangeJourney={(plan) => startJourney(plan, undefined, true)} />
      </IOSDeviceFrame>
    );
  }

  if (stage === "setup") {
    return <JourneySetupFlow onExit={() => setStage("account-ready")} onComplete={(plan) => startJourney(plan)} />;
  }

  if (stage === "account-ready") {
    return <IOSDeviceFrame><AccountReadyScreen name={userName} onContinue={() => setStage("setup")} /></IOSDeviceFrame>;
  }

  if (stage === "welcome-back") {
    // A returning user keeps their journey; signing in on a fresh install starts the default 33-Day Walk.
    const enterApp = (walk?: DailyFlowEntry) => {
      if (!journey) return startJourney(defaultJourneyPlan, walk);
      setOpenWalk(walk);
      setStage("app");
    };
    return <IOSDeviceFrame><WelcomeBackScreen onContinue={() => enterApp()} onStartWalk={enterApp} /></IOSDeviceFrame>;
  }

  if (stage === "login" || stage === "signup") {
    return (
      <AuthFlow
        key={stage}
        initialView={stage}
        onExit={() => setStage("welcome")}
        onLoggedIn={() => setStage("welcome-back")}
        onSignedUp={(name) => {
          // A new account starts with a fresh journey choice.
          setUserName(name);
          setJourney(null);
          setStage("account-ready");
        }}
      />
    );
  }

  if (stage === "learn-more") {
    return (
      <IOSDeviceFrame statusBarStyle="light">
        <LearnMoreScreen onBack={() => setStage("welcome")} onCreateAccount={() => setStage("signup")} onSignIn={() => setStage("login")} />
      </IOSDeviceFrame>
    );
  }

  if (stage === "welcome") {
    return (
      <IOSDeviceFrame statusBarStyle="light">
        <WelcomeScreen onCreateAccount={() => setStage("signup")} onSignIn={() => setStage("login")} onLearnMore={() => setStage("learn-more")} onBack={() => setStage("onboarding")} />
      </IOSDeviceFrame>
    );
  }

  return (
    <IOSDeviceFrame statusBarStyle="light">
      <div className={`onboarding-screen onboarding-screen-${activeScreen + 1}`}>
        {/* Back stays fixed at the top; photo + text scroll; the button stays at the bottom (sticky). */}
        {activeScreen > 0 && (
          <button className="onboarding-back" onClick={() => setActiveScreen((current) => current - 1)} aria-label="Previous screen"><AppIcon name="back" /></button>
        )}
        <div className="onboarding-scroll" key={activeScreen}>
        <div className="onboarding-visual">
          <div className="onboarding-visual-stage">
            <div className="onboarding-photo-wrap">
              <OnboardingCarousel images={content.images} />
              <div className={`onboarding-photo-badge onboarding-photo-badge-${activeScreen + 1}`}>
                {activeScreen < 2 ? (
                  <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {activeScreen === 0 ? (
                      <>
                        <path d="M3.5 6.5A4 4 0 0 1 7.5 3H13v20H7.5a4 4 0 0 0-4 3V6.5Z" />
                        <path d="M24.5 6.5A4 4 0 0 0 20.5 3H15v20h5.5a4 4 0 0 1 4 3V6.5Z" />
                      </>
                    ) : (
                      <>
                        <rect x="7" y="2.5" width="14" height="23" rx="3" />
                        <path d="M11 6.5h6M12 21.5h4" />
                        <path d="m10.5 14 2.2 2.2 4.8-5" />
                      </>
                    )}
                  </svg>
                ) : (
                  <><strong>33</strong><span>DAYS</span></>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="onboarding-copy" key={content.title}>
          <span>{content.eyebrow}</span>
          <h1>{content.title}</h1>
          {/* Client: "PassageWalk" is emphasized (bold) in the body text. */}
          {content.body.split("\n\n").map((paragraph) => (
            <p key={paragraph} className="onboarding-body">{paragraph.split(/(PassageWalk)/).map((part, index) => (part === "PassageWalk" ? <strong key={index}>{part}</strong> : part))}</p>
          ))}
          {isLastSlide && (
            <p className="onboarding-fact"><AppIcon name="spark" /><span><strong>Did you know?</strong> Christ was approximately 33 years old at the time of His crucifixion.</span></p>
          )}
          <div className="onboarding-progress" aria-label={`Onboarding step ${activeScreen + 1} of 3`}>
            {onboardingContent.map((item, index) => (
              <button
                key={item.title}
                className={index === activeScreen ? "active" : ""}
                onClick={() => setActiveScreen(index)}
                aria-label={`Go to ${item.title}`}
              />
            ))}
          </div>
        </div>
        </div>

        <div className="onboarding-bottom">
          <button className="onboarding-next" onClick={goNext} key={`button-${activeScreen}`}>
            <span>{isLastSlide ? "Get Started" : "Next"}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M14 7l5 5-5 5" />
            </svg>
          </button>
        </div>
      </div>
    </IOSDeviceFrame>
  );
}
