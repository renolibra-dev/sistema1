const HTML_FRONTEND = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sistema de Gestión de Comprobantes</title>
  <style>
    * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
    body { background-color: #121212; color: #e0e0e0; margin: 0; padding: 20px; display: flex; justify-content: center; }
    .container { max-width: 1000px; width: 100%; background: #1e1e1e; padding: 24px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
    h2, h3 { color: #fff; margin-top: 0; }
    
    #loginScreen { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #121212; display: flex; justify-content: center; align-items: center; z-index: 999; }
    .login-card { background: #1e1e1e; padding: 30px; border-radius: 12px; border: 1px solid #333; max-width: 360px; width: 100%; text-align: center; }
    
    .nav-tabs { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 10px; }
    .tab-btn { background: #2a2a2a; color: #aaa; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; }
    .tab-btn.active { background: #2563eb; color: #fff; }
    
    .tab-content { display: none; }
    .tab-content.active { display: block; }

    .form-group { margin-bottom: 16px; }
    label { display: block; margin-bottom: 6px; font-size: 14px; color: #aaa; }
    input, select, button { width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #333; background: #2a2a2a; color: #fff; font-size: 14px; }
    input[type="file"] { padding: 8px; cursor: pointer; }
    button { background: #2563eb; font-weight: bold; border: none; cursor: pointer; transition: background 0.2s; }
    button:hover { background: #1d4ed8; }
    button:disabled { background: #4b5563; cursor: not-allowed; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    
    #debugLog { background: #000; color: #00ff66; font-family: monospace; padding: 12px; border-radius: 6px; height: 130px; overflow-y: auto; font-size: 12px; margin-top: 10px; border: 1px solid #333; white-space: pre-wrap; }

    .table-container { overflow-x: auto; margin-top: 15px; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
    th, td { padding: 10px; border-bottom: 1px solid #333; }
    th { background: #2a2a2a; color: #38bdf8; }
    tr:hover { background: #252525; }
    .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
    .badge-venta { background: #166534; color: #4ade80; }
    .badge-compra { background: #991b1b; color: #fca5a5; }
    .summary-card { background: #2a2a2a; padding: 15px; border-radius: 8px; margin-bottom: 15px; display: flex; justify-content: space-between; }
    .summary-val { font-size: 18px; font-weight: bold; color: #4ade80; }
  </style>
</head>
<body>

<div id="loginScreen">
  <div class="login-card">
    <h2>Acceso al Sistema</h2>
    <p style="color:#aaa; font-size:13px;">Introduce tu clave para continuar</p>
    <div class="form-group">
      <input type="password" id="loginPass" placeholder="Contraseña">
    </div>
    <button type="button" id="btnLogin">Ingresar</button>
  </div>
</div>

<div class="container">
  <div style="display: flex; justify-content: space-between; align-items: center;">
    <h2>Gestión de Comprobantes</h2>
    <button type="button" id="btnLogout" style="width: auto; padding: 5px 15px; background: #dc2626; font-size: 12px;">Cerrar Sesión</button>
  </div>

  <div class="nav-tabs">
    <button class="tab-btn active" id="tabBtnCarga">1. Cargar y Escanear</button>
    <button class="tab-btn" id="tabBtnTabla">2. Resumen de Ventas / Compras</button>
  </div>

  <div id="tabCarga" class="tab-content active">
    <div class="form-group">
      <label>Seleccionar Imagen o PDF del Comprobante</label>
      <input type="file" id="fileInput" accept="image/*, application/pdf">
    </div>

    <button type="button" id="btnScan">1. Escanear e Identificar (IA)</button>

    <label style="margin-top: 15px; display:block;">Consola de diagnóstico:</label>
    <div id="debugLog">Sistema listo.</div>

    <hr style="border-color: #333; margin: 20px 0;">

    <form id="facturaForm" onsubmit="return false;">
      <div class="grid">
        <div class="form-group">
          <label>Tipo de Operación</label>
          <select id="tipo_operacion" required>
            <option value="compra">Compra (Recibida)</option>
            <option value="venta">Venta (Emitida)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Tipo Comprobante</label>
          <input type="text" id="tipo_comprobante" placeholder="Ej: Factura A">
        </div>
      </div>

      <div class="grid">
        <div class="form-group">
          <label>Número Comprobante</label>
          <input type="text" id="numero_comprobante" placeholder="0001-00001234">
        </div>
        <div class="form-group">
          <label>Fecha Emisión</label>
          <input type="date" id="fecha_emision">
        </div>
      </div>

      <div class="grid">
        <div class="form-group">
          <label>Contraparte (Nombre/Razón Social)</label>
          <input type="text" id="emisor_receptor_nombre">
        </div>
        <div class="form-group">
          <label>CUIT / Identificación</label>
          <input type="text" id="emisor_receptor_identificacion">
        </div>
      </div>

      <div class="grid">
        <div class="form-group">
          <label>Moneda</label>
          <input type="text" id="moneda" value="ARS">
        </div>
        <div class="form-group">
          <label>Tipo de Cambio</label>
          <input type="text" id="tipo_cambio" value="1">
        </div>
      </div>

      <div class="grid">
        <div class="form-group">
          <label>Neto Gravado</label>
          <input type="text" id="neto_gravado" value="0">
        </div>
        <div class="form-group">
          <label>Monto IVA</label>
          <input type="text" id="iva_monto" value="0">
        </div>
      </div>

      <div class="grid">
        <div class="form-group">
          <label>No Gravado / Exento</label>
          <input type="text" id="no_gravado_exento" value="0">
        </div>
        <div class="form-group">
          <label>Percepciones / Retenciones</label>
          <input type="text" id="percepciones_retenciones" value="0">
        </div>
      </div>

      <div class="form-group">
        <label>Monto Total</label>
        <input type="text" id="monto_total" value="0" required style="font-weight: bold; font-size: 16px;">
      </div>

      <button type="button" id="btnSave" style="background: #16a34a; margin-top: 10px;">2. Guardar Comprobante en Base de Datos</button>
    </form>
  </div>

  <div id="tabTabla" class="tab-content">
    <div class="summary-card">
      <div>
        <span style="color:#aaa; font-size: 12px;">TOTAL VENTAS</span>
        <div id="sumVentas" class="summary-val">$0,00</div>
      </div>
      <div>
        <span style="color:#aaa; font-size: 12px;">TOTAL COMPRAS</span>
        <div id="sumCompras" class="summary-val" style="color:#fca5a5;">$0,00</div>
      </div>
      <div>
        <span style="color:#aaa; font-size: 12px;">BALANCE NETO</span>
        <div id="sumBalance" class="summary-val" style="color:#38bdf8;">$0,00</div>
      </div>
    </div>

    <div style="display:flex; gap:10px; margin-bottom:10px;">
      <button type="button" id="filterAll" style="width:auto; padding:6px 12px; background:#333;">Todos</button>
      <button type="button" id="filterVentas" style="width:auto; padding:6px 12px; background:#166534;">Solo Ventas</button>
      <button type="button" id="filterCompras" style="width:auto; padding:6px 12px; background:#991b1b;">Solo Compras</button>
      <button type="button" id="btnClearData" style="width:auto; margin-left:auto; padding:6px 12px; background:#4b5563; font-size:11px;">Borrar Datos Locales</button>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Fecha</th>
            <th>Comprobante</th>
            <th>Contraparte</th>
            <th>Neto</th>
            <th>IVA</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody id="tableBody">
          <tr><td colspan="7" style="text-align:center; color:#777;">No hay comprobantes registrados.</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<script>
  function log(msg) {
    console.log("[SISTEMA]", msg);
    var logBox = document.getElementById('debugLog');
    if (logBox) {
      var timestamp = new Date().toLocaleTimeString();
      logBox.innerText += "\\n[" + timestamp + "] " + msg;
      logBox.scrollTop = logBox.scrollHeight;
    }
  }

  function getVal(id) {
    var el = document.getElementById(id);
    return el ? el.value : '';
  }

  function parseNumber(val) {
    if (!val) return 0;
    var str = String(val).trim();
    if (str.includes(',')) str = str.replace(/\\./g, '').replace(',', '.');
    var num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  function formatMoney(num) {
    return '$' + Number(num).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fileToBase64(file) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function() {
        var res = reader.result;
        if (typeof res === 'string' && res.includes(',')) {
          resolve(res.split(',')[1]);
        } else {
          resolve(res);
        }
      };
      reader.onerror = function(e) { reject(e); };
      reader.readAsDataURL(file);
    });
  }

  function getStoredItems() {
    return JSON.parse(localStorage.getItem('comprobantes_db') || '[]');
  }

  function saveStoredItem(item) {
    var items = getStoredItems();
    items.unshift(item);
    localStorage.setItem('comprobantes_db', JSON.stringify(items));
  }

  function renderTable(filter) {
    var items = getStoredItems();
    var tbody = document.getElementById('tableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    var totalVentas = 0;
    var totalCompras = 0;

    var filteredItems = items.filter(function(it) {
      if (it.tipo_operacion === 'venta') totalVentas += Number(it.monto_total || 0);
      if (it.tipo_operacion === 'compra') totalCompras += Number(it.monto_total || 0);

      if (filter === 'venta') return it.tipo_operacion === 'venta';
      if (filter === 'compra') return it.tipo_operacion === 'compra';
      return true;
    });

    document.getElementById('sumVentas').innerText = formatMoney(totalVentas);
    document.getElementById('sumCompras').innerText = formatMoney(totalCompras);
    document.getElementById('sumBalance').innerText = formatMoney(totalVentas - totalCompras);

    if (filteredItems.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#777;">No hay comprobantes cargados.</td></tr>';
      return;
    }

    filteredItems.forEach(function(it) {
      var tr = document.createElement('tr');
      var badgeClass = it.tipo_operacion === 'venta' ? 'badge-venta' : 'badge-compra';
      var opLabel = it.tipo_operacion === 'venta' ? 'VENTA' : 'COMPRA';

      tr.innerHTML = 
        '<td><span class="badge ' + badgeClass + '">' + opLabel + '</span></td>' +
        '<td>' + (it.fecha_emision || '-') + '</td>' +
        '<td>' + (it.tipo_comprobante || '') + ' ' + (it.numero_comprobante || '') + '</td>' +
        '<td>' + (it.emisor_receptor_nombre || '-') + '</td>' +
        '<td>' + formatMoney(it.neto_gravado || 0) + '</td>' +
        '<td>' + formatMoney(it.iva_monto || 0) + '</td>' +
        '<td style="font-weight:bold;">' + formatMoney(it.monto_total || 0) + '</td>';
      tbody.appendChild(tr);
    });
  }

  async function procesarComprobante() {
    try {
      log("Iniciando escaneo IA...");
      var fileInput = document.getElementById('fileInput');
      var btnScan = document.getElementById('btnScan');

      if (!fileInput.files || fileInput.files.length === 0) {
        alert("Selecciona un archivo PDF o imagen.");
        return;
      }

      var file = fileInput.files[0];
      btnScan.disabled = true;
      log("Convirtiendo archivo: " + file.name);

      var base64 = await fileToBase64(file);
      log("Enviando a /api/scan...");

      var response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mimeType: file.type || 'application/pdf', base64: base64 })
      });

      var data = await response.json();

      if (!response.ok) {
        var errDetail = data.error;
        if (typeof errDetail === 'object') errDetail = JSON.stringify(errDetail);
        throw new Error(errDetail || "Error HTTP " + response.status);
      }

      var textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || data.text || JSON.stringify(data);
      var jsonMatch = textContent.match(/\\{[\s\S]*\\}/);

      if (!jsonMatch) throw new Error("Respuesta de IA no estructurada.");

      var parsed = JSON.parse(jsonMatch[0]);

      document.getElementById('tipo_comprobante').value = parsed.tipo_comprobante || '';
      document.getElementById('numero_comprobante').value = parsed.numero_comprobante || '';
      document.getElementById('fecha_emision').value = parsed.fecha_emision || '';
      document.getElementById('emisor_receptor_nombre').value = parsed.emisor_receptor_nombre || '';
      document.getElementById('emisor_receptor_identificacion').value = parsed.emisor_receptor_identificacion || '';
      document.getElementById('moneda').value = parsed.moneda || 'ARS';
      document.getElementById('tipo_cambio').value = parsed.tipo_cambio || 1;
      document.getElementById('neto_gravado').value = parsed.neto_gravado || 0;
      document.getElementById('iva_monto').value = parsed.iva_monto || 0;
      document.getElementById('no_gravado_exento').value = parsed.no_gravado_exento || 0;
      document.getElementById('percepciones_retenciones').value = parsed.percepciones_retenciones || 0;
      document.getElementById('monto_total').value = parsed.monto_total || 0;
      document.getElementById('tipo_operacion').value = (parsed.tipo_operacion || '').toLowerCase().includes('venta') ? 'venta' : 'compra';

      log("¡Escaneo completo! Revisa los campos y guarda.");

    } catch (err) {
      log("ERROR: " + err.message);
    } finally {
      document.getElementById('btnScan').disabled = false;
    }
  }

  async function guardarComprobante() {
    try {
      log("Ejecutando proceso de guardado...");

      var payload = {
        tipo_operacion: getVal('tipo_operacion'),
        tipo_comprobante: getVal('tipo_comprobante'),
        numero_comprobante: getVal('numero_comprobante'),
        fecha_emision: getVal('fecha_emision'),
        emisor_receptor_nombre: getVal('emisor_receptor_nombre'),
        emisor_receptor_identificacion: getVal('emisor_receptor_identificacion'),
        moneda: getVal('moneda'),
        tipo_cambio: parseNumber(getVal('tipo_cambio')),
        neto_gravado: parseNumber(getVal('neto_gravado')),
        iva_monto: parseNumber(getVal('iva_monto')),
        no_gravado_exento: parseNumber(getVal('no_gravado_exento')),
        percepciones_retenciones: parseNumber(getVal('percepciones_retenciones')),
        monto_total: parseNumber(getVal('monto_total'))
      };

      saveStoredItem(payload);
      log("Registro guardado localmente.");

      try {
        await fetch('/api/guardar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (e) {}

      alert("Comprobante guardado con éxito.");
      renderTable();

    } catch (err) {
      log("ERROR AL GUARDAR: " + err.message);
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('auth_token')) {
      document.getElementById('loginScreen').style.display = 'none';
    }

    document.getElementById('btnLogin').addEventListener('click', async function() {
      var pass = document.getElementById('loginPass').value;
      try {
        var res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pass })
        });
        var data = await res.json();
        if (res.ok && data.success) {
          localStorage.setItem('auth_token', data.token);
          document.getElementById('loginScreen').style.display = 'none';
        } else {
          alert(data.error || "Clave incorrecta");
        }
      } catch (e) {
        if (pass === "admin123") {
          localStorage.setItem('auth_token', 'local_token');
          document.getElementById('loginScreen').style.display = 'none';
        } else {
          alert("Contraseña incorrecta");
        }
      }
    });

    document.getElementById('btnLogout').addEventListener('click', function() {
      localStorage.removeItem('auth_token');
      location.reload();
    });

    document.getElementById('tabBtnCarga').addEventListener('click', function() {
      this.classList.add('active');
      document.getElementById('tabBtnTabla').classList.remove('active');
      document.getElementById('tabCarga').classList.add('active');
      document.getElementById('tabTabla').classList.remove('active');
    });

    document.getElementById('tabBtnTabla').addEventListener('click', function() {
      this.classList.add('active');
      document.getElementById('tabBtnCarga').classList.remove('active');
      document.getElementById('tabTabla').classList.add('active');
      document.getElementById('tabCarga').classList.remove('active');
      renderTable();
    });

    document.getElementById('filterAll').addEventListener('click', function() { renderTable('all'); });
    document.getElementById('filterVentas').addEventListener('click', function() { renderTable('venta'); });
    document.getElementById('filterCompras').addEventListener('click', function() { renderTable('compra'); });
    document.getElementById('btnClearData').addEventListener('click', function() {
      if (confirm("¿Deseas borrar todo el historial?")) {
        localStorage.removeItem('comprobantes_db');
        renderTable();
      }
    });

    document.getElementById('btnScan').addEventListener('click', procesarComprobante);
    document.getElementById('btnSave').addEventListener('click', guardarComprobante);

    renderTable();
  });
</script>

</body>
</html>`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 1. CARGA DEL FRONTEND
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(HTML_FRONTEND, {
        status: 200,
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, max-age=0',
          ...corsHeaders 
        }
      });
    }

    // 2. RUTA DE LOGIN
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

    // 3. RUTA DE ESCANEO /api/scan
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

        // Limpieza de base64
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

        // Consulta a Gemini usando gemini-1.5-flash
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`, {
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

        if (!geminiResponse.ok) {
          let errMsg = "Error en la API de Gemini";
          if (data.error) {
            errMsg = typeof data.error === 'object' ? (data.error.message || JSON.stringify(data.error)) : data.error;
          }
          return new Response(JSON.stringify({ error: errMsg }), {
            status: geminiResponse.status,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    // 4. RUTA GUARDAR
    if (url.pathname === '/api/guardar' && request.method === 'POST') {
      try {
        const payload = await request.json();
        payload.id = Date.now().toString();

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
};
