import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/sdk/telemetry
 * Body: { tenantId, ticketId, browser, os, errorCode, featureFlags, customerTier, sessionReplayUrl }
 *
 * This is meant to be called by the client's frontend application (the "SDK")
 * immediately after a user submits a ticket, attaching deep context securely.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, ticketId, browser, os, errorCode, featureFlags, customerTier } = body;

    if (!tenantId || !ticketId) {
      return NextResponse.json({ error: 'Missing credentials or ticketId' }, { status: 400 });
    }

    // Upsert telemetry data for the ticket
    const telemetry = await db.telemetry.upsert({
      where: { ticketId },
      update: {
        browser: browser || undefined,
        os: os || undefined,
        errorCode: errorCode || undefined,
        featureFlags: Array.isArray(featureFlags) ? featureFlags.join(',') : featureFlags,
        customerTier: customerTier || undefined,
      },
      create: {
        ticketId,
        browser: browser || 'Unknown',
        os: os || 'Unknown',
        errorCode: errorCode || 'None',
        featureFlags: Array.isArray(featureFlags) ? featureFlags.join(',') : (featureFlags || ''),
        customerTier: customerTier || 'Standard',
      },
    });

    return NextResponse.json({ success: true, telemetry }, { status: 200 });
  } catch (err) {
    console.error('[SDK_TELEMETRY]', err);
    return NextResponse.json({ error: 'Internal SDK Error' }, { status: 500 });
  }
}
