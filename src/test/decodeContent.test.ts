import { DECODE_LESSONS } from '../data/decodeLessons';
import { collect, formatEquation, rearrangedQuadratic, standardQuadratic } from '../lib/generators';
import { parseRational } from '../lib/grading';
import { seeded } from '../lib/random';

const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const sorted = (xs: number[]) => [...xs].sort((a, b) => a - b);

/** Independent computations for every numeric decode field: lesson:exercise:field → value. */
const EXPECTED: Record<string, number> = {
  'quadratic:quad-1:a': 3,
  'quadratic:quad-1:b': -11,
  'quadratic:quad-1:c': 6,
  // 3x² + 6 = 11x  →  left − right
  ...(() => {
    const k = collect({ left: [{ coef: 3, power: 2 }, { coef: 6, power: 0 }], right: [{ coef: 11, power: 1 }] });
    return { 'quadratic:quad-rearrange:a': k.a, 'quadratic:quad-rearrange:b': k.b, 'quadratic:quad-rearrange:c': k.c };
  })(),
  'linear:lin-1:coef': 5,
  'linear:lin-1:const': -8,
  'linear:lin-1:x': (27 + 8) / 5,
  'slope-intercept:slope-1:m': 3 / 4,
  'slope-intercept:slope-1:b': -6,
  'slope-intercept:slope-2:m': 6 / 2,
  'slope-intercept:slope-2:b': 8 / 2,
  'exponents:exp-1:base1': -2,
  'exponents:exp-1:val1': (-2) ** 4,
  'exponents:exp-1:base2': 2,
  'exponents:exp-1:val2': -(2 ** 4),
  'exponents:exp-2:v': 3 ** -2,
  'fractions:frac-1:simp': 20 / 35,
  'fractions:frac-1:recip': 7 / 4,
  'geometry:geo-1:r': 14 / 2,
  'geometry:geo-1:area': (14 / 2) ** 2,
  'geometry:geo-1:circ': 2 * (14 / 2),
  'geometry:geo-2:A': 0.5 * 10 * 6,
  'ratios:ratio-1:parts': 2 + 7,
  'ratios:ratio-1:cats': (54 / 9) * 2,
  'ratios:ratio-1:dc': 7 / 2,
  'probability:prob-1:fav': Array.from({ length: 20 }, (_, i) => i + 1).filter((n) => n % 3 === 0).length,
  'probability:prob-1:tot': 20,
  'probability:prob-1:p': 6 / 20,
  'statistics:stat-1:n': 5,
  'statistics:stat-1:mean': mean([4, 9, 2, 9, 6]),
  'statistics:stat-1:median': sorted([4, 9, 2, 9, 6])[2],
  'statistics:stat-1:mode': 9,
  'statistics:stat-1:range': 9 - 2,
};

describe('decode lessons', () => {
  const numericFields = DECODE_LESSONS.flatMap((l) => l.exercises.flatMap((e) => e.fields.filter((f) => f.kind === 'number').map((f) => ({ key: `${l.id}:${e.id}:${f.id}`, f }))));

  it('every numeric field has an independent check', () => {
    expect(numericFields.map((x) => x.key).filter((k) => !(k in EXPECTED))).toEqual([]);
  });

  for (const { key, f } of numericFields) {
    it(`${key} is correct`, () => {
      if (f.kind !== 'number') return;
      const r = parseRational(f.answer);
      expect(r).not.toBeNull();
      expect(Math.abs(r!.num / r!.den - EXPECTED[key])).toBeLessThan(1e-9);
    });
  }

  it('choice fields point at a valid option', () => {
    for (const l of DECODE_LESSONS)
      for (const e of l.exercises)
        for (const f of e.fields)
          if (f.kind === 'choice') {
            expect(f.answer).toBeGreaterThanOrEqual(0);
            expect(f.answer).toBeLessThan(f.options.length);
          }
  });

  it('covers the required decoding topics', () => {
    expect(DECODE_LESSONS.map((l) => l.id).sort()).toEqual(
      ['exponents', 'fractions', 'geometry', 'inequalities', 'linear', 'probability', 'quadratic', 'ratios', 'slope-intercept', 'statistics'].sort(),
    );
  });
});

describe('quadratic generators', () => {
  it('rearranged equations collapse to the stated standard-form coefficients', () => {
    const rand = seeded(42);
    for (let i = 0; i < 1000; i++) {
      for (const eq of [standardQuadratic(rand), rearrangedQuadratic(rand)]) {
        expect(collect(eq)).toEqual({ a: eq.a, b: eq.b, c: eq.c });
        expect(eq.a).toBeGreaterThan(0);
        expect(eq.b).not.toBe(0);
        expect(eq.c).not.toBe(0);
        const tex = formatEquation(eq);
        expect(tex).not.toMatch(/\+ -|- -|(^|[^0-9])1x|\+ 0/);
      }
    }
  });

  it('formats the example from the lesson exactly', () => {
    expect(formatEquation({ left: [{ coef: 3, power: 2 }, { coef: 6, power: 0 }], right: [{ coef: 11, power: 1 }] })).toBe('3x^2 + 6 = 11x');
    expect(formatEquation({ left: [{ coef: 1, power: 2 }, { coef: -9, power: 1 }, { coef: 20, power: 0 }], right: [] })).toBe('x^2 - 9x + 20 = 0');
  });
});
