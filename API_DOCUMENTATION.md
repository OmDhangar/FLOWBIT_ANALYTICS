# API Documentation - Flowbit Analytics

Complete API reference for the Flowbit Analytics platform.

## Base URLs

- **Development**: `http://localhost:3001`
- **Production**: `https://your-app.vercel.app`

## Authentication

Currently, the API does not require authentication. In production, implement JWT or session-based auth.

## Common Response Format

### Success Response
```json
{
  "data": { ... },
  "status": "success"
}
```

### Error Response
```json
{
  "error": "Error message",
  "statusCode": 400,
  "details": "Additional error details"
}
```

## Endpoints

### Health Check

#### GET `/health`

Check API and database health.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-11-08T14:44:00.000Z",
  "database": "connected",
  "version": "1.0.0"
}
```

---

### Statistics

#### GET `/api/stats`

Get overview statistics for the dashboard.

**Query Parameters:** None

**Response:**
```json
{
  "totalSpend": 1250000.50,
  "totalInvoices": 342,
  "documentsUploaded": 298,
  "averageInvoiceValue": 3654.97,
  "year": 2024
}
```

**Fields:**
- `totalSpend`: Total spend year-to-date (number)
- `totalInvoices`: Count of invoices this year (number)
- `documentsUploaded`: Count of invoices with documents (number)
- `averageInvoiceValue`: Average invoice amount (number)
- `year`: Current year (number)

---

### Invoices

#### GET `/api/invoices`

Get list of invoices with optional filtering and pagination.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Items per page |
| `search` | string | - | Search in invoice number, vendor name, description |
| `status` | string | - | Filter by status (PAID, PENDING, etc.) |
| `vendorId` | string | - | Filter by vendor ID |
| `startDate` | string | - | Filter by issue date (ISO format) |
| `endDate` | string | - | Filter by issue date (ISO format) |
| `sortBy` | string | issueDate | Sort field |
| `sortOrder` | string | desc | Sort order (asc/desc) |

**Example Request:**
```bash
GET /api/invoices?page=1&limit=20&status=PAID&search=acme
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "invoiceNumber": "INV-2024-0001",
      "vendor": {
        "id": "uuid",
        "name": "Acme Corporation",
        "email": "billing@acme.com"
      },
      "customer": {
        "id": "uuid",
        "name": "Customer Name"
      },
      "issueDate": "2024-01-15T00:00:00.000Z",
      "dueDate": "2024-02-15T00:00:00.000Z",
      "status": "PAID",
      "subtotal": 5000.00,
      "taxAmount": 500.00,
      "discountAmount": 0.00,
      "totalAmount": 5500.00,
      "currency": "USD",
      "category": "Software",
      "description": "Monthly software license",
      "payments": [
        {
          "id": "uuid",
          "amount": 5500.00,
          "paymentDate": "2024-02-10T00:00:00.000Z",
          "paymentMethod": "BANK_TRANSFER"
        }
      ],
      "_count": {
        "lineItems": 3
      }
    }
  ],
  "pagination": {
    "total": 342,
    "page": 1,
    "limit": 20,
    "totalPages": 18
  }
}
```

#### GET `/api/invoices/:id`

Get single invoice by ID.

**Path Parameters:**
- `id`: Invoice UUID

**Response:**
```json
{
  "id": "uuid",
  "invoiceNumber": "INV-2024-0001",
  "vendor": { ... },
  "customer": { ... },
  "lineItems": [
    {
      "id": "uuid",
      "description": "Software License - Pro Plan",
      "quantity": 1,
      "unitPrice": 4000.00,
      "amount": 4000.00,
      "category": "Software"
    }
  ],
  "payments": [ ... ],
  ...
}
```

---

### Invoice Trends

#### GET `/api/invoice-trends`

Get invoice volume and value trends over time.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `months` | number | 12 | Number of months to include |

**Example Request:**
```bash
GET /api/invoice-trends?months=6
```

**Response:**
```json
[
  {
    "month": "2024-06",
    "monthName": "Jun 2024",
    "invoiceCount": 28,
    "totalValue": 125000.50
  },
  {
    "month": "2024-07",
    "monthName": "Jul 2024",
    "invoiceCount": 32,
    "totalValue": 145000.75
  }
]
```

---

### Vendors

#### GET `/api/vendors/top10`

Get top 10 vendors by total spend.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | string | Filter by date range (ISO format) |
| `endDate` | string | Filter by date range (ISO format) |

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Acme Corporation",
    "email": "billing@acme.com",
    "totalSpend": 250000.00,
    "invoiceCount": 45
  },
  {
    "id": "uuid",
    "name": "TechSupply Inc",
    "email": "accounts@techsupply.com",
    "totalSpend": 180000.00,
    "invoiceCount": 32
  }
]
```

#### GET `/api/vendors`

Get all vendors.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Acme Corporation",
    "email": "billing@acme.com",
    "phone": "+1-555-0100",
    "address": "123 Business St",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "postalCode": "10001",
    "_count": {
      "invoices": 45
    }
  }
]
```

---

### Category Spend

#### GET `/api/category-spend`

Get spend grouped by category.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | string | Filter by date range (ISO format) |
| `endDate` | string | Filter by date range (ISO format) |

**Response:**
```json
[
  {
    "category": "Software",
    "amount": 450000.00
  },
  {
    "category": "Hardware",
    "amount": 280000.00
  },
  {
    "category": "Services",
    "amount": 175000.00
  }
]
```

---

### Cash Outflow Forecast

#### GET `/api/cash-outflow`

Get expected cash outflow forecast based on unpaid invoices.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `months` | number | 6 | Number of months to forecast |

**Response:**
```json
[
  {
    "month": "2024-11",
    "monthName": "Nov 2024",
    "expectedOutflow": 85000.00
  },
  {
    "month": "2024-12",
    "monthName": "Dec 2024",
    "expectedOutflow": 92000.00
  }
]
```

---

### Chat with Data

#### POST `/api/chat-with-data`

Send natural language query to Vanna AI for SQL generation and execution.

**Request Body:**
```json
{
  "question": "What is the total spend in the last 90 days?"
}
```

**Response:**
```json
{
  "question": "What is the total spend in the last 90 days?",
  "sql": "SELECT SUM(total_amount) as total_spend FROM invoices WHERE issue_date >= CURRENT_DATE - INTERVAL '90 days';",
  "results": [
    {
      "total_spend": 325000.50
    }
  ],
  "execution_time": 0.234
}
```

**Error Response:**
```json
{
  "question": "What is the total spend in the last 90 days?",
  "sql": "SELECT ...",
  "error": "Error executing SQL: column 'xyz' does not exist"
}
```

#### GET `/api/chat-with-data/health`

Check Vanna AI service health.

**Response:**
```json
{
  "status": "connected",
  "vannaService": {
    "status": "healthy",
    "database": "connected",
    "vanna": "initialized"
  }
}
```

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Vanna AI not available |

## Invoice Status Values

- `DRAFT`: Invoice is being created
- `PENDING`: Invoice awaiting payment
- `SENT`: Invoice sent to customer
- `PAID`: Invoice fully paid
- `PARTIALLY_PAID`: Invoice partially paid
- `OVERDUE`: Invoice past due date
- `CANCELLED`: Invoice cancelled
- `VOID`: Invoice voided

## Payment Method Values

- `BANK_TRANSFER`
- `CREDIT_CARD`
- `DEBIT_CARD`
- `CASH`
- `CHECK`
- `PAYPAL`
- `STRIPE`
- `OTHER`

## Rate Limiting

Currently not implemented. In production, consider:
- 100 requests per minute per IP
- 1000 requests per hour per IP

## CORS

Configured to allow requests from:
- Development: `http://localhost:3000`
- Production: Set via `FRONTEND_URL` environment variable

## Example Usage

### JavaScript/TypeScript (Axios)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
});

// Get stats
const stats = await api.get('/stats');

// Get invoices with filters
const invoices = await api.get('/invoices', {
  params: {
    status: 'PAID',
    page: 1,
    limit: 20,
  },
});

// Chat query
const chatResponse = await api.post('/chat-with-data', {
  question: 'Show me top 5 vendors',
});
```

### cURL

```bash
# Get stats
curl http://localhost:3001/api/stats

# Get invoices with filters
curl "http://localhost:3001/api/invoices?status=PAID&page=1&limit=20"

# Chat query
curl -X POST http://localhost:3001/api/chat-with-data \
  -H "Content-Type: application/json" \
  -d '{"question":"What is the total spend this year?"}'
```

### Python (Requests)

```python
import requests

BASE_URL = 'http://localhost:3001/api'

# Get stats
response = requests.get(f'{BASE_URL}/stats')
stats = response.json()

# Get invoices
response = requests.get(f'{BASE_URL}/invoices', params={
    'status': 'PAID',
    'page': 1,
    'limit': 20
})
invoices = response.json()

# Chat query
response = requests.post(f'{BASE_URL}/chat-with-data', json={
    'question': 'What is the total spend this year?'
})
result = response.json()
```

## Postman Collection

Import this JSON into Postman for easy testing:

```json
{
  "info": {
    "name": "Flowbit Analytics API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/health"
      }
    },
    {
      "name": "Get Stats",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/stats"
      }
    },
    {
      "name": "Get Invoices",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/invoices?page=1&limit=20",
          "query": [
            {"key": "page", "value": "1"},
            {"key": "limit", "value": "20"}
          ]
        }
      }
    },
    {
      "name": "Chat Query",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/chat-with-data",
        "body": {
          "mode": "raw",
          "raw": "{\"question\":\"What is the total spend this year?\"}"
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3001"
    }
  ]
}
```

## Changelog

### v1.0.0 (2024-11-08)
- Initial API release
- All core endpoints implemented
- Vanna AI integration
- PostgreSQL database

---

For issues or feature requests, please contact the development team.
