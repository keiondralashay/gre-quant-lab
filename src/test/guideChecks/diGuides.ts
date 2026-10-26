import { SALES as SALES_BARS } from '../../data/questions/data';
import { DI_SET_BY_ID } from '../../data/diSets';
import { QUESTION_BY_ID } from '../../data/questions';
import { R, type StepChecks } from './types';

/** Values recomputed from the same data the charts draw (and, for older DI questions, the question's own table). */
const c = (id: string) => DI_SET_BY_ID[id].chart as never as Record<string, unknown>;
const books = (label: string) => (c('books').rows as { label: string; values: number[] }[]).find((r) => r.label === label)!.values;
const bar = (label: string) => (c('staff').bars as { label: string; value: number }[]).find((b) => b.label === label)!.value;
const line = (label: string) => (c('stores').series as { label: string; values: number[] }[]).find((s) => s.label === label)!.values;
const slice = (label: string) => (c('budget').slices as { label: string; pct: number }[]).find((s) => s.label === label)!.pct;
const pts = () => c('study').points as [number, number][];
const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
// Quarterly sales exactly as the bar-chart-sales diagram draws them.
const SALES = SALES_BARS.map((b) => b.value);
const table = () => QUESTION_BY_ID['p2-table-percent'].table!.rows as [string, number, number][];
const course = (name: string) => table().find((r) => r[0] === name)!;

export const DI_CHECKS: StepChecks = {
  'da-sales-pct-change': { 'read.a': SALES[2], 'read.b': SALES[3], op: SALES[3] - SALES[2] },
  'da-sales-fraction': { 'read.a': SALES[0], 'read.b': SALES[1], 'read.c': SALES[2], 'read.d': SALES[3], op: sum(SALES), fr: R(150, 500) },
  'p2-table-percent': { 'op.b': ((course('Biology')[2] - course('Biology')[1]) / course('Biology')[1]) * 100, 'op.c': (Math.abs(course('Chemistry')[2] - course('Chemistry')[1]) / course('Chemistry')[1]) * 100, 'op.p': ((course('Physics')[2] - course('Physics')[1]) / course('Physics')[1]) * 100 },
  'p2-table-total': (() => {
    const t = table();
    return { 'chg.b': course('Biology')[2] - course('Biology')[1], 'chg.c': course('Chemistry')[2] - course('Chemistry')[1], 'chg.p': course('Physics')[2] - course('Physics')[1], v: sum(t.map((r) => r[2])) - sum(t.map((r) => r[1])), 'op.a': sum(t.map((r) => r[1])), 'op.b': sum(t.map((r) => r[2])) };
  })(),
  'b3-table-share': { 'read.b': course('Biology')[2], 'read.c': course('Chemistry')[2], 'read.p': course('Physics')[2], op: sum(table().map((r) => r[2])), pct: (course('Physics')[2] / sum(table().map((r) => r[2]))) * 100 },
  'b3-bar-lowest': { 'op.a': SALES[0], 'op.b': SALES[1], 'op.c': SALES[2], 'op.d': SALES[3] },
  'di-books-pct': { 'read.a': books('Fiction')[0], 'read.b': books('Fiction')[3], op: books('Fiction')[3] - books('Fiction')[0], pct: 50, L1: books('Fiction')[3] / books('Fiction')[0] },
  'di-books-ratio': { 'read.n': books('Nonfiction')[1], 'read.c': books('Children’s')[1], op: 12 },
  'di-books-avg': { 'read.a': books('Children’s')[0], 'read.b': books('Children’s')[1], 'read.c': books('Children’s')[2], 'read.d': books('Children’s')[3], op: sum(books('Children’s')), avg: sum(books('Children’s')) / 4 },
  'di-books-share': { 'read.f': books('Fiction')[3], 'read.n': books('Nonfiction')[3], 'read.c': books('Children’s')[3], op: books('Fiction')[3] + books('Nonfiction')[3] + books('Children’s')[3], pct: 50 },
  'di-staff-pct': { 'read.a': bar('Sales'), 'read.b': bar('Engineering'), 'read.c': bar('Support'), 'read.d': bar('Marketing'), 'read.e': bar('Finance'), op: 200, pct: (bar('Support') / 200) * 100 },
  'di-staff-ratio': { 'read.e': bar('Engineering'), 'read.f': bar('Finance'), op: 10 },
  'di-staff-diff': { 'read.s': bar('Sales'), 'read.m': bar('Marketing'), 'read.f': bar('Finance'), op: bar('Marketing') + bar('Finance'), v: bar('Sales') - bar('Marketing') - bar('Finance') },
  'di-staff-above-avg': { op: 200 / 5 },
  'di-stores-pct': { 'read.a': line('Store A')[0], 'read.b': line('Store A')[5], op: line('Store A')[5] - line('Store A')[0], pct: ((35 - 20) / 20) * 100 },
  'di-stores-months': { 'op.a': line('Store A')[3], 'op.b': line('Store B')[3], 'op.c': line('Store A')[5], 'op.d': line('Store B')[5], cnt: line('Store A').filter((a, i) => a > line('Store B')[i]).length },
  'di-stores-avg': Object.fromEntries([...['a', 'b', 'c', 'd', 'e', 'f'].map((k, i) => [`read.${k}`, line('Store B')[i]]), ['op', sum(line('Store B'))], ['avg', sum(line('Store B')) / 6]]),
  'di-stores-jump': { 'op.a': line('Store A')[3] - line('Store A')[2], 'op.b': line('Store A')[5] - line('Store A')[4] },
  'di-budget-food': { v: (slice('Food') / 100) * 4800 },
  'di-budget-ratio': { op: 5 },
  'di-budget-diff': { op: slice('Housing') - slice('Food') - slice('Savings'), v: ((slice('Housing') - slice('Food') - slice('Savings')) / 100) * 4800, 'op.h': (slice('Housing') / 100) * 4800, 'op.f': (slice('Food') / 100) * 4800, 'op.s': (slice('Savings') / 100) * 4800 },
  'di-budget-shift': { 'read.s': slice('Savings'), 'read.o': slice('Other'), op: 2 * slice('Savings'), other: slice('Other') - slice('Savings') },
  'di-study-above': { cnt: pts().filter(([, y]) => y > 75).length },
  'di-study-median': (() => {
    const h = pts().map(([x]) => x).sort((a, b) => a - b);
    return { 'op.a': h[4], 'op.b': h[5], med: R(9, 2) };
  })(),
  'di-study-avg': (() => {
    const s = pts().filter(([x]) => x > 5).map(([, y]) => y);
    return { 'op.a': s[0], 'op.b': s[1], 'op.c': s[2], 'op.d': s[3], avg: sum(s) / s.length };
  })(),
  'di-study-trend': { 'exc.a': pts().find(([x]) => x === 4)![1], 'exc.b': pts().find(([x]) => x === 5)![1] },
};
