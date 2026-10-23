import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionSolver } from '../components/QuestionSolver';
import { DECODE_LESSONS } from '../data/decodeLessons';
import { QUESTION_BY_ID } from '../data/questions';
import { ALL_FILTER } from '../lib/deck';
import { getProgress, resetProgress, STORAGE_KEY, summarize } from '../lib/progress';
import { MethodRound } from '../modules/ChooseMethod';
import { Dashboard } from '../modules/Dashboard';
import { Exercise } from '../components/Exercise';
import { Recognize } from '../modules/Recognize';

beforeEach(() => {
  resetProgress();
});

describe('Recognize the Problem', () => {
  it('grades recognition, explains clues, then lets the learner solve', async () => {
    const user = userEvent.setup();
    // Only one question matches: remainders, moderate.
    render(<Recognize initialFilter={{ ...ALL_FILTER, category: 'remainders', difficulty: 2 }} />);
    expect(screen.getByText(/When the positive integer/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remainders' }));
    expect(screen.getByText('Yes — Remainders.')).toBeInTheDocument();
    expect(screen.getByText('Clues that identify it')).toBeInTheDocument();
    expect(screen.getByText('REMEMBER')).toBeInTheDocument();
    expect(getProgress().attempts.at(-1)).toMatchObject({ kind: 'recognition', result: 'correct', ref: 'ar-remainder-3n' });

    await user.click(screen.getByRole('button', { name: 'Yes, let me solve it' }));
    await user.type(screen.getByLabelText('Your answer'), '5');
    await user.click(screen.getByRole('button', { name: 'Submit Answer' }));
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    expect(screen.getByText('Show the Long Way')).toBeInTheDocument();
  });

  it('gives partial credit for a secondary concept', async () => {
    const user = userEvent.setup();
    render(<Recognize initialFilter={{ ...ALL_FILTER, category: 'remainders', difficulty: 2 }} />);
    await user.click(screen.getByRole('checkbox', { name: /all 14 categories/ }));
    await user.click(screen.getByRole('button', { name: 'Number properties' }));
    expect(screen.getByText(/Close\. Number properties is involved/)).toBeInTheDocument();
    expect(getProgress().attempts.at(-1)?.result).toBe('partial');
  });

  it('first-step mode asks for the first move only', async () => {
    const user = userEvent.setup();
    render(<Recognize initialFilter={{ ...ALL_FILTER, category: 'remainders', difficulty: 2 }} initialMode="first" />);
    expect(screen.getByText(/What would you do FIRST\?/, { selector: 'p' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Pick n = 4/ }));
    expect(screen.getByText('Good first move.')).toBeInTheDocument();
    expect(getProgress().attempts.at(-1)).toMatchObject({ kind: 'first-step', result: 'correct' });
  });
});

describe('QuestionSolver', () => {
  it('offers a second chance before revealing, and records only the first attempt', async () => {
    const user = userEvent.setup();
    render(<QuestionSolver q={QUESTION_BY_ID['da-two-red']} source="test" />);
    await user.type(screen.getByLabelText('Your answer'), '4/25');
    await user.click(screen.getByRole('button', { name: 'Submit Answer' }));
    expect(screen.getByText('Not correct yet.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try Again' }));
    await user.type(screen.getByLabelText('Your answer'), '12/90');
    await user.click(screen.getByRole('button', { name: 'Submit Answer' }));
    expect(screen.getByText('Correct on the second try.')).toBeInTheDocument();
    const answers = getProgress().attempts.filter((a) => a.kind === 'answer');
    expect(answers).toHaveLength(1);
    expect(answers[0].result).toBe('incorrect');
  });

  it('rejects unparseable numeric input without grading it', async () => {
    const user = userEvent.setup();
    render(<QuestionSolver q={QUESTION_BY_ID['da-two-red']} source="test" />);
    await user.type(screen.getByLabelText('Your answer'), 'two fifteenths');
    await user.click(screen.getByRole('button', { name: 'Submit Answer' }));
    expect(screen.getByText(/Enter a number/)).toBeInTheDocument();
    expect(getProgress().attempts).toHaveLength(0);
  });

  it('select-one-or-more requires exactly the correct set', async () => {
    const user = userEvent.setup();
    render(<QuestionSolver q={QUESTION_BY_ID['al-quad-3x2-multi']} source="test" />);
    expect(screen.getByText(/Select ALL answer choices that apply/)).toBeInTheDocument();
    const boxes = screen.getAllByRole('checkbox');
    await user.click(boxes[2]);
    await user.click(boxes[3]);
    await user.click(screen.getByRole('button', { name: 'Submit Answer' }));
    expect(screen.getByText('Correct!')).toBeInTheDocument();
  });

  it('QC uses the four standard answer statements', async () => {
    const user = userEvent.setup();
    render(<QuestionSolver q={QUESTION_BY_ID['al-x2-4x-qc']} source="test" />);
    const radios = screen.getAllByRole('radio');
    expect(radios.map((r) => r.textContent)).toEqual([
      'AQuantity A is greater.',
      'BQuantity B is greater.',
      'CThe two quantities are equal.',
      'DThe relationship cannot be determined from the information given.',
    ]);
    await user.click(radios[2]);
    await user.click(screen.getByRole('button', { name: 'Submit Answer' }));
    expect(screen.getByText('Not correct yet.')).toBeInTheDocument();
  });

  it('hints and Decode This Question work', async () => {
    const user = userEvent.setup();
    render(<QuestionSolver q={QUESTION_BY_ID['ar-ratio-marbles']} source="test" />);
    await user.click(screen.getByRole('button', { name: 'Give Me a Hint' }));
    expect(screen.getByText(/Hint 1:/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Decode This Question' }));
    const panel = screen.getByLabelText('Decode This Question');
    expect(within(panel).getByText('1. What is the question asking me to find?')).toBeInTheDocument();
    await user.click(within(panel).getByRole('button', { name: 'The number of blue marbles' }));
    expect(within(panel).getByText('Yes.')).toBeInTheDocument();
    await user.click(within(panel).getByRole('button', { name: 'Continue' }));
    expect(within(panel).getByText('2. What information is given?')).toBeInTheDocument();
    await user.click(within(panel).getByRole('button', { name: 'Reveal' }));
    expect(within(panel).getByText('Total = 48')).toBeInTheDocument();
  });
});

describe('Choose the Fastest Method', () => {
  it('rates the chosen strategy and names the preferred one', async () => {
    const user = userEvent.setup();
    render(<MethodRound q={QUESTION_BY_ID['al-system-elim-y']} onNext={() => {}} onShow={() => {}} position={1} size={1} />);
    expect(screen.getByText('Which strategy is the most efficient?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Substitution/ }));
    expect(screen.getByText('That works. A faster route exists, though.')).toBeInTheDocument();
    expect(screen.getByText(/Preferred: Elimination\./)).toBeInTheDocument();
    expect(getProgress().attempts.at(-1)).toMatchObject({ kind: 'strategy', result: 'partial', detail: 'substitution' });
  });
});

describe('Decode exercises', () => {
  it('checks a, b, c and explains the sign of b', async () => {
    const user = userEvent.setup();
    const ex = DECODE_LESSONS[0].exercises[0];
    render(<Exercise exercise={ex} refPrefix="quadratic" />);
    await user.type(screen.getByLabelText(/^a/), '3');
    await user.type(screen.getByLabelText(/^b/), '11');
    await user.type(screen.getByLabelText(/^c/), '6');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText(/The minus sign belongs to b/)).toBeInTheDocument();
    await user.clear(screen.getByLabelText(/^b/));
    await user.type(screen.getByLabelText(/^b/), '−11');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText('All parts identified correctly.')).toBeInTheDocument();
    // First check recorded as incorrect; later corrections don't inflate accuracy.
    const ex1 = getProgress().attempts.filter((a) => a.kind === 'decode-exercise');
    expect(ex1).toHaveLength(1);
    expect(ex1[0].result).toBe('incorrect');
  });
});

describe('Dashboard and persistence', () => {
  it('shows no fabricated stats before practice, real stats after, and persists them', async () => {
    const { unmount } = render(<Dashboard />);
    expect(screen.getByText(/Nothing recorded yet/)).toBeInTheDocument();
    unmount();

    const user = userEvent.setup();
    render(<Recognize initialFilter={{ ...ALL_FILTER, category: 'remainders', difficulty: 2 }} />);
    await user.click(screen.getByRole('button', { name: 'Remainders' }));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.attempts).toHaveLength(1);
    expect(summarize(stored.attempts).byKind.recognition).toEqual({ correct: 1, partial: 0, total: 1 });
  });

  it('planned modules are not clickable links', () => {
    render(<Dashboard />);
    const locked = screen.getByText('Personalized Review').closest('.module-card')!;
    expect(locked.tagName).toBe('DIV');
    expect(locked).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('Recognize the Problem').closest('a')).toHaveAttribute('href', '#/recognize');
  });
});
