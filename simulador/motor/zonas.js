// Zonas de trabajo alejadas del campus, dentro del mismo mundo (módulo ES): mina a cielo abierto, mina subterránea,
// obra en construcción, aserradero, ferrocarril y campo agrícola. El relieve (tajo, cerro, estructuras) se dibuja con
// geometría propia desde el inicio; los modelos 3D de cada zona (kit .glb) se cargan SOLO cuando el avatar se acerca o
// se teletransporta (carga diferida). Cada zona tiene: caminos desde el campus, marcadores numerados tocables con
// información, señales NOM-026 y una caseta de acceso caminable con las puertas de sus normas (próximamente/pendiente).
//   const Z = construirZonas(ctx)   ctx = { THREE, escena, kit, props, nav, tocables, pisos, obst, cartel, poste, R }
//   Z.ZONAS → [{id, nombre, icono, color, centro, entrada, area, kit}] · Z.actualizar(dt, posAvatar) · Z.cargar(id) · Z.HUECOS
export const HUECOS = [{ x: 64, z: -74, r: 27 }];   // tajo de la mina a cielo abierto (hueco en el piso del mundo)
const NOM = { m23: 'NOM-023-STPS-2012', m32: 'NOM-032-STPS-2008', c31: 'NOM-031-STPS-2011', a08: 'NOM-008-STPS-2013', f16: 'NOM-016-STPS-2001', g03: 'NOM-003-STPS-2023', e17: 'NOM-017-STPS-2024', h09: 'NOM-009-STPS-2011' };
export const DEF_ZONAS = [
  { id: 'mina_abierta', nombre: 'Mina a cielo abierto', icono: '⛏️', color: 0xB07B53, kit: 'mina-abierta', centro: [64, -74], entrada: [38, -50], caseta: [33, -55, 0.8], salida: 160, piso: 'grava',
    desc: 'Tajo con bancos, rampa de acarreo y planta de trituración', senales: ['casco', 'calzado', 'caida'],
    modulos: [{ titulo: 'Recorrido de inspección del tajo', icono: '🔎', nom: NOM.m23, estado: 'pronto', color: 'amarillo', senal: 'caida' },
      { titulo: 'Tránsito de equipo pesado', icono: '🚛', nom: NOM.m23, estado: 'pronto', color: 'amarillo', senal: 'prec_general' },
      { titulo: 'EPP en la mina', icono: '⛑️', nom: NOM.e17, estado: 'pronto', color: 'azul', senal: 'casco' }] },
  { id: 'mina_subterranea', nombre: 'Mina subterránea', icono: '🕳️', color: 0x5D4037, kit: 'mina-subterranea', centro: [104, 8], entrada: [72, 14], caseta: [70, 22, -1.6], salida: 80, piso: 'grava',
    desc: 'Bocamina, galería, vía de vagones y ventilación', senales: ['casco', 'respiratoria', 'no_paso'],
    modulos: [{ titulo: 'Ingreso y control de personal', icono: '🪪', nom: NOM.m23, estado: 'pronto', color: 'azul', senal: 'casco' },
      { titulo: 'Ventilación de la mina', icono: '🌬️', nom: NOM.m23, estado: 'pronto', color: 'amarillo', senal: 'prec_general' },
      { titulo: 'Minas subterráneas de carbón', icono: '⚫', nom: NOM.m32, estado: 'pronto', color: 'rojo', senal: 'no_llama' }] },
  { id: 'construccion', nombre: 'Obra en construcción', icono: '🏗️', color: 0xE07A1F, kit: 'construccion', centro: [-64, 62], entrada: [-44, 46], caseta: [-40, 54, -2.4], salida: 320, piso: 'concreto',
    desc: 'Estructura en obra negra, andamios, grúa torre y almacén de materiales', senales: ['casco', 'calzado', 'arnes'],
    modulos: [{ titulo: 'Recorrido de seguridad en obra', icono: '🦺', nom: NOM.c31, estado: 'pronto', color: 'amarillo', senal: 'prec_general' },
      { titulo: 'Andamios y trabajos en altura en obra', icono: '🪜', nom: `${NOM.c31} · ${NOM.h09}`, estado: 'pronto', color: 'azul', senal: 'arnes' },
      { titulo: 'Excavaciones y zanjas', icono: '🕳️', nom: NOM.c31, estado: 'pronto', color: 'amarillo', senal: 'caida' }] },
  { id: 'aserradero', nombre: 'Aserradero', icono: '🪵', color: 0x8B6B4A, kit: 'aserradero', centro: [-92, -20], entrada: [-66, -10], caseta: [-62, -18, 1.6], salida: 280, piso: 'tablones',
    desc: 'Patio de trocería, sierras y bosque de aprovechamiento', senales: ['auditiva', 'ocular', 'guantes'],
    modulos: [{ titulo: 'Sierras y protecciones del aserradero', icono: '🪚', nom: NOM.a08, estado: 'pronto', color: 'amarillo', senal: 'prec_general' },
      { titulo: 'Derribo y troceo en el bosque', icono: '🌲', nom: NOM.a08, estado: 'pronto', color: 'amarillo', senal: 'casco' }] },
  { id: 'ferrocarril', nombre: 'Ferrocarril', icono: '🚂', color: 0x37474F, kit: 'ferrocarril', centro: [0, -122], entrada: [-14, -106], caseta: [-24, -110, 0], salida: 200, piso: 'concreto',
    desc: 'Estación, vía y patio de maniobras', senales: ['prec_general', 'no_paso'],
    modulos: [{ titulo: 'Operación y mantenimiento de vía', icono: '🛤️', nom: NOM.f16, estado: 'pronto', color: 'amarillo', senal: 'prec_general' },
      { titulo: 'Patio de maniobras', icono: '🚃', nom: NOM.f16, estado: 'pronto', color: 'amarillo', senal: 'prec_general' }] },
  { id: 'agricola', nombre: 'Campo agrícola', icono: '🚜', color: 0x2E7D32, kit: 'agricola', centro: [72, 74], entrada: [52, 56], caseta: [46, 62, -2.3], salida: 30, piso: 'tierra',
    desc: 'Cultivo, maquinaria agrícola y bodega', senales: ['guantes', 'respiratoria'],
    modulos: [{ titulo: 'Actividades agrícolas', icono: '🌽', nom: NOM.g03, estado: 'pendiente', color: 'amarillo', senal: 'prec_general' }] },
];
// Marcadores numerados (como en un recorrido de inspección). Textos generales; el detalle normativo se verifica al crear cada curso.
const PINES = {
  mina_abierta: [
    [52, -62, 'Talud y bancos', 'Los bancos escalonados dan estabilidad a las paredes del tajo. La NOM-023-STPS-2012 pide reconocer en cada turno las condiciones de seguridad del tajo, incluida la estabilidad de taludes.'],
    [70, -52, 'Rampa de acarreo', 'Camino por donde suben y bajan los camiones. Buena práctica: respetar la circulación, mantener distancia y no caminar por la rampa.'],
    [78, -70, 'Maquinaria mayor', 'Cargador, tractor y camiones. El reconocimiento por turno de la NOM-023-STPS-2012 considera también la maquinaria mayor.'],
    [40, -76, 'Planta de trituración', 'Tolva y banda transportadora: zona de partes en movimiento (ver también NOM-004-STPS-1999, maquinaria).'],
    [36, -46, 'Acceso y caseta', 'Entrada controlada. La NOM-023-STPS-2012 prohíbe el trabajo en el interior de las minas a menores de 18 años y a mujeres embarazadas o en periodo de lactancia.'] ],
  mina_subterranea: [
    [80, 9, 'Bocamina', 'Entrada a la galería. Solo personal autorizado (señal de prohibido el paso, NOM-026-STPS-2008).'],
    [77, 16, 'Vía y vagones', 'Transporte de mineral sobre rieles: zona de atropellamiento; circular por el andador.'],
    [82, 0, 'Ventilación', 'El aire de la galería se renueva con ventiladores y ductos; tema de la NOM-023-STPS-2012 (y NOM-032-STPS-2008 en minas de carbón).'] ],
  construccion: [
    [-60, 52, 'Andamio', 'Andamio con barandal y rodapié; trabajo en altura con arnés y línea de vida (NOM-009-STPS-2011 y NOM-031-STPS-2011).'],
    [-74, 70, 'Grúa torre', 'Zona de izaje: nadie debe permanecer bajo la carga suspendida.'],
    [-50, 66, 'Almacén de materiales', 'Materiales estibados y delimitados; pasillos libres.'],
    [-46, 50, 'Acceso a la obra', 'Ingreso con casco, calzado de protección y chaleco; registro en la oficina de obra (NOM-031-STPS-2011).'] ],
  aserradero: [
    [-86, -14, 'Sierra de cinta y circular', 'Partes cortantes en movimiento: guardas y dispositivos de seguridad (NOM-008-STPS-2013 y NOM-004-STPS-1999).'],
    [-100, -6, 'Patio de trocería', 'Pilas de troncos: riesgo de rodamiento; no subirse a las pilas.'],
    [-104, -36, 'Bosque', 'Aprovechamiento forestal maderable: derribo, troceo y extracción (NOM-008-STPS-2013).'] ],
  ferrocarril: [
    [-6, -114, 'Andén', 'Mantenerse detrás de la franja amarilla hasta que el tren se detenga.'],
    [20, -120, 'Vía', 'No cruzar ni caminar sobre la vía fuera de los pasos autorizados (NOM-016-STPS-2001, operación y mantenimiento de ferrocarriles).'] ],
  agricola: [[60, 66, 'Maquinaria agrícola', 'Tractor en operación: mantener distancia y no viajar en el implemento.'], [76, 80, 'Cultivo', 'Aplicación de agroquímicos con equipo de protección (NOM-003-STPS-2023).']],
};

export function construirZonas(ctx) {
  const { THREE, escena, kit, props, nav, tocables, pisos, obst } = ctx;
  const V = (x, z) => new THREE.Vector3(x, 0, z);
  const mats = {}; const M = (c, x) => x ? new THREE.MeshStandardMaterial({ color: c, roughness: .9, ...x }) : (mats[c] || (mats[c] = new THREE.MeshStandardMaterial({ color: c, roughness: .9 })));
  const tex = (n, r) => { const t = new THREE.TextureLoader().load(`${ctx.base || ''}assets/texturas/${n}.webp`); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(r, r); t.anisotropy = 4; return t; };
  const caja = (w, h, d, c, x, y, z, p = escena, mx) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c, mx)); m.position.set(x, y, z); p.add(m); return m; };
  const parche = (x, z, r, color, map, y = 0.006) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 48), new THREE.MeshStandardMaterial({ color, map, roughness: 1 })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.userData.piso = true; escena.add(m); pisos.push(m); return m; };
  const poner = (z, clave, x, zz, ry = 0, s, y = 0) => kit.pieza(z.kit, clave).then(o => { o.position.set(x, y, zz); o.rotation.y = ry; if (s) o.scale.multiplyScalar(s); z.grupo.add(o); return o; });
  const tierra = tex('tierra', 10), grava = tex('grava', 6), roca = tex('roca', 4), concreto = tex('concreto', 6);

  // ---------------- caminos desde el campus (salida entre edificios → entrada de la zona)
  function camino(a, b, ancho = 4, color = 0xCDBB98) {
    const d = b.clone().sub(a), L = d.length(), m = new THREE.Mesh(new THREE.PlaneGeometry(ancho, L), new THREE.MeshStandardMaterial({ color, map: grava, roughness: 1 }));
    m.material.map = grava.clone(); m.material.map.repeat.set(ancho / 4, L / 4); m.material.map.needsUpdate = true;
    m.rotation.x = -Math.PI / 2; m.rotation.z = Math.atan2(d.x, d.z) + Math.PI; m.position.copy(a).add(b).multiplyScalar(.5).setY(0.009); m.userData.piso = true; escena.add(m); pisos.push(m);
    nav.camino(m.position.x, m.position.z, ancho, L + 1, Math.atan2(d.x, d.z), .4);
  }
  const polar = (ang, r) => V(Math.sin(ang * Math.PI / 180) * r, Math.cos(ang * Math.PI / 180) * r);

  // ---------------- marcador numerado (pin)
  function pin(z, k, x, zz, titulo, texto) {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 160; const g = cv.getContext('2d');
    g.fillStyle = '#154F90'; g.beginPath(); g.arc(64, 58, 52, 0, Math.PI * 2); g.fill(); g.beginPath(); g.moveTo(30, 96); g.lineTo(64, 156); g.lineTo(98, 96); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 58, 40, 0, Math.PI * 2); g.fill(); g.fillStyle = '#154F90'; g.font = '900 52px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(k), 64, 60);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: true })); s.scale.set(1.6, 2, 1); s.position.set(x, 3.2, zz); s.center.set(.5, 0); escena.add(s);
    s.userData = { tipo: 'pin', zona: z.id, titulo: `${k}. ${titulo}`, texto }; tocables.push(s); z.pines.push(s);
  }
  // ---------------- caseta de acceso (edificio pequeño con puerta tocable que lleva al interior de la zona)
  function caseta(z) {
    const [x, zz, ry] = z.def.caseta; const g = new THREE.Group(); g.position.set(x, 0, zz); g.rotation.y = ry; escena.add(g);
    const cuerpo = caja(7, 3.6, 5, z.def.color, 0, 1.8, 0, g); caja(7.6, 0.3, 5.6, 0xFFFFFF, 0, 3.75, 0, g);
    const puerta = caja(1.6, 2.4, 0.1, 0xF4F7FA, 0, 1.2, 2.53, g); [cuerpo, puerta].forEach(m => { m.userData = { tipo: 'zona', zona: z.id }; tocables.push(m); });
    const c = ctx.cartel(z.def.nombre.toUpperCase(), 6, 0.6, '#ffffff', '#' + z.def.color.toString(16).padStart(6, '0'), .55); c.position.set(0, 3.1, 2.53); g.add(c);
    const vent = caja(1.2, 0.8, 0.06, 0xBFE3F2, 2.2, 1.9, 2.53, g); vent.material = M(0xBFE3F2, { metalness: .2, roughness: .3 });
    nav.bloquearRect(x, zz, 7.6, 5.6, ry); obst(x, zz, 0.1);
    z.puertaMundo = new THREE.Vector3(0, 0, 3.6).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry).add(g.position);
    ctx.poste(z.def.senales, ...new THREE.Vector3(-4.2, 0, 3.2).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry).add(g.position).toArray().filter((_, i) => i !== 1), ry);
  }

  const ZONAS = DEF_ZONAS.map(def => ({ id: def.id, def, nombre: def.nombre, icono: def.icono, color: def.color, kit: def.kit, centro: V(...def.centro), entrada: V(...def.entrada),
    area: { id: def.id, nombre: def.nombre, icono: def.icono, color: def.color, desc: def.desc, senales: def.senales, modulos: def.modulos, piso: def.piso, zona: true },
    grupo: new THREE.Group(), pines: [], estado: 'sin cargar', anim: [] }));
  ZONAS.forEach(z => { escena.add(z.grupo); const s = polar(z.def.salida, 30), m = polar(z.def.salida, 40); camino(s, m); camino(m, z.entrada); caseta(z); (PINES[z.id] || []).forEach((p, k) => pin(z, k + 1, ...p)); });

  // ================= relieve propio de cada zona (siempre visible a distancia)
  // ---- MINA A CIELO ABIERTO: tajo con bancos escalonados y rampa en espiral
  const MA = ZONAS[0], [cx, cz] = MA.def.centro, R = HUECOS[0].r, NB = 6, PASO_B = 3.0, ALTO_B = 3.0;
  { const arena = new THREE.Mesh(new THREE.RingGeometry(R, 50, 64), new THREE.MeshStandardMaterial({ color: 0xE6D5B0, map: tierra, roughness: 1 })); arena.rotation.x = -Math.PI / 2; arena.position.set(cx, 0.007, cz); arena.userData.piso = true; escena.add(arena); pisos.push(arena);
    const tonos = [0xD9B88C, 0xCFA977, 0xC49A68, 0xB98C5C, 0xAE8052, 0xA27449];
    for (let b = 0; b < NB; b++) { const r0 = R - b * PASO_B, r1 = r0 - PASO_B * .55, y = -b * ALTO_B;
      const pared = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1 + .2, ALTO_B, 64, 1, true), new THREE.MeshStandardMaterial({ color: tonos[b], map: roca, side: THREE.BackSide, roughness: 1 }));
      pared.position.set(cx, y - ALTO_B / 2, cz); escena.add(pared);
      const banco = new THREE.Mesh(new THREE.RingGeometry(r0 - PASO_B, r1 + .2, 64), new THREE.MeshStandardMaterial({ color: tonos[b] + 0x060606, map: tierra, roughness: 1 })); banco.rotation.x = -Math.PI / 2; banco.position.set(cx, y - ALTO_B, cz); escena.add(banco); }
    const fondo = new THREE.Mesh(new THREE.CircleGeometry(R - NB * PASO_B, 48), M(0x9A6E44)); fondo.rotation.x = -Math.PI / 2; fondo.position.set(cx, -NB * ALTO_B, cz); escena.add(fondo);
    const agua = new THREE.Mesh(new THREE.CircleGeometry(3, 24), M(0x6E9FB8, { roughness: .2 })); agua.rotation.x = -Math.PI / 2; agua.position.set(cx + 2, -NB * ALTO_B + .02, cz - 1); escena.add(agua);
    // bordo perimetral (berma) y barrera: el avatar no puede entrar al tajo
    const bordo = new THREE.Mesh(new THREE.TorusGeometry(R + 1.4, .7, 6, 72), M(0xC9A877)); bordo.rotation.x = Math.PI / 2; bordo.position.set(cx, .2, cz); bordo.scale.z = .6; escena.add(bordo);
    nav.bloquearCirculo(cx, cz, R + 2.2);
    // rampa en espiral (franja clara) que siguen los camiones
    const pts = [], N = 240, vueltas = 1.6; for (let i = 0; i <= N; i++) { const t = i / N, a = 2.3 + t * vueltas * Math.PI * 2, r = R - 1.6 - t * (NB - .6) * PASO_B * .95, y = -t * (NB * ALTO_B - .4) + .05; pts.push(new THREE.Vector3(cx + Math.sin(a) * r, y, cz + Math.cos(a) * r)); }
    MA.rampa = new THREE.CatmullRomCurve3(pts);
    const pos = [], idx = []; for (let i = 0; i <= N; i++) { const p = MA.rampa.getPointAt(i / N), tn = MA.rampa.getTangentAt(i / N), lado = new THREE.Vector3(tn.z, 0, -tn.x).normalize().multiplyScalar(2.6);
      pos.push(p.x + lado.x, p.y + .06, p.z + lado.z, p.x - lado.x, p.y + .06, p.z - lado.z); if (i) idx.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i); }
    const gr = new THREE.BufferGeometry(); gr.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gr.setIndex(idx); gr.computeVertexNormals();
    escena.add(new THREE.Mesh(gr, new THREE.MeshStandardMaterial({ color: 0xE9D9B4, roughness: 1, side: THREE.DoubleSide })));
    // mirador con barandal junto a la caseta
    const mx = cx - (R + 3) * .62, mz = cz + (R + 3) * .78; caja(6, .2, 3, 0x9AA9B8, mx, .1, mz); [-1.5, 1.5].forEach(d => caja(6, .06, .06, 0xFFD100, mx, 1.0, mz + d)); }

  // ---- MINA SUBTERRÁNEA: cerro con bocamina
  const MS = ZONAS[1], [sx, sz] = MS.def.centro;
  { const geo = new THREE.ConeGeometry(34, 26, 40, 10); const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); if (y > -12.9) { const k = 1 + .12 * Math.sin(x * .4) * Math.cos(z * .35) + .06 * Math.sin(y); p.setX(i, x * k); p.setZ(i, z * k); } }
    geo.computeVertexNormals(); const cerro = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xB89F7E, roughness: 1, flatShading: true })); cerro.position.set(sx, 12.8, sz); escena.add(cerro);
    const cima = new THREE.Mesh(new THREE.ConeGeometry(9, 6, 12), M(0x6F8F55, { flatShading: true })); cima.position.set(sx + 2, 24, sz - 3); escena.add(cima);
    nav.bloquearCirculo(sx, sz, 31);
    // portal (marco de madera + boca oscura) del lado del campus
    const px = sx - 33, pz = sz + 2; const pg = new THREE.Group(); pg.position.set(px, 0, pz); pg.rotation.y = -Math.PI / 2; escena.add(pg);
    // portal de concreto que sale del cerro (galería de acceso), marco de madera y boca oscura
    const conc = M(0xBDB6A8, { map: concreto }); [-3.2, 3.2].forEach(x => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 6, 9), conc); m.position.set(x, 3, -4); pg.add(m); });
    const techo = new THREE.Mesh(new THREE.BoxGeometry(7.4, 1, 9), conc); techo.position.set(0, 6.3, -4); pg.add(techo);
    caja(5.4, 5.6, .1, 0x050505, 0, 2.8, -8.4, pg); const boca = caja(5.4, 5.6, 8.6, 0x0B0B0B, 0, 2.8, -4.2, pg); boca.material.side = THREE.BackSide;
    [-2.5, 2.5].forEach(x => caja(.4, 5.4, .4, 0x7A5A3A, x, 2.7, .3, pg)); caja(5.6, .45, .45, 0x7A5A3A, 0, 5.5, .3, pg);
    const puerta = caja(5.0, 5.2, .05, 0x111111, 0, 2.6, .05, pg, { transparent: true, opacity: .2 }); puerta.userData = { tipo: 'zona', zona: 'mina_subterranea' }; tocables.push(puerta);
    const letr = ctx.cartel('BOCAMINA · SOLO PERSONAL AUTORIZADO', 6.6, .55, '#FFD100', '#111', .5); letr.position.set(0, 6.0, .55); pg.add(letr);
    nav.bloquearRect(px + 4.3, pz, 7.6, 8.6, -Math.PI / 2);
    MS.portal = new THREE.Vector3(px - 1.5, 0, pz); }

  // ---- CONSTRUCCIÓN: estructura de concreto (obra negra) de 3 niveles
  const CO = ZONAS[2], [ox, oz] = CO.def.centro;
  { parche(ox, oz, 30, 0xBFAE95, tierra); const gris = M(0xB8B8B0, { map: concreto });
    for (let n = 0; n < 3; n++) { const y = n * 3.4; const losa = new THREE.Mesh(new THREE.BoxGeometry(16, .3, 11), gris); losa.position.set(ox, y + 3.4, oz); escena.add(losa);
      for (let i = -2; i <= 2; i++) for (let k = -1; k <= 1; k++) { const c = new THREE.Mesh(new THREE.BoxGeometry(.45, 3.4, .45), gris); c.position.set(ox + i * 3.8, y + 1.7, oz + k * 5); escena.add(c); } }
    for (let i = -2; i <= 2; i++) for (let k = -1; k <= 1; k++) { const c = new THREE.Mesh(new THREE.BoxGeometry(.45, 2, .45), gris); c.position.set(ox + i * 3.8, 11.2, oz + k * 5); escena.add(c); }   // varillas del 4o nivel
    nav.bloquearRect(ox, oz, 17, 12); const malla = 36, mz0 = oz - 15; [[-1, 0], [1, 0]].forEach(([s]) => { caja(.08, 2, 30, 0x8A949C, ox + s * 18, 1, oz, escena, { transparent: true, opacity: .55 }); nav.bloquearRect(ox + s * 18, oz, .5, 30); });
    caja(36, 2, .08, 0x8A949C, ox, 1, oz + 15, escena, { transparent: true, opacity: .55 }); nav.bloquearRect(ox, oz + 15, 36, .5); caja(36, 2, .08, 0x8A949C, ox + 5, 1, mz0, escena, { transparent: true, opacity: .55 }); nav.bloquearRect(ox + 5, mz0, 26, .5);
    // andamios propios en la fachada sur
    for (let i = -1; i <= 1; i++) { const a = props.andamio(2); a.position.set(ox + i * 2.0, 0, oz - 6.6); escena.add(a); }
    const lv = props.lineaVida(14); lv.position.set(ox, 6.8, oz - 5.6); escena.add(lv); }

  // ---- ASERRADERO: cobertizo abierto y bosque
  const AS = ZONAS[3], [ax, az] = AS.def.centro;
  { parche(ax, az, 24, 0xA88B64, tierra);
    const techo = caja(14, .25, 9, 0x7A5A3A, ax + 6, 4.4, az + 6); techo.rotation.z = .06; [[-6, -4], [6, -4], [-6, 4], [6, 4]].forEach(([dx, dz]) => caja(.3, 4.4, .3, 0x5A3E26, ax + 6 + dx, 2.2, az + 6 + dz));
    nav.bloquearRect(ax + 6, az + 6, 5, 3); nav.bloquearRect(ax - 6, az - 2, 14, 12); }

  // ---- FERROCARRIL: terraplén y andén (la vía y el tren se cargan con el kit)
  const FE = ZONAS[4], [fx, fz] = FE.def.centro;
  { const terr = new THREE.Mesh(new THREE.BoxGeometry(340, .3, 5), M(0xA89B86, { map: grava })); terr.position.set(0, .15, fz); escena.add(terr);
    const anden = caja(40, 1.0, 5, 0xC9C3B8, fx - 4, .5, fz + 6.5, escena, { map: concreto }); const franja = caja(40, .02, .35, 0xFFD100, fx - 4, 1.01, fz + 4.3);
    anden.userData.piso = true; pisos.push(anden); [-16, -4, 8].forEach(x => { caja(.3, 3.4, .3, 0x37474F, fx + x, 2.7, fz + 8); });
    caja(30, .2, 4, 0x154F90, fx - 4, 4.4, fz + 7.5); nav.bloquearRect(0, fz, 340, 3.2); nav.camino(fx - 4, fz + 6.8, 40, 3, 0, .4); }

  // ---- AGRÍCOLA: parcela con surcos
  const AG = ZONAS[5], [gx, gz] = AG.def.centro;
  { const parcela = new THREE.Mesh(new THREE.PlaneGeometry(34, 24), new THREE.MeshStandardMaterial({ color: 0x8C6A45, map: tierra, roughness: 1 })); parcela.rotation.x = -Math.PI / 2; parcela.position.set(gx + 4, .008, gz + 6); parcela.userData.piso = true; escena.add(parcela); pisos.push(parcela);
    nav.bloquearRect(gx + 4, gz + 6, 34, 24); nav.liberarRect(gx + 4, gz - 6.5, 34, 1.4); }

  // ================= contenido con modelos (carga diferida por zona)
  const CARGA = {
    async mina_abierta(z) { const p = [];
      p.push(poner(z, 'nave', cx - 30, cz - 2, Math.PI / 2), poner(z, 'nave_b', cx - 34, cz + 12, Math.PI / 2), poner(z, 'oficina', cx - 4, cz + 36, Math.PI));
      p.push(poner(z, 'tolva', cx - 24, cz - 20, 0), poner(z, 'banda', cx - 18, cz - 20, -Math.PI / 2), poner(z, 'tanque', cx + 30, cz - 26, 0));
      p.push(poner(z, 'bulldozer', cx + 6, cz - R + 6, 1.2, null, -ALTO_B * 2), poner(z, 'cargador', cx - 2, cz + 4, 2.4, null, -NB * ALTO_B));
      p.push(poner(z, 'camioneta', cx - 26, cz + 30, .5)); for (let k = 0; k < 6; k++) p.push(poner(z, 'cono', cx - 28 + k * 1.6, cz + 33, 0));
      for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2 + .2, r = 36 + (k % 3) * 4; p.push(poner(z, k % 4 ? 'arbol' : 'arbusto', cx + Math.sin(a) * r, cz + Math.cos(a) * r, a)); obst(cx + Math.sin(a) * r, cz + Math.cos(a) * r, .8); }
      for (let k = 0; k < 6; k++) { const a = k * 1.1, r = 6 + k; p.push(poner(z, k % 2 ? 'roca_a' : 'roca_b', cx + Math.sin(a) * r, cz + Math.cos(a) * r, a, null, -NB * ALTO_B)); }
      for (let k = 0; k < 3; k++) { const c = await kit.pieza(z.kit, 'camion'); z.grupo.add(c); z.anim.push({ o: c, t: k / 3, v: .018 * (k % 2 ? -1 : 1), tipo: 'rampa' }); }
      await Promise.all(p); },
    async mina_subterranea(z) { const p = []; const [px, pz] = [MS.portal.x, MS.portal.z];
      for (let k = 0; k < 6; k++) p.push(poner(z, 'via', px - 1 - k * 2, pz, Math.PI / 2));
      p.push(poner(z, 'vagon', px - 6, pz, Math.PI / 2), poner(z, 'carro', px - 10, pz, Math.PI / 2), poner(z, 'caseta', px - 6, pz - 7, Math.PI / 2));
      p.push(poner(z, 'pico', px - 4, pz + 4, .4), poner(z, 'pala', px - 3, pz + 4.5, 1));
      const v = props.ventilador(); v.position.set(px + 1, 0, pz - 5); v.rotation.y = Math.PI / 2; z.grupo.add(v);
      await Promise.all(p); },
    async construccion(z) { const p = [];
      p.push(poner(z, 'grua', ox - 12, oz + 9, .3), poner(z, 'camion', ox + 12, oz + 11, Math.PI), poner(z, 'cargador', ox + 13, oz - 9, -1));
      for (let k = 0; k < 4; k++) p.push(poner(z, 'tarima', ox + 10 + (k % 2) * 1.5, oz + 3 + Math.floor(k / 2) * 1.5, 0), poner(z, 'ladrillos', ox + 10 + (k % 2) * 1.5, oz + 3 + Math.floor(k / 2) * 1.5, 0, null, .15));
      p.push(poner(z, 'carretilla', ox + 8, oz - 8, .8), poner(z, 'tablas', ox + 13, oz - 1, 0), poner(z, 'pala', ox + 8.6, oz - 7.4, 0));
      for (let k = 0; k < 8; k++) p.push(poner(z, 'cono', ox - 8 + k * 2.2, oz - 9.5, 0)); for (let k = 0; k < 4; k++) p.push(poner(z, 'luz', ox - 17 + k * 11, oz + 14, Math.PI));
      p.push(poner(z, 'barrera', ox + 18, oz - 15.5, 0), poner(z, 'barrera', ox + 15, oz - 15.5, 0));
      await Promise.all(p); },
    async aserradero(z) { const p = [];
      p.push(poner(z, 'nave', ax - 6, az - 2, Math.PI / 2), poner(z, 'mesa_sierra', ax + 4, az + 6, 0), poner(z, 'sierra', ax + 8, az + 6, 0), poner(z, 'aserradero', ax + 6, az + 3, 0));
      for (let k = 0; k < 4; k++) p.push(poner(z, k % 2 ? 'pila' : 'troncos', ax - 2 + k * 5, az + 16, k * .3)); for (let k = 0; k < 3; k++) p.push(poner(z, 'tablas', ax + 14, az + k * 2, 0), poner(z, 'madera', ax + 16, az + k * 2 + 1, .3));
      p.push(poner(z, 'camion', ax + 12, az + 14, -Math.PI / 2), poner(z, 'hacha', ax + 3, az + 9, .5), poner(z, 'serrucho', ax + 3.6, az + 9.2, 1));
      for (let k = 0; k < 46; k++) { const a = k * 2.399, r = 26 + (k * 7 % 22); const x = ax + Math.sin(a) * r - 6, zz = az + Math.cos(a) * r - 6; if (zz > az + 10 && x > ax - 14) continue; if (Math.hypot(x - z.entrada.x, zz - z.entrada.z) < 9 || Math.hypot(x - z.def.caseta[0], zz - z.def.caseta[1]) < 8) continue; { const [ci, ck] = nav.celda(x, zz); if (nav.dentro(ci, ck) && nav.costo[nav.idx(ci, ck)] < .5) continue; }
        p.push(poner(z, k % 3 ? 'pino' : 'pino_b', x, zz, a)); obst(x, zz, .9); nav.bloquearCirculo(x, zz, .8); }
      for (let k = 0; k < 8; k++) p.push(poner(z, 'tocon', ax - 20 + k * 2.4, az - 20 - (k % 2) * 3, k));
      await Promise.all(p); },
    async ferrocarril(z) { const p = []; const via = await kit.pieza(z.kit, 'via'); via.rotation.y = Math.PI / 2; const largo = new THREE.Box3().setFromObject(via).getSize(new THREE.Vector3()).x || 4;   // rieles a lo largo de x
      for (let x = -168; x <= 168; x += largo) { const c = via.clone(true); c.position.set(x, .3, fz); z.grupo.add(c); }
      p.push(poner(z, 'senal', fx - 26, fz + 4, 0), poner(z, 'senal', fx + 18, fz + 4, 0), poner(z, 'contenedor', fx + 30, fz + 10, 0), poner(z, 'contenedor', fx + 30, fz + 13, 0));
      for (let k = 0; k < 4; k++) p.push(poner(z, 'poste', fx - 60 + k * 40, fz - 4, 0));
      const tren = new THREE.Group(); const piezas = ['locomotora', 'vagon_caja', 'vagon_tanque', 'vagon_madera', 'vagon_carbon']; let x = 0;
      for (const n of piezas) { const o = await kit.pieza(z.kit, n); const w = new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3()); o.rotation.y = w.z > w.x ? Math.PI / 2 : 0; const L = Math.max(w.x, w.z); o.position.x = x - L / 2; tren.add(o); x -= L + .3; }
      tren.position.set(-150, .3, fz); z.grupo.add(tren); z.anim.push({ o: tren, tipo: 'tren', v: 7, x: -150, pausa: 0 });
      await Promise.all(p); },
    async agricola(z) { const p = [];
      for (let i = 0; i < 9; i++) for (let k = 0; k < 6; k++) p.push(poner(z, i < 5 ? 'maiz' : 'trigo', gx - 11 + i * 3.6, gz + k * 3.2, 0));
      p.push(poner(z, 'bodega', gx + 26, gz - 2, -Math.PI / 2), poner(z, 'tambo', gx + 20, gz - 8, 0), poner(z, 'tambo', gx + 21, gz - 8.3, 0));
      for (let k = 0; k < 12; k++) p.push(poner(z, 'cerca', gx - 13 + k * 3, gz - 5.6, 0));
      const tr = await kit.pieza(z.kit, 'tractor'); z.grupo.add(tr); z.anim.push({ o: tr, tipo: 'surcos', t: 0 });
      for (let k = 0; k < 6; k++) p.push(poner(z, 'arbol', gx - 18 - (k % 2) * 4, gz + k * 5, k));
      await Promise.all(p); },
  };
  async function cargar(id) { const z = ZONAS.find(q => q.id === id); if (!z || z.estado !== 'sin cargar') return z && z.promesa; z.estado = 'cargando'; const t0 = performance.now();
    z.promesa = CARGA[id](z).then(() => { z.estado = 'listo'; z.ms = Math.round(performance.now() - t0); }).catch(e => { z.estado = 'error'; console.warn('zona', id, e); }); return z.promesa; }

  const tmp = new THREE.Vector3();
  function actualizar(dt, pos) {
    ZONAS.forEach(z => { if (z.estado === 'sin cargar' && pos && Math.hypot(pos.x - z.entrada.x, pos.z - z.entrada.z) < 40) cargar(z.id);
      z.anim.forEach(a => {
        if (a.tipo === 'rampa') { a.t += a.v * dt; if (a.t > 1) { a.t = 1; a.v *= -1; } if (a.t < 0) { a.t = 0; a.v *= -1; }
          const c = MA.rampa; a.o.position.copy(c.getPointAt(a.t)); c.getTangentAt(a.t, tmp); if (a.v < 0) tmp.negate(); a.o.rotation.y = Math.atan2(tmp.x, tmp.z); }
        else if (a.tipo === 'tren') { if (a.pausa > 0) { a.pausa -= dt; return; } const antes = a.x; a.x += a.v * dt; if (antes < fx - 4 && a.x >= fx - 4 && a.v > 0) a.pausa = 8; if (a.x > 190) a.x = -190; a.o.position.x = a.x; }
        else if (a.tipo === 'surcos') { a.t += dt * .04; const f = a.t % 2, ida = f < 1, u = ida ? f : 2 - f, fila = Math.floor(a.t / 2) % 4;
          a.o.position.set(gx - 12 + u * 32, 0, gz + 1.6 + fila * 6.4 - 3); a.o.rotation.y = ida ? Math.PI / 2 : -Math.PI / 2; }
      }); });
  }
  return { ZONAS, HUECOS, actualizar, cargar };
}
