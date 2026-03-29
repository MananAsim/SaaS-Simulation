import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { SSE_SUBSCRIBERS } from '@/lib/sse';
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = session.user.tenantId;

  try {
    const body = await req.json();
    const { ticketId, status } = body;

    // Verify ownership
    const ticket = await db.ticket.findFirst({
      where: { id: ticketId, tenantId },
    });
    if (!ticket) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updated = await db.ticket.update({
      where: { id: ticketId },
      data: { status },
      include: { telemetry: true, aiContext: true, messages: true },
    });

    // Broadcast status change
    const event = JSON.stringify({ type: 'ticket:updated', ticket: updated });
    SSE_SUBSCRIBERS.forEach((send, key) => {
      if (key.startsWith(`${tenantId}:`)) send(event);
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[TICKET_STATUS_UPDATE]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
