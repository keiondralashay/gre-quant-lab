import { ch, fields, num } from './build';
import type { Guide } from './types';

const r = String.raw;

export const algebraGuides: Guide[] = [
  // ---------- Quadratics: identify a, b, c explicitly ----------
  {
    qid: 'al-quad-x2-7x-10',
    given: { options: [r`The equation $x^2 - 7x + 10 = 0$`, 'Five possible values of x', 'That x is an integer', 'That x is positive'], correct: [0, 1], explain: 'Only the equation and the answer choices are given; nothing says x is an integer or positive.' },
    components: fields('abc', r`Write the equation as $ax^2 + bx + c = 0$. Identify each coefficient.`, [['a', 'a', '1'], ['b', 'b', '-7'], ['c', 'c', '10']], ['No number in front of x² means a = 1.', 'The sign in front of a term belongs to it: −7x means b = −7.'], 'a = 1, b = −7, c = 10.'),
    fast: {
      label: 'Factor (GRE shortcut)',
      operation: ch('op', 'Which operation finds the roots fastest here?', ['Find two numbers with product c and sum b', 'Divide both sides by x', 'Take the square root of both sides', 'Subtract 10 from both sides'], 0, ['With a = 1, factoring uses product = c and sum = b.'], 'Product 10, sum −7.'),
      next: [
        fields('pair', 'Which two numbers multiply to 10 and add to −7?', [['p', 'smaller number', '-5'], ['q', 'larger number', '-2']], ['Both must be negative for a positive product and a negative sum.', 'Try the factor pairs of 10: 1·10, 2·5.'], '(−5)(−2) = 10 and −5 + (−2) = −7.'),
        fields('roots', r`So $(x - 2)(x - 5) = 0$. What are the two roots?`, [['r1', 'smaller root', '2'], ['r2', 'larger root', '5']], ['Set each factor equal to 0.'], 'x − 2 = 0 → x = 2; x − 5 = 0 → x = 5.'),
      ],
    },
    long: {
      label: 'Quadratic formula (traditional)',
      operation: ch('op', 'Which formula solves any quadratic?', [r`$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$`, r`$x = -\frac{c}{b}$`, r`$x = \sqrt{c}$`, r`$x = \frac{b}{a}$`], 0, ['It uses all three coefficients.'], 'The quadratic formula.'),
      next: [
        num('disc', r`Compute the discriminant $b^2 - 4ac$.`, '9', ['b² = (−7)² = 49.', '4ac = 4 · 1 · 10 = 40.'], '49 − 40 = 9.'),
        fields('roots', r`$x = \frac{7 \pm 3}{2}$. What are the two roots?`, [['r1', 'smaller root', '2'], ['r2', 'larger root', '5']], ['Compute (7 − 3)/2 and (7 + 3)/2.'], '4/2 = 2 and 10/2 = 5.'),
      ],
    },
  },
  {
    qid: 'al-quad-3x2-multi',
    given: { options: [r`The equation $3x^2 - 11x + 6 = 0$`, 'Five candidate values', 'That exactly one choice is correct', 'That x is an integer'], correct: [0, 1], explain: '"Indicate all" means more than one choice may be correct; integers are not required.' },
    components: fields('abc', r`Identify a, b, and c in $3x^2 - 11x + 6 = 0$.`, [['a', 'a', '3'], ['b', 'b', '-11'], ['c', 'c', '6']], ['a is the number in front of x².', 'Keep the minus sign with b.'], 'a = 3, b = −11, c = 6.'),
    fast: {
      label: 'Factor (GRE shortcut)',
      operation: ch('op', 'With a ≠ 1, what helps you factor?', ['Find two numbers with product a·c = 18 and sum b = −11', 'Find two numbers with product 6 and sum −11', 'Divide everything by x', 'Complete the square'], 0, ['The "ac method" multiplies a and c.'], '−9 and −2: product 18, sum −11.'),
      next: [
        fields('roots', r`$3x^2 - 9x - 2x + 6 = 3x(x - 3) - 2(x - 3) = (3x - 2)(x - 3)$. Roots?`, [['r1', 'smaller root', '2/3'], ['r2', 'larger root', '3']], ['Set 3x − 2 = 0 and x − 3 = 0.'], 'x = 2/3 and x = 3.'),
      ],
    },
    long: {
      label: 'Quadratic formula (traditional)',
      operation: ch('op', 'Which formula solves it directly?', [r`$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$`, r`$x = \frac{-c}{b}$`, r`$x = \frac{b}{2a}$ only`, 'Pythagorean theorem'], 0, ['It uses a, b, and c.'], 'The quadratic formula.'),
      next: [
        num('disc', r`Compute $b^2 - 4ac$.`, '49', ['(−11)² = 121.', '4 · 3 · 6 = 72.'], '121 − 72 = 49.'),
        num('den', r`What is the denominator $2a$?`, '6', ['a = 3.'], '2 · 3 = 6.'),
        fields('roots', r`$x = \frac{11 \pm 7}{6}$. Roots?`, [['r1', 'smaller root', '2/3'], ['r2', 'larger root', '3']], ['(11 − 7)/6 and (11 + 7)/6.'], '4/6 = 2/3 and 18/6 = 3.'),
      ],
    },
  },
  {
    qid: 'al-x2-4x-qc',
    given: { options: [r`$x^2 = 4x$`, 'Quantity A is x', 'Quantity B is 4', 'x ≠ 0'], correct: [0, 1, 2], explain: 'Nothing says x ≠ 0, so x = 0 is allowed. That is the trap.' },
    components: fields('abc', r`Rearrange $x^2 = 4x$ into $ax^2 + bx + c = 0$ (keep $x^2$ on the left). Identify a, b, c.`, [['a', 'a', '1'], ['b', 'b', '-4'], ['c', 'c', '0']], ['Subtract 4x from both sides.', 'There is no constant term, so c = 0.'], 'x² − 4x = 0 → a = 1, b = −4, c = 0.'),
    fast: {
      label: 'Factor out x',
      operation: ch('op', 'What is the safe first operation?', ['Factor out x: x(x − 4) = 0', 'Divide both sides by x', 'Take the square root of both sides', 'Add 4x to both sides'], 0, ['Dividing by x assumes x ≠ 0, which is not given.'], 'x(x − 4) = 0 keeps both solutions.'),
      next: [
        fields('roots', 'What are the two possible values of x?', [['r1', 'smaller value', '0'], ['r2', 'larger value', '4']], ['Set each factor equal to 0.'], 'x = 0 or x = 4.'),
        ch('rel', 'Compare x to 4 for each solution. What do the two cases show?', ['x = 0 gives A < B and x = 4 gives A = B, so the relationship can change', 'Both give A = B', 'Both give A < B', 'Both give A > B'], 0, ['Check x = 0 first: is 0 less than, equal to, or greater than 4?'], 'Two valid values with different relationships → D.'),
      ],
    },
  },
  {
    qid: 'b3-disc-zero',
    given: { options: [r`$x^2 - 6x + 9 = 0$`, 'Only the NUMBER of real solutions is asked', 'The solutions are integers', 'The equation has two solutions'], correct: [0, 1], explain: 'You are not told how many solutions there are; that is the question.' },
    components: fields('abc', 'Identify a, b, c.', [['a', 'a', '1'], ['b', 'b', '-6'], ['c', 'c', '9']], ['a = 1 when no number is written.', 'b keeps its minus sign.'], 'a = 1, b = −6, c = 9.'),
    fast: {
      label: 'Discriminant',
      operation: ch('op', 'Which quantity tells you how many real roots there are?', [r`The discriminant $b^2 - 4ac$`, 'The sum of the roots', 'The value of c', 'The coefficient a'], 0, ['It is the part under the square root in the quadratic formula.'], 'b² − 4ac decides the count.'),
      next: [
        num('disc', r`Compute $b^2 - 4ac$.`, '0', ['(−6)² = 36.', '4 · 1 · 9 = 36.'], '36 − 36 = 0.'),
        num('count', 'A discriminant of 0 means how many real solutions?', '1', ['Positive → 2, zero → ?, negative → 0.'], 'Zero discriminant → exactly one (repeated) root, x = 3.'),
      ],
    },
  },
  {
    qid: 'b3-root-product',
    given: { options: [r`$2x^2 + 7x - 15 = 0$`, 'The product of the solutions is asked', 'The sum of the solutions is 7', 'The solutions are integers'], correct: [0, 1], explain: 'Only the equation is given; the sum is not 7 (it is −7/2).' },
    components: fields('abc', 'Identify a, b, c.', [['a', 'a', '2'], ['b', 'b', '7'], ['c', 'c', '-15']], ['a multiplies x².', 'The constant is −15.'], 'a = 2, b = 7, c = −15.'),
    fast: {
      label: 'Product of roots (shortcut)',
      operation: ch('op', 'Which relationship gives the product of the roots directly?', [r`Product $= \frac{c}{a}$`, r`Product $= -\frac{b}{a}$`, r`Product $= b^2 - 4ac$`, 'Product = c'], 0, ['The sum is −b/a; the product uses c.'], 'Product = c/a.'),
      next: [num('prod', r`Compute $\frac{c}{a}$.`, '-15/2', ['c = −15 and a = 2.'], '−15/2.')],
    },
    long: {
      label: 'Find both roots (traditional)',
      operation: ch('op', 'How do you find the roots?', ['Factor: (2x − 3)(x + 5) = 0', 'Divide by x', 'Take square roots', 'Use the slope formula'], 0, ['Find factors of 2x² and −15 whose middle terms add to 7x.'], '(2x − 3)(x + 5) = 2x² + 10x − 3x − 15 ✓.'),
      next: [
        fields('roots', 'What are the roots?', [['r1', 'smaller root', '-5'], ['r2', 'larger root', '3/2']], ['Set each factor to 0.'], 'x = −5 and x = 3/2.'),
        num('prod', 'Multiply the roots.', '-15/2', ['(−5)(3/2).'], '−15/2.'),
      ],
    },
  },

  // ---------- Inequalities: the sign flip ----------
  {
    qid: 'al-ineq-flip',
    given: { options: [r`$-3x + 7 > 22$`, 'x is an integer', 'A choice that MUST be true is wanted', 'x is negative'], correct: [0, 2], explain: 'x need not be an integer; whether it is negative is something you work out.' },
    components: ch('sym', r`In $-3x + 7 > 22$, what does ">" mean, and what is the coefficient of x?`, ['"is greater than"; coefficient −3', '"is less than"; coefficient 3', '"is greater than or equal to"; coefficient −3', '"is greater than"; coefficient 3'], 0, ['The sign in front of 3x belongs to the coefficient.'], '">" is strict "greater than"; the coefficient is −3 (negative, which matters later).'),
    fast: {
      label: 'Inverse operations',
      operation: ch('op', 'What is the first operation?', ['Subtract 7 from both sides', 'Divide both sides by −3', 'Add 3x to both sides', 'Multiply both sides by −1'], 0, ['Undo the +7 first.'], '−3x > 15.'),
      next: [
        ch('flip', r`Now divide both sides of $-3x > 15$ by $-3$. What happens to the ">" sign?`, ['It reverses to "<"', 'It stays ">"', 'It becomes "="', 'It becomes "≥"'], 0, ['Try a test: 2 < 3, but −2 > −3 after multiplying by −1.', 'Multiplying or dividing by a negative reverses order.'], 'Dividing by a negative reverses the inequality: x < −5.'),
        num('bound', 'So x < ?', '-5', ['15 ÷ (−3).'], 'x < −5.'),
      ],
    },
  },
  {
    qid: 'b3-greatest-int',
    given: { options: [r`$2x + 5 < 17$`, 'x is an integer', 'x is positive', 'x can equal 6'], correct: [0, 1], explain: '"Greatest integer" tells you x is an integer; nothing says it is positive.' },
    components: ch('sym', 'What does "<" mean for the boundary value?', ['Strictly less than: the boundary itself is NOT allowed', 'Less than or equal: the boundary is allowed', 'Greater than', 'Equal to'], 0, ['Compare "<" with "≤".'], '"<" excludes the boundary.'),
    fast: {
      label: 'Solve, then step inside the boundary',
      operation: ch('op', 'First operation?', ['Subtract 5 from both sides', 'Divide by 2 first', 'Add 5', 'Multiply by −1'], 0, ['Undo +5 first.'], '2x < 12.'),
      next: [
        ch('div', r`Dividing $2x < 12$ by 2 (a positive number): what happens to "<"?`, ['It stays "<"', 'It reverses to ">"', 'It becomes "≤"', 'It becomes "="'], 0, ['Only negatives reverse the sign.'], 'x < 6.'),
        num('ans', 'The greatest integer less than 6?', '5', ['6 itself is not allowed.'], '5.'),
      ],
    },
  },
  {
    qid: 'b3-abs-count',
    given: { options: [r`$|x - 4| \le 3$`, 'x is an integer', 'x is positive', 'x ≠ 4'], correct: [0, 1], explain: '"How many integers" makes x an integer.' },
    components: ch('sym', r`What does $|x - 4|$ represent?`, ['The distance between x and 4', 'x − 4, always', '4 − x, always', 'The square of x − 4'], 0, ['Absolute value is distance.'], 'The distance from x to 4 on the number line.'),
    fast: {
      label: 'Distance on a number line',
      operation: ch('op', 'Rewrite the inequality without bars:', [r`$-3 \le x - 4 \le 3$`, r`$x - 4 \le 3$ only`, r`$x - 4 \ge 3$ or $x - 4 \le -3$`, r`$x \le 7$ only`], 0, ['Distance at most 3 → between −3 and 3.'], '−3 ≤ x − 4 ≤ 3.'),
      next: [
        fields('bounds', 'Add 4 to all three parts. Bounds?', [['lo', 'smallest x', '1'], ['hi', 'largest x', '7']], ['−3 + 4 and 3 + 4.'], '1 ≤ x ≤ 7.'),
        num('count', 'How many integers from 1 to 7 inclusive?', '7', ['Last − first + 1.'], '7 − 1 + 1 = 7.'),
      ],
    },
  },
  {
    qid: 'p2-abs-qc',
    given: { options: [r`$|x - 2| = 5$`, 'Quantity A is x', 'Quantity B is 0', 'x is positive'], correct: [0, 1, 2], explain: 'The sign of x is not given; that is what you investigate.' },
    components: ch('sym', r`$|x - 2| = 5$ means…`, ['x is 5 units away from 2', 'x − 2 = 5 only', 'x = 7 only', 'x is 2 units away from 5'], 0, ['Absolute value is distance.'], 'x is at distance 5 from 2.'),
    fast: {
      label: 'Two cases',
      operation: ch('op', 'How many cases must you check?', ['Two: x − 2 = 5 and x − 2 = −5', 'One: x − 2 = 5', 'None: choose C', 'Three'], 0, ['Distance 5 can go left or right.'], 'Two cases.'),
      next: [
        fields('cases', 'Solve both cases.', [['a', 'x (case x − 2 = 5)', '7'], ['b', 'x (case x − 2 = −5)', '-3']], ['Add 2 to each side.'], 'x = 7 or x = −3.'),
        ch('rel', 'Compare each x with 0:', ['7 > 0 but −3 < 0, so the answer is D', 'Both greater than 0 → A', 'Both less than 0 → B', 'Both equal 0 → C'], 0, ['Look at the signs.'], 'Different relationships → D.'),
      ],
    },
  },

  // ---------- Exponents: base, exponent, rule ----------
  {
    qid: 'ar-exp-sum-powers',
    given: { options: [r`The expression $\frac{2^{10} + 2^{10}}{2^8}$`, 'All terms have base 2', r`$2^{10} = 1000$`, 'The answer is a power of 2'], correct: [0, 1], explain: '2¹⁰ is 1,024, not 1,000; whether the answer is a power of 2 is not stated.' },
    components: fields('be', r`In $2^{10}$, identify the base and the exponent.`, [['base', 'base', '2'], ['exp', 'exponent', '10']], ['The base is the number being multiplied; the exponent counts copies.'], 'Base 2, exponent 10.'),
    fast: {
      label: 'Exponent rules (shortcut)',
      operation: ch('op', r`Which rule simplifies $2^{10} + 2^{10}$?`, [r`$x + x = 2x$, so $2^{10} + 2^{10} = 2 \cdot 2^{10} = 2^{11}$`, r`Add exponents: $2^{20}$`, r`Multiply exponents: $2^{100}$`, 'Add bases: 4¹⁰'], 0, ['Adding two equal things doubles them.'], '2 · 2¹⁰ = 2¹¹.'),
      next: [
        ch('rule', r`Which rule divides $\frac{2^{11}}{2^{8}}$?`, ['Same base, divide → subtract exponents', 'Divide the exponents', 'Add the exponents', 'Divide the bases'], 0, ['aᵐ / aⁿ = a^(m−n).'], '2^(11−8) = 2³.'),
        num('val', r`What is $2^3$?`, '8', ['2 · 2 · 2.'], '8.'),
      ],
    },
    long: {
      label: 'Compute directly (traditional)',
      operation: ch('op', 'What do you compute first?', ['The value of 2¹⁰ (1,024)', 'The exponents 10 + 10', 'Divide 10 by 8', 'Multiply 2 × 10'], 0, ['Evaluate the powers.'], '2¹⁰ = 1,024.'),
      next: [num('top', 'Numerator: 1024 + 1024 = ?', '2048', ['Double 1,024.'], '2,048.'), num('ans', '2048 ÷ 2⁸ (256) = ?', '8', ['256 × 8 = 2,048.'], '8.')],
    },
  },
  {
    qid: 'al-exp-4x-8x',
    given: { options: [r`$4^{x} = 8^{x-1}$`, 'x is in both exponents', 'x is an integer', '4 and 8 are both powers of 2'], correct: [0, 1], explain: 'You must recognize the common base yourself; integrality is not given.' },
    components: fields('be', r`In $8^{x-1}$, identify the base and the exponent.`, [['base', 'base', '8']], ['The base is the big number; the exponent is x − 1.'], 'Base 8, exponent (x − 1).'),
    fast: {
      label: 'Common base',
      operation: ch('op', 'Rewrite both bases as powers of the same prime. Which prime?', ['2', '3', '4', '8'], 0, ['4 = 2², 8 = 2³.'], '2.'),
      next: [
        ch('rule', r`$(2^2)^x = (2^3)^{x-1}$. Which rule applies to a power of a power?`, ['Multiply the exponents: 2x and 3(x − 1)', 'Add the exponents', 'Subtract the exponents', 'Divide the exponents'], 0, ['(aᵐ)ⁿ = a^(mn).'], '2^(2x) = 2^(3x − 3).'),
        num('x', '2x = 3x − 3. Solve for x.', '3', ['Subtract 2x from both sides.'], 'x = 3.'),
      ],
    },
  },
  {
    qid: 'b3-power-of-power',
    given: { options: [r`$(2^3)^2 \div 2^4$`, 'All bases are 2', r`$(2^3)^2 = 2^5$`, 'The answer is greater than 10'], correct: [0, 1], explain: '(2³)² = 2⁶, not 2⁵.' },
    components: fields('be', r`In $(2^3)^2$: the base, the inner exponent, and the outer exponent?`, [['base', 'base', '2'], ['in', 'inner exponent', '3'], ['out', 'outer exponent', '2']], ['Inside the parentheses: 2³. Outside: ².'], 'Base 2, inner 3, outer 2.'),
    fast: {
      label: 'Exponent rules',
      operation: ch('op', 'Which rule simplifies a power of a power?', ['Multiply the exponents', 'Add the exponents', 'Subtract the exponents', 'Square the base only'], 0, ['(aᵐ)ⁿ = a^(mn).'], '(2³)² = 2⁶.'),
      next: [num('e', 'Divide by 2⁴: what is the new exponent (6 − 4)?', '2', ['Same base: subtract.'], '2² remains.'), num('v', 'Value of 2²?', '4', ['2 · 2.'], '4.')],
    },
  },
  {
    qid: 'ar-units-digit-7',
    given: { options: [r`The power $7^{43}$`, 'Only the units digit is asked', r`$7^{43}$ can be computed easily`, 'The answer is odd'], correct: [0, 1], explain: '7⁴³ is huge; the parity of the digit is not stated.' },
    components: fields('be', r`Identify the base and exponent of $7^{43}$.`, [['base', 'base', '7'], ['exp', 'exponent', '43']], ['Base is the big number.'], 'Base 7, exponent 43.'),
    fast: {
      label: 'Units-digit cycle',
      operation: ch('op', 'What is the efficient approach?', ['Find the cycle of units digits of 7¹, 7², 7³, …', 'Multiply 7 by 43', 'Compute 7⁴³', 'Divide 43 by 7'], 0, ['Only last digits matter.'], 'Units digits cycle.'),
      next: [
        num('len', 'Units digits: 7, 9, 3, 1, 7, … What is the cycle length?', '4', ['Count until it repeats.'], '4.'),
        num('rem', 'Remainder of 43 ÷ 4?', '3', ['4 × 10 = 40.'], '3.'),
        num('digit', 'The 3rd digit in the cycle 7, 9, 3, 1?', '3', ['Count to the third.'], '3.'),
      ],
    },
  },
  {
    qid: 'b3-decimal-power',
    given: { options: [r`$(0.2)^3 \div 0.04$`, 'The base 0.2 is cubed', r`$(0.2)^3 = 0.6$`, 'The answer is an integer'], correct: [0, 1], explain: 'Cubing is not multiplying by 3.' },
    components: fields('be', r`In $(0.2)^3$, base and exponent?`, [['base', 'base', '0.2'], ['exp', 'exponent', '3']], ['The exponent counts copies of the base.'], 'Base 0.2, exponent 3.'),
    fast: {
      label: 'Fractions instead of decimals',
      operation: ch('op', r`What does $(0.2)^3$ mean?`, [r`$0.2 \times 0.2 \times 0.2$`, r`$0.2 \times 3$`, r`$0.2 + 0.2 + 0.2$`, r`$\sqrt[3]{0.2}$`], 0, ['An exponent counts repeated multiplication.'], '0.2 · 0.2 · 0.2.'),
      next: [num('cube', r`$(0.2)^3 = ?$`, '0.008', ['2 × 2 × 2 = 8 with three decimal places.'], '0.008.'), num('ans', r`$0.008 \div 0.04 = ?$`, '0.2', ['Shift both decimals 3 places: 8 ÷ 40.'], '0.2.')],
    },
  },

  // ---------- Linear, systems, translation, slope ----------
  {
    qid: 'al-linear-2x3',
    given: { options: [r`$\frac{2x}{3} + 5 = 17$`, 'x is an integer', 'x is positive', 'Only x is unknown'], correct: [0, 3], explain: 'One equation, one unknown; nothing else is given.' },
    components: ch('sym', r`What is the coefficient of x in $\frac{2x}{3}$?`, [r`$\frac{2}{3}$`, '2', '3', r`$\frac{3}{2}$`], 0, [r`$\frac{2x}{3} = \frac{2}{3} \cdot x$.`], 'The coefficient is 2/3.'),
    fast: {
      label: 'Inverse operations',
      operation: ch('op', 'First operation?', ['Subtract 5 from both sides', 'Multiply by 3/2 first', 'Divide by 2', 'Add 5'], 0, ['Undo the last operation applied (+5) first.'], 'Subtract 5.'),
      next: [num('mid', r`$\frac{2x}{3} = ?$`, '12', ['17 − 5.'], '12.'), num('x', 'Multiply 12 by 3/2. x = ?', '18', ['12 × 3 = 36; ÷ 2.'], '18.')],
    },
  },
  {
    qid: 'al-system-elim-y',
    given: { options: ['x + y = 24', 'x − y = 18', 'x = y', 'x and y are integers'], correct: [0, 1], explain: 'Two equations; nothing else.' },
    components: fields('coef', 'Identify the coefficient of x and of y in x − y = 18.', [['cx', 'coefficient of x', '1'], ['cy', 'coefficient of y', '-1']], ['x alone means 1·x.', '−y means −1·y.'], 'x: 1, y: −1.'),
    fast: {
      label: 'Elimination',
      operation: ch('op', 'The x-coefficients match (1 and 1). What removes x?', ['Subtract the second equation from the first', 'Add the equations', 'Multiply the first by 2', 'Substitute y = 24'], 0, ['Equal coefficients cancel when subtracted.'], '(x + y) − (x − y) = 2y.'),
      next: [num('2y', '2y = 24 − 18 = ?', '6', ['Subtract the right sides too.'], '6.'), num('y', 'y = ?', '3', ['Divide by 2.'], '3.')],
    },
    long: {
      label: 'Substitution',
      operation: ch('op', 'Solve the first equation for x:', ['x = 24 − y', 'x = y − 24', 'x = 24 + y', 'x = 18 + y'], 0, ['Subtract y from both sides.'], 'x = 24 − y.'),
      next: [num('sub', '(24 − y) − y = 18 → 24 − 2y = 18 → 2y = ?', '6', ['24 − 18.'], '6.'), num('y', 'y = ?', '3', ['Divide by 2.'], '3.')],
    },
  },
  {
    qid: 'al-system-sum',
    given: { options: ['3a + 2b = 19', 'a + 2b = 9', 'a = b', 'a + b is asked'], correct: [0, 1, 3], explain: 'The question asks for a + b; a = b is not given.' },
    components: fields('coef', 'Coefficients of a and b in 3a + 2b = 19?', [['ca', 'coefficient of a', '3'], ['cb', 'coefficient of b', '2']], ['The numbers in front of each variable.'], 'a: 3, b: 2.'),
    fast: {
      label: 'Combine to the target',
      operation: ch('op', 'Which combination produces a multiple of a + b?', ['Add the equations: 4a + 4b', 'Subtract them: 2a', 'Multiply the second by 3', 'Divide the first by 3'], 0, ['Add coefficient by coefficient.'], '4a + 4b = 28.'),
      next: [num('sum', 'a + b = 28 ÷ 4 = ?', '7', ['Divide both sides by 4.'], '7.')],
    },
    long: {
      label: 'Solve for each variable',
      operation: ch('op', 'Which operation finds a?', ['Subtract the second equation from the first', 'Add them', 'Multiply by 2', 'Substitute b = 9'], 0, ['The b terms match (2b).'], '2a = 10.'),
      next: [num('a', 'a = ?', '5', ['10 ÷ 2.'], '5.'), num('b', 'From a + 2b = 9, b = ?', '2', ['5 + 2b = 9.'], '2.'), num('sum', 'a + b = ?', '7', ['5 + 2.'], '7.')],
    },
  },
  {
    qid: 'al-translate-five-less',
    given: { options: ['A number is doubled', '5 is subtracted from the doubled number', 'The result is 17', 'The number is positive'], correct: [0, 1, 2], explain: 'Positivity is not stated.' },
    components: ch('sym', '"Five less than twice a number" translates to…', ['2x − 5', '5 − 2x', '2(x − 5)', '2x + 5'], 0, ['"A less than B" means B − A.', 'B is "twice a number" = 2x.'], '2x − 5.'),
    fast: {
      label: 'Translate, then solve',
      operation: ch('op', 'Equation?', ['2x − 5 = 17', '5 − 2x = 17', '2(x − 5) = 17', '2x = 17 − 5'], 0, ['"is" means =.'], '2x − 5 = 17.'),
      next: [num('2x', '2x = ?', '22', ['Add 5.'], '22.'), num('x', 'x = ?', '11', ['Divide by 2.'], '11.')],
    },
  },
  {
    qid: 'b3-linear-parens',
    given: { options: [r`$3(x - 4) = 2(x + 1) - x$`, 'x is an integer', 'Both sides contain x', 'x = 4'], correct: [0, 2], explain: 'x = 4 is not given.' },
    components: ch('sym', r`$3(x - 4)$ means…`, ['3 times the quantity (x − 4)', '3x − 4', '3 + x − 4', 'x − 12 only'], 0, ['Parentheses group x − 4.'], '3(x − 4) = 3x − 12.'),
    fast: {
      label: 'Distribute and collect',
      operation: ch('op', 'First operation?', ['Distribute on both sides', 'Divide by 3', 'Cancel the parentheses', 'Square both sides'], 0, ['Clear parentheses first.'], '3x − 12 = 2x + 2 − x.'),
      next: [ch('rhs', 'Simplify the right side 2x + 2 − x:', ['x + 2', '3x + 2', 'x − 2', '2x + 1'], 0, ['2x − x = x.'], 'x + 2.'), num('2x', '3x − 12 = x + 2 → 2x = ?', '14', ['Subtract x, add 12.'], '14.'), num('x', 'x = ?', '7', ['Divide by 2.'], '7.')],
    },
  },
  {
    qid: 'b3-tickets',
    given: { options: ['Adult ticket \\$8, child ticket \\$5', '20 tickets in total', '\\$130 total revenue', 'Equal numbers of each kind'], correct: [0, 1, 2], explain: 'Equal numbers are not given.' },
    components: fields('vars', 'Let a = adult tickets, c = child tickets. Fill in the two equations: a + c = ?, 8a + 5c = ?', [['n', 'a + c =', '20'], ['v', '8a + 5c =', '130']], ['One equation counts tickets, the other counts dollars.'], 'a + c = 20 and 8a + 5c = 130.'),
    fast: {
      label: 'Assume all of one kind',
      operation: ch('op', 'If all 20 tickets were child tickets, the revenue would be…', ['\\$100', '\\$160', '\\$130', '\\$20'], 0, ['20 × \\$5.'], '\\$100.'),
      next: [num('extra', 'Each adult ticket adds how many dollars over a child ticket?', '3', ['8 − 5.'], '\\$3.'), num('a', 'Adults = (130 − 100) ÷ 3 = ?', '10', ['30 ÷ 3.'], '10.')],
    },
    long: {
      label: 'Substitution',
      operation: ch('op', 'Substitute c = 20 − a into the money equation:', ['8a + 5(20 − a) = 130', '8a + 5a = 130', '8(20 − a) + 5a = 20', 'a = 130 / 8'], 0, ['Replace c.'], '8a + 100 − 5a = 130.'),
      next: [num('3a', '3a = ?', '30', ['130 − 100.'], '30.'), num('a', 'a = ?', '10', ['30 ÷ 3.'], '10.')],
    },
  },
  {
    qid: 'al-slope-two-points',
    given: { options: ['Point (1, 3)', 'Point (5, 11)', 'The y-intercept', 'The line is horizontal'], correct: [0, 1], explain: 'Only the two points are given.' },
    components: fields('pts', r`Label the coordinates: $x_1, y_1$ from (1, 3) and $x_2, y_2$ from (5, 11).`, [['x1', 'x₁', '1'], ['y1', 'y₁', '3'], ['x2', 'x₂', '5'], ['y2', 'y₂', '11']], ['The first number in a pair is x.'], 'x₁ = 1, y₁ = 3, x₂ = 5, y₂ = 11.'),
    fast: {
      label: 'Slope formula',
      operation: ch('op', 'Slope formula?', [r`$\frac{y_2 - y_1}{x_2 - x_1}$`, r`$\frac{x_2 - x_1}{y_2 - y_1}$`, r`$y_2 - y_1$`, r`$\frac{y_2}{x_2}$`], 0, ['Rise over run.'], 'Δy / Δx.'),
      next: [num('dy', 'Δy = ?', '8', ['11 − 3.'], '8.'), num('dx', 'Δx = ?', '4', ['5 − 1.'], '4.'), num('m', 'm = ?', '2', ['8 ÷ 4.'], '2.')],
    },
  },
];
