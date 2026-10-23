import type { Area, Category, DiagramId, Distractor, Format, QCAnswer, Question, StrategyId, Verdict } from '../types';

/**
 * Compact authoring format for bank questions. Every pedagogical field is still
 * written by hand; the builder only maps it onto the full Question shape.
 * Conventions: first[0] is the correct first step and ask[0] is the correct
 * "what is asked" option (both are shuffled at display time).
 */
export interface Spec {
  id: string;
  area: Area;
  cat: Category;
  sec?: Category[];
  topic: string;
  d: 1 | 2 | 3;
  prompt: string;
  A?: string;
  B?: string;
  choices?: string[];
  /** mc index · indices (select-all) · QC letter · exact rational */
  ans: number | number[] | QCAnswer | { num: number; den?: number };
  entryNote?: string;
  diagram?: DiagramId;
  table?: Question['table'];
  clues: string[];
  why: string;
  strat: string;
  rule: string;
  first: string[];
  firstWhy: string;
  methods: [StrategyId, Verdict, string][];
  methodWhy: string;
  ask: string[];
  given: string[];
  vars: string;
  syms: string;
  restr: string;
  fast: string[];
  /** Traditional method; omit when the direct method is already the fastest. */
  long?: string[];
  works: string;
  whenNot?: string;
  remember?: string;
  answerText: string;
  hints: string[];
  mistakes: string[];
  traps?: Distractor[];
}

function formatOf(s: Spec): Format {
  if (typeof s.ans === 'string') return 'qc';
  if (Array.isArray(s.ans)) return 'mc-multi';
  if (typeof s.ans === 'number') return 'mc-single';
  return 'numeric';
}

export function build(s: Spec): Question {
  const format = formatOf(s);
  const answer: Question['answer'] =
    format === 'qc'
      ? { kind: 'qc', correct: s.ans as QCAnswer }
      : format === 'mc-multi'
        ? { kind: 'mc-multi', correct: s.ans as number[] }
        : format === 'mc-single'
          ? { kind: 'mc-single', correct: s.ans as number }
          : { kind: 'numeric', num: (s.ans as { num: number }).num, den: (s.ans as { den?: number }).den ?? 1 };
  return {
    id: s.id,
    area: s.area,
    category: s.cat,
    secondary: s.sec ?? [],
    topic: s.topic,
    difficulty: s.d,
    format,
    prompt: s.prompt,
    quantityA: s.A,
    quantityB: s.B,
    choices: s.choices,
    entryNote: s.entryNote,
    diagram: s.diagram,
    table: s.table,
    answer,
    recognition: { clues: s.clues, why: s.why, strategy: s.strat, rule: s.rule },
    firstStep: { options: s.first, correct: 0, explanation: s.firstWhy },
    method: { options: s.methods.map(([strategy, verdict, note]) => ({ strategy, verdict, note })), explanation: s.methodWhy, rule: s.rule },
    decode: { askingOptions: s.ask, askingCorrect: 0, given: s.given, variables: s.vars, symbols: s.syms, restrictions: s.restr },
    solution: {
      type: s.topic,
      clue: s.clues.join(', '),
      decode: s.vars,
      strategy: s.strat,
      fast: s.fast,
      long: s.long,
      longIsFastest: s.long ? undefined : true,
      why: s.works,
      whenNot: s.whenNot,
      remember: s.remember ?? s.rule,
      answerText: s.answerText,
    },
    hints: s.hints,
    mistakes: s.mistakes,
    distractors: s.traps,
  };
}
