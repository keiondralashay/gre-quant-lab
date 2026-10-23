import type { QCAnswer, Question } from '../data/types';
import { QC_LABELS, type Response } from '../lib/grading';
import { MathText } from './MathText';

export function emptyResponse(q: Question): Response {
  switch (q.format) {
    case 'mc-single':
      return { kind: 'mc-single', choice: null };
    case 'mc-multi':
      return { kind: 'mc-multi', choices: [] };
    case 'numeric':
      return { kind: 'numeric', text: '' };
    case 'qc':
      return { kind: 'qc', choice: null };
  }
}

export function isAnswered(r: Response) {
  return r.kind === 'mc-multi' ? r.choices.length > 0 : r.kind === 'numeric' ? r.text.trim() !== '' : r.choice !== null;
}

/** Answer input with no grading or feedback (exam conditions). */
export function ExamAnswer({ q, value, onChange }: { q: Question; value: Response; onChange: (r: Response) => void }) {
  if (q.format === 'numeric' && value.kind === 'numeric') {
    return (
      <div className="numeric-entry">
        <label htmlFor={`exam-${q.id}`}>Your answer</label>
        <input id={`exam-${q.id}`} autoComplete="off" value={value.text} onChange={(e) => onChange({ kind: 'numeric', text: e.target.value })} placeholder="e.g. 18, 6.5, or 2/15" />
        <small>{q.entryNote ?? 'Integers, decimals, and fractions (like 3/4) are accepted.'}</small>
      </div>
    );
  }
  if (q.format === 'qc' && value.kind === 'qc') {
    return (
      <div className="answer-choices" role="radiogroup" aria-label="Quantitative comparison choices">
        {(Object.keys(QC_LABELS) as QCAnswer[]).map((k) => (
          <button key={k} type="button" role="radio" aria-checked={value.choice === k} className={`answer-choice single ${value.choice === k ? 'selected' : ''}`} onClick={() => onChange({ kind: 'qc', choice: k })}>
            <span className="marker" aria-hidden="true" />
            <span className="choice-letter">{k}</span>
            {QC_LABELS[k]}
          </button>
        ))}
      </div>
    );
  }
  const multi = q.format === 'mc-multi';
  return (
    <>
      {multi && <p className="format-banner">Select ALL answer choices that apply. There may be one, several, or all.</p>}
      <div className="answer-choices" role={multi ? 'group' : 'radiogroup'} aria-label="Answer choices">
        {q.choices!.map((c, i) => {
          const selected = value.kind === 'mc-single' ? value.choice === i : value.kind === 'mc-multi' && value.choices.includes(i);
          return (
            <button
              key={i}
              type="button"
              role={multi ? 'checkbox' : 'radio'}
              aria-checked={selected}
              className={`answer-choice ${multi ? 'multi' : 'single'} ${selected ? 'selected' : ''}`}
              onClick={() => {
                if (value.kind === 'mc-single') onChange({ kind: 'mc-single', choice: i });
                if (value.kind === 'mc-multi') onChange({ kind: 'mc-multi', choices: selected ? value.choices.filter((x) => x !== i) : [...value.choices, i] });
              }}
            >
              <span className="marker" aria-hidden="true" />
              <span className="choice-letter">{String.fromCharCode(65 + i)}</span>
              <MathText text={c} />
            </button>
          );
        })}
      </div>
    </>
  );
}
