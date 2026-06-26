"""
CLARION FraudBot API Routes
POST /api/fraudbot/chat — Multilingual conversational fraud assessment
"""

import logging
import uuid

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from sqlalchemy.orm import Session

from db.database import get_db
from db.models_db import FraudBotLog

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/fraudbot", tags=["FraudBot"])

MAX_MESSAGE_LENGTH = 2000
MAX_HISTORY_TURNS = 20


# ─── Request / Response Models ─────────────────────────────────────────────────

class HistoryMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., description="Message content")

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ("user", "assistant"):
            raise ValueError("role must be 'user' or 'assistant'")
        return v


class ChatRequest(BaseModel):
    message: str = Field(..., description="User's message")
    session_id: str = Field(..., description="UUID session identifier")
    history: list[HistoryMessage] = Field(default=[], description="Conversation history")
    language_override: Optional[str] = Field(
        default=None,
        description="Force language (e.g. 'hi', 'ta'). Auto-detected if not set.",
    )

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Message cannot be empty.")
        if len(v) > MAX_MESSAGE_LENGTH:
            raise ValueError(f"Message too long. Maximum {MAX_MESSAGE_LENGTH} characters.")
        return v

    @field_validator("history")
    @classmethod
    def validate_history(cls, v: list) -> list:
        if len(v) > MAX_HISTORY_TURNS * 2:
            # Keep only the last N turns to avoid context overflow
            v = v[-(MAX_HISTORY_TURNS * 2):]
        return v


def get_fraudbot(request: Request):
    """Dependency to retrieve the preloaded FraudBot LLM from app state."""
    bot = getattr(request.app.state, "fraudbot_llm", None)
    if bot is None:
        raise HTTPException(
            status_code=503,
            detail="FraudBot is not ready. Please try again in a moment.",
        )
    return bot


# ─── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/chat")
async def chat_with_fraudbot(
    payload: ChatRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Send a message to FraudBot and get a fraud risk assessment response.

    FraudBot conducts a structured 4-step interview:
    1. Who contacted you and how?
    2. What did they claim or demand?
    3. Did they ask for money, OTP, or documents?
    4. Did they threaten arrest or demand secrecy?

    After all 4 answers, returns a risk verdict: HIGH / MEDIUM / LOW.
    Conversation history is never persisted — session only.
    """
    request_id = str(uuid.uuid4())[:8]
    logger.info(
        "[FraudBot:%s] Session: %s | History turns: %d",
        request_id,
        payload.session_id[:8],
        len(payload.history),
    )

    fraudbot = get_fraudbot(request)

    # Language detection
    if payload.language_override and payload.language_override != "auto":
        language = payload.language_override
    else:
        language = fraudbot.detect_language(payload.message)

    logger.info("[FraudBot:%s] Language: %s", request_id, language)

    # Convert history to dict format expected by model
    history_dicts = [{"role": h.role, "content": h.content} for h in payload.history]

    # Run inference
    try:
        result = fraudbot.chat(
            message=payload.message,
            history=history_dicts,
            language=language,
        )
    except Exception as e:
        logger.error("[FraudBot:%s] Chat error: %s", request_id, e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="FraudBot encountered an error. Please try again.",
        )

    logger.info(
        "[FraudBot:%s] Risk: %s | Show report: %s",
        request_id,
        result.get("risk_level"),
        result.get("show_report_button"),
    )

    # ── Persist analytics log (no message content stored) ─────────────────────
    if result.get("risk_level"):  # Only log when a verdict is reached
        try:
            log_entry = FraudBotLog(
                session_id=payload.session_id,
                risk_level=result.get("risk_level"),
                language_detected=language,
                model_type=result.get("model_type", "rule_based"),
            )
            db.add(log_entry)
            db.commit()
        except Exception as e:
            logger.warning("[FraudBot:%s] Failed to log session: %s", request_id, e)
            db.rollback()

    return {
        "response": result["response"],
        "risk_level": result.get("risk_level"),
        "show_report_button": result.get("show_report_button", False),
        "session_id": payload.session_id,
        "helpline": "1930",
        "report_url": "https://cybercrime.gov.in",
        "language_detected": language,
        "model_type": result.get("model_type", "rule_based"),
    }


@router.get("/health")
async def fraudbot_health(request: Request):
    """FraudBot service health check."""
    bot = getattr(request.app.state, "fraudbot_llm", None)
    return {
        "service": "FraudBot",
        "status": "ready" if bot else "loading",
        "model_type": getattr(bot, "model_type", "unknown") if bot else "none",
        "ollama_available": getattr(bot, "ollama_available", False) if bot else False,
    }


@router.get("/status")
async def fraudbot_status(request: Request):
    """
    Returns the FraudBot LLM operational status.
    Used by the frontend to show the correct mode badge and fallback UI.
    Response: { "available": bool, "mode": "groq"|"ollama"|"unavailable", "model": str|null }
    """
    bot = getattr(request.app.state, "fraudbot_llm", None)
    if bot is None:
        return {"available": False, "mode": "unavailable", "model": None}
    if hasattr(bot, "get_status"):
        return bot.get_status()
    # Backwards compat
    return {
        "available": getattr(bot, "ollama_available", False) or getattr(bot, "groq_available", False),
        "mode": getattr(bot, "mode", "unavailable"),
        "model": getattr(bot, "active_model", None),
    }
