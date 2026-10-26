import { R, type StepChecks } from '../guideChecks/types';
import type { Check } from '../verifyBank3';

const ints = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const grid = (a: number, b: number, step: number) => ints(0, Math.round((b - a) / step)).map((k) => a + k * step);
const rel = (a: number, b: number) => (Math.abs(a - b) < 1e-9 ? 'C' : a > b ? 'A' : 'B');
const qc = (pairs: [number, number][]) => {
  const s = new Set(pairs.map(([a, b]) => rel(a, b)));
  return s.size === 1 ? ([...s][0] as 'A' | 'B' | 'C') : 'D';
};
const solve2 = (a1: number, b1: number, c1: number, a2: number, b2: number, c2: number) => {
  const det = a1 * b2 - a2 * b1;
  return { x: (c1 * b2 - c2 * b1) / det, y: (a1 * c2 - a2 * c1) / det };
};

export const VERIFY_INEQ: Record<string, () => Check> = {
  'q5-ineq-compound': () => ({ value: ints(-50, 50).filter((x) => -5 < 2 * x + 3 && 2 * x + 3 <= 11).length }),
  'q5-ineq-neg-mult-qc': () => {
    const s: [number, number][] = [];
    for (const x of grid(-5, 5, 0.5)) for (const y of grid(-5, 5, 0.5)) for (const c of grid(-4, -0.5, 0.5)) if (x < y) s.push([c * x, c * y]);
    return { qc: qc(s) };
  },
  'q5-ineq-product-sign': () => ({ multi: [-6, -5, 0, 1.5, 2].map((x, i) => ((x - 2) * (x + 5) < 0 ? i : -1)).filter((i) => i >= 0) }),
  'q5-ineq-phone-plan': () => ({ value: Math.max(...ints(0, 1000).filter((m) => 2000 + 10 * m <= 3500)) }),
  'q5-ineq-range-qc': () => ({ qc: qc(grid(1.01, 2.99, 0.02).map((x) => [x * x, 2 * x])) }),
  'q5-ineq-reciprocal': () => {
    const fs = [(a: number, b: number) => 1 / a > 1 / b, (a: number, b: number) => a * a < b * b, (a: number, b: number) => -a < -b, (a: number, b: number) => a / b < 1, (a: number, b: number) => b - a > 0];
    const pairs: [number, number][] = [];
    for (const a of grid(0.1, 5, 0.3)) for (const b of grid(0.1, 5, 0.3)) if (a < b) pairs.push([a, b]);
    return { multi: fs.map((f, i) => (pairs.every(([a, b]) => f(a, b)) ? i : -1)).filter((i) => i >= 0) };
  },
  'q5-abs-solve-sum': () => ({ value: grid(-20, 20, 0.5).filter((x) => Math.abs(2 * x - 3) === 7).reduce((s, x) => s + x, 0) }),
  'q5-abs-ineq-count': () => ({ value: ints(-50, 50).filter((x) => Math.abs(x + 1) < 4).length }),
  'q5-abs-diff-qc': () => {
    const s: [number, number][] = [];
    for (const a of grid(-5, 5, 0.5)) for (const b of grid(-5, 5, 0.5)) if (a !== 0 && b !== 0) s.push([Math.abs(a - b), Math.abs(a) + Math.abs(b)]);
    return { qc: qc(s) };
  },
  'q5-abs-no-solution': () => {
    // |x − 4| + 3 ≥ 3 > 1 for every x: check the minimum over a fine grid and the algebraic bound.
    const min = Math.min(...grid(-100, 100, 0.01).map((x) => Math.abs(x - 4) + 3));
    return { value: min > 1 ? 0 : -1, choiceValues: [0, 1, 2, 3, 99] };
  },
  'q5-abs-expression': () => {
    const fs = [(x: number) => -x - 2, (x: number) => x + 2, (x: number) => x - 2, (x: number) => -x + 2, () => 2];
    const xs = grid(-20, -2.1, 0.3);
    const ok = fs.map((f, i) => (xs.every((x) => Math.abs(f(x) - Math.abs(x + 2)) < 1e-9) ? i : -1)).filter((i) => i >= 0);
    if (ok.length !== 1) throw new Error(String(ok));
    return { value: ok[0], choiceValues: [0, 1, 2, 3, 4] };
  },
  'q5-sys-substitution': () => ({ value: solve2(-2, 1, -1, 3, 1, 14).y }),
  'q5-sys-coins': () => ({ value: ints(0, 30).filter((d) => 5 * (30 - d) + 10 * d === 240)[0] }),
  'q5-sys-no-solution': () => {
    // No solution: determinant 0 and the system inconsistent.
    const ks = ints(-50, 50).filter((k) => 2 * k - 4 * 3 === 0 && 7 !== 2 * 5);
    return { value: ks[0] };
  },
  'q5-sys-qc': () => {
    const { x, y } = solve2(1, 1, 10, 1, -1, 4);
    return { qc: rel(x, 2 * y) };
  },
  'q5-sys-three-sums': () => {
    for (const a of ints(-30, 30)) for (const b of ints(-30, 30)) {
      const c = 15 - b;
      if (a + b === 11 && a + c === 14) return { value: a + b + c };
    }
    throw new Error('none');
  },
  'q5-sys-elimination-scale': () => {
    const { x, y } = solve2(2, 5, 1, 3, -2, 30);
    return { value: x - y };
  },
};

export const STEPS_INEQ: StepChecks = {
  'q5-ineq-compound': { 'op.a': -5 - 3, 'op.b': 11 - 3, 'x.c': -4, 'x.d': 4, cnt: 8 },
  'q5-ineq-neg-mult-qc': { 'chk.a': -3 * 1, 'chk.b': -3 * 2 },
  'q5-ineq-product-sign': { 'zeros.a': -5, 'zeros.b': 2, test: (1.5 - 2) * (1.5 + 5) },
  'q5-ineq-phone-plan': { op: 35 - 20, m: 150 },
  'q5-ineq-range-qc': { 'c1.a': 2.25, 'c1.b': 3, 'c2.a': 6.25, 'c2.b': 5 },
  'q5-ineq-reciprocal': { 'op.a': 1, 'op.b': R(1, 2), 'op.c': R(1, 2) },
  'q5-abs-solve-sum': { 'op.a': 5, 'op.b': -2, sum: 3 },
  'q5-abs-ineq-count': { 'op.a': -5, 'op.b': 3, cnt: 7 },
  'q5-abs-diff-qc': { 'same.a': 1, 'same.b': 3, 'opp.a': 3, 'opp.b': 3 },
  'q5-abs-no-solution': { op: 1 - 3, cnt: 0 },
  'q5-abs-expression': { 'chk.a': Math.abs(-5 + 2), 'chk.b': 5 - 2 },
  'q5-sys-substitution': { x: 3, y: 5 },
  'q5-sys-coins': { 'eqs.c': 30, 'eqs.v': 240, op: 150, d: 18 },
  'q5-sys-no-solution': { op: 4 / 2, k: 6 },
  'q5-sys-qc': { x: 7, y: 3 },
  'q5-sys-three-sums': { op: 11 + 15 + 14, s: 20, L1: 15 - 11, c: 9 },
  'q5-sys-elimination-scale': { 'mult.a': 2, 'mult.b': 5, op: 2 + 150, 'xy.x': 8, 'xy.y': -3, v: 11 },
};
