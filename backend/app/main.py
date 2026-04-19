"""
FastAPI application entry point.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app import models  # noqa: F401 — ensure models are registered
from app.api import routes as routes_router
from app.api import stops as stops_router
from app.api import carpools as carpools_router

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Route API",
    description="Multi-modal public transport routing for the Sousse–Monastir corridor (Tunisia)",
    version="1.0.0",
)

# ── CORS (allow the Vite dev server) ──────────────────────────────────────────
origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
origins = [o.strip() for o in origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(routes_router.router)
app.include_router(stops_router.router)
app.include_router(carpools_router.router)


@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "service": "smart-route-api"}


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
