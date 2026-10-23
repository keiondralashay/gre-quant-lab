import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DIChart } from '../components/DIChart';
import { DI_NEEDS, DI_SETS } from '../data/diSets';
import { QUESTION_BY_ID, QUESTIONS } from '../data/questions';
import { getProgress, resetProgress } from '../lib/progress';
import { DataInterpretation } from '../modules/DataInterpretation';

beforeEach(() => resetProgress());

describe('DI sets', () => {
  it('every set has several questions that point back to it, and every DI question has a needs exercise', () => {
    const kinds = new Set(DI_SETS.map((s) => s.chart.kind));
    for (const k of ['table', 'bar', 'line', 'pie', 'scatter']) expect(kinds.has(k as never), k).toBe(true);
    for (const s of DI_SETS) {
      expect(s.questions.length).toBeGreaterThanOrEqual(3);
      for (const id of s.questions) {
        expect(QUESTION_BY_ID[id]?.diSet, id).toBe(s.id);
        const n = DI_NEEDS[id];
        expect(n, id).toBeTruthy();
        expect(n.correct.every((i) => i < n.options.length)).toBe(true);
      }
    }
    expect(QUESTIONS.filter((q) => q.diSet).length).toBe(DI_SETS.reduce((t, s) => t + s.questions.length, 0));
  });
  it('a circle graph sums to 100%', () => {
    for (const s of DI_SETS) if (s.chart.kind === 'pie') expect(s.chart.slices.reduce((t, x) => t + x.pct, 0)).toBe(100);
  });
  it('charts label each value and offer a table view', async () => {
    const user = userEvent.setup();
    const bar = DI_SETS.find((s) => s.chart.kind === 'bar')!.chart;
    render(<DIChart chart={bar} />);
    expect(screen.getByRole('img', { name: 'Sales: 60 employees' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show as table' }));
    expect(screen.getByRole('cell', { name: '60' })).toBeInTheDocument();
  });
});

describe('DI set flow', () => {
  it('requires the "what information do I need" step, then solves and records', async () => {
    const user = userEvent.setup();
    render(<DataInterpretation setId="books" />);
    expect(screen.getByText(/What information do I need\?/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit Answer' })).toBeNull();
    // Over-select first (includes an unneeded value), then fix it.
    await user.click(screen.getByRole('checkbox', { name: 'Fiction sales in Q1' }));
    await user.click(screen.getByRole('checkbox', { name: 'Total sales in Q4' }));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText(/1 selected piece is not needed, 1 needed piece is missing/)).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Total sales in Q4' }));
    await user.click(screen.getByRole('checkbox', { name: 'Fiction sales in Q4' }));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    await user.click(screen.getByRole('button', { name: 'Continue →' }));
    await user.type(screen.getByLabelText('Your answer'), '50');
    await user.click(screen.getByRole('button', { name: 'Submit Answer' }));
    const at = getProgress().attempts;
    expect(at.find((a) => a.ref === 'di-books-pct:needs')).toMatchObject({ kind: 'decode-step', result: 'incorrect', mode: 'di-set' });
    expect(at.find((a) => a.kind === 'answer')).toMatchObject({ ref: 'di-books-pct', result: 'correct', mode: 'di-set' });
    await user.click(screen.getByRole('button', { name: 'Next question →' }));
    expect(screen.getByText(/Question 2 of 4/)).toBeInTheDocument();
    expect(screen.getByText(/What information do I need\?/)).toBeInTheDocument();
  });
});
