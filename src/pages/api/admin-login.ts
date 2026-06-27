import type { APIRoute } from 'astro';
import { checkCredentials, createSessionToken, COOKIE_NAME, cookieOptions } from '../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { username, password } = await request.json();

    if (checkCredentials(username, password)) {
      // Establece la sesión por cookie (también habilita /admin/analytics)
      cookies.set(COOKIE_NAME, createSessionToken(username), cookieOptions);
      return new Response(JSON.stringify({
        success: true,
        message: 'Credenciales válidas',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      message: 'Credenciales incorrectas',
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Error en el servidor',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
