'use client';

import { useState, useEffect } from 'react';
import { differenceInSeconds, isPast } from 'date-fns';

/**
 * Returns a live, second-precise formatted countdown string.
 * Returns null if the deadline is paused or resolved.
 */
export function useLiveCountdown(deadline: Date | null, paused = false) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    deadline ? differenceInSeconds(deadline, new Date()) : 0
  );

  useEffect(() => {
    if (!deadline || paused) return;
    const tick = () =>
      setSecondsLeft(differenceInSeconds(deadline, new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline, paused]);

  if (!deadline || paused) return { display: 'Paused', breached: false, urgent: false };

  const breached = secondsLeft < 0;
  const abs = Math.abs(secondsLeft);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  const display = h > 0
    ? `${breached ? '+' : ''}${h}h ${pad(m)}m`
    : `${breached ? '+' : ''}${pad(m)}:${pad(s)}`;

  return {
    display: breached ? `Breached ${display}` : display,
    breached,
    urgent: !breached && secondsLeft < 10 * 60, // under 10 min
  };
}
