import { useState } from "react";
import IOSDeviceFrame from "../../components/IOSDeviceFrame";
import type { JourneyPlan } from "../../types";
import JourneyReadyScreen from "./JourneyReadyScreen";
import JourneySetupScreen from "./JourneySetupScreen";

// First-time journey setup (Choose Your Journey → books → order) followed by the "journey ready" confirmation.
export default function JourneySetupFlow({ onComplete, onExit }: { onComplete: (plan: JourneyPlan) => void; onExit: () => void }) {
  const [plan, setPlan] = useState<JourneyPlan | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (plan && confirming) {
    return (
      <IOSDeviceFrame>
        <JourneyReadyScreen plan={plan} onStart={() => onComplete(plan)} onChange={() => setConfirming(false)} />
      </IOSDeviceFrame>
    );
  }

  return (
    <IOSDeviceFrame statusBarStyle="light">
      <JourneySetupScreen
        initialPlan={plan}
        onExit={onExit}
        onComplete={(nextPlan) => {
          setPlan(nextPlan);
          setConfirming(true);
        }}
      />
    </IOSDeviceFrame>
  );
}
