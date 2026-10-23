/**
 * "Walk Me Through It" guides. Steps 1 (what is asked), 4 (problem type),
 * 5 (first step) and 8 (final answer) come from the question itself; a guide
 * supplies the graded steps that need per-question authoring.
 */
export type GuideStep =
  | { id: string; kind: 'choice'; prompt: string; options: string[]; answer: number; hints: string[]; explain: string }
  | { id: string; kind: 'number'; prompt: string; answer: string; hints: string[]; explain: string; unit?: string }
  | { id: string; kind: 'fields'; prompt: string; fields: { id: string; label: string; answer: string }[]; hints: string[]; explain: string };

export interface GuideTrack {
  label: string;
  /** Step 6: which operation to perform. */
  operation: GuideStep;
  /** Step 7: what comes next (one or more graded intermediate steps). */
  next: GuideStep[];
}

export interface Guide {
  qid: string;
  /** Step 2: which statements are actually given (multi-select). */
  given: { options: string[]; correct: number[]; explain: string };
  /** Step 3: what the symbols/variables/measurements represent. */
  components: GuideStep;
  fast: GuideTrack;
  /** Traditional method, when it differs meaningfully from the fast one. */
  long?: GuideTrack;
}
