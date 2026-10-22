// server/apiMiddleware.js
// Express-like middleware that handles auth, users, and scan history
// Supports PostgreSQL (Supabase/Neon/Local) with fallback to server/database.json

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isPgConfigured } from './db.js';
import {
  upsertUser,
  updateUserName,
  getAllUsers,
  insertScan,
  getScans,
  deleteScan
} from './pgService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'database.json');

// Helper to determine if a string is a URL
function isUrlString(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('www.') ||
    /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/i.test(trimmed)
  );
}

// Helper to normalize a scan record for JSON storage
function normalizeScan(scan, fallbackType = 'msg') {
  if (!scan || typeof scan !== 'object') return scan;

  const rawType = (scan.scanType || fallbackType || 'msg').toLowerCase();
  const text = scan.submittedText || scan.message || scan.url || scan.image || '';

  if (rawType === 'url') {
    return {
      ...scan,
      scanType: 'url',
      msg: null,
      message: null,
      url: scan.url !== undefined && scan.url !== null ? scan.url : text,
      image: null,
      submittedText: text
    };
  } else if (rawType === 'image') {
    return {
      ...scan,
      scanType: 'image',
      msg: null,
      message: null,
      url: null,
      image: scan.image !== undefined && scan.image !== null ? scan.image : text,
      submittedText: text
    };
  } else {
    const msgVal = scan.message !== undefined && scan.message !== null ? scan.message : (scan.msg !== undefined && scan.msg !== null ? scan.msg : text);
    return {
      ...scan,
      scanType: 'msg',
      msg: msgVal,
      message: msgVal,
      url: null,
      image: null,
      submittedText: text
    };
  }
}

// Helper to de-duplicate an array of records by unique 'id'
function dedupeById(arr) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  return arr.filter(item => {
    if (!item || !item.id) return false;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

// Helper to read database.json
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = { visitors: [], scans: [], msg: [], message: [], url: [], image: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const data = JSON.parse(raw);
    if (!data.visitors) data.visitors = [];
    const rawMsg = data.msg || data.message || [];
    const rawUrl = data.url || [];
    const rawImage = data.image || [];

    data.msg = dedupeById(rawMsg.map(s => normalizeScan(s, 'msg')));
    data.url = dedupeById(rawUrl.map(s => normalizeScan(s, 'url')));
    data.image = dedupeById(rawImage.map(s => normalizeScan(s, 'image')));
    data.message = [...data.msg];
    data.scans = dedupeById([...data.msg, ...data.url, ...data.image]).sort((a, b) => (b.id > a.id ? 1 : -1));
    return data;
  } catch (err) {
    console.error('Error reading database.json:', err);
    return { visitors: [], scans: [], msg: [], message: [], url: [], image: [] };
  }
}

// Helper to save database.json
function saveDB(data) {
  try {
    const msgNormalized = dedupeById((data.msg || data.message || []).map(s => normalizeScan(s, 'msg')));
    const urlNormalized = dedupeById((data.url || []).map(s => normalizeScan(s, 'url')));
    const imageNormalized = dedupeById((data.image || []).map(s => normalizeScan(s, 'image')));
    const allScans = dedupeById([...msgNormalized, ...urlNormalized, ...imageNormalized]).sort((a, b) => (b.id > a.id ? 1 : -1));

    const cleaned = {
      visitors: dedupeById(data.visitors || []),
      scans: allScans,
      msg: msgNormalized,
      message: [...msgNormalized],
      url: urlNormalized,
      image: imageNormalized
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(cleaned, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving database.json:', err);
    return false;
  }
}

// Format readable date
function formatDate(date = new Date()) {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).replace(',', ' at');
}

// Helper to insert scan in JSON DB
function insertScanRecordJSON(db, scanData) {
  const {
    userId,
    userEmail,
    submittedText,
    scanType,
    verdictStatus,
    riskScore,
    riskLevel,
    category,
    warningSigns,
    explanation,
    recommendation,
    message,
    url,
    image
  } = scanData;

  const rawText = (submittedText || message || url || image || '').trim();
  let normalizedType = (scanType || '').toLowerCase();
  if (normalizedType === 'message') normalizedType = 'msg';

  if (!normalizedType) {
    if (message !== undefined && message !== null) normalizedType = 'msg';
    else if (url !== undefined && url !== null) normalizedType = 'url';
    else if (image !== undefined && image !== null) normalizedType = 'image';
    else if (isUrlString(rawText)) normalizedType = 'url';
    else normalizedType = 'msg';
  }

  let messageColumn = null;
  let urlColumn = null;
  let imageColumn = null;

  if (normalizedType === 'url') {
    urlColumn = url !== undefined && url !== null ? url : rawText;
  } else if (normalizedType === 'image') {
    imageColumn = image !== undefined && image !== null ? image : rawText;
  } else {
    normalizedType = 'msg';
    messageColumn = message !== undefined && message !== null ? message : rawText;
  }

  const scanId = `SCN-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
  const cleanEmail = (scanData.userEmail || scanData.email || '').trim().toLowerCase() || null;

  const newScan = {
    id: scanId,
    visitorId: scanData.visitorId || null,
    visitorName: null,
    userEmail: cleanEmail,
    submittedText: rawText,
    scanType: normalizedType,
    msg: messageColumn,
    message: messageColumn,
    url: urlColumn,
    image: imageColumn,
    imagePreview: scanData.imagePreview || (imageColumn && imageColumn.startsWith('data:') ? imageColumn : null),
    verdictStatus: verdictStatus || 'SAFE',
    riskScore: typeof riskScore === 'number' ? riskScore : 0,
    riskLevel: riskLevel || 'Safe',
    category: category || 'General',
    warningSigns: Array.isArray(warningSigns) ? warningSigns : [],
    explanation: explanation || '',
    recommendation: recommendation || '',
    verdictSummary: scanData.verdictSummary || '',
    scanDateTime: formatDate()
  };

  if (!db.msg) db.msg = [];
  if (!db.message) db.message = [];
  if (!db.url) db.url = [];
  if (!db.image) db.image = [];
  if (!db.scans) db.scans = [];

  if (normalizedType === 'msg') {
    db.msg.unshift(newScan);
    db.message = [...db.msg];
  } else if (normalizedType === 'url') {
    db.url.unshift(newScan);
  } else if (normalizedType === 'image') {
    db.image.unshift(newScan);
  }
  db.scans.unshift(newScan);

  // Update scansCount in visitors
  if (db.visitors) {
    db.visitors.forEach(v => {
      if ((cleanEmail && (v.email || '').toLowerCase() === cleanEmail) || (v.id && v.id === newScan.visitorId)) {
        v.scansCount = (v.scansCount || 0) + 1;
        v.lastActive = formatDate();
      }
    });
  }

  saveDB(db);
  return { newScan, storedCategory: normalizedType };
}

// Parse request body JSON
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

// Send JSON response helper
function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(data));
}

// Main API Middleware
export async function apiMiddleware(req, res, next) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const method = req.method;

  // Handle CORS Pre-flight
  if (method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.end();
    return;
  }

  // Only handle /api/ routes
  if (!pathname.startsWith('/api/')) {
    if (next) return next();
    return;
  }

  try {
    const usePostgres = isPgConfigured();

    // 1. Database Status
    if (pathname === '/api/db-status' && method === 'GET') {
      return sendJson(res, 200, {
        success: true,
        type: usePostgres ? 'postgresql' : 'json_file',
        configured: usePostgres,
        message: usePostgres ? 'Connected to PostgreSQL' : 'Using local database.json (Set DATABASE_URL to use PostgreSQL)'
      });
    }

    // 2. Visitor / User Enter (Login & Session Tracking)
    if (pathname === '/api/visitors/enter' && method === 'POST') {
      const { visitorId, email, device, browser } = await parseBody(req);
      const cleanEmail = (email || '').trim().toLowerCase() || null;
      const clientIp = req.socket?.remoteAddress || '127.0.0.1';

      if (usePostgres) {
        const visitor = await upsertUser({
          visitorId,
          email: cleanEmail,
          device: device || 'Desktop / Browser',
          browser: browser || 'Web Browser',
          ip: clientIp
        });
        const allVisitors = await getAllUsers();
        return sendJson(res, 200, { success: true, visitor, allVisitors });
      }

      // JSON Fallback
      const db = readDB();
      if (!db.visitors) db.visitors = [];
      let visitor = null;

      // Prioritize email matching
      if (cleanEmail) {
        visitor = db.visitors.find(v => (v.email || '').toLowerCase() === cleanEmail);
      }
      // If not found by email, match by visitorId ONLY IF visitor has no conflicting email
      if (!visitor && visitorId) {
        const existing = db.visitors.find(v => v.id === visitorId);
        if (existing && (!existing.email || existing.email.toLowerCase() === cleanEmail)) {
          visitor = existing;
        }
      }

      const currentTime = formatDate();

      if (!visitor) {
        const generatedId = cleanEmail 
          ? `USR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
          : (visitorId || `VIS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
        visitor = {
          id: generatedId,
          email: cleanEmail,
          device: device || 'Desktop / Browser',
          browser: browser || 'Web Browser',
          ip: clientIp,
          firstEntered: currentTime,
          lastActive: currentTime,
          visitsCount: 1,
          scansCount: 0
        };
        db.visitors.unshift(visitor);
      } else {
        visitor.visitsCount = (visitor.visitsCount || 1) + 1;
        visitor.lastActive = currentTime;
        if (cleanEmail) visitor.email = cleanEmail;
        if (device) visitor.device = device;
        if (browser) visitor.browser = browser;
      }

      if (db.scans) {
        visitor.scansCount = db.scans.filter(s =>
          (cleanEmail && (s.userEmail || '').toLowerCase() === cleanEmail) ||
          (s.visitorId && s.visitorId === visitor.id)
        ).length;
      }

      saveDB(db);
      return sendJson(res, 200, { success: true, visitor, allVisitors: db.visitors });
    }

    // 3. Update visitor display name
    if (pathname === '/api/visitors/name' && method === 'POST') {
      const { visitorId, email, name } = await parseBody(req);
      if ((!visitorId && !email) || !name) {
        return sendJson(res, 400, { success: false, message: 'visitorId/email and name required.' });
      }

      if (usePostgres) {
        const visitor = await updateUserName({ visitorId, email, name });
        const allVisitors = await getAllUsers();
        return sendJson(res, 200, { success: true, visitor, allVisitors });
      }

      const cleanEmail = (email || '').trim().toLowerCase() || null;
      const db = readDB();
      let visitor = null;
      if (cleanEmail) visitor = db.visitors.find(v => (v.email || '').toLowerCase() === cleanEmail);
      if (!visitor && visitorId) visitor = db.visitors.find(v => v.id === visitorId);

      if (visitor) {
        visitor.name = name.trim();
        if (cleanEmail) visitor.email = cleanEmail;
        saveDB(db);
        return sendJson(res, 200, { success: true, visitor, allVisitors: db.visitors });
      }
      return sendJson(res, 404, { success: false, message: 'Visitor not found.' });
    }

    // 4. Get all visitors
    if (pathname === '/api/visitors' && method === 'GET') {
      if (usePostgres) {
        const visitors = await getAllUsers();
        return sendJson(res, 200, { success: true, visitors });
      }
      const db = readDB();
      return sendJson(res, 200, { success: true, visitors: db.visitors || [] });
    }

    // 5. Store message scan
    if (pathname === '/api/msg' && method === 'POST') {
      const scanData = await parseBody(req);
      const textVal = scanData.message || scanData.submittedText;
      if (!textVal) return sendJson(res, 400, { success: false, message: 'Message text is required.' });
      scanData.scanType = 'msg';
      scanData.message = textVal;

      if (usePostgres) {
        const scan = await insertScan(scanData);
        return sendJson(res, 201, { success: true, scan, storedIn: 'message' });
      }
      const db = readDB();
      const { newScan } = insertScanRecordJSON(db, scanData);
      return sendJson(res, 201, { success: true, scan: newScan, storedIn: 'message' });
    }

    // 6. Store URL scan
    if (pathname === '/api/url' && method === 'POST') {
      const scanData = await parseBody(req);
      const urlVal = scanData.url || scanData.submittedText;
      if (!urlVal) return sendJson(res, 400, { success: false, message: 'URL is required.' });
      scanData.scanType = 'url';
      scanData.url = urlVal;

      if (usePostgres) {
        const scan = await insertScan(scanData);
        return sendJson(res, 201, { success: true, scan, storedIn: 'url' });
      }
      const db = readDB();
      const { newScan } = insertScanRecordJSON(db, scanData);
      return sendJson(res, 201, { success: true, scan: newScan, storedIn: 'url' });
    }

    // 7. Store Image scan
    if (pathname === '/api/image' && method === 'POST') {
      const scanData = await parseBody(req);
      const imgVal = scanData.image || scanData.submittedText;
      if (!imgVal) return sendJson(res, 400, { success: false, message: 'Image details are required.' });
      scanData.scanType = 'image';
      scanData.image = imgVal;

      if (usePostgres) {
        const scan = await insertScan(scanData);
        return sendJson(res, 201, { success: true, scan, storedIn: 'image' });
      }
      const db = readDB();
      const { newScan } = insertScanRecordJSON(db, scanData);
      return sendJson(res, 201, { success: true, scan: newScan, storedIn: 'image' });
    }

    // 8. General Scan save endpoint
    if (pathname === '/api/scans' && method === 'POST') {
      const scanData = await parseBody(req);
      if (!scanData.submittedText && !scanData.message && !scanData.url && !scanData.image) {
        return sendJson(res, 400, { success: false, message: 'Message text, URL, or image data is required.' });
      }

      if (usePostgres) {
        const scan = await insertScan(scanData);
        return sendJson(res, 201, { success: true, scan, storedIn: scan.scanType });
      }
      const db = readDB();
      const { newScan, storedCategory } = insertScanRecordJSON(db, scanData);
      return sendJson(res, 201, { success: true, scan: newScan, storedIn: storedCategory });
    }

    // 9. Fetch scans (supports ?type=msg | url | image and optional ?email or ?visitorId)
    if (pathname === '/api/scans' && method === 'GET') {
      const typeFilter = (url.searchParams.get('type') || '').toLowerCase();
      const emailFilter = (url.searchParams.get('email') || '').trim().toLowerCase();
      const visitorIdFilter = url.searchParams.get('visitorId');

      if (usePostgres) {
        const items = await getScans({ type: typeFilter, email: emailFilter, visitorId: visitorIdFilter });
        const allItems = (emailFilter || visitorIdFilter || typeFilter) ? await getScans({}) : items;
        return sendJson(res, 200, {
          success: true,
          scans: items,
          counts: {
            msg: allItems.filter(s => s.scanType === 'msg').length,
            url: allItems.filter(s => s.scanType === 'url').length,
            image: allItems.filter(s => s.scanType === 'image').length,
            total: allItems.length
          }
        });
      }

      // JSON Fallback
      const db = readDB();
      let targetItems = [];
      if (typeFilter === 'msg' || typeFilter === 'message') targetItems = db.msg || [];
      else if (typeFilter === 'url') targetItems = db.url || [];
      else if (typeFilter === 'image') targetItems = db.image || [];
      else {
        targetItems = db.scans || [...(db.msg || []), ...(db.url || []), ...(db.image || [])];
        targetItems.sort((a, b) => (b.id > a.id ? 1 : -1));
      }

      if (emailFilter) {
        targetItems = targetItems.filter(s => (s.userEmail || '').toLowerCase() === emailFilter);
      } else if (visitorIdFilter) {
        targetItems = targetItems.filter(s => s.visitorId === visitorIdFilter);
      }

      return sendJson(res, 200, {
        success: true,
        scans: targetItems,
        counts: {
          msg: (db.msg || []).length,
          url: (db.url || []).length,
          image: (db.image || []).length,
          total: (db.scans || []).length
        }
      });
    }

    // 10. Fetch only Messages
    if (pathname === '/api/msg' && method === 'GET') {
      if (usePostgres) {
        const items = await getScans({ type: 'msg' });
        return sendJson(res, 200, { success: true, items, count: items.length });
      }
      const db = readDB();
      return sendJson(res, 200, { success: true, items: db.msg || [], count: (db.msg || []).length });
    }

    // 11. Fetch only URLs
    if (pathname === '/api/url' && method === 'GET') {
      if (usePostgres) {
        const items = await getScans({ type: 'url' });
        return sendJson(res, 200, { success: true, items, count: items.length });
      }
      const db = readDB();
      return sendJson(res, 200, { success: true, items: db.url || [], count: (db.url || []).length });
    }

    // 12. Fetch only Images
    if (pathname === '/api/image' && method === 'GET') {
      if (usePostgres) {
        const items = await getScans({ type: 'image' });
        return sendJson(res, 200, { success: true, items, count: items.length });
      }
      const db = readDB();
      return sendJson(res, 200, { success: true, items: db.image || [], count: (db.image || []).length });
    }

    // 13. Delete a scan by ID
    if (pathname.startsWith('/api/scans/') && method === 'DELETE') {
      const scanId = pathname.replace('/api/scans/', '');

      if (usePostgres) {
        const deleted = await deleteScan(scanId);
        return sendJson(res, 200, { success: deleted, message: `Scan ${scanId} deleted.` });
      }

      const db = readDB();
      if (db.scans) db.scans = db.scans.filter(s => s.id !== scanId);
      if (db.msg) db.msg = db.msg.filter(s => s.id !== scanId);
      if (db.message) db.message = db.message.filter(s => s.id !== scanId);
      if (db.url) db.url = db.url.filter(s => s.id !== scanId);
      if (db.image) db.image = db.image.filter(s => s.id !== scanId);
      saveDB(db);
      return sendJson(res, 200, { success: true, message: `Scan ${scanId} deleted.` });
    }

    if (next) return next();
    return sendJson(res, 404, { error: 'Route not found' });
  } catch (err) {
    console.error('Server error:', err);
    return sendJson(res, 500, { error: 'Internal server error: ' + err.message });
  }
}
