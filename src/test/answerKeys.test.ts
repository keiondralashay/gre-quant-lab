/**
 * Deterministic verification of every answer key. Each question's answer is
 * recomputed independently here (brute force / enumeration where practical),
 * so the content files are never the only source of mathematical truth.
 * A question without an entry in VERIFY fails the suite.
 */
import { QUESTIONS } from '../data/questions';
import type { QCAnswer, Question } from '../data/types';

const EPS = 1e-9;
const near = (a: number, b: number) => Math.abs(a - b) < EPS;

/** Parse simple numeric choice text: "−2", "\$60", "56%", "$\frac{2}{3}$", "$-\frac{2}{3}$". */
function evalChoice(text: string): number {
  let s = text.replace(/\\\$/g, '').replace(/\$/g, '').replace(/[−]/g, '-').replace(/%/g, '').replace(/\\dfrac|\\tfrac/g, '\\frac').trim();
  const frac = s.match(/^(-?)\\frac\{(-?\d+)\}\{(\d+)\}$/);
  if (frac) return (frac[1] ? -1 : 1) * (Number(frac[2]) / Number(frac[3]));
  s = s.replace(/\s/g, '');
  const n = Number(s);
  if (Number.isNaN(n)) throw new Error(`Cannot evaluate choice "${text}" — supply choiceValues`);
  return n;
}

/** Determine the QC relationship from (A, B) samples over the allowed domain. */
function qcRelation(samples: [number, number][]): QCAnswer {
  if (!samples.length) throw new Error('no samples');
  const rel = samples.map(([a, b]) => (near(a, b) ? 'C' : a > b ? 'A' : 'B'));
  const uniq = new Set(rel);
  return uniq.size === 1 ? (rel[0] as QCAnswer) : 'D';
}

const range = (a: number, b: number, step = 1) => {
  const out: number[] = [];
  for (let x = a; x <= b + EPS; x += step) out.push(x);
  return out;
};

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
const divisors = (n: number) => range(1, n).filter((d) => n % d === 0);
const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const sd = (xs: number[]) => Math.sqrt(mean(xs.map((x) => (x - mean(xs)) ** 2)));
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length / 2;
  return s.length % 2 ? s[Math.floor(m)] : (s[m - 1] + s[m]) / 2;
};
/** Integer roots-by-search for polynomials: returns rational candidates p/q that make f zero. */
const rationalRoots = (f: (x: number) => number, maxNum = 30, maxDen = 6) => {
  const roots = new Set<number>();
  for (let q = 1; q <= maxDen; q++)
    for (let p = -maxNum * q; p <= maxNum * q; p++) if (near(f(p / q), 0)) roots.add(Math.round((p / q) * 1e9) / 1e9);
  return [...roots];
};

type Check =
  /** Expected numeric value. For mc-single the correct choice must equal it and be the only one that does. */
  | { value: number; choiceValues?: number[] }
  /** Expected QC relation computed from samples. */
  | { qc: QCAnswer }
  /** Expected indices for select-all questions, computed from predicates over choices. */
  | { multi: number[] };

const VERIFY: Record<string, () => Check | QCAnswer> = {
  // ---------- Arithmetic ----------
  'ar-pct-sale': () => ({ value: 80 - 80 * 0.25 }),
  'ar-pct-change-qc': () => qcRelation([[((50 - 40) / 40) * 100, ((50 - 40) / 50) * 100]]),
  'ar-odd-even-multi': () => {
    const exprs = [(n: number) => n + 1, (n: number) => 2 * n + 1, (n: number) => n * n, (n: number) => n * n + n, (n: number) => 3 * n - 1];
    const odds = range(-51, 51).filter((n) => Math.abs(n % 2) === 1);
    return { multi: exprs.map((f, i) => (odds.every((n) => f(n) % 2 === 0) ? i : -1)).filter((i) => i >= 0) };
  },
  'ar-remainder-3n': () => {
    const ns = range(1, 700).filter((n) => n % 7 === 4);
    const rems = new Set(ns.map((n) => (3 * n) % 7));
    if (rems.size !== 1) throw new Error('remainder not unique');
    return { value: [...rems][0] };
  },
  'ar-units-digit-7': () => {
    let d = 1;
    for (let i = 0; i < 43; i++) d = (d * 7) % 10;
    return { value: d };
  },
  'ar-ratio-marbles': () => {
    const sols = range(0, 48).filter((blue) => (48 - blue) * 5 === blue * 3);
    return { value: sols[0] };
  },
  'ar-gcf-84-126': () => ({ value: gcd(84, 126) }),
  'ar-exp-sum-powers': () => ({ value: (2 ** 10 + 2 ** 10) / 2 ** 8 }),
  'ar-rate-bottles': () => ({ value: (240 / 8) * 60 }),
  'ar-factors-36-qc': () => ({ qc: qcRelation([[divisors(36).length, 9]]) }),

  // ---------- Algebra ----------
  'al-quad-x2-7x-10': () => {
    const roots = rationalRoots((x) => x * x - 7 * x + 10);
    const choices = [-5, -2, 2, 7, 10].filter((c) => roots.some((r) => near(r, c)));
    if (choices.length !== 1) throw new Error('expected one root among choices');
    return { value: choices[0], choiceValues: [-5, -2, 2, 7, 10] };
  },
  'al-quad-3x2-multi': () => {
    const f = (x: number) => 3 * x * x - 11 * x + 6;
    const vals = [-3, -2 / 3, 2 / 3, 3, 6];
    return { multi: vals.map((v, i) => (near(f(v), 0) ? i : -1)).filter((i) => i >= 0) };
  },
  'al-system-elim-y': () => {
    // brute-force integer/half-integer grid
    for (const x of range(-50, 50, 0.5)) for (const y of range(-50, 50, 0.5)) if (near(x + y, 24) && near(x - y, 18)) return { value: y };
    throw new Error('no solution');
  },
  'al-system-sum': () => {
    // Solve with Cramer's rule
    const [a1, b1, c1, a2, b2, c2] = [3, 2, 19, 1, 2, 9];
    const det = a1 * b2 - a2 * b1;
    const a = (c1 * b2 - c2 * b1) / det;
    const b = (a1 * c2 - a2 * c1) / det;
    return { value: a + b };
  },
  'al-linear-2x3': () => {
    const sols = range(-100, 100, 0.5).filter((x) => near((2 * x) / 3 + 5, 17));
    return { value: sols[0] };
  },
  'al-ineq-flip': () => {
    const solutionSet = range(-200, 200, 0.25).filter((x) => -3 * x + 7 > 22);
    const preds = [(x: number) => x > -5, (x: number) => x < -5, (x: number) => x > 5, (x: number) => x >= -5, (x: number) => x > -15];
    const must = preds.map((p, i) => (solutionSet.every(p) ? i : -1)).filter((i) => i >= 0);
    if (must.length !== 1) throw new Error(`expected exactly one must-be-true choice, got ${must}`);
    // encode as a value matched against index via choiceValues
    return { value: must[0], choiceValues: [0, 1, 2, 3, 4] };
  },
  'al-diff-squares': () => {
    const pairs: number[] = [];
    for (const x of range(-60, 60, 0.5)) {
      const y = 12 - x;
      if (near(x * x - y * y, 48)) pairs.push(x - y);
    }
    if (new Set(pairs).size !== 1) throw new Error('x − y not unique');
    return { value: pairs[0] };
  },
  'al-exp-4x-8x': () => {
    const sols = range(-20, 20, 0.5).filter((x) => near(Math.log(4 ** x), Math.log(8 ** (x - 1))));
    if (sols.length !== 1) throw new Error('expected one solution');
    return { value: sols[0] };
  },
  'al-translate-five-less': () => {
    const sols = range(-100, 100, 0.5).filter((x) => near(2 * x - 5, 17));
    return { value: sols[0], choiceValues: [-6, 6, 11, 13.5, 22] };
  },
  'al-x2-4x-qc': () => {
    const xs = rationalRoots((x) => x * x - 4 * x);
    return { qc: qcRelation(xs.map((x) => [x, 4])) };
  },
  'al-slope-two-points': () => ({ value: (11 - 3) / (5 - 1), choiceValues: [0.5, 2, 3, 8, 11] }),
  'al-fraction-power-qc': () => ({ qc: qcRelation(range(0.001, 0.999, 0.001).map((x) => [x * x, Math.sqrt(x)])) }),

  // ---------- Geometry ----------
  'ge-right-tri-6-8': () => ({ value: Math.hypot(6, 8) }),
  'ge-circle-area-from-c': () => {
    const r = (10 * Math.PI) / (2 * Math.PI);
    return { value: Math.PI * r * r, choiceValues: [5, 10, 20, 25, 100].map((k) => k * Math.PI) };
  },
  'ge-triangle-angle': () => ({ value: 180 - 47 - 68 }),
  'ge-square-diagonal': () => {
    const d = 6 * Math.SQRT2;
    return { value: (d * d) / 2, choiceValues: [12, 18, 36, 72, 36 * Math.SQRT2] };
  },
  'ge-third-side-qc': () => {
    const valid = range(0.05, 20, 0.05).filter((x) => x < 5 + 9 && 5 < x + 9 && 9 < x + 5);
    return { qc: qcRelation(valid.map((x) => [x, 13])) };
  },
  'ge-box-diagonal': () => ({ value: Math.sqrt(3 ** 2 + 4 ** 2 + 12 ** 2) }),
  'ge-similar-triangles': () => ({ value: 6 * (10 / 4) }),

  // ---------- Data analysis ----------
  'da-average-sixth': () => ({ value: 6 * 13 - 5 * 12 }),
  'da-median-even': () => ({ value: median([8, 3, 12, 5, 9, 3]) }),
  'da-dice-sum-8': () => {
    let fav = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === 8) fav++;
    return { value: fav / 36 };
  },
  'da-two-red': () => {
    // Enumerate ordered draws of distinct marbles: 0–3 red, 4–9 blue
    let fav = 0;
    let total = 0;
    for (let i = 0; i < 10; i++)
      for (let j = 0; j < 10; j++) {
        if (i === j) continue;
        total++;
        if (i < 4 && j < 4) fav++;
      }
    return { value: fav / total };
  },
  'da-sales-pct-change': () => {
    const exact = ((140 - 90) / 90) * 100;
    const choices = [36, 50, 56, 64, 156];
    const closest = choices.reduce((best, c) => (Math.abs(c - exact) < Math.abs(best - exact) ? c : best));
    // must be clearly closest (no near-tie)
    const sorted = choices.map((c) => Math.abs(c - exact)).sort((a, b) => a - b);
    if (sorted[1] - sorted[0] < 3) throw new Error('approximate choices too close');
    return { value: closest };
  },
  'da-sales-fraction': () => ({ value: 150 / (120 + 150 + 90 + 140) }),
  'da-committee-combo': () => {
    let n = 0;
    for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) n++;
    return { value: n };
  },
  'da-mean-median-qc': () => {
    const s = [2, 4, 6, 8, 10];
    return { qc: qcRelation([[mean(s), median(s)]]) };
  },
  'da-greatest-sd': () => {
    const sets = [
      [10, 10, 10, 10],
      [8, 9, 11, 12],
      [1, 10, 10, 19],
      [7, 9, 11, 13],
      [9, 10, 10, 11],
    ];
    const sds = sets.map(sd);
    const max = Math.max(...sds);
    if (sds.filter((v) => near(v, max)).length !== 1) throw new Error('tie for greatest SD');
    return { value: sds.indexOf(max), choiceValues: [0, 1, 2, 3, 4] };
  },
};

function checkQuestion(q: Question, check: Check) {
  const ans = q.answer;
  if ('qc' in check) {
    expect(ans.kind).toBe('qc');
    if (ans.kind === 'qc') expect(ans.correct).toBe(check.qc);
    return;
  }
  if ('multi' in check) {
    expect(ans.kind).toBe('mc-multi');
    if (ans.kind === 'mc-multi') expect([...ans.correct].sort()).toEqual([...check.multi].sort());
    return;
  }
  if (ans.kind === 'numeric') {
    expect(ans.den).not.toBe(0);
    expect(near(ans.num / ans.den, check.value)).toBe(true);
    return;
  }
  if (ans.kind === 'mc-single') {
    const values = check.choiceValues ?? q.choices!.map(evalChoice);
    expect(values.length).toBe(q.choices!.length);
    const matching = values.map((v, i) => (near(v, check.value) ? i : -1)).filter((i) => i >= 0);
    expect(matching, `${q.id}: exactly one choice must equal ${check.value}`).toEqual([ans.correct]);
    return;
  }
  throw new Error(`${q.id}: check type does not fit answer kind ${ans.kind}`);
}

// Several VERIFY entries return a QC letter directly from qcRelation; normalise.
function normalise(result: Check | QCAnswer): Check {
  return typeof result === 'string' ? { qc: result } : result;
}

describe('answer keys are independently verified', () => {
  it('every question has a verifier', () => {
    const missing = QUESTIONS.filter((q) => !VERIFY[q.id]).map((q) => q.id);
    expect(missing).toEqual([]);
  });

  for (const q of QUESTIONS) {
    it(`${q.id} answer key is correct`, () => {
      const fn = VERIFY[q.id];
      expect(fn).toBeDefined();
      checkQuestion(q, normalise(fn()));
    });
  }
});

export { evalChoice, qcRelation };
