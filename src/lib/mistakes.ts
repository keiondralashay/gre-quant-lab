import { CATEGORY_LESSON, href, primaryLesson } from '../data/links';
import type { Answer, MistakeType, Question } from '../data/types';
import { parseRational, rationalEquals, type Response } from './grading';
import type { Attempt, GuidedTrace } from './progress';

export const MISTAKE_LABELS: Record<MistakeType, string> = {
  recognition: 'Recognition error',
  concept: 'Concept error',
  strategy: 'Strategy error',
  calculation: 'Calculation error',
  reading: 'Reading error',
  careless: 'Careless error',
  timing: 'Timing error',
};

export const MISTAKE_DESCRIPTIONS: Record<MistakeType, string> = {
  recognition: 'I could not identify what type of problem this was.',
  concept: 'I did not understand the rule or formula involved.',
  strategy: 'I chose an unsuitable solving method.',
  calculation: 'I had the right approach but made an arithmetic or algebra slip.',
  reading: 'I misread the question or missed a restriction.',
  careless: 'I understood it but made a mistake anyway.',
  timing: 'I ran out of time or spent too long.',
};

export const MISTAKE_TYPES = Object.keys(MISTAKE_LABELS) as MistakeType[];

const LETTERS = 'ABCDEFGHIJ';

/** Serialize a response for storage and display: "C", "A, D", "4/25", or "B" (QC). */
export function serializeResponse(r: Response): string | undefined {
  switch (r.kind) {
    case 'mc-single':
      return r.choice === null ? undefined : LETTERS[r.choice];
    case 'mc-multi':
      return r.choices.length ? [...r.choices].sort((a, b) => a - b).map((i) => LETTERS[i]).join(', ') : undefined;
    case 'numeric':
      return r.text.trim() || undefined;
    case 'qc':
      return r.choice ?? undefined;
  }
}

/** Rebuild a response from its serialized form (used when reviewing stored sessions). */
export function deserializeResponse(q: Question, selected: string | undefined): Response | undefined {
  if (selected === undefined) return undefined;
  switch (q.format) {
    case 'mc-single':
      return LETTERS.includes(selected) ? { kind: 'mc-single', choice: LETTERS.indexOf(selected) } : undefined;
    case 'mc-multi':
      return { kind: 'mc-multi', choices: selected.split(',').map((x) => LETTERS.indexOf(x.trim())).filter((i) => i >= 0) };
    case 'numeric':
      return { kind: 'numeric', text: selected };
    case 'qc':
      return ['A', 'B', 'C', 'D'].includes(selected) ? { kind: 'qc', choice: selected as 'A' | 'B' | 'C' | 'D' } : undefined;
  }
}

export function serializeAnswer(a: Answer): string {
  switch (a.kind) {
    case 'mc-single':
      return LETTERS[a.correct];
    case 'mc-multi':
      return a.correct.map((i) => LETTERS[i]).join(', ');
    case 'numeric':
      return a.den === 1 ? String(a.num) : `${a.num}/${a.den}`;
    case 'qc':
      return a.correct;
  }
}

/** The authored distractor (if any) that this wrong response matches exactly. */
export function matchDistractor(q: Question, r: Response) {
  for (const d of q.distractors ?? []) {
    if (r.kind === 'mc-single' && r.choice === d.match) return d;
    if (r.kind === 'qc' && r.choice === d.match) return d;
    if (r.kind === 'numeric') {
      const got = parseRational(r.text);
      const want = parseRational(String(d.match));
      if (got && want && rationalEquals(got, want)) return d;
    }
  }
  return null;
}

export interface Inference {
  type: MistakeType;
  evidence: string;
  /** strong = a specific recorded signal; stored automatically as `evidence`. suggested = shown, stored only if confirmed. */
  strength: 'strong' | 'suggested';
}

const RECENT_MS = 60 * 60 * 1000;

/** What a missed walkthrough step says about the learner's thinking. */
export const STEP_MISTAKE: Record<string, { type: MistakeType; what: string }> = {
  asking: { type: 'reading', what: 'identifying what the question asks' },
  given: { type: 'reading', what: 'separating what is given from what is assumed' },
  components: { type: 'concept', what: 'what the symbols, coefficients, or measurements mean' },
  type: { type: 'recognition', what: 'naming the problem type' },
  first: { type: 'strategy', what: 'choosing the first step' },
  op: { type: 'strategy', what: 'choosing the operation or formula' },
  next: { type: 'calculation', what: 'an intermediate calculation' },
};

const stepKey = (id: string) => (id.startsWith('next:') ? 'next' : id);

/** Graded steps where the learner needed more than one try (or had the answer shown). */
export function strugglesIn(trace: GuidedTrace) {
  return trace.steps.filter((s) => s.graded && s.id !== 'final' && (!s.firstTry || s.revealed) && STEP_MISTAKE[stepKey(s.id)]);
}

/**
 * Diagnose a walkthrough from its trace. A single kind of struggle is a specific
 * recorded signal (strong); several kinds are ambiguous, so the learner is asked
 * (suggested). If every graded step was right first time and only the final
 * answer was missed, the slip happened at the very end (suggested: careless).
 */
export function inferFromTrace(trace: GuidedTrace, finalCorrect: boolean): Inference | null {
  const struggles = strugglesIn(trace);
  const types = [...new Set(struggles.map((s) => STEP_MISTAKE[stepKey(s.id)].type))];
  if (types.length === 1) {
    const whats = [...new Set(struggles.map((s) => STEP_MISTAKE[stepKey(s.id)].what))];
    return { type: types[0], evidence: `In the walkthrough you needed help with ${whats.join(' and ')}.`, strength: 'strong' };
  }
  if (types.length > 1) {
    const first = struggles[0];
    return {
      type: STEP_MISTAKE[stepKey(first.id)].type,
      evidence: `You needed help at several steps (${struggles.map((s) => STEP_MISTAKE[stepKey(s.id)].what).join('; ')}). The first was ${STEP_MISTAKE[stepKey(first.id)].what}.`,
      strength: 'suggested',
    };
  }
  const graded = trace.steps.filter((s) => s.graded && s.id !== 'final');
  if (!finalCorrect && graded.length >= 3) return { type: 'careless', evidence: 'Every guided step was right on the first try, but the final answer was not.', strength: 'suggested' };
  return null;
}

/**
 * Infer why a question was missed from concrete evidence only. Returns null when
 * nothing recorded supports a conclusion; the UI then asks the learner.
 */
export function inferMistake(args: {
  q: Question;
  response?: Response;
  attempt: Pick<Attempt, 'ts' | 'ms' | 'unanswered' | 'mode'>;
  history: Attempt[];
  /** Target seconds for this question in a timed session (if any). */
  paceMs?: number;
  timeExpired?: boolean;
  /** Present when the miss happened inside "Walk Me Through It". */
  trace?: GuidedTrace;
}): Inference | null {
  const { q, response, attempt, history, paceMs, timeExpired, trace } = args;
  if (attempt.unanswered) {
    if (timeExpired) return { type: 'timing', evidence: 'Time ran out before this question was answered.', strength: 'strong' };
    return null; // skipped: the reason is unknown
  }
  if (response) {
    const d = matchDistractor(q, response);
    if (d) return { type: d.type, evidence: `Your answer matches a known trap: ${d.note}`, strength: 'strong' };
  }
  if (trace) {
    const t = inferFromTrace(trace, false);
    if (t) return t;
  }
  const inWindow = (h: Attempt) => h.ts <= attempt.ts && attempt.ts - h.ts < RECENT_MS;
  const recent = history.filter((h) => h.ref === q.id && inWindow(h));
  const recog = recent.filter((h) => h.kind === 'recognition').at(-1);
  if (recog && recog.result === 'incorrect') return { type: 'recognition', evidence: 'You identified this problem as a different type just before solving it.', strength: 'strong' };
  const strat = recent.filter((h) => h.kind === 'strategy').at(-1);
  if (strat && strat.result === 'incorrect') return { type: 'strategy', evidence: 'The strategy you chose for this question beforehand does not reliably work here.', strength: 'strong' };
  const asking = history.filter((h) => h.kind === 'decode-step' && h.ref === `${q.id}:asking` && inWindow(h)).at(-1);
  if (asking && asking.result === 'incorrect') return { type: 'reading', evidence: 'When decoding, you picked a different target than the question asks for.', strength: 'suggested' };
  if (paceMs && attempt.ms && attempt.ms > 2 * paceMs) return { type: 'timing', evidence: `You spent ${Math.round(attempt.ms / 1000)}s, more than twice the ${Math.round(paceMs / 1000)}s pace.`, strength: 'suggested' };
  return null;
}

/** Where to go next for each mistake type. */
export function recommendation(type: MistakeType, q: Question): { label: string; href: string; why: string } {
  const lesson = primaryLesson(q.id) ?? CATEGORY_LESSON[q.category];
  switch (type) {
    case 'recognition':
      return { label: 'Recognition Practice', href: `#/recognize?cat=${q.category}`, why: 'Practice naming the problem type from its clues before solving.' };
    case 'concept':
      return { label: 'Review the topic lesson', href: href.lesson(lesson), why: 'Rebuild the rule or formula, then try its quick checks.' };
    case 'strategy':
      return { label: 'Choose the Fastest Method', href: `#/method?cat=${q.category}`, why: 'Practice picking a method before calculating.' };
    case 'calculation':
      return { label: 'Walk Me Through It', href: href.guided(q.id), why: 'Re-solve this exact question one checked step at a time to find where the arithmetic or algebra slips.' };
    case 'reading':
      return { label: 'Spot the Clue', href: '#/clues', why: 'Practice translating wording and noticing restrictions.' };
    case 'careless':
      return { label: 'Retry in the Review Queue', href: '#/review', why: 'Redo the question calmly and check your work before submitting.' };
    case 'timing':
      return { label: 'Speed Training', href: '#/speed', why: 'Practice recognizing the approach quickly under time pressure.' };
  }
}
