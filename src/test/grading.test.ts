import { gradeAnswer, parseRational } from '../lib/grading';

describe('parseRational', () => {
  it.each([
    ['18', 18, 1],
    ['-6', -6, 1],
    ['−6', -6, 1],
    ['6.5', 13, 2],
    ['.5', 1, 2],
    ['2/15', 2, 15],
    ['4/30', 2, 15],
    ['-3/4', -3, 4],
    ['3/-4', -3, 4],
    ['1,800', 1800, 1],
    [' 0.3 ', 3, 10],
  ])('parses %s', (input, num, den) => {
    expect(parseRational(input)).toEqual({ num, den });
  });

  it.each(['', 'abc', '1/0', '2x', '1..2', '-', '/3'])('rejects %s', (input) => {
    expect(parseRational(input)).toBeNull();
  });
});

describe('gradeAnswer', () => {
  const frac = { kind: 'numeric' as const, num: 2, den: 15 };
  it('accepts equivalent fractions and exact decimals', () => {
    expect(gradeAnswer(frac, { kind: 'numeric', text: '2/15' })).toBe('correct');
    expect(gradeAnswer(frac, { kind: 'numeric', text: '12/90' })).toBe('correct');
    expect(gradeAnswer({ kind: 'numeric', num: 3, den: 10 }, { kind: 'numeric', text: '0.3' })).toBe('correct');
  });
  it('rejects rounded decimals when the answer is an exact fraction', () => {
    expect(gradeAnswer(frac, { kind: 'numeric', text: '0.133' })).toBe('incorrect');
  });
  it('treats unparseable input as invalid, not wrong', () => {
    expect(gradeAnswer(frac, { kind: 'numeric', text: 'two' })).toBe('invalid');
  });
  it('grades select-all as all-or-nothing, order-insensitive', () => {
    const multi = { kind: 'mc-multi' as const, correct: [0, 3, 4] };
    expect(gradeAnswer(multi, { kind: 'mc-multi', choices: [4, 0, 3] })).toBe('correct');
    expect(gradeAnswer(multi, { kind: 'mc-multi', choices: [0, 3] })).toBe('incorrect');
    expect(gradeAnswer(multi, { kind: 'mc-multi', choices: [0, 1, 3, 4] })).toBe('incorrect');
    expect(gradeAnswer(multi, { kind: 'mc-multi', choices: [] })).toBe('invalid');
  });
  it('grades QC and single choice', () => {
    expect(gradeAnswer({ kind: 'qc', correct: 'D' }, { kind: 'qc', choice: 'D' })).toBe('correct');
    expect(gradeAnswer({ kind: 'qc', correct: 'D' }, { kind: 'qc', choice: 'C' })).toBe('incorrect');
    expect(gradeAnswer({ kind: 'mc-single', correct: 2 }, { kind: 'mc-single', choice: null })).toBe('invalid');
  });
});
