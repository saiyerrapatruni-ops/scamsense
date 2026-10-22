// server/db.js
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

let pool = null;
let isInitialized = false;

/**
 * Dynamically get or initialize the PostgreSQL pool
 */
export function getPool() {
  if (pool) return pool;

  // Always reload .env to catch any new DATABASE_URL without restarting
  dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });
  dotenv.config();

  const connectionString = process.env.DATABASE_URL;

  if (connectionString && connectionString.trim()) {
    const isCloudDB = connectionString.includes('supabase') || 
                      connectionString.includes('neon.tech') || 
                      connectionString.includes('railway') || 
                      connectionString.includes('render.com') ||
                      connectionString.includes('pooler.supabase.com') ||
                      connectionString.includes('sslmode=require');

    pool = new Pool({
      connectionString: connectionString.trim(),
      ssl: isCloudDB ? { rejectUnauthorized: false } : false
    });

    pool.on('error', (err) => {
      console.error('[PostgreSQL Error] Unexpected client error:', err.message);
    });
  }

  return pool;
}

/**
 * Check if PostgreSQL connection is configured
 */
export function isPgConfigured() {
  return !!getPool();
}

/**
 * Execute a query with params
 */
export async function query(text, params) {
  const p = getPool();
  if (!p) {
    throw new Error('PostgreSQL is not configured. Set DATABASE_URL in .env');
  }
  return p.query(text, params);
}

/**
 * Initialize PostgreSQL tables automatically
 */
export async function initPostgresTables() {
  const p = getPool();
  if (!p || isInitialized) return;

  try {
    console.log('[PostgreSQL] Connecting and verifying tables...');
    
    // Create users table
    await p.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        name VARCHAR(255),
        device VARCHAR(100),
        browser VARCHAR(100),
        ip VARCHAR(100),
        first_entered VARCHAR(100),
        last_active VARCHAR(100),
        visits_count INTEGER DEFAULT 1,
        scans_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create scans table
    await p.query(`
      CREATE TABLE IF NOT EXISTS scans (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
        user_email VARCHAR(255),
        visitor_id VARCHAR(64),
        visitor_name VARCHAR(255),
        submitted_text TEXT,
        scan_type VARCHAR(20) NOT NULL,
        msg TEXT,
        message TEXT,
        url TEXT,
        image TEXT,
        image_preview TEXT,
        verdict_status VARCHAR(50),
        risk_score INTEGER DEFAULT 0,
        risk_level VARCHAR(50),
        category VARCHAR(255),
        warning_signs JSONB DEFAULT '[]'::jsonb,
        explanation TEXT,
        recommendation TEXT,
        verdict_summary TEXT,
        scan_date_time VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure image_preview column exists on existing installations
    await p.query(`ALTER TABLE scans ADD COLUMN IF NOT EXISTS image_preview TEXT;`);

    // Create indexes
    await p.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
    await p.query(`CREATE INDEX IF NOT EXISTS idx_scans_user_email ON scans(user_email);`);
    await p.query(`CREATE INDEX IF NOT EXISTS idx_scans_type ON scans(scan_type);`);
    await p.query(`CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);`);

    isInitialized = true;
    console.log('[PostgreSQL] Database tables & indexes verified successfully!');
  } catch (err) {
    console.error('[PostgreSQL Initialization Error]:', err.message);
  }
}

export { pool };
