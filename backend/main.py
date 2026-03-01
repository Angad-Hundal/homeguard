from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from core.config import settings
from database import engine, Base
from routers import auth, properties, appliances, tasks, dashboard, notifications
from jobs.reminders import start_scheduler

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HomeGuard API",
    description="Home Maintenance Tracker API",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(properties.router)
app.include_router(appliances.router)
app.include_router(tasks.router)
app.include_router(dashboard.router)
app.include_router(notifications.router)


@app.on_event("startup")
async def startup_event():
    if settings.ENVIRONMENT == "production":
        start_scheduler()
    logger.info(f"HomeGuard API started in {settings.ENVIRONMENT} mode")


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
