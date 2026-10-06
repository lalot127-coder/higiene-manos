// Navegación por rejilla con A* (módulo ES): el avatar rodea paredes y obstáculos y PREFIERE los caminos y pasillos
// marcados (rutas), en lugar de cruzar en línea recta. Se usa en el campus exterior, en los interiores y en las salas.
//   const nav = new Navegacion({ x0, z0, x1, z1, celda });
//   nav.bloquearCirculo(x, z, r) · nav.bloquearRect(cx, cz, w, d, ry) · nav.camino(cx, cz, w, d, ry, costo)  (costo < 1 = preferido)
//   nav.ruta(desde, hasta) → [Vector-like {x, z}]   (vacío si no hay paso)
export class Navegacion {
  constructor({ x0, z0, x1, z1, celda = 0.5, costoBase = 1 }) {
    Object.assign(this, { x0, z0, x1, z1, c: celda }); this.nx = Math.ceil((x1 - x0) / celda); this.nz = Math.ceil((z1 - z0) / celda);
    this.bloq = new Uint8Array(this.nx * this.nz); this.costo = new Float32Array(this.nx * this.nz).fill(costoBase);
  }
  idx(i, k) { return k * this.nx + i; }
  celda(x, z) { return [Math.floor((x - this.x0) / this.c), Math.floor((z - this.z0) / this.c)]; }
  centro(i, k) { return { x: this.x0 + (i + .5) * this.c, z: this.z0 + (k + .5) * this.c }; }
  dentro(i, k) { return i >= 0 && k >= 0 && i < this.nx && k < this.nz; }
  libre(x, z) { const [i, k] = this.celda(x, z); return this.dentro(i, k) && !this.bloq[this.idx(i, k)]; }
  // recorre las celdas de un rectángulo girado (cx, cz centro; w ancho en x local; d fondo en z local; ry giro)
  _rect(cx, cz, w, d, ry, fn) { const c = Math.cos(ry), s = Math.sin(ry), R = Math.hypot(w, d) / 2;
    const [i0, k0] = this.celda(cx - R, cz - R), [i1, k1] = this.celda(cx + R, cz + R);
    for (let k = Math.max(0, k0); k <= Math.min(this.nz - 1, k1); k++) for (let i = Math.max(0, i0); i <= Math.min(this.nx - 1, i1); i++) {
      const p = this.centro(i, k), dx = p.x - cx, dz = p.z - cz, lx = dx * c - dz * s, lz = dx * s + dz * c;
      if (Math.abs(lx) <= w / 2 && Math.abs(lz) <= d / 2) fn(this.idx(i, k)); } }
  bloquearRect(cx, cz, w, d, ry = 0, valor = 1) { this._rect(cx, cz, w, d, ry, j => this.bloq[j] = valor); }
  liberarRect(cx, cz, w, d, ry = 0) { this.bloquearRect(cx, cz, w, d, ry, 0); }
  camino(cx, cz, w, d, ry = 0, costo = .45) { this._rect(cx, cz, w, d, ry, j => this.costo[j] = Math.min(this.costo[j], costo)); }
  bloquearCirculo(x, z, r) { const [i0, k0] = this.celda(x - r, z - r), [i1, k1] = this.celda(x + r, z + r);
    for (let k = Math.max(0, k0); k <= Math.min(this.nz - 1, k1); k++) for (let i = Math.max(0, i0); i <= Math.min(this.nx - 1, i1); i++) { const p = this.centro(i, k); if (Math.hypot(p.x - x, p.z - z) <= r) this.bloq[this.idx(i, k)] = 1; } }
  bloquearAnillo(x, z, r0, r1, huecos = []) {   // muro circular con huecos [{a0, a1}] en radianes (atan2(x, z))
    const [i0, k0] = this.celda(x - r1, z - r1), [i1, k1] = this.celda(x + r1, z + r1);
    for (let k = Math.max(0, k0); k <= Math.min(this.nz - 1, k1); k++) for (let i = Math.max(0, i0); i <= Math.min(this.nx - 1, i1); i++) { const p = this.centro(i, k), dx = p.x - x, dz = p.z - z, r = Math.hypot(dx, dz);
      if (r < r0 || r > r1) continue; const a = Math.atan2(dx, dz); if (huecos.some(h => a >= h.a0 && a <= h.a1)) continue; this.bloq[this.idx(i, k)] = 1; } }
  // celda libre más cercana (por si el destino cae dentro de un obstáculo)
  cercana(i, k) { if (this.dentro(i, k) && !this.bloq[this.idx(i, k)]) return [i, k];
    for (let r = 1; r < 40; r++) for (let dk = -r; dk <= r; dk++) for (let di = -r; di <= r; di++) { if (Math.max(Math.abs(di), Math.abs(dk)) !== r) continue; const a = i + di, b = k + dk; if (this.dentro(a, b) && !this.bloq[this.idx(a, b)]) return [a, b]; }
    return null; }
  visible(a, b) {   // línea de vista entre dos puntos sin cruzar celdas bloqueadas ni salirse de una ruta preferida
    const L = Math.hypot(b.x - a.x, b.z - a.z), n = Math.ceil(L / (this.c * .5)); let ca = null;
    for (let t = 0; t <= n; t++) { const x = a.x + (b.x - a.x) * t / n, z = a.z + (b.z - a.z) * t / n, [i, k] = this.celda(x, z); if (!this.dentro(i, k) || this.bloq[this.idx(i, k)]) return false;
      const co = this.costo[this.idx(i, k)]; if (ca !== null && co > ca + .2) return false; ca = ca === null ? co : Math.min(ca, co); }
    return true; }
  ruta(desde, hasta, max = 60000) {
    let s = this.cercana(...this.celda(desde.x, desde.z)), e = this.cercana(...this.celda(hasta.x, hasta.z)); if (!s || !e) return [];
    const N = this.nx * this.nz, g = new Float32Array(N).fill(Infinity), de = new Int32Array(N).fill(-1), cerrado = new Uint8Array(N);
    const si = this.idx(...s), ei = this.idx(...e); g[si] = 0;
    const heap = [[0, si]]; const push = (f, j) => { heap.push([f, j]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    const minC = Math.min(...[.45, 1]); const h = j => { const i = j % this.nx, k = (j / this.nx) | 0; return Math.hypot(i - e[0], k - e[1]) * minC * .45; };
    let n = 0;
    while (heap.length && n++ < max) { const [, j] = pop(); if (cerrado[j]) continue; cerrado[j] = 1; if (j === ei) break;
      const i = j % this.nx, k = (j / this.nx) | 0;
      for (let dk = -1; dk <= 1; dk++) for (let di = -1; di <= 1; di++) { if (!di && !dk) continue; const a = i + di, b = k + dk; if (!this.dentro(a, b)) continue; const q = this.idx(a, b); if (this.bloq[q] || cerrado[q]) continue;
        if (di && dk && (this.bloq[this.idx(i + di, k)] || this.bloq[this.idx(i, k + dk)])) continue;   // no cortar esquinas
        const ng = g[j] + (di && dk ? 1.4142 : 1) * this.costo[q]; if (ng < g[q]) { g[q] = ng; de[q] = j; push(ng + h(q), q); } } }
    if (de[ei] === -1 && ei !== si) return [];
    const pts = []; for (let j = ei; j !== -1; j = de[j]) { pts.push(this.centro(j % this.nx, (j / this.nx) | 0)); if (j === si) break; }
    pts.reverse(); pts[pts.length - 1] = this.libre(hasta.x, hasta.z) ? { x: hasta.x, z: hasta.z } : pts[pts.length - 1];
    // suavizado: quitar puntos intermedios con línea de vista
    const out = [pts[0]]; let k = 0; while (k < pts.length - 1) { let m = pts.length - 1; while (m > k + 1 && !this.visible(pts[k], pts[m])) m--; out.push(pts[m]); k = m; }
    return out.slice(1);
  }
}
