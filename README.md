# Razorpay Merchant Agent

Premium merchant operations workspace that connects to WooCommerce and provides a modern interface for managing orders, products, inventory, and customers.

## Features

✅ **Real WooCommerce Integration** - Connect to real WooCommerce stores with REST API v3
✅ **Demo Mode** - Fully functional demo environment with synthetic data
✅ **Orders** - View, search, and filter orders with detailed view
✅ **Products** - Manage products with stock status and search
✅ **Inventory** - Real-time inventory insights and low-stock alerts
✅ **Customers** - Customer management and order history
✅ **Merchant Agent** - Natural language queries about store data
✅ **Premium UI** - Polished, enterprise-grade interface
✅ **Secure Credentials** - Server-side credential encryption

## Architecture

```
Browser
  ↓
Next.js Frontend (Port 3000)
  ↓
FastAPI Backend (Port 8000)
  ↓
PostgreSQL Database
  ↓
WooCommerce REST API (v3)
```

## Tech Stack

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- Lucide Icons
- Framer Motion

### Backend
- FastAPI
- SQLAlchemy ORM
- Alembic Migrations
- PostgreSQL
- Pydantic

### Infrastructure
- Native deployment (no Docker)
- Environment-based configuration
- Encrypted credential storage

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 18+
- PostgreSQL 12+

### 1. Clone and Setup

```bash
git clone <repo-url>
cd razorpay-merchant-agent
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env with your database URL
# DATABASE_URL=postgresql://user:password@localhost:5432/razorpay_merchant
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb razorpay_merchant

# Run migrations
cd backend
alembic upgrade head
```

### 4. Run Backend

```bash
cd backend
python -m uvicorn app.main:app --reload
```

Backend will be available at: http://localhost:8000

### 5. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Run development server
npm run dev
```

Frontend will be available at: http://localhost:3000

## Usage

### Demo Mode

1. Open http://localhost:3000
2. Click "Explore Demo Store"
3. Explore with synthetic data

### Real WooCommerce Connection

1. Open http://localhost:3000
2. Fill in WooCommerce credentials:
   - **Store URL**: https://yourstore.com
   - **Consumer Key**: From WooCommerce API settings
   - **Consumer Secret**: From WooCommerce API settings
3. Click "Connect WooCommerce"

### API Documentation

FastAPI Swagger docs available at: http://localhost:8000/docs

### Test WooCommerce Integration

```bash
cd backend

export WC_STORE_URL="https://your-store.com"
export WC_CONSUMER_KEY="your_key"
export WC_CONSUMER_SECRET="your_secret"

python scripts/test_woocommerce.py
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/razorpay_merchant
FRONTEND_URL=http://localhost:3000
WOOCOMMERCE_REQUEST_TIMEOUT=10
MAX_RETRIES=3
ENCRYPTION_KEY=dev-key-change-in-production
ENVIRONMENT=development
DEBUG=true
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Database Schema

### Core Models
- **Merchant** - Merchant account
- **Store** - Connected merchant stores
- **WooCommerceConnection** - Encrypted WooCommerce credentials
- **Order** - Orders from WooCommerce
- **Product** - Products from WooCommerce
- **Customer** - Customers from WooCommerce
- **SyncRun** - Data synchronization history
- **AgentExecution** - Agent query execution history

## Merchant Agent

The agent supports natural language queries:

- "Find pending orders"
- "Pending orders above ₹2,000"
- "Show low-stock products"
- "Out of stock items"
- "Recent customers"
- "Order #1048"
- "Product Air Max"
- "Customer Rahul"
- "Today's sales"

## WooCommerce Integration

### Supported Operations
- ✅ List/Get Orders
- ✅ List/Get Products
- ✅ List/Get Customers
- ✅ Search Orders
- ✅ Search Products
- ✅ Filter by Status
- ✅ Pagination

### Read-Only
The connector is completely read-only. No write operations are supported for security.

### Rate Limiting
- Automatic retry on 429 (Too Many Requests)
- Exponential backoff strategy
- Configurable timeouts and max retries

## Building for Production

### Backend
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Deploy to:
- Render.com
- Railway.app
- AWS/GCP/Azure

### Frontend
```bash
cd frontend
npm run build
npm run start
```

Deploy to:
- Vercel
- Netlify
- Any static host

### Database
- Use managed PostgreSQL (AWS RDS, Heroku, Railway, etc.)
- Set DATABASE_URL environment variable
- Run migrations on deployment

## Security Considerations

🔒 **Credential Protection**
- Consumer Secret encrypted with Fernet
- Never exposed in API responses
- Server-side only

🔒 **CORS Configuration**
- Configured for deployed origins
- Restricts cross-origin requests

🔒 **Input Validation**
- Pydantic validation on all inputs
- SQLAlchemy parameterized queries
- No arbitrary code execution in agent

🔒 **API Protection**
- Read-only operations only
- Agent tool allowlist
- Request validation

## Testing

### Manual Testing
1. Start backend and frontend
2. Connect demo store
3. Test all pages and features
4. Test agent queries
5. Test real WooCommerce connector (with credentials)

### Automated Testing
```bash
cd backend
pytest
```

## Limitations

- Single tenant (easily extendable)
- No write operations (read-only)
- Demo mode uses synthetic data
- Agent limited to pre-defined intents
- Requires WooCommerce REST API access

## Production Checklist

- [ ] Set strong ENCRYPTION_KEY
- [ ] Use production PostgreSQL
- [ ] Configure CORS for production domain
- [ ] Enable HTTPS
- [ ] Set DEBUG=false
- [ ] Use production WooCommerce credentials
- [ ] Monitor API rate limits
- [ ] Setup logging and monitoring
- [ ] Regular database backups
- [ ] Redis caching (optional, for scale)

## Documentation

- [API Reference](docs/API.md)
- [MCP Tools](docs/MCP_TOOLS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Limitations](docs/LIMITATIONS.md)
- [Production Deployment](docs/PRODUCTION.md)

## Support

For issues or questions:
1. Check documentation
2. Review API logs
3. Test with WooCommerce smoke test script
4. Check browser console for frontend errors

## License

Proprietary - Razorpay

---

Built with ❤️ as a premium merchant operations platform
