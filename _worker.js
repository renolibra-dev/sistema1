export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/scan' && request.method === 'POST') {
      try {
        const body = await request.json();
        const apiKey = env.GEMINI_API_KEY;

        if (!apiKey) {
          return new Response(JSON.stringify({ error: 'GEMINI_API_KEY no configurada en las variables de entorno' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const promptText = `Analiza la imagen o documento de esta factura y extrae un JSON estricto sin sintaxis markdown con los siguientes campos:
        tipo_operacion (compra o venta),
        tipo_comprobante (ej: Factura A),
        numero_comprobante (string),
        fecha_emision (YYYY-MM-DD),
        emisor_receptor_nombre (string),
        emisor_receptor_identificacion (CUIT/NIF),
        moneda (ARS o USD),
        tipo_cambio (numero decimal, si es USD extrae el TC, si no usa 1.0),
        neto_gravado (numero),
        iva_monto (numero),
        no_gravado_exento (numero),
        percepciones_retenciones (numero),
        monto_total (numero)`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
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

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
