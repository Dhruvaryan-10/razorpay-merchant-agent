# Quick Start Guide

Get the application running in 10 minutes.

## Prerequisites

- Python 3.8+
- Node.js 18+
- PostgreSQL 12+

## 1. Setup (5 minutes)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit DATABASE_URL in .env with your PostgreSQL connection
# Default: postgresql://user:password@localhost:5432/razorpay_merchant
```

### Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local
# Default NEXT_PUBLIC_API_URL=http://localhost:8000 is fine
```

## 2. Database Setup (1 minute)

```bash
# Create PostgreSQL database
createdb razorpay_merchant

# Create PostgreSQL user if needed
psql -c "CREATE USER user PASSWORD 'password';"
psql -c "ALTER ROLE user WITH CREATEDB;"

# In backend directory, tables are created automatically when app starts
```

## 3. Run (2 minutes)

### Terminal 1 - Backend

```bash
cd backend
source .venv/bin/activate
python -m uvicorn app.main:app --reload
```

Backend runs at: **http://localhost:8000**
API docs at: **http://localhost:8000/docs**

### Terminal 2 - Frontend

```bash
cd frontend
npm run dev
```

Frontend runs at: **http://localhost:3000**

## 4. Use the App (2 minutes)

1. Open http://localhost:3000
2. Choose one:
   - **Demo Mode**: Click "Explore Demo Store" (no credentials needed)
   - **Real WooCommerce**: Enter your store credentials

### Demo Mode
- Fully functional with synthetic data
- 30 orders, 15 products, 12 customers
- Try agent queries: "Find pending orders", "Show low-stock products"

### Real WooCommerce
1. Get credentials from WooCommerce:
   - Store URL: `https://yourstore.com`
   - Consumer Key: From WooCommerce Settings → API
   - Consumer Secret: From WooCommerce Settings → API
2. Enter credentials
3. Click "Connect WooCommerce"
4. Explore your real store data

## 5. Test WooCommerce Integration (Optional)

```bash
cd backend

export WC_STORE_URL="https://your-store.com"
export WC_CONSUMER_KEY="your_key"
export WC_CONSUMER_SECRET="your_secret"

python scripts/test_woocommerce.py
```

If successful, you'll see:
```
✅ Connection successful
✅ Fetching orders... 
✅ Fetching products...
✅ All tests passed!
```

## Troubleshooting

### Database Connection Error
```
FATAL:  role "user" does not exist
```
**Fix**: Update DATABASE_URL in backend/.env with correct credentials

### PostgreSQL Not Running
```
connection to server at "localhost" (::1), port 5432 failed
```
**Fix**: Start PostgreSQL
```bash
# Mac
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Windows
net start PostgreSQL
```

### Frontend Can't Connect to Backend
```
Failed to load dashboard
```
**Fix**: Ensure backend is running at http://localhost:8000 and NEXT_PUBLIC_API_URL in frontend/.env.local is correct

### Module Import Errors
```
ModuleNotFoundError: No module named 'fastapi'
```
**Fix**: Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

## File Structure

```
razorpay-merchant-agent/
├── backend/               # FastAPI app
│   ├── app/
│   │   ├── main.py       # FastAPI app entry
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic validators
│   │   ├── api/          # Routes
│   │   ├── services/     # Business logic
│   │   ├── connectors/   # WooCommerce integration
│   │   └── utils/        # Encryption, etc
│   └── requirements.txt
├── frontend/             # Next.js app
│   ├── src/
│   │   ├── app/         # Next.js pages
│   │   ├── components/  # React components
│   │   ├── lib/         # API client, utilities
│   │   └── types/       # TypeScript interfaces
│   └── package.json
├── docs/                # Documentation
├── README.md           # Full documentation
└── IMPLEMENTATION_SUMMARY.md
```

## Key Features

### Dashboard
- Revenue, orders, pending orders, low-stock metrics
- Recent orders list
- Merchant insights

### Orders
- Search and filter by status
- Pagination
- Detailed order view with line items

### Products
- Browse all products
- Filter by stock status (in stock, low stock, out of stock)
- Product details

### Inventory
- Summary by stock status
- Low-stock product list
- Out-of-stock product list

### Customers
- Customer list with total spent
- Search customers
- Customer profile

### Merchant Agent
- Natural language queries:
  - "Find pending orders"
  - "Pending orders above ₹2,000"
  - "Show low-stock products"
  - "Find orders above ₹2,000"
  - "Show recent customers"
  - "Order #1048"
  - "Product Air Max"
  - "Customer Rahul"

- Shows tool execution with timing

### Settings
- View connection details
- Disconnect from store

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/stores/demo | Create demo store |
| POST | /api/stores/connect | Connect WooCommerce |
| GET | /api/stores | List stores |
| DELETE | /api/stores/{id} | Delete store |
| GET | /api/dashboard | Dashboard metrics |
| GET | /api/orders | List orders |
| GET | /api/orders/{id} | Get order details |
| GET | /api/products | List products |
| GET | /api/products/{id} | Get product details |
| GET | /api/inventory | Inventory status |
| GET | /api/customers | List customers |
| GET | /api/customers/{id} | Get customer details |
| POST | /api/agent/query | Agent query |
| GET | /api/agent/executions | Agent history |

Full docs at: http://localhost:8000/docs

## Next Steps

### If It Works
Congratulations! The application is fully functional.

### Extend It
1. Add more agent intents in `backend/app/services/agent_service.py`
2. Add more API endpoints in `backend/app/api/routes.py`
3. Customize UI in `frontend/src/components/AppLayout.tsx`

### Deploy It
- **Frontend**: Deploy to Vercel
  ```bash
  cd frontend
  npm run build
  # Link to Vercel
  ```
- **Backend**: Deploy to Render or Railway
  - Set DATABASE_URL environment variable
  - Set ENCRYPTION_KEY environment variable
  - Set FRONTEND_URL to your frontend domain

## Support

- Check `README.md` for full documentation
- Check `docs/ARCHITECTURE.md` for system design
- Check `docs/LIMITATIONS.md` for known limitations
- Check `backend/app/api/routes.py` for API details
- Check `IMPLEMENTATION_SUMMARY.md` for what was built

---

You're all set! Open http://localhost:3000 and start exploring.
