import { createHmac, timingSafeEqual } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

export const COOKIE_NAME = 'ntk_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 días en segundos

function secret(): string {
  return process.env.AUTH_SECRET || 'novatek-dev-secret-change-me';
}

export function getCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  };
}

/** Valida usuario+contraseña contra las variables de entorno. */
export function checkCredentials(username: string, password: string): boolean {
  const c = getCredentials();
  return username === c.username && password === c.password;
}

const b64url = (s: string) => Buffer.from(s).toString('base64url');
const sign = (data: string) => createHmac('sha256', secret()).update(data).digest('hex');

/** Crea un token de sesión firmado (payload.firma). */
export function createSessionToken(username: string): string {
  const payload = b64url(JSON.stringify({ u: username, exp: Date.now() + MAX_AGE * 1000 }));
  return `${payload}.${sign(payload)}`;
}

/** Verifica el token; devuelve el usuario si es válido y no expiró, o null. */
export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;

  const expected = sign(payload);
  // Comparación en tiempo constante
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!data.exp || Date.now() > data.exp) return null;
    return data.u || null;
  } catch {
    return null;
  }
}

/** Opciones de cookie seguras para set/clear. */
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: MAX_AGE,
};

/** Helper: ¿la request tiene una sesión válida? Usar con Astro.cookies. */
export function isAuthenticated(cookies: { get(name: string): { value: string } | undefined }): boolean {
  return verifySessionToken(cookies.get(COOKIE_NAME)?.value) !== null;
}
