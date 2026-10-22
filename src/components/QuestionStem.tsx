import type { Question } from '../data/types';
import { Diagram } from './Diagrams';
import { MathText } from './MathText';
import { DIFFICULTY_LABEL, DIFFICULTY_TONE, Tag } from './ui';

export const FORMAT_LABEL: Record<Question['format'], string> = {
  'mc-single': 'Multiple choice — select one',
  'mc-multi': 'Multiple choice — select one or more',
  numeric: 'Numeric entry',
  qc: 'Quantitative comparison',
};

/** The question as it would appear on the test, without revealing its category. */
export function QuestionStem({ q, showChoices = true }: { q: Question; showChoices?: boolean }) {
  return (
    <div className="stem">
      <div className="stem-meta">
        <Tag>{FORMAT_LABEL[q.format]}</Tag>
        <Tag tone={DIFFICULTY_TONE[q.difficulty]}>{DIFFICULTY_LABEL[q.difficulty]}</Tag>
      </div>
      <p className="stem-prompt">
        <MathText text={q.prompt} />
      </p>
      {q.diagram && <Diagram id={q.diagram} />}
      {q.format === 'qc' && (
        <div className="qc-quantities">
          <div className="qc-q">
            <div className="qc-label">Quantity A</div>
            <MathText text={q.quantityA!} />
          </div>
          <div className="qc-q">
            <div className="qc-label">Quantity B</div>
            <MathText text={q.quantityB!} />
          </div>
        </div>
      )}
      {showChoices && q.choices && (
        <ul className="stem-choices">
          {q.choices.map((c, i) => (
            <li key={i}>
              <span className="choice-letter">{String.fromCharCode(65 + i)}</span>
              <MathText text={c} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
