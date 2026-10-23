import { ch, fields, num } from './build';
import type { Guide } from './types';

const r = String.raw;

/** Geometry guides: step 3 asks which measurements are known and which formula connects them. */
export const geometryGuides: Guide[] = [
  {
    qid: 'ge-right-tri-6-8',
    given: { options: ['The triangle has a right angle', 'One leg is 6', 'The other leg is 8', 'The hypotenuse is 14'], correct: [0, 1, 2], explain: 'The hypotenuse is the unknown; it is not 6 + 8.' },
    components: fields('meas', 'Which measurements do you know? Label them.', [['a', 'leg a', '6'], ['b', 'leg b', '8']], ['The legs are the two sides that form the right angle.'], 'Legs 6 and 8; the hypotenuse c is unknown.'),
    fast: {
      label: 'Recognize a Pythagorean triple',
      operation: ch('op', 'Which shortcut applies?', ['6-8-10 is a multiple of the 3-4-5 triple', 'Add the legs', 'Average the legs', 'Area formula'], 0, ['Divide 6 and 8 by 2.'], '6:8 = 3:4, so this is 3-4-5 scaled by 2.'),
      next: [num('k', 'What is the scale factor from 3-4-5?', '2', ['6 ÷ 3.'], '2.'), num('c', 'Hypotenuse = 5 × 2 = ?', '10', ['Scale the 5.'], '10.')],
    },
    long: {
      label: 'Pythagorean theorem (traditional)',
      operation: ch('op', 'Which formula relates the three sides?', [r`$a^2 + b^2 = c^2$`, r`$a + b = c$`, r`$\frac{1}{2}ab$`, r`$c = 2a$`], 0, ['It holds only for right triangles.'], 'a² + b² = c².'),
      next: [num('sum', r`$6^2 + 8^2 = ?$`, '100', ['36 + 64.'], '100.'), num('c', r`$c = \sqrt{100} = ?$`, '10', ['Which number squared is 100?'], '10.')],
    },
  },
  {
    qid: 'ge-circle-area-from-c',
    given: { options: [r`Circumference is $10\pi$`, 'The radius is 10', 'The area is asked', 'The diameter is 5'], correct: [0, 2], explain: 'Neither the radius nor the diameter is stated; you must find them.' },
    components: ch('formulas', 'Which two formulas connect circumference to area?', [r`$C = 2\pi r$ and $A = \pi r^2$`, r`$C = \pi r^2$ and $A = 2\pi r$`, r`$A = \frac{1}{2}bh$ and $C = 4s$`, r`$C = \pi r$ and $A = \pi d^2$`], 0, ['Area uses r squared.'], 'C = 2πr gives r; A = πr² gives the area.'),
    fast: {
      label: 'Go through the radius',
      operation: ch('op', 'What do you find first?', ['The radius, from 2πr = 10π', 'The area, from 10π squared', 'The diameter squared', 'π × 10'], 0, ['Area needs r.'], 'Solve 2πr = 10π.'),
      next: [num('r', 'r = ?', '5', ['Divide both sides by 2π.'], '5.'), num('k', r`Area $= \pi \cdot 5^2 = k\pi$. What is k?`, '25', ['5².'], '25π.')],
    },
  },
  {
    qid: 'ge-square-diagonal',
    given: { options: [r`The diagonal is $6\sqrt{2}$`, 'The figure is a square', 'The side is 6√2', 'The area is asked'], correct: [0, 1, 3], explain: 'The diagonal, not the side, is 6√2.' },
    components: ch('formulas', 'In a square with side s, what is the diagonal?', [r`$s\sqrt{2}$`, r`$2s$`, r`$s\sqrt{3}$`, r`$s^2$`], 0, ['The diagonal splits the square into two 45-45-90 triangles.'], 'd = s√2.'),
    fast: {
      label: '45-45-90 ratio',
      operation: ch('op', 'From d = s√2 = 6√2, what is s?', ['6', '6√2', '12', '3'], 0, ['Divide both sides by √2.'], 's = 6.'),
      next: [num('area', 'Area = s² = ?', '36', ['6 × 6.'], '36.')],
    },
    long: {
      label: 'Area = d²/2 (formula)',
      operation: ch('op', 'Which square-area formula uses the diagonal directly?', [r`$A = \frac{d^2}{2}$`, r`$A = d^2$`, r`$A = 2d$`, r`$A = \frac{d}{2}$`], 0, ['A square is a rhombus: area = d₁d₂/2.'], 'A = d²/2.'),
      next: [num('d2', r`$(6\sqrt{2})^2 = ?$`, '72', ['36 × 2.'], '72.'), num('area', '72 ÷ 2 = ?', '36', ['Half of 72.'], '36.')],
    },
  },
  {
    qid: 'ge-box-diagonal',
    given: { options: ['Length 3', 'Width 4', 'Height 12', 'The face diagonal is 13'], correct: [0, 1, 2], explain: 'Only the three dimensions are given.' },
    components: ch('formulas', 'Which formula gives the space diagonal of a box l × w × h?', [r`$\sqrt{l^2 + w^2 + h^2}$`, r`$l + w + h$`, r`$lwh$`, r`$\sqrt{l^2 + w^2}$`], 0, ['It extends the Pythagorean theorem to 3D.'], 'd = √(l² + w² + h²).'),
    fast: {
      label: 'Two Pythagorean triples',
      operation: ch('op', 'The base diagonal of the 3-by-4 face is…', ['5 (3-4-5 triple)', '7', '12', '25'], 0, ['3-4-5.'], '5.'),
      next: [num('d', 'Now 5 and 12 are legs. Hypotenuse = ?', '13', ['5-12-13 is a triple.'], '13.')],
    },
    long: {
      label: '3D formula',
      operation: ch('op', 'Substitute into the formula:', [r`$\sqrt{9 + 16 + 144}$`, r`$\sqrt{3 + 4 + 12}$`, r`$3 \cdot 4 \cdot 12$`, r`$\sqrt{9 + 16}$`], 0, ['Square each dimension.'], '√(9 + 16 + 144).'),
      next: [num('sum', '9 + 16 + 144 = ?', '169', ['Add.'], '169.'), num('d', '√169 = ?', '13', ['13² = 169.'], '13.')],
    },
  },
  {
    qid: 'ge-similar-triangles',
    given: { options: ['ABC is similar to DEF', 'AB = 4 and DE = 10', 'BC = 6', 'The triangles are congruent'], correct: [0, 1, 2], explain: 'Similar, not congruent: corresponding sides are proportional, not equal.' },
    components: ch('corr', 'Which side of DEF corresponds to BC?', ['EF', 'DE', 'DF', 'AC'], 0, ['B ↔ E and C ↔ F.'], 'BC ↔ EF.'),
    fast: {
      label: 'Scale factor',
      operation: ch('op', 'What is the scale factor from ABC to DEF?', [r`$\frac{DE}{AB} = \frac{10}{4}$`, r`$\frac{AB}{DE}$`, 'DE − AB = 6', r`$\frac{BC}{AB}$`], 0, ['Use a pair of corresponding sides.'], '10/4 = 5/2.'),
      next: [num('k', 'Scale factor as a fraction?', '5/2', ['Reduce 10/4.'], '5/2.'), num('ef', 'EF = 6 × 5/2 = ?', '15', ['Multiply.'], '15.')],
    },
  },
  {
    qid: 'p2-cylinder',
    given: { options: ['Radius 3', 'Height 8', 'Diameter 3', 'The volume is asked'], correct: [0, 1, 3], explain: '3 is the radius, not the diameter.' },
    components: fields('meas', 'Which measurements does the formula need?', [['r', 'radius r', '3'], ['h', 'height h', '8']], ['A cylinder volume needs radius and height.'], 'r = 3, h = 8.'),
    fast: {
      label: 'Volume formula',
      operation: ch('op', 'Volume of a cylinder?', [r`$V = \pi r^2 h$`, r`$V = 2\pi r h$`, r`$V = \frac{1}{3}\pi r^2 h$`, r`$V = \pi d h$`], 0, ['Base area times height.'], 'V = πr²h.'),
      next: [num('base', r`Base area $= \pi \cdot 3^2 = k\pi$. k = ?`, '9', ['3².'], '9π.'), num('v', r`$V = 9\pi \cdot 8 = k\pi$. k = ?`, '72', ['9 × 8.'], '72π.')],
    },
  },
  {
    qid: 'b3-sector-area',
    given: { options: ['Radius 9', 'Central angle 120°', 'The full circle has area 81π', 'Arc length 6π'], correct: [0, 1], explain: 'The full-circle area follows from r, but arc length is not given.' },
    components: ch('formulas', 'A sector is what fraction of the circle?', [r`$\frac{\text{central angle}}{360°}$`, r`$\frac{\text{central angle}}{180°}$`, r`$\frac{r}{360}$`, r`$\frac{\text{angle}}{2\pi r}$`], 0, ['A full turn is 360°.'], 'Fraction = angle / 360°.'),
    fast: {
      label: 'Fraction of the circle',
      operation: ch('op', 'What fraction is 120°?', [r`$\frac{1}{3}$`, r`$\frac{1}{2}$`, r`$\frac{2}{3}$`, r`$\frac{1}{4}$`], 0, ['120/360.'], '1/3.'),
      next: [num('full', r`Full area $\pi r^2 = k\pi$. k = ?`, '81', ['9².'], '81π.'), num('k', 'One third of 81 = ?', '27', ['81 ÷ 3.'], '27π.')],
    },
  },
  {
    qid: 'p2-trapezoid',
    given: { options: ['Parallel sides 8 and 14', 'Height 5', 'The legs are 5', 'The area is asked'], correct: [0, 1, 3], explain: 'The height is 5; the slanted legs are not given.' },
    components: fields('meas', 'Label the measurements the area formula needs.', [['b1', 'base b₁', '8'], ['b2', 'base b₂', '14'], ['h', 'height h', '5']], ['Bases are the parallel sides.', 'Enter the shorter base first.'], 'b₁ = 8, b₂ = 14, h = 5.'),
    fast: {
      label: 'Average base × height',
      operation: ch('op', 'Trapezoid area?', [r`$\frac{b_1 + b_2}{2} \cdot h$`, r`$b_1 b_2 h$`, r`$\frac{1}{2} b_1 h$`, r`$(b_1 + b_2) h$`], 0, ['Average the bases.'], 'Average of the bases times height.'),
      next: [num('avg', 'Average of the bases?', '11', ['(8 + 14)/2.'], '11.'), num('area', '11 × 5 = ?', '55', ['Multiply.'], '55.')],
    },
  },
  {
    qid: 'ge-triangle-angle',
    given: { options: ['One angle is 47°', 'Another angle is 68°', 'The triangle is isosceles', 'The triangle is right'], correct: [0, 1], explain: 'Nothing about the triangle type is given.' },
    components: ch('formulas', 'Which fact about triangle angles applies?', ['The interior angles sum to 180°', 'They sum to 360°', 'Two angles are always equal', 'The largest angle is 90°'], 0, ['Any triangle.'], 'Sum = 180°.'),
    fast: {
      label: 'Angle sum',
      operation: ch('op', 'Third angle = ?', ['180° − 47° − 68°', '47° + 68°', '360° − 115°', '90° − 47°'], 0, ['Subtract the known angles from 180°.'], '180 − 115.'),
      next: [num('sum', '47 + 68 = ?', '115', ['Add.'], '115.'), num('x', '180 − 115 = ?', '65', ['Subtract.'], '65°.')],
    },
  },
  {
    qid: 'p2-equilateral-perimeter',
    given: { options: [r`Height $6\sqrt{3}$`, 'All sides equal', 'The side is 6√3', 'The perimeter is asked'], correct: [0, 1, 3], explain: 'The height, not the side, is 6√3.' },
    components: ch('formulas', 'The height splits an equilateral triangle into two triangles of which type?', ['30-60-90', '45-45-90', '3-4-5', 'Equilateral'], 0, ['The angles are 30°, 60°, and 90°.'], '30-60-90 with sides x : x√3 : 2x.'),
    fast: {
      label: '30-60-90 ratio',
      operation: ch('op', 'The height is the side opposite 60°, i.e. x√3. So x = ?', ['6', '6√3', '12', '3'], 0, ['x√3 = 6√3.'], 'x = 6.'),
      next: [num('side', 'The full side is the hypotenuse, 2x = ?', '12', ['2 × 6.'], '12.'), num('p', 'Perimeter = 3 × side = ?', '36', ['3 × 12.'], '36.')],
    },
  },
];
