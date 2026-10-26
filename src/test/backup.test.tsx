import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BackupPanel } from '../components/BackupPanel';
import { classifyAttempt, exportProgress, getProgress, markLessonVisited, recordAttempt, recordCard, reloadProgress, replaceProgress, resetProgress, saveSession, STORAGE_KEY, validateBackup } from '../lib/progress';

beforeEach(() => {
  localStorage.clear();
  resetProgress();
});

/** A progress record touching every stored field: attempts with hints and a guided trace, lessons, cards, classifications, sessions. */
function seed() {
  markLessonVisited('percentages');
  recordAttempt({ kind: 'lesson-check', ref: 'lesson:percentages:t1', result: 'correct' });
  const wrong = recordAttempt({ kind: 'answer', ref: 'ar-pct-sale', result: 'incorrect', hintsUsed: 1, selected: '50', correctAnswer: '60', mode: 'practice' });
  recordAttempt({
    kind: 'answer',
    ref: 'ar-pct-sale',
    result: 'correct',
    mode: 'guided',
    trace: { guide: 'full', track: 'fast', steps: [{ id: 'asking', graded: true, firstTry: false, tries: 2, hints: 1, revealed: false, firstResponse: 'x' }] },
  });
  recordAttempt({ kind: 'guided-step', ref: 'ar-pct-sale:asking', result: 'incorrect', hintsUsed: 1 });
  classifyAttempt(wrong, { type: 'calculation', source: 'self-reported' });
  recordCard('card-1', true);
  saveSession({ id: 's1', kind: 'timed', label: '5 questions', startedAt: 1, endedAt: 2, status: 'completed', questions: [{ id: 'ar-pct-sale', ms: 900, correct: false, unanswered: false, marked: true }] });
}

const file = (text: string) => new File([text], 'backup.json', { type: 'application/json' });

describe('progress backup', () => {
  it('round-trips every stored field exactly, in the unchanged storage format', () => {
    seed();
    const before = getProgress();
    const text = exportProgress(new Date('2026-10-26T12:00:00Z'));
    const parsed = JSON.parse(text);
    expect(parsed).toMatchObject({ app: 'gre-quant-mastery', storageKey: STORAGE_KEY, exportedAt: '2026-10-26T12:00:00.000Z' });
    expect(parsed.progress).toEqual(JSON.parse(localStorage.getItem(STORAGE_KEY)!));

    resetProgress();
    expect(getProgress().attempts).toHaveLength(0);
    const check = validateBackup(text);
    expect(check.ok).toBe(true);
    if (!check.ok) return;
    expect(check.summary).toMatchObject({ attempts: 4, answers: 2, lessonsVisited: 1, sessions: 1, guidedRuns: 1 });
    expect(replaceProgress(check.progress)).toBe(true);
    expect(getProgress()).toEqual(before);
    reloadProgress();
    expect(getProgress()).toEqual(before);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).version).toBe(1);
  });

  it('accepts a bare saved-progress object, including older attempts without ids', () => {
    const check = validateBackup(JSON.stringify({ version: 1, attempts: [{ kind: 'answer', ref: 'ar-pct-sale', result: 'correct', ts: 5 }] }));
    expect(check.ok).toBe(true);
  });

  it.each([
    ['not JSON', '{oops', /not valid JSON/],
    ['an array', '[]', /does not contain/],
    ['another app', JSON.stringify({ app: 'gre-verbal', progress: { version: 1, attempts: [] } }), /not made by GRE Quant/],
    ['a future version', JSON.stringify({ version: 2, attempts: [] }), /Unsupported progress version/],
    ['no attempts', JSON.stringify({ version: 1 }), /no attempt list/],
    ['a bad attempt', JSON.stringify({ version: 1, attempts: [{ kind: 'answer', ref: 'x', result: 'maybe', ts: 1 }] }), /Attempt 1 is invalid: unknown result/],
    ['a missing timestamp', JSON.stringify({ version: 1, attempts: [{ kind: 'answer', ref: 'x', result: 'correct' }] }), /missing timestamp/],
    ['malformed lessons', JSON.stringify({ version: 1, attempts: [], visitedLessons: [3] }), /Lesson history/],
    ['malformed sessions', JSON.stringify({ version: 1, attempts: [], sessions: [{}] }), /Timed session/],
  ])('rejects %s', (_, text, err) => {
    const check = validateBackup(text);
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.error).toMatch(err);
  });

  it('keeps existing progress when the browser refuses to save', () => {
    seed();
    const stored = localStorage.getItem(STORAGE_KEY);
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('QuotaExceeded');
    });
    expect(replaceProgress({ version: 1, attempts: [] })).toBe(false);
    spy.mockRestore();
    expect(localStorage.getItem(STORAGE_KEY)).toBe(stored);
    expect(getProgress().attempts).toHaveLength(4);
  });
});

describe('Backup panel', () => {
  it('asks for confirmation; Cancel leaves progress untouched; Replace restores the file', async () => {
    const user = userEvent.setup();
    seed();
    const backup = exportProgress();
    resetProgress();
    recordAttempt({ kind: 'answer', ref: 'al-linear-basic', result: 'correct' });
    const current = localStorage.getItem(STORAGE_KEY);
    render(<BackupPanel />);

    await user.upload(screen.getByLabelText('Import Progress file'), file(backup));
    expect(await screen.findByText('Replace your saved progress?')).toBeInTheDocument();
    expect(screen.getByText(/The file is valid: 4 attempts/)).toBeInTheDocument();
    expect(screen.getByText(/This replaces the 1 attempts currently saved/)).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBe(current);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(localStorage.getItem(STORAGE_KEY)).toBe(current);

    await user.upload(screen.getByLabelText('Import Progress file'), file(backup));
    await user.click(await screen.findByRole('button', { name: 'Replace my progress' }));
    expect(screen.getByRole('status')).toHaveTextContent('Progress restored: 4 attempts.');
    expect(JSON.parse(backup).progress).toEqual(JSON.parse(localStorage.getItem(STORAGE_KEY)!));
  });

  it('reports an invalid file and changes nothing', async () => {
    const user = userEvent.setup();
    seed();
    const current = localStorage.getItem(STORAGE_KEY);
    render(<BackupPanel />);
    await user.upload(screen.getByLabelText('Import Progress file'), file('{"version": 1, "attempts": "lots"}'));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Nothing was imported\. The backup has no attempt list\. Your saved progress is unchanged\./);
    expect(screen.queryByText('Replace your saved progress?')).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBe(current);
  });

  it('exports a JSON file download', async () => {
    const user = userEvent.setup();
    seed();
    const create = vi.fn(() => 'blob:x');
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<BackupPanel />);
    await user.click(screen.getByRole('button', { name: 'Export Progress' }));
    expect(create).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toHaveTextContent('Exported 4 recorded attempts.');
    click.mockRestore();
  });
});

describe('Restore on a fresh install', () => {
  it('keeps the confirmation visible when the Progress page switches from empty to filled', async () => {
    const { Progress } = await import('../modules/Progress');
    const user = userEvent.setup();
    seed();
    const backup = exportProgress();
    resetProgress();
    render(<Progress />);
    expect(screen.getByText(/No practice recorded yet/)).toBeInTheDocument();
    await user.upload(screen.getByLabelText('Import Progress file'), file(backup));
    await user.click(await screen.findByRole('button', { name: 'Replace my progress' }));
    expect(screen.queryByText(/No practice recorded yet/)).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Progress restored: 4 attempts.');
  });
});
