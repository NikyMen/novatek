import type { APIRoute } from 'astro';
import { getDb, hashIp, getDeviceType, getCountry } from '../../lib/analytics';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return new Response(null, { status: 400 });

    const db = getDb();

    if (body.view_id && body.time_on_page != null && !body.page) {
      db.prepare(`UPDATE pageviews SET time_on_page = ? WHERE view_id = ?`)
        .run(body.time_on_page, body.view_id);
    } else if (body.page) {
      // IP real del cliente: primero X-Forwarded-For (detrás de Nginx/CDN), luego clientAddress
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
        || clientAddress || '';
      const ua = request.headers.get('user-agent') || '';
      db.prepare(`
        INSERT INTO pageviews (view_id, page, referrer, user_agent, ip_hash, session_id, device_type, country, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        body.view_id || null,
        String(body.page).slice(0, 200),
        body.referrer ? String(body.referrer).slice(0, 500) : null,
        ua.slice(0, 300),
        hashIp(ip),
        body.session_id ? String(body.session_id).slice(0, 64) : null,
        getDeviceType(ua),
        getCountry(ip, request.headers),
        Date.now(),
      );
    }

    return new Response(null, { status: 204 });
  } catch (_) {
    return new Response(null, { status: 500 });
  }
};
