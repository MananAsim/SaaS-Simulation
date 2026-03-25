'use client';

import { useTicketStore } from '@/store/useTicketStore';
import { useToastStore } from '@/components/ToastProvider';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

export function EscalationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { activeTicketId, escalateTicket } = useTicketStore();
  const { addToast } = useToastStore();

  const [form, setForm] = useState({
    technicalDescription: '',
    stepsToReproduce: '',
    businessImpact: ''
  });

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    document.addEventListener('open-escalation-modal', handleOpen);
    return () => document.removeEventListener('open-escalation-modal', handleOpen);
  }, []);

  if (!isOpen || !activeTicketId) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    escalateTicket(activeTicketId, form);
    setIsOpen(false);
    setForm({ technicalDescription: '', stepsToReproduce: '', businessImpact: '' });
    addToast('🚨 Escalated to Tier 3 Engineering. Jira ticket queued.', 'error');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-sidebar border border-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Escalate to Tier 3 / Jira
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-4">
              <strong>Warning:</strong> Tier 3 escalations bypass standard SLAs. Ensure all required engineering context is provided below.
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Technical Description</label>
              <textarea 
                required
                className="w-full bg-background border border-border rounded-lg p-3 text-sm text-foreground focus:ring-1 focus:ring-indigo-500 outline-none resize-none h-24"
                placeholder="Observed behavior, error traces, or component failures..."
                value={form.technicalDescription}
                onChange={e => setForm({...form, technicalDescription: e.target.value})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Steps to Reproduce</label>
              <textarea 
                required
                className="w-full bg-background border border-border rounded-lg p-3 text-sm text-foreground focus:ring-1 focus:ring-indigo-500 outline-none resize-none h-20"
                placeholder="1. Navigate to... 2. Click... 3. See error..."
                value={form.stepsToReproduce}
                onChange={e => setForm({...form, stepsToReproduce: e.target.value})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Business Impact</label>
              <textarea 
                required
                className="w-full bg-background border border-border rounded-lg p-3 text-sm text-foreground focus:ring-1 focus:ring-indigo-500 outline-none resize-none h-20"
                placeholder="How is this affecting the customer's operations?"
                value={form.businessImpact}
                onChange={e => setForm({...form, businessImpact: e.target.value})}
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
              <button 
                type="button" 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-red-600/20"
              >
                Submit Escalation
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
