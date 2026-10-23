import { useState } from 'react';
import { DIChart } from '../components/DIChart';
import { QuestionSolver } from '../components/QuestionSolver';
import { QuestionStem } from '../components/QuestionStem';
import { DI_NEEDS, DI_SET_BY_ID, DI_SETS, type DISet } from '../data/diSets';
import { QUESTION_BY_ID } from '../data/questions';
import { recordAttempt, useProgress } from '../lib/progress';
import { StepCard } from './Guided';

const KIND_LABEL = { table: 'Table', bar: 'Bar graph', line: 'Line graph', pie: 'Circle graph', scatter: 'Scatterplot' } as const;

export function DataInterpretation({ setId }: { setId?: string }) {
  const set = setId ? DI_SET_BY_ID[setId] : undefined;
  return (
    <div className="module">
      <header className="module-head">
        <h2>Data Interpretation Sets</h2>
        <p className="lede">Several questions share one table or graph, as on the GRE. Before each question, pick the information you need; then solve it.</p>
      </header>
      {setId && !set && <p className="empty">That set was not found.</p>}
      {set ? <SetRun key={set.id} set={set} /> : <SetList />}
    </div>
  );
}

function SetList() {
  const progress = useProgress();
  return (
    <ul className="guided-list">
      {DI_SETS.map((s) => {
        const done = s.questions.filter((id) => progress.attempts.some((a) => a.kind === 'answer' && a.ref === id)).length;
        return (
          <li key={s.id}>
            <a href={`#/di/${s.id}`}>
              <strong>{s.title}</strong>
              <span className="note">
                {KIND_LABEL[s.chart.kind]} · {s.questions.length} questions · {done} attempted
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function SetRun({ set }: { set: DISet }) {
  const [i, setI] = useState(0);
  const [needsDone, setNeedsDone] = useState(false);
  const q = QUESTION_BY_ID[set.questions[i]];
  const needs = DI_NEEDS[q.id];
  const go = (n: number) => {
    setI(n);
    setNeedsDone(false);
  };
  return (
    <>
      <p className="counter">
        {set.title} · Question {i + 1} of {set.questions.length}
      </p>
      <DIChart chart={set.chart} />
      <div key={q.id}>
        <QuestionStem q={q} showData={false} />
        {!needsDone ? (
          <StepCard
            number="1"
            title="What information do I need?"
            step={{ id: 'needs', kind: 'multi', prompt: 'Select every piece of information you need to answer this question, and nothing extra.', options: needs.options, correct: needs.correct, hints: ['Underline what the question asks for, then name each value that goes into it.', 'If a value would not change your answer, you do not need it.'], explain: needs.explain, noun: 'needed' }}
            onDone={(o) => {
              recordAttempt({ kind: 'decode-step', ref: `${q.id}:needs`, result: o.firstTry ? 'correct' : 'incorrect', category: q.category, area: q.area, difficulty: q.difficulty, format: q.format, topic: q.topic, hintsUsed: o.hints, detail: o.firstResponse, mode: 'di-set' });
              setNeedsDone(true);
            }}
          />
        ) : (
          <QuestionSolver q={q} source="di-set" hideStem />
        )}
      </div>
      <div className="actions">
        <button className="btn" disabled={i === 0} onClick={() => go(i - 1)}>
          ← Previous
        </button>
        {i < set.questions.length - 1 ? (
          <button className="btn btn-primary" onClick={() => go(i + 1)}>
            Next question →
          </button>
        ) : (
          <a className="btn btn-primary" href="#/di">
            Finish set
          </a>
        )}
      </div>
    </>
  );
}
