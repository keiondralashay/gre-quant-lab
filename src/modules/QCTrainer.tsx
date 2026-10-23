import { useMemo, useState } from 'react';
import { QuestionSolver } from '../components/QuestionSolver';
import { QuestionStem } from '../components/QuestionStem';
import { ValueTester } from '../components/ValueTester';
import { QUESTIONS } from '../data/questions';
import { QC_FIXED_THEMES, QC_MODEL_BY_QID, QC_THEMES, type QCTheme } from '../data/qcModels';
import type { QCAnswer, Question } from '../data/types';
import { QC_LABELS } from '../lib/grading';
import { useProgress } from '../lib/progress';

const THEME_IDS = Object.keys(QC_THEMES) as QCTheme[];

export const themesOf = (q: Question): QCTheme[] => QC_MODEL_BY_QID[q.id]?.themes ?? QC_FIXED_THEMES[q.id] ?? [];

/** Unattempted questions first (in bank order), then the rest, least recently attempted first. */
export function preferUnseen(pool: Question[], attempts: { kind: string; ref: string; ts: number }[]): Question[] {
  const last = new Map<string, number>();
  for (const a of attempts) if (a.kind === 'answer') last.set(a.ref, Math.max(last.get(a.ref) ?? 0, a.ts));
  return [...pool].sort((a, b) => (last.get(a.id) ?? -1) - (last.get(b.id) ?? -1));
}

export function QCTrainer({ initialTheme }: { initialTheme?: string }) {
  const progress = useProgress();
  const [theme, setTheme] = useState<QCTheme | 'all'>(THEME_IDS.includes(initialTheme as QCTheme) ? (initialTheme as QCTheme) : 'all');
  const [pos, setPos] = useState(0);
  const all = useMemo(() => QUESTIONS.filter((q) => q.format === 'qc'), []);
  // The order is fixed when the theme changes, so answering a question does not reshuffle the list under the learner.
  const order = useMemo(() => preferUnseen(theme === 'all' ? all : all.filter((q) => themesOf(q).includes(theme)), progress.attempts), [theme]); // eslint-disable-line react-hooks/exhaustive-deps
  const q = order[pos % order.length];
  const model = q ? QC_MODEL_BY_QID[q.id] : undefined;
  const pick = (t: QCTheme | 'all') => {
    setTheme(t);
    setPos(0);
  };
  const seen = new Set(progress.attempts.filter((a) => a.kind === 'answer').map((a) => a.ref));

  return (
    <div className="module">
      <header className="module-head">
        <h2>Quantitative Comparison Trainer</h2>
        <p className="lede">Compare Quantity A with Quantity B. Test values that satisfy the conditions, look for a case that changes the relationship, and know what your examples can and cannot prove.</p>
      </header>

      <details className="card qc-rules">
        <summary>The four answer choices and the rules of evidence</summary>
        <ol className="qc-choices-list">
          {(Object.keys(QC_LABELS) as QCAnswer[]).map((k) => (
            <li key={k}>
              <strong>{k}</strong> {QC_LABELS[k]}
            </li>
          ))}
        </ol>
        <ul>
          <li>One example never proves A, B, or C. It only shows what happens for that value.</li>
          <li>Two allowed values that give different relationships prove D.</li>
          <li>If both quantities are fixed numbers (no variables), the answer cannot be D.</li>
          <li>A value that breaks a condition is not evidence. Read every condition before testing.</li>
        </ul>
      </details>

      <div className="chip-row" role="group" aria-label="Theme">
        <button className={`chip ${theme === 'all' ? 'active' : ''}`} aria-pressed={theme === 'all'} onClick={() => pick('all')}>
          All ({all.length})
        </button>
        {THEME_IDS.map((t) => (
          <button key={t} className={`chip ${theme === t ? 'active' : ''}`} aria-pressed={theme === t} onClick={() => pick(t)}>
            {QC_THEMES[t].label} ({all.filter((x) => themesOf(x).includes(t)).length})
          </button>
        ))}
      </div>
      {theme !== 'all' && <p className="note">{QC_THEMES[theme].idea}</p>}

      {q && (
        <>
          <p className="counter">
            Question {(pos % order.length) + 1} of {order.length}
            {!seen.has(q.id) && ' · new to you'}
            {themesOf(q).length > 0 && ` · ${themesOf(q).map((t) => QC_THEMES[t].label).join(', ')}`}
          </p>
          <div key={q.id}>
            <QuestionStem q={q} />
            {model ? <ValueTester model={model} quantityA={q.quantityA} quantityB={q.quantityB} /> : <p className="note card">There are no variables to choose here. Compute or estimate both quantities. Because both are fixed numbers, the answer cannot be D.</p>}
            <QuestionSolver q={q} source="qc-trainer" hideStem />
          </div>
          <div className="actions">
            <button className="btn" onClick={() => setPos((p) => (p + order.length - 1) % order.length)}>
              ← Previous
            </button>
            <button className="btn btn-primary" onClick={() => setPos((p) => p + 1)}>
              Next question →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
