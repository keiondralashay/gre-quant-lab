import { useEffect, useState } from 'react';
import { CATEGORY_IDS } from './data/taxonomy';
import type { Category } from './data/types';
import { ALL_FILTER, type DeckFilter } from './lib/deck';
import { ChooseMethod } from './modules/ChooseMethod';
import { Clues } from './modules/Clues';
import { Flashcards } from './modules/Flashcards';
import { Formulas } from './modules/Formulas';
import { Library } from './modules/Library';
import { Practice } from './modules/Practice';
import { Vault } from './modules/Vault';
import { NextPractice } from './modules/NextPractice';
import { Progress } from './modules/Progress';
import { QuickPractice } from './modules/QuickPractice';
import { Review } from './modules/Review';
import { Speed } from './modules/Speed';
import { Dashboard } from './modules/Dashboard';
import { Decode } from './modules/Decode';
import { Recognize } from './modules/Recognize';
import { ShortcutVsTraditional } from './modules/ShortcutVsTraditional';

interface Route {
  path: string;
  params: URLSearchParams;
}

function parseHash(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?');
  return { path, params: new URLSearchParams(query) };
}

function filterFrom(params: URLSearchParams): DeckFilter {
  const cat = params.get('cat');
  return { ...ALL_FILTER, category: cat && CATEGORY_IDS.includes(cat as Category) ? (cat as Category) : 'all' };
}

const NAV = [
  { href: '#/', path: '/', label: 'Home' },
  { href: '#/library', path: '/library', label: 'Library' },
  { href: '#/practice', path: '/practice', label: 'Practice' },
  { href: '#/speed', path: '/speed', label: 'Speed' },
  { href: '#/review', path: '/review', label: 'Review' },
  { href: '#/progress', path: '/progress', label: 'Progress' },
  { href: '#/vault', path: '/vault', label: 'Vault' },
  { href: '#/formulas', path: '/formulas', label: 'Formulas' },
  { href: '#/clues', path: '/clues', label: 'Clues' },
  { href: '#/flashcards', path: '/flashcards', label: 'Flashcards' },
];

/** Phase 1 trainers live under Practice in the nav. */
const PRACTICE_PATHS = ['/practice', '/recognize', '/decode', '/method', '/shortcut'];
/** Phase 4 personalization pages live under Progress. */
const PROGRESS_PATHS = ['/progress', '/next', '/quick'];

export function App() {
  const [route, setRoute] = useState(parseHash);
  useEffect(() => {
    const on = () => {
      setRoute(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const routeKey = route.path + '?' + route.params.toString();
  const [, section, id] = route.path.split('/');
  const base = `/${section ?? ''}`;
  let view;
  switch (base) {
    case '/recognize':
      view = <Recognize key={routeKey} initialFilter={filterFrom(route.params)} initialMode={route.params.get('mode') === 'first' ? 'first' : 'type'} />;
      break;
    case '/decode':
      view = <Decode key={routeKey} initialLesson={route.params.get('lesson') ?? undefined} />;
      break;
    case '/method':
      view = <ChooseMethod key={routeKey} initialFilter={filterFrom(route.params)} />;
      break;
    case '/shortcut':
      view = <ShortcutVsTraditional key={routeKey} initialFilter={filterFrom(route.params)} />;
      break;
    case '/library':
      view = <Library key={routeKey} lessonId={id} section={route.params.get('section') ?? undefined} />;
      break;
    case '/vault':
      view = <Vault key={routeKey} shortcutId={id} practice={route.params.get('practice') === '1'} />;
      break;
    case '/formulas':
      view = <Formulas key={routeKey} formulaId={id} />;
      break;
    case '/clues':
      view = <Clues key={routeKey} />;
      break;
    case '/flashcards':
      view = <Flashcards key={routeKey} />;
      break;
    case '/practice':
      view = <Practice key={routeKey} lesson={route.params.get('lesson') ?? undefined} mode={route.params.get('mode') ?? undefined} level={route.params.get('level') ?? undefined} />;
      break;
    case '/progress':
      view = <Progress key={routeKey} />;
      break;
    case '/next':
      view = <NextPractice key={routeKey} />;
      break;
    case '/quick':
      view = <QuickPractice key={routeKey} />;
      break;
    case '/review':
      view = <Review key={routeKey} />;
      break;
    case '/speed':
      view = <Speed key={routeKey} mode={route.params.get('mode') ?? undefined} sessionId={route.params.get('session') ?? undefined} />;
      break;
    default:
      view = <Dashboard />;
  }
  const activeNav = PRACTICE_PATHS.includes(base) ? '/practice' : PROGRESS_PATHS.includes(base) ? '/progress' : base;

  return (
    <div className="app">
      <header className="topbar">
        <a href="#/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            Q
          </span>
          <span>GRE Quant</span>
        </a>
        <nav className="nav" aria-label="Main">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className={activeNav === n.path ? 'active' : ''} aria-current={activeNav === n.path ? 'page' : undefined}>
              {n.label}
            </a>
          ))}
        </nav>
      </header>
      <main className="main">{view}</main>
      <footer className="footer">Original GRE-style practice questions and lessons. Every answer key is verified by automated tests. Progress is stored only in this browser.</footer>
    </div>
  );
}
