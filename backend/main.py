"""
CLARION — FastAPI Backend Entry Point
======================================
AI-powered Digital Public Safety Platform
CLARION Digital Public Safety Platform

Components:
  /api/scan       — ScanShield: Currency note counterfeit detection
  /api/scam       — ScamRadar: Digital arrest scam classifier
  /api/fraudbot   — FraudBot: Multilingual conversational fraud advisor

Architecture: FastAPI + SQLAlchemy (SQLite) + OpenCV + scikit-learn
              Optional: TensorFlow (EfficientNet) + Ollama (Mistral-7B)
"""

import logging
import sys
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from dotenv import load_dotenv

# Load environment variables before anything else
load_dotenv()

# ─── Logging Configuration ────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("clarion.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger("clarion.main")

# ─── Import routers ───────────────────────────────────────────────────────────
from api.routes_scan import router as scan_router
from api.routes_scam import router as scam_router
from api.routes_fraudbot import router as fraudbot_router
from api.routes_dashboard import router as dashboard_router
from api.routes_urlscanner import router as urlscanner_router


# ─── Lifespan: Load all models on startup ────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Loads all ML models and initialises DB on startup.
    Cleans up on shutdown.
    """
    logger.info("=" * 60)
    logger.info("  CLARION Backend Starting Up")
    logger.info("  CLARION Threat Intelligence Platform")
    logger.info("=" * 60)

    # Record startup time for uptime calculation
    app.state.start_time = time.time()

    # ── Database initialisation ────────────────────────────────────────────────
    try:
        from db.database import init_db
        init_db()
        logger.info("[DB] SQLite database initialised successfully.")
    except Exception as e:
        logger.error("[DB] Database initialisation failed: %s", e)

    # ── Load ScanShield model ─────────────────────────────────────────────────
    try:
        from models.scan_model import ScanModel
        app.state.scan_model = ScanModel()
        logger.info(
            "[ScanShield] Ready. Mode: %s",
            app.state.scan_model.model_type,
        )
    except Exception as e:
        logger.error("[ScanShield] Failed to initialise: %s", e, exc_info=True)
        app.state.scan_model = None

    # ── Load ScamRadar classifier ─────────────────────────────────────────────
    try:
        from models.scam_classifier import ScamClassifier
        app.state.scam_classifier = ScamClassifier()
        logger.info(
            "[ScamRadar] Ready. Mode: %s | Patterns loaded: %d",
            app.state.scam_classifier.model_type,
            len(app.state.scam_classifier.patterns),
        )
    except Exception as e:
        logger.error("[ScamRadar] Failed to initialise: %s", e, exc_info=True)
        app.state.scam_classifier = None

    # ── Load FraudBot LLM ─────────────────────────────────────────────────────
    try:
        from models.fraudbot_llm import FraudBotLLM
        app.state.fraudbot_llm = FraudBotLLM()
        logger.info(
            "[FraudBot] Ready. Mode: %s | Ollama: %s",
            app.state.fraudbot_llm.model_type,
            app.state.fraudbot_llm.ollama_available,
        )
    except Exception as e:
        logger.error("[FraudBot] Failed to initialise: %s", e, exc_info=True)
        app.state.fraudbot_llm = None

    logger.info("=" * 60)
    logger.info("  All services ready. Listening on http://0.0.0.0:8000")
    logger.info("  API Docs: http://localhost:8000/docs")
    logger.info("=" * 60)

    yield  # ← Application runs here

    # ── Shutdown cleanup ──────────────────────────────────────────────────────
    logger.info("[CLARION] Shutting down gracefully.")
    app.state.scan_model = None
    app.state.scam_classifier = None
    app.state.fraudbot_llm = None


# ─── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="CLARION API",
    description=(
        "**CLARION** — AI-powered Digital Public Safety Platform\n\n"
        "Defeating counterfeiting, fraud, and digital arrest scams in India.\n\n"
        "**Components:**\n"
        "- 🔍 **ScanShield**: Counterfeit currency note detector\n"
        "- 🛡️ **ScamRadar**: Digital arrest scam classifier (9 categories)\n"
        "- 💬 **FraudBot**: Multilingual conversational fraud advisor (6 languages)\n\n"
        "All technology is 100% free and open source. No paid APIs used."
    ),
    version="1.0.0",
    contact={
        "name": "CLARION Security Team",
        "url": "https://cybercrime.gov.in",
    },
    license_info={"name": "MIT"},
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS Middleware ──────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restricted to specific origins in production
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ─── Rate Limiting ────────────────────────────────────────────────────────────
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded

    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    logger.info("[CLARION] Rate limiting enabled.")
except ImportError:
    logger.warning("[CLARION] slowapi not installed. Rate limiting disabled.")


# ─── Request ID Middleware (§5.3) ────────────────────────────────────────────
class RequestIDMiddleware(BaseHTTPMiddleware):
    """Attaches a unique UUID to every request as X-Request-ID header."""
    async def dispatch(self, request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

app.add_middleware(RequestIDMiddleware)

# ─── Include Routers ──────────────────────────────────────────────────────────
app.include_router(scan_router)
app.include_router(scam_router)
app.include_router(fraudbot_router)
app.include_router(dashboard_router)
app.include_router(urlscanner_router)


# ─── Core Endpoints ───────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
async def health_check(request: Request):
    """
    System-wide health check.
    Returns status of all AI services with their operational mode.
    """
    scan_model = getattr(request.app.state, "scan_model", None)
    scam_clf = getattr(request.app.state, "scam_classifier", None)
    fraudbot = getattr(request.app.state, "fraudbot_llm", None)

    fraudbot_status = fraudbot.get_status() if fraudbot and hasattr(fraudbot, "get_status") else {
        "mode": "unavailable", "model": None, "available": False
    }

    components = {
        "scanshield": {
            "mode": getattr(scan_model, "model_type", "none"),
            "model_loaded": scan_model is not None,
        },
        "scamradar": {
            "mode": getattr(scam_clf, "model_type", "none"),
            "model_loaded": scam_clf is not None,
        },
        "fraudbot": {
            "mode": fraudbot_status["mode"],
            "available": fraudbot_status["available"],
            "model": fraudbot_status["model"],
        },
    }

    all_ready = scan_model is not None and scam_clf is not None and fraudbot is not None
    uptime = int(time.time() - getattr(request.app.state, "start_time", time.time()))

    return {
        "status": "ok" if all_ready else "degraded",
        "version": "1.0.0",
        "platform": "CLARION — AI Digital Public Safety",
        "components": components,
        "uptime_seconds": uptime,
        "helpline": "1930",
        "report_portal": "https://cybercrime.gov.in",
    }


@app.get("/", tags=["System"])
async def root():
    """CLARION API root — redirects to documentation."""
    return {
        "message": "Welcome to CLARION API",
        "description": "AI-powered Digital Public Safety Platform",
        "docs": "/docs",
        "health": "/health",
        "version": "1.0.0",
    }


# ─── Global Exception Handler ─────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all exception handler — returns consistent JSON error format."""
    logger.error(
        "Unhandled exception on %s %s: %s",
        request.method,
        request.url.path,
        exc,
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "An internal error occurred. Please try again.",
            "path": str(request.url.path),
        },
    )


# ─── Entry point for direct run ───────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
