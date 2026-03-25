'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['?'], label: 'Open keyboard shortcuts' },
  { keys: ['/'], label: 'Trigger slash macros in reply box' },
  { keys: ['⌘', 'Enter'], label: 'Send reply / Add note' },
  { keys: ['Esc'], label: 'Close modal / dismiss popover' },
  { keys: ['N'], label: 'Switch to Internal Note mode' },
  { keys: ['P'], label: 'Switch to Public Reply mode' },
  { keys: ['E'], label: 'Open Escalation modal' },
  { keys: ['1', '2', '3'], label: 'Jump to ticket 1 / 2 / 3 in queue' },
];

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return;
      if (e.key === '?') setOpen((v) => !v);
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <>
      {/* Trigger button (top-right of KPI bar) */}
      <button
        onClick={() => setOpen(true)}
        title="Keyboard shortcuts (?)"
        className="flex items-center gap-1.5 ml-auto px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors border border-transparent hover:border-border"
      >
        <Keyboard className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">Shortcuts</span>
        <kbd className="hidden lg:inline px-1 py-0.5 rounded bg-muted border border-border text-[10px]">?</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-sidebar border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-indigo-400" />
                  Keyboard Shortcuts
                </h3>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-1">
                {SHORTCUTS.map((s) => (
                  <div key={s.label} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted transition-colors">
                    <span className="text-sm text-foreground/80">{s.label}</span>
                    <div className="flex items-center gap-1">
                      {s.keys.map((k) => (
                        <kbd key={k} className="px-2 py-0.5 rounded bg-background border border-border text-xs font-mono text-muted-foreground">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4 text-[11px] text-muted-foreground text-center">
                Shortcuts are disabled when focus is inside a text field.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
