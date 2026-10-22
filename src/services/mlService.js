import { analyzeMessage, analyzeUrl } from '../engine/ruleEngine';

const CONFIGURED_ML_URL = import.meta.env.VITE_ML_API_URL || '';
const DIRECT_BACKEND_URL = 'http://127.0.0.1:8000';

async function requestWithFallback(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

  // 1. Try configured URL or proxy path
  try {
    const primaryUrl = CONFIGURED_ML_URL ? `${CONFIGURED_ML_URL}${path}` : path;
    const res = await fetch(primaryUrl, { ...options, headers });
    if (res.ok) return await res.json();
  } catch (err) {
    // Direct fallback
  }

  // 2. Direct fallback to localhost:8000
  if (!CONFIGURED_ML_URL) {
    try {
      const res = await fetch(`${DIRECT_BACKEND_URL}${path}`, { ...options, headers });
      if (res.ok) return await res.json();
    } catch (err) {
      // Backend offline
    }
  }

  return null;
}

export async function predictMessageML(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return analyzeMessage(trimmed);

  const mlResult = await requestWithFallback('/api/predict/message', {
    method: 'POST',
    body: JSON.stringify({ text: trimmed })
  });

  if (mlResult?.verdictStatus) {
    return {
      ...mlResult,
      engine: 'ml_model',
      isMlModel: true,
      modelBadge: 'UCI SMS Spam Trained Model (TF-IDF + Logistic Regression)'
    };
  }

  // Fallback to local heuristic engine
  const fallback = analyzeMessage(trimmed);
  return {
    ...fallback,
    engine: 'heuristic_fallback',
    isMlModel: false,
    modelBadge: 'Local Heuristic Analysis Engine'
  };
}

export async function predictUrlML(url) {
  const trimmed = (url || '').trim();
  if (!trimmed) return analyzeUrl(trimmed);

  const mlResult = await requestWithFallback('/api/predict/url', {
    method: 'POST',
    body: JSON.stringify({ url: trimmed })
  });

  if (mlResult?.verdictStatus) {
    return {
      ...mlResult,
      engine: 'ml_model',
      isMlModel: true,
      modelBadge: 'UCI PhiUSIIL Trained Model (Random Forest on 17 URL Features)'
    };
  }

  // Fallback to local heuristic engine
  const fallback = analyzeUrl(trimmed);
  return {
    ...fallback,
    engine: 'heuristic_fallback',
    isMlModel: false,
    modelBadge: 'Local Heuristic Analysis Engine'
  };
}
