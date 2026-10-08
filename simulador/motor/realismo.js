// Gráficos más realistas para el campus y todos los sub-mundos (07/10/2026). Script clásico.
//   Realismo.aplicar(THREE, renderer, scene, { sol, hemi, radio, cielo, sombras })
// · Tono "cinematográfico" (ACES) y color sRGB correcto.
// · Mapa de entorno (reflejos suaves en metales, vidrio y pisos) generado en el propio navegador (RoomEnvironment de
//   Three.js, sin descargar imágenes).
// · Sombras suaves del sol (en computadora y visor/celular de gama media se ajusta la resolución).
// · Cielo con degradado (exteriores).
// Calidad automática: 'alta' en computadora, 'media' en celular/visor. Forzar: localStorage campus_calidad = alta|media|baja
// o agregar ?calidad=baja a la dirección (para equipos lentos).
(function () {
  const ua = navigator.userAgent || '';
  const movil = /Android|iPhone|iPad|iPod|Mobile/i.test(ua), visor = /OculusBrowser|Quest|Pico/i.test(ua);
  let calidad = movil || visor ? 'media' : 'alta';
  try { const q = new URLSearchParams(location.search).get('calidad') || localStorage.getItem('campus_calidad'); if (['alta', 'media', 'baja'].includes(q)) calidad = q; } catch (e) { }

  function cielo(THREE, arriba = '#4F8FC9', horizonte = '#D6EAF4', suelo = '#E7ECEF') {
    const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d');
    const d = g.createLinearGradient(0, 0, 0, 256); d.addColorStop(0, arriba); d.addColorStop(0.48, horizonte); d.addColorStop(0.52, horizonte); d.addColorStop(1, suelo);
    g.fillStyle = d; g.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.mapping = THREE.EquirectangularReflectionMapping; return t;
  }
  function sombras(scene) {
    scene.traverse(m => { if (!m.isMesh || m.userData.sinSombra) return; const mt = Array.isArray(m.material) ? m.material[0] : m.material;
      if (!mt || mt.transparent || mt.type === 'MeshBasicMaterial' || mt.type === 'SpriteMaterial') return;
      m.castShadow = true; m.receiveShadow = true; });
  }
  async function aplicar(THREE, renderer, scene, o = {}) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = o.exposicion ?? 1.08;
    if (o.cielo) scene.background = cielo(THREE);
    if (calidad === 'baja') return;
    if (o.sol && o.sombras !== false && !(o.soloAlta && calidad !== 'alta')) {
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      const s = o.sol, t = calidad === 'alta' ? 2048 : 1024, r = o.radio || 9;
      s.castShadow = true; s.shadow.mapSize.set(t, t); Object.assign(s.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 0.5, far: r * 6 });
      s.shadow.camera.updateProjectionMatrix(); s.shadow.bias = -0.0004; s.shadow.normalBias = 0.03; s.shadow.radius = 3;
      if (!s.target.parent) scene.add(s.target);
      sombras(scene); setTimeout(() => sombras(scene), 1500); setInterval(() => sombras(scene), 4000);   // objetos que aparecen después
    }
    try {
      const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
      const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose();
      if (o.hemi) o.hemi.intensity *= 0.65;   // el entorno ya aporta luz ambiental
    } catch (e) { }
  }
  // ---- texturas PBR (ambientCG, CC0; ver assets/INVENTARIO_ASSETS.csv): pisos y muros grandes de color liso pasan a tener
  // material real (color + relieve + rugosidad). Conserva el color original como tinte. base = ruta a la raíz del simulador.
  const BASE_REAL = document.currentScript ? new URL('../', document.currentScript.src).href : '';
  const COPIA = /\/simulador\/$/.test(BASE_REAL);
  const cacheTex = {};
  function cargar(THREE, nombre, tipo) {
    const k = nombre + tipo; if (!cacheTex[k]) { const t = new THREE.TextureLoader().load(`${BASE_REAL}assets/texturas/pbr/${nombre}_${tipo}.webp`);
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; if (tipo === 'color') t.colorSpace = THREE.SRGBColorSpace; cacheTex[k] = t; }
    return cacheTex[k];
  }
  function material(THREE, mat, nombre, rx, ry, conColor = true) {
    if (COPIA) return mat;   // copias parciales del simulador en otros repositorios: no traen las texturas
    if (calidad === 'baja' || !mat || !mat.isMeshStandardMaterial || mat.map || mat.userData.pbr) return mat;
    const m = mat.clone(); m.userData.pbr = nombre;
    const rep = t => { const c = t.clone(); c.needsUpdate = true; c.repeat.set(rx, ry); return c; };
    if (conColor) { m.map = rep(cargar(THREE, nombre, 'color')); m.color.lerp(new THREE.Color(0xffffff), 0.55); }
    m.normalMap = rep(cargar(THREE, nombre, 'normal')); m.normalScale = new THREE.Vector2(0.8, 0.8);
    m.roughnessMap = rep(cargar(THREE, nombre, 'rugosidad')); m.roughness = 1; m.metalness = Math.min(m.metalness, 0.05);
    m.needsUpdate = true; return m;
  }
  // texturizar(THREE, scene, {piso: 'azulejo'|'concreto_pulido'|'madera'|'alfombra'|'pasto'|'asfalto', muro: 'yeso'})
  // las copias parciales del simulador (otros repositorios) pueden no traer las texturas: se comprueba antes de usarlas
  let hayTex = null;
  const probar = () => hayTex || (hayTex = COPIA ? Promise.resolve(false) : fetch(`${BASE_REAL}assets/texturas/pbr/yeso_normal.webp`, { method: 'HEAD' }).then(r => r.ok).catch(() => false));
  function texturizar(THREE, scene, o = {}) { if (calidad !== 'baja') probar().then(ok => { if (ok) texturizarYa(THREE, scene, o); }); }
  function texturizarYa(THREE, scene, o) {
    let n = 0; const s = new THREE.Vector3();
    scene.updateMatrixWorld(true);
    scene.traverse(m => {
      if (!m.isMesh || !m.geometry || m.userData.sinTextura || Array.isArray(m.material)) return;
      const g = m.geometry, p = g.parameters || {};
      if (g.type === 'PlaneGeometry' && o.piso && Math.abs(Math.abs(m.rotation.x) - Math.PI / 2) < 0.01) {
        m.getWorldScale(s); const w = p.width * s.x, h = p.height * s.y;
        if (w * h >= 6) { m.material = material(THREE, m.material, o.piso, w / 2, h / 2); n++; }
      } else if (g.type === 'BoxGeometry' && o.muro) {
        m.getWorldScale(s); const d = [p.width * s.x, p.height * s.y, p.depth * s.z];
        const delgado = Math.min(d[0], d[2]), largo = Math.max(d[0], d[2]);
        if (delgado < 0.3 && largo >= 2.5 && d[1] >= 2.2) { m.material = material(THREE, m.material, o.muro, largo / 2.5, d[1] / 2.5, false); n++; }
      }
    });
    return n;
  }
  window.Realismo = { aplicar, sombras, cielo, texturizar, material, calidad: () => calidad };
})();
