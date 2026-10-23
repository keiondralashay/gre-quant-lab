import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionSolver } from '../components/QuestionSolver';
import { QUESTION_BY_ID } from '../data/questions';
import { getProgress, recordAttempt, reloadProgress, resetProgress, STORAGE_KEY } from '../lib/progress';
import { NextPractice } from '../modules/NextPractice';
import { Progress } from '../modules/Progress';
import { QuickPractice } from '../modules/QuickPractice';
import { Review } from '../modules/Review';
import { Speed } from '../modules/Speed';

beforeEach(() => {
  resetProgress();
});
afterEach(() => {
  vi.useRealTimers();
});

const answers = () => getProgress().attempts.filter((a) => a.kind === 'answer');

describe('attempt records and mistake analysis', () => {
  it('records every field and auto-classifies a known trap, which the learner can correct', async () => {
    const user = userEvent.setup();
    const q = QUESTION_BY_ID['b3-ribbon-gcf'];
    render(<QuestionSolver q={q} source="practice" />);
    await user.click(screen.getByRole('radio', { name: 'D24' }));
    await user.click(screen.getByRole('button', { name: 'Submit Answer' }));
    await user.click(screen.getByRole('button', { name: 'Show Solution' }));
    const a = answers()[0];
    expect(a).toMatchObject({ ref: q.id, result: 'incorrect', mode: 'practice', format: 'mc-single', topic: q.topic, selected: 'D', correctAnswer: 'B', hintsUsed: 0, category: 'number-properties' });
    expect(typeof a.ms).toBe('number');
    const panel = screen.getByLabelText('Why did I miss this?');
    expect(within(panel).getByText('Reading error')).toBeInTheDocument();
    expect(getProgress().classifications![a.id!]).toMatchObject({ type: 'reading', source: 'evidence' });
    expect(within(panel).getByRole('link', { name: /Spot the Clue/ })).toHaveAttribute('href', '#/clues');
    await user.click(within(panel).getByRole('button', { name: 'That’s not it' }));
    await user.click(within(panel).getByRole('button', { name: /Calculation error/ }));
    expect(getProgress().classifications![a.id!]).toMatchObject({ type: 'calculation', source: 'self-reported' });
  });

  it('asks the learner when no evidence exists, and stores nothing until they answer', async () => {
    const user = userEvent.setup();
    const q = QUESTION_BY_ID['ar-pct-sale'];
    render(<QuestionSolver q={q} source="practice" />);
    await user.click(screen.getByRole('radio', { name: /\$20/ }));
    await user.click(screen.getByRole('button', { name: 'Submit Answer' }));
    await user.click(screen.getByRole('button', { name: 'Show Solution' }));
    expect(screen.getByText(/can’t tell from your answer alone/)).toBeInTheDocument();
    expect(getProgress().classifications ?? {}).toEqual({});
    await user.click(screen.getByRole('button', { name: /Concept error/ }));
    expect(Object.values(getProgress().classifications!)[0]).toMatchObject({ type: 'concept', source: 'self-reported' });
    expect(screen.getByRole('link', { name: /Review the topic lesson/ })).toHaveAttribute('href', '#/library/percentages');
  });
});

describe('Mistake Review Queue', () => {
  it('adds missed questions automatically; retrying appends without overwriting', async () => {
    const user = userEvent.setup();
    recordAttempt({ kind: 'answer', ref: 'ar-gcf-84-126', result: 'incorrect', category: 'number-properties', difficulty: 2, mode: 'practice' });
    render(<Review />);
    expect(screen.getByText(/Number properties · Greatest common factor/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry Original' }));
    expect(screen.queryByText(/Your answer:/)).not.toBeInTheDocument(); // previous answer not shown
    await user.type(screen.getByLabelText('Your answer'), '42');
    await user.click(screen.getByRole('button', { name: 'Submit Answer' }));
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    expect(answers().map((a) => [a.result, a.mode])).toEqual([
      ['incorrect', 'practice'],
      ['correct', 'review-retry'],
    ]);
    await user.click(screen.getByRole('button', { name: '← Back to the queue' }));
    expect(screen.getByText('Improved')).toBeInTheDocument();
    const hist = screen.getByLabelText('Attempt history');
    expect(within(hist).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['✗', '✓']);
  });

  it('Recognize Only records recognition and strategy without solving', async () => {
    const user = userEvent.setup();
    recordAttempt({ kind: 'answer', ref: 'al-system-elim-y', result: 'incorrect', category: 'systems' });
    render(<Review />);
    await user.click(screen.getByRole('button', { name: 'Recognize Only' }));
    await user.click(screen.getByRole('button', { name: 'Systems of equations' }));
    expect(screen.queryByRole('button', { name: 'Yes, let me solve it' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Next: choose the strategy/ }));
    await user.click(screen.getByRole('button', { name: /Elimination/ }));
    const kinds = getProgress().attempts.filter((a) => a.mode === 'review-recognize').map((a) => [a.kind, a.result]);
    expect(kinds).toEqual([
      ['recognition', 'correct'],
      ['strategy', 'correct'],
    ]);
  });
});

describe('Timed GRE practice', () => {
  it('navigates, marks for review, submits, and shows results only afterwards', async () => {
    const user = userEvent.setup();
    render(<Speed mode="timed" />);
    await user.selectOptions(screen.getByLabelText('Questions'), '5');
    await user.selectOptions(screen.getByLabelText('Timing'), 'custom');
    await user.clear(screen.getByLabelText(/Minutes/));
    await user.type(screen.getByLabelText(/Minutes/), '10');
    await user.click(screen.getByRole('button', { name: /Start 5-question set/ }));
    expect(screen.getByRole('timer')).toBeInTheDocument();
    expect(screen.queryByText('Correct!')).not.toBeInTheDocument();
    const active = getProgress().activeSession as { questionIds: string[] };
    expect(active.questionIds).toHaveLength(5);
    expect(new Set(active.questionIds.map((id) => QUESTION_BY_ID[id].area)).size).toBe(4);

    await user.click(screen.getByRole('button', { name: /Mark for review/ }));
    await user.click(screen.getByRole('button', { name: /^Question 3/ }));
    expect(screen.getByText(/Question 3 of 5/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Review' }));
    expect(screen.getByText('⚑ Marked')).toBeInTheDocument();

    // Persistence: "close and reopen" mid-session.
    reloadProgress();
    expect((getProgress().activeSession as { marked: string[] }).marked).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Submit session' }));
    expect(screen.getByText(/5 questions are unanswered/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByRole('heading', { name: 'Session results' })).toBeInTheDocument();
    expect(screen.getByText('Where Could I Have Saved Time?')).toBeInTheDocument();
    expect(answers()).toHaveLength(5);
    expect(answers().every((a) => a.unanswered && a.mode === 'timed' && a.sessionId)).toBe(true);
    // Manual submit with blanks: skipped, not "timing" — no unsupported classification.
    expect(getProgress().classifications ?? {}).toEqual({});
    expect(getProgress().activeSession).toBeUndefined();
    expect(getProgress().sessions).toHaveLength(1);
  });

  it('auto-submits when time expires and classifies unanswered questions as timing (evidence)', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Speed mode="timed" />);
    await user.selectOptions(screen.getByLabelText('Questions'), '5');
    await user.selectOptions(screen.getByLabelText('Timing'), 'custom');
    await user.clear(screen.getByLabelText(/Minutes/));
    await user.type(screen.getByLabelText(/Minutes/), '1');
    await user.click(screen.getByRole('button', { name: /Start 5-question set/ }));
    const ids = (getProgress().activeSession as { questionIds: string[] }).questionIds;
    const first = QUESTION_BY_ID[ids[0]];
    if (first.format === 'numeric') await user.type(screen.getByLabelText('Your answer'), '1');
    else await user.click(screen.getAllByRole(first.format === 'mc-multi' ? 'checkbox' : 'radio')[0]);
    await act(async () => {
      vi.advanceTimersByTime(61_000);
    });
    expect(screen.getByRole('heading', { name: 'Session results' })).toBeInTheDocument();
    expect(screen.getByText(/time expired/)).toBeInTheDocument();
    const as = answers();
    expect(as.filter((a) => a.unanswered)).toHaveLength(4);
    const cls = getProgress().classifications!;
    expect(as.filter((a) => a.unanswered).every((a) => cls[a.id!]?.type === 'timing' && cls[a.id!]?.source === 'evidence')).toBe(true);
    expect(as[0].unanswered).toBe(false);
    expect(as[0].ms).toBeGreaterThan(0);
  });
});

describe('Speed drills', () => {
  it('30-second recognition: running out of time records unanswered recognition, clue, and first step', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    render(<Speed mode="recognition" />);
    expect(screen.getByRole('timer')).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(31_000);
    });
    expect(screen.getByText('Time is up.')).toBeInTheDocument();
    const recs = getProgress().attempts.filter((a) => a.mode === 'speed-30');
    expect(recs.map((a) => a.kind).sort()).toEqual(['clue-spot', 'first-step', 'recognition']);
    expect(recs.every((a) => a.unanswered && a.result === 'incorrect')).toBe(true);
  });

  it('30-second recognition: measures recognition time separately', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Speed mode="recognition" />);
    await act(async () => {
      vi.advanceTimersByTime(4000);
    });
    await user.click(screen.getAllByRole('button').find((b) => b.className.includes('option'))!);
    // Find by text: role-name queries crash jsdom when another button renders KaTeX.
    await user.click(screen.getAllByRole('button').find((b) => b.textContent === 'Submit')!);
    const rec = getProgress().attempts.find((a) => a.kind === 'recognition')!;
    expect(rec.ms).toBeGreaterThanOrEqual(4000);
    expect(rec.ms).toBeLessThan(6000);
    expect(rec.unanswered).toBe(false);
  });

  it('60-second strategy: records the choice, verdict, and decision time', async () => {
    const user = userEvent.setup();
    render(<Speed mode="strategy" />);
    await user.click(screen.getAllByRole('button').find((b) => b.className.includes('option'))!);
    const a = getProgress().attempts.find((x) => x.mode === 'speed-60')!;
    expect(a.kind).toBe('strategy');
    expect(['correct', 'partial', 'incorrect']).toContain(a.result);
    expect(typeof a.ms).toBe('number');
    expect(screen.getByText(/Next question|See results/)).toBeInTheDocument();
  });
});

describe('dashboards use real data only', () => {
  it('My Quant Progress is empty without data, then reflects recorded attempts (and survives a reload)', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Progress />);
    expect(screen.getByText(/No practice recorded yet/)).toBeInTheDocument();
    unmount();
    recordAttempt({ kind: 'answer', ref: 'ar-pct-sale', result: 'correct', ms: 20_000 });
    recordAttempt({ kind: 'answer', ref: 'ar-ratio-marbles', result: 'incorrect', ms: 40_000, hintsUsed: 1 });
    recordAttempt({ kind: 'recognition', ref: 'ar-ratio-marbles', result: 'correct', ms: 3000 });
    // Simulate closing and reopening the app.
    reloadProgress();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).attempts).toHaveLength(3);
    render(<Progress />);
    const overall = screen.getByText('Overall Quant accuracy').closest('.stat')!;
    expect(overall).toHaveTextContent('50%');
    expect(overall).toHaveTextContent('1 of 2 questions');
    expect(screen.getByText('Problem recognition').closest('.stat')).toHaveTextContent('100%');
    expect(screen.getByText('Average solving time').closest('.stat')).toHaveTextContent('30s');
    expect(screen.getByText('Needed hints').closest('.stat')).toHaveTextContent('1');
    await user.click(screen.getAllByRole('button', { name: 'Show table' })[0]);
    expect(screen.getByRole('columnheader', { name: 'Solving' })).toBeInTheDocument();
    expect(screen.getAllByText(/n=2/).length).toBeGreaterThan(0);
  });

  it('What Should I Practice Next? reports insufficient data, then ranks a real weak area', () => {
    recordAttempt({ kind: 'answer', ref: 'ar-remainder-3n', result: 'incorrect', category: 'remainders' });
    const { unmount } = render(<NextPractice />);
    expect(screen.getByText(/isn’t enough data to rank any topic/)).toBeInTheDocument();
    expect(screen.getByText(/Remainders: 1 attempt/)).toBeInTheDocument();
    unmount();
    for (let i = 0; i < 5; i++) recordAttempt({ kind: 'answer', ref: 'ar-remainder-3n', result: 'incorrect', category: 'remainders' });
    render(<NextPractice />);
    expect(screen.getByRole('heading', { name: '1. Remainders' })).toBeInTheDocument();
    expect(screen.getByText(/0% overall/)).toBeInTheDocument();
    expect(screen.getByText(/Not known yet/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Topic Practice/ })).toHaveAttribute('href', '#/practice?lesson=remainders&mode=solve');
  });

  it('Practice What I Need uses a diagnostic set without data and targets weak areas with data', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<QuickPractice />);
    expect(screen.getByText(/balanced diagnostic set/)).toBeInTheDocument();
    unmount();
    for (let i = 0; i < 6; i++) recordAttempt({ kind: 'answer', ref: 'ge-triangle-angle', result: 'incorrect', category: 'geometry' });
    render(<QuickPractice />);
    expect(screen.getByText(/Targets your weakest recorded topics: Geometry/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Start the session/ }));
    expect(screen.getByText('Recognition: identify the problem type')).toBeInTheDocument();
    expect(screen.getByText('What kind of problem is this?')).toBeInTheDocument();
  });
});
