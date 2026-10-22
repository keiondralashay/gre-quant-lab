import { useMemo, useState } from 'react';
import { MathText } from '../components/MathText';
import { Feedback, OptionList, type OptionState } from '../components/ui';
import { PHRASES, REVERSES, TRANSLATIONS, TRAPS } from '../data/clues';
import { recordAttempt } from '../lib/progress';
import { shuffle } from '../lib/random';

export interface QuizItem {
  id: string;
  prompt: string;
  ask: string;
  options: string[];
  answer: number;
  explain: string;
}

type Tab = 'meaning' | 'translate' | 'reverse' | 'traps';

const TABS: { id: Tab; label: string; blurb: string }[] = [
  { id: 'meaning', label: 'Phrase → meaning', blurb: 'Choose what each GRE phrase means mathematically.' },
  { id: 'translate', label: 'Words → expression', blurb: 'Translate a statement into math. Word order matters.' },
  { id: 'reverse', label: 'Expression → words', blurb: 'Read an expression back as words.' },
  { id: 'traps', label: 'Wording traps', blurb: 'Pairs of phrases that look alike but mean different things.' },
];

export function buildItems(tab: Tab): QuizItem[] {
  switch (tab) {
    case 'meaning':
      return PHRASES.map((p) => ({ id: `phrase:${p.id}`, prompt: `“${p.phrase}”`, ask: 'What does this mean?', options: p.options, answer: p.answer, explain: p.explain }));
    case 'translate':
      return TRANSLATIONS.map((t) => ({ id: `translate:${t.id}`, prompt: `“${t.statement}”`, ask: 'Which expression matches?', options: t.options.map((o) => o.tex), answer: t.answer, explain: t.explain }));
    case 'reverse':
      return REVERSES.map((r) => ({ id: `reverse:${r.id}`, prompt: r.expression, ask: 'Which words describe this?', options: r.options, answer: r.answer, explain: r.explain }));
    case 'traps':
      return TRAPS.flatMap((t) => [
        { id: `trap:${t.id}:a`, prompt: `“${t.a.words}”`, ask: 'Which one is this?', options: [t.a.math, t.b.math], answer: 0, explain: t.why },
        { id: `trap:${t.id}:b`, prompt: `“${t.b.words}”`, ask: 'Which one is this?', options: [t.a.math, t.b.math], answer: 1, explain: t.why },
      ]);
  }
}

export function Clues() {
  const [tab, setTab] = useState<Tab>('meaning');
  const items = useMemo(() => buildItems(tab), [tab]);
  return (
    <div className="module">
      <header className="module-head">
        <h2>Spot the Clue</h2>
        <p className="lede">Many GRE questions are hard because of the wording, not the math. Train yourself to translate exactly.</p>
      </header>
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <p className="note">{TABS.find((t) => t.id === tab)!.blurb}</p>
      {tab === 'traps' && (
        <details className="card">
          <summary>See all the traps side by side</summary>
          <table className="parts-table">
            <tbody>
              {TRAPS.map((t) => (
                <tr key={t.id}>
                  <td>
                    {t.a.words} → <MathText text={t.a.math} />
                    <br />
                    {t.b.words} → <MathText text={t.b.math} />
                  </td>
                  <td>{t.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
      <Quiz key={tab} items={items} />
    </div>
  );
}

export function Quiz({ items }: { items: QuizItem[] }) {
  const order = useMemo(() => shuffle(items), [items]);
  const [i, setI] = useState(0);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const item = order[i % order.length];
  // Shuffle option order per item so the answer position carries no information.
  const optOrder = useMemo(() => shuffle(item.options.map((_, k) => k)), [item]);
  const [picked, setPicked] = useState<number | null>(null);

  function pick(display: number) {
    if (picked !== null) return;
    const k = optOrder[display];
    setPicked(k);
    const ok = k === item.answer;
    setScore((s) => ({ right: s.right + (ok ? 1 : 0), total: s.total + 1 }));
    recordAttempt({ kind: 'clue', ref: item.id, result: ok ? 'correct' : 'incorrect', detail: String(k) });
  }

  return (
    <div className="round">
      <p className="counter">
        Item {(i % order.length) + 1} of {order.length} · This session: {score.right}/{score.total} correct
      </p>
      <div className="card clue-prompt">
        <MathText text={item.prompt} />
      </div>
      <p className="ask">{item.ask}</p>
      <OptionList
        options={optOrder.map((k) => item.options[k])}
        onPick={pick}
        disabled={picked !== null}
        states={optOrder.map((k): OptionState => (picked === null ? 'idle' : k === item.answer ? 'correct' : k === picked ? 'incorrect' : 'idle'))}
      />
      {picked !== null && (
        <>
          <Feedback tone={picked === item.answer ? 'correct' : 'incorrect'} title={picked === item.answer ? 'Correct.' : 'Not quite.'}>
            <p>
              <MathText text={item.explain} />
            </p>
          </Feedback>
          <div className="actions">
            <button
              className="btn btn-primary"
              onClick={() => {
                setPicked(null);
                setI((n) => n + 1);
              }}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
