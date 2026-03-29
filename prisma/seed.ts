import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // ─── Step 1: Wipe existing data (safe dependency order) ──────────────────
  console.log('🧹 Clearing existing data...');
  await prisma.message.deleteMany({});
  await prisma.aIContext.deleteMany({});
  await prisma.telemetry.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.verificationToken.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.tenant.deleteMany({});
  console.log('   ✔ All tables cleared.\n');

  // ─── Step 2: Create Tenant ───────────────────────────────────────────────
  console.log('🏢 Creating tenant: Acme Corp...');
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Acme Corp',
      domain: 'acmecorp.com',
    },
  });
  console.log(`   ✔ Tenant created → id: ${tenant.id}\n`);

  // ─── Step 3: Create Demo Agent User ──────────────────────────────────────
  console.log('👤 Creating demo agent: agent@supportos.demo...');
  const hashedPassword = await bcrypt.hash('password123', 12);
  const agent = await prisma.user.create({
    data: {
      name: 'Demo Agent',
      email: 'agent@supportos.demo',
      password: hashedPassword,
      role: 'agent',
      tenantId: tenant.id,
    },
  });
  console.log(`   ✔ User created → id: ${agent.id}`);
  console.log(`   ✔ Password hashed with bcrypt (saltRounds: 12)\n`);

  // ─── Step 4: Seed Tickets ────────────────────────────────────────────────
  console.log('🎫 Seeding 5 sample tickets...');

  const now = Date.now();

  // TKT-1001 · P1 — Critical export failure (angry enterprise customer)
  await prisma.ticket.create({
    data: {
      id: 'TKT-1001',
      tenantId: tenant.id,
      customerName: 'Sarah Jenkins',
      customerRole: 'VP of Operations',
      companyName: 'Acme Corp',
      priority: 'P1',
      status: 'Open',
      slaDeadline: new Date(now - 2 * 3600_000 + 15 * 60_000), // 15 min from 2h ago
      createdAt: new Date(now - 2 * 3600_000),
      payload:
        'Our team has been trying to run the end-of-month data export for the last two hours and it keeps throwing a 500 error. We use this data for our payroll run which happens TOMORROW. This is completely blocking us. Is the system down?',
      telemetry: {
        create: {
          os: 'macOS 14.2',
          browser: 'Chrome 122',
          errorCode: 'ERR_500 /api/v2/export',
          featureFlags: 'new_export_engine',
          customerTier: 'Enterprise',
        },
      },
      aiContext: {
        create: {
          sentiment: 'Angry',
          intent: 'API Failure / Export',
        },
      },
      messages: {
        create: [
          {
            sender: 'Agent',
            message:
              "Reproduced the 500 error on my end using Acme's Org_ID. Checked status page; no widespread outage, seems isolated to the v2 export endpoint. Escalating immediately to Eng via Jira (ENG-8992) as this impacts payroll (High Business Impact).",
            isInternal: true,
            timestamp: new Date(now - 2 * 3600_000 + 5 * 60_000),
          },
          {
            sender: 'Agent',
            message:
              "Hi Sarah, I completely understand the urgency here, especially with payroll running tomorrow. You are not doing anything wrong—I have reproduced the 500 error on my end and can confirm the v2 export endpoint is currently failing for your tenant.\n\nI have immediately escalated this to our Tier 3 Engineering team as a Critical priority (Ticket ENG-8992) and they are investigating the server logs now.\n\nI will monitor their progress closely and provide you with an update within the next 30 minutes, or sooner if they deploy a fix. We are on this.",
            isInternal: false,
            timestamp: new Date(now - 2 * 3600_000 + 9 * 60_000),
          },
        ],
      },
    },
  });
  console.log('   ✔ TKT-1001 [P1] Open — Export API failure (Enterprise)');

  // TKT-1002 · P2 — UI freeze on campaign builder (frustrated mid-market)
  await prisma.ticket.create({
    data: {
      id: 'TKT-1002',
      tenantId: tenant.id,
      customerName: 'David Chen',
      customerRole: 'Marketing Manager',
      companyName: 'GrowthCo',
      priority: 'P2',
      status: 'Pending Customer',
      slaDeadline: new Date(now - 45 * 60_000 + 4 * 3600_000),
      createdAt: new Date(now - 45 * 60_000),
      payload:
        "Every time I try to click the 'Save Draft' button on the new email campaign builder, the page just freezes. I've lost my work twice now. Please fix this.",
      telemetry: {
        create: {
          os: 'macOS Sonoma',
          browser: 'Chrome 122',
          errorCode: 'CL_MEMORY_LEAK',
          featureFlags: 'beta_campaign_builder',
          customerTier: 'Mid-Market',
        },
      },
      aiContext: {
        create: {
          sentiment: 'Frustrated',
          intent: 'UI Bug / Save Draft',
        },
      },
      messages: {
        create: [
          {
            sender: 'Agent',
            message:
              "Looks like a frontend memory leak on the new campaign builder UI. Logged bug ENG-8993. Need to provide the legacy builder as a workaround so he isn't blocked.",
            isInternal: true,
            timestamp: new Date(now - 30 * 60_000),
          },
          {
            sender: 'Agent',
            message:
              "Hi David, I am so sorry you lost your work—I know exactly how frustrating it is to have to rebuild a campaign from scratch.\n\nI've tested this on Chrome and I'm seeing the same freezing behavior. I've documented the console errors and passed this directly to our UI development team to get the 'Save Draft' button patched.\n\nImmediate Workaround: So you aren't blocked from launching your campaign today, you can temporarily switch back to the classic builder. Just click your Profile Icon → Settings → and toggle off 'Use Beta Campaign Builder'.\n\nI'll keep this ticket on hold and personally email you the moment the engineering team pushes the fix for the new builder.",
            isInternal: false,
            timestamp: new Date(now - 25 * 60_000),
          },
        ],
      },
    },
  });
  console.log('   ✔ TKT-1002 [P2] Pending Customer — UI freeze (Mid-Market)');

  // TKT-1003 · P3 — SSO integration failing (security-sensitive)
  await prisma.ticket.create({
    data: {
      id: 'TKT-1003',
      tenantId: tenant.id,
      customerName: 'Marcus Webb',
      customerRole: 'IT Systems Administrator',
      companyName: 'FinEdge Solutions',
      priority: 'P3',
      status: 'Open',
      slaDeadline: new Date(now - 20 * 60_000 + 8 * 3600_000),
      createdAt: new Date(now - 20 * 60_000),
      payload:
        "We completed the SAML 2.0 SSO setup following your documentation but our staff are getting 'AuthnFailed: Invalid Assertion Signature' errors. We double-checked the X.509 certificate and it matches what we uploaded. The metadata XML looks correct too. Has anyone else hit this?",
      telemetry: {
        create: {
          os: 'Windows 11 Enterprise',
          browser: 'Edge 121',
          errorCode: 'SAML_AUTHN_FAILED',
          featureFlags: 'enterprise_sso',
          customerTier: 'Enterprise',
        },
      },
      aiContext: {
        create: {
          sentiment: 'Neutral',
          intent: 'SSO / SAML Configuration',
        },
      },
      messages: {
        create: [
          {
            sender: 'Agent',
            message:
              "Known SAML clock-skew issue with strict assertion windows. Need to check if their IdP clock is within 5 minutes of our server time. Will request their IdP metadata export.",
            isInternal: true,
            timestamp: new Date(now - 10 * 60_000),
          },
        ],
      },
    },
  });
  console.log('   ✔ TKT-1003 [P3] Open — SSO SAML failure (Enterprise)');

  // TKT-1004 · P4 — Custom reporting how-to (happy SMB user)
  await prisma.ticket.create({
    data: {
      id: 'TKT-1004',
      tenantId: tenant.id,
      customerName: 'Emily Rostova',
      customerRole: 'Admin',
      companyName: 'SmallBiz LLC',
      priority: 'P4',
      status: 'Resolved',
      slaDeadline: new Date(now - 90 * 60_000 + 24 * 3600_000),
      createdAt: new Date(now - 90 * 60_000),
      payload:
        "Hi team, I'm trying to set up a report that shows me only the tickets from last week that took longer than 24 hours to resolve. I see the filters, but I can't figure out how to combine the date and the time condition. Help?",
      telemetry: {
        create: {
          os: 'Windows 11',
          browser: 'Firefox 123',
          errorCode: 'None',
          featureFlags: 'beta_dashboard',
          customerTier: 'SMB',
        },
      },
      aiContext: {
        create: {
          sentiment: 'Neutral',
          intent: 'How-to / Custom Reporting',
        },
      },
      messages: {
        create: [
          {
            sender: 'Agent',
            message:
              'Standard onboarding friction. The custom reporting logic uses "AND" operators which can be confusing for non-technical admins. Will give step-by-step and a best practice tip.',
            isInternal: true,
            timestamp: new Date(now - 75 * 60_000),
          },
          {
            sender: 'Agent',
            message:
              "Hi Emily, Welcome to the platform! Custom reports can definitely look a bit overwhelming at first glance, but I can absolutely help you build this.\n\nTo get a report of last week's tickets that took over 24 hours:\n1. Click 'Add Filter' → select 'Created Date' → 'Is Last Week'.\n2. Click 'Add Filter' again (this acts as an AND condition).\n3. Select 'Resolution Time' → 'Greater Than' → type '24' and select 'Hours'.\n\nPro Tip: Once you run this, click 'Save View' in the top right and name it 'Weekly Slow Resolutions' so you never have to rebuild these filters again!\n\nLet me know if that pulls up the exact data you're looking for.",
            isInternal: false,
            timestamp: new Date(now - 60 * 60_000),
          },
          {
            sender: 'Customer',
            message: "That worked perfectly! Thank you so much, this is exactly what I needed.",
            isInternal: false,
            timestamp: new Date(now - 40 * 60_000),
          },
        ],
      },
    },
  });
  console.log('   ✔ TKT-1004 [P4] Resolved — Custom reporting how-to (SMB)');

  // TKT-1005 · P2 — Webhook delivery failures (developer, high urgency)
  await prisma.ticket.create({
    data: {
      id: 'TKT-1005',
      tenantId: tenant.id,
      customerName: 'Priya Nair',
      customerRole: 'Senior Backend Engineer',
      companyName: 'TechStream Inc.',
      priority: 'P2',
      status: 'Escalated',
      slaDeadline: new Date(now - 3 * 3600_000 + 6 * 3600_000),
      createdAt: new Date(now - 3 * 3600_000),
      payload:
        "Our webhook endpoint has been receiving malformed payloads since your 2.8 release went out at 14:00 UTC. The `customer.subscription.updated` event is now missing the `previous_attributes` field that our billing reconciliation logic depends on. This is causing silent failures in our downstream Stripe sync. Docs still show the field should be present.",
      telemetry: {
        create: {
          os: 'Ubuntu 22.04',
          browser: 'API / cURL',
          errorCode: 'WEBHOOK_SCHEMA_MISMATCH',
          featureFlags: 'webhooks_v2',
          customerTier: 'Enterprise',
        },
      },
      aiContext: {
        create: {
          sentiment: 'Frustrated',
          intent: 'Webhook / API Schema Regression',
        },
      },
      messages: {
        create: [
          {
            sender: 'Agent',
            message:
              'This is a confirmed regression in the 2.8 webhook schema. The `previous_attributes` field was removed from the serializer without a deprecation notice. Escalating to the Integrations team (ENG-9001). This affects any customers using subscription webhooks for billing automation.',
            isInternal: true,
            timestamp: new Date(now - 2.5 * 3600_000),
          },
          {
            sender: 'Agent',
            message:
              "Hi Priya, thank you for the incredibly detailed report — the specific field and event type you identified made this very fast to reproduce.\n\nYou've found a real regression: the `previous_attributes` field was inadvertently removed from our `customer.subscription.updated` webhook payload in the 2.8 release. This is our fault, not your implementation.\n\nI've escalated this as a P1 regression to our Integrations Engineering team (ENG-9001). In the meantime, a temporary workaround is to poll the `GET /v2/subscriptions/{id}` endpoint on receipt of the webhook to fetch the full subscription object and derive the delta.\n\nI'll personally update this ticket the moment a hotfix is deployed. We're targeting a patch within 4 hours.",
            isInternal: false,
            timestamp: new Date(now - 2 * 3600_000),
          },
        ],
      },
    },
  });
  console.log('   ✔ TKT-1005 [P2] Escalated — Webhook schema regression (Enterprise)');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Seed complete! Summary:');
  console.log(`   Tenant  : Acme Corp (${tenant.id})`);
  console.log(`   User    : agent@supportos.demo / password123`);
  console.log('   Tickets : TKT-1001 (P1), TKT-1002 (P2), TKT-1003 (P3), TKT-1004 (P4), TKT-1005 (P2)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
