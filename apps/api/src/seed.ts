import { PrismaClient, InvoiceStatus, PaymentMethod } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();


const SACHKONTO_TO_DEPARTMENT_MAP: Record<string, string> = {
  '4400': 'Marketing',        
  '4425': 'HR', 
  '3450': 'Operations',     
  '3400': 'Sales (Goods)',    
  '4910': 'Vehicle Fleet',     
  '4920': 'Travel/Lodging',   
  '4200': 'Logistics/Shipping', 
  '4925': 'IT & Software',    
};



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
        await processInvoiceData(normalized); // Retry with unique number
        inserted++;
      } else {
        console.error(`❌ Failed to process invoice ${normalized.invoiceNumber}:`, err.message);
      }
    }
  }

  console.log(`🎯 Seeding finished. Total inserted invoices: ${inserted}`);
}


// 3. NORMALIZER FUNCTION 

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
    dueDate: payment.dueDate?.value || inv.deliveryDate?.value || null,
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
      ? lineItems.map((li: any) => {
          const sachkontoId = li.Sachkonto?.value?.toString();
          const description = li.description?.value || 'Item';
          let categoryName: string | null = null;

          if (sachkontoId) {
            // Check if the ID exists in our map
            // If not, it will be named "Unknown (GL: 1234)"
            categoryName = SACHKONTO_TO_DEPARTMENT_MAP[sachkontoId] || `Unknown (GL: ${sachkontoId})`;
          } else {
            // Fallback for items with no G/L account (like in 'invoiceaaa.pdf')
            if (description.includes('Basic Fee')) categoryName = 'Base Fees';
            else if (description.includes('Transaction Fee')) categoryName = 'Transaction Fees';
            else categoryName = 'Uncategorized';
          }

          return {
            description: description,
            quantity: toNumber(li.quantity?.value, 1),
            unitPrice: toNumber(li.unitPrice?.value),
            amount: toNumber(li.totalPrice?.value),
            category: categoryName, 
          };
        })
      : [],
  };
}


// 4. PROCESSOR FUNCTION (Modified to set dynamic status)

async function processInvoiceData(item: any) {

  let vendor = await prisma.vendor.findFirst({ where: { name: item.vendor.name } });
  if (!vendor) vendor = await prisma.vendor.create({ data: item.vendor });


  let customer = null;
  if (item.customer?.name) {
    customer = await prisma.customer.findFirst({ where: { name: item.customer.name } });
    if (!customer) customer = await prisma.customer.create({ data: item.customer });
  }

  // Determine realistic invoice status
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let invoiceStatus: InvoiceStatus;
  const total = toNumber(item.total);
  const dueDate = item.dueDate ? new Date(item.dueDate) : null;

  if (total <= 0) {
    invoiceStatus = InvoiceStatus.PAID; 
  } else if (dueDate && dueDate < today) {
    invoiceStatus = InvoiceStatus.OVERDUE; 
  } else {
    invoiceStatus = InvoiceStatus.PENDING; 
  }

  // Invoice
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: item.invoiceNumber,
      vendorId: vendor.id,
      customerId: customer?.id || null,
      issueDate: new Date(item.issueDate),
      dueDate: dueDate,
      status: invoiceStatus, // Use dynamic status
      subtotal: toNumber(item.subtotal),
      taxAmount: toNumber(item.tax),
      totalAmount: total,
      currency: 'EUR',
      description: 'Imported from analytics data',
      category: null,
    },
  });

  // Line Items
  for (const li of item.lineItems) {
    const amount = toNumber(li.amount);
    if (amount <= 0) continue; 

    await prisma.lineItem.create({
      data: {
        invoiceId: invoice.id,
        description: li.description,
        quantity: toNumber(li.quantity, 1),
        unitPrice: toNumber(li.unitPrice),
        amount: amount,
        category: li.category, 
      },
    });
  }

  console.log(`✅ Inserted invoice ${item.invoiceNumber} (Status: ${invoiceStatus})`);
}


// 5. HELPER FUNCTIONS

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


// 6. RUNNER 

main()
  .catch((e) => {
    console.error('❌ Fatal seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });