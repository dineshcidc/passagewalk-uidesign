import { useEffect, useState } from "react";
import OnboardingFlow from "./screens/onboarding/OnboardingFlow";
import SplashScreen from "./screens/onboarding/SplashScreen";

export default function MobileApp() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowOnboarding(true), 2600);
    return () => window.clearTimeout(timer);
  }, []);

  return <div className="design-pages-canvas">{showOnboarding ? <OnboardingFlow /> : <SplashScreen />}</div>;
}
