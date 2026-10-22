// "Decode the Equation" lessons: identify what each letter, number, and symbol means
// before solving anything. Number answers are exact strings parsed by parseRational.

const r = String.raw;

export type DecodeField =
  | { id: string; label: string; kind: 'number'; answer: string; explain: string }
  | { id: string; label: string; kind: 'choice'; options: string[]; answer: number; explain: string };

export interface DecodeExercise {
  id: string;
  prompt: string;
  fields: DecodeField[];
  /** Shown after checking (e.g. the rearranged equation). */
  reveal?: string[];
}

export interface DecodeLesson {
  id: string;
  title: string;
  summary: string;
  form?: string;
  parts: { symbol: string; meaning: string }[];
  example: { expr: string; breakdown: string[]; notes: string[] };
  exercises: DecodeExercise[];
  /** Enables generated practice in the UI. */
  generator?: 'quadratic';
}

export const DECODE_LESSONS: DecodeLesson[] = [
  {
    id: 'quadratic',
    title: 'Quadratic equations',
    summary: 'A quadratic has a squared variable (x²) as its highest power. Before solving, name its three coefficients a, b, and c.',
    form: r`ax^2 + bx + c = 0`,
    parts: [
      { symbol: 'a', meaning: r`the coefficient of $x^2$ (the number multiplying $x^2$)` },
      { symbol: 'b', meaning: r`the coefficient of $x$` },
      { symbol: 'c', meaning: 'the constant term (the number with no variable)' },
      { symbol: 'x', meaning: 'the variable you are solving for' },
      { symbol: r`$a \neq 0$`, meaning: r`if a were 0, the $x^2$ term would vanish and the equation would be linear, not quadratic` },
    ],
    example: {
      expr: r`x^2 - 9x + 20 = 0`,
      breakdown: [r`$a = 1$`, r`$b = -9$`, r`$c = 20$`],
      notes: [
        r`Why is $a = 1$? When no number is written in front of $x^2$, the coefficient is an invisible 1: $x^2 = 1 \cdot x^2$.`,
        r`Why is $b = -9$ and not 9? The sign in front of a term belongs to that term. $x^2 - 9x + 20$ means $x^2 + (-9)x + 20$.`,
      ],
    },
    exercises: [
      {
        id: 'quad-1',
        prompt: r`Identify a, b, and c in $3x^2 - 11x + 6 = 0$.`,
        fields: [
          { id: 'a', label: 'a', kind: 'number', answer: '3', explain: r`a multiplies $x^2$: here $3x^2$, so a = 3.` },
          { id: 'b', label: 'b', kind: 'number', answer: '-11', explain: 'The minus sign belongs to b: −11x means b = −11.' },
          { id: 'c', label: 'c', kind: 'number', answer: '6', explain: 'The constant term is +6.' },
        ],
      },
      {
        id: 'quad-rearrange',
        prompt: r`$3x^2 + 6 = 11x$ is not in standard form. Rearrange it so one side is 0 (keep $x^2$ on the left), then enter a, b, and c.`,
        fields: [
          {
            id: 'move',
            label: 'What do you do first?',
            kind: 'choice',
            options: [r`Subtract $11x$ from both sides`, r`Divide both sides by $x$`, r`Subtract 6 from both sides`, r`Add $11x$ to both sides`],
            answer: 0,
            explain: r`You need 0 on one side. Subtracting $11x$ moves it left as $-11x$. (Dividing by x is never safe, since x could be 0.)`,
          },
          { id: 'a', label: 'a', kind: 'number', answer: '3', explain: r`The $x^2$ term is unchanged: a = 3.` },
          { id: 'b', label: 'b', kind: 'number', answer: '-11', explain: r`$+11x$ on the right becomes $-11x$ on the left: b = −11.` },
          { id: 'c', label: 'c', kind: 'number', answer: '6', explain: 'The +6 is already on the left: c = 6.' },
        ],
        reveal: [r`$3x^2 + 6 - 11x = 0$`, r`Reorder by power: $3x^2 - 11x + 6 = 0$`],
      },
    ],
    generator: 'quadratic',
  },
  {
    id: 'linear',
    title: 'Linear equations',
    summary: 'A linear equation has a variable to the first power only (no x², no x in a denominator). You solve it with inverse operations: undo each operation in reverse order.',
    form: r`ax + b = c`,
    parts: [
      { symbol: 'x', meaning: 'the variable (unknown)' },
      { symbol: 'a', meaning: 'the coefficient: the number multiplying x' },
      { symbol: 'b, c', meaning: 'constants: fixed numbers' },
      { symbol: 'inverse operation', meaning: 'the operation that undoes another: + ↔ −, × ↔ ÷' },
    ],
    example: {
      expr: r`4x + 7 = 31`,
      breakdown: ['Variable: x', 'Coefficient of x: 4', 'Constants: 7 and 31'],
      notes: [
        'Building the left side: start with x, multiply by 4, then add 7.',
        'To undo it, reverse the order: subtract 7 first (4x = 24), then divide by 4 (x = 6).',
      ],
    },
    exercises: [
      {
        id: 'lin-1',
        prompt: r`In $5x - 8 = 27$:`,
        fields: [
          { id: 'coef', label: 'Coefficient of x', kind: 'number', answer: '5', explain: '5 multiplies x.' },
          { id: 'const', label: 'Constant on the left side', kind: 'number', answer: '-8', explain: 'The minus sign belongs to the 8: the constant is −8.' },
          {
            id: 'first',
            label: 'First inverse operation',
            kind: 'choice',
            options: ['Add 8 to both sides', 'Divide both sides by 5', 'Subtract 8 from both sides', 'Multiply both sides by 5'],
            answer: 0,
            explain: '−8 was applied last, so undo it first by adding 8: 5x = 35.',
          },
          { id: 'x', label: 'x', kind: 'number', answer: '7', explain: '5x = 35 → x = 7.' },
        ],
      },
    ],
  },
  {
    id: 'slope-intercept',
    title: 'Slope-intercept form',
    summary: 'y = mx + b describes a straight line. m tells you how steep the line is and which way it tilts; b tells you where it crosses the y-axis.',
    form: r`y = mx + b`,
    parts: [
      { symbol: 'm', meaning: 'slope = rise ÷ run (how much y changes when x increases by 1)' },
      { symbol: 'b', meaning: 'y-intercept: the value of y when x = 0' },
      { symbol: 'm > 0', meaning: 'the line rises from left to right' },
      { symbol: 'm < 0', meaning: 'the line falls from left to right' },
      { symbol: 'm = 0', meaning: 'a horizontal line' },
    ],
    example: {
      expr: r`y = -2x + 5`,
      breakdown: [r`$m = -2$ (falls 2 units for every 1 unit right)`, r`$b = 5$ (crosses the y-axis at (0, 5))`],
      notes: ['The b in y = mx + b is NOT the same as the b in ax² + bx + c. Letters are reused across formulas, so always check which form you are in.'],
    },
    exercises: [
      {
        id: 'slope-1',
        prompt: r`For $y = \frac{3}{4}x - 6$:`,
        fields: [
          { id: 'm', label: 'm (slope)', kind: 'number', answer: '3/4', explain: r`The coefficient of x is $\frac34$.` },
          { id: 'b', label: 'b (y-intercept)', kind: 'number', answer: '-6', explain: 'The sign belongs to the constant: b = −6.' },
          { id: 'dir', label: 'The line…', kind: 'choice', options: ['rises left to right', 'falls left to right', 'is horizontal'], answer: 0, explain: 'm is positive, so the line rises.' },
        ],
      },
      {
        id: 'slope-2',
        prompt: r`$2y = 6x + 8$ is not yet in $y = mx + b$ form. Solve for y, then identify m and b.`,
        fields: [
          { id: 'm', label: 'm', kind: 'number', answer: '3', explain: 'Divide every term by 2: y = 3x + 4.' },
          { id: 'b', label: 'b', kind: 'number', answer: '4', explain: '8 ÷ 2 = 4.' },
        ],
        reveal: [r`$y = 3x + 4$`],
      },
    ],
  },
  {
    id: 'exponents',
    title: 'Exponents',
    summary: 'An exponent tells you how many times to multiply the base by itself. Parentheses decide exactly what the base is.',
    form: r`b^{n}`,
    parts: [
      { symbol: 'b', meaning: 'the base: the number being multiplied' },
      { symbol: 'n', meaning: 'the exponent (power): how many copies of the base are multiplied' },
      { symbol: r`$b^0$`, meaning: '= 1 for any nonzero b' },
      { symbol: r`$b^{-n}$`, meaning: r`$= \frac{1}{b^n}$ (a negative exponent means a reciprocal, not a negative number)` },
    ],
    example: {
      expr: r`5^3 = 5 \cdot 5 \cdot 5 = 125`,
      breakdown: ['Base: 5', 'Exponent: 3', 'Value: 125'],
      notes: [r`$5^3$ is NOT $5 \times 3$. The exponent counts copies of the base.`],
    },
    exercises: [
      {
        id: 'exp-1',
        prompt: r`Compare $(-2)^4$ and $-2^4$.`,
        fields: [
          { id: 'base1', label: r`Base of $(-2)^4$`, kind: 'number', answer: '-2', explain: 'The parentheses make −2 the base.' },
          { id: 'val1', label: r`Value of $(-2)^4$`, kind: 'number', answer: '16', explain: '(−2)(−2)(−2)(−2) = 16: an even number of negatives.' },
          { id: 'base2', label: r`Base of $-2^4$`, kind: 'number', answer: '2', explain: r`Without parentheses, only 2 is raised to the power: $-2^4 = -(2^4)$.` },
          { id: 'val2', label: r`Value of $-2^4$`, kind: 'number', answer: '-16', explain: r`$-(2^4) = -16$.` },
        ],
      },
      {
        id: 'exp-2',
        prompt: r`What is $3^{-2}$?`,
        fields: [{ id: 'v', label: 'Value', kind: 'number', answer: '1/9', explain: r`$3^{-2} = \frac{1}{3^2} = \frac19$.` }],
      },
    ],
  },
  {
    id: 'fractions',
    title: 'Fractions',
    summary: 'A fraction is a division: numerator ÷ denominator. You may cancel only common FACTORS (things multiplied), never terms that are added.',
    form: r`\frac{\text{numerator}}{\text{denominator}}`,
    parts: [
      { symbol: 'numerator', meaning: 'the top number: how many parts you have' },
      { symbol: 'denominator', meaning: 'the bottom number: how many equal parts make a whole (never 0)' },
      { symbol: 'reciprocal', meaning: r`the fraction flipped: the reciprocal of $\frac{a}{b}$ is $\frac{b}{a}$. A number times its reciprocal is 1.` },
    ],
    example: {
      expr: r`\frac{12}{18} = \frac{6 \cdot 2}{6 \cdot 3} = \frac{2}{3}`,
      breakdown: ['Numerator 12, denominator 18', 'Common factor 6 cancels', r`Reciprocal of $\frac23$ is $\frac32$`],
      notes: [r`Safe: $\frac{3x}{3y} = \frac{x}{y}$, because 3 multiplies both. Not safe: $\frac{x+3}{y+3} \neq \frac{x}{y}$, because 3 is added, not multiplied.`],
    },
    exercises: [
      {
        id: 'frac-1',
        prompt: r`Work with $\frac{20}{35}$.`,
        fields: [
          { id: 'simp', label: 'Simplified fraction', kind: 'number', answer: '4/7', explain: r`Both are divisible by 5: $\frac{4}{7}$.` },
          { id: 'recip', label: r`Reciprocal of $\frac{4}{7}$`, kind: 'number', answer: '7/4', explain: 'Flip it.' },
          {
            id: 'cancel',
            label: 'Which simplification is valid?',
            kind: 'choice',
            options: [r`$\frac{5x}{5y} = \frac{x}{y}$`, r`$\frac{x+5}{y+5} = \frac{x}{y}$`, r`$\frac{x+5}{5} = x$`],
            answer: 0,
            explain: 'Only common factors cancel. In the other two, 5 is added, not multiplied.',
          },
        ],
      },
    ],
  },
  {
    id: 'geometry',
    title: 'Geometry formulas',
    summary: 'Every geometry formula is a recipe. Know what each letter measures before you substitute.',
    parts: [
      { symbol: r`$A = \frac12 bh$`, meaning: 'triangle area. b = base; h = height, measured perpendicular (at 90°) to the base' },
      { symbol: 'r', meaning: 'radius: center to edge of a circle' },
      { symbol: 'd', meaning: 'diameter: edge to edge through the center; d = 2r' },
      { symbol: r`$C = 2\pi r$`, meaning: 'circumference: distance around a circle' },
      { symbol: r`$A = \pi r^2$`, meaning: 'circle area' },
      { symbol: r`$a^2 + b^2 = c^2$`, meaning: 'Pythagorean theorem. a, b = legs; c = hypotenuse, the side opposite the right angle' },
    ],
    example: {
      expr: r`\text{Circle with } d = 10`,
      breakdown: [r`$r = 5$`, r`$C = 2\pi(5) = 10\pi$`, r`$A = \pi(5)^2 = 25\pi$`],
      notes: ['The most common error is using the diameter where the formula needs the radius. Convert first.', 'Height must be perpendicular to the base. A slanted side is not the height.'],
    },
    exercises: [
      {
        id: 'geo-1',
        prompt: r`A circle has diameter 14.`,
        fields: [
          { id: 'r', label: 'Radius r', kind: 'number', answer: '7', explain: 'r = d ÷ 2.' },
          { id: 'area', label: r`Area $= k\pi$. Enter k`, kind: 'number', answer: '49', explain: r`$\pi \cdot 7^2 = 49\pi$.` },
          { id: 'circ', label: r`Circumference $= k\pi$. Enter k`, kind: 'number', answer: '14', explain: r`$2\pi \cdot 7 = 14\pi$.` },
        ],
      },
      {
        id: 'geo-2',
        prompt: 'A triangle has base 10 and a perpendicular height of 6.',
        fields: [{ id: 'A', label: 'Area', kind: 'number', answer: '30', explain: r`$\frac12 \cdot 10 \cdot 6 = 30$.` }],
      },
    ],
  },
  {
    id: 'ratios',
    title: 'Ratios and proportions',
    summary: 'A ratio compares two quantities in a fixed ORDER. "a to b" is written a : b or a/b. Swapping the order changes the meaning.',
    form: r`a : b`,
    parts: [
      { symbol: 'a', meaning: 'the first quantity named' },
      { symbol: 'b', meaning: 'the second quantity named' },
      { symbol: 'parts', meaning: 'in a : b, the whole contains a + b equal parts' },
      { symbol: 'proportion', meaning: r`two equal ratios: $\frac{a}{b} = \frac{c}{d}$` },
    ],
    example: {
      expr: r`\text{boys : girls} = 3 : 5,\ \text{40 students}`,
      breakdown: ['3 + 5 = 8 parts', '40 ÷ 8 = 5 students per part', 'Boys = 15, girls = 25'],
      notes: ['"Boys to girls" puts boys first. The ratio of girls to boys would be 5 : 3.'],
    },
    exercises: [
      {
        id: 'ratio-1',
        prompt: 'The ratio of cats to dogs at a shelter is 2 : 7. There are 54 animals (only cats and dogs).',
        fields: [
          { id: 'parts', label: 'Total parts', kind: 'number', answer: '9', explain: '2 + 7 = 9.' },
          { id: 'cats', label: 'Cats', kind: 'number', answer: '12', explain: '54 ÷ 9 = 6 per part; 2 × 6 = 12.' },
          { id: 'dc', label: 'Ratio of dogs to cats, as a fraction', kind: 'number', answer: '7/2', explain: 'Reverse the order: 7 : 2 = 7/2.' },
        ],
      },
    ],
  },
  {
    id: 'inequalities',
    title: 'Inequalities',
    summary: 'An inequality describes a RANGE of values. Solve it like an equation, with one rule: multiplying or dividing by a negative number reverses the sign.',
    parts: [
      { symbol: '<', meaning: 'is less than' },
      { symbol: '>', meaning: 'is greater than' },
      { symbol: '≤', meaning: 'is less than or equal to ("at most", "no more than")' },
      { symbol: '≥', meaning: 'is greater than or equal to ("at least", "no less than")' },
      { symbol: 'a < x < b', meaning: 'x is strictly between a and b' },
    ],
    example: {
      expr: r`-3x > 12`,
      breakdown: ['Divide both sides by −3', r`Flip the sign: $x < -4$`],
      notes: ['Check with a test value: x = −5 gives 15 > 12 ✓. x = 0 gives 0 > 12 ✗. So x < −4 is right.'],
    },
    exercises: [
      {
        id: 'ineq-1',
        prompt: r`Solve $-2x + 1 \le 9$.`,
        fields: [
          { id: 'step', label: r`After subtracting 1: $-2x \le 8$. Dividing by −2 gives…`, kind: 'choice', options: [r`$x \ge -4$`, r`$x \le -4$`, r`$x \ge 4$`, r`$x \le 4$`], answer: 0, explain: 'Dividing by a negative flips ≤ to ≥: x ≥ −4.' },
          { id: 'words', label: '"x is no more than 5" means…', kind: 'choice', options: [r`$x \le 5$`, r`$x < 5$`, r`$x \ge 5$`, r`$x > 5$`], answer: 0, explain: '"No more than" allows 5 itself: ≤.' },
        ],
      },
    ],
  },
  {
    id: 'probability',
    title: 'Probability',
    summary: 'Probability = favorable outcomes ÷ total possible outcomes, when every outcome is equally likely.',
    form: r`P = \frac{\text{favorable}}{\text{total}}`,
    parts: [
      { symbol: 'favorable', meaning: 'outcomes that match what the question asks for' },
      { symbol: 'total', meaning: 'every possible outcome' },
      { symbol: '"fair" / "at random"', meaning: 'signals that outcomes are equally likely' },
      { symbol: '0 ≤ P ≤ 1', meaning: 'probability is never negative and never above 1' },
    ],
    example: {
      expr: r`\text{One fair die: } P(\text{roll} > 4)`,
      breakdown: ['Favorable: 5, 6 → 2', 'Total: 6', r`$P = \frac{2}{6} = \frac13$`],
      notes: ['"Greater than 4" does not include 4. Read the boundary words carefully.'],
    },
    exercises: [
      {
        id: 'prob-1',
        prompt: 'A number is chosen at random from the integers 1 through 20, inclusive. What is the probability it is a multiple of 3?',
        fields: [
          { id: 'fav', label: 'Favorable outcomes', kind: 'number', answer: '6', explain: '3, 6, 9, 12, 15, 18 → 6.' },
          { id: 'tot', label: 'Total outcomes', kind: 'number', answer: '20', explain: '"1 through 20 inclusive" = 20 numbers.' },
          { id: 'p', label: 'Probability', kind: 'number', answer: '3/10', explain: '6/20 = 3/10.' },
        ],
      },
    ],
  },
  {
    id: 'statistics',
    title: 'Statistics',
    summary: 'Each statistic answers a different question about a data set. Name the observations, how many there are (n), and their total before computing anything.',
    parts: [
      { symbol: 'n', meaning: 'sample size: how many observations' },
      { symbol: 'mean', meaning: 'sum ÷ n (the "average")' },
      { symbol: 'median', meaning: 'the middle value after sorting (average the middle two if n is even)' },
      { symbol: 'mode', meaning: 'the most frequent value' },
      { symbol: 'range', meaning: 'max − min (how spread out the extremes are)' },
      { symbol: 'frequency', meaning: 'how many times a value occurs' },
    ],
    example: {
      expr: r`\{3, 7, 7, 8, 10\}`,
      breakdown: ['n = 5, sum = 35', 'Mean = 7, median = 7, mode = 7', 'Range = 10 − 3 = 7'],
      notes: ['Sum = mean × n. This one relationship solves most GRE average problems.'],
    },
    exercises: [
      {
        id: 'stat-1',
        prompt: r`Data: $\{4, 9, 2, 9, 6\}$`,
        fields: [
          { id: 'n', label: 'n', kind: 'number', answer: '5', explain: 'Five observations.' },
          { id: 'mean', label: 'Mean', kind: 'number', answer: '6', explain: '30 ÷ 5 = 6.' },
          { id: 'median', label: 'Median', kind: 'number', answer: '6', explain: 'Sorted: 2, 4, 6, 9, 9 → middle is 6.' },
          { id: 'mode', label: 'Mode', kind: 'number', answer: '9', explain: '9 occurs twice.' },
          { id: 'range', label: 'Range', kind: 'number', answer: '7', explain: '9 − 2 = 7.' },
        ],
      },
    ],
  },
];
