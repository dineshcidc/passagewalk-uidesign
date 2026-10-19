import { useState } from "react";
import AppIcon from "../../components/AppIcon";
import BottomNavigation from "../../components/BottomNavigation";
import { getFullName, getUser, updateUser, type UserProfile } from "../../data/user";
import type { JourneyPlan, MainTab } from "../../types";
import AboutPassageWalkPage from "./AboutPage";
import HelpSupportPage from "./HelpSupportPage";
import MyProfilePage from "./MyProfilePage";
import RemindersPage from "./RemindersPage";
import SettingsPage from "./SettingsPage";
import TermsPrivacyPage from "./TermsPrivacyPage";

export default function ProfileScreen({
  onNavigate,
  onLogout,
  plan,
  onChangeJourney,
}: {
  onNavigate: (tab: MainTab) => void;
  onLogout: () => void;
  plan: JourneyPlan;
  onChangeJourney: (plan: JourneyPlan) => void;
}) {
  const [view, setView] = useState<"menu" | "my-profile" | "reminders" | "settings" | "help" | "about" | "legal">("menu");
  const [user, setUserState] = useState(getUser);
  // Profile edits go to the shared user store so Home, Welcome back and the certificate use them too.
  const setUser = (next: UserProfile) => {
    updateUser(next);
    setUserState(getUser());
  };
  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuItems = [
    { label: "My Profile", icon: "profile" as const, view: "my-profile" as const },
    { label: "Reminders", icon: "bell" as const, view: "reminders" as const },
    { label: "Settings", icon: "settings" as const, view: "settings" as const },
    { label: "Help & Support", icon: "help" as const, view: "help" as const },
    { label: "About Passage Walk", icon: "info" as const, view: "about" as const },
    { label: "Terms and Privacy", icon: "shield" as const, view: "legal" as const },
  ];

  if (view === "my-profile") return <MyProfilePage user={user} onUpdate={setUser} onBack={() => setView("menu")} />;
  if (view === "reminders") return <RemindersPage onBack={() => setView("menu")} />;
  if (view === "settings") return <SettingsPage plan={plan} onChangeJourney={onChangeJourney} onBack={() => setView("menu")} />;
  if (view === "help") return <HelpSupportPage onBack={() => setView("menu")} />;
  if (view === "about") return <AboutPassageWalkPage onBack={() => setView("menu")} />;
  if (view === "legal") return <TermsPrivacyPage onBack={() => setView("menu")} />;

  return (
    <div className="profile-screen">
      <section className="profile-hero">
        <span className="profile-page-label">MY PROFILE</span>
        <button className="profile-avatar" onClick={() => setView("my-profile")} aria-label="Open my profile">
          <img src={user.photo} alt={`${user.firstName}'s profile`} />
          <i><AppIcon name="camera" /></i>
        </button>
        <h1>{getFullName(user)}</h1>
        <p>{user.email}</p>
      </section>

      <div className="profile-content">
        <nav className="profile-menu-card" aria-label="Profile options">
          {menuItems.map((item) => (
            <button onClick={() => item.view && setView(item.view)} key={item.label}>
              <span className="profile-menu-icon"><AppIcon name={item.icon} /></span>
              <strong>{item.label}</strong>
              <i><AppIcon name="chevron" /></i>
            </button>
          ))}
        </nav>

        <button className="profile-logout" onClick={() => setShowLogout(true)}>
          <span><AppIcon name="logout" /></span>
          Log Out
        </button>
      </div>

      <BottomNavigation active="profile" onSelect={onNavigate} />

      {showLogout && (
        <div className="logout-backdrop" onClick={() => setShowLogout(false)}>
          <section className="logout-dialog" role="dialog" aria-modal="true" aria-labelledby="logout-title" onClick={(event) => event.stopPropagation()}>
            <div className="logout-dialog-icon"><AppIcon name="logout" /></div>
            <h2 id="logout-title">Log out?</h2>
            <p>Are you sure you want to log out of Passage Walk?</p>
            <div>
              <button onClick={() => setShowLogout(false)} disabled={loggingOut}>Cancel</button>
              <button
                disabled={loggingOut}
                onClick={() => {
                  setLoggingOut(true);
                  window.setTimeout(onLogout, 900);
                }}
              >
                {loggingOut && <i className="logout-spinner"></i>}
                {loggingOut ? "Logging out..." : "Log Out"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
