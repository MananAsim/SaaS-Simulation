export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { openai } from '@/lib/openai';

/**
 * POST /api/ai/copilot
 * Body: { ticketPayload, customerName, companyName, priority, messageHistory }
 * Returns: { draft: string }
 *
 * Generates a contextual, empathetic draft response for the agent using GPT-4o-mini.
 * The agent can review and edit before sending.
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
      console.log("GROQ KEY:", process.env.GROQ_API_KEY);

    const { ticketPayload, customerName, companyName, priority, sentiment, intent, messageHistory = [] } = await req.json();

    const systemPrompt = `You are a senior customer support agent writing professional, empathetic email responses for SupportOS.
Your goal is to generate a polished, complete reply to a customer's support ticket.
Follow these rules:
- Be warm, professional, and solution-focused
- Acknowledge the customer's pain point directly
- For P1/P2 tickets, convey urgency and ownership
- Use plain text (no markdown formatting the customer might see as raw syntax)
- Keep it concise but comprehensive
- End with a clear next step
- Do NOT use placeholders like [NAME] — use the real names provided`;

    const messageHistoryText = messageHistory.length > 0
      ? `\nPrevious conversation:\n${messageHistory.map((m: any) => `${m.sender}: ${m.message}`).join('\n\n')}`
      : '';

    const userPrompt = `Customer: ${customerName} at ${companyName}
Priority: ${priority}
Sentiment: ${sentiment}
Issue Category: ${intent}

Customer's message:
"${ticketPayload}"
${messageHistoryText}

Write a complete support reply for the agent to send to this customer.`;

    const completion = await openai.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    const draft = completion.choices[0]?.message?.content?.trim() ?? '';

    return NextResponse.json({ draft });
  } catch (err) {
    console.error('[AI_COPILOT]', err);
    return NextResponse.json({ error: 'AI service error' }, { status: 500 });
  }
}
