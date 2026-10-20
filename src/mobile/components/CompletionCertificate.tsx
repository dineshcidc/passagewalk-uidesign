import { BIBLE_VERSION } from "../data/bible";
import { formatCount } from "../data/journeyPlans";
import type { MilestoneInfo } from "../data/milestones";
import { getFullName } from "../data/user";

// Certificate of Completion — layout from Kathy's journal certificates: blackletter title, "Be it known to all that",
// the name on a line over a faded day-number seal, the walk, a scripture and Kathy Boswell's PassageWalk signature.
// Used on the milestone achievement page and the Journey Complete demo.
export default function CompletionCertificate({ day, completedOn, info }: { day: number; completedOn?: string; info: MilestoneInfo }) {
  return (
    <article className="completion-certificate">
      <div className="completion-certificate-frame">
        <h2>Certificate of Completion</h2>
        <p className="cc-known">Be it known to all that</p>
        <div className="cc-name">
          <span className="cc-seal" aria-hidden="true"><b>{formatCount(day)}</b></span>
          <strong>{getFullName()}</strong>
        </div>
        <p className="cc-line">{info.certificateLine}</p>
        <div className="cc-bottom">
          <blockquote>
            <p>{info.verse.text}</p>
            <cite>~ {info.verse.reference}<br />({BIBLE_VERSION.name})</cite>
          </blockquote>
          <div className="cc-sign">
            <span>KATHY BOSWELL</span>
            <strong>PassageWalk<sup>®</sup></strong>
            <small>Completed {completedOn}</small>
          </div>
        </div>
      </div>
      <small className="cc-copyright">© 2009–2013 Kathy Boswell, All Rights Reserved.</small>
    </article>
  );
}
