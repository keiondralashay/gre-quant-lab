/** A step value recomputed independently: a number, or an exact fraction n/d. */
export type V = number | { n: number; d: number };
export type StepChecks = Record<string, Record<string, V>>;
export const R = (n: number, d = 1): V => ({ n, d });
