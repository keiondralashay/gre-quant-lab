import { QUESTIONS } from '../data/questions';
import { CATEGORIES, STRATEGIES } from '../data/taxonomy';
import type { Area } from '../data/types';

describe('question bank integrity', () => {
  it('has at least 30 questions across all four content areas', () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(30);
    const areas = new Set<Area>(QUESTIONS.map((q) => q.area));
    expect([...areas].sort()).toEqual(['algebra', 'arithmetic', 'data', 'geometry']);
  });

  it('covers every recognition category and all four formats', () => {
    const cats = new Set(QUESTIONS.map((q) => q.category));
    for (const c of Object.keys(CATEGORIES)) expect(cats.has(c as never), `category ${c}`).toBe(true);
    expect(new Set(QUESTIONS.map((q) => q.format))).toEqual(new Set(['mc-single', 'mc-multi', 'numeric', 'qc']));
  });

  it('has unique ids', () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const q of QUESTIONS) {
    describe(q.id, () => {
      it('format matches answer kind and required fields', () => {
        expect(q.answer.kind).toBe(q.format);
        if (q.format === 'mc-single' || q.format === 'mc-multi') {
          expect(q.choices && q.choices.length >= 4).toBe(true);
          expect(new Set(q.choices).size, 'choices must be distinct').toBe(q.choices!.length);
        }
        if (q.answer.kind === 'mc-single') {
          expect(q.answer.correct).toBeGreaterThanOrEqual(0);
          expect(q.answer.correct).toBeLessThan(q.choices!.length);
        }
        if (q.answer.kind === 'mc-multi') {
          expect(q.answer.correct.length).toBeGreaterThanOrEqual(1);
          expect(new Set(q.answer.correct).size).toBe(q.answer.correct.length);
          for (const i of q.answer.correct) expect(i).toBeLessThan(q.choices!.length);
          expect(q.prompt.toLowerCase()).toMatch(/indicate all|select all/);
        }
        if (q.answer.kind === 'numeric') {
          expect(q.answer.den).not.toBe(0);
          expect(Number.isInteger(q.answer.num) && Number.isInteger(q.answer.den)).toBe(true);
        }
        if (q.format === 'qc') {
          expect(q.quantityA).toBeTruthy();
          expect(q.quantityB).toBeTruthy();
          expect(q.choices).toBeUndefined();
        }
      });

      it('primary category is not repeated as a secondary concept', () => {
        expect(q.secondary).not.toContain(q.category);
      });

      it('first-step exercise is well-formed', () => {
        expect(q.firstStep.options.length).toBeGreaterThanOrEqual(3);
        expect(new Set(q.firstStep.options).size).toBe(q.firstStep.options.length);
        expect(q.firstStep.correct).toBeGreaterThanOrEqual(0);
        expect(q.firstStep.correct).toBeLessThan(q.firstStep.options.length);
      });

      it('method options have exactly one "best" strategy and known ids', () => {
        const best = q.method.options.filter((o) => o.verdict === 'best');
        expect(best.length).toBe(1);
        const ids = q.method.options.map((o) => o.strategy);
        expect(new Set(ids).size, 'strategy options must be distinct').toBe(ids.length);
        for (const id of ids) expect(STRATEGIES[id]).toBeDefined();
      });

      it('decode data is well-formed', () => {
        expect(q.decode.askingCorrect).toBeLessThan(q.decode.askingOptions.length);
        expect(new Set(q.decode.askingOptions).size).toBe(q.decode.askingOptions.length);
        expect(q.decode.given.length).toBeGreaterThan(0);
      });

      it('explanation follows TYPE / CLUE / DECODE / STRATEGY / FAST / REMEMBER', () => {
        const s = q.solution;
        for (const f of [s.type, s.clue, s.decode, s.strategy, s.remember, s.answerText]) expect(f.trim().length).toBeGreaterThan(0);
        expect(s.fast.length).toBeGreaterThan(0);
        // Either a long method exists, or the content explicitly says the standard method is already fastest.
        expect(Boolean(s.long?.length) || s.longIsFastest === true).toBe(true);
        expect(q.hints.length).toBeGreaterThan(0);
        expect(q.recognition.clues.length).toBeGreaterThan(0);
      });

      it('has balanced math delimiters', () => {
        const texts = [q.prompt, q.quantityA ?? '', q.quantityB ?? '', ...(q.choices ?? []), ...q.solution.fast, ...(q.solution.long ?? [])];
        for (const t of texts) {
          const unescaped = t.replace(/\\\$/g, '');
          expect((unescaped.match(/\$/g) ?? []).length % 2, `unbalanced $ in: ${t}`).toBe(0);
        }
      });
    });
  }
});
