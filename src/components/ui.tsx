import { useState, type ReactNode } from 'react';
import { MathText } from './MathText';

export function Feedback({ tone, title, children }: { tone: 'correct' | 'partial' | 'incorrect' | 'info'; title: string; children?: ReactNode }) {
  const icon = { correct: '✓', partial: '◐', incorrect: '✗', info: 'ℹ' }[tone];
  return (
    <div className={`feedback feedback-${tone}`} role="status">
      <div className="feedback-title">
        <span aria-hidden="true">{icon}</span> {title}
      </div>
      {children && <div className="feedback-body">{children}</div>}
    </div>
  );
}

/** Expandable section; content is not rendered until opened (progressive disclosure). */
export function Disclosure({ label, children, defaultOpen = false }: { label: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`disclosure ${open ? 'open' : ''}`}>
      <button type="button" className="disclosure-btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span aria-hidden="true">{open ? '▾' : '▸'}</span> {label}
      </button>
      {open && <div className="disclosure-body">{children}</div>}
    </div>
  );
}

export type OptionState = 'idle' | 'selected' | 'correct' | 'incorrect' | 'partial' | 'reveal';

/** One-select option list used by recognition, first-step, and strategy exercises. */
export function OptionList({
  options,
  states,
  onPick,
  disabled,
  columns,
}: {
  options: string[];
  states?: OptionState[];
  onPick: (i: number) => void;
  disabled?: boolean;
  columns?: boolean;
}) {
  return (
    <div className={`options ${columns ? 'options-grid' : ''}`}>
      {options.map((o, i) => (
        <button key={i} type="button" className={`option option-${states?.[i] ?? 'idle'}`} disabled={disabled} onClick={() => onPick(i)}>
          <MathText text={o} />
        </button>
      ))}
    </div>
  );
}

export function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="steps">
      {steps.map((s, i) => (
        <li key={i}>
          <MathText text={s} roomy />
        </li>
      ))}
    </ol>
  );
}

export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'easy' | 'medium' | 'hard' }) {
  return <span className={`tag tag-${tone}`}>{children}</span>;
}

export const DIFFICULTY_LABEL = { 1: 'Foundational', 2: 'Moderate', 3: 'Challenging' } as const;
export const DIFFICULTY_TONE = { 1: 'easy', 2: 'medium', 3: 'hard' } as const;

export function Remember({ text }: { text: string }) {
  return (
    <div className="remember">
      <span className="remember-label">REMEMBER</span>
      <MathText text={text} />
    </div>
  );
}
