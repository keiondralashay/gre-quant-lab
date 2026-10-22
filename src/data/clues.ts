const r = String.raw;

/** Phrase → mathematical meaning. */
export interface PhraseItem {
  id: string;
  phrase: string;
  options: string[];
  answer: number;
  explain: string;
}

/**
 * Statement → expression. Each option carries an executable meaning so tests can
 * prove exactly one option equals the reference and no two options are equivalent.
 */
export interface TranslateItem {
  id: string;
  statement: string;
  options: { tex: string; f: (x: number, y: number) => number | boolean }[];
  answer: number;
  /** Independent reference meaning used only by tests. */
  ref: (x: number, y: number) => number | boolean;
  explain: string;
}

export interface ReverseItem {
  id: string;
  expression: string;
  options: string[];
  answer: number;
  explain: string;
}

/** Two near-identical wordings with different meanings. */
export interface TrapPair {
  id: string;
  a: { words: string; math: string };
  b: { words: string; math: string };
  why: string;
}

export const PHRASES: PhraseItem[] = [
  { id: 'at-least', phrase: 'x is at least 5', options: [r`$x \ge 5$`, r`$x > 5$`, r`$x \le 5$`, r`$x < 5$`], answer: 0, explain: '"At least 5" means 5 or more, so 5 itself is allowed.' },
  { id: 'at-most', phrase: 'x is at most 5', options: [r`$x \le 5$`, r`$x < 5$`, r`$x \ge 5$`, r`$x > 5$`], answer: 0, explain: '"At most" means 5 or less.' },
  { id: 'no-more-than', phrase: 'x is no more than 5', options: [r`$x \le 5$`, r`$x < 5$`, r`$x \ge 5$`, r`$x > 5$`], answer: 0, explain: '"No more than" means it cannot exceed 5, but it can equal it.' },
  { id: 'no-less-than', phrase: 'x is no less than 5', options: [r`$x \ge 5$`, r`$x > 5$`, r`$x \le 5$`, r`$x < 5$`], answer: 0, explain: '"No less than" is the same as "at least".' },
  { id: 'more-than', phrase: 'x is more than 5', options: [r`$x > 5$`, r`$x \ge 5$`, r`$x < 5$`, r`$x \ne 5$`], answer: 0, explain: '"More than" is strict: 5 itself is NOT allowed.' },
  { id: 'fewer-than', phrase: 'fewer than 5 students', options: [r`$s < 5$`, r`$s \le 5$`, r`$s > 5$`, r`$s - 5$`], answer: 0, explain: 'Strict inequality: 5 is not included.' },
  { id: 'consecutive', phrase: 'three consecutive integers', options: [r`$n,\ n+1,\ n+2$`, r`$n,\ 2n,\ 3n$`, r`$n,\ n+2,\ n+4$`, r`$1,\ 2,\ 3$`], answer: 0, explain: 'Consecutive integers go up by 1. They can start anywhere, including at a negative number.' },
  { id: 'consecutive-even', phrase: 'three consecutive even integers', options: [r`$n,\ n+2,\ n+4$ ($n$ even)`, r`$n,\ n+1,\ n+2$`, r`$2,\ 4,\ 6$`, r`$2n,\ 4n,\ 6n$`], answer: 0, explain: 'Consecutive evens (or odds) go up by 2.' },
  { id: 'distinct', phrase: 'a, b, and c are distinct', options: ['no two of them are equal', 'they are all positive', 'they are all integers', 'they are in increasing order'], answer: 0, explain: '"Distinct" only means different from one another.' },
  { id: 'divisible', phrase: 'n is divisible by 6', options: [r`$n = 6k$ for some integer $k$`, r`$6 = nk$`, r`$n < 6$`, r`$\frac{6}{n}$ is an integer`], answer: 0, explain: 'n ÷ 6 leaves no remainder, so n is 6 times an integer.' },
  { id: 'multiple', phrase: 'n is a multiple of 4', options: [r`$n = 4k$ for some integer $k$`, r`$4 = nk$`, 'n divides 4', r`$n = 4 + k$`], answer: 0, explain: 'Multiples of 4: …, −4, 0, 4, 8, ….' },
  { id: 'factor', phrase: 'n is a factor of 24', options: ['24 ÷ n leaves no remainder', 'n ÷ 24 leaves no remainder', 'n is a multiple of 24', 'n < 24'], answer: 0, explain: 'A factor divides the number evenly. Do not confuse factor with multiple.' },
  { id: 'remainder', phrase: 'n leaves a remainder of 2 when divided by 5', options: [r`$n = 5q + 2$, $q$ an integer`, r`$n = 2q + 5$`, r`$\frac{n}{5} = 2$`, r`$n - 5 = 2$`], answer: 0, explain: 'Remainder = what is left after taking out as many 5s as possible.' },
  { id: 'twice', phrase: 'twice a number', options: [r`$2x$`, r`$x^2$`, r`$x + 2$`, r`$\frac{x}{2}$`], answer: 0, explain: '"Twice" means multiply by 2, not square.' },
  { id: 'half', phrase: 'half of a number', options: [r`$\frac{x}{2}$`, r`$2x$`, r`$x - 2$`, r`$x^{1/2}$`], answer: 0, explain: '"Half of" means multiply by ½.' },
  { id: 'of', phrase: '30% of y', options: [r`$0.3y$`, r`$y + 0.3$`, r`$\frac{y}{0.3}$`, r`$30y$`], answer: 0, explain: '"Of" means multiply; % means ÷ 100.' },
  { id: 'percent-increase', phrase: 'the percent increase from a to b', options: [r`$\frac{b - a}{a} \times 100$`, r`$\frac{b - a}{b} \times 100$`, r`$\frac{b}{a} \times 100$`, r`$(b - a) \times 100$`], answer: 0, explain: 'Divide the change by the ORIGINAL (a).' },
  { id: 'percent-decrease', phrase: 'the percent decrease from b to a (b > a)', options: [r`$\frac{b - a}{b} \times 100$`, r`$\frac{b - a}{a} \times 100$`, r`$\frac{a}{b} \times 100$`, r`$b - a$`], answer: 0, explain: 'The original is b this time.' },
  { id: 'minimum', phrase: 'the minimum value of x', options: ['the smallest value x can take', 'the value x usually takes', 'the largest value x can take', 'any negative value'], answer: 0, explain: '"Minimum" or "least possible" means the smallest allowed value.' },
  { id: 'maximum', phrase: 'the greatest possible value of x', options: ['the largest value x can take', 'the value of x that occurs most', 'the average value of x', 'the value of |x|'], answer: 0, explain: 'Push x as high as the conditions allow.' },
  { id: 'positive-integer', phrase: 'k is a positive integer', options: [r`$k \in \{1, 2, 3, \dots\}$`, r`$k \in \{0, 1, 2, \dots\}$`, r`$k > 0$ (any real number)`, r`$k \neq 0$`], answer: 0, explain: 'Positive excludes 0, and integer excludes fractions.' },
  { id: 'nonzero', phrase: 'x is nonzero', options: [r`$x \neq 0$`, r`$x > 0$`, r`$x \ge 0$`, r`$x = 0$`], answer: 0, explain: 'Nonzero allows negatives.' },
  { id: 'inclusive', phrase: 'the integers from 3 to 9, inclusive', options: ['3, 4, 5, 6, 7, 8, 9 (7 integers)', '4, 5, 6, 7, 8 (5 integers)', '3, 4, 5, 6, 7, 8 (6 integers)', '4 through 9 (6 integers)'], answer: 0, explain: 'Inclusive keeps both endpoints. Count = last − first + 1.' },
  { id: 'exclusive', phrase: 'the integers strictly between 3 and 9', options: ['4, 5, 6, 7, 8 (5 integers)', '3 through 9 (7 integers)', '3 through 8 (6 integers)', '4 through 9 (6 integers)'], answer: 0, explain: '"Strictly between" excludes both endpoints.' },
  { id: 'exceeds', phrase: 'a exceeds b by 4', options: [r`$a = b + 4$`, r`$b = a + 4$`, r`$a > 4b$`, r`$a - 4 > b$`], answer: 0, explain: 'a is 4 more than b.' },
  { id: 'quotient', phrase: 'the quotient of x and 3', options: [r`$\frac{x}{3}$`, r`$\frac{3}{x}$`, r`$3x$`, r`$x - 3$`], answer: 0, explain: 'Quotient = division, in the order named.' },
];

export const TRANSLATIONS: TranslateItem[] = [
  {
    id: 'five-less-twice',
    statement: 'Five less than twice a number',
    options: [
      { tex: r`$2x - 5$`, f: (x) => 2 * x - 5 },
      { tex: r`$5 - 2x$`, f: (x) => 5 - 2 * x },
      { tex: r`$2(x - 5)$`, f: (x) => 2 * (x - 5) },
      { tex: r`$2x + 5$`, f: (x) => 2 * x + 5 },
    ],
    answer: 0,
    ref: (x) => x * 2 - 5,
    explain: '"Five less than A" means A − 5. A is "twice a number" = 2x. The order reverses.',
  },
  {
    id: 'three-more-half',
    statement: 'Three more than half a number',
    options: [
      { tex: r`$\frac{x}{2} + 3$`, f: (x) => x / 2 + 3 },
      { tex: r`$\frac{x + 3}{2}$`, f: (x) => (x + 3) / 2 },
      { tex: r`$\frac{3x}{2}$`, f: (x) => (3 * x) / 2 },
      { tex: r`$\frac{x}{2} - 3$`, f: (x) => x / 2 - 3 },
    ],
    answer: 0,
    ref: (x) => 0.5 * x + 3,
    explain: 'Take half first, then add 3.',
  },
  {
    id: 'product-decreased',
    statement: 'The product of a number and 4, decreased by 7',
    options: [
      { tex: r`$4x - 7$`, f: (x) => 4 * x - 7 },
      { tex: r`$4(x - 7)$`, f: (x) => 4 * (x - 7) },
      { tex: r`$7 - 4x$`, f: (x) => 7 - 4 * x },
      { tex: r`$4x + 7$`, f: (x) => 4 * x + 7 },
    ],
    answer: 0,
    ref: (x) => x * 4 - 7,
    explain: 'The comma groups "the product of a number and 4" first; then subtract 7.',
  },
  {
    id: 'square-of-sum',
    statement: 'The square of the sum of a number and 3',
    options: [
      { tex: r`$(x + 3)^2$`, f: (x) => (x + 3) ** 2 },
      { tex: r`$x^2 + 3$`, f: (x) => x ** 2 + 3 },
      { tex: r`$x^2 + 9$`, f: (x) => x ** 2 + 9 },
      { tex: r`$3x^2$`, f: (x) => 3 * x ** 2 },
    ],
    answer: 0,
    ref: (x) => x * x + 6 * x + 9,
    explain: '"The square of the sum": add first, then square.',
  },
  {
    id: 'sum-of-squares',
    statement: 'The sum of the squares of a number and 3',
    options: [
      { tex: r`$x^2 + 9$`, f: (x) => x ** 2 + 9 },
      { tex: r`$(x + 3)^2$`, f: (x) => (x + 3) ** 2 },
      { tex: r`$x^2 + 3$`, f: (x) => x ** 2 + 3 },
      { tex: r`$2x + 6$`, f: (x) => 2 * x + 6 },
    ],
    answer: 0,
    ref: (x) => x * x + 3 * 3,
    explain: '"The sum of the squares": square each, then add: x² + 3².',
  },
  {
    id: 'twenty-percent-of',
    statement: 'Twenty percent of a number',
    options: [
      { tex: r`$0.2x$`, f: (x) => 0.2 * x },
      { tex: r`$20x$`, f: (x) => 20 * x },
      { tex: r`$\frac{x}{20}$`, f: (x) => x / 20 },
      { tex: r`$1.2x$`, f: (x) => 1.2 * x },
    ],
    answer: 0,
    ref: (x) => (x * 20) / 100,
    explain: '20% = 0.2; "of" = multiply.',
  },
  {
    id: 'increased-by-20-percent',
    statement: 'A number increased by 20%',
    options: [
      { tex: r`$1.2x$`, f: (x) => 1.2 * x },
      { tex: r`$0.2x$`, f: (x) => 0.2 * x },
      { tex: r`$x + 20$`, f: (x) => x + 20 },
      { tex: r`$0.8x$`, f: (x) => 0.8 * x },
    ],
    answer: 0,
    ref: (x) => x + 0.2 * x,
    explain: 'The original plus 20% of it: x + 0.2x = 1.2x.',
  },
  {
    id: 'seven-less-at-least',
    statement: 'Seven less than a number is at least 12',
    options: [
      { tex: r`$x - 7 \ge 12$`, f: (x) => x - 7 >= 12 },
      { tex: r`$7 - x \ge 12$`, f: (x) => 7 - x >= 12 },
      { tex: r`$x - 7 > 12$`, f: (x) => x - 7 > 12 },
      { tex: r`$x - 7 \le 12$`, f: (x) => x - 7 <= 12 },
    ],
    answer: 0,
    ref: (x) => x >= 19,
    explain: '"Seven less than a number" is x − 7. "At least" is ≥.',
  },
  {
    id: 'no-more-than-3-less',
    statement: 'x is no more than 3 less than twice y',
    options: [
      { tex: r`$x \le 2y - 3$`, f: (x, y) => x <= 2 * y - 3 },
      { tex: r`$x \le 3 - 2y$`, f: (x, y) => x <= 3 - 2 * y },
      { tex: r`$x \ge 2y - 3$`, f: (x, y) => x >= 2 * y - 3 },
      { tex: r`$x < 2y - 3$`, f: (x, y) => x < 2 * y - 3 },
    ],
    answer: 0,
    ref: (x, y) => !(x > 2 * y - 3),
    explain: '"3 less than twice y" is 2y − 3. "No more than" is ≤.',
  },
  {
    id: 'quotient-exceeds',
    statement: 'The quotient of a number and 5 exceeds 8',
    options: [
      { tex: r`$\frac{x}{5} > 8$`, f: (x) => x / 5 > 8 },
      { tex: r`$\frac{5}{x} > 8$`, f: (x) => x !== 0 && 5 / x > 8 },
      { tex: r`$x - 5 > 8$`, f: (x) => x - 5 > 8 },
      { tex: r`$\frac{x}{5} \ge 8$`, f: (x) => x / 5 >= 8 },
    ],
    answer: 0,
    ref: (x) => x > 40,
    explain: 'Quotient of x and 5 = x/5. "Exceeds" is strictly greater.',
  },
  {
    id: 'difference-divided',
    statement: 'The difference of a number and 6, divided by 2',
    options: [
      { tex: r`$\frac{x - 6}{2}$`, f: (x) => (x - 6) / 2 },
      { tex: r`$x - \frac{6}{2}$`, f: (x) => x - 3 },
      { tex: r`$\frac{6 - x}{2}$`, f: (x) => (6 - x) / 2 },
      { tex: r`$2(x - 6)$`, f: (x) => 2 * (x - 6) },
    ],
    answer: 0,
    ref: (x) => x / 2 - 3,
    explain: 'The comma means the whole difference (x − 6) is divided by 2.',
  },
  {
    id: 'consecutive-sum',
    statement: 'The sum of three consecutive integers, the smallest of which is n',
    options: [
      { tex: r`$3n + 3$`, f: (n) => 3 * n + 3 },
      { tex: r`$3n$`, f: (n) => 3 * n },
      { tex: r`$3n + 6$`, f: (n) => 3 * n + 6 },
      { tex: r`$n + 3$`, f: (n) => n + 3 },
    ],
    answer: 0,
    ref: (n) => n + (n + 1) + (n + 2),
    explain: 'n + (n + 1) + (n + 2) = 3n + 3.',
  },
  {
    id: 'average-is-four-times',
    statement: 'The average of a number and 10 is 4 times the number',
    options: [
      { tex: r`$\frac{x + 10}{2} = 4x$`, f: (x) => Math.abs((x + 10) / 2 - 4 * x) < 1e-9 },
      { tex: r`$x + \frac{10}{2} = 4x$`, f: (x) => Math.abs(x + 5 - 4 * x) < 1e-9 },
      { tex: r`$\frac{x + 10}{2} = x + 4$`, f: (x) => Math.abs((x + 10) / 2 - (x + 4)) < 1e-9 },
      { tex: r`$\frac{4x + 10}{2} = x$`, f: (x) => Math.abs((4 * x + 10) / 2 - x) < 1e-9 },
    ],
    answer: 0,
    ref: (x) => Math.abs(x - 10 / 7) < 1e-9,
    explain: 'Average of two numbers = (sum)/2. "Is" means =, and "4 times the number" is 4x.',
  },
];

export const REVERSES: ReverseItem[] = [
  { id: 'three-times-sum', expression: r`$3(x + 4)$`, options: ['three times the sum of a number and 4', 'three times a number, plus 4', 'the sum of 3 and 4 times a number', 'four more than three times a number'], answer: 0, explain: 'The parentheses make (x + 4) one quantity, which is then tripled.' },
  { id: 'sq-minus-5', expression: r`$x^2 - 5$`, options: ['five less than the square of a number', 'the square of five less than a number', 'five minus the square of a number', 'twice a number minus 5'], answer: 0, explain: 'Square first, then subtract 5.' },
  { id: 'sq-of-diff', expression: r`$(x - 5)^2$`, options: ['the square of five less than a number', 'five less than the square of a number', 'the square of a number minus the square of 5', 'twice the difference of a number and 5'], answer: 0, explain: 'Subtract first, then square.' },
  { id: 'half-minus-1', expression: r`$\frac{x}{2} - 1$`, options: ['one less than half a number', 'half of one less than a number', 'one minus half a number', 'half of a number and 1'], answer: 0, explain: 'Halve first, then subtract 1.' },
  { id: 'consecutive', expression: r`$n + (n + 1) + (n + 2)$`, options: ['the sum of three consecutive integers', 'three times a number plus 2', 'the sum of three consecutive even integers', 'the product of three consecutive integers'], answer: 0, explain: 'Each term is 1 more than the last.' },
  { id: 'ge-18', expression: r`$y \ge 18$`, options: ['y is at least 18', 'y is no more than 18', 'y is more than 18', 'y is less than 18'], answer: 0, explain: '≥ includes 18 itself: "at least", "no less than".' },
  { id: 'discount', expression: r`$0.85p$`, options: ['the price p after a 15% discount', 'the price p after an 85% discount', '15% of the price p', 'the price p after a 15% increase'], answer: 0, explain: 'Paying 85% means 15% was taken off.' },
  { id: 'multiple-7', expression: r`$x = 7k$, where $k$ is an integer`, options: ['x is a multiple of 7', 'x is a factor of 7', 'x leaves a remainder of k when divided by 7', 'x is greater than 7'], answer: 0, explain: '7 times an integer is a multiple of 7.' },
  { id: 'inclusive', expression: r`$1 \le n \le 10$`, options: ['n is between 1 and 10, inclusive', 'n is strictly between 1 and 10', 'n is at most 1 or at least 10', 'n is more than 1 and less than 10'], answer: 0, explain: '≤ on both ends includes the endpoints.' },
];

export const TRAPS: TrapPair[] = [
  { id: 'less-than-order', a: { words: '5 less than x', math: r`$x - 5$` }, b: { words: '5 is less than x', math: r`$5 < x$` }, why: '"Less than" alone is subtraction in reverse order. "IS less than" is an inequality.' },
  { id: 'twice-sum', a: { words: 'twice the sum of x and 3', math: r`$2(x + 3)$` }, b: { words: 'the sum of twice x and 3', math: r`$2x + 3$` }, why: 'What "twice" applies to changes with the word order.' },
  { id: 'at-least-vs-more', a: { words: 'x is at least 5', math: r`$x \ge 5$` }, b: { words: 'x is more than 5', math: r`$x > 5$` }, why: '"At least" includes 5; "more than" does not.' },
  { id: 'percent-vs-number', a: { words: 'x decreased by 20%', math: r`$0.8x$` }, b: { words: 'x decreased by 20', math: r`$x - 20$` }, why: 'A percent is relative to x; a number is a fixed amount.' },
  { id: 'positive-vs-nonnegative', a: { words: 'n is a positive integer', math: r`$n \ge 1$` }, b: { words: 'n is a nonnegative integer', math: r`$n \ge 0$` }, why: 'Nonnegative includes 0; positive does not.' },
  { id: 'neg-square', a: { words: 'the negative of x squared', math: r`$-x^2$` }, b: { words: 'the square of negative x', math: r`$(-x)^2$` }, why: 'For x = 3: −9 versus 9. Parentheses decide what is squared.' },
  { id: 'divided-into', a: { words: 'x divided by 4', math: r`$\frac{x}{4}$` }, b: { words: '4 divided by x', math: r`$\frac{4}{x}$` }, why: 'The first number named goes on top.' },
  { id: 'inclusive-count', a: { words: 'integers from 1 to 10, inclusive', math: '10 integers' }, b: { words: 'integers strictly between 1 and 10', math: '8 integers' }, why: 'Inclusive keeps both ends; strictly between removes both.' },
];
