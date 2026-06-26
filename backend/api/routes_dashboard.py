"""
CLARION Dashboard API Routes
GET /api/dashboard/stats   — Aggregate session statistics
GET /api/dashboard/recent  — Last 10 anonymised activity entries
"""

import logging
import time
from datetime import datetime

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import func

from db.database import get_db
from db.models_db import ScanLog, ScamLog

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


def _compute_threat_level(scams_detected: int, total_checks: int) -> str:
    if total_checks == 0:
        return "LOW"
    ratio = scams_detected / total_checks
    if ratio > 0.6:
        return "HIGH"
    elif ratio > 0.3:
        return "MEDIUM"
    return "LOW"


@router.get("/stats")
async def get_dashboard_stats(request: Request, db: Session = Depends(get_db)):
    """
    Returns aggregate session statistics for the Command Centre dashboard.
    Queries both ScanLog and ScamLog tables.
    """
    try:
        # ── Currency Scans ────────────────────────────────────────────────────
        total_scans = db.query(ScanLog).count()
        genuine_count = db.query(ScanLog).filter(ScanLog.verdict == "GENUINE").count()
        fake_count = db.query(ScanLog).filter(ScanLog.verdict == "FAKE").count()
        uncertain_count = db.query(ScanLog).filter(ScanLog.verdict == "UNCERTAIN").count()

        # ── Scam Checks ───────────────────────────────────────────────────────
        total_scam_checks = db.query(ScamLog).count()
        scams_detected = db.query(ScamLog).filter(ScamLog.is_scam == True).count()  # noqa: E712
        safe_checks = total_scam_checks - scams_detected

        # ── Scam Type Distribution ─────────────────────────────────────────────
        scam_type_rows = (
            db.query(ScamLog.scam_type, func.count(ScamLog.id))
            .filter(ScamLog.is_scam == True)  # noqa: E712
            .group_by(ScamLog.scam_type)
            .all()
        )
        scam_type_distribution = {row[0]: row[1] for row in scam_type_rows if row[0]}

        # ── Platform uptime ───────────────────────────────────────────────────
        start_time = getattr(request.app.state, "start_time", time.time())
        uptime_seconds = int(time.time() - start_time)

        return {
            "total_scans": total_scans,
            "genuine_count": genuine_count,
            "fake_count": fake_count,
            "uncertain_count": uncertain_count,
            "total_scam_checks": total_scam_checks,
            "scams_detected": scams_detected,
            "safe_checks": safe_checks,
            "scam_type_distribution": scam_type_distribution,
            "threat_level": _compute_threat_level(scams_detected, total_scam_checks),
            "platform_uptime_seconds": uptime_seconds,
        }

    except Exception as e:
        logger.error("Dashboard stats query failed: %s", e)
        return {
            "total_scans": 0, "genuine_count": 0, "fake_count": 0, "uncertain_count": 0,
            "total_scam_checks": 0, "scams_detected": 0, "safe_checks": 0,
            "scam_type_distribution": {}, "threat_level": "LOW", "platform_uptime_seconds": 0,
        }


@router.get("/recent")
async def get_recent_activity(db: Session = Depends(get_db)):
    """
    Returns last 10 anonymised log entries across scan and scam logs,
    sorted by timestamp descending. No user input or PII is included.
    """
    try:
        scan_entries = (
            db.query(ScanLog)
            .order_by(ScanLog.timestamp.desc())
            .limit(10)
            .all()
        )
        scam_entries = (
            db.query(ScamLog)
            .order_by(ScamLog.timestamp.desc())
            .limit(10)
            .all()
        )

        activity = []
        for entry in scan_entries:
            activity.append({
                "id": entry.id,
                "type": "currency_scan",
                "verdict": entry.verdict,
                "confidence": round(entry.confidence, 3),
                "denomination": entry.denomination,
                "timestamp": entry.timestamp.isoformat() if entry.timestamp else None,
            })

        for entry in scam_entries:
            activity.append({
                "id": entry.id,
                "type": "scam_check",
                "verdict": "SCAM_DETECTED" if entry.is_scam else "SAFE",
                "scam_type": entry.scam_type,
                "confidence": round(entry.confidence, 3),
                "timestamp": entry.timestamp.isoformat() if entry.timestamp else None,
            })

        # Sort combined list by timestamp descending
        activity.sort(key=lambda x: x["timestamp"] or "", reverse=True)
        return {"recent_activity": activity[:10]}

    except Exception as e:
        logger.error("Recent activity query failed: %s", e)
        return {"recent_activity": []}
