import AppIcon from "../../components/AppIcon";

// Shown after the last onboarding slide: first-time users create an account, returning users sign in,
// and "Learn more" explains the app first (client slide 7: Create account · Learn more · Sign in).
export default function WelcomeScreen({ onCreateAccount, onSignIn, onLearnMore, onBack }: { onCreateAccount: () => void; onSignIn: () => void; onLearnMore: () => void; onBack: () => void }) {
  return (
    <div className="welcome-screen">
      <div className="welcome-hero">
        <button type="button" className="welcome-back" onClick={onBack} aria-label="Go back"><AppIcon name="back" /></button>
        <svg className="welcome-trail" viewBox="0 0 390 330" fill="none" aria-hidden="true">
          <path d="M-20 300C70 262 96 214 160 196s128 8 168-38 42-104 92-132" />
        </svg>
        <div className="welcome-brand">
          <svg className="welcome-mark" viewBox="0 0 144 144" fill="none" role="img" aria-label="Passage Walk">
            <path className="welcome-mark-page" d="M20 82.5C35 77.2 51.4 78.6 68.5 91.6V119.2C51.1 107.8 34.8 105.7 20 110.8V82.5Z" />
            <path className="welcome-mark-page" d="M124 82.5C109 77.2 92.6 78.6 75.5 91.6V119.2C92.9 107.8 109.2 105.7 124 110.8V82.5Z" />
            <path className="welcome-mark-line" d="M72 93V119" />
            <path className="welcome-mark-path" d="M72 91.5C72 73.5 66.6 67.8 69.6 54.8C71.4 46.8 76.2 39.1 80.8 32.2" />
            <g className="welcome-mark-steps">
              <path d="M59.2 69.8C55.8 68.4 54.4 64.3 56.1 60.4C57.5 57.2 60.4 55.4 62.8 56.5C65.5 57.7 66.2 61.3 64.6 64.8C63.1 68.2 61 70.6 59.2 69.8Z" />
              <path d="M80.9 55.3C77.6 54.1 76.1 50.1 77.6 46.1C78.9 42.7 81.7 40.8 84.2 41.8C86.9 42.9 87.8 46.4 86.3 50C85 53.5 82.7 56 80.9 55.3Z" />
            </g>
          </svg>
          <strong>Passage Walk</strong>
          <span>WALK · READ · REFLECT</span>
        </div>
      </div>

      <div className="welcome-copy">
        <span>YOUR STEPS, GOD'S WORD</span>
        <h1>Welcome</h1>
        <p>Every step can lead you deeper into scripture. Create an account to begin your journey, or log in to continue your walk.</p>
      </div>

      <div className="welcome-actions">
        <button type="button" className="welcome-primary" onClick={onCreateAccount}>
          <span>Create Account</span>
          <AppIcon name="chevron" />
        </button>
        <button type="button" className="welcome-secondary" onClick={onSignIn}>Log In</button>
        <button type="button" className="welcome-learn" onClick={onLearnMore}>New here? <strong>Learn how Passage Walk works</strong><AppIcon name="chevron" /></button>
      </div>
    </div>
  );
}
