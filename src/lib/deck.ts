import { useCallback, useMemo, useState } from 'react';
import { QUESTIONS } from '../data/questions';
import type { Area, Category, Question } from '../data/types';
import { shuffle } from './random';

export interface DeckFilter {
  area: Area | 'all';
  category: Category | 'all';
  difficulty: 1 | 2 | 3 | 'all';
}

export const ALL_FILTER: DeckFilter = { area: 'all', category: 'all', difficulty: 'all' };

export function matches(q: Question, f: DeckFilter) {
  return (
    (f.area === 'all' || q.area === f.area) &&
    (f.category === 'all' || q.category === f.category || q.secondary.includes(f.category)) &&
    (f.difficulty === 'all' || q.difficulty === f.difficulty)
  );
}

/** Another question on the same concept (primary first, then secondary, then same area). */
export function similarTo(q: Question, pool: Question[] = QUESTIONS, rand: () => number = Math.random): Question | null {
  const others = pool.filter((o) => o.id !== q.id);
  const tiers = [
    others.filter((o) => o.category === q.category),
    others.filter((o) => o.secondary.includes(q.category) || q.secondary.includes(o.category)),
    others.filter((o) => o.area === q.area),
  ];
  for (const t of tiers) if (t.length) return t[Math.floor(rand() * t.length)];
  return null;
}

/** A shuffled, mixed-topic sequence of questions that reshuffles when exhausted. */
export function useDeck(filter: DeckFilter, extra: (q: Question) => boolean = () => true) {
  const pool = useMemo(() => QUESTIONS.filter((q) => matches(q, filter) && extra(q)), [filter.area, filter.category, filter.difficulty]); // eslint-disable-line react-hooks/exhaustive-deps
  const [state, setState] = useState(() => ({ key: '', order: [] as string[], pos: 0, override: null as string | null }));
  const key = pool.map((q) => q.id).join('|');

  let { order, pos, override } = state;
  if (state.key !== key) {
    order = shuffle(pool.map((q) => q.id));
    pos = 0;
    override = null;
    // Sync derived state during render (safe: deterministic on key change).
    setState({ key, order, pos, override });
  }

  const currentId = override ?? order[pos];
  const current = pool.find((q) => q.id === currentId) ?? QUESTIONS.find((q) => q.id === currentId) ?? null;

  const next = useCallback(() => {
    setState((s) => {
      if (s.pos + 1 >= s.order.length) {
        const last = s.order[s.pos];
        let order = shuffle(s.order);
        if (order.length > 1 && order[0] === last) order = [...order.slice(1), order[0]];
        return { ...s, order, pos: 0, override: null };
      }
      return { ...s, pos: s.pos + 1, override: null };
    });
  }, []);

  const show = useCallback((id: string) => setState((s) => ({ ...s, override: id })), []);

  return { current, next, show, size: pool.length, position: state.key === key ? pos + 1 : 1 };
}
