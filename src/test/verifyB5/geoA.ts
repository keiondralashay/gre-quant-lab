import { R, type StepChecks } from '../guideChecks/types';
import type { Check } from '../verifyBank3';

const ints = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
const rel = (a: number, b: number) => (near(a, b) ? 'C' : a > b ? 'A' : 'B');
const isTri = (a: number, b: number, c: number) => a + b > c && a + c > b && b + c > a;
/** Angle opposite side c, in degrees, by the law of cosines. */
const angle = (a: number, b: number, c: number) => (Math.acos((a * a + b * b - c * c) / (2 * a * b)) * 180) / Math.PI;
const eqArea = (s: number) => (Math.sqrt(3) / 4) * s * s;

export const VERIFY_GEO_A: Record<string, () => Check> = {
  'q5-la-complement': () => ({ value: ints(0, 900).map((k) => k / 10).filter((x) => near(90 - x, 3 * x))[0] }),
  'q5-la-around-point': () => {
    const x = 360 / 12;
    return { value: 5 * x };
  },
  'q5-la-corresponding-qc': () => ({ qc: rel(70, 70) }),
  'q5-la-exterior': () => {
    const adjacent = 180 - 120;
    return { value: 180 - adjacent - 45 };
  },
  'q5-la-clock': () => {
    const minute = 30 * 6;
    const hour = (2 + 30 / 60) * 30;
    const d = Math.abs(minute - hour);
    return { value: Math.min(d, 360 - d) };
  },
  'q5-la-supplement-word': () => {
    const x = ints(0, 180).filter((t) => t + (2 * t + 30) === 180)[0];
    return { value: Math.max(x, 2 * x + 30) };
  },
  'q5-tri-angle-ratio': () => ({ value: (180 / 9) * 4 }),
  'q5-tri-third-side-multi': () => ({ multi: [5, 6, 7, 13, 14].map((x, i) => (isTri(4, 10, x) ? i : -1)).filter((i) => i >= 0) }),
  'q5-tri-isosceles-perim': () => {
    const options = [[5, 5, 11], [11, 11, 5]].filter(([a, b, c]) => isTri(a, b, c));
    if (options.length !== 1) throw new Error('ambiguous');
    return { value: options[0].reduce((s, x) => s + x, 0) };
  },
  'q5-tri-height-from-area': () => ({ value: (2 * 30) / 12 }),
  'q5-tri-obtuse-qc': () => ({ qc: rel(angle(7, 8, 12), 90) }),
  'q5-tri-equilateral-area': () => ({ value: eqArea(6), choiceValues: [9 * Math.sqrt(3), 18 * Math.sqrt(3), 18, 36 * Math.sqrt(3), 6 * Math.sqrt(3)] }),
  'q5-rt-missing-leg': () => ({ value: Math.sqrt(25 ** 2 - 7 ** 2) }),
  'q5-rt-scaled-triple': () => ({ value: Math.hypot(9, 12) }),
  'q5-rt-ratio-area': () => {
    const k = 20 / Math.hypot(3, 4);
    return { value: 0.5 * 3 * k * 4 * k };
  },
  'q5-rt-rect-diagonal': () => ({ value: Math.hypot(5, 12) }),
  'q5-rt-legs-sum-qc': () => {
    const s = new Set(ints(1, 99).map((k) => k / 10).map((a) => rel(Math.hypot(a, 10 - a), 10)));
    return { qc: s.size === 1 ? ([...s][0] as 'A' | 'B' | 'C') : 'D' };
  },
  'q5-rt-altitude': () => ({ value: (6 * 8) / Math.hypot(6, 8) }),
  'q5-srt-306090-hyp': () => {
    // Long leg (opposite 60°) = hyp · sin 60°.
    const hyp = 9 / Math.sin(Math.PI / 3);
    return { value: hyp, choiceValues: [6 * Math.sqrt(3), 18, 9 * Math.sqrt(3), 3 * Math.sqrt(3), 9] };
  },
  'q5-srt-454590-area': () => {
    const leg = 8 * Math.sin(Math.PI / 4);
    return { value: 0.5 * leg * leg };
  },
  'q5-srt-hexagon': () => {
    // Shoelace formula on the six vertices of a regular hexagon with circumradius 4 (= side).
    const v = ints(0, 5).map((k) => [4 * Math.cos((k * Math.PI) / 3), 4 * Math.sin((k * Math.PI) / 3)]);
    let s = 0;
    for (let i = 0; i < 6; i++) s += v[i][0] * v[(i + 1) % 6][1] - v[(i + 1) % 6][0] * v[i][1];
    return { value: Math.abs(s) / 2, choiceValues: [24 * Math.sqrt(3), 16 * Math.sqrt(3), 12 * Math.sqrt(3), 48, 96 * Math.sqrt(3)] };
  },
  'q5-srt-hyp-qc': () => {
    const s = new Set([0.5, 1, 7, 100].map((x) => rel(x * Math.SQRT2, 1.4 * x)));
    return { qc: s.size === 1 ? ([...s][0] as 'A' | 'B' | 'C') : 'D' };
  },
  'q5-srt-square-diagonal': () => {
    const side = 10 / Math.SQRT2;
    return { value: side * side };
  },
};

export const STEPS_GEO_A: StepChecks = {
  'q5-la-complement': { x: R(45, 2) },
  'q5-la-around-point': { tot: 360, op: 30, big: 150 },
  'q5-la-corresponding-qc': { op: 70 },
  'q5-la-exterior': { x: 75, op: 60 },
  'q5-la-clock': { 'rates.m': 6, 'rates.h': 0.5, m: 180, h: 75, v: 105 },
  'q5-la-supplement-word': { x: 50, big: 130 },
  'q5-tri-angle-ratio': { parts: 9, op: 20, big: 80 },
  'q5-tri-third-side-multi': { 'op.a': 6, 'op.b': 14 },
  'q5-tri-isosceles-perim': { p: 27 },
  'q5-tri-height-from-area': { op: 6, h: 5 },
  'q5-tri-obtuse-qc': { 'op.c': 144, 'op.s': 113 },
  'q5-rt-missing-leg': { op: 576, b: 24 },
  'q5-rt-scaled-triple': { k: 3, c: 15, op: 225 },
  'q5-rt-ratio-area': { k: 4, 'legs.a': 12, 'legs.b': 16, a: 96 },
  'q5-rt-rect-diagonal': { op: 169, d: 13 },
  'q5-rt-legs-sum-qc': { 'chk.c': 50, 'chk.s': 100 },
  'q5-rt-altitude': { 'basic.c': 10, 'basic.a': 24, h: 4.8 },
  'q5-srt-454590-area': { op: 32, a: 16 },
  'q5-srt-hexagon': { n: 6 },
  'q5-srt-hyp-qc': { op: 1.96 },
  'q5-srt-square-diagonal': { op: 100, a: 50 },
};
