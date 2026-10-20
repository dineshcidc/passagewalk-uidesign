import { useState } from "react";
import AppIcon from "../../components/AppIcon";
import ProfileSubpageHeader from "./ProfileSubpageHeader";

function PassageWalkLogo() {
  return (
    <svg className="about-passage-logo" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M8 35c8-3 15-2 23 4v17c-8-5-15-6-23-4V35Z" />
      <path d="M56 35c-8-3-15-2-23 4v17c8-5 15-6 23-4V35Z" />
      <path d="M32 39c0-10-3-13-1-20 1-5 4-9 7-13" />
      <path className="about-passage-step" d="M26 26c-2-1-3-4-2-6 1-2 3-3 4-2 2 1 2 3 1 5-1 2-2 4-3 3ZM39 17c-2-1-3-4-2-6 1-2 3-3 4-2 2 1 2 3 1 5-1 2-2 4-3 3Z" />
    </svg>
  );
}

export default function AboutPassageWalkPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="profile-subpage">
      <ProfileSubpageHeader title="About" onBack={onBack} />
      <div className="about-passage-content">
        <section className="about-passage-card">
          <div className="about-passage-mark"><PassageWalkLogo /></div>
          <h1>Passage Walk</h1>
          <span>WALK · READ · REFLECT</span>
          <p>Passage Walk connects your daily walking with scripture and reflection — over 33 days, through a Designed Experience, through books you choose, or across the whole Bible.</p>
        </section>

        {/* Kathy's "why PassageWalk" copy (client slide 22, draft until the final copy arrives). xx scriptures = 31,102 verses (KJV). */}
        <section className="about-why-card">
          <span>WHY PASSAGEWALK?</span>
          <h2>Every step leads to a passage</h2>
          <blockquote>
            <p>If you are wondering why it&apos;s called PassageWalk, let me explain. Most people know the word Bible. The Christian Bible has 66 books, 1,189 chapters and 31,102 verses — and every verse is a passage.</p>
            <p>Each day, the steps you take lead you to one of those passages. That&apos;s a PassageWalk.</p>
            <cite>— Kathy Boswell</cite>
          </blockquote>
          <div className="about-why-stats">
            <div><strong>66</strong><span>books</span></div>
            <div><strong>1,189</strong><span>chapters</span></div>
            <div><strong>31,102</strong><span>verses</span></div>
          </div>
        </section>

        <div className="about-version">
          <span>APP VERSION</span>
          <strong>Version 1.0.0</strong>
        </div>
      </div>
    </div>
  );
}
