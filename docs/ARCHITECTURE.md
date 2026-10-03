# Architecture

## Overview

Razorpay Merchant Agent is built with a clean, layered architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser / Client                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js Frontend                            │
│  ├─ Pages (Connection, Dashboard, Orders, etc)             │
│  ├─ Components (Sidebar, Tables, Forms)                    │
│  ├─ API Client (Axios/Fetch)                               │
│  └─ State Management (React hooks)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                    HTTP REST API
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  FastAPI Backend                            │
│  ├─ API Routes                                              │
│  │  ├─ Stores (connect, list, delete)                     │
│  │  ├─ Orders (list, get, search)                         │
│  │  ├─ Products (list, get, search)                       │
│  │  ├─ Inventory (status, insights)                       │
│  │  ├─ Customers (list, get, search)                      │
│  │  └─ Agent (query, executions)                          │
│  │                                                          │
│  ├─ Services Layer                                          │
│  │  ├─ StoreService (manage stores/connections)           │
│  │  ├─ ConnectorService (get right connector)             │
│  │  └─ AgentService (process queries)                     │
│  │                                                          │
│  ├─ Connectors Layer                                        │
│  │  ├─ BaseMerchantConnector (interface)                  │
│  │  ├─ WooCommerceConnector (real API)                    │
│  │  └─ DemoConnector (synthetic data)                     │
│  │                                                          │
│  ├─ Database Layer (SQLAlchemy)                            │
│  │  ├─ Models (Store, Order, Product, etc)               │
│  │  └─ Schemas (Request/Response validation)              │
│  │                                                          │
│  └─ Utils                                                   │
│     ├─ Encryption (credential protection)                 │
│     └─ Logging (request tracking)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                         │
│  ├─ Merchant accounts                                       │
│  ├─ Store connections                                       │
│  ├─ Cached orders/products/customers                        │
│  ├─ Sync metadata                                           │
│  └─ Agent execution history                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    WooCommerce REST API
                    (External Integration)
```

## Component Details

### Frontend (Next.js)

**Structure:**
```
frontend/
├─ src/
│  ├─ app/
│  │  ├─ page.tsx (main entry point)
│  │  └─ layout.tsx (root layout)
│  ├─ components/
│  │  ├─ ConnectionScreen.tsx (initial connection UI)
│  │  └─ AppLayout.tsx (main application UI)
│  ├─ lib/
│  │  ├─ api.ts (API client)
│  │  └─ utils.ts (utilities: formatting, status badges)
│  ├─ types/
│  │  └─ index.ts (TypeScript interfaces)
│  └─ styles/
│     └─ globals.css (Tailwind CSS)
├─ package.json
├─ next.config.js
├─ tailwind.config.js
└─ tsconfig.json
```

**Features:**
- Client-side routing (pages via state)
- Real-time data loading
- Responsive design (mobile, tablet, desktop)
- Error handling and loading states
- Form validation

### Backend (FastAPI)

**Structure:**
```
backend/
├─ app/
│  ├─ main.py (FastAPI application)
│  ├─ config.py (environment configuration)
│  ├─ database.py (SQLAlchemy setup)
│  ├─ models/
│  │  ├─ merchant.py
│  │  ├─ store.py
│  │  ├─ connection.py
│  │  ├─ order.py
│  │  ├─ product.py
│  │  ├─ customer.py
│  │  ├─ sync.py
│  │  └─ execution.py
│  ├─ schemas/
│  │  ├─ store.py
│  │  ├─ order.py
│  │  ├─ product.py
│  │  ├─ customer.py
│  │  ├─ agent.py
│  │  └─ pagination.py
│  ├─ api/
│  │  └─ routes.py (all API endpoints)
│  ├─ services/
│  │  ├─ store_service.py
│  │  ├─ connector_service.py
│  │  └─ agent_service.py
│  ├─ connectors/
│  │  ├─ base.py (interface)
│  │  ├─ woocommerce.py (real integration)
│  │  └─ demo.py (synthetic data)
│  ├─ utils/
│  │  └─ encryption.py (credential protection)
│  └─ agent/
│     └─ (agent tools and logic)
├─ tests/ (test files)
├─ scripts/
│  └─ test_woocommerce.py (integration test)
├─ requirements.txt
└─ .env.example
```

## Data Flow

### Connection Flow
1. User enters WooCommerce credentials on frontend
2. Frontend sends to `/api/stores/connect` endpoint
3. Backend validates credentials using WooCommerceConnector
4. If valid, stores connection (with encrypted secret) in database
5. Returns store object to frontend
6. Frontend navigates to dashboard

### Order Fetching Flow
1. Frontend requests `/api/orders` with filters
2. Backend loads store and instantiates connector
3. Connector (WooCommerce or Demo) fetches from external source
4. Backend normalizes response to internal schema
5. Returns paginated list to frontend
6. Frontend renders table with options to view details

### Agent Query Flow
1. User types query in agent interface
2. Frontend sends to `/api/agent/query` endpoint
3. AgentService extracts intent using regex patterns
4. Connector executes appropriate tools
5. Results are formatted and returned
6. Tool executions are logged in database
7. Frontend displays result with expandable tool details

## Key Design Decisions

### Connector Architecture
- **Why**: Allows same code to work with WooCommerce and demo data
- **Benefit**: Easy to add new providers (Shopify, Magento, etc)
- **Pattern**: Strategy pattern with BaseMerchantConnector interface

### Server-Side Credentials
- **Why**: Prevents exposure of Consumer Secret to browser
- **Security**: Encrypted in database, never returned in API
- **Protection**: Only backend can call WooCommerce API

### Normalized Data Models
- **Why**: Internal schemas don't depend on WooCommerce JSON structure
- **Benefit**: Easier to migrate providers, maintain consistency
- **Pattern**: DTO (Data Transfer Object) pattern

### Stateless API
- **Why**: Easier to scale, no session complexity
- **Benefit**: Store ID passed in requests, no server-side session state
- **Limitation**: Store must be selected/passed for each request

### Agent Intent Matching
- **Why**: Simple pattern-based routing without AI/ML complexity
- **Benefit**: Deterministic, fast, doesn't require external API
- **Limitation**: Limited to pre-defined intents

## Security Architecture

### Encryption
- Fernet symmetric encryption for Consumer Secret
- Key derived from ENCRYPTION_KEY in environment
- Decrypted only when needed by connector

### API Security
- CORS middleware restricts origins
- Input validation via Pydantic
- SQLAlchemy prevents SQL injection
- Agent tools are allowlisted (no arbitrary execution)

### Credential Handling
- Never logged
- Never exposed in responses
- Never in URL parameters
- Encrypted at rest

## Scalability Considerations

**Current Design:**
- Single merchant (easily extendable to multi-tenant)
- In-memory connector (no persistent caching)
- Synchronous API calls

**For Production Scale:**
- Add Redis caching for frequently accessed data
- Implement background sync workers
- Add database connection pooling
- Use async/await throughout
- Add request rate limiting per store
- Implement webhook-based sync (instead of polling)
- Add message queue for async operations

## Performance

**Frontend:**
- Next.js automatic code splitting
- Client-side pagination (no full data load)
- Lazy loading of images/components
- Debounced search input

**Backend:**
- Async httpx for external API calls
- Database connection pooling
- Pagination to limit result sets
- Efficient SQL queries via SQLAlchemy

## Testing Strategy

**Unit Tests:**
- Service layer logic
- Connector mock tests
- Utility functions

**Integration Tests:**
- API endpoint tests
- Database operations
- Connector real API (with mocked responses)

**Manual Testing:**
- Demo mode workflows
- Real WooCommerce integration (with credentials)
- UI responsiveness
- Error states
