import { randInt } from './random';

/** A polynomial term coef·x^power (power 0, 1 or 2). */
export interface Term {
  coef: number;
  power: 0 | 1 | 2;
}

export interface QuadEquation {
  left: Term[];
  right: Term[];
  /** Standard-form coefficients after moving everything to the x² side. */
  a: number;
  b: number;
  c: number;
}

const VAR = ['', 'x', 'x^2'] as const;

function termBody(t: Term): string {
  const abs = Math.abs(t.coef);
  if (t.power === 0) return String(abs);
  return (abs === 1 ? '' : String(abs)) + VAR[t.power];
}

/** TeX for one side of an equation, e.g. "3x^2 - 11x + 6". Empty side renders as 0. */
export function formatSide(terms: Term[]): string {
  const nz = terms.filter((t) => t.coef !== 0);
  if (!nz.length) return '0';
  return nz
    .map((t, i) => {
      const body = termBody(t);
      if (i === 0) return (t.coef < 0 ? '-' : '') + body;
      return (t.coef < 0 ? ' - ' : ' + ') + body;
    })
    .join('');
}

export function formatEquation(eq: { left: Term[]; right: Term[] }): string {
  return `${formatSide(eq.left)} = ${formatSide(eq.right)}`;
}

/** Collect left − right into [c, b, a] by power. */
export function collect(eq: { left: Term[]; right: Term[] }): { a: number; b: number; c: number } {
  const k = [0, 0, 0];
  for (const t of eq.left) k[t.power] += t.coef;
  for (const t of eq.right) k[t.power] -= t.coef;
  return { a: k[2], b: k[1], c: k[0] };
}

function nonZero(min: number, max: number, rand: () => number) {
  let v = 0;
  while (v === 0) v = randInt(min, max, rand);
  return v;
}

function coefficients(rand: () => number) {
  // a = 1 a third of the time, to practise the "invisible 1".
  const a = rand() < 0.34 ? 1 : randInt(2, 6, rand);
  return { a, b: nonZero(-12, 12, rand), c: nonZero(-20, 20, rand) };
}

/** Already in standard form: ax² + bx + c = 0. */
export function standardQuadratic(rand: () => number = Math.random): QuadEquation {
  const { a, b, c } = coefficients(rand);
  return { left: [{ coef: a, power: 2 }, { coef: b, power: 1 }, { coef: c, power: 0 }], right: [], a, b, c };
}

/** A quadratic written in a non-standard arrangement that must be rearranged. x² always stays on the left. */
export function rearrangedQuadratic(rand: () => number = Math.random): QuadEquation {
  const { a, b, c } = coefficients(rand);
  const layouts: { left: Term[]; right: Term[] }[] = [
    // ax² + c = −bx   (e.g. 3x² + 6 = 11x)
    { left: [{ coef: a, power: 2 }, { coef: c, power: 0 }], right: [{ coef: -b, power: 1 }] },
    // ax² = −bx − c
    { left: [{ coef: a, power: 2 }], right: [{ coef: -b, power: 1 }, { coef: -c, power: 0 }] },
    // ax² + bx = −c
    { left: [{ coef: a, power: 2 }, { coef: b, power: 1 }], right: [{ coef: -c, power: 0 }] },
    // c + ax² = −bx
    { left: [{ coef: c, power: 0 }, { coef: a, power: 2 }], right: [{ coef: -b, power: 1 }] },
  ];
  const layout = layouts[randInt(0, layouts.length - 1, rand)];
  return { ...layout, a, b, c };
}
