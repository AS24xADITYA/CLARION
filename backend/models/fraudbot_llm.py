"""
CLARION FraudBot — Multilingual LLM Integration
================================================
Smart tri-mode wrapper with priority fallback chain:

  Mode A (Ollama):  Mistral-7B-Instruct via Ollama. Full local LLM with
                    structured system prompt, 6-language support, and
                    risk tag parsing. Zero cost, zero internet required.

  Mode B (Groq):    Llama3-8b-8192 via Groq Cloud API. Free-tier cloud LLM.
                    Activated when Ollama is not running. Requires a free
                    GROQ_API_KEY in the .env file.

  Mode C (Fallback): StructuredFraudAssessor — a stateful 4-question rule
                    engine that mirrors the LLM's exact assessment flow.
                    Produces the same JSON schema and genuine risk verdicts.
                    Works 100% offline, zero dependencies.

The fallback is a real fraud assessment system, not a chatbot simulation.
It conducts the same 4-step interview and applies the same risk logic.
"""

import os
import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ─── Supported Languages ──────────────────────────────────────────────────────
LANGUAGE_MAP = {
    "en": "English",
    "hi": "Hindi",
    "mr": "Marathi",
    "ta": "Tamil",
    "te": "Telugu",
    "bn": "Bengali",
}

# ─── System Prompt Template ───────────────────────────────────────────────────
SYSTEM_PROMPT_TEMPLATE = """You are CLARION FraudBot, an AI assistant helping Indian citizens identify fraud and scams. You MUST respond ONLY in {language}.

Your role: Conduct a structured 4-step fraud risk assessment. Ask ONE question at a time and wait for the answer before proceeding.

Step 1 - Ask: Who contacted you and how? (call, WhatsApp, video call, SMS, email)
Step 2 - Ask: What did they claim or demand from you?
Step 3 - Ask: Did they ask for money, OTP, Aadhaar number, or personal documents?
Step 4 - Ask: Did they threaten arrest, account freeze, legal action, or demand secrecy?

After all 4 answers, provide your risk verdict:
[HIGH_RISK] - THIS IS A SCAM. Clearly explain why. Provide cybercrime.gov.in and helpline 1930. Give step-by-step reporting instructions.
[MEDIUM_RISK] - PROCEED WITH CAUTION. Explain what to verify. Give safety tips.
[LOW_RISK] - This appears legitimate. Reassure calmly. Provide general safety tips.

Rules:
- NEVER ask more than one question per message
- Keep language simple and accessible for non-technical users
- NEVER be alarmist for LOW_RISK situations
- Always include helpline 1930 for HIGH_RISK verdicts
- The [HIGH_RISK], [MEDIUM_RISK], or [LOW_RISK] tag MUST appear at the START of your final verdict message
"""

# ─── Fallback responses in multiple languages ─────────────────────────────────
STEP_QUESTIONS = {
    "en": {
        1: "Hello! I am FraudBot, your personal fraud safety advisor. To help you assess if you have been targeted by fraud, please tell me: **Who contacted you and how?** (For example: a phone call, WhatsApp message, video call, or SMS)",
        2: "Thank you. Now please tell me: **What did they claim or demand from you?** (For example: claimed to be a government officer, said your account is in trouble, offered a prize, etc.)",
        3: "I understand. This is important: **Did they ask for any of the following?**\n• Money or bank transfer\n• OTP (One Time Password)\n• Aadhaar or PAN number\n• Net banking password or PIN\n• Personal documents",
        4: "Almost done. One final question: **Did they threaten or demand any of the following?**\n• Arrest or police action\n• Account freeze or legal notice\n• Told you to keep the call secret\n• Said you must act immediately or face consequences",
    },
    "hi": {
        1: "नमस्ते! मैं FraudBot हूँ, आपका व्यक्तिगत धोखाधड़ी सुरक्षा सलाहकार। कृपया बताएं: **आपसे किसने और कैसे संपर्क किया?** (उदाहरण: फोन कॉल, WhatsApp, वीडियो कॉल, SMS)",
        2: "धन्यवाद। अब बताएं: **उन्होंने क्या दावा किया या क्या मांगा?** (उदाहरण: सरकारी अधिकारी बताया, खाता समस्या कही, पुरस्कार की बात की, आदि)",
        3: "समझ गया। यह जरूरी है: **क्या उन्होंने इनमें से कुछ माँगा?**\n• पैसे या बैंक ट्रांसफर\n• OTP (वन टाइम पासवर्ड)\n• आधार या PAN नंबर\n• नेट बैंकिंग पासवर्ड या PIN\n• व्यक्तिगत दस्तावेज़",
        4: "लगभग हो गया। अंतिम प्रश्न: **क्या उन्होंने धमकी दी या कुछ ऐसा कहा?**\n• गिरफ्तारी या पुलिस कार्रवाई\n• खाता फ्रीज या कानूनी नोटिस\n• कॉल को गुप्त रखने को कहा\n• तुरंत कार्रवाई नहीं की तो नुकसान होगा",
    },
    "mr": {
        1: "नमस्कार! मी FraudBot आहे, तुमचा वैयक्तिक फसवणूक सुरक्षा सल्लागार. कृपया सांगा: **तुमच्याशी कोणी आणि कसे संपर्क केला?** (उदा: फोन कॉल, WhatsApp, व्हिडिओ कॉल, SMS)",
        2: "धन्यवाद. आता सांगा: **त्यांनी काय सांगितले किंवा काय मागितले?**",
        3: "महत्त्वाचे: **त्यांनी यापैकी काही मागितले का?**\n• पैसे किंवा बँक ट्रान्सफर\n• OTP\n• आधार किंवा PAN\n• नेट बँकिंग पासवर्ड\n• वैयक्तिक कागदपत्रे",
        4: "शेवटचा प्रश्न: **त्यांनी धमकी दिली का?**\n• अटक किंवा पोलीस कारवाई\n• खाते गोठवणे\n• कोणाला सांगू नका असे म्हटले\n• लगेच कार्य करा नाहीतर नुकसान",
    },
    "ta": {
        1: "வணக்கம்! நான் FraudBot, உங்கள் மோசடி பாதுகாப்பு ஆலோசகர். கூறுங்கள்: **உங்களை யார் எப்படி தொடர்பு கொண்டனர்?** (தொலைபேசி, WhatsApp, வீடியோ அழைப்பு, SMS)",
        2: "நன்றி. இப்போது கூறுங்கள்: **அவர்கள் என்ன கூறினர் அல்லது என்ன கேட்டனர்?**",
        3: "முக்கியமானது: **அவர்கள் இவற்றில் ஏதாவது கேட்டனரா?**\n• பணம் அல்லது வங்கி பரிமாற்றம்\n• OTP\n• ஆதார் அல்லது PAN\n• நிகர வங்கி கடவுச்சொல்\n• தனிப்பட்ட ஆவணங்கள்",
        4: "கடைசி கேள்வி: **அவர்கள் அச்சுறுத்தினரா?**\n• கைது அல்லது காவல்துறை நடவடிக்கை\n• கணக்கு முடக்கம்\n• யாரிடமும் சொல்லாதீர்கள்\n• உடனடியாக செயல்படுங்கள்",
    },
    "te": {
        1: "నమస్కారం! నేను FraudBot, మీ మోసం నిరోధక సహాయకుడను. చెప్పండి: **మీతో ఎవరు ఎలా సంప్రదించారు?** (ఫోన్ కాల్, WhatsApp, వీడియో కాల్, SMS)",
        2: "ధన్యవాదాలు. ఇప్పుడు చెప్పండి: **వారు ఏమి చెప్పారు లేదా ఏమి అడిగారు?**",
        3: "ముఖ్యమైనది: **వారు ఇవి అడిగారా?**\n• డబ్బు లేదా బ్యాంక్ బదిలీ\n• OTP\n• ఆధార్ లేదా PAN\n• నెట్ బ్యాంకింగ్ పాస్వర్డ్\n• వ్యక్తిగత పత్రాలు",
        4: "చివరి ప్రశ్న: **వారు బెదిరించారా?**\n• అరెస్ట్ లేదా పోలీసు చర్య\n• ఖాతా స్తంభింపు\n• ఎవరికీ చెప్పవద్దు అన్నారా\n• వెంటనే చేయకపోతే నష్టం",
    },
    "bn": {
        1: "নমস্কার! আমি FraudBot, আপনার ব্যক্তিগত প্রতারণা সুরক্ষা উপদেষ্টা। বলুন: **আপনার সাথে কে কীভাবে যোগাযোগ করেছে?** (ফোন, WhatsApp, ভিডিও কল, SMS)",
        2: "ধন্যবাদ। এখন বলুন: **তারা কী দাবি করেছে বা কী চেয়েছে?**",
        3: "গুরুত্বপূর্ণ: **তারা কি এগুলো চেয়েছে?**\n• টাকা বা ব্যাংক ট্রান্সফার\n• OTP\n• আধার বা PAN\n• নেট ব্যাংকিং পাসওয়ার্ড\n• ব্যক্তিগত নথি",
        4: "শেষ প্রশ্ন: **তারা কি হুমকি দিয়েছে?**\n• গ্রেফতার বা পুলিশ অ্যাকশন\n• অ্যাকাউন্ট ফ্রিজ\n• কাউকে বলবেন না\n• এখনই না করলে ক্ষতি হবে",
    },
}

HIGH_RISK_RESPONSES = {
    "en": (
        "[HIGH_RISK] ⚠️ **WARNING: This appears to be a SCAM!**\n\n"
        "Based on what you described, this matches known digital fraud patterns. "
        "No legitimate government agency (CBI, ED, Police, RBI, TRAI) contacts citizens via "
        "phone/WhatsApp demanding money or OTPs.\n\n"
        "**Immediate steps:**\n"
        "1. Do NOT transfer any money\n"
        "2. Do NOT share OTP, Aadhaar, or bank details\n"
        "3. Disconnect the call/chat\n"
        "4. File a complaint at **cybercrime.gov.in**\n"
        "5. Call **National Cyber Helpline: 1930** (toll-free, 24×7)\n\n"
        "You are not in any legal trouble. Scammers create false urgency — stay calm."
    ),
    "hi": (
        "[HIGH_RISK] ⚠️ **चेतावनी: यह एक SCAM (धोखाधड़ी) है!**\n\n"
        "आपके विवरण के आधार पर, यह डिजिटल धोखाधड़ी का एक जाना-माना तरीका है। "
        "कोई भी असली सरकारी एजेंसी (CBI, ED, पुलिस, RBI) फोन/WhatsApp पर पैसे या OTP नहीं माँगती।\n\n"
        "**तुरंत करें:**\n"
        "1. कोई पैसा ट्रांसफर न करें\n"
        "2. OTP, आधार, बैंक जानकारी साझा न करें\n"
        "3. कॉल/चैट काटें\n"
        "4. **cybercrime.gov.in** पर शिकायत दर्ज करें\n"
        "5. **राष्ट्रीय साइबर हेल्पलाइन: 1930** पर कॉल करें (टोल-फ्री, 24×7)\n\n"
        "आप किसी कानूनी मुसीबत में नहीं हैं। शांत रहें।"
    ),
}

LOW_RISK_RESPONSES = {
    "en": (
        "[LOW_RISK] ✅ Based on what you described, this **appears to be legitimate**.\n\n"
        "However, always stay cautious:\n"
        "• Never share OTP with anyone — not even your bank\n"
        "• Verify caller identity through official websites or call-backs\n"
        "• Government agencies never demand money over the phone\n"
        "• When in doubt, call National Cyber Helpline **1930**\n\n"
        "Stay safe! If you receive further suspicious contact, feel free to ask me again."
    ),
    "hi": (
        "[LOW_RISK] ✅ आपके विवरण के आधार पर, यह **वैध प्रतीत होता है**।\n\n"
        "फिर भी सावधान रहें:\n"
        "• OTP किसी से साझा न करें\n"
        "• कॉलर की पहचान आधिकारिक वेबसाइट से सत्यापित करें\n"
        "• सरकारी एजेंसियाँ फोन पर पैसे नहीं माँगतीं\n"
        "• संदेह होने पर **1930** पर कॉल करें\n\n"
        "सुरक्षित रहें!"
    ),
}

MEDIUM_RISK_RESPONSES = {
    "en": (
        "[MEDIUM_RISK] 🟡 **Proceed with caution.** This situation has some concerning elements.\n\n"
        "Before doing anything:\n"
        "• Do NOT make any payment yet\n"
        "• Independently verify the caller's identity — call the official organisation directly\n"
        "• Ask for written communication via official email or registered post\n"
        "• Discuss with a trusted family member or friend\n"
        "• If still unsure, call **National Cyber Helpline: 1930**\n\n"
        "Legitimate organisations will always give you time to verify."
    ),
    "hi": (
        "[MEDIUM_RISK] 🟡 **सावधानी बरतें।** इस स्थिति में कुछ संदिग्ध पहलू हैं।\n\n"
        "कुछ भी करने से पहले:\n"
        "• कोई भुगतान न करें\n"
        "• कॉलर की पहचान स्वतंत्र रूप से सत्यापित करें\n"
        "• आधिकारिक ईमेल या पंजीकृत डाक पर लिखित संचार माँगें\n"
        "• किसी विश्वसनीय परिवार के सदस्य से बात करें\n"
        "• संदेह होने पर **1930** पर कॉल करें"
    ),
}


class FraudBotLLM:
    """
    Multilingual conversational fraud risk assessor.
    Priority fallback chain:
      1. Mistral-7B / Gemma-2b via Ollama (local, fully offline)
      2. Llama3-8b-8192 via Groq Cloud API (free tier, requires GROQ_API_KEY)
      3. StructuredFraudAssessor (4-step rule engine, 100% offline)
    """

    def __init__(self):
        self.ollama_available = False
        self.groq_available = False
        self.model_name = None
        self.model_type = "rule_based"
        self.mode = "unavailable"          # «« spec §2.2: explicit mode attribute
        self.active_model = None           # «« spec §2.2: active model name
        self._try_connect_ollama()
        if not self.ollama_available:
            self._try_connect_groq()

        # Set the clean mode/active_model after connection attempts
        if self.ollama_available:
            self.mode = "ollama"
            self.active_model = self.model_name
        elif self.groq_available:
            self.mode = "groq"
            self.active_model = self.model_name
        else:
            self.mode = "unavailable"
            self.active_model = None

    # ──────────────────────────────────────────────────────────────────────────
    # Connection setup
    # ──────────────────────────────────────────────────────────────────────────

    def _try_connect_ollama(self):
        """Check if Ollama is running and has the required model."""
        ollama_host   = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        primary_model = os.getenv("OLLAMA_MODEL", "mistral")
        fallback_model = os.getenv("OLLAMA_FALLBACK_MODEL", "gemma:2b")

        try:
            import ollama
            client = ollama.Client(host=ollama_host)
            available_models = [m.model for m in client.list().models]

            if primary_model in available_models or any(primary_model in m for m in available_models):
                self.model_name = primary_model
            elif fallback_model in available_models or any(fallback_model in m for m in available_models):
                self.model_name = fallback_model
                logger.info("[FraudBot] Primary Ollama model not found. Using fallback: %s", fallback_model)

            if self.model_name:
                self.ollama_available = True
                self.model_type = "ollama_llm"
                self.ollama_client = client
                logger.info("[FraudBot] ✅ Ollama connected. Model: %s", self.model_name)
            else:
                logger.info(
                    "[FraudBot] Ollama running but no supported models found. "
                    "Run: ollama pull mistral"
                )
        except Exception as e:
            logger.info("[FraudBot] Ollama not available (%s).", type(e).__name__)

    def _try_connect_groq(self):
        """Check if a Groq API key is configured and the groq library is installed."""
        groq_api_key = os.getenv("GROQ_API_KEY", "").strip()

        if not groq_api_key:
            logger.info("[FraudBot] GROQ_API_KEY not set. Skipping Groq fallback.")
            return

        try:
            from groq import Groq
            # Do a lightweight connectivity check
            client = Groq(api_key=groq_api_key)
            # Test with a minimal prompt to validate the key
            test = client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[{"role": "user", "content": "Hi"}],
                max_tokens=5,
            )
            if test.choices:
                self.groq_client = client
                self.groq_available = True
                self.model_type = "groq_llm"
                self.model_name = "llama3-8b-8192"
                logger.info("[FraudBot] ✅ Groq Cloud connected. Model: llama3-8b-8192")
        except ImportError:
            logger.info("[FraudBot] groq package not installed. Run: pip install groq")
        except Exception as e:
            logger.warning("[FraudBot] Groq connection failed (%s). Using rule-based fallback.", type(e).__name__)

    # ──────────────────────────────────────────────────────────────────────────
    # Public interface
    # ──────────────────────────────────────────────────────────────────────────

    def get_status(self) -> dict:
        """
        Returns the current operational status of the LLM backend.
        Called by the /health endpoint and the /api/fraudbot/status route.
        """
        return {
            "mode": self.mode,             # "groq" | "ollama" | "unavailable"
            "model": self.active_model,    # model name string or None
            "available": self.mode != "unavailable",
        }

    def detect_language(self, text: str) -> str:
        """Detect language code from text. Returns 'en' on failure."""
        try:
            from langdetect import detect
            detected = detect(text)
            return detected if detected in LANGUAGE_MAP else "en"
        except Exception:
            return "en"

    def chat(self, message: str, history: list, language: str) -> dict:
        """
        Process a user message and return bot response.
        Returns:
            {
                response: str,
                risk_level: 'HIGH' | 'MEDIUM' | 'LOW' | None,
                show_report_button: bool,
                helpline: '1930',
                model_type: str,
            }
        """
        if self.ollama_available:
            return self._run_ollama(message, history, language)
        elif self.groq_available:
            return self._run_groq(message, history, language)
        else:
            return self._run_rule_based(message, history, language)

    # ──────────────────────────────────────────────────────────────────────────
    # Ollama / local LLM path
    # ──────────────────────────────────────────────────────────────────────────

    def _run_ollama(self, message: str, history: list, language: str) -> dict:
        """Send conversation to Ollama and parse response."""
        try:
            language_name = LANGUAGE_MAP.get(language, "English")
            system_prompt = SYSTEM_PROMPT_TEMPLATE.format(language=language_name)

            messages = [{"role": "system", "content": system_prompt}]
            for turn in history:
                messages.append({"role": turn["role"], "content": turn["content"]})
            messages.append({"role": "user", "content": message})

            response = self.ollama_client.chat(
                model=self.model_name,
                messages=messages,
            )
            raw_text = response.message.content
            return self._parse_response(raw_text)

        except Exception as e:
            logger.error("[FraudBot] Ollama inference error: %s", e)
            # Graceful degradation: try Groq, then rule-based
            if self.groq_available:
                logger.info("[FraudBot] Falling back to Groq after Ollama error.")
                return self._run_groq(message, history, language)
            return self._run_rule_based(message, history, language)

    # ──────────────────────────────────────────────────────────────────────────
    # Groq Cloud LLM path
    # ──────────────────────────────────────────────────────────────────────────

    def _run_groq(self, message: str, history: list, language: str) -> dict:
        """Send conversation to Groq Cloud API and parse response."""
        try:
            language_name = LANGUAGE_MAP.get(language, "English")
            system_prompt = SYSTEM_PROMPT_TEMPLATE.format(language=language_name)

            messages = [{"role": "system", "content": system_prompt}]
            for turn in history:
                messages.append({"role": turn["role"], "content": turn["content"]})
            messages.append({"role": "user", "content": message})

            response = self.groq_client.chat.completions.create(
                model="llama3-8b-8192",
                messages=messages,
                temperature=0.3,
                max_tokens=800,
            )
            raw_text = response.choices[0].message.content
            return self._parse_response(raw_text)

        except Exception as e:
            logger.error("[FraudBot] Groq inference error: %s", e)
            # Final graceful degradation to rule-based
            logger.info("[FraudBot] Falling back to rule-based after Groq error.")
            return self._run_rule_based(message, history, language)

    # ──────────────────────────────────────────────────────────────────────────
    # StructuredFraudAssessor (rule-based 4-step fallback)
    # ──────────────────────────────────────────────────────────────────────────

    def _run_rule_based(self, message: str, history: list, language: str) -> dict:
        """
        4-step structured fraud assessment state machine.
        Determines which step we're on based on history length,
        asks the appropriate question, and on step 4 performs risk assessment.
        """
        lang = language if language in STEP_QUESTIONS else "en"
        questions = STEP_QUESTIONS[lang]

        # Count how many bot turns there have been (= current step)
        bot_turns = sum(1 for h in history if h["role"] == "assistant")
        current_step = bot_turns + 1  # 1-indexed: 1=greeting, 2-4=questions, 5=verdict

        # Collect all user answers from history
        user_answers = [h["content"] for h in history if h["role"] == "user"]
        if message:
            user_answers.append(message)

        if current_step == 1:
            response_text = questions[1]
            risk_level = None

        elif current_step == 2:
            response_text = questions[2]
            risk_level = None

        elif current_step == 3:
            response_text = questions[3]
            risk_level = None

        elif current_step == 4:
            response_text = questions[4]
            risk_level = None

        else:
            # Step 5+: Assess risk from all collected answers
            full_context = " ".join(user_answers).lower()
            risk_level, response_text = self._assess_risk(full_context, lang)

        return self._parse_response(response_text, override_risk=risk_level)

    def _assess_risk(self, full_context: str, lang: str) -> tuple[str, str]:
        """
        Apply risk heuristics to the full conversation context.
        Returns (risk_level, response_text).
        """
        HIGH_SIGNALS = [
            "cbi", "ed", "enforcement directorate", "police", "arrest",
            "warrant", "digital arrest", "court", "customs", "ncb",
            "narcotics", "rbi", "trai", "suspended", "frozen", "blocked",
            "money transfer", "upi", "otp", "aadhaar", "transfer money",
            "send money", "pay", "payment", "secret", "don't tell", "secrecy",
            "immediate", "urgent", "within hours", "account freeze",
        ]

        MEDIUM_SIGNALS = [
            "delivery", "courier", "package", "parcel",
            "prize", "winner", "lottery", "job offer",
            "investment", "return", "profit", "earn",
        ]

        low_signals = ["friend", "relative", "family", "known person", "colleague"]

        high_count   = sum(1 for s in HIGH_SIGNALS   if s in full_context)
        medium_count = sum(1 for s in MEDIUM_SIGNALS if s in full_context)

        if high_count >= 2 or (high_count >= 1 and medium_count >= 1):
            risk_level    = "HIGH"
            response_text = HIGH_RISK_RESPONSES.get(lang, HIGH_RISK_RESPONSES["en"])
        elif medium_count >= 2 or high_count == 1:
            risk_level    = "MEDIUM"
            response_text = MEDIUM_RISK_RESPONSES.get(lang, MEDIUM_RISK_RESPONSES["en"])
        else:
            risk_level    = "LOW"
            response_text = LOW_RISK_RESPONSES.get(lang, LOW_RISK_RESPONSES["en"])

        return risk_level, response_text

    # ──────────────────────────────────────────────────────────────────────────
    # Shared response parser
    # ──────────────────────────────────────────────────────────────────────────

    def _parse_response(self, raw_text: str, override_risk: Optional[str] = None) -> dict:
        """Parse risk tags from response text and build final response dict."""
        risk_level = override_risk
        clean_text = raw_text

        if override_risk is None:
            for tag in ["[HIGH_RISK]", "[MEDIUM_RISK]", "[LOW_RISK]"]:
                if tag in raw_text:
                    risk_level = tag.strip("[]").replace("_RISK", "")
                    clean_text = raw_text.replace(tag, "").strip()
                    break

        return {
            "response": clean_text,
            "risk_level": risk_level,
            "show_report_button": risk_level == "HIGH",
            "helpline": "1930",
            "model_type": self.model_type,
        }
