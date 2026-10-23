import { useEffect, useRef, useState } from 'react';

/**
 * Countdown to an absolute deadline. Remaining time is computed from the clock
 * on every tick, so it stays correct if the tab is throttled or the page reloads.
 * `onExpire` fires once when the deadline passes.
 */
export function useCountdown(deadline: number | null, onExpire: () => void, tickMs = 250) {
  const [now, setNow] = useState(() => Date.now());
  const fired = useRef(false);
  const cb = useRef(onExpire);
  cb.current = onExpire;

  useEffect(() => {
    fired.current = false;
    setNow(Date.now());
    if (deadline === null) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= deadline && !fired.current) {
        fired.current = true;
        cb.current();
      }
    }, tickMs);
    return () => clearInterval(id);
  }, [deadline, tickMs]);

  return deadline === null ? null : Math.max(0, deadline - now);
}

export function formatClock(ms: number) {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}
