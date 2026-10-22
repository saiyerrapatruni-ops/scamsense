// server/migrate.js
// Migration script: transfers all visitors and scans from server/database.json into PostgreSQL
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isPgConfigured, initPostgresTables, query, pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'database.json');

async function migrate() {
  console.log('==================================================');
  console.log('[ScamSense] PostgreSQL Data Migration Tool');
  console.log('==================================================');

  if (!isPgConfigured()) {
    console.error('❌ Error: DATABASE_URL is not configured in .env');
    console.log('Please set DATABASE_URL=postgresql://... in your .env file and run again.');
    process.exit(1);
  }

  if (!fs.existsSync(DB_FILE)) {
    console.log('ℹ️ No server/database.json found to migrate.');
    process.exit(0);
  }

  await initPostgresTables();

  const rawData = fs.readFileSync(DB_FILE, 'utf8');
  const jsonDB = JSON.parse(rawData);

  const visitors = jsonDB.visitors || [];
  const scans = jsonDB.scans || [];

  console.log(`Found ${visitors.length} visitors and ${scans.length} scans in database.json`);

  let migratedUsers = 0;
  let migratedScans = 0;

  // 1. Migrate visitors -> users table
  for (const v of visitors) {
    if (!v.id) continue;
    try {
      const cleanEmail = v.email ? v.email.trim().toLowerCase() : null;
      await query(`
        INSERT INTO users (
          id, email, name, device, browser, ip,
          first_entered, last_active, visits_count, scans_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          email = COALESCE(EXCLUDED.email, users.email),
          name = COALESCE(EXCLUDED.name, users.name),
          last_active = EXCLUDED.last_active,
          visits_count = EXCLUDED.visits_count,
          scans_count = EXCLUDED.scans_count;
      `, [
        v.id,
        cleanEmail,
        v.name || null,
        v.device || 'Desktop',
        v.browser || 'Web Browser',
        v.ip || '127.0.0.1',
        v.firstEntered || 'Unknown',
        v.lastActive || 'Unknown',
        v.visitsCount || 1,
        v.scansCount || 0
      ]);
      migratedUsers++;
    } catch (err) {
      console.warn(`[Skip User ${v.id}] ${err.message}`);
    }
  }

  // 2. Migrate scans -> scans table
  for (const s of scans) {
    if (!s.id) continue;
    try {
      const rawType = (s.scanType || 'msg').toLowerCase();
      const normType = rawType === 'message' ? 'msg' : rawType;
      const cleanEmail = (s.userEmail || '').trim().toLowerCase() || null;

      await query(`
        INSERT INTO scans (
          id, user_email, visitor_id, visitor_name, submitted_text,
          scan_type, msg, message, url, image, verdict_status,
          risk_score, risk_level, category, warning_signs,
          explanation, recommendation, verdict_summary, scan_date_time
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10, $11,
          $12, $13, $14, $15,
          $16, $17, $18, $19
        ) ON CONFLICT (id) DO NOTHING;
      `, [
        s.id,
        cleanEmail,
        s.visitorId || null,
        s.visitorName || null,
        s.submittedText || '',
        normType,
        s.msg || s.message || null,
        s.msg || s.message || null,
        s.url || null,
        s.image || null,
        s.verdictStatus || 'SAFE',
        s.riskScore || 0,
        s.riskLevel || 'Safe',
        s.category || 'General',
        JSON.stringify(s.warningSigns || []),
        s.explanation || '',
        s.recommendation || '',
        s.verdictSummary || '',
        s.scanDateTime || 'Unknown'
      ]);
      migratedScans++;
    } catch (err) {
      console.warn(`[Skip Scan ${s.id}] ${err.message}`);
    }
  }

  console.log('--------------------------------------------------');
  console.log(`✅ Migration complete!`);
  console.log(` - Migrated Users/Visitors: ${migratedUsers}`);
  console.log(` - Migrated Scans:          ${migratedScans}`);
  console.log('==================================================');

  await pool.end();
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
