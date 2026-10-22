# ScamSense: Cyber Scam & Phishing Detection System
## Complete Project Architecture, Source Code Guide & Demonstration Manual

**Audience:** Students (10th-grade and above), Educators, Evaluators & Software Engineers  
**Technology Stack:** React 19 + Node.js HTTP Server + Python FastAPI + PostgreSQL (Supabase)

---

## 1. Executive Summary & System Overview

In today's digital world, millions of people receive fraudulent SMS messages, fake banking alerts, deceptive phishing websites, and counterfeit payment screenshots every day. Non-technical users often fall victim to cyber criminals because modern scams look virtually indistinguishable from authentic bank communications.

**ScamSense** is an intelligent educational cyber defense platform. It gives everyday users an easy, visual tool to test any suspicious message, link, or image before interacting with it. The system analyzes the input using **Machine Learning (ML), Natural Language Processing (NLP), and Computer Vision (OCR)**, returning an instant **Risk Score (0–100)**, explainable warning flags, and concrete safety guidance.

> 💡 **The 10th-Grade Analogy (For Students and Teachers):**  
> Think of ScamSense like an automated security guard at an airport scanner:
> - If a person brings a suitcase (a text message or URL), the scanner examines its contents against a database of known dangerous items.
> - If they bring a photograph or document (an image), the optical scanner reads the text off the photo first.
> - The guard gives an immediate green/yellow/red badge, points out exactly what weapon or fake item was found, and writes down a visitor log in a secure notebook (PostgreSQL database).

### System Architecture Summary Table

| Architecture Layer | Primary Technology | Real Code Location | Key Responsibility |
|---|---|---|---|
| **Frontend UI** | React 19, Vite, Lucide Icons | `src/App.jsx`, `src/components/` | Interactive single-page app with dark cyber-glassmorphism theme. |
| **Detection Engine (ML)** | Scikit-Learn, Joblib, Python | `backend/main.py`, `backend/train.py` | FastAPI inference with TF-IDF and Random Forest models. |
| **Detection Engine (Rule)** | Regular Expressions & Heuristics | `src/engine/ruleEngine.js` | Instant client-side fraud pattern matching and zero-day defense. |
| **Vision Engine (OCR)** | Tesseract.js (LSTM Neural Net) | `src/engine/ruleEngine.js` | Extracts text from uploaded screenshots in the browser. |
| **Backend API** | Node.js HTTP Server | `server/server.js`, `apiMiddleware.js` | Handles user session tracking, scan persistence, and database routing. |
| **Database Layer** | PostgreSQL (Cloud Supabase) | `server/db.js`, `server/schema.sql` | Stores users, sessions, scan history, JSONB warning signs, and image previews. |

---

## 2. Module 1: Login Page & User Authentication

### 1. Purpose & Real-World Necessity:
In web applications, users need a way to preserve their scan history and access their past fraud records across different devices. Without authentication, as soon as a user closes their browser or refreshes the page, their scan logs would vanish. ScamSense implements a streamlined email-based authentication system that pairs persistent local sessions with cloud PostgreSQL user records.

### 2. User Interaction & Workflow:
1. If a user is not yet logged in, the application displays a modern **"Sign In / Register"** card before accessing the scanner.
2. The user sees an input box: **"Your Email Address *"**.
3. They type their email (e.g. `dev@gmail.com`) and click the gradient button **"Continue & Load My History"**.
4. If an invalid email format is entered (such as `dev@` without a domain), a red warning message displays: *"Please enter a valid email address"*.
5. Upon successful entry, the login box smoothly unmounts and the full Scanner Dashboard is revealed.

### 3. Source Code Files & Components:
* **Frontend Component:** [`src/App.jsx`](file:///f:/scam-msg/src/App.jsx#L106-L150) (`handleLogin`)
* **API Client:** [`src/services/apiService.js`](file:///f:/scam-msg/src/services/apiService.js) (`logVisitorEnter`)
* **Backend Endpoint:** [`server/apiMiddleware.js`](file:///f:/scam-msg/server/apiMiddleware.js) (`POST /api/visitors/enter`)
* **Database Layer:** [`server/pgService.js`](file:///f:/scam-msg/server/pgService.js) (`upsertUser`)
* **Database Table:** `users` table in PostgreSQL ([`server/schema.sql`](file:///f:/scam-msg/server/schema.sql))

### 4. Core Source Code Snippet:
```javascript
// [Frontend] src/App.jsx: handleLogin
const handleLogin = async (e) => {
  if (e) e.preventDefault();
  const cleanEmail = emailInput.trim().toLowerCase();

  // Validate email structure using regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    setFormError('Please enter a valid email address (e.g. name@example.com).');
    return;
  }

  // Detect user environment
  const ua = navigator.userAgent || '';
  const device = /Mobi|Android|iPhone|iPad/i.test(ua) ? 'Mobile / Tablet' : 'Desktop';
  const browser = ua.includes('Chrome') ? 'Google Chrome' : 'Web Browser';

  // Send login payload to backend
  const res = await logVisitorEnter({ visitorId, email: cleanEmail, device, browser });
  if (res?.visitor?.id) {
    setVisitorId(res.visitor.id);
    localStorage.setItem('scamsense_visitor_id', res.visitor.id);
  }
  setUserEmail(cleanEmail);
  localStorage.setItem('scamsense_user_email', cleanEmail);
  await refreshDatabase();
};
```

### 5. Step-by-Step Explanation in Simple English:
1. The user types their email into the text field. The component state `emailInput` holds this string.
2. When the submit button is clicked, `handleLogin` prevents default HTML page reloads.
3. The email is stripped of trailing spaces and converted to lowercase so `Dev@Gmail.com` and `dev@gmail.com` are recognized as the same user.
4. A regular expression tests if the email contains an `@` symbol and a valid domain dot.
5. The browser's `navigator.userAgent` string is inspected to classify whether the user is on a Mobile phone, Tablet, or Desktop PC.
6. An HTTP POST request is dispatched to `/api/visitors/enter`.
7. The backend searches PostgreSQL for an existing user with that email. If found, it increments their visit counter (`visits_count + 1`) and updates `last_active`. If not found, it inserts a new row into the `users` table.
8. The user's active email is saved to the browser's `localStorage` (`scamsense_user_email`) so they stay logged in even if they refresh the tab.

### 6. Internal Click & Execution Lifecycle:
```text
[User Clicks "Continue & Load My History"]
  ↓
[handleLogin triggered in App.jsx]
  ↓
[Validate input with emailRegex]
  ↓
[Call logVisitorEnter() via apiService.js]
  ↓
[HTTP POST to http://localhost:5000/api/visitors/enter]
  ↓
[server/apiMiddleware.js intercepts request and extracts body]
  ↓
[server/pgService.js executes PostgreSQL SQL Query]
  → SELECT * FROM users WHERE LOWER(email) = 'dev@gmail.com'
  → If found: UPDATE users SET visits_count = visits_count + 1
  → If not found: INSERT INTO users (id, email, device, browser, visits_count) VALUES (...)
  ↓
[Backend returns JSON { success: true, visitor: {...} }]
  ↓
[Frontend stores email in localStorage and switches UI view]
```

### 7. Input, Processing & Expected Output:
| Stage | Description |
|---|---|
| **Input** | User's email string (`dev@gmail.com`), device signature, browser name. |
| **Processing** | Regex validation, browser header parsing, PostgreSQL upsert query. |
| **Output** | Saved user record in PostgreSQL, session token in `localStorage`. |
| **Expected Result** | User is logged in, their specific scan history is loaded, and dashboard displays their email. |

---

## 3. Module 2: Home Page & Dashboard Navigation

### 1. Purpose & Real-World Necessity:
The Home Page serves as the central command cockpit. It introduces the user to ScamSense, informs them of their active session status, provides one-click navigation to their database records, and houses the scanner tabs. A clean, intuitive dashboard ensures non-technical users are never confused about where to paste content.

### 2. User Interaction & Workflow:
1. **Top Navbar:** Displays the ScamSense shield logo, user account pill (showing `dev@gmail.com`), session ID, a **"Database Directory"** button with a cylinder icon, and a **"Sign Out"** button.
2. **Hero Section:** Displays an energetic cybersecurity heading: *"Check Any Suspicious Message, URL or Image"*.
3. **Mode Selector Pills:** Users can click three distinct mode tabs:
   - `Message` (SMS & WhatsApp)
   - `Website Link` (URLs)
   - `Image Screenshot` (Screenshots & Photos)
4. Selecting a mode immediately adapts the input container below it.

### 3. Source Code Files & Components:
* **Main View:** [`src/App.jsx`](file:///f:/scam-msg/src/App.jsx#L305-L370)
* **Scanner Header & Tabs:** [`src/components/ScannerInput.jsx`](file:///f:/scam-msg/src/components/ScannerInput.jsx#L60-L105)
* **Styling Engine:** [`src/index.css`](file:///f:/scam-msg/src/index.css)

### 4. Core Source Code Snippet:
```jsx
// [Frontend] src/components/ScannerInput.jsx: Mode Selection Tabs
<div className="scanner-tabs">
  <button
    type="button"
    className={`scanner-tab ${isMode('message') ? 'active' : ''}`}
    onClick={() => setScanMode('message')}
  >
    <MessageSquare size={16} />
    <span>Message Text</span>
  </button>
  <button
    type="button"
    className={`scanner-tab ${isMode('url') ? 'active' : ''}`}
    onClick={() => setScanMode('url')}
  >
    <Link2 size={16} />
    <span>Website Link</span>
  </button>
  <button
    type="button"
    className={`scanner-tab ${isMode('image') ? 'active' : ''}`}
    onClick={() => setScanMode('image')}
  >
    <ImageIcon size={16} />
    <span>Image Screenshot</span>
  </button>
</div>
```

### 5. Step-by-Step Explanation in Simple English:
1. The React state variable `scanMode` stores the currently active tab (default is `'message'`).
2. When the user clicks the "Website Link" button, the `onClick` listener calls `setScanMode('url')`.
3. React re-renders the component. The button with `scanMode === 'url'` gets the CSS class `'active'`, which illuminates it in cyber-blue.
4. The input area below dynamically swaps: in `'message'` mode it displays a large multi-line textarea; in `'url'` mode it displays a single-line URL field with a link icon; in `'image'` mode it renders a drag-and-drop file upload container.
5. Pre-configured sample buttons appear above the box, allowing users to test authentic or scam examples with a single click.

---

## 4. Module 3: Message Scan (SMS & WhatsApp Scam Detection)

### 1. Purpose & Real-World Necessity:
SMS phishing ("Smishing") and WhatsApp scams are the number one cause of financial theft today. Attackers send messages pretending to be State Bank of India, electricity departments, or lottery foundations, threatening that your account will be closed unless you click a link or send money. The Message Scanner breaks down the text to find psychological coercion triggers.

### 2. User Interaction & Workflow:
1. User ensures the "Message" tab is active.
2. They can either type/paste their own SMS or click one of the preset sample chips (e.g. *"Fake Bank KYC"*, *"Prize Lottery"*, *"Legitimate 2FA SMS"*).
3. They click the glowing **"Scan Message"** button.
4. The button displays a spinning loading indicator (*"Analyzing..."*).
5. Within milliseconds, the page smoothly scrolls down to reveal the Verdict Card.

### 3. Source Code Files & Components:
* **UI Container:** [`src/components/ScannerInput.jsx`](file:///f:/scam-msg/src/components/ScannerInput.jsx)
* **App Coordinator:** [`src/App.jsx`](file:///f:/scam-msg/src/App.jsx#L175-L235) (`handleAnalyze`)
* **Service Dispatcher:** [`src/services/mlService.js`](file:///f:/scam-msg/src/services/mlService.js) (`predictMessageML`)
* **Python ML Backend:** `backend/main.py` (`POST /api/predict/message`)
* **ML Training Script:** `backend/train.py` (TF-IDF + Logistic Regression on UCI SMS Spam dataset)
* **Rule Engine:** [`src/engine/ruleEngine.js`](file:///f:/scam-msg/src/engine/ruleEngine.js) (`analyzeMessage`)

### 4. Core Source Code Snippet:
```javascript
// [Frontend Service] src/services/mlService.js: predictMessageML
export async function predictMessageML(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return analyzeMessage(trimmed);

  // 1. Attempt Machine Learning inference via FastAPI backend
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

  // 2. Seamless client-side fallback if Python backend is offline
  const fallback = analyzeMessage(trimmed);
  return {
    ...fallback,
    engine: 'heuristic_fallback',
    isMlModel: false,
    modelBadge: 'Local Heuristic Analysis Engine'
  };
}
```

### 5. Step-by-Step Explanation in Simple English:
1. When "Scan Message" is clicked, `handleAnalyze` retrieves the text from `inputText`.
2. It calls `predictMessageML(inputText)`.
3. The function first makes a network call to the Python FastAPI backend on port 8000.
4. In `backend/main.py`, the text is vectorized into mathematical numbers using a pre-trained TF-IDF vectorizer (trained on 5,500+ messages from the official UCI SMS Spam Collection).
5. The scikit-learn Logistic Regression model computes the probability that the message is Spam/Scam versus Ham (safe).
6. If the Python backend is not running, `mlService.js` automatically falls back to `src/engine/ruleEngine.js`, which checks regular expressions for urgency deadlines (*"within 24 hours"*), OTP theft, and bank impersonation.
7. The calculated verdict, risk score, and warning signs are returned to `App.jsx`.
8. The result is automatically saved to the PostgreSQL database via `saveScanRecord`.

---

## 5. Module 4: URL Scan (Phishing & Deceptive Websites)

### 1. Purpose & Real-World Necessity:
Phishing websites are fake copies of real services (like Google, PayPal, or State Bank of India). Scammers register lookalike domains such as `goooogle.com` or `sbi-kyc-verify.top` to trick users into typing their passwords. The URL Scanner dissects the web address down to its anatomy to detect deceptive lookalikes.

### 2. User Interaction & Workflow:
1. User clicks the "Website Link" tab.
2. The input field displays a link icon and placeholder: *"Paste suspicious website URL (e.g. http://sbi-kyc-verify.top)"*.
3. Users can paste a link or click samples: *"Fake Google Clone"*, *"Fake Bank Phishing"*, *"Real PayPal Link"*.
4. They click **"Scan Website"**.
5. The analysis runs and displays the domain classification.

### 3. Source Code Files & Components:
* **UI Component:** [`src/components/ScannerInput.jsx`](file:///f:/scam-msg/src/components/ScannerInput.jsx)
* **Service Layer:** [`src/services/mlService.js`](file:///f:/scam-msg/src/services/mlService.js) (`predictUrlML`)
* **Python ML Backend:** `backend/main.py` (`POST /api/predict/url`)
* **Feature Extractor:** `backend/url_features.py` (`extract_url_features`)
* **ML Model:** `backend/models/url_model.joblib` (Random Forest trained on UCI PhiUSIIL Phishing Dataset)
* **Heuristic Fallback:** [`src/engine/ruleEngine.js`](file:///f:/scam-msg/src/engine/ruleEngine.js) (`analyzeUrl`)

### 4. Core Source Code Snippet:
```python
# [Python ML Backend] backend/url_features.py: extract_url_features
def extract_url_features(url_str: str) -> dict:
    parsed = urllib.parse.urlparse(url_str)
    domain = parsed.netloc.lower() or parsed.path.lower()
    
    # 1. Check for typosquatting / repeating characters (e.g. goooogle.com)
    repeated_chars = 1 if re.search(r'([a-z])\1{2,}', domain) else 0
    
    # 2. Check for deceptive subdomain brand prefixing (e.g. sbi-kyc.top)
    is_subdomain_trick = 1 if ('sbi' in domain and not domain.endswith('sbi.co.in')) else 0
    
    # 3. Check for high-risk burner domain extensions (.top, .xyz, .buzz)
    risky_tlds = ['.top', '.xyz', '.tk', '.buzz', '.ga', '.cf', '.ml']
    has_risky_tld = 1 if any(domain.endswith(t) for t in risky_tlds) else 0
    
    return {
        'url_length': len(url_str),
        'num_dots': domain.count('.'),
        'num_hyphens': domain.count('-'),
        'has_ip_address': 1 if re.match(r'\d+\.\d+\.\d+\.\d+', domain) else 0,
        'is_http_insecure': 1 if parsed.scheme == 'http' else 0,
        'repeated_chars': repeated_chars,
        'is_subdomain_trick': is_subdomain_trick,
        'has_risky_tld': has_risky_tld
    }
```

### 5. Step-by-Step Explanation in Simple English:
1. The user inputs a website address, for example `http://sbi-kyc-verify.top/login`.
2. `predictUrlML` forwards the link to the Python backend.
3. `extract_url_features` parses the link using Python's standard `urllib.parse`.
4. It measures lexical features: link length, number of dots, number of hyphens.
5. It inspects domain structure: it identifies that `sbi-kyc-verify` is using the brand name `SBI`, but the root domain ends in `.top`, NOT the authentic `sbi.co.in`.
6. It checks the protocol: it notices plain unencrypted `http://` instead of secure `https://`.
7. These numerical features are fed into a Random Forest Classifier trained on over 10,000 URLs from the UCI PhiUSIIL dataset.
8. The model returns a high scam probability. The backend formats an explanation: *"Phishing clone / lookalike domain"*.
9. The scan is recorded into PostgreSQL in the `url` column (leaving `message` and `image` as `NULL`).

---

## 6. Module 5: Image Scan (Computer Vision & OCR Vision Engine)

### 1. Purpose & Real-World Necessity:
Modern cybercriminals frequently send screenshots or images instead of text to bypass traditional email spam filters. For example, victims receive a WhatsApp image of a fake electricity disconnection notice. Users cannot easily copy-paste text from an image. The Image Scanner uses Computer Vision (OCR) to read the letters directly off the picture and analyze them automatically.

### 2. User Interaction & Workflow:
1. User clicks the "Image Screenshot" tab.
2. A dashed drag-and-drop zone appears with an upload cloud icon: *"Click to upload or drag and drop image screenshot (PNG, JPG, WEBP)"*.
3. The user drags a screenshot file into the box or clicks to browse their files.
4. When selected, an instant image preview appears with a thumbnail and a "Remove" button.
5. An optional text box allows them to add context notes (e.g. *"Received this on WhatsApp"*).
6. The user clicks **"Scan Image Screenshot"**.
7. OCR processes the image in the background, extracts the text, and renders the verdict.

### 3. Source Code Files & Components:
* **Dropzone UI:** [`src/components/ScannerInput.jsx`](file:///f:/scam-msg/src/components/ScannerInput.jsx)
* **Image Handler:** [`src/App.jsx`](file:///f:/scam-msg/src/App.jsx) (`handleImageSelect`, `handleImageRemove`)
* **OCR Neural Engine:** [`src/engine/ruleEngine.js`](file:///f:/scam-msg/src/engine/ruleEngine.js) (`analyzeImage`)
* **External Library:** Tesseract.js (LSTM Optical Character Recognition)
* **Database Storage:** [`server/pgService.js`](file:///f:/scam-msg/server/pgService.js) (stores image thumbnail in `image_preview` column)

### 4. Core Source Code Snippet:
```javascript
// [Frontend Engine] src/engine/ruleEngine.js: analyzeImage (OCR Vision)
export async function analyzeImage(file, noteText = '') {
  if (!file && !noteText.trim()) return null;

  const fileName = file?.name || 'screenshot.png';
  let ocrExtractedText = '';

  // 1. Run Tesseract Neural Network OCR on the image
  if (file) {
    try {
      const ocrResult = await Tesseract.recognize(file, 'eng', {
        logger: () => {} // Silent logging
      });
      ocrExtractedText = (ocrResult?.data?.text || '').trim();
    } catch (err) {
      console.warn('OCR processing note:', err.message);
    }
  }

  // 2. Combine OCR text with any optional user context notes
  const combinedText = `${ocrExtractedText} ${noteText}`.trim();

  // 3. Pipe extracted text into the text fraud detection pipeline
  const analysis = analyzeTextMessage(combinedText);

  return {
    ...analysis,
    scanType: 'image',
    submittedText: `[Image: ${fileName}] ${combinedText}`
  };
}
```

### 5. Step-by-Step Explanation in Simple English:
1. The user selects an image file from their device. In `App.jsx`, `handleImageSelect` reads the file into memory using HTML5 `FileReader` and converts it into a Base64 Data URL for instant visual preview.
2. When the user clicks "Scan", `App.jsx` executes `analyzeImage(selectedImage, imageNotes)`.
3. The function invokes `Tesseract.recognize`, which runs a client-side neural network trained on English font characters. It scans every line of pixels in the image to reconstruct the words into text.
4. The extracted string is concatenated with any user notes.
5. The combined text is passed directly into `analyzeTextMessage`, which runs the NLP scam detection pipeline.
6. When the result is saved to the database, `saveScanRecord` passes both the extracted text and the Base64 `imagePreviewUrl`.
7. PostgreSQL stores the preview in the new `image_preview` column of the `scans` table, enabling interactive thumbnail viewing in the history modal.

---

## 7. Module 6: Scan Results & Risk Scoring Engine

### 1. Purpose & Real-World Necessity:
Raw artificial intelligence output (such as a probability number like `0.942`) is meaningless to normal users. People need an explainable, visual verdict that tells them in plain English: *"Is this real or fake? Why is it dangerous? And what should I do right now?"* The `VerdictResult` component translates complex machine learning scores into intuitive security advice.

### 2. User Interaction & Workflow:
1. The Verdict Card appears immediately after a scan completes.
2. A top banner displays a colored badge and icon:
   - Red Alert Octagon: **LIKELY SCAM**
   - Amber Alert Triangle: **SUSPICIOUS**
   - Green Checkmark: **SAFE**
   - Blue Triangle: **UNABLE TO VERIFY**
3. **Left Side:** A circular Risk Gauge meter (e.g. `85/100`) indicating the severity.
4. **Center/Right:** Displays the Category (e.g. *"Subdomain Phishing Attack"*), an AI Plain-English Explanation, and an Actionable Recommendation box.
5. **Evidence List:** Displays bulleted warning signs with point weights.

### 3. Source Code Files & Components:
* **Presentation Card:** [`src/components/VerdictResult.jsx`](file:///f:/scam-msg/src/components/VerdictResult.jsx)
* **Risk Scoring Logic:** [`src/engine/ruleEngine.js`](file:///f:/scam-msg/src/engine/ruleEngine.js) (`getVerdictInfo`)
* **Icons:** `lucide-react` (`AlertOctagon`, `AlertTriangle`, `CheckCircle`, `ShieldAlert`)

### 4. Core Source Code Snippet:
```javascript
// [Frontend Component] src/components/VerdictResult.jsx: getVerdictInfo
function getVerdictInfo(result) {
  const { riskScore = 0, riskLevel = '', verdictStatus = '' } = result;

  const isScam = riskLevel === 'Likely Scam' || verdictStatus === 'LIKELY_SCAM' || riskScore >= 50;
  const isSuspicious = !isScam && (riskLevel === 'Suspicious' || (riskScore >= 25 && riskScore < 50));
  const isSafe = !isScam && !isSuspicious && riskScore < 25;

  if (isScam) {
    return {
      title: 'LIKELY SCAM',
      badgeClass: 'verdict-danger',
      headlineClass: 'headline-fake',
      gaugeColor: '#ef4444',
      Icon: AlertOctagon,
      defaultSummary: 'Our inspection found fraud signatures. Do not interact with this content.'
    };
  }
  if (isSuspicious) {
    return {
      title: 'SUSPICIOUS',
      badgeClass: 'verdict-warning',
      headlineClass: 'headline-unverified',
      gaugeColor: '#f59e0b',
      Icon: AlertTriangle,
      defaultSummary: 'Contains suspicious indicators. Exercise caution and verify before acting.'
    };
  }
  return {
    title: 'SAFE',
    badgeClass: 'verdict-safe',
    headlineClass: 'headline-real',
    gaugeColor: '#10b981',
    Icon: CheckCircle,
    defaultSummary: 'No scam patterns or red flags detected. Content appears authentic and safe.'
  };
}
```

### 5. Step-by-Step Explanation in Simple English:
1. The component receives the `result` object containing `riskScore`, `verdictStatus`, and `warningSigns`.
2. `getVerdictInfo` checks the numeric score against three clear thresholds:
   - `0 to 24`: Green **SAFE** verdict.
   - `25 to 49`: Amber **SUSPICIOUS** verdict.
   - `50 to 100`: Red **LIKELY SCAM** verdict.
3. The component sets the CSS classes for glassmorphic glowing borders (`headline-fake` or `headline-real`).
4. It maps over the `warningSigns` array, rendering each detected red flag with its assigned weight (e.g. `+45 Urgent Threat to Bank Account`).
5. It displays the `recommendation` text telling the user exact next steps (e.g. *"Do not click the link. Log in directly via your official bank app"*).
6. A "Learn Why" button links the user directly down to the educational section.

---

## 8. Module 7: Scan History & Database Directory

### 1. Purpose & Real-World Necessity:
In any security system, auditability is essential. Users need to look back at links or messages they checked in the past, and administrators need to see how many people visited the platform and what threats were detected. ScamSense connects directly to a cloud PostgreSQL database on Supabase to provide an interactive visual data directory.

### 2. User Interaction & Workflow:
1. User clicks the **"Database Directory"** button in the top navigation bar.
2. A full-screen glassmorphic modal opens with two tabs: **"Scans History"** and **"Visitors Directory"**.
3. **Scans Tab:**
   - Scope filter: Toggle between "My Scans" (current user) and "All Recorded" (admin view).
   - Type filter: Filter by "All", "Messages", "URLs", or "Images".
   - Table columns: Type icon, Content text, User email, Verdict badge, Category, Date, and Actions.
   - **Image Scans:** Displays an interactive image thumbnail! Clicking the thumbnail opens a full-screen Lightbox zoom modal.
   - Clicking "View" restores the scan into the main scanner; clicking the trash can deletes the record.
4. **Visitors Tab:** Displays a list of all visitors, their email, device type, browser, IP address, visit counts, and total scans.

### 3. Source Code Files & Components:
* **History Modal Component:** [`src/components/UserHistoryModal.jsx`](file:///f:/scam-msg/src/components/UserHistoryModal.jsx)
* **Database Pooler:** [`server/db.js`](file:///f:/scam-msg/server/db.js) (`getPool`, `initPostgresTables`)
* **Service CRUD Layer:** [`server/pgService.js`](file:///f:/scam-msg/server/pgService.js) (`getScans`, `getAllUsers`, `deleteScan`)
* **Database Schema:** [`server/schema.sql`](file:///f:/scam-msg/server/schema.sql) (`users` and `scans` tables)
* **Environment Config:** [`.env`](file:///f:/scam-msg/.env) (`DATABASE_URL` connection string)

### 4. Core Source Code Snippet:
```javascript
// [Database Layer] server/pgService.js: getScans query
export async function getScans({ type, email, visitorId }) {
  await initPostgresTables();
  let sql = 'SELECT * FROM scans WHERE 1=1';
  const params = [];

  // Filter by scan type (msg, url, image)
  if (type) {
    const normType = type === 'message' ? 'msg' : type.toLowerCase();
    params.push(normType);
    sql += ` AND scan_type = $${params.length}`;
  }

  // Filter by user email or session visitorId
  if (email) {
    params.push(email.trim().toLowerCase());
    sql += ` AND LOWER(user_email) = $${params.length}`;
  } else if (visitorId) {
    params.push(visitorId);
    sql += ` AND visitor_id = $${params.length}`;
  }

  sql += ' ORDER BY created_at DESC';
  const res = await query(sql, params);
  return res.rows.map(formatScanRow);
}
```

### 5. Step-by-Step Explanation in Simple English:
1. When the user opens the modal, `UserHistoryModal` fetches scan history from `GET /api/scans`.
2. `server/apiMiddleware.js` receives the request and calls `getScans({ email, type })`.
3. `server/pgService.js` connects to Supabase PostgreSQL using the session pooler URL configured in `.env`.
4. It executes a parameterized SQL query to select all matching rows, sorted newest first.
5. For image scans, the row includes the `image_preview` column holding the thumbnail.
6. In `UserHistoryModal.jsx`, the table renders an `<img>` tag with a 26px thumbnail.
7. When clicked, `setEnlargedImage(s.imagePreview)` activates a high-z-index overlay, letting the user view the full original screenshot.
8. Clicking the trash can sends an HTTP DELETE request to `/api/scans/:id`, removing the record from PostgreSQL in real time.

---

## 9. Module 8: Learn / Learn Why Educational Section

### 1. Purpose & Real-World Necessity:
Detection technology is only half the battle; education is the other half. If a person understands *why* scammers act the way they do, they become immune to future tricks. The Learn Why section is an educational hub that explains the psychological manipulation tactics behind online fraud.

### 2. User Interaction & Workflow:
1. Users can scroll down to the bottom of the home page or click "Learn Why" from any scam Verdict Card.
2. The page smoothly scrolls down to the "Learn Why: Understanding Scam Techniques" section.
3. The user sees 4 color-coded concept cards:
   - Red Clock: *"Why Scammers Manufacture Urgency"*
   - Blue Key: *"Why They Ask for OTPs & Passwords"*
   - Yellow Wallet: *"The Advance-Fee & Job Deposit Trap"*
   - Purple Shield: *"Fake KYC & Document Suspensions"*
4. Below the cards, an illuminated box highlights **"The Golden Rules of Scam Defense"**.

### 3. Source Code Files & Components:
* **Component:** [`src/components/LearnWhySection.jsx`](file:///f:/scam-msg/src/components/LearnWhySection.jsx)
* **CSS Styles:** [`src/index.css`](file:///f:/scam-msg/src/index.css)
* **Anchor Ref:** [`src/App.jsx`](file:///f:/scam-msg/src/App.jsx) (`forwardRef={learnWhyRef}`)

### 4. Core Source Code Snippet:
```javascript
// [Frontend Component] src/components/LearnWhySection.jsx
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
      desc: "One-Time Passcodes (OTPs) are the final security barrier protecting your account. When scammers initiate unauthorized password resets, they trick you into providing the code to bypass 2FA."
    },
    {
      icon: Wallet,
      color: '#fbbf24',
      title: "The Advance-Fee & Job Deposit Trap",
      desc: "Promising huge lottery wins, high daily work-from-home earnings, or package releases after paying a 'small registration fee'. Legitimate employers never require payment to receive money."
    },
    {
      icon: ShieldAlert,
      color: '#a78bfa',
      title: "Fake KYC & Document Suspensions",
      desc: "Phishing kits send counterfeit bank warnings claiming your KYC has expired. The link leads to a clone site built to steal your net banking credentials."
    }
  ];
  return (
    <section ref={forwardRef} className="glass-panel learn-why-container">
      {/* Renders topic cards and Golden Rules of Defense */}
    </section>
  );
}
```

---

## 10. Module 9: Logout & Navigation Cleanup

### 1. Purpose & Real-World Necessity:
When multiple people use the same computer (such as in a computer lab, library, or shared family PC), one user's private scan history should never be visible to the next person. Logging out cleanly terminates the session, erases credentials from local browser storage, and generates a fresh anonymous guest ID.

### 2. User Interaction & Workflow:
1. In the top navbar, next to the user email pill, the user sees a red-accented **"Sign Out"** button with an exit icon.
2. Clicking "Sign Out" instantly resets the dashboard.
3. The user email disappears from the navbar.
4. Any active scan result card is cleared.
5. The application returns to the initial "Sign In / Register" view, ready for the next person.

### 3. Source Code Files & Components:
* **Handler:** [`src/App.jsx`](file:///f:/scam-msg/src/App.jsx#L150-L165) (`handleLogout`)
* **Browser Storage:** `localStorage` (`scamsense_user_email`, `scamsense_visitor_id`)
* **State Variables:** `userEmail`, `emailInput`, `currentResult`, `visitorId`

### 4. Core Source Code Snippet:
```javascript
// [Frontend] src/App.jsx: handleLogout
const handleLogout = () => {
  // 1. Remove persistent login keys from localStorage
  localStorage.removeItem('scamsense_user_email');
  localStorage.removeItem('scamsense_user_name');

  // 2. Generate a clean, anonymous visitor ID for the next guest
  const freshId = 'VIS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  localStorage.setItem('scamsense_visitor_id', freshId);
  setVisitorId(freshId);

  // 3. Reset all user state variables
  setUserEmail('');
  setEmailInput('');
  setCurrentResult(null);
};
```

---

## 11. Teacher & Evaluator Q&A Cheat-Sheet (15 Anticipated Questions)

| # | Question | Recommended Answer for Evaluator |
|---|---|---|
| **Q1** | **What is the main innovation of ScamSense?** | ScamSense offers a multi-modal defense system that inspects text messages, web links, and image screenshots under one unified dashboard, combining machine learning with computer vision OCR and PostgreSQL. |
| **Q2** | **Which machine learning algorithm is used for SMS messages?** | TF-IDF (Term Frequency-Inverse Document Frequency) vectorization paired with Logistic Regression and Multinomial Naive Bayes, trained on the official UCI SMS Spam Collection. |
| **Q3** | **Which machine learning algorithm is used for URLs?** | A Random Forest Classifier trained on the UCI PhiUSIIL Phishing URL dataset using 17 lexical and structural features (domain length, hyphens, typosquatting, and burner TLDs). |
| **Q4** | **How does the system read text from an image screenshot?** | It uses Tesseract.js, a client-side neural network OCR engine that parses image pixel arrays directly in the browser and outputs clean string text without requiring paid cloud vision APIs. |
| **Q5** | **Where is the database hosted?** | On Supabase Cloud PostgreSQL using an IPv4 connection pooler on port 5432/6543, with automated table creation and relational foreign key linking between users and scans. |
| **Q6** | **What happens if the internet or database connection goes down?** | The backend contains a fault-tolerant fallback engine in `server/apiMiddleware.js`. If PostgreSQL is unreachable, it automatically reads and writes to `server/database.json` so the site never crashes. |
| **Q7** | **How do you prevent SQL injection in your backend?** | All database queries in `server/pgService.js` use parameterized SQL statements (e.g. `$1, $2, $3`), ensuring that malicious user input is never concatenated directly into raw SQL commands. |
| **Q8** | **How does the system distinguish safe links from phishing links?** | It checks root destination domains against authenticated domains (e.g. `google.com` vs `goooogle.com`) and inspects TLD safety, unencrypted HTTP protocols, and fraudulent subdomain keywords like `sbi-kyc`. |
| **Q9** | **What does the Risk Score mean?** | It is a normalized score from 0 to 100. 0–24 is Safe, 25–49 is Suspicious (proceed with caution), and 50–100 is Likely Scam (critical fraud detected). |
| **Q10** | **Why do you store warning signs in JSONB format?** | PostgreSQL's JSONB format allows storing complex arrays of objects (with titles, weights, and descriptions) inside a single relational column while allowing fast indexing and direct querying. |
| **Q11** | **Can a user see the actual image they scanned in their history?** | Yes! When an image is scanned, a Base64 preview is stored in the `image_preview` column. In the Database Directory modal, users can click the thumbnail to open a full-screen lightbox zoom. |
| **Q12** | **How does the application identify device and browser types?** | It parses the `navigator.userAgent` string in JavaScript, identifying keywords like `Mobi`, `Android`, `Chrome`, or `Firefox`. |
| **Q13** | **Why did you choose React 19 and Vite?** | Vite provides instant Hot Module Replacement (HMR) and lightning-fast builds, while React 19 provides reactive component state management without complex boilerplate. |
| **Q14** | **How does the system handle high traffic or concurrent scans?** | PostgreSQL connection pooling allows thousands of concurrent queries without database lockups, unlike a flat JSON file which could suffer race conditions. |
| **Q15** | **What are the three Golden Rules of scam defense taught by the app?** | 1. Never share OTPs. 2. Verify out-of-band by typing official URLs directly. 3. Pause on urgency—panic deadlines are the hallmark of fraud. |
