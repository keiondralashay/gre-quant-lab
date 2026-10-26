import type { StepChecks } from '../guideChecks/types';
import type { Check } from '../verifyBank3';

const ints = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const digitSum = (n: number) => String(n).split('').reduce((s, d) => s + Number(d), 0);
const mod = (a: number, m: number) => ((a % m) + m) % m;
const qc = (pairs: [number, number][]) => {
  const rel = new Set(pairs.map(([a, b]) => (a > b ? 'A' : a < b ? 'B' : 'C')));
  return rel.size === 1 ? ([...rel][0] as 'A' | 'B' | 'C') : 'D';
};
const idx = (i: number, n = 5): Check => ({ value: i, choiceValues: ints(0, n - 1) });

export const VERIFY_NUMEXP_B: Record<string, () => Check> = {
  'q5-div-missing-digit': () => {
    const a = ints(0, 9).filter((d) => (7062 + 100 * d) % 9 === 0);
    if (a.length !== 1) throw new Error(String(a));
    return { value: a[0] };
  },
  'q5-div-six-multi': () => ({ multi: [114, 222, 345, 408, 512].map((n, i) => (n % 6 === 0 ? i : -1)).filter((i) => i >= 0) }),
  'q5-div-count-or': () => ({ value: ints(1, 100).filter((n) => n % 3 === 0 || n % 5 === 0).length }),
  'q5-div-lcm-qc': () => ({ qc: qc(ints(1, 500).filter((n) => n % 4 === 0 && n % 6 === 0).map((n) => [n % 12, 0])) }),
  'q5-div-consecutive': () => {
    const ds = [4, 5, 6, 7, 9];
    const ok = ds.map((d, i) => (ints(-30, 30).every((n) => mod(n ** 3 - n, d) === 0) ? i : -1)).filter((i) => i >= 0);
    if (ok.length !== 1) throw new Error(String(ok));
    return idx(ok[0]);
  },
  'q5-np-parity-qc': () => {
    const s: [number, number][] = [];
    for (const a of ints(-15, 15)) for (const b of ints(-15, 15)) if (mod(a + b, 2) === 1) s.push([mod(a * b, 2), 0]);
    return { qc: qc(s) };
  },
  'q5-int-consecutive-sum': () => ({ value: ints(-100, 100).filter((n) => 4 * n + 6 === 74).map((n) => n + 3)[0] }),
  'q5-int-sign-multi': () => {
    const fs = [(a: number, b: number) => a + b, (a: number, b: number) => a - b, (a: number, b: number) => a * b, (a: number, b: number) => b - a, (a: number, b: number) => a * a - b * b];
    const pairs: [number, number][] = [];
    for (const a of ints(-40, -1).map((x) => x / 4)) for (const b of ints(1, 40).map((x) => x / 4)) if (Math.abs(a) > b) pairs.push([a, b]);
    return { multi: fs.map((f, i) => (pairs.every(([a, b]) => f(a, b) < 0) ? i : -1)).filter((i) => i >= 0) };
  },
  'q5-int-count-between': () => ({ value: ints(-10, 10).filter((x) => x > -3.5 && x < 4.2).length }),
  'q5-rem-sum': () => {
    const rs = new Set<number>();
    for (const n of ints(0, 60).filter((x) => x % 5 === 3)) for (const m of ints(0, 60).filter((x) => x % 5 === 4)) rs.add((n + m) % 5);
    if (rs.size !== 1) throw new Error('not unique');
    return { value: [...rs][0] };
  },
  'q5-rem-largest-two-digit': () => ({ value: Math.max(...ints(10, 99).filter((n) => n % 7 === 3)) }),
  'q5-rem-qc': () => ({ qc: qc(ints(1, 600).filter((n) => n % 6 === 4).map((n) => [n % 3, 1])) }),
  'q5-rem-power': () => ({ value: Number(2n ** 20n % 7n) }),
  'q5-rem-weekday': () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return idx(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'].indexOf(days[100 % 7]));
  },
  'q5-pattern-units-3': () => idx(['1', '3', '7', '9', '5'].indexOf(String(3n ** 47n % 10n))),
  'q5-pattern-arith-sum': () => ({ value: ints(0, 19).reduce((s, k) => s + 2 + 3 * k, 0) }),
  'q5-pattern-geometric': () => {
    let t = 3;
    for (let k = 2; k <= 8; k++) t *= 2;
    return { value: t };
  },
};

export const STEPS_NUMEXP_B: StepChecks = {
  'q5-div-missing-digit': { op: 7 + 6 + 2, a: 3 },
  'q5-div-six-multi': { 'ds.a': digitSum(408), 'ds.b': digitSum(512) },
  'q5-div-count-or': { 'op.a': Math.floor(100 / 3), 'op.b': Math.floor(100 / 5), 'op.c': Math.floor(100 / 15), v: 47 },
  'q5-div-lcm-qc': { lcm: 12 },
  'q5-div-consecutive': { test: 2 ** 3 - 2 },
  'q5-np-parity-qc': { rem: 0 },
  'q5-int-consecutive-sum': { op: 74 / 4, big: 20, L1: (74 - 6) / 4 },
  'q5-int-sign-multi': { 'vals.a': -5 + 2, 'vals.b': 2 - -5, 'vals.c': 25 - 4 },
  'q5-int-count-between': { 'ends.a': -3, 'ends.b': 4, cnt: 8 },
  'q5-rem-sum': { op: 3 + 4, rem: 7 % 5 },
  'q5-rem-largest-two-digit': { op: Math.floor((99 - 3) / 7), v: 7 * 13 + 3 },
  'q5-rem-qc': { rem: 4 % 3 },
  'q5-rem-power': { 'cyc.a': 2 % 7, 'cyc.b': 4 % 7, 'cyc.c': 8 % 7, op: 3, pos: 20 % 3, rem: 4 },
  'q5-rem-weekday': { len: 7, op: 100 % 7 },
  'q5-pattern-units-3': { 'cyc.a': 3, 'cyc.b': 9, 'cyc.c': 27 % 10, 'cyc.d': 81 % 10, op: 47 % 4, dig: 7 },
  'q5-pattern-arith-sum': { 'parts.a': 2, 'parts.d': 3, op: 2 + 19 * 3, avg: (2 + 59) / 2, sum: 610 },
  'q5-pattern-geometric': { op: 7, v: 3 * 2 ** 7 },
};
