import { useMemo, useRef, useState } from 'react';
import { ExamAnswer, emptyResponse, isAnswered } from '../components/ExamAnswer';
import { CalcButton } from '../components/Calculator';
import { MathText } from '../components/MathText';
import { QuestionStem } from '../components/QuestionStem';
import { Feedback, OptionList, Remember, type OptionState } from '../components/ui';
import { QUESTION_BY_ID, QUESTIONS } from '../data/questions';
import { CATEGORIES, STRATEGIES } from '../data/taxonomy';
import type { Question, Verdict } from '../data/types';
import { classifyAttempt, getProgress, newId, recordAttempt, saveSession, setActiveSession, useProgress, type SessionRecord } from '../lib/progress';
import { shuffle } from '../lib/random';
import { formatClock, useCountdown } from '../lib/timer';
import { ADAPTIVE, answeredCount, createSession, finishSession, goTo, OFFICIAL_PACE_SEC, OFFICIAL_PRESETS, SET_SIZES, startAdaptiveS1, type ActiveTimed } from '../lib/timedSession';
import { recognitionOptions } from './Recognize';
import { TimedResults } from './TimedResults';

const ROUNDS = 5;

export function Speed({ mode, sessionId }: { mode?: string; sessionId?: string }) {
  const progress = useProgress();
  const [round, setRound] = useState(0);
  const restart = () => setRound((n) => n + 1);
  if (sessionId) {
    const rec = (progress.sessions ?? []).find((s) => s.id === sessionId);
    return rec ? <TimedResults rec={rec} /> : <p className="invalid">That session was not found.</p>;
  }
  if (mode === 'recognition') return <Recognition30 key={round} onRestart={restart} />;
  if (mode === 'strategy') return <Strategy60 key={round} onRestart={restart} />;
  if (mode === 'timed' || progress.activeSession) return <Timed />;
  const past = [...(progress.sessions ?? [])].reverse();
  return (
    <div className="module">
      <header className="module-head">
        <h2>GRE Speed Training</h2>
        <p className="lede">Train the first 30 seconds (recognizing the problem and the approach) separately from full timed solving.</p>
      </header>
      <div className="module-grid">
        <a className="module-card" href="#/speed?mode=recognition">
          <span className="module-n">30s</span>
          <strong>30-Second Recognition</strong>
          <span>Name the topic, the clue, and the best first step. No solving.</span>
        </a>
        <a className="module-card" href="#/speed?mode=strategy">
          <span className="module-n">60s</span>
          <strong>60-Second Strategy Drill</strong>
          <span>Choose a valid, efficient method before the clock runs out.</span>
        </a>
        <a className="module-card" href="#/speed?mode=timed">
          <span className="module-n">⏱</span>
          <strong>Timed GRE Quant Practice</strong>
          <span>Mixed-topic sets in real GRE formats, with mark-for-review and results at the end.</span>
        </a>
      </div>
      <section>
        <h3 className="section-title">Past sessions</h3>
        {past.length ? (
          <ul className="session-list">
            {past.slice(0, 20).map((s) => (
              <li key={s.id}>
                <a href={`#/speed?session=${s.id}`}>
                  {s.label} · {new Date(s.startedAt).toLocaleString()} · {s.questions.filter((q) => q.correct).length}/{s.questions.length} correct
                  {s.status === 'time-expired' ? ' · time expired' : s.status === 'abandoned' ? ' · abandoned' : ''}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">No sessions yet.</p>
        )}
      </section>
    </div>
  );
}

function Clock({ ms, total }: { ms: number; total: number }) {
  const low = ms <= Math.min(10_000, total * 0.2);
  return (
    <div className={`clock ${low ? 'low' : ''}`} role="timer" aria-label={`Time remaining ${formatClock(ms)}`}>
      <span aria-hidden="true">⏱</span> {formatClock(ms)}
      <span className="clock-bar" aria-hidden="true">
        <span style={{ width: `${(ms / total) * 100}%` }} />
      </span>
    </div>
  );
}

// ---------------- 30-Second Recognition ----------------

interface RecRound {
  q: Question;
  topics: string[];
  topicIds: Question['category'][];
  clueOptions: string[];
  clueAnswer: number;
  firstOrder: number[];
}

function makeRound(q: Question): RecRound {
  const topicIds = recognitionOptions(q, 4);
  const real = q.recognition.clues[Math.floor(Math.random() * q.recognition.clues.length)];
  const others = shuffle(QUESTIONS.filter((o) => o.category !== q.category).flatMap((o) => o.recognition.clues))
    .filter((c, i, a) => c !== real && a.indexOf(c) === i && !q.recognition.clues.includes(c))
    .slice(0, 3);
  const clueOptions = shuffle([real, ...others]);
  return { q, topics: topicIds.map((c) => CATEGORIES[c]), topicIds, clueOptions, clueAnswer: clueOptions.indexOf(real), firstOrder: shuffle(q.firstStep.options.map((_, i) => i)) };
}

function Recognition30({ onRestart }: { onRestart: () => void }) {
  const [sessionId] = useState(() => newId('r'));
  const startedAt = useRef(Date.now());
  const questions = useMemo(() => shuffle(QUESTIONS).slice(0, ROUNDS), []);
  const [i, setI] = useState(0);
  const round = useMemo(() => (i < ROUNDS ? makeRound(questions[i]) : null), [i, questions]);
  const [deadline, setDeadline] = useState(() => Date.now() + 30_000);
  const shownAt = useRef(Date.now());
  const [pick, setPick] = useState<{ topic?: number; clue?: number; first?: number; topicMs?: number; clueMs?: number; firstMs?: number }>({});
  const [done, setDone] = useState<null | { expired: boolean }>(null);
  const [log, setLog] = useState<{ id: string; topicOk: boolean; clueOk: boolean; firstOk: boolean; ms: number | null; unanswered: boolean }[]>([]);
  const remaining = useCountdown(done || !round ? null : deadline, () => submit(true));

  function choose(part: 'topic' | 'clue' | 'first', idx: number) {
    if (done) return;
    setPick((p) => ({ ...p, [part]: idx, [`${part}Ms`]: p[`${part}Ms` as 'topicMs'] ?? Date.now() - shownAt.current }));
  }

  function submit(expired: boolean) {
    if (!round || done) return;
    const q = round.q;
    const base = { ref: q.id, category: q.category, area: q.area, difficulty: q.difficulty, format: q.format, topic: q.topic, mode: 'speed-30', sessionId };
    const topicId = pick.topic !== undefined ? round.topicIds[pick.topic] : undefined;
    const topicResult = topicId === q.category ? 'correct' : topicId && q.secondary.includes(topicId) ? 'partial' : 'incorrect';
    recordAttempt({ ...base, kind: 'recognition', result: topicResult, ms: pick.topicMs ?? 30_000, unanswered: topicId === undefined, detail: topicId });
    const clueOk = pick.clue === round.clueAnswer;
    recordAttempt({ ...base, kind: 'clue-spot', result: clueOk ? 'correct' : 'incorrect', ms: pick.clueMs ?? 30_000, unanswered: pick.clue === undefined });
    const firstIdx = pick.first !== undefined ? round.firstOrder[pick.first] : undefined;
    const firstOk = firstIdx === q.firstStep.correct;
    recordAttempt({ ...base, kind: 'first-step', result: firstOk ? 'correct' : 'incorrect', ms: pick.firstMs ?? 30_000, unanswered: firstIdx === undefined, detail: firstIdx === undefined ? undefined : String(firstIdx) });
    setLog((l) => [...l, { id: q.id, topicOk: topicResult === 'correct', clueOk, firstOk, ms: pick.topicMs ?? null, unanswered: topicId === undefined }]);
    setDone({ expired });
  }

  function next() {
    const n = i + 1;
    if (n >= ROUNDS) {
      const rec: SessionRecord = {
        id: sessionId,
        kind: 'speed-30',
        label: '30-Second Recognition',
        startedAt: startedAt.current,
        endedAt: Date.now(),
        timeLimitMs: ROUNDS * 30_000,
        status: 'completed',
        questions: log.map((l) => ({ id: l.id, ms: l.ms ?? 30_000, correct: l.topicOk, unanswered: l.unanswered, marked: false })),
      };
      saveSession(rec);
    }
    setI(n);
    setPick({});
    setDone(null);
    shownAt.current = Date.now();
    setDeadline(Date.now() + 30_000);
  }

  if (!round) {
    const answered = log.filter((l) => l.ms !== null);
    return (
      <div className="module">
        <header className="module-head">
          <h2>30-Second Recognition: results</h2>
        </header>
        <div className="stats">
          <div className="stat">
            <div className="stat-value">{log.filter((l) => l.topicOk).length}/{ROUNDS}</div>
            <div className="stat-label">Topic recognized</div>
          </div>
          <div className="stat">
            <div className="stat-value">{answered.length ? `${(answered.reduce((s, l) => s + l.ms!, 0) / answered.length / 1000).toFixed(1)}s` : '—'}</div>
            <div className="stat-label">Average recognition time</div>
            <div className="stat-sub">Time to pick the topic ({answered.length} answered)</div>
          </div>
          <div className="stat">
            <div className="stat-value">{log.filter((l) => l.clueOk).length}/{ROUNDS}</div>
            <div className="stat-label">Clue spotted</div>
          </div>
          <div className="stat">
            <div className="stat-value">{log.filter((l) => l.firstOk).length}/{ROUNDS}</div>
            <div className="stat-label">Best first step</div>
          </div>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={onRestart}>
            Another set
          </button>
          <a className="btn" href="#/speed">
            Speed Training home
          </a>
          <a className="btn" href="#/progress">
            My Quant Progress
          </a>
        </div>
      </div>
    );
  }

  const q = round.q;
  const st = (part: 'topic' | 'clue' | 'first', idx: number, correctIdx: number): OptionState => {
    const chosen = pick[part];
    if (!done) return chosen === idx ? 'selected' : 'idle';
    if (idx === correctIdx) return 'correct';
    return chosen === idx ? 'incorrect' : 'idle';
  };
  const topicCorrect = round.topicIds.indexOf(q.category);
  const firstCorrect = round.firstOrder.indexOf(q.firstStep.correct);

  return (
    <div className="module">
      <header className="module-head card-head">
        <h2>30-Second Recognition</h2>
        <span className="counter">
          Round {i + 1} of {ROUNDS}
        </span>
      </header>
      {!done && remaining !== null && <Clock ms={remaining} total={30_000} />}
      <div className="card">
        <QuestionStem q={q} />
      </div>
      <p className="ask">1. What kind of problem is this?</p>
      <OptionList options={round.topics} columns onPick={(k) => choose('topic', k)} disabled={!!done} states={round.topics.map((_, k) => st('topic', k, topicCorrect))} />
      <p className="ask">2. Which clue gives it away?</p>
      <OptionList options={round.clueOptions} onPick={(k) => choose('clue', k)} disabled={!!done} states={round.clueOptions.map((_, k) => st('clue', k, round.clueAnswer))} />
      <p className="ask">3. Best first step?</p>
      <OptionList options={round.firstOrder.map((k) => q.firstStep.options[k])} onPick={(k) => choose('first', k)} disabled={!!done} states={round.firstOrder.map((_, k) => st('first', k, firstCorrect))} />
      {!done ? (
        <div className="actions">
          <button className="btn btn-primary" onClick={() => submit(false)}>
            Submit
          </button>
        </div>
      ) : (
        <>
          <Feedback tone={done.expired ? 'incorrect' : 'info'} title={done.expired ? 'Time is up.' : `Recognized in ${pick.topicMs ? (pick.topicMs / 1000).toFixed(1) + 's' : '—'}`}>
            <p>
              <strong>{CATEGORIES[q.category]}.</strong> <MathText text={q.recognition.why} />
            </p>
            <p>
              <MathText text={q.firstStep.explanation} />
            </p>
          </Feedback>
          <Remember text={q.recognition.rule} />
          <div className="actions">
            <button className="btn btn-primary" onClick={next}>
              {i + 1 < ROUNDS ? 'Next round →' : 'See results'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------- 60-Second Strategy ----------------

const VERDICT_TEXT: Record<Verdict, string> = { best: 'Fastest valid method.', valid: 'Valid, but a faster method exists.', slow: 'Works, but slow here.', invalid: 'Not a reliable method here.' };

function Strategy60({ onRestart }: { onRestart: () => void }) {
  const [sessionId] = useState(() => newId('t'));
  const startedAt = useRef(Date.now());
  const questions = useMemo(() => shuffle(QUESTIONS).slice(0, ROUNDS), []);
  const [i, setI] = useState(0);
  const q = questions[i];
  const opts = useMemo(() => (q ? shuffle(q.method.options) : []), [q]);
  const [deadline, setDeadline] = useState(() => Date.now() + 60_000);
  const shownAt = useRef(Date.now());
  const [picked, setPicked] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);
  const [log, setLog] = useState<{ id: string; verdict: Verdict | null; ms: number }[]>([]);
  const done = picked !== null || expired;
  const remaining = useCountdown(done || !q ? null : deadline, () => decide(null));

  function decide(k: number | null) {
    if (done || !q) return;
    const ms = k === null ? 60_000 : Date.now() - shownAt.current;
    const v = k === null ? null : opts[k].verdict;
    recordAttempt({ kind: 'strategy', ref: q.id, result: v === 'best' ? 'correct' : v === 'valid' || v === 'slow' ? 'partial' : 'incorrect', category: q.category, area: q.area, difficulty: q.difficulty, format: q.format, topic: q.topic, ms, mode: 'speed-60', sessionId, unanswered: k === null, detail: k === null ? undefined : opts[k].strategy });
    setLog((l) => [...l, { id: q.id, verdict: v, ms }]);
    if (k === null) setExpired(true);
    else setPicked(k);
  }

  function next() {
    const n = i + 1;
    if (n >= ROUNDS) {
      saveSession({
        id: sessionId,
        kind: 'speed-60',
        label: '60-Second Strategy Drill',
        startedAt: startedAt.current,
        endedAt: Date.now(),
        timeLimitMs: ROUNDS * 60_000,
        status: 'completed',
        questions: log.map((l) => ({ id: l.id, ms: l.ms, correct: l.verdict === 'best', unanswered: l.verdict === null, marked: false })),
      });
    }
    setI(n);
    setPicked(null);
    setExpired(false);
    shownAt.current = Date.now();
    setDeadline(Date.now() + 60_000);
  }

  if (!q) {
    const answered = log.filter((l) => l.verdict !== null);
    return (
      <div className="module">
        <header className="module-head">
          <h2>60-Second Strategy Drill: results</h2>
        </header>
        <div className="stats">
          <div className="stat">
            <div className="stat-value">{log.filter((l) => l.verdict === 'best').length}/{ROUNDS}</div>
            <div className="stat-label">Fastest method chosen</div>
          </div>
          <div className="stat">
            <div className="stat-value">{log.filter((l) => l.verdict === 'best' || l.verdict === 'valid').length}/{ROUNDS}</div>
            <div className="stat-label">Valid method chosen</div>
          </div>
          <div className="stat">
            <div className="stat-value">{answered.length ? `${(answered.reduce((s, l) => s + l.ms, 0) / answered.length / 1000).toFixed(1)}s` : '—'}</div>
            <div className="stat-label">Average decision time</div>
          </div>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={onRestart}>
            Another set
          </button>
          <a className="btn" href="#/speed">
            Speed Training home
          </a>
        </div>
      </div>
    );
  }

  const best = q.method.options.find((o) => o.verdict === 'best')!;
  return (
    <div className="module">
      <header className="module-head card-head">
        <h2>60-Second Strategy Drill</h2>
        <span className="counter">
          Question {i + 1} of {ROUNDS}
        </span>
      </header>
      {!done && remaining !== null && <Clock ms={remaining} total={60_000} />}
      <div className="card">
        <QuestionStem q={q} />
      </div>
      <p className="ask">Which method would you use?</p>
      <OptionList
        options={opts.map((o) => STRATEGIES[o.strategy])}
        onPick={decide}
        disabled={done}
        states={opts.map((o, k): OptionState => (!done ? 'idle' : o.verdict === 'best' ? 'correct' : k === picked ? (o.verdict === 'invalid' ? 'incorrect' : 'partial') : 'idle'))}
      />
      {done && (
        <>
          <Feedback tone={expired ? 'incorrect' : opts[picked!].verdict === 'best' ? 'correct' : opts[picked!].verdict === 'invalid' ? 'incorrect' : 'partial'} title={expired ? 'Time is up.' : VERDICT_TEXT[opts[picked!].verdict]}>
            {!expired && (
              <p>
                <MathText text={opts[picked!].note} />
              </p>
            )}
            {(expired || opts[picked!].verdict !== 'best') && (
              <p>
                <strong>Preferred: {STRATEGIES[best.strategy]}.</strong> <MathText text={best.note} />
              </p>
            )}
          </Feedback>
          <div className="actions">
            <button className="btn btn-primary" onClick={next}>
              {i + 1 < ROUNDS ? 'Next question →' : 'See results'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------- Timed GRE Quant Practice ----------------

function Timed() {
  const progress = useProgress();
  const active = progress.activeSession as ActiveTimed | undefined;
  const [finishedId, setFinishedId] = useState<string | null>(null);
  if (active) return <TimedRun s={active} onFinish={setFinishedId} />;
  if (finishedId) {
    const rec = (progress.sessions ?? []).find((s) => s.id === finishedId);
    if (rec) return <TimedResults rec={rec} />;
  }
  return <TimedSetup />;
}

function TimedSetup() {
  const [size, setSize] = useState<number>(10);
  const [timing, setTiming] = useState<'pace' | 'custom'>('pace');
  const [customMin, setCustomMin] = useState('15');
  const paceMinutes = Math.round(((size * OFFICIAL_PACE_SEC) / 60) * 10) / 10;
  const minutes = timing === 'pace' ? paceMinutes : Number(customMin);
  const validCustom = Number.isFinite(minutes) && minutes >= 1 && minutes <= 120;

  const start = (label: string, count: number, mins: number) => setActiveSession(createSession({ label, count, minutes: mins }));

  return (
    <div className="module">
      <header className="module-head">
        <h2>Timed GRE Quant Practice</h2>
        <p className="lede">Mixed topics in all four GRE formats. No feedback until you submit. You can move between questions and mark them for review, as on the real test.</p>
      </header>
      <section className="card">
        <h3>Official-style section</h3>
        <p className="note">
          Length and time limit follow ETS’s current GRE structure: Quantitative Reasoning has a 12-question, 21-minute section and a 15-question, 26-minute section. On the real test the second section adapts to your performance; these two presets do not (see the unofficial adaptive option below). The on-screen calculator (Calc) is available, as on the test.
        </p>
        <div className="actions">
          {OFFICIAL_PRESETS.map((p) => (
            <button key={p.id} className="btn btn-primary" onClick={() => start(`${p.label} (${p.count} questions, ${p.minutes} min)`, p.count, p.minutes)}>
              {p.label}: {p.count} questions · {p.minutes} min
            </button>
          ))}
        </div>
      </section>
      <section className="card">
        <h3>Unofficial adaptive practice (two sections)</h3>
        <p className="note">
          <strong>Unofficial.</strong> ETS does not publish how the real test adapts, and this mode produces no score. Section 1 has {ADAPTIVE.s1.count} questions in {ADAPTIVE.s1.minutes} minutes with a fixed medium mix (3 foundational, 6 moderate, 3 challenging). Your Section 1 correct count then sets Section 2 ({ADAPTIVE.s2.count} questions, {ADAPTIVE.s2.minutes} minutes): 8–12 correct → a harder mix (2 / 5 / 8), 5–7 → medium (4 / 7 / 4), 0–4 → easier (7 / 6 / 2). Section 2 never repeats a Section 1 question.
        </p>
        <button className="btn btn-primary" onClick={() => setActiveSession(startAdaptiveS1())}>
          Start Section 1
        </button>
      </section>
      <section className="card">
        <h3>Practice set</h3>
        <div className="filter-bar">
          <label>
            <span>Questions</span>
            <select value={size} onChange={(e) => setSize(Number(e.target.value))}>
              {SET_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Timing</span>
            <select value={timing} onChange={(e) => setTiming(e.target.value as 'pace' | 'custom')}>
              <option value="pace">Official average pace (~1 min 44 s per question): {paceMinutes} min</option>
              <option value="custom">Custom time limit</option>
            </select>
          </label>
          {timing === 'custom' && (
            <label>
              <span>Minutes (1–120)</span>
              <input type="number" min={1} max={120} value={customMin} onChange={(e) => setCustomMin(e.target.value)} />
            </label>
          )}
        </div>
        <p className="note">The pace option uses the average time per question across the two official sections (47 minutes ÷ 27 questions). It is derived from the official timing; it is not itself an official preset.</p>
        <button className="btn btn-primary" disabled={!validCustom} onClick={() => start(`Practice set (${size} questions, ${minutes} min)`, size, minutes)}>
          Start {size}-question set
        </button>
        {!validCustom && <p className="invalid">Enter a time limit between 1 and 120 minutes.</p>}
      </section>
    </div>
  );
}

function TimedRun({ s, onFinish }: { s: ActiveTimed; onFinish: (id: string) => void }) {
  const [reviewScreen, setReviewScreen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const q = QUESTION_BY_ID[s.questionIds[s.index]];
  const total = s.deadline - s.startedAt;

  const finish = (status: 'completed' | 'time-expired') => {
    const latest = getProgress().activeSession as ActiveTimed | undefined;
    if (!latest || latest.id !== s.id) return;
    const { record, attempts } = finishSession(latest, status);
    const end = record.endedAt;
    attempts.forEach((a, k) => {
      const id = recordAttempt({
        kind: 'answer',
        ref: a.q.id,
        result: a.result,
        category: a.q.category,
        area: a.q.area,
        difficulty: a.q.difficulty,
        format: a.q.format,
        topic: a.q.topic,
        ms: a.ms,
        hintsUsed: 0,
        mode: 'timed',
        detail: 'timed',
        sessionId: s.id,
        selected: a.selected,
        correctAnswer: a.correctAnswer,
        unanswered: a.unanswered,
        ts: end + k, // one attempt per question, in session order
      });
      record.questions[k].attemptId = id;
      if (a.unanswered && status === 'time-expired') classifyAttempt(id, { type: 'timing', source: 'evidence', evidence: 'Time ran out before this question was answered.' });
    });
    saveSession(record);
    setActiveSession(undefined);
    onFinish(record.id);
  };

  // Expiry also covers time that passed while the app was closed.
  const remaining = useCountdown(s.deadline, () => finish('time-expired'));
  const update = (patch: Partial<ActiveTimed>) => setActiveSession({ ...s, ...patch });
  const go = (k: number) => {
    setReviewScreen(false);
    setActiveSession(goTo(s, k));
  };
  const response = s.responses[q.id] ?? emptyResponse(q);
  const marked = s.marked.includes(q.id);
  const unansweredCount = s.questionIds.length - answeredCount(s);

  return (
    <div className="module timed">
      <header className="timed-head">
        <div>
          <strong>{s.label}</strong>
          <div className="counter">
            Question {s.index + 1} of {s.questionIds.length} · {answeredCount(s)} answered · {s.marked.length} marked
          </div>
        </div>
        {remaining !== null && <Clock ms={remaining} total={total} />}
      </header>
      <nav className="navigator" aria-label="Question navigator">
        {s.questionIds.map((id, k) => {
          const r = s.responses[id];
          const answered = r ? isAnswered(r) : false;
          return (
            <button key={id} className={`nav-q ${k === s.index && !reviewScreen ? 'current' : ''} ${answered ? 'answered' : ''} ${s.marked.includes(id) ? 'marked' : ''}`} onClick={() => go(k)} aria-label={`Question ${k + 1}${answered ? ', answered' : ', not answered'}${s.marked.includes(id) ? ', marked for review' : ''}`}>
              {k + 1}
              {s.marked.includes(id) && <span aria-hidden="true">⚑</span>}
            </button>
          );
        })}
        <button className={`nav-q review ${reviewScreen ? 'current' : ''}`} onClick={() => setReviewScreen(true)}>
          Review
        </button>
      </nav>

      <div className="calc-bar">
        <CalcButton onTransfer={q.format === 'numeric' && !reviewScreen ? (v) => update({ responses: { ...s.responses, [q.id]: { kind: 'numeric', text: v } } }) : undefined} />
      </div>
      {reviewScreen ? (
        <section className="card">
          <h3>Review</h3>
          <table className="parts-table">
            <thead>
              <tr>
                <th scope="col">Question</th>
                <th scope="col">Status</th>
                <th scope="col">Marked</th>
              </tr>
            </thead>
            <tbody>
              {s.questionIds.map((id, k) => {
                const r = s.responses[id];
                return (
                  <tr key={id}>
                    <td>
                      <button className="btn-link" onClick={() => go(k)}>
                        Question {k + 1}
                      </button>
                    </td>
                    <td>{r && isAnswered(r) ? 'Answered' : 'Not answered'}</td>
                    <td>{s.marked.includes(id) ? '⚑ Marked' : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : (
        <section className="card">
          <QuestionStem q={q} showChoices={false} />
          <ExamAnswer q={q} value={response} onChange={(r) => update({ responses: { ...s.responses, [q.id]: r } })} />
        </section>
      )}

      <div className="actions">
        <button className="btn" disabled={s.index === 0 && !reviewScreen} onClick={() => go(Math.max(0, reviewScreen ? s.index : s.index - 1))}>
          ← Previous
        </button>
        {!reviewScreen && (
          <button className="btn" aria-pressed={marked} onClick={() => update({ marked: marked ? s.marked.filter((x) => x !== q.id) : [...s.marked, q.id] })}>
            {marked ? '⚑ Unmark' : '⚐ Mark for review'}
          </button>
        )}
        <button className="btn" disabled={s.index === s.questionIds.length - 1 && !reviewScreen} onClick={() => go(Math.min(s.questionIds.length - 1, reviewScreen ? s.index : s.index + 1))}>
          Next →
        </button>
        <button className="btn btn-primary" onClick={() => setConfirm(true)}>
          Submit session
        </button>
      </div>
      {confirm && (
        <Feedback tone="info" title={unansweredCount ? `${unansweredCount} question${unansweredCount === 1 ? ' is' : 's are'} unanswered. Submit anyway?` : 'Submit and see your results?'}>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => finish('completed')}>
              Submit
            </button>
            <button className="btn" onClick={() => setConfirm(false)}>
              Keep working
            </button>
          </div>
        </Feedback>
      )}
      <p className="note">
        Your progress in this session is saved. If you close the app, you can resume, and the clock keeps running.{' '}
        <button
          className="btn-link danger"
          onClick={() => {
            if (window.confirm('Abandon this session? Nothing from it will count toward your accuracy.')) {
              const latest = getProgress().activeSession as ActiveTimed;
              const { record } = finishSession(latest, 'completed');
              saveSession({ ...record, status: 'abandoned' });
              setActiveSession(undefined);
            }
          }}
        >
          Abandon session
        </button>
      </p>
    </div>
  );
}
