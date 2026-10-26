import { R, type StepChecks } from '../guideChecks/types';
import type { Check } from '../verifyBank3';

const ints = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const roots = (a: number, b: number, c: number) => {
  const d = b * b - 4 * a * c;
  return d < 0 ? [] : [(-b - Math.sqrt(d)) / (2 * a), (-b + Math.sqrt(d)) / (2 * a)];
};
const near = (x: number, y: number) => Math.abs(x - y) < 1e-9;
/** Index of the only choice-expression that equals f at many sample points. */
const sameFn = (f: (x: number) => number, gs: ((x: number) => number)[]) => {
  const xs = [-3.7, -1.2, 0.5, 1.9, 4.3, 7.1];
  const ok = gs.map((g, i) => (xs.every((x) => near(f(x), g(x))) ? i : -1)).filter((i) => i >= 0);
  if (ok.length !== 1) throw new Error(`expected one equivalent choice, got ${ok}`);
  return { value: ok[0], choiceValues: gs.map((_, i) => i) } as Check;
};

export const VERIFY_QUAD: Record<string, () => Check> = {
  'q5-quad-sum-roots': () => {
    const rs = ints(-50, 50).filter((x) => x * x - 9 * x + 14 === 0);
    return { value: rs.reduce((s, x) => s + x, 0), choiceValues: [-9, 5, 7, 9, 14] };
  },
  'q5-quad-perfect-square': () => ({ value: ints(-50, 50).filter((x) => x * x + 10 * x + 25 === 0)[0] }),
  'q5-factor-gcf-first': () => sameFn((x) => 3 * x * x - 12 * x, [(x) => 3 * x * (x - 4), (x) => 3 * x * (x + 4), (x) => 3 * (x - 2) * (x + 2), (x) => x * (3 * x - 4), (x) => 3 * x * x * (1 - 4 * x)]),
  'q5-factor-trinomial-a': () => {
    const p = (x: number) => 2 * x * x + x - 15;
    // A linear factor (mx + k) divides p exactly when p(−k/m) = 0.
    const facs: [number, number][] = [[1, 3], [1, -3], [2, 5], [1, 5], [2, -3]];
    const ok = facs.map(([m, k], i) => (near(p(-k / m), 0) ? i : -1)).filter((i) => i >= 0);
    if (ok.length !== 1) throw new Error(String(ok));
    return { value: ok[0], choiceValues: [0, 1, 2, 3, 4] };
  },
  'q5-diff-squares-number': () => ({ value: 51 ** 2 - 49 ** 2 }),
  'q5-qf-discriminant-k': () => ({ value: ints(-100, 100).filter((k) => 36 - 4 * k === 0)[0] }),
  'q5-qf-roots-numeric': () => {
    const [lo, hi] = roots(2, -4, -1);
    const pairs: [number, number][] = [[(2 - Math.sqrt(6)) / 2, (2 + Math.sqrt(6)) / 2], [(2 - Math.SQRT2) / 2, (2 + Math.SQRT2) / 2], [1 - Math.sqrt(6), 1 + Math.sqrt(6)], [(-2 - Math.sqrt(6)) / 2, (-2 + Math.sqrt(6)) / 2], [2 - Math.sqrt(6), 2 + Math.sqrt(6)]];
    const ok = pairs.map(([a, b], i) => (near(a, lo) && near(b, hi) ? i : -1)).filter((i) => i >= 0);
    return { value: ok[0], choiceValues: [0, 1, 2, 3, 4] };
  },
  'q5-qf-sum-product-qc': () => {
    const [r, s] = roots(1, -5, 3);
    return { qc: r + s > r * s ? 'A' : r + s < r * s ? 'B' : 'C' };
  },
  'q5-algfrac-add': () => sameFn((x) => 1 / x + 1 / (2 * x), [(x) => 3 / (2 * x), (x) => 2 / (3 * x), (x) => 1 / (3 * x), (x) => 3 / x, (x) => 2 / x]),
  'q5-algfrac-solve': () => ({ value: ints(-100, 100).filter((x) => x !== 2 && x !== -2 && 3 * (x + 2) === 5 * (x - 2))[0] }),
  'q5-algfrac-cancel': () => sameFn((x) => ((x * x - 9) / (x * x + 6 * x + 9)) * ((x + 3) / (x - 3)), [() => 1, (x) => (x - 3) / (x + 3), (x) => x + 3, () => 0, (x) => (x + 3) / (x - 3)]),
  'q5-algfrac-qc': () => {
    const xs = Array.from({ length: 200 }, (_, i) => 0.05 + i * 0.37);
    const rel = new Set(xs.map((x) => ((x * x + x) / x - (x + 1) > 1e-9 ? 'A' : (x * x + x) / x - (x + 1) < -1e-9 ? 'B' : 'C')));
    return { qc: rel.size === 1 ? ([...rel][0] as 'A' | 'B' | 'C') : 'D' };
  },
  'q5-quad-consecutive-even': () => ({ value: ints(1, 100).filter((n) => n % 2 === 0 && n * (n + 2) === 168).map((n) => n + 2)[0] }),
  'q5-quad-multi-roots': () => ({ multi: [-5, -3, 3, 5, 15].map((x, i) => (x * x + 2 * x - 15 === 0 ? i : -1)).filter((i) => i >= 0) }),
};

export const STEPS_QUAD: StepChecks = {
  'q5-quad-sum-roots': { 'abc.a': 1, 'abc.b': -9, 'abc.c': 14, sum: 9, 'op.p': -7, 'op.q': -2 },
  'q5-quad-perfect-square': { 'abc.a': 1, 'abc.b': 10, 'abc.c': 25, x: -5, disc: 100 - 100 },
  'q5-factor-gcf-first': { op: 3 - 12, chk: 3 * 1 * (1 - 4) },
  'q5-factor-trinomial-a': { 'abc.a': 2, 'abc.b': 1, 'abc.c': -15, 'op.p': 6, 'op.q': -5, val: 2 * 9 - 3 - 15 },
  'q5-diff-squares-number': { 'op.s': 51 + 49, 'op.d': 51 - 49, v: 200, 'op.a': 51 ** 2, 'op.b': 49 ** 2 },
  'q5-qf-discriminant-k': { 'abc.a': 1, 'abc.b': 6, k: 36 / 4 },
  'q5-qf-roots-numeric': { 'abc.a': 2, 'abc.b': -4, 'abc.c': -1, op: 16 - 4 * 2 * -1, den: 4 },
  'q5-qf-sum-product-qc': { 'abc.a': 1, 'abc.b': -5, 'abc.c': 3, 'op.s': 5, 'op.p': 3 },
  'q5-algfrac-add': { num: 3, op: R(3, 2) },
  'q5-algfrac-solve': { 'exp.a': 6, 'exp.b': 10, x: 8 },
  'q5-algfrac-cancel': { 'fac.a': 3, 'fac.b': 3, v: 1, op: -9 / 9 },
  'q5-quad-consecutive-even': { big: 14 },
  'q5-quad-multi-roots': { 'abc.a': 1, 'abc.b': 2, 'abc.c': -15, 'op.p': 5, 'op.q': -3, 'roots.r1': -5, 'roots.r2': 3 },
};
