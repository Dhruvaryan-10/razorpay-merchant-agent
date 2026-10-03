# VS Code Setup - Razorpay Merchant Agent

## Complete Setup (10 minutes)

### Step 1: Open Project in VS Code

```bash
# Option 1: From VS Code, open folder ~/Documents/razorpay-merchant-agent
# Option 2: From terminal
code ~/Documents/razorpay-merchant-agent
```

### Step 2: Set Up PostgreSQL (macOS)

```bash
# Install PostgreSQL (if not already installed)
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Create database and user
createdb razorpay_merchant
psql -d razorpay_merchant -c "CREATE ROLE postgres WITH LOGIN SUPERUSER CREATEDB CREATEROLE;"
psql -d razorpay_merchant -c "ALTER ROLE postgres WITH PASSWORD 'postgres';"
```

### Step 3: VS Code Terminal Setup

1. **Open integrated terminal**: Ctrl+` (backtick) or View → Terminal

2. **Backend Terminal (Terminal 1)**:

```bash
cd backend

# Create virtual environment
python3 -m venv .venv

# Activate it
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python3 -m alembic upgrade head

# Start backend
python3 -m uvicorn app.main:app --reload
```

Backend runs at: **http://localhost:8000**

3. **Frontend Terminal (Terminal 2)**:

Open a new terminal in VS Code: Ctrl+Shift+`

```bash
cd frontend

# Install dependencies
npm install

# Configure environment (.env.local already exists)
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Start frontend
npm run dev
```

Frontend runs at: **http://localhost:3000**

### Step 4: Open Application

- Open http://localhost:3000 in your browser
- You should see the connection screen
- Click **"Explore Demo Store"** to test with synthetic data

### Step 5: Access API Documentation

- Open http://localhost:8000/docs for Swagger documentation
- All routes are documented here

### Step 6: Optional - Run Tests

In a third terminal:

```bash
cd backend
source .venv/bin/activate
python3 -m pytest tests/ -v
```

Expected: **46 tests pass**

---

## Environment Files Location

- **Backend**: `backend/.env` (already configured for localhost)
- **Frontend**: `frontend/.env.local` (already configured)

## PostgreSQL Credentials (Development)

- **Database**: razorpay_merchant
- **User**: postgres
- **Password**: postgres
- **Host**: localhost
- **Port**: 5432

## Testing With Real WooCommerce (Later)

When you have WooCommerce credentials:

```bash
cd backend
export WC_STORE_URL="https://yourstore.com"
export WC_CONSUMER_KEY="ck_..."
export WC_CONSUMER_SECRET="cs_..."
python3 scripts/test_woocommerce.py
```

Then in the app:
1. Refresh the page
2. Click "Connect WooCommerce"
3. Enter your credentials
4. Click "Connect WooCommerce"

## Common Issues

### PostgreSQL Not Running
```bash
brew services start postgresql@15
```

### Port 3000 Already In Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Port 8000 Already In Use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

### Virtual Environment Not Activating
```bash
source backend/.venv/bin/activate
# Should show (.venv) in your prompt
```

### npm Install Fails
```bash
rm -rf frontend/node_modules frontend/package-lock.json
npm install --legacy-peer-deps
```

---

## Terminal Layout (Recommended)

```
┌────────────────────────────────────────────┐
│ VS Code                                    │
├────────────────────────────────────────────┤
│ Editor pane                                │
│  - backend/app/main.py                    │
│  - frontend/src/app/page.tsx              │
├────────────────────────────────────────────┤
│ Terminal 1: Backend    │ Terminal 2: Frontend│
│ $ uvicorn...          │ $ npm run dev      │
│                       │                     │
│ Port 8000            │ Port 3000          │
└────────────────────────────────────────────┘
```

---

## Quick Commands Reference

| Action | Command |
|--------|---------|
| Start PostgreSQL | `brew services start postgresql@15` |
| Start Backend | `cd backend && source .venv/bin/activate && python3 -m uvicorn app.main:app --reload` |
| Start Frontend | `cd frontend && npm run dev` |
| Run Tests | `cd backend && python3 -m pytest tests/ -v` |
| Stop Backend | Ctrl+C in terminal 1 |
| Stop Frontend | Ctrl+C in terminal 2 |
| Migrate DB | `cd backend && python3 -m alembic upgrade head` |
| Open Swagger | http://localhost:8000/docs |
| Open App | http://localhost:3000 |

---

**You're all set!** The application is ready to use. Start with Step 2, then Steps 3-4 above.
