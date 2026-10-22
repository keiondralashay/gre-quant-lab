/**
 * Phase 2 content verification: every numeric answer in lesson checks, shortcut
 * drills, and formula tests is recomputed independently here; clue translations
 * are checked by evaluating each option; and every cross-link must resolve.
 */
import katex from 'katex';
import { PHRASES, REVERSES, TRANSLATIONS, TRAPS } from '../data/clues';
import type { DecodeExercise } from '../data/decodeLessons';
import { FLASHCARDS, prioritize } from '../data/flashcards';
import { FORMULAS, renderFormula } from '../data/formulas';
import { LESSONS, LESSON_BY_ID } from '../data/library';
import { CATEGORY_LESSON, DECODE_LESSON_FORMULA, DECODE_LESSON_LIBRARY, QUESTION_LESSONS, QUESTION_SHORTCUT, questionsForLesson } from '../data/links';
import { QUESTIONS } from '../data/questions';
import { SHORTCUTS, SHORTCUT_BY_ID } from '../data/shortcuts';
import { CATEGORY_IDS } from '../data/taxonomy';
import { DECODE_LESSONS } from '../data/decodeLessons';
import { FORMULA_BY_ID } from '../data/formulas';
import { parseRational } from '../lib/grading';

const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
const range = (a: number, b: number, step = 1) => {
  const out: number[] = [];
  for (let x = a; x <= b + 1e-9; x += step) out.push(Math.round(x * 1e6) / 1e6);
  return out;
};
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
const lcm = (a: number, b: number) => (a * b) / gcd(a, b);
const divisors = (n: number) => range(1, n).filter((d) => n % d === 0);
const isPrime = (n: number) => n > 1 && divisors(n).length === 2;
const distinctPrimes = (n: number) => divisors(n).filter(isPrime).length;
const isSquare = (n: number) => Number.isInteger(Math.sqrt(n));
const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
const C = (n: number, k: number) => fact(n) / (fact(k) * fact(n - k));
const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const sd = (xs: number[]) => Math.sqrt(mean(xs.map((x) => (x - mean(xs)) ** 2)));
const sorted = (xs: number[]) => [...xs].sort((a, b) => a - b);
const median = (xs: number[]) => {
  const s = sorted(xs);
  const m = s.length / 2;
  return s.length % 2 ? s[Math.floor(m)] : (s[m - 1] + s[m]) / 2;
};
const solve = (f: (x: number) => number, lo = -200, hi = 200, step = 0.25) => {
  const xs = range(lo, hi, step).filter((x) => near(f(x), 0));
  if (xs.length !== 1) throw new Error(`expected one solution, got ${xs}`);
  return xs[0];
};
const modpow = (b: number, e: number, m: number) => {
  let r = 1;
  for (let i = 0; i < e; i++) r = (r * b) % m;
  return r;
};
const distinctPerms = (s: string) => {
  const set = new Set<string>();
  const go = (rest: string, acc: string) => {
    if (!rest) set.add(acc);
    for (let i = 0; i < rest.length; i++) go(rest.slice(0, i) + rest.slice(i + 1), acc + rest[i]);
  };
  go(s, '');
  return set.size;
};
const unique = <T,>(xs: T[]) => {
  if (new Set(xs).size !== 1) throw new Error(`not unique: ${xs}`);
  return xs[0];
};

// ---------- Lesson quick checks ----------
const LESSON_EXPECTED: Record<string, number> = {
  'integers:value:v': (-2) ** 3 * (-1) ** 10,
  'number-properties:primes:count': range(1, 29).filter(isPrime).length,
  'number-properties:primes:sum': range(1, 10).filter(isPrime).slice(0, 2).reduce((a, b) => a + b),
  'fractions:ops:add': 1 / 4 + 2 / 3,
  'fractions:ops:div': 3 / 5 / (9 / 10),
  'decimals:dec:frac': 0.375,
  'decimals:dec:round': Math.round(4.2861 * 100) / 100,
  'decimals:dec:mult': 0.3 * 0.02,
  'percentages:pct:a': (30 / 120) * 100,
  'percentages:pct:b': 0.04 * 75,
  'percentages:pct:c': 45 / 0.6,
  'percent-change:chg:up': ((75 - 60) / 60) * 100,
  'percent-change:chg:down': ((75 - 60) / 75) * 100,
  'percent-change:chg:chain': (1.1 * 1.1 - 1) * 100,
  'ratios:r1:j': (35 / 7) * 4,
  'ratios:r1:frac': 3 / 7,
  'proportions:p1:a': solve((x) => x / 12 - 5 / 8),
  'proportions:p1:b': (4 * 6) / 8,
  'divisibility:d1:digit': unique(range(0, 9).filter((d) => (400 + 10 * d + 7) % 9 === 0)),
  'prime-factorization:pf:distinct': distinctPrimes(180),
  'prime-factorization:pf:factors': divisors(180).length,
  'prime-factorization:pf:square': range(1, 200).find((k) => isSquare(180 * k))!,
  'gcf-lcm:gl:g': gcd(24, 40),
  'gcf-lcm:gl:l': lcm(24, 40),
  'remainders:rem:a': 100 % 7,
  'remainders:rem:b': unique(range(1, 600).filter((n) => n % 6 === 5).map((n) => (2 * n) % 6)),
  'remainders:rem:c': range(2, 500).find((n) => n % 2 === 1 && n % 3 === 1 && n % 4 === 1)!,
  'exponents:pw:a': 2 ** -3,
  'exponents:pw:b': (-1) ** 99 + (-1) ** 100,
  'exponents:pw:c': (2 / 3) ** 2,
  'roots:rt:a': Math.sqrt(50) / Math.sqrt(2),
  'roots:rt:b': Math.sqrt(3) * Math.sqrt(12),
  'roots:rt:c': Math.floor(Math.sqrt(90)),
  'absolute-value:abs:sum': range(-50, 50, 0.5).filter((x) => near(Math.abs(2 * x + 1), 7)).reduce((a, b) => a + b, 0),
  'absolute-value:abs:count': range(-10, 10).filter((x) => Math.abs(x) < 3).length,
  'rates:rt:a': (4.5 / 6) * 10,
  'rates:rt:b': (2 / 15) * 60,
  'distance-rate-time:drt:a': 300 / (70 + 50),
  'distance-rate-time:drt:b': 16 * (45 / 60),
  'work:wk:a': 1 / (1 / 4 + 1 / 12),
  'work:wk:b': 1 / (1 / 2 - 1 / 6),
  'patterns:seq:a': 5 + 19 * 3,
  'patterns:seq:b': range(15, 75).length,
  'patterns:seq:c': modpow(3, 20, 10),
  'expressions:ex:a': ((x: number) => 4 * (x + 3) - 2 * (3 * x - 1))(1) - ((x: number) => 4 * (x + 3) - 2 * (3 * x - 1))(0),
  'expressions:ex:b': ((x: number) => 4 * (x + 3) - 2 * (3 * x - 1))(0),
  'linear-equations:le:a': solve((x) => 7 - 2 * x - (3 * x + 22)),
  'linear-equations:le:b': solve((x) => (x - 1) / 5 - (x + 2) / 8),
  'systems:sys:a': solve((a) => 2 * a + (a - 2) - 13),
  'systems:sys:b': solve((a) => 2 * a + (a - 2) - 13) - 2,
  'inequalities:iq:max': Math.max(...range(-100, 100).filter((x) => 5 - 3 * x >= 20)),
  'factoring:fc:d': (() => {
    const x = (9 + 3) / 2;
    const y = (9 - 3) / 2;
    return x * x - y * y;
  })(),
  'factoring:fc:sq': 81,
  'quadratics:qd:big': Math.max(...range(-50, 50).filter((x) => x * x - 5 * x - 24 === 0)),
  'quadratics:qd:small': Math.min(...range(-50, 50).filter((x) => x * x - 5 * x - 24 === 0)),
  'quadratics:qd:sum': range(-50, 50).filter((x) => x * x - 5 * x - 24 === 0).reduce((a, b) => a + b, 0),
  'quadratic-formula:qf:disc': 36 - 4 * 7,
  'quadratic-formula:qf:n': 2,
  'quadratic-formula:qf:sum': (6 + Math.sqrt(8)) / 2 + (6 - Math.sqrt(8)) / 2,
  'exponent-rules:er:a': Math.round(Math.log((5 ** 7 * 5 ** -2) / 5 ** 3) / Math.log(5)),
  'exponent-rules:er:b': Math.log(16) / Math.log(8),
  'exponent-rules:er:c': Math.round(Math.log(3 * 3 ** 10) / Math.log(3)),
  'algebraic-fractions:af:val': (2 * 25 - 8) / (5 - 2),
  'functions:fn:a': 3 * -2 - 4,
  'functions:fn:b': 3 ** 2 - 5,
  'functions:fn:c': ((f: (x: number) => number) => f(f(2)))((x) => 3 * x - 4),
  'coordinate-plane:cp:d': Math.hypot(4 - -2, -5 - 3),
  'coordinate-plane:cp:mx': (-2 + 4) / 2,
  'coordinate-plane:cp:my': (3 + -5) / 2,
  'slope:sl:m': (() => {
    const y = (x: number) => (10 - 2 * x) / 5;
    return y(1) - y(0);
  })(),
  'slope:sl:b': (10 - 0) / 5,
  'slope:sl:perp': -1 / (-2 / 5),
  'word-problems:wp:son': solve((s) => 3 * s + 12 - 2 * (s + 12), 0, 100),
  'word-problems:wp:mom': 3 * solve((s) => 3 * s + 12 - 2 * (s + 12), 0, 100),
  'lines-angles:la:comp': 90 - 38,
  'lines-angles:la:x': solve((x) => x + 2 * x + 3 * x - 180, 0, 180),
  'triangles:tr:max': Math.max(...range(1, 30).filter((s) => s < 4 + 10 && s > 10 - 4)),
  'triangles:tr:min': Math.min(...range(1, 30).filter((s) => s < 4 + 10 && s > 10 - 4)),
  'triangles:tr:ext': 180 - (180 - 50 - 60),
  'right-triangles:rt:a': Math.hypot(9, 12),
  'right-triangles:rt:b': Math.sqrt(17 ** 2 - 8 ** 2),
  'special-right-triangles:sp:a': (7 * Math.SQRT2) / Math.SQRT2,
  'special-right-triangles:sp:b': (4 * Math.sqrt(3)) / Math.sqrt(3),
  'special-right-triangles:sp:c': 2 * 4,
  'special-right-triangles:sp:d': Math.sqrt(6 ** 2 - 3 ** 2) / Math.sqrt(3),
  'similarity:sm:a': 5 * (12 / 3),
  'similarity:sm:b': (1 / 4) ** 2,
  'circles:ci:r': Math.sqrt(64),
  'circles:ci:c': 2 * Math.sqrt(64),
  'circles:ci:arc': (45 / 360) * 2 * Math.sqrt(64),
  'quadrilaterals:qu:a': 9 * (30 / 2 - 9),
  'quadrilaterals:qu:b': 360 - 80 - 95 - 105,
  'polygons:po:a': (8 - 2) * 180,
  'polygons:po:b': range(3, 50).find((n) => near(((n - 2) * 180) / n, 140))!,
  'perimeter-area:pa:a': 4 * Math.sqrt(49),
  'perimeter-area:pa:b': (3 * 5 * (3 * 2)) / (5 * 2),
  'perimeter-area:pa:c': (2 * 42) / 12,
  'volume-surface-area:vs:a': Math.sqrt(54 / 6) ** 3,
  'volume-surface-area:vs:b': 2 * (2 * 3 + 2 * 4 + 3 * 4),
  'volume-surface-area:vs:c': 2 ** 2 * 5,
  'coordinate-geometry-shapes:cg:a': (5 - -1) * (6 - 2),
  'coordinate-geometry-shapes:cg:p': 2 * (5 - -1 + (6 - 2)),
  'mean:mn:a': mean([12, 15, 18, 21, 24]),
  'mean:mn:b': (6 * 10 - 25) / 5,
  'median-mode-range:mm:med': median([4, 1, 7, 4, 9, 2, 4, 8]),
  'median-mode-range:mm:mode': 4,
  'median-mode-range:mm:range': 9 - 1,
  'weighted-average:wa:a': (2 * 9 + 3 * 14) / 5,
  'weighted-average:wa:b': solve((b) => (30 * 50 + 70 * b) / (30 + b) - 55, 0, 100),
  'standard-deviation:sd:up': 50 + 2 * 6,
  'standard-deviation:sd:scale': sd([44, 56].map((v) => 3 * v)),
  'standard-deviation:sd:shift': sd([44, 56].map((v) => v - 5)),
  'probability:pr:a': 1 / 36,
  'probability:pr:b': range(1, 10).filter((n) => n % 2 === 0 || n > 7).length / 10,
  'probability:pr:c': 0.7 * 0.7,
  'counting:ct:a': 4 * 3 * 2,
  'counting:ct:b': distinctPerms('WORK'),
  'counting:ct:c': 5 * 4,
  'permutations:pm:a': fact(5),
  'permutations:pm:b': distinctPerms('LEVEL'),
  'combinations:cb:a': C(8, 2),
  'combinations:cb:b': C(10, 8),
  'combinations:cb:c': C(5, 2) * C(4, 1),
  'sets-venn:vn:either': 22 + 18 - 7,
  'sets-venn:vn:neither': 40 - (22 + 18 - 7),
  'sets-venn:vn:one': 22 + 18 - 2 * 7,
  'tables:tb:a': ((60 - 45) / 45) * 100,
  'tables:tb:b': (45 + 60 + 54) * 1000,
  'graphs:gr:a': (72 / 360) * 100,
  'graphs:gr:b': ((52 - 40) / 40) * 100,
  'data-interpretation:di:a': 800 * 0.45 * 0.3,
  'data-interpretation:di:b': 45 * 0.3,
};

// ---------- Shortcut drills ----------
const SHORTCUT_EXPECTED: Record<string, number> = {
  'difference-of-squares:a': 103 ** 2 - 97 ** 2,
  'difference-of-squares:b': 60 / 5,
  'factor-a1:big': Math.max(...range(-50, 50).filter((x) => x * x + 3 * x - 40 === 0)),
  'factor-a1:small': Math.min(...range(-50, 50).filter((x) => x * x + 3 * x - 40 === 0)),
  'factor-a-not-1:pos': range(-30, 30).map((p) => p / 3).filter((x) => near(3 * x * x - 10 * x - 8, 0) && x > 0)[0],
  'factor-a-not-1:neg': range(-30, 30).map((p) => p / 3).filter((x) => near(3 * x * x - 10 * x - 8, 0) && x < 0)[0],
  'root-relationships:sum': (7 + Math.sqrt(37)) / 2 + (7 - Math.sqrt(37)) / 2,
  'root-relationships:prod': ((7 + Math.sqrt(37)) / 2) * ((7 - Math.sqrt(37)) / 2),
  'elimination:x': solve((x) => 4 * x - (8 - 2 * x) - 10),
  'elimination:y': 8 - 2 * solve((x) => 4 * x - (8 - 2 * x) - 10),
  'divisibility-rules:d': unique(range(0, 9).filter((d) => (520 + d) % 12 === 0)),
  'divisibility-rules:r': 1234567 % 9,
  'prime-factorization:f': divisors(96).length,
  'prime-factorization:k': range(1, 200).find((k) => isSquare(96 * k))!,
  'gcf-lcm:l': lcm(14, 21),
  'gcf-lcm:g': unique(
    range(1, 360)
      .filter((a) => 360 % a === 0)
      .filter((a) => lcm(a, 360 / a) === 60)
      .map((a) => gcd(a, 360 / a)),
  ),
  'remainder-patterns:u': modpow(9, 45, 10),
  'remainder-patterns:r': modpow(5, 10, 3),
  'exponent-rules:a': Math.round(Math.log(27 ** 2 / 9 ** 3) / Math.log(3)),
  'exponent-rules:b': solve((x) => 2 ** (x + 1) - 32, -10, 10),
  'simplify-before-multiplying:a': (15 / 28) * (14 / 45),
  'simplify-before-multiplying:b': (48 * 25) / (75 * 16),
  'compare-fractions:p1': 5 * 13,
  'compare-fractions:p2': 8 * 8,
  'percent-change:a': 54000 / 1.2,
  'percent-change:b': (0.9 * 0.9 - 1) * 100,
  'ratios-proportions:a': (66 / 11) * 9,
  'ratios-proportions:b': (3 / 20) * 50,
  'average-total:a': (8 * 15 + 33) / 9,
  'average-total:b': solve((x) => (x + 2 * x + 9) / 3 - 7),
  'weighted-average:a': 0.4 * 60 + 0.6 * 80,
  'weighted-average:b': (1 * 10 + 3 * 30) / 4,
  'probability-shortcuts:a': 1 - 0.5 ** 4,
  'probability-shortcuts:b': 0.5 + 0.4 - 0.5 * 0.4,
  'counting-strategies:a': 10 * 9,
  'counting-strategies:b': C(10, 2),
  'pythagorean-triples:a': Math.hypot(10, 24),
  'pythagorean-triples:b': Math.sqrt(34 ** 2 - 16 ** 2),
  'tri-45-45-90:a': (9 * Math.SQRT2) / Math.SQRT2,
  'tri-45-45-90:b': 8 ** 2 / 2,
  'tri-30-60-90:a': 14 / 2,
  'tri-30-60-90:b': ((Math.sqrt(3) / 4) * 10 ** 2) / Math.sqrt(3),
  'circle-formulas:a': 2 * Math.sqrt(100),
  'circle-formulas:b': (60 / 360) * 6 ** 2,
  'area-relationships:a': 2 ** 3,
  'area-relationships:b': (6 / 3) ** 2,
  'plug-in-values:target': 40 / (8 / 4),
  'backsolving:a': unique([8, 10, 12, 14].filter((n) => n * (n + 2) === 168)),
};

// ---------- Formula tests ----------
const FORMULA_EXPECTED: Record<string, number> = {
  'quadratic-standard:a': 5,
  'quadratic-standard:b': -1,
  'quadratic-standard:c': -4,
  'quadratic-formula:a': 2,
  'quadratic-formula:b': -3,
  'quadratic-formula:c': -5,
  'quadratic-formula:disc': (-3) ** 2 - 4 * 2 * -5,
  'quadratic-formula:big': Math.max(...range(-10, 10, 0.5).filter((x) => near(2 * x * x - 3 * x - 5, 0))),
  'quadratic-formula:small': Math.min(...range(-10, 10, 0.5).filter((x) => near(2 * x * x - 3 * x - 5, 0))),
  'slope:dy': 7 - -1,
  'slope:dx': 6 - 2,
  'slope:m': (7 - -1) / (6 - 2),
  'slope-intercept:m': ((x: number) => (12 - 6 * x) / 3)(1) - ((x: number) => (12 - 6 * x) / 3)(0),
  'slope-intercept:b': 12 / 3,
  'distance:dx': 4 - 1,
  'distance:dy': 5 - 1,
  'distance:d': Math.hypot(3, 4),
  'distance-rate-time:r': 210 / 3.5,
  'distance-rate-time:t': 330 / (210 / 3.5),
  'percent-change:chg': 92 - 80,
  'percent-change:pct': ((92 - 80) / 80) * 100,
  'simple-interest:I': 2000 * 0.05 * 3,
  'simple-interest:tot': 2000 + 2000 * 0.05 * 3,
  'compound-interest:yr': 1000 * 1.1 ** 2,
  'compound-interest:semi': 1000 * (1 + 0.1 / 2) ** 2,
  'rectangle-area-perimeter:w': 40 / 2 - 12,
  'rectangle-area-perimeter:A': 12 * (40 / 2 - 12),
  'triangle-area:h': (2 * 36) / 9,
  'trapezoid-area:A': ((7 + 13) / 2) * 4,
  'pythagorean:other': Math.sqrt(13 ** 2 - 5 ** 2),
  'circle-circumference:a': 2 * 4.5,
  'circle-circumference:b': 22,
  'circle-area:a': (10 / 2) ** 2,
  'circle-area:r': Math.sqrt(49),
  'box-volume:V': 3 * 4 * 12,
  'box-volume:diag': Math.sqrt(9 + 16 + 144),
  'cylinder-volume:a': 3 ** 2 * 4,
  'cylinder-volume:h': 50 / 5 ** 2,
  'probability:fav': 3 + 2,
  'probability:tot': 3 + 5 + 2,
  'probability:p': 5 / 10,
  'average:sum': 7 * 12,
  'average:new': (7 * 12 - 26) / 6,
  'weighted-average:m': (12 * 75 + 8 * 90) / 20,
  'ratio:red': (5 / 8) * 64,
  'ratio:blue': (3 / 8) * 64,
  'exponent-rules:base': 2,
  'exponent-rules:exp': Math.log2(2 ** 5 * 2 ** 3),
  'exponent-rules:val': 2 ** 5 * 2 ** 3,
  'permutations:n': 7,
  'permutations:k': 3,
  'permutations:v': fact(7) / fact(4),
  'combinations:n': 9,
  'combinations:k': 4,
  'combinations:v': C(9, 4),
  'work-rate:T': 1 / (1 / 5 + 1 / 20),
};

function numericFields(prefix: (e: DecodeExercise) => string, exercises: DecodeExercise[]) {
  return exercises.flatMap((e) => e.fields.filter((f) => f.kind === 'number').map((f) => ({ key: `${prefix(e)}:${f.id}`, f })));
}

function checkTable(name: string, entries: { key: string; f: { kind: string; answer: unknown } }[], expected: Record<string, number>) {
  describe(name, () => {
    it('every numeric field has an independent check (and no stale checks)', () => {
      expect(entries.map((x) => x.key).filter((k) => !(k in expected))).toEqual([]);
      expect(Object.keys(expected).filter((k) => !entries.some((x) => x.key === k))).toEqual([]);
    });
    for (const { key, f } of entries) {
      it(`${key}`, () => {
        const parsed = parseRational(String(f.answer));
        expect(parsed, `answer "${f.answer}" must be parseable`).not.toBeNull();
        expect(Math.abs(parsed!.num / parsed!.den - expected[key]), `${key}: key ${f.answer} vs computed ${expected[key]}`).toBeLessThan(1e-9);
      });
    }
  });
}

checkTable(
  'lesson quick checks',
  LESSONS.flatMap((l) => numericFields((e) => `${l.id}:${e.id}`, l.tryIt)),
  LESSON_EXPECTED,
);
checkTable(
  'shortcut drills',
  SHORTCUTS.flatMap((s) => numericFields(() => s.id, [s.drill])),
  SHORTCUT_EXPECTED,
);
checkTable(
  'formula tests',
  FORMULAS.flatMap((f) => numericFields(() => f.id, [f.test])),
  FORMULA_EXPECTED,
);

describe('choice fields', () => {
  const all = [...LESSONS.flatMap((l) => l.tryIt), ...SHORTCUTS.map((s) => s.drill), ...FORMULAS.map((f) => f.test)];
  it('point at valid, distinct options', () => {
    for (const e of all)
      for (const f of e.fields)
        if (f.kind === 'choice') {
          expect(f.answer).toBeGreaterThanOrEqual(0);
          expect(f.answer).toBeLessThan(f.options.length);
          expect(new Set(f.options).size).toBe(f.options.length);
        }
  });
  it('exercise and field ids are unique within their containers', () => {
    for (const l of LESSONS) expect(new Set(l.tryIt.map((e) => e.id)).size).toBe(l.tryIt.length);
    for (const e of all) expect(new Set(e.fields.map((f) => f.id)).size).toBe(e.fields.length);
  });
});

describe('topic library structure', () => {
  it('covers all four content areas and the required topics', () => {
    const areas = new Set(LESSONS.map((l) => l.area));
    expect([...areas].sort()).toEqual(['algebra', 'arithmetic', 'data', 'geometry']);
    const required = [
      'integers', 'number-properties', 'fractions', 'decimals', 'percentages', 'ratios', 'proportions', 'divisibility', 'prime-factorization', 'gcf-lcm',
      'remainders', 'exponents', 'roots', 'absolute-value', 'rates', 'distance-rate-time', 'work', 'patterns',
      'expressions', 'linear-equations', 'systems', 'inequalities', 'factoring', 'quadratics', 'quadratic-formula', 'exponent-rules', 'algebraic-fractions',
      'functions', 'coordinate-plane', 'slope', 'word-problems',
      'lines-angles', 'triangles', 'right-triangles', 'special-right-triangles', 'similarity', 'circles', 'quadrilaterals', 'polygons', 'perimeter-area',
      'volume-surface-area', 'coordinate-geometry-shapes',
      'mean', 'median-mode-range', 'weighted-average', 'standard-deviation', 'probability', 'counting', 'permutations', 'combinations', 'sets-venn',
      'tables', 'graphs', 'data-interpretation',
    ];
    expect(required.filter((id) => !LESSON_BY_ID[id])).toEqual([]);
  });

  for (const l of LESSONS) {
    it(`${l.id} has all nine sections`, () => {
      expect(l.what.trim()).not.toBe('');
      expect(l.clues).toHaveLength(3);
      expect(l.decode.length).toBeGreaterThan(0);
      expect(l.remember.length).toBeGreaterThan(0);
      expect(l.fastest.method && l.fastest.when).toBeTruthy();
      expect(l.example.problem && l.example.answer && l.example.fast.length).toBeTruthy();
      expect(l.trap.trap && l.trap.fix).toBeTruthy();
      expect(l.tryIt.length).toBeGreaterThan(0);
      expect(l.takeaway.trim()).not.toBe('');
    });
  }

  it('lesson ids are unique', () => {
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
  });
});

describe('cross-links resolve', () => {
  it('every question maps to at least one existing lesson', () => {
    expect(QUESTIONS.filter((q) => !QUESTION_LESSONS[q.id]?.length).map((q) => q.id)).toEqual([]);
    for (const ls of Object.values(QUESTION_LESSONS)) for (const l of ls) expect(LESSON_BY_ID[l], l).toBeDefined();
    const ids = new Set(QUESTIONS.map((q) => q.id));
    expect(Object.keys(QUESTION_LESSONS).filter((id) => !ids.has(id))).toEqual([]);
  });
  it('question shortcuts exist', () => {
    const ids = new Set(QUESTIONS.map((q) => q.id));
    for (const [q, s] of Object.entries(QUESTION_SHORTCUT)) {
      expect(ids.has(q), q).toBe(true);
      expect(SHORTCUT_BY_ID[s], s).toBeDefined();
    }
  });
  it('lesson shortcut/formula references exist', () => {
    for (const l of LESSONS) {
      for (const s of l.shortcuts ?? []) expect(SHORTCUT_BY_ID[s], `${l.id} → ${s}`).toBeDefined();
      for (const f of l.formulas ?? []) expect(FORMULA_BY_ID[f], `${l.id} → ${f}`).toBeDefined();
    }
    for (const s of SHORTCUTS) expect(LESSON_BY_ID[s.lesson], s.id).toBeDefined();
    for (const f of FORMULAS) expect(LESSON_BY_ID[f.lesson], f.id).toBeDefined();
  });
  it('every recognition category routes to a lesson', () => {
    for (const c of CATEGORY_IDS) expect(LESSON_BY_ID[CATEGORY_LESSON[c]], c).toBeDefined();
  });
  it('every Phase 1 decode lesson routes to a formula and a library lesson', () => {
    for (const d of DECODE_LESSONS) {
      expect(FORMULA_BY_ID[DECODE_LESSON_FORMULA[d.id]], d.id).toBeDefined();
      expect(LESSON_BY_ID[DECODE_LESSON_LIBRARY[d.id]], d.id).toBeDefined();
    }
  });
  it('reports lessons without a bank question (shown as "quick checks only" in the UI)', () => {
    const empty = LESSONS.filter((l) => questionsForLesson(l.id).length === 0).map((l) => l.id);
    // Kept explicit so the UI label and this list stay honest.
    expect(empty).toEqual([]);
  });
});

describe('Understand the Formula', () => {
  for (const f of FORMULAS) {
    it(`${f.id} renders with every part, and each highlight is valid TeX`, () => {
      const used = new Set<string>();
      const collect = (tex: string) => tex.replace(/@(\w+)@/g, (_, id) => (used.add(id), ''));
      collect(f.template);
      for (const p of f.parts) collect(p.tex);
      expect([...used].sort()).toEqual(f.parts.map((p) => p.id).sort());
      for (const sel of [null, ...f.parts.map((p) => p.id)]) {
        const tex = renderFormula(f, sel);
        expect(tex).not.toMatch(/@/);
        expect(() => katex.renderToString(tex, { throwOnError: true })).not.toThrow();
        if (sel) expect(tex).toContain('textcolor');
      }
    });
  }
  it('ids are unique', () => expect(new Set(FORMULAS.map((f) => f.id)).size).toBe(FORMULAS.length));
});

describe('Spot the Clue', () => {
  const samples: [number, number][] = [];
  for (const x of range(-30, 60, 0.5)) for (const y of [-7, -2, 0, 1, 3, 8, 15, 22]) samples.push([x, y]);
  samples.push([10 / 7, 0]);

  for (const t of TRANSLATIONS) {
    it(`${t.id}: exactly one option means the statement`, () => {
      const same = (f: (x: number, y: number) => number | boolean) =>
        samples.every(([x, y]) => {
          const a = f(x, y);
          const b = t.ref(x, y);
          return typeof a === 'number' && typeof b === 'number' ? near(a, b) : a === b;
        });
      const matching = t.options.map((o, i) => (same(o.f) ? i : -1)).filter((i) => i >= 0);
      expect(matching).toEqual([t.answer]);
    });
  }
  it('phrase, reverse, and trap items are well-formed', () => {
    for (const p of [...PHRASES, ...REVERSES]) {
      expect(p.answer).toBeLessThan(p.options.length);
      expect(new Set(p.options).size).toBe(p.options.length);
    }
    for (const t of TRAPS) expect(t.a.math).not.toBe(t.b.math);
    const ids = [...PHRASES, ...TRANSLATIONS, ...REVERSES, ...TRAPS].map((x) => x.id);
    expect(new Set(PHRASES.map((p) => p.id)).size).toBe(PHRASES.length);
    expect(ids.length).toBeGreaterThan(40);
  });
});

describe('flashcards', () => {
  it('have unique ids and real practice links', () => {
    expect(new Set(FLASHCARDS.map((c) => c.id)).size).toBe(FLASHCARDS.length);
    for (const c of FLASHCARDS) expect(c.practice.href).toMatch(/^#\/(vault|formulas|clues|library)/);
  });
  it('prioritize: repeatedly missed first, then unseen, then known', () => {
    const [a, b, c, d] = FLASHCARDS;
    const order = prioritize([a, b, c, d], {
      [a.id]: { knew: 3, missed: 0, streak: 3, lastSeen: 1 },
      [b.id]: { knew: 0, missed: 1, streak: 0, lastSeen: 5 },
      [c.id]: { knew: 0, missed: 4, streak: 0, lastSeen: 9 },
    });
    expect(order.map((x) => x.id)).toEqual([c.id, b.id, d.id, a.id]);
  });
});
