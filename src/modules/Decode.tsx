import { useMemo, useState } from 'react';
import { MathText, Tex } from '../components/MathText';
import { Exercise } from '../components/Exercise';
import { DECODE_LESSONS, type DecodeExercise, type DecodeLesson } from '../data/decodeLessons';
import { DECODE_LESSON_FORMULA, DECODE_LESSON_LIBRARY, href } from '../data/links';
import type { AttemptKind } from '../lib/progress';
import { formatEquation, rearrangedQuadratic, standardQuadratic, formatSide } from '../lib/generators';

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
          <Exercise exercise={ex} refPrefix={lesson.id} helpLink={{ href: href.formula(DECODE_LESSON_FORMULA[lesson.id]), label: 'Learn What This Means' }} />
        </section>
      ))}

      {lesson.generator === 'quadratic' && <QuadraticPractice />}
      <p className="note">
        Go deeper: <a href={href.lesson(DECODE_LESSON_LIBRARY[lesson.id])}>full Topic Library lesson</a> ·{' '}
        <a href={href.formula(DECODE_LESSON_FORMULA[lesson.id])}>Understand the Formula</a>
      </p>
    </article>
  );
}

/** Unlimited generated practice: identify a, b, c (standard or rearranged). Coefficients are computed, not authored. */
export function QuadraticPractice({ kind = 'decode-exercise' as AttemptKind, refPrefix = 'quadratic' }: { kind?: AttemptKind; refPrefix?: string } = {}) {
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
      <Exercise key={`${mode}-${seed}`} exercise={exercise} refPrefix={refPrefix} kind={kind} helpLink={{ href: href.formula('quadratic-standard'), label: 'Learn What This Means' }} />
      <div className="actions">
        <button className="btn" onClick={() => setSeed((s) => s + 1)}>
          New equation
        </button>
      </div>
    </section>
  );
}
