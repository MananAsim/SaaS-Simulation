import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { domain: 'acmecorp.com' },
    update: {},
    create: {
      name: 'Acme Support',
      domain: 'acmecorp.com',
    },
  });

  // Create default agent
  const hashedPassword = await bcrypt.hash('password', 10);
  const agent = await prisma.user.upsert({
    where: { email: 'agent@supportos.com' },
    update: {},
    create: {
      name: 'Demo Agent',
      email: 'agent@supportos.com',
      password: hashedPassword,
      role: 'agent',
      tenantId: tenant.id,
    },
  });

  // Clean up existing tickets before seeding to avoid duplicates
  await prisma.ticket.deleteMany({});

  const t0 = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

  // Insert Ticket 1
  await prisma.ticket.create({
    data: {
      id: 'TKT-1001',
      tenantId: tenant.id,
      customerName: 'Sarah Jenkins',
      customerRole: 'VP of Operations',
      companyName: 'Acme Corp',
      priority: 'P1',
      status: 'Open',
      slaDeadline: new Date(t0.getTime() + 15 * 60000),
      payload: 'Our team has been trying to run the end-of-month data export for the last two hours and it keeps throwing a 500 error. We use this data for our payroll run which happens TOMORROW. This is completely blocking us. Is the system down?',
      createdAt: t0,
      telemetry: {
        create: {
          os: 'macOS 14.2',
          browser: 'Chrome 122',
          errorCode: 'ERR_500 /api/v2/export',
          featureFlags: 'new_export_engine',
          customerTier: 'Enterprise',
        }
      },
      aiContext: {
        create: {
          sentiment: 'Angry',
          intent: 'API Failure / Export',
        }
      },
      messages: {
        create: [
          {
            sender: 'Agent',
            message: 'Reproduced the 500 error on my end using Acme\'s Org_ID. Checked status page; no widespread outage, seems isolated to the v2 export endpoint. Escalating immediately to Eng via Jira (ENG-8992) as this impacts payroll (High Business Impact).',
            isInternal: true,
            timestamp: new Date(t0.getTime() + 5 * 60000),
          },
          {
            sender: 'Agent',
            message: 'Hi Sarah, I completely understand the urgency here, especially with payroll running tomorrow. You are not doing anything wrong—I have reproduced the 500 error on my end and can confirm the v2 export endpoint is currently failing for your tenant.\n\nI have immediately escalated this to our Tier 3 Engineering team as a Critical priority (Ticket ENG-8992) and they are investigating the server logs now.\n\nI will monitor their progress closely and provide you with an update within the next 30 minutes, or sooner if they deploy a fix. We are on this.',
            isInternal: false,
            timestamp: new Date(t0.getTime() + 9 * 60000),
          }
        ]
      }
    }
  });

  // Insert Ticket 2
  const t1 = new Date(Date.now() - 45 * 60000);
  await prisma.ticket.create({
    data: {
      id: 'TKT-1002',
      tenantId: tenant.id,
      customerName: 'David Chen',
      customerRole: 'Marketing Manager',
      companyName: 'GrowthCo',
      priority: 'P2',
      status: 'Pending Customer',
      slaDeadline: new Date(t1.getTime() + 4 * 3600000),
      payload: "Every time I try to click the 'Save Draft' button on the new email campaign builder, the page just freezes. I've lost my work twice now. Please fix this.",
      createdAt: t1,
      telemetry: {
        create: {
          os: 'macOS Sonoma',
          browser: 'Chrome 122',
          errorCode: 'CL_MEMORY_LEAK',
          featureFlags: 'beta_campaign_builder',
          customerTier: 'Mid-Market',
        }
      },
      aiContext: {
        create: {
          sentiment: 'Frustrated',
          intent: 'UI Bug / Save Draft',
        }
      },
      messages: {
        create: [
          {
            sender: 'Agent',
            message: "Looks like a frontend memory leak on the new campaign builder UI. Logged bug ENG-8993. Need to provide the legacy builder as a workaround so he isn't blocked.",
            isInternal: true,
            timestamp: new Date(Date.now() - 30 * 60000),
          },
          {
            sender: 'Agent',
            message: "Hi David, I am so sorry you lost your work—I know exactly how frustrating it is to have to rebuild a campaign from scratch.\n\nI've tested this on Chrome and I'm seeing the same freezing behavior. I've documented the console errors and passed this directly to our UI development team to get the 'Save Draft' button patched.\n\nImmediate Workaround: So you aren't blocked from launching your campaign today, you can temporarily switch back to the classic builder. Just click your Profile Icon > Settings > and toggle off 'Use Beta Campaign Builder'.\n\nI'll keep this ticket on hold and personally email you the moment the engineering team pushes the fix for the new builder.",
            isInternal: false,
            timestamp: new Date(Date.now() - 25 * 60000),
          }
        ]
      }
    }
  });

  // Insert Ticket 3
  const t2 = new Date(Date.now() - 90 * 60000);
  await prisma.ticket.create({
    data: {
      id: 'TKT-1003',
      tenantId: tenant.id,
      customerName: 'Emily Rostova',
      customerRole: 'Admin',
      companyName: 'SmallBiz LLC',
      priority: 'P4',
      status: 'Resolved',
      slaDeadline: new Date(t2.getTime() + 24 * 3600000),
      payload: "Hi team, I'm trying to set up a report that shows me only the tickets from last week that took longer than 24 hours to resolve. I see the filters, but I can't figure out how to combine the date and the time condition. Help?",
      createdAt: t2,
      telemetry: {
        create: {
          os: 'Windows 11',
          browser: 'Firefox 123',
          errorCode: 'None',
          featureFlags: 'beta_dashboard',
          customerTier: 'SMB',
        }
      },
      aiContext: {
        create: {
          sentiment: 'Neutral',
          intent: 'How-to / Custom Reporting',
        }
      },
      messages: {
        create: [
          {
            sender: 'Agent',
            message: 'Standard onboarding friction. The custom reporting logic uses "AND" operators which can be confusing for non-technical admins. Will give step-by-step and a best practice tip.',
            isInternal: true,
            timestamp: new Date(Date.now() - 75 * 60000),
          },
          {
            sender: 'Agent',
            message: "Hi Emily, Welcome to the platform! Custom reports can definitely look a bit overwhelming at first glance, but I can absolutely help you build this.\n\nTo get a report of last week's tickets that took over 24 hours, you'll want to stack your filters like this:\n\n1. Click 'Add Filter' and select 'Created Date' → 'Is Last Week'.\n2. Click 'Add Filter' again (this acts as an \"AND\" condition).\n3. Select 'Resolution Time' → 'Greater Than' → type '24' and select 'Hours'.\n\nPro Tip: Once you run this, click the 'Save View' button in the top right. You can name it 'Weekly Slow Resolutions' so you never have to build these filters again!\n\nLet me know if that pulls up the exact data you're looking for.",
            isInternal: false,
            timestamp: new Date(Date.now() - 60 * 60000),
          }
        ]
      }
    }
  });

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
