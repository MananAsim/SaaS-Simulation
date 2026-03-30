'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { KpiHeader } from '@/components/KpiHeader';
import { QueueSidebar } from '@/components/QueueSidebar';
import { TicketCenter } from '@/components/TicketCenter';
import { TelemetrySidebar } from '@/components/TelemetrySidebar';
import { EscalationModal } from '@/components/EscalationModal';
import { ToastProvider } from '@/components/ToastProvider';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { AnalyticsModal } from '@/components/AnalyticsModal';
import { useTicketStore, mapRawTicket } from '@/store/useTicketStore';
import { useRealtime } from '@/hooks/useRealtime';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useCollisionDetection } from '@/hooks/useCollisionDetection';

export function DashboardClient({ initialTickets = [] }: { initialTickets: any[] }) {
  const { status } = useSession();
  const setTickets = useTicketStore((state) => state.setTickets);
  const [isLoaded, setIsLoaded] = useState(false);

  // Connect to SSE for live updates
  useRealtime();

  useEffect(() => {
    // Always call setTickets — even with [] — so the store is initialised
    // and child components never map() over undefined.
    const mapped = (initialTickets ?? []).map((t) => mapRawTicket(t));
    setTickets(mapped);
    setIsLoaded(true);
  }, [initialTickets, setTickets]);

  if (status === 'loading' || !isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#09090b] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-indigo-600 animate-pulse" />
          <span className="text-sm text-zinc-400">Loading SupportOS...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background text-foreground h-screen overflow-hidden selection:bg-indigo-500/30">
      <KpiHeader />
      <div className="flex flex-1 overflow-hidden relative">
        <QueueSidebar />
        <TicketCenter />
        <TelemetrySidebar />
      </div>
      <EscalationModal />
      <ToastProvider />
      <KeyboardShortcutsModal />
      <AnalyticsModal />
    </div>
  );
}
