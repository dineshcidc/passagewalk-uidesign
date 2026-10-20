import { BIBLE_VERSION } from "../data/bible";
import { bibleVersions, VERSION_SAMPLE } from "../data/bibleVersions";

// The Bible version picker (journey setup, Settings, Reading screen sheet). King James is selected and is the
// only version in the app for now; the client's other versions are listed as "Coming soon".
export default function BibleVersionList({ preview = true }: { preview?: boolean }) {
  return (
    <div className="bible-version-picker">
      {preview && (
        <figure className="bible-version-preview">
          <span>PREVIEW · {BIBLE_VERSION.short}</span>
          <blockquote>“{VERSION_SAMPLE.text}”</blockquote>
          <figcaption>{VERSION_SAMPLE.reference} · {BIBLE_VERSION.name}</figcaption>
        </figure>
      )}
      <div className="bible-version-list" role="radiogroup" aria-label="Bible version">
        {bibleVersions.map((version) => {
          const selected = version.short === BIBLE_VERSION.short;
          return (
            <button
              className={`bible-version-option ${selected ? "selected" : ""} ${version.available ? "" : "soon"}`}
              role="radio"
              aria-checked={selected}
              disabled={!version.available}
              key={version.id}
            >
              <b>{version.short}</b>
              <div><strong>{version.name}</strong><p>{version.description}</p></div>
              {version.available ? <span className="journey-radio"><i></i></span> : <em>COMING SOON</em>}
            </button>
          );
        })}
      </div>
      <p className="bible-version-note">More versions are on the way. Your readings, highlights, and certificate verses use the version you choose.</p>
    </div>
  );
}
