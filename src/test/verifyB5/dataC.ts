import { R, type StepChecks } from '../guideChecks/types';
import type { Check } from '../verifyBank3';
import { CLUB_TABLE, COURSE_GRADES, QUIZ_FREQ } from '../../data/questions/b5/dataC';

const ints = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
const rel = (a: number, b: number) => (near(a, b) ? 'C' : a > b ? 'A' : 'B');
const qcOf = (rs: string[]) => {
  const s = new Set(rs);
  return s.size === 1 ? ([...s][0] as 'A' | 'B' | 'C') : 'D';
};
const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
const mean = (xs: number[]) => sum(xs) / xs.length;
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
};
const modes = (xs: number[]) => {
  const c = new Map<number, number>();
  xs.forEach((x) => c.set(x, (c.get(x) ?? 0) + 1));
  const m = Math.max(...c.values());
  return [...c].filter(([, v]) => v === m).map(([k]) => k).sort((a, b) => a - b);
};
const sd = (xs: number[]) => {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
};
const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
/** Brute-force subsets of size k from 0..n-1. */
const subsets = (n: number, k: number): number[][] => {
  const out: number[][] = [];
  const rec = (start: number, cur: number[]) => {
    if (cur.length === k) return void out.push([...cur]);
    for (let i = start; i < n; i++) rec(i + 1, [...cur, i]);
  };
  rec(0, []);
  return out;
};
/** Brute-force permutations of an array. */
const perms = <T,>(xs: T[]): T[][] => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])));
const num = (v: string | number) => Number(v);

export const VERIFY_DATA_C: Record<string, () => Check> = {
  'q5-mmr-median-even': () => ({ value: median([3, 8, 1, 9, 4, 7]) }),
  'q5-mmr-mean-equals-mode': () => {
    const ok = ints(-50, 50).filter((x) => {
      const l = [2, 5, 5, 7, x];
      const m = modes(l);
      return m.length === 1 && m[0] === 5 && near(mean(l), 5);
    });
    if (ok.length !== 1) throw new Error(String(ok));
    return { value: ok[0] };
  },
  'q5-mmr-outlier-qc': () => ({ qc: rel(mean([1, 2, 3, 4, 100]), median([1, 2, 3, 4, 100])) }),
  'q5-mmr-statements-multi': () => {
    const l = [3, 3, 4, 6, 6, 8];
    const truth = [near(median(l), 5), near(mean(l), 5), Math.max(...l) - Math.min(...l) === 5, modes(l).length === 1 && modes(l)[0] === 6, near(median(l), mean(l))];
    return { multi: truth.map((t, i) => (t ? i : -1)).filter((i) => i >= 0) };
  },
  'q5-mmr-freq-median': () => ({ value: median(QUIZ_FREQ.rows.flatMap(([v, c]) => Array(num(c)).fill(num(v)))) }),
  'q5-mmr-raise-max-qc': () => {
    const lists = [[1, 5, 9, 12, 13, 20, 30], [-4, 0, 11.5, 12, 12.1, 13, 14], [2, 3, 4, 12, 50, 60, 70]];
    return { qc: qcOf(lists.map((l) => rel(median(l.map((x, i) => (i === l.length - 1 ? x + 10 : x))), 12))) };
  },
  'q5-wa-two-classes': () => ({ value: mean([...Array(20).fill(80), ...Array(30).fill(70)]) }),
  'q5-mean-needed-score': () => ({ value: ints(0, 200).filter((x) => near(mean([82, 82, 82, 82, x]), 85))[0] }),
  'q5-wa-mixture': () => ({ value: ints(0, 1000).map((k) => k / 10).filter((x) => near((0.2 * 10 + 0.5 * x) / (10 + x), 0.3))[0] }),
  'q5-wa-qc-groups': () => ({ qc: rel(mean([...Array(30).fill(50), ...Array(10).fill(90)]), 70) }),
  'q5-wa-find-ratio': () => {
    for (const total of ints(2, 60)) for (const m of ints(1, total - 1)) if (near((180 * m + 150 * (total - m)) / total, 160)) return { value: m / total };
    throw new Error('none');
  },
  'q5-wa-gpa': () => {
    const rows = COURSE_GRADES.rows;
    return { value: sum(rows.map((r) => num(r[1]) * num(r[2]))) / sum(rows.map((r) => num(r[1]))) };
  },
  'q5-sd-shift-qc': () => {
    const sets = [[1, 3], [2, 2, 9], [-4, 0, 7, 7, 20]];
    return { qc: qcOf(sets.map((s) => rel(sd(s), sd(s.map((x) => x + 5))))) };
  },
  'q5-sd-scale': () => {
    const base = [0, 8];
    if (!near(sd(base), 4)) throw new Error('base');
    return { value: sd(base.map((x) => 3 * x + 2)) };
  },
  'q5-sd-greatest': () => {
    const lists = [[1, 5, 5, 9], [5, 5, 5, 5], [4, 5, 5, 6], [3, 4, 6, 7], [1, 2, 3, 4]];
    const sds = lists.map(sd);
    return { value: sds.indexOf(Math.max(...sds)), choiceValues: ints(0, 4) };
  },
  'q5-sd-above-mean': () => ({ value: 60 + 1.5 * 8 }),
  'q5-sd-compute': () => ({ value: sd([2, 4, 4, 4, 5, 5, 7, 9]) }),
  'q5-sd-normal': () => {
    // Empirical rule: 95% within 2 SDs; 130 = 100 + 2 · 15.
    const z = (130 - 100) / 15;
    if (z !== 2) throw new Error('z');
    return { value: (100 - 95) / 2, choiceValues: [2.5, 5, 16, 34, 47.5] };
  },
  'q5-prob-dice-sum': () => {
    let f = 0;
    for (const a of ints(1, 6)) for (const b of ints(1, 6)) if (a + b === 8) f++;
    return { value: f / 36 };
  },
  'q5-prob-no-replace': () => {
    const bag = [0, 0, 0, 0, 0, 1, 1, 1];
    let f = 0;
    let t = 0;
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if (i !== j) { t++; if (bag[i] === 0 && bag[j] === 0) f++; }
    return { value: f / t };
  },
  'q5-prob-at-least-one-head': () => ({ value: ints(0, 15).filter((m) => m !== 0).length / 16 }),
  'q5-prob-independent-qc': () => ({ qc: rel(0.4 * 0.5, 0.2) }),
  'q5-prob-or': () => {
    // Venn regions on 100 equally likely outcomes.
    const both = 20, aOnly = 50 - both, bOnly = 40 - both;
    return { value: (aOnly + bOnly + both) / 100 };
  },
  'q5-prob-committee': () => {
    const people = [0, 0, 0, 0, 1, 1, 1]; // 1 = woman
    const all = subsets(7, 3);
    return { value: all.filter((c) => c.filter((i) => people[i] === 1).length === 2).length / all.length };
  },
  'q5-count-outfits': () => {
    let c = 0;
    for (const _s of ints(1, 4)) for (const _p of ints(1, 3)) for (const _h of ints(1, 2)) c++;
    return { value: c };
  },
  'q5-count-div-3-or-5': () => ({ value: ints(1, 200).filter((n) => n % 3 === 0 || n % 5 === 0).length }),
  'q5-count-codes': () => {
    let digits = 0;
    for (const n of ints(0, 999)) {
      const d = String(n).padStart(3, '0');
      if (new Set(d).size === 3) digits++;
    }
    return { value: 26 * 26 * digits };
  },
  'q5-count-even-distinct': () => ({ value: ints(100, 999).filter((n) => n % 2 === 0 && new Set(String(n)).size === 3).length }),
  'q5-perm-medals': () => {
    let c = 0;
    for (const g of ints(0, 7)) for (const s of ints(0, 7)) for (const b of ints(0, 7)) if (g !== s && s !== b && g !== b) c++;
    return { value: c };
  },
  'q5-perm-level': () => ({ value: new Set(perms('LEVEL'.split('')).map((p) => p.join(''))).size }),
  'q5-perm-round-table': () => {
    // Canonicalize each seating by rotating person 0 to the front.
    const seen = new Set<string>();
    for (const p of perms(ints(0, 5))) {
      const k = p.indexOf(0);
      seen.add([...p.slice(k), ...p.slice(0, k)].join());
    }
    return { value: seen.size };
  },
  'q5-perm-not-adjacent': () => ({ value: perms(ints(0, 4)).filter((p) => Math.abs(p.indexOf(0) - p.indexOf(1)) !== 1).length }),
  'q5-perm-vs-comb-qc': () => {
    const a = perms(ints(0, 4)).map((p) => p.slice(0, 2).join()).filter((v, i, arr) => arr.indexOf(v) === i).length;
    return { qc: rel(a, subsets(6, 3).length) };
  },
  'q5-comb-handshakes': () => ({ value: subsets(10, 2).length }),
  'q5-comb-at-least-woman': () => ({ value: subsets(10, 4).filter((c) => c.some((i) => i >= 6)).length }),
  'q5-comb-toppings': () => ({ value: subsets(8, 3).length }),
  'q5-comb-grid-paths': () => {
    const ways = (x: number, y: number): number => (x === 0 || y === 0 ? 1 : ways(x - 1, y) + ways(x, y - 1));
    return { value: ways(4, 3) };
  },
  'q5-sets-neither': () => {
    // Build a concrete roster.
    const students = ints(0, 39).map((i) => ({ s: i < 25, b: i >= 18 && i < 36 }));
    if (students.filter((x) => x.s && x.b).length !== 7) throw new Error('roster');
    return { value: students.filter((x) => !x.s && !x.b).length };
  },
  'q5-sets-three': () => {
    // Regions from the center outward.
    const abc = 5, ab = 15 - abc, ac = 10 - abc, bc = 8 - abc;
    const a = 50 - ab - ac - abc, b = 40 - ab - bc - abc, c = 30 - ac - bc - abc;
    return { value: 100 - (a + b + c + ab + ac + bc + abc) };
  },
  'q5-sets-min-overlap-qc': () => ({ qc: rel(Math.min(...ints(0, 18).filter((both) => 18 + 20 - both <= 30)), 8) }),
  'q5-sets-two-way-table': () => {
    const club = CLUB_TABLE.rows.map((r) => num(r[1]));
    return { value: num(CLUB_TABLE.rows[1][1]) / sum(club) };
  },
};

export const STEPS_DATA_C: StepChecks = {
  'q5-mmr-median-even': { 'mid.a': 4, 'mid.b': 7, m: 5.5 },
  'q5-mmr-mean-equals-mode': { sum: 25, known: 19, x: 6 },
  'q5-mmr-outlier-qc': { 'vals.a': 22, 'vals.b': 3, sum: 110 },
  'q5-mmr-statements-multi': { 'meas.md': 5, 'meas.mn': 5, 'meas.rg': 5 },
  'q5-mmr-freq-median': { 'pos.a': 10, 'pos.b': 11, cum: 11, m: 2 },
  'q5-mmr-raise-max-qc': { pos: 4 },
  'q5-wa-two-classes': { 'tot.a': 1600, 'tot.b': 2100, op: 3700, v: 74 },
  'q5-mean-needed-score': { 'tot.a': 328, 'tot.b': 425, x: 97 },
  'q5-wa-mixture': { acid: 2, x: 5, 'L1.a': 10, 'L1.b': 20 },
  'q5-wa-qc-groups': { v: 60 },
  'q5-wa-find-ratio': { 'dev.m': 20, 'dev.w': 10, f: R(1, 3) },
  'q5-wa-gpa': { 'op.p': 32, 'op.c': 10, g: 3.2 },
  'q5-sd-shift-qc': { 'chk.s': 1, 'chk.t': 1 },
  'q5-sd-scale': { k: 3, sd: 12 },
  'q5-sd-greatest': { 'var.a': 8, 'var.b': 2.5 },
  'q5-sd-above-mean': { dist: 12, x: 72 },
  'q5-sd-compute': { mu: 5, ss: 32, var: 4, sd: 2 },
  'q5-sd-normal': { z: 2, in: 95, tail: 2.5 },
  'q5-prob-dice-sum': { tot: 36, fav: 5, p: R(5, 36) },
  'q5-prob-no-replace': { 'pr.a': R(5, 8), 'pr.b': R(4, 7), p: R(5, 14), 'L1.a': 10, 'L1.b': 28 },
  'q5-prob-at-least-one-head': { none: R(1, 16), p: R(15, 16) },
  'q5-prob-independent-qc': { p: 0.2 },
  'q5-prob-or': { sum: 0.9, p: 0.7 },
  'q5-prob-committee': { tot: 35, 'op.w': 3, 'op.m': 4, p: R(12, 35) },
  'q5-count-outfits': { op: 12, v: 24 },
  'q5-count-div-3-or-5': { 'cnt.a': 66, 'cnt.b': 40, 'cnt.c': 13, op: 106, v: 93 },
  'q5-count-codes': { 'parts.l': 676, 'parts.d': 720, v: 486720 },
  'q5-count-even-distinct': { a: 72, b: 256, v: 328 },
  'q5-perm-medals': { op: 56, v: 336 },
  'q5-perm-level': { all: fact(5), div: 4, v: 30, L1: 5, L2: 6 },
  'q5-perm-round-table': { line: fact(6), rot: 6, v: 120 },
  'q5-perm-not-adjacent': { tot: 120, tog: 48, v: 72, L1: 6, L2: 12 },
  'q5-perm-vs-comb-qc': { 'vals.a': 20, 'vals.b': 20, op: 120 },
  'q5-comb-handshakes': { per: 9, op: 90, v: 45 },
  'q5-comb-at-least-woman': { 'parts.t': 210, 'parts.m': 15, v: 195 },
  'q5-comb-toppings': { op: 336, v: 56 },
  'q5-comb-grid-paths': { 'moves.r': 4, 'moves.u': 3, tot: 7, v: 35 },
  'q5-sets-neither': { one: 36, v: 4 },
  'q5-sets-three': { 'sums.s': 120, 'sums.p': 33, u: 92, v: 8 },
  'q5-sets-min-overlap-qc': { m: 8 },
  'q5-sets-two-way-table': { tot: 27, f: R(5, 9) },
};
