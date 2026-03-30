import { create } from 'zustand';
import { addMinutes, addHours } from 'date-fns';
import { updateTicketStatusAction, addReplyAction, escalateTicketAction } from '@/app/actions';

export type Priority = 'P1' | 'P2' | 'P3' | 'P4';
export type TicketStatus = 'Open' | 'Pending Customer' | 'Resolved' | 'Escalated';

export interface TelemetryData {
  os: string;
  browser: string;
  errorCode: string;
  featureFlags: string[];
  customerTier: string;
}

export interface AIContext {
  sentiment: 'Angry' | 'Frustrated' | 'Neutral' | 'Happy';
  intent: string;
}

export interface Reply {
  id: string;
  sender: 'Agent' | 'Customer' | 'System';
  message: string;
  timestamp: Date;
  isInternal?: boolean;
}

export interface Ticket {
  id: string;
  customerName: string;
  customerRole: string;
  companyName: string;
  priority: Priority;
  status: TicketStatus;
  createdAt: Date;
  slaDeadline: Date;
  payload: string;
  telemetry: TelemetryData;
  aiContext: AIContext;
  replies: Reply[];
}

interface TicketStore {
  tickets: Ticket[];
  activeTicketId: string | null;
  // collisionViewers: { [ticketId]: list of agents currently viewing }
  collisionViewers: Record<string, Array<{ id: string; name: string }>>;
  setActiveTicket: (id: string) => void;
  updateTicketStatus: (id: string, status: TicketStatus) => void;
  addReply: (id: string, message: string, newStatus?: TicketStatus, isInternal?: boolean) => void;
  escalateTicket: (id: string, data: { technicalDescription: string; stepsToReproduce: string; businessImpact: string }) => void;
  addSimulatedTicket: (tenantId?: string) => void;
  setTickets: (tickets: Ticket[]) => void;
  // Realtime handlers — called by useRealtime hook
  addIncomingTicket: (rawTicket: any) => void;
  handleRealtimeUpdate: (rawTicket: any) => void;
  setCollisionViewers: (ticketId: string, viewers: Array<{ id: string; name: string }>) => void;
}

const initialTickets: Ticket[] = [];


export const useTicketStore = create<TicketStore>((set) => ({
  tickets: initialTickets,
  activeTicketId: null,
  collisionViewers: {},
  setCollisionViewers: (ticketId, viewers) =>
    set((state) => ({ collisionViewers: { ...state.collisionViewers, [ticketId]: viewers } })),
  setTickets: (newTickets) => set({ tickets: newTickets, activeTicketId: newTickets.length > 0 ? newTickets[0].id : null }),
  setActiveTicket: (id) => set({ activeTicketId: id }),
  updateTicketStatus: async (id, status) => {
    // Optimistic UI updates
    set((state) => ({
      tickets: state.tickets.map((t) => (t.id === id ? { ...t, status } : t)),
    }));
    await updateTicketStatusAction(id, status);
  },
  addReply: async (id, message, newStatus, isInternal = false) => {
    // Optimistic Update
    const optimisticReply: Reply = {
      id: "temp-" + Math.random().toString(36).substr(2, 9),
      sender: 'Agent',
      message,
      timestamp: new Date(),
      isInternal,
    };
    set((state) => ({
      tickets: state.tickets.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            replies: [...t.replies, optimisticReply],
            ...(newStatus ? { status: newStatus } : {}),
          };
        }
        return t;
      }),
    }));
    // Sync to DB
    await addReplyAction(id, message, newStatus, isInternal);
  },
  escalateTicket: async (id, data) => {
    const sysReply: Reply = {
      id: "temp-" + Math.random().toString(36).substr(2, 9),
      sender: 'System',
      message: `Escalated to Tier 3.\n\n**Technical Description:**\n${data.technicalDescription}\n\n**Steps to Reproduce:**\n${data.stepsToReproduce}\n\n**Business Impact:**\n${data.businessImpact}`,
      timestamp: new Date(),
    };
    set((state) => ({
      tickets: state.tickets.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            status: 'Escalated',
            replies: [...t.replies, sysReply],
          };
        }
        return t;
      }),
    }));
    await escalateTicketAction(id, data);
  },
  addIncomingTicket: (rawTicket: any) => {
    const ticket = mapRawTicket(rawTicket);
    set((state) => {
      // Avoid duplicates
      const exists = state.tickets.some((t) => t.id === ticket.id);
      if (exists) return state;
      return { tickets: [ticket, ...state.tickets] };
    });
  },
  handleRealtimeUpdate: (rawTicket: any) => {
    const ticket = mapRawTicket(rawTicket);
    set((state) => ({
      tickets: state.tickets.map((t) => (t.id === ticket.id ? ticket : t)),
    }));
  },
  addSimulatedTicket: (tenantId?: string) => {
    // Post to the ingestion API so it persists and broadcasts to all connected agents
    if (tenantId) {
      fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          customerName: 'James Whitfield',
          customerRole: 'CTO',
          companyName: 'NovaTech SaaS',
          priority: 'P1',
          payload: 'We are experiencing a complete SSO login failure affecting all users in our EU region. No one can access the platform since the last deployment. This is blocking our entire team right now.',
          telemetry: { os: 'Ubuntu 22.04', browser: 'Chrome 123', errorCode: 'SSO_AUTH_FAILURE', featureFlags: 'okta_sso_v2', customerTier: 'Enterprise' },
          aiContext: { sentiment: 'Angry', intent: 'SSO / Auth Failure' },
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.ticket) {
            useTicketStore.getState().addIncomingTicket(data.ticket);
          }
        })
        .catch(console.error);
      // The SSE will dispatch addIncomingTicket, but on Vercel Edge/Serverless, SSE may not broadcast properly
      // to the same client instance. Manually triggering the state update ensures the UI updates instantly.
      return;
    }
    // Fallback (no session available): local-only optimistic insert
    set((state) => {
      const count = state.tickets.length + 1;
      const newTicket: Ticket = {
        id: `TKT-${1000 + count}`,
        customerName: 'James Whitfield',
        customerRole: 'CTO',
        companyName: 'NovaTech SaaS',
        priority: 'P1',
        status: 'Open',
        createdAt: new Date(),
        slaDeadline: addMinutes(new Date(), 8),
        payload: 'We are experiencing a complete SSO login failure affecting all users in our EU region.',
        telemetry: { os: 'Ubuntu 22.04', browser: 'Chrome 123', errorCode: 'SSO_AUTH_FAILURE', featureFlags: ['okta_sso_v2'], customerTier: 'Enterprise' },
        aiContext: { sentiment: 'Angry', intent: 'SSO / Auth Failure' },
        replies: [],
      };
      return { tickets: [newTicket, ...state.tickets], activeTicketId: newTicket.id };
    });
  },
}));

// Helper to normalise raw Prisma DB shape → Ticket interface
export function mapRawTicket(raw: any): Ticket {
  return {
    id: raw.id,
    customerName: raw.customerName,
    customerRole: raw.customerRole ?? '',
    companyName: raw.companyName,
    priority: raw.priority as Priority,
    status: raw.status as TicketStatus,
    createdAt: new Date(raw.createdAt),
    slaDeadline: new Date(raw.slaDeadline),
    payload: raw.payload,
    telemetry: raw.telemetry
      ? {
          os: raw.telemetry.os ?? '',
          browser: raw.telemetry.browser ?? '',
          errorCode: raw.telemetry.errorCode ?? '',
          featureFlags: raw.telemetry.featureFlags ? raw.telemetry.featureFlags.split(',') : [],
          customerTier: raw.telemetry.customerTier ?? '',
        }
      : { os: '', browser: '', errorCode: '', featureFlags: [], customerTier: '' },
    aiContext: raw.aiContext
      ? { sentiment: raw.aiContext.sentiment as any, intent: raw.aiContext.intent ?? '' }
      : { sentiment: 'Neutral', intent: '' },
    replies: (raw.messages ?? []).map((m: any) => ({
      id: m.id,
      sender: m.sender as 'Agent' | 'Customer' | 'System',
      message: m.message,
      timestamp: new Date(m.timestamp),
      isInternal: m.isInternal,
    })),
  };
}

