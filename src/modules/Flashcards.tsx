import { useMemo, useState } from 'react';
import { MathText } from '../components/MathText';
import { DECK_LABELS, FLASHCARDS, prioritize, type Deck, type Flashcard } from '../data/flashcards';
import { getProgress, recordCard, toggleBookmark, useProgress } from '../lib/progress';

export function Flashcards() {
  const progress = useProgress();
  const [deck, setDeck] = useState<Deck | 'all'>('shortcut');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [session, setSession] = useState(0);

  const cards = progress.cards ?? {};
  const bookmarks = progress.bookmarks ?? [];
  const pool = FLASHCARDS.filter((c) => (deck === 'all' || c.deck === deck) && (!bookmarkedOnly || bookmarks.includes(c.id)));
  const struggling = pool.filter((c) => cards[c.id] && cards[c.id].missed > 0 && cards[c.id].streak < 2).length;
  const known = pool.filter((c) => cards[c.id] && cards[c.id].streak >= 2).length;
  const unseen = pool.filter((c) => !cards[c.id]).length;

  return (
    <div className="module">
      <header className="module-head">
        <h2>Shortcut Flashcards</h2>
        <p className="lede">Cards you miss come back first, both later in this session and next time. Your answers are saved in this browser.</p>
      </header>
      <div className="filter-bar">
        <label>
          <span>Deck</span>
          <select value={deck} onChange={(e) => setDeck(e.target.value as Deck | 'all')}>
            <option value="all">All cards ({FLASHCARDS.length})</option>
            {(Object.keys(DECK_LABELS) as Deck[]).map((d) => (
              <option key={d} value={d}>
                {DECK_LABELS[d]} ({FLASHCARDS.filter((c) => c.deck === d).length})
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="toggle">
        <input type="checkbox" checked={bookmarkedOnly} onChange={(e) => setBookmarkedOnly(e.target.checked)} /> Bookmarked cards only
      </label>
      <p className="counter">
        {pool.length} cards · {struggling} need practice · {known} known · {unseen} unseen
      </p>
      {pool.length === 0 ? (
        <p className="empty">{bookmarkedOnly ? 'No bookmarked cards in this deck yet. Use ☆ Bookmark on a card.' : 'No cards.'}</p>
      ) : (
        <CardSession key={`${deck}-${bookmarkedOnly}-${session}`} pool={pool} onRestart={() => setSession((n) => n + 1)} />
      )}
    </div>
  );
}

function CardSession({ pool, onRestart }: { pool: Flashcard[]; onRestart: () => void }) {
  // Order is fixed at session start from saved review history.
  const initial = useMemo(() => prioritize(pool, getProgress().cards ?? {}).map((c) => c.id), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [queue, setQueue] = useState(initial);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const progress = useProgress();
  const byId = useMemo(() => Object.fromEntries(pool.map((c) => [c.id, c])), [pool]);

  if (!queue.length) {
    return (
      <div className="card">
        <p>Session complete: {done} cards reviewed.</p>
        <button className="btn btn-primary" onClick={onRestart}>
          Start another round
        </button>
      </div>
    );
  }

  const card = byId[queue[0]];
  const marked = (progress.bookmarks ?? []).includes(card.id);

  function answer(knew: boolean) {
    recordCard(card.id, knew);
    setDone((n) => n + 1);
    setFlipped(false);
    setQueue((q) => {
      const rest = q.slice(1);
      if (knew) return rest;
      // Missed: see it again a few cards later in this session.
      const at = Math.min(3, rest.length);
      return [...rest.slice(0, at), card.id, ...rest.slice(at)];
    });
  }

  return (
    <div className="round">
      <p className="counter">
        {queue.length} left in this round · {done} reviewed
      </p>
      <button className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped((f) => !f)} aria-label={flipped ? 'Card back. Select to see the front.' : 'Card front. Select to flip.'}>
        <span className="flashcard-side">{flipped ? 'Back' : 'Front'}</span>
        <span className="flashcard-text">
          <MathText text={flipped ? card.back : card.front} roomy />
        </span>
      </button>
      <div className="actions">
        {!flipped ? (
          <button className="btn btn-primary" onClick={() => setFlipped(true)}>
            Flip card
          </button>
        ) : (
          <>
            <button className="btn btn-primary" onClick={() => answer(true)}>
              I Knew This
            </button>
            <button className="btn" onClick={() => answer(false)}>
              Need More Practice
            </button>
          </>
        )}
        <button className="btn" aria-pressed={marked} onClick={() => toggleBookmark(card.id)}>
          {marked ? '★ Bookmarked' : '☆ Bookmark'}
        </button>
        <a className="btn" href={card.practice.href}>
          Practice an Example
        </a>
      </div>
    </div>
  );
}
