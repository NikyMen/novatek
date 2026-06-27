import Database from 'better-sqlite3';
import { createHash } from 'crypto';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';

const DB_PATH = process.env.ANALYTICS_DB_PATH || join(process.cwd(), 'data', 'analytics.db');

try { mkdirSync(dirname(DB_PATH), { recursive: true }); } catch (_) {}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.exec(`
    CREATE TABLE IF NOT EXISTS pageviews (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      view_id      TEXT,
      page         TEXT NOT NULL,
      referrer     TEXT,
      user_agent   TEXT,
      ip_hash      TEXT,
      session_id   TEXT,
      device_type  TEXT,
      time_on_page INTEGER,
      timestamp    INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ts  ON pageviews(timestamp);
    CREATE INDEX IF NOT EXISTS idx_pg  ON pageviews(page);
    CREATE INDEX IF NOT EXISTS idx_vid ON pageviews(view_id);
  `);
  return _db;
}

export function hashIp(ip: string): string {
  return createHash('sha256').update(ip + 'ntk26salt').digest('hex').slice(0, 12);
}

export function getDeviceType(ua: string): string {
  if (/Mobile|Android.*Mobile|iPhone|iPod/i.test(ua)) return 'móvil';
  if (/Tablet|iPad|Android(?!.*Mobile)/i.test(ua)) return 'tablet';
  return 'desktop';
}
