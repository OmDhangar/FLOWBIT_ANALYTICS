# Database Schema Documentation

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         VENDORS                                  │
├─────────────────────────────────────────────────────────────────┤
│ PK │ id              UUID                                        │
│    │ name            VARCHAR      NOT NULL                       │
│    │ email           VARCHAR                                     │
│    │ phone           VARCHAR                                     │
│    │ address         VARCHAR                                     │
│    │ city            VARCHAR                                     │
│    │ state           VARCHAR                                     │
│    │ country         VARCHAR                                     │
│    │ postalCode      VARCHAR                                     │
│    │ taxId           VARCHAR                                     │
│    │ createdAt       TIMESTAMP    DEFAULT NOW()                  │
│    │ updatedAt       TIMESTAMP    DEFAULT NOW()                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        INVOICES                                  │
├─────────────────────────────────────────────────────────────────┤
│ PK │ id              UUID                                        │
│    │ invoiceNumber   VARCHAR      UNIQUE, NOT NULL               │
│ FK │ vendorId        UUID         → vendors.id                   │
│ FK │ customerId      UUID         → customers.id (nullable)      │
│    │ issueDate       TIMESTAMP    NOT NULL                       │
│    │ dueDate         TIMESTAMP                                   │
│    │ status          ENUM         NOT NULL (InvoiceStatus)       │
│    │ subtotal        DECIMAL      NOT NULL                       │
│    │ taxAmount       DECIMAL      DEFAULT 0                      │
│    │ discountAmount  DECIMAL      DEFAULT 0                      │
│    │ totalAmount     DECIMAL      NOT NULL                       │
│    │ currency        VARCHAR      DEFAULT 'USD'                  │
│    │ category        VARCHAR                                     │
│    │ description     TEXT                                        │
│    │ notes           TEXT                                        │
│    │ documentUrl     VARCHAR                                     │
│    │ createdAt       TIMESTAMP    DEFAULT NOW()                  │
│    │ updatedAt       TIMESTAMP    DEFAULT NOW()                  │
└─────────────────────────────────────────────────────────────────┘
         │                              │
         │ 1:N                          │ 1:N
         ▼                              ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│     LINE_ITEMS          │    │      PAYMENTS           │
├─────────────────────────┤    ├─────────────────────────┤
│ PK │ id         UUID    │    │ PK │ id         UUID    │
│ FK │ invoiceId  UUID    │    │ FK │ invoiceId  UUID    │
│    │ description TEXT   │    │    │ amount     DECIMAL │
│    │ quantity   DECIMAL │    │    │ paymentDate TIMESTAMP│
│    │ unitPrice  DECIMAL │    │    │ paymentMethod ENUM │
│    │ amount     DECIMAL │    │    │ reference  VARCHAR │
│    │ category   VARCHAR │    │    │ notes      TEXT    │
│    │ createdAt  TIMESTAMP│   │    │ createdAt  TIMESTAMP│
│    │ updatedAt  TIMESTAMP│   │    │ updatedAt  TIMESTAMP│
└─────────────────────────┘    └─────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        CUSTOMERS                                 │
├─────────────────────────────────────────────────────────────────┤
│ PK │ id              UUID                                        │
│    │ name            VARCHAR      NOT NULL                       │
│    │ email           VARCHAR                                     │
│    │ phone           VARCHAR                                     │
│    │ address         VARCHAR                                     │
│    │ city            VARCHAR                                     │
│    │ state           VARCHAR                                     │
│    │ country         VARCHAR                                     │
│    │ postalCode      VARCHAR                                     │
│    │ createdAt       TIMESTAMP    DEFAULT NOW()                  │
│    │ updatedAt       TIMESTAMP    DEFAULT NOW()                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              └──────────────┐
                                             │
                                             ▼
                                    (connects to INVOICES)
```

## Relationships

### One-to-Many Relationships

1. **Vendor → Invoices**
   - One vendor can have many invoices
   - Each invoice belongs to exactly one vendor
   - Cascade delete: Deleting a vendor deletes all their invoices

2. **Customer → Invoices**
   - One customer can have many invoices
   - Each invoice can optionally belong to a customer
   - Set null on delete: Deleting a customer sets invoice.customerId to null

3. **Invoice → Line Items**
   - One invoice can have many line items
   - Each line item belongs to exactly one invoice
   - Cascade delete: Deleting an invoice deletes all its line items

4. **Invoice → Payments**
   - One invoice can have many payments (for partial payments)
   - Each payment belongs to exactly one invoice
   - Cascade delete: Deleting an invoice deletes all its payments

## Enums

### InvoiceStatus
```typescript
enum InvoiceStatus {
  DRAFT           // Invoice is being created
  PENDING         // Awaiting payment
  SENT            // Sent to customer
  PAID            // Fully paid
  PARTIALLY_PAID  // Partially paid
  OVERDUE         // Past due date
  CANCELLED       // Cancelled
  VOID            // Voided
}
```

### PaymentMethod
```typescript
enum PaymentMethod {
  BANK_TRANSFER
  CREDIT_CARD
  DEBIT_CARD
  CASH
  CHECK
  PAYPAL
  STRIPE
  OTHER
}
```

## Indexes

### Vendors Table
- `name` - For searching vendors by name

### Customers Table
- `name` - For searching customers by name

### Invoices Table
- `vendorId` - For filtering invoices by vendor
- `customerId` - For filtering invoices by customer
- `status` - For filtering by status
- `issueDate` - For date range queries
- `dueDate` - For finding overdue invoices
- `category` - For category-based analytics
- `invoiceNumber` - Unique constraint for invoice lookup

### Line Items Table
- `invoiceId` - For fetching items by invoice
- `category` - For category-based analytics

### Payments Table
- `invoiceId` - For fetching payments by invoice
- `paymentDate` - For payment date queries

## Sample Queries

### Get Total Spend by Vendor
```sql
SELECT 
  v.name,
  SUM(i.total_amount) as total_spend,
  COUNT(i.id) as invoice_count
FROM vendors v
JOIN invoices i ON v.id = i.vendor_id
GROUP BY v.id, v.name
ORDER BY total_spend DESC
LIMIT 10;
```

### Get Overdue Invoices
```sql
SELECT 
  i.invoice_number,
  v.name as vendor_name,
  i.total_amount,
  i.due_date,
  CURRENT_DATE - i.due_date as days_overdue
FROM invoices i
JOIN vendors v ON i.vendor_id = v.id
WHERE i.status IN ('PENDING', 'SENT', 'PARTIALLY_PAID')
  AND i.due_date < CURRENT_DATE
ORDER BY days_overdue DESC;
```

### Get Invoice with All Details
```sql
SELECT 
  i.*,
  v.name as vendor_name,
  c.name as customer_name,
  json_agg(DISTINCT li.*) as line_items,
  json_agg(DISTINCT p.*) as payments
FROM invoices i
JOIN vendors v ON i.vendor_id = v.id
LEFT JOIN customers c ON i.customer_id = c.id
LEFT JOIN line_items li ON i.id = li.invoice_id
LEFT JOIN payments p ON i.id = p.invoice_id
WHERE i.id = 'invoice-uuid'
GROUP BY i.id, v.name, c.name;
```

### Get Monthly Revenue Trend
```sql
SELECT 
  DATE_TRUNC('month', issue_date) as month,
  COUNT(*) as invoice_count,
  SUM(total_amount) as total_revenue
FROM invoices
WHERE issue_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', issue_date)
ORDER BY month;
```

### Get Category Breakdown
```sql
SELECT 
  category,
  COUNT(*) as invoice_count,
  SUM(total_amount) as total_amount,
  AVG(total_amount) as avg_amount
FROM invoices
WHERE category IS NOT NULL
GROUP BY category
ORDER BY total_amount DESC;
```

### Get Payment Status Summary
```sql
SELECT 
  i.invoice_number,
  i.total_amount,
  COALESCE(SUM(p.amount), 0) as paid_amount,
  i.total_amount - COALESCE(SUM(p.amount), 0) as remaining_amount,
  CASE 
    WHEN COALESCE(SUM(p.amount), 0) = 0 THEN 'Unpaid'
    WHEN COALESCE(SUM(p.amount), 0) >= i.total_amount THEN 'Paid'
    ELSE 'Partially Paid'
  END as payment_status
FROM invoices i
LEFT JOIN payments p ON i.id = p.invoice_id
GROUP BY i.id, i.invoice_number, i.total_amount;
```

## Data Validation Rules

### Vendors
- `name` is required
- `email` must be valid email format (if provided)
- `phone` should follow international format (if provided)

### Customers
- `name` is required
- `email` must be valid email format (if provided)

### Invoices
- `invoiceNumber` must be unique
- `totalAmount` must equal `subtotal + taxAmount - discountAmount`
- `dueDate` should be after `issueDate`
- `status` must be valid enum value
- `vendorId` must reference existing vendor

### Line Items
- `quantity` must be > 0
- `unitPrice` must be >= 0
- `amount` should equal `quantity * unitPrice`
- `invoiceId` must reference existing invoice

### Payments
- `amount` must be > 0
- `paymentDate` should not be in the future
- `invoiceId` must reference existing invoice
- Total payments should not exceed invoice total

## Migration Strategy

### Initial Setup
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Or create migration
npx prisma migrate dev --name init
```

### Adding New Fields
```bash
# Update schema.prisma
# Then create migration
npx prisma migrate dev --name add_new_field
```

### Data Migration
```typescript
// Example: Add default category to existing invoices
await prisma.invoice.updateMany({
  where: { category: null },
  data: { category: 'Uncategorized' }
});
```

## Performance Optimization

### Recommended Indexes
Already included in schema:
- All foreign keys are indexed
- Frequently queried fields (status, dates, category)
- Unique constraints on invoice numbers

### Query Optimization Tips
1. Use `select` to limit returned fields
2. Use `include` instead of multiple queries
3. Implement pagination for large result sets
4. Use database views for complex aggregations
5. Cache frequently accessed data

### Connection Pooling
Prisma automatically handles connection pooling. Configure in `schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection pool settings
  // connection_limit = 10
}
```

## Backup and Recovery

### Backup Script
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backups/backup_$DATE.sql
```

### Restore Script
```bash
#!/bin/bash
# restore.sh
psql $DATABASE_URL < backups/backup_file.sql
```

## Security Considerations

1. **Row Level Security**: Consider implementing RLS for multi-tenant scenarios
2. **Encryption**: Sensitive fields (taxId, payment info) should be encrypted
3. **Audit Logging**: Track changes to invoices and payments
4. **Access Control**: Implement role-based access in application layer
5. **SQL Injection**: Prisma automatically prevents SQL injection

## Monitoring

### Key Metrics to Track
- Query performance (slow queries > 1s)
- Connection pool usage
- Database size growth
- Index usage statistics
- Lock contention

### Prisma Studio
```bash
npx prisma studio
```
Access at http://localhost:5555 to visually explore data.

## Testing Data

### Seed Script
Located at `apps/api/src/seed.ts`

Run with:
```bash
npm run seed
```

Creates:
- Sample vendors
- Sample invoices with various statuses
- Line items
- Payments
- Realistic date ranges

---

For questions about the schema, consult the Prisma documentation or review the schema file at `apps/api/prisma/schema.prisma`.
