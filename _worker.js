export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const apiKey = env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY no configurada' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Ruta de diagnóstico para listar los modelos habilitados en tu cuenta
    if (url.pathname === '/api/models') {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const data = await res.json();
      return new Response(JSON.stringify(data, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/api/scan' && request.method === 'POST') {
      try {
        const body = await request.json();

        // 1. Consultar automáticamente los modelos activos para tu API Key
        const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const modelsData = await modelsRes.json();

        let modelName = 'gemini-1.5-flash'; // modelo de respaldo

        if (modelsData.models && modelsData.models.length > 0) {
          // Filtrar el modelo habilitado para visión/texto
          const activeModel = modelsData.models.find(m => 
            m.supportedGenerationMethods?.includes('generateContent') && 
            (m.name.includes('flash') || m.name.includes('gemini'))
          );
          if (activeModel) {
            modelName = activeModel.name.replace('models/', '');
          }
        }

        const promptText = 'Analiza la imagen de esta factura y extrae un JSON estricto sin markdown con los campos: tipo_operacion (compra/venta), tipo_comprobante, numero_comprobante, fecha_emision (YYYY-MM-DD), emisor_receptor_nombre, emisor_receptor_identificacion, moneda, tipo_cambio (numero), neto_gravado (numero), iva_monto (numero), no_gravado_exento (numero), percepciones_retenciones (numero), monto_total (numero)';

        // 2. Ejecutar la lectura con el modelo detectado
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
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
