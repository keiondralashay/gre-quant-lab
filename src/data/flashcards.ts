// Flashcards are derived from the vault, formulas, clue phrases, and lessons,
// so they stay in sync with the content they summarize.
import { PHRASES } from './clues';
import { FORMULAS, renderFormula } from './formulas';
import { LESSONS } from './library';
import { href } from './links';
import { SHORTCUTS } from './shortcuts';

export type Deck = 'shortcut' | 'formula' | 'clue' | 'lesson';

export interface Flashcard {
  id: string;
  deck: Deck;
  front: string;
  back: string;
  practice: { href: string; label: string };
}

export const DECK_LABELS: Record<Deck, string> = {
  shortcut: 'Shortcuts',
  formula: 'Formulas',
  clue: 'Clue words',
  lesson: 'Takeaways',
};

export const FLASHCARDS: Flashcard[] = [
  ...SHORTCUTS.map((s) => ({
    id: `shortcut:${s.id}`,
    deck: 'shortcut' as const,
    front: `When do I use: ${s.name}?`,
    back: `${s.clue} Then: ${s.rule}`,
    practice: { href: href.shortcut(s.id, true), label: 'Practice this shortcut' },
  })),
  ...FORMULAS.map((f) => ({
    id: `formula:${f.id}`,
    deck: 'formula' as const,
    front: `Write the formula: ${f.name}`,
    back: `$${renderFormula(f, null)}$`,
    practice: { href: href.formula(f.id), label: 'Test my understanding' },
  })),
  ...PHRASES.map((p) => ({
    id: `clue:${p.id}`,
    deck: 'clue' as const,
    front: `What does “${p.phrase}” mean mathematically?`,
    back: `${p.options[p.answer]}. ${p.explain}`,
    practice: { href: '#/clues', label: 'Practice clue words' },
  })),
  ...LESSONS.map((l) => ({
    id: `lesson:${l.id}`,
    deck: 'lesson' as const,
    front: `${l.title}: what is the one rule to remember?`,
    back: l.takeaway,
    practice: { href: href.lesson(l.id, 'try'), label: 'Try the lesson check' },
  })),
];

/**
 * Review order: cards missed more than known come first (most-missed first),
 * then unseen cards, then known cards with the shortest streak and oldest review.
 */
export function prioritize(
  cards: Flashcard[],
  state: Record<string, { knew: number; missed: number; streak: number; lastSeen: number }> = {},
): Flashcard[] {
  const score = (c: Flashcard) => {
    const s = state[c.id];
    if (!s) return { tier: 1, a: 0, b: 0 };
    if (s.missed > 0 && s.streak < 2) return { tier: 0, a: -(s.missed - s.knew), b: s.lastSeen };
    return { tier: 2, a: s.streak, b: s.lastSeen };
  };
  return [...cards].sort((x, y) => {
    const a = score(x);
    const b = score(y);
    return a.tier - b.tier || a.a - b.a || a.b - b.b;
  });
}
