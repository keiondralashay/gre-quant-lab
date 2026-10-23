import { useEffect, useMemo, useRef, useState } from 'react';
import { FilterBar } from '../components/FilterBar';
import { MathText } from '../components/MathText';
import { QuestionSolver } from '../components/QuestionSolver';
import { QuestionStem } from '../components/QuestionStem';
import { Feedback, OptionList, Remember, type OptionState } from '../components/ui';
import { CATEGORIES, CATEGORY_IDS } from '../data/taxonomy';
import type { Category, Question } from '../data/types';
import { similarTo, useDeck, type DeckFilter } from '../lib/deck';
import { CATEGORY_LESSON, href, primaryLesson } from '../data/links';
import { recordAttempt } from '../lib/progress';
import { shuffle } from '../lib/random';

type Mode = 'type' | 'first';

export function recognitionOptions(q: Question, count: number, rand: () => number = Math.random): Category[] {
  if (count >= CATEGORY_IDS.length) return CATEGORY_IDS;
  const secondary = q.secondary.length && rand() < 0.5 ? [q.secondary[Math.floor(rand() * q.secondary.length)]] : [];
  const fill = shuffle(
    CATEGORY_IDS.filter((c) => c !== q.category && !secondary.includes(c)),
    rand,
  ).slice(0, count - 1 - secondary.length);
  return shuffle([q.category, ...secondary, ...fill], rand);
}

export function Recognize({ initialFilter, initialMode = 'type' }: { initialFilter: DeckFilter; initialMode?: Mode }) {
  const [filter, setFilter] = useState(initialFilter);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [allCategories, setAllCategories] = useState(false);
  const deck = useDeck(filter);

  return (
    <div className="module">
      <header className="module-head">
        <h2>Recognize the Problem</h2>
        <p className="lede">Identify the problem type before solving anything. Questions arrive in mixed order, so you cannot rely on knowing the topic ahead of time.</p>
      </header>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={mode === 'type'} className={mode === 'type' ? 'active' : ''} onClick={() => setMode('type')}>
          What kind of problem is this?
        </button>
        <button role="tab" aria-selected={mode === 'first'} className={mode === 'first' ? 'active' : ''} onClick={() => setMode('first')}>
          What would you do FIRST?
        </button>
      </div>
      <FilterBar value={filter} onChange={setFilter} />
      {mode === 'type' && (
        <label className="toggle">
          <input type="checkbox" checked={allCategories} onChange={(e) => setAllCategories(e.target.checked)} /> Harder: choose from all 14 categories
        </label>
      )}
      {!deck.current ? (
        <p className="empty">No questions match these filters yet.</p>
      ) : mode === 'type' ? (
        <TypeRound key={deck.current.id + String(allCategories)} q={deck.current} optionCount={allCategories ? 14 : 4} onNext={deck.next} onShow={deck.show} position={deck.position} size={deck.size} />
      ) : (
        <FirstStepRound key={deck.current.id} q={deck.current} onNext={deck.next} onShow={deck.show} position={deck.position} size={deck.size} />
      )}
    </div>
  );
}

function Counter({ position, size }: { position: number; size: number }) {
  return (
    <p className="counter">
      Question {position} of {size}
    </p>
  );
}

export function TypeRound({
  q,
  optionCount,
  onNext,
  onShow,
  position,
  size,
  mode = 'recognize',
  allowSolve = true,
  nextLabel = 'Next question →',
}: {
  q: Question;
  optionCount: number;
  onNext: () => void;
  onShow: (id: string) => void;
  position: number;
  size: number;
  /** Practice mode stored with the attempt. */
  mode?: string;
  /** Offer "solve it now" after recognizing (off for recognize-only activities). */
  allowSolve?: boolean;
  nextLabel?: string;
}) {
  const options = useMemo(() => recognitionOptions(q, optionCount), [q, optionCount]);
  const [picked, setPicked] = useState<Category | null>(null);
  const [solving, setSolving] = useState(false);
  const started = useRef(Date.now());
  useEffect(() => {
    started.current = Date.now();
  }, [q]);

  const result = picked === null ? null : picked === q.category ? 'correct' : q.secondary.includes(picked) ? 'partial' : 'incorrect';

  function pick(i: number) {
    if (picked) return;
    const c = options[i];
    setPicked(c);
    const r = c === q.category ? 'correct' : q.secondary.includes(c) ? 'partial' : 'incorrect';
    recordAttempt({ kind: 'recognition', ref: q.id, result: r, category: q.category, area: q.area, difficulty: q.difficulty, format: q.format, topic: q.topic, mode, ms: Date.now() - started.current, detail: c });
  }

  const states = options.map((c): OptionState => {
    if (!picked) return 'idle';
    if (c === q.category) return 'correct';
    if (c === picked) return q.secondary.includes(c) ? 'partial' : 'incorrect';
    return 'idle';
  });

  if (solving) {
    const sim = similarTo(q);
    return (
      <div className="round">
        <Counter position={position} size={size} />
        <QuestionSolver q={q} source="recognize" onSimilar={sim ? () => onShow(sim.id) : undefined} />
        <div className="actions">
          <button className="btn btn-primary" onClick={onNext}>
            Next question →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="round">
      <Counter position={position} size={size} />
      <div className="card">
        <QuestionStem q={q} />
      </div>
      <p className="ask">What kind of problem is this?</p>
      <OptionList options={options.map((c) => CATEGORIES[c])} states={states} onPick={pick} disabled={!!picked} columns />

      {result && (
        <>
          <Feedback
            tone={result}
            title={
              result === 'correct'
                ? `Yes — ${CATEGORIES[q.category]}.`
                : result === 'partial'
                  ? `Close. ${CATEGORIES[picked!]} is involved, but the main problem type is ${CATEGORIES[q.category]}.`
                  : `Not quite. This is ${CATEGORIES[q.category]}.`
            }
          >
            {result !== 'correct' && (
              <p>
                <a className="link-btn" href={href.lesson(primaryLesson(q.id) ?? CATEGORY_LESSON[q.category])}>
                  Review This Concept →
                </a>
              </p>
            )}
            {q.secondary.length > 0 && (
              <p className="secondary-note">
                Secondary concept{q.secondary.length > 1 ? 's' : ''}: {q.secondary.map((c) => CATEGORIES[c]).join(', ')}
              </p>
            )}
          </Feedback>
          <div className="card insight">
            <h4>Clues that identify it</h4>
            <ul className="clues">
              {q.recognition.clues.map((c, i) => (
                <li key={i}>
                  <mark>
                    <MathText text={c} />
                  </mark>
                </li>
              ))}
            </ul>
            <h4>What makes it recognizable</h4>
            <p>
              <MathText text={q.recognition.why} />
            </p>
            <h4>Best strategy</h4>
            <p>
              <MathText text={q.recognition.strategy} />
            </p>
            <Remember text={q.recognition.rule} />
          </div>
          {allowSolve && <p className="ask">Do you want to solve it now?</p>}
          <div className="actions">
            {allowSolve && (
              <button className="btn btn-primary" onClick={() => setSolving(true)}>
                Yes, let me solve it
              </button>
            )}
            <button className={allowSolve ? 'btn' : 'btn btn-primary'} onClick={onNext}>
              {nextLabel}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function FirstStepRound({ q, onNext, onShow, position, size }: { q: Question; onNext: () => void; onShow: (id: string) => void; position: number; size: number }) {
  const order = useMemo(() => shuffle(q.firstStep.options.map((_, i) => i)), [q]);
  const [picked, setPicked] = useState<number | null>(null);
  const [solving, setSolving] = useState(false);
  const started = useRef(Date.now());

  function pick(displayIndex: number) {
    if (picked !== null) return;
    const i = order[displayIndex];
    setPicked(i);
    recordAttempt({ kind: 'first-step', ref: q.id, result: i === q.firstStep.correct ? 'correct' : 'incorrect', category: q.category, area: q.area, difficulty: q.difficulty, format: q.format, topic: q.topic, mode: 'first-step', ms: Date.now() - started.current, detail: String(i) });
  }

  if (solving) {
    const sim = similarTo(q);
    return (
      <div className="round">
        <Counter position={position} size={size} />
        <QuestionSolver q={q} source="first-step" onSimilar={sim ? () => onShow(sim.id) : undefined} />
        <div className="actions">
          <button className="btn btn-primary" onClick={onNext}>
            Next question →
          </button>
        </div>
      </div>
    );
  }

  const ok = picked === q.firstStep.correct;
  return (
    <div className="round">
      <Counter position={position} size={size} />
      <div className="card">
        <QuestionStem q={q} />
      </div>
      <p className="ask">What would you do FIRST? (Don’t solve the whole thing — just pick the first move.)</p>
      <OptionList
        options={order.map((i) => q.firstStep.options[i])}
        states={order.map((i): OptionState => (picked === null ? 'idle' : i === q.firstStep.correct ? 'correct' : i === picked ? 'incorrect' : 'idle'))}
        onPick={pick}
        disabled={picked !== null}
      />
      {picked !== null && (
        <>
          <Feedback tone={ok ? 'correct' : 'incorrect'} title={ok ? 'Good first move.' : 'A better first move is highlighted.'}>
            <p>
              <MathText text={q.firstStep.explanation} />
            </p>
            {!ok && (
              <p>
                <a className="link-btn" href={href.lesson(primaryLesson(q.id) ?? CATEGORY_LESSON[q.category], 'fastest')}>
                  Review This Concept →
                </a>
              </p>
            )}
          </Feedback>
          <Remember text={q.recognition.rule} />
          <div className="actions">
            <button className="btn btn-primary" onClick={() => setSolving(true)}>
              Finish solving it
            </button>
            <button className="btn" onClick={onNext}>
              Next question →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
