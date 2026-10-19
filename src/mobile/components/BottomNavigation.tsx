import type { MainTab } from "../types";
import AppIcon from "./AppIcon";

const mainNavigation = [
  { id: "home" as MainTab, label: "Home", icon: "home" as const },
  { id: "journey" as MainTab, label: "Journey", icon: "journey" as const },
  { id: "journal" as MainTab, label: "Journal", icon: "journal" as const },
  { id: "milestones" as MainTab, label: "Milestones", icon: "milestones" as const },
  { id: "profile" as MainTab, label: "Profile", icon: "profile" as const },
];

export default function BottomNavigation({ active, onSelect }: { active: MainTab; onSelect: (tab: MainTab) => void }) {
  return (
    <div className="home-bottom-nav">
      <div className="home-nav-surface">
        {mainNavigation.map((item) => (
          <button className={item.id === active ? "active" : ""} onClick={() => onSelect(item.id)} key={item.id}>
            <span className="home-nav-icon"><AppIcon name={item.icon} /></span>
            <span className="home-nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
