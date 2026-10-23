import { useState } from 'react';
import { fmt, relation, type QCModel, type Values } from '../data/qcModels';
import { parseRational } from '../lib/grading';
import { MathText } from './MathText';

interface Row {
  values: Values;
  derived?: Values;
  a: number;
  b: number;
  rel: 'A' | 'B' | 'C';
}

const REL_TEXT = { A: 'A > B', B: 'A < B', C: 'A = B' } as const;

/**
 * "Test Different Values": the learner picks values, the question's conditions
 * are enforced, and the evidence summary never claims more than examples can
 * show. Two allowed cases with different relationships prove D; agreeing cases
 * prove nothing about "always".
 */
export function ValueTester({ model, quantityA, quantityB }: { model: QCModel; quantityA?: string; quantityB?: string }) {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<Row[]>([]);
  const [rejected, setRejected] = useState<string | null>(null);

  function test(raw: Record<string, string> = inputs) {
    const values: Values = {};
    for (const v of model.vars) {
      const p = parseRational(raw[v.name] ?? '');
      if (!p) return setRejected(`Enter a number for ${v.name} (integers, decimals, or fractions like −3/4).`);
      values[v.name] = p.num / p.den;
    }
    const ok = model.check(values);
    const shown = model.vars.map((v) => `${v.name} = ${raw[v.name]}`).join(', ');
    if (ok !== true) return setRejected(`Not allowed: ${shown}. ${ok} Only values that satisfy every condition can be used as evidence.`);
    setRejected(null);
    const a = model.A(values);
    const b = model.B(values);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return setRejected(`One of the quantities is undefined for ${shown}.`);
    setRows((r) => [...r, { values, derived: model.derive?.(values), a, b, rel: relation(a, b) }]);
  }

  const rels = [...new Set(rows.map((r) => r.rel))];
  const firstOf = (rel: string) => rows.findIndex((r) => r.rel === rel) + 1;

  return (
    <section className="card value-tester" aria-label="Test Different Values">
      <h4>Test Different Values</h4>
      <p className="note">
        Conditions: <MathText text={model.conditions} />. Values that break a condition are rejected.
      </p>
      <div className="vt-inputs">
        {model.vars.map((v) => (
          <label key={v.name}>
            <span>
              {v.name}
              {v.label ? ` (${v.label})` : ''}
            </span>
            <input value={inputs[v.name] ?? ''} autoComplete="off" onChange={(e) => setInputs((s) => ({ ...s, [v.name]: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && test()} placeholder="e.g. −2, 1/2, 0" />
          </label>
        ))}
        <button className="btn btn-primary" onClick={() => test()}>
          Test these values
        </button>
      </div>
      <div className="vt-try" role="group" aria-label="Values worth trying">
        <span className="note">Try:</span>
        {model.try.map((t) => (
          <button
            key={t.label}
            className="chip"
            onClick={() => {
              setInputs(t.values);
              test(t.values);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {rejected && (
        <p className="invalid" role="alert">
          {rejected}
        </p>
      )}
      {rows.length > 0 && (
        <div className="table-wrap">
          <table className="data-table vt-table">
            <caption className="sr-only">Tested values</caption>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Values</th>
                <th scope="col">
                  Quantity A{quantityA && <span className="sr-only">: {quantityA}</span>}
                </th>
                <th scope="col">
                  Quantity B{quantityB && <span className="sr-only">: {quantityB}</span>}
                </th>
                <th scope="col">Result</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>
                    {Object.entries(r.values)
                      .map(([k, v]) => `${k} = ${fmt(v)}`)
                      .join(', ')}
                    {r.derived && (
                      <span className="note">
                        {' '}
                        (
                        {Object.entries(r.derived)
                          .map(([k, v]) => `${k} = ${fmt(v)}`)
                          .join(', ')}
                        )
                      </span>
                    )}
                  </td>
                  <td>{fmt(r.a)}</td>
                  <td>{fmt(r.b)}</td>
                  <td>
                    <strong>{REL_TEXT[r.rel]}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="vt-summary" role="status">
        {rows.length === 0 && <p>Test at least two allowed values. Include special cases when they are allowed: 0, 1, a negative number, a fraction, and a large number.</p>}
        {rows.length > 0 && rels.length === 1 && (
          <p>
            {rows.length === 1 ? 'This case gives' : `All ${rows.length} cases so far give`} <strong>{REL_TEXT[rels[0]]}</strong>. That does <strong>not</strong> prove it is always true: examples can only rule answers out. Keep looking for a case that breaks the pattern, or find a reason why it must hold for every allowed value.
          </p>
        )}
        {rels.length > 1 && (
          <p>
            <strong>This proves D.</strong> Case {firstOf(rels[0])} gives {REL_TEXT[rels[0]]}, but case {firstOf(rels[1])} gives {REL_TEXT[rels[1]]}. Both satisfy every condition, so the relationship is not fixed: the answer is D.
          </p>
        )}
      </div>
      {rows.length > 0 && (
        <button className="btn-link" onClick={() => setRows([])}>
          Clear tested values
        </button>
      )}
    </section>
  );
}
