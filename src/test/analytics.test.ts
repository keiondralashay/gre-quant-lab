import { QUESTION_BY_ID } from '../data/questions';
import { applyFilter, metrics, quickPlan, reviewQueue, series, weakAreas, MIN_ATTEMPTS_FOR_RANKING } from '../lib/analytics';
import { inferMistake, matchDistractor, recommendation, serializeAnswer, serializeResponse } from '../lib/mistakes';
import { getProgress, reloadProgress, resetProgress, STORAGE_KEY, type Attempt, type Classification } from '../lib/progress';
import { seeded } from '../lib/random';

const DAY = 86_400_000;
const NOW = new Date(2026, 9, 20, 12).getTime();
let n = 0;
const at = (p: Partial<Attempt> & Pick<Attempt, 'kind' | 'ref' | 'result'>): Attempt => ({ id: `t${n++}`, ts: NOW, ...p });

describe('metrics', () => {
  const attempts: Attempt[] = [
    at({ kind: 'answer', ref: 'ar-pct-sale', result: 'correct', ms: 30_000 }),
    at({ kind: 'answer', ref: 'ar-pct-change-qc', result: 'incorrect', ms: 60_000, hintsUsed: 1 }),
    at({ kind: 'answer', ref: 'al-quad-3x2-multi', result: 'correct', ms: 90_000, hintsUsed: 2 }),
    at({ kind: 'answer', ref: 'da-two-red', result: 'incorrect', unanswered: true }),
    at({ kind: 'recognition', ref: 'ar-pct-sale', result: 'correct', ms: 5000 }),
    at({ kind: 'recognition', ref: 'da-two-red', result: 'partial', ms: 7000 }),
    at({ kind: 'strategy', ref: 'al-system-sum', result: 'partial' }),
    at({ kind: 'first-step', ref: 'al-system-sum', result: 'correct' }),
    at({ kind: 'decode-exercise', ref: 'quadratic:quad-1', result: 'correct' }),
    at({ kind: 'formula-check', ref: 'formula:slope:sl', result: 'incorrect' }),
  ];
  const cls: Record<string, Classification> = { [attempts[1].id!]: { type: 'calculation', source: 'self-reported', ts: NOW } };
  const m = metrics(attempts, cls);

  it('computes each skill separately', () => {
    expect(m.overall).toEqual({ correct: 2, total: 4 });
    expect(m.recognition).toEqual({ correct: 1, total: 2 });
    expect(m.strategy).toEqual({ correct: 1, total: 2 });
    expect(m.components).toEqual({ correct: 1, total: 2 });
    expect(m.recognitionAvgMs).toBe(6000);
  });
  it('times only answered questions and counts unanswered separately', () => {
    expect(m.avgSolveMs).toBe(60_000);
    expect(m.completed).toBe(3);
    expect(m.unanswered).toBe(1);
  });
  it('hints, formats, difficulty, and topics come from the shared question bank', () => {
    expect(m.withHints).toEqual({ correct: 1, total: 2 });
    expect(m.correctNoHints).toBe(1);
    expect(m.byFormat['mc-multi']).toEqual({ correct: 1, total: 1 });
    expect(m.byFormat.qc).toEqual({ correct: 0, total: 1 });
    expect(m.byCategory.find((c) => c.category === 'percentages')!.t).toEqual({ correct: 1, total: 2 });
    expect(m.bySubtopic.find((s) => s.topic === 'Percent discount')!.t).toEqual({ correct: 1, total: 1 });
    const d = QUESTION_BY_ID['ar-pct-sale'].difficulty;
    expect(m.byDifficulty[d].total).toBeGreaterThan(0);
  });
  it('calculation accuracy uses classified misses only, and reports the unclassified ones', () => {
    expect(m.calculation.t).toEqual({ correct: 2, total: 3 });
    expect(m.calculation.classifiedMisses).toBe(1);
    expect(m.calculation.unclassifiedMisses).toBe(1);
    expect(m.mistakeCounts).toEqual([{ type: 'calculation', count: 1 }]);
  });
  it('does not double count: category totals sum to the overall total', () => {
    expect(m.byCategory.reduce((s, c) => s + c.t.total, 0)).toBe(m.overall.total);
  });
  it('shows nothing when there is no activity', () => {
    const e = metrics([]);
    expect(e.overall.total).toBe(0);
    expect(e.avgSolveMs).toBeNull();
    expect(e.byCategory).toEqual([]);
  });
});

describe('filters and time series', () => {
  const attempts = [
    at({ kind: 'answer', ref: 'ar-pct-sale', result: 'correct', ts: NOW - 1 * DAY, mode: 'timed', ms: 40_000 }),
    at({ kind: 'answer', ref: 'ar-pct-sale', result: 'incorrect', ts: NOW - 1 * DAY, mode: 'practice', ms: 20_000 }),
    at({ kind: 'answer', ref: 'ge-triangle-angle', result: 'correct', ts: NOW - 10 * DAY }),
    at({ kind: 'recognition', ref: 'ge-triangle-angle', result: 'correct', ts: NOW - 40 * DAY }),
  ];
  it('filters by range, topic, and mode', () => {
    expect(applyFilter(attempts, { range: '7d', category: 'all', mode: 'all' }, NOW)).toHaveLength(2);
    expect(applyFilter(attempts, { range: '30d', category: 'all', mode: 'all' }, NOW)).toHaveLength(3);
    expect(applyFilter(attempts, { range: 'all', category: 'geometry', mode: 'all' }, NOW)).toHaveLength(2);
    expect(applyFilter(attempts, { range: 'all', category: 'all', mode: 'timed' }, NOW)).toHaveLength(1);
  });
  it('buckets accuracy and speed by day, recognition separately from solving', () => {
    const s = series(attempts, 'solving');
    expect(s).toHaveLength(2);
    expect(s[1]).toMatchObject({ accuracy: 0.5, n: 2, avgMs: 30_000 });
    expect(series(attempts, 'recognition')).toHaveLength(1);
  });
});

describe('weak areas', () => {
  it('reports insufficient data instead of ranking topics with few attempts', () => {
    const few = Array.from({ length: MIN_ATTEMPTS_FOR_RANKING - 1 }, () => at({ kind: 'answer', ref: 'ar-pct-sale', result: 'incorrect' }));
    const w = weakAreas(few);
    expect(w.ranked).toEqual([]);
    expect(w.insufficient).toEqual([{ category: 'percentages', n: MIN_ATTEMPTS_FOR_RANKING - 1 }]);
  });
  it('ranks the topic with worse recorded performance first and names the top mistake', () => {
    const attempts: Attempt[] = [];
    for (let i = 0; i < 6; i++) attempts.push(at({ kind: 'answer', ref: 'ge-triangle-angle', result: 'correct', ts: NOW - i }));
    const wrong: Attempt[] = [];
    for (let i = 0; i < 6; i++) wrong.push(at({ kind: 'answer', ref: 'ar-remainder-3n', result: i < 4 ? 'incorrect' : 'correct', ts: NOW - i }));
    const cls = Object.fromEntries(wrong.filter((a) => a.result === 'incorrect').map((a) => [a.id!, { type: 'reading', source: 'self-reported', ts: NOW } as Classification]));
    const w = weakAreas([...attempts, ...wrong], cls);
    expect(w.ranked[0].category).toBe('remainders');
    expect(w.ranked[0].topMistake).toEqual({ type: 'reading', count: 4 });
    expect(w.ranked[0].practice.href).toBe('#/clues');
    expect(w.ranked[0].confidence).toBe('early');
  });
});

describe('review queue', () => {
  it('collects missed questions, keeps full history, and marks improvement', () => {
    const attempts = [
      at({ kind: 'answer', ref: 'da-two-red', result: 'incorrect', ts: NOW - 3000 }),
      at({ kind: 'answer', ref: 'da-two-red', result: 'incorrect', ts: NOW - 2000, mode: 'review-retry' }),
      at({ kind: 'answer', ref: 'da-two-red', result: 'correct', ts: NOW - 1000, mode: 'review-retry' }),
      at({ kind: 'answer', ref: 'ar-pct-sale', result: 'correct', ts: NOW }),
    ];
    const q = reviewQueue(attempts);
    expect(q.map((e) => e.q.id)).toEqual(['da-two-red']);
    expect(q[0].failed).toBe(2);
    expect(q[0].history.map((h) => h.result)).toEqual(['incorrect', 'incorrect', 'correct']);
    expect(q[0].improved).toBe(true);
  });
});

describe('Practice What I Need', () => {
  it('falls back to a balanced diagnostic when data is insufficient', () => {
    const p = quickPlan([], {}, seeded(1));
    expect(p.diagnostic).toBe(true);
    expect(p.items).toHaveLength(5);
    expect(p.items.map((i) => i.mode)).toEqual(['recognition', 'decode', 'strategy', 'solve', 'solve']);
    expect(new Set(p.items.map((i) => QUESTION_BY_ID[i.qid].area)).size).toBe(4);
    expect(new Set(p.items.map((i) => i.qid)).size).toBe(5);
  });
  it('targets recorded weak topics', () => {
    const attempts = Array.from({ length: 8 }, (_, i) => at({ kind: 'answer', ref: 'ar-remainder-3n', result: i < 6 ? 'incorrect' : 'correct', ts: NOW - i }));
    const p = quickPlan(attempts, {}, seeded(2));
    expect(p.diagnostic).toBe(false);
    expect(p.targets).toEqual(['remainders']);
    const related = Object.values(QUESTION_BY_ID).filter((q) => q.category === 'remainders' || q.secondary.includes('remainders')).length;
    const targeted = p.items.filter((i) => QUESTION_BY_ID[i.qid].category === 'remainders' || QUESTION_BY_ID[i.qid].secondary.includes('remainders')).length;
    expect(targeted).toBe(Math.min(5, related));
    expect(p.baseline.remainders).toBeCloseTo(2 / 8);
  });
});

describe('mistake inference uses evidence only', () => {
  const q = QUESTION_BY_ID['b3-ribbon-gcf']; // distractor: choice 3 (the piece length) → reading
  it('matches an authored distractor', () => {
    const r = { kind: 'mc-single' as const, choice: 3 };
    expect(matchDistractor(q, r)?.type).toBe('reading');
    expect(inferMistake({ q, response: r, attempt: { ts: NOW }, history: [] })).toMatchObject({ type: 'reading', strength: 'strong' });
  });
  it('matches numeric distractors by value, not text', () => {
    const qq = QUESTION_BY_ID['b3-root-product'];
    expect(matchDistractor(qq, { kind: 'numeric', text: '-3.5' })?.type).toBe('concept');
  });
  it('uses a wrong recognition attempt on the same question as evidence', () => {
    const hist = [at({ kind: 'recognition', ref: q.id, result: 'incorrect', ts: NOW - 60_000 })];
    expect(inferMistake({ q, response: { kind: 'mc-single', choice: 0 }, attempt: { ts: NOW }, history: hist })?.type).toBe('recognition');
  });
  it('time expiry → timing; a plain skip → unknown', () => {
    expect(inferMistake({ q, attempt: { ts: NOW, unanswered: true }, history: [], timeExpired: true })?.type).toBe('timing');
    expect(inferMistake({ q, attempt: { ts: NOW, unanswered: true }, history: [] })).toBeNull();
  });
  it('slow answers are only a suggestion, never stored automatically', () => {
    const inf = inferMistake({ q, response: { kind: 'mc-single', choice: 0 }, attempt: { ts: NOW, ms: 300_000 }, history: [], paceMs: 105_000 });
    expect(inf).toMatchObject({ type: 'timing', strength: 'suggested' });
  });
  it('returns null when nothing supports a conclusion', () => {
    expect(inferMistake({ q, response: { kind: 'mc-single', choice: 0 }, attempt: { ts: NOW }, history: [] })).toBeNull();
  });
  it('recommends an activity for every type', () => {
    for (const t of ['recognition', 'concept', 'strategy', 'calculation', 'reading', 'careless', 'timing'] as const) expect(recommendation(t, q).href).toMatch(/^#\//);
  });
  it('serializes responses and answers', () => {
    expect(serializeResponse({ kind: 'mc-multi', choices: [3, 0] })).toBe('A, D');
    expect(serializeAnswer(QUESTION_BY_ID['da-two-red'].answer)).toBe('2/15');
  });
});

describe('storage', () => {
  it('assigns ids to legacy attempts on load and preserves every recorded field', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, attempts: [{ kind: 'answer', ref: 'ar-pct-sale', result: 'correct', ts: 5, ms: 1000 }] }));
    reloadProgress();
    expect(getProgress().attempts[0]).toEqual({ id: 'a5-0', kind: 'answer', ref: 'ar-pct-sale', result: 'correct', ts: 5, ms: 1000 });
    resetProgress();
  });
});
