'use client';

import { useTicketStore, Ticket } from '@/store/useTicketStore';
import { useToastStore } from '@/components/ToastProvider';
import { useLiveCountdown } from '@/hooks/useLiveCountdown';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  CircleAlert, Clock, CheckCircle2, PauseCircle, Search, X,
  Plus, SlidersHorizontal, Zap
} from 'lucide-react';

type PriorityFilter = 'All' | 'P1' | 'P2' | 'P3' | 'P4';

export function QueueSidebar() {
  const { tickets, activeTicketId, setActiveTicket, addSimulatedTicket } = useTicketStore();
  const { addToast } = useToastStore();
  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId ?? undefined;
  const [tab, setTab] = useState<'Open' | 'Closed'>('Open');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const filteredTickets = tickets
    .filter((t) => (tab === 'Open' ? t.status !== 'Resolved' : t.status === 'Resolved'))
    .filter((t) => priorityFilter === 'All' || t.priority === priorityFilter)
    .filter((t) =>
      search === '' ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.customerName.toLowerCase().includes(search.toLowerCase()) ||
      t.companyName.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(a.slaDeadline).getTime() - new Date(b.slaDeadline).getTime());

  const handleSimulate = () => {
    addSimulatedTicket(tenantId);
    addToast('🚨 New P1 ticket arrived — NovaTech SaaS SSO failure', 'error');
  };

  const PRIORITY_COLORS: Record<string, string> = {
    P1: 'bg-red-500/10 text-red-500 border-red-500/30',
    P2: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
    P3: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
    P4: 'bg-zinc-700/50 text-zinc-400 border-zinc-600',
  };

  return (
    <>
      {/* Mobile overlay toggle */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-sidebar border border-border rounded-r-xl p-2 text-muted-foreground shadow-lg"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      )}

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-80 shrink-0 border-r border-border bg-sidebar h-full flex flex-col md:relative fixed inset-y-0 left-0 z-30"
          >
            {/* Header */}
            <div className="p-4 border-b border-border space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  Active Queue
                </h2>
                <div className="flex items-center gap-1.5">
                  <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-0.5 rounded-full font-medium">
                    {tickets.filter((t) => t.status !== 'Resolved').length} Open
                  </span>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="md:hidden text-muted-foreground hover:text-foreground p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tab toggle */}
              <div className="flex bg-background rounded-lg p-1 border border-border">
                {(['Open', 'Closed'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      'flex-1 text-xs font-medium py-1.5 rounded-md transition-colors',
                      tab === t
                        ? 'bg-sidebar text-foreground shadow-sm border border-border/50'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t} Tickets
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search tickets, customers…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-xs text-foreground placeholder-muted-foreground outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Priority filters */}
              <div className="flex items-center gap-1 flex-wrap">
                {(['All', 'P1', 'P2', 'P3', 'P4'] as PriorityFilter[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className={cn(
                      'text-[10px] font-semibold px-2 py-1 rounded-md border transition-all',
                      priorityFilter === p
                        ? p === 'All'
                          ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                          : PRIORITY_COLORS[p]
                        : 'bg-transparent text-muted-foreground border-border hover:border-zinc-600'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Ticket list */}
            <div className="overflow-y-auto flex-1 p-3 space-y-2">
              {filteredTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  isActive={ticket.id === activeTicketId}
                  onClick={() => { setActiveTicket(ticket.id); setSidebarOpen(window.innerWidth >= 768); }}
                />
              ))}
              {filteredTickets.length === 0 && (
                <div className="text-center p-6 text-xs text-muted-foreground space-y-2">
                  <Search className="w-6 h-6 mx-auto opacity-20" />
                  <p>No tickets match your filters.</p>
                </div>
              )}
            </div>

            {/* Simulate ticket button */}
            <div className="p-3 border-t border-border">
              <button
                onClick={handleSimulate}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 rounded-xl text-xs font-medium transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                Simulate Incoming P1 Ticket
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function TicketCard({ ticket, isActive, onClick }: { ticket: Ticket; isActive: boolean; onClick: () => void }) {
  const isPending = ticket.status === 'Pending Customer';
  const isResolved = ticket.status === 'Resolved';

  const { display, breached, urgent } = useLiveCountdown(
    isResolved || isPending ? null : new Date(ticket.slaDeadline),
    isPending
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'P2': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'P3': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  let timeText = '';
  if (isResolved) {
    const lastReply = (ticket.replies?.length ?? 0) > 0
      ? ticket.replies[ticket.replies.length - 1].timestamp
      : new Date();
    const diffMs = new Date(lastReply).getTime() - new Date(ticket.createdAt).getTime();
    const mins = Math.floor(diffMs / 60000);
    timeText = `TTR: ${mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`}`;
  } else if (isPending) {
    timeText = 'Paused';
  } else {
    timeText = breached ? display : display;
  }

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-xl border transition-all relative overflow-hidden',
        isActive
          ? 'bg-zinc-800/50 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
          : 'bg-background border-border hover:border-zinc-700'
      )}
    >
      {isActive && (
        <motion.div layoutId="active-indicator" className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
      )}

      <div className="flex justify-between items-start mb-1.5">
        <div>
          <span className="text-sm font-medium text-foreground">{ticket.id}</span>
          <p className="text-[10px] text-muted-foreground mt-0.5">{ticket.customerRole} · {ticket.companyName}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {ticket.status === 'Resolved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
          {ticket.status === 'Pending Customer' && <PauseCircle className="w-3.5 h-3.5 text-yellow-500" />}
          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border', getPriorityColor(ticket.priority))}>
            {ticket.priority}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2 mb-2.5 leading-relaxed">{ticket.payload}</p>

      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <span className="text-xs text-zinc-400 font-medium truncate pr-2">{ticket.customerName}</span>
        <div className={cn(
          'flex items-center gap-1 text-[10px] whitespace-nowrap font-medium px-1.5 py-0.5 rounded border',
          isResolved ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' :
          isPending ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' :
          breached ? 'text-red-500 bg-red-500/10 border-red-500/20 animate-pulse' :
          urgent ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' :
          'text-zinc-400 bg-zinc-800 border-zinc-700'
        )}>
          {breached && !isResolved && !isPending
            ? <CircleAlert className="w-3 h-3" />
            : isResolved
            ? <CheckCircle2 className="w-3 h-3" />
            : <Clock className="w-3 h-3" />}
          {timeText}
        </div>
      </div>
    </motion.button>
  );
}
