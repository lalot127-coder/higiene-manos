// Letreros de puertas y salas como SVG propio (módulo ES), con los colores de seguridad de la NOM-026-STPS-2008, Tabla 1:
//   rojo = paro, prohibición, material y equipo contra incendio · amarillo = advertencia de peligro (texto negro)
//   verde = condición segura, salidas y primeros auxilios · azul = obligación. Gris = puerta pendiente o próximamente.
// No son señales de seguridad: son letreros informativos de cada sala; el color indica la familia de riesgo del tema.
//   letreroSVG({titulo, sub, estado, color, senal}) → texto SVG
//   letreroTextura(THREE, opciones, alListo) → CanvasTexture (dibuja el SVG y encima el pictograma de Senales)
export const COLORES = { rojo: ['#D3122A', '#FFFFFF'], amarillo: ['#FFD100', '#111111'], verde: ['#00995C', '#FFFFFF'], azul: ['#0D6EB8', '#FFFFFF'], gris: ['#8A99A8', '#FFFFFF'], marino: ['#0E3A6B', '#FFFFFF'] };
export const ESTADOS = { '3d': 'SIMULADOR 3D', juego: 'JUEGO', sala: 'SALA DE MODELOS', pronto: 'PRÓXIMAMENTE', pendiente: 'PENDIENTE', bloqueado: 'SOLICITAR ACCESO', salida: 'SALIDA', info: 'BIENVENIDA', entrada: 'ENTRA CAMINANDO', vacio: '' };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function partir(t, max) { const pal = String(t).split(' '), l = ['']; pal.forEach(p => { if ((l[l.length - 1] + ' ' + p).trim().length > max && l[l.length - 1]) l.push(p); else l[l.length - 1] = (l[l.length - 1] + ' ' + p).trim(); }); return l.slice(0, 3); }
export function letreroSVG({ titulo, sub = '', estado = '3d', color = 'marino', senal = null, W = 640, H = 300 }) {
  const [fondo, tinta] = COLORES[color] || COLORES.marino, gris = estado === 'pronto' || estado === 'pendiente';
  const banda = gris ? COLORES.gris[0] : fondo, tBanda = gris ? '#fff' : tinta, x0 = senal ? 210 : 30;
  const lineas = partir(titulo, senal ? 18 : 24), fs = lineas.length > 2 ? 40 : 48;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="22" fill="#FFFFFF" stroke="${banda}" stroke-width="8"/>
  <rect x="4" y="${H - 74}" width="${W - 8}" height="70" rx="0" fill="${banda}"/><rect x="4" y="${H - 30}" width="${W - 8}" height="26" rx="22" fill="${banda}"/>
  ${senal ? `<rect x="24" y="24" width="168" height="168" rx="16" fill="#F4F7FA"/>` : ''}
  ${lineas.map((l, i) => `<text x="${x0}" y="${70 + i * (fs + 6)}" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="${fs}" fill="#0E3A6B">${esc(l)}</text>`).join('')}
  ${sub ? `<text x="${x0}" y="${H - 92}" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="28" fill="#5B6B7C">${esc(sub)}</text>` : ''}
  <text x="${W / 2}" y="${H - 26}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="38" fill="${tBanda}" letter-spacing="2">${esc(ESTADOS[estado] || estado)}</text>
</svg>`;
}
export function letreroTextura(THREE, op, alListo) {
  const W = op.W || 640, H = op.H || 300, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const img = new Image(); img.onload = () => { g.drawImage(img, 0, 0, W, H);
    if (op.senal && window.Senales) { const s = Senales.canvas(op.senal, 256); const k = 150 / Math.max(s.width, s.height); g.drawImage(s, 33 + (150 - s.width * k) / 2, 33 + (150 - s.height * k) / 2, s.width * k, s.height * k); }
    t.needsUpdate = true; alListo && alListo(t); };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(letreroSVG({ ...op, W, H }));
  return t;
}
