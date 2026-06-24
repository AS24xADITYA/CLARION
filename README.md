# CLARION — AI-powered Digital Public Safety Platform

**CLARION Threat Intelligence & Public Safety**

> Defeating Counterfeiting, Fraud & Digital Arrest Scams

CLARION is a three-component AI platform that puts fraud detection in every Indian citizen's hands — for free, in 6 languages, offline-capable.

---

## Components

| Component | What It Does | Tech |
|---|---|---|
| **ScanShield** | Detects counterfeit ₹500 / ₹2000 notes via camera | EfficientNet-B0 + OpenCV |
| **ScamRadar** | Classifies digital arrest scam descriptions into 9 categories | DistilBERT + TF-IDF |
| **FraudBot** | Multilingual conversational fraud risk assessor | Mistral-7B via Ollama |

---

## Quick Start

### Step 1 — Backend

```bash
# In the CLARION root directory (not backend/)
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

# Navigate to backend and install
cd backend
pip install -r requirements.txt

# Copy env file
copy .env.example .env

# Start backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will be live at: http://localhost:8000  
API docs: http://localhost:8000/docs

### Step 2 — Frontend

```bash
# Navigate to frontend
cd frontend

# Install packages
npm install

# Start development server
npm run dev
```

Frontend will be live at: http://localhost:5173

### Step 3 — (Optional) Ollama for FraudBot LLM

```bash
# Install Ollama from https://ollama.ai/download
# Then pull the model (4.1 GB):
ollama pull mistral

# Keep this running in a separate terminal:
ollama serve
```

> Without Ollama, FraudBot uses the built-in 4-step rule-based assessor (fully functional for demo).

---

## Upgrading to Real AI Models (via Google Colab)

The app works without trained models using intelligent fallbacks. To upgrade to real AI:

### ScanShield (EfficientNet-B0)
1. Open `docs/colab/ScanShield_Training.ipynb` in Google Colab
2. Upload 20+ genuine ₹500/₹2000 note images (download from RBI website)
3. Run all cells — takes ~20 minutes on Colab GPU
4. Download `scan_efficientnet.h5` and place at `backend/saved_models/scan_efficientnet.h5`
5. Restart backend — logs will show `[ScanShield] Loaded EfficientNet model`

### ScamRadar (DistilBERT)
1. Open `docs/colab/ScamRadar_Training.ipynb` in Google Colab
2. Run all cells — training data is pre-included, no uploads needed
3. Download `scam_distilbert.zip` → extract to `backend/saved_models/scam_distilbert/`
4. Restart backend — logs will show `[ScamRadar] Loaded DistilBERT model`

---

## Project Structure

```
CLARION/
├── backend/
│   ├── main.py                    # FastAPI entry point
│   ├── requirements.txt
│   ├── .env
│   ├── api/
│   │   ├── routes_scan.py         # POST /api/scan
│   │   ├── routes_scam.py         # POST /api/scam/classify, GET /api/scam/patterns
│   │   └── routes_fraudbot.py     # POST /api/fraudbot/chat
│   ├── models/
│   │   ├── scan_model.py          # EfficientNet + OpenCV fallback
│   │   ├── scam_classifier.py     # DistilBERT + TF-IDF fallback
│   │   └── fraudbot_llm.py        # Ollama + rule-based fallback
│   ├── data/
│   │   ├── scam_patterns.json     # Full 8-pattern knowledge base
│   │   └── scam_training.json     # 1350+ labelled training samples
│   ├── db/
│   │   ├── database.py
│   │   └── models_db.py
│   └── saved_models/              # Place trained models here (gitignored)
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── ScanShield.jsx
│   │   │   ├── ScamRadar.jsx
│   │   │   ├── FraudBot.jsx
│   │   │   └── About.jsx
│   │   ├── components/            # 7 reusable components
│   │   └── services/api.js
│   └── package.json
└── docs/
    ├── colab/
    │   ├── ScanShield_Training.ipynb
    │   └── ScamRadar_Training.ipynb
    └── demo_script.md
```

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | System health + all service status |
| `/api/scan` | POST | Currency note scan (multipart image) |
| `/api/scam/classify` | POST | Scam text classification |
| `/api/scam/patterns` | GET | All 8 scam patterns |
| `/api/scam/stats` | GET | Detection statistics |
| `/api/fraudbot/chat` | POST | FraudBot conversation |

Interactive docs: http://localhost:8000/docs

---

## Emergency

**National Cyber Helpline: 1930** (Toll-free · 24×7)  
**Report portal: https://cybercrime.gov.in**

---

*All technology 100% free and open source. Build it. Demo it. Deploy it.*
