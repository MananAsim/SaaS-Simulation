# SupportOS — SaaS Agent Dashboard Simulation

> **A high-fidelity, production-grade SaaS customer support dashboard built as a portfolio piece.**

**🔗 [Live Demo](#)** · Built with Next.js 14 · Tailwind CSS v4 · Framer Motion · Zustand

---

## Overview

SupportOS is a full-featured support agent dashboard that showcases deep understanding of SaaS customer support workflows, SLA management, and operational best practices. It is designed as a portfolio piece to demonstrate technical depth and customer success expertise.

![Dashboard Preview](./public/preview.png)

---

## Features

### Core Ticket Management
- **Active Queue** — Tickets sorted by SLA urgency with a live, second-precise countdown timer
- **Priority Badges** — P1 Critical (Red), P2 High (Orange), P4 Low (Gray)
- **SLA State Machine** — Pending status pauses the timer; Resolution calculates TTR (Time to Resolution)
- **Closed Queue** — Resolved tickets move to a separate tab with TTR displayed

### Ticket Detail View
- **AI Context Badge** — Sentiment (Angry, Frustrated, Neutral) and Intent classification
- **System Telemetry Sidebar** — OS, browser, error codes, feature flags, customer tier
- **Message History** — Customer payload + agent replies with timestamps

### Reply Box
- **Public Reply / Internal Note toggle** — Internal notes have amber styling and a 🔒 lock icon; hidden from the customer
- **Dynamic Status Dropdown** — Submit as Open, Pending Customer, or Solved
- **Slash-Command Macros** — Type `/` to trigger a popover with pre-built response templates

### Escalation Flow
- **Escalate to Tier 3 / Jira** button opens a structured modal requiring Technical Description, Steps to Reproduce, and Business Impact before submission

### Operational Metrics
- **Global KPI Header** — CSAT: 96%, FCR: 71%, and a live Open SLA Risks counter
- **Toast Notifications** — Contextual feedback on every agent action

### Power User Features
- **Search & Filter** — Real-time search by ticket ID, customer name, or company + priority filter chips
- **Simulate Incoming Ticket** — One-click P1 ticket injection for live demo purposes
- **Keyboard Shortcuts** — Press `?` to view all available shortcuts

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 14** (App Router) | Framework |
| **Tailwind CSS v4** | Styling (dark mode, CSS variables) |
| **Framer Motion** | Animations and transitions |
| **Zustand** | Global state management |
| **Lucide React** | Icon system |
| **date-fns** | Time calculations and formatting |
| **TypeScript** | Type safety |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment

This project is configured for one-click deployment on **Vercel**:

```bash
npx vercel
```

Or connect your GitHub repository to Vercel for automatic deployments on every push.

---

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Dark theme CSS variables
│   ├── layout.tsx           # Root layout with OG metadata
│   └── page.tsx             # Main dashboard page
├── components/
│   ├── KpiHeader.tsx        # Global metrics bar
│   ├── QueueSidebar.tsx     # Ticket queue with search & filters
│   ├── TicketCenter.tsx     # Ticket detail + reply box
│   ├── TelemetrySidebar.tsx # System telemetry panel
│   ├── EscalationModal.tsx  # Tier 3 escalation form
│   ├── ToastProvider.tsx    # Toast notification system
│   └── KeyboardShortcutsModal.tsx
├── hooks/
│   └── useLiveCountdown.ts  # Second-precise SLA timer hook
├── lib/
│   └── utils.ts             # cn() utility
└── store/
    └── useTicketStore.ts    # Zustand global state + mock data
```

---

## Skills Demonstrated

- **Crisis Management** — P1 escalation with empathy and urgency (TKT-1001)
- **Technical Troubleshooting** — Bug identification and workaround delivery (TKT-1002)
- **Customer Education** — Clear, step-by-step "how-to" guidance (TKT-1003)
- **SLA Awareness** — Real-time countdown, breach detection, and TTR calculation
- **Process Maturity** — Structured internal notes and Tier 3 escalation gates
