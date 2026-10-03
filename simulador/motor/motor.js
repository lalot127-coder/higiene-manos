// Motor común de los sub-mundos del simulador (Three.js 0.160 por CDN, importmap en cada página).
// Da: escena básica táctil, utilidades de geometría, panel de pasos, preguntas, puntaje, errores críticos con
// fuente, reporte final, resultados del grupo (localStorage + CSV) y envío al servidor de aula (/api/registro).
// Script CLÁSICO (no módulo) para que funcione también al abrir el archivo con doble clic (file://).
// Uso en cada sub-mundo:
//   <script src="../../../motor/motor.js"></script>   (en <head>)
//   <script type="module"> import * as THREE from 'three'; import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
//     const W = MotorSim.crearMundo(THREE, OrbitControls, {...}); </script>
(function () {
const BASE_MOTOR = document.currentScript ? document.currentScript.src : location.href;

const CSS = `
:root{--navy:#0E3A6B;--azul:#154F90;--medio:#1F6FB2;--cian:#3FA7C6;--cielo:#8CCDE0;--hielo:#E8F5F9;--texto:#1B2633;--tenue:#5B6B7C;--bien:#2E7D32;--mal:#C62828}
*{box-sizing:border-box} html,body{margin:0;height:100%;overflow:hidden;background:#d5e6ee;font-family:Calibri,"Segoe UI",system-ui,sans-serif;color:var(--texto)}
canvas{display:block;touch-action:none}
#barra{position:fixed;top:0;left:0;right:0;display:flex;gap:8px;align-items:center;padding:9px 12px;background:rgba(14,58,107,.96);color:#fff;z-index:12;flex-wrap:wrap}
#barra .salir{background:#C62828;color:#fff}
#barra b{font-size:1.02rem} #barra .chip{background:var(--azul);border-radius:999px;padding:4px 11px;font-weight:700;font-size:.92rem}
#barra .der{margin-left:auto;display:flex;gap:6px}
#panel{position:fixed;left:12px;bottom:12px;width:min(470px,calc(100vw - 24px));background:rgba(255,255,255,.97);border-radius:16px;padding:13px 15px;z-index:3;box-shadow:0 6px 24px rgba(14,58,107,.25);max-height:44vh;overflow:auto}
#panel .paso{color:var(--cian);font-weight:800;font-size:.85rem;letter-spacing:.04em}
#panel h2{margin:.15rem 0 .35rem;color:var(--navy);font-size:1.2rem}
#panel p{margin:.2rem 0 .45rem;font-size:1.02rem}
#panel small{display:block;color:var(--tenue);font-style:italic}
#acciones{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
button{font-family:inherit} .prim{background:var(--azul);color:#fff;border:0;border-radius:12px;padding:11px 18px;font-size:1.02rem;font-weight:700;cursor:pointer}
.sec{background:var(--hielo);color:var(--navy);border:0;border-radius:12px;padding:11px 16px;font-size:1rem;cursor:pointer}
.peq{padding:6px 11px;font-size:.9rem}
#toast{position:fixed;top:62px;left:50%;transform:translateX(-50%);max-width:min(640px,92vw);padding:12px 16px;border-radius:14px;color:#fff;z-index:10;display:none;box-shadow:0 6px 20px rgba(0,0,0,.25);font-size:1.02rem}
#toast.ok{background:var(--bien)} #toast.no{background:var(--mal)} #toast.info{background:var(--azul)} #toast small{display:block;opacity:.92;font-style:italic;margin-top:3px}
.modal{position:fixed;inset:0;background:rgba(14,58,107,.7);display:none;align-items:center;justify-content:center;padding:70px 14px 14px;z-index:8}
.tarjeta{background:#fff;border-radius:18px;max-width:660px;width:100%;padding:20px;max-height:92vh;overflow:auto}
.tarjeta h2{color:var(--navy);margin-top:0}
.op{display:flex;gap:10px;align-items:center;width:100%;text-align:left;background:var(--hielo);border:2px solid transparent;border-radius:12px;padding:12px;margin:7px 0;font-size:1.02rem;cursor:pointer;color:var(--texto)}
.op.marcada{border-color:var(--azul);background:#D7ECF4}
input[type=text]{font-size:1.05rem;padding:10px;border-radius:10px;border:1px solid var(--cielo);width:100%;margin:6px 0 12px}
table{width:100%;border-collapse:collapse;font-size:.93rem} td,th{padding:6px;border-bottom:1px solid var(--hielo);text-align:left;vertical-align:top}
.ficticio{font-size:.8rem;color:var(--tenue)}
.cron{font-size:2.2rem;font-weight:800;color:var(--navy);text-align:center}
@media print{#barra,#panel,canvas,#toast{display:none!important}.modal{position:static;background:none}.tarjeta{max-height:none}}`;

function crearMundo(THREE, OrbitControls, cfg) {
  // cfg: {titulo, icono, clave, criterio:{pct, sinCriticos}, fuentesInicio, vistas:[[pos,target],...], fondo}
  document.head.insertAdjacentHTML('beforeend', `<style>${CSS}</style>`);
  document.body.insertAdjacentHTML('afterbegin', `
<div id="barra"><img src="${new URL('../recursos/logo_CERS.jpeg', BASE_MOTOR).href}" alt="CERS" style="height:34px;border-radius:7px;background:#fff;padding:2px"><b>${cfg.icono} ${cfg.titulo}</b><span class="chip" id="cPaso">Paso 0/0</span><span class="chip" id="cPts">0 pts</span><span class="chip" id="cTiempo">0:00</span>
<div class="der"><button class="sec peq" id="bVista">🎥 Vista</button><button class="sec peq" id="bReini">↺ Reiniciar</button><button class="sec peq salir" id="bCampus">✖ Salir</button></div></div>
<div id="panel"><div class="paso" id="pNum"></div><h2 id="pTit">Cargando…</h2><p id="pTxt"></p><small id="pFuente"></small><div id="acciones"></div></div>
<div id="toast"></div><div class="modal" id="modal"><div class="tarjeta" id="mCont"></div></div>`);
  const $ = s => document.getElementById(s);
  // Regresa al mundo principal, frente al edificio del área (…/mundos/<area>/<modulo>/index.html)
  const area = (location.pathname.match(/mundos\/([^/]+)\//) || [])[1];
  const alCampus = () => { location.href = cfg.campus || ('../../../index.html' + (area ? '?mundo=' + area : '')); };
  const enPartida = () => S.t0 && nPaso < pasos.length;
  $('bCampus').onclick = () => { if (!enPartida() || confirm('¿Salir del simulador? La partida en curso se cancelará y no se registrará.')) alCampus(); };
  $('bReini').onclick = () => { if (!enPartida() || confirm('¿Reiniciar? La partida en curso se cancelará.')) location.reload(); };

  // ---------------------------------------------------------------- escena
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  document.body.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(cfg.fondo || 0xDDEBF2);
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.05, 60);
  const VISTAS = cfg.vistas;
  let vista = 0;
  camera.position.set(...VISTAS[0][0]);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...VISTAS[0][1]); controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.49;
  controls.minDistance = 0.6; controls.maxDistance = 10; controls.update();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.15));
  const sol = new THREE.DirectionalLight(0xffffff, 1.35); sol.position.set(3, 6, 4); scene.add(sol);

  const M = (c, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .6, metalness: .05, ...extra });
  const caja = (w, h, d, c, x, y, z, padre = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c)); m.position.set(x, y, z); padre.add(m); return m; };
  const cil = (r, h, c, x, y, z, padre = scene, rt) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt ?? r, r, h, 24), M(c)); m.position.set(x, y, z); padre.add(m); return m; };
  const esfera = (r, c, x, y, z, padre = scene) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 16), M(c)); m.position.set(x, y, z); padre.add(m); return m; };
  const capsula = (r, l, c) => new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 6, 14), M(c));
  // Objeto tocable: zona invisible amplia para dedos en tablet/celular.
  function tocable(obj, tipo, t = 0.4) {
    obj.userData.tipo = tipo;
    const z = new THREE.Mesh(new THREE.BoxGeometry(t, t, t), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    z.userData = { tipo, ref: obj }; obj.add(z); return obj;
  }
  function letrero(texto, w = 1.6, h = 0.4, fondo = '#154F90', color = '#fff') {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = Math.round(512 * h / w); const g = cv.getContext('2d');
    g.fillStyle = fondo; g.fillRect(0, 0, cv.width, cv.height); g.fillStyle = color; g.font = `bold ${Math.round(cv.height * 0.46)}px Calibri, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(texto, cv.width / 2, cv.height / 2);
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tx, side: THREE.DoubleSide }));
  }

  // ---------------------------------------------------------------- animación, resaltado y toques
  const tweens = [];
  const mover = (v, destino, ms) => new Promise(res => tweens.push({ v, de: v.clone(), a: destino.clone ? destino.clone() : destino, t0: performance.now(), ms, res }));
  const reloj = new THREE.Clock(); let objetivos = []; const cuadro = [];
  renderer.setAnimationLoop(() => {
    const ahora = performance.now();
    for (let i = tweens.length - 1; i >= 0; i--) { const tw = tweens[i]; const k = Math.min(1, (ahora - tw.t0) / tw.ms); const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      tw.v.lerpVectors(tw.de, tw.a, e); if (k >= 1) { tweens.splice(i, 1); tw.res(); } }
    const pulso = (Math.sin(reloj.getElapsedTime() * 5) + 1) / 2;
    objetivos.forEach(o => { o.material.emissive && o.material.emissive.setRGB(0, 0.22 * pulso, 0.32 * pulso); o.scale.setScalar(1 + 0.12 * pulso); });
    cuadro.forEach(f => f(reloj.getElapsedTime()));
    controls.update(); renderer.render(scene, camera);
  });
  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
  function resaltar(lista) { objetivos.forEach(o => { o.material.emissive && o.material.emissive.setRGB(0, 0, 0); o.scale.setScalar(1); }); objetivos = lista.filter(Boolean); }
  function irVista(i) { vista = i % VISTAS.length; mover(camera.position, new THREE.Vector3(...VISTAS[vista][0]), 700); mover(controls.target, new THREE.Vector3(...VISTAS[vista][1]), 700); }
  $('bVista').onclick = () => irVista(vista + 1);
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let abajo = null;
  renderer.domElement.addEventListener('pointerdown', e => abajo = [e.clientX, e.clientY]);
  renderer.domElement.addEventListener('pointerup', e => {
    if (!abajo || Math.hypot(e.clientX - abajo[0], e.clientY - abajo[1]) > 10) return;
    ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(scene.children, true).find(h => h.object.userData.tipo && visible(h.object));
    if (hit) tocar(hit.object.userData.ref || hit.object);
  });
  const visible = o => { for (let p = o; p; p = p.parent) if (p.visible === false) return false; return true; };

  // ---------------------------------------------------------------- estado, pasos y puntaje
  let S = { nombre: '', caso: '', pts: 0, errores: [], criticos: 0, t0: 0 }, paso = null, nPaso = 0, pasos = [];
  function toast(tipo, txt, fuente = '', ms) { const t = $('toast'); t.className = tipo; t.innerHTML = txt + (fuente ? `<small>Fuente: ${fuente}</small>` : ''); t.style.display = 'block';
    clearTimeout(t._t); t._t = setTimeout(() => t.style.display = 'none', ms || (tipo === 'no' ? 5200 : 2600)); }
  function bien(txt, f) { S.pts += 10; toast('ok', '✅ ' + txt, f); marcador(); }
  function mal(txt, f, critico = false) { S.pts -= 5; if (critico) S.criticos++; S.errores.push({ paso: nPaso + 1, txt, f, critico }); toast('no', (critico ? '⛔ ERROR CRÍTICO: ' : '❌ ') + txt, f); marcador(); }
  function marcador() { $('cPts').textContent = Math.max(0, S.pts) + ' pts'; $('cPaso').textContent = `Paso ${Math.min(nPaso + 1, pasos.length)}/${pasos.length}`; }
  setInterval(() => { if (S.t0) { const s = Math.floor((Date.now() - S.t0) / 1000); $('cTiempo').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; } }, 1000);
  function botones(lista) { const a = $('acciones'); a.innerHTML = ''; lista.forEach(([txt, fn, cls]) => { const b = document.createElement('button'); b.className = cls || 'prim'; b.textContent = txt; b.onclick = fn; a.appendChild(b); }); }
  function mostrar() { paso = pasos[nPaso]; marcador(); $('pNum').textContent = `PASO ${nPaso + 1} DE ${pasos.length}`; $('pTit').textContent = paso.titulo; $('pTxt').innerHTML = paso.texto;
    $('pFuente').textContent = paso.fuente ? 'Fuente: ' + paso.fuente : ''; botones([]); resaltar([]); paso.iniciar && paso.iniciar(); }
  function siguiente() { nPaso++; if (nPaso >= pasos.length) return reporte(); setTimeout(mostrar, 450); }
  function tocar(o) { if (paso && paso.tocar) paso.tocar(o); }
  function pregunta(titulo, ops, correctas, fuente, alAcertar, multiple = false, retro = '') {
    const sel = new Set();
    $('mCont').innerHTML = `<h2>${titulo}</h2><div id="ops"></div><br><button class="prim" id="mOk">${multiple ? 'Confirmar' : 'Elegir'}</button>`;
    ops.forEach((o, k) => { const b = document.createElement('button'); b.className = 'op'; b.textContent = o; b.onclick = () => { if (!multiple) { sel.clear(); document.querySelectorAll('.op').forEach(x => x.classList.remove('marcada')); }
      sel.has(k) ? (sel.delete(k), b.classList.remove('marcada')) : (sel.add(k), b.classList.add('marcada')); }; $('ops').appendChild(b); });
    $('modal').style.display = 'flex';
    $('mOk').onclick = () => { if (!sel.size) return; const ok = [...sel].sort().join() === [...correctas].sort().join(); $('modal').style.display = 'none';
      if (ok) { bien(retro || 'Correcto.', fuente); alAcertar && alAcertar(); } else { mal('Respuesta incorrecta. ' + (retro || ''), fuente); setTimeout(() => pregunta(titulo, ops, correctas, fuente, alAcertar, multiple, retro), 700); } };
  }
  function aviso(html, alCerrar, txtBoton = 'Entendido') { $('mCont').innerHTML = html + `<br><button class="prim" id="mOk">${txtBoton}</button>`; $('modal').style.display = 'flex';
    $('mOk').onclick = () => { $('modal').style.display = 'none'; alCerrar && alCerrar(); }; }

  // ---------------------------------------------------------------- reporte, grupo, registro
  const K = 'sim_' + cfg.clave;
  const leer = () => { try { return JSON.parse(localStorage.getItem(K) || '[]'); } catch (e) { return []; } };
  async function registrar(fila) { if (!location.protocol.startsWith('http')) return false;
    try { const r = await fetch('/api/registro', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo: 'simulador', fila }) }); return r.ok; } catch (e) { return false; } }
  async function reporte() {
    resaltar([]); botones([]);
    S.pts = Math.max(0, S.pts); const s = Math.floor((Date.now() - S.t0) / 1000), max = pasos.reduce((s, p) => s + (p.sinPuntos ? 0 : (p.puntos ?? 10)), 0), pct = Math.min(100, Math.round(S.pts / max * 100));
    const crit = cfg.criterio || { pct: 80, sinCriticos: true };
    const aprobado = pct >= crit.pct && (!crit.sinCriticos || S.criticos === 0);
    const reg = { modulo: cfg.titulo, nombre: S.nombre, caso: S.caso, fecha: new Date().toLocaleString('es-MX'), puntos: S.pts, porcentaje: pct, criticos: S.criticos, errores: S.errores.length, segundos: s, resultado: aprobado ? 'Aprobado' : 'Repasar' };
    try { const a = leer(); a.push(reg); localStorage.setItem(K, JSON.stringify(a)); } catch (e) { }
    $('mCont').innerHTML = `<h2>${aprobado ? '🏆 ¡Lo lograste!' : '💪 Hay que repasar'}</h2>
     <p><b>${S.nombre}</b> · ${cfg.titulo}${S.caso ? ' · ' + S.caso : ''}<br>Puntaje: <b>${S.pts}/${max} (${pct}%)</b> · Errores críticos: <b>${S.criticos}</b> · Tiempo: ${Math.floor(s / 60)} min ${s % 60} s<br>
     Criterio: ${crit.pct}% o más${crit.sinCriticos ? ' y sin errores críticos' : ''}.</p><p class="ficticio" id="estReg">Enviando a la instructora…</p>
     ${S.errores.length ? '<table><tr><th>Paso</th><th>Qué pasó</th><th>Fuente</th></tr>' + S.errores.map(e => `<tr><td>${e.paso}</td><td>${e.critico ? '⛔ ' : ''}${e.txt}</td><td>${e.f || ''}</td></tr>`).join('') + '</table>' : '<p>Sin errores. 👏</p>'}
     <br><button class="prim" onclick="location.reload()">Siguiente participante</button> <button class="sec" onclick="print()">Imprimir / PDF</button> <button class="sec" id="bGrupo">Resultados del grupo</button> <button class="sec" id="bVolver2">⬅ Regresar al campus</button>`;
    $('bVolver2').onclick = alCampus;
    $('modal').style.display = 'flex'; $('bGrupo').onclick = grupo;
    const ok = await registrar(reg);
    $('estReg').textContent = ok ? '✅ Resultado registrado en la computadora de la instructora.' : 'Resultado guardado en este dispositivo (sin conexión al aula). Puedes imprimirlo o guardarlo como PDF.';
  }
  function grupo() {
    const a = leer();
    $('mCont').innerHTML = `<h2>Resultados en este dispositivo (${a.length})</h2><table><tr><th>Nombre</th><th>Caso</th><th>%</th><th>Críticos</th><th>Resultado</th></tr>
     ${a.map(r => `<tr><td>${r.nombre}</td><td>${r.caso || ''}</td><td>${r.porcentaje}%</td><td>${r.criticos}</td><td>${r.resultado}</td></tr>`).join('') || '<tr><td colspan=5>Sin registros</td></tr>'}</table><br>
     <button class="prim" id="bCsv">Descargar CSV</button> <button class="sec" onclick="location.reload()">Cerrar</button> <button class="sec" id="bBorrar">Borrar</button>`;
    $('modal').style.display = 'flex';
    $('bCsv').onclick = () => { const t = 'Modulo,Nombre,Caso,Fecha,Puntos,Porcentaje,Criticos,Errores,Segundos,Resultado\n' + a.map(r => [r.modulo, r.nombre, r.caso, r.fecha, r.puntos, r.porcentaje, r.criticos, r.errores, r.segundos, r.resultado].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const b = new Blob(['﻿' + t], { type: 'text/csv' }); const l = document.createElement('a'); l.href = URL.createObjectURL(b); l.download = `resultados_${cfg.clave}.csv`; l.click(); };
    $('bBorrar').onclick = () => { if (confirm('¿Borrar resultados de este dispositivo?')) { localStorage.removeItem(K); grupo(); } };
  }
  // Pantalla de inicio: nombre + casos
  function inicio(casos, alIniciar, notaFuentes) {
    let sel = casos[0].id;
    $('mCont').innerHTML = `<h2>${cfg.icono} ${cfg.titulo}</h2><p>Gira la vista arrastrando con un dedo y acerca con dos. Toca los objetos que brillan en azul y sigue el panel de instrucciones.</p>
      <input type="text" id="nom" placeholder="Nombre completo del participante" autocomplete="off">
      <div id="casos" style="display:grid;gap:8px;margin:8px 0">${casos.map((c, i) => `<button class="op ${i ? '' : 'marcada'}" data-c="${c.id}">${c.txt}</button>`).join('')}</div>
      <button class="prim" id="bIni">Comenzar</button> <button class="sec" id="bRes">Resultados del grupo</button> <button class="sec" id="bVolver">⬅ Regresar al campus</button><p class="ficticio">${notaFuentes}</p>`;
    $('bVolver').onclick = alCampus;
    $('modal').style.display = 'flex';
    document.querySelectorAll('#casos .op').forEach(b => b.onclick = () => { document.querySelectorAll('#casos .op').forEach(x => x.classList.remove('marcada')); b.classList.add('marcada'); sel = b.dataset.c; });
    $('bIni').onclick = () => { S.nombre = $('nom').value.trim() || 'Participante'; $('modal').style.display = 'none'; S.caso = casos.find(c => c.id === sel).txt.replace(/<[^>]+>/g, '');
      S.t0 = Date.now(); nPaso = 0; pasos = alIniciar(sel); mostrar(); };
    $('bRes').onclick = grupo;
  }
  const qa = () => ({ paso: nPaso, titulo: paso && paso.titulo, pts: S.pts, criticos: S.criticos, errores: S.errores.length });

  return { THREE, scene, camera, controls, renderer, M, caja, cil, esfera, capsula, tocable, letrero, mover, resaltar, irVista, cuadro,
    toast, bien, mal, botones, pregunta, aviso, siguiente, inicio, qa, tocar, $, estado: () => S };
}

window.MotorSim = { crearMundo };
})();
