export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const body = await request.json();
    const apiKey = env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Falta la variable GEMINI_API_KEY en Cloudflare." }), {
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
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json', ...corsHeaders } 
    });
  }
}
