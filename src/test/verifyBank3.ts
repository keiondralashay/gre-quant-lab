/**
 * Independent answer computations for the bank-expansion (b3) questions.
 * Merged into the VERIFY table in answerKeys.test.ts.
 */
import { ENROLLMENT } from '../data/questions/phase2';
import type { QCAnswer } from '../data/types';

const EPS = 1e-9;
const near = (a: number, b: number) => Math.abs(a - b) < EPS;
const range = (a: number, b: number, step = 1) => {
  const out: number[] = [];
  for (let x = a; x <= b + EPS; x += step) out.push(Math.round(x * 1e6) / 1e6);
  return out;
};
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
const isPrime = (n: number) => n > 1 && range(2, Math.floor(Math.sqrt(n))).every((d) => n % d !== 0);
const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const sd = (xs: number[]) => Math.sqrt(mean(xs.map((x) => (x - mean(xs)) ** 2)));
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length / 2;
  return s.length % 2 ? s[Math.floor(m)] : (s[m - 1] + s[m]) / 2;
};
const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
const C = (n: number, k: number) => fact(n) / (fact(k) * fact(n - k));
const unique = <T,>(xs: T[]): T => {
  if (xs.length < 1 || new Set(xs).size !== 1) throw new Error(`not unique: ${JSON.stringify(xs)}`);
  return xs[0];
};
const onlyIndex = (bools: boolean[]) => {
  const idx = bools.map((b, i) => (b ? i : -1)).filter((i) => i >= 0);
  if (idx.length !== 1) throw new Error(`expected exactly one true choice, got ${idx}`);
  return idx[0];
};
export function qcRelation(samples: [number, number][]): QCAnswer {
  if (!samples.length) throw new Error('no samples');
  const rel = new Set(samples.map(([a, b]) => (near(a, b) ? 'C' : a > b ? 'A' : 'B')));
  return rel.size === 1 ? ([...rel][0] as QCAnswer) : 'D';
}

export type Check = { value: number; choiceValues?: number[] } | { qc: QCAnswer } | { multi: number[] };
const idx = (i: number, n = 5): Check => ({ value: i, choiceValues: range(0, n - 1) });

export const VERIFY_B3: Record<string, () => Check> = {
  // ---------- arithmetic ----------
  'b3-neg-product-multi': () => {
    const fs = [(x: number, y: number) => x * y, (x: number, y: number) => x - y, (x: number, y: number) => x / y, (x: number, y: number) => y - x, (x: number, y: number) => x * x * y];
    const pairs: [number, number][] = [];
    for (const x of range(-9, -0.5, 0.5)) for (const y of range(0.5, 9, 0.5)) pairs.push([x, y]);
    return { multi: fs.map((f, i) => (pairs.every(([x, y]) => f(x, y) < 0) ? i : -1)).filter((i) => i >= 0) };
  },
  'b3-prime-pick': () => idx(onlyIndex([21, 27, 29, 33, 39].map(isPrime))),
  'b3-odd-primes-qc': () => {
    const ps = range(3, 60).filter(isPrime);
    const s: [number, number][] = [];
    for (const p of ps) for (const q of ps) if (p !== q) s.push([(p + q) % 2, 0]);
    return { qc: qcRelation(s) };
  },
  'b3-fraction-compare-qc': () => ({ qc: qcRelation([[7 / 9, 11 / 14]]) }),
  'b3-decimal-greatest': () => {
    const v = [0.45, 0.405, 0.5, 0.054, 0.4999];
    return idx(v.indexOf(Math.max(...v)));
  },
  'b3-decimal-power': () => ({ value: 0.2 ** 3 / 0.04 }),
  'b3-percent-of-x': () => {
    const x = unique(range(0, 500, 0.5).filter((x) => near(0.4 * x, 28)));
    return { value: 0.25 * x };
  },
  'b3-chain-percent-qc': () => ({ qc: qcRelation(range(1, 300, 7).map((z) => [0.2 * (0.5 * z), 0.1 * z])) }),
  'b3-three-changes': () => {
    const pct = (1.25 * 0.8 * 1.1 - 1) * 100;
    return idx(onlyIndex([-5, 0, 5, 10, 15].map((c) => near(c, pct))));
  },
  'b3-ratio-difference': () => {
    const k = unique(range(1, 100).filter((k) => 5 * k - 4 * k === 12));
    return { value: 9 * k };
  },
  'b3-ratio-chain': () => {
    const ac = (2 / 3) * (4 / 5);
    return idx(onlyIndex([2 / 5, 8 / 15, 6 / 5, 4 / 15, 10 / 12].map((v) => near(v, ac))));
  },
  'b3-inverse-pumps': () => {
    const hours = (5 * 12) / 6;
    return { value: hours, choiceValues: [6, 8, 10, 12, 14.4] };
  },
  'b3-direct-square': () => {
    const k = 12 / 2 ** 2;
    return { value: k * 5 ** 2 };
  },
  'b3-div9-pick': () => idx(onlyIndex([2341, 4527, 6013, 7433, 8104].map((n) => n % 9 === 0))),
  'b3-lcm-qc': () => ({ qc: qcRelation([[range(1, 100).find((n) => n % 6 === 0 && n % 4 === 0)!, 24]]) }),
  'b3-perfect-cube': () => ({ value: range(1, 500).find((k) => Math.round(Math.cbrt(72 * k)) ** 3 === 72 * k)! }),
  'b3-lcm-basic': () => ({ value: range(1, 200).find((n) => n % 8 === 0 && n % 12 === 0)! }),
  'b3-ribbon-gcf': () => {
    const g = gcd(gcd(48, 72), 120);
    const pieces = (48 + 72 + 120) / g;
    return { value: pieces, choiceValues: [5, 10, 12, 24, 240] };
  },
  'b3-remainder-250': () => ({ value: 250 % 12 }),
  'b3-sqrt-decimal': () => ({ value: Math.sqrt(0.81), choiceValues: [0.009, 0.09, 0.405, 0.9, 9] }),
  'b3-abs-arith': () => ({ value: Math.abs(-7) - Math.abs(3 - 10) }),
  'b3-abs-count': () => ({ value: range(-50, 50).filter((x) => Math.abs(x - 4) <= 3).length }),
  'b3-typing-rate': () => ({ value: 8100 / 45 / 60 }),
  'b3-machines-variable': () => {
    // Simulate: a = 3 machines, b = 12 widgets in c = 4 minutes.
    const [a, b, c] = [3, 12, 4];
    const perMachineMinute = b / (a * c);
    const out = 2 * a * (3 * c) * perMachineMinute;
    return idx(onlyIndex([b / 6, (3 * b) / 2, 2 * b, 5 * b, 6 * b].map((v) => near(v, out))));
  },
  'b3-train-time': () => ({ value: 240 / 60 }),
  'b3-opposite-cars': () => ({ value: unique(range(0, 20, 0.25).filter((t) => near(45 * t + 55 * t, 350))) }),
  'b3-pump-fraction': () => ({ value: 3 / 5 / (1 / 5) }),
  'b3-work-find-b': () => ({ value: 1 / (1 / 6 - 1 / 10) }),
  'b3-seq-25th': () => {
    let t = 7;
    for (let n = 2; n <= 25; n++) t += 4;
    return { value: t };
  },
  'b3-sum-multiples-5': () => {
    const sum = range(5, 100).filter((n) => n % 5 === 0).reduce((s, n) => s + n, 0);
    return { value: sum, choiceValues: [1000, 1050, 1100, 2100, 5050] };
  },

  // ---------- algebra ----------
  'b3-simplify-expr': () => {
    const f = (x: number) => 3 * (x - 2) + 2 * (x + 5);
    const cs = [(x: number) => 5 * x - 4, (x: number) => 5 * x + 3, (x: number) => 5 * x + 4, (x: number) => 5 * x + 16, (x: number) => 6 * x + 3];
    return idx(onlyIndex(cs.map((g) => range(-10, 10, 0.5).every((x) => near(g(x), f(x))))));
  },
  'b3-identity-qc': () => ({ qc: qcRelation(range(-20, 20, 0.37).filter((x) => Math.abs(x) > 1e-6).map((x) => [(x + 1) ** 2 - (x - 1) ** 2, 4 * x])) }),
  'b3-linear-parens': () => ({ value: unique(range(-100, 100, 0.5).filter((x) => near(3 * (x - 4), 2 * (x + 1) - x))) }),
  'b3-dependent-system-qc': () => {
    // All solutions of both equations (integer x from a wide range; y follows from eq 1).
    const sols = range(-30, 30, 0.5)
      .map((x) => [x, (12 - 2 * x) / 3] as [number, number])
      .filter(([x, y]) => near(4 * x + 6 * y, 24));
    return { qc: qcRelation(sols) };
  },
  'b3-greatest-int': () => ({ value: Math.max(...range(-100, 100).filter((x) => 2 * x + 5 < 17)) }),
  'b3-interval-must': () => {
    const xs = range(-1.999, 2.999, 0.001);
    const preds = [(x: number) => x * x < 9, (x: number) => x + 2 > 0, (x: number) => x < 3, (x: number) => Math.abs(x) < 3, (x: number) => x * x < 4];
    return { multi: preds.map((p, i) => (xs.every(p) ? i : -1)).filter((i) => i >= 0) };
  },
  'b3-disc-zero': () => {
    const roots = new Set(range(-20, 20, 0.5).filter((x) => near(x * x - 6 * x + 9, 0)));
    return idx(onlyIndex([0, 1, 2, Infinity].map((n) => n === roots.size)), 4);
  },
  'b3-root-product': () => {
    const roots = range(-20, 20, 0.5).filter((x) => near(2 * x * x + 7 * x - 15, 0));
    if (roots.length !== 2) throw new Error('expected two roots');
    return { value: roots[0] * roots[1] };
  },
  'b3-power-of-power': () => ({ value: (2 ** 3) ** 2 / 2 ** 4 }),
  'b3-alg-frac-eval': () => ({ value: (7 ** 2 - 9) / (7 - 3) }),
  'b3-reciprocal-sum': () => {
    // Solve 1/x + 1/(18 − x) = 1/2 numerically by bisection on each sign change, then form xy.
    const g = (x: number) => 1 / x + 1 / (18 - x) - 0.5;
    const prods: number[] = [];
    const grid = range(0.01, 17.99, 0.01);
    for (let k = 0; k < grid.length - 1; k++) {
      let [lo, hi] = [grid[k], grid[k + 1]];
      if (Math.sign(g(lo)) === Math.sign(g(hi))) continue;
      for (let it = 0; it < 80; it++) {
        const mid = (lo + hi) / 2;
        if (Math.sign(g(mid)) === Math.sign(g(lo))) lo = mid;
        else hi = mid;
      }
      prods.push(Math.round(lo * (18 - lo) * 1e6) / 1e6);
    }
    return { value: unique(prods), choiceValues: [9, 18, 36, 72, 324] };
  },
  'b3-function-qc': () => {
    const f = (x: number) => x * x - 4 * x;
    return { qc: qcRelation([[f(1), f(3)]]) };
  },
  'b3-distance-pts': () => ({ value: Math.hypot(5 - -1, 6 - -2) }),
  'b3-y-intercept': () => ({ value: 5 - 3 * 2, choiceValues: [-3, -1, 1, 3, 11] }),
  'b3-perp-slope-qc': () => ({ qc: qcRelation([[-1 / -2, 0]]) }),
  'b3-tickets': () => ({ value: unique(range(0, 20).filter((a) => 8 * a + 5 * (20 - a) === 130)) }),

  // ---------- geometry ----------
  'b3-vertical-angles': () => ({ value: 75 / 3 }),
  'b3-alt-interior-qc': () => ({ qc: qcRelation([[unique(range(0, 100, 0.25).filter((x) => near(5 * x - 20, 3 * x + 30))), 25]]) }),
  'b3-isosceles-vertex': () => ({ value: 180 - 2 * 50 }),
  'b3-ladder': () => ({ value: Math.sqrt(13 ** 2 - 5 ** 2) - Math.sqrt(13 ** 2 - 12 ** 2) }),
  'b3-45-hyp': () => ({ value: unique(range(0.5, 50, 0.5).filter((x) => near(Math.hypot(x, x), 10 * Math.SQRT2))) }),
  'b3-similar-area': () => ({ value: 18 * (5 / 3) ** 2 }),
  'b3-parallel-segment': () => ({ value: 5 * ((4 + 6) / 4) }),
  'b3-circle-c': () => ({ value: (2 * Math.PI * 7) / Math.PI }),
  'b3-sector-area': () => ({ value: ((120 / 360) * Math.PI * 9 ** 2) / Math.PI }),
  'b3-polygon-sides': () => ({ value: unique(range(3, 40).filter((n) => (n - 2) * 180 === 1440)) }),
  'b3-pentagon-qc': () => ({ qc: qcRelation([[((5 - 2) * 180) / 5, 110]]) }),
  'b3-rect-perimeter': () => ({ value: 2 * (8 + 5) }),
  'b3-square-area': () => ({ value: (36 / 4) ** 2, choiceValues: [36, 72, 81, 144, 324] }),
  'b3-cube-sa': () => ({ value: 6 * Math.cbrt(64) ** 2 }),
  'b3-coord-triangle-perim': () => ({ value: Math.hypot(6, 0) + Math.hypot(0, 8) + Math.hypot(6, 8) }),
  'b3-parallelogram-coords': () => {
    // Shoelace formula on the given vertices (independent of the base-height reasoning).
    const v = [
      [0, 0],
      [4, 0],
      [6, 3],
      [2, 3],
    ];
    let s = 0;
    for (let i = 0; i < v.length; i++) {
      const [x1, y1] = v[i];
      const [x2, y2] = v[(i + 1) % v.length];
      s += x1 * y2 - x2 * y1;
    }
    return { value: Math.abs(s) / 2 };
  },

  // ---------- data ----------
  'b3-mean-six': () => ({ value: mean([4, 8, 15, 16, 23, 42]) }),
  'b3-median-mean-qc': () => ({ qc: qcRelation(range(10.01, 200, 0.37).map((x) => [median([3, 7, 7, 10, x]), mean([3, 7, 7, 10, x])])) }),
  'b3-weighted-b-size': () => ({ value: unique(range(1, 200).filter((b) => near((20 * 70 + 76 * b) / (20 + b), 74))) }),
  'b3-sd-zero': () => {
    const sets = [
      [1, 2, 3],
      [5, 5, 5],
      [0, 1, 0],
      [2, 4, 6],
      [-1, 0, 1],
    ];
    return idx(onlyIndex(sets.map((s) => near(sd(s), 0))));
  },
  'b3-sd-shift-qc': () => ({ qc: qcRelation([[sd([10, 20, 30]), sd([20, 30, 40])]]) }),
  'b3-die-less-3': () => {
    const p = [1, 2, 3, 4, 5, 6].filter((n) => n < 3).length / 6;
    return { value: p, choiceValues: [1 / 6, 1 / 3, 1 / 2, 2 / 3, 5 / 6] };
  },
  'b3-books-arrange': () => ({ value: fact(4) }),
  'b3-letters-perm': () => {
    let n = 0;
    const L = 'ABCDE';
    for (const a of L) for (const b of L) for (const c of L) if (a !== b && b !== c && a !== c) n++;
    return { value: n };
  },
  'b3-handshakes': () => {
    let n = 0;
    for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) n++;
    return { value: n };
  },
  'b3-at-least-one-man': () => {
    // Enumerate all 3-person subsets of 9 people (indices 0–4 women, 5–8 men).
    let n = 0;
    for (let a = 0; a < 9; a++) for (let b = a + 1; b < 9; b++) for (let c = b + 1; c < 9; c++) if (a >= 5 || b >= 5 || c >= 5) n++;
    if (n !== C(9, 3) - C(5, 3)) throw new Error('enumeration mismatch');
    return { value: n };
  },
  'b3-venn-neither': () => ({ value: 30 - (18 + 15 - 7) }),
  'b3-venn-min-qc': () => {
    const s: [number, number][] = [];
    for (let both = 0; both <= 30; both++) {
      const neither = 50 - (30 + 35 - both);
      if (neither >= 0) s.push([both, 15]);
    }
    return { qc: qcRelation(s) };
  },
  'b3-table-share': () => {
    const col = ENROLLMENT.rows.map((r) => Number(r[2]));
    return { value: (Number(ENROLLMENT.rows.find((r) => r[0] === 'Physics')![2]) / col.reduce((a, b) => a + b, 0)) * 100 };
  },
  'b3-bar-lowest': () => {
    const sales = [120, 150, 90, 140];
    return idx(sales.indexOf(Math.min(...sales)), 4);
  },
};
