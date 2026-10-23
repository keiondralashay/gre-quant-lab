import { useEffect, useRef, useState } from 'react';
import type { QCAnswer, Question } from '../data/types';
import { CATEGORY_LESSON, href, primaryLesson, QUESTION_SHORTCUT } from '../data/links';
import { grade, QC_LABELS, type Response } from '../lib/grading';
import { recordAttempt } from '../lib/progress';
import { DecodePanel } from './DecodePanel';
import { MistakePanel } from './MistakePanel';
import { serializeAnswer, serializeResponse } from '../lib/mistakes';
import { Explanation } from './Explanation';
import { MathText } from './MathText';
import { QuestionStem } from './QuestionStem';
import { Feedback } from './ui';

function emptyResponse(q: Question): Response {
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

interface Props {
  q: Question;
  /** Which module is asking — stored with the attempt. */
  source: string;
  onSimilar?: () => void;
  /** Hide the stem when the parent already shows it. */
  hideStem?: boolean;
}

type Phase = 'answering' | 'retry' | 'done';

export function QuestionSolver({ q, source, onSimilar, hideStem }: Props) {
  const [response, setResponse] = useState<Response>(() => emptyResponse(q));
  const [phase, setPhase] = useState<Phase>('answering');
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  const [firstResult, setFirstResult] = useState<'correct' | 'incorrect' | null>(null);
  const [invalid, setInvalid] = useState<string | null>(null);
  const [hintsShown, setHintsShown] = useState(0);
  const [decodeOpen, setDecodeOpen] = useState(false);
  const [firstAttempt, setFirstAttempt] = useState<{ id: string; ts: number; ms: number; response: Response } | null>(null);
  const started = useRef(Date.now());
  const answerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setResponse(emptyResponse(q));
    setPhase('answering');
    setResult(null);
    setFirstResult(null);
    setInvalid(null);
    setHintsShown(0);
    setDecodeOpen(false);
    setFirstAttempt(null);
    started.current = Date.now();
  }, [q]);

  const locked = phase === 'done' || (phase === 'retry' && result === 'incorrect');

  function submit() {
    const g = grade(q, response);
    if (g === 'invalid') {
      setInvalid(q.format === 'numeric' ? 'Enter a number, a fraction like 2/15, or a decimal.' : 'Select an answer first.');
      return;
    }
    setInvalid(null);
    setResult(g);
    if (firstResult === null) {
      setFirstResult(g);
      const ms = Date.now() - started.current;
      const id = recordAttempt({
        kind: 'answer',
        ref: q.id,
        result: g,
        category: q.category,
        area: q.area,
        difficulty: q.difficulty,
        format: q.format,
        topic: q.topic,
        ms,
        hintsUsed: hintsShown,
        detail: source,
        mode: source,
        selected: serializeResponse(response),
        correctAnswer: serializeAnswer(q.answer),
      });
      setFirstAttempt({ id, ts: Date.now(), ms, response });
    }
    setPhase(g === 'correct' || firstResult !== null ? 'done' : 'retry');
  }

  function retry() {
    setResponse(emptyResponse(q));
    setResult(null);
  }

  const setChoice = (i: number) => {
    if (locked) return;
    if (response.kind === 'mc-single') setResponse({ kind: 'mc-single', choice: i });
    if (response.kind === 'mc-multi') {
      const has = response.choices.includes(i);
      setResponse({ kind: 'mc-multi', choices: has ? response.choices.filter((c) => c !== i) : [...response.choices, i] });
    }
  };

  const reveal = phase === 'done';
  const correctSet = q.answer.kind === 'mc-single' ? [q.answer.correct] : q.answer.kind === 'mc-multi' ? q.answer.correct : [];

  return (
    <div className="solver">
      {!hideStem && <QuestionStem q={q} showChoices={false} />}

      <div className="answer-area" ref={answerRef}>
        {q.format === 'mc-multi' && <p className="format-banner">Select ALL answer choices that apply. There may be one, several, or all.</p>}

        {(q.format === 'mc-single' || q.format === 'mc-multi') && (
          <div className="answer-choices" role={q.format === 'mc-single' ? 'radiogroup' : 'group'} aria-label="Answer choices">
            {q.choices!.map((c, i) => {
              const selected = response.kind === 'mc-single' ? response.choice === i : response.kind === 'mc-multi' && response.choices.includes(i);
              const mark = reveal ? (correctSet.includes(i) ? 'is-correct' : selected ? 'is-wrong' : '') : '';
              return (
                <button
                  key={i}
                  type="button"
                  role={q.format === 'mc-single' ? 'radio' : 'checkbox'}
                  aria-checked={selected}
                  className={`answer-choice ${q.format === 'mc-multi' ? 'multi' : 'single'} ${selected ? 'selected' : ''} ${mark}`}
                  onClick={() => setChoice(i)}
                  disabled={locked}
                >
                  <span className="marker" aria-hidden="true" />
                  <span className="choice-letter">{String.fromCharCode(65 + i)}</span>
                  <MathText text={c} />
                </button>
              );
            })}
          </div>
        )}

        {q.format === 'qc' && (
          <div className="answer-choices" role="radiogroup" aria-label="Quantitative comparison choices">
            {(Object.keys(QC_LABELS) as QCAnswer[]).map((k) => {
              const selected = response.kind === 'qc' && response.choice === k;
              const mark = reveal && q.answer.kind === 'qc' ? (q.answer.correct === k ? 'is-correct' : selected ? 'is-wrong' : '') : '';
              return (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`answer-choice single ${selected ? 'selected' : ''} ${mark}`}
                  onClick={() => !locked && setResponse({ kind: 'qc', choice: k })}
                  disabled={locked}
                >
                  <span className="marker" aria-hidden="true" />
                  <span className="choice-letter">{k}</span>
                  {QC_LABELS[k]}
                </button>
              );
            })}
          </div>
        )}

        {q.format === 'numeric' && response.kind === 'numeric' && (
          <div className="numeric-entry">
            <label htmlFor={`num-${q.id}`}>Your answer</label>
            <input
              id={`num-${q.id}`}
              inputMode="text"
              autoComplete="off"
              value={response.text}
              disabled={locked}
              onChange={(e) => setResponse({ kind: 'numeric', text: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && !locked && submit()}
              placeholder="e.g. 18, 6.5, or 2/15"
            />
            <small>{q.entryNote ?? 'Integers, decimals, and fractions (like 3/4) are accepted. Equivalent fractions count.'}</small>
          </div>
        )}

        {invalid && <p className="invalid">{invalid}</p>}

        {hintsShown > 0 && (
          <div className="hints">
            {q.hints.slice(0, hintsShown).map((h, i) => (
              <p key={i} className="hint">
                <strong>Hint {i + 1}:</strong> <MathText text={h} />
              </p>
            ))}
          </div>
        )}

        <div className="actions">
          {!locked && (
            <button type="button" className="btn btn-primary" onClick={submit}>
              Submit Answer
            </button>
          )}
          {phase !== 'done' && hintsShown < q.hints.length && (
            <button type="button" className="btn" onClick={() => setHintsShown((n) => n + 1)}>
              {hintsShown === 0 ? 'Give Me a Hint' : 'Another Hint'}
            </button>
          )}
          {phase !== 'done' && (
            <button type="button" className="btn" aria-expanded={decodeOpen} onClick={() => setDecodeOpen((o) => !o)}>
              Decode This Question
            </button>
          )}
          {phase !== 'done' && (
            <a className="btn" href={href.guided(q.id)}>
              Walk Me Through It
            </a>
          )}
        </div>
      </div>

      {decodeOpen && phase !== 'done' && (
        <DecodePanel
          q={q}
          onClose={() => setDecodeOpen(false)}
          onSolve={() => {
            setDecodeOpen(false);
            answerRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
          }}
        />
      )}

      {phase === 'retry' && result === 'incorrect' && (
        <Feedback tone="incorrect" title="Not correct yet.">
          <p>Take another look. Re-read what is being asked, or use a hint.</p>
          <div className="actions">
            <button type="button" className="btn btn-primary" onClick={retry}>
              Try Again
            </button>
            <button type="button" className="btn" onClick={() => setPhase('done')}>
              Show Solution
            </button>
          </div>
        </Feedback>
      )}

      {phase === 'done' && (
        <>
          <Feedback
            tone={result === 'correct' ? (firstResult === 'correct' ? 'correct' : 'partial') : 'incorrect'}
            title={result === 'correct' ? (firstResult === 'correct' ? 'Correct!' : 'Correct on the second try.') : 'Here is how to solve it.'}
          >
            {result !== 'correct' && q.mistakes.length > 0 && (
              <p>
                <strong>Common mistake:</strong> <MathText text={q.mistakes[0]} />
              </p>
            )}
            {firstResult === 'incorrect' && (
              <p className="link-row">
                {QUESTION_SHORTCUT[q.id] && (
                  <a className="link-btn" href={href.shortcut(QUESTION_SHORTCUT[q.id], true)}>
                    Practice This Shortcut →
                  </a>
                )}
                <a className="link-btn" href={href.lesson(primaryLesson(q.id) ?? CATEGORY_LESSON[q.category])}>
                  Review This Concept →
                </a>
                {source !== 'guided' && (
                  <a className="link-btn" href={href.guided(q.id)}>
                    Walk Me Through It →
                  </a>
                )}
              </p>
            )}
          </Feedback>
          {firstResult === 'incorrect' && firstAttempt && (
            <MistakePanel q={q} attemptId={firstAttempt.id} response={firstAttempt.response} attempt={{ ts: firstAttempt.ts, ms: firstAttempt.ms, mode: source }} />
          )}
          <Explanation q={q} />
          {onSimilar && (
            <div className="actions">
              <button type="button" className="btn" onClick={onSimilar}>
                Try a Similar Question
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
