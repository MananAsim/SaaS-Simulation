'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BarChart3, TrendingUp, Clock, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getAnalyticsAction } from '@/app/analytics.actions';

export function AnalyticsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      loadAnalytics();
    };
    document.addEventListener('open-analytics-modal', handleOpen);
    return () => document.removeEventListener('open-analytics-modal', handleOpen);
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await getAnalyticsAction();
      setData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-sidebar border border-border rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between p-5 border-b border-border bg-background/50">
            <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              SupportOS Analytics
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-background">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 gap-4">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                <p className="text-muted-foreground text-sm">Aggregating 30-day telemetry...</p>
              </div>
            ) : data ? (
              <div className="space-y-6">
                
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-sidebar border border-border rounded-xl p-4 flex flex-col gap-2">
                    <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> CSAT Score</div>
                    <div className="text-3xl font-bold">{data.summary.csat}%</div>
                  </div>
                  <div className="bg-sidebar border border-border rounded-xl p-4 flex flex-col gap-2">
                    <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-blue-500" /> Avg TTR</div>
                    <div className="text-3xl font-bold">{data.summary.avgTtrMins}m</div>
                  </div>
                  <div className="bg-sidebar border border-border rounded-xl p-4 flex flex-col gap-2">
                    <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-purple-500" /> Total Tickets</div>
                    <div className="text-3xl font-bold">{data.summary.totalTickets}</div>
                  </div>
                </div>

                {/* CSAT Chart */}
                <div className="bg-sidebar border border-border rounded-xl p-5">
                  <h4 className="text-sm font-semibold mb-4 text-foreground">Customer Satisfaction (CSAT) Trend</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.csatChartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCsat" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                          itemStyle={{ color: '#10b981' }}
                        />
                        <Area type="monotone" dataKey="csat" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCsat)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* TTR Chart */}
                <div className="bg-sidebar border border-border rounded-xl p-5">
                  <h4 className="text-sm font-semibold mb-4 text-foreground">Time to Resolution (Minutes)</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.ttrChartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorTtr" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                          itemStyle={{ color: '#6366f1' }}
                        />
                        <Area type="monotone" dataKey="ttr" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorTtr)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
