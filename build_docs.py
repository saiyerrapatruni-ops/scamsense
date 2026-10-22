# build_docs.py
"""
Generates the comprehensive ScamSense_Project_Documentation.docx file.
Covers all 9 modules with code explanations, diagrams, step-by-step logic,
and simple explanations suitable for 10th-grade students, teachers, and evaluators.
"""

import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_cell_background(cell, hex_color):
    """Set background color of a table cell."""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color)
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Set cell margins (padding) in twentieths of a point (dxa)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_code_block(doc, code_text):
    """Creates a beautifully styled code box."""
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, 'F1F5F9')
    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
    
    # Left blue accent border
    tcPr = cell._tc.get_or_add_tcPr()
    borders = OxmlElement('w:tcBorders')
    left_b = OxmlElement('w:left')
    left_b.set(qn('w:val'), 'single')
    left_b.set(qn('w:sz'), '24')
    left_b.set(qn('w:space'), '0')
    left_b.set(qn('w:color'), '0284C7')
    borders.append(left_b)
    for b_name in ['top', 'bottom', 'right']:
        b = OxmlElement(f'w:{b_name}')
        b.set(qn('w:val'), 'none')
        borders.append(b)
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(code_text.strip())
    run.font.name = 'Consolas'
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor(15, 23, 42)
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def create_callout(doc, title, text, color_hex="0284C7", bg_hex="E0F2FE"):
    """Creates an eye-catching callout box."""
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, bg_hex)
    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = OxmlElement('w:tcBorders')
    left_b = OxmlElement('w:left')
    left_b.set(qn('w:val'), 'single')
    left_b.set(qn('w:sz'), '36')
    left_b.set(qn('w:color'), color_hex)
    borders.append(left_b)
    for b_name in ['top', 'bottom', 'right']:
        b = OxmlElement(f'w:{b_name}')
        b.set(qn('w:val'), 'none')
        borders.append(b)
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    run_title = p.add_run(f"💡 {title}\n")
    run_title.font.name = 'Arial'
    run_title.font.bold = True
    run_title.font.size = Pt(10.5)
    r_val = int(color_hex[:2], 16)
    g_val = int(color_hex[2:4], 16)
    b_val = int(color_hex[4:], 16)
    run_title.font.color.rgb = RGBColor(r_val, g_val, b_val)
    
    run_text = p.add_run(text)
    run_text.font.name = 'Arial'
    run_text.font.size = Pt(10)
    run_text.font.color.rgb = RGBColor(30, 41, 59)
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def format_table(tbl, col_widths, headers, data):
    """Formats a clean, modern table."""
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    # Header Row
    hdr_cells = tbl.rows[0].cells
    for i, h in enumerate(headers):
        hdr_cells[i].text = h
        set_cell_background(hdr_cells[i], '0F172A')
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for run in p.runs:
            run.font.bold = True
            run.font.name = 'Arial'
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(255, 255, 255)
            
    # Data Rows
    for row_idx, row_data in enumerate(data):
        row = tbl.add_row()
        bg = 'F8FAFC' if row_idx % 2 == 1 else 'FFFFFF'
        for col_idx, cell_value in enumerate(row_data):
            cell = row.cells[col_idx]
            cell.text = str(cell_value)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
            p = cell.paragraphs[0]
            for run in p.runs:
                run.font.name = 'Arial'
                run.font.size = Pt(9)
                run.font.color.rgb = RGBColor(30, 41, 59)
                
    # Column widths
    for row in tbl.rows:
        for idx, w in enumerate(col_widths):
            row.cells[idx].width = Inches(w)

print("Starting documentation compilation...")
doc = Document()

# Page Margins: Standard 1 inch
for section in doc.sections:
    section.top_margin = Inches(0.9)
    section.bottom_margin = Inches(0.9)
    section.left_margin = Inches(0.9)
    section.right_margin = Inches(0.9)

# -------------------------------------------------------------
# COVER / TITLE BLOCK
# -------------------------------------------------------------
title_p = doc.add_paragraph()
title_p.paragraph_format.space_before = Pt(10)
title_p.paragraph_format.space_after = Pt(2)
title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
t_run = title_p.add_run("ScamSense: Cyber Scam & Phishing Detection System")
t_run.font.name = 'Arial'
t_run.font.bold = True
t_run.font.size = Pt(24)
t_run.font.color.rgb = RGBColor(15, 23, 42)

sub_p = doc.add_paragraph()
sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
sub_p.paragraph_format.space_after = Pt(6)
sub_run = sub_p.add_run("Complete Project Architecture, Source Code Guide & Demonstration Manual")
sub_run.font.name = 'Arial'
sub_run.font.size = Pt(13)
sub_run.font.color.rgb = RGBColor(2, 132, 199)

meta_p = doc.add_paragraph()
meta_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
meta_p.paragraph_format.space_after = Pt(20)
meta_run = meta_p.add_run("Audience: Students, Educators, Evaluators & Software Engineers\nFramework: React 19 + Node.js + Python FastAPI + PostgreSQL (Supabase)")
meta_run.font.name = 'Arial'
meta_run.font.size = Pt(9.5)
meta_run.font.color.rgb = RGBColor(100, 116, 139)

doc.add_paragraph().paragraph_format.space_after = Pt(8)

# -------------------------------------------------------------
# SECTION 1: EXECUTIVE SUMMARY & ARCHITECTURE
# -------------------------------------------------------------
h1 = doc.add_heading("1. Executive Summary & System Overview", level=1)
h1.style.font.color.rgb = RGBColor(15, 23, 42)

doc.add_paragraph(
    "In today's digital world, millions of people receive fraudulent SMS messages, fake banking alerts, "
    "deceptive phishing websites, and counterfeit payment screenshots every day. Non-technical users often fall victim "
    "to cyber criminals because modern scams look virtually indistinguishable from authentic bank communications.\n\n"
    "ScamSense is an intelligent educational cyber defense platform. It gives everyday users an easy, visual tool "
    "to test any suspicious message, link, or image before interacting with it. The system analyzes the input using "
    "Machine Learning (ML), Natural Language Processing (NLP), and Computer Vision (OCR), returning an instant Risk Score (0-100), "
    "explainable warning flags, and concrete safety guidance."
)

create_callout(
    doc,
    "The 10th-Grade Analogy (For Students and Teachers)",
    "Think of ScamSense like an automated security guard at an airport scanner:\n"
    "• If a person brings a suitcase (a text message or URL), the scanner examines its contents against a database of known dangerous items.\n"
    "• If they bring a photograph or document (an image), the optical scanner reads the text off the photo first.\n"
    "• The guard gives an immediate green/yellow/red badge, points out exactly what weapon or fake item was found, and writes down a visitor log in a secure notebook (PostgreSQL database)."
)

# Tech Stack Table
headers = ["Architecture Layer", "Primary Technology", "Real Code Location", "Key Responsibility"]
col_w = [1.4, 1.4, 1.8, 2.3]
data = [
    ["Frontend UI", "React 19, Vite, Lucide Icons", "src/App.jsx, src/components/", "Interactive single-page app with dark cyber-glassmorphism theme."],
    ["Detection Engine (ML)", "Scikit-Learn, Joblib, Python", "backend/main.py, backend/train.py", "FastAPI inference with TF-IDF and Random Forest models."],
    ["Detection Engine (Rule)", "Regular Expressions & Heuristics", "src/engine/ruleEngine.js", "Instant client-side fraud pattern matching and zero-day defense."],
    ["Vision Engine (OCR)", "Tesseract.js (LSTM Neural Net)", "src/engine/ruleEngine.js", "Extracts text from uploaded screenshots in the browser."],
    ["Backend API", "Node.js HTTP Server", "server/server.js, apiMiddleware.js", "Handles user session tracking, scan persistence, and database routing."],
    ["Database Layer", "PostgreSQL (Cloud Supabase)", "server/db.js, server/schema.sql", "Stores users, sessions, scan history, JSONB warning signs, and image previews."]
]
tbl = doc.add_table(rows=1, cols=4)
format_table(tbl, col_w, headers, data)
doc.add_paragraph().paragraph_format.space_after = Pt(12)

# -------------------------------------------------------------
# 9 MODULE SECTIONS (DETAILED BREAKDOWNS)
# -------------------------------------------------------------
modules = [
    {
        "num": "2",
        "title": "Module 1: Login Page & User Authentication",
        "purpose": "Why It Exists & Why It Is Needed:\nIn web applications, users need a way to preserve their scan history and access their past fraud records across different devices. Without authentication, as soon as a user closes their browser or refreshes the page, their scan logs would vanish. ScamSense implements a streamlined email-based authentication system that pairs persistent local sessions with cloud PostgreSQL user records.",
        "ui": "How the User Interacts with the UI:\n1. If a user is not yet logged in, the application displays a modern 'Sign In / Register' card before accessing the scanner.\n2. The user sees an input box: 'Your Email Address *'.\n3. They type their email (e.g. 'dev@gmail.com') and click the gradient button 'Continue & Load My History'.\n4. If an invalid email format is entered (such as 'dev@' without a domain), a red warning message displays: 'Please enter a valid email address'.\n5. Upon successful entry, the login box smoothly unmounts and the full Scanner Dashboard is revealed.",
        "files": "Actual Files & Components Involved:\n• Frontend Component: src/App.jsx (lines 105–150)\n• API Client: src/services/apiService.js (function logVisitorEnter)\n• Backend Endpoint: server/apiMiddleware.js (route POST /api/visitors/enter)\n• Database Layer: server/pgService.js (function upsertUser)\n• Database Table: users table in PostgreSQL (server/schema.sql)",
        "code": """// [Frontend] src/App.jsx: handleLogin
const handleLogin = async (e) => {
  if (e) e.preventDefault();
  const cleanEmail = emailInput.trim().toLowerCase();

  // Validate email structure using regex
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
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
};""",
        "step_by_step": "Step-by-Step Code Walkthrough in Simple English:\n1. The user types their email into the text field. The component state 'emailInput' holds this string.\n2. When the submit button is clicked, 'handleLogin' prevents default HTML page reloads.\n3. The email is stripped of trailing spaces and converted to lowercase so 'Dev@Gmail.com' and 'dev@gmail.com' are recognized as the same user.\n4. A regular expression tests if the email contains an '@' symbol and a valid domain dot.\n5. The browser's 'navigator.userAgent' string is inspected to classify whether the user is on a Mobile phone, Tablet, or Desktop PC.\n6. An HTTP POST request is dispatched to '/api/visitors/enter'.\n7. The backend searches PostgreSQL for an existing user with that email. If found, it increments their visit counter ('visits_count + 1') and updates 'last_active'. If not found, it inserts a new row into the 'users' table.\n8. The user's active email is saved to the browser's 'localStorage' ('scamsense_user_email') so they stay logged in even if they refresh the tab.",
        "internal_flow": "Internal Click Event Lifecycle:\n[User Clicks 'Continue & Load My History']\n  ↓\n[handleLogin triggered in App.jsx]\n  ↓\n[Validate input with emailRegex]\n  ↓\n[Call logVisitorEnter() via apiService.js]\n  ↓\n[HTTP POST to http://localhost:5000/api/visitors/enter]\n  ↓\n[server/apiMiddleware.js intercepts request and extracts body]\n  ↓\n[server/pgService.js executes PostgreSQL SQL Query]\n  → SELECT * FROM users WHERE LOWER(email) = 'dev@gmail.com'\n  → If found: UPDATE users SET visits_count = visits_count + 1\n  → If not found: INSERT INTO users (id, email, device, browser, visits_count) VALUES (...)\n  ↓\n[Backend returns JSON { success: true, visitor: {...} }]\n  ↓\n[Frontend stores email in localStorage and switches UI view]",
        "io_data": [
            ["Input", "User's email string ('dev@gmail.com'), device signature, browser name."],
            ["Processing", "Regex validation, browser header parsing, PostgreSQL upsert query."],
            ["Output", "Saved user record in PostgreSQL, session token in localStorage."],
            ["Expected Result", "User is logged in, their specific scan history is loaded, and dashboard displays their email."]
        ]
    },
    {
        "num": "3",
        "title": "Module 2: Home Page & Dashboard Navigation",
        "purpose": "Why It Exists & Why It Is Needed:\nThe Home Page serves as the central command cockpit. It introduces the user to ScamSense, informs them of their active session status, provides one-click navigation to their database records, and houses the scanner tabs. A clean, intuitive dashboard ensures non-technical users are never confused about where to paste content.",
        "ui": "How the User Interacts with the UI:\n1. Top Navbar: Displays the ScamSense shield logo, user account pill (showing 'dev@gmail.com'), session ID, a 'Database Directory' button with a cylinder icon, and a 'Sign Out' button.\n2. Hero Section: Displays an energetic cybersecurity heading: 'Check Any Suspicious Message, URL or Image'.\n3. Mode Selector Pills: Users can click three distinct mode tabs:\n   - 'Message' (SMS & WhatsApp)\n   - 'Website Link' (URLs)\n   - 'Image Screenshot' (Screenshots & Photos)\n4. Selecting a mode immediately adapts the input container below it.",
        "files": "Actual Files & Components Involved:\n• Main View: src/App.jsx (lines 305–370, 465–505)\n• Scanner Header & Tabs: src/components/ScannerInput.jsx (lines 60–105)\n• Styling Engine: src/index.css (hero-section, glass-panel, nav-header)",
        "code": """// [Frontend] src/components/ScannerInput.jsx: Mode Selection Tabs
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
</div>""",
        "step_by_step": "Step-by-Step Code Walkthrough in Simple English:\n1. The React state variable 'scanMode' stores the currently active tab (default is 'message').\n2. When the user clicks the 'Website Link' button, the 'onClick' listener calls 'setScanMode('url')'.\n3. React re-renders the component. The button with 'scanMode === url' gets the CSS class 'active', which illuminates it in cyber-blue.\n4. The input area below dynamically swaps: in 'message' mode it displays a large multi-line textarea; in 'url' mode it displays a single-line URL field with a link icon; in 'image' mode it renders a drag-and-drop file upload container.\n5. Pre-configured sample buttons appear above the box, allowing users to test authentic or scam examples with a single click.",
        "internal_flow": "Internal Click Event Lifecycle:\n[User clicks 'Website Link' tab]\n  ↓\n[onClick event calls setScanMode('url')]\n  ↓\n[React updates App component state]\n  ↓\n[ScannerInput re-evaluates isMode('url')]\n  ↓\n[DOM updates input box placeholder to 'https://...']\n  ↓\n[Sample pills update to URL samples: 'Fake Google Clone', 'Fake Bank Phishing']",
        "io_data": [
            ["Input", "User clicks on a navigation button or scanner tab."],
            ["Processing", "React state update, CSS class toggling, DOM element conditional rendering."],
            ["Output", "Illuminated active tab and dynamically swapped input container."],
            ["Expected Result", "Smooth transition between Message, URL, and Image scanning modes without page reload."]
        ]
    },
    {
        "num": "4",
        "title": "Module 3: Message Scan (SMS & WhatsApp Scam Detection)",
        "purpose": "Why It Exists & Why It Is Needed:\nSMS phishing ('Smishing') and WhatsApp scams are the number one cause of financial theft today. Attackers send messages pretending to be State Bank of India, electricity departments, or lottery foundations, threatening that your account will be closed unless you click a link or send money. The Message Scanner breaks down the text to find psychological coercion triggers.",
        "ui": "How the User Interacts with the UI:\n1. User ensures 'Message' tab is active.\n2. They can either type/paste their own SMS or click one of the convenient preset sample chips (e.g. 'Fake Bank KYC', 'Prize Lottery', 'Legitimate 2FA SMS').\n3. They click the glowing 'Scan Message' button.\n4. The button displays a spinning loading indicator ('Analyzing...').\n5. Within milliseconds, the page smoothly scrolls down to reveal the Verdict Card.",
        "files": "Actual Files & Components Involved:\n• UI Container: src/components/ScannerInput.jsx (lines 100–180)\n• App Coordinator: src/App.jsx (function handleAnalyze, lines 175–235)\n• Service Dispatcher: src/services/mlService.js (function predictMessageML)\n• Python ML Backend: backend/main.py (route POST /api/predict/message)\n• ML Training Script: backend/train.py (TF-IDF + Logistic Regression on UCI SMS Spam dataset)\n• Rule Engine: src/engine/ruleEngine.js (function analyzeMessage)",
        "code": """// [Frontend Service] src/services/mlService.js: predictMessageML
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
}""",
        "step_by_step": "Step-by-Step Code Walkthrough in Simple English:\n1. When 'Scan Message' is clicked, 'handleAnalyze' retrieves the text from 'inputText'.\n2. It calls 'predictMessageML(inputText)'.\n3. The function first makes a network call to the Python FastAPI backend on port 8000.\n4. In 'backend/main.py', the text is vectorized into mathematical numbers using a pre-trained TF-IDF vectorizer (trained on 5,500+ messages from the official UCI SMS Spam Collection).\n5. The scikit-learn Logistic Regression model computes the probability that the message is Spam/Scam versus Ham (safe).\n6. If the Python backend is not running, 'mlService.js' automatically falls back to 'src/engine/ruleEngine.js', which checks regular expressions for urgency deadlines ('within 24 hours'), OTP theft, and bank impersonation.\n7. The calculated verdict, risk score, and warning signs are returned to 'App.jsx'.\n8. The result is automatically saved to the PostgreSQL database via 'saveScanRecord'.",
        "internal_flow": "Internal Click Event Lifecycle:\n[User Clicks 'Scan Message']\n  ↓\n[setIsAnalyzing(true) → Button shows spinner]\n  ↓\n[predictMessageML() calls backend /api/predict/message]\n  ↓\n[TF-IDF vectorizer transforms message into 5,000-feature vector]\n  ↓\n[Logistic Regression model calculates spam probability]\n  ↓\n[Backend formats warning flags and returns JSON]\n  ↓\n[saveScanRecord() sends payload to Node.js /api/scans]\n  ↓\n[Node.js inserts scan into PostgreSQL scans table with user_email]\n  ↓\n[setCurrentResult(result) displays Verdict Card and scrolls down]",
        "io_data": [
            ["Input", "Text: 'Dear Customer, your SBI account KYC has expired. Blocked in 24 hours. http://sbi-kyc.top'"],
            ["Processing", "TF-IDF tokenization, Logistic Regression classification, regex urgency pattern matching."],
            ["Output", "Risk Score: 100/100, Verdict: 'LIKELY SCAM', Warning Signs: ['Urgent Threat to Bank Account', 'Phishing Link']."],
            ["Expected Result", "Clear warning informing user not to click the link or provide banking credentials."]
        ]
    },
    {
        "num": "5",
        "title": "Module 4: URL Scan (Phishing & Deceptive Websites)",
        "purpose": "Why It Exists & Why It Is Needed:\nPhishing websites are fake copies of real services (like Google, PayPal, or State Bank of India). Scammers register lookalike domains such as 'goooogle.com' or 'sbi-kyc-verify.top' to trick users into typing their passwords. The URL Scanner dissects the web address down to its anatomy to detect deceptive lookalikes.",
        "ui": "How the User Interacts with the UI:\n1. User clicks the 'Website Link' tab.\n2. The input field displays a link icon and placeholder: 'Paste suspicious website URL (e.g. http://sbi-kyc-verify.top)'.\n3. Users can paste a link or click samples: 'Fake Google Clone', 'Fake Bank Phishing', 'Real PayPal Link'.\n4. They click 'Scan Website'.\n5. The analysis runs and displays the domain classification.",
        "files": "Actual Files & Components Involved:\n• UI Component: src/components/ScannerInput.jsx (lines 140–185)\n• Service Layer: src/services/mlService.js (function predictUrlML)\n• Python ML Backend: backend/main.py (route POST /api/predict/url)\n• Feature Extractor: backend/url_features.py (extract_url_features)\n• ML Model: backend/models/url_model.joblib (Random Forest trained on UCI PhiUSIIL Phishing Dataset)\n• Heuristic Fallback: src/engine/ruleEngine.js (function analyzeUrl)",
        "code": """# [Python ML Backend] backend/url_features.py: extract_url_features
def extract_url_features(url_str: str) -> dict:
    parsed = urllib.parse.urlparse(url_str)
    domain = parsed.netloc.lower() or parsed.path.lower()
    
    # 1. Check for typosquatting / repeating characters (e.g. goooogle.com)
    repeated_chars = 1 if re.search(r'([a-z])\\1{2,}', domain) else 0
    
    # 2. Check for deceptive subdomain brand prefixing (e.g. sbi-kyc.top)
    is_subdomain_trick = 1 if ('sbi' in domain and not domain.endswith('sbi.co.in')) else 0
    
    # 3. Check for high-risk burner domain extensions (.top, .xyz, .buzz)
    risky_tlds = ['.top', '.xyz', '.tk', '.buzz', '.ga', '.cf', '.ml']
    has_risky_tld = 1 if any(domain.endswith(t) for t in risky_tlds) else 0
    
    return {
        'url_length': len(url_str),
        'num_dots': domain.count('.'),
        'num_hyphens': domain.count('-'),
        'has_ip_address': 1 if re.match(r'\\d+\\.\\d+\\.\\d+\\.\\d+', domain) else 0,
        'is_http_insecure': 1 if parsed.scheme == 'http' else 0,
        'repeated_chars': repeated_chars,
        'is_subdomain_trick': is_subdomain_trick,
        'has_risky_tld': has_risky_tld
    }""",
        "step_by_step": "Step-by-Step Code Walkthrough in Simple English:\n1. The user inputs a website address, for example 'http://sbi-kyc-verify.top/login'.\n2. 'predictUrlML' forwards the link to the Python backend.\n3. 'extract_url_features' parses the link using Python's standard 'urllib.parse'.\n4. It measures lexical features: link length, number of dots, number of hyphens.\n5. It inspects domain structure: it identifies that 'sbi-kyc-verify' is using the brand name 'SBI', but the root domain ends in '.top', NOT the authentic 'sbi.co.in'.\n6. It checks the protocol: it notices plain unencrypted 'http://' instead of secure 'https://'.\n7. These numerical features are fed into a Random Forest Classifier trained on over 10,000 URLs from the UCI PhiUSIIL dataset.\n8. The model returns a high scam probability. The backend formats an explanation: 'Phishing clone / lookalike domain'.\n9. The scan is recorded into PostgreSQL in the 'url' column (leaving 'message' and 'image' as NULL).",
        "internal_flow": "Internal Click Event Lifecycle:\n[User enters URL and clicks 'Scan Website']\n  ↓\n[predictUrlML() dispatches POST to /api/predict/url]\n  ↓\n[Python backend parses URL into 17 structural features]\n  ↓\n[Random Forest decision trees evaluate feature vector]\n  ↓\n[Calculates Risk Score: 100/100, Flags: Brand Impersonation & Unsafe TLD]\n  ↓\n[Node.js backend stores URL scan into PostgreSQL database]\n  ↓\n[Frontend displays Verdict Card with red Alert Octagon icon]",
        "io_data": [
            ["Input", "URL: 'www.goooogle.com'"],
            ["Processing", "Domain parsing, regex character repetition detection, Random Forest evaluation."],
            ["Output", "Risk Score: 75/100, Category: 'Brand Impersonation Phishing', Level: 'Likely Scam'."],
            ["Expected Result", "Identifies typosquatting clone targeting Google and advises user not to proceed."]
        ]
    },
    {
        "num": "6",
        "title": "Module 5: Image Scan (Computer Vision & OCR Vision Engine)",
        "purpose": "Why It Exists & Why It Is Needed:\nModern cybercriminals frequently send screenshots or images instead of text to bypass traditional email spam filters. For example, victims receive a WhatsApp image of a fake electricity disconnection notice. Users cannot easily copy-paste text from an image. The Image Scanner uses Computer Vision (OCR) to read the letters directly off the picture and analyze them automatically.",
        "ui": "How the User Interacts with the UI:\n1. User clicks the 'Image Screenshot' tab.\n2. A dashed drag-and-drop zone appears with an upload cloud icon: 'Click to upload or drag and drop image screenshot (PNG, JPG, WEBP)'.\n3. The user drags a screenshot file into the box or clicks to browse their files.\n4. When selected, an instant image preview appears with a thumbnail and a 'Remove' button.\n5. An optional text box allows them to add context notes (e.g. 'Received this on WhatsApp').\n6. The user clicks 'Scan Image Screenshot'.\n7. OCR processes the image in the background, extracts the text, and renders the verdict.",
        "files": "Actual Files & Components Involved:\n• Dropzone UI: src/components/ScannerInput.jsx (lines 185–245)\n• Image Handler: src/App.jsx (handleImageSelect, handleImageRemove)\n• OCR Neural Engine: src/engine/ruleEngine.js (function analyzeImage)\n• External Library: Tesseract.js (LSTM Optical Character Recognition)\n• Database Storage: server/pgService.js (stores image thumbnail in image_preview column)",
        "code": """// [Frontend Engine] src/engine/ruleEngine.js: analyzeImage (OCR Vision)
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
}""",
        "step_by_step": "Step-by-Step Code Walkthrough in Simple English:\n1. The user selects an image file from their device. In 'App.jsx', 'handleImageSelect' reads the file into memory using HTML5 'FileReader' and converts it into a Base64 Data URL for instant visual preview.\n2. When the user clicks 'Scan', 'App.jsx' executes 'analyzeImage(selectedImage, imageNotes)'.\n3. The function invokes 'Tesseract.recognize', which runs a client-side neural network trained on English font characters. It scans every line of pixels in the image to reconstruct the words into text.\n4. The extracted string is concatenated with any user notes.\n5. The combined text is passed directly into 'analyzeTextMessage', which runs the NLP scam detection pipeline.\n6. When the result is saved to the database, 'saveScanRecord' passes both the extracted text and the Base64 'imagePreviewUrl'.\n7. PostgreSQL stores the preview in the new 'image_preview' column of the 'scans' table, enabling interactive thumbnail viewing in the history modal.",
        "internal_flow": "Internal Click Event Lifecycle:\n[User drops image file into dropzone]\n  ↓\n[FileReader converts file to Data URL preview]\n  ↓\n[User clicks 'Scan Image Screenshot']\n  ↓\n[Tesseract.js loads eng.traineddata neural network]\n  ↓\n[Image pixels analyzed → Text extracted: 'SBI Alert: KYC Expired...']\n  ↓\n[Extracted text evaluated by NLP scam rules]\n  ↓\n[saveScanRecord sends extracted text + image Data URL to backend]\n  ↓\n[PostgreSQL inserts record with image_preview into scans table]\n  ↓\n[Frontend displays Verdict Card with image thumbnail]",
        "io_data": [
            ["Input", "Image file (e.g. 'bank_alert.png') containing text 'Your account is blocked within 24 hours.'"],
            ["Processing", "Pixel raster scan, Tesseract neural OCR text extraction, NLP urgency analysis."],
            ["Output", "Risk Score: 85/100, Verdict: 'LIKELY SCAM', Extracted Text, Image thumbnail preview."],
            ["Expected Result", "User sees exactly what text was read from the photo and receives a fraud warning."]
        ]
    },
    {
        "num": "7",
        "title": "Module 6: Scan Results & Risk Scoring Engine",
        "purpose": "Why It Exists & Why It Is Needed:\nRaw artificial intelligence output (such as a probability number like '0.942') is meaningless to normal users. People need an explainable, visual verdict that tells them in plain English: 'Is this real or fake? Why is it dangerous? And what should I do right now?' The VerdictResult component translates complex machine learning scores into intuitive security advice.",
        "ui": "How the User Interacts with the UI:\n1. The Verdict Card appears immediately after a scan completes.\n2. A top banner displays a colored badge and icon:\n   - Red Alert Octagon: 'LIKELY SCAM'\n   - Amber Alert Triangle: 'SUSPICIOUS'\n   - Green Checkmark: 'SAFE'\n   - Blue Triangle: 'UNABLE TO VERIFY'\n3. Left Side: A circular Risk Gauge meter (e.g. '85/100') indicating the severity.\n4. Center/Right: Displays the Category (e.g. 'Subdomain Phishing Attack'), an AI Plain-English Explanation, and an Actionable Recommendation box.\n5. Evidence List: Displays bulleted warning signs with point weights.",
        "files": "Actual Files & Components Involved:\n• Presentation Card: src/components/VerdictResult.jsx (lines 19–115, 116–285)\n• Risk Scoring Logic: src/engine/ruleEngine.js (function getVerdictInfo)\n• Icons: lucide-react (AlertOctagon, AlertTriangle, CheckCircle, ShieldAlert)",
        "code": """// [Frontend Component] src/components/VerdictResult.jsx: getVerdictInfo
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
}""",
        "step_by_step": "Step-by-Step Code Walkthrough in Simple English:\n1. The component receives the 'result' object containing 'riskScore', 'verdictStatus', and 'warningSigns'.\n2. 'getVerdictInfo' checks the numeric score against three clear thresholds:\n   - 0 to 24: Green 'SAFE' verdict.\n   - 25 to 49: Amber 'SUSPICIOUS' verdict.\n   - 50 to 100: Red 'LIKELY SCAM' verdict.\n3. The component sets the CSS classes for glassmorphic glowing borders ('headline-fake' or 'headline-real').\n4. It maps over the 'warningSigns' array, rendering each detected red flag with its assigned weight (e.g. '+45 Urgent Threat to Bank Account').\n5. It displays the 'recommendation' text telling the user exact next steps (e.g. 'Do not click the link. Log in directly via your official bank app').\n6. A 'Learn Why' button links the user directly down to the educational section.",
        "internal_flow": "Internal Click Event Lifecycle:\n[Scan completes in App.jsx]\n  ↓\n[setCurrentResult(result) is called]\n  ↓\n[VerdictResult mounts in the DOM]\n  ↓\n[getVerdictInfo evaluates score thresholds]\n  ↓\n[Renders colored banner, risk meter gauge, and evidence list]\n  ↓\n[Smoothly scrolls viewport to the card]",
        "io_data": [
            ["Input", "Result object: { riskScore: 85, verdictStatus: 'LIKELY_SCAM', category: 'Bank Fraud' }."],
            ["Processing", "Threshold evaluation, color badge mapping, warning sign list rendering."],
            ["Output", "Rendered glassmorphic Verdict Card with gauge meter and actionable advice."],
            ["Expected Result", "User immediately grasps the danger level and knows how to protect themselves."]
        ]
    },
    {
        "num": "8",
        "title": "Module 7: Scan History & Database Directory",
        "purpose": "Why It Exists & Why It Is Needed:\nIn any security system, auditability is essential. Users need to look back at links or messages they checked in the past, and administrators need to see how many people visited the platform and what threats were detected. ScamSense connects directly to a cloud PostgreSQL database on Supabase to provide an interactive visual data directory.",
        "ui": "How the User Interacts with the UI:\n1. User clicks the 'Database Directory' button in the top navigation bar.\n2. A full-screen glassmorphic modal opens with two tabs: 'Scans History' and 'Visitors Directory'.\n3. Scans Tab:\n   - Scope filter: Toggle between 'My Scans' (current user) and 'All Recorded' (admin view).\n   - Type filter: Filter by 'All', 'Messages', 'URLs', or 'Images'.\n   - Table columns: Type icon, Content text, User email, Verdict badge, Category, Date, and Actions.\n   - Image Scans: Displays an interactive image thumbnail! Clicking the thumbnail opens a full-screen Lightbox zoom modal.\n   - Clicking 'View' restores the scan into the main scanner; clicking the trash can deletes the record.\n4. Visitors Tab: Displays a list of all visitors, their email, device type, browser, IP address, visit counts, and total scans.",
        "files": "Actual Files & Components Involved:\n• History Modal Component: src/components/UserHistoryModal.jsx (lines 44–435)\n• Database Pooler: server/db.js (getPool, initPostgresTables)\n• Service CRUD Layer: server/pgService.js (getScans, getAllUsers, deleteScan)\n• Database Schema: server/schema.sql (users and scans tables)\n• Environment Config: .env (DATABASE_URL connection string)",
        "code": """// [Database Layer] server/pgService.js: getScans query
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
}""",
        "step_by_step": "Step-by-Step Code Walkthrough in Simple English:\n1. When the user opens the modal, 'UserHistoryModal' fetches scan history from 'GET /api/scans'.\n2. 'server/apiMiddleware.js' receives the request and calls 'getScans({ email, type })'.\n3. 'server/pgService.js' connects to Supabase PostgreSQL using the session pooler URL configured in '.env'.\n4. It executes a parameterized SQL query to select all matching rows, sorted newest first.\n5. For image scans, the row includes the 'image_preview' column holding the thumbnail.\n6. In 'UserHistoryModal.jsx', the table renders an '<img>' tag with a 26px thumbnail.\n7. When clicked, 'setEnlargedImage(s.imagePreview)' activates a high-z-index overlay, letting the user view the full original screenshot.\n8. Clicking the trash can sends an HTTP DELETE request to '/api/scans/:id', removing the record from PostgreSQL in real time.",
        "internal_flow": "Internal Click Event Lifecycle:\n[User clicks 'Database Directory' button]\n  ↓\n[setShowHistoryModal(true) mounts modal]\n  ↓\n[apiService.js calls GET /api/scans and GET /api/visitors]\n  ↓\n[Node.js queries Supabase PostgreSQL tables: users and scans]\n  ↓\n[Database returns JSON rows array]\n  ↓\n[Modal renders interactive table with filter buttons and image thumbnails]\n  ↓\n[User clicks thumbnail → enlargedImage lightbox opens full screen]",
        "io_data": [
            ["Input", "User clicks 'Database Directory' and toggles filters."],
            ["Processing", "SQL SELECT query with WHERE filters, parameterized query execution, array deduplication."],
            ["Output", "Rendered table of historical scans and visitor analytics with zoomable image previews."],
            ["Expected Result", "User can audit past scans, view screenshots, or inspect visitor statistics."]
        ]
    },
    {
        "num": "9",
        "title": "Module 8: Learn / Learn Why Educational Section",
        "purpose": "Why It Exists & Why It Is Needed:\nDetection technology is only half the battle; education is the other half. If a person understands *why* scammers act the way they do, they become immune to future tricks. The Learn Why section is an educational hub that explains the psychological manipulation tactics behind online fraud.",
        "ui": "How the User Interacts with the UI:\n1. Users can scroll down to the bottom of the home page or click 'Learn Why' from any scam Verdict Card.\n2. The page smoothly scrolls down to the 'Learn Why: Understanding Scam Techniques' section.\n3. The user sees 4 color-coded concept cards:\n   - Red Clock: 'Why Scammers Manufacture Urgency'\n   - Blue Key: 'Why They Ask for OTPs & Passwords'\n   - Yellow Wallet: 'The Advance-Fee & Job Deposit Trap'\n   - Purple Shield: 'Fake KYC & Document Suspensions'\n4. Below the cards, an illuminated box highlights 'The Golden Rules of Scam Defense'.",
        "files": "Actual Files & Components Involved:\n• Component: src/components/LearnWhySection.jsx (lines 1–74)\n• CSS Styles: src/index.css (learn-why-container, learn-why-card, safe-action-rules)\n• Anchor Ref: src/App.jsx (forwardRef={learnWhyRef})",
        "code": """// [Frontend Component] src/components/LearnWhySection.jsx
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
}""",
        "step_by_step": "Step-by-Step Code Walkthrough in Simple English:\n1. 'LearnWhySection' defines a static array of educational topics, each assigned a dedicated Lucide icon and color.\n2. When a user clicks 'Learn Why' on a scan result, 'handleScrollToLearnWhy' in 'App.jsx' executes 'learnWhyRef.current?.scrollIntoView({ behavior: 'smooth' })'.\n3. The browser smoothly animates the viewport directly to the section.\n4. The component maps through the 'topics' array and renders four glassmorphic cards with icon circles.\n5. A summary box at the bottom details the three Golden Rules:\n   - Rule 1: Never share OTPs.\n   - Rule 2: Verify out-of-band (type your bank's website yourself).\n   - Rule 3: Pause on urgency (artificial deadlines equal danger).",
        "internal_flow": "Internal Click Event Lifecycle:\n[User clicks 'Learn Why' button on Verdict Card]\n  ↓\n[handleScrollToLearnWhy() is triggered in App.jsx]\n  ↓\n[Browser scrolls to learnWhyRef HTML element smoothly]\n  ↓\n[User reads educational concepts and defense guidelines]",
        "io_data": [
            ["Input", "User clicks 'Learn Why' or scrolls to the footer section."],
            ["Processing", "Smooth scroll event execution, array mapping into UI cards."],
            ["Output", "Illustrated cyber defense knowledge cards and golden security rules."],
            ["Expected Result", "User learns the psychological motives of cyber scammers."]
        ]
    },
    {
        "num": "10",
        "title": "Module 9: Logout & Navigation Cleanup",
        "purpose": "Why It Exists & Why It Is Needed:\nWhen multiple people use the same computer (such as in a computer lab, library, or shared family PC), one user's private scan history should never be visible to the next person. Logging out cleanly terminates the session, erases credentials from local browser storage, and generates a fresh anonymous guest ID.",
        "ui": "How the User Interacts with the UI:\n1. In the top navbar, next to the user email pill, the user sees a red-accented 'Sign Out' button with an exit icon.\n2. Clicking 'Sign Out' instantly resets the dashboard.\n3. The user email disappears from the navbar.\n4. Any active scan result card is cleared.\n5. The application returns to the initial 'Sign In / Register' view, ready for the next person.",
        "files": "Actual Files & Components Involved:\n• Handler: src/App.jsx (function handleLogout, lines 150–165)\n• Browser Storage: localStorage ('scamsense_user_email', 'scamsense_visitor_id')\n• State Variables: userEmail, emailInput, currentResult, visitorId",
        "code": """// [Frontend] src/App.jsx: handleLogout
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
};""",
        "step_by_step": "Step-by-Step Code Walkthrough in Simple English:\n1. The user clicks the 'Sign Out' button in the navbar.\n2. 'handleLogout' is invoked.\n3. 'localStorage.removeItem' removes 'scamsense_user_email' so the browser no longer remembers who was logged in.\n4. A random 6-character identifier prefixed with 'VIS-' is generated (e.g. 'VIS-WNYH9E') and assigned to 'visitorId'. This guarantees that the next session starts completely fresh and cannot overwrite the previous user's account.\n5. 'setUserEmail('')' clears the active email, which causes React's conditional rendering to hide the scanner and present the clean login form.\n6. 'setCurrentResult(null)' wipes the currently displayed scan card from view.",
        "internal_flow": "Internal Click Event Lifecycle:\n[User clicks 'Sign Out' button]\n  ↓\n[handleLogout() executed in App.jsx]\n  ↓\n[localStorage removes scamsense_user_email]\n  ↓\n[New guest ID generated: VIS-XXXXXX]\n  ↓\n[setUserEmail('') resets state]\n  ↓\n[React renders Sign In form, hiding scanner and results]",
        "io_data": [
            ["Input", "User clicks 'Sign Out' button."],
            ["Processing", "localStorage key purging, guest ID generation, React state reset."],
            ["Output", "Cleared session, reset input fields, return to login screen."],
            ["Expected Result", "User is logged out securely; subsequent users cannot see previous scan history."]
        ]
    }
]

for m in modules:
    h2 = doc.add_heading(f"{m['num']}. {m['title']}", level=1)
    h2.style.font.color.rgb = RGBColor(15, 23, 42)
    
    # 1. Purpose
    p_pur = doc.add_paragraph()
    r = p_pur.add_run("1. Purpose & Real-World Necessity:\n")
    r.font.bold = True
    r.font.color.rgb = RGBColor(2, 132, 199)
    p_pur.add_run(m['purpose'])
    
    # 2. UI Interaction
    p_ui = doc.add_paragraph()
    r = p_ui.add_run("2. User Interaction & Workflow:\n")
    r.font.bold = True
    r.font.color.rgb = RGBColor(2, 132, 199)
    p_ui.add_run(m['ui'])
    
    # 3. Files Involved
    p_files = doc.add_paragraph()
    r = p_files.add_run("3. Source Code Files & Components:\n")
    r.font.bold = True
    r.font.color.rgb = RGBColor(2, 132, 199)
    p_files.add_run(m['files'])
    
    # 4. Code Block
    p_c = doc.add_paragraph()
    r = p_c.add_run("4. Core Source Code Snippet:")
    r.font.bold = True
    r.font.color.rgb = RGBColor(2, 132, 199)
    create_code_block(doc, m['code'])
    
    # 5. Step-by-Step
    p_step = doc.add_paragraph()
    r = p_step.add_run("5. Step-by-Step Explanation in Simple English:\n")
    r.font.bold = True
    r.font.color.rgb = RGBColor(2, 132, 199)
    p_step.add_run(m['step_by_step'])
    
    # 6. Internal Event Flow
    p_flow = doc.add_paragraph()
    r = p_flow.add_run("6. Internal Click & Execution Lifecycle:\n")
    r.font.bold = True
    r.font.color.rgb = RGBColor(2, 132, 199)
    p_flow.add_run(m['internal_flow'])
    
    # 7. Input/Processing/Output Table
    p_io = doc.add_paragraph()
    r = p_io.add_run("7. Input, Processing & Expected Output Table:")
    r.font.bold = True
    r.font.color.rgb = RGBColor(2, 132, 199)
    
    tbl_io = doc.add_table(rows=1, cols=2)
    format_table(tbl_io, [1.8, 5.2], ["Stage", "Description"], m['io_data'])
    doc.add_paragraph().paragraph_format.space_after = Pt(14)

# -------------------------------------------------------------
# SECTION 11: EVALUATION & TEACHER Q&A CHEAT-SHEET
# -------------------------------------------------------------
h1_qa = doc.add_heading("11. Teacher & Evaluator Q&A Cheat-Sheet (15 Anticipated Questions)", level=1)
h1_qa.style.font.color.rgb = RGBColor(15, 23, 42)

doc.add_paragraph(
    "Use these concise, technically sound answers when teachers or evaluators ask questions during your demo:"
)

qa_pairs = [
    ("Q1: What is the main innovation of ScamSense?", 
     "ScamSense offers a multi-modal defense system that inspects text messages, web links, and image screenshots under one unified dashboard, combining machine learning with computer vision OCR and PostgreSQL."),
    ("Q2: Which machine learning algorithm is used for SMS messages?", 
     "TF-IDF (Term Frequency-Inverse Document Frequency) vectorization paired with Logistic Regression and Multinomial Naive Bayes, trained on the official UCI SMS Spam Collection."),
    ("Q3: Which machine learning algorithm is used for URLs?", 
     "A Random Forest Classifier trained on the UCI PhiUSIIL Phishing URL dataset using 17 lexical and structural features (domain length, hyphens, typosquatting, and burner TLDs)."),
    ("Q4: How does the system read text from an image screenshot?", 
     "It uses Tesseract.js, a client-side neural network OCR engine that parses image pixel arrays directly in the browser and outputs clean string text without requiring paid cloud vision APIs."),
    ("Q5: Where is the database hosted?", 
     "On Supabase Cloud PostgreSQL using an IPv4 connection pooler on port 5432/6543, with automated table creation and relational foreign key linking between users and scans."),
    ("Q6: What happens if the internet or database connection goes down?", 
     "The backend contains a fault-tolerant fallback engine in 'server/apiMiddleware.js'. If PostgreSQL is unreachable, it automatically reads and writes to 'server/database.json' so the site never crashes."),
    ("Q7: How do you prevent SQL injection in your backend?", 
     "All database queries in 'server/pgService.js' use parameterized SQL statements (e.g. '$1, $2, $3'), ensuring that malicious user input is never concatenated directly into raw SQL commands."),
    ("Q8: How does the system distinguish safe links from phishing links?", 
     "It checks root destination domains against authenticated domains (e.g. google.com vs goooogle.com) and inspects TLD safety, unencrypted HTTP protocols, and fraudulent subdomain keywords like 'sbi-kyc'."),
    ("Q9: What does the Risk Score mean?", 
     "It is a normalized score from 0 to 100. 0–24 is Safe, 25–49 is Suspicious (proceed with caution), and 50–100 is Likely Scam (critical fraud detected)."),
    ("Q10: Why do you store warning signs in JSONB format?", 
     "PostgreSQL's JSONB format allows storing complex arrays of objects (with titles, weights, and descriptions) inside a single relational column while allowing fast indexing and direct querying."),
    ("Q11: Can a user see the actual image they scanned in their history?", 
     "Yes! When an image is scanned, a Base64 preview is stored in the 'image_preview' column. In the Database Directory modal, users can click the thumbnail to open a full-screen lightbox zoom."),
    ("Q12: How does the application identify device and browser types?", 
     "It parses the 'navigator.userAgent' string in JavaScript, identifying keywords like 'Mobi', 'Android', 'Chrome', or 'Firefox'."),
    ("Q13: Why did you choose React 19 and Vite?", 
     "Vite provides instant Hot Module Replacement (HMR) and lightning-fast builds, while React 19 provides reactive component state management without complex boilerplate."),
    ("Q14: How does the system handle high traffic or concurrent scans?", 
     "PostgreSQL connection pooling allows thousands of concurrent queries without database lockups, unlike a flat JSON file which could suffer race conditions."),
    ("Q15: What are the three Golden Rules of scam defense taught by the app?", 
     "1. Never share OTPs. 2. Verify out-of-band by typing official URLs directly. 3. Pause on urgency—panic deadlines are the hallmark of fraud.")
]

tbl_qa = doc.add_table(rows=1, cols=2)
format_table(tbl_qa, [2.2, 4.8], ["Question", "Recommended Answer for Evaluator"], qa_pairs)

# Save document
out_path = os.path.abspath("ScamSense_Project_Documentation.docx")
doc.save(out_path)
print(f"Documentation successfully created at: {out_path}")
print(f"File size: {os.path.getsize(out_path)} bytes")
