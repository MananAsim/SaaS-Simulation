import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { SSE_SUBSCRIBERS } from '@/lib/sse';
export const dynamic = "force-dynamic";
export const runtime = 'nodejs';

// In-memory viewer registry: { [ticketId]: Set<agentName> }
const viewers = new Map<string, Map<string, string>>(); // ticketId -> Map<agentId, agentName>

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ticketId, action } = await req.json(); // action: 'focus' | 'blur'
  const agentId = session.user.id;
  const agentName = session.user.name || 'Agent';
  const tenantId = session.user.tenantId;

  if (!ticketId || !action || !agentId || !tenantId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  if (!viewers.has(ticketId)) {
    viewers.set(ticketId, new Map());
  }

  const ticketViewers = viewers.get(ticketId)!;

  if (action === 'focus') {
    ticketViewers.set(agentId, agentName);
  } else if (action === 'blur') {
    ticketViewers.delete(agentId);
  }

  // Broadcast updated viewers list to the tenant
  const viewerList = Array.from(ticketViewers.entries()).map(([id, name]) => ({ id, name }));
  const event = JSON.stringify({ type: 'collision:update', ticketId, viewers: viewerList });

  SSE_SUBSCRIBERS.forEach((send: (data: string) => void, key: string) => {
    if (key.startsWith(`${tenantId}:`)) send(event);
  });

  return NextResponse.json({ success: true, viewers: viewerList });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const ticketId = url.searchParams.get('ticketId');
  if (!ticketId) return NextResponse.json({ viewers: [] });

  const ticketViewers = viewers.get(ticketId);
  const viewerList = ticketViewers
    ? Array.from(ticketViewers.entries()).map(([id, name]) => ({ id, name }))
    : [];

  return NextResponse.json({ viewers: viewerList });
}
