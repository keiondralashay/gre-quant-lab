import { R, type StepChecks } from '../guideChecks/types';
import type { Check } from '../verifyBank3';

const ints = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const lcm = (a: number, b: number) => (a * b) / gcd(a, b);
const isPrime = (n: number) => n > 1 && ints(2, Math.floor(Math.sqrt(n))).every((d) => n % d !== 0);
const divisors = (n: number) => ints(1, n).filter((d) => n % d === 0);
const isSquare = (n: number) => Number.isInteger(Math.sqrt(n));
const pexp = (n: number, p: number) => {
  let e = 0;
  while (n % p === 0) {
    n /= p;
    e++;
  }
  return e;
};

export const VERIFY_NUMEXP_A: Record<string, () => Check> = {
  'q5-exp-product-power': () => ({ value: Math.log2(((2 ** 3) ** 2 * 2 ** 4) / 2 ** 5) }),
  'q5-exp-solve-base': () => ({ value: ints(-20, 20).filter((x) => 9 ** (x + 1) === 27 ** x)[0] }),
  'q5-exp-sum-same': () => ({ value: Math.round(Math.log(3 * 3 ** 20) / Math.log(3)) }),
  'q5-exp-qc-bases': () => ({ qc: 2n ** 30n > 3n ** 20n ? 'A' : 2n ** 30n < 3n ** 20n ? 'B' : 'C' }),
  'q5-exp-neg-base-multi': () => {
    const vals = [(-2) ** 4, -(2 ** 4), (-2) ** 3, (-1 / 2) ** 2, -((-2) ** 2)];
    return { multi: vals.map((v, i) => (v > 0 ? i : -1)).filter((i) => i >= 0) };
  },
  'q5-exp-zero-neg': () => ({ value: (5 ** 0 + 5 ** 1) * 2 ** -1 }),
  'q5-root-simplify': () => ({ value: Math.sqrt(72), choiceValues: [6 * Math.SQRT2, 2 * Math.sqrt(6), 8 * Math.sqrt(3), 3 * Math.sqrt(6), 36 * Math.SQRT2] }),
  'q5-root-multiply': () => ({ value: Math.sqrt(8) * Math.sqrt(18) }),
  'q5-root-rationalize': () => ({ value: 6 / Math.sqrt(3), choiceValues: [2 * Math.sqrt(3), 3 * Math.SQRT2, 6 * Math.sqrt(3), 2, Math.sqrt(3) / 2] }),
  'q5-root-sum-qc': () => {
    const a = Math.sqrt(16 + 9);
    const b = Math.sqrt(16) + Math.sqrt(9);
    return { qc: a > b ? 'A' : a < b ? 'B' : 'C' };
  },
  'q5-root-estimate': () => {
    const cs = [8, 9, 10, 11, 45];
    const d = cs.map((c) => Math.abs(c - Math.sqrt(90)));
    return { value: d.indexOf(Math.min(...d)), choiceValues: [0, 1, 2, 3, 4] };
  },
  'q5-root-cube': () => ({ value: -Math.cbrt(64) + Math.sqrt(64) }),
  'q5-pf-distinct': () => ({ value: divisors(630).filter(isPrime).length }),
  'q5-pf-divisor-count': () => ({ value: divisors(72).length }),
  'q5-gcf-lcm-product': () => ({ value: ints(1, 500).filter((n) => gcd(18, n) === 6 && lcm(18, n) === 72)[0] }),
  'q5-lcm-bells': () => ({ value: ints(1, 1000).find((t) => t % 12 === 0 && t % 18 === 0)! }),
  'q5-gcf-tiles': () => ({ value: Math.max(...ints(1, 60).filter((s) => 84 % s === 0 && 60 % s === 0)) }),
  'q5-pf-square': () => ({ value: ints(1, 1000).find((k) => isSquare(180 * k))! }),
  'q5-pf-trailing-zeros': () => {
    let f = 1n;
    for (let i = 1n; i <= 25n; i++) f *= i;
    const s = f.toString();
    return { value: s.length - s.replace(/0+$/, '').length };
  },
  'q5-gcf-lcm-qc': () => ({ qc: gcd(24, 36) * lcm(24, 36) === 24 * 36 ? 'C' : gcd(24, 36) * lcm(24, 36) > 24 * 36 ? 'A' : 'B' }),
};

export const STEPS_NUMEXP_A: StepChecks = {
  'q5-exp-product-power': { 'parts.i': 3, 'parts.o': 2, num: 6 + 4, n: 5, op: ((2 ** 3) ** 2 * 2 ** 4) / 2 ** 5 },
  'q5-exp-solve-base': { 'base.a': Math.log(9) / Math.log(3), 'base.b': Math.log(27) / Math.log(3), x: 2 },
  'q5-exp-sum-same': { n: 21 },
  'q5-exp-qc-bases': { 'rw.a': 30 / 10, 'rw.b': 20 / 10, 'op.a': 2 ** 3, 'op.b': 3 ** 2 },
  'q5-exp-neg-base-multi': { 'op.a': (-2) ** 4, 'op.b': -(2 ** 4), 'op.c': (-2) ** 3, 'rest.d': R(1, 4), 'rest.e': -((-2) ** 2) },
  'q5-exp-zero-neg': { 'defs.a': 5 ** 0, 'defs.b': 2 ** -1, op: 5 ** 0 + 5 ** 1, v: 3 },
  'q5-root-simplify': { sq: Math.max(...ints(1, 72).filter((k) => isSquare(k) && 72 % k === 0)), coef: 6 },
  'q5-root-multiply': { op: 8 * 18, v: Math.sqrt(144), 'op.a': Math.sqrt(8) / Math.SQRT2, 'op.b': Math.sqrt(18) / Math.SQRT2 },
  'q5-root-rationalize': { sq: 3 },
  'q5-root-sum-qc': { a: Math.sqrt(25), b: 4 + 3 },
  'q5-root-estimate': { 'sq.a': 81, 'sq.b': 100, op: 9.5 * 9.5 },
  'q5-root-cube': { 'roots.a': -Math.cbrt(64), 'roots.b': Math.sqrt(64), v: 4 },
  'q5-pf-distinct': { 'pf.a': pexp(630, 2), 'pf.b': pexp(630, 3), 'pf.c': pexp(630, 5), 'pf.d': pexp(630, 7), cnt: 4 },
  'q5-pf-divisor-count': { 'pf.a': pexp(72, 2), 'pf.b': pexp(72, 3), cnt: divisors(72).length, op: divisors(72).length / 2 },
  'q5-gcf-lcm-product': { op: 6 * 72, b: (6 * 72) / 18 },
  'q5-lcm-bells': { v: lcm(12, 18), 'op.a': pexp(lcm(12, 18), 2), 'op.b': pexp(lcm(12, 18), 3) },
  'q5-gcf-tiles': { 'op.a': pexp(gcd(84, 60), 2), 'op.b': pexp(gcd(84, 60), 3), g: gcd(84, 60), op: 84 - 60 },
  'q5-pf-square': { 'pf.a': pexp(180, 2), 'pf.b': pexp(180, 3), 'pf.c': pexp(180, 5), k: 5 },
  'q5-pf-trailing-zeros': { op: Math.floor(25 / 5), extra: Math.floor(25 / 25), z: 6 },
  'q5-gcf-lcm-qc': { 'gl.g': gcd(24, 36), 'gl.l': lcm(24, 36), a: gcd(24, 36) * lcm(24, 36), b: 24 * 36 },
};
