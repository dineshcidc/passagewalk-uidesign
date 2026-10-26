import type { DayVerse } from "../data/chapters";
import AppIcon from "./AppIcon";

// Shared "Your Highlighted Verses" block — Write Reflection and the Journal entry page.
// onReadChapter adds the Edit / Read Chapter actions; verseLabel sets the tag beside each verse
// (default: "7" on a one-chapter day, "2:7" when the day reads several chapters).
export default function HighlightedVersesCard({
  reference,
  verses,
  onReadChapter,
  className = "",
  verseLabel = (verse) => verse.tag,
  readLabel = "Read Chapter",
}: {
  reference: string;
  verses: DayVerse[];
  onReadChapter?: () => void;
  className?: string;
  verseLabel?: (verse: DayVerse) => string;
  readLabel?: string;
}) {
  return (
    <section className={`reflection-highlights-card ${verses.length === 0 ? "empty" : ""} ${className}`}>
      <div className="reflection-highlights-heading">
        <div>
          <span>YOUR HIGHLIGHTED VERSES</span>
          <strong>{verses.length > 0 ? `${verses.length} ${verses.length === 1 ? "verse" : "verses"} from ${reference}` : "Nothing highlighted yet"}</strong>
        </div>
        {verses.length > 0 && onReadChapter && (
          <button type="button" onClick={onReadChapter}>
            <AppIcon name="edit" />
            <span>Edit</span>
          </button>
        )}
      </div>
      {verses.length > 0 ? (
        <div className="reflection-highlight-list">
          {verses.map((verse) => (
            <div key={verse.key}><span>{verseLabel(verse)}</span><p>{verse.text}</p></div>
          ))}
        </div>
      ) : (
        <div className="reflection-highlights-empty">
          <div className="reflection-empty-spark"><AppIcon name="spark" /></div>
          <p>Open {readLabel === "Read Chapter" ? "the chapter" : "the chapters"} and tap the verses that speak to you.</p>
          {onReadChapter && (
            <button type="button" onClick={onReadChapter}>
              <AppIcon name="book" />
              <span>{readLabel}</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}
