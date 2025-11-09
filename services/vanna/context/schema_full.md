# DATABASE CONTEXT (auto-generated)

## RELATIONSHIPS
- Vendor → Invoices
- Customer → Invoices
- Invoice → Line
- Invoice → Payments
## ENUMS
- InvoiceStatus: DRAFT           // Invoice is being created, PENDING         // Awaiting payment, SENT            // Sent to customer, PAID            // Fully paid, PARTIALLY_PAID  // Partially paid, OVERDUE         // Past due date, CANCELLED       // Cancelled, VOID            // Voided
- PaymentMethod: BANK_TRANSFER, CREDIT_CARD, DEBIT_CARD, CASH, CHECK, PAYPAL, STRIPE, OTHER
## BUSINESS RULES
- ### Vendors Table
- `name` - For searching vendors by name: Vendors Table
- ### Customers Table
- `name` - For searching customers by name: Customers Table
- ### Invoices Table
- `vendorId` - For filtering invoices by vendor: Invoices Table
- ### Line Items Table
- `invoiceId` - For fetching items by invoice: Line Items Table
- ### Payments Table
- `invoiceId` - For fetching payments by invoice: Payments Table
- ### Vendors
- `name` is required: Vendors
- ### Customers
- `name` is required: Customers
- ### Invoices
- `invoiceNumber` must be unique: Invoices
- ### Line Items
- `quantity` must be > 0: Line Items
- ### Payments
- `amount` must be > 0: Payments
- ### Key Metrics to Track
- Query performance (slow queries > 1s): Key Metrics to Track