/**
 * Data Interpretation sets: several questions share one data display. Every
 * chart is drawn from the data below, and tests recompute every answer key from
 * the same data, so a chart and its questions cannot drift apart.
 */
export type DIChart =
  | { kind: 'table'; title: string; unit: string; columns: string[]; rows: { label: string; values: number[] }[] }
  | { kind: 'bar'; title: string; unit: string; bars: { label: string; value: number }[] }
  | { kind: 'line'; title: string; unit: string; xLabels: string[]; series: { label: string; values: number[] }[] }
  | { kind: 'pie'; title: string; total: number; totalLabel: string; slices: { label: string; pct: number }[] }
  | { kind: 'scatter'; title: string; xLabel: string; yLabel: string; points: [number, number][] };

export interface DISet {
  id: string;
  title: string;
  chart: DIChart;
  /** Bank question ids, in order. */
  questions: string[];
}

/** "What information do I need?" for each DI question: the data pieces to pull before solving. */
export interface Needs {
  options: string[];
  correct: number[];
  explain: string;
}

export const DI_SETS: DISet[] = [
  {
    id: 'books',
    title: 'Bookstore unit sales',
    chart: {
      kind: 'table',
      title: 'Unit sales (thousands) by quarter, 2023',
      unit: 'thousand units',
      columns: ['Q1', 'Q2', 'Q3', 'Q4'],
      rows: [
        { label: 'Fiction', values: [40, 45, 50, 60] },
        { label: 'Nonfiction', values: [30, 36, 33, 28] },
        { label: 'Children’s', values: [20, 24, 28, 32] },
      ],
    },
    questions: ['di-books-pct', 'di-books-ratio', 'di-books-avg', 'di-books-share'],
  },
  {
    id: 'staff',
    title: 'Employees by department',
    chart: {
      kind: 'bar',
      title: 'Employees by department, Company K',
      unit: 'employees',
      bars: [
        { label: 'Sales', value: 60 },
        { label: 'Engineering', value: 50 },
        { label: 'Support', value: 40 },
        { label: 'Marketing', value: 30 },
        { label: 'Finance', value: 20 },
      ],
    },
    questions: ['di-staff-pct', 'di-staff-ratio', 'di-staff-diff', 'di-staff-above-avg'],
  },
  {
    id: 'stores',
    title: 'Monthly revenue of two stores',
    chart: {
      kind: 'line',
      title: 'Monthly revenue (thousands of dollars), January–June',
      unit: 'thousand dollars',
      xLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      series: [
        { label: 'Store A', values: [20, 24, 22, 30, 28, 35] },
        { label: 'Store B', values: [25, 26, 27, 28, 29, 33] },
      ],
    },
    questions: ['di-stores-pct', 'di-stores-months', 'di-stores-avg', 'di-stores-jump'],
  },
  {
    id: 'budget',
    title: 'A household budget',
    chart: {
      kind: 'pie',
      title: 'Monthly budget by category',
      total: 4800,
      totalLabel: 'Total monthly budget: $4,800',
      slices: [
        { label: 'Housing', pct: 35 },
        { label: 'Food', pct: 20 },
        { label: 'Transportation', pct: 15 },
        { label: 'Savings', pct: 10 },
        { label: 'Other', pct: 20 },
      ],
    },
    questions: ['di-budget-food', 'di-budget-ratio', 'di-budget-diff', 'di-budget-shift'],
  },
  {
    id: 'study',
    title: 'Study time and test scores',
    chart: {
      kind: 'scatter',
      title: 'Hours studied and test score for 10 students',
      xLabel: 'Hours studied',
      yLabel: 'Test score',
      points: [
        [1, 55],
        [2, 60],
        [2, 68],
        [3, 65],
        [4, 72],
        [5, 70],
        [6, 80],
        [7, 85],
        [8, 82],
        [9, 90],
      ],
    },
    questions: ['di-study-above', 'di-study-median', 'di-study-avg', 'di-study-trend'],
  },
];

export const DI_SET_BY_ID: Record<string, DISet> = Object.fromEntries(DI_SETS.map((s) => [s.id, s]));

export const DI_NEEDS: Record<string, Needs> = {
  'di-books-pct': { options: ['Fiction sales in Q1', 'Fiction sales in Q4', 'Total sales in Q4', 'Nonfiction sales in Q1', 'Fiction sales in Q2'], correct: [0, 1], explain: 'Percent change needs only the starting value (Q1) and the ending value (Q4) of the same row.' },
  'di-books-ratio': { options: ['Nonfiction sales in Q2', 'Children’s sales in Q2', 'Fiction sales in Q2', 'Children’s sales in Q1', 'Total sales in Q2'], correct: [0, 1], explain: 'A ratio of two categories in one quarter needs those two cells only.' },
  'di-books-avg': { options: ['All four Children’s quarterly values', 'Only Children’s Q1 and Q4', 'The Q4 total', 'Fiction’s average'], correct: [0], explain: 'An average of quarterly sales needs every quarter’s value, not just the endpoints.' },
  'di-books-share': { options: ['Fiction sales in Q4', 'Nonfiction sales in Q4', 'Children’s sales in Q4', 'Fiction sales in Q1'], correct: [0, 1, 2], explain: 'A share of the Q4 total needs the part (Fiction Q4) and every Q4 value to form the total.' },
  'di-staff-pct': { options: ['Support’s bar', 'Every bar (for the total)', 'Only the tallest bar', 'Marketing’s bar'], correct: [0, 1], explain: 'Percent of all employees = Support ÷ the total of all five bars.' },
  'di-staff-ratio': { options: ['Engineering’s bar', 'Finance’s bar', 'The total', 'Sales’s bar'], correct: [0, 1], explain: 'Only the two departments in the ratio.' },
  'di-staff-diff': { options: ['Sales’s bar', 'Marketing’s bar', 'Finance’s bar', 'Engineering’s bar'], correct: [0, 1, 2], explain: 'Sales compared with Marketing and Finance combined.' },
  'di-staff-above-avg': { options: ['Every bar (for the average)', 'Each department compared with that average', 'Only Sales and Finance', 'The median department'], correct: [0, 1], explain: 'First the average of all five, then compare each bar to it.' },
  'di-stores-pct': { options: ['Store A in January', 'Store A in June', 'Store B in June', 'Store A in March'], correct: [0, 1], explain: 'Start and end values of Store A only.' },
  'di-stores-months': { options: ['Both stores’ values for every month', 'Only June values', 'Store A’s values only', 'The average of each store'], correct: [0], explain: 'You compare A with B month by month, so you need every month for both.' },
  'di-stores-avg': { options: ['All six Store B values', 'Store B in January and June only', 'Store A’s values', 'The number of months (6)'], correct: [0, 3], explain: 'Average = sum of all six values ÷ 6.' },
  'di-stores-jump': { options: ['Store A’s value for every month', 'Store B’s value for every month', 'Store A in June only', 'The average of Store A'], correct: [0], explain: 'Month-to-month changes for Store A need each consecutive pair of Store A values.' },
  'di-budget-food': { options: ['Food’s percent', 'The total budget', 'Housing’s percent', 'Every percent'], correct: [0, 1], explain: 'Dollars = percent × total.' },
  'di-budget-ratio': { options: ['Housing’s percent', 'Savings’ percent', 'The total budget', 'Other’s percent'], correct: [0, 1], explain: 'Percents of the same total compare directly; the total cancels.' },
  'di-budget-diff': { options: ['Housing’s percent', 'Food’s percent', 'Savings’ percent', 'The total budget'], correct: [0, 1, 2, 3], explain: 'A dollar difference needs the three percents and the total.' },
  'di-budget-shift': { options: ['Savings’ percent', 'Other’s percent', 'The total budget', 'Housing’s percent'], correct: [0, 1], explain: 'Doubling Savings takes another 10% of the budget from Other; the total itself is not needed for a percent.' },
  'di-study-above': { options: ['Each student’s score', 'Each student’s hours', 'The trend line', 'The average score'], correct: [0], explain: 'Count the points above 75 on the vertical axis.' },
  'di-study-median': { options: ['Every student’s hours', 'Every student’s score', 'Only the largest and smallest hours'], correct: [0], explain: 'The median of hours needs all ten hour values, sorted.' },
  'di-study-avg': { options: ['Which students studied more than 5 hours', 'Those students’ scores', 'Every student’s score', 'The median score'], correct: [0, 1], explain: 'Select the students first, then average only their scores.' },
  'di-study-trend': { options: ['The overall pattern of the points', 'One student’s exact score', 'Whether any student with more hours scored lower', 'The average hours'], correct: [0, 2], explain: 'Judge the general direction, and check for exceptions before accepting an "every" statement.' },
};
