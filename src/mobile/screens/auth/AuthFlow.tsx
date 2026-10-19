import { useState } from "react";
import IOSDeviceFrame from "../../components/IOSDeviceFrame";
import { ageRanges, birthMonths, genders, getUser, signUpUser } from "../../data/user";

type AuthView = "login" | "signup" | "forgot" | "reset";

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function AuthBrandMark() {
  return (
    <svg className="auth-brand-mark" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M8 35c8-3 15-2 23 4v17c-8-5-15-6-23-4V35Z" />
      <path d="M56 35c-8-3-15-2-23 4v17c8-5 15-6 23-4V35Z" />
      <path d="M32 39c0-10-3-13-1-20 1-5 4-9 7-13" />
      <path className="auth-brand-step" d="M26 26c-2-1-3-4-2-6 1-2 3-3 4-2 2 1 2 3 1 5-1 2-2 4-3 3ZM39 17c-2-1-3-4-2-6 1-2 3-3 4-2 2 1 2 3 1 5-1 2-2 4-3 3Z" />
    </svg>
  );
}

function FieldIcon({ type }: { type: "name" | "email" | "password" }) {
  const paths = {
    name: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
    email: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></>,
    password: <><rect x="4" y="10" width="16" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 15v2" /></>,
  };
  return (
    <span className="auth-field-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>
    </span>
  );
}

function AuthField({
  label,
  type,
  placeholder,
  autoComplete,
  onValueChange,
}: {
  label: string;
  type: "name" | "email" | "password";
  placeholder: string;
  autoComplete: string;
  onValueChange?: (value: string) => void;
}) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <label className="auth-field">
      <span>{label}</span>
      <div className="auth-input-wrap">
        <FieldIcon type={type} />
        <input
          type={isPassword && !passwordVisible ? "password" : type === "email" ? "email" : "text"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={onValueChange ? (event) => onValueChange(event.target.value) : undefined}
        />
        {isPassword && (
          <button
            type="button"
            className="auth-password-toggle"
            onClick={() => setPasswordVisible((visible) => !visible)}
            aria-label={passwordVisible ? "Hide password" : "Show password"}
          >
            <svg viewBox="0 0 20 20" width="16" height="16" preserveAspectRatio="xMidYMid meet" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {passwordVisible ? (
                <><path d="M2.2 10s2.9-4.6 7.8-4.6 7.8 4.6 7.8 4.6-2.9 4.6-7.8 4.6S2.2 10 2.2 10Z" /><circle cx="10" cy="10" r="2.2" /><path d="m3 3 14 14" /></>
              ) : (
                <><path d="M2.2 10s2.9-4.6 7.8-4.6 7.8 4.6 7.8 4.6-2.9 4.6-7.8 4.6S2.2 10 2.2 10Z" /><circle cx="10" cy="10" r="2.2" /></>
              )}
            </svg>
          </button>
        )}
      </div>
    </label>
  );
}

function AuthSelect({
  label,
  placeholder,
  options,
  value,
  onValueChange,
}: {
  label: string;
  placeholder: string;
  options: readonly string[];
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      <div className={`auth-input-wrap auth-select-wrap ${value ? "" : "empty"}`}>
        <select value={value} onChange={(event) => onValueChange(event.target.value)}>
          <option value="" disabled>{placeholder}</option>
          {options.map((option) => <option value={option} key={option}>{option}</option>)}
        </select>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </div>
    </label>
  );
}

const emptySignup = { firstName: "", lastName: "", email: "", password: "", confirm: "", ageRange: "", gender: "", birthMonth: "" };

// Log In → onLoggedIn (returning user); Create Account → onSignedUp with the entered first name (first-time user).
export default function AuthFlow({
  initialView,
  onLoggedIn,
  onSignedUp,
  onExit,
}: {
  initialView: "login" | "signup";
  onLoggedIn: () => void;
  onSignedUp: (name: string) => void;
  onExit: () => void;
}) {
  const [view, setView] = useState<AuthView>(initialView);
  const [signup, setSignup] = useState(emptySignup);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const isLogin = view === "login";
  const isSignup = view === "signup";
  const isForgot = view === "forgot";
  const isReset = view === "reset";
  // Prototype: Create Account is always enabled; the entered details (if any) fill the user profile.
  const updateSignup = (field: keyof typeof signup) => (value: string) => setSignup((current) => ({ ...current, [field]: value }));

  const navigateTo = (nextView: AuthView) => {
    setSignup(emptySignup);
    setTermsAccepted(false);
    setView(nextView);
  };

  const handleBack = () => {
    if (isLogin || isSignup) onExit();
    else if (isForgot) setView("login");
    else setView("forgot");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isForgot) {
      navigateTo("reset");
    } else if (isReset) {
      setResetComplete(true);
      navigateTo("login");
    } else {
      if (isSignup) {
        const { password: _password, confirm: _confirm, ...details } = signup;
        signUpUser(details);
        onSignedUp(getUser().firstName);
      } else onLoggedIn();
    }
  };

  const heading = isLogin
    ? { eyebrow: "CONTINUE YOUR JOURNEY", title: "Welcome back", body: "Log in to continue your daily walk with scripture." }
    : isSignup
      ? { eyebrow: "START YOUR JOURNEY", title: "Create your account", body: "Welcome to Passage Walk. Tell us a little about yourself to begin." }
      : isForgot
        ? { eyebrow: "ACCOUNT RECOVERY", title: "Forgot password?", body: "Enter the email connected to your account and we'll send you a secure reset link." }
        : { eyebrow: "SECURE YOUR ACCOUNT", title: "Reset password", body: "Choose a strong new password you haven't used for this account before." };

  const submitLabel = isLogin
    ? "Log In"
    : isSignup
      ? "Create Account"
      : isForgot
        ? "Send Reset Link"
        : "Reset Password";

  return (
    <IOSDeviceFrame statusBarStyle="light">
      <div className={`auth-screen auth-screen-${view}`} key={view}>
        <div className="auth-top">
          <button type="button" className="auth-back" onClick={handleBack} aria-label="Go back"><BackIcon /></button>
          <div className="auth-brand-name"><AuthBrandMark /><span>Passage Walk</span></div>
        </div>

        <div className="auth-content">
          <div className="auth-heading">
            <span>{heading.eyebrow}</span>
            <h1>{heading.title}</h1>
            <p>{heading.body}</p>
          </div>

          {resetComplete && isLogin && (
            <div className="auth-success-notice">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="10" cy="10" r="8" /><path d="m6.5 10 2.2 2.2 4.8-5" /></svg>
              <span>Password updated. You can now log in.</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {isSignup && (
              <div className="auth-field-row">
                <AuthField label="First Name" type="name" placeholder="First name" autoComplete="given-name" onValueChange={updateSignup("firstName")} />
                <AuthField label="Last Name" type="name" placeholder="Last name" autoComplete="family-name" onValueChange={updateSignup("lastName")} />
              </div>
            )}
            {(isLogin || isSignup || isForgot) && <AuthField label="Email Address" type="email" placeholder="you@example.com" autoComplete="email" onValueChange={isSignup ? updateSignup("email") : undefined} />}
            {(isLogin || isSignup || isReset) && (
              <AuthField
                label={isReset ? "New Password" : "Password"}
                type="password"
                placeholder={isLogin ? "Enter your password" : isReset ? "Enter a new password" : "Create a password"}
                autoComplete={isLogin ? "current-password" : "new-password"}
                onValueChange={isSignup ? updateSignup("password") : undefined}
              />
            )}
            {(isSignup || isReset) && <AuthField label="Confirm Password" type="password" placeholder="Repeat your password" autoComplete="new-password" onValueChange={isSignup ? updateSignup("confirm") : undefined} />}
            {isSignup && (
              <>
                <div className="auth-field-row">
                  <AuthSelect label="Age Range" placeholder="Select" options={ageRanges} value={signup.ageRange} onValueChange={updateSignup("ageRange")} />
                  <AuthSelect label="Gender" placeholder="Select" options={genders} value={signup.gender} onValueChange={updateSignup("gender")} />
                </div>
                <AuthSelect label="Birthday Month" placeholder="Select your birthday month" options={birthMonths} value={signup.birthMonth} onValueChange={updateSignup("birthMonth")} />
              </>
            )}
            {isLogin ? (
              <button type="button" className="forgot-password" onClick={() => navigateTo("forgot")}>Forgot password?</button>
            ) : isSignup ? (
              <label className="terms-check">
                <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} />
                <span className="terms-box"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3.5 8 3 3 6-6" /></svg></span>
                <span>I agree to the <strong>Terms</strong> and <strong>Privacy Policy</strong>.</span>
              </label>
            ) : null}

            <button type="submit" className="auth-submit">
              <span>{submitLabel}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5" /></svg>
            </button>

            {isLogin && (
              <button type="button" className="auth-switch" onClick={() => navigateTo("signup")}>
                New to Passage Walk?<strong>Create an account</strong>
              </button>
            )}
            {isSignup && (
              <button type="button" className="auth-switch" onClick={() => navigateTo("login")}>
                Already have an account?<strong>Log In</strong>
              </button>
            )}
            {(isForgot || isReset) && (
              <button type="button" className="auth-switch" onClick={() => navigateTo("login")}>
                Remember your password?<strong>Log In</strong>
              </button>
            )}
          </form>
        </div>
      </div>
    </IOSDeviceFrame>
  );
}
