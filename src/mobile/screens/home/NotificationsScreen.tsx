import { useState } from "react";
import AppIcon from "../../components/AppIcon";
import { getNotifications, isNotificationRead, markAllNotificationsRead, markNotificationRead, type AppNotification, type NotificationAction } from "../../data/notifications";

const groups: { key: AppNotification["group"]; label: string }[] = [
  { key: "attention", label: "Needs your attention" },
  { key: "earlier", label: "Earlier" },
];

// Small category tag shown above each title, from the notification id ("pending-4" → Reflection).
const tags: Record<string, string> = { today: "Today's walk", pending: "Reflection", next: "Milestone", missed: "Missed day", badge: "Badge earned", complete: "Walk complete" };

// Bell on Home → this page. Tapping a notification marks it read and opens the screen it points to.
export default function NotificationsScreen({ onBack, onOpen }: { onBack: () => void; onOpen: (action: NotificationAction) => void }) {
  const [, setRevision] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const notifications = getNotifications();
  const unread = notifications.filter((item) => !isNotificationRead(item.id)).length;
  const visible = filter === "unread" ? notifications.filter((item) => !isNotificationRead(item.id)) : notifications;

  const open = (item: AppNotification) => {
    markNotificationRead(item.id);
    onOpen(item.action);
  };

  const markAll = () => {
    markAllNotificationsRead();
    setRevision((value) => value + 1);
  };

  return (
    <div className="profile-subpage notifications-screen">
      <header className="profile-subpage-header notifications-header">
        <button onClick={onBack} aria-label="Back to Home"><AppIcon name="back" /></button>
        <strong>Notifications</strong>
        <button className="notifications-mark-all" onClick={markAll} disabled={unread === 0} aria-label="Mark all as read" title="Mark all as read">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m2.5 12.5 4 4 8-9" /><path d="m11 16.5 1 0 8.5-9" /></svg>
        </button>
      </header>

      <div className="notifications-content">
        <div className="notifications-tabs" role="tablist" aria-label="Filter notifications">
          <button role="tab" aria-selected={filter === "all"} className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All <i>{notifications.length}</i></button>
          <button role="tab" aria-selected={filter === "unread"} className={filter === "unread" ? "active" : ""} onClick={() => setFilter("unread")}>Unread <i>{unread}</i></button>
        </div>

        {visible.length === 0 ? (
          <section className="notifications-empty">
            <i><AppIcon name="check" /></i>
            <strong>{filter === "unread" ? "No unread notifications" : "No notifications yet"}</strong>
            <p>{filter === "unread" ? "You've read everything. We'll let you know when something new comes up." : "We'll let you know when it's time to walk, read and reflect."}</p>
          </section>
        ) : groups.map(({ key, label }) => {
          const items = visible.filter((item) => item.group === key);
          if (!items.length) return null;
          return (
            <section className="notifications-group" key={key}>
              <div className="notifications-group-label"><span>{label}</span><i>{items.length}</i></div>
              <div className="notifications-list">
                {items.map((item) => {
                  const isUnread = !isNotificationRead(item.id);
                  return (
                    <button className={`notification-row ${item.tone} ${isUnread ? "unread" : "read"}`} onClick={() => open(item)} key={item.id}>
                      <i className="notification-icon"><AppIcon name={item.icon} /></i>
                      <span className="notification-main">
                        <span className="notification-meta">
                          <em>{tags[item.id.split("-")[0]] ?? "Update"}</em>
                          <small>{item.when}{isUnread && <b aria-label="Unread"></b>}</small>
                        </span>
                        <strong>{item.title}</strong>
                        <span className="notification-body">{item.body}</span>
                        <span className="notification-cta">{item.actionLabel}<AppIcon name="chevron" /></span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
