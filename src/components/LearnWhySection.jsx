import React from 'react';
import { BookOpen, ShieldAlert, KeyRound, Clock, Wallet, HelpCircle, CheckCircle } from 'lucide-react';

export function LearnWhySection({ forwardRef }) {
  const topics = [
    {
      icon: Clock,
      color: '#f87171',
      title: "Why Scammers Manufacture Urgency",
      desc: "Deadlines like 'within 24 hours' or 'account will be blocked' trigger a psychological panic response. This rushes victims into acting before they can contact their bank or think critically."
    },
    {
      icon: KeyRound,
      color: '#38bdf8',
      title: "Why They Ask for OTPs & Passwords",
      desc: "One-Time Passcodes (OTPs) are the final security barrier protecting your account. When scammers initiate unauthorized password resets or wire transfers, they trick you into providing the code to bypass two-factor authentication."
    },
    {
      icon: Wallet,
      color: '#fbbf24',
      title: "The Advance-Fee & Job Deposit Trap",
      desc: "Promising huge lottery wins, high daily work-from-home earnings, or package releases after paying a 'small registration fee'. Legitimate employers and real lotteries never require payment to receive money."
    },
    {
      icon: ShieldAlert,
      color: '#a78bfa',
      title: "Fake KYC & Document Suspensions",
      desc: "Phishing kits send counterfeit bank warnings claiming your PAN, Aadhaar, or KYC has expired. The link leads to a clone site built to steal your online banking credentials."
    }
  ];

  return (
    <section ref={forwardRef} className="glass-panel learn-why-container" id="learn-why-section">
      <div className="learn-why-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <BookOpen size={22} style={{ color: '#06b6d4' }} />
          <h2 className="learn-why-title">Learn "Why?": Understanding Scam Techniques</h2>
        </div>
        <p className="learn-why-subtitle">
          Essential knowledge to help you identify deceptive patterns before interacting with suspicious communications.
        </p>
      </div>

      <div className="learn-why-grid">
        {topics.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <div key={idx} className="learn-why-card">
              <div className="learn-icon-circle" style={{ color: item.color, background: `${item.color}20` }}>
                <IconComponent size={20} />
              </div>
              <h3 className="learn-card-title">{item.title}</h3>
              <p className="learn-card-desc">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Actionable Rules of Thumb */}
      <div className="safe-action-rules">
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
          <CheckCircle size={16} />
          <span>The Golden Rules of Scam Defense</span>
        </h4>
        <ul className="rules-list">
          <li><strong>Never share OTPs:</strong> No authentic bank employee or government official will ever ask for your 6-digit OTP or login PIN.</li>
          <li><strong>Verify Out-of-Band:</strong> Never click links in unsolicited messages. Type your bank's official URL directly into a fresh browser tab or call the phone number on your card.</li>
          <li><strong>Pause on Urgency:</strong> If a message demands immediate action under threat of penalty, treat it with extreme suspicion.</li>
        </ul>
      </div>
    </section>
  );
}
