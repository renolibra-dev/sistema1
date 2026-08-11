export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body = await request.json();
    
    // Obtiene la API Key configurada en las variables de entorno de Cloudflare Pages
    const apiKey = env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Falta GEMINI_API_KEY en las variables de entorno de Cloudflare." }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Limpieza de cadena base64 previa al envío a Gemini
    let cleanBase64 = body.base64 || "";
    if (cleanBase64.includes(',')) {
      cleanBase64 = cleanBase64.split(',')[1];
    }
    cleanBase64 = cleanBase64.replace(/[\r\n\s]/g, '');

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

    // Llamada a la API de Gemini
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inline_data: {
                  mime_type: body.mimeType || 'application/pdf',
                  data: cleanBase64
                }
              }
            ]
          }
        ]
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

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
