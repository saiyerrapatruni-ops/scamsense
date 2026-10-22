import React, { useRef } from 'react';
import { Search, RotateCcw, Sparkles, MessageSquare, Link2, Image as ImageIcon, Upload, X, FileText } from 'lucide-react';

const MESSAGE_SAMPLES = [
  {
    label: 'Fake Bank KYC',
    text: 'Dear Customer, your SBI account KYC has expired. Your account will be blocked within 24 hours. Update your KYC immediately at http://sbi-kyc-verify.top to avoid permanent suspension.'
  },
  {
    label: 'Prize Lottery',
    text: 'Congratulations! You have won $50,000 in the International Cash Lottery. Send $150 advance processing fee and your OTP to claim your cash reward.'
  },
  {
    label: 'Job Offer Fee',
    text: 'Part-time work from home job! Earn $500 daily by liking YouTube videos. Pay $50 registration fee for job security deposit to start today on Telegram.'
  },
  {
    label: 'Legitimate 2FA SMS',
    text: 'Your Google verification code is 482910. Google will never call or message you to ask for this code. Do not share this code with anyone.'
  }
];

const URL_SAMPLES = [
  { label: 'Fake Google Clone', text: 'www.goooogle.com' },
  { label: 'Fake Bank Phishing', text: 'http://sbi-kyc-verify.top/login' },
  { label: 'Fake PayPal Link', text: 'http://paypal-security-update.xyz/verify-account' },
  { label: 'Real PayPal Link', text: 'https://www.paypal.com/signin' }
];

export function ScannerInput({
  scanMode,
  setScanMode,
  inputText,
  onInputChange,
  selectedImage,
  imagePreviewUrl,
  onImageSelect,
  onImageRemove,
  imageNotes,
  onImageNotesChange,
  onAnalyze,
  onClear,
  isAnalyzing
}) {
  const fileInputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) onImageSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onImageSelect(file);
  };

  const isMode = (m) => scanMode === m || (m === 'message' && scanMode === 'msg');

  return (
    <div className="glass-panel scanner-card">
      {/* Mode Switcher */}
      <div className="scanner-mode-tabs">
        <button
          type="button"
          className={`scanner-tab-btn ${isMode('message') ? 'active' : ''}`}
          onClick={() => setScanMode('message')}
        >
          <MessageSquare size={16} />
          <span>Message / Text</span>
        </button>

        <button
          type="button"
          className={`scanner-tab-btn ${isMode('url') ? 'active' : ''}`}
          onClick={() => setScanMode('url')}
        >
          <Link2 size={16} />
          <span>Website URL</span>
        </button>

        <button
          type="button"
          className={`scanner-tab-btn ${isMode('image') ? 'active' : ''}`}
          onClick={() => setScanMode('image')}
        >
          <ImageIcon size={16} />
          <span>Image</span>
        </button>
      </div>

      {/* Header Info */}
      <div className="scanner-header">
        <h2 className="scanner-title">
          {isMode('message') && 'Check Suspicious Message — Fake or Real?'}
          {isMode('url') && 'Check Website Link — Fake or Real?'}
          {isMode('image') && 'Check Image — Fake or Real?'}
        </h2>
        <p className="scanner-subtitle">
          {isMode('message') && 'Paste SMS messages, WhatsApp alerts, or emails to analyze.'}
          {isMode('url') && 'Paste any website link or URL to check for phishing clones.'}
          {isMode('image') && 'Upload an image of a suspicious message or payment notice to scan.'}
        </p>
      </div>

      {/* Message Mode */}
      {isMode('message') && (
        <>
          <div className="sample-chips-row">
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={13} style={{ color: '#06b6d4' }} />
              <span>Try a sample:</span>
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {MESSAGE_SAMPLES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="sample-chip"
                  onClick={() => onInputChange(sample.text)}
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          <div className="textarea-wrapper">
            <textarea
              className="scanner-textarea"
              rows={5}
              placeholder="Paste a suspicious message here..."
              value={inputText}
              onChange={(e) => onInputChange(e.target.value)}
            />
          </div>
        </>
      )}

      {/* URL Mode */}
      {isMode('url') && (
        <>
          <div className="sample-chips-row">
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={13} style={{ color: '#06b6d4' }} />
              <span>Try a sample link:</span>
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {URL_SAMPLES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="sample-chip"
                  onClick={() => onInputChange(sample.text)}
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          <div className="textarea-wrapper">
            <input
              type="text"
              className="scanner-textarea"
              style={{ minHeight: 'auto', padding: '0.85rem 1.1rem' }}
              placeholder="Paste suspicious website URL (e.g. http://sbi-kyc-verify.top or https://paypal.com)"
              value={inputText}
              onChange={(e) => onInputChange(e.target.value)}
            />
          </div>
        </>
      )}

      {/* Image Mode */}
      {isMode('image') && (
        <div style={{ marginBottom: '1.25rem' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFile}
            accept="image/*"
            style={{ display: 'none' }}
          />

          {!imagePreviewUrl ? (
            <div
              className="image-upload-zone"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <Upload size={32} style={{ color: '#06b6d4', marginBottom: '0.5rem' }} />
              <p style={{ fontWeight: 600, color: '#f1f5f9', margin: '0 0 0.25rem 0' }}>
                Click to browse or drag & drop image here
              </p>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Supports PNG, JPG, JPEG, WEBP images
              </span>
            </div>
          ) : (
            <div className="image-preview-box">
              <img src={imagePreviewUrl} alt="Uploaded preview" className="image-preview-thumbnail" />
              <div className="image-preview-info">
                <strong>Image Uploaded</strong>
                <span>{selectedImage ? `${(selectedImage.size / 1024).toFixed(1)} KB` : ''}</span>
                <button
                  type="button"
                  onClick={onImageRemove}
                  className="btn-secondary"
                  style={{ marginTop: '0.5rem', padding: '0.25rem 0.6rem', fontSize: '0.74rem', color: '#f87171' }}
                >
                  <X size={13} />
                  <span>Remove Image</span>
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: '0.85rem' }}>
            <label style={{ fontSize: '0.82rem', color: '#cbd5e1', display: 'block', marginBottom: '0.35rem' }}>
              <FileText size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Any text seen in image (optional notes):
            </label>
            <input
              type="text"
              className="scanner-textarea"
              style={{ minHeight: 'auto', padding: '0.65rem 0.9rem', fontSize: '0.85rem' }}
              placeholder="e.g. SBI account blocked, update KYC at http://sbi.top..."
              value={imageNotes}
              onChange={(e) => onImageNotesChange(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="scanner-actions">
        <button
          type="button"
          onClick={onClear}
          className="btn-secondary"
          disabled={!inputText && !selectedImage}
        >
          <RotateCcw size={15} />
          <span>Clear</span>
        </button>

        <button
          type="button"
          onClick={onAnalyze}
          className="btn-primary"
          disabled={isAnalyzing || (isMode('image') ? !selectedImage : !inputText.trim())}
          style={{ minWidth: '220px', justifyContent: 'center' }}
        >
          <Search size={16} />
          <span>
            {isAnalyzing
              ? 'Analyzing...'
              : isMode('url')
              ? 'Check URL'
              : isMode('image')
              ? 'Check Image'
              : 'Check Message'}
          </span>
        </button>
      </div>
    </div>
  );
}

export default ScannerInput;
