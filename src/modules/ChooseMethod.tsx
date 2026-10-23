import { useMemo, useRef, useState } from 'react';
import { MethodBlock } from '../components/Explanation';
import { FilterBar } from '../components/FilterBar';
import { MathText } from '../components/MathText';
import { QuestionSolver } from '../components/QuestionSolver';
import { QuestionStem } from '../components/QuestionStem';
import { Disclosure, Feedback, OptionList, Remember, type OptionState } from '../components/ui';
import { STRATEGIES } from '../data/taxonomy';
import type { Question, Verdict } from '../data/types';
import { similarTo, useDeck, type DeckFilter } from '../lib/deck';
import { href, primaryLesson, QUESTION_SHORTCUT, CATEGORY_LESSON } from '../data/links';
import { recordAttempt } from '../lib/progress';
import { shuffle } from '../lib/random';

const VERDICT_TEXT: Record<Verdict, { tone: 'correct' | 'partial' | 'incorrect'; title: string; badge: string }> = {
  best: { tone: 'correct', title: 'Yes — that is the most efficient method here.', badge: 'Fastest' },
  valid: { tone: 'partial', title: 'That works. A faster route exists, though.', badge: 'Valid' },
  slow: { tone: 'partial', title: 'That can work, but it is slow for this question.', badge: 'Slow' },
  invalid: { tone: 'incorrect', title: 'That method will not reliably get you there.', badge: 'Won’t work' },
};

const VERDICT_STATE: Record<Verdict, OptionState> = { best: 'correct', valid: 'partial', slow: 'partial', invalid: 'incorrect' };

export function ChooseMethod({ initialFilter }: { initialFilter: DeckFilter }) {
  const [filter, setFilter] = useState(initialFilter);
  const deck = useDeck(filter);
  return (
    <div className="module">
      <header className="module-head">
        <h2>What’s the Fastest Way?</h2>
        <p className="lede">Choose a strategy before solving. Often more than one method works. The goal is to spot the most efficient one for <em>these</em> numbers.</p>
      </header>
      <FilterBar value={filter} onChange={setFilter} />
      {deck.current ? (
        <MethodRound key={deck.current.id} q={deck.current} onNext={deck.next} onShow={deck.show} position={deck.position} size={deck.size} />
      ) : (
        <p className="empty">No questions match these filters yet.</p>
      )}
    </div>
  );
}

export function MethodRound({
  q,
  onNext,
  onShow,
  position,
  size,
  mode = 'method',
  allowSolve = true,
  nextLabel = 'Next question →',
}: {
  q: Question;
  onNext: () => void;
  onShow: (id: string) => void;
  position: number;
  size: number;
  mode?: string;
  allowSolve?: boolean;
  nextLabel?: string;
}) {
  const opts = useMemo(() => shuffle(q.method.options), [q]);
  const [picked, setPicked] = useState<number | null>(null);
  const [solving, setSolving] = useState(false);
  const started = useRef(Date.now());
  const best = q.method.options.find((o) => o.verdict === 'best')!;

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    const v = opts[i].verdict;
    recordAttempt({
      kind: 'strategy',
      ref: q.id,
      result: v === 'best' ? 'correct' : v === 'invalid' ? 'incorrect' : 'partial',
      category: q.category,
      area: q.area,
      difficulty: q.difficulty,
      format: q.format,
      topic: q.topic,
      mode,
      ms: Date.now() - started.current,
      detail: opts[i].strategy,
    });
  }

  if (solving) {
    const sim = similarTo(q);
    return (
      <div className="round">
        <p className="counter">
          Question {position} of {size}
        </p>
        <QuestionSolver q={q} source="method" onSimilar={sim ? () => onShow(sim.id) : undefined} />
        <div className="actions">
          <button className="btn btn-primary" onClick={onNext}>
            Next question →
          </button>
        </div>
      </div>
    );
  }

  const chosen = picked !== null ? opts[picked] : null;
  return (
    <div className="round">
      <p className="counter">
        Question {position} of {size}
      </p>
      <div className="card">
        <QuestionStem q={q} />
      </div>
      <p className="ask">Which strategy is the most efficient?</p>
      <OptionList
        options={opts.map((o, i) => `${String.fromCharCode(65 + i)}. ${STRATEGIES[o.strategy]}`)}
        states={opts.map((o, i): OptionState => (picked === null ? 'idle' : i === picked || o.verdict === 'best' ? VERDICT_STATE[o.verdict] : 'idle'))}
        onPick={pick}
        disabled={picked !== null}
      />
      {chosen && (
        <>
          <Feedback tone={VERDICT_TEXT[chosen.verdict].tone} title={VERDICT_TEXT[chosen.verdict].title}>
            <p>
              <MathText text={chosen.note} />
            </p>
            {chosen.verdict !== 'best' && (
              <p>
                <strong>Preferred: {STRATEGIES[best.strategy]}.</strong> <MathText text={best.note} />
              </p>
            )}
            {(chosen.verdict === 'valid' || chosen.verdict === 'slow') && (
              <p>
                <a
                  className="link-btn"
                  href={QUESTION_SHORTCUT[q.id] ? href.shortcut(QUESTION_SHORTCUT[q.id]) : href.lesson(primaryLesson(q.id) ?? CATEGORY_LESSON[q.category], 'fastest')}
                >
                  See a Faster Method →
                </a>
              </p>
            )}
            {chosen.verdict === 'invalid' && (
              <p>
                <a className="link-btn" href={href.lesson(primaryLesson(q.id) ?? CATEGORY_LESSON[q.category], 'fastest')}>
                  Review This Concept →
                </a>
              </p>
            )}
          </Feedback>
          <div className="card insight">
            <p>
              <MathText text={q.method.explanation} />
            </p>
            <Remember text={q.method.rule} />
            <Disclosure label="How every option compares">
              <ul className="verdicts">
                {opts.map((o) => (
                  <li key={o.strategy}>
                    <span className={`badge badge-${o.verdict}`}>{VERDICT_TEXT[o.verdict].badge}</span> <strong>{STRATEGIES[o.strategy]}</strong> — <MathText text={o.note} />
                  </li>
                ))}
              </ul>
            </Disclosure>
            <Disclosure label="Show the worked solution (reveals the answer)">
              <p className="answer-line">
                <strong>Answer:</strong> <MathText text={q.solution.answerText} />
              </p>
              <MethodBlock q={q} />
            </Disclosure>
          </div>
          <div className="actions">
            {allowSolve && (
              <button className="btn btn-primary" onClick={() => setSolving(true)}>
                Solve it myself
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
