import type { AppIconName } from "../components/AppIcon";
import { getChapter } from "./chapters";
import { formatCount, plural } from "./journeyPlans";
import { getMilestoneInfo } from "./milestones";
import { getActivePlan, getDayDate } from "./journeyStore";
import { getDayStatus, getMilestoneDate, getPendingDays, getProgress, getTodayDay, getUnlockedMilestones } from "./progress";

// Bell + Notifications page (client slide 19). Built from the live journey data, so a notification
// goes away once the user acts on it (e.g. saving the pending reflection removes "Reflection not added").
export type NotificationAction =
  | { kind: "entry"; journeyDay?: number }
  | { kind: "reflection"; journeyDay: number }
  | { kind: "milestones" };

export type AppNotification = {
  id: string;
  group: "attention" | "earlier";
  tone: "teal" | "gold" | "red" | "green";
  icon: AppIconName;
  title: string;
  body: string;
  when: string;
  action: NotificationAction;
  actionLabel: string;
};

const dateLabel = (journeyDay: number) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(getDayDate(journeyDay));

// Read state belongs to the active journey. Prototype: each journey starts with the top 3 unread
// and the older ones already read; anything that arrives later starts unread.
const DEFAULT_UNREAD = 3;
let readPlan: ReturnType<typeof getActivePlan> | null = null;
let readIds = new Set<string>();
function readState() {
  if (getActivePlan() !== readPlan) {
    readPlan = getActivePlan();
    readIds = new Set(getNotifications().slice(DEFAULT_UNREAD).map((item) => item.id));
  }
  return readIds;
}

export function getNotifications(): AppNotification[] {
  const today = getTodayDay();
  const progress = getProgress();
  const list: AppNotification[] = [];
  const todayStatus = getDayStatus(today);

  if (todayStatus === "not-entered") {
    list.push({
      id: `today-${today}`, group: "attention", tone: "teal", icon: "steps",
      title: "Today's walk is waiting",
      body: `Enter your steps to unlock your Day ${formatCount(today)} passage.`,
      when: "Today", action: { kind: "entry" }, actionLabel: "Enter Steps",
    });
  }
  if (todayStatus === "complete") {
    list.push({
      id: `complete-${today}`, group: "earlier", tone: "green", icon: "check",
      title: "Today's walk is complete",
      body: `Day ${formatCount(today)} is done. Keep moving — you're building a strong habit!`,
      when: "Today", action: { kind: "milestones" }, actionLabel: "See Milestones",
    });
  }
  getPendingDays().forEach((journeyDay) => {
    list.push({
      id: `pending-${journeyDay}`, group: "attention", tone: "gold", icon: "edit",
      title: "Reflection not added",
      body: `${getChapter(journeyDay)?.reference ?? `Day ${journeyDay}`} is waiting for your reflection.`,
      when: journeyDay === today ? "Today" : dateLabel(journeyDay), action: { kind: "reflection", journeyDay }, actionLabel: "Write Reflection",
    });
  });
  if (progress.daysToGo > 0) {
    list.push({
      id: `next-${progress.nextMilestone}-${progress.completedDays}`, group: "attention", tone: "gold", icon: "spark",
      title: `${plural(progress.daysToGo, "day")} to the ${getMilestoneInfo(progress.nextMilestone).shortName}`,
      body: "Complete your next reflection to keep moving toward it.",
      when: "Today", action: { kind: "milestones" }, actionLabel: "View Milestones",
    });
  }
  for (let day = today - 1; day >= 1; day -= 1) {
    if (getDayStatus(day) !== "missed") continue;
    list.push({
      id: `missed-${day}`, group: "attention", tone: "red", icon: "alert",
      title: `You missed Day ${formatCount(day)}`,
      body: `No steps were entered on ${dateLabel(day)}. You can still catch up.`,
      when: dateLabel(day), action: { kind: "entry", journeyDay: day }, actionLabel: "Catch Up",
    });
  }
  [...getUnlockedMilestones()].reverse().forEach((milestoneDay) => {
    const earnedOn = getMilestoneDate(milestoneDay);
    list.push({
      id: `badge-${milestoneDay}`, group: "earlier", tone: "green", icon: "milestones",
      title: `You earned the ${getMilestoneInfo(milestoneDay).shortName} badge`,
      body: milestoneDay === 1 ? "Your first step is complete. I'm proud of you!" : `Day ${formatCount(milestoneDay)} is complete — your certificate is ready. I'm proud of you!`,
      when: earnedOn ? earnedOn.replace(/, \d{4}$/, "").replace(/^(\w{3})\w*/, "$1") : "Earlier", action: { kind: "milestones" }, actionLabel: "View Badge",
    });
  });
  return list;
}

export const isNotificationRead = (id: string) => readState().has(id);
export const markNotificationRead = (id: string) => { readState().add(id); };
export const markAllNotificationsRead = () => getNotifications().forEach((item) => readState().add(item.id));
export const getUnreadCount = () => getNotifications().filter((item) => !readState().has(item.id)).length;
