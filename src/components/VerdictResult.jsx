import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  ArrowDown,
  HelpCircle,
  Tag,
  CheckCheck,
  MessageSquare,
  Link2,
  Image as ImageIcon,
  CheckCircle,
  Cpu,
  AlertCircle
} from 'lucide-react';

function getVerdictInfo(result) {
  const { riskScore = 0, riskLevel = '', verdictStatus = '', category = '' } = result;

  const isNotApplicable =
    verdictStatus === 'NOT_APPLICABLE' ||
    riskLevel === 'Not Applicable' ||
    category?.toLowerCase().includes('not applicable');

  const isScam =
    !isNotApplicable &&
    (riskLevel === 'Likely Scam' ||
      verdictStatus === 'LIKELY_SCAM' ||
      verdictStatus === 'FAKE' ||
      riskScore >= 50);

  const isUnverified =
    !isNotApplicable &&
    (riskLevel === 'Unable to Verify' ||
      verdictStatus === 'UNABLE_TO_VERIFY' ||
      category === 'Insufficient Evidence');

  const isSuspicious =
    !isNotApplicable &&
    !isScam &&
    !isUnverified &&
    (riskLevel === 'Suspicious' ||
      verdictStatus === 'SUSPICIOUS' ||
      (riskScore >= 25 && riskScore < 50));

  if (isScam) {
    return {
      title: 'LIKELY SCAM',
      level: 'Likely Scam',
      badgeClass: 'verdict-danger',
      headlineClass: 'headline-fake',
      gaugeColor: '#ef4444',
      Icon: AlertOctagon,
      defaultSummary: `Our inspection found fraud signatures. Do not interact with this content.`
    };
  }

  if (isSuspicious) {
    return {
      title: 'SUSPICIOUS',
      level: 'Suspicious',
      badgeClass: 'verdict-warning',
      headlineClass: 'headline-unverified',
      gaugeColor: '#f59e0b',
      Icon: AlertTriangle,
      defaultSummary: `Contains suspicious indicators. Exercise caution and verify through official channels before acting.`
    };
  }

  if (isNotApplicable || isUnverified) {
    return {
      title: isNotApplicable ? 'NOT APPLICABLE' : 'UNABLE TO VERIFY',
      level: isNotApplicable ? 'Not Applicable' : 'Unable to Verify',
      badgeClass: 'verdict-verify',
      headlineClass: 'headline-unverified',
      gaugeColor: '#38bdf8',
      Icon: AlertTriangle,
      defaultSummary: `Evidence is insufficient to confirm authenticity or fraud. Verify directly before taking action.`
    };
  }

  return {
    title: 'SAFE',
    level: 'Safe',
    badgeClass: 'verdict-safe',
    headlineClass: 'headline-real',
    gaugeColor: '#10b981',
    Icon: CheckCircle,
    defaultSummary: `No scam patterns or red flags detected. Content appears standard and safe.`
  };
}

export function VerdictResult({ result, onLearnWhyClick }) {
  if (!result || !result.submittedText) return null;

  const {
    riskScore,
    category,
    warningSigns = [],
    explanation,
    recommendation,
    scanType,
    modelBadge,
    isMlModel,
    verdictSummary
  } = result;

  const verdict = getVerdictInfo(result);
  const VerdictIcon = verdict.Icon;
  const isSpecialScore = verdict.level === 'Unable to Verify' || verdict.level === 'Not Applicable';

  return (
    <div className="glass-panel verdict-result-card" id="verdict-result">
      {/* Banner */}
      <div className={`fake-real-headline ${verdict.headlineClass}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <VerdictIcon size={36} style={{ color: verdict.gaugeColor, flexShrink: 0 }} />
          <div>
            <h2 className="fake-real-verdict-text">{verdict.title}</h2>
            <p className="fake-real-subtext">{verdictSummary || verdict.defaultSummary}</p>
          </div>
        </div>

        <div className="scan-type-badge-pill" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {scanType === 'url' ? (
            <>
              <Link2 size={13} />
              <span>Website Link</span>
            </>
          ) : scanType === 'image' ? (
            <>
              <ImageIcon size={13} />
              <span>Image</span>
            </>
          ) : (
            <>
              <MessageSquare size={13} />
              <span>Message Text</span>
            </>
          )}
        </div>
      </div>

      {/* Score overview */}
      <div className={`verdict-top-banner ${verdict.badgeClass}`}>
        <div className="verdict-main-meta">
          <div className="verdict-level-pill">
            <span className="verdict-level-text">
              {isSpecialScore ? verdict.level : `${verdict.level} — ${riskScore}/100 Risk Score`}
            </span>
          </div>

          <div className="verdict-category-row">
            <Tag size={14} style={{ color: '#94a3b8' }} />
            <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Category:</span>
            <strong style={{ color: '#f8fafc', fontSize: '0.92rem' }}>{category}</strong>
          </div>

          {modelBadge && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.35rem', fontSize: '0.78rem', color: isMlModel ? '#38bdf8' : '#fbbf24' }}>
              <Cpu size={13} />
              <span>{modelBadge}</span>
            </div>
          )}
        </div>

        <div className="verdict-score-display">
          <span className="verdict-score-num" style={{ color: verdict.gaugeColor }}>
            {isSpecialScore ? '—' : riskScore}
          </span>
          <span className="verdict-score-denom">{isSpecialScore ? '' : '/100'}</span>
        </div>
      </div>

      <div className="verdict-body">
        {/* Warning Signs */}
        <div className="verdict-section">
          <h3 className="section-heading">
            <ShieldAlert size={18} style={{ color: '#f87171' }} />
            <span>Warning Signs ({warningSigns.length} Detected)</span>
          </h3>

          {warningSigns.length > 0 ? (
            <div className="warning-signs-grid">
              {warningSigns.map((sign, idx) => (
                <div key={idx} className="warning-sign-box">
                  <div className="warning-sign-title">
                    <span className="bullet-dot" />
                    <strong>{sign.title}</strong>
                  </div>
                  <p className="warning-sign-desc">{sign.description}</p>

                  {sign.matchedWords?.length > 0 && (
                    <div className="trigger-words-wrap">
                      <span className="trigger-label">Triggered by:</span>
                      {sign.matchedWords.map((word, wIdx) => (
                        <code key={wIdx} className="trigger-word-badge">
                          "{word}"
                        </code>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-warnings-notice">
              <CheckCheck size={18} style={{ color: '#34d399' }} />
              <span>
                {category && category !== 'General Message'
                  ? `Verified: ${category}. No red flags detected.`
                  : 'No automated fraud keywords triggered. Remember: never label an unexpected message definitely safe.'}
              </span>
            </div>
          )}
        </div>

        {/* Explanation */}
        <div className="verdict-section">
          <h3 className="section-heading">
            <HelpCircle size={18} style={{ color: '#818cf8' }} />
            <span>Explanation (Why it is {verdict.level})</span>
          </h3>
          <div className="explanation-content-box">
            <p>{explanation}</p>
          </div>
        </div>

        {/* Recommended Action */}
        <div className="verdict-section">
          <h3 className="section-heading">
            <CheckCircle2 size={18} style={{ color: '#34d399' }} />
            <span>Safety Advice & Recommended Action</span>
          </h3>
          <div className="advice-content-box">
            <p>{recommendation}</p>
          </div>
        </div>

        {/* Disclaimer Notice */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '0.85rem 1rem',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.22)',
            fontSize: '0.82rem',
            color: '#cbd5e1',
            margin: '0.5rem 0 1rem'
          }}
        >
          <AlertCircle size={18} style={{ color: '#f87171', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#fca5a5', display: 'block', marginBottom: '0.2rem' }}>
              Safety Notice: Predictions Are Statistical Estimates, Not Guarantees
            </strong>
            <span>
              Machine learning models calculate probabilities based on historical dataset patterns. They cannot guarantee 100% safety against new or evolving zero-day scams. ScamSense <strong>never</strong> automatically opens or executes submitted URLs.
            </span>
          </div>
        </div>

        {/* Learn Why Button */}
        <div className="learn-why-trigger-row">
          <button
            type="button"
            onClick={onLearnWhyClick}
            className="btn-secondary learn-why-btn"
          >
            <span>Learn "Why?" Behind These Warning Signs</span>
            <ArrowDown size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerdictResult;
