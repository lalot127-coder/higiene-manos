// Compartir un mundo, edificio o juego por separado: enlace + código QR + botón nativo de compartir (script clásico).
//   Compartir.abrir(url, titulo)
// El QR se dibuja con qrcode-generator (cdnjs). Si la página está en esta computadora (file:// o localhost)
// se avisa que el enlace solo funcionará después de publicar el simulador (ver 04_simulador/LEEME_PUBLICAR.md).
(function () {
const LIB = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
let cargando = null;
const cargarLib = () => cargando || (cargando = new Promise((ok, no) => { if (window.qrcode) return ok(); const s = document.createElement('script'); s.src = LIB; s.onload = ok; s.onerror = no; document.head.appendChild(s); }));
const CSS = `#cmpFondo{position:fixed;inset:0;background:rgba(14,58,107,.7);display:flex;align-items:center;justify-content:center;z-index:50;padding:16px}
#cmpCaja{background:#fff;border-radius:18px;padding:18px;max-width:420px;width:100%;text-align:center;font-family:Calibri,"Segoe UI",sans-serif;color:#1B2633;max-height:92vh;overflow:auto}
#cmpCaja h3{margin:0 0 6px;color:#0E3A6B}#cmpQR svg{width:220px;height:220px}#cmpUrl{width:100%;font-size:.85rem;padding:8px;border:1px solid #8CCDE0;border-radius:8px;margin:8px 0}
#cmpCaja button{border:0;border-radius:12px;padding:10px 14px;font-weight:700;cursor:pointer;margin:3px;font-family:inherit;font-size:.95rem}
.cmpP{background:#154F90;color:#fff}.cmpS{background:#E8F5F9;color:#0E3A6B}.cmpAv{background:#FFF4D6;border-radius:10px;padding:8px;font-size:.85rem;text-align:left;margin-top:8px}`;
async function abrir(url, titulo) {
  // En el servidor de aula, cambia "localhost" por la IP del wifi para que el QR funcione en los celulares
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) { try { const r = await fetch('/api/ip'); if (r.ok) { const d = await r.json(); const u = new URL(url); url = d.base + u.pathname + u.search; } } catch (e) { } }
  if (!document.getElementById('cmpCss')) document.head.insertAdjacentHTML('beforeend', `<style id="cmpCss">${CSS}</style>`);
  const local = location.protocol === 'file:' || /^(localhost|127\.|192\.168\.|10\.)/.test(location.hostname);
  const d = document.createElement('div'); d.id = 'cmpFondo';
  d.innerHTML = `<div id="cmpCaja"><h3>🔗 Compartir</h3><b>${titulo}</b><div id="cmpQR">Generando código QR…</div>
    <input id="cmpUrl" readonly value="${url}"><div><button class="cmpP" id="cmpCopiar">Copiar enlace</button>${navigator.share ? '<button class="cmpP" id="cmpNativo">Enviar…</button>' : ''}<button class="cmpS" id="cmpCerrar">Cerrar</button></div>
    ${local ? `<div class="cmpAv">⚠️ Estás abriendo el simulador desde ${location.protocol === 'file:' ? 'esta computadora' : 'una red local'}. ${/^(192\.168\.|10\.)/.test(location.hostname) ? 'El enlace funciona solo con el mismo wifi mientras el servidor de aula esté encendido.' : 'Este enlace solo funcionará en otros dispositivos cuando el simulador esté publicado en internet (ver LEEME_PUBLICAR.md).'}</div>` : ''}</div>`;
  document.body.appendChild(d);
  d.onclick = e => { if (e.target === d) d.remove(); };
  d.querySelector('#cmpCerrar').onclick = () => d.remove();
  d.querySelector('#cmpCopiar').onclick = async e => { try { await navigator.clipboard.writeText(url); } catch (x) { const i = d.querySelector('#cmpUrl'); i.select(); document.execCommand('copy'); } e.target.textContent = '✅ Copiado'; };
  const n = d.querySelector('#cmpNativo'); if (n) n.onclick = () => navigator.share({ title: titulo, url }).catch(() => { });
  cargarLib().then(() => { const q = window.qrcode(0, 'M'); q.addData(url); q.make(); d.querySelector('#cmpQR').innerHTML = q.createSvgTag({ cellSize: 5, margin: 2, scalable: true }); })
    .catch(() => { d.querySelector('#cmpQR').textContent = '(Sin internet para dibujar el QR; copia el enlace.)'; });
}
// URL absoluta de una ruta relativa a la página actual (limpia ?qa)
const url = rel => { const u = new URL(rel, location.href); u.searchParams.delete('qa'); return u.href; };
window.Compartir = { abrir, url };
})();
