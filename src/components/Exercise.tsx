import { useState } from 'react';
import type { DecodeExercise } from '../data/decodeLessons';
import { parseRational, rationalEquals } from '../lib/grading';
import { recordAttempt, type AttemptKind } from '../lib/progress';
import { MathText } from './MathText';
import { Feedback } from './ui';

type FieldResult = 'correct' | 'incorrect' | 'invalid' | null;

export function Exercise({
  exercise,
  refPrefix,
  kind = 'decode-exercise',
  helpLink,
}: {
  exercise: DecodeExercise;
  refPrefix: string;
  /** Which tracker bucket the result counts toward. */
  kind?: AttemptKind;
  /** Shown when a field is answered incorrectly, e.g. "Learn What This Means". */
  helpLink?: { href: string; label: string };
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, FieldResult>>({});
  const [checked, setChecked] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const allCorrect = exercise.fields.every((f) => results[f.id] === 'correct');

  function check() {
    const res: Record<string, FieldResult> = {};
    for (const f of exercise.fields) {
      const v = values[f.id] ?? '';
      if (f.kind === 'number') {
        const got = parseRational(v);
        const want = parseRational(f.answer)!;
        res[f.id] = !v.trim() ? 'invalid' : !got ? 'invalid' : rationalEquals(got, want) ? 'correct' : 'incorrect';
      } else {
        res[f.id] = v === '' ? 'invalid' : Number(v) === f.answer ? 'correct' : 'incorrect';
      }
    }
    setResults(res);
    setChecked(true);
    const blank = Object.values(res).some((r) => r === 'invalid');
    if (!recorded && !blank) {
      setRecorded(true);
      recordAttempt({ kind, ref: `${refPrefix}:${exercise.id}`, result: Object.values(res).every((r) => r === 'correct') ? 'correct' : 'incorrect' });
    }
  }

  function showAnswers() {
    const v: Record<string, string> = {};
    for (const f of exercise.fields) v[f.id] = f.kind === 'number' ? f.answer : String(f.answer);
    setValues(v);
    setRevealed(true);
    setResults(Object.fromEntries(exercise.fields.map((f) => [f.id, 'correct' as const])));
    if (!recorded) {
      setRecorded(true);
      recordAttempt({ kind, ref: `${refPrefix}:${exercise.id}`, result: 'incorrect', detail: 'revealed' });
    }
  }

  return (
    <div className="exercise">
      <p className="exercise-prompt">
        <MathText text={exercise.prompt} />
      </p>
      <div className="fields">
        {exercise.fields.map((f) => {
          const r = results[f.id];
          const id = `${refPrefix}-${exercise.id}-${f.id}`;
          return (
            <div key={f.id} className={`field ${r ? `field-${r}` : ''}`}>
              {f.kind === 'number' ? (
                <>
                  <label htmlFor={id}>
                    <MathText text={f.label} /> =
                  </label>
                  <input
                    id={id}
                    autoComplete="off"
                    value={values[f.id] ?? ''}
                    disabled={revealed || r === 'correct'}
                    onChange={(e) => {
                      setValues({ ...values, [f.id]: e.target.value });
                      setResults({ ...results, [f.id]: null });
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && check()}
                  />
                </>
              ) : (
                <fieldset>
                  <legend>
                    <MathText text={f.label} />
                  </legend>
                  {f.options.map((o, i) => (
                    <label key={i} className="radio">
                      <input
                        type="radio"
                        name={id}
                        checked={values[f.id] === String(i)}
                        disabled={revealed || r === 'correct'}
                        onChange={() => {
                          setValues({ ...values, [f.id]: String(i) });
                          setResults({ ...results, [f.id]: null });
                        }}
                      />{' '}
                      <MathText text={o} />
                    </label>
                  ))}
                </fieldset>
              )}
              {r === 'correct' && <span className="field-mark">✓</span>}
              {r === 'incorrect' && (
                <p className="field-explain">
                  ✗ <MathText text={f.explain} />
                </p>
              )}
              {r === 'invalid' && checked && <p className="field-explain">Enter a value (numbers, fractions like 3/4, or negatives like −11).</p>}
              {r === 'correct' && (checked || revealed) && (
                <p className="field-explain ok">
                  <MathText text={f.explain} />
                </p>
              )}
            </div>
          );
        })}
      </div>
      {helpLink && Object.values(results).includes('incorrect') && (
        <p className="help-link">
          <a href={helpLink.href}>{helpLink.label} →</a>
        </p>
      )}
      {!allCorrect && (
        <div className="actions">
          <button className="btn btn-primary" onClick={check}>
            Check
          </button>
          {checked && (
            <button className="btn" onClick={showAnswers}>
              Show answers
            </button>
          )}
        </div>
      )}
      {allCorrect && (
        <Feedback tone={revealed ? 'info' : 'correct'} title={revealed ? 'Answers shown. Read each explanation above.' : 'All parts identified correctly.'}>
          {exercise.reveal && (
            <ul className="reveal-list">
              {exercise.reveal.map((x, i) => (
                <li key={i}>
                  <MathText text={x} />
                </li>
              ))}
            </ul>
          )}
        </Feedback>
      )}
    </div>
  );
}

