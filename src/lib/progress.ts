import { useSyncExternalStore } from 'react';
import type { Area, Category } from '../data/types';

/**
 * Persistent study record. Everything shown on the dashboard is derived from
 * these attempts — there is no placeholder data. Stored under a namespaced key
 * so a future Verbal section can share the same origin without collisions.
 */
export const STORAGE_KEY = 'gre.quant.progress.v1';

export type AttemptKind =
  | 'recognition'
  | 'first-step'
  | 'strategy'
  | 'answer'
  | 'decode-step'
  | 'decode-exercise'
  // Phase 2
  | 'lesson-check'
  | 'shortcut-drill'
  | 'formula-check'
  | 'clue';
export type AttemptResult = 'correct' | 'partial' | 'incorrect';

export interface Attempt {
  kind: AttemptKind;
  /** Question id, or lesson/exercise id for decode exercises. */
  ref: string;
  result: AttemptResult;
  category?: Category;
  area?: Area;
  difficulty?: 1 | 2 | 3;
  /** Time from display to submission, in ms. */
  ms?: number;
  hintsUsed?: number;
  /** What the learner chose (category id, strategy id, choice index...). */
  detail?: string;
  ts: number;
}

/** Flashcard review state (Phase 2). */
export interface CardState {
  knew: number;
  missed: number;
  /** Consecutive "I knew this" answers; reset by a miss. */
  streak: number;
  lastSeen: number;
}

export interface ProgressState {
  version: 1;
  attempts: Attempt[];
  // Phase 2 additions are optional so Phase 1 saved data loads unchanged.
  cards?: Record<string, CardState>;
  bookmarks?: string[];
  visitedLessons?: string[];
}

const EMPTY: ProgressState = { version: 1, attempts: [] };
const MAX_ATTEMPTS = 5000;

function load(): ProgressState {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as ProgressState;
    if (parsed?.version !== 1 || !Array.isArray(parsed.attempts)) return EMPTY;
    return parsed;
  } catch {
    return EMPTY;
  }
}

let state: ProgressState = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable (private mode); progress then lasts for this session only.
  }
}

function emit() {
  for (const l of listeners) l();
}

export function recordAttempt(a: Omit<Attempt, 'ts'>) {
  const attempts = [...state.attempts, { ...a, ts: Date.now() }];
  state = { ...state, attempts: attempts.slice(-MAX_ATTEMPTS) };
  persist();
  emit();
}

function update(patch: Partial<ProgressState>) {
  state = { ...state, ...patch };
  persist();
  emit();
}

export function recordCard(cardId: string, knew: boolean) {
  const prev = state.cards?.[cardId] ?? { knew: 0, missed: 0, streak: 0, lastSeen: 0 };
  const next: CardState = knew
    ? { ...prev, knew: prev.knew + 1, streak: prev.streak + 1, lastSeen: Date.now() }
    : { ...prev, missed: prev.missed + 1, streak: 0, lastSeen: Date.now() };
  update({ cards: { ...state.cards, [cardId]: next } });
}

export function toggleBookmark(id: string) {
  const b = state.bookmarks ?? [];
  update({ bookmarks: b.includes(id) ? b.filter((x) => x !== id) : [...b, id] });
}

export function markLessonVisited(id: string) {
  const v = state.visitedLessons ?? [];
  if (!v.includes(id)) update({ visitedLessons: [...v, id] });
}

export function resetProgress() {
  state = EMPTY;
  persist();
  emit();
}

export function getProgress(): ProgressState {
  return state;
}

/** Test helper: reload from storage. */
export function reloadProgress() {
  state = load();
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, getProgress, getProgress);
}

// ---------- Derived statistics ----------

export interface Tally {
  correct: number;
  partial: number;
  total: number;
}

export function tally(attempts: Attempt[]): Tally {
  let correct = 0;
  let partial = 0;
  for (const a of attempts) {
    if (a.result === 'correct') correct++;
    else if (a.result === 'partial') partial++;
  }
  return { correct, partial, total: attempts.length };
}

export function pct(t: Tally): number | null {
  return t.total ? Math.round((t.correct / t.total) * 100) : null;
}

export interface Summary {
  byKind: Record<AttemptKind, Tally>;
  byCategory: Partial<Record<Category, Tally>>;
  byDifficulty: Record<1 | 2 | 3, Tally>;
  avgSolveMs: number | null;
  answersWithHints: number;
  questionsSeen: number;
}

export function summarize(attempts: Attempt[]): Summary {
  const kinds: AttemptKind[] = ['recognition', 'first-step', 'strategy', 'answer', 'decode-step', 'decode-exercise', 'lesson-check', 'shortcut-drill', 'formula-check', 'clue'];
  const byKind = Object.fromEntries(kinds.map((k) => [k, tally(attempts.filter((a) => a.kind === k))])) as Record<AttemptKind, Tally>;

  const byCategory: Partial<Record<Category, Tally>> = {};
  const questionAttempts = attempts.filter((a) => a.category && a.kind !== 'decode-exercise' && a.kind !== 'clue');
  for (const a of questionAttempts) {
    const t = (byCategory[a.category!] ??= { correct: 0, partial: 0, total: 0 });
    t.total++;
    if (a.result === 'correct') t.correct++;
    else if (a.result === 'partial') t.partial++;
  }

  const answers = attempts.filter((a) => a.kind === 'answer');
  const byDifficulty = {
    1: tally(answers.filter((a) => a.difficulty === 1)),
    2: tally(answers.filter((a) => a.difficulty === 2)),
    3: tally(answers.filter((a) => a.difficulty === 3)),
  };
  const timed = answers.filter((a) => typeof a.ms === 'number');
  const avgSolveMs = timed.length ? timed.reduce((s, a) => s + a.ms!, 0) / timed.length : null;

  return {
    byKind,
    byCategory,
    byDifficulty,
    avgSolveMs,
    answersWithHints: answers.filter((a) => (a.hintsUsed ?? 0) > 0).length,
    questionsSeen: new Set(questionAttempts.map((a) => a.ref)).size,
  };
}

/** Categories with at least `minAttempts` attempts, weakest first. */
export function weakestCategories(summary: Summary, minAttempts = 3): { category: Category; accuracy: number; total: number }[] {
  return (Object.entries(summary.byCategory) as [Category, Tally][])
    .filter(([, t]) => t.total >= minAttempts)
    .map(([category, t]) => ({ category, accuracy: t.correct / t.total, total: t.total }))
    .sort((a, b) => a.accuracy - b.accuracy);
}
