import type { Answer, QCAnswer, Question } from '../data/types';

export interface Rational {
  num: number;
  den: number;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function reduce({ num, den }: Rational): Rational {
  if (den === 0) throw new Error('zero denominator');
  const g = gcd(num, den);
  const sign = den < 0 ? -1 : 1;
  return { num: (sign * num) / g, den: (sign * den) / g };
}

/**
 * Parse a numeric-entry response exactly. Accepts integers, decimals,
 * fractions ("2/15", "-3/4"), commas as thousands separators, and the
 * Unicode minus sign. Returns null for anything else (including x/0).
 */
export function parseRational(input: string): Rational | null {
  const s = input.trim().replace(/[−–]/g, '-').replace(/,/g, '').replace(/\s+/g, '');
  if (!s) return null;
  const frac = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (frac) {
    const a = parseRational(frac[1]);
    const b = parseRational(frac[2]);
    if (!a || !b || b.num === 0) return null;
    return reduce({ num: a.num * b.den, den: a.den * b.num });
  }
  const dec = s.match(/^(-?)(\d*)(?:\.(\d+))?$/);
  if (!dec || (dec[2] === '' && dec[3] === undefined)) return null;
  const digits = dec[3] ?? '';
  if (digits.length > 9) return null; // keep within safe integer range
  const den = 10 ** digits.length;
  const num = Number((dec[2] || '0') + digits) * (dec[1] ? -1 : 1);
  return reduce({ num, den });
}

export function rationalEquals(a: Rational, b: Rational): boolean {
  return a.num * b.den === b.num * a.den;
}

export type Response =
  | { kind: 'mc-single'; choice: number | null }
  | { kind: 'mc-multi'; choices: number[] }
  | { kind: 'numeric'; text: string }
  | { kind: 'qc'; choice: QCAnswer | null };

export type GradeResult = 'correct' | 'incorrect' | 'invalid';

export function gradeAnswer(answer: Answer, response: Response): GradeResult {
  switch (answer.kind) {
    case 'mc-single':
      if (response.kind !== 'mc-single' || response.choice === null) return 'invalid';
      return response.choice === answer.correct ? 'correct' : 'incorrect';
    case 'mc-multi': {
      if (response.kind !== 'mc-multi' || response.choices.length === 0) return 'invalid';
      const want = [...answer.correct].sort().join(',');
      const got = [...new Set(response.choices)].sort().join(',');
      return want === got ? 'correct' : 'incorrect';
    }
    case 'numeric': {
      if (response.kind !== 'numeric') return 'invalid';
      const parsed = parseRational(response.text);
      if (!parsed) return 'invalid';
      if (answer.tolerance !== undefined) {
        return Math.abs(parsed.num / parsed.den - answer.num / answer.den) <= answer.tolerance ? 'correct' : 'incorrect';
      }
      return rationalEquals(parsed, answer) ? 'correct' : 'incorrect';
    }
    case 'qc':
      if (response.kind !== 'qc' || response.choice === null) return 'invalid';
      return response.choice === answer.correct ? 'correct' : 'incorrect';
  }
}

export function grade(q: Question, response: Response): GradeResult {
  return gradeAnswer(q.answer, response);
}

export const QC_LABELS: Record<QCAnswer, string> = {
  A: 'Quantity A is greater.',
  B: 'Quantity B is greater.',
  C: 'The two quantities are equal.',
  D: 'The relationship cannot be determined from the information given.',
};
