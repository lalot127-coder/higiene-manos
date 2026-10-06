// Objetos 3D de creación propia (CERS), hechos con geometría de Three.js: no dependen de licencias de terceros.
// Representaciones genéricas y didácticas (sin marcas). Cada función recibe THREE y devuelve un THREE.Group apoyado en y=0.
//   import { Props } from './props.js';  const p = Props(THREE);  scene.add(p.extintor('pqs'));
//   p.LISTA → [{clave, nombre, modulo}] (para el inventario y la galería)
export function Props(THREE) {
  const cache = {};
  const M = (c, x = {}) => { const k = c + JSON.stringify(x); return cache[k] || (cache[k] = new THREE.MeshStandardMaterial({ color: c, roughness: .6, metalness: .1, ...x })); };
  const mesh = (geo, c, x, y, z, p, mx) => { const m = new THREE.Mesh(geo, M(c, mx)); m.position.set(x, y, z); p.add(m); return m; };
  const caja = (w, h, d, c, x, y, z, p, mx) => mesh(new THREE.BoxGeometry(w, h, d), c, x, y, z, p, mx);
  const cil = (r, h, c, x, y, z, p, rt, seg = 16, mx) => mesh(new THREE.CylinderGeometry(rt ?? r, r, h, seg), c, x, y, z, p, mx);
  const tubo = (pts, r, c, p, mx) => { const cur = new THREE.CatmullRomCurve3(pts.map(a => new THREE.Vector3(...a))); const m = new THREE.Mesh(new THREE.TubeGeometry(cur, 24, r, 8), M(c, mx)); p.add(m); return m; };
  const barra = (a, b, r, c, p) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), L = A.distanceTo(B);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 8), M(c)); m.position.copy(A).add(B).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); p.add(m); return m; };
  function texto(txt, w, h, fondo = '#ffffff', color = '#111', tam = .55, borde) {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = Math.max(64, Math.round(512 * h / w)); const g = cv.getContext('2d');
    g.fillStyle = fondo; g.fillRect(0, 0, cv.width, cv.height); if (borde) { g.strokeStyle = borde; g.lineWidth = 14; g.strokeRect(7, 7, cv.width - 14, cv.height - 14); }
    g.fillStyle = color; const lineas = String(txt).split('\n'); const fs = cv.height * tam / lineas.length; g.font = `900 ${fs}px Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    lineas.forEach((l, i) => g.fillText(l, cv.width / 2, cv.height * (i + .5) / lineas.length));
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }));
  }
  const ROJO = 0xC8102E, NEGRO = 0x1B1B1B, GRIS = 0x8A949C, AMAR = 0xF2C230, NARANJA = 0xE8701A, AZUL = 0x0D6EB8, VERDE = 0x00995C;

  // ---------------------------------------------------------------- EXTINTORES (genéricos, sin marca)
  // tipo: 'pqs' (polvo químico seco, con manómetro), 'co2' (sin manómetro, difusor/corneta), 'agua' (con manómetro, cilindro alto)
  function extintor(tipo = 'pqs') {
    const g = new THREE.Group(); const alto = tipo === 'agua' ? .66 : tipo === 'co2' ? .6 : .5, r = tipo === 'co2' ? .085 : .09;
    cil(r, alto, ROJO, 0, alto / 2 + .02, 0, g, r, 20, { roughness: .35, metalness: .3 });
    mesh(new THREE.SphereGeometry(r, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), ROJO, 0, alto + .02, 0, g, { roughness: .35, metalness: .3 });
    cil(r * .95, .03, NEGRO, 0, .015, 0, g);   // base
    cil(.025, .07, GRIS, 0, alto + r + .02, 0, g, .025, 10, { metalness: .8, roughness: .3 });   // válvula
    caja(.12, .015, .03, NEGRO, .03, alto + r + .07, 0, g); caja(.11, .015, .03, NEGRO, .03, alto + r + .04, 0, g).rotation.z = -.25;   // palanca y manija
    const seguro = new THREE.Mesh(new THREE.TorusGeometry(.018, .004, 6, 14), M(0xDDDDDD, { metalness: .8 })); seguro.position.set(-.035, alto + r + .06, .02); g.add(seguro);
    if (tipo !== 'co2') { const man = cil(.028, .012, 0xFFFFFF, -.045, alto + r + .025, .03, g); man.rotation.x = Math.PI / 2; const ar = new THREE.Mesh(new THREE.RingGeometry(.012, .026, 16, 1, 0, Math.PI * .6), new THREE.MeshBasicMaterial({ color: 0x2E9E4F, side: THREE.DoubleSide })); ar.position.set(-.045, alto + r + .025, .037); g.add(ar); }
    if (tipo === 'co2') { tubo([[0, alto + r + .04, 0], [.08, alto + r, .05], [.12, alto * .6, .09]], .012, NEGRO, g); const c = cil(.012, .18, NEGRO, .12, alto * .45, .09, g, .05, 14); }
    else tubo([[0, alto + r + .04, 0], [.07, alto + r - .02, .06], [.11, alto * .55, .1], [.1, alto * .3, .1]], .011, NEGRO, g);
    const etq = texto({ pqs: 'PQS\nABC', co2: 'CO₂\nBC', agua: 'AGUA\nA' }[tipo], .1, .12, '#ffffff', '#111', .7); etq.position.set(0, alto * .55, r + .002); g.add(etq);
    g.userData.nombre = { pqs: 'Extintor de polvo químico seco (PQS)', co2: 'Extintor de bióxido de carbono (CO₂)', agua: 'Extintor de agua' }[tipo]; return g;
  }
  function gabineteExtintor() { const g = new THREE.Group(); caja(.42, .8, .26, ROJO, 0, .4, -.13, g); const v = caja(.36, .7, .01, 0xBFE3F2, 0, .4, .005, g, { transparent: true, opacity: .35 }); v.material.depthWrite = false;
    const e = extintor('pqs'); e.position.set(0, .06, -.12); e.scale.setScalar(.95); g.add(e); g.userData.nombre = 'Gabinete para extintor'; return g; }

  // ---------------------------------------------------------------- ALTURAS
  function casco(color = AMAR) { const g = new THREE.Group(); mesh(new THREE.SphereGeometry(.13, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), color, 0, .05, 0, g, { roughness: .4 });
    const ala = cil(.16, .012, color, 0, .05, .02, g, .16, 24); ala.scale.z = 1.15; caja(.02, .03, .2, color, 0, .17, 0, g);   // cresta
    tubo([[-.12, .05, 0], [-.11, -.06, .03], [0, -.12, .07], [.11, -.06, .03], [.12, .05, 0]], .006, NEGRO, g);   // barbiquejo
    g.position.y = .12; const w = new THREE.Group(); w.add(g); w.userData.nombre = 'Casco de seguridad con barbiquejo'; return w; }
  function maniqui(color = 0xD9DEE2) { const g = new THREE.Group(); cil(.06, 1.0, GRIS, 0, .5, 0, g); mesh(new THREE.CapsuleGeometry(.17, .45, 6, 12), color, 0, 1.25, 0, g);
    mesh(new THREE.SphereGeometry(.12, 16, 12), color, 0, 1.68, 0, g); caja(.36, .1, .2, color, 0, .93, 0, g); return g; }
  function arnes() { const g = maniqui(); const c = NARANJA;
    [[-.1, 1.5, .16, .1, 1.0, .17], [.1, 1.5, .16, -.1, 1.0, .17], [-.12, 1.5, -.16, -.12, 1.0, -.16], [.12, 1.5, -.16, .12, 1.0, -.16]].forEach(([a, b, cc, d, e, f]) => barra([a, b, cc], [d, e, f], .018, c, g));
    tubo([[-.18, .95, .1], [-.12, .82, .14], [0, .9, .2], [.12, .82, .14], [.18, .95, .1]], .016, c, g);   // perneras
    const anillo = new THREE.Mesh(new THREE.TorusGeometry(.04, .008, 8, 18), M(GRIS, { metalness: .9, roughness: .3 })); anillo.position.set(0, 1.45, -.2); g.add(anillo);   // anillo D dorsal
    g.userData.nombre = 'Arnés de cuerpo completo (en maniquí)'; return g; }
  function anclaje() { const g = new THREE.Group(); caja(.2, .02, .2, GRIS, 0, .01, 0, g, { metalness: .7 }); cil(.02, .12, GRIS, 0, .07, 0, g, .02, 8, { metalness: .7 });
    const o = new THREE.Mesh(new THREE.TorusGeometry(.05, .012, 8, 18), M(AMAR, { metalness: .5 })); o.position.y = .17; g.add(o); g.userData.nombre = 'Punto de anclaje'; return g; }
  function lineaVida(largo = 6) { const g = new THREE.Group(); [-largo / 2, largo / 2].forEach(x => { cil(.05, 1.6, GRIS, x, .8, 0, g, .05, 10, { metalness: .6 }); caja(.3, .02, .3, GRIS, x, .01, 0, g); });
    barra([-largo / 2, 1.55, 0], [largo / 2, 1.55, 0], .008, 0x555555, g); for (let x = -largo / 2 + 1.5; x < largo / 2; x += 1.5) cil(.02, .2, AMAR, x, 1.45, 0, g);
    g.userData.nombre = 'Línea de vida horizontal'; return g; }
  function andamio(niveles = 2) { const g = new THREE.Group(); const A = 1.8, F = 1.0, H = 2.0;
    for (let n = 0; n < niveles; n++) { const y = n * H;
      [[-A / 2, -F / 2], [A / 2, -F / 2], [-A / 2, F / 2], [A / 2, F / 2]].forEach(([x, z]) => barra([x, y, z], [x, y + H, z], .025, GRIS, g));
      [-A / 2, A / 2].forEach(x => { barra([x, y + .1, -F / 2], [x, y + .1, F / 2], .02, GRIS, g); barra([x, y + H, -F / 2], [x, y + H, F / 2], .02, GRIS, g); barra([x, y + .1, -F / 2], [x, y + H, F / 2], .015, GRIS, g); });
      barra([-A / 2, y + H - 1, F / 2], [A / 2, y + H - 1, F / 2], .015, GRIS, g); barra([-A / 2, y + H - 1, F / 2], [A / 2, y + .2, F / 2], .015, GRIS, g); }
    for (let k = 0; k < 4; k++) caja(A + .1, .04, .22, 0xA0703A, 0, niveles * H, -F / 2 + .14 + k * .24, g);   // plataforma
    [-F / 2, F / 2].forEach(z => { barra([-A / 2, niveles * H + 1.0, z], [A / 2, niveles * H + 1.0, z], .02, AMAR, g); barra([-A / 2, niveles * H + .5, z], [A / 2, niveles * H + .5, z], .02, AMAR, g); caja(A, .15, .02, AMAR, 0, niveles * H + .1, z, g); });
    [-A / 2, A / 2].forEach(x => [-F / 2, F / 2].forEach(z => barra([x, niveles * H, z], [x, niveles * H + 1.05, z], .022, AMAR, g)));
    g.userData.nombre = 'Andamio tubular con barandal y rodapié'; return g; }

  // ---------------------------------------------------------------- ESPACIOS CONFINADOS
  function tripie() { const g = new THREE.Group(); const H = 2.3;
    [0, 2.09, 4.19].forEach(a => barra([Math.cos(a) * 1.0, 0, Math.sin(a) * 1.0], [0, H, 0], .035, AMAR, g)); cil(.1, .12, NEGRO, 0, H, 0, g);
    const w = cil(.09, .14, ROJO, .2, H - .55, 0, g); w.rotation.z = Math.PI / 2; caja(.04, .2, .04, GRIS, .2, H - .3, 0, g); barra([0, H, 0], [0, .9, 0], .006, 0x333333, g);
    g.userData.nombre = 'Tripié de rescate con malacate'; return g; }
  function detectorGases() { const g = new THREE.Group(); caja(.08, .14, .04, AMAR, 0, .07, 0, g, { roughness: .5 }); caja(.07, .02, .05, NEGRO, 0, .005, 0, g);
    const p = texto('O₂  CO\nLEL  H₂S', .06, .045, '#0F2A1A', '#7CFF9A', .5); p.position.set(0, .1, .021); g.add(p); caja(.05, .015, .01, NEGRO, 0, .035, .021, g);
    g.userData.nombre = 'Detector de gases multigás (genérico)'; return g; }
  function ventilador() { const g = new THREE.Group(); const c = cil(.25, .35, AMAR, 0, .35, 0, g, .25, 20); c.rotation.x = Math.PI / 2; [-.18, .18].forEach(x => barra([x, 0, 0], [x * .8, .3, 0], .02, NEGRO, g));
    tubo([[0, .35, -.18], [0, .4, -.8], [.2, .2, -1.6], [.3, .05, -2.4]], .2, 0x8A949C, g, { roughness: .9 }); g.userData.nombre = 'Ventilador con ducto flexible'; return g; }

  // ---------------------------------------------------------------- SEGURIDAD ELÉCTRICA
  function tapete(l = 1.2, a = .9) { const g = new THREE.Group(); caja(l, .01, a, 0x222222, 0, .005, 0, g, { roughness: .95 }); for (let k = -4; k <= 4; k++) caja(l * .95, .012, .01, 0x2D2D2D, 0, .006, k * a / 10, g);
    g.userData.nombre = 'Tapete dieléctrico'; return g; }
  function guantes(c = ROJO) { const g = new THREE.Group(); [-.07, .07].forEach((x, i) => { const m = new THREE.Group(); m.position.set(x, .02, 0); m.rotation.y = i ? -.2 : .2; g.add(m);
    caja(.09, .02, .14, c, 0, 0, 0, m); for (let k = 0; k < 4; k++) caja(.018, .018, .08, c, -.03 + k * .02, 0, -.1, m); caja(.12, .022, .12, NEGRO, 0, 0, .12, m); }); g.userData.nombre = 'Guantes dieléctricos'; return g; }
  function careta() { const g = new THREE.Group(); const v = mesh(new THREE.CylinderGeometry(.13, .13, .26, 20, 1, true, -Math.PI * .45, Math.PI * .9), 0x7FD3FF, 0, .2, 0, g, { transparent: true, opacity: .45, side: THREE.DoubleSide, metalness: .2 });
    v.material.depthWrite = false; tubo([[-.12, .33, 0], [0, .38, -.12], [.12, .33, 0]], .015, NEGRO, g); caja(.24, .03, .04, NEGRO, 0, .33, .1, g); g.userData.nombre = 'Careta de protección facial'; return g; }
  function herramientaAislada() { const g = new THREE.Group(); const d = new THREE.Group(); g.add(d); cil(.012, .1, ROJO, 0, .05, 0, d, .014); cil(.015, .03, AMAR, 0, .11, 0, d); cil(.004, .12, GRIS, 0, .18, 0, d, .004, 6, { metalness: .9 });
    d.rotation.z = Math.PI / 2; d.position.set(-.06, .02, 0); const p = new THREE.Group(); p.position.set(.08, .015, .02); g.add(p);
    [-.012, .012].forEach((x, i) => { const b = caja(.02, .02, .14, ROJO, x, 0, .05, p); b.rotation.y = i ? .12 : -.12; caja(.012, .015, .05, GRIS, x * .5, 0, -.05, p, { metalness: .9 }); });
    g.userData.nombre = 'Herramienta aislada (desarmador y pinzas)'; return g; }

  // ---------------------------------------------------------------- LOTO (bloqueo y etiquetado)
  function candado(c = ROJO) { const g = new THREE.Group(); caja(.04, .05, .02, c, 0, .025, 0, g, { roughness: .35 });
    const a = new THREE.Mesh(new THREE.TorusGeometry(.014, .0035, 8, 16, Math.PI), M(GRIS, { metalness: .9, roughness: .25 })); a.position.y = .05; g.add(a); [-.014, .014].forEach(x => cil(.0035, .012, GRIS, x, .051, 0, g, .0035, 6, { metalness: .9 }));
    g.userData.nombre = 'Candado de bloqueo personal'; return g; }
  function pinza() { const g = new THREE.Group(); caja(.05, .1, .006, ROJO, 0, .05, 0, g); for (let k = 0; k < 6; k++) { const o = new THREE.Mesh(new THREE.TorusGeometry(.007, .002, 6, 10), M(0x333333)); o.position.set(-.02 + (k % 3) * .02, .03 + Math.floor(k / 3) * .025, .004); g.add(o); }
    const q = new THREE.Mesh(new THREE.TorusGeometry(.025, .004, 8, 16, Math.PI), M(GRIS, { metalness: .9 })); q.position.y = .1; g.add(q); g.userData.nombre = 'Pinza multibloqueo'; return g; }
  function etiqueta() { const g = new THREE.Group(); const t = texto('PELIGRO\nNO OPERAR\nEQUIPO BLOQUEADO', .08, .14, '#C8102E', '#ffffff', .55); t.position.y = .07; g.add(t);
    const o = new THREE.Mesh(new THREE.RingGeometry(.005, .009, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })); o.position.set(0, .13, .001); g.add(o); g.userData.nombre = 'Etiqueta de bloqueo'; return g; }
  function estacionLOTO() { const g = new THREE.Group(); caja(.9, 1.0, .05, 0xF4F7FA, 0, 1.3, 0, g); caja(.9, .14, .055, ROJO, 0, 1.73, 0, g);
    const t = texto('ESTACIÓN DE BLOQUEO', .8, .1, '#C8102E', '#fff', .7); t.position.set(0, 1.73, .03); g.add(t);
    for (let k = 0; k < 6; k++) { const c = candado([ROJO, ROJO, AZUL, AMAR, VERDE, ROJO][k]); c.position.set(-.3 + k * .12, 1.36, .04); c.scale.setScalar(1.6); g.add(c); cil(.004, .04, GRIS, -.3 + k * .12, 1.47, .03, g).rotation.x = Math.PI / 2; }
    for (let k = 0; k < 3; k++) { const e = etiqueta(); e.position.set(-.25 + k * .25, .92, .035); e.scale.setScalar(1.6); g.add(e); }
    const p = pinza(); p.position.set(.32, .95, .035); p.scale.setScalar(1.6); g.add(p); g.userData.nombre = 'Estación de bloqueo y etiquetado (LOTO)'; return g; }

  // ---------------------------------------------------------------- PRIMEROS AUXILIOS
  function camilla() { const g = new THREE.Group(); const t = caja(.45, .04, 1.85, NARANJA, 0, .02, 0, g, { roughness: .5 }); for (let k = -3; k <= 3; k++) { if (!k) continue; caja(.07, .045, .14, 0x9E4A10, (k < 0 ? -1 : 1) * .18, .022, k * .25, g); }
    [-.5, 0, .5].forEach(z => caja(.5, .046, .05, NEGRO, 0, .023, z, g)); const blq = caja(.3, .12, .12, AZUL, 0, .08, -.8, g); g.userData.nombre = 'Camilla rígida (tabla) con inmovilizador'; return g; }
  function collarin() { const g = new THREE.Group(); const c = mesh(new THREE.CylinderGeometry(.075, .085, .1, 20, 1, true), 0xEEEEEE, 0, .05, 0, g, { side: THREE.DoubleSide }); caja(.04, .07, .02, AZUL, 0, .05, .08, g);
    g.userData.nombre = 'Collarín cervical'; return g; }
  function cobija() { const g = new THREE.Group(); const geo = new THREE.PlaneGeometry(.5, .35, 6, 4); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(i * 1.7) * .01);
    const m = new THREE.Mesh(geo, M(0xD4AF37, { metalness: .9, roughness: .25, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.y = .015; g.add(m);
    g.userData.nombre = 'Cobija térmica (manta de emergencia)'; return g; }

  const LISTA = [
    ['extintor_pqs', 'Extintor PQS (genérico)', 'extintores-fuego', () => extintor('pqs')], ['extintor_co2', 'Extintor CO₂ (genérico)', 'extintores-fuego', () => extintor('co2')],
    ['extintor_agua', 'Extintor de agua (genérico)', 'extintores-fuego', () => extintor('agua')], ['gabinete', 'Gabinete para extintor', 'extintores-fuego', gabineteExtintor],
    ['casco', 'Casco con barbiquejo', 'alturas', casco], ['arnes', 'Arnés de cuerpo completo', 'alturas', arnes], ['anclaje', 'Punto de anclaje', 'alturas', anclaje],
    ['linea_vida', 'Línea de vida', 'alturas', lineaVida], ['andamio', 'Andamio tubular', 'alturas', andamio],
    ['tripie', 'Tripié de rescate', 'espacios-confinados', tripie], ['detector', 'Detector de gases', 'espacios-confinados', detectorGases], ['ventilador_ducto', 'Ventilador con ducto', 'espacios-confinados', ventilador],
    ['tapete', 'Tapete dieléctrico', 'seguridad-electrica', tapete], ['guantes', 'Guantes dieléctricos', 'seguridad-electrica', guantes], ['careta', 'Careta', 'seguridad-electrica', careta],
    ['herramienta', 'Herramienta aislada', 'seguridad-electrica', herramientaAislada],
    ['candado', 'Candado de bloqueo', 'loto', candado], ['pinza', 'Pinza multibloqueo', 'loto', pinza], ['etiqueta', 'Etiqueta de bloqueo', 'loto', etiqueta], ['estacion', 'Estación LOTO', 'loto', estacionLOTO],
    ['camilla', 'Camilla rígida', 'primeros-auxilios', camilla], ['collarin', 'Collarín cervical', 'primeros-auxilios', collarin], ['cobija', 'Cobija térmica', 'primeros-auxilios', cobija],
  ].map(([clave, nombre, modulo, fn]) => ({ clave, nombre, modulo, fn }));
  return { extintor, gabineteExtintor, casco, maniqui, arnes, anclaje, lineaVida, andamio, tripie, detectorGases, ventilador, tapete, guantes, careta, herramientaAislada,
    candado, pinza, etiqueta, estacionLOTO, camilla, collarin, cobija, texto, LISTA, POR_CLAVE: k => LISTA.find(x => x.clave === k) };
}
