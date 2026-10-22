import { useEffect, useMemo, useRef, useState } from 'react';
import { Exercise } from '../components/Exercise';
import { MathText } from '../components/MathText';
import { QuestionSolver } from '../components/QuestionSolver';
import { Steps } from '../components/ui';
import { LESSON_BY_ID } from '../data/library';
import { href, questionsForShortcut } from '../data/links';
import { QUESTION_BY_ID } from '../data/questions';
import { SHORTCUT_BY_ID, SHORTCUTS, type Shortcut } from '../data/shortcuts';
import { toggleBookmark, useProgress } from '../lib/progress';

export function searchShortcuts(query: string, topic = 'all'): Shortcut[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return SHORTCUTS.filter((s) => {
    if (topic !== 'all' && s.topic !== topic) return false;
    const hay = [s.name, s.topic, s.clue, s.rule, s.whenUse, ...s.tags, ...s.symbols.map((x) => `${x.symbol} ${x.meaning}`)].join(' ').toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

export function Vault({ shortcutId, practice }: { shortcutId?: string; practice?: boolean }) {
  if (shortcutId && SHORTCUT_BY_ID[shortcutId]) return <ShortcutPage s={SHORTCUT_BY_ID[shortcutId]} practice={!!practice} />;
  return <VaultIndex missing={shortcutId} />;
}

function VaultIndex({ missing }: { missing?: string }) {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('all');
  const progress = useProgress();
  const topics = useMemo(() => [...new Set(SHORTCUTS.map((s) => s.topic))], []);
  const results = searchShortcuts(query, topic);
  const bookmarks = progress.bookmarks ?? [];

  return (
    <div className="module">
      <header className="module-head">
        <h2>Shortcut &amp; Formula Vault</h2>
        <p className="lede">
          {SHORTCUTS.length} widely reusable GRE shortcuts. Search by name, formula, concept, or the clue you see in a question. Every card says when NOT to use the shortcut.
        </p>
      </header>
      {missing && <p className="invalid">That shortcut was not found.</p>}
      <div className="search-row">
        <label className="sr-only" htmlFor="vault-search">
          Search shortcuts
        </label>
        <input id="vault-search" type="search" placeholder="Try “a^2 - b^2”, “at least one”, “remainder”, “root 3”…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <label className="sr-only" htmlFor="vault-topic">
          Topic
        </label>
        <select id="vault-topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="all">All topics</option>
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <p className="counter">
        {results.length} shortcut{results.length === 1 ? '' : 's'}
      </p>
      <div className="lesson-grid">
        {results.map((s) => (
          <a key={s.id} className="lesson-card" href={href.shortcut(s.id)}>
            <span className="tag">{s.topic}</span>
            <strong>
              {bookmarks.includes(`shortcut:${s.id}`) && <span aria-label="Bookmarked">★ </span>}
              {s.name}
            </strong>
            <span className="lesson-takeaway">
              <MathText text={s.clue} />
            </span>
          </a>
        ))}
      </div>
      {!results.length && <p className="empty">No shortcuts match. Try a shorter search.</p>}
    </div>
  );
}

function ShortcutPage({ s, practice }: { s: Shortcut; practice: boolean }) {
  const progress = useProgress();
  const marked = (progress.bookmarks ?? []).includes(`shortcut:${s.id}`);
  const [practicing, setPracticing] = useState(practice);
  const practiceRef = useRef<HTMLElement>(null);
  const questions = questionsForShortcut(s.id).map((id) => QUESTION_BY_ID[id]);
  const [qIndex, setQIndex] = useState(0);

  useEffect(() => {
    if (practicing) practiceRef.current?.scrollIntoView?.({ block: "start" });
  }, [practicing]);

  return (
    <article className="module">
      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="#/vault">Shortcut Vault</a> › <span>{s.topic}</span>
      </nav>
      <header className="module-head card-head">
        <h2>{s.name}</h2>
        <button className="btn" aria-pressed={marked} onClick={() => toggleBookmark(`shortcut:${s.id}`)}>
          {marked ? '★ Bookmarked' : '☆ Bookmark'}
        </button>
      </header>

      <section className="card">
        <dl className="explain-grid">
          <dt>RECOGNITION CLUE</dt>
          <dd>
            <MathText text={s.clue} />
          </dd>
          <dt>FORMULA / RULE</dt>
          <dd>
            <MathText text={s.rule} roomy />
          </dd>
        </dl>
        <h4>Symbols explained</h4>
        <table className="parts-table">
          <tbody>
            {s.symbols.map((x, i) => (
              <tr key={i}>
                <td>
                  <MathText text={x.symbol} />
                </td>
                <td>
                  <MathText text={x.meaning} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h4>Quick example</h4>
        <p className="exercise-prompt">
          <MathText text={s.example.problem} />
        </p>
        <Steps steps={s.example.steps} />
        <p className="answer-line">
          <strong>Answer:</strong> <MathText text={s.example.answer} />
        </p>
      </section>

      <section className="card">
        <h4>When to use it</h4>
        <p>
          <MathText text={s.whenUse} />
        </p>
        <h4>When NOT to use it</h4>
        <p className="trap-text">
          <MathText text={s.whenNot} />
        </p>
        <p className="note">
          Concept lesson: <a href={href.lesson(s.lesson)}>{LESSON_BY_ID[s.lesson].title}</a>
        </p>
      </section>

      {!practicing ? (
        <div className="actions">
          <button className="btn btn-primary" onClick={() => setPracticing(true)}>
            Practice This Shortcut
          </button>
        </div>
      ) : (
        <section className="card" ref={practiceRef} aria-label="Practice this shortcut">
          <h3>Practice This Shortcut</h3>
          <Exercise exercise={s.drill} refPrefix={`shortcut:${s.id}`} kind="shortcut-drill" helpLink={{ href: href.lesson(s.lesson), label: 'Review This Concept' }} />
          {questions.length > 0 ? (
            <>
              <h4>
                GRE-style question {qIndex + 1} of {questions.length} that uses this shortcut
              </h4>
              <QuestionSolver key={questions[qIndex].id} q={questions[qIndex]} source={`vault:${s.id}`} />
              {questions.length > 1 && (
                <div className="actions">
                  <button className="btn" onClick={() => setQIndex((i) => (i + 1) % questions.length)}>
                    Next question →
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="note">No bank questions are tagged with this shortcut yet. The drill above is the practice for now.</p>
          )}
        </section>
      )}
    </article>
  );
}
