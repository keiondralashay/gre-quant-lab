/**
 * The GRE on-screen calculator, modelled on the ETS description: basic
 * arithmetic with standard order of operations, parentheses, square root,
 * sign change, one memory register (MR, MC, M+), an 8-digit display, and an
 * Error state (division by zero, square root of a negative, or a result too
 * large for the display) that stays until C is pressed. No scientific functions.
 */
export type Op = '+' | '-' | '*' | '/';
type Token = { t: 'num'; v: number } | { t: 'op'; v: Op } | { t: '(' } | { t: ')' };

export interface CalcState {
  tokens: Token[];
  /** The number being typed, as text (null when none). */
  entry: string | null;
  /** The entry came from √, MR, or ± on a result: typing a digit replaces it. */
  entryComputed: boolean;
  /** What the display shows when nothing is being typed. */
  display: string;
  memory: number | null;
  error: boolean;
  justEvaluated: boolean;
}

export type Key = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | Op | '(' | ')' | '=' | '±' | '√' | 'C' | 'CE' | 'MR' | 'MC' | 'M+';

export const MAX_DIGITS = 8;

export const initialCalc = (): CalcState => ({ tokens: [], entry: null, entryComputed: false, display: '0', memory: null, error: false, justEvaluated: false });

/** Fit a value to the 8-digit display, or null if it cannot be shown. */
export function formatValue(x: number): string | null {
  if (!Number.isFinite(x)) return null;
  const a = Math.abs(x);
  if (a >= 10 ** MAX_DIGITS) return null;
  if (a < 1e-12) return '0';
  const intDigits = a < 1 ? 1 : Math.floor(Math.log10(a)) + 1;
  const decimals = Math.max(0, MAX_DIGITS - intDigits);
  let s = x.toFixed(decimals);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  if (s === '-0') s = '0';
  // Rounding can push a value to 9 integer digits (e.g. 99999999.6).
  if (s.replace(/[-.]/g, '').length > MAX_DIGITS && !s.includes('.')) return null;
  return s;
}

const digitsIn = (s: string) => s.replace(/[^0-9]/g, '').length;
export const shown = (s: CalcState) => (s.error ? 'Error' : (s.entry ?? s.display));
const value = (s: CalcState) => Number(s.entry ?? s.display);
const PREC: Record<Op, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };

/** Evaluate tokens with standard precedence (shunting-yard). Null on ÷0 or malformed input. */
export function evaluate(tokens: Token[]): number | null {
  const out: number[] = [];
  const ops: (Op | '(')[] = [];
  const apply = (): boolean => {
    const op = ops.pop() as Op;
    const b = out.pop();
    const a = out.pop();
    if (a === undefined || b === undefined) return false;
    if (op === '/' && b === 0) return false;
    out.push(op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b);
    return true;
  };
  for (const tk of tokens) {
    if (tk.t === 'num') out.push(tk.v);
    else if (tk.t === '(') ops.push('(');
    else if (tk.t === ')') {
      while (ops.length && ops[ops.length - 1] !== '(') if (!apply()) return null;
      if (ops.pop() !== '(') return null;
    } else {
      while (ops.length && ops[ops.length - 1] !== '(' && PREC[ops[ops.length - 1] as Op] >= PREC[tk.v]) if (!apply()) return null;
      ops.push(tk.v);
    }
  }
  while (ops.length) {
    if (ops[ops.length - 1] === '(') return null;
    if (!apply()) return null;
  }
  return out.length === 1 ? out[0] : null;
}

const openCount = (tokens: Token[]) => tokens.reduce((n, t) => n + (t.t === '(' ? 1 : t.t === ')' ? -1 : 0), 0);
const fail = (s: CalcState): CalcState => ({ ...s, error: true, entry: null, tokens: [] });

/** Push the pending entry (if any) as a number token. */
function flush(s: CalcState): Token[] {
  return s.entry !== null ? [...s.tokens, { t: 'num', v: Number(s.entry) }] : s.tokens;
}

export function press(s: CalcState, key: Key): CalcState {
  if (s.error) return key === 'C' ? { ...initialCalc(), memory: s.memory } : s;
  const last = s.tokens[s.tokens.length - 1];

  if (/^[0-9]$/.test(key)) {
    const fresh = s.justEvaluated || s.entryComputed || s.entry === null;
    const base = s.justEvaluated ? { ...s, tokens: [] as Token[] } : s;
    // A digit right after ")" starts a new term; the GRE calculator does not multiply implicitly.
    if (last?.t === ')' && s.entry === null) return s;
    const cur = fresh ? '' : s.entry!;
    if (digitsIn(cur) >= MAX_DIGITS) return s;
    const next = cur === '0' ? key : cur === '-0' ? `-${key}` : cur + key;
    return { ...base, entry: next, entryComputed: false, justEvaluated: false };
  }
  switch (key) {
    case '.': {
      if (last?.t === ')' && s.entry === null) return s;
      const fresh = s.justEvaluated || s.entryComputed || s.entry === null;
      const cur = fresh ? '' : s.entry!;
      if (cur.includes('.') || digitsIn(cur) >= MAX_DIGITS) return s;
      return { ...s, tokens: s.justEvaluated ? [] : s.tokens, entry: (cur === '' ? '0' : cur === '-' ? '-0' : cur) + '.', entryComputed: false, justEvaluated: false };
    }
    case '±': {
      const cur = s.entry ?? s.display;
      const neg = cur.startsWith('-') ? cur.slice(1) : cur === '0' ? '0' : `-${cur}`;
      // Changing the sign of a displayed result makes it the current entry.
      return { ...s, tokens: s.justEvaluated ? [] : s.tokens, entry: neg, entryComputed: s.entry === null || s.entryComputed, justEvaluated: false };
    }
    case '√': {
      const v = value(s);
      if (v < 0) return fail(s);
      const r = formatValue(Math.sqrt(v));
      if (r === null) return fail(s);
      return { ...s, tokens: s.justEvaluated ? [] : s.tokens, entry: r, entryComputed: true, justEvaluated: false };
    }
    case '+':
    case '-':
    case '*':
    case '/': {
      let tokens = flush(s);
      const end = tokens[tokens.length - 1];
      if (s.entry === null && end?.t === 'op') tokens = tokens.slice(0, -1);
      else if (s.entry === null && (tokens.length === 0 || end?.t === '(')) tokens = [...tokens, { t: 'num', v: Number(s.display) }];
      return { ...s, tokens: [...tokens, { t: 'op', v: key }], entry: null, entryComputed: false, justEvaluated: false };
    }
    case '(': {
      if (s.entry !== null && !s.justEvaluated) return s; // a number must be followed by an operator first
      const tokens = s.justEvaluated ? [] : s.tokens;
      if (tokens.length && tokens[tokens.length - 1].t === ')') return s;
      return { ...s, tokens: [...tokens, { t: '(' }], entry: null, entryComputed: false, justEvaluated: false };
    }
    case ')': {
      if (openCount(s.tokens) <= 0) return s;
      const tokens = flush(s);
      const end = tokens[tokens.length - 1];
      if (!end || end.t === 'op' || end.t === '(') return s;
      const closed: Token[] = [...tokens, { t: ')' }];
      // Show the value of the group just closed.
      let depth = 0;
      let start = closed.length - 1;
      for (let i = closed.length - 1; i >= 0; i--) {
        if (closed[i].t === ')') depth++;
        if (closed[i].t === '(') depth--;
        if (depth === 0) {
          start = i;
          break;
        }
      }
      const g = evaluate(closed.slice(start));
      if (g === null) return fail(s);
      const shownG = formatValue(g);
      if (shownG === null) return fail(s);
      return { ...s, tokens: closed, entry: null, entryComputed: false, display: shownG };
    }
    case '=': {
      let tokens = flush(s);
      if (!tokens.length) return { ...s, entry: null, justEvaluated: true, display: s.entry ?? s.display };
      while (tokens.length && tokens[tokens.length - 1].t === 'op') tokens = tokens.slice(0, -1);
      for (let n = openCount(tokens); n > 0; n--) tokens = [...tokens, { t: ')' }];
      const r = evaluate(tokens);
      if (r === null) return fail(s);
      const out = formatValue(r);
      if (out === null) return fail(s);
      return { ...s, tokens: [], entry: null, entryComputed: false, display: out, justEvaluated: true };
    }
    case 'C':
      return { ...initialCalc(), memory: s.memory };
    case 'CE':
      return { ...s, entry: null, entryComputed: false, display: s.justEvaluated ? '0' : s.tokens.length ? s.display : '0', justEvaluated: false };
    case 'MR':
      if (s.memory === null) return s;
      return { ...s, tokens: s.justEvaluated ? [] : s.tokens, entry: formatValue(s.memory) ?? '0', entryComputed: true, justEvaluated: false };
    case 'MC':
      return { ...s, memory: null };
    case 'M+': {
      const m = (s.memory ?? 0) + value(s);
      if (formatValue(m) === null) return fail(s);
      // The display becomes "computed" so the next digit starts a new number.
      return { ...s, memory: m, entryComputed: s.entry !== null ? true : s.entryComputed };
    }
  }
  return s;
}

/** Keyboard → calculator key (only while the calculator has focus). */
export function keyFor(e: { key: string }): Key | null {
  const k = e.key;
  if (/^[0-9]$/.test(k) || k === '.' || k === '(' || k === ')') return k as Key;
  if (k === '+' || k === '-' || k === '*' || k === '/') return k;
  if (k === 'x' || k === 'X') return '*';
  if (k === 'Enter' || k === '=') return '=';
  if (k === 'Escape') return 'C';
  if (k === 'Delete' || k === 'Backspace') return 'CE';
  return null;
}
