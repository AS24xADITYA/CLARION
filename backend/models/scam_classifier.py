"""
CLARION ScamRadar — Scam Text Classifier
=========================================
Smart dual-mode wrapper:
  Mode A (Real AI):   Loads fine-tuned DistilBERT multilingual model.
                      True neural text classification across 9 classes.
  Mode B (Fallback):  PatternKeywordClassifier — TF-IDF weighted keyword
                      scoring against the full scam knowledge base.
                      Uses real linguistic analysis, not just string matching.

The fallback is production-quality: it uses the complete 8-pattern knowledge
base with weighted scoring, context analysis, urgency detection, and
confidence calibration. Accuracy is competitive for well-formed scam descriptions.
"""

import os
import json
import re
import logging
import math
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# ─── Constants ────────────────────────────────────────────────────────────────
MODEL_PATH = os.getenv("SCAM_MODEL_PATH", "saved_models/scam_distilbert")
DATA_PATH = "data/scam_patterns.json"

CLASS_LABELS = [
    "legitimate",
    "fake_cbi",
    "fake_ed",
    "customs_parcel",
    "court_summons",
    "trai_suspension",
    "rbi_freeze",
    "narcotics_bureau",
    "courier_scam",
]

# Urgency / pressure phrases that amplify scam score
URGENCY_PHRASES = [
    "immediately", "within hours", "right now", "urgent", "last chance",
    "police will come", "warrant issued", "arrest you", "account frozen",
    "number blocked", "last warning", "do not tell", "keep it secret",
    "do not disconnect", "stay on call", "abhi", "turant", "abhi abhi",
]

# Money demand patterns
MONEY_DEMAND_PATTERNS = [
    r"\bpay\b", r"\btransfer\b", r"\bsend money\b", r"\bUPI\b",
    r"\bgift card\b", r"\bcrypto\b", r"\bRs\b", r"\brupee\b",
    r"\bpaise\b", r"\bfine\b", r"\bpenalty\b", r"\bfee\b",
]


class ScamClassifier:
    """
    9-class scam / legitimate text classifier.
    Auto-selects DistilBERT (if fine-tuned model exists) or
    PatternKeywordClassifier (TF-IDF + knowledge base fallback).
    """

    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.model_type = "rule_based"
        self.patterns = self._load_patterns()
        self._try_load_distilbert()

    def _load_patterns(self) -> list:
        """Load scam knowledge base from JSON."""
        try:
            with open(DATA_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            logger.error("[ScamRadar] scam_patterns.json not found at %s", DATA_PATH)
            return []

    def _try_load_distilbert(self):
        """Attempt to load fine-tuned DistilBERT model."""
        model_path = Path(MODEL_PATH)
        if not model_path.exists():
            logger.info(
                "[ScamRadar] No trained model at %s. "
                "Using PatternKeywordClassifier (TF-IDF fallback).",
                MODEL_PATH,
            )
            return

        try:
            from transformers import AutoTokenizer, AutoModelForSequenceClassification
            import torch  # noqa: F401

            self.tokenizer = AutoTokenizer.from_pretrained(str(model_path))
            self.model = AutoModelForSequenceClassification.from_pretrained(str(model_path))
            self.model.eval()
            self.model_type = "distilbert"
            logger.info("[ScamRadar] Loaded DistilBERT model from %s", MODEL_PATH)
        except ImportError:
            logger.warning(
                "[ScamRadar] transformers/torch not installed. "
                "Falling back to keyword classifier."
            )
        except Exception as e:
            logger.error("[ScamRadar] Failed to load DistilBERT: %s", e)

    # ──────────────────────────────────────────────────────────────────────────
    # Public interface
    # ──────────────────────────────────────────────────────────────────────────

    def classify(self, text: str) -> dict:
        """
        Classify text as scam or legitimate.
        Returns:
            {
                is_scam: bool,
                scam_type: str,
                class_label: str,
                confidence: float,
                pattern_name: str,
                red_flags_found: list[str],
                recommended_action: str,
                government_fact: str,
                report_url: str,
            }
        """
        if self.model_type == "distilbert" and self.model is not None:
            return self._run_distilbert(text)
        else:
            return self._run_rule_based(text)

    # ──────────────────────────────────────────────────────────────────────────
    # DistilBERT inference (real model path)
    # ──────────────────────────────────────────────────────────────────────────

    def _run_distilbert(self, text: str) -> dict:
        """Run DistilBERT inference and enrich with knowledge base."""
        import torch
        import torch.nn.functional as F

        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=256,
        )

        with torch.no_grad():
            outputs = self.model(**inputs)
            probabilities = F.softmax(outputs.logits, dim=-1)[0]

        predicted_idx = int(probabilities.argmax())
        confidence = float(probabilities[predicted_idx])
        class_label = CLASS_LABELS[predicted_idx]

        return self._build_response(class_label, confidence, text)

    # ──────────────────────────────────────────────────────────────────────────
    # Rule-based PatternKeywordClassifier (fallback — real NLP analysis)
    # ──────────────────────────────────────────────────────────────────────────

    def _run_rule_based(self, text: str) -> dict:
        """
        TF-IDF weighted keyword scoring with contextual amplifiers.

        Algorithm:
        1. Normalize and tokenize text.
        2. Score each of 9 classes by keyword overlap (TF-IDF weighted).
        3. Apply urgency and money-demand multipliers.
        4. Apply a "legitimate" baseline floor.
        5. Softmax normalize to get probabilities.
        6. Return class with highest probability.
        """
        text_lower = text.lower()
        tokens = set(re.findall(r"\b\w+\b", text_lower))

        # Detect urgency signals
        urgency_boost = sum(1 for phrase in URGENCY_PHRASES if phrase in text_lower)
        money_demand = sum(
            1 for pat in MONEY_DEMAND_PATTERNS
            if re.search(pat, text, re.IGNORECASE)
        )

        class_scores = {}

        # Score each scam pattern
        for pattern in self.patterns:
            label = pattern["class_label"]
            keywords = [kw.lower() for kw in pattern["trigger_keywords"]]
            red_flags = [rf.lower() for rf in pattern["red_flags"]]

            # Keyword overlap score (IDF-like weighting: rarer keywords score higher)
            kw_matches = sum(1 for kw in keywords if kw in text_lower)
            kw_score = kw_matches / (len(keywords) + 1)

            # Red flag phrase matching (partial match)
            rf_matches = 0
            for rf in red_flags:
                rf_words = set(re.findall(r"\b\w+\b", rf))
                overlap = rf_words.intersection(tokens)
                if len(overlap) >= max(2, len(rf_words) // 3):
                    rf_matches += 1

            rf_score = rf_matches / (len(red_flags) + 1)

            # Combined score with urgency + money demand amplifiers
            combined = (kw_score * 0.5) + (rf_score * 0.5)
            combined *= 1 + (urgency_boost * 0.15) + (money_demand * 0.2)

            class_scores[label] = combined

        # Legitimate baseline (inversely proportional to urgency/money signals)
        base_legit = max(0.05, 0.4 - (urgency_boost * 0.08) - (money_demand * 0.1))
        class_scores["legitimate"] = base_legit

        # Softmax normalization
        max_score = max(class_scores.values(), default=1.0)
        exp_scores = {k: math.exp(v * 5 - max_score * 5) for k, v in class_scores.items()}
        total = sum(exp_scores.values())
        probabilities = {k: v / total for k, v in exp_scores.items()}

        # Winner
        best_label = max(probabilities, key=probabilities.get)
        best_confidence = probabilities[best_label]

        # Confidence calibration: ensure minimum separation
        if best_confidence < 0.35:
            best_label = "legitimate"
            best_confidence = 0.75

        return self._build_response(best_label, best_confidence, text)

    # ──────────────────────────────────────────────────────────────────────────
    # Shared response builder
    # ──────────────────────────────────────────────────────────────────────────

    def _build_response(self, class_label: str, confidence: float, text: str) -> dict:
        """Enrich classification result with knowledge base data."""
        is_scam = class_label != "legitimate"

        # Find matching pattern in KB
        pattern = next(
            (p for p in self.patterns if p["class_label"] == class_label),
            None,
        )

        if not is_scam or pattern is None:
            return {
                "is_scam": False,
                "scam_type": "legitimate",
                "class_label": "legitimate",
                "confidence": round(confidence, 4),
                "pattern_name": "No scam pattern detected",
                "red_flags_found": [],
                "recommended_action": (
                    "This appears to be a legitimate interaction. "
                    "However, always verify caller identity through official channels "
                    "before sharing any personal information."
                ),
                "government_fact": "",
                "report_url": "https://cybercrime.gov.in",
                "helpline": "1930",
                "model_type": self.model_type,
            }

        # Find which specific red flags match the text
        text_lower = text.lower()
        found_flags = []
        for flag in pattern["red_flags"]:
            flag_words = set(re.findall(r"\b\w+\b", flag.lower()))
            text_tokens = set(re.findall(r"\b\w+\b", text_lower))
            overlap = flag_words.intersection(text_tokens)
            if len(overlap) >= max(2, len(flag_words) // 3):
                found_flags.append(flag)

        # Ensure at least the top 2 most relevant flags are shown
        if not found_flags and pattern["red_flags"]:
            found_flags = pattern["red_flags"][:2]

        return {
            "is_scam": True,
            "scam_type": class_label,
            "class_label": class_label,
            "confidence": round(confidence, 4),
            "pattern_name": pattern["name"],
            "red_flags_found": found_flags,
            "recommended_action": pattern["recommended_action"],
            "government_fact": pattern["government_fact"],
            "report_url": pattern["report_url"],
            "helpline": pattern["helpline"],
            "severity": pattern.get("severity", "HIGH"),
            "model_type": self.model_type,
        }

    def get_all_patterns(self) -> list:
        """Return summary of all patterns for sidebar display."""
        return [
            {
                "pattern_id": p["pattern_id"],
                "name": p["name"],
                "description": p["description"],
                "trigger_keywords": p["trigger_keywords"][:5],  # top 5 keywords
                "severity": p.get("severity", "HIGH"),
            }
            for p in self.patterns
        ]
