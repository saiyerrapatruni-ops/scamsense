# ScamSense — Machine Learning Scam & Phishing Detection

**ScamSense** is an educational scam and phishing detection web application. The detection engine has been upgraded from fixed JavaScript heuristics to **genuine machine-learning models trained on official benchmark datasets from the UCI Machine Learning Repository**.

---

## 1. Datasets & Model Architectures

### A. Message Scam / Spam Detection Model
* **Dataset:** [UCI SMS Spam Collection Dataset](https://archive.ics.uci.edu/dataset/228/sms+spam+collection) (Almeida et al.)
* **Total Instances:** 5,574 labeled mobile text messages (747 spam, 4,827 ham).
* **Train / Test Split:** Stratified 80% train (4,459 messages) / 20% test (1,115 messages).
* **Feature Extraction:** Sublinear TF-IDF n-gram vectorization ($n$-grams: $(1, 2)$, max 5,000 features, English stop words removed).
* **Classifier:** Logistic Regression with balanced class weighting (`class_weight='balanced'`, $C=2.0$, L-BFGS solver).
* **Explainability:** Nonzero TF-IDF terms are weighted by model coefficients ($\text{TF-IDF} \times w_i$) to surface the top statistical scam trigger words in real time.

### B. URL Phishing Detection Model
* **Dataset:** [UCI PhiUSIIL Phishing URL Dataset](https://archive.ics.uci.edu/dataset/967/phiusiil+phishing+url+dataset) (Prasad & Chandra)
* **Total Instances:** 20,000 balanced URLs (10,000 phishing, 10,000 legitimate).
* **Train / Test Split:** Stratified 80% train (16,000 URLs) / 20% test (4,000 URLs).
* **Feature Extraction:** 17 structural, lexical, and security indicators extracted from the raw URL:
  1. `url_length`: Overall character length.
  2. `domain_length`: Hostname length.
  3. `is_ip`: 1 if hostname is a raw IPv4/IPv6 address, 0 otherwise.
  4. `count_dots`: Number of periods in URL.
  5. `count_hyphens`: Number of hyphens in URL.
  6. `count_at`: Presence of `@` symbol (URL redirection/credential trick).
  7. `count_slashes`: Directory depth count.
  8. `count_digits`: Numeric characters count.
  9. `digit_ratio`: Density of numeric characters.
  10. `has_https`: SSL/TLS protocol presence.
  11. `suspicious_tld`: Detection of high-risk TLDs (`.xyz`, `.top`, `.tk`, `.ml`, `.buzz`, `.fit`, `.work`, etc.).
  12. `has_sensitive_keyword`: Credential words (`login`, `signin`, `verify`, `account`, `banking`, `security`, `wallet`).
  13. `brand_in_subdomain`: Known brands spoofed in subdomains (`paypal`, `google`, `apple`, `amazon`, `sbi`, etc.).
  14. `entropy`: Shannon character entropy of the URL string.
  15. `subdomain_count`: Nested subdomain hierarchy count.
  16. `double_slash_path`: `//` inside path (redirection bypass).
  17. `has_punycode`: `xn--` domain prefix (homograph attacks).
* **Classifier:** Random Forest Classifier (100 estimators, max depth 16).
* **Explainability:** Feature values are converted into human-readable security warning signs detailing why the URL triggered risk indicators.

---

## 2. Actual Evaluation Metrics (Held-Out Test Splits)

> [!NOTE]
> All metrics below were computed on unseen, held-out test splits (20% stratified test set). No scores are invented or fabricated.

### Message Detection Model (Held-Out Test Set: 1,115 SMS)

| Metric | Logistic Regression (Balanced) | Multinomial Naive Bayes |
| :--- | :---: | :---: |
| **Accuracy** | **97.94%** | **98.65%** |
| **Precision (Spam)** | **90.91%** | **98.55%** |
| **Recall (Spam)** | **93.96%** | **91.28%** |
| **F1-Score** | **92.41%** | **94.77%** |

#### Test Confusion Matrix (1,115 messages)
* **True Negatives (Legitimate Ham):** 952
* **False Positives (False Alerts):** 14
* **False Negatives (Missed Spam):** 9
* **True Positives (Caught Scams):** 140

---

### URL Phishing Model (Held-Out Test Set: 4,000 URLs)

| Metric | Random Forest (100 Trees) |
| :--- | :---: |
| **Accuracy** | **99.52%** |
| **Precision (Phishing)** | **99.85%** |
| **Recall (Phishing)** | **99.20%** |
| **F1-Score** | **99.52%** |

#### Test Confusion Matrix (4,000 URLs)
* **True Negatives (Legitimate URLs):** 1,997
* **False Positives (False Alerts):** 3
* **False Negatives (Missed Phishing):** 16
* **True Positives (Caught Phishing):** 1,984

#### Top 5 Most Influential Features
1. `has_https`: 53.40%
2. `count_slashes`: 19.63%
3. `digit_ratio`: 6.69%
4. `count_digits`: 5.62%
5. `url_length`: 4.54%

---

## 3. Quick Start & Training Guide

### Prerequisites
* Python 3.10+ (with pip)
* Node.js 18+ (with npm)

### Step 1: Install Python ML Dependencies
```bash
pip install -r backend/requirements.txt
```

### Step 2: Train Models on Official UCI Datasets
```bash
python backend/train.py
```
*Automatically downloads the UCI SMS Spam Collection and UCI PhiUSIIL datasets, extracts features, evaluates models on held-out test splits, and saves models and `metrics.json` to `backend/models/`.*

### Step 3: Start the FastAPI Inference Backend
```bash
python backend/main.py
```
*FastAPI starts on `http://127.0.0.1:8000` with interactive Swagger docs at `http://127.0.0.1:8000/docs`.*

### Step 4: Start the Frontend (Vite)
In a separate terminal:
```bash
npm install
npm run dev
```
*Open `http://localhost:5173` in your browser. Vite automatically proxies ML inference requests to `http://127.0.0.1:8000`.*

---

## 4. Architecture & Deployment (Vercel + Backend)

ScamSense is architected for clean separation between presentation and ML inference:

```
┌─────────────────────────────────┐          ┌───────────────────────────────────┐
│     Static React Frontend       │  HTTPS   │        FastAPI ML Backend         │
│  (Vite / React / Lucide UI)     │ ───────> │  (Python 3.12 / scikit-learn)     │
│  Hosted statically on Vercel    │          │  Hosted on Render / Railway / VPS │
└─────────────────────────────────┘          └───────────────────────────────────┘
                 │                                             │
                 ▼                                             ▼
       Local Heuristic Fallback                     UCI SMS & PhiUSIIL Models
       (if backend unreachable)                     (TF-IDF + LR & Random Forest)
```

> [!IMPORTANT]
> **Client-Server Architecture Clarification:**
> The frontend user interface is static and can be deployed directly to static hosts like **Vercel** or **Cloudflare Pages**.
> However, because predictions are generated by Python machine learning models (`scikit-learn`), **the application as a whole is NOT fully static once connected to the FastAPI backend**. The FastAPI backend must be hosted separately on a Python runtime service (such as Render, Railway, Fly.io, or any VPS) and configured via the frontend environment variable `VITE_ML_API_URL`.
> If the backend is offline or disconnected, ScamSense gracefully falls back to its client-side heuristic engine.

### Connecting Vercel Frontend to Cloud Backend
In your Vercel Project Settings > Environment Variables:
```env
VITE_ML_API_URL=https://your-scamsense-api.onrender.com
```

---

## 5. Security & Safety Principles

1. **Probabilistic Risk Estimates:** Machine learning model predictions are statistical estimations based on historical training patterns, **not 100% guarantees**. Scammers continually invent zero-day evasion techniques.
2. **No Automatic URL Opening:** Submitted URLs are strictly parsed as string data. ScamSense **never automatically navigates to, loads, or clicks** any user-submitted link.
3. **Local Privacy:** Content analyzed on the local FastAPI backend stays within your environment.

---

## 6. Project File Layout

```
scam-msg/
├── backend/
│   ├── train.py                # UCI dataset download, training, and evaluation script
│   ├── main.py                 # FastAPI inference server & metrics API
│   ├── url_features.py         # 17-feature URL extractor & explainability engine
│   ├── requirements.txt        # Python dependencies (fastapi, scikit-learn, joblib, etc.)
│   ├── models/                 # Saved joblib models and metrics.json
│   │   ├── message_model.joblib
│   │   ├── message_vectorizer.joblib
│   │   ├── url_model.joblib
│   │   └── metrics.json
│   └── data/                   # Cached UCI datasets
├── src/
│   ├── components/
│   │   ├── ModelMetricsModal.jsx # Real dataset evaluation & confusion matrix viewer
│   │   ├── VerdictResult.jsx   # Verdict card with ML confidence, badges & safety notes
│   │   ├── ScannerInput.jsx    # Input component for Message, URL, and Image
│   │   └── ...
│   ├── services/
│   │   ├── mlService.js        # Frontend connector to FastAPI ML backend
│   │   └── apiService.js       # Scan history and visitor tracking
│   ├── engine/
│   │   └── ruleEngine.js       # Local heuristic fallback engine
│   ├── App.jsx
│   └── index.css
├── package.json
├── vite.config.js              # Vite server with proxy to FastAPI backend (:8000)
└── README.md
```
