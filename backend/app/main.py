from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine
from app.api import routes

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Razorpay Merchant Agent API",
    description="Backend API for merchant operations workspace",
    version="1.0.0",
)

# CORS middleware
origins = [
    settings.frontend_url,
    "http://localhost:3000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(routes.router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "app": "razorpay-merchant-agent"}

@app.get("/")
async def root():
    return {
        "app": "Razorpay Merchant Agent",
        "version": "1.0.0",
        "docs": "/docs",
    }
