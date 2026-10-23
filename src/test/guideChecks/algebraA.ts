import { R, type StepChecks } from './types';

const solve = (f: (x: number) => boolean, lo = -100, hi = 100) => {
  for (let x = lo; x <= hi; x++) if (f(x)) return x;
  throw new Error('no solution');
};

export const ALGEBRA_A: StepChecks = {
  'al-diff-squares': (() => {
    const x = solve((x) => x * x - (12 - x) ** 2 === 48);
    return { xy: x - (12 - x), lin: x };
  })(),
  'al-fraction-power-qc': { 'vals.a': R(1, 16), 'vals.b': Math.sqrt(1 / 4) },
  'p2-root-add': { 'pf.a': 48 / 3, 'pf.b': 27 / 3, 'coef.p': Math.sqrt(16), 'coef.q': Math.sqrt(9), sum: (Math.sqrt(48) + Math.sqrt(27)) / Math.sqrt(3) },
  'b3-remainder-250': { r: 250 % 12 },
  'b3-sqrt-decimal': { 'frac.a': 81, 'frac.b': 100, dec: Math.sqrt(0.81) },
  'b3-dependent-system-qc': { y0: 12 / 3, x0: 12 / 2 },
  'b3-interval-must': { sq: 2.5 * 2.5 },
  'b3-alg-frac-eval': { v: (7 * 7 - 9) / (7 - 3) },
  'b3-reciprocal-sum': { xy: 18 * 2 },
  'b3-function-qc': { f1: 1 - 4, f3: 9 - 12 },
  'qc-neg-cube': { 'test.a': (-2) ** 2, 'test.b': (-2) ** 3 },
  'qc-zero-square': { 'z.a': 0, 'z.b': 0, 't.a': 4, 't.b': 2 },
  'qc-abs-neg': { 't.a': Math.abs(-3), 't.b': 3 },
  'qc-exp-gt1': { 't.a': 1.5 ** 3, 't.b': 1.5 ** 2 },
  'qc-exp-neg-frac': { 't.a': R(-1, 8), 't.b': R(1, 4) },
  'b4-qc-decimal-square': { sq: 0.3 * 0.3 },
  'b4-qf-irrational': { 'abc.a': 1, 'abc.b': -4, 'abc.c': 1, disc: 16 - 4 },
  'b4-exp-negative': { num: -3 + 5, prod: (1 / 8) * 32, e: 2 - -1, v: (2 ** -3 * 2 ** 5) / 2 ** -1, 'op.a': R(1, 8), 'op.b': 32, 'op.c': R(1, 2) },
  'b4-mixed-rect-quad': { L: solve((w) => w > 0 && w * (w + 3) === 40) + 3, w: solve((w) => w > 0 && w * (w + 3) === 40) },
};
