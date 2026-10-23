/**
 * Phase 4 analytics. Every number is derived from recorded attempts; nothing is
 * estimated or seeded. Each attempt is one record, so no dashboard can count
 * the same attempt twice. Question metadata (topic, format, difficulty) comes
 * from the shared question bank via the attempt's question id.
 */
import { CATEGORY_LESSON, href } from '../data/links';
import { QUESTION_BY_ID, QUESTIONS } from '../data/questions';
import { AREAS, CATEGORIES } from '../data/taxonomy';
import type { Area, Category, Format, MistakeType, Question } from '../data/types';
import { MISTAKE_LABELS, recommendation } from './mistakes';
import type { Attempt, Classification } from './progress';
import { shuffle } from './random';

export type RangeKey = '7d' | '30d' | 'all';
export interface Filter {
  range: RangeKey;
  category: Category | 'all';
  mode: string | 'all';
}
export const ALL: Filter = { range: 'all', category: 'all', mode: 'all' };

export const MIN_ATTEMPTS_FOR_RANKING = 5;
const DAY = 24 * 60 * 60 * 1000;

export interface Tally {
  correct: number;
  total: number;
}
export const acc = (t: Tally): number | null => (t.total ? t.correct / t.total : null);
const tallyOf = (as: Attempt[]): Tally => ({ correct: as.filter((a) => a.result === 'correct').length, total: as.length });

/** Fill question metadata for attempts recorded before Phase 4 (or by modules that omit it). */
export function enrich(a: Attempt): Attempt & { q?: Question } {
  const q = QUESTION_BY_ID[a.ref];
  if (!q) return a;
  return { ...a, q, category: a.category ?? q.category, area: a.area ?? q.area, difficulty: a.difficulty ?? q.difficulty, format: a.format ?? q.format, topic: a.topic ?? q.topic };
}

/** Practice mode of an attempt; older attempts are mapped from their kind/source. */
export function modeOf(a: Attempt): string {
  if (a.mode) return a.mode;
  if (a.kind === 'recognition' || a.kind === 'first-step') return 'recognize';
  if (a.kind === 'strategy') return 'method';
  if (a.kind === 'answer') return a.detail ?? 'practice';
  return a.kind;
}

export const MODE_LABELS: Record<string, string> = {
  recognize: 'Recognize the Problem',
  'first-step': 'What would you do first?',
  method: 'Fastest Method',
  shortcut: 'Shortcut vs. Traditional',
  practice: 'Topic Practice',
  'practice-decode': 'Topic Practice (decode)',
  'practice-shortcut': 'Topic Practice (shortcut)',
  timed: 'Timed GRE practice',
  'speed-30': '30-Second Recognition',
  'speed-60': '60-Second Strategy',
  'review-retry': 'Review: retry',
  'review-similar': 'Review: similar',
  'review-recognize': 'Review: recognize only',
  quick: 'Practice What I Need',
};

export function applyFilter(attempts: Attempt[], f: Filter, now = Date.now()) {
  const since = f.range === '7d' ? now - 7 * DAY : f.range === '30d' ? now - 30 * DAY : -Infinity;
  return attempts
    .map(enrich)
    .filter((a) => a.ts >= since && (f.category === 'all' || a.category === f.category) && (f.mode === 'all' || modeOf(a) === f.mode));
}

const isAnswer = (a: Attempt) => a.kind === 'answer';
const isRecognition = (a: Attempt) => a.kind === 'recognition';
const isComponent = (a: Attempt) => a.kind === 'decode-step' || a.kind === 'decode-exercise' || a.kind === 'formula-check';
const isStrategy = (a: Attempt) => a.kind === 'strategy' || a.kind === 'first-step';

export interface Metrics {
  overall: Tally;
  byCategory: { category: Category; t: Tally }[];
  bySubtopic: { topic: string; category?: Category; t: Tally }[];
  recognition: Tally;
  recognitionAvgMs: number | null;
  components: Tally;
  strategy: Tally;
  strategyAvgMs: number | null;
  /** Correct ÷ (correct + misses classified as calculation/careless). Null until a miss is classified or a question is answered. */
  calculation: { t: Tally; classifiedMisses: number; unclassifiedMisses: number };
  avgSolveMs: number | null;
  completed: number;
  uniqueQuestions: number;
  unanswered: number;
  withHints: Tally;
  correctNoHints: number;
  byDifficulty: Record<1 | 2 | 3, Tally>;
  byFormat: Record<Format, Tally>;
  mistakeCounts: { type: MistakeType; count: number }[];
}

const avgMs = (as: Attempt[]) => {
  const t = as.filter((a) => typeof a.ms === 'number' && !a.unanswered);
  return t.length ? t.reduce((s, a) => s + a.ms!, 0) / t.length : null;
};

export function metrics(attempts: Attempt[], classifications: Record<string, Classification> = {}): Metrics {
  const answers = attempts.filter(isAnswer).map(enrich);
  const group = <K extends string>(key: (a: ReturnType<typeof enrich>) => K | undefined) => {
    const m = new Map<K, ReturnType<typeof enrich>[]>();
    for (const a of answers) {
      const k = key(a);
      if (k === undefined) continue;
      m.set(k, [...(m.get(k) ?? []), a]);
    }
    return m;
  };
  const byCat = group((a) => a.category);
  const bySub = group((a) => a.topic);
  const classOf = (a: Attempt) => (a.id ? classifications[a.id] : undefined);
  const misses = answers.filter((a) => a.result !== 'correct');
  const calcMisses = misses.filter((a) => {
    const c = classOf(a);
    return c && (c.type === 'calculation' || c.type === 'careless');
  }).length;
  const classifiedMisses = misses.filter((a) => classOf(a) && classOf(a)!.type !== 'unsure').length;
  const correct = answers.filter((a) => a.result === 'correct').length;
  const counts = new Map<MistakeType, number>();
  for (const a of misses) {
    const c = classOf(a);
    if (c && c.type !== 'unsure') counts.set(c.type, (counts.get(c.type) ?? 0) + 1);
  }
  const fmt = (f: Format) => tallyOf(answers.filter((a) => a.format === f));
  const recog = attempts.filter(isRecognition);
  const strat = attempts.filter(isStrategy);
  return {
    overall: tallyOf(answers),
    byCategory: [...byCat.entries()].map(([category, as]) => ({ category, t: tallyOf(as) })).sort((a, b) => b.t.total - a.t.total),
    bySubtopic: [...bySub.entries()].map(([topic, as]) => ({ topic, category: as[0].category, t: tallyOf(as) })).sort((a, b) => b.t.total - a.t.total),
    recognition: tallyOf(recog),
    recognitionAvgMs: avgMs(recog),
    components: tallyOf(attempts.filter(isComponent)),
    strategy: tallyOf(strat),
    strategyAvgMs: avgMs(strat),
    calculation: { t: { correct, total: correct + calcMisses }, classifiedMisses, unclassifiedMisses: misses.length - classifiedMisses },
    avgSolveMs: avgMs(answers),
    completed: answers.filter((a) => !a.unanswered).length,
    uniqueQuestions: new Set(answers.map((a) => a.ref)).size,
    unanswered: answers.filter((a) => a.unanswered).length,
    withHints: tallyOf(answers.filter((a) => (a.hintsUsed ?? 0) > 0)),
    correctNoHints: answers.filter((a) => a.result === 'correct' && !(a.hintsUsed ?? 0)).length,
    byDifficulty: { 1: tallyOf(answers.filter((a) => a.difficulty === 1)), 2: tallyOf(answers.filter((a) => a.difficulty === 2)), 3: tallyOf(answers.filter((a) => a.difficulty === 3)) },
    byFormat: { 'mc-single': fmt('mc-single'), 'mc-multi': fmt('mc-multi'), numeric: fmt('numeric'), qc: fmt('qc') },
    mistakeCounts: [...counts.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
  };
}

export type SeriesKey = 'solving' | 'recognition' | 'strategy';
export interface SeriesPoint {
  day: number; // start of local day, ms
  accuracy: number;
  n: number;
  avgMs: number | null;
}

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Daily accuracy and speed for one skill. Only days with attempts appear. */
export function series(attempts: Attempt[], key: SeriesKey): SeriesPoint[] {
  const pick = key === 'solving' ? isAnswer : key === 'recognition' ? isRecognition : isStrategy;
  const byDay = new Map<number, Attempt[]>();
  for (const a of attempts.filter(pick)) {
    const d = startOfDay(a.ts);
    byDay.set(d, [...(byDay.get(d) ?? []), a]);
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([day, as]) => ({ day, accuracy: as.filter((a) => a.result === 'correct').length / as.length, n: as.length, avgMs: avgMs(as) }));
}

// ---------- Weak areas ----------

export interface WeakArea {
  category: Category;
  n: number;
  accuracy: number;
  answerAcc: number | null;
  recognitionAcc: number | null;
  strategyAcc: number | null;
  recentAcc: number;
  wrong: number;
  avgSolveMs: number | null;
  topMistake: { type: MistakeType; count: number } | null;
  score: number;
  advice: string;
  practice: { label: string; href: string };
  confidence: 'early' | 'moderate';
}

export function weakAreas(attempts: Attempt[], classifications: Record<string, Classification> = {}) {
  const relevant = attempts.map(enrich).filter((a) => a.category && (isAnswer(a) || isRecognition(a) || isStrategy(a) || a.kind === 'decode-step'));
  const cats = [...new Set(relevant.map((a) => a.category!))];
  const ranked: WeakArea[] = [];
  const insufficient: { category: Category; n: number }[] = [];
  for (const category of cats) {
    const as = relevant.filter((a) => a.category === category).sort((a, b) => a.ts - b.ts);
    if (as.length < MIN_ATTEMPTS_FOR_RANKING) {
      insufficient.push({ category, n: as.length });
      continue;
    }
    const t = tallyOf(as);
    const answers = as.filter(isAnswer);
    const recog = as.filter(isRecognition);
    const strat = as.filter(isStrategy);
    const recent = tallyOf(as.slice(-6));
    const wrongAnswers = answers.filter((a) => a.result !== 'correct');
    const types = new Map<MistakeType, number>();
    for (const a of wrongAnswers) {
      const c = a.id ? classifications[a.id] : undefined;
      if (c && c.type !== 'unsure') types.set(c.type, (types.get(c.type) ?? 0) + 1);
    }
    const top = [...types.entries()].sort((a, b) => b[1] - a[1])[0];
    const accuracy = t.correct / t.total;
    const recognitionAcc = acc(tallyOf(recog));
    const strategyAcc = acc(tallyOf(strat));
    const answerAcc = acc(tallyOf(answers));
    const mistakeRate = answers.length ? wrongAnswers.length / answers.length : 0;
    const score = 0.35 * (1 - accuracy) + 0.3 * (1 - acc(recent)!) + 0.15 * (recognitionAcc === null ? 0 : 1 - recognitionAcc) + 0.2 * mistakeRate;

    // Advice targets the weakest observed skill, preferring classified evidence.
    const sample = QUESTIONS.find((q) => q.category === category)!;
    let advice: string;
    let practice: { label: string; href: string };
    if (top) {
      const rec = recommendation(top[0], sample);
      advice = `Your most common recorded mistake here is ${MISTAKE_LABELS[top[0]].toLowerCase()} (${top[1]}×). ${rec.why}`;
      practice = { label: rec.label, href: rec.href };
    } else if (recognitionAcc !== null && (answerAcc === null || recognitionAcc < answerAcc) && recognitionAcc < 0.75) {
      advice = 'You often identify this problem type incorrectly. Work on the clues that signal it before solving.';
      practice = { label: 'Recognition Practice', href: `#/recognize?cat=${category}` };
    } else if (strategyAcc !== null && strategyAcc < 0.6) {
      advice = 'Your method choices here are often slower or unreliable. Practice choosing the method first.';
      practice = { label: 'Choose the Fastest Method', href: `#/method?cat=${category}` };
    } else {
      advice = 'Your solving accuracy is the weak point. Review the lesson, then solve questions using hints.';
      practice = { label: 'Topic Practice', href: href.lessonPractice(CATEGORY_LESSON[category], 'solve') };
    }
    ranked.push({
      category,
      n: as.length,
      accuracy,
      answerAcc,
      recognitionAcc,
      strategyAcc,
      recentAcc: acc(recent)!,
      wrong: wrongAnswers.length,
      avgSolveMs: avgMs(answers),
      topMistake: top ? { type: top[0], count: top[1] } : null,
      score,
      advice,
      practice,
      confidence: as.length < 12 ? 'early' : 'moderate',
    });
  }
  ranked.sort((a, b) => b.score - a.score);
  return { ranked, insufficient: insufficient.sort((a, b) => b.n - a.n) };
}

// ---------- Mistake review queue ----------

export interface QueueEntry {
  q: Question;
  failed: number;
  history: { id?: string; ts: number; result: Attempt['result']; mode: string; unanswered?: boolean }[];
  firstFail: number;
  lastFail: number;
  latest: Attempt['result'];
  types: MistakeType[];
  improved: boolean;
}

/** Every question with at least one incorrect (or unanswered) answer attempt. History is append-only. */
export function reviewQueue(attempts: Attempt[], classifications: Record<string, Classification> = {}): QueueEntry[] {
  const answers = attempts.filter((a) => isAnswer(a) && QUESTION_BY_ID[a.ref]).sort((a, b) => a.ts - b.ts);
  const byQ = new Map<string, Attempt[]>();
  for (const a of answers) byQ.set(a.ref, [...(byQ.get(a.ref) ?? []), a]);
  const out: QueueEntry[] = [];
  for (const [qid, as] of byQ) {
    const fails = as.filter((a) => a.result !== 'correct');
    if (!fails.length) continue;
    const types = [...new Set(fails.map((a) => (a.id ? classifications[a.id]?.type : undefined)).filter((t): t is MistakeType => !!t && t !== 'unsure'))];
    out.push({
      q: QUESTION_BY_ID[qid],
      failed: fails.length,
      history: as.map((a) => ({ id: a.id, ts: a.ts, result: a.result, mode: modeOf(a), unanswered: a.unanswered })),
      firstFail: fails[0].ts,
      lastFail: fails.at(-1)!.ts,
      latest: as.at(-1)!.result,
      types,
      improved: as.at(-1)!.result === 'correct',
    });
  }
  return out.sort((a, b) => b.lastFail - a.lastFail);
}

// ---------- Practice What I Need ----------

export type QuickMode = 'recognition' | 'decode' | 'strategy' | 'solve';
export interface QuickPlan {
  diagnostic: boolean;
  targets: Category[];
  items: { qid: string; mode: QuickMode; category: Category }[];
  reason: string;
  baseline: Partial<Record<Category, number>>;
}

const QUICK_MODES: QuickMode[] = ['recognition', 'decode', 'strategy', 'solve', 'solve'];

export function quickPlan(attempts: Attempt[], classifications: Record<string, Classification> = {}, rand: () => number = Math.random): QuickPlan {
  const { ranked } = weakAreas(attempts, classifications);
  const weak = ranked.filter((w) => w.accuracy < 0.85 || w.recentAcc < 0.85).slice(0, 3);
  const seenRecently = new Set(attempts.filter((a) => Date.now() - a.ts < DAY).map((a) => a.ref));
  const used = new Set<string>();
  const pick = (cat: Category | null, area: Area | null, preferMissed: boolean) => {
    const fresh = QUESTIONS.filter((q) => !used.has(q.id) && (!area || q.area === area));
    // Primary topic first, then questions where the topic is a secondary concept, then anything unused.
    let pool = cat ? fresh.filter((q) => q.category === cat) : fresh;
    if (!pool.length && cat) pool = fresh.filter((q) => q.secondary.includes(cat));
    if (!pool.length) pool = QUESTIONS.filter((q) => !used.has(q.id));
    const missed = new Set(reviewQueue(attempts, classifications).filter((e) => !e.improved).map((e) => e.q.id));
    const ordered = shuffle(pool, rand).sort((a, b) => {
      const sa = (preferMissed && missed.has(a.id) ? -2 : 0) + (seenRecently.has(a.id) ? 1 : 0);
      const sb = (preferMissed && missed.has(b.id) ? -2 : 0) + (seenRecently.has(b.id) ? 1 : 0);
      return sa - sb;
    });
    const q = ordered[0];
    used.add(q.id);
    return q;
  };

  if (!weak.length) {
    // Balanced diagnostic: one item per content area (plus one mixed), moderate difficulty preferred.
    const areas = Object.keys(AREAS) as Area[];
    const items = QUICK_MODES.map((mode, i) => {
      const q = pick(null, areas[i % areas.length], false);
      return { qid: q.id, mode, category: q.category };
    });
    return { diagnostic: true, targets: [], items, reason: `Not enough recorded practice yet to identify weak areas (each topic needs at least ${MIN_ATTEMPTS_FOR_RANKING} attempts). This is a balanced diagnostic set across all four content areas.`, baseline: {} };
  }
  const items = QUICK_MODES.map((mode, i) => {
    const w = weak[i % weak.length];
    const q = pick(w.category, null, mode === 'solve');
    return { qid: q.id, mode, category: q.category };
  });
  return {
    diagnostic: false,
    targets: weak.map((w) => w.category),
    items,
    reason: `Targets your weakest recorded topics: ${weak.map((w) => `${CATEGORIES[w.category]} (${Math.round(w.accuracy * 100)}% over ${w.n} attempts)`).join('; ')}.`,
    baseline: Object.fromEntries(weak.map((w) => [w.category, w.accuracy])),
  };
}
