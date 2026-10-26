// Gold milestone medal for every Passage Walk milestone; purple (client accent) only for a finished Designed Experience.
// Locked badges show a padlock; large unlocked badges show the day number
// (Milestones grid, achievement page and the celebration screen).
export default function MilestoneBadge({ milestone, large = false, experience = false }: { milestone: { day: number; unlocked: boolean }; large?: boolean; experience?: boolean }) {
  const dayText = milestone.day.toLocaleString("en-US");
  return (
    <svg className={`milestone-badge${large ? " large" : ""}${experience ? " experience" : ""}`} viewBox="0 0 92 104" aria-hidden="true">
      <path className="milestone-ribbon-left" d="M31 58 18 94l21-10 7 15 7-41Z" />
      <path className="milestone-ribbon-right" d="m61 58 13 36-21-10-7 15-7-41Z" />
      <circle className="milestone-medal-rim" cx="46" cy="43" r="35" />
      <circle className="milestone-medal-inner" cx="46" cy="43" r="27" />
      {milestone.unlocked ? (
        large ? (
          <>
            <text className="milestone-day-number" x="46" y="47" textAnchor="middle" style={dayText.length > 3 ? { fontSize: 16 } : dayText.length > 2 ? { fontSize: 22 } : undefined}>{dayText}</text>
            <text className="milestone-day-label" x="46" y="58" textAnchor="middle">{milestone.day === 1 ? "DAY" : "DAYS"}</text>
            <path className="milestone-shine" d="M29 29c5-8 12-12 21-12" />
          </>
        ) : (
          <>
            <path className="milestone-path-mark" d="M31 55c4-14 8-23 16-23 7 0 5 12 13 12" />
            <circle className="milestone-path-dot" cx="31" cy="55" r="3" />
            <circle className="milestone-path-dot" cx="47" cy="32" r="3" />
            <circle className="milestone-path-dot" cx="60" cy="44" r="3" />
            <path className="milestone-shine" d="M29 29c5-8 12-12 21-12" />
          </>
        )
      ) : (
        <>
          <rect className="milestone-lock-body" x="34" y="41" width="24" height="20" rx="5" />
          <path className="milestone-lock-loop" d="M39 41v-5a7 7 0 0 1 14 0v5" />
          <circle className="milestone-lock-key" cx="46" cy="50" r="2" />
          <path className="milestone-lock-key" d="M46 52v4" />
        </>
      )}
    </svg>
  );
}
