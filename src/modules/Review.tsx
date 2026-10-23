import { useMemo, useState } from 'react';
import { MistakePanel } from '../components/MistakePanel';
import { QuestionSolver } from '../components/QuestionSolver';
import { Tag, DIFFICULTY_LABEL, DIFFICULTY_TONE } from '../components/ui';
import { QUESTION_BY_ID } from '../data/questions';
import { CATEGORIES } from '../data/taxonomy';
import { href } from '../data/links';
import type { MistakeType } from '../data/types';
import { MODE_LABELS, reviewQueue, type QueueEntry } from '../lib/analytics';
import { similarTo } from '../lib/deck';
import { deserializeResponse, MISTAKE_LABELS } from '../lib/mistakes';
import { useProgress } from '../lib/progress';
import { MethodRound } from './ChooseMethod';
import { TypeRound } from './Recognize';

type GroupBy = 'date' | 'topic' | 'mistake' | 'difficulty' | 'failed';
type Activity = { qid: string; kind: 'retry' | 'similar' | 'recognize'; step?: 'type' | 'method' | 'done'; similarId?: string };

export function Review() {
  const progress = useProgress();
  const queue = useMemo(() => reviewQueue(progress.attempts, progress.classifications), [progress.attempts, progress.classifications]);
  const [groupBy, setGroupBy] = useState<GroupBy>('date');
  const [showImproved, setShowImproved] = useState(true);
  const [activity, setActivity] = useState<Activity | null>(null);

  if (activity) return <ReviewActivity a={activity} onChange={setActivity} onDone={() => setActivity(null)} />;

  const shown = queue.filter((e) => showImproved || !e.improved);
  const groups = group(shown, groupBy);

  return (
    <div className="module">
      <header className="module-head">
        <h2>Mistake Review Queue</h2>
        <p className="lede">Every question you have missed is saved here automatically. Retrying never overwrites the original result; each attempt is added to the history.</p>
      </header>
      {!queue.length ? (
        <p className="empty">No missed questions yet. When you answer a question incorrectly anywhere in the app, it appears here.</p>
      ) : (
        <>
          <div className="filter-bar">
            <label>
              <span>Organize by</span>
              <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)}>
                <option value="date">Date (most recent miss)</option>
                <option value="topic">Topic</option>
                <option value="mistake">Mistake type</option>
                <option value="difficulty">Difficulty</option>
                <option value="failed">Number of failed attempts</option>
              </select>
            </label>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={showImproved} onChange={(e) => setShowImproved(e.target.checked)} /> Show questions I have since answered correctly
          </label>
          <p className="counter">
            {queue.length} question{queue.length === 1 ? '' : 's'} · {queue.filter((e) => e.improved).length} improved since the miss
          </p>
          {groups.map(([label, entries]) => (
            <section key={label}>
              <h3 className="section-title">
                {label} <span className="count">({entries.length})</span>
              </h3>
              {entries.map((e) => (
                <QueueCard key={e.q.id} e={e} onStart={setActivity} />
              ))}
            </section>
          ))}
        </>
      )}
    </div>
  );
}

function group(entries: QueueEntry[], by: GroupBy): [string, QueueEntry[]][] {
  const m = new Map<string, QueueEntry[]>();
  const add = (k: string, e: QueueEntry) => m.set(k, [...(m.get(k) ?? []), e]);
  for (const e of entries) {
    if (by === 'topic') add(CATEGORIES[e.q.category], e);
    else if (by === 'difficulty') add(DIFFICULTY_LABEL[e.q.difficulty], e);
    else if (by === 'failed') add(`Missed ${e.failed} time${e.failed === 1 ? '' : 's'}`, e);
    else if (by === 'mistake') {
      if (!e.types.length) add('Cause not recorded', e);
      for (const t of e.types) add(MISTAKE_LABELS[t as MistakeType], e);
    } else add(new Date(e.lastFail).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }), e);
  }
  const out = [...m.entries()];
  if (by === 'failed') out.sort((a, b) => b[1][0].failed - a[1][0].failed);
  if (by === 'difficulty') out.sort((a, b) => a[1][0].q.difficulty - b[1][0].q.difficulty);
  return out;
}

function QueueCard({ e, onStart }: { e: QueueEntry; onStart: (a: Activity) => void }) {
  const progress = useProgress();
  const [classifying, setClassifying] = useState(false);
  const lastFailed = [...e.history].reverse().find((h) => h.result !== 'correct');
  const lastAttempt = lastFailed?.id ? progress.attempts.find((a) => a.id === lastFailed.id) : undefined;
  const recog = progress.attempts.filter((a) => a.kind === 'recognition' && a.ref === e.q.id);
  return (
    <div className="card queue-card">
      <div className="card-head">
        <strong>
          {CATEGORIES[e.q.category]} · {e.q.topic}
        </strong>
        <span className="tags">
          <Tag tone={DIFFICULTY_TONE[e.q.difficulty]}>{DIFFICULTY_LABEL[e.q.difficulty]}</Tag>
          {e.improved && <Tag tone="easy">Improved</Tag>}
        </span>
      </div>
      <p className="note">
        Missed {e.failed}× · first {new Date(e.firstFail).toLocaleDateString()} · last {new Date(e.lastFail).toLocaleDateString()}
        {e.types.length ? ` · ${e.types.map((t) => MISTAKE_LABELS[t]).join(', ')}` : ' · cause not recorded'}
      </p>
      <ol className="history" aria-label="Attempt history">
        {e.history.map((h, k) => (
          <li key={k} className={h.result === 'correct' ? 'ok' : 'bad'} title={`${new Date(h.ts).toLocaleString()} · ${MODE_LABELS[h.mode] ?? h.mode}`}>
            {h.result === 'correct' ? '✓' : h.unanswered ? '–' : '✗'}
          </li>
        ))}
        {recog.length > 0 && (
          <li className="history-note">
            · recognition {recog.filter((a) => a.result === 'correct').length}/{recog.length}
          </li>
        )}
      </ol>
      <div className="actions">
        <button className="btn btn-primary" onClick={() => onStart({ qid: e.q.id, kind: 'retry' })}>
          Retry Original
        </button>
        <button className="btn" onClick={() => onStart({ qid: e.q.id, kind: 'similar', similarId: similarTo(e.q)?.id })}>
          Try Similar
        </button>
        <button className="btn" onClick={() => onStart({ qid: e.q.id, kind: 'recognize', step: 'type' })}>
          Recognize Only
        </button>
        <a className={`btn ${e.types.includes('calculation') ? 'btn-primary' : ''}`} href={href.guided(e.q.id)}>
          Walk Me Through It
        </a>
        {lastFailed?.id && !e.types.length && (
          <button className="btn-link" onClick={() => setClassifying((c) => !c)}>
            {classifying ? 'Hide' : 'Why did I miss it?'}
          </button>
        )}
      </div>
      {classifying && lastFailed?.id && (
        <MistakePanel q={e.q} attemptId={lastFailed.id} response={deserializeResponse(e.q, lastAttempt?.selected)} attempt={{ ts: lastFailed.ts, ms: lastAttempt?.ms, unanswered: lastFailed.unanswered, mode: lastFailed.mode }} compact />
      )}
    </div>
  );
}

function ReviewActivity({ a, onChange, onDone }: { a: Activity; onChange: (a: Activity) => void; onDone: () => void }) {
  const q = QUESTION_BY_ID[a.qid];
  const back = (
    <button className="btn" onClick={onDone}>
      ← Back to the queue
    </button>
  );
  if (a.kind === 'retry') {
    return (
      <div className="module">
        <header className="module-head">
          <h2>Retry Original</h2>
          <p className="lede">Same question, fresh start. Your previous answer is not shown.</p>
        </header>
        <QuestionSolver q={q} source="review-retry" />
        <div className="actions">{back}</div>
      </div>
    );
  }
  if (a.kind === 'similar') {
    const sim = a.similarId ? QUESTION_BY_ID[a.similarId] : null;
    return (
      <div className="module">
        <header className="module-head">
          <h2>Try Similar</h2>
          <p className="lede">A different question that tests the same concept.</p>
        </header>
        {sim ? <QuestionSolver q={sim} source="review-similar" /> : <p className="empty">No other question in the bank covers this concept yet.</p>}
        <div className="actions">
          {sim && (
            <button className="btn" onClick={() => onChange({ ...a, similarId: similarTo(q)?.id })}>
              Another similar question
            </button>
          )}
          {back}
        </div>
      </div>
    );
  }
  return (
    <div className="module">
      <header className="module-head">
        <h2>Recognize Only</h2>
        <p className="lede">Identify the problem type, then the best strategy. No calculating.</p>
      </header>
      {a.step === 'type' && <TypeRound q={q} optionCount={4} position={1} size={2} onShow={() => {}} onNext={() => onChange({ ...a, step: 'method' })} mode="review-recognize" allowSolve={false} nextLabel="Next: choose the strategy →" />}
      {a.step === 'method' && <MethodRound q={q} position={2} size={2} onShow={() => {}} onNext={() => onChange({ ...a, step: 'done' })} mode="review-recognize" allowSolve={false} nextLabel="Finish" />}
      {a.step === 'done' && <p>Done. Both responses were recorded and count toward your recognition and strategy accuracy.</p>}
      <div className="actions">{back}</div>
    </div>
  );
}
