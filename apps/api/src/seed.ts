import { PrismaClient, InvoiceStatus, PaymentMethod } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const dataPath = path.join(process.cwd(), '../../data/Analytics_Test_Data.json');
  if (!fs.existsSync(dataPath)) {
    console.log('⚠️  Analytics_Test_Data.json not found. Exiting.');
    return;
  }

  // Clean DB
  console.log('🗑️  Clearing old data...');
  await prisma.$transaction([
    prisma.payment.deleteMany(),
    prisma.lineItem.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.vendor.deleteMany(),
  ]);
  console.log('✅ All tables cleared.');

  // Read and parse
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const data = JSON.parse(rawData);

  if (!Array.isArray(data)) {
    console.error('❌ Invalid data format (expected array).');
    return;
  }

  let inserted = 0;
  for (const record of data) {
    const llm = record?.extractedData?.llmData;
    if (!llm) continue;

    const normalized = normalizeAnalyticsData(llm);

    try {
      await processInvoiceData(normalized);
      inserted++;
    } catch (err: any) {
      if (err.code === 'P2002' && err.meta?.target?.includes('invoiceNumber')) {
        const unique = `${normalized.invoiceNumber}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        console.warn(`⚠️ Duplicate invoiceNumber '${normalized.invoiceNumber}' → retrying as '${unique}'`);
        normalized.invoiceNumber = unique;
        await processInvoiceData(normalized);
        inserted++;
      } else {
        console.error('❌ Failed to process invoice:', err.message);
      }
    }
  }

  console.log(`🎯 Seeding finished. Total inserted invoices: ${inserted}`);
}

// 🔄 Normalize JSON into seed-friendly object
function normalizeAnalyticsData(llm: any) {
  const inv = llm.invoice?.value || {};
  const vendor = llm.vendor?.value || {};
  const cust = llm.customer?.value || {};
  const summary = llm.summary?.value || {};
  const payment = llm.payment?.value || {};
  const lineItems = llm.lineItems?.value?.items?.value || [];

  return {
    invoiceNumber: inv.invoiceId?.value?.toString() || `INV-${Date.now()}`,
    issueDate: inv.invoiceDate?.value || new Date(),
    dueDate: payment.dueDate?.value || null,
    vendor: {
      name: vendor.vendorName?.value || 'Unknown Vendor',
      address: vendor.vendorAddress?.value || null,
      taxId: vendor.vendorTaxId?.value || null,
    },
    customer: {
      name: cust.customerName?.value || null,
      address: cust.customerAddress?.value || null,
    },
    subtotal: toNumber(summary.subTotal?.value),
    tax: toNumber(summary.totalTax?.value),
    total: toNumber(summary.invoiceTotal?.value),
    lineItems: Array.isArray(lineItems)
      ? lineItems.map((li: any) => ({
          description: li.description?.value || 'Item',
          quantity: toNumber(li.quantity?.value, 1),
          unitPrice: toNumber(li.unitPrice?.value),
          amount: toNumber(li.totalPrice?.value),
          category: li.Sachkonto?.value?.toString() || null,
        }))
      : [],
    payments: payment.discountedTotal
      ? [
          {
            amount: toNumber(payment.discountedTotal),
            date: payment.dueDate?.value || new Date(),
            method: 'bank_transfer',
          },
        ]
      : [],
  };
}

// 🧾 Create Vendor → Customer → Invoice → LineItems → Payments
async function processInvoiceData(item: any) {
  // Vendor
  let vendor = await prisma.vendor.findFirst({ where: { name: item.vendor.name } });
  if (!vendor) vendor = await prisma.vendor.create({ data: item.vendor });

  // Customer
  let customer = null;
  if (item.customer?.name) {
    customer = await prisma.customer.findFirst({ where: { name: item.customer.name } });
    if (!customer) customer = await prisma.customer.create({ data: item.customer });
  }

  // Invoice
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: item.invoiceNumber,
      vendorId: vendor.id,
      customerId: customer?.id || null,
      issueDate: new Date(item.issueDate),
      dueDate: item.dueDate ? new Date(item.dueDate) : null,
      status: InvoiceStatus.PAID,
      subtotal: toNumber(item.subtotal),
      taxAmount: toNumber(item.tax),
      totalAmount: toNumber(item.total),
      currency: 'EUR',
      description: 'Imported from analytics data',
    },
  });

  // Line Items
  for (const li of item.lineItems) {
    await prisma.lineItem.create({
      data: {
        invoiceId: invoice.id,
        description: li.description,
        quantity: toNumber(li.quantity, 1),
        unitPrice: toNumber(li.unitPrice),
        amount: toNumber(li.amount),
        category: li.category,
      },
    });
  }

  // Payments (safe defaults)
  for (const p of item.payments) {
    const amount = toNumber(p.amount);
    if (!amount || amount === 0) continue; // skip invalid
    await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount,
        paymentDate: p.date ? new Date(p.date) : new Date(),
        paymentMethod: mapPaymentMethod(p.method),
      },
    });
  }

  console.log(`✅ Inserted invoice ${item.invoiceNumber} (${item.vendor.name})`);
}

// Utility helpers
function mapPaymentMethod(method: string | undefined): PaymentMethod {
  if (!method) return PaymentMethod.BANK_TRANSFER;
  const map: Record<string, PaymentMethod> = {
    'bank_transfer': PaymentMethod.BANK_TRANSFER,
    'credit_card': PaymentMethod.CREDIT_CARD,
    'debit_card': PaymentMethod.DEBIT_CARD,
    'cash': PaymentMethod.CASH,
    'paypal': PaymentMethod.PAYPAL,
    'stripe': PaymentMethod.STRIPE,
  };
  return map[method.toLowerCase()] || PaymentMethod.BANK_TRANSFER;
}

function toNumber(val: any, fallback = 0): number {
  const num = parseFloat(val);
  return isNaN(num) ? fallback : num;
}

main()
  .catch((e) => {
    console.error('❌ Fatal seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
