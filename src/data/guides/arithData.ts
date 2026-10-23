import { ch, fields, num } from './build';
import type { Guide } from './types';

const r = String.raw;

export const arithDataGuides: Guide[] = [
  // ---------- Percents, ratios, rates ----------
  {
    qid: 'ar-pct-sale',
    given: { options: ['Original price \\$80', '25% off', 'Sales tax applies', 'The sale price is asked'], correct: [0, 1, 3], explain: 'No tax is mentioned.' },
    components: ch('sym', '"25% off" means the sale price is what percent of the original?', ['75%', '25%', '125%', '80%'], 0, ['100% − 25%.'], '75% of the original.'),
    fast: {
      label: 'Multiplier',
      operation: ch('op', 'Which single multiplication gives the sale price?', ['80 × 0.75', '80 × 0.25', '80 × 1.25', '80 − 25'], 0, ['Keep 75%.'], '80 × 0.75.'),
      next: [num('p', '80 × 0.75 = ?', '60', ['3/4 of 80.'], '\\$60.')],
    },
    long: {
      label: 'Find the discount, then subtract',
      operation: ch('op', 'First compute…', ['The discount: 25% of 80', 'The tax', '80 ÷ 25', '80 + 25'], 0, ['25% of the price comes off.'], '0.25 × 80.'),
      next: [num('d', 'Discount = ?', '20', ['A quarter of 80.'], '\\$20.'), num('p', 'Sale price = 80 − 20 = ?', '60', ['Subtract.'], '\\$60.')],
    },
  },
  {
    qid: 'ar-ratio-marbles',
    given: { options: ['Red : blue = 3 : 5', '48 marbles in total', 'There are 3 red marbles', 'The number of blue marbles is asked'], correct: [0, 1, 3], explain: 'A ratio is not a count: 3:5 does not mean 3 red marbles.' },
    components: ch('sym', 'In 3 : 5, how many equal parts make up the whole bag?', ['8', '5', '3', '15'], 0, ['Add the parts.'], '3 + 5 = 8 parts.'),
    fast: {
      label: 'Ratio parts',
      operation: ch('op', 'What is the value of one part?', ['48 ÷ 8', '48 ÷ 5', '48 ÷ 3', '48 × 8'], 0, ['Total ÷ number of parts.'], '48 ÷ 8.'),
      next: [num('part', 'One part = ?', '6', ['48 ÷ 8.'], '6.'), num('blue', 'Blue = 5 parts = ?', '30', ['5 × 6.'], '30.')],
    },
  },
  {
    qid: 'b3-percent-of-x',
    given: { options: ['40% of x is 28', '25% of x is asked', 'x is 28', 'x is an integer'], correct: [0, 1], explain: 'x is not 28; 40% of it is.' },
    components: ch('sym', '"40% of x" translates to…', ['0.4x', '40 + x', 'x / 40', '0.04x'], 0, ['"of" means multiply; 40% = 0.4.'], '0.4x = 28.'),
    fast: {
      label: 'Scale the percent',
      operation: ch('op', '25% is what fraction of 40%?', [r`$\frac{5}{8}$`, r`$\frac{8}{5}$`, r`$\frac{1}{4}$`, r`$\frac{2}{5}$`], 0, ['25/40.'], '5/8.'),
      next: [num('ans', '28 × 5/8 = ?', '35/2', ['28 ÷ 8 = 3.5.'], '17.5.')],
    },
    long: {
      label: 'Solve for x first',
      operation: ch('op', 'Solve 0.4x = 28 by…', ['Dividing by 0.4', 'Multiplying by 0.4', 'Subtracting 0.4', 'Dividing by 40'], 0, ['Inverse of multiplying.'], 'x = 28 ÷ 0.4.'),
      next: [num('x', 'x = ?', '70', ['280 ÷ 4.'], '70.'), num('ans', '25% of 70 = ?', '35/2', ['70 ÷ 4.'], '17.5.')],
    },
  },
  {
    qid: 'ar-rate-bottles',
    given: { options: ['240 bottles in 8 minutes', 'The rate is constant', 'The time asked is 1 hour', 'The time asked is 1 minute'], correct: [0, 1, 2], explain: '"At this rate" makes it constant; the question asks about 1 hour.' },
    components: ch('units', 'What must you watch for in the units?', ['The rate is per minute but the question asks about an hour (60 minutes)', 'Nothing; the units already match', 'Bottles must become liters', 'Convert minutes to seconds'], 0, ['Compare "8 minutes" with "1 hour".'], 'Convert 1 hour to 60 minutes.'),
    fast: {
      label: 'Scale the time',
      operation: ch('op', 'How many 8-minute blocks are in 60 minutes?', ['7.5', '8', '6', '60'], 0, ['60 ÷ 8.'], '7.5.'),
      next: [num('n', '240 × 7.5 = ?', '1800', ['240 × 7 = 1,680, plus 120.'], '1,800.')],
    },
    long: {
      label: 'Unit rate',
      operation: ch('op', 'Bottles per minute = ?', ['240 ÷ 8', '8 ÷ 240', '240 × 8', '240 − 8'], 0, ['Bottles ÷ minutes.'], '30 per minute.'),
      next: [num('rate', 'Rate = ?', '30', ['240 ÷ 8.'], '30.'), num('n', '30 × 60 = ?', '1800', ['Multiply.'], '1,800.')],
    },
  },
  {
    qid: 'p2-work-together',
    given: { options: ['A alone: 4 hours', 'B alone: 6 hours', 'Together they take 10 hours', 'They work at constant rates'], correct: [0, 1, 3], explain: 'Together they take LESS time than either alone, not the sum.' },
    components: ch('sym', 'If A finishes in 4 hours, what is its rate?', [r`$\frac{1}{4}$ job per hour`, '4 jobs per hour', r`$\frac{1}{6}$ job per hour`, '4 hours per hour'], 0, ['Rate = 1 job ÷ time.'], '1/4 job per hour.'),
    fast: {
      label: 'Product over sum',
      operation: ch('op', 'For two workers, a shortcut gives the combined time as…', [r`$\frac{ab}{a + b}$`, r`$a + b$`, r`$\frac{a + b}{2}$`, r`$\frac{a + b}{ab}$`], 0, ['It comes from 1/a + 1/b.'], 'ab/(a + b).'),
      next: [num('t', r`$\frac{4 \cdot 6}{4 + 6} = ?$`, '12/5', ['24/10.'], '12/5 = 2.4 hours.')],
    },
    long: {
      label: 'Add the rates',
      operation: ch('op', 'Combined rate = ?', [r`$\frac{1}{4} + \frac{1}{6}$`, '4 + 6', r`$\frac{1}{10}$`, r`$\frac{1}{4} \cdot \frac{1}{6}$`], 0, ['Rates add when they work together.'], '1/4 + 1/6.'),
      next: [num('rate', 'Combined rate as a fraction?', '5/12', ['3/12 + 2/12.'], '5/12 job per hour.'), num('t', 'Time = 1 ÷ rate = ?', '12/5', ['Flip 5/12.'], '12/5 hours.')],
    },
  },
  {
    qid: 'p2-avg-speed',
    given: { options: ['30 miles each way', '15 mph going', '10 mph returning', 'The trip took equal times each way'], correct: [0, 1, 2], explain: 'Equal distances, not equal times; that is why you cannot just average the speeds.' },
    components: ch('formulas', 'Average speed for a trip is…', ['Total distance ÷ total time', 'The average of the two speeds', 'Distance × time', 'The faster speed'], 0, ['Always use totals.'], 'Total distance / total time.'),
    fast: {
      label: 'Totals',
      operation: ch('op', 'What do you compute first?', ['The time for each leg', 'The average of 15 and 10', '30 × 2', '15 × 10'], 0, ['Time = distance ÷ speed.'], 'Times for each leg.'),
      next: [
        fields('legs', 'Time for each leg (hours):', [['t1', 'going', '2'], ['t2', 'returning', '3']], ['30 ÷ 15 and 30 ÷ 10.'], '2 h and 3 h.'),
        num('avg', 'Average speed = 60 miles ÷ 5 hours = ?', '12', ['Divide.'], '12 mph.'),
      ],
    },
  },

  // ---------- Number properties ----------
  {
    qid: 'ar-remainder-3n',
    given: { options: ['n ÷ 7 leaves remainder 4', 'n is positive', 'n = 4', 'n is even'], correct: [0, 1], explain: 'n could be 4, 11, 18, …; it is not fixed.' },
    components: ch('sym', '"Remainder 4 when divided by 7" means n can be written as…', ['7k + 4', '4k + 7', '7 + 4', 'n/7 = 4'], 0, ['Multiple of 7, plus the remainder.'], 'n = 7k + 4.'),
    fast: {
      label: 'Pick a number',
      operation: ch('op', 'Which value of n is the simplest to test?', ['4', '7', '28', '0'], 0, ['The smallest positive n with remainder 4.'], 'n = 4.'),
      next: [num('3n', '3n = ?', '12', ['3 × 4.'], '12.'), num('rem', '12 ÷ 7 leaves remainder ?', '5', ['12 − 7.'], '5.')],
    },
    long: {
      label: 'Algebra',
      operation: ch('op', '3n = 3(7k + 4) = …', ['21k + 12', '21k + 4', '7k + 12', '3k + 12'], 0, ['Distribute the 3.'], '21k + 12.'),
      next: [num('rem', '21k is a multiple of 7, so the remainder comes from 12 ÷ 7. Remainder?', '5', ['12 = 7 + 5.'], '5.')],
    },
  },
  {
    qid: 'ar-gcf-84-126',
    given: { options: ['The numbers 84 and 126', 'The LCM is asked', 'The GCF is asked', '84 divides 126'], correct: [0, 2], explain: 'GCF, not LCM; 84 does not divide 126.' },
    components: fields('pf', 'Prime factorization: 84 = 2² · 3 · 7. For 126 = 2ᵃ · 3ᵇ · 7ᶜ, find the exponents.', [['a', 'a (power of 2)', '1'], ['b', 'b (power of 3)', '2'], ['c', 'c (power of 7)', '1']], ['126 = 2 × 63 = 2 × 9 × 7.'], '126 = 2 · 3² · 7.'),
    fast: {
      label: 'Lowest shared powers',
      operation: ch('op', 'GCF uses…', ['The lowest power of each shared prime', 'The highest power of each prime', 'All primes from both numbers', 'The difference 126 − 84'], 0, ['"Greatest common" factor: only what both share.'], 'Lowest shared powers.'),
      next: [num('g', 'GCF = 2¹ · 3¹ · 7¹ = ?', '42', ['2 × 3 × 7.'], '42.')],
    },
  },
  {
    qid: 'b3-perfect-cube',
    given: { options: ['72k is a perfect cube', 'k is a positive integer', 'k is the smallest such', 'k is a perfect cube'], correct: [0, 1, 2], explain: 'k itself need not be a cube.' },
    components: fields('pf', 'Write 72 = 2ᵃ · 3ᵇ.', [['a', 'a', '3'], ['b', 'b', '2']], ['72 = 8 × 9.'], '72 = 2³ · 3².'),
    fast: {
      label: 'Complete the exponents',
      operation: ch('op', 'For a perfect cube, every prime exponent must be…', ['A multiple of 3', 'Even', 'Equal to 1', 'Prime'], 0, ['Cube = something to the 3rd power.'], 'Multiples of 3.'),
      next: [num('k', '2³ is fine; 3² needs one more 3. Smallest k?', '3', ['3² · 3 = 3³.'], 'k = 3 (72 · 3 = 216 = 6³).')],
    },
  },

  // ---------- Data, statistics, probability, counting ----------
  {
    qid: 'da-average-sixth',
    given: { options: ['5 numbers average 12', '6 numbers average 13', 'The sixth number is 13', 'All numbers are integers'], correct: [0, 1], explain: 'The sixth number is the unknown.' },
    components: ch('formulas', 'Which relationship turns an average into something you can add?', ['Sum = average × count', 'Sum = average ÷ count', 'Average = sum × count', 'Median = average'], 0, ['Averages do not add; sums do.'], 'Sum = average × count.'),
    fast: {
      label: 'Compare sums',
      operation: ch('op', 'Sixth number = ?', ['(new sum) − (old sum)', '13 − 12', 'average of 12 and 13', '13 × 6'], 0, ['The sixth number is all the new sum adds.'], 'New sum − old sum.'),
      next: [fields('sums', 'Old and new sums:', [['old', 'sum of 5', '60'], ['new', 'sum of 6', '78']], ['5 × 12 and 6 × 13.'], '60 and 78.'), num('x', '78 − 60 = ?', '18', ['Subtract.'], '18.')],
    },
    long: {
      label: 'Balance shortcut',
      operation: ch('op', 'The new number raises 6 numbers by 1 each. It must equal…', ['old average + 6 × 1', '13', '12 + 1', '6'], 0, ['It covers its own 13 plus 1 for each of the other 5.'], '12 + 6 = 18.'),
      next: [num('x', '12 + 6 = ?', '18', ['Add.'], '18.')],
    },
  },
  {
    qid: 'da-two-red',
    given: { options: ['4 red, 6 blue', 'Two draws', 'Without replacement', 'With replacement'], correct: [0, 1, 2], explain: '"Without replacement" changes the second draw.' },
    components: ch('sym', 'After one red is drawn (without replacement), the bag has…', ['3 red out of 9', '4 red out of 10', '3 red out of 10', '4 red out of 9'], 0, ['One fewer red and one fewer total.'], '3 of 9.'),
    fast: {
      label: 'Multiply conditional probabilities',
      operation: ch('op', 'P(both red) = ?', [r`$\frac{4}{10} \cdot \frac{3}{9}$`, r`$\frac{4}{10} \cdot \frac{4}{10}$`, r`$\frac{4}{10} + \frac{3}{9}$`, r`$\frac{2}{10}$`], 0, ['"And" → multiply.'], '4/10 · 3/9.'),
      next: [num('p', 'Simplify 12/90.', '2/15', ['Divide by 6.'], '2/15.')],
    },
    long: {
      label: 'Combinations',
      operation: ch('op', 'Favorable ÷ total pairs:', [r`$\frac{\binom{4}{2}}{\binom{10}{2}}$`, r`$\frac{4}{10}$`, r`$\frac{\binom{4}{2}}{10}$`, r`$\frac{2}{\binom{10}{2}}$`], 0, ['Count pairs.'], 'C(4,2)/C(10,2).'),
      next: [fields('c', 'Compute both counts:', [['f', 'C(4,2)', '6'], ['t', 'C(10,2)', '45']], ['n(n − 1)/2.'], '6 and 45.'), num('p', '6/45 = ?', '2/15', ['Divide by 3.'], '2/15.')],
    },
  },
  {
    qid: 'da-dice-sum-8',
    given: { options: ['Two fair six-sided dice', 'The sum must be 8', 'The dice are identical so order does not matter', 'There are 36 outcomes'], correct: [0, 1], explain: 'Order matters for counting equally likely outcomes; 36 is something you work out.' },
    components: num('total', 'How many equally likely outcomes are there?', '36', ['6 outcomes on each die.'], '6 × 6 = 36.'),
    fast: {
      label: 'List the pairs',
      operation: ch('op', 'What do you count next?', ['Ordered pairs (a, b) with a + b = 8', 'Unordered pairs only', 'Numbers below 8', 'Doubles only'], 0, ['(2,6) and (6,2) are different outcomes.'], 'Ordered pairs summing to 8.'),
      next: [num('fav', 'How many? (2,6), (3,5), (4,4), (5,3), (6,2)…', '5', ['Count them.'], '5.'), num('p', 'Probability = ?', '5/36', ['Favorable ÷ total.'], '5/36.')],
    },
  },
  {
    qid: 'da-committee-combo',
    given: { options: ['7 people', 'Committees of 2', 'Order matters', 'Roles like chair and secretary'], correct: [0, 1], explain: 'A committee has no roles, so order does not matter.' },
    components: ch('sym', 'Does choosing {Ann, Bo} differ from {Bo, Ann}?', ['No; it is the same committee (combination)', 'Yes (permutation)', 'Only if Ann is chair', 'It depends on the size'], 0, ['No roles are named.'], 'Combination.'),
    fast: {
      label: 'nC2 shortcut',
      operation: ch('op', 'C(n, 2) = ?', [r`$\frac{n(n-1)}{2}$`, r`$n(n-1)$`, r`$n!$`, r`$2n$`], 0, ['Divide ordered pairs by 2.'], 'n(n − 1)/2.'),
      next: [num('c', '7 · 6 / 2 = ?', '21', ['42 / 2.'], '21.')],
    },
  },
  {
    qid: 'p2-weighted-average',
    given: { options: ['15 students average 80', '10 students average 90', 'The groups are the same size', '25 students in total'], correct: [0, 1, 3], explain: 'The groups are 15 and 10, not equal.' },
    components: ch('formulas', 'Why is the answer NOT simply 85?', ['The groups have different sizes, so it is a weighted average', 'Because 85 is not a choice', 'Because test scores round down', 'It is 85'], 0, ['More students scored 80.'], 'Weighted average: the larger group pulls harder.'),
    fast: {
      label: 'Weighted by distance',
      operation: ch('op', 'The overall average lies between 80 and 90, closer to…', ['80, by a ratio of 10 : 15', '90', 'Exactly the middle', 'Neither'], 0, ['15 students at 80 vs 10 at 90.'], 'Closer to 80.'),
      next: [num('shift', 'The gap is 10; the 90-group is 10/25 of the class. Shift above 80 = ?', '4', ['10 × 10/25.'], '4.'), num('avg', 'Average = 80 + 4 = ?', '84', ['Add.'], '84.')],
    },
    long: {
      label: 'Total ÷ count',
      operation: ch('op', 'Total of all scores = ?', ['15 × 80 + 10 × 90', '80 + 90', '25 × 85', '15 × 90 + 10 × 80'], 0, ['Each group: count × average.'], '1,200 + 900.'),
      next: [num('tot', 'Total = ?', '2100', ['1,200 + 900.'], '2,100.'), num('avg', '2100 ÷ 25 = ?', '84', ['Divide.'], '84.')],
    },
  },
  {
    qid: 'p2-venn',
    given: { options: ['120 employees', '70 speak Spanish', '45 speak French', '20 speak neither'], correct: [0, 1, 2, 3], explain: 'All four facts are given.' },
    components: ch('formulas', 'Which formula links the groups?', ['Total = A + B − Both + Neither', 'Total = A + B + Both', 'Both = A − B', 'Total = A × B'], 0, ['Adding A and B counts the overlap twice.'], 'Total = A + B − Both + Neither.'),
    fast: {
      label: 'Overlap formula',
      operation: ch('op', 'Substitute:', ['120 = 70 + 45 − Both + 20', '120 = 70 + 45 + Both', '120 = 70 − 45 + 20', 'Both = 70 − 45'], 0, ['Plug each value in.'], '120 = 135 − Both.'),
      next: [num('sum', '70 + 45 + 20 = ?', '135', ['Add.'], '135.'), num('both', 'Both = 135 − 120 = ?', '15', ['Subtract.'], '15.')],
    },
  },
  {
    qid: 'da-median-even',
    given: { options: ['The list 8, 3, 12, 5, 9, 3', 'The list is in order', 'There are 6 numbers', 'The mean is asked'], correct: [0, 2], explain: 'The list is NOT in order, and the median (not the mean) is asked.' },
    components: ch('sym', 'With an even count, the median is…', ['The average of the two middle numbers after sorting', 'The 3rd number as written', 'The most common value', 'The largest minus smallest'], 0, ['Sort first.'], 'Average of the middle two of the sorted list.'),
    fast: {
      label: 'Sort, then average the middle',
      operation: ch('op', 'Sorted list?', ['3, 3, 5, 8, 9, 12', '8, 3, 12, 5, 9, 3', '3, 5, 8, 9, 12', '12, 9, 8, 5, 3'], 0, ['Keep both 3s.'], '3, 3, 5, 8, 9, 12.'),
      next: [fields('mid', 'The two middle numbers:', [['m1', 'third', '5'], ['m2', 'fourth', '8']], ['Positions 3 and 4.'], '5 and 8.'), num('med', 'Median = ?', '6.5', ['(5 + 8)/2.'], '6.5.')],
    },
  },
];
