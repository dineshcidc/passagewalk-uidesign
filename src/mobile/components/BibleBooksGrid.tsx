import { bibleBooks } from "../data/bibleBooks";

// The 66 books in Bible order (Old Testament 39, New Testament 27). Helps users learn where each reading sits.
// current = today's book (gold), visited = books already read (teal), finished = every chapter read.
export default function BibleBooksGrid({
  current = null,
  visited = [],
  finished = [],
  compact = false,
}: {
  current?: number | null;
  visited?: number[];
  finished?: number[];
  compact?: boolean;
}) {
  const groups = [
    { label: "OLD TESTAMENT", count: 39, books: bibleBooks.slice(0, 39).map((book, index) => ({ book, index })) },
    { label: "NEW TESTAMENT", count: 27, books: bibleBooks.slice(39).map((book, index) => ({ book, index: index + 39 })) },
  ];

  return (
    <div className="bible-books-map">
      <div className={`bible-books-grid ${compact ? "compact" : ""}`} aria-label="The 66 books of the Bible">
        {groups.map((group) => (
          <div className="bible-books-group" key={group.label}>
            <span>{group.label} · {group.count}</span>
            <div>
              {group.books.map(({ book, index }) => {
                const state = index === current ? "current" : finished.includes(index) ? "finished" : visited.includes(index) ? "visited" : "";
                return <i className={state} title={book.name} key={book.name} />;
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="bible-books-legend">
        <span>Each box = 1 of the 66 books, in Bible order</span>
        {current !== null && <span><i className="current" />{bibleBooks[current].name}</span>}
        {visited.some((index) => index !== current && !finished.includes(index)) && <span><i className="visited" />Read</span>}
        {finished.some((index) => index !== current) && <span><i className="finished" />Finished</span>}
      </p>
    </div>
  );
}
