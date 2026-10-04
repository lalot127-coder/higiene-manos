// Control de acceso del Campus (script clásico). Códigos firmados con ECDSA P-256:
//   - La LLAVE PRIVADA vive solo en la computadora del propietario (00_privado/, nunca se publica) y firma los códigos
//     con `python 05_herramientas/acceso_semanal.py`.
//   - Aquí solo está la LLAVE PÚBLICA: sirve para comprobar la firma, no para crear códigos.
// Código = base64url(JSON {v, n: nombre, p: [puertas], e: vence (epoch s), i: emitido, t: tipo}) + "." + base64url(firma)
// Puertas: '*' (todo), 'cafeteria', 'biblioteca', '<area>' (todo el edificio) o '<area>/<modulo>' (una puerta).
// Modos: 'propietario' (archivo local o localhost: todo abierto; ?probar_acceso fuerza la revisión),
//        'aula' (red local del servidor de aula: todo abierto), 'publico' (internet: se exige código vigente).
//   Acceso.listo → Promise(estado)   Acceso.puede(id)   Acceso.idPuerta(area, url)   Acceso.idPagina()
//   Acceso.bloquear({titulo, puerta})   Acceso.whatsapp(texto)   Acceso.textoEstado()
(function () {
const LLAVE_PUBLICA = {"kty":"EC","crv":"P-256","x":"XD9wvhRF0Z8TUuCR7bHTNVZPSf8J39yAoX34nfRreWA","y":"RwaXaigmHK50pbszuA7qG1rok9Xrq1x0A4n-wPYAwN0"};   // la escribe acceso_semanal.py llaves
const WHATSAPP = '522411794542';   // +52 241 179 4542 (Carlos Eduardo Roa Sánchez · CERS)
const SIEMPRE = ['informacion', 'cafeteria', 'biblioteca'];   // gratis para todos, siempre (decisión del propietario 04/10/2026)
const K = 'campus_acceso';
const b64 = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Uint8Array.from(atob(s), c => c.charCodeAt(0)); };
const privada = h => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h);
const P = new URLSearchParams(location.search);
try { if (P.has('probar_acceso')) sessionStorage.setItem('probar_acceso', '1'); } catch (e) { }
function modo() {
  let probar = false; try { probar = !!sessionStorage.getItem('probar_acceso'); } catch (e) { }
  if (probar) return 'publico';
  if (location.protocol === 'file:' || ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) return 'propietario';
  if (privada(location.hostname)) return 'aula';
  return 'publico';
}
async function verificar(cod) {
  try {
    const [pl, sg] = String(cod).trim().split('.'); if (!pl || !sg) return { motivo: 'Código incompleto.' };
    if (!(window.crypto && crypto.subtle)) return { motivo: 'Este navegador no puede comprobar el código (abre la página con https).' };
    const llave = await crypto.subtle.importKey('jwk', LLAVE_PUBLICA, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, llave, b64(sg), new TextEncoder().encode(pl));
    if (!ok) return { motivo: 'El código no es válido (firma incorrecta).' };
    const d = JSON.parse(new TextDecoder().decode(b64(pl)));
    if (Date.now() / 1000 > d.e) return { motivo: 'Tu código de acceso venció.', datos: d, vencido: true };
    return { valido: true, datos: d };
  } catch (e) { return { motivo: 'No se pudo leer el código.' }; }
}
const estado = { modo: modo(), valido: false, nombre: '', puertas: [], vence: null, motivo: '' };
const listo = (async () => {
  let cod = P.get('acceso');
  if (cod) { try { localStorage.setItem(K, cod); } catch (e) { }
    const u = new URL(location.href); u.searchParams.delete('acceso'); history.replaceState(null, '', u.pathname + u.search + u.hash); }
  else { try { cod = localStorage.getItem(K); } catch (e) { } }
  if (cod) { const r = await verificar(cod); if (r.datos) { estado.nombre = r.datos.n || ''; estado.puertas = r.datos.p || []; estado.vence = new Date(r.datos.e * 1000); }
    estado.valido = !!r.valido; estado.motivo = r.motivo || ''; }
  else estado.motivo = 'Aún no tienes código de acceso.';
  return estado;
})();
function puede(id) {
  if (estado.modo !== 'publico' || SIEMPRE.includes(id)) return true;
  if (!estado.valido) return false;
  const area = String(id).split('/')[0];
  return estado.puertas.some(p => p === '*' || p === id || p === area || p === area + '/*');
}
function idPuerta(area, url) {
  const u = String(url || '');
  let m = u.match(/mundos\/([^/]+)\/([^/]+)\/index\.html/); if (m) return `${m[1]}/${m[2]}`;
  m = u.match(/mundos\/(cafeteria|biblioteca|informacion)\//); if (m) return m[1];
  m = u.match(/mundos\/([^/]+)\//); if (m) area = m[1];
  return `${area}/${u.split('/').pop().replace(/\.html.*$/, '')}`;
}
const idPagina = () => idPuerta('', location.pathname);
const fecha = d => d ? d.toLocaleString('es-MX', { timeZone: 'America/Mexico_City', weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
function textoEstado() {
  if (estado.modo === 'propietario') return '🔓 Modo propietario (esta computadora): todo abierto';
  if (estado.modo === 'aula') return '🔓 Modo aula (servidor de aula): todo abierto';
  return estado.valido ? `🔑 Acceso${estado.nombre ? ' · ' + estado.nombre : ''} · ${estado.vence && estado.vence.getFullYear() >= 2099 ? 'permanente' : 'vence ' + fecha(estado.vence) + ' (hora del centro de México)'}` : `🔒 ${estado.motivo}`;
}
function whatsapp(texto) { return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`; }
let qrLib = null;
const cargarQR = () => qrLib || (qrLib = new Promise((ok, no) => { if (window.qrcode) return ok(); const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); }));
const CSS = `#accFondo{position:fixed;inset:0;background:rgba(14,58,107,.88);z-index:60;display:flex;align-items:center;justify-content:center;padding:14px;font-family:Calibri,"Segoe UI",sans-serif}
#accCaja{background:#fff;border-radius:18px;max-width:520px;width:100%;padding:18px;max-height:94vh;overflow:auto;color:#1B2633;text-align:center}
#accCaja h2{color:#0E3A6B;margin:.2rem 0}#accCaja p{margin:.4rem 0}#accQR svg{width:190px;height:190px}
#accCaja .wa{display:inline-block;background:#25D366;color:#fff;text-decoration:none;font-weight:800;border-radius:14px;padding:12px 18px;font-size:1.05rem;margin:6px}
#accCaja button{border:0;border-radius:12px;padding:10px 14px;font-weight:700;cursor:pointer;font-family:inherit;margin:4px}
#accCaja .s{background:#E8F5F9;color:#0E3A6B}#accCaja .p{background:#154F90;color:#fff}#accCaja input{width:100%;padding:9px;border-radius:10px;border:1px solid #8CCDE0;font-size:.95rem;margin-top:6px}
#accCaja small{color:#5B6B7C}`;
function bloquear(o = {}) {
  if (!document.getElementById('accCss')) document.head.insertAdjacentHTML('beforeend', `<style id="accCss">${CSS}</style>`);
  let nombre = ''; try { nombre = JSON.parse(localStorage.getItem('campus_perfil') || '{}').nombre || ''; } catch (e) { }
  const msj = `Hola, solicito acceso a la plataforma Campus de Simulación SST${o.titulo ? ' para: ' + o.titulo : ''}${nombre ? '. Mi nombre: ' + nombre : ''}.`;
  const wa = whatsapp(msj);
  const d = document.createElement('div'); d.id = 'accFondo';
  d.innerHTML = `<div id="accCaja"><div style="font-size:2.4rem">🔒</div><h2>${o.titulo ? o.titulo : 'Contenido con acceso'}</h2>
    <p>${estado.valido ? 'Tu código de acceso no incluye esta puerta.' : estado.motivo}</p>
    <p>Esta puerta se abre con acceso autorizado. Escríbeme por WhatsApp para solicitarlo (acceso por curso, por semana o permanente para tu empresa).</p>
    <a class="wa" href="${wa}" target="_blank" rel="noopener">💬 Pedir acceso por WhatsApp</a><div id="accQR"><small>Cargando QR…</small></div><small>Escanea con otro celular para escribirme · +52 241 179 4542</small>
    <p style="margin-top:12px"><b>¿Ya tienes un código?</b> Pega aquí el enlace o el código que te envié:</p><input id="accCod" placeholder="https://…?acceso=…  o el código">
    <div><button class="p" id="accUsar">Usar código</button><button class="s" id="accCerrar">${o.volver ? 'Regresar al campus' : 'Cerrar'}</button></div>
    <small>${textoEstado()}</small></div>`;
  document.body.appendChild(d);
  cargarQR().then(() => { const q = qrcode(0, 'M'); q.addData(wa); q.make(); d.querySelector('#accQR').innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); }).catch(() => d.querySelector('#accQR').innerHTML = '');
  d.querySelector('#accCerrar').onclick = () => { if (o.volver) location.href = o.volver; else d.remove(); };
  d.querySelector('#accUsar').onclick = async () => { let v = d.querySelector('#accCod').value.trim(); const m = v.match(/[?&]acceso=([^&#\s]+)/); if (m) v = decodeURIComponent(m[1]);
    const r = await verificar(v); if (!r.valido) { alert(r.motivo); return; } try { localStorage.setItem(K, v); } catch (e) { } location.reload(); };
}
// Protege una página completa (sub-mundo, juego, biblioteca): si no tiene permiso, muestra el bloqueo.
async function proteger(titulo, volver) { await listo; const id = idPagina(); if (!puede(id)) bloquear({ titulo, puerta: id, volver }); }
window.Acceso = { listo, estado, puede, idPuerta, idPagina, bloquear, proteger, whatsapp, textoEstado, fecha, WHATSAPP };
})();
