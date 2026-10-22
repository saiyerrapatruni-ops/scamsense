# backend/main.py
"""
ScamSense FastAPI Inference Backend
Provides real-time machine learning predictions for:
1. Messages: TF-IDF + Logistic Regression trained on UCI SMS Spam Collection
2. URLs: Structural/lexical feature extraction + Random Forest trained on UCI PhiUSIIL Phishing Dataset
3. Genuine Model Metrics: Exposes actual precision, recall, F1, accuracy, and confusion matrix
"""

import os
import json
import joblib
from datetime import datetime
from typing import Optional, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from url_features import extract_url_features, explain_url_prediction, FEATURE_NAMES

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'models')

app = FastAPI(
    title="ScamSense ML Detection Engine",
    description="Machine-learning scam & phishing detection powered by models trained on official UCI datasets.",
    version="2.0.0"
)

# Enable CORS for static frontend (Vercel, localhost:5173, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model references
message_model = None
message_vectorizer = None
url_model = None
metrics_cache = None


def load_artifacts():
    """Loads trained joblib models and metrics from disk."""
    global message_model, message_vectorizer, url_model, metrics_cache
    
    msg_model_path = os.path.join(MODELS_DIR, 'message_model.joblib')
    vec_path = os.path.join(MODELS_DIR, 'message_vectorizer.joblib')
    url_model_path = os.path.join(MODELS_DIR, 'url_model.joblib')
    metrics_path = os.path.join(MODELS_DIR, 'metrics.json')

    if os.path.exists(msg_model_path) and os.path.exists(vec_path):
        message_model = joblib.load(msg_model_path)
        message_vectorizer = joblib.load(vec_path)
        print("[+] Loaded message model & TF-IDF vectorizer.")
    else:
        print("[!] Message model files not found. Run `python backend/train.py` first.")

    if os.path.exists(url_model_path):
        url_model = joblib.load(url_model_path)
        print("[+] Loaded URL phishing Random Forest model.")
    else:
        print("[!] URL model file not found. Run `python backend/train.py` first.")

    if os.path.exists(metrics_path):
        with open(metrics_path, 'r', encoding='utf-8') as f:
            metrics_cache = json.load(f)
        print("[+] Loaded genuine model evaluation metrics.")


# Load artifacts on server startup
@app.on_event("startup")
def startup_event():
    load_artifacts()


# -------------------------------------------------------------
# Pydantic Request / Response Schemas
# -------------------------------------------------------------
class MessageScanRequest(BaseModel):
    text: str = Field(..., description="Message text content to analyze")


class UrlScanRequest(BaseModel):
    url: str = Field(..., description="Website URL or domain to evaluate")


class WarningSign(BaseModel):
    id: str
    title: str
    category: str
    weight: int
    description: str
    matchedWords: Optional[List[str]] = []


class ScanResultResponse(BaseModel):
    riskScore: int
    riskLevel: str
    verdictStatus: str
    category: str
    warningSigns: List[WarningSign]
    explanation: str
    recommendation: str
    verdictSummary: str
    submittedText: str
    scanType: str
    analyzedAt: str
    modelInfo: dict


# -------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------
@app.get("/api/health")
def health_check():
    """Health check endpoint indicating model loading status."""
    return {
        "status": "online",
        "service": "ScamSense FastAPI ML Inference Engine",
        "message_model_ready": message_model is not None and message_vectorizer is not None,
        "url_model_ready": url_model is not None,
        "metrics_ready": metrics_cache is not None,
        "server_time": datetime.utcnow().isoformat() + "Z"
    }


@app.get("/api/model/metrics")
def get_metrics():
    """Returns genuine, non-fabricated training and evaluation metrics from UCI datasets."""
    if not metrics_cache:
        metrics_path = os.path.join(MODELS_DIR, 'metrics.json')
        if os.path.exists(metrics_path):
            with open(metrics_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        raise HTTPException(status_code=503, detail="Metrics not available. Run `python backend/train.py` first.")
    return metrics_cache


@app.post("/api/predict/message", response_model=ScanResultResponse)
def predict_message(req: MessageScanRequest):
    """
    Analyzes submitted message text using the trained TF-IDF + Logistic Regression model.
    Returns calibrated risk score, verdict, and explainable feature contributions.
    """
    clean_text = (req.text or "").strip()
    if not clean_text:
        raise HTTPException(status_code=400, detail="Empty text submitted.")

    if not message_model or not message_vectorizer:
        raise HTTPException(status_code=503, detail="Message model is not loaded. Run `python backend/train.py`.")

    # 1. Transform text via TF-IDF vectorizer
    X_vec = message_vectorizer.transform([clean_text])
    
    # 2. Predict probability
    probs = message_model.predict_proba(X_vec)[0]
    p_ham = float(probs[0])
    p_spam = float(probs[1])

    # 3. Identify influential words via logistic regression coefficients
    feature_names = message_vectorizer.get_feature_names_out()
    non_zero_indices = X_vec.nonzero()[1]
    
    coefs = message_model.coef_[0]
    word_contributions = []
    for idx in non_zero_indices:
        word = feature_names[idx]
        tfidf_val = X_vec[0, idx]
        # Weight contribution = tfidf * coefficient
        contrib = tfidf_val * coefs[idx]
        word_contributions.append((word, contrib))

    # Sort by contribution to spam (positive = spam indicator, negative = ham indicator)
    word_contributions.sort(key=lambda x: x[1], reverse=True)
    spam_signals = [w for w, c in word_contributions if c > 0][:5]
    ham_signals = [w for w, c in word_contributions if c < 0][-3:]

    # 4. Calibrate risk score (0 - 100)
    risk_score = int(round(p_spam * 100))
    risk_score = max(0, min(100, risk_score))

    # 5. Classify level
    warning_signs = []
    
    if p_spam >= 0.50:
        risk_level = "Likely Scam"
        verdict_status = "LIKELY_SCAM"
        category = "Spam / Scam Message (UCI Trained ML Model)"
        verdict_summary = f"Classified as Scam (ML Model Spam Probability: {p_spam * 100:.1f}%)"
        explanation = (
            f"Our text classification model (trained on the UCI SMS Spam Collection) identified this message as likely fraudulent "
            f"with a {p_spam * 100:.1f}% spam probability. "
            f"{f'Key terms driving this prediction include: {', '.join(spam_signals)}.' if spam_signals else ''} "
            f"The message strongly aligns with patterns typical of financial fraud, urgent notices, or prize scams."
        )
        recommendation = "Do not reply, send money, or provide one-time passwords (OTPs). Verify any claims directly through official channels."
    elif p_spam >= 0.25:
        risk_level = "Suspicious"
        verdict_status = "SUSPICIOUS"
        category = "Suspicious Communication (UCI Trained ML Model)"
        verdict_summary = f"Flagged as Suspicious (ML Model Spam Probability: {p_spam * 100:.1f}%)"
        explanation = (
            f"Our machine-learning model detected borderline characteristics with a {p_spam * 100:.1f}% spam probability. "
            f"While not an outright confirmed scam, it contains wording commonly seen in unsolicited promotional or deceptive messages."
        )
        recommendation = "Exercise caution. Confirm the sender's identity through an independent, verified contact method before interacting."
    else:
        risk_level = "Safe"
        verdict_status = "SAFE"
        category = "Legitimate Message (UCI Trained ML Model)"
        verdict_summary = f"Appears Safe (ML Model Legitimate Probability: {p_ham * 100:.1f}%)"
        explanation = (
            f"Our model analyzed the text structure and vocabulary against genuine communications in the UCI SMS dataset. "
            f"It determined a {p_ham * 100:.1f}% likelihood of being normal, benign communication with no typical scam signatures."
        )
        recommendation = "No prominent scam patterns detected. Always maintain standard digital awareness."

    # Construct warning signs for explainability
    if spam_signals:
        warning_signs.append(WarningSign(
            id="ml_scam_keywords",
            title="Statistical Scam Signals (UCI SMS Trained Model)",
            category="TF-IDF Vocabulary Weight",
            weight=int(min(45, risk_score * 0.5)),
            description="The machine learning model identified these specific terms as having strong historical correlation with fraudulent SMS messages.",
            matchedWords=spam_signals
        ))

    warning_signs.append(WarningSign(
        id="ml_prob_breakdown",
        title=f"Statistical Model Probability: {p_spam * 100:.1f}% Scam / {p_ham * 100:.1f}% Benign",
        category="Model Confidence",
        weight=0,
        description="Evaluated using Logistic Regression with balanced class weighting on 5,000 TF-IDF n-gram features.",
        matchedWords=[f"{risk_score}/100 Risk Score"]
    ))

    # Add safety notice warning sign
    warning_signs.append(WarningSign(
        id="ml_safety_disclaimer",
        title="Safety Notice: Predictions Are Probabilistic",
        category="Model Limitations",
        weight=0,
        description="Machine learning predictions reflect statistical similarities to historical training data, not absolute guarantees. Attackers continuously alter text to evade filters. Always verify independently.",
        matchedWords=[]
    ))

    return ScanResultResponse(
        riskScore=risk_score,
        riskLevel=risk_level,
        verdictStatus=verdict_status,
        category=category,
        warningSigns=warning_signs,
        explanation=explanation,
        recommendation=recommendation,
        verdictSummary=verdict_summary,
        submittedText=clean_text,
        scanType="message",
        analyzedAt=datetime.utcnow().isoformat() + "Z",
        modelInfo={
            "model": "TF-IDF + Logistic Regression",
            "dataset": "UCI SMS Spam Collection",
            "spamProbability": round(p_spam, 4),
            "hamProbability": round(p_ham, 4)
        }
    )


@app.post("/api/predict/url", response_model=ScanResultResponse)
def predict_url(req: UrlScanRequest):
    """
    Analyzes submitted URL using the trained Random Forest classifier.
    Extracts 17 structural and lexical features and returns explainable warning signs.
    """
    clean_url = (req.url or "").strip()
    if not clean_url:
        raise HTTPException(status_code=400, detail="Empty URL submitted.")

    if not url_model:
        raise HTTPException(status_code=503, detail="URL model is not loaded. Run `python backend/train.py`.")

    # Plain text check (insufficient evidence / not a URL)
    if ' ' in clean_url or ('.' not in clean_url and not clean_url.startswith(('http://', 'https://'))):
        return ScanResultResponse(
            riskScore=0,
            riskLevel="Not Applicable",
            verdictStatus="NOT_APPLICABLE",
            category="Not Applicable (Plain Text in URL Tab)",
            warningSigns=[
                WarningSign(
                    id="url_not_a_link",
                    title="Plain Text Detected in URL Scanner",
                    category="Input Format",
                    weight=0,
                    description=f"The input '{clean_url}' appears to be a plain text message rather than a web link. Please switch to the Message / Text tab to scan messages.",
                    matchedWords=[clean_url]
                )
            ],
            explanation="The submitted input is plain conversational text rather than a valid website address.",
            recommendation="Please switch to the Message / Text tab for message analysis.",
            verdictSummary="Input is plain text rather than a website link",
            submittedText=clean_url,
            scanType="url",
            analyzedAt=datetime.utcnow().isoformat() + "Z",
            modelInfo={"model": "N/A", "dataset": "N/A"}
        )

    # 1. Extract 17 structural/lexical features
    features = extract_url_features(clean_url)

    # 2. Predict with Random Forest model
    probs = url_model.predict_proba([features])[0]
    p_legit = float(probs[0])
    p_phish = float(probs[1])

    # 3. Calibrate risk score
    risk_score = int(round(p_phish * 100))
    risk_score = max(0, min(100, risk_score))

    # 4. Generate structured warning signs from feature extraction
    warning_signs_raw = explain_url_prediction(clean_url, p_phish)
    warning_signs = [WarningSign(**ws) for ws in warning_signs_raw]

    # Model probability badge
    warning_signs.insert(0, WarningSign(
        id="url_ml_confidence",
        title=f"Random Forest ML Evaluation: {p_phish * 100:.1f}% Phishing Probability",
        category="Model Confidence",
        weight=0,
        description="Evaluated across 17 structural, lexical, and security indicators against the UCI PhiUSIIL dataset.",
        matchedWords=[f"{risk_score}/100 Risk Score"]
    ))

    # Safety notice (CRITICAL: model predictions are not guarantees, do NOT open URLs)
    warning_signs.append(WarningSign(
        id="url_safety_guarantee_notice",
        title="Safety Warning: Never Click or Auto-Open Suspicious Links",
        category="Security Safety",
        weight=0,
        description="Machine learning predictions evaluate structural patterns and probabilities, but are NOT 100% guarantees. For security, ScamSense never automatically navigates to submitted URLs.",
        matchedWords=[]
    ))

    if p_phish >= 0.50:
        risk_level = "Likely Scam"
        verdict_status = "LIKELY_SCAM"
        category = "Phishing Website (UCI Trained ML Model)"
        verdict_summary = f"Likely Phishing (ML Model Phishing Probability: {p_phish * 100:.1f}%)"
        explanation = (
            f"Our Random Forest classifier (trained on the UCI PhiUSIIL Phishing URL Dataset) determined this link has a "
            f"{p_phish * 100:.1f}% probability of being a phishing destination. "
            f"The URL exhibits structural red flags typical of credential harvesting and identity fraud."
        )
        recommendation = "DO NOT open this link or enter passwords, credit cards, or personal credentials. Close any open tabs related to this site."
    elif p_phish >= 0.25:
        risk_level = "Suspicious"
        verdict_status = "SUSPICIOUS"
        category = "Suspicious Link (UCI Trained ML Model)"
        verdict_summary = f"Suspicious Link (ML Model Phishing Probability: {p_phish * 100:.1f}%)"
        explanation = (
            f"The URL shows mixed indicators ({p_phish * 100:.1f}% phishing probability). "
            f"While not definitively confirmed malicious, its structural characteristics warrant caution."
        )
        recommendation = "Verify the destination by navigating directly to the official homepage rather than using this link."
    else:
        risk_level = "Safe"
        verdict_status = "SAFE"
        category = "Legitimate Domain (UCI Trained ML Model)"
        verdict_summary = f"Appears Legitimate (ML Model Legitimate Probability: {p_legit * 100:.1f}%)"
        explanation = (
            f"Our model identified this web address as consistent with legitimate internet infrastructure "
            f"({p_legit * 100:.1f}% benign probability) with no high-risk structural anomalies detected."
        )
        recommendation = "No prominent phishing indicators found. Always confirm you are on the intended secure domain before logging in."

    return ScanResultResponse(
        riskScore=risk_score,
        riskLevel=risk_level,
        verdictStatus=verdict_status,
        category=category,
        warningSigns=warning_signs,
        explanation=explanation,
        recommendation=recommendation,
        verdictSummary=verdict_summary,
        submittedText=clean_url,
        scanType="url",
        analyzedAt=datetime.utcnow().isoformat() + "Z",
        modelInfo={
            "model": "RandomForestClassifier (17 Features)",
            "dataset": "UCI PhiUSIIL Phishing URL Dataset",
            "phishingProbability": round(p_phish, 4),
            "legitimateProbability": round(p_legit, 4)
        }
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"[*] Starting ScamSense FastAPI ML backend on http://127.0.0.1:{port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
