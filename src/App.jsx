import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, History, HelpCircle, User, ArrowRight, Mail, LogOut } from 'lucide-react';
import { ScannerInput } from './components/ScannerInput';
import { VerdictResult } from './components/VerdictResult';
import { LearnWhySection } from './components/LearnWhySection';
import { UserHistoryModal } from './components/UserHistoryModal';
import { analyzeImage } from './engine/ruleEngine';
import { predictMessageML, predictUrlML } from './services/mlService';
import {
  saveScanRecord,
  fetchScanHistory,
  deleteScanRecord,
  logVisitorEnter,
  updateVisitorName,
  fetchVisitors
} from './services/apiService';

export function App() {
  // Visitor & User identity (persistent via localStorage)
  const [userEmail, setUserEmail] = useState('');
  const [visitorId, setVisitorId] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [formError, setFormError] = useState('');

  // Scanner state
  const [scanMode, setScanMode] = useState('message'); // 'message' | 'url' | 'image'
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [imageNotes, setImageNotes] = useState('');
  const [currentResult, setCurrentResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // History & database data
  const [scans, setScans] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [modalTab, setModalTab] = useState('scans');

  // Scans filtered for the current user's email or active session
  const myScans = scans.filter((s) => {
    if (userEmail && s.userEmail) {
      return s.userEmail.toLowerCase() === userEmail.toLowerCase();
    }
    return visitorId && s.visitorId === visitorId;
  });

  const learnWhyRef = useRef(null);

  // Initialize session and fetch database records
  useEffect(() => {
    // Restore persistent user from localStorage
    const savedEmail = localStorage.getItem('scamsense_user_email') || '';
    let currentId = localStorage.getItem('scamsense_visitor_id');

    if (!currentId) {
      currentId = 'USR-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      localStorage.setItem('scamsense_visitor_id', currentId);
    }

    setVisitorId(currentId);

    if (savedEmail) {
      setUserEmail(savedEmail);
      setEmailInput(savedEmail);
    }

    // Detect browser & device
    const ua = navigator.userAgent || '';
    const device = /Mobi|Android|iPhone|iPad/i.test(ua) ? 'Mobile / Tablet' : 'Desktop';
    let browser = 'Web Browser';
    if (ua.includes('Chrome')) browser = 'Google Chrome';
    else if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
    else if (ua.includes('Safari')) browser = 'Apple Safari';
    else if (ua.includes('Edge')) browser = 'Microsoft Edge';

    // Log visit and load database records
    if (savedEmail || currentId) {
      logVisitorEnter({
        visitorId: currentId,
        email: savedEmail || undefined,
        device,
        browser
      }).then(() => {
        refreshDatabase();
      });
    }

    refreshDatabase();
  }, []);

  const refreshDatabase = async () => {
    try {
      const [scanList, visitorList] = await Promise.all([
        fetchScanHistory(),
        fetchVisitors()
      ]);
      setScans(scanList || []);
      setVisitors(visitorList || []);
    } catch (err) {
      console.error('Failed to load database records:', err);
    }
  };

  // Sign in / Register with Email only
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanEmail) {
      setFormError('Please enter your email address to continue.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setFormError('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    setFormError('');

    // Detect device & browser
    const ua = navigator.userAgent || '';
    const device = /Mobi|Android|iPhone|iPad/i.test(ua) ? 'Mobile / Tablet' : 'Desktop';
    let browser = 'Web Browser';
    if (ua.includes('Chrome')) browser = 'Google Chrome';
    else if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
    else if (ua.includes('Safari')) browser = 'Apple Safari';
    else if (ua.includes('Edge')) browser = 'Microsoft Edge';

    try {
      const res = await logVisitorEnter({
        visitorId,
        email: cleanEmail,
        device,
        browser
      });

      if (res?.visitor?.id) {
        setVisitorId(res.visitor.id);
        localStorage.setItem('scamsense_visitor_id', res.visitor.id);
      }

      setUserEmail(cleanEmail);
      localStorage.setItem('scamsense_user_email', cleanEmail);
      localStorage.removeItem('scamsense_user_name');

      await refreshDatabase();
    } catch (err) {
      console.error('Login error:', err);
      setUserEmail(cleanEmail);
      localStorage.setItem('scamsense_user_email', cleanEmail);
    }
  };

  // Logout / Switch User
  const handleLogout = () => {
    localStorage.removeItem('scamsense_user_email');
    localStorage.removeItem('scamsense_user_name');
    const freshId = 'VIS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem('scamsense_visitor_id', freshId);
    setVisitorId(freshId);
    setUserEmail('');
    setEmailInput('');
    setCurrentResult(null);
  };

  // Image handling
  const handleImageSelect = (file) => {
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreviewUrl(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setImagePreviewUrl(null);
    setImageNotes('');
  };

  // Core scan analysis
  const handleAnalyze = async () => {
    if (scanMode === 'image' && !selectedImage) return;
    if (scanMode !== 'image' && !inputText.trim()) return;

    setIsAnalyzing(true);

    try {
      let result;
      let type = scanMode;

      if (scanMode === 'image') {
        result = await analyzeImage(selectedImage, imageNotes);
        type = 'image';
      } else if (scanMode === 'url') {
        result = await predictUrlML(inputText.trim());
        type = 'url';
      } else {
        result = await predictMessageML(inputText.trim());
        type = 'msg';
      }

      result.scanType = type;
      setCurrentResult(result);

      // Save to database
      const saveRes = await saveScanRecord({
        visitorId,
        userEmail: userEmail || null,
        submittedText: result.submittedText,
        scanType: type,
        message: type === 'msg' ? result.submittedText : null,
        msg: type === 'msg' ? result.submittedText : null,
        url: type === 'url' ? result.submittedText : null,
        image: type === 'image' ? result.submittedText : null,
        imagePreview: type === 'image' ? imagePreviewUrl : null,
        verdictStatus: result.verdictStatus,
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
        category: result.category,
        warningSigns: result.warningSigns,
        explanation: result.explanation,
        recommendation: result.recommendation,
        verdictSummary: result.verdictSummary || ''
      });

      if (saveRes?.success && saveRes?.scan) {
        setScans((prev) => {
          const exists = prev.some((s) => s.id === saveRes.scan.id);
          return exists ? prev : [saveRes.scan, ...prev];
        });
      }

      const updatedVisitors = await fetchVisitors();
      setVisitors(updatedVisitors);

      // Scroll to result
      setTimeout(() => {
        document.getElementById('verdict-result')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } catch (err) {
      console.error('Analysis failed:', err);
      setCurrentResult({
        riskScore: 0,
        riskLevel: 'Unable to Verify',
        verdictStatus: 'UNABLE_TO_VERIFY',
        category: 'Analysis Error',
        warningSigns: [],
        explanation: 'An unexpected error occurred during analysis. Please try again.',
        recommendation: 'Check the input format and try again.',
        submittedText: scanMode === 'image' ? 'Screenshot' : inputText.trim(),
        scanType: scanMode === 'message' ? 'msg' : scanMode,
        verdictSummary: 'Analysis could not complete'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setSelectedImage(null);
    setImagePreviewUrl(null);
    setImageNotes('');
    setCurrentResult(null);
  };

  const handleScrollToLearnWhy = () => {
    learnWhyRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteScan = async (scanId) => {
    await deleteScanRecord(scanId);
    setScans((prev) => prev.filter((s) => s.id !== scanId));
  };

  const handleSelectHistoricalScan = (scan) => {
    const rawType = (scan.scanType || 'msg').toLowerCase();
    const mode = (rawType === 'message' || rawType === 'msg') ? 'message' : rawType;
    setScanMode(mode);

    if (mode === 'image') {
      setImageNotes(scan.image || scan.submittedText || '');
      if (scan.imagePreview || (scan.image && scan.image.startsWith('data:'))) {
        setImagePreviewUrl(scan.imagePreview || scan.image);
      }
    } else if (mode === 'url') setInputText(scan.url || scan.submittedText || '');
    else setInputText(scan.message || scan.submittedText || '');

    setCurrentResult({
      riskScore: scan.riskScore,
      riskLevel: scan.riskLevel,
      verdictStatus: scan.verdictStatus || (scan.riskScore >= 50 ? 'LIKELY_SCAM' : scan.riskScore < 25 ? 'SAFE' : 'SUSPICIOUS'),
      category: scan.category,
      warningSigns: scan.warningSigns || [],
      explanation: scan.explanation || '',
      recommendation: scan.recommendation || '',
      verdictSummary: scan.verdictSummary || '',
      submittedText: scan.submittedText,
      scanType: rawType
    });

    setTimeout(() => {
      document.getElementById('verdict-result')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="container">
      {/* Navigation */}
      <header className="navbar">
        <div className="brand-wrapper">
          <div className="brand-icon-box">
            <ShieldAlert size={26} />
          </div>
          <div>
            <span className="brand-title">ScamSense</span>
            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
              Scam & Phishing Message Detection
            </div>
          </div>
        </div>

        {userEmail && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <div
              style={{
                fontSize: '0.78rem',
                padding: '0.38rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                borderRadius: '8px',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                background: 'rgba(56, 189, 248, 0.08)',
                color: '#f8fafc'
              }}
            >
              <Mail size={13} style={{ color: '#38bdf8' }} />
              <span style={{ fontWeight: 600 }}>{userEmail}</span>
            </div>

            <button
              type="button"
              onClick={() => { setModalTab('scans'); setShowHistoryModal(true); }}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.38rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <History size={14} style={{ color: '#06b6d4' }} />
              <span>Scan History ({myScans.length})</span>
            </button>

            <button
              type="button"
              onClick={handleScrollToLearnWhy}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.38rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <HelpCircle size={14} style={{ color: '#818cf8' }} />
              <span>Learn "Why?"</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.38rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#f87171' }}
              title="Switch account or sign out"
            >
              <LogOut size={13} />
              <span>Switch User</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      {!userEmail ? (
        <section className="login-card-container" style={{ minHeight: '65vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
          <div className="glass-panel login-card" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem', textAlign: 'center' }}>
            <div className="login-header">
              <div
                className="login-logo-box"
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
                  boxShadow: '0 0 25px rgba(6, 182, 212, 0.45)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  marginBottom: '1.1rem'
                }}
              >
                <Mail size={28} />
              </div>
              <h2 className="login-title" style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 0.4rem 0' }}>
                Sign In to ScamSense
              </h2>
              <p className="login-subtitle" style={{ fontSize: '0.92rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Enter your email address to save your scan history and access it whenever you return.
              </p>
            </div>

            <form
              onSubmit={handleLogin}
              style={{ marginTop: '1.75rem', textAlign: 'left' }}
            >
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  <Mail size={13} />
                  <span>Your Email Address <span style={{ color: '#f87171' }}>*</span></span>
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => { setEmailInput(e.target.value); setFormError(''); }}
                  placeholder="e.g. yourname@example.com"
                  autoFocus
                  required
                  className="input-field"
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    fontSize: '0.95rem',
                    background: 'rgba(10, 15, 28, 0.85)',
                    border: formError ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {formError && (
                <div style={{ fontSize: '0.8rem', color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '0.6rem 0.8rem', borderRadius: '8px', marginBottom: '1.2rem' }}>
                  {formError}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  borderRadius: '10px'
                }}
              >
                <span>Continue & Load My History</span>
                <ArrowRight size={16} />
              </button>

              <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.76rem', color: '#64748b' }}>
                Your scan records are tied to your email so you never lose them.
              </div>
            </form>
          </div>
        </section>
      ) : (
        <>
          <section className="hero-section">
            <h1 className="hero-title">
              Check Any Suspicious <span>Message, URL or Image</span>
            </h1>
            <p className="hero-subtitle">
              Paste unexpected text messages, website links, or upload screenshots to instantly evaluate whether it is Fake (Scam) or Real (Authentic).
            </p>
          </section>

          <main>
            <ScannerInput
              scanMode={scanMode}
              setScanMode={setScanMode}
              inputText={inputText}
              onInputChange={setInputText}
              selectedImage={selectedImage}
              imagePreviewUrl={imagePreviewUrl}
              onImageSelect={handleImageSelect}
              onImageRemove={handleImageRemove}
              imageNotes={imageNotes}
              onImageNotesChange={setImageNotes}
              onAnalyze={handleAnalyze}
              onClear={handleClear}
              isAnalyzing={isAnalyzing}
            />

            {currentResult && (
              <VerdictResult
                result={currentResult}
                onLearnWhyClick={handleScrollToLearnWhy}
              />
            )}

            <LearnWhySection forwardRef={learnWhyRef} />
          </main>

          <footer className="footer">
            <div>
              <strong>ScamSense</strong> • Educational Scam & Phishing Detection
            </div>
          </footer>
        </>
      )}

      {/* History and database modal */}
      <UserHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        scans={scans}
        myScans={myScans}
        userEmail={userEmail}
        visitorId={visitorId}
        visitors={visitors}
        initialTab={modalTab}
        onDeleteScan={handleDeleteScan}
        onSelectScan={handleSelectHistoricalScan}
      />
    </div>
  );
}

export default App;
