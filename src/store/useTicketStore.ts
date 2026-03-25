import { create } from 'zustand';
import { addMinutes, addHours } from 'date-fns';

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
  setActiveTicket: (id: string) => void;
  updateTicketStatus: (id: string, status: TicketStatus) => void;
  addReply: (id: string, message: string, newStatus?: TicketStatus, isInternal?: boolean) => void;
  escalateTicket: (id: string, data: { technicalDescription: string; stepsToReproduce: string; businessImpact: string }) => void;
  addSimulatedTicket: () => void;
}

const t0 = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

const initialTickets: Ticket[] = [
  {
    id: 'TKT-1001',
    customerName: 'Sarah Jenkins',
    customerRole: 'VP of Operations',
    companyName: 'Acme Corp',
    priority: 'P1',
    status: 'Open',
    createdAt: t0,
    slaDeadline: addMinutes(t0, 15),
    payload:
      'Our team has been trying to run the end-of-month data export for the last two hours and it keeps throwing a 500 error. We use this data for our payroll run which happens TOMORROW. This is completely blocking us. Is the system down?',
    telemetry: {
      os: 'macOS 14.2',
      browser: 'Chrome 122',
      errorCode: 'ERR_500 /api/v2/export',
      featureFlags: ['new_export_engine'],
      customerTier: 'Enterprise',
    },
    aiContext: {
      sentiment: 'Angry',
      intent: 'API Failure / Export',
    },
    replies: [
      {
        id: 'r1001-a',
        sender: 'Agent',
        message:
          'Reproduced the 500 error on my end using Acme\'s Org_ID. Checked status page; no widespread outage, seems isolated to the v2 export endpoint. Escalating immediately to Eng via Jira (ENG-8992) as this impacts payroll (High Business Impact).',
        timestamp: new Date(t0.getTime() + 5 * 60 * 1000),
        isInternal: true,
      },
      {
        id: 'r1001-b',
        sender: 'Agent',
        message:
          "Hi Sarah, I completely understand the urgency here, especially with payroll running tomorrow. You are not doing anything wrong—I have reproduced the 500 error on my end and can confirm the v2 export endpoint is currently failing for your tenant.\n\nI have immediately escalated this to our Tier 3 Engineering team as a Critical priority (Ticket ENG-8992) and they are investigating the server logs now.\n\nI will monitor their progress closely and provide you with an update within the next 30 minutes, or sooner if they deploy a fix. We are on this.",
        timestamp: new Date(t0.getTime() + 9 * 60 * 1000),
        isInternal: false,
      },
    ],
  },
  {
    id: 'TKT-1002',
    customerName: 'David Chen',
    customerRole: 'Marketing Manager',
    companyName: 'GrowthCo',
    priority: 'P2',
    status: 'Pending Customer',
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
    slaDeadline: addHours(new Date(Date.now() - 45 * 60 * 1000), 4),
    payload:
      "Every time I try to click the 'Save Draft' button on the new email campaign builder, the page just freezes. I've lost my work twice now. Please fix this.",
    telemetry: {
      os: 'macOS Sonoma',
      browser: 'Chrome 122',
      errorCode: 'CL_MEMORY_LEAK',
      featureFlags: ['beta_campaign_builder'],
      customerTier: 'Mid-Market',
    },
    aiContext: {
      sentiment: 'Frustrated',
      intent: 'UI Bug / Save Draft',
    },
    replies: [
      {
        id: 'r1002-a',
        sender: 'Agent',
        message:
          "Looks like a frontend memory leak on the new campaign builder UI. Logged bug ENG-8993. Need to provide the legacy builder as a workaround so he isn't blocked.",
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        isInternal: true,
      },
      {
        id: 'r1002-b',
        sender: 'Agent',
        message:
          "Hi David, I am so sorry you lost your work—I know exactly how frustrating it is to have to rebuild a campaign from scratch.\n\nI've tested this on Chrome and I'm seeing the same freezing behavior. I've documented the console errors and passed this directly to our UI development team to get the 'Save Draft' button patched.\n\nImmediate Workaround: So you aren't blocked from launching your campaign today, you can temporarily switch back to the classic builder. Just click your Profile Icon > Settings > and toggle off 'Use Beta Campaign Builder'.\n\nI'll keep this ticket on hold and personally email you the moment the engineering team pushes the fix for the new builder.",
        timestamp: new Date(Date.now() - 25 * 60 * 1000),
        isInternal: false,
      },
    ],
  },
  {
    id: 'TKT-1003',
    customerName: 'Emily Rostova',
    customerRole: 'Admin',
    companyName: 'SmallBiz LLC',
    priority: 'P4',
    status: 'Resolved',
    createdAt: new Date(Date.now() - 90 * 60 * 1000),
    slaDeadline: addHours(new Date(Date.now() - 90 * 60 * 1000), 24),
    payload:
      "Hi team, I'm trying to set up a report that shows me only the tickets from last week that took longer than 24 hours to resolve. I see the filters, but I can't figure out how to combine the date and the time condition. Help?",
    telemetry: {
      os: 'Windows 11',
      browser: 'Firefox 123',
      errorCode: 'None',
      featureFlags: ['beta_dashboard'],
      customerTier: 'SMB',
    },
    aiContext: {
      sentiment: 'Neutral',
      intent: 'How-to / Custom Reporting',
    },
    replies: [
      {
        id: 'r1003-a',
        sender: 'Agent',
        message:
          'Standard onboarding friction. The custom reporting logic uses "AND" operators which can be confusing for non-technical admins. Will give step-by-step and a best practice tip.',
        timestamp: new Date(Date.now() - 75 * 60 * 1000),
        isInternal: true,
      },
      {
        id: 'r1003-b',
        sender: 'Agent',
        message:
          "Hi Emily, Welcome to the platform! Custom reports can definitely look a bit overwhelming at first glance, but I can absolutely help you build this.\n\nTo get a report of last week's tickets that took over 24 hours, you'll want to stack your filters like this:\n\n1. Click 'Add Filter' and select 'Created Date' → 'Is Last Week'.\n2. Click 'Add Filter' again (this acts as an \"AND\" condition).\n3. Select 'Resolution Time' → 'Greater Than' → type '24' and select 'Hours'.\n\nPro Tip: Once you run this, click the 'Save View' button in the top right. You can name it 'Weekly Slow Resolutions' so you never have to build these filters again!\n\nLet me know if that pulls up the exact data you're looking for.",
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        isInternal: false,
      },
    ],
  },
];


export const useTicketStore = create<TicketStore>((set) => ({
  tickets: initialTickets,
  activeTicketId: initialTickets[0].id,
  setActiveTicket: (id) => set({ activeTicketId: id }),
  updateTicketStatus: (id, status) =>
    set((state) => ({
      tickets: state.tickets.map((t) => (t.id === id ? { ...t, status } : t)),
    })),
  addReply: (id, message, newStatus, isInternal = false) =>
    set((state) => ({
      tickets: state.tickets.map((t) => {
        if (t.id === id) {
          const reply: Reply = {
            id: Math.random().toString(36).substr(2, 9),
            sender: 'Agent',
            message,
            timestamp: new Date(),
            isInternal,
          };
          return {
            ...t,
            replies: [...t.replies, reply],
            ...(newStatus ? { status: newStatus } : {}),
          };
        }
        return t;
      }),
    })),
  escalateTicket: (id, data) =>
    set((state) => ({
      tickets: state.tickets.map((t) => {
        if (t.id === id) {
          const sysReply: Reply = {
            id: Math.random().toString(36).substr(2, 9),
            sender: 'System',
            message: `Escalated to Tier 3.\n\n**Technical Description:**\n${data.technicalDescription}\n\n**Steps to Reproduce:**\n${data.stepsToReproduce}\n\n**Business Impact:**\n${data.businessImpact}`,
            timestamp: new Date(),
          };
          return {
            ...t,
            status: 'Escalated',
            replies: [...t.replies, sysReply],
          };
        }
        return t;
      }),
    })),
  addSimulatedTicket: () =>
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
        payload:
          'We are experiencing a complete SSO login failure affecting all users in our EU region. No one can access the platform since the last deployment. This is blocking our entire team right now.',
        telemetry: {
          os: 'Ubuntu 22.04',
          browser: 'Chrome 123',
          errorCode: 'SSO_AUTH_FAILURE',
          featureFlags: ['okta_sso_v2'],
          customerTier: 'Enterprise',
        },
        aiContext: {
          sentiment: 'Angry',
          intent: 'SSO / Auth Failure',
        },
        replies: [],
      };
      return {
        tickets: [newTicket, ...state.tickets],
        activeTicketId: newTicket.id,
      };
    }),
}));

