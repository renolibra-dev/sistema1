export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const apiKey = env.GEMINI_API_KEY;

      // Ruta de diagnóstico para listar modelos sin hacer colapsar el Worker
      if (url.pathname === '/api/models' || url.pathname === '/api/models/') {
        if (!apiKey) {
          return new Response(JSON.stringify({ error: 'GEMINI_API_KEY no configurada en Cloudflare' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await res.json();

        return new Response(JSON.stringify(data, null, 2), {
          status: res.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (url.pathname === '/api/scan' && request.method === 'POST') {
        if (!apiKey) {
          return new Response(JSON.stringify({ error: 'GEMINI_API_KEY no configurada' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const body = await request.json();
        const promptText = 'Analiza la imagen de esta factura y extrae un JSON estricto sin markdown con los campos: tipo_operacion (compra/venta), tipo_comprobante, numero_comprobante, fecha_emision (YYYY-MM-DD), emisor_receptor_nombre, emisor_receptor_identificacion, moneda, tipo_cambio (numero), neto_gravado (numero), iva_monto (numero), no_gravado_exento (numero), percepciones_retenciones (numero), monto_total (numero)';

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inline_data: { mime_type: body.mimeType, data: body.base64 } },
                { text: promptText }
              ]
            }],
            generationConfig: { response_mime_type: "application/json" }
          })
        });

        const data = await response.json();
        return new Response(JSON.stringify(data), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (env.ASSETS) {
        return await env.ASSETS.fetch(request);
      }

      return new Response('Ruta no encontrada', { status: 404 });

    } catch (err) {
      return new Response(JSON.stringify({ error_worker: err.message, stack: err.stack }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
