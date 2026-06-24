"""
CLARION ScamRadar API Routes
POST /api/scam/classify — Scam text classification (9 classes)
GET  /api/scam/patterns — Full knowledge base
GET  /api/scam/stats    — Analytics (scan counts by type)
"""

import logging
import uuid

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from db.database import get_db
from db.models_db import ScamLog

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/scam", tags=["ScamRadar"])

MIN_TEXT_LENGTH = 10
MAX_TEXT_LENGTH = 3000


# ─── Request / Response Models ─────────────────────────────────────────────────

class ClassifyRequest(BaseModel):
    text: str = Field(..., description="Description of the suspicious call or message")
    language: str = Field(default="auto", description="Language code or 'auto' for detection")

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        v = v.strip()
        if len(v) < MIN_TEXT_LENGTH:
            raise ValueError(
                f"Text too short. Please describe the situation in at least {MIN_TEXT_LENGTH} characters."
            )
        if len(v) > MAX_TEXT_LENGTH:
            raise ValueError(
                f"Text too long. Maximum {MAX_TEXT_LENGTH} characters allowed."
            )
        return v


def get_scam_classifier(request: Request):
    """Dependency to retrieve the preloaded scam classifier from app state."""
    classifier = getattr(request.app.state, "scam_classifier", None)
    if classifier is None:
        raise HTTPException(
            status_code=503,
            detail="ScamRadar classifier is not ready. Please try again in a moment.",
        )
    return classifier


def detect_language(text: str, requested_language: str) -> str:
    """Detect or use the provided language code."""
    if requested_language != "auto":
        return requested_language

    try:
        from langdetect import detect, DetectorFactory
        DetectorFactory.seed = 42  # Ensure deterministic results
        return detect(text)
    except Exception:
        logger.debug("Language detection failed, defaulting to 'en'")
        return "en"


# ─── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/classify")
async def classify_scam(
    payload: ClassifyRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Classify a suspicious call/message description into 9 categories:
    legitimate + 8 digital arrest / fraud scam patterns.

    Returns verdict, confidence, matched red flags, recommended action,
    and direct link to cybercrime.gov.in reporting portal.
    """
    request_id = str(uuid.uuid4())[:8]
    logger.info("[Scam:%s] Classification request. Length: %d chars", request_id, len(payload.text))

    # Detect language
    lang = detect_language(payload.text, payload.language)
    logger.info("[Scam:%s] Language: %s", request_id, lang)

    # Run classification
    classifier = get_scam_classifier(request)
    try:
        result = classifier.classify(payload.text)
    except Exception as e:
        logger.error("[Scam:%s] Classification failed: %s", request_id, e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Classification failed. Please try again.",
        )

    logger.info(
        "[Scam:%s] is_scam=%s | type=%s | confidence=%.3f",
        request_id,
        result["is_scam"],
        result.get("scam_type"),
        result["confidence"],
    )

    # ── Persist analytics log (no user text stored) ────────────────────────────
    try:
        log_entry = ScamLog(
            is_scam=result["is_scam"],
            scam_type=result.get("scam_type"),
            confidence=result["confidence"],
            language_detected=lang,
            model_type=result.get("model_type", "rule_based"),
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        logger.warning("[Scam:%s] Failed to log classification: %s", request_id, e)
        db.rollback()

    return {
        "is_scam": result["is_scam"],
        "scam_type": result.get("scam_type"),
        "class_label": result.get("class_label"),
        "confidence": result["confidence"],
        "confidence_pct": f"{result['confidence'] * 100:.1f}%",
        "pattern_name": result.get("pattern_name"),
        "red_flags_found": result.get("red_flags_found", []),
        "recommended_action": result.get("recommended_action"),
        "government_fact": result.get("government_fact"),
        "report_url": "https://cybercrime.gov.in",
        "helpline": "1930",
        "severity": result.get("severity"),
        "language_detected": lang,
        "model_type": result.get("model_type", "rule_based"),
        "request_id": request_id,
    }


@router.get("/patterns")
async def get_scam_patterns(request: Request):
    """
    Return all scam pattern definitions for the sidebar display.
    Used by the frontend to show 'Active Scam Patterns in India'.
    """
    classifier = get_scam_classifier(request)
    try:
        patterns = classifier.get_all_patterns()
        return {"patterns": patterns, "total": len(patterns)}
    except Exception as e:
        logger.error("Failed to load patterns: %s", e)
        raise HTTPException(status_code=500, detail="Failed to load scam patterns.")


@router.get("/stats")
async def get_scam_stats(db: Session = Depends(get_db)):
    """
    Return aggregated scam detection statistics.
    Used for the analytics dashboard.
    """
    try:
        from sqlalchemy import func
        from db.models_db import ScamLog

        total_scans = db.query(ScamLog).count()
        total_scams = db.query(ScamLog).filter(ScamLog.is_scam == True).count()  # noqa: E712
        scam_by_type = (
            db.query(ScamLog.scam_type, func.count(ScamLog.id))
            .filter(ScamLog.is_scam == True)  # noqa: E712
            .group_by(ScamLog.scam_type)
            .all()
        )

        return {
            "total_analysed": total_scans,
            "total_scams_detected": total_scams,
            "detection_rate": round(total_scams / total_scans * 100, 1) if total_scans > 0 else 0,
            "scams_by_type": {row[0]: row[1] for row in scam_by_type},
        }
    except Exception as e:
        logger.error("Stats query failed: %s", e)
        return {"total_analysed": 0, "total_scams_detected": 0, "detection_rate": 0, "scams_by_type": {}}


@router.get("/health")
async def scam_health(request: Request):
    """ScamRadar service health check."""
    classifier = getattr(request.app.state, "scam_classifier", None)
    return {
        "service": "ScamRadar",
        "status": "ready" if classifier else "loading",
        "model_type": getattr(classifier, "model_type", "unknown") if classifier else "none",
    }
