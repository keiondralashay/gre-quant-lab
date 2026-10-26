/**
 * Every number a guide expects the learner to enter is recomputed here from the
 * question's own data (not copied from the guide), and every guide must be
 * structurally sound. A numeric step without a verifier fails the suite.
 */
import { describe, expect, it } from 'vitest';
import { GUIDES, type GuideStep } from '../data/guides';
import { QUESTION_BY_ID } from '../data/questions';
import { parseRational, rationalEquals } from '../lib/grading';
import { GUIDE_CHECKS } from './guideChecks';

const R = (n: number, d = 1) => ({ n, d });
type V = number | { n: number; d: number };

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
const C = (n: number, k: number) => {
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return r;
};
const roots = (a: number, b: number, c: number) => {
  const d = b * b - 4 * a * c;
  return [(-b - Math.sqrt(d)) / (2 * a), (-b + Math.sqrt(d)) / (2 * a)];
};
const primeExp = (n: number, p: number) => {
  let e = 0;
  while (n % p === 0) {
    n /= p;
    e++;
  }
  return e;
};
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return [s[s.length / 2 - 1], s[s.length / 2]];
};

/** Independent values, keyed by step id (fields: stepId.fieldId). Shared ids across tracks must agree. */
const VERIFY_BASE: Record<string, Record<string, V>> = {
  'al-quad-x2-7x-10': (() => {
    const [r1, r2] = roots(1, -7, 10);
    return { 'abc.a': 1, 'abc.b': -7, 'abc.c': 10, 'pair.p': -r2, 'pair.q': -r1, 'roots.r1': r1, 'roots.r2': r2, disc: 49 - 40 };
  })(),
  'al-quad-3x2-multi': (() => {
    const [a, b, c] = [3, -11, 6];
    return { 'abc.a': a, 'abc.b': b, 'abc.c': c, 'roots.r1': R(2, 3), 'roots.r2': roots(a, b, c)[1], disc: b * b - 4 * a * c, den: 2 * a };
  })(),
  'al-x2-4x-qc': { 'abc.a': 1, 'abc.b': -4, 'abc.c': 0, 'roots.r1': [-2, -1, 0, 1, 2, 3, 4, 5].filter((x) => x * x === 4 * x)[0], 'roots.r2': [-2, -1, 0, 1, 2, 3, 4, 5].filter((x) => x * x === 4 * x)[1] },
  'b3-disc-zero': { 'abc.a': 1, 'abc.b': -6, 'abc.c': 9, disc: 36 - 36, count: new Set(roots(1, -6, 9)).size },
  'b3-root-product': (() => {
    const [r1, r2] = roots(2, 7, -15);
    return { 'abc.a': 2, 'abc.b': 7, 'abc.c': -15, prod: R(Math.round(r1 * r2 * 2), 2), 'roots.r1': r1, 'roots.r2': R(Math.round(r2 * 2), 2) };
  })(),
  'al-ineq-flip': { bound: (22 - 7) / -3 },
  'b3-greatest-int': { ans: Math.max(...Array.from({ length: 40 }, (_, i) => i - 20).filter((x) => 2 * x + 5 < 17)) },
  'b3-abs-count': (() => {
    const xs = Array.from({ length: 41 }, (_, i) => i - 20).filter((x) => Math.abs(x - 4) <= 3);
    return { 'bounds.lo': Math.min(...xs), 'bounds.hi': Math.max(...xs), count: xs.length };
  })(),
  'p2-abs-qc': { 'cases.a': 2 + 5, 'cases.b': 2 - 5 },
  'ar-exp-sum-powers': { 'be.base': 2, 'be.exp': 10, val: (2 ** 10 + 2 ** 10) / 2 ** 8, top: 2 ** 10 + 2 ** 10, ans: (2 ** 10 + 2 ** 10) / 2 ** 8 },
  'al-exp-4x-8x': { 'be.base': 8, x: [0, 1, 2, 3, 4, 5, 6].find((x) => 4 ** x === 8 ** (x - 1))! },
  'b3-power-of-power': { 'be.base': 2, 'be.in': 3, 'be.out': 2, e: 3 * 2 - 4, v: (2 ** 3) ** 2 / 2 ** 4 },
  'ar-units-digit-7': (() => {
    const cyc: number[] = [];
    let d = 7;
    while (!cyc.includes(d)) {
      cyc.push(d);
      d = (d * 7) % 10;
    }
    let u = 1;
    for (let i = 0; i < 43; i++) u = (u * 7) % 10;
    return { 'be.base': 7, 'be.exp': 43, len: cyc.length, rem: 43 % cyc.length, digit: u };
  })(),
  'b3-decimal-power': { 'be.base': R(1, 5), 'be.exp': 3, cube: R(1, 125), ans: R(1, 5) },
  'al-linear-2x3': { mid: 17 - 5, x: ((17 - 5) * 3) / 2 },
  'al-system-elim-y': { 'coef.cx': 1, 'coef.cy': -1, '2y': 24 - 18, y: (24 - 18) / 2, sub: 24 - 18 },
  'al-system-sum': (() => {
    const a = (19 - 9) / 2;
    const b = (9 - a) / 2;
    return { 'coef.ca': 3, 'coef.cb': 2, sum: a + b, a, b };
  })(),
  'al-translate-five-less': { '2x': 17 + 5, x: (17 + 5) / 2 },
  'b3-linear-parens': (() => {
    const x = Array.from({ length: 40 }, (_, i) => i - 20).find((x) => 3 * (x - 4) === 2 * (x + 1) - x)!;
    return { '2x': 2 * x, x };
  })(),
  'b3-tickets': (() => {
    const a = Array.from({ length: 21 }, (_, i) => i).find((a) => 8 * a + 5 * (20 - a) === 130)!;
    return { 'vars.n': 20, 'vars.v': 130, extra: 8 - 5, a, '3a': 3 * a };
  })(),
  'al-slope-two-points': { 'pts.x1': 1, 'pts.y1': 3, 'pts.x2': 5, 'pts.y2': 11, dy: 11 - 3, dx: 5 - 1, m: (11 - 3) / (5 - 1) },
  'ge-right-tri-6-8': { 'meas.a': 6, 'meas.b': 8, k: 6 / 3, c: Math.hypot(6, 8), sum: 36 + 64 },
  'ge-circle-area-from-c': { r: 10 / 2, k: (10 / 2) ** 2 },
  'ge-square-diagonal': { area: (6 * Math.SQRT2) ** 2 / 2, d2: (6 * Math.SQRT2) ** 2 },
  'ge-box-diagonal': { d: Math.hypot(3, 4, 12), sum: 9 + 16 + 144 },
  'ge-similar-triangles': { k: R(10, 4), ef: (6 * 10) / 4 },
  'p2-cylinder': { 'meas.r': 3, 'meas.h': 8, base: 3 ** 2, v: 3 ** 2 * 8 },
  'b3-sector-area': { full: 9 ** 2, k: (120 / 360) * 81 },
  'p2-trapezoid': { 'meas.b1': 8, 'meas.b2': 14, 'meas.h': 5, avg: (8 + 14) / 2, area: ((8 + 14) / 2) * 5 },
  'ge-triangle-angle': { sum: 47 + 68, x: 180 - 47 - 68 },
  'p2-equilateral-perimeter': (() => {
    const side = (6 * Math.sqrt(3)) / (Math.sqrt(3) / 2);
    return { side, p: 3 * side };
  })(),
  'ar-pct-sale': { p: 80 * (1 - 0.25), d: 80 * 0.25 },
  'ar-ratio-marbles': { part: 48 / (3 + 5), blue: (48 / 8) * 5 },
  'b3-percent-of-x': { x: 28 / 0.4, ans: R(35, 2) },
  'ar-rate-bottles': { n: (240 / 8) * 60, rate: 240 / 8 },
  'p2-work-together': { t: R(12, 5), rate: R(5, 12) },
  'p2-avg-speed': { 'legs.t1': 30 / 15, 'legs.t2': 30 / 10, avg: 60 / (30 / 15 + 30 / 10) },
  'ar-remainder-3n': { '3n': 3 * 4, rem: (3 * 4) % 7 },
  'ar-gcf-84-126': { 'pf.a': primeExp(126, 2), 'pf.b': primeExp(126, 3), 'pf.c': primeExp(126, 7), g: gcd(84, 126) },
  'b3-perfect-cube': { 'pf.a': primeExp(72, 2), 'pf.b': primeExp(72, 3), k: [1, 2, 3, 4, 5, 6, 7, 8, 9].find((k) => Number.isInteger(Math.round(Math.cbrt(72 * k))) && Math.round(Math.cbrt(72 * k)) ** 3 === 72 * k)! },
  'da-average-sixth': { x: 6 * 13 - 5 * 12, 'sums.old': 5 * 12, 'sums.new': 6 * 13 },
  'da-two-red': { p: R(4 * 3, 10 * 9), 'c.f': C(4, 2), 'c.t': C(10, 2) },
  'da-dice-sum-8': (() => {
    let fav = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === 8) fav++;
    return { total: 36, fav, p: R(fav, 36) };
  })(),
  'da-committee-combo': { c: C(7, 2) },
  'p2-weighted-average': { shift: (10 * 10) / 25, avg: (15 * 80 + 10 * 90) / 25, tot: 15 * 80 + 10 * 90 },
  'p2-venn': { sum: 70 + 45 + 20, both: 70 + 45 + 20 - 120 },
  'da-median-even': (() => {
    const [m1, m2] = median([8, 3, 12, 5, 9, 3]);
    return { 'mid.m1': m1, 'mid.m2': m2, med: (m1 + m2) / 2 };
  })(),
};

const VERIFY: Record<string, Record<string, V>> = { ...VERIFY_BASE, ...GUIDE_CHECKS };
for (const k of Object.keys(GUIDE_CHECKS)) if (VERIFY_BASE[k]) throw new Error(`duplicate checks for ${k}`);

function eq(entered: string, v: V) {
  const got = parseRational(entered);
  if (!got) return false;
  if (typeof v === 'number') return Math.abs(got.num / got.den - v) < 1e-9;
  return rationalEquals(got, { num: v.n, den: v.d });
}

function stepsOf(g: (typeof GUIDES)[number]): GuideStep[] {
  return [g.components, g.fast.operation, ...g.fast.next, ...(g.long ? [g.long.operation, ...g.long.next] : [])];
}

describe('guides', () => {
  it('cover at least 45 questions, each of which exists', () => {
    expect(GUIDES.length).toBeGreaterThanOrEqual(45);
    for (const g of GUIDES) expect(QUESTION_BY_ID[g.qid], g.qid).toBeTruthy();
    expect(new Set(GUIDES.map((g) => g.qid)).size).toBe(GUIDES.length);
  });

  it('are structurally sound', () => {
    for (const g of GUIDES) {
      expect(g.given.correct.length, g.qid).toBeGreaterThan(0);
      for (const i of g.given.correct) expect(i < g.given.options.length, g.qid).toBe(true);
      for (const track of [g.fast, g.long].filter(Boolean)) expect(track!.next.length, g.qid).toBeGreaterThan(0);
      for (const s of stepsOf(g)) {
        expect(s.hints.length, `${g.qid}:${s.id}`).toBeGreaterThan(0);
        if (s.kind === 'choice') {
          expect(s.answer >= 0 && s.answer < s.options.length, `${g.qid}:${s.id}`).toBe(true);
          expect(new Set(s.options).size, `${g.qid}:${s.id} duplicate options`).toBe(s.options.length);
        }
        if (s.kind === 'number') expect(parseRational(s.answer), `${g.qid}:${s.id}`).not.toBeNull();
        if (s.kind === 'fields') for (const f of s.fields) expect(parseRational(f.answer), `${g.qid}:${s.id}.${f.id}`).not.toBeNull();
      }
      const fastIds = [g.fast.operation, ...g.fast.next].map((s) => s.id);
      expect(new Set(fastIds).size, g.qid).toBe(fastIds.length);
    }
  });

  it('have every expected number independently verified', () => {
    const missing: string[] = [];
    for (const g of GUIDES) {
      const v = VERIFY[g.qid] ?? {};
      for (const s of stepsOf(g)) {
        const checks: [string, string][] = s.kind === 'number' ? [[s.id, s.answer]] : s.kind === 'fields' ? s.fields.map((f) => [`${s.id}.${f.id}`, f.answer]) : [];
        for (const [key, entered] of checks) {
          if (!(key in v)) missing.push(`${g.qid}:${key}`);
          else expect(eq(entered, v[key]), `${g.qid}:${key} expects ${entered}`).toBe(true);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('end numeric-entry tracks on the question’s own answer', () => {
    for (const g of GUIDES) {
      const q = QUESTION_BY_ID[g.qid];
      if (q.answer.kind !== 'numeric') continue;
      for (const track of [g.fast, g.long].filter(Boolean)) {
        const last = track!.next.at(-1)!;
        if (last.kind !== 'number') continue;
        expect(eq(last.answer, { n: q.answer.num, d: q.answer.den }), `${g.qid} ${track!.label}`).toBe(true);
      }
    }
  });

  it('cover the required topic families', () => {
    const cats = GUIDES.map((g) => QUESTION_BY_ID[g.qid].category);
    for (const c of ['quadratic', 'inequalities', 'exponents', 'geometry'] as const) expect(cats.filter((x) => x === c).length, c).toBeGreaterThanOrEqual(4);
    // Quadratic-equation guides (… = 0) must ask for a, b, c explicitly.
    for (const g of GUIDES.filter((g) => QUESTION_BY_ID[g.qid].category === 'quadratic' && /x\^2[^$]*=\s*0/.test(QUESTION_BY_ID[g.qid].prompt))) {
      // a and b always; c too unless the constant is itself the unknown (e.g. k).
      const ids = g.components.kind === 'fields' ? g.components.fields.map((f) => f.id) : [];
      expect(ids.includes('a') && ids.includes('b') && (ids.includes('c') || /k\s*=\s*0/.test(QUESTION_BY_ID[g.qid].prompt)), g.qid).toBe(true);
    }
  });
});
