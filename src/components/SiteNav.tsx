import { useEffect, useRef, useState } from 'react';

export interface NavItem {
  href: string;
  path: string;
  label: string;
}

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Learn',
    items: [
      { href: '#/', path: '/', label: 'Home' },
      { href: '#/library', path: '/library', label: 'Topic Library' },
      { href: '#/vault', path: '/vault', label: 'Shortcut Vault' },
      { href: '#/formulas', path: '/formulas', label: 'Understand the Formula' },
      { href: '#/clues', path: '/clues', label: 'Spot the Clue' },
      { href: '#/flashcards', path: '/flashcards', label: 'Flashcards' },
    ],
  },
  {
    label: 'Practice',
    items: [
      { href: '#/practice', path: '/practice', label: 'Topic Practice' },
      { href: '#/recognize', path: '/recognize', label: 'Recognize the Problem' },
      { href: '#/decode', path: '/decode', label: 'Decode the Equation' },
      { href: '#/method', path: '/method', label: 'Choose the Fastest Method' },
      { href: '#/shortcut', path: '/shortcut', label: 'Shortcut vs. Traditional' },
      { href: '#/guided', path: '/guided', label: 'Walk Me Through It' },
      { href: '#/qc', path: '/qc', label: 'Quantitative Comparison' },
      { href: '#/di', path: '/di', label: 'Data Interpretation' },
    ],
  },
  {
    label: 'Test',
    items: [{ href: '#/speed', path: '/speed', label: 'Speed & Timed Practice' }],
  },
  {
    label: 'Track',
    items: [
      { href: '#/progress', path: '/progress', label: 'My Quant Progress' },
      { href: '#/next', path: '/next', label: 'What Should I Practice Next?' },
      { href: '#/quick', path: '/quick', label: 'Practice What I Need' },
      { href: '#/review', path: '/review', label: 'Mistake Review Queue' },
    ],
  },
];

/** Shown inline on wide screens; everything is also in the menu. */
const PRIMARY: NavItem[] = [
  { href: '#/', path: '/', label: 'Home' },
  { href: '#/library', path: '/library', label: 'Library' },
  { href: '#/practice', path: '/practice', label: 'Practice' },
  { href: '#/speed', path: '/speed', label: 'Timed' },
  { href: '#/review', path: '/review', label: 'Review' },
  { href: '#/progress', path: '/progress', label: 'Progress' },
];

/** Which primary link a page belongs to (e.g. every trainer counts as Practice). */
const PRIMARY_OF: Record<string, string> = {
  '/recognize': '/practice',
  '/decode': '/practice',
  '/method': '/practice',
  '/shortcut': '/practice',
  '/guided': '/practice',
  '/qc': '/practice',
  '/di': '/practice',
  '/next': '/progress',
  '/quick': '/progress',
};

export function SiteNav({ base }: { base: string }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const primary = PRIMARY_OF[base] ?? base;

  // Close on navigation.
  useEffect(() => setOpen(false), [base]);

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>('a, button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      }
      if (e.key === 'Tab' && panel.current) {
        const els = [...panel.current.querySelectorAll<HTMLElement>('a, button')];
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <nav className="nav-primary" aria-label="Main">
        {PRIMARY.map((n) => (
          <a key={n.href} href={n.href} className={primary === n.path ? 'active' : ''} aria-current={primary === n.path ? 'page' : undefined}>
            {n.label}
          </a>
        ))}
      </nav>
      <button ref={toggle} type="button" className="menu-toggle" aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen((o) => !o)}>
        <span aria-hidden="true">☰</span> Menu
      </button>
      {open && <div className="menu-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}
      <div ref={panel} id="site-menu" className={`menu-drawer ${open ? 'open' : ''}`} hidden={!open} role="dialog" aria-modal="true" aria-label="Site menu">
        <div className="menu-head">
          <strong>All pages</strong>
          <button type="button" className="btn-link" onClick={() => {
              setOpen(false);
              toggle.current?.focus();
            }} aria-label="Close menu">
            ✕
          </button>
        </div>
        <nav aria-label="All pages">
          {NAV_GROUPS.map((g) => (
            <section key={g.label} className="menu-group">
              <h2 className="menu-group-title">{g.label}</h2>
              <ul>
                {g.items.map((n) => (
                  <li key={n.href}>
                    <a href={n.href} aria-current={base === n.path ? 'page' : undefined} className={base === n.path ? 'active' : ''} onClick={() => setOpen(false)}>
                      {n.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
      </div>
    </>
  );
}
