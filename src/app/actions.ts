"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function getTickets() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return [];

  const tickets = await db.ticket.findMany({
    where: {
      tenantId: session.user.tenantId,
    },
    include: {
      telemetry: true,
      aiContext: true,
      messages: {
        orderBy: { timestamp: 'asc' },
      },
    },
    orderBy: {
      slaDeadline: 'asc',
    },
  });

  return tickets;
}

export async function updateTicketStatusAction(ticketId: string, status: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  const ticket = await db.ticket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket || ticket.tenantId !== session.user.tenantId) {
    throw new Error("Ticket not found");
  }

  await db.ticket.update({
    where: { id: ticketId },
    data: { status },
  });

  return { success: true };
}

export async function addReplyAction(
  ticketId: string, 
  message: string, 
  newStatus?: string, 
  isInternal: boolean = false
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  const ticket = await db.ticket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket || ticket.tenantId !== session.user.tenantId) {
    throw new Error("Ticket not found");
  }

  const newReply = await db.message.create({
    data: {
      ticketId,
      sender: 'Agent',
      message,
      isInternal,
    },
  });

  if (newStatus) {
    await db.ticket.update({
      where: { id: ticketId },
      data: { status: newStatus },
    });
  }

  return newReply;
}

export async function escalateTicketAction(
  ticketId: string, 
  data: { technicalDescription: string; stepsToReproduce: string; businessImpact: string }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  const message = `Escalated to Tier 3.\n\n**Technical Description:**\n${data.technicalDescription}\n\n**Steps to Reproduce:**\n${data.stepsToReproduce}\n\n**Business Impact:**\n${data.businessImpact}`;

  await db.ticket.update({
    where: { id: ticketId },
    data: { status: 'Escalated' },
  });

  await db.message.create({
    data: {
      ticketId,
      sender: 'System',
      message,
      isInternal: true,
    },
  });

  return { success: true };
}
