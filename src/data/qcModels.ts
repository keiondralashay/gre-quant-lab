/**
 * Executable models of Quantitative Comparison questions, used by
 * "Test Different Values". Each model states the question's conditions as
 * code, so a value that breaks a condition is rejected, and computes both
 * quantities for any allowed value. Tests check every model against the
 * question's verified answer.
 */
export type QCTheme = 'sign' | 'zero' | 'abs' | 'exponents' | 'fractions' | 'expressions' | 'inequalities' | 'restrictions' | 'd-cases';

export const QC_THEMES: Record<QCTheme, { label: string; idea: string }> = {
  sign: { label: 'Positive and negative', idea: 'Decide the sign of each quantity first; a positive always beats a negative.' },
  zero: { label: 'Zero', idea: 'If 0 is allowed, test it. Never divide by a variable that could be 0.' },
  abs: { label: 'Absolute value', idea: '|x| is a distance: it is never negative, and |x| = −x when x < 0.' },
  exponents: { label: 'Exponents', idea: 'Powers behave differently for x > 1, 0 < x < 1, and negative x.' },
  fractions: { label: 'Fractions', idea: 'With positive denominators, cross-multiply to compare.' },
  expressions: { label: 'Algebraic expressions', idea: 'Simplify or expand both quantities, then cancel what they share.' },
  inequalities: { label: 'Inequalities', idea: 'Overlapping ranges usually mean either quantity can be larger.' },
  restrictions: { label: 'Restrictions', idea: 'Integers, primes, and ranges can pin a value down. Read them before testing.' },
  'd-cases': { label: 'Proving D', idea: 'Two allowed values with different relationships prove D.' },
};

export type Values = Record<string, number>;

export interface QCModel {
  qid: string;
  themes: QCTheme[];
  /** Free variables the learner chooses, with an optional plain-language label. */
  vars: { name: string; label?: string }[];
  /** Every condition from the question, in words. */
  conditions: string;
  /** true when allowed; otherwise the condition that fails, in words. */
  check: (v: Values) => true | string;
  /** Other values fixed by the free ones (shown with each test). */
  derive?: (v: Values) => Values;
  A: (v: Values) => number;
  B: (v: Values) => number;
  /** Starter values worth testing (some deliberately break a condition). */
  try: { label: string; values: Record<string, string> }[];
}

const EPS = 1e-9;
const isInt = (x: number) => Math.abs(x - Math.round(x)) < EPS;
const isPrime = (n: number) => {
  if (!isInt(n) || n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
};
const need = (ok: boolean, msg: string): true | string => (ok ? true : msg);
const all = (...rs: (true | string)[]) => rs.find((r) => r !== true) ?? true;
const one = (name = 'x', label?: string) => [{ name, label }];

export const QC_MODELS: QCModel[] = [
  // ---------- sign ----------
  {
    qid: 'p2-sign-qc', themes: ['sign'], vars: [{ name: 'x' }, { name: 'y' }], conditions: 'xy < 0 and y > 0',
    check: ({ x, y }) => all(need(y > 0, 'y must be greater than 0.'), need(x * y < 0, 'xy must be negative.')),
    A: ({ x }) => x, B: () => 0,
    try: [{ label: 'x = −2, y = 3', values: { x: '-2', y: '3' } }, { label: 'x = 2, y = 3', values: { x: '2', y: '3' } }, { label: 'x = −1/2, y = 10', values: { x: '-1/2', y: '10' } }],
  },
  {
    qid: 'qc-neg-cube', themes: ['sign', 'exponents'], vars: one(), conditions: 'x < 0',
    check: ({ x }) => need(x < 0, 'x must be negative.'), A: ({ x }) => x ** 2, B: ({ x }) => x ** 3,
    try: [{ label: 'x = −2', values: { x: '-2' } }, { label: 'x = −1/2', values: { x: '-1/2' } }, { label: 'x = 0', values: { x: '0' } }, { label: 'x = 2', values: { x: '2' } }],
  },
  // ---------- zero ----------
  {
    qid: 'qc-zero-square', themes: ['zero', 'exponents', 'd-cases'], vars: one(), conditions: 'x ≥ 0',
    check: ({ x }) => need(x >= 0, 'x must be 0 or positive.'), A: ({ x }) => x ** 2, B: ({ x }) => x,
    try: [{ label: 'x = 0', values: { x: '0' } }, { label: 'x = 1', values: { x: '1' } }, { label: 'x = 1/2', values: { x: '1/2' } }, { label: 'x = 3', values: { x: '3' } }],
  },
  {
    qid: 'al-x2-4x-qc', themes: ['zero', 'd-cases'], vars: one(), conditions: 'x² = 4x',
    check: ({ x }) => need(Math.abs(x * x - 4 * x) < EPS, `x² = 4x must hold (for this x, x² = ${fmt(x * x)} and 4x = ${fmt(4 * x)}).`), A: ({ x }) => x, B: () => 4,
    try: [{ label: 'x = 4', values: { x: '4' } }, { label: 'x = 0', values: { x: '0' } }, { label: 'x = 2', values: { x: '2' } }],
  },
  {
    qid: 'b3-identity-qc', themes: ['zero', 'expressions'], vars: one(), conditions: 'x ≠ 0',
    check: ({ x }) => need(x !== 0, 'x cannot be 0.'), A: ({ x }) => (x + 1) ** 2 - (x - 1) ** 2, B: ({ x }) => 4 * x,
    try: [{ label: 'x = 3', values: { x: '3' } }, { label: 'x = −2', values: { x: '-2' } }, { label: 'x = 1/4', values: { x: '1/4' } }, { label: 'x = 0', values: { x: '0' } }],
  },
  // ---------- absolute value ----------
  {
    qid: 'qc-abs-neg', themes: ['abs', 'sign'], vars: one(), conditions: 'x < 0',
    check: ({ x }) => need(x < 0, 'x must be negative.'), A: ({ x }) => Math.abs(x), B: ({ x }) => -x,
    try: [{ label: 'x = −3', values: { x: '-3' } }, { label: 'x = −1/2', values: { x: '-1/2' } }, { label: 'x = 3', values: { x: '3' } }],
  },
  {
    qid: 'p2-abs-qc', themes: ['abs', 'd-cases'], vars: one(), conditions: '|x − 2| = 5',
    check: ({ x }) => need(Math.abs(Math.abs(x - 2) - 5) < EPS, `|x − 2| must equal 5 (for this x it is ${fmt(Math.abs(x - 2))}).`), A: ({ x }) => x, B: () => 0,
    try: [{ label: 'x = 7', values: { x: '7' } }, { label: 'x = −3', values: { x: '-3' } }, { label: 'x = 3', values: { x: '3' } }],
  },
  // ---------- exponents ----------
  {
    qid: 'al-fraction-power-qc', themes: ['exponents', 'fractions'], vars: one(), conditions: '0 < x < 1',
    check: ({ x }) => need(x > 0 && x < 1, 'x must be strictly between 0 and 1.'), A: ({ x }) => x ** 2, B: ({ x }) => Math.sqrt(x),
    try: [{ label: 'x = 1/4', values: { x: '1/4' } }, { label: 'x = 0.9', values: { x: '0.9' } }, { label: 'x = 4', values: { x: '4' } }, { label: 'x = 1', values: { x: '1' } }],
  },
  {
    qid: 'qc-exp-gt1', themes: ['exponents'], vars: one(), conditions: 'x > 1',
    check: ({ x }) => need(x > 1, 'x must be greater than 1.'), A: ({ x }) => x ** 3, B: ({ x }) => x ** 2,
    try: [{ label: 'x = 2', values: { x: '2' } }, { label: 'x = 1.1', values: { x: '1.1' } }, { label: 'x = 1/2', values: { x: '1/2' } }],
  },
  {
    qid: 'qc-exp-neg-frac', themes: ['exponents', 'sign'], vars: one(), conditions: '−1 < x < 0',
    check: ({ x }) => need(x > -1 && x < 0, 'x must be strictly between −1 and 0.'), A: ({ x }) => x ** 3, B: ({ x }) => x ** 2,
    try: [{ label: 'x = −1/2', values: { x: '-1/2' } }, { label: 'x = −0.9', values: { x: '-0.9' } }, { label: 'x = −2', values: { x: '-2' } }],
  },
  // ---------- fractions ----------
  {
    qid: 'qc-frac-shift', themes: ['fractions'], vars: one(), conditions: 'x > 0',
    check: ({ x }) => need(x > 0, 'x must be positive.'), A: ({ x }) => x / (x + 1), B: ({ x }) => (x + 1) / (x + 2),
    try: [{ label: 'x = 1', values: { x: '1' } }, { label: 'x = 1/2', values: { x: '1/2' } }, { label: 'x = 100', values: { x: '100' } }, { label: 'x = −3/2', values: { x: '-3/2' } }],
  },
  // ---------- expressions ----------
  {
    qid: 'qc-expand-square', themes: ['expressions'], vars: [{ name: 'x' }, { name: 'y' }], conditions: 'x > 0 and y > 0',
    check: ({ x, y }) => all(need(x > 0, 'x must be positive.'), need(y > 0, 'y must be positive.')), A: ({ x, y }) => (x + y) ** 2, B: ({ x, y }) => x ** 2 + y ** 2,
    try: [{ label: 'x = 1, y = 1', values: { x: '1', y: '1' } }, { label: 'x = 1/10, y = 5', values: { x: '1/10', y: '5' } }, { label: 'x = 0, y = 2', values: { x: '0', y: '2' } }],
  },
  {
    qid: 'b3-chain-percent-qc', themes: ['expressions'], vars: one('z'), conditions: 'x = 20% of y, y = 50% of z, all positive',
    check: ({ z }) => need(z > 0, 'z must be positive (so x and y are too).'), derive: ({ z }) => ({ y: 0.5 * z, x: 0.1 * z }), A: ({ z }) => 0.2 * (0.5 * z), B: ({ z }) => 0.1 * z,
    try: [{ label: 'z = 100', values: { z: '100' } }, { label: 'z = 7', values: { z: '7' } }],
  },
  // ---------- inequalities ----------
  {
    qid: 'qc-overlap-ranges', themes: ['inequalities', 'd-cases'], vars: [{ name: 'x' }, { name: 'y' }], conditions: '3 < x < 5 and 4 < y < 6',
    check: ({ x, y }) => all(need(x > 3 && x < 5, 'x must be strictly between 3 and 5.'), need(y > 4 && y < 6, 'y must be strictly between 4 and 6.')), A: ({ x }) => x, B: ({ y }) => y,
    try: [{ label: 'x = 4, y = 5', values: { x: '4', y: '5' } }, { label: 'x = 4.9, y = 4.1', values: { x: '4.9', y: '4.1' } }, { label: 'x = 4.5, y = 4.5', values: { x: '4.5', y: '4.5' } }],
  },
  {
    qid: 'ge-third-side-qc', themes: ['inequalities', 'restrictions', 'd-cases'], vars: one('s', 'third side'), conditions: 'sides 5, 9, s form a triangle',
    check: ({ s }) => need(s > 9 - 5 && s < 9 + 5, `A triangle with sides 5 and 9 needs 4 < s < 14 (each side less than the sum of the other two).`), A: ({ s }) => s, B: () => 13,
    try: [{ label: 's = 10', values: { s: '10' } }, { label: 's = 13.5', values: { s: '13.5' } }, { label: 's = 14', values: { s: '14' } }, { label: 's = 13', values: { s: '13' } }],
  },
  // ---------- restrictions ----------
  {
    qid: 'qc-integer-pin', themes: ['restrictions'], vars: one(), conditions: 'x is an integer and 2 < x < 4',
    check: ({ x }) => all(need(isInt(x), 'x must be an integer.'), need(x > 2 && x < 4, 'x must be strictly between 2 and 4.')), A: ({ x }) => x, B: () => 3,
    try: [{ label: 'x = 3', values: { x: '3' } }, { label: 'x = 2.5', values: { x: '2.5' } }, { label: 'x = 4', values: { x: '4' } }],
  },
  {
    qid: 'b3-median-mean-qc', themes: ['restrictions'], vars: one(), conditions: 'the list 3, 7, 7, 10, x has x > 10',
    check: ({ x }) => need(x > 10, 'x must be greater than 10.'), A: () => 7, B: ({ x }) => (3 + 7 + 7 + 10 + x) / 5,
    try: [{ label: 'x = 11', values: { x: '11' } }, { label: 'x = 1000', values: { x: '1000' } }, { label: 'x = 8', values: { x: '8' } }],
  },
  {
    qid: 'b3-odd-primes-qc', themes: ['restrictions'], vars: [{ name: 'p' }, { name: 'q' }], conditions: 'p and q are different primes greater than 2',
    check: ({ p, q }) => all(need(isPrime(p), 'p must be prime.'), need(isPrime(q), 'q must be prime.'), need(p > 2 && q > 2, 'Both primes must be greater than 2.'), need(p !== q, 'p and q must be different.')),
    A: ({ p, q }) => (p + q) % 2, B: () => 0,
    try: [{ label: 'p = 3, q = 5', values: { p: '3', q: '5' } }, { label: 'p = 7, q = 13', values: { p: '7', q: '13' } }, { label: 'p = 2, q = 5', values: { p: '2', q: '5' } }],
  },
  {
    qid: 'b3-venn-min-qc', themes: ['restrictions', 'd-cases'], vars: one('b', 'people who like both'), conditions: '50 people, 30 like tea, 35 like coffee',
    check: ({ b }) => all(need(isInt(b), 'The number of people must be a whole number.'), need(b <= 30, 'At most 30 people can like both (only 30 like tea).'), need(b >= 15, `With ${fmt(b)} in both groups, 30 + 35 − ${fmt(b)} = ${fmt(65 - b)} people like at least one drink, more than the 50 in the group.`)),
    derive: ({ b }) => ({ neither: 50 - (65 - b) }), A: ({ b }) => b, B: () => 15,
    try: [{ label: 'b = 15', values: { b: '15' } }, { label: 'b = 20', values: { b: '20' } }, { label: 'b = 10', values: { b: '10' } }],
  },
  // ---------- D cases ----------
  {
    qid: 'qc-xsq-9', themes: ['d-cases'], vars: one(), conditions: 'x² = 9',
    check: ({ x }) => need(Math.abs(x * x - 9) < EPS, `x² must equal 9 (for this x it is ${fmt(x * x)}).`), A: ({ x }) => x, B: () => 2,
    try: [{ label: 'x = 3', values: { x: '3' } }, { label: 'x = −3', values: { x: '-3' } }, { label: 'x = 2', values: { x: '2' } }],
  },
  {
    qid: 'qc-xy-12', themes: ['d-cases', 'restrictions'], vars: [{ name: 'x' }, { name: 'y' }], conditions: 'x and y are positive integers and xy = 12',
    check: ({ x, y }) => all(need(isInt(x) && isInt(y), 'x and y must be integers.'), need(x > 0 && y > 0, 'x and y must be positive.'), need(Math.abs(x * y - 12) < EPS, `xy must equal 12 (here it is ${fmt(x * y)}).`)), A: ({ x }) => x, B: ({ y }) => y,
    try: [{ label: 'x = 3, y = 4', values: { x: '3', y: '4' } }, { label: 'x = 12, y = 1', values: { x: '12', y: '1' } }, { label: 'x = 1.5, y = 8', values: { x: '1.5', y: '8' } }],
  },
  {
    qid: 'p2-rect-area-qc', themes: ['d-cases'], vars: one('L', 'length'), conditions: 'a rectangle with perimeter 20',
    check: ({ L }) => need(L > 0 && L < 10, 'With perimeter 20, length + width = 10, so the length must be strictly between 0 and 10.'), derive: ({ L }) => ({ width: 10 - L }), A: ({ L }) => L * (10 - L), B: () => 25,
    try: [{ label: 'L = 5', values: { L: '5' } }, { label: 'L = 8', values: { L: '8' } }, { label: 'L = 12', values: { L: '12' } }],
  },
  {
    qid: 'b3-dependent-system-qc', themes: ['d-cases'], vars: one(), conditions: '2x + 3y = 12 and 4x + 6y = 24',
    check: () => true, derive: ({ x }) => ({ y: (12 - 2 * x) / 3 }), A: ({ x }) => x, B: ({ x }) => (12 - 2 * x) / 3,
    try: [{ label: 'x = 0', values: { x: '0' } }, { label: 'x = 6', values: { x: '6' } }, { label: 'x = 12/5', values: { x: '12/5' } }],
  },
];

export const QC_MODEL_BY_QID: Record<string, QCModel> = Object.fromEntries(QC_MODELS.map((m) => [m.qid, m]));

/** Themes for QC questions that have no free variables to test. */
export const QC_FIXED_THEMES: Record<string, QCTheme[]> = {
  'b3-fraction-compare-qc': ['fractions'],
  'ar-pct-change-qc': ['fractions'],
  'b3-lcm-qc': ['restrictions'],
};

export function relation(a: number, b: number): 'A' | 'B' | 'C' {
  return Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)) ? 'C' : a > b ? 'A' : 'B';
}

/** Short decimal display: up to 6 significant digits, no trailing zeros. */
export function fmt(x: number): string {
  if (!Number.isFinite(x)) return String(x);
  if (Math.abs(x) < 1e-12) return '0';
  return String(Number(x.toPrecision(6)));
}
