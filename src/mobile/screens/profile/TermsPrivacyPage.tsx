import { useState } from "react";
import AppIcon from "../../components/AppIcon";
import ProfileSubpageHeader from "./ProfileSubpageHeader";

function LegalDocumentPage({ type, onBack }: { type: "terms" | "privacy"; onBack: () => void }) {
  const isTerms = type === "terms";
  return (
    <div className="profile-subpage">
      <ProfileSubpageHeader title={isTerms ? "Terms of Use" : "Privacy Policy"} onBack={onBack} />
      <article className="legal-document">
        <span>LAST UPDATED · OCTOBER 2026</span>
        <h1>{isTerms ? "Terms of Use" : "Privacy Policy"}</h1>
        <p>{isTerms
          ? "These terms explain the simple guidelines for using Passage Walk and participating in your devotional journey."
          : "This policy explains how Passage Walk handles the information you provide while using the app."}</p>
        <section>
          <h2>{isTerms ? "Using Passage Walk" : "Information we collect"}</h2>
          <p>{isTerms
            ? "Passage Walk is intended for personal devotional use. Please use the app respectfully and provide accurate account information."
            : "We use basic account details, journey progress, step entries, and reflections to provide and personalize your experience."}</p>
        </section>
        <section>
          <h2>{isTerms ? "Your journey content" : "How information is used"}</h2>
          <p>{isTerms
            ? "You remain responsible for the reflections and other personal content you add to your journey."
            : "Your information supports app functionality, saves your progress, and helps us improve Passage Walk. We do not sell your personal information."}</p>
        </section>
        <section>
          <h2>{isTerms ? "Changes and availability" : "Your choices"}</h2>
          <p>{isTerms
            ? "Features may evolve as Passage Walk improves. Continued use of the app means you accept the current terms."
            : "You may update your profile information and reminder preferences at any time from the Profile menu."}</p>
        </section>
      </article>
    </div>
  );
}

export default function TermsPrivacyPage({ onBack }: { onBack: () => void }) {
  const [document, setDocument] = useState<"terms" | "privacy" | null>(null);

  if (document) return <LegalDocumentPage type={document} onBack={() => setDocument(null)} />;

  return (
    <div className="profile-subpage">
      <ProfileSubpageHeader title="Terms and Privacy" onBack={onBack} />
      <div className="terms-privacy-content">
        <div className="profile-subpage-intro">
          <span>LEGAL INFORMATION</span>
          <h1>Clear and transparent</h1>
          <p>Read how Passage Walk works and how your information is handled.</p>
        </div>
        <section className="terms-privacy-list">
          <button onClick={() => setDocument("terms")}>
            <span><AppIcon name="info" /></span>
            <div><strong>Terms of Use</strong><p>Guidelines for using Passage Walk</p></div>
            <i><AppIcon name="chevron" /></i>
          </button>
          <button onClick={() => setDocument("privacy")}>
            <span><AppIcon name="shield" /></span>
            <div><strong>Privacy Policy</strong><p>How your information is protected</p></div>
            <i><AppIcon name="chevron" /></i>
          </button>
        </section>
      </div>
    </div>
  );
}
