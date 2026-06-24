"""
CLARION ORM Models
Only non-PII analytics data is stored — timestamps and verdicts.
No user input, no images, no personal data.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from db.database import Base


class ScanLog(Base):
    """Logs each currency note scan (no image data stored)."""
    __tablename__ = "scan_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    denomination = Column(String(10), nullable=False)   # '500' or '2000'
    verdict = Column(String(20), nullable=False)        # 'GENUINE', 'FAKE', 'UNCERTAIN'
    confidence = Column(Float, nullable=False)
    processing_ms = Column(Integer, nullable=True)
    model_type = Column(String(50), default="rule_based")  # 'efficientnet' or 'rule_based'


class ScamLog(Base):
    """Logs each scam classification (no user text stored)."""
    __tablename__ = "scam_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_scam = Column(Boolean, nullable=False)
    scam_type = Column(String(50), nullable=True)       # class label
    confidence = Column(Float, nullable=False)
    language_detected = Column(String(10), default="en")
    model_type = Column(String(50), default="rule_based")  # 'distilbert' or 'rule_based'


class FraudBotLog(Base):
    """Logs FraudBot session outcomes (no conversation content stored)."""
    __tablename__ = "fraudbot_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    session_id = Column(String(64), nullable=False)
    risk_level = Column(String(20), nullable=True)      # 'HIGH', 'MEDIUM', 'LOW'
    language_detected = Column(String(10), default="en")
    model_type = Column(String(50), default="rule_based")
