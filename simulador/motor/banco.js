// Banco de preguntas unificado de los juegos del campus (script clásico). Crece solo:
//   1) recursos/banco_trivia.js ← 05_herramientas/banco_simulador.py junta las preguntas de juego de TODOS los cursos
//      (06_banco_preguntas/*.json). Cada curso nuevo o banco nuevo agrega preguntas al correr el script.
//   2) Señales: se generan de motor/senales.js (cada señal nueva = pregunta nueva, con imagen).
//   3) Biblioteca: se generan de biblioteca/catalogo.js (cada norma verificada nueva = pregunta nueva).
// Formato de pregunta: {tema, p, o:[opciones], r: índice correcto, f: fuente, rf: retroalimentación, img?: dataURL}
//   Banco.temas() → [{tema, preguntas}]   Banco.al azar(tema?) → pregunta
(function () {
const barajar = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
function opciones(correcta, otras) { const o = barajar([correcta, ...barajar(otras.filter(x => x !== correcta)).slice(0, 3)]); return { o, r: o.indexOf(correcta) }; }
function deSenales() {
  if (!window.Senales) return [];
  return Senales.LISTA.map(s => { const { o, r } = opciones(s.nombre, Senales.LISTA.map(x => x.nombre));
    return { p: '¿Qué indica esta señal?', o, r, f: s.norma, rf: s.significado, imgId: s.id }; });
}
function deBiblioteca() {
  if (!window.DOCUMENTOS) return [];
  const noms = DOCUMENTOS.filter(d => /^(PROY-)?NOM-/.test(d.clave));
  return noms.map(d => { const { o, r } = opciones(d.titulo, noms.map(x => x.titulo));
    return { p: `¿De qué trata la ${d.clave}?`, o, r, f: `${d.clave} (${d.publicacion})`, rf: d.uso }; });
}
let cache = null;
function temas() {
  if (cache) return cache;
  cache = (window.BANCO_TRIVIA || []).map(t => ({ tema: t.tema, preguntas: t.preguntas }));
  const s = deSenales(); if (s.length) cache.push({ tema: 'Señales de seguridad', preguntas: s });
  const b = deBiblioteca(); if (b.length) cache.push({ tema: 'Biblioteca normativa', preguntas: b });
  return cache;
}
// Selección de cursos/temas (se recuerda en este dispositivo). Sin selección = todos.
const KSEL = 'banco_temas_elegidos';
function elegidos() { try { return JSON.parse(localStorage.getItem(KSEL) || 'null'); } catch (e) { return null; } }
function activos() { const e = elegidos(), ts = temas(); if (!e || !e.length) return ts; const f = ts.filter(t => e.includes(t.tema)); return f.length ? f : ts; }
// Ventana para elegir: Banco.selector(alTerminar) → llama alTerminar(activos) al guardar.
function selector(alTerminar) {
  const ts = temas(), e = elegidos(), marcado = t => !e || !e.length || e.includes(t.tema);
  let m = document.getElementById('bancoSel');
  if (!m) { m = document.createElement('div'); m.id = 'bancoSel'; document.body.appendChild(m); }
  m.style.cssText = 'position:fixed;inset:0;background:rgba(14,58,107,.75);display:flex;align-items:center;justify-content:center;z-index:60;padding:12px';
  m.innerHTML = `<div style="background:#fff;border-radius:18px;padding:18px;max-width:520px;width:100%;max-height:90vh;overflow:auto;font-family:Calibri,'Segoe UI',sans-serif">
   <h2 style="color:#0E3A6B;margin-top:0">📚 ¿De qué cursos quieres las preguntas?</h2>
   <p style="color:#5B6B7C;margin-top:0">Marca uno o varios. Se guarda en este dispositivo.</p>
   ${ts.map((t, i) => `<label style="display:flex;gap:10px;align-items:center;padding:9px 10px;margin:5px 0;background:#E8F5F9;border-radius:11px;font-size:1.02rem;cursor:pointer"><input type="checkbox" data-i="${i}" ${marcado(t) ? 'checked' : ''} style="width:20px;height:20px"> <span style="flex:1">${t.tema}</span><small style="color:#5B6B7C">${t.preguntas.length} preguntas</small></label>`).join('')}
   <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button id="bsTodos" style="border:0;border-radius:11px;padding:9px 12px;background:#E8F5F9;color:#0E3A6B;font-weight:700;cursor:pointer">Todos</button><button id="bsNing" style="border:0;border-radius:11px;padding:9px 12px;background:#E8F5F9;color:#0E3A6B;font-weight:700;cursor:pointer">Ninguno</button>
   <button id="bsOk" style="margin-left:auto;border:0;border-radius:12px;padding:10px 18px;background:#154F90;color:#fff;font-weight:800;cursor:pointer">Usar estos temas</button></div></div>`;
  const cajas = () => [...m.querySelectorAll('input[type=checkbox]')];
  m.querySelector('#bsTodos').onclick = () => cajas().forEach(c => c.checked = true);
  m.querySelector('#bsNing').onclick = () => cajas().forEach(c => c.checked = false);
  m.querySelector('#bsOk').onclick = () => { const sel = cajas().filter(c => c.checked).map(c => ts[+c.dataset.i].tema);
    if (!sel.length) return alert('Elige al menos un tema.');
    try { localStorage.setItem(KSEL, JSON.stringify(sel.length === ts.length ? [] : sel)); } catch (e) { }
    m.style.display = 'none'; alTerminar && alTerminar(activos()); };
}
const pendientes = {};
function alAzar(tema) {
  const ts = activos(); if (!ts.length) return null;
  const t = tema ? temas().find(x => x.tema === tema) || ts[0] : ts[Math.floor(Math.random() * ts.length)];
  if (!pendientes[t.tema] || !pendientes[t.tema].length) pendientes[t.tema] = barajar(t.preguntas);
  const q = { ...pendientes[t.tema].pop(), tema: t.tema };
  if (q.imgId && window.Senales) q.img = Senales.dataURL(q.imgId, 220);
  return q;
}
window.Banco = { temas, activos, elegidos, selector, alAzar, barajar, total: () => activos().reduce((s, t) => s + t.preguntas.length, 0) };
})();
