'use client';

import { KpiHeader } from '@/components/KpiHeader';
import { QueueSidebar } from '@/components/QueueSidebar';
import { TicketCenter } from '@/components/TicketCenter';
import { TelemetrySidebar } from '@/components/TelemetrySidebar';
import { EscalationModal } from '@/components/EscalationModal';
import { ToastProvider } from '@/components/ToastProvider';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';

export default function Dashboard() {
  return (
    <div className="flex flex-col bg-background text-foreground h-screen overflow-hidden selection:bg-indigo-500/30">
      {/* Global KPI Header with keyboard shortcuts button embedded */}
      <KpiHeader />

      {/* Three-pane workspace — responsive */}
      <div className="flex flex-1 overflow-hidden relative">
        <QueueSidebar />
        <TicketCenter />
        <TelemetrySidebar />
      </div>

      {/* Global overlays */}
      <EscalationModal />
      <ToastProvider />
      <KeyboardShortcutsModal />
    </div>
  );
}
