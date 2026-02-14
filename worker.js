/**
 * YEISMIL - Cloudflare Worker para Brevo
 * 
 * INSTRUCCIONES DE CONFIGURACIÓN:
 * 
 * 1. Ve a https://dash.cloudflare.com y crea una cuenta (gratis)
 * 2. Ve a Workers & Pages > Create Worker
 * 3. Pega este código
 * 4. Ve a Settings > Variables y añade:
 *    - BREVO_API_KEY: tu API key de Brevo
 *    - ALLOWED_ORIGIN: tu dominio (ej: https://yeismil.com)
 * 5. Despliega y copia la URL del worker
 * 6. Pon esa URL en CONFIG.API_ENDPOINT en tu index.html
 */

export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only POST allowed
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const data = await request.json();
      const { email, type, resources, subscribeNewsletter, listId, attributes } = data;

      // Validar email
      if (!email || !email.includes('@')) {
        return new Response(JSON.stringify({ error: 'Email inválido' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // ==========================================
      // CASO 1: Recursos (con o sin newsletter)
      // ==========================================
      if (type === 'resources') {
        
        // Siempre enviar email con recursos (aunque no se suscriba)
        await sendResourcesEmail(env.BREVO_API_KEY, email, resources);

        // Si quiere newsletter, añadir a la lista con double opt-in
        if (subscribeNewsletter && listId) {
          await addContactToList(env.BREVO_API_KEY, email, listId, {
            RECURSOS_DESCARGADOS: resources.map(r => r.name).join(', ')
          });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Recursos enviados' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // ==========================================
      // CASO 2: Kakebo Waitlist
      // ==========================================
      if (type === 'kakebo_waitlist') {
        await addContactToList(env.BREVO_API_KEY, email, listId, {
          EARLY_ACCESS: attributes?.EARLY_ACCESS ? 'Sí' : 'No',
          LAUNCH_DISCOUNT: attributes?.LAUNCH_DISCOUNT ? 'Sí' : 'No',
          SIGNUP_DATE: new Date().toISOString().split('T')[0]
        });

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Añadido a la lista de espera' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ error: 'Tipo no válido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

// ==========================================
// Función: Enviar email con recursos
// ==========================================
async function sendResourcesEmail(apiKey, email, resources) {
  // Construir HTML del email
  const resourcesHtml = resources.map(r => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <strong>${r.name}</strong>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
        <a href="${r.url}" style="background: #0066FF; color: #000; padding: 8px 16px; text-decoration: none; font-weight: bold;">
          Descargar
        </a>
      </td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 32px; margin: 0; letter-spacing: -1px;">YEISMIL</h1>
        <p style="color: #666; margin-top: 5px;">Tech Builder</p>
      </div>
      
      <h2 style="font-size: 24px; margin-bottom: 20px;">¡Aquí tienes tus recursos!</h2>
      
      <p style="color: #333; line-height: 1.6;">
        Gracias por descargar estos recursos. Espero que te sean útiles.
      </p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 30px 0;">
        ${resourcesHtml}
      </table>
      
      <p style="color: #666; font-size: 14px; line-height: 1.6;">
        Si tienes dudas o quieres compartir cómo los usas, responde a este email.
      </p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      
      <p style="color: #999; font-size: 12px; text-align: center;">
        © ${new Date().getFullYear()} Yeismil · 
        <a href="https://yeismil.com" style="color: #999;">yeismil.com</a>
      </p>
    </body>
    </html>
  `;

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: {
        name: 'Yeismil',
        email: 'hola@yeismil.com' // Cambia por tu email verificado en Brevo
      },
      to: [{ email }],
      subject: `Tus recursos de YEISMIL (${resources.length} archivo${resources.length > 1 ? 's' : ''})`,
      htmlContent
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Brevo email error:', error);
    throw new Error('Error al enviar email');
  }

  return response.json();
}

// ==========================================
// Función: Añadir contacto a lista (con double opt-in)
// ==========================================
async function addContactToList(apiKey, email, listId, attributes = {}) {
  const response = await fetch('https://api.brevo.com/v3/contacts/doubleOptinConfirmation', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      email,
      includeListIds: [listId],
      templateId: 1, // Template de double opt-in (configúralo en Brevo)
      redirectionUrl: 'https://yeismil.com/confirmado', // Página de confirmación
      attributes
    })
  });

  // Si el contacto ya existe, actualizarlo
  if (response.status === 400) {
    const error = await response.json();
    if (error.code === 'duplicate_parameter') {
      // El contacto ya existe, añadirlo a la lista directamente
      return updateExistingContact(apiKey, email, listId, attributes);
    }
    throw new Error(error.message);
  }

  if (!response.ok) {
    const error = await response.json();
    console.error('Brevo contact error:', error);
    throw new Error('Error al añadir contacto');
  }

  return response.json();
}

// ==========================================
// Función: Actualizar contacto existente
// ==========================================
async function updateExistingContact(apiKey, email, listId, attributes) {
  const response = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
    method: 'PUT',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      listIds: [listId],
      attributes
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Brevo update error:', error);
    throw new Error('Error al actualizar contacto');
  }

  return { updated: true };
}
