// Exterior para simuladores de evacuación (módulo ES, 11/10/2026): pasto, banqueta, estacionamiento con autos, árboles,
// postes con cables, calle, edificios vecinos y PUNTO DE REUNIÓN señalizado (NOM-003-SEGOB-2011, 5.1).
// Modelos: kit "exterior" (Kenney, CC0; ver assets/INVENTARIO_ASSETS.csv). Si el kit no está (copias parciales), la escena
// sigue funcionando con pasto, banquetas y el punto de reunión.
//   import { patio } from '../../../motor/exterior3d.js';
//   const P = await patio(W, kit, { suelo:[x0,x1,z0,z1], ruta:[[x,z],...] (con flechas), banquetas:[[[x,z],[x,z]],...] (sin flechas), reunion:[x,z], estacionamiento:[x0,x1,z0,z1],
//                                   arboles:[[x,z,'arbol'],...], postes:[[x,z],...], calle:[z0,z1], edificios:[[x,z,ry,'edificio'],...] });
//   P.reunion (malla tocable), P.pasto (piso para el visor), P.flechas
// El punto de reunión se coloca en zona abierta: alejado de edificios, cables, postes y árboles (SGIRPC CDMX, tríptico
// "Taller para la evacuación y el repliegue en caso de sismos", 2022; registro_fuentes.md 11/10/2026).
export async function patio(W, kit, o) {
  const { THREE, M } = W; const scene = o.padre || W.scene;   // o.padre: grupo (p. ej. para ocultarlo en realidad mixta)
  const plano = (w, h, color, x, y, z, pbr, rep = 2) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M(color, { roughness: .95 })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z);
    m.userData.sinTextura = true; m.receiveShadow = true; scene.add(m);
    if (pbr && window.Realismo) m.material = Realismo.material(THREE, m.material, pbr, w / rep, h / rep);
    return m;
  };
  const [x0, x1, z0, z1] = o.suelo;
  const pasto = plano(x1 - x0, z1 - z0, 0x7FAF6A, (x0 + x1) / 2, -0.03, (z0 + z1) / 2, 'pasto', 3);
  // banqueta de concreto a lo largo de la ruta (segmentos de 1.8 m de ancho)
  const banq = M(0xCFCBC2, { roughness: .9 });
  const segs = []; for (let i = 0; i < o.ruta.length - 1; i++) segs.push([o.ruta[i], o.ruta[i + 1]]);
  for (const [a, b] of [...segs, ...(o.banquetas || [])]) {
    const [ax, az] = a, [bx, bz] = b, L = Math.hypot(bx - ax, bz - az);
    const s = new THREE.Mesh(new THREE.BoxGeometry(L + 1.8, 0.06, 1.8), banq); s.position.set((ax + bx) / 2, 0.0, (az + bz) / 2);
    s.rotation.y = -Math.atan2(bz - az, bx - ax); s.receiveShadow = true; s.userData.sinTextura = true; scene.add(s);
  }
  // flechas verdes en la banqueta (ruta de evacuación hacia el punto de reunión)
  const flechas = [], fm = new THREE.MeshBasicMaterial({ color: 0x00A651 });
  const fg = new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-0.18, -0.35), new THREE.Vector2(0.18, -0.35), new THREE.Vector2(0.18, 0.05), new THREE.Vector2(0.36, 0.05),
    new THREE.Vector2(0, 0.45), new THREE.Vector2(-0.36, 0.05), new THREE.Vector2(-0.18, 0.05)]));
  for (let i = 0; i < o.ruta.length - 1; i++) {
    const [ax, az] = o.ruta[i], [bx, bz] = o.ruta[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.floor(L / 3.5));
    for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, f = new THREE.Mesh(fg, fm); f.rotation.x = -Math.PI / 2; f.rotation.z = Math.atan2(-(bx - ax), -(bz - az));   // punta de la flecha = sentido de la ruta
      f.position.set(ax + (bx - ax) * t, 0.035, az + (bz - az) * t); scene.add(f); flechas.push(f); }
  }
  // calle
  if (o.calle) { const [c0, c1] = o.calle; plano(x1 - x0, c1 - c0, 0x55595E, (x0 + x1) / 2, -0.02, (c0 + c1) / 2, 'asfalto', 4);
    for (let x = x0 + 2; x < x1; x += 6) { const l = plano(3, 0.15, 0xF2F2F2, x, -0.012, (c0 + c1) / 2); l.material = new THREE.MeshBasicMaterial({ color: 0xEDEDED }); } }
  // estacionamiento con cajones y autos
  const autos = ['sedan', 'suv', 'hatchback', 'van', 'sedan', 'suv'];
  // los colores del Nature Kit se ven deslavados con el tono ACES: follaje verde y tronco café más naturales
  const TINTE = { leafsGreen: 0x4F9A3A, leafsDark: 0x3B7A2C, leafsFall: 0xC98A2E, woodBark: 0x7A5236, woodBarkDark: 0x5C3D27, grass: 0x5E9E46 };
  const poner = async (clave, x, z, ry = 0, s) => { if (!kit) return null; try { const g = await kit.poner({ kit: 'exterior', clave, x, z, ry, s, padre: scene });
    g.traverse(m => { if (m.isMesh && m.material && TINTE[m.material.name] !== undefined) { m.material = m.material.clone(); m.material.color.setHex(TINTE[m.material.name]); } }); return g; } catch (e) { return null; } };
  const tareas = [];
  if (o.estacionamiento) { const [e0, e1, f0, f1] = o.estacionamiento;
    plano(e1 - e0, f1 - f0, 0x5E6266, (e0 + e1) / 2, -0.015, (f0 + f1) / 2, 'asfalto', 4);
    let k = 0; for (let x = e0 + 1.6; x <= e1 - 1.4; x += 2.9) {
      const l = plano(0.12, 5, 0xffffff, x - 1.45, -0.01, f0 + 2.6); l.material = new THREE.MeshBasicMaterial({ color: 0xEDEDED });
      if ((k * 7) % 5 !== 2) tareas.push(poner(autos[k % autos.length], x, f0 + 2.6, (k % 2 ? Math.PI : 0)));
      k++; }
  }
  for (const [x, z, c] of (o.arboles || [])) tareas.push(poner(c || 'arbol', x, z, (x * 13 + z) % 6));
  for (const [x, z, c] of (o.arbustos || [])) tareas.push(poner(c || 'arbusto', x, z, (x + z) % 6));
  for (const [x, z, ry, c] of (o.edificios || [])) tareas.push(poner(c || 'edificio', x, z, ry || 0));
  for (const [x, z, ry, c] of (o.objetos || [])) tareas.push(poner(c, x, z, ry || 0));
  // postes de electricidad con cables (catenaria simple entre postes)
  const postes = o.postes || [];
  postes.forEach(([x, z, ry]) => tareas.push(poner('poste_electrico', x, z, ry ?? 0)));
  if (postes.length > 1) { const cm = new THREE.LineBasicMaterial({ color: 0x222222 });
    for (let i = 0; i < postes.length - 1; i++) for (const dz of [-1.2, 0, 1.2]) {
      const a = new THREE.Vector3(postes[i][0], 7.6, postes[i][1] + dz), b = new THREE.Vector3(postes[i + 1][0], 7.6, postes[i + 1][1] + dz);
      const pts = []; for (let t = 0; t <= 1.0001; t += 0.1) { const p = a.clone().lerp(b, t); p.y -= Math.sin(Math.PI * t) * 0.6; pts.push(p); }
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), cm)); } }
  // punto de reunión: círculo verde + señal en el piso + señal en poste (NOM-003-SEGOB-2011, 5.1)
  const [rx, rz] = o.reunion;
  const reunion = new THREE.Mesh(new THREE.CircleGeometry(2.6, 48), M(0x00995C, { roughness: .8 })); reunion.rotation.x = -Math.PI / 2; reunion.position.set(rx, 0.03, rz);
  reunion.userData.sinTextura = true; scene.add(reunion);
  if (window.Senales) { const cv = Senales.canvas('reunion', 256), t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.8), new THREE.MeshBasicMaterial({ map: t, transparent: true })); pl.rotation.x = -Math.PI / 2; pl.position.set(rx, 0.04, rz); scene.add(pl);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9 * cv.height / cv.width), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide })); s.position.set(rx + 3.0, 2.2, rz); s.rotation.y = -Math.PI / 2 + (o.giroSenal || 0); scene.add(s);
    const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 10), M(0x5B6B7C, { metalness: .6, roughness: .4 })); poste.position.set(rx + 3.02, 1.1, rz); scene.add(poste); }
  await Promise.all(tareas);
  return { reunion, pasto, flechas };
}
