import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';
import { resetProgress } from '../lib/progress';

beforeEach(() => {
  resetProgress();
  window.location.hash = '#/guided';
});

describe('site navigation', () => {
  it('opens a labeled drawer with every page, closes on Escape and returns focus', async () => {
    const user = userEvent.setup();
    render(<App />);
    const toggle = screen.getByRole('button', { name: 'Menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog', { name: 'Site menu' })).toBeNull();
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const drawer = screen.getByRole('dialog', { name: 'Site menu' });
    const all = within(drawer).getByRole('navigation', { name: 'All pages' });
    for (const label of ['Walk Me Through It', 'Quantitative Comparison', 'Data Interpretation', 'Mistake Review Queue', 'Topic Library']) expect(within(all).getByRole('link', { name: label })).toBeInTheDocument();
    expect(within(all).getByRole('link', { name: 'Walk Me Through It' })).toHaveAttribute('aria-current', 'page');
    expect(document.activeElement).toBe(within(drawer).getByRole('button', { name: 'Close menu' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Site menu' })).toBeNull();
    expect(document.activeElement).toBe(toggle);
  });
  it('marks the matching primary link as current', () => {
    render(<App />);
    expect(within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: 'Practice' })).toHaveAttribute('aria-current', 'page');
  });
  it('keeps keyboard focus inside the open drawer', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    const drawer = screen.getByRole('dialog', { name: 'Site menu' });
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(drawer.contains(document.activeElement)).toBe(true);
  });
});
