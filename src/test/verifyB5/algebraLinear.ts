import { R, type StepChecks } from '../guideChecks/types';
import type { Check } from '../verifyBank3';

const ints = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
const xs = [-3.7, -1.2, 0.5, 1.9, 4.3, 7.1];
const equiv = (f: (x: number) => number, gs: ((x: number) => number)[]) => gs.map((g, i) => (xs.every((x) => near(f(x), g(x))) ? i : -1)).filter((i) => i >= 0);
const idx = (i: number, n = 5): Check => ({ value: i, choiceValues: ints(0, n - 1) });
const rel = (a: number, b: number) => (near(a, b) ? 'C' : a > b ? 'A' : 'B');
const slope = (p: [number, number], q: [number, number]) => (q[1] - p[1]) / (q[0] - p[0]);

export const VERIFY_LINEAR: Record<string, () => Check> = {
  'q5-expr-evaluate': () => {
    const [a, b] = [-2, 3];
    return { value: a * a * b - 2 * a * b };
  },
  'q5-expr-equivalent-multi': () => ({ multi: equiv((x) => 2 * (x + 3) - 3 * (x - 1), [(x) => 9 - x, (x) => -x + 9, (x) => x + 9, (x) => -x + 3, (x) => -(x - 9)]) }),
  'q5-expr-translate': () => {
    // "seven less than (n · 4)": evaluate the phrase as nested operations for several n.
    const phrase = (n: number) => n * 4 - 7;
    const ok = equiv(phrase, [(n) => 4 * n - 7, (n) => 7 - 4 * n, (n) => 4 * (n - 7), (n) => n - 28, (n) => 4 * n + 7]);
    if (ok.length !== 1) throw new Error(String(ok));
    return idx(ok[0]);
  },
  'q5-expr-identity-qc': () => {
    const s = new Set(xs.concat([-10, 0, 3, 10]).map((x) => rel((x - 3) * (x + 3) + 9, x * x)));
    return { qc: s.size === 1 ? ([...s][0] as 'A' | 'B' | 'C') : 'D' };
  },
  'q5-expr-given-value': () => {
    const vals = new Set<number>();
    for (const y of ints(-5, 5)) {
      const x = (7 + 2 * y) / 3;
      vals.add(Math.round((6 * x - 4 * y + 1) * 1e9) / 1e9);
    }
    if (vals.size !== 1) throw new Error('not determined');
    return { value: [...vals][0] };
  },
  'q5-lin-fractions': () => ({ value: ints(-200, 200).filter((x) => near(x / 3 + x / 4, 14))[0] }),
  'q5-lin-both-sides-qc': () => ({ qc: rel(ints(-50, 50).filter((x) => 5 * x - 3 === 2 * x + 9)[0], 4) }),
  'q5-lin-no-solution': () => {
    const eqs: [(x: number) => number, (x: number) => number][] = [
      [(x) => 2 * (x + 1), (x) => 2 * x + 3],
      [(x) => 2 * (x + 1), (x) => 2 * x + 2],
      [(x) => 3 * x, () => 0],
      [(x) => x + 1, (x) => 2 * x],
      [(x) => 4 * x - 4, () => 4],
    ];
    // Linear in x: L(x) − R(x) = px + q. No solution ⇔ p = 0 and q ≠ 0.
    const none = eqs.map(([L, Rr], i) => {
      const q = L(0) - Rr(0);
      const p = L(1) - Rr(1) - q;
      return near(p, 0) && !near(q, 0) ? i : -1;
    }).filter((i) => i >= 0);
    if (none.length !== 1) throw new Error(String(none));
    return idx(none[0]);
  },
  'q5-lin-decimal': () => ({ value: ints(-100, 100).filter((x) => near(0.2 * x + 1.5, 3.1))[0] }),
  'q5-fn-evaluate-neg': () => {
    const f = (x: number) => x * x - 3 * x + 2;
    return { value: f(-2) };
  },
  'q5-fn-solve-input': () => ({ value: ints(-50, 50).filter((a) => 3 * a - 5 === 16)[0] }),
  'q5-fn-composite-qc': () => {
    const f = (x: number) => x + 2;
    const g = (x: number) => 3 * x;
    return { qc: rel(f(g(2)), g(f(2))) };
  },
  'q5-fn-defined-op': () => {
    const op = (x: number, y: number) => x * x - y;
    return { value: op(op(2, 3), 4) };
  },
  'q5-fn-linear-table': () => {
    const m = (11 - 5) / (3 - 1);
    const b = 5 - m;
    return { value: m * 6 + b };
  },
  'q5-fn-equal-value': () => {
    const sols = ints(-1000, 1000).map((k) => k / 100).filter((x) => near(x * x - 6 * x, -9));
    // Discriminant check guards against a solution between grid points.
    if (36 - 4 * 9 !== 0) throw new Error('disc');
    return { value: sols.length, choiceValues: [0, 1, 2, 3, 4] };
  },
  'q5-cp-distance': () => ({ value: Math.hypot(-4 - 2, 7 - -1) }),
  'q5-cp-quadrant-qc': () => {
    const s = new Set<string>();
    for (const a of [-5, -1, -0.2]) for (const b of [0.1, 1, 6]) s.add(rel(a, b));
    return { qc: s.size === 1 ? ([...s][0] as 'A' | 'B' | 'C') : 'D' };
  },
  'q5-cp-reflect': () => ({ value: -3 + -5 }),
  'q5-slope-x-intercept': () => ({ value: ints(-50, 50).filter((x) => 2 * x - 6 === 0)[0] }),
  'q5-slope-perp-line': () => {
    const m = -1 / 2;
    if (!near(m * 2, -1)) throw new Error('not perpendicular');
    return { value: -4 / m };
  },
  'q5-slope-collinear': () => ({ value: ints(-50, 50).filter((k) => near(slope([1, 2], [3, 8]), slope([3, 8], [5, k])))[0] }),
  'q5-slope-standard-form': () => {
    // Two points on 4x + 2y = 9: x = 0 → y = 4.5; x = 1 → y = 2.5.
    return { value: slope([0, 4.5], [1, 2.5]), choiceValues: [-2, 2, -0.5, 4, 4.5] };
  },
  'q5-slope-qc-steeper': () => ({ qc: rel(slope([0, 0], [2, 6]), slope([0, 1], [4, 9])) }),
  'q5-cp-midpoint-endpoint': () => {
    const q = [2 * 3 - 1, 2 * 4 - 1];
    if ((1 + q[0]) / 2 !== 3 || (1 + q[1]) / 2 !== 4) throw new Error('bad');
    return { value: q[0] + q[1] };
  },
};

export const STEPS_LINEAR: StepChecks = {
  'q5-expr-evaluate': { 'op.a': 4 * 3, 'op.b': 2 * -2 * 3, v: 24 },
  'q5-expr-equivalent-multi': { 'op.a': -1, 'op.b': 9 },
  'q5-expr-translate': { chk: 4 * 2 - 7 },
  'q5-expr-given-value': { op: 14, v: 15 },
  'q5-lin-fractions': { lcd: 12, 'op.a': 4, 'op.b': 3, 'op.c': 168, x: 24 },
  'q5-lin-both-sides-qc': { op: 12, x: 4 },
  'q5-lin-decimal': { op: 1.6, x: 8, 'op.a': 2, 'op.b': 15, 'op.c': 31 },
  'q5-fn-evaluate-neg': { 'op.a': 4, 'op.b': 6, v: 12 },
  'q5-fn-solve-input': { op: 21, a: 7 },
  'q5-fn-composite-qc': { 'a.i': 6, 'a.o': 8, 'b.i': 4, 'b.o': 12 },
  'q5-fn-defined-op': { in: 2 * 2 - 3, out: 1 - 4 },
  'q5-fn-linear-table': { m: 3, v: 20, b: 2 },
  'q5-fn-equal-value': { 'abc.a': 1, 'abc.b': -6, 'abc.c': 9, cnt: 1, op: 36 - 36 },
  'q5-cp-distance': { 'd.x': 6, 'd.y': 8, v: 10 },
  'q5-cp-reflect': { 'op.x': -3, 'op.y': -5, s: -8 },
  'q5-slope-x-intercept': { x: 3 },
  'q5-slope-perp-line': { m: R(-1, 2), x: 8 },
  'q5-slope-collinear': { m: 3, k: 14 },
  'q5-slope-standard-form': { 'AB.a': 4, 'AB.b': 2, m: -2 },
  'q5-slope-qc-steeper': { 'op.p': 3, 'op.q': 2 },
  'q5-cp-midpoint-endpoint': { 'step.x': 2, 'step.y': 3, 'op.x': 5, 'op.y': 7, s: 12 },
};
