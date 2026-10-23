/** Independent computations for bank expansion 4. Merged into VERIFY in answerKeys.test.ts. */
import type { Check } from './verifyBank3';
import { qcRelation } from './verifyBank3';

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
const choiceIdx = (i: number, n = 5): Check => ({ value: i, choiceValues: range(0, n - 1) });
const only = <T,>(xs: T[]) => {
  if (xs.length !== 1) throw new Error(`expected one, got ${xs.length}`);
  return xs[0];
};

export const VERIFY_B4: Record<string, () => Check> = {
  'b4-decimal-mult': () => ({ value: 0.25 * 0.4 * 12 }),
  'b4-proportion-recipe': () => ({ value: (3 / 4) * 10 }),
  'b4-divisible-12': () => ({ multi: [132, 156, 184, 228, 246].map((n, i) => (n % 12 === 0 ? i : -1)).filter((i) => i >= 0) }),
  'b4-rate-printer': () => ({ value: 270 / (45 / 3) }),
  'b4-drt-meet': () => {
    // Simulate: positions after t hours until they meet.
    const t = only(range(1, 20).filter((h) => 40 * h + 60 * h === 300));
    return { value: t };
  },
  'b4-pattern-cycle': () => {
    const letters = 'ABCDE';
    let s = '';
    while (s.length < 103) s += letters;
    return choiceIdx(letters.indexOf(s[102]));
  },
  'b4-mixed-pct-ratio': () => {
    const boys = (30 * 3) / 5;
    const girls = 30 - boys;
    return { value: ((0.5 * boys + 0.75 * girls) / 30) * 100 };
  },
  'b4-qc-decimal-square': () => ({ qc: qcRelation([[0.3 ** 2, 0.3]]) }),
  'b4-strategy-odd': () => {
    const fs = [(n: number) => n * n, (n: number) => n + 2, (n: number) => 3 * n, (n: number) => n * n + n, (n: number) => 2 * n + 1];
    const odds = range(-25, 25).filter((n) => Math.abs(n % 2) === 1);
    return choiceIdx(only(fs.map((f, i) => (odds.every((n) => f(n) % 2 === 0) ? i : -1)).filter((i) => i >= 0)));
  },
  'b4-linear-backsolve': () => ({ value: only(range(-50, 50).filter((x) => 5 * (x - 2) === 3 * x + 6)), choiceValues: [2, 4, 6, 8, 10] }),
  'b4-qf-irrational': () => {
    const vals = [2 + Math.sqrt(3), 2 + Math.sqrt(5), 4 + Math.sqrt(3), 1 + Math.sqrt(3), 2 - Math.sqrt(5)];
    return choiceIdx(only(vals.map((x, i) => (Math.abs(x * x - 4 * x + 1) < 1e-9 ? i : -1)).filter((i) => i >= 0)));
  },
  'b4-exp-negative': () => ({ value: (2 ** -3 * 2 ** 5) / 2 ** -1 }),
  'b4-function-compose': () => {
    const f = (x: number) => 2 * x + 1;
    const g = (x: number) => x * x;
    return { value: f(g(3)) };
  },
  'b4-midpoint': () => ({ value: (-2 + 6) / 2 + (5 + -1) / 2 }),
  'b4-parallel-slope-qc': () => {
    // Two points on 3x − 2y = 6: (0, −3) and (2, 0).
    const slope = (0 - -3) / (2 - 0);
    return { qc: qcRelation([[slope, 1.5]]) };
  },
  'b4-word-ages': () => ({ value: only(range(1, 100).filter((b) => 3 * b + 10 === 2 * (b + 10))) }),
  'b4-mixed-rect-quad': () => ({ value: only(range(1, 40).filter((w) => w * (w + 3) === 40)), choiceValues: [4, 5, 6, 8, 10] }),
  'b4-supplementary': () => ({ value: only(range(0, 100).filter((x) => 3 * x + 10 + (2 * x + 20) === 180)) }),
  'b4-isosceles-angle': () => ({ value: (180 - 40) / 2 }),
  'b4-306090-area': () => {
    const short = 10 * Math.sin(Math.PI / 6);
    const long = 10 * Math.cos(Math.PI / 6);
    return { value: (short * long) / 2, choiceValues: [(25 * Math.sqrt(3)) / 2, 25 * Math.sqrt(3), 50, 25 / 2, 50 * Math.sqrt(3)] };
  },
  'b4-similar-area': () => ({ value: 20 * (3 / 2) ** 2 }),
  'b4-circle-inscribed': () => ({ value: (Math.hypot(6, 6) / 2) ** 2 }),
  'b4-hexagon-angles': () => ({ value: (6 - 2) * 180 }),
  'b4-rect-perimeter': () => ({ value: 2 * (8 + 48 / 8) }),
  'b4-cube-surface': () => ({ value: 6 * Math.cbrt(64) ** 2 }),
  'b4-triangle-coords': () => {
    const [[x1, y1], [x2, y2], [x3, y3]] = [[0, 0], [8, 0], [3, 6]];
    return { value: Math.abs(x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2 };
  },
  'b4-weighted-coffee': () => ({ value: (3 * 4 + 2 * 9) / 5 }),
  'b4-perm-shelf': () => ({ value: fact(6) / fact(2) }),
  'b4-combo-choose3': () => {
    let n = 0;
    for (let a = 0; a < 8; a++) for (let b = a + 1; b < 8; b++) for (let c = b + 1; c < 8; c++) n++;
    return { value: n };
  },
  'b4-venn-neither': () => ({ value: 40 - (25 + 18 - 7) }),
};
