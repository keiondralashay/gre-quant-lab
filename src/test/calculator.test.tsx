import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionSolver } from '../components/QuestionSolver';
import { QUESTION_BY_ID } from '../data/questions';
import { formatValue, initialCalc, press, shown, type Key } from '../lib/calculator';

const run = (keys: string) => {
  let s = initialCalc();
  for (const k of keys.split(' ')) s = press(s, k as Key);
  return s;
};
const out = (keys: string) => shown(run(keys));

describe('calculator logic', () => {
  it('follows the order of operations', () => {
    expect(out('1 + 2 * 3 =')).toBe('7');
    expect(out('1 0 - 6 / 3 =')).toBe('8');
    expect(out('2 * 3 + 4 * 5 =')).toBe('26');
  });
  it('handles parentheses, showing a closed group’s value', () => {
    expect(out('( 1 + 2 ) * 3 =')).toBe('9');
    expect(out('( 1 + 2 )')).toBe('3');
    expect(out('2 * ( 3 + 4')).toBe('4');
    expect(out('2 * ( 3 + 4 =')).toBe('14'); // open parentheses close at =
  });
  it('has square root and sign change, without scientific functions', () => {
    expect(out('1 6 √')).toBe('4');
    expect(out('2 √')).toBe('1.4142136');
    expect(out('5 ±')).toBe('-5');
    expect(out('5 ± ± + 1 =')).toBe('6');
    expect(out('9 √ + 1 =')).toBe('4');
  });
  it('limits the display to 8 digits', () => {
    expect(out('1 2 3 4 5 6 7 8 9')).toBe('12345678');
    expect(out('1 / 3 =')).toBe('0.3333333');
    expect(out('2 / 3 =')).toBe('0.6666667');
    expect(out('9 9 9 9 9 9 9 9 * 9 =')).toBe('Error');
    expect(formatValue(12345678.4)).toBe('12345678');
  });
  it('shows Error on division by zero or √ of a negative, which only C clears', () => {
    expect(out('5 / 0 =')).toBe('Error');
    expect(out('4 ± √')).toBe('Error');
    expect(out('5 / 0 = 7 + 1 =')).toBe('Error');
    expect(out('5 / 0 = CE')).toBe('Error');
    expect(out('5 / 0 = C 2 + 2 =')).toBe('4');
  });
  it('C clears everything; CE clears only the entry', () => {
    expect(out('7 + 8 CE 2 =')).toBe('9');
    expect(out('7 + 8 C')).toBe('0');
  });
  it('has one memory register with MR, MC, and M+', () => {
    let s = run('5 M+');
    expect(s.memory).toBe(5);
    s = press(s, 'C');
    expect(s.memory).toBe(5); // C does not clear memory
    for (const k of ['3', 'M+'] as Key[]) s = press(s, k);
    expect(s.memory).toBe(8);
    for (const k of ['C', '2', '*', 'MR', '='] as Key[]) s = press(s, k);
    expect(shown(s)).toBe('16');
    s = press(s, 'MC');
    expect(s.memory).toBeNull();
  });
  it('starts a new number after = and continues with an operator', () => {
    expect(out('2 + 3 = 4')).toBe('4');
    expect(out('2 + 3 = * 2 =')).toBe('10');
    expect(out('. 5 + . 2 5 =')).toBe('0.75');
  });
});

describe('calculator panel', () => {
  it('opens and closes without losing the question, and transfers the display', async () => {
    const user = userEvent.setup();
    render(<QuestionSolver q={QUESTION_BY_ID['b3-tickets']} source="practice" />);
    await user.type(screen.getByLabelText('Your answer'), '9');
    await user.click(screen.getByRole('button', { name: 'Calc' }));
    const calc = screen.getByRole('dialog', { name: 'Calculator' });
    for (const k of ['3', 'add', '7', 'equals']) await user.click(within(calc).getByRole('button', { name: k }));
    expect(calc.querySelector('output')).toHaveTextContent('10');
    await user.click(within(calc).getByRole('button', { name: 'memory add' }));
    expect(within(calc).getByText('M')).toBeInTheDocument();
    await user.click(within(calc).getByRole('button', { name: 'Close calculator' }));
    expect(screen.getByLabelText('Your answer')).toHaveValue('9'); // question untouched
    await user.click(screen.getByRole('button', { name: 'Calc' }));
    expect(calc.querySelector('output')).toHaveTextContent('10'); // display kept
    await user.click(within(calc).getByRole('button', { name: 'Transfer Display' }));
    expect(screen.getByLabelText('Your answer')).toHaveValue('10');
  });
  it('accepts keyboard input while focused', async () => {
    const user = userEvent.setup();
    render(<QuestionSolver q={QUESTION_BY_ID['b3-tickets']} source="practice" />);
    await user.click(screen.getByRole('button', { name: 'Calc' }));
    await user.keyboard('12*3+4{Enter}');
    expect(screen.getByRole('dialog', { name: 'Calculator' }).querySelector('output')).toHaveTextContent('40');
  });
  it('offers no Transfer Display for multiple-choice questions', async () => {
    const user = userEvent.setup();
    render(<QuestionSolver q={QUESTION_BY_ID['ar-pct-sale']} source="practice" />);
    await user.click(screen.getByRole('button', { name: 'Calc' }));
    expect(screen.queryByRole('button', { name: 'Transfer Display' })).toBeNull();
  });
});

describe('calculator in timed sets', () => {
  it('appears during a timed session and transfers into numeric entry, kept across questions', async () => {
    const { createSession } = await import('../lib/timedSession');
    const { setActiveSession, resetProgress } = await import('../lib/progress');
    const { Speed } = await import('../modules/Speed');
    resetProgress();
    const s = createSession({ label: 'test', count: 2, minutes: 20 });
    s.questionIds = ['b3-tickets', 'ar-pct-sale'];
    setActiveSession(s);
    const user = userEvent.setup();
    render(<Speed mode="timed" />);
    await user.click(screen.getByRole('button', { name: 'Calc' }));
    const calc = screen.getByRole('dialog', { name: 'Calculator' });
    for (const k of ['3', '0', 'divide', '3', 'equals']) await user.click(within(calc).getByRole('button', { name: k }));
    await user.click(within(calc).getByRole('button', { name: 'Transfer Display' }));
    expect(screen.getByLabelText('Your answer')).toHaveValue('10');
    await user.click(screen.getByRole('button', { name: 'Next →' }));
    expect(calc.querySelector('output')).toHaveTextContent('10');
    expect(within(calc).queryByRole('button', { name: 'Transfer Display' })).toBeNull(); // multiple choice
  });
});
