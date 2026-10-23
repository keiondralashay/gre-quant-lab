import { Disclosure, Steps } from '../components/ui';
import { Explanation } from '../components/Explanation';
import { MathText } from '../components/MathText';
import { MistakePanel } from '../components/MistakePanel';
import { QuestionStem } from '../components/QuestionStem';
import { QUESTION_BY_ID } from '../data/questions';
import { CATEGORIES } from '../data/taxonomy';
import type { SessionRecord } from '../lib/progress';
import { deserializeResponse } from '../lib/mistakes';
import { formatClock } from '../lib/timer';
import { ADAPTIVE, startAdaptiveS2, tierFor, timeReport } from '../lib/timedSession';
import { setActiveSession, useProgress } from '../lib/progress';

const sec = (ms: number) => `${Math.round(ms / 1000)}s`;

/** Results for a finished timed session. Shown only after the session ends. */
export function TimedResults({ rec }: { rec: SessionRecord }) {
  const r = timeReport(rec);
  const num = (id: string) => rec.questions.findIndex((q) => q.id === id) + 1;
  const name = (id: string) => `Q${num(id)} · ${CATEGORIES[QUESTION_BY_ID[id].category]}`;

  return (
    <div className="module">
      <header className="module-head">
        <h2>Session results</h2>
        <p className="lede">
          {rec.label} · {new Date(rec.startedAt).toLocaleString()}
          {rec.status === 'time-expired' && ' · time expired'}
          {rec.status === 'abandoned' && ' · abandoned (not counted toward accuracy)'}
        </p>
      </header>

      <section className="card">
        <div className="stats">
          <div className="stat">
            <div className="stat-value">
              {r.correct}/{rec.questions.length}
            </div>
            <div className="stat-label">Correct</div>
            <div className="stat-sub">
              {r.incorrect} incorrect · {r.unanswered} unanswered
            </div>
          </div>
          <div className="stat">
            <div className="stat-value">{formatClock(r.usedMs)}</div>
            <div className="stat-label">Total time used</div>
            <div className="stat-sub">of {rec.timeLimitMs ? formatClock(rec.timeLimitMs) : '—'} allowed</div>
          </div>
          <div className="stat">
            <div className="stat-value">{r.avgMs === null ? '—' : sec(r.avgMs)}</div>
            <div className="stat-label">Average per answered question</div>
            <div className="stat-sub">Target pace {sec(r.paceMs)}</div>
          </div>
        </div>
      </section>

      {rec.adaptive && <AdaptiveNext rec={rec} />}

      <section className="card">
        <h3>Time management</h3>
        {r.patterns.length ? (
          <ul>
            {r.patterns.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        ) : (
          <p className="note">No clear timing pattern in this session.</p>
        )}
        <div className="two-col">
          <div>
            <h4>Took the most time</h4>
            <ul>
              {r.slowest.map((q) => (
                <li key={q.id}>
                  {name(q.id)}: {sec(q.ms)} · {q.unanswered ? 'unanswered' : q.correct ? 'correct' : 'incorrect'}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Quick and accurate</h4>
            {r.quickCorrect.length ? (
              <ul>
                {r.quickCorrect.map((q) => (
                  <li key={q.id}>
                    {name(q.id)}: {sec(q.ms)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="note">None under half the target pace.</p>
            )}
            <h4>Quick but incorrect</h4>
            {r.quickWrong.length ? (
              <ul>
                {r.quickWrong.map((q) => (
                  <li key={q.id}>
                    {name(q.id)}: {sec(q.ms)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="note">None.</p>
            )}
          </div>
        </div>
        <p className="note">Slow answers are not treated as a lack of understanding. Time is measured only while each question was on screen.</p>
      </section>

      <section className="card">
        <h3>Where Could I Have Saved Time?</h3>
        {r.savings.length ? (
          r.savings.map((x) => (
            <div key={x.q.id} className="saving">
              <p>
                <strong>{name(x.q.id)}</strong>: you spent {sec(x.ms)} (target {sec(r.paceMs)}). The shortcut takes {x.fastSteps} step{x.fastSteps === 1 ? '' : 's'}; the traditional method takes {x.longSteps}.
              </p>
              <p className="note">
                <MathText text={x.q.recognition.strategy} />
              </p>
              <Disclosure label="Show the faster method">
                <Steps steps={x.q.solution.fast} />
              </Disclosure>
            </div>
          ))
        ) : (
          <p className="note">No above-pace question in this session has a shorter method than the standard one.</p>
        )}
      </section>

      <section className="card">
        <h3>Question by question</h3>
        {rec.questions.map((sq, k) => {
          const q = QUESTION_BY_ID[sq.id];
          return (
            <details key={sq.id} className="result-row">
              <summary>
                <span className={`badge ${sq.correct ? 'badge-best' : sq.unanswered ? 'badge-slow' : 'badge-invalid'}`}>{sq.correct ? 'Correct' : sq.unanswered ? 'Unanswered' : 'Incorrect'}</span> Q{k + 1} · {CATEGORIES[q.category]} · {sec(sq.ms)}
                {sq.marked && ' · ⚑ marked'}
              </summary>
              <QuestionStem q={q} />
              <p>
                Your answer: <strong>{sq.selected ?? '—'}</strong>
              </p>
              {!sq.correct && sq.attemptId && rec.status !== 'abandoned' && (
                <MistakePanel q={q} attemptId={sq.attemptId} response={deserializeResponse(q, sq.selected)} attempt={{ ts: rec.endedAt, ms: sq.ms, unanswered: sq.unanswered, mode: 'timed' }} paceMs={r.paceMs} timeExpired={rec.status === 'time-expired'} />
              )}
              <Explanation q={q} />
            </details>
          );
        })}
      </section>

      <div className="actions">
        <a className="btn btn-primary" href="#/speed?mode=timed">
          New timed set
        </a>
        <a className="btn" href="#/review">
          Mistake Review Queue
        </a>
        <a className="btn" href="#/progress">
          My Quant Progress
        </a>
      </div>
    </div>
  );
}

/** Unofficial adaptive practice: explain the routing decision and offer Section 2. No score is shown or implied. */
function AdaptiveNext({ rec }: { rec: SessionRecord }) {
  const progress = useProgress();
  const a = rec.adaptive!;
  if (a.stage === 2) {
    return (
      <section className="card">
        <h3>Unofficial adaptive practice: Section 2</h3>
        <p>
          This section used the <strong>{a.tier}</strong> mix because you answered {a.s1Correct} of {ADAPTIVE.s1.count} Section 1 questions correctly. This mode does not produce a GRE score, and the routing rule is this app’s own, not ETS’s.
        </p>
      </section>
    );
  }
  const correct = rec.questions.filter((q) => q.correct).length;
  const tier = tierFor(correct);
  const started = (progress.sessions ?? []).some((s) => s.adaptive?.s1Id === rec.id) || (progress.activeSession as { adaptive?: { s1Id?: string } } | undefined)?.adaptive?.s1Id === rec.id;
  return (
    <section className="card">
      <h3>Unofficial adaptive practice: next section</h3>
      <p>
        You answered {correct} of {rec.questions.length} correctly, so Section 2 will use the <strong>{tier}</strong> difficulty mix ({ADAPTIVE.s2.count} questions, {ADAPTIVE.s2.minutes} minutes). No score is calculated.
      </p>
      {started ? (
        <p className="note">Section 2 for this attempt has already been started.</p>
      ) : (
        <button
          className="btn btn-primary"
          onClick={() => {
            setActiveSession(startAdaptiveS2(rec));
            window.location.hash = '#/speed?mode=timed';
          }}
        >
          Start Section 2
        </button>
      )}
    </section>
  );
}
