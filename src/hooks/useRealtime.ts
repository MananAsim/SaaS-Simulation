'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTicketStore } from '@/store/useTicketStore';

/**
 * Connects to the SSE endpoint and updates the Zustand store
 * when a new ticket, status update, or collision event comes in from the server.
 */
export function useRealtime() {
  const { status } = useSession();
  const addTicket = useTicketStore((s) => s.addIncomingTicket);
  const updateTicket = useTicketStore((s) => s.handleRealtimeUpdate);
  const setCollisionViewers = useTicketStore((s) => s.setCollisionViewers);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const es = new EventSource('/api/events');
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'ticket:new') {
          addTicket(data.ticket);
        } else if (data.type === 'ticket:updated') {
          updateTicket(data.ticket);
        } else if (data.type === 'collision:update') {
          setCollisionViewers(data.ticketId, data.viewers);
        }
      } catch {
        // Ignore malformed messages
      }
    };

    es.onerror = () => {
      // Browser will automatically retry on error — no manual retry needed
    };

    return () => {
      es.close();
    };
  }, [status, addTicket, updateTicket, setCollisionViewers]);
}
