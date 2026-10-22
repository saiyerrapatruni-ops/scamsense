// server/pgService.js
// PostgreSQL Service Layer for ScamSense (Users & Scans)
import { query, initPostgresTables } from './db.js';

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

/**
 * Map DB user row to frontend expected format
 */
function formatUserRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    device: row.device,
    browser: row.browser,
    ip: row.ip,
    firstEntered: row.first_entered,
    lastActive: row.last_active,
    visitsCount: row.visits_count || 1,
    scansCount: row.scans_count || 0,
    createdAt: row.created_at
  };
}

/**
 * Map DB scan row to frontend expected format
 */
function formatScanRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    visitorId: row.visitor_id,
    visitorName: row.visitor_name,
    submittedText: row.submitted_text,
    scanType: row.scan_type,
    msg: row.msg,
    message: row.message,
    url: row.url,
    image: row.image,
    imagePreview: row.image_preview || (row.image && row.image.startsWith('data:') ? row.image : null),
    verdictStatus: row.verdict_status,
    riskScore: row.risk_score,
    riskLevel: row.risk_level,
    category: row.category,
    warningSigns: typeof row.warning_signs === 'string' ? JSON.parse(row.warning_signs) : (row.warning_signs || []),
    explanation: row.explanation,
    recommendation: row.recommendation,
    verdictSummary: row.verdict_summary,
    scanDateTime: row.scan_date_time,
    createdAt: row.created_at
  };
}

/**
 * Upsert User / Visitor session
 * Properly handles new logins (e.g. dev@gmail.com) by prioritizing email lookup
 */
export async function upsertUser({ visitorId, email, device, browser, ip }) {
  await initPostgresTables();
  const cleanEmail = email ? email.trim().toLowerCase() : null;
  const currentTime = formatDate();

  let user = null;

  // 1. If email is provided, check if user with this email already exists
  if (cleanEmail) {
    const res = await query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [cleanEmail]);
    if (res.rows.length > 0) {
      user = res.rows[0];
    }
  }

  // 2. If no user found by email, check by visitorId
  if (!user && visitorId) {
    const res = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [visitorId]);
    if (res.rows.length > 0) {
      // Only reuse this visitor row if it doesn't belong to a DIFFERENT email
      if (!res.rows[0].email || res.rows[0].email.toLowerCase() === cleanEmail) {
        user = res.rows[0];
      }
    }
  }

  if (user) {
    // Update existing user/visitor
    const newVisits = (user.visits_count || 1) + 1;
    const updateRes = await query(`
      UPDATE users 
      SET 
        visits_count = $1,
        last_active = $2,
        email = COALESCE($3, email),
        device = COALESCE($4, device),
        browser = COALESCE($5, browser),
        ip = COALESCE($6, ip),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [newVisits, currentTime, cleanEmail, device, browser, ip, user.id]);

    user = updateRes.rows[0];
  } else {
    // Create brand new user or visitor
    const newId = cleanEmail 
      ? `USR-${Math.random().toString(36).substring(2, 8).toUpperCase()}` 
      : (visitorId || `VIS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);

    const insertRes = await query(`
      INSERT INTO users (id, email, device, browser, ip, first_entered, last_active, visits_count, scans_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 0)
      RETURNING *
    `, [newId, cleanEmail, device || 'Desktop', browser || 'Web Browser', ip || '127.0.0.1', currentTime, currentTime]);

    user = insertRes.rows[0];
  }

  // Sync scan count
  const countRes = await query(`
    SELECT COUNT(*) as count FROM scans 
    WHERE (user_email IS NOT NULL AND LOWER(user_email) = $1)
       OR visitor_id = $2
  `, [cleanEmail || '', user.id]);

  const totalScans = parseInt(countRes.rows[0]?.count || 0, 10);
  if (totalScans !== user.scans_count) {
    await query('UPDATE users SET scans_count = $1 WHERE id = $2', [totalScans, user.id]);
    user.scans_count = totalScans;
  }

  return formatUserRow(user);
}

/**
 * Update User display name
 */
export async function updateUserName({ visitorId, email, name }) {
  await initPostgresTables();
  const cleanEmail = email ? email.trim().toLowerCase() : null;
  const cleanName = name ? name.trim() : null;

  let res = null;
  if (cleanEmail) {
    res = await query('UPDATE users SET name = $1 WHERE LOWER(email) = $2 RETURNING *', [cleanName, cleanEmail]);
  } else if (visitorId) {
    res = await query('UPDATE users SET name = $1 WHERE id = $2 RETURNING *', [cleanName, visitorId]);
  }

  return res && res.rows.length > 0 ? formatUserRow(res.rows[0]) : null;
}

/**
 * Fetch all users/visitors
 */
export async function getAllUsers() {
  await initPostgresTables();
  const res = await query('SELECT * FROM users ORDER BY updated_at DESC, created_at DESC');
  return res.rows.map(formatUserRow);
}

/**
 * Insert scan into PostgreSQL
 */
export async function insertScan(scanData) {
  await initPostgresTables();

  const scanId = `SCN-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
  const cleanEmail = (scanData.userEmail || scanData.email || '').trim().toLowerCase() || null;
  const rawType = (scanData.scanType || 'msg').toLowerCase();
  const rawText = (scanData.submittedText || scanData.message || scanData.url || scanData.image || '').trim();

  let normalizedType = rawType === 'message' ? 'msg' : rawType;
  if (!['msg', 'url', 'image'].includes(normalizedType)) normalizedType = 'msg';

  let msgCol = null;
  let urlCol = null;
  let imgCol = null;
  const imagePreview = scanData.imagePreview || (scanData.image && typeof scanData.image === 'string' && scanData.image.startsWith('data:') ? scanData.image : null);

  if (normalizedType === 'url') {
    urlCol = scanData.url || rawText;
  } else if (normalizedType === 'image') {
    imgCol = scanData.image || rawText;
  } else {
    normalizedType = 'msg';
    msgCol = scanData.message || scanData.msg || rawText;
  }

  const scanDateTime = formatDate();

  // Try to find matching user_id
  let userId = null;
  if (cleanEmail) {
    const userRes = await query('SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1', [cleanEmail]);
    if (userRes.rows.length > 0) userId = userRes.rows[0].id;
  }

  const insertRes = await query(`
    INSERT INTO scans (
      id, user_id, user_email, visitor_id, visitor_name,
      submitted_text, scan_type, msg, message, url, image, image_preview,
      verdict_status, risk_score, risk_level, category,
      warning_signs, explanation, recommendation, verdict_summary,
      scan_date_time
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10, $11, $12,
      $13, $14, $15, $16,
      $17, $18, $19, $20,
      $21
    ) RETURNING *
  `, [
    scanId,
    userId,
    cleanEmail,
    scanData.visitorId || null,
    scanData.visitorName || null,
    rawText,
    normalizedType,
    msgCol,
    msgCol,
    urlCol,
    imgCol,
    imagePreview,
    scanData.verdictStatus || 'SAFE',
    scanData.riskScore || 0,
    scanData.riskLevel || 'Safe',
    scanData.category || 'General',
    JSON.stringify(scanData.warningSigns || []),
    scanData.explanation || '',
    scanData.recommendation || '',
    scanData.verdictSummary || '',
    scanDateTime
  ]);

  // Update user's scans_count if user found
  if (userId || cleanEmail) {
    await query(`
      UPDATE users 
      SET scans_count = scans_count + 1, last_active = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 OR (email IS NOT NULL AND LOWER(email) = $3)
    `, [scanDateTime, userId, cleanEmail]);
  }

  return formatScanRow(insertRes.rows[0]);
}

/**
 * Fetch scan history with filters
 */
export async function getScans({ type, email, visitorId }) {
  await initPostgresTables();
  let sql = 'SELECT * FROM scans WHERE 1=1';
  const params = [];

  if (type) {
    const normType = type === 'message' ? 'msg' : type.toLowerCase();
    params.push(normType);
    sql += ` AND scan_type = $${params.length}`;
  }

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

/**
 * Delete a scan record
 */
export async function deleteScan(scanId) {
  await initPostgresTables();
  const res = await query('DELETE FROM scans WHERE id = $1 RETURNING *', [scanId]);
  return res.rowCount > 0;
}
