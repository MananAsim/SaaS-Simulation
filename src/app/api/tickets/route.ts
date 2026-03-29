import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { addHours, addMinutes } from 'date-fns';
export const dynamic = "force-dynamic";
import { SSE_SUBSCRIBERS } from '@/lib/sse';

export const runtime = 'nodejs';

const SLA_DEADLINES: Record<string, number> = {
  P1: 15,    // minutes
  P2: 240,   // minutes (4h)
  P3: 1440,  // minutes (24h)
  P4: 2880,  // minutes (48h)
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      customerName,
      customerRole = 'User',
      companyName,
      priority = 'P4',
      payload,
      tenantId,
      telemetry,
      aiContext,
    } = body;

    if (!customerName || !companyName || !payload || !tenantId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get current ticket count for this tenant to generate ID
    const count = await db.ticket.count({ where: { tenantId } });
    const ticketId = `TKT-${1000 + count + 1}`;

    const now = new Date();
    const slaMinutes = SLA_DEADLINES[priority] ?? 2880;
    const slaDeadline = addMinutes(now, slaMinutes);

    const ticket = await db.ticket.create({
      data: {
        id: ticketId,
        tenantId,
        customerName,
        customerRole,
        companyName,
        priority,
        status: 'Open',
        slaDeadline,
        payload,
        createdAt: now,
        ...(telemetry ? {
          telemetry: {
            create: {
              os: telemetry.os || null,
              browser: telemetry.browser || null,
              errorCode: telemetry.errorCode || null,
              featureFlags: Array.isArray(telemetry.featureFlags) ? telemetry.featureFlags.join(',') : (telemetry.featureFlags || null),
              customerTier: telemetry.customerTier || null,
            }
          }
        } : {}),
        ...(aiContext ? {
          aiContext: {
            create: {
              sentiment: aiContext.sentiment || 'Neutral',
              intent: aiContext.intent || 'General Inquiry',
            }
          }
        } : {}),
      },
      include: {
        telemetry: true,
        aiContext: true,
        messages: true,
      }
    });

    // Broadcast to all SSE subscribers for this tenant
    const event = JSON.stringify({ type: 'ticket:new', ticket });
    SSE_SUBSCRIBERS.forEach((send, key) => {
      if (key.startsWith(`${tenantId}:`)) {
        send(event);
      }
    });

    return NextResponse.json({ success: true, ticket }, { status: 201 });
  } catch (err) {
    console.error('[TICKET_INGEST]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
