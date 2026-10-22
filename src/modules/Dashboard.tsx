import { LESSONS } from '../data/library';
import { CATEGORY_LESSON, href } from '../data/links';
import { QUESTIONS } from '../data/questions';
import { CATEGORIES } from '../data/taxonomy';
import type { Category } from '../data/types';
import { pct, resetProgress, summarize, useProgress, weakestCategories, type Tally } from '../lib/progress';

interface ModuleCard {
  n: number;
  title: string;
  blurb: string;
  href?: string;
  phase: number;
}

export const MODULES: ModuleCard[] = [
  { n: 1, title: 'Recognize the Problem', blurb: 'Name the problem type, and the first move, before solving.', href: '#/recognize', phase: 1 },
  { n: 2, title: 'Decode the Equation', blurb: 'Identify a, b, c, slopes, bases, numerators, and every symbol.', href: '#/decode', phase: 1 },
  { n: 3, title: 'Choose the Fastest Method', blurb: '“What’s the fastest way?” Pick a strategy before solving.', href: '#/method', phase: 1 },
  { n: 4, title: 'Shortcut vs. Traditional', blurb: 'The fast method first, the long way on request, and when NOT to use the shortcut.', href: '#/shortcut', phase: 1 },
  { n: 5, title: 'Guided Problem Solving', blurb: 'Step-by-step tutor with hints.', phase: 3 },
  { n: 6, title: 'GRE Practice Questions', blurb: 'Full test-style sets in all four formats.', phase: 3 },
  { n: 7, title: 'Quantitative Comparison', blurb: 'QC trainer with “Test Different Values”.', phase: 3 },
  { n: 8, title: 'GRE Topic Library', blurb: 'Every official content area in short, practice-linked lessons.', href: '#/library', phase: 2 },
  { n: 9, title: 'Shortcut & Formula Vault', blurb: 'Searchable shortcuts with “when NOT to use it” and drills.', href: '#/vault', phase: 2 },
  { n: 10, title: 'Mistake Tracker', blurb: 'Error categories and “What should I practice next?”', phase: 4 },
  { n: 11, title: 'Speed Training', blurb: 'Learn / Practice / GRE Speed modes, 30-second recognition.', phase: 4 },
  { n: 12, title: 'Personalized Review', blurb: 'Spaced review of what you missed.', phase: 5 },
  { n: 13, title: 'Understand the Formula', blurb: 'Tap any part of a formula to see what it means, then test yourself.', href: '#/formulas', phase: 2 },
  { n: 14, title: 'Spot the Clue', blurb: 'Translate GRE wording into math, and back again.', href: '#/clues', phase: 2 },
  { n: 15, title: 'Shortcut Flashcards', blurb: 'Flip, rate, bookmark. Missed cards come back first.', href: '#/flashcards', phase: 2 },
  { n: 16, title: 'Topic Practice', blurb: 'Recognition, decode, strategy, solve, and shortcut practice by lesson.', href: '#/practice', phase: 2 },
];

function Stat({ label, t, hint }: { label: string; t: Tally; hint?: string }) {
  const p = pct(t);
  return (
    <div className="stat">
      <div className="stat-value">{p === null ? '—' : `${p}%`}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-sub">{t.total ? `${t.correct} of ${t.total}${t.partial ? ` (${t.partial} partial)` : ''}` : (hint ?? 'No attempts yet')}</div>
    </div>
  );
}

export function Dashboard() {
  const progress = useProgress();
  const s = summarize(progress.attempts);
  const weak = weakestCategories(s);
  const hasData = progress.attempts.length > 0;
  const categories = (Object.entries(s.byCategory) as [Category, Tally][]).sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="module dashboard">
      <section className="hero">
        <h2>GRE Quant Mastery</h2>
        <p className="lede">Learn to recognize the problem, decode what it says, choose the fastest valid path, and remember it.</p>
        <ol className="chain" aria-label="Learning sequence">
          {['Recognize', 'Decode', 'Choose', 'Solve', 'Shortcut', 'Remember'].map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ol>
        {!hasData && (
          <div className="actions">
            <a className="btn btn-primary" href="#/recognize">
              Start with Recognize the Problem →
            </a>
            <a className="btn" href="#/library">
              Browse the Topic Library
            </a>
          </div>
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Your progress</h3>
          {hasData && (
            <button
              className="btn-link danger"
              onClick={() => {
                if (window.confirm('Erase all Quant study progress on this device? This cannot be undone.')) resetProgress();
              }}
            >
              Reset progress
            </button>
          )}
        </div>
        {!hasData ? (
          <p className="empty">Nothing recorded yet. Your accuracy appears here as you practice. Progress is saved in this browser.</p>
        ) : (
          <>
            <div className="stats">
              <Stat label="Problem recognition" t={s.byKind.recognition} />
              <Stat label="First-step choice" t={s.byKind['first-step']} />
              <Stat label="Strategy selection (fastest)" t={s.byKind.strategy} />
              <Stat label="Solving accuracy (first try)" t={s.byKind.answer} />
              <Stat label="Decode exercises" t={s.byKind['decode-exercise']} />
              <Stat label="Lesson quick checks" t={s.byKind['lesson-check']} />
              <Stat label="Shortcut drills" t={s.byKind['shortcut-drill']} />
              <Stat label="Formula tests" t={s.byKind['formula-check']} />
              <Stat label="Spot the Clue" t={s.byKind.clue} />
              <div className="stat">
                <div className="stat-value">{s.avgSolveMs === null ? '—' : `${Math.round(s.avgSolveMs / 1000)}s`}</div>
                <div className="stat-label">Average solving time</div>
                <div className="stat-sub">
                  {s.byKind.answer.total} answered · {s.answersWithHints} with hints
                </div>
              </div>
            </div>
            <p className="note">
              {s.questionsSeen} of {QUESTIONS.length} questions in the bank practiced · {(progress.visitedLessons ?? []).length} of {LESSONS.length} lessons opened ·{' '}
              {Object.keys(progress.cards ?? {}).length} flashcards reviewed
            </p>

            {weak.length > 0 && (
              <div className="weak">
                <h4>Weakest topics so far</h4>
                <ul>
                  {weak.slice(0, 3).map((w) => (
                    <li key={w.category}>
                      <span>
                        {CATEGORIES[w.category]} — {Math.round(w.accuracy * 100)}% over {w.total} attempts
                      </span>{' '}
                      <a href={`#/recognize?cat=${w.category}`}>Practice →</a> · <a href={href.lesson(CATEGORY_LESSON[w.category])}>Review lesson →</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {categories.length > 0 && (
              <details className="topic-breakdown">
                <summary>Accuracy by topic and difficulty</summary>
                <table className="parts-table">
                  <thead>
                    <tr>
                      <th scope="col">Topic</th>
                      <th scope="col">Accuracy</th>
                      <th scope="col">Attempts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(([c, t]) => (
                      <tr key={c}>
                        <td>{CATEGORIES[c]}</td>
                        <td>
                          <div className="bar" aria-hidden="true">
                            <span style={{ width: `${pct(t)}%` }} />
                          </div>
                          {pct(t)}%
                        </td>
                        <td>{t.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="note">
                  Solving accuracy by difficulty:{' '}
                  {([1, 2, 3] as const)
                    .map((d) => `${['Foundational', 'Moderate', 'Challenging'][d - 1]} ${pct(s.byDifficulty[d]) ?? '—'}${s.byDifficulty[d].total ? '%' : ''} (${s.byDifficulty[d].total})`)
                    .join(' · ')}
                </p>
                <p className="note">Topic accuracy combines recognition, first-step, strategy, decode, and solving attempts.</p>
              </details>
            )}
          </>
        )}
      </section>

      <section>
        <h3 className="section-title">Study modules</h3>
        <div className="module-grid">
          {MODULES.map((m) =>
            m.href ? (
              <a key={m.n} href={m.href} className="module-card">
                <span className="module-n">{m.n}</span>
                <strong>{m.title}</strong>
                <span>{m.blurb}</span>
              </a>
            ) : (
              <div key={m.n} className="module-card locked" aria-disabled="true">
                <span className="module-n">{m.n}</span>
                <strong>{m.title}</strong>
                <span>{m.blurb}</span>
                <span className="tag">Planned · Phase {m.phase}</span>
              </div>
            ),
          )}
        </div>
      </section>
    </div>
  );
}
