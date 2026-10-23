import { QUESTION_BY_ID, QUESTIONS } from '../data/questions';
import type { Area, Question } from '../data/types';
import { grade, type Response } from './grading';
import { serializeAnswer, serializeResponse } from './mistakes';
import type { SessionQuestion, SessionRecord } from './progress';
import { shuffle } from './random';

/**
 * Official-style timing from ETS’s current GRE General Test structure
 * (https://www.ets.org/gre/test-takers/general-test/prepare/test-structure.html):
 * Quantitative Reasoning has two sections, 12 questions in 21 minutes and 15 in 26 minutes.
 * The real second section is adaptive; these presets match length and timing only.
 */
export const OFFICIAL_PRESETS = [
  { id: 'ets-1', label: 'Official-style Section 1', count: 12, minutes: 21 },
  { id: 'ets-2', label: 'Official-style Section 2', count: 15, minutes: 26 },
] as const;

/** Average seconds per question across both official sections: (21 + 26) min ÷ 27 questions ≈ 104 s. */
export const OFFICIAL_PACE_SEC = ((21 + 26) * 60) / (12 + 15);

export const SET_SIZES = [5, 10, 15, 20] as const;

export interface ActiveTimed {
  id: string;
  label: string;
  questionIds: string[];
  responses: Record<string, Response>;
  marked: string[];
  /** Accumulated visible time per question, ms. */
  times: Record<string, number>;
  index: number;
  startedAt: number;
  deadline: number;
  /** When the current question became visible. */
  visibleSince: number;
}

/** Mixed topics and formats; every content area appears when the set has ≥ 4 questions. */
export function pickQuestions(count: number, rand: () => number = Math.random): Question[] {
  const areas: Area[] = ['arithmetic', 'algebra', 'geometry', 'data'];
  const pool = shuffle(QUESTIONS, rand);
  const chosen: Question[] = [];
  if (count >= 4) for (const a of areas) chosen.push(pool.find((q) => q.area === a && !chosen.includes(q))!);
  for (const q of pool) {
    if (chosen.length >= count) break;
    if (!chosen.includes(q)) chosen.push(q);
  }
  return shuffle(chosen.slice(0, count), rand);
}

export function createSession(opts: { label: string; count: number; minutes: number; now?: number; rand?: () => number; id?: string }): ActiveTimed {
  const now = opts.now ?? Date.now();
  return {
    id: opts.id ?? `s${now.toString(36)}`,
    label: opts.label,
    questionIds: pickQuestions(opts.count, opts.rand).map((q) => q.id),
    responses: {},
    marked: [],
    times: {},
    index: 0,
    startedAt: now,
    deadline: now + opts.minutes * 60_000,
    visibleSince: now,
  };
}

/** Move to another question, crediting visible time to the one being left. */
export function goTo(s: ActiveTimed, index: number, now = Date.now()): ActiveTimed {
  const cur = s.questionIds[s.index];
  const spent = Math.max(0, Math.min(now, s.deadline) - s.visibleSince);
  return { ...s, times: { ...s.times, [cur]: (s.times[cur] ?? 0) + spent }, index, visibleSince: now };
}

export function answeredCount(s: ActiveTimed) {
  return s.questionIds.filter((id) => {
    const r = s.responses[id];
    return r && (r.kind === 'mc-multi' ? r.choices.length > 0 : r.kind === 'numeric' ? r.text.trim() !== '' : r.choice !== null);
  }).length;
}

export interface Finished {
  record: SessionRecord;
  attempts: { q: Question; response?: Response; result: 'correct' | 'incorrect'; ms: number; unanswered: boolean; selected?: string; correctAnswer: string }[];
}

/** Grade a session. Unparseable or empty responses count as unanswered. */
export function finishSession(s: ActiveTimed, status: 'completed' | 'time-expired', now = Date.now()): Finished {
  const closed = goTo(s, s.index, now);
  const attempts: Finished['attempts'] = closed.questionIds.map((id) => {
    const q = QUESTION_BY_ID[id];
    const r = closed.responses[id];
    const g = r ? grade(q, r) : 'invalid';
    const unanswered = g === 'invalid';
    return { q, response: unanswered ? undefined : r, result: g === 'correct' ? 'correct' : 'incorrect', ms: Math.round(closed.times[id] ?? 0), unanswered, selected: unanswered ? undefined : serializeResponse(r!), correctAnswer: serializeAnswer(q.answer) };
  });
  const questions: SessionQuestion[] = attempts.map((a) => ({ id: a.q.id, ms: a.ms, selected: a.selected, correct: a.result === 'correct', unanswered: a.unanswered, marked: closed.marked.includes(a.q.id) }));
  return {
    record: { id: s.id, kind: 'timed', label: s.label, startedAt: s.startedAt, endedAt: Math.min(now, s.deadline), timeLimitMs: s.deadline - s.startedAt, status, questions },
    attempts,
  };
}

export interface TimeReport {
  usedMs: number;
  avgMs: number | null;
  correct: number;
  incorrect: number;
  unanswered: number;
  paceMs: number;
  slowest: SessionQuestion[];
  quickCorrect: SessionQuestion[];
  quickWrong: SessionQuestion[];
  patterns: string[];
  savings: { q: Question; ms: number; fastSteps: number; longSteps: number }[];
}

/** Time-management analysis. Slow answers are never treated as lack of understanding. */
export function timeReport(rec: SessionRecord): TimeReport {
  const qs = rec.questions;
  const answered = qs.filter((q) => !q.unanswered);
  const paceMs = rec.timeLimitMs ? rec.timeLimitMs / qs.length : OFFICIAL_PACE_SEC * 1000;
  const usedMs = rec.endedAt - rec.startedAt;
  const quick = (q: SessionQuestion) => !q.unanswered && q.ms < paceMs * 0.5;
  const slow = (q: SessionQuestion) => q.ms > paceMs * 1.5;
  const slowest = [...qs].filter((q) => q.ms > 0).sort((a, b) => b.ms - a.ms).slice(0, 3);
  const quickCorrect = qs.filter((q) => quick(q) && q.correct);
  const quickWrong = qs.filter((q) => quick(q) && !q.correct);
  const savings = qs
    .filter((x) => x.ms > paceMs)
    .map((x) => ({ x, q: QUESTION_BY_ID[x.id] }))
    .filter(({ q }) => q && !q.solution.longIsFastest && (q.solution.long?.length ?? 0) > q.solution.fast.length)
    .sort((a, b) => b.x.ms - a.x.ms)
    .map(({ x, q }) => ({ q, ms: x.ms, fastSteps: q.solution.fast.length, longSteps: q.solution.long!.length }));

  const patterns: string[] = [];
  const unanswered = qs.filter((q) => q.unanswered).length;
  if (rec.status === 'time-expired' && unanswered) patterns.push(`Time ran out with ${unanswered} question${unanswered === 1 ? '' : 's'} unanswered. On the GRE there is no penalty for guessing, so answer every question and mark the hard ones to revisit.`);
  if (savings.length) patterns.push(`${savings.length} question${savings.length === 1 ? '' : 's'} where you spent more than the target pace ${savings.length === 1 ? 'has' : 'have'} a shorter method available (see below).`);
  if (quickWrong.length >= 2) patterns.push(`${quickWrong.length} quick answers were wrong. Taking a few seconds to re-read what is asked and any restrictions may help.`);
  const slowCorrect = qs.filter((q) => slow(q) && q.correct).length;
  if (slowCorrect) patterns.push(`${slowCorrect} slower answer${slowCorrect === 1 ? ' was' : 's were'} correct. Slow isn’t wrong; the next step is finding a quicker route on those.`);
  const times = answered.map((q) => q.ms).sort((a, b) => a - b);
  const median = times.length ? times[Math.floor(times.length / 2)] : 0;
  if (median && slowest[0] && slowest[0].ms > 3 * median) patterns.push(`One question took about ${Math.round(slowest[0].ms / median)}× your typical time. When a question stalls, mark it, move on, and come back.`);

  return {
    usedMs,
    avgMs: answered.length ? answered.reduce((s, q) => s + q.ms, 0) / answered.length : null,
    correct: qs.filter((q) => q.correct).length,
    incorrect: qs.filter((q) => !q.correct && !q.unanswered).length,
    unanswered,
    paceMs,
    slowest,
    quickCorrect,
    quickWrong,
    patterns,
    savings,
  };
}
