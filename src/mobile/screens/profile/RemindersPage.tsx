import { useState } from "react";
import AppIcon from "../../components/AppIcon";
import ProfileSubpageHeader from "./ProfileSubpageHeader";

export default function RemindersPage({ onBack }: { onBack: () => void }) {
  const [scriptureReminder, setScriptureReminder] = useState(true);
  const [reflectionReminder, setReflectionReminder] = useState(true);
  const [scriptureTime, setScriptureTime] = useState("8:00 AM");
  const [reflectionTime, setReflectionTime] = useState("8:00 PM");
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const reminderTimes = ["6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM"];

  const saveReminders = () => {
    setSaved(true);
    setDirty(false);
    window.setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="profile-subpage">
      <ProfileSubpageHeader title="Reminders" onBack={onBack} />
      <div className="reminders-content">
        <div className="profile-subpage-intro">
          <span>DAILY RHYTHM</span>
          <h1>Stay connected to your journey</h1>
          <p>Choose when you would like a gentle reminder to pause, read, and reflect.</p>
        </div>

        <section className="reminder-card">
          <div className="reminder-card-heading">
            <div><strong>Daily Scripture Reminder</strong><p>Remind me to complete today&apos;s scripture</p></div>
            <button
              className={`reminder-switch ${scriptureReminder ? "on" : ""}`}
              onClick={() => {
                setScriptureReminder((enabled) => !enabled);
                setDirty(true);
                setSaved(false);
              }}
              role="switch"
              aria-checked={scriptureReminder}
              aria-label="Daily Scripture Reminder"
            ><i></i></button>
          </div>
          <label className="reminder-time">
            <span>Reminder time</span>
            <select value={scriptureTime} onChange={(event) => {
              setScriptureTime(event.target.value);
              setDirty(true);
              setSaved(false);
            }} disabled={!scriptureReminder}>
              {reminderTimes.map((time) => <option key={time}>{time}</option>)}
            </select>
          </label>
        </section>

        <section className="reminder-card">
          <div className="reminder-card-heading">
            <div><strong>Reflection Reminder</strong><p>Remind me to complete today&apos;s reflection</p></div>
            <button
              className={`reminder-switch ${reflectionReminder ? "on" : ""}`}
              onClick={() => {
                setReflectionReminder((enabled) => !enabled);
                setDirty(true);
                setSaved(false);
              }}
              role="switch"
              aria-checked={reflectionReminder}
              aria-label="Reflection Reminder"
            ><i></i></button>
          </div>
          <label className="reminder-time">
            <span>Reminder time</span>
            <select value={reflectionTime} onChange={(event) => {
              setReflectionTime(event.target.value);
              setDirty(true);
              setSaved(false);
            }} disabled={!reflectionReminder}>
              {reminderTimes.map((time) => <option key={time}>{time}</option>)}
            </select>
          </label>
        </section>

        {saved && <div className="reminders-saved">Your reminder preferences have been saved.</div>}
        <button className="reminders-save" onClick={saveReminders} disabled={!dirty}>Save Reminders</button>
      </div>
    </div>
  );
}
