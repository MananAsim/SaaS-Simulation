const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.log('No tenant found. Seeding one...');
    await prisma.tenant.create({
      data: { id: 'tenant-1', name: 'Acme Corp', slug: 'acme' }
    });
    console.log('Created tenant-1');
    process.exit(0);
  }
  console.log('Found tenant:', tenant.id);
  
  console.log('Testing /api/tickets ingestion route with valid tenant...');
  
  const payload = {
    customerName: 'Test Automator',
    companyName: 'ACME Corp',
    tenantId: tenant.id,
    priority: 'P1',
    payload: 'The main dashboard is returning a 500 internal server error when I export my billing report. Needs fixing immediately.',
    telemetry: {
      os: 'macOS 14.5',
      browser: 'Chrome 125',
      customerTier: 'Enterprise',
      featureFlags: ['new-billing-ui'],
    },
  };

  try {
    const res = await fetch('http://localhost:3000/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (res.ok) {
      console.log('✅ Ingestion successful!', text);
    } else {
      console.error('❌ Ingestion failed with status', res.status);
      console.error('Response body:', text);
    }
  } catch (err) {
    console.error('❌ Ingestion request failed:', err.message);
  }
}

main();
