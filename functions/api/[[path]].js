export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // RUTA API 1: LOGIN (/api/login)
  if (url.pathname === '/api/login' && request.method === 'POST') {
    try {
      const { password } = await request.json();
      const validPassword = env.APP_PASSWORD || "admin123";

      if (password === validPassword) {
        return new Response(JSON.stringify({ success: true, token: "session_token" }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } else {
        return new Response(JSON.stringify({ error: "Contraseña incorrecta" }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  // RUTA API 2: ESCANEO CON IA (/api/scan)
  if (url.pathname === '/api/scan' && request.method === 'POST') {
    try {
      const body = await request.json();
      const apiKey = env.GEMINI_API_KEY;

      if (!apiKey) {
        return new Response(JSON.stringify({ error: "Falta la variable de entorno GEMINI_API_KEY en Cloudflare." }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const promptText = `Analiza este comprobante y devuelve UNICAMENTE un JSON estricto sin markdown:
{
  "tipo_operacion": "compra" o "venta",
  "tipo_comprobante": "Factura A",
  "numero_comprobante": "string",
  "fecha_emision": "YYYY-MM-DD",
  "emisor_receptor_nombre": "string",
  "emisor_receptor_identificacion": "string",
  "moneda": "ARS",
  "tipo_cambio": 1,
  "neto_gravado": 0,
  "iva_monto": 0,
  "no_gravado_exento": 0,
  "percepciones_retenciones": 0,
  "monto_total": 0
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
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  // RUTA API 3: GUARDAR COMPROBANTE (/api/guardar)
  if (url.pathname === '/api/guardar' && request.method === 'POST') {
    try {
      const payload = await request.json();
      payload.id = Date.now().toString();

      if (env.SUPABASE_URL && env.SUPABASE_KEY) {
        await fetch(`${env.SUPABASE_URL}/rest/v1/comprobantes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': env.SUPABASE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_KEY}`
          },
          body: JSON.stringify(payload)
        });
      }

      return new Response(JSON.stringify({ success: true, item: payload }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  return new Response(JSON.stringify({ error: "Ruta no encontrada" }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}
