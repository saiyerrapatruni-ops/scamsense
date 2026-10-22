# backend/train.py
"""
ScamSense Machine Learning Training Pipeline
Trains genuine, production-ready machine learning models on official public datasets:
1. Message Spam/Scam Classification: UCI SMS Spam Collection dataset (TF-IDF + Logistic Regression / Naive Bayes)
2. URL Phishing Detection: UCI PhiUSIIL Phishing URL Dataset (Feature Extraction + Random Forest Classifier)

Saves trained models, vectorizers, and genuine evaluation metrics to `backend/models/`.
"""

import os
import io
import csv
import json
import time
import zipfile
import urllib.request
from datetime import datetime

import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    classification_report,
    confusion_matrix
)

from url_features import extract_url_features, FEATURE_NAMES

# Directory paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
MODELS_DIR = os.path.join(BASE_DIR, 'models')
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

# Dataset URLs (Official UCI Machine Learning Repository)
UCI_SMS_URL = 'https://archive.ics.uci.edu/static/public/228/sms+spam+collection.zip'
UCI_URL_DATASET_URL = 'https://archive.ics.uci.edu/static/public/967/phiusiil+phishing+url+dataset.zip'


def download_file_with_progress(url, dest_path, desc):
    """Downloads a file if not already present on disk."""
    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 1000:
        print(f"[*] Found cached {desc}: {dest_path}")
        return
    print(f"[*] Downloading {desc} from {url}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    with urllib.request.urlopen(req, timeout=45) as resp:
        with open(dest_path, 'wb') as out_f:
            while True:
                chunk = resp.read(64 * 1024)
                if not chunk:
                    break
                out_f.write(chunk)
    print(f"[+] Downloaded {desc} successfully ({os.path.getsize(dest_path)} bytes).")


# ---------------------------------------------------------------------
# 1. TRAIN MESSAGE DETECTION MODEL (UCI SMS SPAM COLLECTION)
# ---------------------------------------------------------------------
def train_message_model():
    print("\n" + "=" * 65)
    print(" 1. TRAINING MESSAGE SCAM/SPAM CLASSIFIER (UCI SMS DATASET)")
    print("=" * 65)

    zip_path = os.path.join(DATA_DIR, 'sms_spam_collection.zip')
    raw_sms_file = os.path.join(DATA_DIR, 'SMSSpamCollection')

    if not os.path.exists(raw_sms_file):
        download_file_with_progress(UCI_SMS_URL, zip_path, "UCI SMS Spam Collection")
        print("[*] Extracting SMS dataset...")
        with zipfile.ZipFile(zip_path, 'r') as z:
            z.extract('SMSSpamCollection', DATA_DIR)

    texts = []
    labels = []  # 1 for Spam/Scam, 0 for Ham (Legitimate)

    with open(raw_sms_file, 'r', encoding='latin-1') as f:
        for line in f:
            parts = line.strip().split('\t', 1)
            if len(parts) == 2:
                label_str = parts[0].strip().lower()
                text = parts[1].strip()
                labels.append(1 if label_str == 'spam' else 0)
                texts.append(text)

    total_samples = len(texts)
    spam_count = sum(labels)
    ham_count = total_samples - spam_count
    print(f"[+] Loaded {total_samples} messages ({spam_count} spam, {ham_count} ham).")

    # Stratified 80/20 train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.2, random_state=42, stratify=labels
    )
    print(f"[*] Training split: {len(X_train)} samples | Test split: {len(X_test)} samples")

    # TF-IDF Vectorization
    print("[*] Vectorizing text with TF-IDF (1-2 ngrams, stop words removal)...")
    vectorizer = TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 2),
        stop_words='english',
        sublinear_tf=True
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    # Train Logistic Regression (with balanced class weights)
    print("[*] Training Logistic Regression model...")
    lr_model = LogisticRegression(class_weight='balanced', max_iter=1000, C=2.0, random_state=42)
    lr_model.fit(X_train_vec, y_train)

    # Evaluate Logistic Regression
    y_pred = lr_model.predict(X_test_vec)
    acc = float(accuracy_score(y_test, y_pred))
    p, r, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='binary')
    cm = confusion_matrix(y_test, y_pred).tolist()

    # Also evaluate Multinomial Naive Bayes for comparison
    nb_model = MultinomialNB(alpha=0.1)
    nb_model.fit(X_train_vec, y_train)
    nb_pred = nb_model.predict(X_test_vec)
    nb_acc = float(accuracy_score(y_test, nb_pred))
    nb_p, nb_r, nb_f1, _ = precision_recall_fscore_support(y_test, nb_pred, average='binary')

    print("\n--- ACTUAL MESSAGE EVALUATION RESULTS ---")
    print(f"Logistic Regression: Accuracy = {acc * 100:.2f}%, Precision = {p * 100:.2f}%, Recall = {r * 100:.2f}%, F1 = {f1 * 100:.2f}%")
    print(f"Multinomial NB:      Accuracy = {nb_acc * 100:.2f}%, Precision = {nb_p * 100:.2f}%, Recall = {nb_r * 100:.2f}%, F1 = {nb_f1 * 100:.2f}%")
    print("\nClassification Report (Logistic Regression):")
    print(classification_report(y_test, y_pred, target_names=['Ham (Legitimate)', 'Spam (Scam)']))
    print(f"Confusion Matrix: TN={cm[0][0]}, FP={cm[0][1]}, FN={cm[1][0]}, TP={cm[1][1]}")

    # Save models
    model_file = os.path.join(MODELS_DIR, 'message_model.joblib')
    vec_file = os.path.join(MODELS_DIR, 'message_vectorizer.joblib')
    joblib.dump(lr_model, model_file)
    joblib.dump(vectorizer, vec_file)
    print(f"[+] Saved message model to {model_file}")
    print(f"[+] Saved TF-IDF vectorizer to {vec_file}")

    return {
        'model_type': 'TF-IDF + LogisticRegression (Balanced)',
        'dataset': 'UCI SMS Spam Collection (archive.ics.uci.edu/dataset/228)',
        'total_samples': total_samples,
        'train_samples': len(X_train),
        'test_samples': len(X_test),
        'spam_samples': spam_count,
        'ham_samples': ham_count,
        'accuracy': round(acc, 4),
        'precision': round(float(p), 4),
        'recall': round(float(r), 4),
        'f1_score': round(float(f1), 4),
        'confusion_matrix': {
            'true_negatives': cm[0][0],
            'false_positives': cm[0][1],
            'false_negatives': cm[1][0],
            'true_positives': cm[1][1]
        },
        'comparison_multinomial_nb': {
            'accuracy': round(nb_acc, 4),
            'precision': round(float(nb_p), 4),
            'recall': round(float(nb_r), 4),
            'f1_score': round(float(nb_f1), 4)
        }
    }


# ---------------------------------------------------------------------
# 2. TRAIN URL DETECTION MODEL (UCI PhiUSIIL PHISHING DATASET)
# ---------------------------------------------------------------------
def train_url_model():
    print("\n" + "=" * 65)
    print(" 2. TRAINING URL PHISHING CLASSIFIER (UCI PhiUSIIL DATASET)")
    print("=" * 65)

    zip_path = os.path.join(DATA_DIR, 'phiusiil_dataset.zip')
    cache_csv = os.path.join(DATA_DIR, 'phiusiil_sample_20k.csv')

    urls = []
    labels = []  # 1 for Phishing, 0 for Legitimate

    if os.path.exists(cache_csv):
        print(f"[*] Loading cached balanced dataset from {cache_csv}...")
        with open(cache_csv, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader)
            for row in reader:
                if len(row) >= 2:
                    urls.append(row[0])
                    labels.append(int(row[1]))
    else:
        download_file_with_progress(UCI_URL_DATASET_URL, zip_path, "UCI PhiUSIIL Phishing URL Dataset")
        print("[*] Extracting and balancing 20,000 URLs from PhiUSIIL (10,000 Phishing, 10,000 Legitimate)...")
        with zipfile.ZipFile(zip_path, 'r') as z:
            with z.open('PhiUSIIL_Phishing_URL_Dataset.csv') as f:
                reader = csv.reader(io.TextIOWrapper(f, 'utf-8', errors='ignore'))
                header = next(reader)
                url_idx = header.index('URL')
                label_idx = header.index('label')
                
                c0, c1 = 0, 0
                max_per_class = 10000
                for row in reader:
                    if not row or len(row) <= max(url_idx, label_idx):
                        continue
                    u = row[url_idx]
                    l = row[label_idx]
                    # In PhiUSIIL dataset: 0 = Phishing, 1 = Legitimate
                    if l == '0' and c0 < max_per_class:
                        urls.append(u)
                        labels.append(1)  # Target: 1 = Phishing
                        c0 += 1
                    elif l == '1' and c1 < max_per_class:
                        urls.append(u)
                        labels.append(0)  # Target: 0 = Legitimate
                        c1 += 1
                    if c0 >= max_per_class and c1 >= max_per_class:
                        break

        # Cache balanced sample for rapid re-training
        print(f"[*] Caching balanced sample of {len(urls)} URLs to {cache_csv}...")
        with open(cache_csv, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['url', 'is_phishing'])
            for u, l in zip(urls, labels):
                writer.writerow([u, l])

    total_samples = len(urls)
    phishing_count = sum(labels)
    legit_count = total_samples - phishing_count
    print(f"[+] Loaded {total_samples} URLs ({phishing_count} Phishing, {legit_count} Legitimate).")

    # Extract features
    print(f"[*] Extracting 17 lexical & structural features for each URL...")
    t0 = time.time()
    X = [extract_url_features(u) for u in urls]
    print(f"[+] Feature extraction completed in {time.time() - t0:.2f} seconds.")

    # Stratified 80/20 train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, labels, test_size=0.2, random_state=42, stratify=labels
    )
    print(f"[*] Training split: {len(X_train)} URLs | Test split: {len(X_test)} URLs")

    # Train Random Forest Classifier
    print("[*] Training Random Forest Classifier (100 estimators)...")
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=16,
        random_state=42,
        n_jobs=-1
    )
    rf_model.fit(X_train, y_train)

    # Evaluate on held-out test split
    y_pred = rf_model.predict(X_test)
    acc = float(accuracy_score(y_test, y_pred))
    p, r, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='binary')
    cm = confusion_matrix(y_test, y_pred).tolist()

    # Feature importances
    importances = rf_model.feature_importances_
    top_features = sorted(zip(FEATURE_NAMES, importances), key=lambda x: x[1], reverse=True)

    print("\n--- ACTUAL URL EVALUATION RESULTS ---")
    print(f"Random Forest URL Model: Accuracy = {acc * 100:.2f}%, Precision = {p * 100:.2f}%, Recall = {r * 100:.2f}%, F1 = {f1 * 100:.2f}%")
    print("\nClassification Report (Random Forest):")
    print(classification_report(y_test, y_pred, target_names=['Legitimate URL', 'Phishing URL']))
    print(f"Confusion Matrix: TN={cm[0][0]}, FP={cm[0][1]}, FN={cm[1][0]}, TP={cm[1][1]}")
    print("\nTop 5 Most Influential URL Features:")
    for feat, imp in top_features[:5]:
        print(f" - {feat:22s}: {imp * 100:.2f}%")

    # Save model
    model_file = os.path.join(MODELS_DIR, 'url_model.joblib')
    joblib.dump(rf_model, model_file)
    print(f"[+] Saved URL model to {model_file}")

    return {
        'model_type': 'RandomForestClassifier (100 trees, 17 features)',
        'dataset': 'UCI PhiUSIIL Phishing URL Dataset (archive.ics.uci.edu/dataset/967)',
        'total_samples': total_samples,
        'train_samples': len(X_train),
        'test_samples': len(X_test),
        'phishing_samples': phishing_count,
        'legitimate_samples': legit_count,
        'accuracy': round(acc, 4),
        'precision': round(float(p), 4),
        'recall': round(float(r), 4),
        'f1_score': round(float(f1), 4),
        'confusion_matrix': {
            'true_negatives': cm[0][0],
            'false_positives': cm[0][1],
            'false_negatives': cm[1][0],
            'true_positives': cm[1][1]
        },
        'feature_importances': {feat: round(float(imp), 4) for feat, imp in top_features}
    }


def main():
    print("=" * 65)
    print(" ScamSense Machine Learning Training Pipeline")
    print(" Training on Official UCI Datasets with Actual Metrics")
    print("=" * 65)

    start_time = time.time()
    msg_metrics = train_message_model()
    url_metrics = train_url_model()

    overall_metrics = {
        'training_timestamp': datetime.utcnow().isoformat() + 'Z',
        'pipeline_duration_seconds': round(time.time() - start_time, 2),
        'message_model': msg_metrics,
        'url_model': url_metrics
    }

    metrics_file = os.path.join(MODELS_DIR, 'metrics.json')
    with open(metrics_file, 'w', encoding='utf-8') as f:
        json.dump(overall_metrics, f, indent=2)

    print("\n" + "=" * 65)
    print(f" TRAINING COMPLETE in {time.time() - start_time:.2f} seconds!")
    print(f" Genuine metrics saved to: {metrics_file}")
    print("=" * 65)


if __name__ == '__main__':
    main()
