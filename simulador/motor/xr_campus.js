// Solo se ofrece VR / realidad mixta en visores (Meta Quest, Pico…) y computadoras. En celulares Android el navegador
// dice "soporta VR" (modo Cardboard) y la pantalla se partía en dos sin ocupar todo el espacio (07/10/2026).
// Forzar en cualquier equipo: agregar ?xr=1 a la dirección.
window.CampusXR = window.CampusXR || (() => { const ua = navigator.userAgent || '';
  const visor = /OculusBrowser|Quest|Pico|Wolvic|Vive|SamsungBrowser\/.*VR/i.test(ua);
  const movil = !visor && (/Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (navigator.maxTouchPoints > 1 && matchMedia('(pointer: coarse)').matches));
  return { visor, movil, permitir: visor || !movil || /[?&]xr=1/.test(location.search) }; })();
// Realidad virtual (WebXR) para el campus, los interiores y las salas de módulos (módulo ES). Probado para el navegador
// del Meta Quest 3S; en computadora/celular sin visor no aparece el botón.
// - Rayo desde cada control (o mano: el pellizco cuenta como "select"). Apuntar al PISO + gatillo = TELETRANSPORTE
//   (sin desplazamiento continuo, para evitar mareo). Apuntar a puertas, sillas, señales, marcadores = tocarlos.
// - Joystick izquierda/derecha: giro por pasos de 30°.  - Las ventanas HTML no se ven en el visor → panel 3D.
//   const xr = crearXR({ THREE, renderer, camera, controls, contenedor, escena: () => scene, objetivos: () => [...],
//                        alTocar: hit => {}, alTeletransportar: punto => {}, yo: () => avatar, alCambiar: activo => {} })
//   xr.activo() · xr.panel(titulo, texto) · xr.colocar(pos, ry) (tras cambiar de escena o teletransportar por menú)
export function crearXR(o) {
  const { THREE, renderer, camera } = o; let sesion = null;
  const rig = new THREE.Group(); rig.name = 'rig_xr'; const ray = new THREE.Raycaster(), mtx = new THREE.Matrix4();
  renderer.xr.enabled = true; renderer.xr.setReferenceSpaceType('local-floor');
  const retic = new THREE.Mesh(new THREE.RingGeometry(.22, .3, 32), new THREE.MeshBasicMaterial({ color: 0x3FA7C6, transparent: true, opacity: .9 })); retic.rotation.x = -Math.PI / 2; retic.visible = false;
  const controles = [0, 1].map(i => { const c = renderer.xr.getController(i);
    const linea = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .8 }));
    linea.scale.z = 6; c.add(linea); const punta = new THREE.Mesh(new THREE.SphereGeometry(.012, 8, 6), new THREE.MeshBasicMaterial({ color: 0x3FA7C6 })); c.add(punta);
    c.addEventListener('connected', e => { c.userData.fuente = e.data; }); c.addEventListener('disconnected', () => { c.userData.fuente = null; });
    c.addEventListener('select', () => seleccionar(c)); rig.add(c); return { c, linea }; });
  let panelMesh = null;
  function lanzar(c) { mtx.identity().extractRotation(c.matrixWorld); ray.ray.origin.setFromMatrixPosition(c.matrixWorld); ray.ray.direction.set(0, 0, -1).applyMatrix4(mtx); ray.far = 60;
    const objs = panelMesh ? [panelMesh] : o.objetivos(); return ray.intersectObjects(objs, true)[0]; }
  function seleccionar(c) { const h = lanzar(c); if (!h) return;
    if (panelMesh && (h.object === panelMesh || panelMesh.children.includes(h.object))) { cerrarPanel(); return; }
    if (h.object.userData.piso) { o.alTeletransportar(h.point.clone().setY(0)); return; } o.alTocar(h); }
  function colocar(pos, ry) { rig.position.set(pos.x, 0, pos.z); if (ry !== undefined) rig.rotation.y = ry; }
  function montar() { const sc = o.escena(); if (rig.parent !== sc) sc.add(rig); if (retic.parent !== sc) sc.add(retic); }
  // ---------------- botón
  const btn = document.createElement('button'); btn.className = 'sec'; btn.id = 'bVR'; btn.textContent = '🥽 VR'; btn.title = 'Entrar en realidad virtual (Meta Quest)'; btn.style.display = 'none';
  if (o.contenedor) o.contenedor.prepend(btn);
  if (navigator.xr && navigator.xr.isSessionSupported && window.CampusXR.permitir) navigator.xr.isSessionSupported('immersive-vr').then(ok => { if (ok) btn.style.display = ''; }).catch(() => { });
  btn.onclick = async () => { if (sesion) { sesion.end(); return; }
    try { sesion = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] });
      await renderer.xr.setSession(sesion); } catch (e) { sesion = null; alert('No se pudo iniciar la realidad virtual: ' + e.message); } };
  renderer.xr.addEventListener('sessionstart', () => { const yo = o.yo(); montar(); camera.position.set(0, 0, 0); camera.rotation.set(0, 0, 0); rig.add(camera);
    colocar(yo.position, yo.rotation.y + Math.PI); yo.visible = false; if (o.controls) o.controls.enabled = false; btn.textContent = '🥽 Salir VR'; o.alCambiar && o.alCambiar(true); });
  renderer.xr.addEventListener('sessionend', () => { sesion = null; const yo = o.yo(); rig.remove(camera); o.escena().add(camera); yo.visible = true; cerrarPanel();
    if (o.controls) o.controls.enabled = true; btn.textContent = '🥽 VR'; o.alCambiar && o.alCambiar(false); });
  // ---------------- panel 3D (sustituye a las ventanas HTML dentro del visor)
  function panel(titulo, texto) { cerrarPanel(); const W = 1024, Hh = 720, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const g = cv.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, Hh); g.fillStyle = '#0E3A6B'; g.fillRect(0, 0, W, 96); g.fillStyle = '#fff'; g.font = '900 46px Arial'; g.fillText(String(titulo).slice(0, 40), 28, 64);
    g.fillStyle = '#1B2633'; g.font = '34px Arial'; let y = 150; const palabras = String(texto).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' '); let l = '';
    for (const p of palabras) { if (g.measureText(l + p).width > W - 60) { g.fillText(l, 30, y); y += 44; l = ''; if (y > Hh - 90) break; } l += p + ' '; } if (y <= Hh - 90) g.fillText(l, 30, y);
    g.fillStyle = '#3FA7C6'; g.fillRect(0, Hh - 70, W, 70); g.fillStyle = '#fff'; g.font = '900 34px Arial'; g.fillText('Apunta aquí y presiona el gatillo para cerrar', 30, Hh - 24);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; panelMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.3, .91), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }));
    const fr = new THREE.Vector3(0, 0, -1.4).applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion())); fr.y = 0; fr.setLength(1.4);
    panelMesh.position.copy(camera.getWorldPosition(new THREE.Vector3())).add(fr); panelMesh.lookAt(camera.getWorldPosition(new THREE.Vector3())); o.escena().add(panelMesh); }
  function cerrarPanel() { if (panelMesh) { panelMesh.parent && panelMesh.parent.remove(panelMesh); panelMesh = null; } }
  // ---------------- cada cuadro: retícula y giro por pasos
  let girando = false;
  function actualizar() { if (!renderer.xr.isPresenting) return; montar(); retic.visible = false;
    for (const { c, linea } of controles) { const h = lanzar(c); linea.scale.z = h ? h.distance : 6; if (h && h.object.userData.piso && !panelMesh) { retic.visible = true; retic.position.copy(h.point).setY(h.point.y + .02); } }
    const fuentes = sesion ? [...sesion.inputSources] : []; let eje = 0; fuentes.forEach(f => { const ax = f.gamepad && f.gamepad.axes; if (ax && ax.length >= 4 && Math.abs(ax[2]) > Math.abs(eje)) eje = ax[2]; });
    if (Math.abs(eje) > .7 && !girando) { girando = true; const cam = camera.getWorldPosition(new THREE.Vector3()); const d = -Math.sign(eje) * Math.PI / 6;
      rig.position.sub(cam).applyAxisAngle(new THREE.Vector3(0, 1, 0), d).add(cam); rig.rotation.y += d; } if (Math.abs(eje) < .3) girando = false;
    const yo = o.yo(); const cam = camera.getWorldPosition(new THREE.Vector3()); yo.position.set(cam.x, 0, cam.z); }
  return { activo: () => renderer.xr.isPresenting, panel, cerrarPanel, colocar, actualizar, rig, boton: btn };
}
