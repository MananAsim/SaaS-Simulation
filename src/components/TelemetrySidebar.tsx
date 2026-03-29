'use client';

import { useTicketStore } from '@/store/useTicketStore';
import { Terminal, Monitor, MonitorSmartphone, Code2, Tags, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

export function TelemetrySidebar() {
  const { tickets, activeTicketId } = useTicketStore();
  const ticket = tickets.find((t) => t.id === activeTicketId);

  if (!ticket) return <div className="w-80 border-l border-border bg-sidebar h-full shrink-0" />;

  const { telemetry } = ticket;

  return (
    <div className="w-80 border-l border-border bg-sidebar h-full shrink-0 flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          System Telemetry
        </h2>
      </div>

      <div className="p-5 space-y-6 overflow-y-auto">
        <TelemetryItem icon={<MonitorSmartphone />} label="OS & Browser" value={`${telemetry.os} • ${telemetry.browser}`} />
        <TelemetryItem 
          icon={<Code2 className={telemetry.errorCode !== 'None' ? 'text-red-400' : ''} />} 
          label="Error Code" 
          value={telemetry.errorCode} 
          highlight={telemetry.errorCode !== 'None'}
        />
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <Tags className="w-4 h-4" /> Feature Flags
          </div>
          {(telemetry.featureFlags ?? []).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(telemetry.featureFlags ?? []).map(flag => (
                <span key={flag} className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded-md text-xs font-mono text-zinc-300">
                  {flag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 italic">No active flags</p>
          )}
        </div>

        <TelemetryItem 
          icon={<Crown className="text-yellow-500" />} 
          label="Customer Tier" 
          value={telemetry.customerTier} 
        />
      </div>
    </div>
  );
}

function TelemetryItem({ icon, label, value, highlight = false }: { icon: React.ReactNode, label: string, value: string, highlight?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-1.5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
        {icon} {label}
      </div>
      <div className={`text-sm font-medium ${highlight ? 'text-red-400 bg-red-400/10 px-2 py-1 rounded inline-block border border-red-400/20' : 'text-foreground'}`}>
        {value}
      </div>
    </motion.div>
  );
}
