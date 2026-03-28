import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { SSE_SUBSCRIBERS } from '@/lib/sse';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const tenantId = session.user.tenantId;
  const agentId = session.user.id ?? 'unknown';
  const subscriberId = `${tenantId}:${agentId}`;

  const encoder = new TextEncoder();
  let closed = false;
  let controller: ReadableStreamDefaultController | null = null;

  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl;
      
      const send = (data: string) => {
        if (!closed && controller) {
          try {
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          } catch {}
        }
      };

      // Register this subscriber
      SSE_SUBSCRIBERS.set(subscriberId, send);

      // Send initial heartbeat
      send(JSON.stringify({ type: 'connected', agentId }));
    },
    cancel() {
      closed = true;
      SSE_SUBSCRIBERS.delete(subscriberId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
