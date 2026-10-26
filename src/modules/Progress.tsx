import { useMemo, useState } from 'react';
import { AccuracyBars, LineChart } from '../components/Charts';
import { FORMAT_LABEL } from '../components/QuestionStem';
import { CATEGORIES } from '../data/taxonomy';
import type { Category, Format } from '../data/types';
import { applyFilter, metrics, MODE_LABELS, modeOf, series, type Filter, type RangeKey, type SeriesPoint, type Tally } from '../lib/analytics';
import { MISTAKE_LABELS } from '../lib/mistakes';
import { useProgress } from '../lib/progress';
import { BackupPanel } from '../components/BackupPanel';

const pctText = (t: Tally) => (t.total ? `${Math.round((t.correct / t.total) * 100)}%` : '—');
const secs = (ms: number | null) => (ms === null ? '—' : `${Math.round(ms / 1000)}s`);

function Tile({ label, value, sub, help }: { label: string; value: string; sub: string; help?: string }) {
  return (
    <div className="stat" title={help}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}

const nOf = (t: Tally, unit = 'attempts') => (t.total ? `${t.correct} of ${t.total} ${unit}` : 'No attempts yet');

/** Compare the first and second half of a skill's attempts (only with enough data on both sides). */
function trend(points: SeriesPoint[], min = 6) {
  const total = points.reduce((s, p) => s + p.n, 0);
  if (total < min * 2 || points.length < 2) return null;
  // Split by day so each half is a real time period.
  let acc1 = 0;
  let n1 = 0;
  let acc2 = 0;
  let n2 = 0;
  let run = 0;
  for (const p of points) {
    if (run < total / 2) {
      acc1 += p.accuracy * p.n;
      n1 += p.n;
    } else {
      acc2 += p.accuracy * p.n;
      n2 += p.n;
    }
    run += p.n;
  }
  if (n1 < min || n2 < min) return null;
  return { before: acc1 / n1, after: acc2 / n2, n1, n2 };
}

export function Progress() {
  const progress = useProgress();
  const [filter, setFilter] = useState<Filter>({ range: 'all', category: 'all', mode: 'all' });
  const scoped = useMemo(() => applyFilter(progress.attempts, filter), [progress.attempts, filter]);
  const m = useMemo(() => metrics(scoped, progress.classifications), [scoped, progress.classifications]);
  const modes = useMemo(() => [...new Set(progress.attempts.map(modeOf))].sort(), [progress.attempts]);
  const cats = useMemo(() => [...new Set(applyFilter(progress.attempts, { range: 'all', category: 'all', mode: 'all' }).map((a) => a.category).filter(Boolean) as Category[])], [progress.attempts]);

  const solving = series(scoped, 'solving');
  const recog = series(scoped, 'recognition');
  const strat = series(scoped, 'strategy');
  const tSolve = trend(solving);
  const tRecog = trend(recog);
  const tStrat = trend(strat);

  if (!progress.attempts.length) {
    return (
      <div className="module">
        <header className="module-head">
          <h2>My Quant Progress</h2>
        </header>
        <p className="empty">No practice recorded yet. Everything on this page is calculated from your own attempts, so it stays empty until you practice.</p>
        <div className="actions">
          <a className="btn btn-primary" href="#/quick">
            Start with Practice What I Need →
          </a>
          <a className="btn" href="#/speed">
            Try Speed Training
          </a>
        </div>
        <BackupPanel />
      </div>
    );
  }

  return (
    <div className="module">
      <header className="module-head">
        <h2>My Quant Progress</h2>
        <p className="lede">Every number below comes from your recorded attempts. Recognition, method choice, and full solving are tracked separately.</p>
      </header>

      <div className="filter-bar" role="group" aria-label="Filters">
        <label>
          <span>Time range</span>
          <select value={filter.range} onChange={(e) => setFilter({ ...filter, range: e.target.value as RangeKey })}>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All time</option>
          </select>
        </label>
        <label>
          <span>Topic</span>
          <select value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value as Category | 'all' })}>
            <option value="all">All topics</option>
            {cats.map((c) => (
              <option key={c} value={c}>
                {CATEGORIES[c]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Practice mode</span>
          <select value={filter.mode} onChange={(e) => setFilter({ ...filter, mode: e.target.value })}>
            <option value="all">All modes</option>
            {modes.map((md) => (
              <option key={md} value={md}>
                {MODE_LABELS[md] ?? md}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!scoped.length && <p className="empty">No attempts match these filters.</p>}

      <section className="card">
        <h3>Accuracy by skill</h3>
        <div className="stats">
          <Tile label="Overall Quant accuracy" value={pctText(m.overall)} sub={nOf(m.overall, 'questions')} help="First submission on each question attempt. Unanswered counts as not correct." />
          <Tile label="Problem recognition" value={pctText(m.recognition)} sub={`${nOf(m.recognition)} · avg ${secs(m.recognitionAvgMs)}`} />
          <Tile label="Component identification" value={pctText(m.components)} sub={nOf(m.components)} help="Decode steps, decode exercises, and formula tests." />
          <Tile label="Strategy selection" value={pctText(m.strategy)} sub={`${nOf(m.strategy)} · avg ${secs(m.strategyAvgMs)}`} help="Choosing the fastest method or the best first step. Valid-but-slower counts as not fastest." />
          <Tile
            label="Calculation accuracy"
            value={m.calculation.classifiedMisses ? pctText(m.calculation.t) : '—'}
            sub={
              m.calculation.classifiedMisses
                ? `Correct ÷ (correct + misses marked calculation/careless) · ${m.calculation.unclassifiedMisses} miss${m.calculation.unclassifiedMisses === 1 ? '' : 'es'} not yet classified`
                : 'Shown once at least one missed question has a recorded cause'
            }
            help="Only classified misses can be attributed to calculation."
          />
          <Tile label="Average solving time" value={secs(m.avgSolveMs)} sub={`${m.completed} answered`} />
          <Tile label="Questions completed" value={String(m.completed)} sub={`${m.uniqueQuestions} different questions · ${m.unanswered} unanswered`} />
          <Tile label="Needed hints" value={String(m.withHints.total)} sub={m.withHints.total ? `${pctText(m.withHints)} correct with hints` : 'No hints used'} />
          <Tile label="Correct without hints" value={String(m.correctNoHints)} sub={m.overall.total ? `of ${m.overall.total} questions` : '—'} />
        </div>
      </section>

      <section className="card">
        <h3>Progress over time</h3>
        <LineChart
          title="Accuracy by day"
          yMax={1}
          yFormat={(v) => `${Math.round(v * 100)}%`}
          yLabel="Accuracy"
          emptyText="No dated attempts in this range."
          series={[
            { key: 'solving', label: 'Solving', slot: 1, points: solving.map((p) => ({ x: p.day, y: p.accuracy, n: p.n })) },
            { key: 'recognition', label: 'Recognition', slot: 2, points: recog.map((p) => ({ x: p.day, y: p.accuracy, n: p.n })) },
            { key: 'strategy', label: 'Strategy', slot: 3, points: strat.map((p) => ({ x: p.day, y: p.accuracy, n: p.n })) },
          ]}
        />
        <LineChart
          title="Average time per question by day"
          yFormat={(v) => `${Math.round(v)}s`}
          yLabel="Seconds"
          emptyText="No timed attempts in this range."
          series={[
            { key: 'solving', label: 'Solving', slot: 1, points: solving.filter((p) => p.avgMs !== null).map((p) => ({ x: p.day, y: p.avgMs! / 1000, n: p.n })) },
            { key: 'recognition', label: 'Recognition', slot: 2, points: recog.filter((p) => p.avgMs !== null).map((p) => ({ x: p.day, y: p.avgMs! / 1000, n: p.n })) },
          ]}
        />
        <div className="insight-box">
          <h4>Approach vs. execution</h4>
          {tRecog || tStrat || tSolve ? (
            <ul>
              {tRecog && <TrendLine label="Recognizing the problem" t={tRecog} />}
              {tStrat && <TrendLine label="Choosing the method" t={tStrat} />}
              {tSolve && <TrendLine label="Solving completely" t={tSolve} />}
            </ul>
          ) : (
            <p className="note">Not enough data yet. A trend appears once a skill has at least 12 attempts spread over two or more days.</p>
          )}
          {tRecog && tSolve && tRecog.after - tRecog.before > 0.1 && tSolve.after - tSolve.before <= 0.05 && (
            <p>You are getting better at identifying the approach even though full-solution accuracy has not caught up yet. That usually comes next.</p>
          )}
        </div>
      </section>

      <section className="card">
        <h3>Accuracy by topic</h3>
        <AccuracyBars rows={m.byCategory.map((c) => ({ label: CATEGORIES[c.category], ...c.t }))} emptyText="No answered questions in this range." />
        {m.bySubtopic.length > 0 && (
          <details className="topic-breakdown">
            <summary>By subtopic ({m.bySubtopic.length})</summary>
            <AccuracyBars rows={m.bySubtopic.map((s) => ({ label: s.topic, ...s.t }))} emptyText="" />
          </details>
        )}
      </section>

      <section className="card two-col">
        <div>
          <h3>By difficulty</h3>
          <AccuracyBars
            rows={([1, 2, 3] as const).filter((d) => m.byDifficulty[d].total).map((d) => ({ label: ['Foundational', 'Intermediate', 'Challenging'][d - 1], ...m.byDifficulty[d] }))}
            emptyText="No answered questions."
          />
        </div>
        <div>
          <h3>By GRE question format</h3>
          <AccuracyBars rows={(Object.keys(m.byFormat) as Format[]).filter((f) => m.byFormat[f].total).map((f) => ({ label: FORMAT_LABEL[f], ...m.byFormat[f] }))} emptyText="No answered questions." />
        </div>
      </section>

      <section className="card">
        <h3>Why I miss questions</h3>
        {m.mistakeCounts.length ? (
          <AccuracyBars rows={m.mistakeCounts.map((c) => ({ label: MISTAKE_LABELS[c.type], correct: c.count, total: m.mistakeCounts.reduce((s, x) => s + x.count, 0) }))} emptyText="" />
        ) : (
          <p className="note">No misses have a recorded cause yet.</p>
        )}
        {m.calculation.unclassifiedMisses > 0 && (
          <p className="note">
            {m.calculation.unclassifiedMisses} missed question{m.calculation.unclassifiedMisses === 1 ? ' has' : 's have'} no cause yet. <a href="#/review">Classify them in the Review Queue →</a>
          </p>
        )}
        <p className="note">Bars show each cause’s share of the classified misses.</p>
      </section>

      <div className="actions">
        <a className="btn btn-primary" href="#/next">
          What should I practice next? →
        </a>
        <a className="btn" href="#/review">
          Mistake Review Queue
        </a>
      </div>
      <BackupPanel />
    </div>
  );
}

function TrendLine({ label, t }: { label: string; t: { before: number; after: number; n1: number; n2: number } }) {
  const d = Math.round((t.after - t.before) * 100);
  return (
    <li>
      <strong>{label}:</strong> {Math.round(t.before * 100)}% → {Math.round(t.after * 100)}% ({d >= 0 ? '+' : ''}
      {d} points; {t.n1} earlier vs {t.n2} later attempts)
    </li>
  );
}

