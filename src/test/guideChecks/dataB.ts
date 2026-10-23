import { R, type StepChecks } from './types';

const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
const C = (n: number, k: number) => fact(n) / (fact(k) * fact(n - k));
const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const variance = (xs: number[]) => mean(xs.map((x) => (x - mean(xs)) ** 2));
const find = (f: (x: number) => boolean) => {
  for (let x = 0; x <= 500; x++) if (f(x)) return x;
  throw new Error('none');
};

export const DATA_B: StepChecks = {
  'da-mean-median-qc': { op: 30, mean: mean([2, 4, 6, 8, 10]), mid: 6 },
  'da-greatest-sd': { op: mean([1, 10, 10, 19]), L1: variance([1, 10, 10, 19]), v2: variance([7, 9, 11, 13]) },
  'p2-function-compose': { g3: 9, f9: 2 * 9 - 1 },
  'p2-symbol-function': (() => {
    const d = (a: number, b: number) => a * b - a + b;
    return { inner: d(2, 4), outer: d(3, d(2, 4)) };
  })(),
  'p2-weighted-qc': { avg: (30 * 60 + 10 * 80) / 40, op: 30 * 60 + 10 * 80 },
  'p2-pair-together': { op: fact(4), in: 2, tot: fact(4) * 2, L1: 4 },
  'p2-code-count': { 'slots.a': 10, 'slots.b': 9, 'slots.c': 3, tot: 10 * 9 * 3 },
  'p2-sd-transform-qc': { op: 5 * 2 },
  'b3-ratio-difference': { op: 12 / (5 - 4), tot: (12 / (5 - 4)) * 9 },
  'b3-ratio-chain': { 'op.a': 2 * 4, 'op.c': 5 * 3, L: R(8, 15) },
  'b3-inverse-pumps': { op: 5 * 12, t: (5 * 12) / 6 },
  'b3-direct-square': { k: 12 / 4, y: (12 / 4) * 25 },
  'b3-typing-rate': { op: 8100 / 45, h: 8100 / 45 / 60 },
  'b3-machines-variable': { 'op.m': 2, 'op.t': 3 },
  'b3-train-time': { t: 240 / 60 },
  'b3-opposite-cars': { op: 45 + 55, t: 350 / (45 + 55) },
  'b3-pump-fraction': { t: 3 / 5 / (1 / 5) },
  'b3-work-find-b': { rb: R(1, 15), tb: 1 / (1 / 6 - 1 / 10) },
  'b3-simplify-expr': (() => {
    const f = (x: number) => 3 * (x - 2) + 2 * (x + 5);
    return { 'comb.a': f(1) - f(0), 'comb.b': f(0) };
  })(),
  'b3-y-intercept': { b: 5 - 3 * 2 },
  'b3-perp-slope-qc': { mk: -2, mm: R(1, 2) },
  'b3-mean-six': { op: 4 + 8 + 15 + 16 + 23 + 42, m: mean([4, 8, 15, 16, 23, 42]) },
  'b3-median-mean-qc': { med: 7, low: (27 + 10) / 5 },
  'b3-weighted-b-size': { 'dist.a': 74 - 70, 'dist.b': 76 - 74, b: find((b) => 20 * 70 + 76 * b === 74 * (20 + b)) },
  'b3-die-less-3': { tot: 6, op: [1, 2, 3, 4, 5, 6].filter((x) => x < 3).length, p: R(1, 3) },
  'b3-sd-zero': { dev: 5 - 5 },
  'b3-books-arrange': { 'op.a': 4, 'op.b': 3, 'op.c': 2, 'op.d': 1, v: fact(4) },
  'b3-letters-perm': { 'slots.a': 5, 'slots.b': 4, 'slots.c': 3, v: 5 * 4 * 3 },
  'b3-handshakes': { ord: 6 * 5, v: C(6, 2) },
  'b3-at-least-one-man': { op: C(9, 3), none: C(5, 3), v: C(9, 3) - C(5, 3), two: C(4, 2) * 5, L1: 4 * C(5, 2) },
  'b3-venn-neither': { op: 18 + 15 - 7, v: 30 - (18 + 15 - 7) },
  'b3-venn-min-qc': { op: 30 + 35 - 50, max: Math.min(30, 35) },
  'b4-proportion-recipe': { op: 10 / 4, x: (3 / 4) * 10 },
  'b4-rate-printer': { rate: 45 / 3, t: 270 / (45 / 3), op: 270 / 45 },
  'b4-drt-meet': { op: 40 + 60, t: 300 / 100 },
  'b4-linear-backsolve': { x: find((x) => 5 * (x - 2) === 3 * x + 6) },
  'b4-function-compose': { g3: 9, f9: 2 * 9 + 1 },
  'b4-midpoint': { 'op.x': (-2 + 6) / 2, 'op.y': (5 + -1) / 2, s: 4 },
  'b4-parallel-slope-qc': { m: R(3, 2) },
  'b4-word-ages': { 'exp.a': 3, 'exp.b': 10, b: find((b) => b > 0 && 3 * b + 10 === 2 * (b + 10)) },
  'b4-weighted-coffee': { op: 3 * 4 + 2 * 9, p: (3 * 4 + 2 * 9) / 5 },
  'b4-perm-shelf': { 'slots.a': 6, 'slots.b': 5, 'slots.c': 4, 'slots.d': 3, v: fact(6) / fact(2) },
  'b4-combo-choose3': { op: 8 * 7 * 6, v: C(8, 3) },
  'b4-venn-neither': { op: 25 + 18 - 7, v: 40 - 36 },
};
