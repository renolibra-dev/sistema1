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

        const promptText = 'Analiza la imagen de esta factura y extrae un JSON estricto sin markdown con los campos: tipo_operacion (compra/venta), tipo_comprobante, numero_comprobante, fecha_emision (YYYY-MM-DD), emisor_receptor_nombre, emisor_receptor_identificacion, moneda, tipo_cambio (numero), neto_gravado (numero), iva_monto (numero), no_gravado_exento (numero), percepciones_retenciones (numero), monto_total (numero)';

        // 1. Obtener la lista de modelos de Google API
        const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const listData = await listRes.json();

        let selectedModelPath = 'models/gemini-1.5-flash';

        if (listData.models && Array.isArray(listData.models)) {
          // Filtrar modelos válidos descartando expresamente los modelos discontinuados/retirados
          const validModels = listData.models.filter(m => 
            m.supportedGenerationMethods?.includes('generateContent') &&
            !m.name.includes('2.5-flash') &&
            !m.name.includes('flash-lite')
          );

          if (validModels.length > 0) {
            // Priorizar gemini-1.5-flash o tomar el primero disponible
            const preferred = validModels.find(m => m.name.includes('1.5-flash')) || validModels[0];
            selectedModelPath = preferred.name;
          }
        }

        // 2. Ejecutar la llamada con el modelo estable verificado
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${selectedModelPath}:generateContent?key=${apiKey}`, {
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
