'use client';

import { useTicketStore } from '@/store/useTicketStore';
import { TrendingUp, AlertOctagon } from 'lucide-react';
import { motion } from 'framer-motion';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';

const KPI_DATA = [
  {
    id: 'csat',
    label: 'CSAT',
    value: '96%',
    trend: 'up',
    trendLabel: '+2% vs. last 30d',
  },
  {
    id: 'fcr',
    label: 'FCR',
    value: '71%',
    trend: 'neutral',
    trendLabel: 'First Contact Resolution',
  },
  {
    id: 'sla-risk',
    label: 'Open SLA Risks',
    value: '', // computed
    trend: 'risk',
    trendLabel: 'Tickets near SLA breach',
  },
];

export function KpiHeader() {
  const { tickets } = useTicketStore();

  const slaRisks = tickets.filter(
    (t) =>
      t.status !== 'Resolved' &&
      t.status !== 'Pending Customer' &&
      new Date(t.slaDeadline).getTime() - Date.now() < 30 * 60 * 1000 // within 30 min
  ).length;

  const kpis = KPI_DATA.map((k) =>
    k.id === 'sla-risk' ? { ...k, value: String(slaRisks) } : k
  );

  return (
    <div className="w-full border-b border-border bg-sidebar/60 backdrop-blur-sm flex items-center px-5 py-2.5 gap-8 flex-shrink-0">
      {/* Logo / App Identity */}
      <div className="flex items-center gap-2.5 mr-4 shrink-0">
        <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-indigo-600/30">
          S
        </div>
        <span className="font-semibold text-sm text-foreground tracking-tight">SupportOS</span>
        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-medium">Agent View</span>
      </div>

      <div className="h-5 w-px bg-border" />

      {/* KPIs */}
      <div className="flex items-center gap-8">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3"
          >
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium leading-none mb-1">
                {kpi.label}
              </p>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-lg font-bold leading-none tabular-nums ${
                    kpi.id === 'sla-risk'
                      ? slaRisks > 0
                        ? 'text-red-400'
                        : 'text-emerald-400'
                      : 'text-foreground'
                  }`}
                >
                  {kpi.value}
                </span>
                {kpi.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
                {kpi.trend === 'risk' && slaRisks > 0 && (
                  <AlertOctagon className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                )}
                {kpi.trend === 'risk' && slaRisks === 0 && (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                )}
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground hidden xl:block max-w-[80px] leading-tight">
              {kpi.id === 'sla-risk'
                ? slaRisks > 0
                  ? kpi.trendLabel
                  : 'All clear'
                : kpi.trendLabel}
            </span>
            {i < kpis.length - 1 && <div className="h-5 w-px bg-border ml-4" />}
          </motion.div>
        ))}
      </div>

      {/* Keyboard shortcuts button — right-aligned */}
      <KeyboardShortcutsModal />
    </div>
  );
}
