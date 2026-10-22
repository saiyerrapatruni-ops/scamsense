import Tesseract from 'tesseract.js';

// Scam pattern detection rules
export const MESSAGE_RULES = [
  // A. Fake Bank Alerts & Financial Threats
  {
    id: 'bank_threat',
    title: 'Urgent Threat to Bank Account',
    category: 'Bank Fraud',
    weight: 45,
    tip: 'Scammers manufacture artificial panic with tight deadlines so victims react without thinking.',
    regex: /\b(urgent:?\s*(?:your\s*)?(?:bank\s*)?account|(?:bank\s*)?account\s+(?:is|has been|will be|was)?\s*(?:suspended|blocked|frozen|restricted|locked|deactivated|closed|flagged)|within\s*(?:24|12|48|2|1)\s*hours?|(?:debit\s*|credit\s*)?card\s*(?:is|has been)?\s*(?:disabled|blocked|deactivated)|immediate\s*action\s*required|final\s*notice\s*before\s*suspension|temporary\s*hold\s*on\s*(?:your\s*)?account|unauthorized\s*(?:charge|transaction|wire|withdrawal)(?:\s*of\s*\$?\d+[\d,]*)?|fraud\s*(?:alert|department|prevention)(?:\s*(?:detected|flagged))?|suspicious\s*activity\s*detected)\b/gi
  },
  {
    id: 'fake_kyc',
    title: 'Fake KYC / Identity Update Notice',
    category: 'KYC Phishing',
    weight: 45,
    tip: 'Banks never send SMS or messaging links asking customers to complete KYC, PAN, or Aadhaar updates online.',
    regex: /\b(kyc\s*(?:is|has)?\s*(?:expired|pending|suspended|required|mandatory|needed)|(?:update|complete|verify|submit|link)\s*(?:your\s*)?(?:kyc|pan\s*card|aadhaar(?:\s*card)?|identity|bank\s*details)|(?:pan|aadhaar)\s*(?:card\s*)?(?:is\s*)?(?:suspended|blocked|deactivated)|mandatory\s*kyc\s*update)\b/gi
  },

  // B. Sensitive Credential & OTP Theft
  {
    id: 'otp_password',
    title: 'Request for OTP, PIN, or Password',
    category: 'Credential Theft',
    weight: 50,
    tip: 'Legitimate institutions never ask customers to share, forward, or send one-time codes or security PINs.',
    regex: /\b((?:send|share|forward|enter|provide|reply\s*with|submit)\s*(?:your\s*|the\s*)?(?:otp|pin|password|verification\s*code|security\s*code|credentials|cvv)|one[- ]time\s*password|(?:4|6)[- ]digit\s*(?:code|pin|otp)|verify\s*your\s*password|secret\s*recovery\s*phrase|seed\s*phrase|(?:enter|give)\s*cvv)\b/gi
  },

  // C. Fake Job & Freelance Task Scams
  {
    id: 'job_fee',
    title: 'Work-from-Home or Task Scam with Upfront Fee',
    category: 'Fake Job Scam',
    weight: 50,
    tip: 'Real employers will never charge an upfront registration fee, security deposit, or task payment to begin work.',
    regex: /\b(part[- ]time\s*(?:job|work|opportunity)|work\s*from\s*home(?:\s*(?:job|offer|opportunity))?|earn\s*(?:\$?\d+[\d,]*|daily)\s*(?:per\s*day|daily|weekly)?\s*(?:by|for)\s*(?:liking|watching|subscribing|tasks?)|telegram\s*(?:task|group|recruiter|channel)|(?:pay\s*)?(?:job\s*)?(?:security\s*deposit|registration\s*fee|interview\s*fee)|online\s*task\s*earnings|daily\s*payout\s*on\s*telegram|youtube\s*video\s*like\s*job)\b/gi
  },

  // D. Investment Fraud & Cryptocurrency Schemes
  {
    id: 'guaranteed_returns',
    title: 'Guaranteed or Risk-Free High Returns',
    category: 'Investment Fraud',
    weight: 50,
    tip: 'No legitimate investment can legally or practically guarantee 100% risk-free returns or overnight doubling.',
    regex: /\b(guaranteed\s*(?:profit|returns?|income|roi|earnings?)|100%\s*risk[- ]free|zero\s*risk\s*investment|double\s*your\s*(?:money|bitcoin|crypto|investment|deposit)|earn\s*\$?\d+[\d,]*\s*(?:daily|per\s*day)\s*guaranteed|200%\s*return|instant\s*profit\s*payout)\b/gi
  },
  {
    id: 'crypto_investment',
    title: 'Crypto Airdrop or Cloud Mining Scheme',
    category: 'Crypto Scam',
    weight: 45,
    tip: 'Unsolicited crypto giveaways, cloud mining bots, and airdrops requesting private transfers are fraudulent.',
    regex: /\b(crypto\s*mining(?:\s*bot)?|binance\s*airdrop|coinbase\s*airdrop|send\s*(?:btc|crypto|usdt|eth)\s*to\s*(?:receive|get)|forex\s*trading(?:\s*bot|\s*signals?)?|connect\s*(?:your\s*)?(?:metamask|trust)\s*wallet|claim\s*(?:free\s*)?airdrop)\b/gi
  },

  // E. Fake Prize, Sweepstakes & Lottery Claims
  {
    id: 'prize_lottery',
    title: 'Fake Prize, Cash Reward, or Lottery Promise',
    category: 'Prize & Lottery Scam',
    weight: 55,
    tip: 'Unsolicited messages promising instant cash payouts, lottery windfalls, or free rewards are classic financial fraud.',
    regex: /\b(free[- ]prize|free[- ]reward|prize[- ]claim|claim[- ]reward|claim\s*(?:your\s*)?(?:free\s*)?(?:gift|prize|reward|cash)|congratulations(?:\s*!?)?\s*(?:you(?:'ve|\s*have)?\s*won)?|(?:you|u)\s*(?:have\s*|will\s*)?(?:won|win|get|receive)\s*(?:the\s*)?(?:[\$₹£€]\s*[\d,]+|[\d,]+\s*(?:rs|inr|rupees|\$|usd|bucks|points)|cash|reward|prize|bonus)|(?:will|can)\s*get\s*(?:the\s*)?(?:[\$₹£€]\s*[\d,]+|[\d,]+\s*(?:rs|inr|rupees|\$|usd)|cash)|lucky\s*winner|selected\s*for\s*(?:a\s*)?(?:cash\s*prize|prize|reward|grant|lottery)|lottery\s*(?:ticket|winner|prize)|(?:international\s*)?cash\s*lottery|jackpot\s*winner|unclaimed\s*(?:cash\s*)?prize|(?:win|get|earn)\s*(?:instant\s*)?(?:cash|money|prize|reward|rs|rupees))\b/gi
  },
  {
    id: 'advance_fee',
    title: 'Advance Processing or Customs Fee Demand',
    category: 'Advance Fee Fraud',
    weight: 45,
    tip: 'Never pay upfront fees, customs duties, or handling charges to claim prizes, jobs, or courier deliveries.',
    regex: /\b((?:advance|processing|delivery|customs|handling|clearance|release|registration)\s*(?:fee|charge|payment)|(?:send|pay|deposit)\s*\$?\d+[\d,]*\s*(?:advance|processing\s*fee|to\s*claim|to\s*receive|to\s*unlock)|fee\s*to\s*(?:release|claim))\b/gi
  },

  // F. Impersonation (Government, Tech Support, Couriers, Executives)
  {
    id: 'authority_impersonation',
    title: 'Government, Police, or Court Threat',
    category: 'Authority Impersonation',
    weight: 50,
    tip: 'Law enforcement and government agencies do not send text messages threatening arrest or demanding immediate payments.',
    regex: /\b(internal\s*revenue\s*service|irs(?:\s*tax)?(?:\s*penalty|\s*audit|\s*notice)?|arrest\s*warrant(?:\s*issued)?|police(?:\s*department|\s*summons|\s*notice)|federal\s*bureau\s*of\s*investigation|fbi\s*notice|customs(?:\s*seizure|\s*inspection|\s*illegal\s*package)|legal\s*action\s*(?:will\s*be|has\s*been)\s*initiated|court\s*appearance\s*notice|warrant\s*for\s*your\s*arrest)\b/gi
  },
  {
    id: 'tech_support_impersonation',
    title: 'Fake Tech Support Virus Alert',
    category: 'Tech Support Scam',
    weight: 50,
    tip: 'Microsoft, Apple, and antivirus companies never send messages asking you to call emergency helpdesk numbers.',
    regex: /\b(microsoft\s*security\s*alert|apple\s*security\s*warning|computer\s*(?:has\s*been|is)?\s*infected|trojan(?:\s*virus)?\s*detected|call\s*(?:support|toll[- ]free|helpdesk)\s*(?:immediately|at)|device\s*(?:is\s*)?compromised\s*call|security\s*breach\s*call\s*\+?\d{1,4}[- ]?\d{3,})\b/gi
  },
  {
    id: 'package_delivery_impersonation',
    title: 'Fake Package Delivery Fee Warning',
    category: 'Courier Impersonation',
    weight: 35,
    tip: 'Courier scams send fake delivery exception alerts asking for address updates and small card payments.',
    regex: /\b((?:usps|fedex|dhl|ups)\s*(?:package|delivery|parcel|shipment)|package\s*cannot\s*be\s*delivered|incorrect\s*address\s*update\s*required|reschedule\s*delivery\s*fee|parcel\s*on\s*hold\s*at\s*terminal|delivery\s*failed\s*update\s*address)\b/gi
  },

  // G. Suspicious Untraceable Payment Requests
  {
    id: 'suspicious_payment',
    title: 'Request for Payment via Gift Card or Crypto',
    category: 'Suspicious Payment Request',
    weight: 50,
    tip: 'Demands for payment via gift cards (Apple, Steam, Google Play) or cryptocurrency are definitive indicators of fraud.',
    regex: /\b(pay\s*(?:via|using|with|by)\s*(?:apple|google\s*play|steam|amazon|target)?\s*gift\s*cards?|purchas(?:e|ing|ed)\s*(?:apple\s*|steam\s*|google\s*play\s*|amazon\s*)?gift\s*cards?(?:\s*codes?)?|send\s*(?:the\s*)?(?:gift\s*card\s*)?(?:codes|pins)|(?:gift\s*card|apple\s*card|steam\s*card)\s*(?:codes?|pins?)|pay\s*(?:in|using|via)\s*(?:bitcoin|usdt|crypto|btc)|send\s*money\s*via\s*western\s*union|wire\s*transfer\s*required\s*immediately)\b/gi
  },

  // H. Embedded Phishing Links & Urgent Call to Action
  {
    id: 'suspicious_link',
    title: 'Urgent Link-Click Call to Action',
    category: 'Phishing Link',
    weight: 35,
    tip: 'Unsolicited messages urging you to click or tap an unverified website link often lead to phishing or credential-harvesting websites.',
    regex: /\b(click\s*(?:on\s*)?(?:this|the|here|below)?\s*(?:link|ink|lik|lnk|url|website|site)|tap\s*(?:on\s*)?(?:this|the|here|below)?\s*(?:link|lnk|url)|open\s*(?:this|the|here|below)?\s*(?:link|lnk|url)|verify\s*(?:at|on|via)\s*link|follow\s*(?:this|the)?\s*link|visit\s*(?:this|the)?\s*(?:link|url|website))\b|https?:\/\/[^\s]*\.(xyz|top|biz|click|buzz|club|cfd|work|sbs|icu|fit|monster|vip|cc)[^\s]*|https?:\/\/(bit\.ly|tinyurl\.com|t\.co|is\.gd|cutt\.ly|rb\.gy)\/[^\s]*/gi
  },

  // I. Cash Reward / Money Lure Combined with Web Link
  {
    id: 'link_cash_lure',
    title: 'Cash Reward / Money Lure Combined with Web Link',
    category: 'Prize & Phishing Scam',
    weight: 55,
    tip: 'Messages that promise cash rewards, gifts, or payments if you click an external link are classic smishing traps designed to steal personal or banking data.',
    regex: /(?:(?:click|tap|open|visit|follow)\s*(?:on\s*)?(?:this|the)?\s*(?:link|ink|lik|url|site)|(?:https?:\/\/|www\.)[^\s]+)[\s\S]{0,60}(?:(?:will\s*)?(?:get|win|receive|claim|earn|credited)\s*(?:the\s*)?(?:[\$₹£€]\s*[\d,]+|[\d,]+\s*(?:rs|inr|rupees|\$|usd)|cash|money|prize|reward))|(?:(?:will\s*)?(?:get|win|receive|claim|earn|credited)\s*(?:the\s*)?(?:[\$₹£€]\s*[\d,]+|[\d,]+\s*(?:rs|inr|rupees|\$|usd)|cash|money|prize|reward))[\s\S]{0,60}(?:(?:click|tap|open|visit|follow)\s*(?:on\s*)?(?:this|the)?\s*(?:link|ink|lik|url|site)|(?:https?:\/\/|www\.)[^\s]+)/gi
  }
];

// -------------------------------------------------------------
// 2. KNOWN BRANDS & OFFICIAL DIRECTORIES
// -------------------------------------------------------------
export const KNOWN_BRANDS = [
  { name: 'Google', brand: 'google', officialDomains: ['google.com', 'google.co.in', 'google.co.uk', 'google.ca', 'google.de', 'google.fr', 'youtube.com', 'gmail.com'] },
  { name: 'PayPal', brand: 'paypal', officialDomains: ['paypal.com', 'paypal.me'] },
  { name: 'Amazon', brand: 'amazon', officialDomains: ['amazon.com', 'amazon.in', 'amazon.co.uk', 'amazon.ca', 'amazon.de', 'aws.amazon.com'] },
  { name: 'Apple', brand: 'apple', officialDomains: ['apple.com', 'icloud.com'] },
  { name: 'Microsoft', brand: 'microsoft', officialDomains: ['microsoft.com', 'live.com', 'office.com', 'outlook.com', 'bing.com', 'msn.com', 'azure.com', 'github.com'] },
  { name: 'Netflix', brand: 'netflix', officialDomains: ['netflix.com'] },
  { name: 'Meta / Facebook', brand: 'facebook', officialDomains: ['facebook.com', 'fb.com', 'meta.com', 'messenger.com', 'instagram.com', 'whatsapp.com'] },
  { name: 'Twitter / X', brand: 'twitter', officialDomains: ['twitter.com', 'x.com'] },
  { name: 'LinkedIn', brand: 'linkedin', officialDomains: ['linkedin.com'] },
  { name: 'Telegram', brand: 'telegram', officialDomains: ['telegram.org', 't.me'] },
  { name: 'Chase Bank', brand: 'chase', officialDomains: ['chase.com'] },
  { name: 'Bank of America', brand: 'bankofamerica', officialDomains: ['bankofamerica.com', 'bofa.com'] },
  { name: 'Wells Fargo', brand: 'wellsfargo', officialDomains: ['wellsfargo.com'] },
  { name: 'Citibank', brand: 'citi', officialDomains: ['citi.com', 'citibank.com'] },
  { name: 'Capital One', brand: 'capitalone', officialDomains: ['capitalone.com'] },
  { name: 'State Bank of India', brand: 'sbi', officialDomains: ['sbi.co.in', 'onlinesbi.sbi', 'onlinesbi.com'] },
  { name: 'HDFC Bank', brand: 'hdfcbank', officialDomains: ['hdfcbank.com'] },
  { name: 'ICICI Bank', brand: 'icicibank', officialDomains: ['icicibank.com'] },
  { name: 'USPS', brand: 'usps', officialDomains: ['usps.com'] },
  { name: 'FedEx', brand: 'fedex', officialDomains: ['fedex.com'] },
  { name: 'DHL', brand: 'dhl', officialDomains: ['dhl.com'] },
  { name: 'IRS', brand: 'irs', officialDomains: ['irs.gov'] }
];

export const VERIFIED_REAL_DOMAINS = [
  'google.com', 'google.co.in', 'google.co.uk', 'google.ca', 'youtube.com', 'gmail.com',
  'apple.com', 'icloud.com',
  'microsoft.com', 'live.com', 'office.com', 'outlook.com', 'bing.com', 'github.com',
  'amazon.com', 'amazon.in', 'amazon.co.uk',
  'paypal.com', 'paypal.me',
  'netflix.com',
  'facebook.com', 'instagram.com', 'whatsapp.com', 'meta.com',
  'twitter.com', 'x.com',
  'linkedin.com',
  'wikipedia.org',
  'chase.com', 'bankofamerica.com', 'wellsfargo.com', 'citi.com', 'capitalone.com',
  'sbi.co.in', 'onlinesbi.sbi', 'onlinesbi.com', 'hdfcbank.com', 'icicibank.com',
  'gov.in', 'usa.gov', 'irs.gov', 'gov.uk', 'who.int', 'nih.gov'
];

const HIGH_RISK_TLDS = [
  '.xyz', '.top', '.biz', '.click', '.buzz', '.icu', '.vip', '.work',
  '.cfd', '.club', '.link', '.monster', '.fit', '.sbs', '.online', '.site',
  '.tokyo', '.cc', '.invalid', '.test', '.rest', '.gq', '.cf', '.tk', '.ml', '.ga',
  '.racing', '.download', '.stream'
];
const RESERVED_OR_INVALID_TLDS = ['.invalid', '.test', '.example', '.localhost'];
const URL_SHORTENERS = ['bit.ly', 'tinyurl.com', 'is.gd', 't.co', 'cutt.ly', 'ow.ly', 'rb.gy'];
const PHISHING_ACTION_WORDS = ['login', 'signin', 'verify', 'verification', 'security', 'update', 'alert', 'billing', 'support', 'account', 'portal', 'auth', 'recover', 'kyc', 'confirm', 'wallet', 'bonus', 'claim'];

const PRIZE_SCAM_KEYWORDS = [
  'prize', 'reward', 'rewards', 'claim', 'lottery', 'winner', 'win', 'lucky',
  'jackpot', 'giveaway', 'airdrop', 'bonus', 'giftcard', 'free-gift', 'free-prize',
  'free-money', 'win-cash', 'cash-reward', 'survey-reward', 'spin-win', 'payout',
  'wheel-win', 'redeem', 'scratch'
];

const FINANCIAL_PHISHING_KEYWORDS = [
  'kyc', 'pan-card', 'aadhaar', 'bank-alert', 'account-blocked', 'suspend',
  'unblock', 'reactivate', 'card-verify', 'netbanking', 'ebanking', 'security-update',
  'billing-update', 'refund-claim', 'tax-refund', 'wallet-connect', 'passcode'
];

// -------------------------------------------------------------
// HELPER FUNCTIONS (Homoglyphs, Levenshtein, Extraction)
// -------------------------------------------------------------
function levenshteinDistance(a, b) {
  const m = [];
  for (let i = 0; i <= b.length; i++) m[i] = [i];
  for (let j = 0; j <= a.length; j++) m[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      m[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
        ? m[i - 1][j - 1]
        : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
    }
  }
  return m[b.length][a.length];
}

function normalizeHomoglyphs(str) {
  return (str || '')
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'l')
    .replace(/3/g, 'e')
    .replace(/5/g, 's')
    .replace(/8/g, 'b')
    .replace(/rn/g, 'm')
    .replace(/vv/g, 'w');
}

function collapseRepeatedLetters(str) {
  return (str || '').toLowerCase().replace(/(.)\1+/g, '$1');
}

function extractDomainComponents(urlInput) {
  let raw = (urlInput || '').trim();
  const hasInsecureHttp = raw.toLowerCase().startsWith('http://');

  if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
    raw = 'https://' + raw;
  }

  try {
    const urlObj = new URL(raw);
    const hostname = urlObj.hostname.toLowerCase();
    const hostWithoutWww = hostname.startsWith('www.') ? hostname.slice(4) : hostname;
    const parts = hostWithoutWww.split('.');

    let coreDomain = parts[0];
    let tld = parts.slice(1).join('.');

    if (parts.length >= 3 && ['co', 'com', 'org', 'net', 'gov', 'edu'].includes(parts[parts.length - 2])) {
      coreDomain = parts[parts.length - 3];
      tld = parts.slice(parts.length - 2).join('.');
    } else if (parts.length >= 2) {
      coreDomain = parts[parts.length - 2];
      tld = parts[parts.length - 1];
    }

    return {
      hostname,
      hostWithoutWww,
      coreDomain,
      tld,
      fullUrl: raw,
      hasInsecureHttp,
      isValid: Boolean(coreDomain && tld),
      pathname: urlObj.pathname || '',
      search: urlObj.search || ''
    };
  } catch {
    const clean = raw.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase();
    const hostWithoutWww = clean.startsWith('www.') ? clean.slice(4) : clean;
    const parts = hostWithoutWww.split('.');
    return {
      hostname: clean,
      hostWithoutWww,
      coreDomain: parts[0] || clean,
      tld: parts[1] || '',
      fullUrl: raw,
      hasInsecureHttp,
      isValid: parts.length >= 2 && Boolean(parts[1]),
      pathname: '',
      search: ''
    };
  }
}

// -------------------------------------------------------------
// HELPER: Insufficient Evidence Evaluator
// -------------------------------------------------------------
function isInsufficientMessageEvidence(cleanText) {
  if (!cleanText || !cleanText.trim()) return true;
  const str = cleanText.trim();

  // If there are no alphabetical letters at all (pure punctuation, numbers, or symbols like "???", "12345", "!@#$")
  if (!/[a-zA-Z]/.test(str)) {
    return true;
  }

  // Split into words
  const words = str.split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;

  // Single word evaluation:
  if (words.length === 1) {
    const single = words[0].toLowerCase().replace(/[^a-z]/g, '');
    const commonConversational = new Set([
      'hi', 'hello', 'hey', 'ok', 'okay', 'yes', 'no', 'thanks', 'thank', 'thx',
      'bye', 'good', 'fine', 'sure', 'cool', 'help', 'info', 'test', 'welcome',
      'great', 'done', 'cheers', 'congrats', 'morning', 'evening', 'night'
    ]);
    if (commonConversational.has(single)) {
      return false; // Valid short conversational word -> evaluate as normal text (Safe)
    }
    // Extremely short unknown token (e.g. "a", "x", "zq") -> insufficient evidence
    if (single.length <= 2) return true;
    // Missing vowels (e.g. "bcdfgh", "zxcv") -> insufficient / gibberish
    if (!/[aeiouy]/.test(single)) return true;
    // Repeated consonant cluster (keyboard mash like "asdfghjkl") -> insufficient
    if (/[bcdfghjklmnpqrstvwxz]{5,}/.test(single)) return true;
  }

  // Multiple words: if every word lacks vowels, it's gibberish like "bcdf ghjk"
  const hasAnyVowels = words.some(w => /[aeiouy]/i.test(w));
  if (!hasAnyVowels) return true;

  return false;
}

// -------------------------------------------------------------
// 3. MAIN URL EVALUATION ENGINE
// -------------------------------------------------------------
export function analyzeUrl(urlInput) {
  const url = (urlInput || '').trim();
  if (!url) {
    return {
      riskScore: 0,
      riskLevel: 'Safe',
      verdictStatus: 'SAFE',
      category: 'No Link Entered',
      warningSigns: [],
      explanation: 'Please enter a website link to check if it is safe, suspicious, or a scam.',
      recommendation: 'Enter a URL to analyze.',
      submittedText: '',
      scanType: 'url'
    };
  }

  const { hostname, hostWithoutWww, coreDomain, tld, hasInsecureHttp, isValid, pathname } = extractDomainComponents(url);

  // Insufficient evidence check for incomplete/malformed URLs or plain text entered in URL scanner
  if (!isValid || coreDomain.length < 2 || !tld) {
    const isPlainText = !url.includes('.') || url.includes(' ');
    return {
      riskScore: 0,
      riskLevel: isPlainText ? 'Not Applicable' : 'Unable to Verify',
      verdictStatus: isPlainText ? 'NOT_APPLICABLE' : 'UNABLE_TO_VERIFY',
      category: isPlainText ? 'Not Applicable (Plain Text in URL Tab)' : 'Insufficient Evidence',
      warningSigns: [
        {
          id: 'incomplete_url',
          title: isPlainText ? 'Plain Text Message in URL Scanner' : 'Incomplete or Malformed Web Address',
          category: isPlainText ? 'Not Applicable' : 'Insufficient Evidence',
          weight: 0,
          description: isPlainText
            ? `The input '${url}' is a plain text message rather than a website URL (e.g. google.com). Messages are not applicable in the URL tab. To analyze messages, please switch to the Message / Text tab.`
            : 'The submitted input does not contain a fully qualified domain name (e.g., example.com). We cannot verify destination infrastructure without a valid domain.',
          matchedWords: [url]
        }
      ],
      verdictSummary: isPlainText
        ? 'Plain text is not applicable in URL scanner: Switch to the Message tab'
        : 'Incomplete or malformed web address without valid domain',
      explanation: isPlainText
        ? `The input '${url}' appears to be a plain text message rather than a website URL (e.g. google.com). Plain text is not applicable in the Website URL tab. To inspect messages, please switch to the Message / Text tab.`
        : `The web address '${url}' lacks sufficient domain structure or a valid extension (like .com) to evaluate infrastructure safety.`,
      recommendation: isPlainText
        ? 'Enter a valid website address with a domain extension (such as google.com or https://company.org) to check URL safety, or switch to the Message tab.'
        : 'Check the complete web address including domain extension (e.g. .com, .org) before proceeding.',
      submittedText: url,
      scanType: 'url',
      analyzedAt: new Date().toISOString()
    };
  }

  const warningSigns = [];
  let score = 0;

  // 1. Official Verified Domain Check
  const matchedOfficialBrand = KNOWN_BRANDS.find(b => {
    return b.officialDomains.some(official => {
      return hostWithoutWww === official || hostWithoutWww.endsWith('.' + official);
    });
  });

  const isVerifiedDomain = Boolean(matchedOfficialBrand) || VERIFIED_REAL_DOMAINS.some(v => {
    return hostWithoutWww === v || hostWithoutWww.endsWith('.' + v);
  });

  if (isVerifiedDomain && !hasInsecureHttp) {
    const brandLabel = matchedOfficialBrand ? matchedOfficialBrand.name : 'Verified Authority';
    return {
      riskScore: 0,
      riskLevel: 'Safe',
      verdictStatus: 'SAFE',
      category: 'Verified Official Website',
      warningSigns: [],
      verdictSummary: `Verified authentic domain for ${brandLabel} (${hostWithoutWww})`,
      explanation: `This link matches the authenticated official domain for ${brandLabel} (${hostWithoutWww}). It does not exhibit typosquatting or deceptive redirects.`,
      recommendation: 'Link appears legitimate. Ensure you remain on an encrypted HTTPS connection with a valid certificate before entering any credentials.',
      submittedText: url,
      scanType: 'url',
      analyzedAt: new Date().toISOString()
    };
  }

  // 2. Typosquatting & Lookalike Impersonation of Known Brands
  for (const b of KNOWN_BRANDS) {
    const brandToken = b.brand;

    if (b.officialDomains.some(off => hostWithoutWww === off || hostWithoutWww.endsWith('.' + off))) {
      continue;
    }

    // A. Repeated Characters Check (e.g. goooogle.com, paypaaal.com)
    const candidateCollapsed = collapseRepeatedLetters(coreDomain);
    const brandCollapsed = collapseRepeatedLetters(brandToken);

    if (candidateCollapsed === brandCollapsed && coreDomain !== brandToken) {
      score += 75;
      warningSigns.push({
        id: 'typosquatting_repeated',
        title: `Typosquatting & Repeated Letters Imitating ${b.name}`,
        category: 'Brand Impersonation Phishing',
        weight: 75,
        description: `This website ('${hostWithoutWww}') uses deliberate typosquatting to impersonate ${b.name}. The domain repeats characters ('${coreDomain}' instead of '${b.officialDomains[0]}') to deceive visitors.`,
        matchedWords: [coreDomain, `fake clone of ${b.officialDomains[0]}`]
      });
      break;
    }

    // B. Homoglyph / Character Substitution (e.g. g00gle.com, arnazon.com)
    const candidateHomoglyph = normalizeHomoglyphs(coreDomain);
    if (
      (candidateHomoglyph === brandToken || collapseRepeatedLetters(candidateHomoglyph) === brandCollapsed) &&
      coreDomain !== brandToken
    ) {
      score += 80;
      warningSigns.push({
        id: 'homoglyph_substitution',
        title: `Deceptive Lookalike Character Substitution Imitating ${b.name}`,
        category: 'Homoglyph Phishing Attack',
        weight: 80,
        description: `This domain ('${coreDomain}') uses deceptive lookalike characters (such as numbers or multi-letters replacing characters) to visually spoof ${b.name}. Authentic services use '${b.officialDomains[0]}'.`,
        matchedWords: [coreDomain, `spoofing ${b.officialDomains[0]}`]
      });
      break;
    }

    // C. Levenshtein Distance Check (1-2 character edits, e.g. gogle.com, netflx.com)
    if (coreDomain.length >= 4) {
      const dist = levenshteinDistance(coreDomain, brandToken);
      const maxAllowedDist = brandToken.length <= 4 ? 1 : 2;

      if (dist > 0 && dist <= maxAllowedDist) {
        score += 70;
        warningSigns.push({
          id: 'typosquatting_edit_distance',
          title: `Slight Misspelling Typosquatting of ${b.name}`,
          category: 'Brand Impersonation Phishing',
          weight: 70,
          description: `The domain '${coreDomain}' is a slight misspelling of '${b.name}' (distance of ${dist} character edit from '${b.officialDomains[0]}'). This is classic typosquatting commonly used in phishing campaigns.`,
          matchedWords: [coreDomain, `misspelling of ${b.officialDomains[0]}`]
        });
        break;
      }
    }

    // D. Brand in Subdomain Deception (e.g. google.com.user-verify.xyz)
    if (
      (hostname.includes(b.brand) || hostname.includes(b.officialDomains[0])) &&
      !hostWithoutWww.endsWith(b.officialDomains[0])
    ) {
      score += 75;
      warningSigns.push({
        id: 'subdomain_deception',
        title: `Deceptive Subdomain Brand Impersonation (${b.name})`,
        category: 'Subdomain Phishing Attack',
        weight: 75,
        description: `The URL prefixes '${b.name}' in its subdomain to mislead users, but the actual root destination domain is '${coreDomain}.${tld}', NOT official ${b.name}.`,
        matchedWords: [hostname, `actual host: ${coreDomain}.${tld}`]
      });
      break;
    }

    // E. Brand + Phishing Action Keyword (e.g. sbi-kyc-verify.top, paypal-security-update.xyz)
    const hasBrandInCore = coreDomain.includes(brandToken);
    const hasActionWord = PHISHING_ACTION_WORDS.some(w => coreDomain.includes(w) || hostname.includes(w));
    if (hasBrandInCore && (hasActionWord || coreDomain.includes('-'))) {
      score += 65;
      warningSigns.push({
        id: 'brand_phishing_combo',
        title: `Brand & Security Keyword Combination (${b.name})`,
        category: 'Credential Phishing Domain',
        weight: 65,
        description: `The domain pairs '${b.name}' with security/login action keywords on an unofficial domain. Legitimate companies never host services on separate hyphenated domains.`,
        matchedWords: [coreDomain, `unofficial ${b.name} domain`]
      });
      break;
    }
  }

  const domainAndPath = (coreDomain + ' ' + (pathname || '')).toLowerCase();

  // 3. Fake Prize / Reward Claim Scam Domain Detection
  const matchedPrizeWords = PRIZE_SCAM_KEYWORDS.filter(k => {
    if (k.includes('-')) return domainAndPath.includes(k);
    const regex = new RegExp(`\\b${k}\\b|[-_]${k}[-_]|${k}[-_]|[-_]${k}`, 'i');
    return regex.test(domainAndPath);
  });

  const isFreeWithScamLure = domainAndPath.includes('free') && (
    domainAndPath.includes('prize') ||
    domainAndPath.includes('reward') ||
    domainAndPath.includes('claim') ||
    domainAndPath.includes('gift') ||
    domainAndPath.includes('win') ||
    domainAndPath.includes('money') ||
    domainAndPath.includes('cash')
  );

  if (matchedPrizeWords.length >= 2 || isFreeWithScamLure || domainAndPath.includes('free-prize') || domainAndPath.includes('prize-claim')) {
    score += 75;
    warningSigns.push({
      id: 'prize_lottery_scam_domain',
      title: 'Fake Prize / Reward Claim Scam Website',
      category: 'Prize / Lottery Scam Link',
      weight: 75,
      description: `The website address ('${hostWithoutWww}') contains explicit prize/lottery lure patterns (${matchedPrizeWords.length > 0 ? `"${matchedPrizeWords.join('", "')}"` : '"free prize / reward"'}). Scammers construct fake reward portals to lure victims into paying advance processing fees or submitting personal data.`,
      matchedWords: matchedPrizeWords.length > 0 ? matchedPrizeWords : ['free-prize-claim']
    });
  }

  // 4. Financial & Account Suspension Phishing Detection
  const matchedFinWords = FINANCIAL_PHISHING_KEYWORDS.filter(k => domainAndPath.includes(k));
  if (matchedFinWords.length > 0) {
    score += 75;
    warningSigns.push({
      id: 'financial_phishing_domain',
      title: 'Financial / Account Suspension Phishing Domain',
      category: 'Bank Fraud Phishing Link',
      weight: 75,
      description: `The website address ('${hostWithoutWww}') contains financial fraud keywords ("${matchedFinWords.join('", "')}"). Unofficial domains using bank verification terms are created to harvest net banking credentials and OTPs.`,
      matchedWords: matchedFinWords
    });
  }

  // 5. Invalid / Non-Routable TLD Detection (.invalid, .test, etc.)
  const isReservedOrInvalidTld = RESERVED_OR_INVALID_TLDS.some(ext => hostWithoutWww.endsWith(ext) || tld === ext.replace('.', ''));
  if (isReservedOrInvalidTld) {
    score += 40;
    warningSigns.push({
      id: 'invalid_reserved_tld',
      title: `Invalid / Non-Routable Domain Extension (.${tld})`,
      category: 'Suspicious Domain',
      weight: 40,
      description: `The web address uses the '.${tld}' extension, which is an invalid, reserved, or non-functional top-level domain frequently used in phishing templates and deceptive mock sites.`,
      matchedWords: [`.${tld}`]
    });
  }

  // 6. Multi-Hyphenated Deceptive Domain Structure
  const hyphenCount = (coreDomain.match(/-/g) || []).length;
  if (hyphenCount >= 2) {
    score += 25;
    warningSigns.push({
      id: 'multi_hyphen_domain',
      title: 'Multi-Hyphenated Deceptive Domain Structure',
      category: 'Deceptive Domain',
      weight: 25,
      description: `The domain '${coreDomain}' strings multiple hyphenated words together (${hyphenCount} hyphens). Scammers frequently concatenate common words to bypass spam filters and mimic real services.`,
      matchedWords: [coreDomain]
    });
  }

  // 7. Raw IP Address Check
  const ipMatch = hostname.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (ipMatch) {
    score += 50;
    warningSigns.push({
      id: 'raw_ip_address',
      title: 'Raw Numerical IP Address Destination',
      category: 'Malicious Server',
      weight: 50,
      description: 'The link points directly to a raw numerical IP address rather than a registered domain name. Authentic online services always register official domain names.',
      matchedWords: [ipMatch[1]]
    });
  }

  // 8. Disposable High-Risk Burner TLD
  const foundTld = HIGH_RISK_TLDS.find(ext => hostWithoutWww.endsWith(ext) || tld.includes(ext.replace('.', '')));
  if (foundTld) {
    score += 35;
    warningSigns.push({
      id: 'high_risk_tld',
      title: `Disposable High-Risk Domain Extension (${foundTld})`,
      category: 'Phishing Link',
      weight: 35,
      description: `The link uses a cheap, disposable burner domain extension (${foundTld}) predominantly favored by cybercriminals for throwaway phishing portals.`,
      matchedWords: [foundTld]
    });
  }

  // 5. Obfuscated URL Shorteners
  const foundShortener = URL_SHORTENERS.find(s => hostWithoutWww.includes(s));
  if (foundShortener) {
    score += 30;
    warningSigns.push({
      id: 'url_shortener',
      title: 'Obfuscated URL Shortener',
      category: 'Hidden Destination',
      weight: 30,
      description: 'The link utilizes a shortening service that conceals the true destination website.',
      matchedWords: [foundShortener]
    });
  }

  // 6. Insecure HTTP Protocol Check
  if (hasInsecureHttp) {
    score += 20;
    warningSigns.push({
      id: 'insecure_http',
      title: 'Unencrypted HTTP Protocol',
      category: 'Insecure Link',
      weight: 20,
      description: 'The link uses plain unencrypted HTTP rather than secure HTTPS. Any passwords or personal details entered can be intercepted in transit.',
      matchedWords: ['http://']
    });
  }

  // 7. DGA / Gibberish Random Domain Detection (e.g. gjgjjg.com, asdfghj.net, bcdfgh.com)
  const isKnownSafeDomain = isVerifiedDomain || VERIFIED_REAL_DOMAINS.some(d => hostWithoutWww === d || hostWithoutWww.endsWith('.' + d));
  if (!isKnownSafeDomain && coreDomain.length >= 5) {
    const vowels = (coreDomain.match(/[aeiouy]/gi) || []).length;
    const hasConsonantCluster = /[bcdfghjklmnpqrstvwxz]{5,}/i.test(coreDomain);
    const hasRepetitivePattern = /([a-z]{2,})\1+/i.test(coreDomain);

    if (vowels === 0 || (vowels / coreDomain.length < 0.15 && hasConsonantCluster) || (hasRepetitivePattern && vowels <= 1)) {
      score += 45;
      warningSigns.push({
        id: 'gibberish_dga_domain',
        title: 'Randomized / Gibberish Burner Domain (DGA)',
        category: 'Malicious / Disposable Domain',
        weight: 45,
        description: `The website address ('${coreDomain}') contains random consonant clusters or repetitive gibberish patterns. Cybercriminals generate disposable randomized domains to evade reputation blocklists and host short-lived fraud pages.`,
        matchedWords: [coreDomain]
      });
    }
  }

  // 8. Legitimate Standard Clean Domains
  if (warningSigns.length === 0) {
    score = 15;
  }

  const finalScore = Math.min(100, Math.max(0, score));

  let riskLevel = 'Safe';
  let verdictStatus = 'SAFE';

  if (finalScore >= 50) {
    riskLevel = 'Likely Scam';
    verdictStatus = 'LIKELY_SCAM';
  } else if (finalScore >= 25) {
    riskLevel = 'Suspicious';
    verdictStatus = 'SUSPICIOUS';
  } else {
    riskLevel = 'Safe';
    verdictStatus = 'SAFE';
  }

  const category = warningSigns.length > 0 ? warningSigns[0].category : 'Standard Web Link';
  const explanation = warningSigns.length > 0
    ? warningSigns.map(w => w.description).join(' ')
    : `No deceptive domain patterns, typosquatting clones, or burner extensions were detected in '${hostWithoutWww}'. Domain structure appears standard.`;

  let recommendation = '';
  let verdictSummary = '';
  if (riskLevel === 'Likely Scam') {
    const primary = warningSigns[0] || {};
    if (primary.id === 'prize_lottery_scam_domain') {
      verdictSummary = `Fake prize / reward claim scam website (${hostWithoutWww})`;
      recommendation = `Do NOT click, visit, or claim rewards on this link ('${url}'). Legitimate organizations never distribute cash prizes or gifts through unverified websites.`;
    } else if (primary.id === 'financial_phishing_domain') {
      verdictSummary = `Financial fraud / account phishing website (${hostWithoutWww})`;
      recommendation = `Do NOT enter bank credentials, cards, or OTPs on this link ('${url}'). Log in directly through your verified bank portal or mobile app.`;
    } else {
      verdictSummary = `Phishing clone / lookalike domain (${coreDomain}.${tld})`;
      recommendation = `Do NOT visit, click, or enter any credentials on this link ('${url}'). It is identified as a deceptive phishing clone. Navigate directly to the official website instead.`;
    }
  } else if (riskLevel === 'Suspicious') {
    verdictSummary = `Suspicious website characteristics detected (${hostWithoutWww})`;
    recommendation = 'Verify the source of this link before clicking. Never provide sensitive passwords or bank details unless you are confident in the authenticity of the site.';
  } else {
    verdictSummary = `Standard web link with no deceptive markers (${hostWithoutWww})`;
    recommendation = 'This link appears legitimate. Ensure you remain on an encrypted HTTPS connection with a valid certificate before entering any sensitive details.';
  }

  return {
    riskScore: finalScore,
    riskLevel,
    verdictStatus,
    category,
    warningSigns,
    explanation,
    recommendation,
    verdictSummary,
    submittedText: url,
    scanType: 'url',
    analyzedAt: new Date().toISOString()
  };
}

export function isPureUrlInput(input) {
  if (!input) return false;
  const str = input.trim();
  if (/\s/.test(str)) return false;
  if (/^https?:\/\/[^\s]+$/i.test(str)) return true;
  if (/^www\.[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?::\d+)?(?:\/[^\s]*)?$/i.test(str)) return true;
  const domainPattern = /^[a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z0-9][-a-zA-Z0-9]*)*\.(?:[a-zA-Z]{2,})(?::\d+)?(?:\/[^\s]*)?$/i;
  return domainPattern.test(str);
}

// -------------------------------------------------------------
// 4. MESSAGE ANALYSIS ENGINE
// -------------------------------------------------------------
export function analyzeMessage(text) {
  if (!text || !text.trim()) {
    return {
      riskScore: 0,
      riskLevel: 'Safe',
      verdictStatus: 'SAFE',
      category: 'No Text Entered',
      warningSigns: [],
      verdictSummary: 'No message entered',
      explanation: 'Please enter a message to check if it is safe, suspicious, or a scam.',
      recommendation: 'Enter text to analyze.',
      submittedText: '',
      scanType: 'message'
    };
  }

  const cleanText = text.trim();

  // Requirement: URLs in the message column.
  // 1. If the input is a pure URL that is a dangerous scam/phishing site (e.g. http://free-prize-claim.invalid/reward),
  //    detect it as a scam so users inspecting suspicious websites in the message box are fully protected!
  // 2. If it is a clean/legitimate URL (e.g. www.google.com), return NOT APPLICABLE instructing them to use Website URL tab.
  if (isPureUrlInput(cleanText)) {
    const urlEval = analyzeUrl(cleanText);
    if (urlEval.riskLevel === 'Likely Scam' || urlEval.riskScore >= 50) {
      return {
        riskScore: urlEval.riskScore,
        riskLevel: urlEval.riskLevel,
        verdictStatus: urlEval.verdictStatus,
        category: urlEval.category,
        warningSigns: urlEval.warningSigns,
        verdictSummary: `High-risk scam website detected in message: ${urlEval.verdictSummary}`,
        explanation: `Scam website detected: ${urlEval.explanation}`,
        recommendation: urlEval.recommendation,
        submittedText: cleanText,
        scanType: 'message',
        analyzedAt: new Date().toISOString()
      };
    } else if (urlEval.riskLevel === 'Suspicious' || urlEval.riskScore >= 25) {
      return {
        riskScore: urlEval.riskScore,
        riskLevel: urlEval.riskLevel,
        verdictStatus: urlEval.verdictStatus,
        category: urlEval.category,
        warningSigns: urlEval.warningSigns,
        verdictSummary: `Suspicious website detected in message: ${urlEval.verdictSummary}`,
        explanation: `Suspicious website detected: ${urlEval.explanation}`,
        recommendation: urlEval.recommendation,
        submittedText: cleanText,
        scanType: 'message',
        analyzedAt: new Date().toISOString()
      };
    }

    return {
      riskScore: 0,
      riskLevel: 'Not Applicable',
      verdictStatus: 'NOT_APPLICABLE',
      category: 'Not Applicable (Website URL in Message Tab)',
      warningSigns: [
        {
          id: 'url_in_message_tab',
          title: 'Website URL Entered in Message Column',
          category: 'Not Applicable',
          weight: 0,
          description: `The input '${cleanText}' is a website address. URLs are not applicable in the Message / Text scanner. To check website links and detect phishing clones, please switch to the Website URL tab.`,
          matchedWords: [cleanText]
        }
      ],
      verdictSummary: 'URLs are not applicable in Message column: Switch to Website URL tab',
      explanation: `The input '${cleanText}' is a website link. URLs are not applicable in the Message column. To inspect websites and check for malicious links, phishing clones, or official authenticity, please use the Website URL scanner.`,
      recommendation: 'URLs are not applicable in the Message tab. Switch to the Website URL tab above to analyze domain legitimacy, phishing risks, and SSL security.',
      submittedText: cleanText,
      scanType: 'message',
      analyzedAt: new Date().toISOString()
    };
  }



  const warningSigns = [];
  let totalScore = 0;

  for (const rule of MESSAGE_RULES) {
    rule.regex.lastIndex = 0;
    const matches = [];
    let match;

    while ((match = rule.regex.exec(cleanText)) !== null) {
      const word = match[0].trim();
      if (!matches.includes(word)) {
        matches.push(word);
      }
      if (match.index === rule.regex.lastIndex) {
        rule.regex.lastIndex++;
      }
    }

    if (matches.length > 0) {
      totalScore += rule.weight;
      warningSigns.push({
        id: rule.id,
        title: rule.title,
        category: rule.category,
        description: rule.tip,
        weight: rule.weight,
        matchedWords: matches
      });
    }
  }

  // Check for any links / URLs embedded inside the message
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(?:com|org|net|edu|gov|io|co|in|xyz|top|biz|info|site|online|cc|vip|club|click|buzz|cfd|work|sbs|icu|fit|monster|invalid|test|rest|gq|cf|tk|ml|ga|racing|download|stream)\b(?:\/[^\s]*)?)/gi;
  const embeddedUrls = cleanText.match(urlRegex) || [];
  for (const embeddedUrl of embeddedUrls) {
    const urlAnalysis = analyzeUrl(embeddedUrl);
    if (urlAnalysis.riskLevel === 'Likely Scam' || urlAnalysis.riskScore >= 50) {
      totalScore += 70;
      urlAnalysis.warningSigns.forEach(ws => {
        if (!warningSigns.some(existing => existing.id === ws.id)) {
          warningSigns.push(ws);
        }
      });
    } else if (urlAnalysis.riskLevel === 'Suspicious' || urlAnalysis.riskScore >= 25) {
      totalScore += 35;
      urlAnalysis.warningSigns.forEach(ws => {
        if (!warningSigns.some(existing => existing.id === ws.id)) {
          warningSigns.push(ws);
        }
      });
    }
  }

  // Safeguards to avoid false positives for Legitimate Communications:
  // 1. Legitimate 2FA security notification with anti-phishing disclaimer
  const hasAntiPhishingNotice = /(never (ask|share|give|call for) (this|your) (code|otp)|google will never call|microsoft will never ask|do not share this (code|otp) with anyone)/i.test(cleanText);
  const hasMaliciousLink = warningSigns.some(w => w.id === 'suspicious_link' || w.id.startsWith('typosquatting') || w.id.startsWith('homoglyph') || w.id.includes('scam_domain') || w.id.includes('phishing'));

  if (hasAntiPhishingNotice && !hasMaliciousLink) {
    if (warningSigns.length <= 1 && (!warningSigns[0] || warningSigns[0].id === 'otp_password')) {
      totalScore = 0;
      warningSigns.length = 0;
    } else {
      totalScore = Math.max(0, totalScore - 35);
    }
  }

  // 2. Legitimate Transaction / Order Notices
  const hasLegitimateOrderProof = /(your (order|receipt|appointment) (has been|is) (confirmed|shipped|scheduled)|arriving by|track (your )?order at)/i.test(cleanText);
  if (hasLegitimateOrderProof && !hasMaliciousLink && totalScore <= 35) {
    totalScore = 5;
    warningSigns.length = 0;
  }

  const finalScore = Math.min(100, Math.max(0, totalScore));

  let riskLevel = 'Safe';
  let verdictStatus = 'SAFE';

  if (finalScore >= 50) {
    riskLevel = 'Likely Scam';
    verdictStatus = 'LIKELY_SCAM';
  } else if (finalScore >= 25) {
    riskLevel = 'Suspicious';
    verdictStatus = 'SUSPICIOUS';
  } else {
    riskLevel = 'Safe';
    verdictStatus = 'SAFE';
  }

  // Check if it's random keystrokes or short conversational message
  const words = cleanText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const isRandomKeystrokes = isInsufficientMessageEvidence(cleanText);
  const commonConversational = /\b(hi|hello|hey|ok|okay|yes|no|thanks|thank you|bye|good|fine|sure|cool|help|test|welcome|morning|evening|night|how are you|this is [a-zA-Z]+|call me|see you)\b/i;
  const isConversational = !isRandomKeystrokes && warningSigns.length === 0 && !hasAntiPhishingNotice && !hasLegitimateOrderProof && commonConversational.test(cleanText) && wordCount <= 12;

  // Category determination
  let category = 'General Message';
  if (warningSigns.length > 0) {
    const sorted = [...warningSigns].sort((a, b) => b.weight - a.weight);
    category = sorted[0].category || 'Suspicious Message';
  } else if (hasAntiPhishingNotice) {
    category = 'Legitimate 2FA Authentication Alert';
  } else if (hasLegitimateOrderProof) {
    category = 'Legitimate Order / Service Notification';
  } else if (isConversational) {
    category = 'Personal / Conversational Message';
  } else if (isRandomKeystrokes) {
    category = 'Random Keystrokes / Safe';
  }

  // Dynamic Explanation & Recommendation Generators
  let explanation = '';
  let recommendation = '';
  let verdictSummary = '';

  if (riskLevel === 'Likely Scam') {
    const primary = warningSigns[0] || {};
    const triggers = primary.matchedWords && primary.matchedWords.length > 0 ? `("${primary.matchedWords.join('", "')}")` : '';

    if (primary.id === 'bank_threat') {
      verdictSummary = 'Urgent bank account fraud alert detected';
      explanation = `Urgent financial fraud threat detected. The message creates artificial panic around bank account suspension or unauthorized charges ${triggers} to coerce you into revealing credentials or calling a fake number.`;
      recommendation = 'Do NOT click any links or call phone numbers in this message. Log in directly via your official bank mobile app or call the number printed on the back of your debit card.';
    } else if (primary.id === 'fake_kyc') {
      verdictSummary = 'Fake KYC / identity verification fraud alert';
      explanation = `Fake KYC update fraud detected. The message falsely claims your KYC or identity documents have expired ${triggers} to trick you into submitting PAN, Aadhaar, or banking credentials on a phishing form.`;
      recommendation = 'Banks never send SMS links to complete KYC online. Never submit your personal documents or banking details through unverified links.';
    } else if (primary.id === 'otp_password') {
      verdictSummary = 'Credential theft attempt requesting one-time password (OTP)';
      explanation = `Sensitive credential theft detected. The message directly solicits your one-time password (OTP) or security PIN ${triggers}. Legitimate banks and services never request verification codes over text.`;
      recommendation = 'NEVER share, forward, or speak your OTP to anyone. Authentic organizations and banks will NEVER ask for your one-time passwords or security PINs.';
    } else if (primary.id === 'job_fee') {
      verdictSummary = 'Work-from-home or task scam with upfront fee request';
      explanation = `Fake work-from-home or task scam detected. The message advertises easy daily earnings ${triggers} designed to lure victims into paying upfront registration fees or task deposits.`;
      recommendation = 'Real employers never require upfront registration fees, security deposits, or Telegram task payments. Discontinue contact and do not transfer funds.';
    } else if (primary.id === 'guaranteed_returns' || primary.id === 'crypto_investment') {
      verdictSummary = 'High-risk investment / cryptocurrency scheme detected';
      explanation = `High-risk financial investment fraud detected. Promises of guaranteed profits, risk-free doubling, or crypto airdrops ${triggers} are hallmark indicators of financial schemes.`;
      recommendation = 'Do not send cryptocurrency, wire money, or connect private wallets. Legitimate financial investments never guarantee 100% risk-free returns.';
    } else if (primary.id === 'prize_lottery' || primary.id === 'advance_fee' || primary.id === 'prize_lottery_scam_domain' || primary.id === 'link_cash_lure') {
      verdictSummary = 'Fake cash reward / lottery claim lure detected';
      explanation = `Prize / reward scam detected. The message lures you with fake cash rewards or prizes ${triggers} to convince you to click an unverified external link.`;
      recommendation = 'Legitimate companies never send unsolicited links promising free cash or prizes. Do NOT click or open the link, and do not enter personal or banking information.';
    } else if (primary.id === 'authority_impersonation' || primary.id === 'tech_support_impersonation') {
      verdictSummary = 'Authority / tech support impersonation threat detected';
      explanation = `Authority or tech support impersonation scam detected. Fraudsters impersonate law enforcement, tax officials, or tech support ${triggers} using intimidation to extract payments.`;
      recommendation = 'Do not comply with demands for immediate payment or remote device access. Contact the authentic organization through official public directories.';
    } else if (primary.id === 'suspicious_payment') {
      verdictSummary = 'Untraceable payment fraud via gift cards or crypto';
      explanation = `Untraceable payment demand detected. Requests to pay via gift cards or direct cryptocurrency ${triggers} are irrevocable and definitive indicators of fraud.`;
      recommendation = 'Refuse the payment demand immediately. No government agency, law enforcement, or legitimate vendor accepts Apple, Google Play, or Steam gift cards as payment.';
    } else if (primary.id === 'package_delivery_impersonation') {
      verdictSummary = 'Fake courier package delivery fee notice';
      explanation = `Courier parcel delivery scam detected. The message claims a package cannot be delivered ${triggers} to trick you into paying fake redelivery fees or entering credit card details.`;
      recommendation = 'Do not pay any redelivery fee or enter credit card information. Track your package directly on the official postal or courier website using your original tracking number.';
    } else {
      verdictSummary = `Scam signatures detected (${category})`;
      explanation = warningSigns.map(w => w.description).join(' ');
      recommendation = 'Do NOT reply, do NOT click any links, and NEVER send money or share your OTP. Block the sender immediately.';
    }
  } else if (riskLevel === 'Suspicious') {
    verdictSummary = `Caution: Suspicious indicators detected (${category})`;
    explanation = warningSigns.length > 0
      ? warningSigns.map(w => w.description).join(' ')
      : 'The message contains suspicious phrasing or unverified links that warrant caution before interacting.';
    recommendation = 'Take a moment to verify the sender before clicking links or sharing any details. Contact the organization through official channels.';
  } else {
    // Safe
    if (isRandomKeystrokes) {
      verdictSummary = `Safe: No scam patterns or security threats detected`;
      explanation = `The text "${cleanText}" contains no fraudulent keywords, phishing links, bank threats, or scam signatures. While it appears to be arbitrary letters or a typing test, it poses zero security risk and is completely safe.`;
      recommendation = 'No scam indicators or security threats detected. This content is completely harmless and safe.';
    } else if (isConversational) {
      verdictSummary = `Safe conversational message with zero scam markers`;
      explanation = `The text "${cleanText}" is standard everyday conversational communication. It contains no financial demands, deceptive links, or urgency triggers.`;
      recommendation = 'Appears to be standard personal communication. You can safely respond without security concern.';
    } else if (hasAntiPhishingNotice) {
      verdictSummary = `Legitimate 2FA security authentication code`;
      explanation = 'This message exhibits standard characteristics of an authentic two-factor authentication (2FA) notification. It includes appropriate security disclaimers instructing you never to share the verification code.';
      recommendation = 'Keep this security code private. Only enter it directly into the official service login screen, and never share it with anyone who calls or texts.';
    } else if (hasLegitimateOrderProof) {
      verdictSummary = `Legitimate order / delivery service confirmation`;
      explanation = 'This message corresponds to an authentic order confirmation or shipment notification without requests for sensitive credentials or suspicious payment demands.';
      recommendation = 'Verify your order details by logging directly into your account on the official mobile app or website.';
    } else {
      verdictSummary = `No scam patterns or red flags detected in message`;
      explanation = 'No scam patterns, phishing indicators, or suspicious requests detected in this message. Content appears standard and safe.';
      recommendation = 'No obvious red flags detected. Maintain standard security awareness and never share sensitive codes, passwords, or banking details with unverified senders.';
    }
  }

  return {
    riskScore: finalScore,
    riskLevel,
    verdictStatus,
    category,
    warningSigns,
    explanation,
    recommendation,
    verdictSummary,
    submittedText: cleanText,
    scanType: 'message',
    analyzedAt: new Date().toISOString()
  };
}

// -------------------------------------------------------------
// 5. IMAGE OCR & VISION SCREENSHOT ANALYSIS
// -------------------------------------------------------------
export async function analyzeImage(file, noteText = '') {
  if (!file && (!noteText || !noteText.trim())) {
    return {
      riskScore: 0,
      riskLevel: 'Safe',
      verdictStatus: 'SAFE',
      category: 'No Image Uploaded',
      warningSigns: [],
      explanation: 'Please upload an image screenshot to inspect.',
      recommendation: 'Upload an image file.',
      submittedText: '',
      scanType: 'image',
      verdictSummary: 'No image uploaded'
    };
  }

  const fileName = file?.name || (typeof file === 'string' ? file.split(/[\\/]/).pop() : 'screenshot.png');
  let ocrExtractedText = '';

  // 1. Perform OCR extraction using Tesseract
  if (file) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('OCR Timeout')), 10000)
      );

      let imageSource = file;
      if (typeof file === 'string' && !file.startsWith('data:') && !file.startsWith('http')) {
        imageSource = file;
      }

      const ocrPromise = Tesseract.recognize(imageSource, 'eng', {
        logger: () => {}
      });

      const ocrResult = await Promise.race([ocrPromise, timeoutPromise]);
      ocrExtractedText = (ocrResult?.data?.text || '').trim();
    } catch (err) {
      console.warn('OCR processing note:', err.message);
    }
  }

  const combinedInspectionText = `${ocrExtractedText} ${noteText || ''}`.trim();

  // If OCR could not find readable text and user gave no meaningful note
  if (!combinedInspectionText || combinedInspectionText.length < 5) {
    return {
      riskScore: 0,
      riskLevel: 'Unable to Verify',
      verdictStatus: 'UNABLE_TO_VERIFY',
      category: 'Insufficient Evidence',
      warningSigns: [
        {
          id: 'ocr_no_text',
          title: 'Image OCR Vision Inspection',
          category: 'Insufficient Evidence',
          weight: 20,
          description: 'OCR vision scan could not detect legible text or recognizable security signatures in this image. Rather than guessing, we cannot verify its safety without readable content.',
          matchedWords: []
        }
      ],
      verdictSummary: 'OCR scan could not detect legible text in screenshot',
      explanation: 'OCR analysis of the screenshot did not detect sufficient text or identifiable fraud indicators to make a determination.',
      recommendation: 'Ensure screenshot is clear, high-resolution, and legible. Compare directly with official mobile banking apps or statements.',
      submittedText: noteText ? `[Screenshot] ${noteText}`.trim() : '[Screenshot]',
      scanType: 'image',
      ocrText: '',
      analyzedAt: new Date().toISOString()
    };
  }

  // 2. Analyze the combined OCR text using our comprehensive scam pattern engine
  const baseAnalysis = analyzeMessage(combinedInspectionText);
  const warningSigns = [...baseAnalysis.warningSigns];
  let finalScore = baseAnalysis.riskScore;

  // Add Vision OCR inspection badge
  warningSigns.unshift({
    id: 'image_ocr_inspection',
    title: 'OCR Vision Inspection',
    category: 'Visual & OCR Inspection',
    weight: 0,
    description: `Analyzed screenshot text via OCR (${ocrExtractedText.length} characters detected). Evaluated extracted wording for fake logos, urgent threats, and fraudulent patterns.`,
    matchedWords: ocrExtractedText ? [ocrExtractedText.slice(0, 80) + '...'] : []
  });

  const riskLevel = baseAnalysis.riskLevel;
  const verdictStatus = baseAnalysis.verdictStatus;

  const category = baseAnalysis.category !== 'General Message' && baseAnalysis.category !== 'No Text Entered'
    ? baseAnalysis.category
    : 'Image Verification';

  const explanation = `Image OCR Analysis: ${baseAnalysis.explanation}`;
  const verdictSummary = `Image OCR: ${baseAnalysis.verdictSummary || baseAnalysis.category}`;
  const recommendation = riskLevel === 'Likely Scam'
    ? `Image contains clear scam indicators. ${baseAnalysis.recommendation}`
    : riskLevel === 'Suspicious'
    ? 'Verify the correspondence directly with the organization using their official mobile app or website.'
    : riskLevel === 'Unable to Verify'
    ? 'Ensure screenshot is clear and legible. Compare directly with official sources.'
    : 'No obvious red flags detected in the extracted image text. Still, verify unexpected requests through official channels.';

  return {
    riskScore: finalScore,
    riskLevel,
    verdictStatus,
    category,
    warningSigns,
    explanation,
    recommendation,
    verdictSummary,
    submittedText: ocrExtractedText ? `[Screenshot] (OCR: ${ocrExtractedText.slice(0, 60)}...)` : (noteText ? `[Screenshot] ${noteText}` : '[Screenshot]'),
    scanType: 'image',
    ocrText: ocrExtractedText,
    analyzedAt: new Date().toISOString()
  };
}

// -------------------------------------------------------------
// 6. UNIFIED EVALUATOR
// -------------------------------------------------------------
export function analyzeSubmittedText(text) {
  const trimmed = (text || '').trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('www.') ||
    /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/i.test(trimmed)
  ) {
    return analyzeUrl(trimmed);
  }
  return analyzeMessage(trimmed);
}
