// Cargador de modelos .glb del campus (módulo ES). Carga diferida: cada kit (assets/<kit>/<kit>.glb) se descarga
// UNA vez y solo cuando se necesita; cada pieza es un nodo con nombre (clave) dentro del kit.
//   import { Kit3D } from './kit3d.js';
//   const k = new Kit3D(THREE, base);                 base = ruta relativa a la raíz del simulador ('' o '../../')
//   const obj = await k.pieza('mina-abierta', 'camion');   // clon listo para colocar (apoyado en y=0)
//   k.precargar(['mina-abierta']); k.estado('mina-abierta')  → 'sin cargar' | 'cargando' | 'listo' | 'error'
//   k.tiempos → { kit: ms }  (para el reporte de tiempos de carga)
// Compresión: EXT_meshopt_compression + KHR_mesh_quantization + EXT_texture_webp (soportados por three r160).
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

// Cambiar VERSION cada vez que se regeneren los .glb (evita que el navegador use copias viejas en caché).
export const VERSION = '2026-10-05c';
export class Kit3D {
  constructor(THREE, base = '') {
    this.THREE = THREE; this.base = base; this.kits = new Map(); this.est = new Map(); this.tiempos = {};
    this.loader = new GLTFLoader(); this.loader.setMeshoptDecoder(MeshoptDecoder);
  }
  url(kit) { return `${this.base}assets/${kit}/${kit}.glb?v=${VERSION}`; }
  estado(kit) { return this.est.get(kit) || 'sin cargar'; }
  cargar(kit) {
    if (this.kits.has(kit)) return this.kits.get(kit);
    const t0 = performance.now(); this.est.set(kit, 'cargando');
    const p = new Promise((ok, no) => this.loader.load(this.url(kit), g => {
      const piezas = {};
      // glTF toma metalness = 1 cuando el modelo no lo declara: sin mapa de reflejos se ve negro → se baja a un valor mate
      const ajustar = m => { if (!m) return; m.side = this.THREE.FrontSide; if (m.metalness > .5 && !m.metalnessMap) { m.metalness = .1; m.roughness = Math.max(m.roughness ?? 1, .6); } };
      g.scene.children.forEach(n => { piezas[n.name] = n; n.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; (Array.isArray(o.material) ? o.material : [o.material]).forEach(ajustar); } }); });
      this.tiempos[kit] = Math.round(performance.now() - t0); this.est.set(kit, 'listo'); ok(piezas);
    }, undefined, e => { this.est.set(kit, 'error'); console.warn('No se pudo cargar el kit', kit, e); no(e); }));
    this.kits.set(kit, p); return p;
  }
  precargar(lista) { lista.forEach(k => this.cargar(k).catch(() => { })); }
  async pieza(kit, clave) {
    const piezas = await this.cargar(kit); const n = piezas[clave];
    if (!n) { console.warn('Pieza no encontrada', kit, clave); return new this.THREE.Group(); }
    const c = n.clone(true); c.position.set(0, 0, 0); c.rotation.set(0, 0, 0); c.scale.copy(n.scale);
    // el nodo trae su escala real y su desplazamiento para quedar apoyado en el piso: se conserva dentro de un grupo
    const g = new this.THREE.Group(); c.position.copy(n.position); g.add(c); g.name = clave; return g;
  }
  // coloca una pieza: {kit, clave, x, y, z, ry, s, padre}
  async poner(o) {
    const g = await this.pieza(o.kit, o.clave); g.position.set(o.x || 0, o.y || 0, o.z || 0); g.rotation.y = o.ry || 0;
    if (o.s) g.scale.setScalar(o.s); (o.padre || null)?.add(g); return g;
  }
}
