import type { Area, Category, StrategyId } from './types';

export const AREAS: Record<Area, string> = {
  arithmetic: 'Arithmetic',
  algebra: 'Algebra',
  geometry: 'Geometry',
  data: 'Data Analysis',
};

export const CATEGORIES: Record<Category, string> = {
  linear: 'Linear equations',
  systems: 'Systems of equations',
  quadratic: 'Quadratic equations',
  factoring: 'Factoring',
  exponents: 'Exponents',
  ratios: 'Ratios and proportions',
  percentages: 'Percentages',
  inequalities: 'Inequalities',
  'number-properties': 'Number properties',
  remainders: 'Remainders',
  geometry: 'Geometry',
  probability: 'Probability',
  statistics: 'Statistics',
  'data-interpretation': 'Data interpretation',
};

export const CATEGORY_IDS = Object.keys(CATEGORIES) as Category[];

export const STRATEGIES: Record<StrategyId, string> = {
  factoring: 'Factoring',
  'quadratic-formula': 'Quadratic formula',
  elimination: 'Elimination',
  substitution: 'Substitution',
  backsolving: 'Backsolving from answer choices',
  'plug-in': 'Plugging in numbers',
  estimation: 'Estimation',
  'simplify-first': 'Simplifying before calculating',
  patterns: 'Finding patterns',
  'test-values': 'Testing different values',
  divisibility: 'Applying divisibility rules',
  'prime-factorization': 'Prime factorization',
  'geometry-relationships': 'Using geometric relationships',
  'compare-without-solving': 'Comparing without solving',
  direct: 'Straightforward calculation',
  multiplier: 'Percent multiplier',
  'ratio-parts': 'Ratio parts (find one part)',
  formula: 'Apply the standard formula',
  counting: 'Count / list the outcomes',
  'average-total': 'Average → total relationship',
  'inverse-operations': 'Inverse operations (undo step by step)',
  guessing: 'Guessing values',
  graphing: 'Graphing',
};
