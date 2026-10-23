import { useEffect, useMemo, useState } from 'react';
import { DecodePanel } from '../components/DecodePanel';
import { QuestionSolver } from '../components/QuestionSolver';
import { QuestionStem } from '../components/QuestionStem';
import { QUESTION_BY_ID } from '../data/questions';
import { CATEGORIES } from '../data/taxonomy';
import type { Category } from '../data/types';
import { quickPlan, weakAreas, type QuickMode, type QuickPlan } from '../lib/analytics';
import { getProgress, newId, saveSession, type Attempt } from '../lib/progress';
import { MethodRound } from './ChooseMethod';
import { TypeRound } from './Recognize';

const MODE_TITLE: Record<QuickMode, string> = {
  recognition: 'Recognition: identify the problem type',
  decode: 'Component identification: decode the question',
  strategy: 'Strategy: choose the fastest valid method',
  solve: 'Solve it',
};

export function QuickPractice() {
  const [plan, setPlan] = useState<QuickPlan | null>(null);
  const [started, setStarted] = useState(0);
  const [sessionId, setSessionId] = useState('');
  const [i, setI] = useState(0);

  if (!plan) {
    const preview = quickPlan(getProgress().attempts, getProgress().classifications);
    return (
      <div className="module">
        <header className="module-head">
          <h2>Practice What I Need</h2>
          <p className="lede">A five-question session built from your recorded weak areas: recognition, component identification, strategy, and solving.</p>
        </header>
        <div className="card">
          <p>{preview.reason}</p>
          <ol>
            {preview.items.map((it, k) => (
              <li key={k}>
                {MODE_TITLE[it.mode]} · {CATEGORIES[it.category]}
              </li>
            ))}
          </ol>
          <button
            className="btn btn-primary"
            onClick={() => {
              setPlan(preview);
              setStarted(Date.now());
              setSessionId(newId('q'));
              setI(0);
            }}
          >
            Start the {preview.diagnostic ? 'diagnostic' : 'session'} →
          </button>
        </div>
      </div>
    );
  }

  if (i >= plan.items.length) return <QuickSummary plan={plan} started={started} sessionId={sessionId} onAgain={() => setPlan(null)} />;

  const item = plan.items[i];
  const q = QUESTION_BY_ID[item.qid];
  const next = () => setI((n) => n + 1);
  return (
    <div className="module">
      <header className="module-head card-head">
        <h2>Practice What I Need</h2>
        <span className="counter">
          {i + 1} of {plan.items.length}
        </span>
      </header>
      <div className="progress-dots" aria-label={`Item ${i + 1} of ${plan.items.length}`}>
        {plan.items.map((_, k) => (
          <span key={k} className={`dot ${k < i ? 'done' : k === i ? 'current' : ''}`} />
        ))}
      </div>
      <p className="level-label">{MODE_TITLE[item.mode]}</p>
      <QuickItem key={i} mode={item.mode} qid={q.id} onNext={next} />
    </div>
  );
}

function QuickItem({ mode, qid, onNext }: { mode: QuickMode; qid: string; onNext: () => void }) {
  const q = QUESTION_BY_ID[qid];
  const [decoded, setDecoded] = useState(false);
  const nextBtn = (
    <div className="actions">
      <button className="btn btn-primary" onClick={onNext}>
        Next →
      </button>
    </div>
  );
  if (mode === 'recognition') return <TypeRound q={q} optionCount={4} position={1} size={1} onShow={() => {}} onNext={onNext} mode="quick" allowSolve={false} nextLabel="Next →" />;
  if (mode === 'strategy') return <MethodRound q={q} position={1} size={1} onShow={() => {}} onNext={onNext} mode="quick" allowSolve={false} nextLabel="Next →" />;
  if (mode === 'decode')
    return (
      <>
        <div className="card">
          <QuestionStem q={q} />
        </div>
        {decoded ? nextBtn : <DecodePanel q={q} mode="quick" onSolve={() => setDecoded(true)} onClose={onNext} solveLabel="Done" />}
      </>
    );
  return (
    <>
      <QuestionSolver q={q} source="quick" />
      {nextBtn}
    </>
  );
}

/** Compare this session with the learner's earlier record on the same topics. */
function QuickSummary({ plan, started, sessionId, onAgain }: { plan: QuickPlan; started: number; sessionId: string; onAgain: () => void }) {
  const { attempts, classifications } = getProgress();
  const mine = useMemo(() => attempts.filter((a) => a.ts >= started && a.mode === 'quick' && plan.items.some((it) => a.ref === it.qid || a.ref.startsWith(`${it.qid}:`))), [attempts, started, plan]);
  useEffect(() => {
    saveSession({
      id: sessionId,
      kind: 'quick',
      label: plan.diagnostic ? 'Practice What I Need (diagnostic)' : 'Practice What I Need',
      startedAt: started,
      endedAt: Date.now(),
      status: 'completed',
      questions: plan.items.map((it) => {
        const as = mine.filter((a) => a.ref === it.qid || a.ref.startsWith(`${it.qid}:`));
        return { id: it.qid, ms: as.reduce((s, a) => s + (a.ms ?? 0), 0), correct: as.length > 0 && as.every((a) => a.result === 'correct'), unanswered: as.length === 0, marked: false };
      }),
    });
    // Save once when the summary opens; saveSession replaces by id, so a re-run is harmless.
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps
  const byCat = new Map<Category, Attempt[]>();
  for (const a of mine) if (a.category) byCat.set(a.category, [...(byCat.get(a.category) ?? []), a]);
  const nextUp = weakAreas(attempts, classifications).ranked[0];

  return (
    <div className="module">
      <header className="module-head">
        <h2>Session summary</h2>
      </header>
      <section className="card">
        {mine.length === 0 ? (
          <p className="empty">No responses were recorded in this session.</p>
        ) : (
          <ul>
            {[...byCat.entries()].map(([cat, as]) => {
              const now = as.filter((a) => a.result === 'correct').length / as.length;
              const before = plan.baseline[cat];
              return (
                <li key={cat}>
                  <strong>{CATEGORIES[cat]}:</strong> {Math.round(now * 100)}% this session ({as.length} responses)
                  {before !== undefined &&
                    (now > before + 0.1
                      ? ` — up from ${Math.round(before * 100)}% before.`
                      : now < before - 0.1
                        ? ` — below your earlier ${Math.round(before * 100)}%.`
                        : ` — about the same as before (${Math.round(before * 100)}%).`)}
                </li>
              );
            })}
          </ul>
        )}
        <p className="note">Five questions is a small sample. Treat these as signals, not verdicts. Your overall record updates either way.</p>
      </section>
      <section className="card">
        <h3>Review next</h3>
        {nextUp ? (
          <p>
            {CATEGORIES[nextUp.category]}: {nextUp.advice}{' '}
            <a className="link-btn" href={nextUp.practice.href}>
              {nextUp.practice.label} →
            </a>
          </p>
        ) : (
          <p>There isn’t enough data to rank topics yet. Another session or two will make the recommendations more specific.</p>
        )}
      </section>
      <div className="actions">
        <button className="btn btn-primary" onClick={onAgain}>
          New session
        </button>
        <a className="btn" href="#/progress">
          My Quant Progress
        </a>
        <a className="btn" href="#/review">
          Review Queue
        </a>
      </div>
    </div>
  );
}
