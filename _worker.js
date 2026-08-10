export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // RUTA 1: Escaneo con IA Gemini
    if (url.pathname === '/api/scan' && request.method === 'POST') {
      try {
        const body = await request.json();
        const apiKey = env.GEMINI_API_KEY;

        if (!apiKey) {
          return new Response(JSON.stringify({ error: "Falta la variable GEMINI_API_KEY en las variables de entorno de Cloudflare." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const promptText = `Analiza este comprobante/factura y devuelve UNICAMENTE un JSON estricto con los siguientes campos sin formato Markdown:
{
  "tipo_operacion": "compra" o "venta",
  "tipo_comprobante": "Factura A", "Factura B", "Nota de Credito", etc.,
  "numero_comprobante": "string",
  "fecha_emision": "YYYY-MM-DD",
  "emisor_receptor_nombre": "string",
  "emisor_receptor_identificacion": "string",
  "moneda": "ARS" o "USD",
  "tipo_cambio": number,
  "neto_gravado": number,
  "iva_monto": number,
  "no_gravado_exento": number,
  "percepciones_retenciones": number,
  "monto_total": number
}`;

        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: promptText },
                { inlineData: { mimeType: body.mimeType || 'application/pdf', data: body.base64 } }
              ]
            }]
          })
        });

        const data = await geminiResponse.json();
        return new Response(JSON.stringify(data), {
          status: geminiResponse.status,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // RUTA 2: Guardado en Base de Datos / Supabase
    if (url.pathname === '/api/guardar' && request.method === 'POST') {
      try {
        const payload = await request.json();

        // Si tienes variables de Supabase configuradas en Cloudflare Worker
        if (env.SUPABASE_URL && env.SUPABASE_KEY) {
          const supabaseUrl = `${env.SUPABASE_URL}/rest/v1/comprobantes`;
          const supabaseRes = await fetch(supabaseUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': env.SUPABASE_KEY,
              'Authorization': `Bearer ${env.SUPABASE_KEY}`,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(payload)
          });

          if (!supabaseRes.ok) {
            const errText = await supabaseRes.text();
            throw new Error(`Supabase Error (${supabaseRes.status}): ${errText}`);
          }
        }

        return new Response(JSON.stringify({ success: true, message: "Comprobante guardado con éxito.", data: payload }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    return new Response(JSON.stringify({ error: "Ruta no encontrada" }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};
