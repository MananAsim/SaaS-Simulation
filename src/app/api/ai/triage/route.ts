export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { openai } from '@/lib/openai';
import { db } from '@/lib/db';

/**
 * POST /api/ai/triage
 * Body: { ticketId }
 * Analyses the ticket and:
 *  1. Classifies sentiment and intent via GPT
 *  2. Updates the ticket's AIContext in the DB
 *  3. Returns routing suggestion (best agent tag/team)
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'Groq not configured' }, { status: 503 });
  }

  try {
    const { ticketId } = await req.json();
    const ticket = await db.ticket.findFirst({
      where: { id: ticketId, tenantId: session.user.tenantId! },
    });

    if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const completion = await openai.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a customer support triage AI. Analyse the ticket and return a JSON object with:
- sentiment: one of ["Angry", "Frustrated", "Neutral", "Happy"]
- intent: short 2-5 word category (e.g. "API Error / Export", "Billing Question", "SSO Auth Failure")
- routingTag: one of ["billing", "technical", "general", "enterprise-cs"] based on the nature of the issue
- urgencyScore: integer 1-10`,
        },
        {
          role: 'user',
          content: `Ticket from ${ticket.customerName} (${ticket.companyName}), Priority: ${ticket.priority}\n\n"${ticket.payload}"`,
        },
      ],
      temperature: 0.2,
      max_tokens: 150,
    });

    const result = JSON.parse(completion.choices[0]?.message?.content ?? '{}');

    // Update the AI context in the DB
    await db.aIContext.upsert({
      where: { ticketId },
      update: { sentiment: result.sentiment, intent: result.intent },
      create: { ticketId, sentiment: result.sentiment, intent: result.intent },
    });

    return NextResponse.json({
      sentiment: result.sentiment,
      intent: result.intent,
      routingTag: result.routingTag,
      urgencyScore: result.urgencyScore,
    });
  } catch (err) {
    console.error('[AI_TRIAGE]', err);
    return NextResponse.json({ error: 'AI service error' }, { status: 500 });
  }
}
