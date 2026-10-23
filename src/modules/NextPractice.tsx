import { useMemo } from 'react';
import { Tag } from '../components/ui';
import { CATEGORIES } from '../data/taxonomy';
import { MIN_ATTEMPTS_FOR_RANKING, weakAreas } from '../lib/analytics';
import { MISTAKE_LABELS } from '../lib/mistakes';
import { useProgress } from '../lib/progress';

const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)}%`);

export function NextPractice() {
  const progress = useProgress();
  const { ranked, insufficient } = useMemo(() => weakAreas(progress.attempts, progress.classifications), [progress.attempts, progress.classifications]);
  const weak = ranked.filter((w) => w.accuracy < 0.85 || w.recentAcc < 0.85);
  const strong = ranked.filter((w) => !weak.includes(w));

  return (
    <div className="module">
      <header className="module-head">
        <h2>What Should I Practice Next?</h2>
        <p className="lede">
          Topics are ranked by accuracy, recent performance, recognition, and how often you miss questions. A topic is only ranked after {MIN_ATTEMPTS_FOR_RANKING} recorded attempts, so one or two questions never decide it.
        </p>
      </header>
      <div className="actions">
        <a className="btn btn-primary" href="#/quick">
          Practice What I Need (5 questions) →
        </a>
      </div>

      {!ranked.length && (
        <p className="empty">
          There isn’t enough data to rank any topic yet. <a href="#/quick">Practice What I Need</a> starts with a balanced diagnostic set across all four content areas.
        </p>
      )}

      {weak.map((w, i) => (
        <section key={w.category} className="card weak-card">
          <div className="card-head">
            <h3>
              {i + 1}. {CATEGORIES[w.category]}
            </h3>
            <Tag tone={w.confidence === 'early' ? 'medium' : 'neutral'}>{w.confidence === 'early' ? `Early signal · ${w.n} attempts` : `${w.n} attempts`}</Tag>
          </div>
          <dl className="explain-grid">
            <dt>ACCURACY</dt>
            <dd>
              {pct(w.accuracy)} overall · last 6: {pct(w.recentAcc)} · solving {pct(w.answerAcc)} · recognition {pct(w.recognitionAcc)} · strategy {pct(w.strategyAcc)}
            </dd>
            <dt>MOST COMMON MISTAKE</dt>
            <dd>{w.topMistake ? `${MISTAKE_LABELS[w.topMistake.type]} (${w.topMistake.count}×)` : w.wrong ? 'Not known yet: your misses here have no recorded cause.' : 'No missed questions here.'}</dd>
            <dt>WHAT TO IMPROVE</dt>
            <dd>{w.advice}</dd>
            {w.avgSolveMs !== null && (
              <>
                <dt>TIME</dt>
                <dd>{Math.round(w.avgSolveMs / 1000)}s average per question</dd>
              </>
            )}
          </dl>
          <a className="btn btn-primary" href={w.practice.href}>
            {w.practice.label} →
          </a>
        </section>
      ))}

      {strong.length > 0 && (
        <section className="card">
          <h3>Going well</h3>
          <ul>
            {strong.map((w) => (
              <li key={w.category}>
                {CATEGORIES[w.category]}: {pct(w.accuracy)} over {w.n} attempts (recent {pct(w.recentAcc)})
              </li>
            ))}
          </ul>
        </section>
      )}

      {insufficient.length > 0 && (
        <section className="card">
          <h3>Not enough data yet</h3>
          <p className="note">These topics have fewer than {MIN_ATTEMPTS_FOR_RANKING} attempts, which is too few to judge.</p>
          <ul>
            {insufficient.map((x) => (
              <li key={x.category}>
                {CATEGORIES[x.category]}: {x.n} attempt{x.n === 1 ? '' : 's'} · <a href={`#/recognize?cat=${x.category}`}>practice</a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
