-- PostgreSQL Database Schema for ScamSense

-- 1. Users / Visitors Table
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

-- 2. Scans History Table (Messages, URLs, Images)
CREATE TABLE IF NOT EXISTS scans (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  visitor_id VARCHAR(64),
  visitor_name VARCHAR(255),
  submitted_text TEXT,
  scan_type VARCHAR(20) NOT NULL, -- 'msg', 'url', 'image'
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

-- 3. Indexes for fast query lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_scans_user_email ON scans(user_email);
CREATE INDEX IF NOT EXISTS idx_scans_type ON scans(scan_type);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);
