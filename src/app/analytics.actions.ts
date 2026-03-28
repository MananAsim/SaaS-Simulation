'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { subDays, startOfDay, format } from 'date-fns';

export async function getAnalyticsAction() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error('Unauthorized');
  
  const tenantId = session.user.tenantId;
  const thirtyDaysAgo = subDays(startOfDay(new Date()), 30);

  // Get all tickets from the last 30 days
  const tickets = await db.ticket.findMany({
    where: {
      tenantId,
      createdAt: { gte: thirtyDaysAgo },
    },
    include: {
      aiContext: true,
      messages: { orderBy: { timestamp: 'asc' } },
    },
  });

  // 1. CSAT Trend (Proxy by Sentiment over time)
  // We'll group by date and calculate % of "Happy" or "Neutral" vs "Angry/Frustrated"
  const csatByDay = tickets.reduce((acc: Record<string, any>, ticket: any) => {
    const day = format(ticket.createdAt, 'MMM dd');
    if (!acc[day]) acc[day] = { date: day, total: 0, positive: 0 };
    acc[day].total++;
    
    const sentiment = ticket.aiContext?.sentiment;
    if (sentiment === 'Happy' || sentiment === 'Neutral') {
      acc[day].positive++;
    }
    return acc;
  }, {} as Record<string, { date: string; total: number; positive: number; csat?: number }>);

  const csatChartData = Object.values(csatByDay).map((day: any) => ({
    date: day.date,
    csat: Math.round((day.positive / day.total) * 100),
  }));

  // 2. Time to Resolution (TTR) Trend (Average minutes to resolve)
  const resolvedTickets = tickets.filter((t: any) => t.status === 'Resolved');
  const ttrByDay = resolvedTickets.reduce((acc: Record<string, any>, ticket: any) => {
    const day = format(ticket.createdAt, 'MMM dd');
    if (!acc[day]) acc[day] = { date: day, totalTtr: 0, count: 0 };
    
    const lastMsg = ticket.messages[ticket.messages.length - 1];
    if (lastMsg) {
      const ttrMinutes = (lastMsg.timestamp.getTime() - ticket.createdAt.getTime()) / 60000;
      acc[day].totalTtr += ttrMinutes;
      acc[day].count++;
    }
    return acc;
  }, {} as Record<string, { date: string; totalTtr: number; count: number }>);

  const ttrChartData = Object.values(ttrByDay).map((day: any) => ({
    date: day.date,
    ttr: Math.round(day.totalTtr / day.count),
  }));

  // Calculate current overviews
  const currentCsat = csatChartData.length ? csatChartData[csatChartData.length - 1].csat : 0;
  const avgTtr = ttrChartData.length ? Math.round(ttrChartData.reduce((sum, d) => sum + d.ttr, 0) / ttrChartData.length) : 0;

  return {
    csatChartData,
    ttrChartData,
    summary: {
      csat: currentCsat,
      avgTtrMins: avgTtr,
      totalTickets: tickets.length,
    }
  };
}
