import { useEffect, useMemo, useState } from 'react';
import type { MistakeType, Question } from '../data/types';
import type { Response } from '../lib/grading';
import { inferMistake, MISTAKE_DESCRIPTIONS, MISTAKE_LABELS, MISTAKE_TYPES, recommendation } from '../lib/mistakes';
import { classifyAttempt, getProgress, useProgress, type Attempt } from '../lib/progress';

/**
 * "Where did my thinking go wrong?" — shown after a missed question.
 * Strong evidence is recorded automatically (and can be corrected); otherwise
 * the learner is asked, and nothing is stored until they answer.
 */
export function MistakePanel({
  q,
  attemptId,
  response,
  attempt,
  paceMs,
  timeExpired,
  compact,
}: {
  q: Question;
  attemptId: string;
  response?: Response;
  attempt: Pick<Attempt, 'ts' | 'ms' | 'unanswered' | 'mode'>;
  paceMs?: number;
  timeExpired?: boolean;
  compact?: boolean;
}) {
  const progress = useProgress();
  const existing = progress.classifications?.[attemptId];
  const inference = useMemo(
    () => inferMistake({ q, response, attempt, history: getProgress().attempts.filter((a) => a.id !== attemptId), paceMs, timeExpired }),
    [q, response, attempt, attemptId, paceMs, timeExpired],
  );
  const [choosing, setChoosing] = useState(false);

  useEffect(() => {
    if (inference?.strength === 'strong' && !getProgress().classifications?.[attemptId]) {
      classifyAttempt(attemptId, { type: inference.type, source: 'evidence', evidence: inference.evidence });
    }
  }, [inference, attemptId]);

  const pick = (type: MistakeType | 'unsure') => {
    const agrees = inference && type === inference.type;
    classifyAttempt(attemptId, { type, source: agrees ? 'confirmed' : 'self-reported', evidence: agrees ? inference!.evidence : undefined });
    setChoosing(false);
  };

  const current = existing && existing.type !== 'unsure' ? existing : null;
  const rec = current ? recommendation(current.type as MistakeType, q) : null;
  const showPicker = choosing || !existing;

  return (
    <div className={`card mistake-panel ${compact ? 'compact' : ''}`} aria-label="Why did I miss this?">
      <h4>Why did I miss this?</h4>
      {existing && !choosing && (
        <p>
          {existing.type === 'unsure' ? (
            <>You marked this as <strong>not sure</strong>.</>
          ) : (
            <>
              <strong>{MISTAKE_LABELS[existing.type as MistakeType]}</strong>
              {existing.source === 'evidence' && ' (based on your answer)'}
              {existing.source === 'confirmed' && ' (you confirmed)'}
              {existing.source === 'self-reported' && ' (your choice)'}
              {existing.evidence && <span className="note"> {existing.evidence}</span>}
            </>
          )}{' '}
          <button className="btn-link" onClick={() => setChoosing(true)}>
            {existing.source === 'evidence' ? 'That’s not it' : 'Change'}
          </button>
        </p>
      )}
      {showPicker && (
        <>
          {inference && !existing && inference.strength === 'suggested' && (
            <p className="note">
              Possible cause: <strong>{MISTAKE_LABELS[inference.type]}</strong>. {inference.evidence} Choose what actually happened:
            </p>
          )}
          {!inference && !existing && <p className="note">The app can’t tell from your answer alone. What happened?</p>}
          <div className="mistake-options" role="group" aria-label="Mistake type">
            {MISTAKE_TYPES.map((t) => (
              <button key={t} className="option" onClick={() => pick(t)} title={MISTAKE_DESCRIPTIONS[t]}>
                <strong>{MISTAKE_LABELS[t]}</strong>
                <span>{MISTAKE_DESCRIPTIONS[t]}</span>
              </button>
            ))}
            <button className="option" onClick={() => pick('unsure')}>
              <strong>Not sure</strong>
              <span>Save it without a cause.</span>
            </button>
          </div>
        </>
      )}
      {rec && !choosing && (
        <p className="next-step">
          <strong>Next:</strong> {rec.why}{' '}
          <a className="link-btn" href={rec.href}>
            {rec.label} →
          </a>
        </p>
      )}
    </div>
  );
}
