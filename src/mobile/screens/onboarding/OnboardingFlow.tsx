import { useState } from "react";
import onboardingImage1 from "../../../assets/Onboarding1.jpg";
import onboardingImage2 from "../../../assets/Onboarding2.jpg";
import onboardingImage3 from "../../../assets/Onboarding3.jpg";
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
import WelcomeScreen from "./WelcomeScreen";

const onboardingContent = [
  {
    eyebrow: "A DAILY DEVOTIONAL RHYTHM",
    title: "Walk With Purpose",
    body: "Passage Walk connects the steps you take with scripture—creating a rhythm of movement, reflection, and faith that brings you closer to God each day.",
    image: onboardingImage1,
    imageAlt: "A stone path leading down a hillside toward a sunlit valley",
  },
  {
    eyebrow: "HOW PASSAGE WALK WORKS",
    title: "Your Steps, Your Scripture",
    body: "Enter your daily steps and receive a meaningful passage selected for your journey. Read at your own pace, then pause for a quiet moment of reflection.",
    image: onboardingImage2,
    imageAlt: "A hiker walking along a peaceful forest trail",
  },
  {
    eyebrow: "ONE DAY AT A TIME",
    title: "A 33-Day Walk",
    body: "Build a lasting devotional habit through daily reading and personal reflection. Your steps uniquely determine your Bible reading. Follow your progress and celebrate meaningful milestones along the way.",
    image: onboardingImage3,
    imageAlt: "A hiker walking along a mountain trail toward a distant peak",
  },
];

// Onboarding → Welcome (→ Learn more) → first-time user: Create Account → "Welcome to Passage Walk" → Choose Your Journey → Journey ready → Home
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
  const startJourney = (plan: JourneyPlan, walk?: DailyFlowEntry) => {
    activateJourney(plan);
    setOpenWalk(walk);
    setJourney(plan);
    setJourneyRun((run) => run + 1);
    setStage("app");
  };

  if (stage === "app" && journey) {
    return (
      <IOSDeviceFrame>
        <HomeScreen key={journeyRun} plan={journey} initialFlow={openWalk} onLogout={() => setStage("login")} onChangeJourney={(plan) => startJourney(plan)} />
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
        <div className="onboarding-visual">
          {activeScreen > 0 && (
            <button className="onboarding-back" onClick={() => setActiveScreen((current) => current - 1)} aria-label="Previous screen"><AppIcon name="back" /></button>
          )}
          <div className="onboarding-visual-stage" key={content.image}>
            <div className="onboarding-photo-wrap">
              <img src={content.image} alt={content.imageAlt} />
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
          <p>{content.body}</p>
          {isLastSlide && (
            <p className="onboarding-fact"><AppIcon name="spark" /><span><strong>Did you know?</strong> Christ was 33 years old when He died.</span></p>
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
