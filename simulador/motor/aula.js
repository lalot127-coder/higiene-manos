// =====================================================================================================================
// AULA DE CAPACITACIÓN 3D · Campus de Simulación SST · CERS                     (creado 08/10/2026, A-Frame 1.7.1)
// Láminas sincronizadas con audio MP3 (un archivo por lámina), controles ⏮ ▶ ⏸ ⏭ flotando en el mundo 3D,
// barra 2D de respaldo, subtítulos, índice y avance guardado. Funciona en PC (mouse/teclado), celular/tablet (tacto)
// y Meta Quest (navegador del visor, WebXR con rayo de los controles o de las manos).
//
// Uso (página del curso, p. ej. mundos/empresa/aula_jornada40/index.html):
//   <script src="../../../motor/vendor/aframe-1.7.1.min.js"></script>
//   <script src="../../../motor/aula.js"></script>
//   <script>Aula.iniciar({ curso: 'curso.json' });</script>
//
// curso.json: { clave, titulo, subtitulo, area, volver, laminas: [{ n, titulo, bloque, img, audio, texto, enlace?, pausa? }] }
//   - El audio manda: al terminar el MP3 de una lámina pasa sola a la siguiente (salvo "pausa": true).
//   - Si falta el MP3 (aún no se genera), lee el texto con la voz del navegador como VOZ PROVISIONAL.
// Script clásico (sin módulos) para que funcione también con file:// y en el servidor de aula.
// =====================================================================================================================
(function () {
'use strict';
const BASE_MOTOR = document.currentScript ? document.currentScript.src : location.href;
const AZUL = '#0E3A6B', AZUL2 = '#154F90', CIAN = '#8CCDE0', ORO = '#E2A33B';
const $ = id => document.getElementById(id);
const esMovil = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) && !/OculusBrowser|Quest|Pico/i.test(navigator.userAgent);
const P = new URLSearchParams(location.search);
const SVG = { play: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg>',
  pausa: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor"/></svg>',
  sig: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M5 4l11 8-11 8zM17 4h3v16h-3z" fill="currentColor"/></svg>',
  ant: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M19 4L8 12l11 8zM4 4h3v16H4z" fill="currentColor"/></svg>' };

// ------------------------------------------------------------------------------------------------ texturas de lienzo
function lienzo(w, h, dibuja) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); dibuja(g, w, h); return c;
}
function redondo(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
// Iconos dibujados (no emoji: el visor y algunos celulares no los tienen en 3D)
function icono(g, tipo, cx, cy, s, color) {
  g.fillStyle = color; g.strokeStyle = color; g.lineWidth = s * 0.12; g.lineJoin = 'round';
  const tri = (x, y, k) => { g.beginPath(); g.moveTo(x - s * 0.35 * k, y - s * 0.4); g.lineTo(x + s * 0.4 * k, y); g.lineTo(x - s * 0.35 * k, y + s * 0.4); g.closePath(); g.fill(); };
  if (tipo === 'play') tri(cx + s * 0.05, cy, 1);
  if (tipo === 'pausa') { g.fillRect(cx - s * 0.3, cy - s * 0.4, s * 0.2, s * 0.8); g.fillRect(cx + s * 0.1, cy - s * 0.4, s * 0.2, s * 0.8); }
  if (tipo === 'sig') { tri(cx - s * 0.1, cy, 1); g.fillRect(cx + s * 0.28, cy - s * 0.4, s * 0.12, s * 0.8); }
  if (tipo === 'ant') { tri(cx + s * 0.1, cy, -1); g.fillRect(cx - s * 0.4, cy - s * 0.4, s * 0.12, s * 0.8); }
  if (tipo === 'enlace') { g.beginPath(); g.arc(cx - s * 0.12, cy + s * 0.12, s * 0.22, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(cx + s * 0.12, cy - s * 0.12, s * 0.22, 0, Math.PI * 2); g.stroke(); }
  if (tipo === 'reinicio') { g.beginPath(); g.arc(cx, cy, s * 0.32, -0.3, Math.PI * 1.55); g.stroke(); g.beginPath(); g.moveTo(cx + s * 0.38, cy - s * 0.32); g.lineTo(cx + s * 0.34, cy - s * 0.02); g.lineTo(cx + s * 0.08, cy - s * 0.14); g.closePath(); g.fill(); }
}
function texturaBoton(tipo, activo) {
  return lienzo(256, 256, (g, w, h) => {
    redondo(g, 10, 10, w - 20, h - 20, 56); g.fillStyle = activo ? ORO : AZUL2; g.fill();
    g.lineWidth = 10; g.strokeStyle = '#FFFFFF'; g.stroke(); icono(g, tipo, w / 2, h / 2, 130, '#FFFFFF');
  });
}
function texturaTexto(lineas, w = 1024, h = 128, fondo = 'rgba(14,58,107,0.92)') {
  return lienzo(w, h, (g) => {
    redondo(g, 4, 4, w - 8, h - 8, 24); g.fillStyle = fondo; g.fill();
    g.fillStyle = '#FFFFFF'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const L = Array.isArray(lineas) ? lineas : [lineas];
    L.forEach((t, i) => { g.font = (i === 0 ? '700 ' : '400 ') + Math.round(h / (L.length + 1.2)) + 'px Calibri, "Segoe UI", Arial, sans-serif';
      g.fillText(String(t).slice(0, 70), w / 2, h * (i + 1) / (L.length + 1)); });
  });
}
function ponerTextura(el, canvas) {
  const aplicar = () => { const m = el.getObject3D('mesh'); if (!m) return;
    const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    if (m.material.map) m.material.map.dispose(); m.material.map = t; m.material.transparent = true; m.material.needsUpdate = true; };
  // se aplica cuando el componente material ya se inicializó (si no, A-Frame la reemplaza)
  if (el.hasLoaded) aplicar(); else el.addEventListener('loaded', () => setTimeout(aplicar, 0), { once: true });
}

// ------------------------------------------------------------------------------------------------ estilos 2D
const CSS = `
html,body{margin:0;height:100%;overflow:hidden;background:#0B2340;font-family:Calibri,"Segoe UI",Arial,sans-serif}
#auBarra{position:fixed;left:0;right:0;bottom:0;z-index:20;display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;
  padding:8px max(10px,env(safe-area-inset-right)) calc(8px + env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left));background:rgba(14,58,107,.94);color:#fff}
#auBarra button svg{vertical-align:middle}#auBarra button{border:0;border-radius:12px;min-width:46px;height:44px;padding:0 12px;font-size:1.05rem;font-weight:700;cursor:pointer;background:#E8F5F9;color:${AZUL};font-family:inherit}
#auBarra button.p{background:${ORO};color:#1B2633;min-width:64px}#auBarra button:disabled{opacity:.4}
#auBarra .info{flex:1 1 100%;text-align:center;font-size:.95rem;order:-1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#auProg{position:fixed;left:0;right:0;top:0;height:5px;background:rgba(255,255,255,.15);z-index:21}#auProg div{height:100%;width:0;background:${ORO};transition:width .3s}
#auNav{position:fixed;top:10px;right:max(10px,env(safe-area-inset-right));z-index:21;display:flex;gap:6px}
#auNav button{border:0;border-radius:12px;height:40px;padding:0 12px;font-weight:700;cursor:pointer;background:rgba(255,255,255,.92);color:${AZUL};font-family:inherit;font-size:.95rem}
#auNav button.salir{background:#C62828;color:#fff}
#auLamina{position:fixed;left:0;right:0;top:56px;z-index:15;display:none;justify-content:center;padding:0 8px}
#auLamina img{width:100%;max-width:1100px;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.45);background:#fff}
#auSub{position:fixed;left:50%;transform:translateX(-50%);bottom:118px;z-index:19;width:min(94vw,900px);max-height:30vh;overflow:auto;display:none;
  background:rgba(0,0,0,.78);color:#fff;border-radius:12px;padding:10px 14px;font-size:1.02rem;line-height:1.35}
#auAviso{position:fixed;left:50%;top:64px;transform:translateX(-50%);z-index:22;background:${AZUL2};color:#fff;border-radius:12px;padding:9px 14px;display:none;max-width:92vw;text-align:center}
#auModal{position:fixed;inset:0;background:rgba(14,58,107,.9);z-index:40;display:none;align-items:center;justify-content:center;padding:14px}
#auCaja{background:#fff;color:#1B2633;border-radius:18px;max-width:560px;width:100%;max-height:88vh;overflow:auto;padding:18px}
#auCaja h2{color:${AZUL};margin:.2rem 0 .6rem}#auCaja button{border:0;border-radius:12px;padding:11px 16px;font-weight:700;cursor:pointer;font-family:inherit;font-size:1rem;margin:4px}
#auCaja .p{background:${AZUL2};color:#fff}#auCaja .s{background:#E8F5F9;color:${AZUL}}
#auCaja ol{padding-left:0;list-style:none;margin:0}#auCaja li{padding:7px 8px;border-radius:8px;cursor:pointer}#auCaja li:hover,#auCaja li.act{background:#E8F5F9}
#auCaja .blq{font-weight:800;color:${AZUL2};margin:10px 0 2px;font-size:.85rem;letter-spacing:.05em}
@media (max-width:760px){#auBarra .t{display:none}#auSub{bottom:126px;max-height:24vh;font-size:.95rem}}
.a-enter-vr{bottom:auto!important;top:10px!important;right:auto!important;left:max(10px,env(safe-area-inset-left))!important}
body.vista2d #auLamina{top:0;bottom:0;padding-bottom:120px;align-items:center;background:#0B2340}`;

// ------------------------------------------------------------------------------------------------ escena 3D (aula)
function construirAula(sc, cfg) {
  const e = (tag, at = {}, padre = sc) => { const x = document.createElement(tag); for (const k in at) x.setAttribute(k, at[k]); padre.appendChild(x); return x; };
  const caja = (w, h, d, color, x, y, z, padre) => e('a-box', { width: w, height: h, depth: d, color, position: `${x} ${y} ${z}`, material: 'roughness:0.9' }, padre);
  // piso, paredes y techo (aula de 10 x 12 m)
  e('a-plane', { width: 10, height: 12, rotation: '-90 0 0', position: '0 0 -1', color: '#B9A58A', material: 'roughness:1' });
  caja(10, 3.6, 0.1, '#EEF2F5', 0, 1.8, -7);            // pared frontal
  caja(10, 3.6, 0.1, '#EEF2F5', 0, 1.8, 5);             // pared trasera
  caja(0.1, 3.6, 12, '#E3EAF0', -5, 1.8, -1);           // izquierda
  caja(0.1, 3.6, 12, '#E3EAF0', 5, 1.8, -1);            // derecha
  e('a-plane', { width: 10, height: 12, rotation: '90 0 0', position: '0 3.6 -1', color: '#F7F9FB' });
  caja(10, 0.12, 0.02, AZUL, 0, 1.0, -6.94); caja(0.02, 0.12, 12, AZUL, -4.94, 1.0, -1); caja(0.02, 0.12, 12, AZUL, 4.94, 1.0, -1); // franja institucional
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) e('a-plane', { width: 1.2, height: 0.3, rotation: '90 0 0', position: `${-3 + i * 3} 3.58 ${-4 + j * 4}`, material: 'shader:flat;color:#FFFFFF' });
  // ventanas (luz natural) en la pared izquierda
  for (let i = 0; i < 3; i++) e('a-plane', { width: 2, height: 1.4, rotation: '0 90 0', position: `-4.94 2 ${-4.5 + i * 3.2}`, material: 'shader:flat;color:#CFE8F7' });
  // estrado, pantalla y marco
  caja(7.4, 0.2, 2.2, '#8D6E63', 0, 0.1, -5.9);
  caja(5.85, 3.36, 0.08, '#1B2633', 0, 1.95, -6.9);
  const pantalla = e('a-plane', { id: 'auPantalla', width: 5.6, height: 3.15, position: '0 1.95 -6.85', material: 'shader:flat;color:#FFFFFF' });
  // logo CERS sobre la pantalla (recurso del campus)
  e('a-plane', { width: 0.6, height: 0.6, position: '-3.75 2.9 -6.94', material: `shader:flat;src:url(${new URL('../recursos/logo_CERS.jpeg', BASE_MOTOR).href})` });
  // atril
  caja(0.7, 1.05, 0.45, '#5D4037', 2.6, 0.72, -5.4); caja(0.8, 0.06, 0.55, '#6D4C41', 2.6, 1.27, -5.4);
  // filas de sillas y mesas
  for (let f = 0; f < 3; f++) for (let c = -2; c <= 2; c++) { if (c === 0) continue;
    const x = c * 1.5, z = -1.2 + f * 1.9;
    caja(1.2, 0.05, 0.5, '#CFD8DC', x, 0.74, z - 0.45); caja(0.05, 0.72, 0.45, '#78909C', x - 0.55, 0.37, z - 0.45); caja(0.05, 0.72, 0.45, '#78909C', x + 0.55, 0.37, z - 0.45);
    caja(0.46, 0.05, 0.44, AZUL2, x, 0.46, z + 0.1); caja(0.46, 0.5, 0.05, AZUL2, x, 0.72, z + 0.32); }
  // luz
  e('a-entity', { light: 'type:ambient;intensity:0.75;color:#FFFFFF' });
  e('a-entity', { light: 'type:directional;intensity:0.65', position: '-2 4 2' });

  // --------------------------------------------------- panel de controles flotante (al alcance de la mano en VR)
  const panel = e('a-entity', { id: 'auPanel', position: '0 0.98 -1.6', rotation: '-30 0 0' });
  e('a-plane', { width: 1.5, height: 0.62, position: '0 0 -0.01', material: 'shader:flat;color:#0E3A6B;opacity:0.85;transparent:true' }, panel);
  const B = {};
  [['ant', -0.34], ['play', 0], ['sig', 0.34], ['enlace', 0.6]].forEach(([k, x]) => {
    const b = e('a-plane', { class: 'clic', width: k === 'enlace' ? 0.2 : 0.26, height: k === 'enlace' ? 0.2 : 0.26, position: `${x} 0.07 0`, material: 'shader:flat;transparent:true' }, panel);
    ponerTextura(b, texturaBoton(k === 'play' ? 'play' : k, k === 'play'));
    b.addEventListener('mouseenter', () => b.object3D.scale.setScalar(1.12));
    b.addEventListener('mouseleave', () => b.object3D.scale.setScalar(1));
    B[k] = b;
  });
  const info = e('a-plane', { width: 1.42, height: 0.16, position: '0 -0.2 0.001', material: 'shader:flat;transparent:true' }, panel);
  // barra de avance 3D
  e('a-plane', { width: 1.3, height: 0.025, position: '0 -0.29 0.001', material: 'shader:flat;color:#FFFFFF;opacity:0.3;transparent:true' }, panel);
  const avance = e('a-plane', { width: 1.3, height: 0.025, position: '0 -0.29 0.002', material: `shader:flat;color:${ORO}` }, panel);
  // rótulo con el título del curso en la pared derecha
  const rotulo = e('a-plane', { width: 3.6, height: 0.36, rotation: '0 -90 0', position: '4.93 2.6 -3.2', material: 'shader:flat;transparent:true' });
  ponerTextura(rotulo, texturaTexto([cfg.titulo], 2048, 205));
  return { pantalla, B, info, avance };
}

// ------------------------------------------------------------------------------------------------ reproductor
function iniciar(opc = {}) {
  document.head.insertAdjacentHTML('beforeend', `<style>${CSS}</style>`);
  fetch(opc.curso || 'curso.json', { cache: 'no-cache' }).then(r => r.json()).then(cfg => arrancar(Object.assign({}, cfg, opc)))
    .catch(err => { document.body.innerHTML = `<p style="color:#fff;padding:20px;font-family:sans-serif">No se pudo cargar el curso (${err.message}).</p>`; });
}

function arrancar(cfg) {
  const L = cfg.laminas, CLAVE = 'aula_' + (cfg.clave || 'curso');
  const volver = new URL(cfg.volver || ('../../../index.html' + (cfg.area ? '?mundo=' + cfg.area : '')), location.href).href;
  let i = 0, sonando = false, provisional = false, temporizador = null;
  const audio = new Audio(); audio.preload = 'auto';
  let xrOk = !esMovil || P.has('xr');

  // ------------------------------- escena A-Frame
  const sc = document.createElement('a-scene');
  sc.setAttribute('renderer', 'antialias: true; maxCanvasWidth: 1920; maxCanvasHeight: 1920');
  sc.setAttribute('vr-mode-ui', `enabled: ${xrOk}`);
  sc.setAttribute('xr-mode-ui', `enabled: ${xrOk}; XRMode: vr`);
  sc.setAttribute('cursor', 'rayOrigin: mouse; fuse: false');
  sc.setAttribute('raycaster', 'objects: .clic');
  sc.setAttribute('loading-screen', `dotsColor: ${ORO}; backgroundColor: ${AZUL}`);
  sc.setAttribute('background', 'color: #DCE6EE');
  const rig = document.createElement('a-entity'); rig.setAttribute('id', 'auRig'); rig.setAttribute('position', '0 0 0.2'); sc.appendChild(rig);
  const cam = document.createElement('a-entity');
  cam.setAttribute('camera', 'active: true; fov: ' + (innerWidth < innerHeight ? 75 : 60)); cam.setAttribute('position', '0 1.45 0');
  cam.setAttribute('look-controls', 'pointerLockEnabled: false; reverseMouseDrag: false'); rig.appendChild(cam);
  ['left', 'right'].forEach(h => { const m = document.createElement('a-entity');
    m.setAttribute('laser-controls', 'hand: ' + h); m.setAttribute('raycaster', 'objects: .clic; far: 8; lineColor: #E2A33B; lineOpacity: 0.85'); rig.appendChild(m); });
  const A = construirAula(sc, cfg);
  document.body.appendChild(sc);   // se agrega al final: así A-Frame usa NUESTRA cámara y no crea una por defecto
  // panel: abajo en pantalla plana; al alcance de la mano dentro del visor
  const panelPos = vr => { const p = document.getElementById('auPanel'); if (!p) return;
    p.setAttribute('position', vr ? '0 1.0 -1.6' : '0 0.9 -1.35'); p.setAttribute('rotation', vr ? '-25 0 0' : '-18 0 0'); p.setAttribute('scale', vr ? '1 1 1' : '0.6 0.6 0.6'); };
  sc.addEventListener('enter-vr', () => { panelPos(true); $('auBarra').style.display = 'none'; });
  sc.addEventListener('exit-vr', () => { panelPos(false); $('auBarra').style.display = ''; });
  setTimeout(() => panelPos(false), 0);

  // ------------------------------- interfaz 2D
  document.body.insertAdjacentHTML('beforeend', `
  <div id="auProg"><div></div></div>
  <div id="auNav"><button id="auAtras" title="Regresar al edificio">⬅ <span class="t">Atrás</span></button><button id="auInicio" title="Inicio del campus">🏠</button><button id="auComp" title="Compartir">🔗</button><button id="auSalir" class="salir" title="Salir">✖</button></div>
  <div id="auLamina"><img id="auImg" alt="Lámina del curso"></div>
  <div id="auSub"></div><div id="auAviso"></div>
  <div id="auBarra"><div class="info" id="auInfo"></div>
    <button id="bAnt" title="Lámina anterior (←)">${SVG.ant}</button><button id="bPlay" class="p" title="Reproducir / pausa (espacio)">${SVG.play}</button><button id="bSig" title="Lámina siguiente (→)">${SVG.sig}</button>
    <button id="bEnl" title="Abrir el recurso de esta lámina" style="display:none">🔗 <span class="t">Abrir recurso</span></button>
    <button id="bIdx" title="Índice">☰ <span class="t">Índice</span></button><button id="bSub" title="Subtítulos">CC</button><button id="bVista" title="Cambiar vista">📺 <span class="t">Vista</span></button></div>
  <div id="auModal"><div id="auCaja"></div></div>`);
  const aviso = (t, ms = 3500) => { const a = $('auAviso'); a.textContent = t; a.style.display = 'block'; clearTimeout(aviso.t); aviso.t = setTimeout(() => a.style.display = 'none', ms); };
  const modal = html => { $('auCaja').innerHTML = html; $('auModal').style.display = 'flex'; };
  const cerrarModal = () => { $('auModal').style.display = 'none'; };
  $('auModal').onclick = ev => { if (ev.target.id === 'auModal') cerrarModal(); };

  // vista: en celular vertical la lámina se ve mejor en 2D (la escena 3D queda detrás)
  let vista2D = esMovil && innerWidth < innerHeight;
  const aplicarVista = () => { $('auLamina').style.display = vista2D ? 'flex' : 'none'; document.body.classList.toggle('vista2d', vista2D); $('bVista').innerHTML = (vista2D ? '🧊' : '📺') + ' <span class="t">' + (vista2D ? 'Ver en 3D' : 'Ver lámina') + '</span>'; };
  $('bVista').onclick = () => { vista2D = !vista2D; aplicarVista(); }; aplicarVista();
  let subs = false; $('bSub').onclick = () => { subs = !subs; $('auSub').style.display = subs ? 'block' : 'none'; $('bSub').style.background = subs ? ORO : ''; };

  // ------------------------------- texturas de láminas (caché pequeña)
  const cache = new Map(), cargador = new THREE.TextureLoader();
  function textura(k) {
    if (k < 0 || k >= L.length) return null;
    if (!cache.has(k)) cache.set(k, new Promise(ok => cargador.load(L[k].img, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; ok(t); }, undefined, () => ok(null))));
    if (cache.size > 6) for (const key of [...cache.keys()]) if (Math.abs(key - k) > 2) { cache.get(key).then(t => t && t.dispose()); cache.delete(key); }
    return cache.get(k);
  }
  function mostrar(k) {
    const mesh = A.pantalla.getObject3D('mesh');
    textura(k).then(t => { if (k !== i || !t) return; const m = A.pantalla.getObject3D('mesh'); if (!m) return; m.material.map = t; m.material.color.set('#FFFFFF'); m.material.needsUpdate = true; });
    textura(k + 1); textura(k - 1);
    $('auImg').src = L[k].img;
    const l = L[k];
    $('auInfo').textContent = `${k + 1} / ${L.length} · ${l.titulo || ''}`;
    $('auSub').textContent = l.texto || '';
    $('auProg').firstChild.style.width = ((k + 1) / L.length * 100) + '%';
    ponerTextura(A.info, texturaTexto([`${k + 1} / ${L.length}  ·  ${(l.titulo || '').slice(0, 48)}`], 1024, 116, 'rgba(0,0,0,0)'));
    const f = (k + 1) / L.length; A.avance.object3D.scale.x = Math.max(0.001, f); A.avance.object3D.position.x = -0.65 * (1 - f);
    $('bEnl').style.display = l.enlace ? '' : 'none'; A.B.enlace.object3D.visible = !!l.enlace; A.B.enlace.classList.toggle('clic', !!l.enlace);
    $('bAnt').disabled = k === 0; $('bSig').disabled = k === L.length - 1;
    try { localStorage.setItem(CLAVE, String(k)); } catch (e) { }
    void mesh;
  }
  function iconoPlay() {
    $('bPlay').innerHTML = sonando ? SVG.pausa : SVG.play;
    ponerTextura(A.B.play, texturaBoton(sonando ? 'pausa' : 'play', true));
  }

  // ------------------------------- audio (MP3 por lámina; si falta: voz provisional del navegador)
  const voz = window.speechSynthesis;
  function vozProvisional(texto, alTerminar) {
    if (!voz) { aviso('Audio pendiente para esta lámina.'); sonando = false; iconoPlay(); return; }
    provisional = true; voz.cancel();
    const partes = texto.match(/[^.!?¿¡]+[.!?]+|[^.!?]+$/g) || [texto]; let j = 0;
    const es = voz.getVoices().filter(v => /^es/i.test(v.lang)); const vMX = es.find(v => /MX|419|US/i.test(v.lang)) || es[0];
    const decir = () => { if (!sonando) return; if (j >= partes.length) { alTerminar(); return; }
      const u = new SpeechSynthesisUtterance(partes[j++].trim()); u.lang = 'es-MX'; if (vMX) u.voice = vMX; u.rate = 1; u.onend = decir; u.onerror = decir; voz.speak(u); };
    if (!vozProvisional.avisado) { vozProvisional.avisado = true; aviso('🔈 Voz provisional del navegador (el audio grabado aún no está disponible).', 5000); }
    // si el navegador no tiene voz (p. ej. algunos visores), termina "al instante": no avanzar solo
    const t0 = Date.now(), minimo = texto.length / 14 * 1000 * 0.3;
    const fin = alTerminar; alTerminar = () => { if (Date.now() - t0 < minimo) { sonando = false; iconoPlay(); aviso('🔇 Audio pendiente para esta lámina. Lee los subtítulos (CC) y avanza con ⏭.', 6000); } else fin(); };
    decir();
  }
  function alTerminarLamina() {
    if (!sonando) return;
    if (L[i].pausa) { sonando = false; iconoPlay(); aviso(L[i].enlace ? 'Pausa: abre el recurso y, cuando termines, pulsa ▶ para continuar.' : 'Pausa: pulsa ▶ para continuar.', 6000); if (i < L.length - 1) { i++; mostrar(i); } return; }
    if (i < L.length - 1) { temporizador = setTimeout(() => { i++; mostrar(i); reproducir(); }, 700); }
    else { sonando = false; iconoPlay(); aviso('✅ Terminaste el curso. ¡Gracias!', 6000); try { localStorage.removeItem(CLAVE); } catch (e) { } }
  }
  function reproducir() {
    clearTimeout(temporizador); sonando = true; iconoPlay(); provisional = false;
    const l = L[i];
    if (!l.audio) { vozProvisional(l.texto || '', alTerminarLamina); return; }
    audio.onended = alTerminarLamina;
    audio.onerror = () => { if (sonando) vozProvisional(l.texto || '', alTerminarLamina); };
    const src = new URL(l.audio, location.href).href;
    if (audio.src !== src) audio.src = src;
    audio.play().catch(err => { if (err && err.name === 'NotAllowedError') { sonando = false; iconoPlay(); aviso('Toca ▶ para iniciar el audio.'); } });
  }
  function pausar() { clearTimeout(temporizador); sonando = false; audio.pause(); if (voz) voz.cancel(); iconoPlay(); }
  function ir(k, seguir = sonando) {
    if (k < 0 || k >= L.length) return;
    pausar(); audio.removeAttribute('src'); audio.load(); i = k; mostrar(i); if (seguir) reproducir();
  }
  const alternar = () => { if (sonando) pausar(); else if (!provisional && audio.src && !audio.ended && audio.currentTime > 0) { sonando = true; iconoPlay(); audio.play(); } else reproducir(); };
  const abrirEnlace = () => { const u = L[i].enlace; if (!u) return; pausar();
    if (sc.is('vr-mode')) sc.exitVR(); window.open(u, '_blank', 'noopener'); };

  // controles 2D, 3D y teclado
  $('bPlay').onclick = alternar; $('bSig').onclick = () => ir(i + 1); $('bAnt').onclick = () => ir(i - 1); $('bEnl').onclick = abrirEnlace;
  A.B.play.addEventListener('click', alternar); A.B.sig.addEventListener('click', () => ir(i + 1)); A.B.ant.addEventListener('click', () => ir(i - 1));
  A.B.enlace.addEventListener('click', () => { if (L[i].enlace) abrirEnlace(); });
  addEventListener('keydown', ev => { if ($('auModal').style.display === 'flex') return;
    if (ev.code === 'Space') { ev.preventDefault(); alternar(); } if (ev.code === 'ArrowRight') ir(i + 1); if (ev.code === 'ArrowLeft') ir(i - 1); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && sonando) pausar(); });

  // índice por bloques
  $('bIdx').onclick = () => { let html = '<h2>☰ Índice del curso</h2><ol>', b = '';
    L.forEach((l, k) => { if (l.bloque && l.bloque !== b) { b = l.bloque; html += `<div class="blq">${b}</div>`; }
      html += `<li data-k="${k}" class="${k === i ? 'act' : ''}">${k + 1}. ${l.titulo || 'Lámina ' + (k + 1)}</li>`; });
    modal(html + '</ol><div style="text-align:right"><button class="s" id="auCerr">Cerrar</button></div>');
    $('auCerr').onclick = cerrarModal; $('auCaja').querySelectorAll('li').forEach(li => li.onclick = () => { cerrarModal(); ir(+li.dataset.k); }); };

  // navegación del campus
  $('auAtras').onclick = () => { pausar(); location.href = volver; };
  $('auInicio').onclick = () => { pausar(); location.href = new URL('../index.html?plaza', BASE_MOTOR).href; };
  $('auSalir').onclick = () => { pausar(); location.href = new URL('../index.html?salir', BASE_MOTOR).href; };
  $('auComp').onclick = () => { const u = location.href.split('#')[0];
    if (window.Compartir) Compartir.abrir(u, `🎓 Aula · ${cfg.titulo} · Campus SST`); else { navigator.clipboard && navigator.clipboard.writeText(u); aviso('🔗 Enlace copiado'); } };
  if (!window.Compartir) { const s = document.createElement('script'); s.src = new URL('compartir.js', BASE_MOTOR).href; document.head.appendChild(s); }

  // control de acceso del campus (mismas reglas que los sub-mundos)
  const proteger = () => { Acceso.sesionUnica && Acceso.sesionUnica(); Acceso.proteger(`🎓 Aula · ${cfg.titulo}`, volver); };
  if (window.Acceso) proteger(); else { const s = document.createElement('script'); s.src = new URL('acceso.js', BASE_MOTOR).href; s.onload = proteger; document.head.appendChild(s); }

  // arranque: lámina guardada o la primera; el audio inicia con un toque (regla de los navegadores)
  const arrancarUI = () => {
    let guard = 0; try { guard = +localStorage.getItem(CLAVE) || 0; } catch (e) { }
    if (P.has('l')) guard = Math.min(L.length - 1, Math.max(0, (+P.get('l') || 1) - 1));
    i = guard; mostrar(i); iconoPlay();
    modal(`<h2>🎓 ${cfg.titulo}</h2><p>${cfg.subtitulo || ''}</p>
      <p>Usa los botones <b>⏮ ▶ ⏸ ⏭</b> de la barra o los que flotan frente a ti en el aula. ${xrOk ? 'En el visor Meta Quest pulsa <b>VR</b> y apunta con el control o con la mano.' : ''} Teclado: espacio y flechas.</p>
      ${guard > 0 ? `<p>Te quedaste en la lámina <b>${guard + 1}</b>.</p>` : ''}
      <div style="text-align:center">${guard > 0 ? '<button class="p" id="auSeguir">▶ Continuar</button><button class="s" id="auDesde0">Empezar de nuevo</button>' : '<button class="p" id="auSeguir">▶ Comenzar</button>'}</div>`);
    $('auSeguir').onclick = () => { cerrarModal(); reproducir(); };
    if ($('auDesde0')) $('auDesde0').onclick = () => { cerrarModal(); ir(0, true); };
  };
  if (sc.hasLoaded) arrancarUI(); else sc.addEventListener('loaded', arrancarUI);
  if (voz && voz.onvoiceschanged !== undefined) voz.onvoiceschanged = () => { };
  window.__aula = { ir, reproducir, pausar, estado: () => ({ i, sonando, provisional }) };
}

window.Aula = { iniciar };
})();
