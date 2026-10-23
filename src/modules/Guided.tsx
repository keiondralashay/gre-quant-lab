import { useMemo, useRef, useState } from 'react';
import { ExamAnswer, emptyResponse, isAnswered } from '../components/ExamAnswer';
import { Explanation } from '../components/Explanation';
import { MathText } from '../components/MathText';
import { MistakePanel } from '../components/MistakePanel';
import { QuestionStem } from '../components/QuestionStem';
import { Feedback, Tag } from '../components/ui';
import { GUIDE_BY_QID, GUIDES, type Guide, type GuideStep, type GuideTrack } from '../data/guides';
import { href } from '../data/links';
import { QUESTION_BY_ID, QUESTIONS } from '../data/questions';
import { AREAS, CATEGORIES, STRATEGIES } from '../data/taxonomy';
import type { Area, Question } from '../data/types';
import { grade, parseRational, rationalEquals, type Response } from '../lib/grading';
import { recommendation, serializeAnswer, serializeResponse, STEP_MISTAKE, strugglesIn } from '../lib/mistakes';
import { recordAttempt, type GuidedTrace, type TraceStep } from '../lib/progress';
import { shuffle } from '../lib/random';
import { recognitionOptions } from './Recognize';

/* ------------------------------------------------------------------ */
/* Step model                                                          */
/* ------------------------------------------------------------------ */

/** A step as the UI runs it. `answers` holds every accepted option index. */
export type RunStep =
  | { id: string; kind: 'choice'; prompt: string; options: string[]; answers: number[]; related?: number[]; hints: string[]; explain: string }
  | { id: string; kind: 'multi'; prompt: string; options: string[]; correct: number[]; hints: string[]; explain: string; noun?: 'given' | 'needed' }
  | { id: string; kind: 'number'; prompt: string; answer: string; hints: string[]; explain: string }
  | { id: string; kind: 'fields'; prompt: string; fields: { id: string; label: string; answer: string }[]; hints: string[]; explain: string }
  /** Ungraded: the learner commits to an idea, then compares with the worked reasoning. */
  | { id: string; kind: 'self'; prompt: string; reveal: string[] };

const fromGuide = (s: GuideStep, id = s.id): RunStep =>
  s.kind === 'choice' ? { id, kind: 'choice', prompt: s.prompt, options: s.options, answers: [s.answer, ...(s.accept ?? [])], hints: s.hints, explain: s.explain } : { ...s, id };

export const sameNumber = (a: string, b: string) => {
  const x = parseRational(a);
  const y = parseRational(b);
  return !!x && !!y && rationalEquals(x, y);
};

/** Steps 1–5 (before the method splits). Steps 1, 4, 5 come from the question itself. */
export function openingSteps(q: Question, guide: Guide | undefined, rand: () => number = Math.random): { title: string; step: RunStep }[] {
  const cats = recognitionOptions(q, 4, rand);
  const restrictions = q.decode.restrictions && !/^none/i.test(q.decode.restrictions) ? [`Restriction to watch: ${q.decode.restrictions}`] : [];
  return [
    {
      title: 'What am I solving for?',
      step: {
        id: 'asking',
        kind: 'choice',
        prompt: 'Which of these is the question actually asking you to find?',
        options: q.decode.askingOptions,
        answers: [q.decode.askingCorrect],
        hints: ['Re-read the final sentence of the question: it states the target.', 'Watch for a target that is an expression (like a + b or 3n) rather than a single variable.'],
        explain: `The target is: ${q.decode.askingOptions[q.decode.askingCorrect]}`,
      },
    },
    {
      title: 'What information is given?',
      step: guide
        ? { id: 'given', kind: 'multi', prompt: 'Select every statement that is actually given. Leave out anything that is only assumed.', options: guide.given.options, correct: guide.given.correct, hints: ['Look for each statement word for word in the question.', 'If you would have to work something out, it is not given.'], explain: guide.given.explain }
        : basicGiven(q, rand),
    },
    {
      title: 'What do the mathematical components mean?',
      step: guide ? fromGuide(guide.components, 'components') : { id: 'components', kind: 'self', prompt: 'Say what each letter, symbol, or measurement stands for, then compare.', reveal: [q.decode.variables, q.decode.symbols, ...restrictions].filter(Boolean) },
    },
    {
      title: 'What type of problem is this?',
      step: {
        id: 'type',
        kind: 'choice',
        prompt: 'Which category best describes this problem?',
        options: cats.map((c) => CATEGORIES[c]),
        answers: [cats.indexOf(q.category)],
        related: cats.map((c, i) => (q.secondary.includes(c) ? i : -1)).filter((i) => i >= 0),
        hints: [`Clue: ${q.recognition.clues[0]}`, q.recognition.why],
        explain: q.recognition.why,
      },
    },
    {
      title: 'What strategy should I use?',
      step: {
        id: 'first',
        kind: 'choice',
        prompt: 'What should you do first? Pick the move that starts the best strategy.',
        options: q.firstStep.options,
        answers: [q.firstStep.correct],
        hints: [q.recognition.strategy, q.recognition.rule],
        explain: q.firstStep.explanation,
      },
    },
  ];
}

/** Assumptions that are never stated in a question, each with the words that would make it unsafe to offer. */
const ASSUMPTIONS: { text: string; unless: RegExp; when?: (q: Question) => boolean }[] = [
  { text: 'Every number involved is an integer', unless: /integer|how many|number of|factor|prime|divisib|remainder|multiple|digit|odd|even/i },
  { text: 'Every unknown is positive', unless: /positive|negative|>|<|≥|≤|\\[gl]e|\\[gl]t|less|greater|between/i },
  { text: 'The figure is drawn to scale', unless: /drawn to scale/i, when: (q) => !!q.diagram },
  { text: 'The groups are the same size', unless: /same size|equal/i, when: (q) => q.category === 'statistics' },
];

/**
 * Basic-guide step 2, graded: the stated facts, plus two statements that are
 * never given — the quantity being asked for, and a common unstated assumption
 * (only offered when the question's wording cannot make it true).
 */
export function basicGiven(q: Question, rand: () => number = Math.random): RunStep {
  const text = [q.prompt, q.quantityA ?? '', q.quantityB ?? '', ...q.decode.given, q.decode.restrictions].join(' ');
  const target = q.decode.askingOptions[q.decode.askingCorrect];
  const traps = [`${target} (already stated)`, ...shuffle(ASSUMPTIONS.filter((a) => !a.unless.test(text) && (a.when?.(q) ?? true)).map((a) => a.text), rand).slice(0, 1)];
  const options = [...q.decode.given, ...traps];
  return {
    id: 'given',
    kind: 'multi',
    prompt: 'Select every statement that is actually given. Leave out anything you would have to work out or assume.',
    options,
    correct: q.decode.given.map((_, i) => i),
    hints: ['Look for each statement in the question’s own words.', 'The quantity you are solving for is never given.'],
    explain: `Given: ${q.decode.given.join('; ')}. ${q.decode.restrictions && !/^none/i.test(q.decode.restrictions) ? `Restriction: ${q.decode.restrictions}` : ''}`.trim(),
  };
}

/** Step 9, graded: the fastest valid approach, from the question's method analysis. */
export function fasterStep(q: Question): RunStep | null {
  const best = q.method.options.map((o, i) => (o.verdict === 'best' ? i : -1)).filter((i) => i >= 0);
  if (!best.length || q.method.options.length < 2) return null;
  return {
    id: 'faster',
    kind: 'choice',
    prompt: 'Now that you have the answer: which approach is the fastest valid one for this question?',
    options: q.method.options.map((o) => STRATEGIES[o.strategy]),
    answers: best,
    hints: [q.method.rule, 'A faster approach must still be valid: it has to work for every case the question allows.'],
    explain: `${q.method.explanation} ${q.method.options.map((o) => `${STRATEGIES[o.strategy]} (${o.verdict}): ${o.note}`).join(' · ')}`,
  };
}

/** Steps 6–7 for a guide's track, or a basic version built from the question's method and solution. */
export function methodSteps(q: Question, track: GuideTrack | undefined): { title: string; step: RunStep }[] {
  if (track) {
    return [
      { title: 'What calculation should I perform?', step: fromGuide(track.operation, 'op') },
      ...track.next.map((s, i) => ({ title: `What is the next step? (${i + 1} of ${track.next.length})`, step: fromGuide(s, `next:${s.id}`) })),
    ];
  }
  const opts = q.method.options;
  return [
    {
      title: 'What calculation should I perform?',
      step: {
        id: 'op',
        kind: 'choice',
        prompt: 'Which method works best here?',
        options: opts.map((o) => STRATEGIES[o.strategy]),
        answers: opts.map((o, i) => (o.verdict === 'best' ? i : -1)).filter((i) => i >= 0),
        hints: [q.method.rule, q.recognition.strategy],
        explain: q.method.explanation,
      },
    },
    ...q.solution.fast.map((line, i) => ({
      title: `What is the next step? (${i + 1} of ${q.solution.fast.length})`,
      step: { id: `next:${i + 1}`, kind: 'self', prompt: i === 0 ? 'Carry out the first step of the method yourself, then compare.' : 'Do the next step yourself, then compare.', reveal: [line] } as RunStep,
    })),
  ];
}

/* ------------------------------------------------------------------ */
/* One step                                                            */
/* ------------------------------------------------------------------ */

type StepOutcome = Omit<TraceStep, 'id'>;

export function StepCard({ number, title, step, onDone }: { number: string; title: string; step: RunStep; onDone: (o: StepOutcome) => void }) {
  // Display order is shuffled once so the correct option is not always first.
  const order = useMemo(() => ('options' in step ? shuffle(step.options.map((_, i) => i)) : []), [step]);
  const [tries, setTries] = useState(0);
  const [hints, setHints] = useState(0);
  const [status, setStatus] = useState<'open' | 'correct' | 'revealed'>('open');
  const [eliminated, setEliminated] = useState<number[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [text, setText] = useState('');
  const [fieldVals, setFieldVals] = useState<Record<string, string>>({});
  const [badFields, setBadFields] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [committed, setCommitted] = useState(false);
  const firstResponse = useRef<string | undefined>(undefined);
  const hintList = 'hints' in step ? step.hints : [];
  const done = status !== 'open';

  function wrong(msg: string) {
    const n = tries + 1;
    setTries(n);
    setHints((h) => Math.max(h, Math.min(n, hintList.length)));
    setMessage(msg);
  }

  function check(choice?: number) {
    if (done) return;
    setMessage(null);
    if (step.kind === 'choice') {
      const i = choice!;
      if (tries === 0) firstResponse.current = step.options[i];
      if (step.answers.includes(i)) return setStatus('correct');
      setEliminated((e) => [...e, i]);
      wrong(step.related?.includes(i) ? 'That concept is involved, but it is not the main type of problem. Try again.' : 'Not quite. Try again.');
    } else if (step.kind === 'multi') {
      if (!picked.length) return setMessage('Select at least one statement.');
      if (tries === 0) firstResponse.current = [...picked].sort().map((i) => step.options[i]).join(' | ');
      const want = [...step.correct].sort().join();
      if ([...picked].sort().join() === want) return setStatus('correct');
      const extra = picked.filter((i) => !step.correct.includes(i)).length;
      const missing = step.correct.filter((i) => !picked.includes(i)).length;
      const [thing, adj] = step.noun === 'needed' ? ['piece', 'needed'] : ['statement', 'given'];
      const pl = (n: number) => (n > 1 ? `${thing}s are` : `${thing} is`);
      wrong(`Not quite: ${[extra && `${extra} selected ${pl(extra)} not ${adj}`, missing && `${missing} ${adj} ${pl(missing)} missing`].filter(Boolean).join(', ')}.`);
    } else if (step.kind === 'number') {
      if (!parseRational(text)) return setMessage('Enter a number, a fraction like 2/3, or a decimal.');
      if (tries === 0) firstResponse.current = text.trim();
      if (sameNumber(text, step.answer)) return setStatus('correct');
      wrong('Not quite. Check that step and try again.');
    } else if (step.kind === 'fields') {
      if (step.fields.some((f) => !parseRational(fieldVals[f.id] ?? ''))) return setMessage('Fill in every box with a number.');
      if (tries === 0) firstResponse.current = step.fields.map((f) => `${f.label}=${fieldVals[f.id]}`).join(', ');
      const bad = step.fields.filter((f) => !sameNumber(fieldVals[f.id] ?? '', f.answer)).map((f) => f.id);
      setBadFields(bad);
      if (!bad.length) return setStatus('correct');
      wrong(`${bad.length} of ${step.fields.length} ${bad.length === 1 ? 'box is' : 'boxes are'} not right yet.`);
    }
  }

  function finish() {
    if (step.kind === 'self') return onDone({ graded: false, firstTry: false, tries: 0, hints: 0, revealed: true });
    onDone({ graded: true, firstTry: tries === 0 && status === 'correct', tries: tries + (status === 'correct' ? 1 : 0), hints, revealed: status === 'revealed', firstResponse: firstResponse.current });
  }

  const correctLabel =
    step.kind === 'choice' ? step.options[step.answers[0]] : step.kind === 'multi' ? step.correct.map((i) => step.options[i]).join('; ') : step.kind === 'number' ? step.answer : step.kind === 'fields' ? step.fields.map((f) => `${f.label} = ${f.answer}`).join(', ') : '';

  return (
    <section className="card guided-step" aria-labelledby={`gs-${step.id}`}>
      <h3 id={`gs-${step.id}`} className="guided-step-title">
        <span className="guided-num">Step {number}</span> {title}
        {step.kind === 'self' && <Tag>Self-check</Tag>}
      </h3>
      <MathText text={step.prompt} />

      {step.kind === 'choice' && (
        <div className="options" role="group" aria-label={title}>
          {order.map((i) => {
            const state = done && step.answers.includes(i) ? 'correct' : eliminated.includes(i) ? 'incorrect' : 'idle';
            return (
              <button key={i} type="button" className={`option option-${state}`} disabled={done || eliminated.includes(i)} onClick={() => check(i)}>
                <MathText text={step.options[i]} />
              </button>
            );
          })}
        </div>
      )}

      {step.kind === 'multi' && (
        <>
          <div className="options" role="group" aria-label={title}>
            {order.map((i) => {
              const on = picked.includes(i);
              const state = done ? (step.correct.includes(i) ? 'correct' : on ? 'incorrect' : 'idle') : on ? 'selected' : 'idle';
              return (
                <button key={i} type="button" role="checkbox" aria-checked={on} className={`option option-${state}`} disabled={done} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== i) : [...p, i]))}>
                  <MathText text={step.options[i]} />
                </button>
              );
            })}
          </div>
          {!done && (
            <div className="actions">
              <button className="btn btn-primary" onClick={() => check()}>
                Check
              </button>
            </div>
          )}
        </>
      )}

      {step.kind === 'number' && (
        <div className="numeric-entry">
          <label htmlFor={`gn-${step.id}`}>Your value</label>
          <input id={`gn-${step.id}`} autoComplete="off" value={text} disabled={done} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && check()} placeholder="e.g. 12, -5, 2/3, 6.5" />
          {!done && (
            <div className="actions">
              <button className="btn btn-primary" onClick={() => check()}>
                Check
              </button>
            </div>
          )}
        </div>
      )}

      {step.kind === 'fields' && (
        <div className="guided-fields">
          {step.fields.map((f) => (
            <label key={f.id} className={badFields.includes(f.id) && !done ? 'bad' : ''}>
              <span>{f.label}</span>
              <input
                autoComplete="off"
                aria-invalid={badFields.includes(f.id) && !done}
                value={done && status === 'revealed' ? f.answer : (fieldVals[f.id] ?? '')}
                disabled={done}
                onChange={(e) => setFieldVals((v) => ({ ...v, [f.id]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && check()}
              />
            </label>
          ))}
          {!done && (
            <div className="actions">
              <button className="btn btn-primary" onClick={() => check()}>
                Check
              </button>
            </div>
          )}
        </div>
      )}

      {step.kind === 'self' && (
        <>
          {!committed ? (
            <div className="actions">
              <button className="btn btn-primary" onClick={() => setCommitted(true)}>
                I’ve done this — compare
              </button>
            </div>
          ) : (
            <>
              <ul className="guided-reveal">
                {step.reveal.map((l, i) => (
                  <li key={i}>
                    <MathText text={l} />
                  </li>
                ))}
              </ul>
              <div className="actions">
                <button className="btn btn-primary" onClick={finish}>
                  Continue →
                </button>
              </div>
            </>
          )}
        </>
      )}

      {message && !done && (
        <p className="invalid" role="status">
          {message}
        </p>
      )}
      {!done && hints > 0 && (
        <div className="hints">
          {hintList.slice(0, hints).map((h, i) => (
            <p key={i} className="hint">
              <strong>Hint {i + 1}:</strong> <MathText text={h} />
            </p>
          ))}
        </div>
      )}
      {!done && step.kind !== 'self' && (
        <div className="actions">
          {hints < hintList.length && (
            <button className="btn" onClick={() => setHints((h) => h + 1)}>
              {hints === 0 ? 'Give Me a Hint' : 'Another Hint'}
            </button>
          )}
          {tries >= 2 && (
            <button className="btn" onClick={() => setStatus('revealed')}>
              Show Me
            </button>
          )}
        </div>
      )}

      {done && step.kind !== 'self' && (
        <Feedback tone={status === 'revealed' ? 'info' : tries === 0 ? 'correct' : 'partial'} title={status === 'revealed' ? 'Here is the answer to this step.' : tries === 0 ? 'Correct.' : `Correct after ${tries + 1} tries.`}>
          {status === 'revealed' && (
            <p>
              <MathText text={correctLabel} />
            </p>
          )}
          <p>
            <MathText text={step.explain} />
          </p>
          <div className="actions">
            <button className="btn btn-primary" onClick={finish} autoFocus>
              Continue →
            </button>
          </div>
        </Feedback>
      )}
    </section>
  );
}

/** A finished step, shown compactly above the current one (later steps are never shown). */
function DoneStep({ number, title, step, outcome }: { number: string; title: string; step: RunStep; outcome: StepOutcome }) {
  const mark = !outcome.graded ? '○' : outcome.firstTry ? '✓' : outcome.revealed ? '–' : '◐';
  const summary =
    step.kind === 'choice'
      ? step.options[step.answers[0]]
      : step.kind === 'multi'
        ? step.correct.map((i) => step.options[i]).join('; ')
        : step.kind === 'number'
          ? step.answer
          : step.kind === 'fields'
            ? step.fields.map((f) => `${f.label} = ${f.answer}`).join(', ')
            : step.reveal.join(' ');
  return (
    <li className="guided-done">
      <span className={`guided-mark ${outcome.firstTry ? 'ok' : ''}`} aria-hidden="true">
        {mark}
      </span>
      <div>
        <strong>
          Step {number}: {title}
        </strong>
        <span className="sr-only">{!outcome.graded ? 'self-check' : outcome.firstTry ? 'correct first try' : outcome.revealed ? 'answer shown' : `correct after ${outcome.tries} tries`}</span>
        <div className="note">
          <MathText text={summary} />
        </div>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* A whole walkthrough                                                 */
/* ------------------------------------------------------------------ */

interface Entry {
  number: string;
  title: string;
  step: RunStep;
  outcome: StepOutcome;
}

export function GuidedRun({ q }: { q: Question }) {
  const guide = GUIDE_BY_QID[q.id];
  const opening = useMemo(() => openingSteps(q, guide), [q, guide]);
  const [done, setDone] = useState<Entry[]>([]);
  const [track, setTrack] = useState<'fast' | 'long' | null>(guide?.long ? null : 'fast');
  const [extraTrack, setExtraTrack] = useState<Entry[] | null>(null);
  const methods = useMemo(() => (track ? methodSteps(q, guide ? (track === 'long' ? guide.long : guide.fast) : undefined) : []), [q, guide, track]);
  const started = useRef(Date.now());

  const plan = [...opening, ...methods];
  const numberOf = (i: number) => (i < 6 ? String(i + 1) : `7${String.fromCharCode(97 + i - 6)}`);
  const current = done.length < plan.length ? plan[done.length] : null;
  const atTrackChoice = done.length === opening.length && track === null;

  function complete(i: number, outcome: StepOutcome) {
    const { title, step } = plan[i];
    const e: Entry = { number: numberOf(i), title, step, outcome };
    setDone((d) => [...d, e]);
    record(q, step.id, outcome, 'guided');
  }

  const trace: GuidedTrace = { guide: guide ? 'full' : 'basic', track: track ?? undefined, steps: done.map((e) => ({ id: e.step.id, ...e.outcome })) };

  return (
    <div className="guided">
      <QuestionStem q={q} />
      <p className="note">
        {guide ? (
          <>
            <Tag tone="accent">Full guide</Tag> Every step is checked. You will only see the next step after finishing this one.
          </>
        ) : (
          <>
            <Tag>Basic guide</Tag> This question does not have a fully authored guide yet. Steps 1, 2, 4, 5, 6, 8, and 9 are checked; steps 3 and 7 are self-checks where you compare your thinking with the worked solution.
          </>
        )}
      </p>

      {done.length > 0 && (
        <ol className="guided-trail" aria-label="Completed steps">
          {done.map((e) => (
            <DoneStep key={e.step.id} {...e} />
          ))}
        </ol>
      )}

      {atTrackChoice && guide?.long && (
        <section className="card guided-step" aria-labelledby="gs-track">
          <h3 id="gs-track" className="guided-step-title">
            <span className="guided-num">Choose a path</span> This problem has a fast route and a traditional route.
          </h3>
          <div className="options">
            <button className="option" onClick={() => setTrack('fast')}>
              <strong>Fast track:</strong> {guide.fast.label}
            </button>
            <button className="option" onClick={() => setTrack('long')}>
              <strong>Traditional track:</strong> {guide.long.label}
            </button>
          </div>
          <p className="note">You can walk the other path after you finish.</p>
        </section>
      )}

      {current && !atTrackChoice && <StepCard key={current.step.id + track} number={numberOf(done.length)} title={current.title} step={current.step} onDone={(o) => complete(done.length, o)} />}

      {!current && track && <FinalStep q={q} trace={trace} startedAt={started.current} />}

      {!current && track && guide?.long && (
        <OtherTrack q={q} guide={guide} first={track} entries={extraTrack} setEntries={setExtraTrack} />
      )}
    </div>
  );
}

function record(q: Question, stepId: string, o: StepOutcome, mode: string) {
  if (!o.graded) return; // self-checks are not graded, so they are not counted anywhere
  const kind = stepId === 'type' ? 'recognition' : stepId === 'first' ? 'first-step' : 'guided-step';
  recordAttempt({
    kind,
    ref: kind === 'guided-step' ? `${q.id}:${stepId}` : q.id,
    result: o.firstTry ? 'correct' : 'incorrect',
    category: q.category,
    area: q.area,
    difficulty: q.difficulty,
    format: q.format,
    topic: q.topic,
    hintsUsed: o.hints,
    detail: o.firstResponse,
    mode,
  });
}

function OtherTrack({ q, guide, first, entries, setEntries }: { q: Question; guide: Guide; first: 'fast' | 'long'; entries: Entry[] | null; setEntries: (e: Entry[] | null) => void }) {
  const other = first === 'fast' ? guide.long! : guide.fast;
  const steps = useMemo(() => methodSteps(q, other), [q, other]);
  if (!entries)
    return (
      <div className="actions">
        <button className="btn" onClick={() => setEntries([])}>
          Walk the {first === 'fast' ? 'traditional' : 'fast'} path too: {other.label}
        </button>
      </div>
    );
  const cur = entries.length < steps.length ? steps[entries.length] : null;
  return (
    <div className="guided-other">
      <h3 className="section-title">{other.label}</h3>
      {entries.length > 0 && (
        <ol className="guided-trail">
          {entries.map((e) => (
            <DoneStep key={e.step.id} {...e} />
          ))}
        </ol>
      )}
      {cur ? (
        <StepCard
          key={'other-' + cur.step.id}
          number={`${entries.length + 6}′`}
          title={cur.title}
          step={cur.step}
          onDone={(o) => {
            setEntries([...entries, { number: `${entries.length + 6}′`, title: cur.title, step: cur.step, outcome: o }]);
            record(q, cur.step.id, o, 'guided-other-track');
          }}
        />
      ) : (
        <Feedback tone="info" title="Both paths reach the same answer.">
          <p>{guide.long ? 'Compare the number of steps: on the test, use the shorter path when you recognize the pattern, and the traditional one when you do not.' : ''}</p>
        </Feedback>
      )}
    </div>
  );
}

function FinalStep({ q, trace, startedAt }: { q: Question; trace: GuidedTrace; startedAt: number }) {
  const [response, setResponse] = useState<Response>(() => emptyResponse(q));
  const [tries, setTries] = useState(0);
  const [status, setStatus] = useState<'open' | 'correct' | 'revealed'>('open');
  const [message, setMessage] = useState<string | null>(null);
  const [first, setFirst] = useState<{ id: string; ts: number; ms: number; response: Response; correct: boolean; trace: GuidedTrace } | null>(null);
  const done = status !== 'open';
  const faster = useMemo(() => fasterStep(q), [q]);
  const [fasterDone, setFasterDone] = useState<StepOutcome | null>(null);

  function submit() {
    if (!isAnswered(response)) return setMessage('Enter or select an answer first.');
    const g = grade(q, response);
    if (g === 'invalid') return setMessage('Enter a number, a fraction like 2/15, or a decimal.');
    setMessage(null);
    if (!first) {
      const ms = Date.now() - startedAt;
      const fullTrace: GuidedTrace = { ...trace, steps: [...trace.steps, { id: 'final', graded: true, firstTry: g === 'correct', tries: 1, hints: 0, revealed: false, firstResponse: serializeResponse(response) }] };
      const id = recordAttempt({
        kind: 'answer',
        ref: q.id,
        result: g,
        category: q.category,
        area: q.area,
        difficulty: q.difficulty,
        format: q.format,
        topic: q.topic,
        ms,
        hintsUsed: trace.steps.reduce((s, x) => s + x.hints, 0),
        detail: 'guided',
        mode: 'guided',
        selected: serializeResponse(response),
        correctAnswer: serializeAnswer(q.answer),
        trace: fullTrace,
      });
      setFirst({ id, ts: Date.now(), ms, response, correct: g === 'correct', trace: fullTrace });
    }
    if (g === 'correct') setStatus('correct');
    else {
      setTries((t) => t + 1);
      setMessage('Not correct yet. Look back at your completed steps above, then try again.');
    }
  }

  const struggles = strugglesIn(trace);
  const firstStruggle = struggles[0];
  const rec = firstStruggle ? recommendation(STEP_MISTAKE[firstStruggle.id.startsWith('next:') ? 'next' : firstStruggle.id].type, q) : null;

  return (
    <>
      <section className="card guided-step" aria-labelledby="gs-final">
        <h3 id="gs-final" className="guided-step-title">
          <span className="guided-num">Step 8</span> What is the final answer?
        </h3>
        <ExamAnswer q={q} value={response} onChange={(r) => !done && setResponse(r)} />
        {message && !done && (
          <p className="invalid" role="status">
            {message}
          </p>
        )}
        {!done && tries > 0 && (
          <div className="hints">
            {q.hints.slice(0, tries).map((h, i) => (
              <p key={i} className="hint">
                <strong>Hint {i + 1}:</strong> <MathText text={h} />
              </p>
            ))}
          </div>
        )}
        {!done && (
          <div className="actions">
            <button className="btn btn-primary" onClick={submit}>
              Submit Final Answer
            </button>
            {tries >= 2 && (
              <button className="btn" onClick={() => setStatus('revealed')}>
                Show the Solution
              </button>
            )}
          </div>
        )}
      </section>

      {done && (
        <>
          <Feedback tone={status === 'revealed' ? 'incorrect' : first?.correct ? 'correct' : 'partial'} title={status === 'revealed' ? 'Here is the full solution.' : first?.correct ? 'Correct!' : `Correct after ${tries + 1} tries.`}>
            <p>
              Steps right on the first try: {trace.steps.filter((s) => s.graded && s.firstTry).length} of {trace.steps.filter((s) => s.graded).length} checked steps
              {trace.steps.some((s) => !s.graded) && ` (${trace.steps.filter((s) => !s.graded).length} self-check${trace.steps.filter((s) => !s.graded).length === 1 ? '' : 's'} not graded)`}.
            </p>
            {struggles.length > 0 ? (
              <p>
                <strong>Where you needed help:</strong> {struggles.map((s) => STEP_MISTAKE[s.id.startsWith('next:') ? 'next' : s.id].what).join('; ')}.
              </p>
            ) : (
              <p>You did not need help on any checked step.</p>
            )}
            {rec && first?.correct && (
              <p className="next-step">
                <strong>Next:</strong> {rec.why}{' '}
                <a className="link-btn" href={rec.href}>
                  {rec.label} →
                </a>
              </p>
            )}
          </Feedback>
          {first && !first.correct && <MistakePanel q={q} attemptId={first.id} response={first.response} attempt={{ ts: first.ts, ms: first.ms, mode: 'guided' }} trace={first.trace} />}
          {faster && !fasterDone && (
            <StepCard
              number="9"
              title="Is there a faster valid approach?"
              step={faster}
              onDone={(o) => {
                setFasterDone(o);
                record(q, 'faster', o, 'guided');
              }}
            />
          )}
          {faster && fasterDone && (
            <ol className="guided-trail" aria-label="Step 9">
              <DoneStep number="9" title="Is there a faster valid approach?" step={faster} outcome={fasterDone} />
            </ol>
          )}
          {(!faster || fasterDone) && <Explanation q={q} />}
        </>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Module                                                              */
/* ------------------------------------------------------------------ */

export function Guided({ qid }: { qid?: string }) {
  const q = qid ? QUESTION_BY_ID[qid] : undefined;
  const [runKey, setRunKey] = useState(0);
  return (
    <div className="module">
      <header className="module-head">
        <h2>Walk Me Through It</h2>
        <p className="lede">Solve one question in eight checked steps: what is asked, what is given, what the symbols mean, the problem type, the first step, the operation, what comes next, and the final answer. Wrong tries get progressive hints; you can always try again.</p>
      </header>
      {qid && !q && <p className="empty">That question was not found. Choose one below.</p>}
      {q ? (
        <>
          <GuidedRun key={q.id + runKey} q={q} />
          <div className="actions">
            <button className="btn" onClick={() => setRunKey((k) => k + 1)}>
              Start this walkthrough over
            </button>
            <a className="btn" href="#/guided">
              Choose another question
            </a>
          </div>
        </>
      ) : (
        <GuidedPicker />
      )}
    </div>
  );
}

function GuidedPicker() {
  const [area, setArea] = useState<Area | 'all'>('all');
  const [basicId, setBasicId] = useState('');
  const guided = GUIDES.map((g) => QUESTION_BY_ID[g.qid]).filter((q) => q && (area === 'all' || q.area === area));
  const others = QUESTIONS.filter((q) => !GUIDE_BY_QID[q.id]);
  return (
    <>
      <div className="filter-bar">
        <label>
          <span>Area</span>
          <select value={area} onChange={(e) => setArea(e.target.value as Area | 'all')}>
            <option value="all">All areas</option>
            {(Object.keys(AREAS) as Area[]).map((a) => (
              <option key={a} value={a}>
                {AREAS[a]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <h3 className="section-title">
        Fully guided questions <span className="count">({guided.length})</span>
      </h3>
      <ul className="guided-list">
        {guided.map((q) => (
          <li key={q.id}>
            <a href={href.guided(q.id)}>
              <strong>{q.topic}</strong>
              <span className="note">
                {CATEGORIES[q.category]}
                {GUIDE_BY_QID[q.id].long ? ' · fast and traditional paths' : ''}
              </span>
            </a>
          </li>
        ))}
      </ul>
      <h3 className="section-title">Any other question (basic guide)</h3>
      <div className="filter-bar">
        <label>
          <span>Question</span>
          <select value={basicId} onChange={(e) => setBasicId(e.target.value)}>
            <option value="">Choose a question…</option>
            {others.map((q) => (
              <option key={q.id} value={q.id}>
                {CATEGORIES[q.category]} · {q.topic}
              </option>
            ))}
          </select>
        </label>
        <a className={`btn ${basicId ? '' : 'disabled'}`} aria-disabled={!basicId} href={basicId ? href.guided(basicId) : undefined}>
          Start
        </a>
      </div>
      <p className="note">Every walkthrough records which steps needed help. A missed final answer goes to the Review queue, and its cause is diagnosed from those steps (or you are asked when the steps do not point to one cause).</p>
    </>
  );
}
