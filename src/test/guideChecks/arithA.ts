import { R, type StepChecks } from './types';

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const digitSum = (n: number) => String(n).split('').reduce((s, d) => s + Number(d), 0);
const pexp = (n: number, p: number) => {
  let e = 0;
  while (n % p === 0) {
    n /= p;
    e++;
  }
  return e;
};

export const ARITH_A: StepChecks = {
  'ar-pct-change-qc': { op: ((50 - 40) / 40) * 100, dec: ((50 - 40) / 50) * 100 },
  'ar-odd-even-multi': { 'vals.a': 1 + 1, 'vals.b': 2 * 1 + 1, 'vals.c': 1, 'vals.d': 1 + 1, 'vals.e': 3 - 1 },
  'ar-factors-36-qc': (() => {
    let n = 0;
    for (let k = 1; k <= 36; k++) if (36 % k === 0) n++;
    return { 'pf.a': pexp(36, 2), 'pf.b': pexp(36, 3), cnt: n };
  })(),
  'p2-fraction-ops': { 'nd.n': 3 * 8 * 3, 'nd.d': 4 * 9 * 2, v: (3 / 4) * (8 / 9) / (2 / 3), op: R(2, 3) },
  'p2-decimal-divide': { 'op.a': 42, 'op.b': 60, v: 0.0042 / 0.006 },
  'p2-divisible-digit': { sum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => (3502 + 10 * d) % 12 === 0 && [1, 2, 5, 7, 8].includes(d))[0] },
  'p2-consecutive-odd': (() => {
    const n = (85 - 20) / 5;
    return { mid: 85 / 5, top: n + 8, n };
  })(),
  'b3-odd-primes-qc': { rem: (3 + 5) % 2 },
  'b3-fraction-compare-qc': { 'op.a': 7 * 14, 'op.b': 9 * 11, op: (9 * 14) / gcd(9, 14), 'nums.a': (7 * 126) / 9, 'nums.b': (11 * 126) / 14 },
  'b3-three-changes': { 'mult.a': 1.25, 'mult.b': 0.8, 'mult.c': 1.1, op: 1.25 * 0.8, tot: 1.25 * 0.8 * 1.1, L1: 100 * 1.25, L2: 100 * 1.25 * 0.8, L3: 100 * 1.25 * 0.8 * 1.1 },
  'b3-div9-pick': { 'op.a': digitSum(2341), 'op.b': digitSum(4527) },
  'b3-lcm-qc': { op: 12 },
  'b3-lcm-basic': { 'pf.a': pexp(8, 2), 'pf.b': pexp(12, 2), lcm: (8 * 12) / gcd(8, 12) },
  'b3-ribbon-gcf': { op: gcd(gcd(48, 72), 120), cnt: (48 + 72 + 120) / gcd(gcd(48, 72), 120) },
  'b3-abs-arith': { 'op.a': Math.abs(-7), 'op.b': Math.abs(3 - 10), v: Math.abs(-7) - Math.abs(3 - 10) },
  'b3-seq-25th': { 'parts.a': 7, 'parts.d': 11 - 7, v: 7 + 24 * 4 },
  'b3-sum-multiples-5': (() => {
    const xs = Array.from({ length: 20 }, (_, i) => 5 * (i + 1));
    return { op: xs.length, avg: (5 + 100) / 2, sum: xs.reduce((s, x) => s + x, 0) };
  })(),
  'qc-integer-pin': { op: [1, 2, 3, 4, 5].filter((x) => x > 2 && x < 4)[0] },
  'b4-decimal-mult': { 'fr.a': 1 / 0.25, 'fr.b': 0.4 * 5, op: 0.25 * 0.4, v: 0.25 * 0.4 * 12 },
  'b4-pattern-cycle': { len: 5, op: 103 % 5 },
  'b4-mixed-pct-ratio': { 'cnt.b': (30 * 3) / 5, 'cnt.g': (30 * 2) / 5, 'op.b': 0.5 * 18, 'op.g': 0.75 * 12, pct: ((9 + 9) / 30) * 100 },
  'b4-strategy-odd': { 'op.a': 1, 'op.b': 3, 'op.c': 3, 'op.d': 2, 'op.e': 3 },
};
