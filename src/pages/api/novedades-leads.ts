import type { APIRoute } from 'astro';
import { isAuthenticated } from '../../lib/auth';
import { createNovedadesLead, getNovedadesLeads } from '../../lib/analytics';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const fullName = String(data.nombreApellido || '').trim();
    const email = String(data.correo || '').trim().toLowerCase();
    const phone = String(data.telefono || '').trim();

    if (!fullName || !email || !phone) {
      return json({ error: 'Completá nombre y apellido, correo y teléfono.' }, 400);
    }
    if (fullName.length > 255 || email.length > 255 || phone.length > 80) {
      return json({ error: 'Los datos ingresados son demasiado extensos.' }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Ingresá un correo válido.' }, 400);
    }

    const lead = createNovedadesLead({ fullName, email, phone });
    return json(lead, 201);
  } catch (error) {
    console.error('Error al guardar contacto de novedades:', error);
    return json({ error: 'No pudimos guardar tus datos. Intenta nuevamente.' }, 500);
  }
};

export const GET: APIRoute = async ({ cookies }) => {
  if (!isAuthenticated(cookies)) return json({ error: 'No autorizado' }, 401);

  try {
    return json(getNovedadesLeads());
  } catch (error) {
    console.error('Error al obtener contactos de novedades:', error);
    return json({ error: 'Error al obtener contactos.' }, 500);
  }
};
