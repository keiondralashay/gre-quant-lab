import { useState } from 'react';
import { Diagram } from '../components/Diagrams';
import { Exercise } from '../components/Exercise';
import { MathText, Tex } from '../components/MathText';
import { FORMULA_BY_ID, FORMULAS, renderFormula, renderPart, type Formula } from '../data/formulas';
import { LESSON_BY_ID } from '../data/library';
import { href } from '../data/links';
import { AREAS } from '../data/taxonomy';
import type { Area } from '../data/types';
import { QuadraticPractice } from './Decode';

export function Formulas({ formulaId }: { formulaId?: string }) {
  if (formulaId && FORMULA_BY_ID[formulaId]) return <FormulaPage f={FORMULA_BY_ID[formulaId]} />;
  return <FormulaIndex missing={formulaId} />;
}

function FormulaIndex({ missing }: { missing?: string }) {
  const [query, setQuery] = useState('');
  const shown = FORMULAS.filter((f) => !query || `${f.name} ${f.parts.map((p) => `${p.name} ${p.meaning}`).join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="module">
      <header className="module-head">
        <h2>Understand the Formula</h2>
        <p className="lede">Pick a formula. Tap any part of it to see what that letter or symbol means, then test yourself.</p>
      </header>
      {missing && <p className="invalid">That formula was not found.</p>}
      <div className="search-row">
        <label className="sr-only" htmlFor="formula-search">
          Search formulas
        </label>
        <input id="formula-search" type="search" placeholder="Search: slope, area, discriminant, interest…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {(Object.keys(AREAS) as Area[]).map((a) => {
        const list = shown.filter((f) => f.area === a);
        if (!list.length) return null;
        return (
          <section key={a}>
            <h3 className="section-title">{AREAS[a]}</h3>
            <div className="lesson-grid">
              {list.map((f) => (
                <a key={f.id} className="lesson-card formula-card" href={href.formula(f.id)}>
                  <strong>{f.name}</strong>
                  <span className="formula-preview">
                    <Tex tex={renderFormula(f, null)} />
                  </span>
                </a>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function FormulaPage({ f }: { f: Formula }) {
  const [selected, setSelected] = useState<string | null>(f.parts[0]?.id ?? null);
  const part = f.parts.find((p) => p.id === selected);
  return (
    <article className="module">
      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="#/formulas">Understand the Formula</a> › <span>{AREAS[f.area]}</span>
      </nav>
      <header className="module-head">
        <h2>{f.name}</h2>
      </header>
      <section className="card">
        <div className="form-display formula-big" aria-label={`Formula with ${part ? part.name : 'no part'} highlighted`}>
          <Tex tex={renderFormula(f, selected)} display />
        </div>
        <p className="note">Tap a part to highlight it everywhere it appears:</p>
        <div className="chip-row" role="group" aria-label="Formula parts">
          {f.parts.map((p) => (
            <button key={p.id} aria-label={p.name} className={`chip ${selected === p.id ? "active" : ""}`} aria-pressed={selected === p.id} onClick={() => setSelected(p.id)}>
              <Tex tex={renderPart(f, p.id)} />
            </button>
          ))}
        </div>
        {part && (
          <div className="part-meaning" role="status">
            <strong>{part.name}:</strong> <MathText text={part.meaning} />
          </div>
        )}
        <details className="all-parts">
          <summary>Show every part at once</summary>
          <table className="parts-table">
            <tbody>
              {f.parts.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>
                    <MathText text={p.meaning} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
        {f.notes?.map((n, i) => (
          <p key={i} className="note">
            <MathText text={n} />
          </p>
        ))}
        {f.diagram && <Diagram id={f.diagram} />}
      </section>
      <section className="card">
        <h3>Test My Understanding</h3>
        <Exercise exercise={f.test} refPrefix={`formula:${f.id}`} kind="formula-check" helpLink={{ href: href.lesson(f.lesson, 'decode'), label: 'Learn What This Means' }} />
      </section>
      {f.generator === 'quadratic' && <QuadraticPractice kind="formula-check" refPrefix={`formula:${f.id}:gen`} />}
      <p className="note">
        Concept lesson: <a href={href.lesson(f.lesson)}>{LESSON_BY_ID[f.lesson].title}</a>
      </p>
    </article>
  );
}
