import { useEffect, useState } from 'react';
import { CATEGORY_IDS } from './data/taxonomy';
import type { Category } from './data/types';
import { ALL_FILTER, type DeckFilter } from './lib/deck';
import { ChooseMethod } from './modules/ChooseMethod';
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
  { href: '#/', path: '/', label: 'Dashboard' },
  { href: '#/recognize', path: '/recognize', label: 'Recognize' },
  { href: '#/decode', path: '/decode', label: 'Decode' },
  { href: '#/method', path: '/method', label: 'Fastest Way' },
  { href: '#/shortcut', path: '/shortcut', label: 'Shortcuts' },
];

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
  let view;
  switch (route.path) {
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
    default:
      view = <Dashboard />;
  }

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
            <a key={n.href} href={n.href} className={route.path === n.path ? 'active' : ''} aria-current={route.path === n.path ? 'page' : undefined}>
              {n.label}
            </a>
          ))}
        </nav>
      </header>
      <main className="main">{view}</main>
      <footer className="footer">Original GRE-style practice questions. Every answer key is verified by automated tests. Progress is stored only in this browser.</footer>
    </div>
  );
}
