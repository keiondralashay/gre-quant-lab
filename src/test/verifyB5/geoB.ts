import { type StepChecks } from '../guideChecks/types';
import type { Check } from '../verifyBank3';

const ints = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
const rel = (a: number, b: number) => (near(a, b) ? 'C' : a > b ? 'A' : 'B');
const PI = Math.PI;
const shoelace = (v: [number, number][]) => {
  let s = 0;
  for (let i = 0; i < v.length; i++) s += v[i][0] * v[(i + 1) % v.length][1] - v[(i + 1) % v.length][0] * v[i][1];
  return Math.abs(s) / 2;
};
const dist2 = (p: [number, number], q: [number, number]) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;

export const VERIFY_GEO_B: Record<string, () => Check> = {
  'q5-sim-shadow': () => ({ value: (30 * 6) / 4 }),
  'q5-sim-area-ratio': () => {
    // Build actual similar triangles with sides 2s and 5s scaled so the small area is 12 (Heron).
    const heron = (a: number, b: number, c: number) => {
      const s = (a + b + c) / 2;
      return Math.sqrt(s * (s - a) * (s - b) * (s - c));
    };
    const base = [3, 4, 5].map((x) => x * 2);
    const small = heron(base[0], base[1], base[2]);
    const big = heron(...(base.map((x) => (x * 5) / 2) as [number, number, number]));
    return { value: (12 * big) / small };
  },
  'q5-sim-parallel-segment': () => ({ value: (15 * 4) / (4 + 6) }),
  'q5-sim-volume-qc': () => {
    const vol = (r: number, h: number) => PI * r * r * h;
    const s = new Set([0.5, 1, 4].map((r) => rel(vol(2 * r, 6), 4 * vol(r, 3))));
    return { qc: s.size === 1 ? ([...s][0] as 'A' | 'B' | 'C') : 'D' };
  },
  'q5-sim-ladder': () => {
    const k = 39 / Math.hypot(5, 12);
    return { value: k * (5 + 12 + Math.hypot(5, 12)) };
  },
  'q5-circ-area-from-circ': () => {
    const rad = (10 * PI) / (2 * PI);
    return { value: PI * rad * rad, choiceValues: [25 * PI, 100 * PI, 10 * PI, 50 * PI, 5 * PI] };
  },
  'q5-circ-arc-length': () => ({ value: 9 * ((80 * PI) / 180), choiceValues: [4 * PI, 18 * PI, 8 * PI, 2 * PI, 4.5 * PI] }),
  'q5-circ-sector-area': () => ({ value: (2 * 6 * PI) / 36 * (180 / PI) }),
  'q5-circ-inscribed-angle': () => {
    // Place A, B on the unit circle 110° apart and C on the major arc; measure angle ACB.
    const pt = (deg: number): [number, number] => [Math.cos((deg * PI) / 180), Math.sin((deg * PI) / 180)];
    const [A, B, C] = [pt(0), pt(110), pt(235)];
    const u = [A[0] - C[0], A[1] - C[1]];
    const v = [B[0] - C[0], B[1] - C[1]];
    const ang = (Math.acos((u[0] * v[0] + u[1] * v[1]) / (Math.hypot(u[0], u[1]) * Math.hypot(v[0], v[1]))) * 180) / PI;
    return { value: Math.round(ang * 1e9) / 1e9 };
  },
  'q5-circ-chord-distance': () => ({ value: Math.sqrt(10 ** 2 - (16 / 2) ** 2) }),
  'q5-circ-square-inscribed': () => {
    const sq = shoelace([[5, 0], [0, 5], [-5, 0], [0, -5]]);
    return { value: 25 * PI - sq, choiceValues: [25 * PI - 50, 25 * PI - 25, 25 * PI - 100, 10 * PI - 50, 50 - 25 * PI] };
  },
  'q5-quad-trapezoid': () => ({ value: shoelace([[0, 0], [13, 0], [10, 6], [3, 6]]) }),
  'q5-quad-rhombus': () => {
    const v: [number, number][] = [[12, 0], [0, 5], [-12, 0], [0, -5]];
    return { value: ints(0, 3).reduce((s, i) => s + Math.sqrt(dist2(v[i], v[(i + 1) % 4])), 0) };
  },
  'q5-poly-interior-sum': () => ({ value: (9 - 2) * 180 }),
  'q5-poly-exterior-n': () => ({ value: ints(3, 100).filter((n) => near(((n - 2) * 180) / n, 156))[0] }),
  'q5-poly-diagonals': () => {
    let c = 0;
    for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) if (j - i !== 1 && j - i !== 7) c++;
    return { value: c };
  },
  'q5-poly-pentagon-qc': () => ({ qc: rel((3 * 180) / 5, 2 * (360 / 6)) }),
  'q5-pa-rect-perim-area': () => {
    const pairs = ints(1, 60).filter((w) => 60 % w === 0 && w + 60 / w === 17);
    return { value: Math.max(...pairs) };
  },
  'q5-pa-semicircle-window': () => ({ value: 6 + 6 + 4 + PI * 2, choiceValues: [16 + 2 * PI, 20 + 2 * PI, 16 + 4 * PI, 20 + 4 * PI, 12 + 2 * PI] }),
  'q5-pa-border': () => ({ value: (10 + 4) * (14 + 4) - 10 * 14 }),
  'q5-vol-cylinder': () => ({ value: PI * 3 * 3 * 10, choiceValues: [90 * PI, 360 * PI, 60 * PI, 30 * PI, 180 * PI] }),
  'q5-vol-box-surface': () => ({ value: 2 * (3 * 4 + 3 * 5 + 4 * 5) }),
  'q5-vol-space-diagonal': () => ({ value: Math.hypot(2, 3, 6) }),
  'q5-vol-sphere-qc': () => ({ qc: rel((4 / 3) * PI * 27, PI * 9 * 4) }),
  'q5-vol-fill-tank': () => ({ value: (5 * 4 * 3) / 2 }),
  'q5-vol-cube-scale': () => {
    let c = 0;
    for (const x of ints(0, 5)) for (const y of ints(0, 5)) for (const z of ints(0, 5)) if ([x, y, z].every((t) => t > 0 && t < 5)) c++;
    return { value: c };
  },
  'q5-cg-triangle-area': () => ({ value: shoelace([[1, 1], [7, 1], [4, 6]]) }),
  'q5-cg-circle-equation': () => ({ value: Math.max(...ints(-2000, 2000).map((k) => k / 100).filter((y) => (y + 3) ** 2 <= 49)) }),
  'q5-cg-parallelogram-vertex': () => {
    const D = [1 + 7 - 5, 2 + 7 - 3];
    // Diagonals AC and BD must share a midpoint.
    if ((1 + 7) / 2 !== (5 + D[0]) / 2 || (2 + 7) / 2 !== (3 + D[1]) / 2) throw new Error('bad');
    return { value: D[0] + D[1] };
  },
  'q5-cg-right-angle-qc': () => {
    const [P, Q, R] = [[0, 0], [4, 2], [2, 6]];
    const u = [P[0] - Q[0], P[1] - Q[1]];
    const v = [R[0] - Q[0], R[1] - Q[1]];
    const ang = (Math.acos((u[0] * v[0] + u[1] * v[1]) / (Math.hypot(u[0], u[1]) * Math.hypot(v[0], v[1]))) * 180) / PI;
    return { qc: rel(ang, 90) };
  },
  'q5-cg-point-inside': () => {
    const pts: [number, number][] = [[3, 4], [4, 2], [-1, -4], [5, 1], [0, -4.9]];
    return { multi: pts.map((p, i) => (dist2(p, [0, 0]) < 25 - 1e-9 ? i : -1)).filter((i) => i >= 0) };
  },
};

export const STEPS_GEO_B: StepChecks = {
  'q5-sim-shadow': { k: 7.5, h: 45 },
  'q5-sim-area-ratio': { 'op.a': 4, 'op.b': 25, A: 75 },
  'q5-sim-parallel-segment': { AB: 10, DE: 6 },
  'q5-sim-volume-qc': { k: 2, op: 8 },
  'q5-sim-ladder': { PR: 13, k: 3, p: 90, 'L1.a': 15, 'L1.b': 36 },
  'q5-circ-area-from-circ': { r: 5 },
  'q5-circ-sector-area': { t: 60 },
  'q5-circ-inscribed-angle': { x: 55 },
  'q5-circ-chord-distance': { half: 8, op: 36, d: 6 },
  'q5-circ-square-inscribed': { sq: 50 },
  'q5-quad-trapezoid': { avg: 10, A: 60 },
  'q5-quad-rhombus': { s: 13, p: 52 },
  'q5-poly-interior-sum': { tri: 7, v: 1260 },
  'q5-poly-exterior-n': { ext: 24, n: 15 },
  'q5-poly-diagonals': { per: 5, op: 40, v: 20, L1: 28 },
  'q5-poly-pentagon-qc': { 'vals.p': 108, 'vals.h': 60, op: 120 },
  'q5-pa-rect-perim-area': { sum: 17, 'op.a': 12, 'op.b': 5 },
  'q5-pa-semicircle-window': { str: 16 },
  'q5-pa-border': { 'room.a': 14, 'room.b': 18, op: 252, v: 112 },
  'q5-vol-cylinder': { r: 3, op: 90 },
  'q5-vol-box-surface': { 'faces.a': 12, 'faces.b': 15, 'faces.c': 20, op: 47, v: 94 },
  'q5-vol-space-diagonal': { op: 49, d: 7 },
  'q5-vol-sphere-qc': { 'op.s': 36, 'op.c': 36 },
  'q5-vol-fill-tank': { V: 60, t: 30 },
  'q5-vol-cube-scale': { e: 4, v: 64, tot: 216 },
  'q5-cg-triangle-area': { 'bh.b': 6, 'bh.h': 5, op: 30, A: 15 },
  'q5-cg-circle-equation': { 'cr.k': -3, 'cr.r': 7, y: 4 },
  'q5-cg-parallelogram-vertex': { 'vec.x': 2, 'vec.y': 4, 'D.x': 3, 'D.y': 6, s: 9 },
  'q5-cg-right-angle-qc': { 'm.a': 0.5, 'm.b': -2, op: -1, 'L1.a': 20, 'L1.b': 20, 'L1.c': 40 },
  'q5-cg-point-inside': { 'op.a': 25, 'op.b': 26 },
};
