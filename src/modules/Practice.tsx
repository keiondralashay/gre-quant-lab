import { useMemo, useState } from 'react';
import { DecodePanel } from '../components/DecodePanel';
import { MathText } from '../components/MathText';
import { QuestionSolver } from '../components/QuestionSolver';
import { QuestionStem } from '../components/QuestionStem';
import { LESSON_BY_ID, LESSONS_BY_AREA } from '../data/library';
import { href, questionsForLesson, QUESTION_SHORTCUT } from '../data/links';
import { QUESTION_BY_ID, QUESTIONS } from '../data/questions';
import { SHORTCUT_BY_ID } from '../data/shortcuts';
import { AREAS } from '../data/taxonomy';
import type { Area, Question } from '../data/types';
import { shuffle } from '../lib/random';
import { MethodRound } from './ChooseMethod';
import { TypeRound } from './Recognize';

export type PracticeMode = 'recognition' | 'decode' | 'strategy' | 'solve' | 'shortcut';

const MODES: { id: PracticeMode; label: string; desc: string }[] = [
  { id: 'recognition', label: 'Recognition', desc: 'Identify the concept without solving.' },
  { id: 'decode', label: 'Decode', desc: 'Identify what is asked, what is given, the variables, symbols, and restrictions.' },
  { id: 'strategy', label: 'Strategy', desc: 'Choose the fastest valid method.' },
  { id: 'solve', label: 'Solve', desc: 'Solve independently. The topic stays hidden until you answer.' },
  { id: 'shortcut', label: 'Shortcut', desc: 'Apply a named shortcut to a GRE-style question.' },
];

export function practicePool(lessonId: string | null, mode: PracticeMode, level: 1 | 2 | 3 | 'all'): Question[] {
  const base = lessonId ? questionsForLesson(lessonId).map((id) => QUESTION_BY_ID[id]) : QUESTIONS;
  return base.filter((q) => (level === 'all' || q.difficulty === level) && (mode !== 'shortcut' || QUESTION_SHORTCUT[q.id]));
}

export function Practice({ lesson, mode, level }: { lesson?: string; mode?: string; level?: string }) {
  const [lessonId, setLessonId] = useState<string | null>(lesson && LESSON_BY_ID[lesson] ? lesson : null);
  const [m, setM] = useState<PracticeMode>(MODES.some((x) => x.id === mode) ? (mode as PracticeMode) : 'solve');
  const [lv, setLv] = useState<1 | 2 | 3 | 'all'>(level === '1' || level === '2' || level === '3' ? (Number(level) as 1 | 2 | 3) : 'all');
  const pool = practicePool(lessonId, m, lv);
  const key = `${lessonId}-${m}-${lv}`;

  return (
    <div className="module">
      <header className="module-head">
        <h2>Topic Practice</h2>
        <p className="lede">Pick a lesson (or mixed topics), a skill, and a difficulty. Every question here comes from the verified question bank.</p>
      </header>
      <div className="filter-bar">
        <label>
          <span>Topic</span>
          <select value={lessonId ?? ''} onChange={(e) => setLessonId(e.target.value || null)}>
            <option value="">Mixed — all topics (topic hidden)</option>
            {(Object.keys(AREAS) as Area[]).map((a) => (
              <optgroup key={a} label={AREAS[a]}>
                {LESSONS_BY_AREA[a].map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title} ({questionsForLesson(l.id).length})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label>
          <span>Difficulty</span>
          <select value={String(lv)} onChange={(e) => setLv(e.target.value === 'all' ? 'all' : (Number(e.target.value) as 1 | 2 | 3))}>
            <option value="all">All levels</option>
            <option value="1">Foundational</option>
            <option value="2">Intermediate</option>
            <option value="3">Challenging</option>
          </select>
        </label>
      </div>
      <div className="tabs" role="tablist" aria-label="Practice skill">
        {MODES.map((x) => (
          <button key={x.id} role="tab" aria-selected={m === x.id} className={m === x.id ? 'active' : ''} onClick={() => setM(x.id)}>
            {x.label}
          </button>
        ))}
      </div>
      <p className="note">{MODES.find((x) => x.id === m)!.desc}</p>
      {lessonId && (
        <p className="note">
          Lesson: <a href={href.lesson(lessonId)}>{LESSON_BY_ID[lessonId].title}</a>
        </p>
      )}
      {pool.length === 0 ? (
        <p className="empty">
          No bank questions match this topic, skill, and difficulty yet.{' '}
          {lv !== 'all' ? 'Try “All levels”.' : m === 'shortcut' ? 'This lesson’s shortcuts are practiced in the Vault drills.' : ''}
          {m === 'shortcut' && lessonId && LESSON_BY_ID[lessonId].shortcuts?.length ? (
            <>
              {' '}
              {LESSON_BY_ID[lessonId].shortcuts!.map((s) => (
                <a key={s} className="chip" href={href.shortcut(s, true)}>
                  {SHORTCUT_BY_ID[s].name}
                </a>
              ))}
            </>
          ) : null}
        </p>
      ) : (
        <PracticeRun key={key} pool={pool} mode={m} />
      )}
      <section>
        <h3 className="section-title">Phase 1 trainers (mixed topics)</h3>
        <p className="chip-links">
          <a className="chip" href="#/recognize">
            Recognize the Problem
          </a>
          <a className="chip" href="#/recognize?mode=first">
            What would you do FIRST?
          </a>
          <a className="chip" href="#/decode">
            Decode the Equation
          </a>
          <a className="chip" href="#/method">
            What’s the Fastest Way?
          </a>
          <a className="chip" href="#/shortcut">
            Shortcut vs. Traditional
          </a>
        </p>
      </section>
    </div>
  );
}

function PracticeRun({ pool, mode }: { pool: Question[]; mode: PracticeMode }) {
  const order = useMemo(() => shuffle(pool.map((q) => q.id)), [pool]);
  const [i, setI] = useState(0);
  const [override, setOverride] = useState<string | null>(null);
  const q = QUESTION_BY_ID[override ?? order[i % order.length]];
  const next = () => {
    setOverride(null);
    setI((n) => n + 1);
  };
  const props = { q, onNext: next, onShow: (id: string) => setOverride(id), position: (i % order.length) + 1, size: order.length };

  switch (mode) {
    case 'recognition':
      return <TypeRound key={q.id} {...props} optionCount={4} />;
    case 'strategy':
      return <MethodRound key={q.id} {...props} />;
    case 'decode':
      return <DecodeRound key={q.id} {...props} />;
    case 'shortcut':
      return <ShortcutRound key={q.id} {...props} />;
    default:
      return (
        <div className="round" key={q.id}>
          <p className="counter">
            Question {props.position} of {props.size}
          </p>
          <QuestionSolver q={q} source="practice" />
          <div className="actions">
            <button className="btn btn-primary" onClick={next}>
              Next question →
            </button>
          </div>
        </div>
      );
  }
}

type RoundProps = { q: Question; onNext: () => void; position: number; size: number };

function DecodeRound({ q, onNext, position, size }: RoundProps) {
  const [solving, setSolving] = useState(false);
  return (
    <div className="round">
      <p className="counter">
        Question {position} of {size}
      </p>
      {solving ? (
        <QuestionSolver q={q} source="practice-decode" />
      ) : (
        <>
          <div className="card">
            <QuestionStem q={q} />
          </div>
          <DecodePanel q={q} onSolve={() => setSolving(true)} onClose={onNext} />
        </>
      )}
      <div className="actions">
        <button className="btn" onClick={onNext}>
          Next question →
        </button>
      </div>
    </div>
  );
}

function ShortcutRound({ q, onNext, position, size }: RoundProps) {
  const s = SHORTCUT_BY_ID[QUESTION_SHORTCUT[q.id]];
  const [hint, setHint] = useState(false);
  return (
    <div className="round">
      <p className="counter">
        Question {position} of {size}
      </p>
      <div className="feedback feedback-info">
        <div className="feedback-title">Shortcut to apply: {s.name}</div>
        {hint ? (
          <div className="feedback-body">
            <p>
              <MathText text={s.rule} />
            </p>
          </div>
        ) : (
          <button className="btn-link" onClick={() => setHint(true)}>
            Remind me of the rule
          </button>
        )}
      </div>
      <QuestionSolver q={q} source="practice-shortcut" />
      <div className="actions">
        <a className="btn" href={href.shortcut(s.id, true)}>
          Practice This Shortcut
        </a>
        <button className="btn btn-primary" onClick={onNext}>
          Next question →
        </button>
      </div>
    </div>
  );
}
