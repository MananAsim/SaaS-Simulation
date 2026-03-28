'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Tracks which ticket the current agent is viewing.
 * Reports focus/blur events to the collision API which
 * then broadcasts to all co-agents via SSE.
 */
export function useCollisionDetection(ticketId: string | null) {
  const { data: session } = useSession();
  const currentTicketRef = useRef<string | null>(null);

  useEffect(() => {
    if (!session?.user || !ticketId) return;

    const report = (action: 'focus' | 'blur', tid: string) => {
      fetch('/api/collision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: tid, action }),
      }).catch(() => {});
    };

    // Blur the previous ticket
    if (currentTicketRef.current && currentTicketRef.current !== ticketId) {
      report('blur', currentTicketRef.current);
    }

    // Focus the new ticket
    report('focus', ticketId);
    currentTicketRef.current = ticketId;

    // Blur on unmount
    return () => {
      if (currentTicketRef.current) {
        report('blur', currentTicketRef.current);
      }
    };
  }, [ticketId, session]);
}
