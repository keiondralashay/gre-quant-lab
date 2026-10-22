import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';
import { DecodePanel } from '../components/DecodePanel';
import { QuestionSolver } from '../components/QuestionSolver';
import { FORMULAS } from '../data/formulas';
import { LESSONS } from '../data/library';
import { QUESTION_BY_ID } from '../data/questions';
import { SHORTCUTS } from '../data/shortcuts';
import { ALL_FILTER } from '../lib/deck';
import { getProgress, reloadProgress, resetProgress, STORAGE_KEY } from '../lib/progress';
import { ChooseMethod } from '../modules/ChooseMethod';
import { Clues } from '../modules/Clues';
import { Decode } from '../modules/Decode';
import { Flashcards } from '../modules/Flashcards';
import { Formulas } from '../modules/Formulas';
import { Library } from '../modules/Library';
import { Practice } from '../modules/Practice';
import { Recognize } from '../modules/Recognize';
import { searchShortcuts, Vault } from '../modules/Vault';

beforeEach(() => {
  resetProgress();
  window.location.hash = '';
});

async function goto(hash: string) {
  await act(async () => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

describe('Topic Library', () => {
  it('lists all four content areas and filters by search', async () => {
    const user = userEvent.setup();
    render(<Library />);
    for (const area of ['Arithmetic', 'Algebra', 'Geometry', 'Data Analysis']) expect(screen.getByRole('heading', { name: new RegExp(`^${area}`) })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Search topics'), 'venn');
    expect(screen.getByText('Sets and Venn diagrams')).toBeInTheDocument();
    expect(screen.queryByText('Quadratic equations')).not.toBeInTheDocument();
  });

  it('a lesson shows all nine sections, grades its quick check, and updates progress', async () => {
    const user = userEvent.setup();
    render(<Library lessonId="gcf-lcm" />);
    for (const h of ['What is it?', 'How do I recognize it?', 'Decode it', 'What do I need to remember?', 'What’s the fastest way?', 'Show me', 'Common GRE trap', 'Let me try']) {
      expect(screen.getByRole('heading', { name: h })).toBeInTheDocument();
    }
    expect(screen.getByText('REMEMBER')).toBeInTheDocument(); // one-line takeaway
    expect(getProgress().visitedLessons).toContain('gcf-lcm');
    await user.type(screen.getByLabelText(/^GCF/), '8');
    await user.type(screen.getByLabelText(/^LCM/), '120');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText('All parts identified correctly.')).toBeInTheDocument();
    expect(getProgress().attempts.at(-1)).toMatchObject({ kind: 'lesson-check', ref: 'lesson:gcf-lcm:gl', result: 'correct' });
    expect(screen.getByText(/Quick checks 1\/1/)).toBeInTheDocument();
  });

  it('practice links point at real practice routes', () => {
    render(<Library lessonId="quadratics" />);
    const solve = screen.getByRole('link', { name: /Solve/ });
    expect(solve).toHaveAttribute('href', '#/practice?lesson=quadratics&mode=solve');
  });
});

describe('Shortcut Vault', () => {
  it('searches by formula, concept, and recognition clue', () => {
    expect(searchShortcuts('at least one').map((s) => s.id)).toContain('probability-shortcuts');
    expect(searchShortcuts('a^2 - b^2').map((s) => s.id)).toContain('difference-of-squares');
    expect(searchShortcuts('root 3').map((s) => s.id)).toContain('tri-30-60-90');
    expect(searchShortcuts('zzzz')).toHaveLength(0);
  });

  it('Practice This Shortcut opens a graded drill and bank questions; bookmarks persist', async () => {
    const user = userEvent.setup();
    render(<Vault shortcutId="difference-of-squares" />);
    expect(screen.getByText('When NOT to use it')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '☆ Bookmark' }));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).bookmarks).toContain('shortcut:difference-of-squares');
    await user.click(screen.getByRole('button', { name: 'Practice This Shortcut' }));
    const practice = screen.getByLabelText('Practice this shortcut');
    await user.type(within(practice).getByLabelText(/103/), '1200');
    await user.type(within(practice).getByLabelText(/x \+ y/), '12');
    await user.click(within(practice).getByRole('button', { name: 'Check' }));
    expect(within(practice).getByText('All parts identified correctly.')).toBeInTheDocument();
    expect(getProgress().attempts.at(-1)).toMatchObject({ kind: 'shortcut-drill', result: 'correct' });
    expect(within(practice).getByText(/GRE-style question 1 of/)).toBeInTheDocument();
  });
});

describe('Understand the Formula', () => {
  it('explains each selected component and tests understanding', async () => {
    const user = userEvent.setup();
    render(<Formulas formulaId="quadratic-formula" />);
    await user.click(screen.getByRole('button', { name: '±' }));
    expect(screen.getByRole('status')).toHaveTextContent(/solve once using \+ and once using −/);
    await user.click(screen.getByRole('button', { name: 'b² − 4ac' }));
    expect(screen.getByRole('status')).toHaveTextContent(/discriminant/i);
    const test = within(screen.getByRole('heading', { name: 'Test My Understanding' }).closest('section')!);
    await user.type(test.getByLabelText(/^a/), '2');
    await user.type(test.getByLabelText(/^b =/), '3');
    await user.click(test.getByRole('button', { name: 'Check' }));
    expect(test.getByText(/The sign belongs to b/)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Learn What This Means/ })[0]).toHaveAttribute('href', '#/library/quadratic-formula?section=decode');
  });
});

describe('Spot the Clue', () => {
  it('grades picks and records clue attempts in every tab', async () => {
    const user = userEvent.setup();
    render(<Clues />);
    for (const tab of ['Phrase → meaning', 'Words → expression', 'Expression → words', 'Wording traps']) {
      await user.click(screen.getByRole('tab', { name: tab }));
      const before = getProgress().attempts.length;
      const option = screen.getAllByRole('button').find((b) => b.className.includes('option'))!;
      await user.click(option);
      expect(screen.getByText(/Correct\.|Not quite\./)).toBeInTheDocument();
      expect(getProgress().attempts.length).toBe(before + 1);
      expect(getProgress().attempts.at(-1)!.kind).toBe('clue');
    }
  });
});

describe('Flashcards', () => {
  it('flip, rate, bookmark, and saved priority', async () => {
    const user = userEvent.setup();
    render(<Flashcards />);
    const firstFront = screen.getByRole('button', { name: /Card front/ }).textContent;
    await user.click(screen.getByRole('button', { name: 'Flip card' }));
    expect(screen.getByRole('button', { name: /Card back/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Need More Practice' }));
    const cards = JSON.parse(localStorage.getItem(STORAGE_KEY)!).cards;
    const [id] = Object.keys(cards);
    expect(cards[id]).toMatchObject({ missed: 1, knew: 0, streak: 0 });
    await user.click(screen.getByRole('button', { name: '☆ Bookmark' }));
    expect(getProgress().bookmarks).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Practice an Example' }).getAttribute('href')).toMatch(/^#\/vault\//);
    // The missed card returns later in the same session.
    for (let i = 0; i < 3; i++) {
      await user.click(screen.getByRole('button', { name: 'Flip card' }));
      await user.click(screen.getByRole('button', { name: 'I Knew This' }));
    }
    expect(screen.getByRole('button', { name: /Card front/ }).textContent).toBe(firstFront);
  });
});

describe('Topic Practice', () => {
  it('runs each skill on a lesson’s questions', async () => {
    const user = userEvent.setup();
    render(<Practice lesson="systems" mode="recognition" />);
    expect(screen.getByText('What kind of problem is this?')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Strategy' }));
    expect(screen.getByText('Which strategy is the most efficient?')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Decode' }));
    expect(screen.getByText('1. What is the question asking me to find?')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Solve' }));
    expect(screen.getByRole('button', { name: 'Submit Answer' })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Shortcut' }));
    expect(screen.getByText(/Shortcut to apply: Elimination in systems/)).toBeInTheDocument();
  });

  it('states honestly when a level has no questions', () => {
    render(<Practice lesson="systems" mode="solve" level="3" />);
    expect(screen.getByText(/No bank questions match/)).toBeInTheDocument();
  });

  it('mixed mode hides the topic until after answering', () => {
    render(<Practice mode="solve" />);
    expect(screen.queryByText(/^TYPE$/)).not.toBeInTheDocument();
  });
});

describe('Phase 1 integration buttons', () => {
  it('missed recognition → Review This Concept → the lesson', async () => {
    const user = userEvent.setup();
    render(<Recognize initialFilter={{ ...ALL_FILTER, category: 'remainders', difficulty: 2 }} />);
    await user.click(screen.getByRole('checkbox', { name: /all 14 categories/ }));
    await user.click(screen.getByRole('button', { name: 'Geometry' }));
    expect(screen.getByRole('link', { name: /Review This Concept/ })).toHaveAttribute('href', '#/library/remainders');
  });

  it('inefficient but valid strategy → See a Faster Method → the vault shortcut', async () => {
    const user = userEvent.setup();
    render(<ChooseMethod initialFilter={{ ...ALL_FILTER, category: 'systems', difficulty: 1 }} />);
    await user.click(screen.getByRole('button', { name: /Substitution/ }));
    expect(screen.getByRole('link', { name: /See a Faster Method/ })).toHaveAttribute('href', '#/vault/elimination');
  });

  it('missed shortcut question → Practice This Shortcut', async () => {
    const user = userEvent.setup();
    render(<QuestionSolver q={QUESTION_BY_ID['da-two-red']} source="test" />);
    for (let i = 0; i < 2; i++) {
      await user.clear(screen.getByLabelText('Your answer'));
      await user.type(screen.getByLabelText('Your answer'), '4/25');
      await user.click(screen.getByRole('button', { name: i === 0 ? 'Submit Answer' : 'Submit Answer' }));
      if (i === 0) await user.click(screen.getByRole('button', { name: 'Try Again' }));
    }
    expect(screen.getByRole('link', { name: /Practice This Shortcut/ })).toHaveAttribute('href', '#/vault/probability-shortcuts?practice=1');
    expect(screen.getByRole('link', { name: /Review This Concept/ })).toHaveAttribute('href', '#/library/probability');
  });

  it('struggling to identify a symbol → Learn What This Means', async () => {
    const user = userEvent.setup();
    render(<Decode />);
    const a = screen.getAllByLabelText(/^a/)[0];
    await user.type(a, '3');
    await user.type(screen.getAllByLabelText(/^b/)[0], '11');
    await user.type(screen.getAllByLabelText(/^c/)[0], '6');
    await user.click(screen.getAllByRole('button', { name: 'Check' })[0]);
    expect(screen.getAllByRole('link', { name: /Learn What This Means/ })[0]).toHaveAttribute('href', '#/formulas/quadratic-standard');
  });

  it('decode panel miss → Learn What This Means', async () => {
    const user = userEvent.setup();
    render(<DecodePanel q={QUESTION_BY_ID['ar-ratio-marbles']} onClose={() => {}} onSolve={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'The number of red marbles' }));
    await user.click(screen.getByRole('button', { name: 'The total marbles' }));
    expect(screen.getByRole('link', { name: /Learn What This Means/ })).toHaveAttribute('href', '#/library/ratios?section=decode');
  });
});

describe('routing: every lesson, shortcut, and formula URL renders', () => {
  it('renders each page by its link', async () => {
    render(<App />);
    for (const l of LESSONS) {
      await goto(`#/library/${l.id}`);
      expect(screen.getByRole('heading', { level: 2, name: l.title })).toBeInTheDocument();
    }
    for (const s of SHORTCUTS) {
      await goto(`#/vault/${s.id}`);
      expect(screen.getByRole('heading', { level: 2, name: s.name })).toBeInTheDocument();
    }
    for (const f of FORMULAS) {
      await goto(`#/formulas/${f.id}`);
      expect(screen.getByRole('heading', { level: 2, name: f.name })).toBeInTheDocument();
    }
    for (const [hash, h] of [
      ['#/clues', 'Spot the Clue'],
      ['#/flashcards', 'Shortcut Flashcards'],
      ['#/practice', 'Topic Practice'],
      ['#/recognize', 'Recognize the Problem'],
      ['#/', 'GRE Quant Mastery'],
    ]) {
      await goto(hash);
      expect(screen.getByRole('heading', { level: 2, name: h })).toBeInTheDocument();
    }
  }, 30000);
});

describe('saved progress compatibility', () => {
  it('loads Phase 1 saved data (no Phase 2 fields) without losing attempts', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, attempts: [{ kind: 'recognition', ref: 'ar-pct-sale', result: 'correct', ts: 1 }] }));
    reloadProgress();
    expect(getProgress().attempts).toHaveLength(1);
    render(<Flashcards />);
    expect(screen.getByText(/unseen/)).toBeInTheDocument();
  });
});
