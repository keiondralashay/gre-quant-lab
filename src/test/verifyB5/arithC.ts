import { R, type StepChecks } from '../guideChecks/types';
import type { Check } from '../verifyBank3';

const ints = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
const rel = (a: number, b: number) => (near(a, b) ? 'C' : a > b ? 'A' : 'B');
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
/** Simulate a fill process in small time steps; returns time when level reaches 1. */
const simulate = (rate: number, dt = 1e-4) => {
  let level = 0;
  let t = 0;
  while (level < 1 - 1e-12) {
    level += rate * dt;
    t += dt;
    if (t > 1e4) throw new Error('never');
  }
  return Math.round(t * 1000) / 1000;
};

export const VERIFY_ARITH_C: Record<string, () => Check> = {
  'q5-fr-of-remainder': () => {
    const start = 120;
    const afterBooks = start - start / 3;
    return { value: (afterBooks - afterBooks / 4) / start };
  },
  'q5-fr-complex': () => ({ value: (1 / 2 + 1 / 3) / (1 / 4) }),
  'q5-fr-compare-qc': () => ({ qc: rel(5 / 8, 7 / 11) }),
  'q5-fr-what-fraction-of': () => ({ value: ints(1, 100).flatMap((d) => ints(1, d).map((n) => n / d)).find((x) => near(x * (3 / 4), 1 / 6))! }),
  'q5-dec-product': () => ({ value: (25 * 4) / 10000 }),
  'q5-dec-divide': () => ({ value: 360 / 12 }),
  'q5-dec-repeating': () => {
    // Sum the geometric series 36/100 + 36/100² + …
    let x = 0;
    for (let k = 1; k < 30; k++) x += 36 / 100 ** k;
    return { value: x, choiceValues: [4 / 11, 9 / 25, 3 / 11, 2 / 5, 3 / 8] };
  },
  'q5-dec-place-qc': () => ({ qc: rel(Math.floor(((3 / 8) * 1000) % 10), 5) }),
  'q5-pc-successive': () => ({ value: Math.round(100 * 1.2 * 0.75 * 1e9) / 1e9 }),
  'q5-pc-reverse': () => ({ value: ints(1, 500).filter((p) => near(p * 0.85, 68))[0] }),
  'q5-pc-up-down-qc': () => ({ qc: rel(((50 - 40) / 40) * 100, ((50 - 40) / 50) * 100) }),
  'q5-pc-compound': () => {
    let p = 5000;
    for (let y = 0; y < 2; y++) p += p * 0.1;
    return { value: Math.round(p * 1e6) / 1e6 };
  },
  'q5-pc-percent-more': () => {
    const B = 40;
    const A = B * 0.75;
    return { value: ((B - A) / A) * 100 };
  },
  'q5-prop-recipe': () => ({ value: (3 * 10) / 4 }),
  'q5-prop-map': () => ({ value: 3.2 * 25 }),
  'q5-prop-inverse-workers': () => ({ value: (6 * 10) / 15 }),
  'q5-prop-direct-variation': () => {
    const k = 12 / 8;
    return { value: k * 10 };
  },
  'q5-prop-inverse-square': () => {
    const k = 9 * 2 ** 2;
    return { value: k / 3 ** 2 };
  },
  'q5-prop-unit-convert': () => ({ value: (72 * 1000) / (60 * 60) }),
  'q5-drt-avg-speed': () => {
    const d = 7; // any distance
    return { value: (2 * d) / (d / 60 + d / 40) };
  },
  'q5-drt-meet': () => {
    const t = ints(0, 1000).map((k) => k / 100).find((s) => near(70 * s + 50 * s, 300))!;
    return { value: t };
  },
  'q5-drt-catch-up': () => ({ value: ints(0, 1000).map((k) => k / 100).find((t) => near(60 * t, 40 * (t + 1)))! }),
  'q5-drt-time-qc': () => ({ qc: rel(150 / 50, 200 / 60) }),
  'q5-drt-current': () => ({ value: 45 / (12 + 3) }),
  'q5-drt-distance': () => ({ value: 44 * (1 + 30 / 60) }),
  'q5-rate-typing': () => ({ value: 3600 / 45 }),
  'q5-rate-unit-price-qc': () => ({ qc: rel(3 / 12, 4.8 / 20) }),
  'q5-work-two-pipes': () => ({ value: simulate(1 / 6 + 1 / 3) }),
  'q5-work-fill-drain': () => ({ value: simulate(1 / 4 - 1 / 6, 1e-3) }),
  'q5-work-one-alone': () => ({ value: ints(1, 100).filter((b) => near(1 / 6 + 1 / b, 1 / 4))[0] }),
  'q5-work-partial': () => ({ value: ints(1, 100).filter((d) => near(4 / 10 + 9 / d, 1))[0] }),
  'q5-work-machines-qc': () => ({ qc: rel(1 / (3 / 6), 2) }),
  'q5-nt-gcf-lcm-product': () => {
    const ok = ints(1, 1000).filter((n) => gcd(18, n) === 6 && (18 * n) / gcd(18, n) === 72);
    if (ok.length !== 1) throw new Error(String(ok));
    return { value: ok[0] };
  },
  'q5-abs-diff-vs-qc': () => ({ qc: rel(Math.abs(-7) - Math.abs(3), Math.abs(-7 - 3)) }),
  'q5-qf-larger-root': () => {
    // Bisection for the root of x² − 4x − 1 in [4, 5].
    let lo = 4, hi = 5;
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      if (mid * mid - 4 * mid - 1 > 0) hi = mid;
      else lo = mid;
    }
    const s5 = Math.sqrt(5);
    return { value: lo, choiceValues: [2 + s5, 4 + s5, 2 - s5, -2 + s5, 2 + 2 * s5] };
  },
  'q5-qf-one-solution-k': () => {
    const ks = ints(-50, 50).filter((k) => {
      const roots = new Set(ints(-2000, 2000).map((t) => t / 100).filter((x) => near(x * x + 6 * x + k, 0)));
      return roots.size === 1 && 36 - 4 * k === 0;
    });
    return { value: ks[0] };
  },
  'q5-exp-combine': () => ({ value: (2 ** 3) ** 2 * 2 ** -4 }),
  'q5-af-simplify': () => {
    const f = (x: number) => (x * x - 9) / (x * x + 5 * x + 6);
    const cs = [(x: number) => (x - 3) / (x + 2), (x: number) => (x + 3) / (x + 2), (x: number) => (x - 3) / (x - 2), (x: number) => -9 / (5 * x + 6), (x: number) => (x - 9) / (5 * x + 6)];
    const xs = [0.5, 1, 4, 7.3, -5];
    const ok = cs.map((g, i) => (xs.every((x) => near(f(x), g(x))) ? i : -1)).filter((i) => i >= 0);
    if (ok.length !== 1) throw new Error(String(ok));
    return { value: ok[0], choiceValues: ints(0, 4) };
  },
  'q5-af-solve': () => ({ value: ints(1, 100).filter((x) => near(3 / x + 2 / (2 * x), 1))[0] }),
  'q5-wp-ages': () => {
    for (const s of ints(4, 36)) {
      const j = 36 - s;
      if (j - 3 === 2 * (s - 3)) return { value: j };
    }
    throw new Error('none');
  },
  'q5-sim-pentagon-perimeter': () => ({ value: (30 * 6) / 4 }),
  'q5-cg-square-from-side': () => ({ value: (4 - 1) ** 2 + (6 - 2) ** 2 }),
};

export const STEPS_ARITH_C: StepChecks = {
  'q5-fr-of-remainder': { k1: R(2, 3), v: R(1, 2), L1: 8 },
  'q5-fr-complex': { top: R(5, 6), v: R(10, 3) },
  'q5-fr-compare-qc': { 'op.a': 55, 'op.b': 56 },
  'q5-fr-what-fraction-of': { x: R(2, 9) },
  'q5-dec-product': { pl: 4, int: 100, v: 0.01 },
  'q5-dec-divide': { sc: 1000, 'op.a': 360, 'op.b': 12, v: 30 },
  'q5-dec-repeating': { den: 99, g: gcd(36, 99) },
  'q5-dec-place-qc': { dec: 0.375, d: 5 },
  'q5-pc-successive': { 'mult.a': 1.2, 'mult.b': 0.75, op: 0.9, v: 90, L1: 120 },
  'q5-pc-reverse': { m: 0.85, P: 80 },
  'q5-pc-up-down-qc': { 'op.a': 25, 'op.b': 20 },
  'q5-pc-compound': { y1: 5500, g: 550, v: 6050 },
  'q5-pc-percent-more': { 'pick.a': 75, 'pick.d': 25, v: R(100, 3) },
  'q5-prop-recipe': { u: 0.75, x: 7.5 },
  'q5-prop-map': { a: 75, d: 80 },
  'q5-prop-inverse-workers': { wd: 60, d: 4 },
  'q5-prop-direct-variation': { k: 1.5, y: 15 },
  'q5-prop-inverse-square': { k: 36, x2: 9, y: 4 },
  'q5-prop-unit-convert': { 'fac.m': 1000, 'fac.s': 3600, mh: 72000, v: 20 },
  'q5-drt-avg-speed': { 't.a': 120 / 60, 't.b': 120 / 40, v: 48 },
  'q5-drt-meet': { cs: 120, t: 2.5 },
  'q5-drt-catch-up': { 'gap.h': 40, 'gap.g': 20, t: 2 },
  'q5-drt-time-qc': { 'op.a': 3, 'op.b': R(10, 3) },
  'q5-drt-current': { s: 15, t: 3 },
  'q5-drt-distance': { t: 1.5, h: 22, d: 66 },
  'q5-rate-typing': { h: 45 * 80, t: 80 },
  'q5-rate-unit-price-qc': { 'u.x': 0.25, 'u.y': 0.24 },
  'q5-work-two-pipes': { 'r.a': R(1, 6), 'r.b': R(1, 3), op: R(1, 2), t: 2 },
  'q5-work-fill-drain': { net: R(1, 12), t: 12 },
  'q5-work-one-alone': { r: R(1, 12), b: 12 },
  'q5-work-partial': { left: R(3, 5), r: R(1, 15), d: 15 },
  'q5-work-machines-qc': { r: R(1, 2), t: 2 },
  'q5-nt-gcf-lcm-product': { prod: 432, n: 24 },
  'q5-abs-diff-vs-qc': { in: -10, 'op.a': 4, 'op.b': 10 },
  'q5-qf-larger-root': { 'abc.a': 1, 'abc.b': -4, 'abc.c': -1, D: 20 },
  'q5-qf-one-solution-k': { 'abc.a': 1, 'abc.b': 6, k: 9 },
  'q5-exp-combine': { e1: 6, e: 2, v: 4 },
  'q5-af-solve': { x: 4 },
  'q5-wp-ages': { S: 13, J: 23 },
  'q5-sim-pentagon-perimeter': { k: 1.5, P: 45 },
  'q5-cg-square-from-side': { 'd.x': 3, 'd.y': 4, s: 5, A: 25 },
};
