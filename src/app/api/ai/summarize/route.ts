import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { openai } from '@/lib/openai';

/**
 * POST /api/ai/summarize
 * Body: { ticketId, messages: [{sender, message}], customerName, companyName }
 * Returns: { summary: string[] } — 3-bullet TL;DR for Tier 3 escalation
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
    const { messages, customerName, companyName, ticketId } = await req.json();

    const conversation = messages
      .map((m: { sender: string; message: string }) => `${m.sender}: ${m.message}`)
      .join('\n\n');

    const completion = await openai.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You are an expert at summarising customer support threads for engineering escalations.
Always return EXACTLY 3 bullet points, each starting with a dash (-).
Be concise, technical, and focused on facts relevant for an engineering team.`,
        },
        {
          role: 'user',
          content: `Summarise this support thread for ${customerName} at ${companyName} (Ticket: ${ticketId}) in exactly 3 bullet points covering: (1) what the problem is, (2) what was already tried/discovered, and (3) business impact.

Conversation:
${conversation}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? '';
    // Parse the bullet points
    const summary = raw
      .split('\n')
      .filter((line: string) => line.trim().startsWith('-'))
      .map((line: string) => line.replace(/^-\s*/, '').trim());

    return NextResponse.json({ summary });
  } catch (err) {
    console.error('[AI_SUMMARIZE]', err);
    return NextResponse.json({ error: 'AI service error' }, { status: 500 });
  }
}
