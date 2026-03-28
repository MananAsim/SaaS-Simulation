'use client';

import { useTicketStore } from '@/store/useTicketStore';
import { useToastStore } from '@/components/ToastProvider';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit, Send, AlertTriangle, User, Bot, ShieldAlert, Lock, Zap, Sparkles, RefreshCw, X,
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useCollisionDetection } from '@/hooks/useCollisionDetection';
import { useSession } from 'next-auth/react';

const MACROS = [
  {
    id: 'har',
    label: 'Request HAR File',
    icon: '🔍',
    text: 'To help our engineers investigate this network error, could you please generate and attach a HAR file from your browser network tab?',
  },
  {
    id: 'bug-escalated',
    label: 'Bug Escalated',
    icon: '🐛',
    text: 'I have successfully reproduced this issue and escalated it to our engineering team under ticket ENG-402. I will keep this ticket on hold and update you as soon as a fix is deployed.',
  },
];

export function TicketCenter() {
  const { tickets, activeTicketId, addReply, collisionViewers } = useTicketStore();
  const { addToast } = useToastStore();
  const { data: session } = useSession();
  const ticket = tickets.find((t) => t.id === activeTicketId);

  // Collision detection: report who is viewing this ticket
  useCollisionDetection(activeTicketId);

  const [replyText, setReplyText] = useState('');
  const [replyMode, setReplyMode] = useState<'Open' | 'Pending Customer' | 'Resolved'>('Open');
  const [noteType, setNoteType] = useState<'public' | 'internal'>('public');
  const [showMacros, setShowMacros] = useState(false);
  const [copilotDraft, setCopilotDraft] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setReplyText(val);
    if (val.endsWith('/')) {
      setShowMacros(true);
    } else {
      setShowMacros(false);
    }
  }, []);

  const insertMacro = (text: string) => {
    setReplyText((prev) => prev.slice(0, prev.lastIndexOf('/')) + text);
    setShowMacros(false);
    textareaRef.current?.focus();
  };

  const handleReply = () => {
    if (!replyText.trim()) return;
    const isNote = noteType === 'internal';
    addReply(
      ticket!.id,
      replyText,
      isNote ? undefined : (replyMode !== 'Open' ? replyMode : undefined),
      isNote
    );
    setReplyText('');
    setReplyMode('Open');
    setCopilotDraft(null);
    if (isNote) {
      addToast('Internal note added — hidden from customer.', 'info');
    } else if (replyMode === 'Resolved') {
      addToast('Ticket marked as Solved ✓', 'success');
    } else if (replyMode === 'Pending Customer') {
      addToast('Ticket set to Pending Customer. SLA timer paused.', 'info');
    } else {
      addToast('Reply sent to customer.', 'success');
    }
  };

  const handleGenerateDraft = async () => {
    if (!ticket) return;
    setIsGenerating(true);
    setCopilotDraft(null);
    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketPayload: ticket.payload,
          customerName: ticket.customerName,
          companyName: ticket.companyName,
          priority: ticket.priority,
          sentiment: ticket.aiContext?.sentiment,
          intent: ticket.aiContext?.intent,
          messageHistory: ticket.replies.filter(r => !r.isInternal).map(r => ({
            sender: r.sender,
            message: r.message,
          })),
        }),
      });
      const data = await res.json();
      if (data.draft) {
        setCopilotDraft(data.draft);
      } else {
        addToast('Copilot could not generate a draft. Check OpenAI config.', 'error');
      }
    } catch {
      addToast('Failed to reach AI service.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const acceptDraft = () => {
    if (copilotDraft) {
      setReplyText(copilotDraft);
      setCopilotDraft(null);
      textareaRef.current?.focus();
    }
  };

  useEffect(() => {
    setReplyText('');
    setReplyMode('Open');
    setNoteType('public');
    setShowMacros(false);
    setCopilotDraft(null);
  }, [activeTicketId]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Angry': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'Frustrated': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'Neutral': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    }
  };

  // Collision: other agents viewing this ticket (exclude self)
  const otherViewers = activeTicketId
    ? (collisionViewers[activeTicketId] ?? []).filter(v => v.id !== session?.user?.id)
    : [];

  if (!ticket) {
    return (
      <div className="flex-1 border-r border-border bg-background flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm">No ticket selected</p>
        </div>
      </div>
    );
  }

  const isInternal = noteType === 'internal';

  return (
    <div className="flex-1 border-r border-border bg-background flex flex-col h-full overflow-hidden relative">

      {/* Header */}
      <div className="border-b border-border p-5 flex-shrink-0 bg-background/95 backdrop-blur z-10 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold text-foreground">{ticket.id}</h1>
            <span className={cn(
              'px-2 py-0.5 text-xs font-semibold rounded-md border',
              ticket.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
              ticket.status === 'Pending Customer' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
              ticket.status === 'Escalated' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
              'bg-blue-500/10 text-blue-400 border-blue-500/20'
            )}>
              {ticket.status}
            </span>
            {/* Collision: co-agents viewing */}
            {otherViewers.length > 0 && (
              <div className="flex items-center gap-1.5">
                {otherViewers.map(v => (
                  <span key={v.id} className="flex items-center gap-1 text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    {v.name} viewing
                  </span>
                ))}
              </div>
            )}
          </div>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <User className="w-3.5 h-3.5" />
            {ticket.customerName} <span className="text-zinc-600">•</span> {ticket.companyName}
          </p>
        </div>

        {/* AI Context Badge */}
        <motion.div
          key={ticket.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-end gap-2"
        >
          <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium', getSentimentColor(ticket.aiContext?.sentiment ?? 'Neutral'))}>
            <BrainCircuit className="w-3.5 h-3.5" />
            Sentiment: {ticket.aiContext?.sentiment ?? 'Neutral'}
          </div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 bg-sidebar px-2 py-1 rounded-md border border-border">
            <Bot className="w-3 h-3" />
            Intent: {ticket.aiContext?.intent ?? 'General'}
          </div>
        </motion.div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Initial Payload */}
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20 text-sm font-medium">
            {ticket.customerName.charAt(0)}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="font-medium text-sm text-foreground">{ticket.customerName}</span>
              <span className="text-xs text-muted-foreground">{format(new Date(ticket.createdAt), 'h:mm a')}</span>
            </div>
            <div className="bg-sidebar border border-border rounded-2xl rounded-tl-sm p-4 text-sm text-foreground/90 leading-relaxed">
              {ticket.payload}
            </div>
          </div>
        </div>

        {/* Replies */}
        <AnimatePresence initial={false}>
          {ticket.replies.map((reply) => (
            <motion.div
              key={reply.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('flex gap-4', reply.sender === 'Agent' || reply.isInternal ? 'flex-row-reverse' : '')}
            >
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center shrink-0 border text-xs font-medium',
                reply.isInternal ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                reply.sender === 'Agent' ? 'bg-blue-500/20 text-blue-400 border-blue-500/20' :
                reply.sender === 'System' ? 'bg-purple-500/20 text-purple-400 border-purple-500/20' :
                'bg-indigo-500/20 text-indigo-400 border-indigo-500/20'
              )}>
                {reply.isInternal ? <Lock className="w-3.5 h-3.5" /> :
                 reply.sender === 'Agent' ? <User className="w-4 h-4" /> :
                 reply.sender === 'System' ? <Bot className="w-4 h-4" /> :
                 ticket.customerName.charAt(0)}
              </div>
              <div className={cn('flex-1 space-y-1', reply.sender === 'Agent' || reply.isInternal ? 'flex flex-col items-end' : '')}>
                <div className={cn('flex items-center gap-2', reply.sender === 'Agent' || reply.isInternal ? 'flex-row-reverse' : '')}>
                  <span className="font-medium text-sm text-foreground">{reply.isInternal ? 'Internal Note' : reply.sender}</span>
                  {reply.isInternal && (
                    <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                      <Lock className="w-2.5 h-2.5" /> Hidden from customer
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{format(new Date(reply.timestamp), 'h:mm a')}</span>
                </div>
                <div className={cn(
                  'p-4 text-sm leading-relaxed whitespace-pre-wrap max-w-[85%]',
                  reply.isInternal
                    ? 'bg-amber-500/8 text-amber-100/90 border border-amber-500/25 rounded-2xl rounded-tr-sm border-dashed'
                    : reply.sender === 'Agent'
                    ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
                    : reply.sender === 'System'
                    ? 'bg-purple-500/10 text-purple-200 border border-purple-500/20 rounded-2xl rounded-tl-sm font-mono text-xs'
                    : 'bg-sidebar border border-border rounded-2xl rounded-tl-sm text-foreground/90'
                )}>
                  {reply.message}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Reply Box */}
      {ticket.status !== 'Resolved' && (
        <div className="p-4 bg-background border-t border-border mt-auto">

          {/* Internal / Public Toggle */}
          <div className="flex items-center gap-0.5 mb-3 bg-muted rounded-lg p-1 w-fit">
            <button
              onClick={() => setNoteType('public')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                noteType === 'public'
                  ? 'bg-background text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Public Reply
            </button>
            <button
              onClick={() => setNoteType('internal')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all',
                noteType === 'internal'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Lock className="w-3 h-3" /> Internal Note
            </button>
          </div>

          {/* AI Copilot Draft Panel */}
          <AnimatePresence>
            {copilotDraft && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                className="mb-3 p-3 rounded-xl bg-indigo-950/50 border border-indigo-500/30 text-sm text-indigo-100/90 leading-relaxed relative"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Copilot Draft
                  </div>
                  <button onClick={() => setCopilotDraft(null)} className="text-indigo-400/50 hover:text-indigo-300">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="whitespace-pre-wrap text-sm">{copilotDraft}</p>
                <button
                  onClick={acceptDraft}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
                >
                  <Zap className="w-3 h-3" /> Accept Draft
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Textarea wrapper with macro popover */}
          <div className="relative">
            {/* Macro Popover */}
            <AnimatePresence>
              {showMacros && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  className="absolute bottom-full left-0 mb-2 w-80 bg-sidebar border border-border rounded-xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-background/50">
                    <Zap className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Slash Macros</span>
                  </div>
                  {MACROS.map((macro) => (
                    <button
                      key={macro.id}
                      onMouseDown={(e) => { e.preventDefault(); insertMacro(macro.text); }}
                      className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left group"
                    >
                      <span className="text-sm mt-0.5">{macro.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground group-hover:text-indigo-300 transition-colors">{macro.label}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{macro.text}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className={cn(
              'relative rounded-xl border overflow-hidden transition-all',
              isInternal
                ? 'border-amber-500/40 bg-amber-950/20 focus-within:ring-1 focus-within:ring-amber-500/40'
                : 'border-border bg-sidebar focus-within:ring-1 focus-within:ring-indigo-500/50'
            )}>
              <textarea
                ref={textareaRef}
                className={cn(
                  'w-full bg-transparent text-sm p-4 outline-none resize-none min-h-[100px] placeholder-muted-foreground',
                  isInternal ? 'text-amber-100/90' : 'text-foreground'
                )}
                placeholder={isInternal ? 'Add an internal note (hidden from customer). Type / for macros…' : 'Draft your reply to the customer… Type / for macros.'}
                value={replyText}
                onChange={handleTextChange}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setShowMacros(false);
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleReply();
                }}
              />

              <div className={cn(
                'flex items-center justify-between p-2 pt-0 border-t',
                isInternal ? 'border-amber-500/20 bg-amber-950/30' : 'border-border/50 bg-background/50'
              )}>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => document.dispatchEvent(new CustomEvent('open-escalation-modal'))}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Escalate to Tier 3 / Jira
                  </button>
                  {!isInternal && (
                    <button
                      onClick={handleGenerateDraft}
                      disabled={isGenerating}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-md transition-colors disabled:opacity-50"
                    >
                      {isGenerating
                        ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                        : <><Sparkles className="w-3.5 h-3.5" /> AI Draft</>}
                    </button>
                  )}
                </div>

                <div className="flex items-center">
                  {!isInternal && (
                    <select
                      className="bg-zinc-800 text-xs text-foreground outline-none px-3 py-2 rounded-l-md border-r border-border hover:bg-zinc-700 transition-colors cursor-pointer appearance-none"
                      value={replyMode}
                      onChange={(e) => setReplyMode(e.target.value as any)}
                    >
                      <option value="Open">Reply as Open</option>
                      <option value="Pending Customer">Reply as Pending</option>
                      <option value="Resolved">Reply as Solved</option>
                    </select>
                  )}
                  <button
                    onClick={handleReply}
                    disabled={!replyText.trim()}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                      isInternal
                        ? 'bg-amber-600 hover:bg-amber-500 rounded-md'
                        : 'bg-indigo-600 hover:bg-indigo-500 rounded-r-md'
                    )}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isInternal ? 'Add Note' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-right px-1">
            Type <kbd className="px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700">/</kbd> for macros &nbsp;·&nbsp;
            <kbd className="px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700">⌘</kbd>+<kbd className="px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700">Enter</kbd> to send
          </p>
        </div>
      )}
    </div>
  );
}
