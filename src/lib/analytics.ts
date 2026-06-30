import Database from 'better-sqlite3';
import { createHash } from 'crypto';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { createRequire } from 'module';

// require() no existe en módulos ESM (el proyecto es type:module); lo recreamos
// para poder cargar geoip-lite (CommonJS, con sus datos) de forma sincrónica.
const nodeRequire = createRequire(import.meta.url);

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
      country      TEXT,
      time_on_page INTEGER,
      timestamp    INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ts  ON pageviews(timestamp);
    CREATE INDEX IF NOT EXISTS idx_pg  ON pageviews(page);
    CREATE INDEX IF NOT EXISTS idx_vid ON pageviews(view_id);
  `);
  // Migración: agregar columna country a bases existentes (ignora error si ya existe)
  try { _db.exec('ALTER TABLE pageviews ADD COLUMN country TEXT'); } catch (_) {}
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

// ── Geolocalización de país ───────────────────────────────────────────────────
// Devuelve el código ISO de 2 letras (ej. "AR") o null si no se puede determinar.
// 1) Headers de CDN/proxy (Cloudflare, Vercel, Nginx con GeoIP). Gratis e instantáneo.
// 2) geoip-lite (offline, opcional). Si el paquete no está instalado, se ignora.
let _geo: any = null;
let _geoTried = false;
function loadGeo(): any {
  if (_geoTried) return _geo;
  _geoTried = true;
  try { _geo = nodeRequire('geoip-lite'); } catch (_) { _geo = null; }
  return _geo;
}

export function getCountry(ip: string, headers: Headers): string | null {
  const fromHeader =
    headers.get('cf-ipcountry') ||
    headers.get('x-vercel-ip-country') ||
    headers.get('x-geo-country') ||
    headers.get('x-country-code');
  if (fromHeader && fromHeader.length === 2 && fromHeader !== 'XX') {
    return fromHeader.toUpperCase();
  }
  if (ip) {
    const geo = loadGeo();
    if (geo) {
      try {
        const r = geo.lookup(ip);
        if (r && r.country) return String(r.country).toUpperCase();
      } catch (_) {}
    }
  }
  return null;
}

// Nombre del país en español + bandera emoji a partir del código ISO-2
const COUNTRY_NAMES: Record<string, string> = {
  AR: 'Argentina', UY: 'Uruguay', CL: 'Chile', BR: 'Brasil', PY: 'Paraguay',
  BO: 'Bolivia', PE: 'Perú', CO: 'Colombia', EC: 'Ecuador', VE: 'Venezuela',
  MX: 'México', US: 'Estados Unidos', CA: 'Canadá', ES: 'España', FR: 'Francia',
  DE: 'Alemania', IT: 'Italia', GB: 'Reino Unido', NL: 'Países Bajos', PL: 'Polonia',
  PT: 'Portugal', BE: 'Bélgica', CH: 'Suiza', AT: 'Austria', SE: 'Suecia',
  IE: 'Irlanda', CN: 'China', JP: 'Japón', IN: 'India', AU: 'Australia',
};

export function countryName(code: string | null): string {
  if (!code) return 'Desconocido';
  return COUNTRY_NAMES[code] || code;
}

export function countryFlag(code: string | null): string {
  if (!code || code.length !== 2) return '🌐';
  const A = 0x1f1e6;
  return String.fromCodePoint(
    A + code.toUpperCase().charCodeAt(0) - 65,
    A + code.toUpperCase().charCodeAt(1) - 65,
  );
}

// ── Fuente / medio (estilo GA4) a partir del referrer ─────────────────────────
export function sourceMedium(referrer: string | null): string {
  if (!referrer) return '(direct) / (none)';
  let host = '';
  try { host = new URL(referrer).hostname.replace(/^www\./, '').toLowerCase(); }
  catch { return '(direct) / (none)'; }

  if (/(^|\.)google\./.test(host)) return 'google / organic';
  if (/(^|\.)bing\./.test(host)) return 'bing / organic';
  if (/(^|\.)(yahoo|search\.yahoo)\./.test(host)) return 'yahoo / organic';
  if (/(^|\.)(duckduckgo)\./.test(host)) return 'duckduckgo / organic';
  if (/(^|\.)(facebook|fb)\./.test(host) || host === 'l.facebook.com' || host === 'lm.facebook.com') return 'facebook / referral';
  if (/(^|\.)instagram\./.test(host)) return 'instagram / referral';
  if (host === 't.co' || /(^|\.)twitter\.|(^|\.)x\.com/.test(host)) return 'twitter / referral';
  if (/(^|\.)(whatsapp|wa\.me|l\.wl\.co)/.test(host) || host === 'l.wl.co') return 'whatsapp / referral';
  if (/(^|\.)linkedin\./.test(host)) return 'linkedin / referral';
  if (/(^|\.)(youtube)\./.test(host)) return 'youtube / referral';
  return `${host} / referral`;
}
