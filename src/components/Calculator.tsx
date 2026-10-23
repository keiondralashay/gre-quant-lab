import { useEffect, useRef, useState } from 'react';
import { initialCalc, keyFor, press, shown, type CalcState, type Key } from '../lib/calculator';

const LAYOUT: { key: Key; label: string; aria: string; tone?: 'op' | 'fn' }[][] = [
  [
    { key: '7', label: '7', aria: '7' },
    { key: '8', label: '8', aria: '8' },
    { key: '9', label: '9', aria: '9' },
    { key: '/', label: '÷', aria: 'divide', tone: 'op' },
    { key: 'C', label: 'C', aria: 'clear all', tone: 'fn' },
  ],
  [
    { key: '4', label: '4', aria: '4' },
    { key: '5', label: '5', aria: '5' },
    { key: '6', label: '6', aria: '6' },
    { key: '*', label: '×', aria: 'multiply', tone: 'op' },
    { key: 'CE', label: 'CE', aria: 'clear entry', tone: 'fn' },
  ],
  [
    { key: '1', label: '1', aria: '1' },
    { key: '2', label: '2', aria: '2' },
    { key: '3', label: '3', aria: '3' },
    { key: '-', label: '−', aria: 'subtract', tone: 'op' },
    { key: 'MR', label: 'MR', aria: 'memory recall', tone: 'fn' },
  ],
  [
    { key: '±', label: '±', aria: 'change sign', tone: 'fn' },
    { key: '0', label: '0', aria: '0' },
    { key: '.', label: '.', aria: 'decimal point' },
    { key: '+', label: '+', aria: 'add', tone: 'op' },
    { key: 'MC', label: 'MC', aria: 'memory clear', tone: 'fn' },
  ],
  [
    { key: '(', label: '(', aria: 'open parenthesis', tone: 'fn' },
    { key: ')', label: ')', aria: 'close parenthesis', tone: 'fn' },
    { key: '√', label: '√', aria: 'square root', tone: 'fn' },
    { key: '=', label: '=', aria: 'equals', tone: 'op' },
    { key: 'M+', label: 'M+', aria: 'memory add', tone: 'fn' },
  ],
];

/**
 * On-screen calculator panel. It is not modal: the question stays usable while
 * it is open, and closing it (or reopening it) never resets the question.
 * Keyboard input is accepted while focus is inside the calculator.
 */
export function Calculator({ onClose, onTransfer }: { onClose: () => void; onTransfer?: (value: string) => void }) {
  const [s, setS] = useState<CalcState>(initialCalc);
  const panel = useRef<HTMLDivElement>(null);
  const hit = (k: Key) => setS((st) => press(st, k));

  useEffect(() => {
    panel.current?.focus();
  }, []);

  return (
    <div
      ref={panel}
      className="calc"
      role="dialog"
      aria-label="Calculator"
      tabIndex={-1}
      onKeyDown={(e) => {
        const k = keyFor(e);
        if (k && !(e.target instanceof HTMLButtonElement && (e.key === 'Enter' || e.key === ' '))) {
          e.preventDefault();
          hit(k);
        }
      }}
    >
      <div className="calc-head">
        <strong>Calculator</strong>
        <button className="btn-link" onClick={onClose} aria-label="Close calculator">
          ✕
        </button>
      </div>
      <div className="calc-display" aria-live="polite" aria-label="Display">
        <span className="calc-mem" aria-label={s.memory !== null ? 'Memory in use' : undefined}>
          {s.memory !== null ? 'M' : ''}
        </span>
        <output>{shown(s)}</output>
      </div>
      {s.error && <p className="calc-note">Press C to clear the error.</p>}
      <div className="calc-keys">
        {LAYOUT.flat().map((b) => (
          <button key={b.key} type="button" className={`calc-key ${b.tone ?? ''}`} aria-label={b.aria} onClick={() => hit(b.key)}>
            {b.label}
          </button>
        ))}
      </div>
      {onTransfer && (
        <button type="button" className="btn calc-transfer" disabled={s.error} onClick={() => onTransfer(shown(s))}>
          Transfer Display
        </button>
      )}
    </div>
  );
}

/** "Calc" toggle + panel. The panel stays mounted while hidden so its display survives closing. */
export function CalcButton({ onTransfer }: { onTransfer?: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Lets the page reserve room under the calculator's bottom sheet on small screens.
  useEffect(() => {
    if (!open) return;
    document.body.classList.add('calc-open');
    return () => document.body.classList.remove('calc-open');
  }, [open]);
  return (
    <>
      <button
        type="button"
        className={`btn calc-toggle ${open ? 'active' : ''}`}
        aria-pressed={open}
        onClick={() => {
          setMounted(true);
          setOpen((o) => !o);
        }}
      >
        Calc
      </button>
      {mounted && (
        <div hidden={!open}>
          <Calculator onClose={() => setOpen(false)} onTransfer={onTransfer} />
        </div>
      )}
    </>
  );
}
