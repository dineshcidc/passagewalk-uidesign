import { useState } from "react";
import AppIcon from "../../components/AppIcon";
import ProfileSubpageHeader from "./ProfileSubpageHeader";

function FrequentlyAskedQuestions({ onBack }: { onBack: () => void }) {
  const [openQuestion, setOpenQuestion] = useState<number | null>(0);
  // Client feedback 2026-11-19 (tracker row 86): new short answers, "How are passages chosen?", new "How do journeys work?".
  const questions = [
    {
      question: "How does PassageWalk work?",
      answer: "PassageWalk combines movement, Scripture, and reflection into a daily journey. Enter your steps, receive a passage, and reflect on what stands out along the way.",
    },
    {
      question: "How are passages chosen?",
      answer: "Passages are selected based on the journey you've chosen. Each experience is designed to guide you through Scripture in a unique and meaningful way.",
    },
    {
      question: "How do I enter my steps?",
      answer: "From the Home screen, enter your daily step count to continue your journey and receive your next passage.",
    },
    {
      question: "How do I complete a journey day?",
      answer: "Complete your daily passage and reflection after entering your steps.",
    },
    {
      question: "How do I add a reflection?",
      answer: "After reading your passage, capture the thoughts, insights, or questions that Scripture inspires.",
    },
    {
      question: "How do journeys work?",
      answer: "Choose from guided experiences, custom journeys, or a passage through the entire Bible. You can change journeys at any time.",
    },
    {
      question: "How do milestones and badges work?",
      answer: "PassageWalk celebrates your progress through milestones, badges, certificates, and completed journeys.",
    },
  ];

  return (
    <div className="profile-subpage">
      <ProfileSubpageHeader title="FAQs" onBack={onBack} />
      <div className="faq-content">
        <div className="profile-subpage-intro">
          <span>COMMON QUESTIONS</span>
          <h1>What can we help with?</h1>
          <p>Tap a question to reveal a quick answer.</p>
        </div>
        <section className="faq-list">
          {questions.map((item, index) => {
            const isOpen = openQuestion === index;
            return (
              <article className={isOpen ? "open" : ""} key={item.question}>
                <button onClick={() => setOpenQuestion(isOpen ? null : index)} aria-expanded={isOpen}>
                  <strong>{item.question}</strong>
                  <i></i>
                </button>
                {isOpen && <p>{item.answer}</p>}
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}

function ContactSupportPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="profile-subpage">
      <ProfileSubpageHeader title="Contact Support" onBack={onBack} />
      <div className="contact-support-content">
        <section className="contact-support-card">
          <div><AppIcon name="mail" /></div>
          <span>PASSAGEWALK SUPPORT</span>
          <h1>How can we help?</h1>
          <p>If you have a question or need assistance, our support team is here for you. We&apos;ll be happy to help you continue your journey.</p>
          <strong className="contact-support-email">support@passagewalk.com</strong>
          <button onClick={() => { window.location.href = "mailto:support@passagewalk.com"; }}>
            <AppIcon name="mail" />
            Email Support
          </button>
        </section>
      </div>
    </div>
  );
}

function ReportProblemPage({ onBack }: { onBack: () => void }) {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitReport = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="profile-subpage">
      <ProfileSubpageHeader title="Report a Problem" onBack={onBack} />
      <div className="report-problem-content">
        {submitted ? (
          <section className="report-success">
            <div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
            </div>
            <span>REPORT RECEIVED</span>
            <h1>Thanks! Your report has been submitted.</h1>
            <p>Our support team will review the details and use them to improve PassageWalk.</p>
            <button onClick={onBack}>Back to Help &amp; Support</button>
          </section>
        ) : (
          <form className="report-problem-form" onSubmit={submitReport}>
            <div className="profile-subpage-intro">
              <span>REPORT AN ISSUE</span>
              {/* Client feedback 2026-11-19 (tracker row 89). */}
              <h1>Something not working as expected?</h1>
              <p>Tell us what happened and we&apos;ll look into it.</p>
            </div>
            <label className="report-field">
              <span>Category <small>(Optional)</small></span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">Select a category</option>
                <option>Journey or steps</option>
                <option>Scripture or reflection</option>
                <option>Profile or reminders</option>
                <option>Something else</option>
              </select>
            </label>
            <label className="report-field">
              <span>Describe the issue</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe what happened and what you expected..."
                required
              ></textarea>
            </label>
            <button className="report-submit" type="submit" disabled={!description.trim()}>Submit Report</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function HelpSupportPage({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<"menu" | "faq" | "contact" | "report">("menu");
  const helpItems = [
    { label: "Frequently Asked Questions", detail: "Find quick answers about PassageWalk.", icon: "help" as const, view: "faq" as const },
    { label: "Contact Support", detail: "Send a message to our support team.", icon: "mail" as const, view: "contact" as const },
    { label: "Report a Problem", detail: "Tell us when something is not working.", icon: "alert" as const, view: "report" as const },
  ];

  if (view === "faq") return <FrequentlyAskedQuestions onBack={() => setView("menu")} />;
  if (view === "contact") return <ContactSupportPage onBack={() => setView("menu")} />;
  if (view === "report") return <ReportProblemPage onBack={() => setView("menu")} />;

  return (
    <div className="profile-subpage">
      <ProfileSubpageHeader title="Help & Support" onBack={onBack} />
      <div className="help-support-content">
        <div className="profile-subpage-intro">
          <span>WE&apos;RE HERE TO HELP</span>
          <h1>Need assistance?</h1>
          <p>Choose a topic below for answers, guidance, and support.</p>
        </div>
        <section className="help-support-list">
          {helpItems.map((item) => (
            <button onClick={() => setView(item.view)} key={item.label}>
              <span><AppIcon name={item.icon} /></span>
              <div><strong>{item.label}</strong><p>{item.detail}</p></div>
              <i><AppIcon name="chevron" /></i>
            </button>
          ))}
        </section>
      </div>
    </div>
  );
}
