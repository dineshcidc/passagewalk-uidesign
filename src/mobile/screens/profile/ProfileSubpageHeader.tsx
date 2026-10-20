import AppIcon from "../../components/AppIcon";

export default function ProfileSubpageHeader({ title, onBack, backLabel = "Back to You" }: { title: string; onBack: () => void; backLabel?: string }) {
  return (
    <header className="profile-subpage-header">
      <button onClick={onBack} aria-label={backLabel}><AppIcon name="back" /></button>
      <strong>{title}</strong>
      <span></span>
    </header>
  );
}
