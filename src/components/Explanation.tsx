import type { Question } from '../data/types';
import { MathText } from './MathText';
import { Disclosure, Remember, Steps } from './ui';

/**
 * Standard explanation: TYPE → CLUE → DECODE → STRATEGY → FAST METHOD → (LONG METHOD) → REMEMBER.
 * Concise by default; longer material is behind buttons.
 */
export function Explanation({ q, showAnswer = true }: { q: Question; showAnswer?: boolean }) {
  const s = q.solution;
  return (
    <div className="explanation">
      {showAnswer && (
        <p className="answer-line">
          <strong>Answer:</strong> <MathText text={s.answerText} />
        </p>
      )}
      <dl className="explain-grid">
        <dt>TYPE</dt>
        <dd>
          <MathText text={s.type} />
        </dd>
        <dt>CLUE</dt>
        <dd>
          <MathText text={s.clue} />
        </dd>
        <dt>DECODE</dt>
        <dd>
          <MathText text={s.decode} />
        </dd>
        <dt>STRATEGY</dt>
        <dd>
          <MathText text={s.strategy} />
        </dd>
      </dl>
      <MethodBlock q={q} />
      <Remember text={s.remember} />
    </div>
  );
}

/** Fast method shown first; traditional method collapsed under "Show the Long Way". */
export function MethodBlock({ q }: { q: Question }) {
  const s = q.solution;
  return (
    <div className="methods">
      <section className="method method-fast">
        <h4>{s.longIsFastest ? 'Method — the standard approach is already the fastest' : 'Method 1: GRE Shortcut'}</h4>
        <Steps steps={s.fast} />
        {s.longIsFastest && <p className="note">There is no shortcut worth learning here. The direct method above is the efficient one.</p>}
      </section>
      {s.why && (
        <Disclosure label={s.longIsFastest ? 'Why does this work?' : 'Why Does This Shortcut Work?'}>
          <MathText text={s.why} />
        </Disclosure>
      )}
      {s.whenNot && (
        <Disclosure label={s.longIsFastest ? 'Watch out' : 'When NOT to Use This Shortcut'}>
          <MathText text={s.whenNot} />
        </Disclosure>
      )}
      {!s.longIsFastest && s.long && (
        <Disclosure label="Show the Long Way">
          <section className="method method-long">
            <h4>Method 2: Traditional Solution</h4>
            <Steps steps={s.long} />
          </section>
        </Disclosure>
      )}
    </div>
  );
}
