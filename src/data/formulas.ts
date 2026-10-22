import type { DecodeExercise } from './decodeLessons';
import type { Area, DiagramId } from './types';

const r = String.raw;

/**
 * A formula is a TeX template whose components are written as @id@ tokens.
 * Each part's tex may itself contain tokens (e.g. the discriminant contains a, b, c),
 * so selecting a part highlights every place it appears.
 */
export interface FormulaPart {
  id: string;
  tex: string;
  name: string;
  meaning: string;
}

export interface Formula {
  id: string;
  name: string;
  area: Area;
  template: string;
  parts: FormulaPart[];
  notes?: string[];
  diagram?: DiagramId;
  /** "Test My Understanding" — verified answers. */
  test: DecodeExercise;
  /** Adds generated a/b/c practice. */
  generator?: 'quadratic';
  lesson: string;
}

export const FORMULAS: Formula[] = [
  {
    id: 'quadratic-standard',
    name: 'Quadratic equation (standard form)',
    area: 'algebra',
    template: '@a@@x@^2 + @b@@x@ + @c@ = 0',
    parts: [
      { id: 'a', tex: 'a', name: 'a', meaning: 'Coefficient of x². If no number is written, a = 1. It cannot be 0.' },
      { id: 'b', tex: 'b', name: 'b', meaning: 'Coefficient of x, including its sign: in x² − 9x + 20, b = −9.' },
      { id: 'c', tex: 'c', name: 'c', meaning: 'Constant term (no variable).' },
      { id: 'x', tex: 'x', name: 'x', meaning: 'The unknown value being solved for.' },
    ],
    notes: ['Move every term to one side first. 3x² + 6 = 11x becomes 3x² − 11x + 6 = 0.'],
    test: {
      id: 'qs',
      prompt: r`Identify a, b, and c in $5x^2 - x - 4 = 0$.`,
      fields: [
        { id: 'a', label: 'a', kind: 'number', answer: '5', explain: 'The number in front of x².' },
        { id: 'b', label: 'b', kind: 'number', answer: '-1', explain: '−x means −1·x.' },
        { id: 'c', label: 'c', kind: 'number', answer: '-4', explain: 'The sign belongs to the constant.' },
      ],
    },
    generator: 'quadratic',
    lesson: 'quadratics',
  },
  {
    id: 'quadratic-formula',
    name: 'Quadratic formula',
    area: 'algebra',
    template: r`@x@ = \frac{-@b@ @pm@ @root@}{2@a@}`,
    parts: [
      { id: 'x', tex: 'x', name: 'x', meaning: 'The unknown value being solved for (usually two answers).' },
      { id: 'a', tex: 'a', name: 'a', meaning: 'Coefficient of x².' },
      { id: 'b', tex: 'b', name: 'b', meaning: 'Coefficient of x. Note: −b means "the opposite of b", so if b = −7, then −b = 7.' },
      { id: 'c', tex: 'c', name: 'c', meaning: 'Constant term.' },
      { id: 'pm', tex: r`\pm`, name: '±', meaning: 'Plus-or-minus: solve once using + and once using −. This is where the two solutions come from.' },
      { id: 'root', tex: r`\sqrt{@disc@}`, name: '√', meaning: 'Square root of the discriminant.' },
      { id: 'disc', tex: '@b@^2 - 4@a@@c@', name: 'b² − 4ac', meaning: 'The discriminant. Positive → two real roots; zero → one; negative → no real roots.' },
    ],
    notes: ['The fraction bar divides the WHOLE numerator (−b ± √…) by 2a.'],
    test: {
      id: 'qf',
      prompt: r`Use the formula on $2x^2 - 3x - 5 = 0$.`,
      fields: [
        { id: 'a', label: 'a', kind: 'number', answer: '2', explain: '' },
        { id: 'b', label: 'b', kind: 'number', answer: '-3', explain: 'The sign belongs to b.' },
        { id: 'c', label: 'c', kind: 'number', answer: '-5', explain: '' },
        { id: 'disc', label: 'Discriminant b² − 4ac', kind: 'number', answer: '49', explain: '9 − 4(2)(−5) = 9 + 40 = 49.' },
        { id: 'big', label: 'Larger root', kind: 'number', answer: '5/2', explain: '(3 + 7)/4.' },
        { id: 'small', label: 'Smaller root', kind: 'number', answer: '-1', explain: '(3 − 7)/4.' },
      ],
    },
    generator: 'quadratic',
    lesson: 'quadratic-formula',
  },
  {
    id: 'slope',
    name: 'Slope between two points',
    area: 'algebra',
    template: r`@m@ = \frac{@y2@ - @y1@}{@x2@ - @x1@}`,
    parts: [
      { id: 'm', tex: 'm', name: 'm', meaning: 'Slope: the change in y for each 1-unit increase in x.' },
      { id: 'y2', tex: 'y_2', name: 'y₂', meaning: 'y-coordinate of the second point.' },
      { id: 'y1', tex: 'y_1', name: 'y₁', meaning: 'y-coordinate of the first point.' },
      { id: 'x2', tex: 'x_2', name: 'x₂', meaning: 'x-coordinate of the second point.' },
      { id: 'x1', tex: 'x_1', name: 'x₁', meaning: 'x-coordinate of the first point.' },
    ],
    notes: ['Subtract in the same order on top and bottom. Which point you call "first" does not matter.'],
    diagram: 'coordinate-points',
    test: {
      id: 'sl',
      prompt: 'Points (2, −1) and (6, 7).',
      fields: [
        { id: 'dy', label: r`$y_2 - y_1$`, kind: 'number', answer: '8', explain: '7 − (−1).' },
        { id: 'dx', label: r`$x_2 - x_1$`, kind: 'number', answer: '4', explain: '6 − 2.' },
        { id: 'm', label: 'm', kind: 'number', answer: '2', explain: '8/4.' },
      ],
    },
    lesson: 'slope',
  },
  {
    id: 'slope-intercept',
    name: 'Slope-intercept form',
    area: 'algebra',
    template: '@y@ = @m@@x@ + @b@',
    parts: [
      { id: 'y', tex: 'y', name: 'y', meaning: 'The output (vertical coordinate).' },
      { id: 'm', tex: 'm', name: 'm', meaning: 'Slope. Positive rises, negative falls, 0 is flat.' },
      { id: 'x', tex: 'x', name: 'x', meaning: 'The input (horizontal coordinate).' },
      { id: 'b', tex: 'b', name: 'b', meaning: 'y-intercept: where the line crosses the y-axis (x = 0).' },
    ],
    notes: ['Solve for y first if the equation is not in this form.'],
    test: {
      id: 'si',
      prompt: r`Rewrite $6x + 3y = 12$ as $y = mx + b$.`,
      fields: [
        { id: 'm', label: 'm', kind: 'number', answer: '-2', explain: 'y = −2x + 4.' },
        { id: 'b', label: 'b', kind: 'number', answer: '4', explain: '12 ÷ 3.' },
      ],
    },
    lesson: 'slope',
  },
  {
    id: 'distance',
    name: 'Distance between two points',
    area: 'geometry',
    template: r`@d@ = \sqrt{(@dx@)^2 + (@dy@)^2}`,
    parts: [
      { id: 'd', tex: 'd', name: 'd', meaning: 'Straight-line distance between the points.' },
      { id: 'dx', tex: 'x_2 - x_1', name: 'x₂ − x₁', meaning: 'Horizontal gap (one leg of a right triangle).' },
      { id: 'dy', tex: 'y_2 - y_1', name: 'y₂ − y₁', meaning: 'Vertical gap (the other leg).' },
    ],
    notes: ['This is the Pythagorean theorem with the gaps as the legs.'],
    diagram: 'coordinate-points',
    test: {
      id: 'ds',
      prompt: 'Points (1, 1) and (4, 5).',
      fields: [
        { id: 'dx', label: 'Horizontal gap', kind: 'number', answer: '3', explain: '' },
        { id: 'dy', label: 'Vertical gap', kind: 'number', answer: '4', explain: '' },
        { id: 'd', label: 'd', kind: 'number', answer: '5', explain: '3-4-5.' },
      ],
    },
    lesson: 'coordinate-plane',
  },
  {
    id: 'distance-rate-time',
    name: 'Distance = rate × time',
    area: 'arithmetic',
    template: '@d@ = @r@ \\cdot @t@',
    parts: [
      { id: 'd', tex: 'd', name: 'd', meaning: 'Distance traveled.' },
      { id: 'r', tex: 'r', name: 'r', meaning: 'Rate (speed) in distance per unit time.' },
      { id: 't', tex: 't', name: 't', meaning: 'Time, in the same unit the rate uses.' },
    ],
    notes: ['Average speed = total distance ÷ total time.'],
    test: {
      id: 'drt',
      prompt: 'A train travels 210 miles in 3.5 hours.',
      fields: [
        { id: 'r', label: 'Rate (mph)', kind: 'number', answer: '60', explain: '210/3.5.' },
        { id: 't', label: 'Hours to travel 330 miles at that rate', kind: 'number', answer: '11/2', explain: '330/60 = 5.5.' },
      ],
    },
    lesson: 'distance-rate-time',
  },
  {
    id: 'percent-change',
    name: 'Percent change',
    area: 'arithmetic',
    template: r`@pc@ = \frac{@new@ - @orig@}{@orig@} \times 100\%`,
    parts: [
      { id: 'pc', tex: r`\%\ \text{change}`, name: '% change', meaning: 'Positive = increase, negative = decrease.' },
      { id: 'new', tex: r`\text{new}`, name: 'new', meaning: 'The value after the change.' },
      { id: 'orig', tex: r`\text{original}`, name: 'original', meaning: 'The starting value. It is ALWAYS the denominator.' },
    ],
    test: {
      id: 'pct',
      prompt: 'A price changes from \\$80 to \\$92.',
      fields: [
        { id: 'chg', label: 'Change', kind: 'number', answer: '12', explain: '' },
        { id: 'pct', label: 'Percent change', kind: 'number', answer: '15', explain: '12/80.' },
      ],
    },
    lesson: 'percent-change',
  },
  {
    id: 'simple-interest',
    name: 'Simple interest',
    area: 'arithmetic',
    template: '@I@ = @P@@r@@t@',
    parts: [
      { id: 'I', tex: 'I', name: 'I', meaning: 'Interest earned (not including the principal).' },
      { id: 'P', tex: 'P', name: 'P', meaning: 'Principal: the starting amount.' },
      { id: 'r', tex: 'r', name: 'r', meaning: 'Annual interest rate as a decimal (5% → 0.05).' },
      { id: 't', tex: 't', name: 't', meaning: 'Time in years.' },
    ],
    test: {
      id: 'si',
      prompt: '\\$2,000 at 5% simple interest for 3 years.',
      fields: [
        { id: 'I', label: 'Interest', kind: 'number', answer: '300', explain: '2000 × 0.05 × 3.' },
        { id: 'tot', label: 'Total amount', kind: 'number', answer: '2300', explain: 'P + I.' },
      ],
    },
    lesson: 'percentages',
  },
  {
    id: 'compound-interest',
    name: 'Compound interest',
    area: 'arithmetic',
    template: r`@A@ = @P@\left(1 + \frac{@r@}{@n@}\right)^{@n@@t@}`,
    parts: [
      { id: 'A', tex: 'A', name: 'A', meaning: 'Final amount (principal + interest).' },
      { id: 'P', tex: 'P', name: 'P', meaning: 'Principal.' },
      { id: 'r', tex: 'r', name: 'r', meaning: 'Annual rate as a decimal.' },
      { id: 'n', tex: 'n', name: 'n', meaning: 'Compounding periods per year (1 = yearly, 2 = semiannually, 4 = quarterly).' },
      { id: 't', tex: 't', name: 't', meaning: 'Years.' },
    ],
    notes: ['Compound interest is successive percent change: multiply by (1 + r/n) once per period.'],
    test: {
      id: 'ci',
      prompt: '\\$1,000 at 10% annual interest.',
      fields: [
        { id: 'yr', label: 'Compounded yearly, amount after 2 years', kind: 'number', answer: '1210', explain: '1000 × 1.1².' },
        { id: 'semi', label: 'Compounded semiannually, amount after 1 year', kind: 'number', answer: '1102.5', explain: '1000 × 1.05².' },
      ],
    },
    lesson: 'percent-change',
  },
  {
    id: 'rectangle-area-perimeter',
    name: 'Rectangle area and perimeter',
    area: 'geometry',
    template: r`@A@ = @l@@w@ \qquad @P@ = 2@l@ + 2@w@`,
    parts: [
      { id: 'A', tex: 'A', name: 'A', meaning: 'Area (square units).' },
      { id: 'P', tex: 'P', name: 'P', meaning: 'Perimeter (distance around).' },
      { id: 'l', tex: 'l', name: 'l', meaning: 'Length.' },
      { id: 'w', tex: 'w', name: 'w', meaning: 'Width.' },
    ],
    diagram: 'rectangle',
    test: {
      id: 'ra',
      prompt: 'A rectangle has length 12 and perimeter 40.',
      fields: [
        { id: 'w', label: 'w', kind: 'number', answer: '8', explain: '2(12 + w) = 40.' },
        { id: 'A', label: 'A', kind: 'number', answer: '96', explain: '12 × 8.' },
      ],
    },
    lesson: 'perimeter-area',
  },
  {
    id: 'triangle-area',
    name: 'Triangle area',
    area: 'geometry',
    template: r`@A@ = \frac{1}{2}@b@@h@`,
    parts: [
      { id: 'A', tex: 'A', name: 'A', meaning: 'Area.' },
      { id: 'b', tex: 'b', name: 'b', meaning: 'Base: any side you choose.' },
      { id: 'h', tex: 'h', name: 'h', meaning: 'Height: the perpendicular distance from the base to the opposite vertex (not a slanted side).' },
    ],
    diagram: 'triangle-height',
    test: {
      id: 'ta',
      prompt: 'A triangle has area 36 and base 9.',
      fields: [{ id: 'h', label: 'h', kind: 'number', answer: '8', explain: '½ · 9 · h = 36.' }],
    },
    lesson: 'triangles',
  },
  {
    id: 'trapezoid-area',
    name: 'Trapezoid area',
    area: 'geometry',
    template: r`@A@ = \frac{@b1@ + @b2@}{2} \cdot @h@`,
    parts: [
      { id: 'A', tex: 'A', name: 'A', meaning: 'Area.' },
      { id: 'b1', tex: 'b_1', name: 'b₁', meaning: 'One parallel side (base).' },
      { id: 'b2', tex: 'b_2', name: 'b₂', meaning: 'The other parallel side.' },
      { id: 'h', tex: 'h', name: 'h', meaning: 'Perpendicular distance between the bases.' },
    ],
    diagram: 'trapezoid',
    test: {
      id: 'tz',
      prompt: 'Bases 7 and 13, height 4.',
      fields: [{ id: 'A', label: 'A', kind: 'number', answer: '40', explain: '10 × 4.' }],
    },
    lesson: 'quadrilaterals',
  },
  {
    id: 'pythagorean',
    name: 'Pythagorean theorem',
    area: 'geometry',
    template: '@a@^2 + @b@^2 = @c@^2',
    parts: [
      { id: 'a', tex: 'a', name: 'a', meaning: 'One leg (a side touching the right angle).' },
      { id: 'b', tex: 'b', name: 'b', meaning: 'The other leg.' },
      { id: 'c', tex: 'c', name: 'c', meaning: 'Hypotenuse: the side opposite the right angle, always the longest.' },
    ],
    diagram: 'right-triangle-6-8',
    test: {
      id: 'py',
      prompt: 'A right triangle has hypotenuse 13 and one leg 5.',
      fields: [
        { id: 'which', label: 'Which letter is 13?', kind: 'choice', options: ['a', 'b', 'c'], answer: 2, explain: 'The hypotenuse is c.' },
        { id: 'other', label: 'The other leg', kind: 'number', answer: '12', explain: '169 − 25 = 144.' },
      ],
    },
    lesson: 'right-triangles',
  },
  {
    id: 'circle-circumference',
    name: 'Circle circumference',
    area: 'geometry',
    template: r`@C@ = 2\pi @r@ = \pi @d@`,
    parts: [
      { id: 'C', tex: 'C', name: 'C', meaning: 'Circumference: the distance around the circle.' },
      { id: 'r', tex: 'r', name: 'r', meaning: 'Radius: center to edge.' },
      { id: 'd', tex: 'd', name: 'd', meaning: 'Diameter = 2r.' },
    ],
    notes: ['π ≈ 3.14 is a constant; GRE answers are often left "in terms of π".'],
    diagram: 'circle-circumference',
    test: {
      id: 'cc',
      prompt: 'Enter the coefficient of π.',
      fields: [
        { id: 'a', label: 'Circumference when r = 4.5', kind: 'number', answer: '9', explain: '2 · 4.5.' },
        { id: 'b', label: 'Diameter when C = 22π (just the number)', kind: 'number', answer: '22', explain: 'C = πd.' },
      ],
    },
    lesson: 'circles',
  },
  {
    id: 'circle-area',
    name: 'Circle area',
    area: 'geometry',
    template: r`@A@ = \pi @r@^2`,
    parts: [
      { id: 'A', tex: 'A', name: 'A', meaning: 'Area inside the circle.' },
      { id: 'r', tex: 'r', name: 'r', meaning: 'Radius (square it BEFORE multiplying by π).' },
    ],
    diagram: 'circle-circumference',
    test: {
      id: 'ca',
      prompt: 'Enter the coefficient of π.',
      fields: [
        { id: 'a', label: 'Area when the diameter is 10', kind: 'number', answer: '25', explain: 'r = 5.' },
        { id: 'r', label: r`Radius when the area is $49\pi$`, kind: 'number', answer: '7', explain: '' },
      ],
    },
    lesson: 'circles',
  },
  {
    id: 'box-volume',
    name: 'Rectangular box volume',
    area: 'geometry',
    template: '@V@ = @l@@w@@h@',
    parts: [
      { id: 'V', tex: 'V', name: 'V', meaning: 'Volume (cubic units).' },
      { id: 'l', tex: 'l', name: 'l', meaning: 'Length.' },
      { id: 'w', tex: 'w', name: 'w', meaning: 'Width.' },
      { id: 'h', tex: 'h', name: 'h', meaning: 'Height.' },
    ],
    diagram: 'box-3-4-12',
    test: {
      id: 'bv',
      prompt: 'A box is 3 by 4 by 12.',
      fields: [
        { id: 'V', label: 'V', kind: 'number', answer: '144', explain: '' },
        { id: 'diag', label: 'Space diagonal', kind: 'number', answer: '13', explain: '√(9 + 16 + 144).' },
      ],
    },
    lesson: 'volume-surface-area',
  },
  {
    id: 'cylinder-volume',
    name: 'Cylinder volume',
    area: 'geometry',
    template: r`@V@ = \pi @r@^2 @h@`,
    parts: [
      { id: 'V', tex: 'V', name: 'V', meaning: 'Volume.' },
      { id: 'r', tex: 'r', name: 'r', meaning: 'Radius of the circular base.' },
      { id: 'h', tex: 'h', name: 'h', meaning: 'Height of the cylinder.' },
    ],
    notes: ['πr² is the area of the base, so V = (base area) × height.'],
    diagram: 'cylinder',
    test: {
      id: 'cv',
      prompt: 'Enter the coefficient of π.',
      fields: [
        { id: 'a', label: 'r = 3, h = 4: volume', kind: 'number', answer: '36', explain: '9 · 4.' },
        { id: 'h', label: r`Volume $50\pi$ and r = 5: h`, kind: 'number', answer: '2', explain: '25h = 50.' },
      ],
    },
    lesson: 'volume-surface-area',
  },
  {
    id: 'probability',
    name: 'Probability',
    area: 'data',
    template: r`P(@E@) = \frac{@fav@}{@tot@}`,
    parts: [
      { id: 'E', tex: r`\text{event}`, name: 'event', meaning: 'The outcome you are asked about.' },
      { id: 'fav', tex: r`\text{favorable}`, name: 'favorable', meaning: 'Number of outcomes that count as the event.' },
      { id: 'tot', tex: r`\text{total}`, name: 'total', meaning: 'Number of all possible outcomes, all equally likely.' },
    ],
    test: {
      id: 'pb',
      prompt: 'A bag has 3 red, 5 green, 2 white marbles. One is drawn.',
      fields: [
        { id: 'fav', label: 'Favorable outcomes for "not green"', kind: 'number', answer: '5', explain: '3 + 2.' },
        { id: 'tot', label: 'Total outcomes', kind: 'number', answer: '10', explain: '' },
        { id: 'p', label: 'P(not green)', kind: 'number', answer: '1/2', explain: '5/10.' },
      ],
    },
    lesson: 'probability',
  },
  {
    id: 'average',
    name: 'Arithmetic mean',
    area: 'data',
    template: r`@mean@ = \frac{@sum@}{@n@}`,
    parts: [
      { id: 'mean', tex: r`\text{mean}`, name: 'mean', meaning: 'The average value.' },
      { id: 'sum', tex: r`\text{sum}`, name: 'sum', meaning: 'All the values added together.' },
      { id: 'n', tex: 'n', name: 'n', meaning: 'How many values there are.' },
    ],
    notes: ['Rearranged: sum = mean × n. This is usually the useful form.'],
    test: {
      id: 'av',
      prompt: 'Seven values have a mean of 12.',
      fields: [
        { id: 'sum', label: 'sum', kind: 'number', answer: '84', explain: '7 × 12.' },
        { id: 'new', label: 'One value of 26 is removed. New mean', kind: 'number', answer: '29/3', explain: '58/6.' },
      ],
    },
    lesson: 'mean',
  },
  {
    id: 'weighted-average',
    name: 'Weighted average',
    area: 'data',
    template: r`\bar{x} = \frac{@w1@@x1@ + @w2@@x2@}{@w1@ + @w2@}`,
    parts: [
      { id: 'w1', tex: 'w_1', name: 'w₁', meaning: 'Weight (size) of group 1.' },
      { id: 'x1', tex: r`\bar{x}_1`, name: 'x̄₁', meaning: 'Average of group 1.' },
      { id: 'w2', tex: 'w_2', name: 'w₂', meaning: 'Weight of group 2.' },
      { id: 'x2', tex: r`\bar{x}_2`, name: 'x̄₂', meaning: 'Average of group 2.' },
    ],
    test: {
      id: 'wa',
      prompt: '12 students average 75; 8 students average 90.',
      fields: [{ id: 'm', label: 'Overall average', kind: 'number', answer: '81', explain: '(900 + 720)/20.' }],
    },
    lesson: 'weighted-average',
  },
  {
    id: 'ratio',
    name: 'Ratio part of a total',
    area: 'arithmetic',
    template: r`\text{part}_A = \frac{@a@}{@a@ + @b@} \times @T@`,
    parts: [
      { id: 'a', tex: 'a', name: 'a', meaning: 'The ratio number for the group you want.' },
      { id: 'b', tex: 'b', name: 'b', meaning: 'The ratio number for the other group.' },
      { id: 'T', tex: 'T', name: 'T', meaning: 'The total of both groups.' },
    ],
    notes: ['The order in "a to b" matters: a goes with the first group named.'],
    test: {
      id: 'ra',
      prompt: 'Red to blue is 5 : 3, with 64 in total.',
      fields: [
        { id: 'red', label: 'Red', kind: 'number', answer: '40', explain: '5/8 × 64.' },
        { id: 'blue', label: 'Blue', kind: 'number', answer: '24', explain: '3/8 × 64.' },
      ],
    },
    lesson: 'ratios',
  },
  {
    id: 'exponent-rules',
    name: 'Product rule for exponents',
    area: 'algebra',
    template: r`@base@^{@m@} \cdot @base@^{@n@} = @base@^{@m@ + @n@}`,
    parts: [
      { id: 'base', tex: 'a', name: 'a', meaning: 'The base, which must be the SAME on both factors.' },
      { id: 'm', tex: 'm', name: 'm', meaning: 'Exponent on the first factor.' },
      { id: 'n', tex: 'n', name: 'n', meaning: 'Exponent on the second factor.' },
    ],
    notes: [r`Related: $\frac{a^m}{a^n} = a^{m-n}$ and $(a^m)^n = a^{mn}$.`],
    test: {
      id: 'ex',
      prompt: r`For $2^5 \cdot 2^3$:`,
      fields: [
        { id: 'base', label: 'Base', kind: 'number', answer: '2', explain: '' },
        { id: 'exp', label: 'Exponent of the result', kind: 'number', answer: '8', explain: '5 + 3.' },
        { id: 'val', label: 'Value', kind: 'number', answer: '256', explain: '2⁸.' },
      ],
    },
    lesson: 'exponent-rules',
  },
  {
    id: 'permutations',
    name: 'Permutations',
    area: 'data',
    template: r`{}_{@n@}P_{@k@} = \frac{@n@!}{(@n@ - @k@)!}`,
    parts: [
      { id: 'n', tex: 'n', name: 'n', meaning: 'Number of distinct items available.' },
      { id: 'k', tex: 'k', name: 'k', meaning: 'Number of ordered positions filled.' },
    ],
    notes: ['"!" is factorial: 5! = 5 × 4 × 3 × 2 × 1.'],
    test: {
      id: 'pm',
      prompt: 'Award 1st, 2nd, and 3rd prizes among 7 people.',
      fields: [
        { id: 'n', label: 'n', kind: 'number', answer: '7', explain: '' },
        { id: 'k', label: 'k', kind: 'number', answer: '3', explain: '' },
        { id: 'v', label: 'Number of ways', kind: 'number', answer: '210', explain: '7 × 6 × 5.' },
      ],
    },
    lesson: 'permutations',
  },
  {
    id: 'combinations',
    name: 'Combinations',
    area: 'data',
    template: r`\binom{@n@}{@k@} = \frac{@n@!}{@k@!\,(@n@ - @k@)!}`,
    parts: [
      { id: 'n', tex: 'n', name: 'n', meaning: 'Number of items available.' },
      { id: 'k', tex: 'k', name: 'k', meaning: 'Number chosen, where order does not matter.' },
    ],
    notes: [r`The extra $k!$ removes the different orderings of the same group.`],
    test: {
      id: 'cb',
      prompt: 'Choose a 4-person team from 9 people.',
      fields: [
        { id: 'n', label: 'n', kind: 'number', answer: '9', explain: '' },
        { id: 'k', label: 'k', kind: 'number', answer: '4', explain: '' },
        { id: 'v', label: 'Number of teams', kind: 'number', answer: '126', explain: '9·8·7·6/24.' },
      ],
    },
    lesson: 'combinations',
  },
  {
    id: 'work-rate',
    name: 'Combined work rate',
    area: 'arithmetic',
    template: r`\frac{1}{@a@} + \frac{1}{@b@} = \frac{1}{@T@}`,
    parts: [
      { id: 'a', tex: 'a', name: 'a', meaning: 'Time for worker A alone to finish the job.' },
      { id: 'b', tex: 'b', name: 'b', meaning: 'Time for worker B alone.' },
      { id: 'T', tex: 'T', name: 'T', meaning: 'Time working together.' },
    ],
    notes: ['1/a is A’s rate: the fraction of the job done per unit of time.'],
    test: {
      id: 'wk',
      prompt: 'A alone: 5 hours. B alone: 20 hours.',
      fields: [{ id: 'T', label: 'T', kind: 'number', answer: '4', explain: '100/25.' }],
    },
    lesson: 'work',
  },
];

export const FORMULA_BY_ID: Record<string, Formula> = Object.fromEntries(FORMULAS.map((f) => [f.id, f]));

export const HIGHLIGHT = '#e8590c';

/** Expand one part's TeX on its own (for labels). */
export function renderPart(f: Formula, partId: string): string {
  const part = f.parts.find((p) => p.id === partId);
  if (!part) throw new Error(`Formula ${f.id}: unknown part ${partId}`);
  return renderFormula({ ...f, template: part.tex }, null);
}

/** Expand @id@ tokens recursively; wrap the selected part in a highlight color. */
export function renderFormula(f: Formula, selected: string | null, depth = 0): string {
  const byId = Object.fromEntries(f.parts.map((p) => [p.id, p]));
  const expand = (tex: string, d: number): string =>
    tex.replace(/@(\w+)@/g, (_, id: string) => {
      const part = byId[id];
      if (!part) throw new Error(`Formula ${f.id}: unknown part ${id}`);
      if (d > 5) throw new Error(`Formula ${f.id}: parts nest too deeply`);
      const inner = expand(part.tex, d + 1);
      return id === selected ? `\\textcolor{${HIGHLIGHT}}{${inner}}` : `{${inner}}`;
    });
  return expand(f.template, depth);
}
