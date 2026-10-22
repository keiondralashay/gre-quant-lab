// Core content model for GRE Quant questions and lessons.
// Text fields may contain inline LaTeX wrapped in $...$ (rendered by <MathText>).

export type Area = 'arithmetic' | 'algebra' | 'geometry' | 'data';

/** Recognition categories — what kind of problem is this? */
export type Category =
  | 'linear'
  | 'systems'
  | 'quadratic'
  | 'factoring'
  | 'exponents'
  | 'ratios'
  | 'percentages'
  | 'inequalities'
  | 'number-properties'
  | 'remainders'
  | 'geometry'
  | 'probability'
  | 'statistics'
  | 'data-interpretation';

export type StrategyId =
  | 'factoring'
  | 'quadratic-formula'
  | 'elimination'
  | 'substitution'
  | 'backsolving'
  | 'plug-in'
  | 'estimation'
  | 'simplify-first'
  | 'patterns'
  | 'test-values'
  | 'divisibility'
  | 'prime-factorization'
  | 'geometry-relationships'
  | 'compare-without-solving'
  | 'direct'
  | 'multiplier'
  | 'ratio-parts'
  | 'formula'
  | 'counting'
  | 'average-total'
  | 'inverse-operations'
  | 'guessing'
  | 'graphing';

export type Format = 'mc-single' | 'mc-multi' | 'numeric' | 'qc';

export type QCAnswer = 'A' | 'B' | 'C' | 'D';

export type Answer =
  | { kind: 'mc-single'; correct: number }
  | { kind: 'mc-multi'; correct: number[] }
  /** Exact rational answer num/den. `tolerance` only for "round to..." questions. */
  | { kind: 'numeric'; num: number; den: number; tolerance?: number }
  | { kind: 'qc'; correct: QCAnswer };

export type Verdict = 'best' | 'valid' | 'slow' | 'invalid';

export interface MethodOption {
  strategy: StrategyId;
  verdict: Verdict;
  note: string;
}

export type DiagramId =
  | 'right-triangle-6-8'
  | 'triangle-5-9'
  | 'box-3-4-12'
  | 'similar-triangles'
  | 'square-diagonal'
  | 'bar-chart-sales'
  | 'circle-circumference';

export interface Question {
  id: string;
  area: Area;
  /** Primary recognition category. */
  category: Category;
  /** Secondary concepts (accepted as "partially right" in recognition). */
  secondary: Category[];
  /** Specific topic label, e.g. "Percent change". */
  topic: string;
  difficulty: 1 | 2 | 3;
  format: Format;
  prompt: string;
  quantityA?: string;
  quantityB?: string;
  choices?: string[];
  /** Placeholder/instructions for numeric entry, e.g. "Give your answer as a fraction". */
  entryNote?: string;
  diagram?: DiagramId;
  answer: Answer;

  recognition: {
    clues: string[];
    why: string;
    strategy: string;
    rule: string;
  };

  firstStep: {
    options: string[];
    correct: number;
    explanation: string;
  };

  method: {
    options: MethodOption[];
    explanation: string;
    rule: string;
  };

  decode: {
    askingOptions: string[];
    askingCorrect: number;
    given: string[];
    variables: string;
    symbols: string;
    restrictions: string;
  };

  solution: {
    type: string;
    clue: string;
    decode: string;
    strategy: string;
    fast: string[];
    /** Traditional step-by-step method. Omitted when `longIsFastest`. */
    long?: string[];
    /** True when the standard method is already the fastest. */
    longIsFastest?: boolean;
    why?: string;
    whenNot?: string;
    remember: string;
    answerText: string;
  };

  hints: string[];
  mistakes: string[];
}
