import { render } from '@testing-library/react';
import { GUIDE_BY_QID } from '../data/guides';
import { QUESTIONS } from '../data/questions';
import { GuidedRun } from '../modules/Guided';

describe('guide coverage', () => {
  it('every bank question has a full (authored) guide', () => {
    expect(QUESTIONS.filter((q) => !GUIDE_BY_QID[q.id]).map((q) => q.id)).toEqual([]);
  });
  it('every walkthrough renders its first step without errors', () => {
    for (const q of QUESTIONS) {
      const { container, unmount } = render(<GuidedRun q={q} />);
      expect(container.querySelector('.guided-step-title')?.textContent, q.id).toContain('What am I solving for?');
      expect(container.textContent, q.id).toContain('Full guide');
      unmount();
    }
  });
});
