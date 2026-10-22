import type { DecodeExercise } from '../decodeLessons';
import type { Area, Category, DiagramId } from '../types';

/**
 * A Topic Library lesson. Every lesson has the same nine sections:
 * WHAT IS IT? · HOW DO I RECOGNIZE IT? · DECODE IT · WHAT DO I NEED TO REMEMBER? ·
 * WHAT'S THE FASTEST WAY? · SHOW ME · COMMON GRE TRAP · LET ME TRY · ONE-LINE TAKEAWAY
 */
export interface Lesson {
  id: string;
  area: Area;
  title: string;
  /** Recognition categories this lesson teaches (used to route "Review This Concept"). */
  categories: Category[];
  what: string;
  clues: [string, string, string];
  decode: { symbol: string; meaning: string }[];
  remember: string[];
  fastest: { method: string; when: string; deeper?: string };
  example: { problem: string; fast: string[]; answer: string; long?: string[] };
  trap: { trap: string; fix: string };
  /** Quick checks with exact, verified answers. */
  tryIt: DecodeExercise[];
  takeaway: string;
  shortcuts?: string[];
  formulas?: string[];
  diagram?: DiagramId;
}
