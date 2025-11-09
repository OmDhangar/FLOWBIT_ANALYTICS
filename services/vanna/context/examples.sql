-- Example 1
SELECT 
  v.name,
  SUM(i.total_amount) as total_spend,
  COUNT(i.id) as invoice_count
FROM vendors v
JOIN invoices i ON v.id = i.vendor_id
GROUP BY v.id, v.name
ORDER BY total_spend DESC
LIMIT 10;


-- Example 2
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


-- Example 3
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


-- Example 4
SELECT 
  DATE_TRUNC('month', issue_date) as month,
  COUNT(*) as invoice_count,
  SUM(total_amount) as total_revenue
FROM invoices
WHERE issue_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', issue_date)
ORDER BY month;


-- Example 5
SELECT 
  category,
  COUNT(*) as invoice_count,
  SUM(total_amount) as total_amount,
  AVG(total_amount) as avg_amount
FROM invoices
WHERE category IS NOT NULL
GROUP BY category
ORDER BY total_amount DESC;


-- Example 6
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
