// Control de acceso del Campus (script clásico). Códigos firmados con ECDSA P-256:
//   - La LLAVE PRIVADA vive solo en la computadora del propietario (00_privado/, nunca se publica) y firma los códigos
//     con `python 05_herramientas/acceso_semanal.py`.
//   - Aquí solo está la LLAVE PÚBLICA: sirve para comprobar la firma, no para crear códigos.
// Dos formas de entrar (se suman):
//   1) Código personal: ?acceso=<código>  Código = base64url(JSON {v, n, p: [puertas], e: vence, i: emitido, t}) + "." + firma
//   2) QR FIJO DEL CURSO (el de la presentación y el manual digital): ?curso=<clave>. No vence ni cambia: el propietario lo
//      ACTIVA o DESACTIVA cuando quiere (puertas y fecha) publicando acceso/control.json firmado
//      (`acceso_semanal.py activar|desactivar|revocar` → `Activar_acceso_curso.bat`).
//      control.json = {d: base64url(JSON {v: 2, t: emitido, c: {clave: {n, p, e}}, r: [i revocados]}), s: firma}
//      r = códigos personales anulados antes de su vencimiento (por su campo i).
// Puertas: '*' (todo), 'cafeteria', 'biblioteca', '<area>' (todo el edificio) o '<area>/<modulo>' (una puerta).
// Modos: 'propietario' (archivo local o localhost: todo abierto; ?probar_acceso fuerza la revisión),
//        'aula' (red local del servidor de aula: todo abierto), 'publico' (internet: se exige código o curso activo).
//   Acceso.listo → Promise(estado)   Acceso.puede(id)   Acceso.idPuerta(area, url)   Acceso.idPagina()
//   Acceso.bloquear({titulo, puerta})   Acceso.whatsapp(texto)   Acceso.textoEstado()   Acceso.sesionUnica()
(function () {
const LLAVE_PUBLICA = {"kty":"EC","crv":"P-256","x":"5PRytfcMjnoGTScsqc1MI8jtZM5ab6opAZrnh3Chfyo","y":"5P9ntPXikb96EFdSTipp4xV0QZ6ZcQJKKYP_GV-5QAI"};   // la escribe acceso_semanal.py llaves
const WHATSAPP = '522411794542';   // +52 241 179 4542 (Carlos Eduardo Roa Sánchez · CERS)
const SIEMPRE = ['informacion', 'cafeteria', 'biblioteca'];   // gratis para todos, siempre (decisión del propietario 04/10/2026)
const CONTROL_PUBLICO = 'https://lalot127-coder.github.io/campus-sst/acceso/control.json';
const BASE_ACC = document.currentScript ? document.currentScript.src : location.href;
const K = 'campus_acceso', KC = 'campus_cursos';
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
let llave = null;
async function firmaOk(pl, sg) {
  if (!(window.crypto && crypto.subtle)) throw new Error('sin crypto');
  llave = llave || await crypto.subtle.importKey('jwk', LLAVE_PUBLICA, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, llave, b64(sg), new TextEncoder().encode(pl));
}
async function verificar(cod) {
  try {
    const [pl, sg] = String(cod).trim().split('.'); if (!pl || !sg) return { motivo: 'Código incompleto.' };
    if (!(window.crypto && crypto.subtle)) return { motivo: 'Este navegador no puede comprobar el código (abre la página con https).' };
    if (!await firmaOk(pl, sg)) return { motivo: 'El código no es válido (firma incorrecta).' };
    const d = JSON.parse(new TextDecoder().decode(b64(pl)));
    if (Date.now() / 1000 > d.e) return { motivo: 'Tu código de acceso venció.', datos: d, vencido: true };
    return { valido: true, datos: d };
  } catch (e) { return { motivo: 'No se pudo leer el código.' }; }
}
// control.json publicado (cursos activos y códigos anulados). Se busca junto al simulador y, en copias de otros
// repositorios de github.io, en el campus principal.
async function leerControl() {
  const urls = [new URL('../acceso/control.json', BASE_ACC).href];
  if (location.hostname.endsWith('github.io') && urls[0] !== CONTROL_PUBLICO) urls.push(CONTROL_PUBLICO);
  for (const u of urls) {
    try {
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 5000);
      const r = await fetch(u + '?t=' + Math.floor(Date.now() / 60000), { cache: 'no-store', signal: ctl.signal }); clearTimeout(to);
      if (!r.ok) continue;
      const j = await r.json(); if (!j || !j.d || !j.s || !await firmaOk(j.d, j.s)) continue;
      return JSON.parse(new TextDecoder().decode(b64(j.d)));
    } catch (e) { }
  }
  return null;
}
const leerCursos = () => { try { return JSON.parse(localStorage.getItem(KC) || '[]').filter(x => typeof x === 'string'); } catch (e) { return []; } };
const limpiaClave = c => String(c || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
const estado = { modo: modo(), valido: false, nombre: '', puertas: [], vence: null, motivo: '', cursos: [], control: false, emitido: null };
const listo = (async () => {
  let cod = P.get('acceso'); const curso = limpiaClave(P.get('curso'));
  if (cod) { try { localStorage.setItem(K, cod); } catch (e) { } }
  else { try { cod = localStorage.getItem(K); } catch (e) { } }
  let claves = leerCursos();
  if (curso) { claves = [curso].concat(claves.filter(c => c !== curso)).slice(0, 6); try { localStorage.setItem(KC, JSON.stringify(claves)); } catch (e) { } }
  if (P.has('acceso') || P.has('curso')) { const u = new URL(location.href); u.searchParams.delete('acceso'); u.searchParams.delete('curso'); history.replaceState(null, '', u.pathname + u.search + u.hash); }
  const ctl = (estado.modo === 'publico' || claves.length || cod) ? await leerControl() : null;
  estado.control = !!ctl;
  if (cod) { const r = await verificar(cod); if (r.datos) { estado.nombre = r.datos.n || ''; estado.puertas = r.datos.p || []; estado.vence = new Date(r.datos.e * 1000); estado.emitido = r.datos.i; }
    estado.valido = !!r.valido; estado.motivo = r.motivo || '';
    if (estado.valido && ctl && (ctl.r || []).includes(r.datos.i)) { estado.valido = false; estado.motivo = 'Tu código de acceso fue desactivado por el propietario.'; } }
  else estado.motivo = 'Aún no tienes código de acceso.';
  const ahora = Date.now() / 1000;
  estado.cursos = claves.map(c => { const k = ctl && ctl.c && ctl.c[c]; return { clave: c, n: (k && k.n) || c, activo: !!(k && k.e > ahora), p: (k && k.p) || [], vence: k ? new Date(k.e * 1000) : null }; });
  const act = estado.cursos.filter(c => c.activo);
  if (!estado.valido && act.length) estado.motivo = '';
  else if (!estado.valido && estado.cursos.length) estado.motivo = `El acceso del curso «${estado.cursos[0].n}» no está activo en este momento. Pide a la persona instructora que lo active.`;
  return estado;
})();
const cubre = (lista, id) => { const area = String(id).split('/')[0]; return lista.some(p => p === '*' || p === id || p === area || p === area + '/*'); };
function puede(id) {
  if (estado.modo !== 'publico' || SIEMPRE.includes(id)) return true;
  if (estado.valido && cubre(estado.puertas, id)) return true;
  return estado.cursos.some(c => c.activo && cubre(c.p, id));
}
function idPuerta(area, url) {
  const u = String(url || '');
  let m = u.match(/mundos\/modulos\/(?:index\.html)?\?m=([\w-]+)/); if (m) return `${area || 'modulos'}/${m[1]}`;   // salas de modelos 3D (05/10/2026)
  m = u.match(/mundos\/([^/]+)\/([^/]+)\/index\.html/); if (m) return `${m[1]}/${m[2]}`;
  m = u.match(/mundos\/(cafeteria|biblioteca|informacion)\//); if (m) return m[1];
  m = u.match(/mundos\/([^/]+)\//); if (m) area = m[1];
  return `${area}/${u.split('/').pop().replace(/\.html.*$/, '')}`;
}
const idPagina = () => idPuerta('', location.pathname);
const fecha = d => d ? d.toLocaleString('es-MX', { timeZone: 'America/Mexico_City', weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
const vigencia = d => d && d.getFullYear() >= 2099 ? 'permanente' : 'vence ' + fecha(d) + ' (hora del centro de México)';
function textoEstado() {
  if (estado.modo === 'propietario') return '🔓 Modo propietario (esta computadora): todo abierto';
  if (estado.modo === 'aula') return '🔓 Modo aula (servidor de aula): todo abierto';
  const partes = [];
  if (estado.valido) partes.push(`🔑 Acceso${estado.nombre ? ' · ' + estado.nombre : ''} · ${vigencia(estado.vence)}`);
  estado.cursos.filter(c => c.activo).forEach(c => partes.push(`🎓 Curso ${c.n} · ${vigencia(c.vence)}`));
  return partes.length ? partes.join(' · ') : `🔒 ${estado.motivo}`;
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
    <p>${estado.valido || estado.cursos.some(c => c.activo) ? 'Tu acceso no incluye esta puerta.' : estado.motivo}</p>
    <p>Esta puerta se abre con acceso autorizado. Escríbeme por WhatsApp para solicitarlo (acceso por curso, por semana o permanente para tu empresa).</p>
    <a class="wa" href="${wa}" target="_blank" rel="noopener">💬 Pedir acceso por WhatsApp</a><div id="accQR"><small>Cargando QR…</small></div><small>Escanea con otro celular para escribirme · +52 241 179 4542</small>
    <p style="margin-top:12px"><b>¿Ya tienes un código?</b> Pega aquí el enlace o el código que te envié:</p><input id="accCod" placeholder="https://…?acceso=…  ·  ?curso=…  o el código">
    <div><button class="p" id="accUsar">Usar código</button><button class="s" id="accCerrar">${o.volver ? 'Regresar al campus' : 'Cerrar'}</button></div>
    <small>${textoEstado()}</small></div>`;
  document.body.appendChild(d);
  cargarQR().then(() => { const q = qrcode(0, 'M'); q.addData(wa); q.make(); d.querySelector('#accQR').innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); }).catch(() => d.querySelector('#accQR').innerHTML = '');
  d.querySelector('#accCerrar').onclick = () => { if (o.volver) location.href = o.volver; else d.remove(); };
  d.querySelector('#accUsar').onclick = async () => { let v = d.querySelector('#accCod').value.trim();
    const c = v.match(/[?&]curso=([\w-]+)/); if (c) { try { localStorage.setItem(KC, JSON.stringify([limpiaClave(c[1])].concat(leerCursos()).slice(0, 6))); } catch (e) { } location.reload(); return; }
    const m = v.match(/[?&]acceso=([^&#\s]+)/); if (m) v = decodeURIComponent(m[1]);
    const r = await verificar(v); if (!r.valido) { alert(r.motivo); return; } try { localStorage.setItem(K, v); } catch (e) { } location.reload(); };
}
// Protege una página completa (sub-mundo, juego, biblioteca): si no tiene permiso, muestra el bloqueo.
async function proteger(titulo, volver, idFijo) { await listo; const id = idFijo || idPagina(); if (!puede(id)) bloquear({ titulo, puerta: id, volver }); }

// ---------------------------------------------------------------- una sola sesión 3D por navegador (07/10/2026)
// Abrir el campus (o un simulador 3D) dos veces en el mismo navegador agota la memoria de video del celular y la segunda
// pestaña ya no entra. Regla: la pestaña NUEVA se queda; la anterior libera su 3D y avisa (con botón para volver a ella).
let sesionLista = false;
function liberar3D() {
  document.querySelectorAll('canvas').forEach(c => { try { const gl = c.getContext('webgl2') || c.getContext('webgl'); const x = gl && gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); } catch (e) { } });
  document.querySelectorAll('audio,video').forEach(m => { try { m.pause(); } catch (e) { } });
  try { (window.__audioCtxs || []).forEach(a => a.suspend && a.suspend()); } catch (e) { }
}
function avisoSesion(html, botones) {
  const d = document.createElement('div'); d.id = 'sesFondo';
  d.style.cssText = 'position:fixed;inset:0;background:rgba(14,58,107,.92);z-index:80;display:flex;align-items:center;justify-content:center;padding:16px;font-family:Calibri,"Segoe UI",sans-serif';
  d.innerHTML = `<div style="background:#fff;border-radius:18px;max-width:460px;padding:20px;text-align:center;color:#1B2633">${html}<div id="sesBot" style="margin-top:12px"></div></div>`;
  botones.forEach(([t, fn, prim]) => { const b = document.createElement('button'); b.textContent = t; b.onclick = fn;
    b.style.cssText = `border:0;border-radius:12px;padding:11px 16px;margin:4px;font-weight:700;font-size:1rem;cursor:pointer;background:${prim ? '#154F90' : '#E8F5F9'};color:${prim ? '#fff' : '#0E3A6B'}`; d.querySelector('#sesBot').appendChild(b); });
  document.body.appendChild(d); return d;
}
function sesionUnica() {
  if (sesionLista || !('BroadcastChannel' in window)) return; sesionLista = true;
  const ch = new BroadcastChannel('campus-sst-sesion'), yo = Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  let cerrada = false;
  ch.onmessage = e => { const m = e.data || {};
    if (m.tipo === 'nueva' && m.id !== yo && !cerrada) { cerrada = true; liberar3D(); ch.postMessage({ tipo: 'cerrada', id: yo, para: m.id });
      avisoSesion('<div style="font-size:2.2rem">🔁</div><h2 style="color:#0E3A6B;margin:.2rem 0">Abriste el Campus en otra pestaña</h2><p>Para que funcione bien en tu dispositivo solo puede haber <b>una</b> sesión abierta. Cerramos esta y seguimos en la nueva.</p>',
        [['Seguir en esta pestaña', () => location.reload(), true], ['Cerrar esta pestaña', () => { window.close(); setTimeout(() => { document.body.innerHTML = '<p style="font-family:Calibri,sans-serif;padding:20px">Ya puedes cerrar esta pestaña.</p>'; }, 300); }]]); }
    if (m.tipo === 'cerrada' && m.para === yo) avisoAqui(); };
  let avisado = false;
  function avisoAqui() { if (avisado) return; avisado = true; const t = document.createElement('div');
    t.textContent = 'ℹ️ Cerramos la sesión que tenías abierta en otra pestaña: aquí sigues.';
    t.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);background:#154F90;color:#fff;padding:10px 16px;border-radius:12px;z-index:70;font-family:Calibri,sans-serif;max-width:92vw;box-shadow:0 6px 20px rgba(0,0,0,.25)';
    document.body.appendChild(t); setTimeout(() => t.remove(), 5000); }
  ch.postMessage({ tipo: 'nueva', id: yo });
  // si el sistema libera el 3D (poca memoria), ofrece recargar en lugar de quedarse en negro
  document.addEventListener('webglcontextlost', e => { if (cerrada) return; e.preventDefault && e.preventDefault();
    avisoSesion('<div style="font-size:2.2rem">⚠️</div><h2 style="color:#0E3A6B;margin:.2rem 0">Se reinició la vista 3D</h2><p>Tu dispositivo liberó memoria (por ejemplo, por otra pestaña o app pesada). Cierra otras pestañas del Campus y vuelve a cargar.</p>',
      [['Volver a cargar', () => location.reload(), true]]); }, true);
}
window.Acceso = { listo, estado, puede, idPuerta, idPagina, bloquear, proteger, whatsapp, textoEstado, fecha, WHATSAPP, sesionUnica };
})();
