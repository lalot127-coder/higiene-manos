// Personas animadas para los sub-mundos (módulo ES, 11/10/2026). Modelos "Mini Characters" de Kenney (CC0 1.0, sin
// modificar; ver assets/INVENTARIO_ASSETS.csv): 6 mujeres, 6 hombres y silla de ruedas, con animaciones incluidas
// (idle, walk, sprint, crouch, sit, pick-up, emote-yes/no, wheelchair-*). Cada modelo se descarga UNA vez (≈250 KB).
//   import { Personas } from '../../../motor/personas3d.js';
//   const P = new Personas(THREE, '../../../');                     base = ruta a la raíz del simulador
//   const p = await P.crear({ modelo: 'mujer-a', x, z, ry, anim: 'idle', silla: false, alto: 1.6, padre: scene });
//   p.anim('walk'); p.caminar([[x, z], ...], { vel: 1.4, correr: false }).then(...); p.decir('texto');
//   en el ciclo de cuadro: P.actualizar(dt)
// Si un modelo no carga (copias parciales sin assets), se usa una figura simple de reemplazo para no romper la escena.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const ARCHIVO = { 'mujer-a': 'character-female-a', 'mujer-b': 'character-female-b', 'mujer-c': 'character-female-c', 'mujer-d': 'character-female-d',
  'mujer-e': 'character-female-e', 'mujer-f': 'character-female-f', 'hombre-a': 'character-male-a', 'hombre-b': 'character-male-b',
  'hombre-c': 'character-male-c', 'hombre-d': 'character-male-d', 'hombre-e': 'character-male-e', 'hombre-f': 'character-male-f' };
export const MODELOS = Object.keys(ARCHIVO);

export class Personas {
  constructor(THREE, base = '') { this.THREE = THREE; this.base = base; this.cache = new Map(); this.lista = []; this.loader = new GLTFLoader(); }
  cargar(arch) {
    if (!this.cache.has(arch)) this.cache.set(arch, new Promise((ok, no) => this.loader.load(`${this.base}assets/personas/${arch}.glb`, ok, undefined, no)));
    return this.cache.get(arch);
  }
  async crear(o = {}) {
    const THREE = this.THREE, g = new THREE.Group(); g.position.set(o.x || 0, o.y || 0, o.z || 0); g.rotation.y = o.ry || 0;
    (o.padre || null)?.add(g);
    const p = new Persona(THREE, g, this);
    try {
      const gl = await this.cargar(ARCHIVO[o.modelo] || ARCHIVO['hombre-a']);
      const m = SkeletonUtils.clone(gl.scene);
      // tamaño real: la figura de Kenney mide ~1 unidad; se escala a la estatura pedida
      const b = new THREE.Box3().setFromObject(m), h = b.max.y - b.min.y || 1, s = (o.alto || 1.62) / h;
      m.scale.setScalar(s); m.position.y = -b.min.y * s;
      m.traverse(x => { if (x.isMesh) { x.castShadow = true; x.receiveShadow = false; x.frustumCulled = false; if (x.material) x.material.side = THREE.FrontSide; } });
      g.add(m); p.modelo = m; p.escala = s;
      p.mixer = new THREE.AnimationMixer(m); p.clips = Object.fromEntries(gl.animations.map(a => [a.name, a]));
      if (o.silla) { try { const sr = await this.cargar('wheelchair'); const w = sr.scene.clone(true); w.scale.setScalar(s); w.traverse(x => { if (x.isMesh) x.castShadow = true; }); g.add(w); p.silla = w; } catch (e) { } }
      p.anim(o.anim || (o.silla ? 'wheelchair-sit' : 'idle'));
    } catch (e) {
      // reemplazo simple (cápsula) si el modelo no está disponible
      const c = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.9, 6, 12), new THREE.MeshStandardMaterial({ color: o.color || 0x5B6B7C })); c.position.y = 0.75; g.add(c);
      const k = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), new THREE.MeshStandardMaterial({ color: 0xE0B48F })); k.position.y = 1.45; g.add(k);
    }
    if (o.chaleco) p.ponerChaleco(o.chaleco);
    if (o.etiqueta) p.etiqueta(o.etiqueta, o.colorEtiqueta);
    this.lista.push(p); return p;
  }
  actualizar(dt) { for (const p of this.lista) p.actualizar(dt); }
}

class Persona {
  constructor(THREE, grupo, P) { this.THREE = THREE; this.grupo = grupo; this.P = P; this.mixer = null; this.clips = {}; this.accion = null; this.ruta = []; this.vel = 1.4; }
  anim(nombre, fundido = 0.25) {
    if (!this.mixer) return; const clip = this.clips[nombre] || this.clips.idle; if (!clip) return;
    const a = this.mixer.clipAction(clip); if (a === this.accion) return;
    a.reset().fadeIn(fundido).play(); if (['die', 'pick-up', 'emote-yes', 'emote-no', 'jump'].includes(nombre)) { a.setLoop(this.THREE.LoopOnce, 1); a.clampWhenFinished = true; }
    if (this.accion) this.accion.fadeOut(fundido); this.accion = a;
  }
  // camina por puntos [[x, z], ...]; devuelve una promesa al llegar
  caminar(pts, o = {}) {
    this.ruta = pts.map(q => new this.THREE.Vector3(q[0], this.grupo.position.y, q[1])); this.vel = o.vel || (o.correr ? 2.6 : 1.4);
    this.anim(this.silla ? 'wheelchair-move-forward' : o.correr ? 'sprint' : 'walk');
    return new Promise(ok => { this._alLlegar = () => { this.anim(this.silla ? 'wheelchair-sit' : (o.alFinal || 'idle')); ok(); }; if (!pts.length) this._alLlegar(); });
  }
  mirarA(x, z) { this.grupo.rotation.y = Math.atan2(x - this.grupo.position.x, z - this.grupo.position.z); }
  actualizar(dt) {
    if (this.mixer) this.mixer.update(dt);
    if (this.ruta.length) {
      const d = this.ruta[0].clone().sub(this.grupo.position); d.y = 0; const L = d.length();
      if (L < 0.06) { this.ruta.shift(); if (!this.ruta.length && this._alLlegar) { const f = this._alLlegar; this._alLlegar = null; f(); } }
      else { d.normalize(); this.grupo.position.addScaledVector(d, Math.min(L, this.vel * dt));
        const obj = Math.atan2(d.x, d.z); let dr = obj - this.grupo.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); this.grupo.rotation.y += dr * Math.min(1, dt * 10); }
    }
  }
  // chaleco de brigada (color) sobre el torso: banda reflejante simple que se ve desde lejos
  ponerChaleco(color = 0xF57C00) {
    const THREE = this.THREE, s = (this.escala || 1.6) / 1.6, y = 0.62 * 1.62 * s / 1.62;
    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * s, 0.22 * s, 0.34 * s, 16, 1, true), new THREE.MeshStandardMaterial({ color, roughness: .5, side: THREE.DoubleSide }));
    v.position.y = this.modelo ? y : 0.95; v.scale.z = 0.8; this.grupo.add(v);
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.205 * s, 0.225 * s, 0.04 * s, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xE0E0E0, emissive: 0x666666, side: THREE.DoubleSide }));
    r.position.y = v.position.y - 0.06 * s; r.scale.z = 0.8; this.grupo.add(r); this.chaleco = v;
  }
  etiqueta(texto, fondo = '#154F90') {
    const THREE = this.THREE, cv = document.createElement('canvas'); cv.width = 512; cv.height = 96; const g = cv.getContext('2d');
    g.fillStyle = fondo; g.beginPath(); g.roundRect ? g.roundRect(0, 0, 512, 96, 30) : g.rect(0, 0, 512, 96); g.fill();
    g.fillStyle = '#fff'; g.font = 'bold 46px Calibri, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(texto, 256, 50);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true })); sp.scale.set(1.3, 0.24, 1); sp.position.y = 2.0; sp.renderOrder = 5;
    this.grupo.add(sp); this._etq = sp; return sp;
  }
}
