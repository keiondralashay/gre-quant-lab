import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QUESTION_BY_ID } from '../data/questions';
import { getProgress, resetProgress, saveSession, type SessionRecord } from '../lib/progress';
import { seeded } from '../lib/random';
import { ADAPTIVE, pickByMix, startAdaptiveS1, startAdaptiveS2, tierFor } from '../lib/timedSession';
import { TimedResults } from '../modules/TimedResults';

beforeEach(() => resetProgress());

const s1Record = (correct: number): SessionRecord => {
  const s = startAdaptiveS1(1000, seeded(3));
  return {
    id: s.id,
    kind: 'timed',
    label: s.label,
    startedAt: 1000,
    endedAt: 2000,
    timeLimitMs: 21 * 60_000,
    status: 'completed',
    adaptive: { stage: 1 },
    questions: s.questionIds.map((id, i) => ({ id, ms: 60_000, correct: i < correct, unanswered: false, marked: false })),
  };
};

describe('unofficial adaptive mode', () => {
  it('routes by Section 1 correct count with documented thresholds', () => {
    expect([0, 4, 5, 7, 8, 12].map(tierFor)).toEqual(['easier', 'easier', 'medium', 'medium', 'harder', 'harder']);
  });
  it('builds sections that match their difficulty mix and never repeat Section 1', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s1 = startAdaptiveS1(0, seeded(seed));
      expect(s1.questionIds).toHaveLength(12);
      const d = (ids: string[], k: number) => ids.filter((id) => QUESTION_BY_ID[id].difficulty === k).length;
      expect([d(s1.questionIds, 1), d(s1.questionIds, 2), d(s1.questionIds, 3)]).toEqual([3, 6, 3]);
      for (const correct of [2, 6, 10]) {
        const rec = { ...s1Record(correct), questions: s1.questionIds.map((id, i) => ({ id, ms: 1, correct: i < correct, unanswered: false, marked: false })) };
        const s2 = startAdaptiveS2(rec, 0, seeded(seed + 100));
        const mix = ADAPTIVE.s2.mix[tierFor(correct)];
        expect(s2.questionIds).toHaveLength(15);
        expect(new Set(s2.questionIds).size).toBe(15);
        expect(s2.questionIds.some((id) => s1.questionIds.includes(id))).toBe(false);
        expect([d(s2.questionIds, 1), d(s2.questionIds, 2), d(s2.questionIds, 3)]).toEqual([mix[1], mix[2], mix[3]]);
        expect(s2.adaptive).toMatchObject({ stage: 2, tier: tierFor(correct), s1Correct: correct, s1Id: rec.id });
        expect(s2.deadline - s2.startedAt).toBe(26 * 60_000);
      }
    }
    expect(pickByMix({ 1: 1, 2: 1, 3: 1 }).length).toBe(3);
  });
  it('explains the routing, starts Section 2 once, and shows no score', async () => {
    const user = userEvent.setup();
    const rec = s1Record(9);
    saveSession(rec);
    const { container } = render(<TimedResults rec={rec} />);
    expect(screen.getByText(/so Section 2 will use the/)).toHaveTextContent('You answered 9 of 12 correctly, so Section 2 will use the harder difficulty mix');
    expect(container.textContent).not.toMatch(/scaled score|gre score|estimated score|predicted score|your score/i);
    await user.click(screen.getByRole('button', { name: 'Start Section 2' }));
    const active = getProgress().activeSession as { adaptive: { stage: number; tier: string } };
    expect(active.adaptive).toMatchObject({ stage: 2, tier: 'harder' });
    expect(screen.getByText('Section 2 for this attempt has already been started.')).toBeInTheDocument();
  });
});
