// Interiores caminables de los edificios del campus y de las casetas de las zonas (módulo ES).
// Al entrar a un edificio el avatar entra FÍSICAMENTE: vestíbulo (recepción + sala de espera con sillas para sentarse),
// pasillo con ruta de circulación y flechas de evacuación, puertas a los lados (una por módulo, con letrero NOM-026),
// señales tocables (el avatar se para frente a ellas) y paredes que se vuelven transparentes si tapan la vista.
//   const I = construirInterior(area, ctx)
//   ctx = { THREE, kit: Kit3D, props: Props(THREE), logo: Texture, piso: 'concreto'|'tablones'|..., base: '' }
//   I = { escena, nav, tocables, pisos, puertas, sillas, letreros, entrada, salida, actualizar(dt, camara, yo), dims }
import { Navegacion } from './navegacion.js';
import { letreroTextura } from './letreros.js';

export const PASO = 3.6;   // separación entre puertas (m)
export function construirInterior(area, ctx) {
  const { THREE } = ctx; const n = area.modulos.length;
  const porLado = Math.max(2, Math.ceil(n / 2)), W = 13, L = Math.max(18, porLado * PASO + 10), H = 3.6;
  const escena = new THREE.Scene(); escena.background = new THREE.Color(0xDCE9F0);
  escena.add(new THREE.HemisphereLight(0xffffff, 0x9AAAB5, 1.25)); const sol = new THREE.DirectionalLight(0xffffff, 1.0); sol.position.set(4, 12, 6); escena.add(sol);
  const tocables = [], pisos = [], paredes = [], puertas = [], sillas = [], letreros = [], animados = [];
  const nav = new Navegacion({ x0: -W / 2 - 1, z0: -L / 2 - 1, x1: W / 2 + 1, z1: L / 2 + 3, celda: 0.25, costoBase: 1.6 });
  const mats = {}; const M = (c, x) => x ? new THREE.MeshStandardMaterial({ color: c, roughness: .8, ...x }) : (mats[c] || (mats[c] = new THREE.MeshStandardMaterial({ color: c, roughness: .8 })));
  const caja = (w, h, d, c, x, y, z, p = escena, mx) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c, mx)); m.position.set(x, y, z); p.add(m); return m; };
  const tex = (nombre, rep) => { const t = new THREE.TextureLoader().load(`${ctx.base || ''}assets/texturas/${nombre}.webp`); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 4; return t; };
  const colorArea = '#' + area.color.toString(16).padStart(6, '0');

  // ---------------- piso, zócalo y muros (cada muro es una pieza para poder transparentarla)
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(W, L + 2), new THREE.MeshStandardMaterial({ map: tex(ctx.piso || 'concreto', [W / 3, (L + 2) / 3]), color: 0xEDEFF1, roughness: .9 }));
  piso.rotation.x = -Math.PI / 2; piso.position.z = 1; piso.userData.piso = true; escena.add(piso); pisos.push(piso);
  const exterior = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), M(0x9CC48E)); exterior.rotation.x = -Math.PI / 2; exterior.position.y = -0.02; escena.add(exterior);
  function muro(w, x, z, ry, color = 0xF4F7FA) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; escena.add(g);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, H, 0.2), new THREE.MeshStandardMaterial({ color, roughness: .9, transparent: true, opacity: 1 })); m.position.y = H / 2; g.add(m);
    const z0 = new THREE.Mesh(new THREE.BoxGeometry(w, 0.25, 0.24), new THREE.MeshStandardMaterial({ color: area.color, roughness: .7, transparent: true, opacity: 1 })); z0.position.y = 0.125; g.add(z0);
    const banda = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, 0.22), new THREE.MeshStandardMaterial({ color: area.color, transparent: true, opacity: 1 })); banda.position.y = H - 0.3; g.add(banda);
    paredes.push({ g, mats: [m.material, z0.material, banda.material], op: 1 });
    nav.bloquearRect(x, z, ry ? 0.6 : w, ry ? w : 0.6, 0); return g;
  }
  const zE = L / 2 + 1;   // muro de la entrada
  muro(W, 0, -L / 2, 0); muro(L + 2, -W / 2, 1, Math.PI / 2); muro(L + 2, W / 2, 1, Math.PI / 2);
  muro((W - 3) / 2, -(W + 3) / 4, zE, 0); muro((W - 3) / 2, (W + 3) / 4, zE, 0);
  nav.liberarRect(0, zE, 2.6, 1);

  // ---------------- ruta de circulación (franjas amarillas) y flechas verdes de evacuación hacia la salida
  const franja = (x, z, w, l) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), new THREE.MeshBasicMaterial({ color: 0xFFD100 })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.011, z); escena.add(m); };
  [-1.6, 1.6].forEach(x => franja(x, 0, 0.1, L - 1)); nav.camino(0, 0, 3.0, L, 0, .5);   // pasillo central preferido
  const flecha = (() => { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const g = cv.getContext('2d'); g.fillStyle = '#00995C'; g.fillRect(0, 0, 256, 128);
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(40, 50); g.lineTo(150, 50); g.lineTo(150, 22); g.lineTo(220, 64); g.lineTo(150, 106); g.lineTo(150, 78); g.lineTo(40, 78); g.closePath(); g.fill();
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  for (let z = -L / 2 + 2; z < L / 2 - 1; z += 3) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), new THREE.MeshBasicMaterial({ map: flecha })); m.rotation.set(-Math.PI / 2, 0, -Math.PI / 2); m.position.set(0, 0.012, z); escena.add(m); }

  // ---------------- señales NOM-026 / NOM-003 en muros (tocables: el avatar camina y se para frente a ellas)
  function senal(id, w, x, y, z, ry) {
    const cv = Senales.canvas(id, 256), t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const h = w * cv.height / cv.width, m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
    m.position.set(x, y, z); m.rotation.y = ry; escena.add(m);
    const frente = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry);
    const L0 = { mesh: m, id, pos: new THREE.Vector3(x, 0, z).addScaledVector(frente, 1.6), mira: new THREE.Vector3(x, y, z) };
    m.userData = { tipo: 'senal', id, letrero: letreros.length }; letreros.push(L0); tocables.push(m); return m;
  }
  senal('salida', 1.0, -4.2, 2.9, zE - 0.12, Math.PI);
  senal('extintor', 0.5, -2.2, 1.9, zE - 0.12, Math.PI); senal('primeros', 0.55, 2.2, 1.9, zE - 0.12, Math.PI);
  (area.senales || []).filter(s => s !== 'salida').slice(0, 3).forEach((id, k) => senal(id, 0.6, -2 + k * 2, 2.4, -L / 2 + 0.12, 0));
  senal('ruta', 0.9, -W / 2 + 0.12, 2.9, L / 2 - 4, Math.PI / 2); senal('ruta', 0.9, W / 2 - 0.12, 2.9, L / 2 - 4, -Math.PI / 2);
  // extintor real junto a la salida (objeto propio)
  const ext = ctx.props.extintor('pqs'); ext.position.set(-2.2, 1.0, zE - 0.25); ext.rotation.y = Math.PI; escena.add(ext);
  caja(0.32, 0.04, 0.2, 0x5B6B7C, -2.2, 1.0, zE - 0.2); nav.bloquearCirculo(-2.2, zE - 0.4, 0.3);

  // ---------------- logotipo CERS y directorio en el muro del fondo
  if (ctx.logo) { const lg = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: ctx.logo })); lg.position.set(-W / 2 + 2.2, 2.2, -L / 2 + 0.12); escena.add(lg); }
  const dir = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.9), new THREE.MeshBasicMaterial({ map: letreroTextura(THREE, { titulo: `${area.nombre}`, sub: area.desc ? area.desc.slice(0, 46) : '', estado: 'info', color: 'marino', W: 760, H: 340 }) }));
  dir.position.set(2.2, 2.2, -L / 2 + 0.12); escena.add(dir);

  // ---------------- puertas: lados izquierdo y derecho del pasillo
  const ladoDe = i => (i % 2 === 0 ? -1 : 1), zDe = i => L / 2 - 6.2 - Math.floor(i / 2) * PASO;
  const ESTILO = { industria: 'puerta_metal', proteccion: 'puerta_metal', hospital: 'puerta_vidrio', empresa: 'puerta_vidrio', laboral: 'puerta_madera', biblioteca: 'puerta_madera', cafeteria: 'puerta_vidrio' };
  area.modulos.forEach((m, i) => {
    const lado = ladoDe(i), x = lado * (W / 2 - 0.12), z = zDe(i), ry = lado < 0 ? Math.PI / 2 : -Math.PI / 2;
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; escena.add(g);
    const inactiva = m.estado === 'pronto' || m.estado === 'pendiente';
    caja(1.5, 2.35, 0.12, 0x37474F, 0, 1.175, 0.0, g);   // marco
    const piv = new THREE.Group(); piv.position.set(-0.6, 0, 0.08); g.add(piv);   // bisagra
    const hoja = caja(1.2, 2.2, 0.06, inactiva ? 0x9AA9B8 : m.tipo === 'juego' ? 0x3FA7C6 : 0xF4F7FA, 0.6, 1.1, 0, piv);
    hoja.userData = { tipo: 'puerta', i }; tocables.push(hoja);
    const estilo = ESTILO[area.id] || 'puerta';
    if (ctx.kit && !inactiva) ctx.kit.pieza('puertas', estilo).then(o => { const b = new THREE.Box3().setFromObject(o), s = b.getSize(new THREE.Vector3());
      o.scale.multiply(new THREE.Vector3(1.2 / Math.max(s.x, .01), 2.2 / Math.max(s.y, .01), 1)); o.position.set(0.6, 0, 0.0); piv.add(o); hoja.visible = false;
      o.traverse(q => { if (q.isMesh) { q.userData = { tipo: 'puerta', i }; tocables.push(q); } }); }).catch(() => { });
    // franja de color NOM-026 en el marco y letrero SVG encima
    const col = { rojo: 0xD3122A, amarillo: 0xFFD100, verde: 0x00995C, azul: 0x0D6EB8 }[m.color] ?? area.color;
    caja(1.5, 0.12, 0.14, inactiva ? 0x8A99A8 : col, 0, 2.41, 0.02, g);
    const est = inactiva ? m.estado : (m.tipo === 'juego' ? 'juego' : m.tipo === 'sala' ? 'sala' : '3d');
    const L1 = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.9), new THREE.MeshBasicMaterial({ map: letreroTextura(THREE, { titulo: m.titulo, sub: m.nom || '', estado: est, color: inactiva ? 'gris' : (m.color || 'marino'), senal: m.senal }) }));
    L1.position.set(0, 2.98, 0.08); g.add(L1); L1.userData = { tipo: 'puerta', i }; tocables.push(L1);
    const frente = new THREE.Vector3(0, 0, 1.3).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry).add(g.position);
    puertas.push({ m, i, g, piv, frente, ancla: new THREE.Vector3(x, 3.5, z).add(new THREE.Vector3(0, 0, .3).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry)), abierta: 0,
      abrir() { this.abierta = 1; }, cerrar() { this.abierta = 0; } });
  });

  // ---------------- vestíbulo: recepción (izquierda) y sala de espera (derecha) con sillas para sentarse
  const zv = L / 2 - 2.6;
  caja(2.4, 1.05, 0.7, area.color, -W / 2 + 2.2, 0.525, zv - 0.3); caja(2.5, 0.06, 0.8, 0xFFFFFF, -W / 2 + 2.2, 1.08, zv - 0.3);
  nav.bloquearRect(-W / 2 + 2.2, zv - 0.3, 2.8, 1.1);
  const recep = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.4), new THREE.MeshBasicMaterial({ map: letreroTextura(THREE, { titulo: 'RECEPCIÓN', estado: 'vacio', color: 'marino', W: 600, H: 200 }) })); recep.position.set(-W / 2 + 2.2, 0.6, zv + 0.06); escena.add(recep);
  function silla(x, z, ry) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; escena.add(g);
    const asiento = caja(0.48, 0.06, 0.46, 0x3FA7C6, 0, 0.46, 0, g), resp = caja(0.48, 0.5, 0.06, 0x3FA7C6, 0, 0.72, -0.21, g);
    [[-.2, -.18], [.2, -.18], [-.2, .18], [.2, .18]].forEach(([a, b]) => caja(0.04, 0.46, 0.04, 0x37474F, a, 0.23, b, g));
    const idx = sillas.length; [asiento, resp].forEach(q => { q.userData = { tipo: 'silla', i: idx }; tocables.push(q); });
    if (ctx.kit) ctx.kit.pieza('campus', 'silla_plastico').then(o => { asiento.visible = resp.visible = false; g.children.filter(c => c.geometry && c.geometry.type === 'BoxGeometry').forEach(c => c.visible = false); g.add(o);
      o.traverse(q => { if (q.isMesh) { q.userData = { tipo: 'silla', i: idx }; tocables.push(q); } }); }).catch(() => { });
    const frente = new THREE.Vector3(0, 0, 0.75).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry).add(g.position);
    sillas.push({ g, pos: new THREE.Vector3(x, 0, z), ry, asiento: 0.46, frente, ocupada: false }); nav.bloquearCirculo(x, z, 0.32);
  }
  for (let k = 0; k < 3; k++) silla(W / 2 - 1.0, zv - 0.6 - k * 0.7, -Math.PI / 2);
  for (let k = 0; k < 2; k++) silla(W / 2 - 3.1, zv - 0.95 - k * 0.7, Math.PI / 2);
  const mesita = caja(0.6, 0.45, 0.9, 0xA0703A, W / 2 - 2.05, 0.225, zv - 1.3); nav.bloquearRect(W / 2 - 2.05, zv - 1.3, 0.7, 1.0);
  if (ctx.kit) { ctx.kit.pieza('campus', 'planta').then(o => { o.position.set(W / 2 - 0.7, 0, L / 2 + 0.3); escena.add(o); }).catch(() => { });
    ctx.kit.pieza('campus', 'planta').then(o => { o.position.set(-W / 2 + 0.7, 0, -L / 2 + 0.7); escena.add(o); }).catch(() => { });
    ctx.kit.pieza('campus', 'bote').then(o => { o.position.set(-W / 2 + 0.5, 0, L / 2 - 0.2); escena.add(o); }).catch(() => { });
    for (let z = -L / 2 + 3; z < L / 2; z += 6) ctx.kit.pieza('campus', 'lampara').then(o => { o.position.set(0, H - 0.9, z); escena.add(o); }).catch(() => { }); }
  nav.bloquearCirculo(W / 2 - 0.7, L / 2 + 0.3, 0.4); nav.bloquearCirculo(-W / 2 + 0.7, -L / 2 + 0.7, 0.4);

  // salida (puerta de la entrada, del lado interior)
  const salidaMesh = caja(2.4, 2.5, 0.05, 0x2E7D32, 0, 1.25, zE + 0.02, escena, { transparent: true, opacity: .12, depthWrite: false }); salidaMesh.userData = { tipo: 'salir' }; tocables.push(salidaMesh);
  const entrada = new THREE.Vector3(0, 0, L / 2 - 0.4);

  // ---------------- cada cuadro: puertas que se abren y muros que no tapan la vista
  const ray = new THREE.Raycaster(), cabeza = new THREE.Vector3();
  const mallasMuro = paredes.map(p => p.g.children[0]);
  function actualizar(dt, camara, yo) {
    puertas.forEach(p => { const meta = p.abierta ? -1.35 : 0; p.piv.rotation.y += (meta - p.piv.rotation.y) * Math.min(1, dt * 5); });
    if (!camara || !yo) return;
    cabeza.copy(yo.position).setY(1.2); const d = cabeza.clone().sub(camara.position), Ld = d.length(); ray.set(camara.position, d.normalize()); ray.far = Ld;
    const tapan = new Set(ray.intersectObjects(mallasMuro, false).map(h => h.object));
    paredes.forEach(p => { const meta = tapan.has(p.g.children[0]) || (camara.position.z > p.g.position.z + .5 && Math.abs(p.g.rotation.y) < .1 && p.g.position.z > L / 2) ? 0.18 : 1;
      p.op += (meta - p.op) * Math.min(1, dt * 8); p.mats.forEach(mt => { mt.opacity = p.op; mt.depthWrite = p.op > .9; }); });
  }
  return { escena, nav, tocables, pisos, paredes, puertas, sillas, letreros, entrada, salida: { mesh: salidaMesh, frente: new THREE.Vector3(0, 0, L / 2 - 0.8) }, actualizar, dims: { W, L, H } };
}
