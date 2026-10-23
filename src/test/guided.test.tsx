import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GUIDE_BY_QID } from '../data/guides';
import { QUESTION_BY_ID } from '../data/questions';
import { inferFromTrace, recommendation } from '../lib/mistakes';
import { classifyAttempt, getProgress, recordAttempt, resetProgress, type GuidedTrace } from '../lib/progress';
import { Review } from '../modules/Review';
import { Guided, GuidedRun } from '../modules/Guided';
import { MathText } from '../components/MathText';

beforeEach(() => resetProgress());

/** Option buttons are shuffled; find one by its exact source text via a rendered copy. */
function optionByText(container: HTMLElement, text: string) {
  const probe = render(<MathText text={text} />);
  const want = probe.container.textContent;
  probe.unmount();
  const btn = [...container.querySelectorAll('button')].find((b) => b.textContent === want);
  if (!btn) throw new Error(`option not found: ${text}`);
  return btn;
}
/** Button by visible text (role queries crash jsdom on KaTeX-rendered buttons). */
function button(name: string | RegExp, root: ParentNode = document) {
  return [...root.querySelectorAll('button')].find((b) => (typeof name === 'string' ? b.textContent?.trim() === name : name.test(b.textContent ?? ''))) ?? null;
}
const must = (b: HTMLButtonElement | null) => {
  if (!b) throw new Error('button not found');
  return b;
};
const step = () => document.querySelectorAll<HTMLElement>('.guided-step');
const current = () => step()[step().length - 1];

describe('Walk Me Through It', () => {
  it('runs a full guide step by step, never showing future steps, and records a trace', async () => {
    const user = userEvent.setup();
    const q = QUESTION_BY_ID['al-quad-x2-7x-10'];
    const g = GUIDE_BY_QID[q.id];
    render(<Guided qid={q.id} />);

    // Step 1 only: later steps are not in the DOM.
    expect(screen.getByText(/What am I solving for\?/)).toBeInTheDocument();
    expect(screen.queryByText(/What information is given\?/)).toBeNull();
    expect(screen.queryByText(/What is the final answer\?/)).toBeNull();

    // Step 1: wrong first, which shows hint 1 and eliminates the option; then correct.
    const wrongAsk = q.decode.askingOptions.find((_, i) => i !== q.decode.askingCorrect)!;
    await user.click(optionByText(current(), wrongAsk));
    expect(within(current()).getByText(/Hint 1:/)).toBeInTheDocument();
    expect(optionByText(current(), wrongAsk)).toBeDisabled();
    await user.click(optionByText(current(), q.decode.askingOptions[q.decode.askingCorrect]));
    expect(within(current()).getByText('Correct after 2 tries.')).toBeInTheDocument();
    await user.click(must(button('Continue →', current())));

    // Step 2: multi-select of what is given.
    expect(screen.getByText(/What information is given\?/)).toBeInTheDocument();
    for (const i of g.given.correct) await user.click(optionByText(current(), g.given.options[i]));
    await user.click(must(button('Check', current())));
    await user.click(must(button('Continue →', current())));

    // Step 3: a, b, c. A wrong b is flagged; fixing it passes.
    const boxes = within(current()).getAllByRole('textbox');
    await user.type(boxes[0], '1');
    await user.type(boxes[1], '7');
    await user.type(boxes[2], '10');
    await user.click(must(button('Check', current())));
    expect(within(current()).getByText(/1 of 3 box is not right yet/)).toBeInTheDocument();
    expect(boxes[1]).toHaveAttribute('aria-invalid', 'true');
    await user.clear(boxes[1]);
    await user.type(boxes[1], '-7');
    await user.click(must(button('Check', current())));
    await user.click(must(button('Continue →', current())));

    // Step 4: problem type. Step 5: first step.
    await user.click(must(button('Quadratic equations', current())));
    await user.click(must(button('Continue →', current())));
    await user.click(optionByText(current(), q.firstStep.options[q.firstStep.correct]));
    await user.click(must(button('Continue →', current())));

    // Track choice: fast and traditional are both offered.
    expect(must(button(/Fast track/))).toBeInTheDocument();
    await user.click(must(button(/Traditional track/)));

    // Step 6: operation. Step 7a/7b: discriminant, roots. Two wrong tries unlock "Show Me".
    await user.click(optionByText(current(), g.long!.operation.kind === 'choice' ? g.long!.operation.options[0] : ''));
    await user.click(must(button('Continue →', current())));
    const disc = within(current()).getByRole('textbox');
    await user.type(disc, '89');
    await user.click(must(button('Check', current())));
    expect(button('Show Me', current())).toBeNull();
    await user.clear(disc);
    await user.type(disc, '29');
    await user.click(must(button('Check', current())));
    expect(within(current()).getByText(/Hint 2:/)).toBeInTheDocument();
    await user.click(must(button('Show Me', current())));
    expect(within(current()).getByText('Here is the answer to this step.')).toBeInTheDocument();
    await user.click(must(button('Continue →', current())));
    const roots = within(current()).getAllByRole('textbox');
    await user.type(roots[0], '2');
    await user.type(roots[1], '5');
    await user.click(must(button('Check', current())));
    await user.click(must(button('Continue →', current())));

    // Step 8: final answer, wrong then right.
    expect(screen.getByText('What is the final answer?')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /−5/ }));
    await user.click(must(button('Submit Final Answer')));
    expect(screen.getByText(/Not correct yet/)).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /^C/ }));
    await user.click(must(button('Submit Final Answer')));
    expect(screen.getByText('Correct after 2 tries.')).toBeInTheDocument();

    const attempts = getProgress().attempts;
    const ans = attempts.find((a) => a.kind === 'answer')!;
    expect(ans).toMatchObject({ ref: q.id, mode: 'guided', result: 'incorrect', selected: 'A' });
    expect(ans.trace!.guide).toBe('full');
    expect(ans.trace!.track).toBe('long');
    const byId = Object.fromEntries(ans.trace!.steps.map((s) => [s.id, s]));
    expect(byId.asking).toMatchObject({ firstTry: false, tries: 2 });
    expect(byId.components).toMatchObject({ firstTry: false, firstResponse: 'a=1, b=7, c=10' });
    expect(byId['next:disc']).toMatchObject({ revealed: true, firstTry: false });
    expect(byId.final).toMatchObject({ firstTry: false, firstResponse: 'A' });
    // Recognition and first-step steps feed the existing recognition metrics.
    expect(attempts.find((a) => a.kind === 'recognition')).toMatchObject({ ref: q.id, result: 'correct', mode: 'guided' });
    expect(attempts.filter((a) => a.kind === 'guided-step').map((a) => a.ref)).toContain(`${q.id}:components`);
    // Several kinds of struggle → the learner is asked (suggested, not auto-classified).
    const panel = screen.getByLabelText('Why did I miss this?');
    expect(within(panel).getByText(/Possible cause/)).toBeInTheDocument();
    expect(getProgress().classifications ?? {}).toEqual({});
    // The traditional path is done; the fast path can be walked too.
    expect(must(button(/Walk the fast path too/))).toBeInTheDocument();
    // Step 9: the fastest valid approach, graded; the worked explanation waits until it is answered.
    expect(screen.getByText('Is there a faster valid approach?')).toBeInTheDocument();
    expect(screen.queryByText('TYPE')).toBeNull();
    const best = q.method.options.find((o) => o.verdict === 'best')!;
    const { STRATEGIES } = await import('../data/taxonomy');
    await user.click(must(button(STRATEGIES[best.strategy], current())));
    await user.click(must(button('Continue →', current())));
    expect(getProgress().attempts.find((a) => a.ref === `${q.id}:faster`)).toMatchObject({ kind: 'guided-step', result: 'correct' });
    expect(screen.getByText('TYPE')).toBeInTheDocument();
  });

  it('basic guides (questions without an authored guide) grade the given-information step', async () => {
    const user = userEvent.setup();
    // A copy under an id with no authored guide exercises the fallback.
    const q = { ...QUESTION_BY_ID['ar-pct-sale'], id: 'tmp-basic' };
    render(<GuidedRun q={q} />);
    expect(screen.getByText('Basic guide')).toBeInTheDocument();
    await user.click(optionByText(current(), q.decode.askingOptions[q.decode.askingCorrect]));
    await user.click(must(button('Continue →', current())));
    // Step 2 is graded: the target itself is offered as a trap.
    const trap = `${q.decode.askingOptions[q.decode.askingCorrect]} (already stated)`;
    await user.click(optionByText(current(), trap));
    await user.click(must(button('Check', current())));
    expect(within(current()).getByText(/1 selected statement is not given/)).toBeInTheDocument();
    await user.click(optionByText(current(), trap));
    for (const g of q.decode.given) await user.click(optionByText(current(), g));
    await user.click(must(button('Check', current())));
    await user.click(must(button('Continue →', current())));
    expect(within(current()).getByText('Self-check')).toBeInTheDocument();
    expect(getProgress().attempts.filter((a) => a.kind === 'guided-step').map((a) => [a.ref, a.result])).toEqual([
      ['tmp-basic:asking', 'correct'],
      ['tmp-basic:given', 'incorrect'],
    ]);
  });

  it('shows a chooser with every full guide when no question is given', () => {
    render(<Guided />);
    expect(screen.getByText(/Fully guided questions/)).toBeInTheDocument();
    expect(screen.getAllByRole('link').filter((l) => l.getAttribute('href')?.startsWith('#/guided?q=')).length).toBe(Object.keys(GUIDE_BY_QID).length);
  });
});

describe('trace-based diagnosis', () => {
  const base = (steps: GuidedTrace['steps']): GuidedTrace => ({ guide: 'full', track: 'fast', steps });
  const ok = (id: string) => ({ id, graded: true, firstTry: true, tries: 1, hints: 0, revealed: false });
  const miss = (id: string) => ({ id, graded: true, firstTry: false, tries: 2, hints: 1, revealed: false });

  it('maps a single kind of struggle to a strong inference', () => {
    expect(inferFromTrace(base([ok('asking'), ok('type'), miss('next:disc'), miss('next:roots')]), false)).toMatchObject({ type: 'calculation', strength: 'strong' });
    expect(inferFromTrace(base([miss('type'), ok('first')]), false)).toMatchObject({ type: 'recognition', strength: 'strong' });
    expect(inferFromTrace(base([miss('components')]), false)).toMatchObject({ type: 'concept', strength: 'strong' });
  });
  it('only suggests when the evidence is mixed or thin', () => {
    expect(inferFromTrace(base([miss('type'), miss('next:x')]), false)).toMatchObject({ type: 'recognition', strength: 'suggested' });
    expect(inferFromTrace(base([ok('asking'), ok('type'), ok('first'), ok('op')]), false)).toMatchObject({ type: 'careless', strength: 'suggested' });
    expect(inferFromTrace({ guide: 'basic', steps: [{ id: 'given', graded: false, firstTry: false, tries: 0, hints: 0, revealed: true }] }, false)).toBeNull();
  });
  it('sends calculation errors to the walkthrough of that exact question', () => {
    const q = QUESTION_BY_ID['ar-gcf-84-126'];
    expect(recommendation('calculation', q).href).toBe('#/guided?q=ar-gcf-84-126');
    const id = recordAttempt({ kind: 'answer', ref: q.id, result: 'incorrect', category: q.category, mode: 'practice' });
    classifyAttempt(id, { type: 'calculation', source: 'self-reported' });
    render(<Review />);
    const link = screen.getByRole('link', { name: 'Walk Me Through It' });
    expect(link).toHaveAttribute('href', '#/guided?q=ar-gcf-84-126');
    expect(link).toHaveClass('btn-primary');
  });
});
