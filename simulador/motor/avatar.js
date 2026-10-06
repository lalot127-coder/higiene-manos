// Avatar personalizable del campus (script clásico). Lo usan el campus, el multijugador y la vista previa del editor.
//   Avatar.cargar() / Avatar.guardar(p)  → perfil en localStorage ('campus_perfil')
//   Avatar.construir(THREE, perfil)      → { grupo, animar(fase, andando) }
//   Avatar.editor(contenedor, alCambiar) → controles HTML (sexo, piel, cabello, ropa, accesorios)
(function () {
const K = 'campus_perfil';
const OPC = {
  sexo: [['m', 'Masculino'], ['f', 'Femenino']],
  piel: ['#F6D7C3', '#E9BC9A', '#D39F77', '#B07B53', '#8A5A3B', '#5C3A24'],
  cabello: ['#1E1A17', '#4B2E1E', '#8A5A2B', '#D9B26A', '#A0442A', '#BDBDBD'],
  superior: [['playera', 'Playera'], ['camisa', 'Camisa'], ['chamarra', 'Chamarra'], ['saco', 'Saco'], ['overol', 'Overol']],
  colores: ['#154F90', '#0E3A6B', '#3FA7C6', '#2E7D32', '#C62828', '#E07A1F', '#F2C230', '#6A3FA0', '#FFFFFF', '#5B6B7C', '#1B2633', '#8B6B4A'],
  zapatos: ['#1B2633', '#5A3A22', '#FFFFFF', '#8B6B4A', '#C62828'],
};
const BASE = { nombre: '', sexo: 'm', piel: OPC.piel[1], cabello: OPC.cabello[1], superior: 'playera', colorSup: '#154F90',
  pantalon: '#0E3A6B', zapatos: '#1B2633', lentes: false, gorra: false, colorGorra: '#C62828', casco: false };
function cargar() { try { return { ...BASE, ...JSON.parse(localStorage.getItem(K) || '{}') }; } catch (e) { return { ...BASE }; } }
function guardar(p) { try { localStorage.setItem(K, JSON.stringify(p)); } catch (e) { } }
function limpiar(p) {   // solo campos conocidos (para multijugador)
  const q = { ...BASE }; Object.keys(BASE).forEach(k => { if (p && typeof p[k] === typeof BASE[k]) q[k] = p[k]; });
  q.nombre = String(q.nombre).slice(0, 30); return q;
}

function construir(THREE, perfil) {
  const p = limpiar(perfil); const g = new THREE.Group();
  const mats = {}; const M = c => mats[c] || (mats[c] = new THREE.MeshStandardMaterial({ color: c, roughness: .75, metalness: .02 }));
  const mk = (geo, c, x, y, z, padre = g) => { const m = new THREE.Mesh(geo, M(c)); m.position.set(x, y, z); padre.add(m); return m; };
  const f = p.sexo === 'f', hombro = f ? 0.31 : 0.36, sup = p.superior, overol = sup === 'overol';
  const cSup = p.colorSup, cPant = overol ? p.colorSup : p.pantalon;
  // torso (en overol: camisa/playera debajo en color claro)
  const torso = mk(new THREE.CapsuleGeometry(f ? 0.25 : 0.28, 0.48, 6, 14), overol ? '#E8F0F5' : cSup, 0, 1.05, 0);
  if (f) torso.scale.set(1, 1, 0.92);
  if (overol) { mk(new THREE.BoxGeometry(0.5, 0.36, 0.5), cSup, 0, 0.98, 0);   // peto del overol
    [-0.13, 0.13].forEach(x => mk(new THREE.BoxGeometry(0.06, 0.4, 0.04), cSup, x, 1.3, 0.255)); }
  if (sup === 'camisa') { mk(new THREE.BoxGeometry(0.02, 0.5, 0.02), '#ffffff', 0, 1.1, 0.29); mk(new THREE.TorusGeometry(0.14, 0.035, 6, 16, Math.PI), '#ffffff', 0, 1.36, 0.06).rotation.x = Math.PI / 2; }
  if (sup === 'chamarra') { mk(new THREE.BoxGeometry(0.025, 0.62, 0.02), '#D0D7DE', 0, 1.06, 0.3); mk(new THREE.CylinderGeometry(0.2, 0.24, 0.1, 16), cSup, 0, 1.38, 0); }
  if (sup === 'saco') { // camisa blanca en V y corbata
    const v = mk(new THREE.ConeGeometry(0.12, 0.3, 3), '#ffffff', 0, 1.22, 0.24); v.rotation.x = Math.PI; v.scale.z = 0.25;
    mk(new THREE.BoxGeometry(0.05, 0.26, 0.02), '#7A1E1E', 0, 1.16, 0.29); }
  // cabeza, cara y cabello
  mk(new THREE.CylinderGeometry(0.08, 0.09, 0.12, 12), p.piel, 0, 1.47, 0);
  const cab = mk(new THREE.SphereGeometry(0.24, 22, 18), p.piel, 0, 1.7, 0);
  [-0.08, 0.08].forEach(x => mk(new THREE.SphereGeometry(0.028, 10, 8), '#1B2633', x, 1.72, 0.215));
  mk(new THREE.BoxGeometry(0.09, 0.018, 0.02), '#9A4B3C', 0, 1.62, 0.225);
  if (!p.casco && !p.gorra) mk(new THREE.SphereGeometry(0.255, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2), p.cabello, 0, 1.73, -0.02);
  else mk(new THREE.SphereGeometry(0.25, 22, 12, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.3), p.cabello, 0, 1.7, -0.03);   // patillas/nuca
  if (f) { mk(new THREE.CapsuleGeometry(0.17, 0.3, 6, 12), p.cabello, 0, 1.53, -0.13);   // cabello largo
    if (!p.casco && !p.gorra) mk(new THREE.SphereGeometry(0.1, 12, 10), p.cabello, 0, 1.82, -0.2); }
  if (p.lentes) { [-0.085, 0.085].forEach(x => mk(new THREE.TorusGeometry(0.055, 0.012, 6, 18), '#111111', x, 1.72, 0.235));
    mk(new THREE.BoxGeometry(0.06, 0.012, 0.012), '#111111', 0, 1.72, 0.24); }
  if (p.gorra && !p.casco) { mk(new THREE.SphereGeometry(0.26, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2), p.colorGorra, 0, 1.76, 0);
    mk(new THREE.BoxGeometry(0.3, 0.025, 0.2), p.colorGorra, 0, 1.77, 0.26); }
  if (p.casco) { mk(new THREE.SphereGeometry(0.28, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2), '#F2C230', 0, 1.76, 0);
    mk(new THREE.CylinderGeometry(0.33, 0.33, 0.025, 24), '#F2C230', 0, 1.77, 0.02); }
  // pecho: logo (lo pone el campus si quiere) → punto de anclaje
  g.userData.pecho = new THREE.Vector3(0, 1.12, 0.29);
  // extremidades con pivote (brazo = manga + antebrazo)
  function brazo(x) { const piv = new THREE.Group(); piv.position.set(x, 1.35, 0); g.add(piv);
    const corta = sup === 'playera' || overol;
    mk(new THREE.CapsuleGeometry(0.085, 0.18, 4, 10), overol ? '#E8F0F5' : cSup, 0, -0.16, 0, piv);
    mk(new THREE.CapsuleGeometry(0.075, 0.2, 4, 10), corta ? p.piel : cSup, 0, -0.42, 0, piv);
    mk(new THREE.SphereGeometry(0.07, 10, 8), p.piel, 0, -0.6, 0, piv); return piv; }
  function pierna(x) { const piv = new THREE.Group(); piv.position.set(x, 0.66, 0); g.add(piv);
    mk(new THREE.CapsuleGeometry(0.1, 0.42, 4, 10), cPant, 0, -0.31, 0, piv);
    mk(new THREE.BoxGeometry(0.17, 0.1, 0.28), p.zapatos, 0, -0.62, 0.05, piv); return piv; }
  const bI = brazo(-hombro), bD = brazo(hombro), pI = pierna(-0.13), pD = pierna(0.13);
  mk(new THREE.BoxGeometry(0.46, 0.16, 0.34), cPant, 0, 0.7, 0);   // cadera
  // pose: undefined (de pie/caminando) · 'sentado' (piernas al frente; quien llama baja el grupo con ALTO_SENTADO) · 'mirando' (brazos atrás)
  function animar(fase, andando, pose) { const s = andando ? Math.sin(fase) * 0.6 : 0;
    if (pose === 'sentado') { pI.rotation.x = pD.rotation.x = -Math.PI / 2; bI.rotation.x = bD.rotation.x = -0.35; torso.position.y = 1.05; return; }
    if (pose === 'mirando') { pI.rotation.x = pD.rotation.x = 0; bI.rotation.x = bD.rotation.x = 0.25; torso.position.y = 1.05; return; }
    bI.rotation.x = s; bD.rotation.x = -s; pI.rotation.x = -s; pD.rotation.x = s; torso.position.y = 1.05 + (andando ? Math.abs(Math.sin(fase)) * 0.04 : 0); }
  return { grupo: g, animar };
}

// Editor HTML. alCambiar(perfil) se llama en cada cambio.
function editor(cont, alCambiar) {
  let p = cargar();
  const sw = (lista, campo) => `<div class="sw">${lista.map(c => `<button type="button" data-c="${campo}" data-v="${c}" style="background:${c}" title="${c}"></button>`).join('')}</div>`;
  const op = (lista, campo) => `<div class="ops">${lista.map(([v, t]) => `<button type="button" data-c="${campo}" data-v="${v}">${t}</button>`).join('')}</div>`;
  const chk = (campo, t) => `<label class="chk"><input type="checkbox" data-c="${campo}"> ${t}</label>`;
  cont.innerHTML = `<label class="lbl">Tu nombre (así te verán los demás)</label><input type="text" id="avNombre" maxlength="30" placeholder="Escribe tu nombre" autocomplete="off">
   <label class="lbl">Avatar</label>${op(OPC.sexo, 'sexo')}
   <label class="lbl">Tono de piel</label>${sw(OPC.piel, 'piel')}
   <label class="lbl">Cabello</label>${sw(OPC.cabello, 'cabello')}
   <label class="lbl">Prenda superior</label>${op(OPC.superior, 'superior')}${sw(OPC.colores, 'colorSup')}
   <label class="lbl">Pantalón</label>${sw(OPC.colores, 'pantalon')}
   <label class="lbl">Zapatos</label>${sw(OPC.zapatos, 'zapatos')}
   <label class="lbl">Accesorios</label><div class="ops">${chk('lentes', '👓 Lentes')}${chk('gorra', '🧢 Gorra')}${chk('casco', '⛑️ Casco')}</div>${sw(OPC.colores, 'colorGorra')}`;
  const pintar = () => { cont.querySelectorAll('button[data-c]').forEach(b => b.classList.toggle('sel', String(p[b.dataset.c]) === b.dataset.v));
    cont.querySelectorAll('input[type=checkbox]').forEach(i => i.checked = !!p[i.dataset.c]); cont.querySelector('#avNombre').value = p.nombre; };
  cont.querySelectorAll('button[data-c]').forEach(b => b.onclick = () => { p[b.dataset.c] = b.dataset.v; if (b.dataset.c === 'colorGorra') p.gorra = true; pintar(); guardar(p); alCambiar && alCambiar(p); });
  cont.querySelectorAll('input[type=checkbox]').forEach(i => i.onchange = () => { p[i.dataset.c] = i.checked; if (i.dataset.c === 'casco' && i.checked) p.gorra = false; if (i.dataset.c === 'gorra' && i.checked) p.casco = false; pintar(); guardar(p); alCambiar && alCambiar(p); });
  cont.querySelector('#avNombre').oninput = e => { p.nombre = e.target.value.slice(0, 30); guardar(p); alCambiar && alCambiar(p, true); };
  pintar(); return { perfil: () => p };
}
const CSS = `.lbl{display:block;font-weight:800;color:#0E3A6B;margin:10px 0 4px;font-size:.92rem}
.sw{display:flex;flex-wrap:wrap;gap:6px}.sw button{width:30px;height:30px;border-radius:50%;border:2px solid #cfd8e0;cursor:pointer;padding:0}
.sw button.sel{outline:3px solid #154F90;outline-offset:2px}
.ops{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px}.ops button,.chk{background:#E8F5F9;color:#0E3A6B;border:2px solid transparent;border-radius:10px;padding:7px 11px;font-weight:700;cursor:pointer;font-size:.92rem}
.ops button.sel{border-color:#154F90;background:#D7ECF4}.chk input{transform:scale(1.2);margin-right:4px}`;
// Sentado: la cadera (pivote de piernas a 0.66 m) debe quedar a la altura del asiento → grupo.y = asiento - 0.66 + 0.1
const ALTO_SENTADO = asiento => asiento - 0.56;
window.Avatar = { OPC, BASE, cargar, guardar, limpiar, construir, editor, CSS, ALTO_SENTADO };
})();
