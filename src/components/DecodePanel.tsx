import { useMemo, useState } from 'react';
import type { Question } from '../data/types';
import { CATEGORIES, CATEGORY_IDS, STRATEGIES } from '../data/taxonomy';
import { CATEGORY_LESSON, href, primaryLesson } from '../data/links';
import { recordAttempt } from '../lib/progress';
import { shuffle } from '../lib/random';
import { MathText } from './MathText';
import { Feedback, OptionList, type OptionState } from './ui';

type Step =
  | { level: 1 | 2; kind: 'choice'; id: string; title: string; options: string[]; correct: number[]; explain: string }
  | { level: 1; kind: 'reveal'; id: string; title: string; reveal: string[] };

function buildSteps(q: Question): Step[] {
  const d = q.decode;
  // Shuffle so the correct option's authored position carries no information.
  const askOrder = shuffle(d.askingOptions.map((_, i) => i));
  const others = shuffle(CATEGORY_IDS.filter((c) => c !== q.category && !q.secondary.includes(c))).slice(0, 3);
  const conceptIds = shuffle([q.category, ...others]);
  const methodOpts = q.method.options;
  return [
    { level: 1, kind: 'choice', id: 'asking', title: '1. What is the question asking me to find?', options: askOrder.map((i) => d.askingOptions[i]), correct: [askOrder.indexOf(d.askingCorrect)], explain: 'Always pin down the target first. It decides when you can stop.' },
    { level: 1, kind: 'reveal', id: 'given', title: '2. What information is given?', reveal: d.given },
    { level: 1, kind: 'reveal', id: 'variables', title: '3. What are the variables?', reveal: [d.variables] },
    { level: 1, kind: 'reveal', id: 'symbols', title: '4. What do the symbols represent?', reveal: [d.symbols] },
    { level: 1, kind: 'reveal', id: 'restrictions', title: '5. Are there any restrictions or special conditions?', reveal: [d.restrictions] },
    {
      level: 2,
      kind: 'choice',
      id: 'concept',
      title: '6. Which mathematical concept applies?',
      options: conceptIds.map((c) => CATEGORIES[c]),
      correct: [conceptIds.indexOf(q.category)],
      explain: q.recognition.why,
    },
    {
      level: 2,
      kind: 'choice',
      id: 'strategy',
      title: '7. Which strategy connects these components to the answer?',
      options: methodOpts.map((o) => STRATEGIES[o.strategy]),
      correct: methodOpts.map((o, i) => (o.verdict === 'best' || o.verdict === 'valid' ? i : -1)).filter((i) => i >= 0),
      explain: q.method.explanation,
    },
  ];
}

const LEVEL_TITLES = { 1: 'Level 1 · Identify the components', 2: 'Level 2 · Connect the components to a strategy', 3: 'Level 3 · Use the strategy to solve' };

export function DecodePanel({ q, onSolve, onClose }: { q: Question; onSolve: () => void; onClose: () => void }) {
  const steps = useMemo(() => buildSteps(q), [q]);
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [notes, setNotes] = useState('');

  const done = index >= steps.length;
  const step = steps[index];

  function next() {
    setIndex((i) => i + 1);
    setWrong([]);
    setPicked(null);
    setRevealed(false);
    setNotes('');
  }

  function pick(i: number) {
    if (!step || step.kind !== 'choice' || picked !== null) return;
    const ok = step.correct.includes(i);
    if (ok || wrong.length >= 1) {
      // First-try result is what gets recorded.
      recordAttempt({ kind: 'decode-step', ref: `${q.id}:${step.id}`, result: wrong.length === 0 && ok ? 'correct' : 'incorrect', category: q.category, area: q.area, difficulty: q.difficulty });
      setPicked(i);
      if (!ok) setWrong((w) => [...w, i]);
    } else {
      setWrong([i]);
    }
  }

  const strategyNote = step?.kind === 'choice' && step.id === 'strategy' && picked !== null ? q.method.options[picked] : null;

  return (
    <div className="panel decode-panel" aria-label="Decode This Question">
      <div className="panel-head">
        <h3>Decode This Question</h3>
        <button type="button" className="btn-link" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="progress-dots" aria-label={`Step ${Math.min(index + 1, steps.length + 1)} of ${steps.length + 1}`}>
        {[...steps, null].map((_, i) => (
          <span key={i} className={`dot ${i < index ? 'done' : i === index ? 'current' : ''}`} />
        ))}
      </div>
      <p className="level-label">{LEVEL_TITLES[done ? 3 : step.level]}</p>

      {!done && step.kind === 'choice' && (
        <>
          <p className="step-title">{step.title}</p>
          <OptionList
            options={step.options}
            onPick={pick}
            disabled={picked !== null}
            states={step.options.map((_, i): OptionState => {
              if (picked !== null) {
                if (step.correct.includes(i)) return i === picked || step.correct.length === 1 ? 'correct' : 'reveal';
                if (i === picked || wrong.includes(i)) return 'incorrect';
                return 'idle';
              }
              return wrong.includes(i) ? 'incorrect' : 'idle';
            })}
          />
          {picked === null && wrong.length === 1 && <Feedback tone="incorrect" title="Not quite. Try once more." />}
          {picked !== null && (
            <Feedback tone={step.correct.includes(picked) ? 'correct' : 'incorrect'} title={step.correct.includes(picked) ? 'Yes.' : 'Here is the answer.'}>
              {strategyNote && (
                <p>
                  <MathText text={strategyNote.note} />
                </p>
              )}
              <p>
                <MathText text={step.explain} />
              </p>
              {!step.correct.includes(picked) && (
                <p>
                  <a className="link-btn" href={href.lesson(primaryLesson(q.id) ?? CATEGORY_LESSON[q.category], 'decode')}>
                    Learn What This Means →
                  </a>
                </p>
              )}
              <button type="button" className="btn" onClick={next}>
                Continue
              </button>
            </Feedback>
          )}
        </>
      )}

      {!done && step.kind === 'reveal' && (
        <>
          <p className="step-title">{step.title}</p>
          {!revealed ? (
            <>
              <label className="sr-only" htmlFor="decode-notes">
                Your answer
              </label>
              <textarea id="decode-notes" className="notes" rows={2} placeholder="Say it in your own words first (optional), then reveal." value={notes} onChange={(e) => setNotes(e.target.value)} />
              <button type="button" className="btn" onClick={() => setRevealed(true)}>
                Reveal
              </button>
            </>
          ) : (
            <>
              {notes.trim() && (
                <p className="your-notes">
                  <strong>You wrote:</strong> {notes}
                </p>
              )}
              <ul className="reveal-list">
                {step.reveal.map((r, i) => (
                  <li key={i}>
                    <MathText text={r} />
                  </li>
                ))}
              </ul>
              <button type="button" className="btn" onClick={next}>
                Continue
              </button>
            </>
          )}
        </>
      )}

      {done && (
        <>
          <p>You have decoded the question. Now use the strategy to solve it yourself.</p>
          <button type="button" className="btn btn-primary" onClick={onSolve}>
            Solve it now
          </button>
        </>
      )}
    </div>
  );
}
