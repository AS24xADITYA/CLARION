"""
CLARION ScanShield API Routes
POST /api/scan — Currency note authenticity analysis
"""

import os
import uuid
import logging
import tempfile
from pathlib import Path

from fastapi import APIRouter, File, Form, UploadFile, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from db.database import get_db
from db.models_db import ScanLog

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/scan", tags=["ScanShield"])

MAX_IMAGE_SIZE_MB = int(os.getenv("MAX_IMAGE_SIZE_MB", "5"))
ALLOWED_DENOMINATIONS = {"500", "2000"}
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/avif", "image/gif"}


def get_scan_model(request: Request):
    """Dependency to retrieve the preloaded scan model from app state."""
    model = getattr(request.app.state, "scan_model", None)
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="ScanShield model is not loaded. Please try again in a moment.",
        )
    return model


@router.post("")
async def scan_currency_note(
    request: Request,
    image: UploadFile = File(..., description="Currency note image (JPEG/PNG/WEBP)"),
    denomination: str = Form(..., description="Note denomination: '500' or '2000'"),
    db: Session = Depends(get_db),
):
    """
    Analyse a currency note image for authenticity.

    - Accepts JPEG, PNG, or WEBP images up to 5MB
    - Returns GENUINE / FAKE / UNCERTAIN verdict with confidence score
    - Provides anomaly region highlights and heatmap overlay
    - No image data is stored — privacy by design
    """
    request_id = str(uuid.uuid4())[:8]
    logger.info("[Scan:%s] New scan request. Denomination: %s", request_id, denomination)

    # ── Validation ────────────────────────────────────────────────────────────
    if denomination not in ALLOWED_DENOMINATIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid denomination '{denomination}'. Must be '500' or '2000'.",
        )

    content_type = image.content_type or ""
    if content_type not in ALLOWED_CONTENT_TYPES and not content_type.startswith("image/"):
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{content_type}'. Please upload a JPEG, PNG, or WEBP image.",
        )

    # Read and size-check before loading into memory
    image_bytes = await image.read()
    size_mb = len(image_bytes) / (1024 * 1024)
    if size_mb > MAX_IMAGE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"Image too large ({size_mb:.1f} MB). Maximum allowed is {MAX_IMAGE_SIZE_MB} MB.",
        )

    if len(image_bytes) < 1024:
        raise HTTPException(
            status_code=400,
            detail="Image file is too small or corrupted. Please capture a clear photo.",
        )

    # ── Inference ─────────────────────────────────────────────────────────────
    scan_model = get_scan_model(request)

    try:
        result = scan_model.predict(image_bytes, denomination)
        logger.info(
            "[Scan:%s] Verdict: %s | Confidence: %.3f | Time: %dms",
            request_id,
            result["verdict"],
            result["confidence"],
            result.get("processing_ms", 0),
        )
    except Exception as e:
        logger.error("[Scan:%s] Inference failed: %s", request_id, e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Analysis failed. Please try again with a clearer image.",
        )

    # ── Persist analytics log (no PII) ────────────────────────────────────────
    try:
        log_entry = ScanLog(
            denomination=denomination,
            verdict=result["verdict"],
            confidence=result["confidence"],
            processing_ms=result.get("processing_ms"),
            model_type=result.get("model_type", "rule_based"),
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        logger.warning("[Scan:%s] Failed to log scan: %s", request_id, e)
        db.rollback()

    # ── Build response ─────────────────────────────────────────────────────────
    return {
        "verdict": result["verdict"],
        "confidence": result["confidence"],
        "confidence_pct": f"{result['confidence'] * 100:.1f}%",
        "denomination": denomination,
        "anomaly_regions": result.get("anomaly_regions", []),
        "heatmap_image": result.get("heatmap_image"),
        "processing_ms": result.get("processing_ms", 0),
        "model_type": result.get("model_type", "rule_based"),
        "request_id": request_id,
        "note": (
            "Analysis complete. For definitive verification, "
            "please visit your nearest bank branch."
            if result["verdict"] == "UNCERTAIN"
            else None
        ),
    }


@router.get("/health")
async def scan_health(request: Request):
    """ScanShield service health check."""
    model = getattr(request.app.state, "scan_model", None)
    return {
        "service": "ScanShield",
        "status": "ready" if model else "loading",
        "model_type": getattr(model, "model_type", "unknown") if model else "none",
    }
