"""
CLARION URL Scanner API Routes
POST /api/urlscanner/check — Analyse a URL for phishing/fraud patterns
"""

import re
import logging
import json
from urllib.parse import urlparse

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/urlscanner", tags=["URLScanner"])

MAX_URL_LENGTH = 2048

# ─── Known government domains ─────────────────────────────────────────────────
KNOWN_GOVERNMENT_DOMAINS = {
    "gov.in", "nic.in", "mha.gov.in", "cbi.gov.in", "rbi.org.in",
    "incometax.gov.in", "cbic.gov.in", "cybercrime.gov.in", "trai.gov.in",
    "india.gov.in", "mca.gov.in", "sebi.gov.in", "uidai.gov.in",
    "pfms.nic.in", "epfindia.gov.in",
}

# ─── Suspicious domain patterns ───────────────────────────────────────────────
SUSPICIOUS_PATTERNS = [
    (r"gov\.in\.[a-z]+",           "Domain extension after gov.in"),
    (r"[a-z]+-gov-in",             "Hyphenated fake government domain"),
    (r"[a-z]+\.gov\.in\.[a-z]+",   "Fake subdomain of gov.in"),
    (r"official[_-]?india",        "Uses 'official-india' pattern"),
    (r"india[_-]?gov",             "Uses 'indiagov' pattern"),
]

# ─── Red-flag keywords in URL path/query ──────────────────────────────────────
RED_FLAG_KEYWORDS = [
    "arrest", "warrant", "case-number", "case_number", "fir", "summons",
    "freeze", "block", "suspend", "verify-now", "verify_now", "urgent",
    "penalty", "clearance", "kyc-update", "kyc_update", "otp",
    "aadhaar-verify", "aadhaar_verify", "pan-verify",
]


class URLCheckRequest(BaseModel):
    url: str = Field(..., description="The URL to analyse", max_length=MAX_URL_LENGTH)


def _extract_registered_domain(url: str) -> str:
    """Extract the registered domain (eTLD+1) from a URL."""
    try:
        import tldextract
        extracted = tldextract.extract(url)
        if extracted.domain and extracted.suffix:
            return f"{extracted.domain}.{extracted.suffix}"
    except ImportError:
        pass
    # Fallback: simple netloc extraction
    parsed = urlparse(url)
    netloc = parsed.netloc.replace("www.", "")
    return netloc


def _compute_verdict(checks: dict, url: str) -> tuple[str, float]:
    """Compute the final verdict and a confidence score."""
    red_flags = 0

    if not checks["is_https"]:
        red_flags += 1
    if checks["suspicious_pattern_matched"]:
        red_flags += 2
    if checks["red_flag_keywords_found"]:
        red_flags += len(checks["red_flag_keywords_found"])
    if not checks["is_known_government_domain"] and "gov" in url.lower():
        red_flags += 3  # Claims to be government but isn't

    if red_flags >= 4:
        verdict = "DANGEROUS"
        confidence = min(0.95, 0.7 + red_flags * 0.05)
    elif red_flags >= 2:
        verdict = "SUSPICIOUS"
        confidence = 0.65
    else:
        verdict = "LIKELY_SAFE"
        confidence = 0.85

    return verdict, round(confidence, 2)


def _get_recommended_action(verdict: str, checks: dict) -> str:
    if verdict == "DANGEROUS":
        return (
            "Do not open this link. This URL shows strong signs of phishing or impersonation. "
            "Report it at cybercrime.gov.in and call 1930 if you have already shared any information."
        )
    elif verdict == "SUSPICIOUS":
        return (
            "Be cautious with this link. Do not enter any personal details, OTPs, or banking credentials. "
            "Verify the URL by contacting the organisation through their official website directly."
        )
    return (
        "This link appears safe based on our checks. However, always exercise caution before "
        "entering any personal or financial information on any website."
    )


@router.post("/check")
async def check_url(payload: URLCheckRequest, request: Request):
    """
    Analyse a URL for signs of phishing, domain spoofing, or government impersonation.
    Runs 4 heuristic checks and an optional LLM analysis.
    No external HTTP requests are made — the URL structure is analysed locally only.
    """
    url = payload.url.strip()

    # ── Validation ────────────────────────────────────────────────────────────
    if not url:
        raise HTTPException(status_code=400, detail="Please paste a URL to check.")

    parsed = urlparse(url)
    if not parsed.scheme or not parsed.netloc:
        raise HTTPException(
            status_code=400,
            detail="Invalid URL format. Please enter a complete URL including https://",
        )
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(
            status_code=400,
            detail="Only http:// and https:// URLs are supported.",
        )

    url_lower = url.lower()
    netloc_lower = parsed.netloc.lower()

    # ── Check 1: HTTPS ────────────────────────────────────────────────────────
    is_https = parsed.scheme == "https"

    # ── Check 2: Known government domain ─────────────────────────────────────
    registered_domain = _extract_registered_domain(url)
    is_known_gov = any(registered_domain.endswith(d) for d in KNOWN_GOVERNMENT_DOMAINS)

    # ── Check 3: Suspicious domain patterns ──────────────────────────────────
    matched_pattern = None
    for pattern, label in SUSPICIOUS_PATTERNS:
        if re.search(pattern, netloc_lower):
            matched_pattern = label
            break

    # ── Check 4: Red flag keywords in URL ────────────────────────────────────
    found_keywords = [kw for kw in RED_FLAG_KEYWORDS if kw in url_lower]

    checks = {
        "is_https": is_https,
        "is_known_government_domain": is_known_gov,
        "suspicious_pattern_matched": matched_pattern,
        "red_flag_keywords_found": found_keywords,
        "registered_domain": registered_domain,
    }

    # ── Check 5: LLM analysis (if available) ─────────────────────────────────
    llm_analysis = None
    bot = getattr(request.app.state, "fraudbot_llm", None)
    if bot and getattr(bot, "mode", "unavailable") != "unavailable":
        try:
            prompt = (
                f"You are a URL safety analyst. Analyse this URL for signs of phishing or fraud targeting Indian citizens.\n"
                f"URL: {url}\n\n"
                f"Respond ONLY in this exact JSON format with no extra text:\n"
                f'{{ "risk_assessment": "HIGH" | "MEDIUM" | "LOW", '
                f'"reason": "one sentence explanation", '
                f'"impersonating": "organisation name if impersonating, else null" }}'
            )
            result = bot.chat(message=prompt, history=[], language="en")
            response_text = result.get("response", "")
            # Extract JSON from response
            json_match = re.search(r'\{.*?\}', response_text, re.DOTALL)
            if json_match:
                llm_analysis = json.loads(json_match.group())
        except Exception as e:
            logger.warning("LLM URL analysis failed: %s", e)

    verdict, confidence = _compute_verdict(checks, url)
    recommended_action = _get_recommended_action(verdict, checks)

    return {
        "url": url,
        "verdict": verdict,
        "confidence": confidence,
        "checks": checks,
        "llm_analysis": llm_analysis,
        "recommended_action": recommended_action,
        "report_url": "https://cybercrime.gov.in",
        "helpline": "1930",
    }
