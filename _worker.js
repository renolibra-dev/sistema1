export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/scan' && request.method === 'POST') {
      try {
        const body = await request.json();
        const apiKey = env.GEMINI_API_KEY;

        if (!apiKey) {
          return new Response(JSON.stringify({ error: 'GEMINI_API_KEY no configurada' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const promptText = `Analiza la imagen de esta factura y extrae un JSON estricto sin bloques de código ni markdown.

Reglas estrictas de clasificación:
1. 'tipo_operacion': 
   - Si 'Renolibra' (o la razón social propia) figura como EMISOR/VENDEDOR de la factura, asigna "venta".
   - Si 'Renolibra' figura como RECEPTOR/CLIENTE/DESTINATARIO de la factura, asigna "compra" (factura recibida).
2. 'emisor_receptor_nombre': Nombre de la contraparte (si es venta, indica el cliente; si es compra, indica el proveedor).
3. 'emisor_receptor_identificacion': CUIT/NIT/RUC de la contraparte.

Campos requeridos en el JSON:
{
  "tipo_operacion": "venta" o "compra",
  "tipo_comprobante": "Factura A, B, C, etc.",
  "numero_comprobante": "string",
  "fecha_emision": "YYYY-MM-DD",
  "emisor_receptor_nombre": "string",
  "emisor_receptor_identificacion": "string",
  "moneda": "ARS, USD, etc.",
  "tipo_cambio": numero,
  "neto_gravado": numero,
  "iva_monto": numero,
  "no_gravado_exento": numero,
  "percepciones_retenciones": numero,
  "monto_total": numero
}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
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

    if (env.ASSETS) {
      return await env.ASSETS.fetch(request);
    }

    return new Response('Ruta no encontrada', { status: 404 });
  }
};
