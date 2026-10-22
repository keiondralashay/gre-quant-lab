import { useState } from 'react';
import { FilterBar } from '../components/FilterBar';
import { MathText } from '../components/MathText';
import { QuestionSolver } from '../components/QuestionSolver';
import { QuestionStem } from '../components/QuestionStem';
import { Disclosure, Remember, Steps } from '../components/ui';
import { STRATEGIES } from '../data/taxonomy';
import type { Question } from '../data/types';
import { similarTo, useDeck, type DeckFilter } from '../lib/deck';

const hasShortcut = (q: Question) => !q.solution.longIsFastest && !!q.solution.long?.length;

export function ShortcutVsTraditional({ initialFilter }: { initialFilter: DeckFilter }) {
  const [filter, setFilter] = useState(initialFilter);
  const [onlyShortcuts, setOnlyShortcuts] = useState(true);
  return (
    <div className="module">
      <header className="module-head">
        <h2>Shortcut vs. Traditional</h2>
        <p className="lede">See the fast method first, and learn exactly when it is safe. The long way stays collapsed until you ask for it.</p>
      </header>
      <FilterBar value={filter} onChange={setFilter} />
      <label className="toggle">
        <input type="checkbox" checked={onlyShortcuts} onChange={(e) => setOnlyShortcuts(e.target.checked)} /> Only questions with a genuine shortcut
      </label>
      {/* useDeck keys its pool on the filter; remount when the toggle changes so the pool is rebuilt. */}
      <DeckView key={String(onlyShortcuts)} filter={filter} onlyShortcuts={onlyShortcuts} />
    </div>
  );
}

function DeckView({ filter, onlyShortcuts }: { filter: DeckFilter; onlyShortcuts: boolean }) {
  const deck = useDeck(filter, onlyShortcuts ? hasShortcut : undefined);
  if (!deck.current) return <p className="empty">No questions match these filters yet.</p>;
  return <ShortcutRound key={deck.current.id} q={deck.current} onNext={deck.next} onShow={deck.show} position={deck.position} size={deck.size} />;
}

function ShortcutRound({ q, onNext, onShow, position, size }: { q: Question; onNext: () => void; onShow: (id: string) => void; position: number; size: number }) {
  const [mode, setMode] = useState<'choose' | 'solve' | 'methods'>('choose');
  const sim = similarTo(q);
  return (
    <div className="round">
      <p className="counter">
        Question {position} of {size}
      </p>
      {mode === 'solve' ? (
        <QuestionSolver q={q} source="shortcut" onSimilar={sim ? () => onShow(sim.id) : undefined} />
      ) : (
        <div className="card">
          <QuestionStem q={q} />
        </div>
      )}
      {mode === 'choose' && (
        <div className="actions">
          <button className="btn btn-primary" onClick={() => setMode('solve')}>
            Try it first
          </button>
          <button className="btn" onClick={() => setMode('methods')}>
            Show me both methods
          </button>
        </div>
      )}
      {mode === 'methods' && <ShortcutCard q={q} />}
      <div className="actions">
        <button className="btn" onClick={onNext}>
          Next question →
        </button>
      </div>
    </div>
  );
}

export function ShortcutCard({ q }: { q: Question }) {
  const s = q.solution;
  const best = q.method.options.find((o) => o.verdict === 'best')!;
  return (
    <div className="card shortcut-card">
      {s.longIsFastest && (
        <p className="note strong">For this question the traditional method <em>is</em> the fastest method. There is no shortcut worth learning.</p>
      )}
      <section className="method method-fast">
        <h4>{s.longIsFastest ? 'The efficient method' : 'Method 1: GRE Shortcut'}</h4>
        <dl className="explain-grid">
          <dt>Recognition clue</dt>
          <dd>
            <MathText text={s.clue} />
          </dd>
          <dt>Fastest valid strategy</dt>
          <dd>
            <strong>{STRATEGIES[best.strategy]}</strong> — <MathText text={q.recognition.strategy} />
          </dd>
        </dl>
        <Steps steps={s.fast} />
        <p className="answer-line">
          <strong>Answer:</strong> <MathText text={s.answerText} />
        </p>
        {s.why && (
          <Disclosure label="Why Does This Shortcut Work?">
            <MathText text={s.why} />
          </Disclosure>
        )}
        {s.whenNot && (
          <Disclosure label="When NOT to Use This Shortcut">
            <MathText text={s.whenNot} />
          </Disclosure>
        )}
        <Remember text={s.remember} />
      </section>
      {!s.longIsFastest && s.long && (
        <Disclosure label="Show the Long Way">
          <section className="method method-long">
            <h4>Method 2: Traditional Solution</h4>
            <Steps steps={s.long} />
            <p className="answer-line">
              <strong>Final answer:</strong> <MathText text={s.answerText} />
            </p>
          </section>
        </Disclosure>
      )}
    </div>
  );
}
