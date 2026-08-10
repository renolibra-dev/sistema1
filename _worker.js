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

        // 1. Consultar a Google la lista exacta de modelos habilitados para esta API Key
        const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const listData = await listRes.json();

        if (listData.error) {
          return new Response(JSON.stringify({ error_google_api: listData.error }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const availableModels = listData.models || [];
        
        // Buscar un modelo habilitado para generación de contenido
        const validModelObj = availableModels.find(m => 
          m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')
        );

        if (!validModelObj) {
          return new Response(JSON.stringify({ 
            error: 'No hay modelos con soporte para generateContent en esta API Key',
            modelos_encontrados: availableModels.map(m => m.name)
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const selectedModelPath = validModelObj.name; // Devuelve formato "models/nombre-modelo"

        // 2. Ejecutar la llamada usando la ruta exacta obtenida de tu cuenta
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
