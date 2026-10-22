# backend/url_features.py
"""
URL Feature Extraction and Explainability Engine for Phishing Detection.
Extracts structural, lexical, and security attributes from URLs to feed into
a trained machine learning model, and provides human-readable explanations.
"""

import re
import math
from urllib.parse import urlparse

# Common suspicious top-level domains frequently abused in phishing campaigns
SUSPICIOUS_TLDS = {
    'xyz', 'top', 'tk', 'ml', 'ga', 'cf', 'gq', 'buzz', 'fit', 
    'work', 'cn', 'pw', 'cc', 'club', 'info', 'icu', 'cam', 'rest', 'surf'
}

# Credential and sensitive keywords targeted by phishing sites
SENSITIVE_KEYWORDS = [
    'login', 'signin', 'verify', 'verification', 'account', 'banking', 
    'secure', 'update', 'security', 'confirm', 'wallet', 'admin', 
    'password', 'service', 'support', 'authenticate', 'billing', 'recover'
]

# High-profile brands frequently targeted for domain spoofing / typosquatting
TARGET_BRANDS = [
    'paypal', 'google', 'apple', 'microsoft', 'amazon', 'netflix', 
    'chase', 'wellsfargo', 'sbi', 'hdfc', 'facebook', 'instagram', 'binance'
]

IP_PATTERN = re.compile(r'^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$')

FEATURE_NAMES = [
    'url_length',
    'domain_length',
    'is_ip',
    'count_dots',
    'count_hyphens',
    'count_at',
    'count_slashes',
    'count_digits',
    'digit_ratio',
    'has_https',
    'suspicious_tld',
    'has_sensitive_keyword',
    'brand_in_subdomain',
    'entropy',
    'subdomain_count',
    'double_slash_path',
    'has_punycode'
]


def calculate_entropy(text: str) -> float:
    """Calculates Shannon character entropy of a given text string."""
    if not text:
        return 0.0
    text = str(text)
    prob = [float(text.count(c)) / len(text) for c in dict.fromkeys(list(text))]
    return - sum([p * math.log(p) / math.log(2.0) for p in prob])


def parse_clean_url(raw_url: str):
    """Parses a raw URL string, ensuring a scheme is present for parsing."""
    url = (raw_url or '').strip()
    if not url.startswith(('http://', 'https://')):
        # Default scheme for parsing if absent
        parsed = urlparse('http://' + url)
        has_explicit_https = False
    else:
        parsed = urlparse(url)
        has_explicit_https = url.lower().startswith('https://')
    return url, parsed, has_explicit_https


def extract_url_features(raw_url: str):
    """
    Extracts a 17-dimensional numerical feature vector from a given URL.
    Returns: list of floats/ints corresponding to FEATURE_NAMES.
    """
    clean_url, parsed, has_https_scheme = parse_clean_url(raw_url)
    
    host = parsed.netloc.lower()
    path = parsed.path.lower()
    query = parsed.query.lower()
    full_lower = clean_url.lower()
    
    # Separate domain and port if present
    domain = host.split(':')[0]
    domain_parts = domain.split('.') if domain else []
    tld = domain_parts[-1] if len(domain_parts) > 1 else ''
    
    # 1. Lengths
    url_length = len(clean_url)
    domain_length = len(domain)
    
    # 2. Hostname characteristics
    is_ip = 1 if IP_PATTERN.match(domain) else 0
    
    # 3. Delimiter counts
    count_dots = clean_url.count('.')
    count_hyphens = clean_url.count('-')
    count_at = clean_url.count('@')
    count_slashes = clean_url.count('/')
    
    # 4. Digit characteristics
    count_digits = sum(c.isdigit() for c in clean_url)
    digit_ratio = count_digits / max(1, url_length)
    
    # 5. Security & TLD
    has_https = 1 if has_https_scheme else 0
    suspicious_tld = 1 if tld in SUSPICIOUS_TLDS else 0
    
    # 6. Keywords
    has_sensitive_keyword = 1 if any(kw in path or kw in query or kw in domain for kw in SENSITIVE_KEYWORDS) else 0
    
    # 7. Brand in subdomain (e.g. paypal.com.attacker.com)
    brand_in_subdomain = 0
    for brand in TARGET_BRANDS:
        if brand in domain and not domain.endswith('.' + brand + '.' + tld) and domain != brand + '.' + tld:
            brand_in_subdomain = 1
            break
            
    # 8. Character entropy
    entropy = calculate_entropy(clean_url)
    
    # 9. Subdomain count
    subdomain_count = max(0, len(domain_parts) - 2)
    
    # 10. Double slash in path (redirect tricks)
    double_slash_path = 1 if '//' in path else 0
    
    # 11. Punycode (IDN homograph attack)
    has_punycode = 1 if 'xn--' in domain else 0
    
    return [
        url_length,
        domain_length,
        is_ip,
        count_dots,
        count_hyphens,
        count_at,
        count_slashes,
        count_digits,
        digit_ratio,
        has_https,
        suspicious_tld,
        has_sensitive_keyword,
        brand_in_subdomain,
        entropy,
        subdomain_count,
        double_slash_path,
        has_punycode
    ]


def explain_url_prediction(raw_url: str, phishing_prob: float):
    """
    Translates raw feature values and model output into human-readable
    warning signs and explainability points for non-technical users.
    """
    clean_url, parsed, has_https = parse_clean_url(raw_url)
    host = parsed.netloc.lower().split(':')[0]
    path = parsed.path.lower()
    query = parsed.query.lower()
    tld = host.split('.')[-1] if '.' in host else ''
    
    warning_signs = []
    
    # 1. IP address hostname
    if IP_PATTERN.match(host):
        warning_signs.append({
            'id': 'url_ip_host',
            'title': 'Raw IP Address Instead of Domain Name',
            'category': 'Suspicious Infrastructure',
            'weight': 35,
            'description': f"The web address uses a raw numerical IP address ({host}) instead of an accredited domain name. Legitimate organizations host websites on registered brand domains.",
            'matchedWords': [host]
        })
        
    # 2. Insecure HTTP
    if not has_https:
        warning_signs.append({
            'id': 'url_no_https',
            'title': 'Unencrypted HTTP Connection (No SSL)',
            'category': 'Transport Security',
            'weight': 20,
            'description': 'This website does not use modern HTTPS encryption. Data entered here could be intercepted in plaintext, and authentic banking/login portals strictly enforce HTTPS.',
            'matchedWords': ['http://']
        })
        
    # 3. Suspicious high-abuse TLD
    if tld in SUSPICIOUS_TLDS:
        warning_signs.append({
            'id': 'url_suspicious_tld',
            'title': f'High-Risk Top-Level Domain (.{tld})',
            'category': 'Domain Reputation',
            'weight': 25,
            'description': f"The domain uses the '.{tld}' extension, which is disproportionately associated with cheap, disposable spam and phishing campaigns rather than legitimate institutions.",
            'matchedWords': [f'.{tld}']
        })
        
    # 4. Brand impersonation in subdomain or path
    found_brands = [b for b in TARGET_BRANDS if b in host and not host.endswith(f"{b}.{tld}") and host != f"{b}.{tld}"]
    if found_brands:
        warning_signs.append({
            'id': 'url_brand_spoof',
            'title': f"Brand Impersonation in Hostname ({found_brands[0]})",
            'category': 'Deceptive Naming',
            'weight': 40,
            'description': f"The domain contains the brand name '{found_brands[0]}', but is registered under an unauthorized third-party host ({host}). This is a classic phishing spoofing tactic.",
            'matchedWords': found_brands
        })
        
    # 5. Sensitive action keywords
    found_keywords = [kw for kw in SENSITIVE_KEYWORDS if kw in path or kw in query or kw in host]
    if found_keywords:
        warning_signs.append({
            'id': 'url_sensitive_keywords',
            'title': f"Credential / Action Keyword Detected ({found_keywords[0]})",
            'category': 'Credential Harvesting',
            'weight': 25,
            'description': f"The URL path or query contains sensitive keywords ({', '.join(found_keywords[:3])}) typically targeted for password or identity theft.",
            'matchedWords': found_keywords[:3]
        })
        
    # 6. Multiple subdomains / Excessive dots
    if host.count('.') >= 3:
        warning_signs.append({
            'id': 'url_deep_subdomain',
            'title': 'Complex Nested Subdomains',
            'category': 'URL Obfuscation',
            'weight': 15,
            'description': f"The hostname ({host}) contains {host.count('.')} sub-levels, frequently used to disguise malicious destinations behind misleading subdomains.",
            'matchedWords': [host]
        })
        
    # 7. Unusual URL length
    if len(clean_url) > 75:
        warning_signs.append({
            'id': 'url_excessive_length',
            'title': f"Unusually Long Web Address ({len(clean_url)} chars)",
            'category': 'Structure Anomaly',
            'weight': 15,
            'description': 'Phishing links often append lengthy random tokens or tracking parameters to bypass simple URL blocklists.',
            'matchedWords': [f"{len(clean_url)} characters"]
        })
        
    # 8. Suspicious @ symbol
    if '@' in clean_url:
        warning_signs.append({
            'id': 'url_at_symbol',
            'title': "Deceptive '@' Character in URL",
            'category': 'URL Redirection',
            'weight': 35,
            'description': "In internet URLs, text before an '@' symbol represents login credentials, causing the browser to ignore the preceding text and navigate to the address following '@'.",
            'matchedWords': ['@']
        })
        
    # 9. High character entropy (randomized strings)
    entropy = calculate_entropy(clean_url)
    if entropy > 4.25:
        warning_signs.append({
            'id': 'url_high_entropy',
            'title': f"High Randomness / Entropy Score ({entropy:.2f})",
            'category': 'Algorithmic Anomaly',
            'weight': 15,
            'description': 'The URL characters exhibit high entropy, indicating automated generation or random string obfuscation characteristic of phishing toolkits.',
            'matchedWords': [f"Entropy: {entropy:.2f}"]
        })
        
    return warning_signs
