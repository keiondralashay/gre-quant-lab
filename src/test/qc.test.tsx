import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionSolver } from '../components/QuestionSolver';
import { ValueTester } from '../components/ValueTester';
import { QUESTION_BY_ID, QUESTIONS } from '../data/questions';
import { QC_FIXED_THEMES, QC_MODEL_BY_QID, QC_MODELS, QC_THEMES, relation, type QCTheme, type Values } from '../data/qcModels';
import { parseRational } from '../lib/grading';
import { getProgress, resetProgress } from '../lib/progress';
import { preferUnseen, QCTrainer, themesOf } from '../modules/QCTrainer';

beforeEach(() => resetProgress());

const ONE = [
  ...Array.from({ length: 61 }, (_, i) => i - 30),
  ...Array.from({ length: 81 }, (_, i) => (i - 40) / 4),
  ...[-0.9, -0.1, 0.1, 0.9, 1.1, 3.5, 4.1, 4.2, 4.5, 4.8, 4.9, 5.5, 10.5, 13.5, 100, 1000],
];
const TWO = [...Array.from({ length: 31 }, (_, i) => i - 15), -1.5, -0.5, 0.5, 1.5, 3.5, 4.2, 4.5, 4.8, 5.5];

function samples(names: string[]): Values[] {
  if (names.length === 1) return ONE.map((x) => ({ [names[0]]: x }));
  const out: Values[] = [];
  for (const a of TWO) for (const b of TWO) out.push({ [names[0]]: a, [names[1]]: b });
  return out;
}

describe('QC models', () => {
  it('each model agrees with the verified answer key over its allowed values', () => {
    for (const m of QC_MODELS) {
      const q = QUESTION_BY_ID[m.qid];
      expect(q?.format, m.qid).toBe('qc');
      const allowed = samples(m.vars.map((v) => v.name)).filter((v) => m.check(v) === true);
      expect(allowed.length, `${m.qid}: no allowed sample`).toBeGreaterThan(0);
      const rels = new Set(allowed.map((v) => relation(m.A(v), m.B(v))));
      const got = rels.size > 1 ? 'D' : [...rels][0];
      expect(got, m.qid).toBe(q.answer.kind === 'qc' && q.answer.correct);
    }
  });
  it('try-values parse, and rejected ones explain the broken condition', () => {
    for (const m of QC_MODELS)
      for (const t of m.try) {
        const v = Object.fromEntries(Object.entries(t.values).map(([k, s]) => [k, parseRational(s)!.num / parseRational(s)!.den]));
        const r = m.check(v);
        if (r !== true) expect(r.length, m.qid).toBeGreaterThan(5);
      }
  });
  it('every theme has at least two questions', () => {
    const qc = QUESTIONS.filter((q) => q.format === 'qc');
    for (const t of Object.keys(QC_THEMES) as QCTheme[]) expect(qc.filter((q) => themesOf(q).includes(t)).length, t).toBeGreaterThanOrEqual(2);
    for (const id of Object.keys(QC_FIXED_THEMES)) expect(QUESTION_BY_ID[id]?.format).toBe('qc');
  });
});

describe('Test Different Values', () => {
  it('rejects values that break a condition and never claims "always" from examples', async () => {
    const user = userEvent.setup();
    const m = QC_MODEL_BY_QID['qc-neg-cube'];
    render(<ValueTester model={m} />);
    const input = screen.getByLabelText('x');
    await user.type(input, '2');
    await user.click(screen.getByRole('button', { name: 'Test these values' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Not allowed: x = 2. x must be negative.');
    expect(screen.queryByRole('table')).toBeNull();
    await user.clear(input);
    await user.type(input, '-2');
    await user.click(screen.getByRole('button', { name: 'Test these values' }));
    await user.click(screen.getByRole('button', { name: 'x = −1/2' }));
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByRole('status')).toHaveTextContent('All 2 cases so far give A > B. That does not prove it is always true');
    expect(screen.getByRole('status')).not.toHaveTextContent('proves');
  });
  it('two allowed cases with different relationships prove D', async () => {
    const user = userEvent.setup();
    render(<ValueTester model={QC_MODEL_BY_QID['qc-zero-square']} />);
    await user.click(screen.getByRole('button', { name: 'x = 0' }));
    await user.click(screen.getByRole('button', { name: 'x = 3' }));
    expect(screen.getByRole('status')).toHaveTextContent('This proves D. Case 1 gives A = B, but case 2 gives A > B.');
  });
  it('rejects values off an equality condition', async () => {
    const user = userEvent.setup();
    render(<ValueTester model={QC_MODEL_BY_QID['al-x2-4x-qc']} />);
    await user.click(screen.getByRole('button', { name: 'x = 2' }));
    expect(screen.getByRole('alert')).toHaveTextContent('x² = 4x must hold');
  });
});

describe('QC trainer', () => {
  it('filters by theme, records answers to the bank history, and offers the tester', async () => {
    const user = userEvent.setup();
    render(<QCTrainer initialTheme="abs" />);
    expect(screen.getByText(/Question 1 of 2/)).toBeInTheDocument();
    expect(screen.getByLabelText('Test Different Values')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /^D/ }));
    await user.click(screen.getByRole('button', { name: 'Submit Answer' }));
    const a = getProgress().attempts.find((x) => x.kind === 'answer')!;
    expect(a.mode).toBe('qc-trainer');
    expect(['qc-abs-neg', 'p2-abs-qc']).toContain(a.ref);
  });
  it('orders unattempted questions first', () => {
    const pool = ['qc-xsq-9', 'qc-xy-12', 'qc-integer-pin'].map((id) => QUESTION_BY_ID[id]);
    const order = preferUnseen(pool, [{ kind: 'answer', ref: 'qc-xsq-9', ts: 5 }, { kind: 'answer', ref: 'qc-xy-12', ts: 9 }]);
    expect(order.map((q) => q.id)).toEqual(['qc-integer-pin', 'qc-xsq-9', 'qc-xy-12']);
  });
  it('QC questions elsewhere offer Test Different Values', async () => {
    const user = userEvent.setup();
    render(<QuestionSolver q={QUESTION_BY_ID['qc-xy-12']} source="practice" />);
    await user.click(screen.getByRole('button', { name: 'Test Different Values' }));
    const tester = screen.getByLabelText('Test Different Values');
    await user.click(within(tester).getByRole('button', { name: 'x = 1.5, y = 8' }));
    expect(within(tester).getByRole('alert')).toHaveTextContent('must be integers');
  });
});
