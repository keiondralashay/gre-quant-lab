import { useMemo, useState } from 'react';
import { MathText, Tex } from '../components/MathText';
import { Feedback } from '../components/ui';
import { DECODE_LESSONS, type DecodeExercise, type DecodeLesson } from '../data/decodeLessons';
import { formatEquation, rearrangedQuadratic, standardQuadratic, formatSide } from '../lib/generators';
import { parseRational, rationalEquals } from '../lib/grading';
import { recordAttempt } from '../lib/progress';

export function Decode({ initialLesson }: { initialLesson?: string }) {
  const [lessonId, setLessonId] = useState(initialLesson && DECODE_LESSONS.some((l) => l.id === initialLesson) ? initialLesson : DECODE_LESSONS[0].id);
  const lesson = DECODE_LESSONS.find((l) => l.id === lessonId)!;
  return (
    <div className="module">
      <header className="module-head">
        <h2>Decode the Equation</h2>
        <p className="lede">Before solving, name every part: what each letter, number, and symbol stands for. Nothing is assumed.</p>
      </header>
      <nav className="chip-row" aria-label="Decode lessons">
        {DECODE_LESSONS.map((l) => (
          <button key={l.id} className={`chip ${l.id === lessonId ? 'active' : ''}`} aria-pressed={l.id === lessonId} onClick={() => setLessonId(l.id)}>
            {l.title}
          </button>
        ))}
      </nav>
      <LessonView key={lesson.id} lesson={lesson} />
    </div>
  );
}

function LessonView({ lesson }: { lesson: DecodeLesson }) {
  return (
    <article className="lesson">
      <section className="card">
        <h3>{lesson.title}</h3>
        <p>
          <MathText text={lesson.summary} />
        </p>
        {lesson.form && (
          <div className="form-display">
            <Tex tex={lesson.form} display />
          </div>
        )}
        <table className="parts-table">
          <thead>
            <tr>
              <th scope="col">Part</th>
              <th scope="col">What it means</th>
            </tr>
          </thead>
          <tbody>
            {lesson.parts.map((p, i) => (
              <tr key={i}>
                <td>
                  <MathText text={p.symbol} />
                </td>
                <td>
                  <MathText text={p.meaning} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h4>Worked example</h4>
        <div className="form-display">
          <Tex tex={lesson.example.expr} display />
        </div>
        <ul className="breakdown">
          {lesson.example.breakdown.map((b, i) => (
            <li key={i}>
              <MathText text={b} />
            </li>
          ))}
        </ul>
        {lesson.example.notes.map((n, i) => (
          <p key={i} className="note">
            <MathText text={n} />
          </p>
        ))}
      </section>

      {lesson.exercises.map((ex, i) => (
        <section key={ex.id} className="card">
          <h4>Your turn {lesson.exercises.length > 1 ? `(${i + 1} of ${lesson.exercises.length})` : ''}</h4>
          <Exercise exercise={ex} refPrefix={lesson.id} />
        </section>
      ))}

      {lesson.generator === 'quadratic' && <QuadraticPractice />}
    </article>
  );
}

type FieldResult = 'correct' | 'incorrect' | 'invalid' | null;

export function Exercise({ exercise, refPrefix }: { exercise: DecodeExercise; refPrefix: string }) {
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
      recordAttempt({ kind: 'decode-exercise', ref: `${refPrefix}:${exercise.id}`, result: Object.values(res).every((r) => r === 'correct') ? 'correct' : 'incorrect' });
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
      recordAttempt({ kind: 'decode-exercise', ref: `${refPrefix}:${exercise.id}`, result: 'incorrect', detail: 'revealed' });
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

/** Unlimited generated practice: identify a, b, c (standard or rearranged). Coefficients are computed, not authored. */
function QuadraticPractice() {
  const [mode, setMode] = useState<'standard' | 'rearranged'>('standard');
  const [seed, setSeed] = useState(0);
  const exercise = useMemo<DecodeExercise>(() => {
    const eq = mode === 'standard' ? standardQuadratic() : rearrangedQuadratic();
    const tex = formatEquation(eq);
    const std = formatSide([
      { coef: eq.a, power: 2 },
      { coef: eq.b, power: 1 },
      { coef: eq.c, power: 0 },
    ]);
    return {
      id: `gen-${mode}`,
      prompt: mode === 'standard' ? `Identify a, b, and c in $${tex}$.` : `Rearrange $${tex}$ into standard form (keep $x^2$ on the left), then identify a, b, and c.`,
      fields: [
        { id: 'a', label: 'a', kind: 'number', answer: String(eq.a), explain: eq.a === 1 ? 'No number is written in front of x², so a = 1.' : `The coefficient of x² is ${eq.a}.` },
        { id: 'b', label: 'b', kind: 'number', answer: String(eq.b), explain:
            mode === 'standard'
              ? `The coefficient of x is ${eq.b}. The sign in front of the term belongs to b.`
              : `Standard form is $${std} = 0$, so b = ${eq.b}. Moving a term across the = sign flips its sign.`,
        },
        { id: 'c', label: 'c', kind: 'number', answer: String(eq.c), explain: `The constant in $${std} = 0$ is ${eq.c}.` },
      ],
      reveal: [`Standard form: $${std} = 0$`],
    };
    // seed forces a new equation
  }, [mode, seed]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="card">
      <h4>Extra practice: generated equations</h4>
      <p className="note">These equations are generated fresh each time, and the answer key is computed from the generated coefficients.</p>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={mode === 'standard'} className={mode === 'standard' ? 'active' : ''} onClick={() => setMode('standard')}>
          Standard form
        </button>
        <button role="tab" aria-selected={mode === 'rearranged'} className={mode === 'rearranged' ? 'active' : ''} onClick={() => setMode('rearranged')}>
          Needs rearranging
        </button>
      </div>
      <Exercise key={`${mode}-${seed}`} exercise={exercise} refPrefix="quadratic" />
      <div className="actions">
        <button className="btn" onClick={() => setSeed((s) => s + 1)}>
          New equation
        </button>
      </div>
    </section>
  );
}
