import { useEffect, useMemo, useState } from 'react';
import { Diagram } from '../components/Diagrams';
import { Exercise } from '../components/Exercise';
import { MathText } from '../components/MathText';
import { Disclosure, Remember, Steps, Tag } from '../components/ui';
import { FORMULA_BY_ID } from '../data/formulas';
import { LESSON_BY_ID, LESSONS, LESSONS_BY_AREA, type Lesson } from '../data/library';
import { href, questionsForLesson, QUESTION_SHORTCUT } from '../data/links';
import { SHORTCUT_BY_ID } from '../data/shortcuts';
import { AREAS } from '../data/taxonomy';
import type { Area } from '../data/types';
import { lessonStatus, statusLabel } from '../lib/lessonProgress';
import { markLessonVisited, useProgress } from '../lib/progress';

function matchesSearch(l: Lesson, q: string) {
  if (!q) return true;
  const hay = [l.title, l.what, ...l.clues, ...l.decode.map((d) => `${d.symbol} ${d.meaning}`), ...l.remember, l.takeaway].join(' ').toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .every((w) => hay.includes(w));
}

export function Library({ lessonId, section }: { lessonId?: string; section?: string }) {
  if (lessonId && LESSON_BY_ID[lessonId]) return <LessonPage lesson={LESSON_BY_ID[lessonId]} section={section} />;
  return <LibraryIndex missing={lessonId} />;
}

function LibraryIndex({ missing }: { missing?: string }) {
  const progress = useProgress();
  const [area, setArea] = useState<Area | 'all'>('all');
  const [query, setQuery] = useState('');
  const areas = Object.keys(AREAS) as Area[];
  const shown = areas.filter((a) => area === 'all' || a === area);

  return (
    <div className="module">
      <header className="module-head">
        <h2>GRE Topic Library</h2>
        <p className="lede">{LESSONS.length} short lessons across the four official GRE Quant content areas. Each one explains the idea, decodes the symbols, shows the fastest valid method, and ends with practice.</p>
      </header>
      {missing && <p className="invalid">That lesson was not found. Choose one below.</p>}
      <div className="search-row">
        <label className="sr-only" htmlFor="lib-search">
          Search topics
        </label>
        <input id="lib-search" type="search" placeholder="Search topics, symbols, or clue words (e.g. “remainder”, “√”, “at least”)" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="tabs" role="tablist" aria-label="Content area">
        {(['all', ...areas] as const).map((a) => (
          <button key={a} role="tab" aria-selected={area === a} className={area === a ? 'active' : ''} onClick={() => setArea(a)}>
            {a === 'all' ? 'All areas' : AREAS[a]}
          </button>
        ))}
      </div>
      {shown.map((a) => {
        const lessons = LESSONS_BY_AREA[a].filter((l) => matchesSearch(l, query));
        if (!lessons.length) return null;
        const done = LESSONS_BY_AREA[a].filter((l) => statusLabel(lessonStatus(l.id, progress)).label === 'Checks passed').length;
        return (
          <section key={a} className="lib-area">
            <h3 className="section-title">
              {AREAS[a]} <span className="count">{done} of {LESSONS_BY_AREA[a].length} lessons checked off</span>
            </h3>
            <div className="lesson-grid">
              {lessons.map((l) => {
                const st = lessonStatus(l.id, progress);
                const lab = statusLabel(st);
                return (
                  <a key={l.id} className="lesson-card" href={href.lesson(l.id)}>
                    <strong>{l.title}</strong>
                    <span className="lesson-takeaway">
                      <MathText text={l.takeaway} />
                    </span>
                    <span className="lesson-meta">
                      <Tag tone={lab.tone}>{lab.label}</Tag>
                      <span>
                        Checks {st.checksPassed}/{st.checksTotal} · Questions {st.bankCorrect}/{st.bankTotal}
                      </span>
                    </span>
                  </a>
                );
              })}
            </div>
          </section>
        );
      })}
      {shown.every((a) => !LESSONS_BY_AREA[a].some((l) => matchesSearch(l, query))) && <p className="empty">No lessons match “{query}”.</p>}
    </div>
  );
}

const SECTION_IDS = ['what', 'recognize', 'decode', 'remember', 'fastest', 'show', 'trap', 'try', 'takeaway'] as const;

function LessonPage({ lesson: l, section }: { lesson: Lesson; section?: string }) {
  const progress = useProgress();
  const st = lessonStatus(l.id, progress);
  const bank = questionsForLesson(l.id);
  const withShortcut = bank.filter((id) => QUESTION_SHORTCUT[id]);
  const idx = LESSONS.findIndex((x) => x.id === l.id);
  const prev = LESSONS[idx - 1];
  const next = LESSONS[idx + 1];

  useEffect(() => {
    markLessonVisited(l.id);
  }, [l.id]);
  useEffect(() => {
    if (section && (SECTION_IDS as readonly string[]).includes(section)) document.getElementById(`sec-${section}`)?.scrollIntoView?.({ block: "start" });
  }, [section, l.id]);

  const practiceModes = useMemo(
    () => [
      { mode: 'recognition', label: 'Recognition', desc: 'Identify the concept without solving', count: bank.length },
      { mode: 'decode', label: 'Decode', desc: 'Identify variables, symbols, and given information', count: bank.length },
      { mode: 'strategy', label: 'Strategy', desc: 'Choose the fastest valid method', count: bank.length },
      { mode: 'solve', label: 'Solve', desc: 'Solve a question on your own', count: bank.length },
      { mode: 'shortcut', label: 'Shortcut', desc: 'Apply the lesson’s shortcut', count: withShortcut.length },
    ],
    [bank.length, withShortcut.length],
  );

  return (
    <article className="module lesson-page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="#/library">Topic Library</a> › <span>{AREAS[l.area]}</span>
      </nav>
      <header className="module-head">
        <h2>{l.title}</h2>
        <p className="lesson-progress">
          <Tag tone={statusLabel(st).tone}>{statusLabel(st).label}</Tag> Quick checks {st.checksPassed}/{st.checksTotal} · Practice questions solved {st.bankCorrect}/{st.bankTotal}
        </p>
      </header>

      <section id="sec-what" className="card lesson-sec">
        <h3>What is it?</h3>
        <p>
          <MathText text={l.what} />
        </p>
        {l.diagram && <Diagram id={l.diagram} />}
      </section>

      <section id="sec-recognize" className="card lesson-sec">
        <h3>How do I recognize it?</h3>
        <ul className="clues">
          {l.clues.map((c, i) => (
            <li key={i}>
              <mark>
                <MathText text={c} />
              </mark>
            </li>
          ))}
        </ul>
      </section>

      <section id="sec-decode" className="card lesson-sec">
        <h3>Decode it</h3>
        <table className="parts-table">
          <thead>
            <tr>
              <th scope="col">Symbol / term</th>
              <th scope="col">What it means</th>
            </tr>
          </thead>
          <tbody>
            {l.decode.map((d, i) => (
              <tr key={i}>
                <td>
                  <MathText text={d.symbol} />
                </td>
                <td>
                  <MathText text={d.meaning} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {l.formulas?.length ? (
          <p className="note">
            Break a formula down piece by piece:{' '}
            {l.formulas.map((f, i) => (
              <span key={f}>
                {i > 0 && ' · '}
                <a href={href.formula(f)}>{FORMULA_BY_ID[f].name}</a>
              </span>
            ))}
          </p>
        ) : null}
      </section>

      <section id="sec-remember" className="card lesson-sec">
        <h3>What do I need to remember?</h3>
        <ul className="formula-list">
          {l.remember.map((x, i) => (
            <li key={i}>
              <MathText text={x} roomy />
            </li>
          ))}
        </ul>
      </section>

      <section id="sec-fastest" className="card lesson-sec">
        <h3>What’s the fastest way?</h3>
        <p>
          <MathText text={l.fastest.method} />
        </p>
        <Disclosure label="When is this valid?">
          <MathText text={l.fastest.when} />
        </Disclosure>
        {l.shortcuts?.length ? (
          <p className="chip-links">
            {l.shortcuts.map((s) => (
              <a key={s} className="chip" href={href.shortcut(s)}>
                {SHORTCUT_BY_ID[s].name}
              </a>
            ))}
          </p>
        ) : null}
      </section>

      <section id="sec-show" className="card lesson-sec">
        <h3>Show me</h3>
        <p className="exercise-prompt">
          <MathText text={l.example.problem} />
        </p>
        <Disclosure label="Show the worked solution">
          <Steps steps={l.example.fast} />
          <p className="answer-line">
            <strong>Answer:</strong> <MathText text={l.example.answer} />
          </p>
          {l.example.long && (
            <Disclosure label="Show the traditional solution">
              <Steps steps={l.example.long} />
            </Disclosure>
          )}
        </Disclosure>
      </section>

      <section id="sec-trap" className="card lesson-sec trap">
        <h3>Common GRE trap</h3>
        <p>
          <strong>Trap:</strong> <MathText text={l.trap.trap} />
        </p>
        <p>
          <strong>Avoid it:</strong> <MathText text={l.trap.fix} />
        </p>
      </section>

      <section id="sec-try" className="card lesson-sec">
        <h3>Let me try</h3>
        {l.tryIt.map((ex) => (
          <Exercise key={ex.id} exercise={ex} refPrefix={`lesson:${l.id}`} kind="lesson-check" helpLink={{ href: href.lesson(l.id, 'decode'), label: 'Learn What This Means' }} />
        ))}
        <h4>Practice with GRE-style questions</h4>
        <div className="practice-modes">
          {practiceModes.map((m) =>
            m.count ? (
              <a key={m.mode} className="practice-mode" href={href.lessonPractice(l.id, m.mode)}>
                <strong>{m.label}</strong>
                <span>{m.desc}</span>
                <span className="count">
                  {m.count} question{m.count === 1 ? '' : 's'}
                </span>
              </a>
            ) : (
              <div key={m.mode} className="practice-mode locked" aria-disabled="true">
                <strong>{m.label}</strong>
                <span>{m.desc}</span>
                <span className="count">No questions in the bank for this mode yet</span>
              </div>
            ),
          )}
        </div>
      </section>

      <section id="sec-takeaway" className="lesson-sec">
        <Remember text={l.takeaway} />
      </section>

      <nav className="pager" aria-label="Lesson navigation">
        {prev ? <a href={href.lesson(prev.id)}>← {prev.title}</a> : <span />}
        {next ? <a href={href.lesson(next.id)}>{next.title} →</a> : <span />}
      </nav>
    </article>
  );
}
