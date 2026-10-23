/**
 * Data Interpretation keys, recomputed from the same data the charts draw.
 * Merged into the VERIFY table in answerKeys.test.ts.
 */
import { DI_SET_BY_ID } from '../data/diSets';
import type { Check } from './verifyBank3';

const chart = <K extends string>(id: string, kind: K) => {
  const c = DI_SET_BY_ID[id].chart;
  if (c.kind !== kind) throw new Error(`${id} is not a ${kind}`);
  return c as Extract<typeof c, { kind: K }>;
};
const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
const idxOf = (i: number, n: number): Check => {
  if (i < 0) throw new Error('no matching choice');
  return { value: i, choiceValues: Array.from({ length: n }, (_, k) => k) };
};
const row = (label: string) => chart('books', 'table').rows.find((r) => r.label === label)!.values;
const bar = (label: string) => chart('staff', 'bar').bars.find((b) => b.label === label)!.value;
const line = (label: string) => chart('stores', 'line').series.find((s) => s.label === label)!.values;
const slice = (label: string) => chart('budget', 'pie').slices.find((s) => s.label === label)!.pct;
const pts = () => chart('study', 'scatter').points;

export const VERIFY_DI: Record<string, () => Check> = {
  'di-books-pct': () => ({ value: ((row('Fiction')[3] - row('Fiction')[0]) / row('Fiction')[0]) * 100 }),
  'di-books-ratio': () => ({ value: row('Nonfiction')[1] / row('Children’s')[1], choiceValues: [2 / 3, 3 / 4, 1, 3 / 2, 2] }),
  'di-books-avg': () => ({ value: sum(row('Children’s')) / 4 }),
  'di-books-share': () => {
    const q4 = chart('books', 'table').rows.map((r) => r.values[3]);
    return { value: (row('Fiction')[3] / sum(q4)) * 100 };
  },
  'di-staff-pct': () => ({ value: (bar('Support') / sum(chart('staff', 'bar').bars.map((b) => b.value))) * 100 }),
  'di-staff-ratio': () => ({ value: bar('Engineering') / bar('Finance'), choiceValues: [2 / 5, 5 / 3, 5 / 2, 3, 2] }),
  'di-staff-diff': () => ({ value: bar('Sales') - (bar('Marketing') + bar('Finance')) }),
  'di-staff-above-avg': () => {
    const bars = chart('staff', 'bar').bars;
    const avg = sum(bars.map((b) => b.value)) / bars.length;
    const names = ['Sales', 'Engineering', 'Support', 'Marketing', 'Finance'];
    return { multi: names.map((n, i) => (bar(n) > avg ? i : -1)).filter((i) => i >= 0) };
  },
  'di-stores-pct': () => ({ value: ((line('Store A')[5] - line('Store A')[0]) / line('Store A')[0]) * 100 }),
  'di-stores-months': () => {
    const n = line('Store A').filter((a, i) => a > line('Store B')[i]).length;
    return { value: n, choiceValues: [1, 2, 3, 4, 5] };
  },
  'di-stores-avg': () => ({ value: sum(line('Store B')) / line('Store B').length }),
  'di-stores-jump': () => {
    const a = line('Store A');
    const m = chart('stores', 'line').xLabels;
    const full: Record<string, string> = { Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June' };
    const diffs = a.slice(1).map((v, i) => v - a[i]);
    const best = diffs.indexOf(Math.max(...diffs));
    if (diffs.filter((d) => d === diffs[best]).length !== 1) throw new Error('tie');
    const label = `${full[m[best]]} to ${full[m[best + 1]]}`;
    return idxOf(['January to February', 'March to April', 'April to May', 'May to June', 'February to March'].indexOf(label), 5);
  },
  'di-budget-food': () => ({ value: (slice('Food') / 100) * chart('budget', 'pie').total }),
  'di-budget-ratio': () => ({ value: slice('Housing') / slice('Savings'), choiceValues: [2 / 7, 7 / 4, 7 / 2, 35, 3] }),
  'di-budget-diff': () => {
    const T = chart('budget', 'pie').total;
    return { value: (slice('Housing') / 100) * T - ((slice('Food') / 100) * T + (slice('Savings') / 100) * T) };
  },
  'di-budget-shift': () => ({ value: slice('Other') - slice('Savings') }),
  'di-study-above': () => ({ value: pts().filter(([, y]) => y > 75).length }),
  'di-study-median': () => {
    const h = pts().map(([x]) => x).sort((a, b) => a - b);
    return { value: (h[h.length / 2 - 1] + h[h.length / 2]) / 2 };
  },
  'di-study-avg': () => {
    const s = pts().filter(([x]) => x > 5).map(([, y]) => y);
    return { value: sum(s) / s.length };
  },
  'di-study-trend': () => {
    const p = pts();
    const mx = sum(p.map(([x]) => x)) / p.length;
    const my = sum(p.map(([, y]) => y)) / p.length;
    const cov = sum(p.map(([x, y]) => (x - mx) * (y - my)));
    const someDrop = p.some(([x1, y1]) => p.some(([x2, y2]) => x2 > x1 && y2 < y1));
    const topIsLowest = (() => {
      const top = p.reduce((a, b) => (b[0] > a[0] ? b : a));
      return top[1] === Math.min(...p.map(([, y]) => y));
    })();
    // [positive trend, negative trend, none, every hour raised it, most hours → lowest]
    const truth = [cov > 0, cov < 0, cov === 0, !someDrop, topIsLowest];
    if (truth.filter(Boolean).length !== 1) throw new Error('expected exactly one supported statement');
    return idxOf(truth.indexOf(true), 5);
  },
};
