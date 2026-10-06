// Señales de seguridad dibujadas en canvas conforme a los colores y formas verificados (script clásico):
//   NOM-026-STPS-2008 (DOF 25/11/2008): Tabla 1 colores, Tabla 3 formas, Apéndices A (prohibición), B (obligación),
//   C (precaución) y D (información: D 1 equipo contra incendio, D 2 salidas y primeros auxilios, D 3 accesibilidad).
//   NOM-003-SEGOB-2011 (DOF 23/12/2011): 5.1 informativas, 5.2 informativas de emergencia, 6.2 Tablas 1-2, 6.3 Tabla 3.
// Los símbolos son representaciones didácticas simplificadas del "contenido de imagen" que describe cada norma.
//   Senales.LISTA            → [{id, nombre, tipo, norma, significado}]
//   Senales.canvas(id, px)   → canvas con la señal
//   Senales.dataURL(id, px)  → imagen PNG (para <img>)
(function () {
const VERDE = '#00995C', ROJO = '#D3122A', AZUL = '#0D6EB8', AMARILLO = '#FFD100', NEGRO = '#111111', BLANCO = '#FFFFFF';
const N26 = 'NOM-026-STPS-2008', N03 = 'NOM-003-SEGOB-2011';
const LISTA = [
  { id: 'ruta', nombre: 'Ruta de evacuación', tipo: 'Informativa (verde)', norma: `${N03}, 5.1 · ${N26}, Apéndice D 2`, significado: 'Indica la dirección que debes seguir para salir en una emergencia. Fondo verde, flecha blanca (condición segura).', ancho: 2 },
  { id: 'salida', nombre: 'Salida de emergencia', tipo: 'Informativa (verde)', norma: `${N03}, 5.1 · ${N26}, Apéndice D 2`, significado: 'Ubica una salida de emergencia: silueta humana avanzando hacia la salida, con flecha direccional.', ancho: 2 },
  { id: 'reunion', nombre: 'Punto de reunión', tipo: 'Informativa (verde)', norma: `${N03}, 5.1`, significado: 'Lugar donde se concentran las personas al evacuar: cuatro flechas equidistantes dirigidas a un punto.' },
  { id: 'menor_riesgo', nombre: 'Zona de menor riesgo', tipo: 'Informativa (verde)', norma: `${N03}, 5.1`, significado: 'Ubica una zona de menor riesgo dentro del inmueble: silueta humana resguardándose.' },
  { id: 'primeros', nombre: 'Primeros auxilios', tipo: 'Informativa (verde)', norma: `${N03}, 5.1 · ${N26}, Apéndice D 2`, significado: 'Ubica el puesto donde se brindan los primeros auxilios: cruz equidistante blanca sobre verde.' },
  { id: 'extintor', nombre: 'Extintor', tipo: 'Informativa de emergencia (rojo)', norma: `${N03}, 5.2 · ${N26}, D.1.1`, significado: 'Ubicación de un extintor. El rojo identifica material y equipo contra incendio.' },
  { id: 'hidrante', nombre: 'Hidrante', tipo: 'Informativa de emergencia (rojo)', norma: `${N03}, 5.2 · ${N26}, D.1.2`, significado: 'Ubicación de un hidrante (equipo contra incendio).' },
  { id: 'alarma', nombre: 'Alarma', tipo: 'Informativa de emergencia (rojo)', norma: `${N03}, 5.2`, significado: 'Ubicación de un dispositivo de activación de alarma: timbre con ondas sonoras.' },
  { id: 'telefono', nombre: 'Teléfono de emergencia', tipo: 'Informativa de emergencia (rojo)', norma: `${N03}, 5.2`, significado: 'Ubicación de un teléfono de emergencia: silueta de un auricular.' },
  { id: 'accesible', nombre: 'Uso exclusivo: accesibilidad', tipo: 'Informativa (azul)', norma: `${N03}, 5.1 · ${N26}, D.3`, significado: 'Rutas, espacios o servicios accesibles para personas con discapacidad.' },
  { id: 'informacion', nombre: 'Módulo de información', tipo: 'Informativa (azul)', norma: `${N03}, 5.1`, significado: 'Ubicación de un módulo de información: signo de interrogación.' },
  { id: 'no_fumar', nombre: 'Prohibido fumar', tipo: 'Prohibición', norma: `${N26}, A.1`, significado: 'Círculo con banda roja y diagonal, fondo blanco y símbolo negro: cigarro encendido.' },
  { id: 'no_llama', nombre: 'Prohibido generar llama abierta', tipo: 'Prohibición', norma: `${N26}, A.2`, significado: 'Prohibido generar llama abierta e introducir objetos incandescentes: cerillo encendido.' },
  { id: 'no_paso', nombre: 'Prohibido el paso', tipo: 'Prohibición', norma: `${N26}, A.3`, significado: 'Prohibido el paso: silueta humana caminando.' },
  { id: 'casco', nombre: 'Uso obligatorio de casco', tipo: 'Obligación (azul)', norma: `${N26}, B.2`, significado: 'Círculo azul con símbolo blanco: cabeza humana portando casco.' },
  { id: 'auditiva', nombre: 'Uso obligatorio de protección auditiva', tipo: 'Obligación (azul)', norma: `${N26}, B.3`, significado: 'Cabeza humana portando protección auditiva.' },
  { id: 'ocular', nombre: 'Uso obligatorio de protección ocular', tipo: 'Obligación (azul)', norma: `${N26}, B.4`, significado: 'Cabeza humana portando anteojos.' },
  { id: 'guantes', nombre: 'Uso obligatorio de guantes', tipo: 'Obligación (azul)', norma: `${N26}, B.6`, significado: 'Un par de guantes de protección.' },
  { id: 'prec_general', nombre: 'Precaución (indicación general)', tipo: 'Precaución (amarillo)', norma: `${N26}, C.1`, significado: 'Triángulo amarillo con banda y símbolo negros: signo de admiración.' },
  { id: 'resbaloso', nombre: 'Riesgo por superficie resbalosa', tipo: 'Precaución (amarillo)', norma: `${N26}, C.15`, significado: 'Silueta de persona cayendo sobre una superficie resbalosa.' },
  { id: 'electrico', nombre: 'Advertencia de riesgo eléctrico', tipo: 'Precaución (amarillo)', norma: `${N26}, C.7`, significado: 'Flecha quebrada en posición vertical hacia abajo.' },
  { id: 'inflamable', nombre: 'Precaución, materiales inflamables', tipo: 'Precaución (amarillo)', norma: `${N26}, C.4`, significado: 'Imagen de flama sobre triángulo amarillo.' },
  // agregadas para los módulos de alturas, espacios confinados, seguridad eléctrica, LOTO y extintores (05/10/2026)
  { id: 'arnes', nombre: 'Uso obligatorio de arnés de seguridad', tipo: 'Obligación (azul)', norma: `${N26}, B.9`, significado: 'Círculo azul con símbolo blanco: silueta humana con arnés y línea de sujeción.' },
  { id: 'cara', nombre: 'Uso obligatorio de protección de la cara', tipo: 'Obligación (azul)', norma: `${N26}, B.10`, significado: 'Círculo azul con símbolo blanco: cabeza humana con careta.' },
  { id: 'calzado', nombre: 'Uso obligatorio de calzado de protección', tipo: 'Obligación (azul)', norma: `${N26}, B.5`, significado: 'Círculo azul con símbolo blanco: un par de botas.' },
  { id: 'respiratoria', nombre: 'Uso obligatorio de protección respiratoria', tipo: 'Obligación (azul)', norma: `${N26}, B.7`, significado: 'Círculo azul con símbolo blanco: cabeza humana con respirador.' },
  { id: 'caida', nombre: 'Precaución, caída a desnivel', tipo: 'Precaución (amarillo)', norma: `${N26}, C.13`, significado: 'Triángulo amarillo con silueta humana cayendo de un escalón o borde.' },
  { id: 'obstaculos', nombre: 'Precaución, obstáculos', tipo: 'Precaución (amarillo)', norma: `${N26}, C.12`, significado: 'Triángulo amarillo con silueta humana tropezando con un obstáculo.' },
  { id: 'montacargas', nombre: 'Precaución, circulación de montacargas', tipo: 'Precaución (amarillo)', norma: `${N26}, C.17`, significado: 'Triángulo amarillo con la silueta de un montacargas.' },
  { id: 'no_agua', nombre: 'No utilizar agua como agente extinguidor', tipo: 'Prohibición', norma: `${N26}, A.8`, significado: 'Círculo con banda roja y diagonal, fondo blanco: recipiente vertiendo agua sobre una flama.' },
];
const POR_ID = Object.fromEntries(LISTA.map(s => [s.id, s]));

// ------------------------------------------------------------------ utilidades de dibujo
function persona(g, x, y, s, pose = 'corre', color = BLANCO) {
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = color; g.strokeStyle = color; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = 15;
  const L = (pts) => { g.beginPath(); g.moveTo(...pts[0]); pts.slice(1).forEach(p => g.lineTo(...p)); g.stroke(); };
  if (pose === 'corre') { g.beginPath(); g.arc(12, -62, 13, 0, 7); g.fill(); L([[6, -42], [-8, 4]]); L([[4, -36], [24, -20], [38, -30]]); L([[4, -36], [-14, -22], [-28, -32]]);
    L([[-8, 4], [14, 22], [10, 46]]); L([[-8, 4], [-22, 26], [-42, 30]]); }
  else if (pose === 'camina') { g.beginPath(); g.arc(0, -62, 13, 0, 7); g.fill(); L([[0, -42], [0, 4]]); L([[0, -36], [16, -10]]); L([[0, -36], [-14, -12]]);
    L([[0, 4], [14, 46]]); L([[0, 4], [-12, 46]]); }
  else if (pose === 'resbala') { g.beginPath(); g.arc(-26, -40, 13, 0, 7); g.fill(); L([[-16, -26], [16, 0]]); L([[-10, -22], [-34, -8]]); L([[-6, -18], [10, -44]]);
    L([[16, 0], [44, -10]]); L([[16, 0], [30, 24], [52, 20]]); g.lineWidth = 6; L([[-52, 46], [60, 46]]); }
  else if (pose === 'resguarda') { g.beginPath(); g.arc(0, -50, 13, 0, 7); g.fill(); g.lineWidth = 20; L([[0, -30], [0, 10]]); g.lineWidth = 12; L([[-8, 10], [-8, 46]]); L([[8, 10], [8, 46]]);
    L([[-10, -28], [-18, 6]]); L([[10, -28], [18, 6]]); }
  g.restore();
}
function flecha(g, x1, y1, x2, y2, grosor, color = BLANCO) {
  const a = Math.atan2(y2 - y1, x2 - x1), c = grosor * 1.6; g.save(); g.strokeStyle = color; g.fillStyle = color; g.lineWidth = grosor;
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2 - Math.cos(a) * c, y2 - Math.sin(a) * c); g.stroke();
  g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - Math.cos(a - 0.6) * c * 1.6, y2 - Math.sin(a - 0.6) * c * 1.6); g.lineTo(x2 - Math.cos(a + 0.6) * c * 1.6, y2 - Math.sin(a + 0.6) * c * 1.6); g.closePath(); g.fill(); g.restore();
}
function flama(g, x, y, s, color) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = color; g.beginPath();
  g.moveTo(0, 40); g.bezierCurveTo(-34, 40, -38, 6, -18, -14); g.bezierCurveTo(-14, 0, -6, 2, -4, -6); g.bezierCurveTo(-8, -26, 4, -40, 10, -50);
  g.bezierCurveTo(12, -30, 36, -18, 32, 10); g.bezierCurveTo(30, 30, 16, 40, 0, 40); g.fill(); g.restore(); }
function aviso(g, txt, W, H, color = BLANCO) { g.fillStyle = color; let fs = H * 0.12; g.font = `900 ${fs}px Arial, sans-serif`;
  while (g.measureText(txt).width > W * 0.9 && fs > 8) { fs -= 1; g.font = `900 ${fs}px Arial, sans-serif`; } g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, W / 2, H * 0.88); }
function rect(g, W, H, color) { g.fillStyle = color; g.fillRect(0, 0, W, H); g.strokeStyle = BLANCO; g.lineWidth = W * 0.02; g.strokeRect(W * 0.03, W * 0.03, W - W * 0.06, H - W * 0.06); }

// ------------------------------------------------------------------ cada señal
const DIB = {
  ruta(g, W, H) { rect(g, W, H, VERDE); flecha(g, W * 0.18, H * 0.4, W * 0.78, H * 0.4, H * 0.13); g.fillStyle = BLANCO; g.font = `900 ${H * 0.16}px Arial`; g.textAlign = 'center'; g.fillText('1', W * 0.88, H * 0.56); aviso(g, 'RUTA DE EVACUACIÓN', W, H); },
  salida(g, W, H) { rect(g, W, H, VERDE); g.strokeStyle = BLANCO; g.lineWidth = H * 0.05; g.strokeRect(W * 0.08, H * 0.12, W * 0.18, H * 0.58); flecha(g, W * 0.6, H * 0.42, W * 0.32, H * 0.42, H * 0.07); persona(g, W * 0.76, H * 0.5, H / 230); aviso(g, 'SALIDA DE EMERGENCIA', W, H); },
  reunion(g, W, H) { rect(g, W, H, VERDE); const c = [W / 2, H * 0.4]; g.fillStyle = BLANCO; g.beginPath(); g.arc(c[0], c[1], W * 0.06, 0, 7); g.fill();
    [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => flecha(g, c[0] + dx * W * 0.34, c[1] + dy * W * 0.3, c[0] + dx * W * 0.1, c[1] + dy * W * 0.1, W * 0.04)); aviso(g, 'PUNTO DE REUNIÓN', W, H); },
  menor_riesgo(g, W, H) { rect(g, W, H, VERDE); g.strokeStyle = BLANCO; g.lineWidth = W * 0.05; g.beginPath(); g.moveTo(W * 0.15, H * 0.42); g.lineTo(W / 2, H * 0.12); g.lineTo(W * 0.85, H * 0.42); g.stroke();
    persona(g, W / 2, H * 0.5, W / 260, 'resguarda'); aviso(g, 'ZONA DE MENOR RIESGO', W, H); },
  primeros(g, W, H) { rect(g, W, H, VERDE); g.fillStyle = BLANCO; const a = W * 0.14, c = [W / 2, H * 0.42]; g.fillRect(c[0] - a / 2, c[1] - a * 1.6, a, a * 3.2); g.fillRect(c[0] - a * 1.6, c[1] - a / 2, a * 3.2, a); aviso(g, 'PRIMEROS AUXILIOS', W, H); },
  extintor(g, W, H) { rect(g, W, H, ROJO); g.fillStyle = BLANCO; const x = W * 0.42, y = H * 0.2; g.beginPath(); g.roundRect(x, y + H * 0.1, W * 0.17, H * 0.52, W * 0.07); g.fill();
    g.fillRect(x + W * 0.05, y, W * 0.07, H * 0.11); g.strokeStyle = BLANCO; g.lineWidth = W * 0.025; g.beginPath(); g.moveTo(x + W * 0.1, y + H * 0.03); g.quadraticCurveTo(x - W * 0.08, y + H * 0.05, x - W * 0.05, y + H * 0.3); g.stroke();
    flama(g, W * 0.77, H * 0.5, W / 380, BLANCO); flecha(g, W * 0.18, H * 0.25, W * 0.18, H * 0.6, W * 0.05); aviso(g, 'EXTINTOR', W, H); },
  hidrante(g, W, H) { rect(g, W, H, ROJO); g.strokeStyle = BLANCO; g.lineWidth = W * 0.035; g.strokeRect(W * 0.36, H * 0.16, W * 0.52, H * 0.54);
    g.beginPath(); for (let i = 0; i < 4; i++) { const x = W * (0.45 + i * 0.1); g.moveTo(x, H * 0.3); g.lineTo(x, H * 0.62); } g.stroke(); flecha(g, W * 0.18, H * 0.25, W * 0.18, H * 0.6, W * 0.05); aviso(g, 'HIDRANTE', W, H); },
  alarma(g, W, H) { rect(g, W, H, ROJO); const c = [W / 2, H * 0.42]; g.fillStyle = BLANCO; g.beginPath(); g.arc(c[0], c[1], W * 0.1, 0, 7); g.fill(); g.strokeStyle = BLANCO; g.lineWidth = W * 0.04;
    [0.2, 0.3].forEach(r => { g.beginPath(); g.arc(c[0], c[1], W * r, -0.8, 0.8); g.stroke(); g.beginPath(); g.arc(c[0], c[1], W * r, Math.PI - 0.8, Math.PI + 0.8); g.stroke(); }); aviso(g, 'ALARMA', W, H); },
  telefono(g, W, H) { rect(g, W, H, ROJO); g.save(); g.translate(W / 2, H * 0.42); g.rotate(-0.7); g.fillStyle = BLANCO; g.beginPath(); g.roundRect(-W * 0.06, -W * 0.26, W * 0.12, W * 0.52, W * 0.05); g.fill();
    g.beginPath(); g.roundRect(-W * 0.04, -W * 0.3, W * 0.2, W * 0.13, W * 0.04); g.fill(); g.beginPath(); g.roundRect(-W * 0.04, W * 0.17, W * 0.2, W * 0.13, W * 0.04); g.fill(); g.restore(); aviso(g, 'TELÉFONO DE EMERGENCIA', W, H); },
  accesible(g, W, H) { rect(g, W, H, AZUL); g.strokeStyle = BLANCO; g.fillStyle = BLANCO; g.lineWidth = W * 0.045; g.lineCap = 'round';
    g.beginPath(); g.arc(W * 0.47, H * 0.16, W * 0.055, 0, 7); g.fill(); g.beginPath(); g.moveTo(W * 0.45, H * 0.26); g.lineTo(W * 0.45, H * 0.48); g.lineTo(W * 0.62, H * 0.48); g.lineTo(W * 0.7, H * 0.66); g.stroke();
    g.beginPath(); g.moveTo(W * 0.45, H * 0.34); g.lineTo(W * 0.6, H * 0.34); g.stroke(); g.beginPath(); g.arc(W * 0.44, H * 0.56, W * 0.16, 0.6, 5.4); g.stroke(); aviso(g, 'USO EXCLUSIVO', W, H); },
  informacion(g, W, H) { rect(g, W, H, AZUL); g.fillStyle = BLANCO; g.font = `900 ${H * 0.62}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', W / 2, H * 0.43); aviso(g, 'INFORMACIÓN', W, H); },
};
// prohibición: círculo blanco, banda circular y diagonal rojas, símbolo negro
function prohibicion(simbolo) { return (g, W, H) => { g.clearRect(0, 0, W, H); const c = W / 2, r = W * 0.46; g.fillStyle = BLANCO; g.beginPath(); g.arc(c, c, r, 0, 7); g.fill();
  simbolo(g, W); g.strokeStyle = ROJO; g.lineWidth = W * 0.09; g.beginPath(); g.arc(c, c, r - W * 0.045, 0, 7); g.stroke();
  g.beginPath(); g.moveTo(c - r * 0.66, c - r * 0.66); g.lineTo(c + r * 0.66, c + r * 0.66); g.stroke(); }; }
DIB.no_fumar = prohibicion((g, W) => { g.fillStyle = NEGRO; g.fillRect(W * 0.22, W * 0.52, W * 0.46, W * 0.09); g.fillRect(W * 0.7, W * 0.52, W * 0.07, W * 0.09);
  g.strokeStyle = NEGRO; g.lineWidth = W * 0.025; g.beginPath(); g.moveTo(W * 0.74, W * 0.48); g.bezierCurveTo(W * 0.68, W * 0.4, W * 0.8, W * 0.34, W * 0.72, W * 0.24); g.stroke(); });
DIB.no_llama = prohibicion((g, W) => { g.fillStyle = NEGRO; g.save(); g.translate(W * 0.5, W * 0.62); g.rotate(0.5); g.fillRect(-W * 0.025, -W * 0.05, W * 0.05, W * 0.3); g.restore(); flama(g, W * 0.42, W * 0.42, W / 330, NEGRO); });
DIB.no_paso = prohibicion((g, W) => persona(g, W * 0.5, W * 0.6, W / 210, 'camina', NEGRO));
// obligación: círculo azul, símbolo blanco
function obligacion(simbolo) { return (g, W, H) => { g.clearRect(0, 0, W, H); g.fillStyle = AZUL; g.beginPath(); g.arc(W / 2, W / 2, W * 0.46, 0, 7); g.fill(); g.fillStyle = BLANCO; g.strokeStyle = BLANCO; simbolo(g, W); }; }
const cabeza = (g, W) => { g.beginPath(); g.ellipse(W * 0.5, W * 0.56, W * 0.16, W * 0.2, 0, 0, 7); g.fill(); g.fillRect(W * 0.42, W * 0.7, W * 0.16, W * 0.14); };
DIB.casco = obligacion((g, W) => { cabeza(g, W); g.fillStyle = BLANCO; g.beginPath(); g.arc(W * 0.5, W * 0.44, W * 0.2, Math.PI, 0); g.fill(); g.fillRect(W * 0.26, W * 0.42, W * 0.48, W * 0.05); g.fillStyle = AZUL; g.fillRect(W * 0.3, W * 0.48, W * 0.4, W * 0.02); });
DIB.auditiva = obligacion((g, W) => { cabeza(g, W); g.lineWidth = W * 0.035; g.beginPath(); g.arc(W * 0.5, W * 0.54, W * 0.24, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
  g.fillStyle = BLANCO; [0.27, 0.73].forEach(x => { g.beginPath(); g.ellipse(W * x, W * 0.58, W * 0.06, W * 0.1, 0, 0, 7); g.fill(); }); g.fillStyle = AZUL; [0.27, 0.73].forEach(x => { g.beginPath(); g.ellipse(W * x, W * 0.58, W * 0.025, W * 0.06, 0, 0, 7); g.fill(); }); });
DIB.ocular = obligacion((g, W) => { cabeza(g, W); g.fillStyle = AZUL; g.fillRect(W * 0.32, W * 0.48, W * 0.36, W * 0.1); g.fillStyle = BLANCO; [0.41, 0.59].forEach(x => { g.beginPath(); g.ellipse(W * x, W * 0.53, W * 0.07, W * 0.04, 0, 0, 7); g.fill(); }); });
DIB.guantes = obligacion((g, W) => { [[0.36, -0.15], [0.62, 0.15]].forEach(([x, r]) => { g.save(); g.translate(W * x, W * 0.55); g.rotate(r); g.beginPath(); g.roundRect(-W * 0.09, -W * 0.06, W * 0.18, W * 0.24, W * 0.03); g.fill();
  for (let i = 0; i < 4; i++) { g.beginPath(); g.roundRect(-W * 0.085 + i * W * 0.045, -W * 0.22, W * 0.035, W * 0.18, W * 0.017); g.fill(); } g.beginPath(); g.roundRect(W * 0.07, -W * 0.06, W * 0.04, W * 0.12, W * 0.02); g.fill(); g.restore(); }); });
// precaución: triángulo amarillo, banda y símbolo negros
function precaucion(simbolo) { return (g, W, H) => { g.clearRect(0, 0, W, H); const t = (k, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(W / 2, W * (0.06 + k)); g.lineTo(W * (0.96 - k * 1.15), W * (0.9 - k * 0.5)); g.lineTo(W * (0.04 + k * 1.15), W * (0.9 - k * 0.5)); g.closePath(); g.fill(); };
  t(0, NEGRO); t(0.075, AMARILLO); g.fillStyle = NEGRO; g.strokeStyle = NEGRO; simbolo(g, W); }; }
DIB.prec_general = precaucion((g, W) => { g.fillRect(W * 0.46, W * 0.34, W * 0.08, W * 0.26); g.beginPath(); g.arc(W / 2, W * 0.7, W * 0.05, 0, 7); g.fill(); });
DIB.resbaloso = precaucion((g, W) => persona(g, W * 0.5, W * 0.6, W / 330, 'resbala', NEGRO));
DIB.electrico = precaucion((g, W) => { g.beginPath(); g.moveTo(W * 0.56, W * 0.3); g.lineTo(W * 0.42, W * 0.56); g.lineTo(W * 0.52, W * 0.56); g.lineTo(W * 0.44, W * 0.78); g.lineTo(W * 0.62, W * 0.5); g.lineTo(W * 0.52, W * 0.5); g.lineTo(W * 0.6, W * 0.3); g.closePath(); g.fill(); });
DIB.inflamable = precaucion((g, W) => flama(g, W / 2, W * 0.62, W / 250, NEGRO));
// --- agregadas 05/10/2026 (representaciones didácticas simplificadas del contenido de imagen de cada apéndice)
DIB.arnes = obligacion((g, W) => { g.lineCap = 'round'; g.lineWidth = W * 0.045; g.beginPath(); g.arc(W * 0.5, W * 0.26, W * 0.055, 0, 7); g.fill();
  g.beginPath(); g.moveTo(W * 0.5, W * 0.33); g.lineTo(W * 0.5, W * 0.58); g.moveTo(W * 0.5, W * 0.4); g.lineTo(W * 0.36, W * 0.52); g.moveTo(W * 0.5, W * 0.4); g.lineTo(W * 0.64, W * 0.52);
  g.moveTo(W * 0.5, W * 0.58); g.lineTo(W * 0.42, W * 0.78); g.moveTo(W * 0.5, W * 0.58); g.lineTo(W * 0.58, W * 0.78); g.stroke();
  g.lineWidth = W * 0.025; g.beginPath(); g.moveTo(W * 0.43, W * 0.36); g.lineTo(W * 0.57, W * 0.56); g.moveTo(W * 0.57, W * 0.36); g.lineTo(W * 0.43, W * 0.56); g.stroke();   // tirantes cruzados
  g.beginPath(); g.moveTo(W * 0.5, W * 0.37); g.quadraticCurveTo(W * 0.72, W * 0.2, W * 0.7, W * 0.1); g.stroke(); });   // línea de sujeción hacia el anclaje
DIB.cara = obligacion((g, W) => { cabeza(g, W); g.fillStyle = AZUL; g.globalAlpha = 0.55; g.beginPath(); g.roundRect(W * 0.3, W * 0.4, W * 0.4, W * 0.34, W * 0.06); g.fill(); g.globalAlpha = 1;
  g.strokeStyle = BLANCO; g.lineWidth = W * 0.03; g.beginPath(); g.roundRect(W * 0.3, W * 0.4, W * 0.4, W * 0.34, W * 0.06); g.stroke(); g.fillRect(W * 0.28, W * 0.34, W * 0.44, W * 0.06); });
DIB.calzado = obligacion((g, W) => { [0.34, 0.58].forEach(x => { g.beginPath(); g.moveTo(W * x, W * 0.28); g.lineTo(W * (x + 0.1), W * 0.28); g.lineTo(W * (x + 0.1), W * 0.6);
  g.lineTo(W * (x + 0.2), W * 0.66); g.lineTo(W * (x + 0.2), W * 0.74); g.lineTo(W * x, W * 0.74); g.closePath(); g.fill(); }); });
DIB.respiratoria = obligacion((g, W) => { cabeza(g, W); g.fillStyle = AZUL; g.beginPath(); g.ellipse(W * 0.5, W * 0.66, W * 0.12, W * 0.09, 0, 0, 7); g.fill();
  g.fillStyle = BLANCO; [0.4, 0.6].forEach(x => { g.beginPath(); g.arc(W * x, W * 0.69, W * 0.045, 0, 7); g.fill(); }); g.fillStyle = AZUL; g.fillRect(W * 0.36, W * 0.5, W * 0.28, W * 0.035); });
DIB.caida = precaucion((g, W) => { g.fillRect(W * 0.28, W * 0.7, W * 0.24, W * 0.05); g.fillRect(W * 0.5, W * 0.7, W * 0.04, W * 0.12); g.fillRect(W * 0.54, W * 0.79, W * 0.2, W * 0.03);
  persona(g, W * 0.58, W * 0.56, W / 420, 'resbala', NEGRO); });
DIB.obstaculos = precaucion((g, W) => { g.fillRect(W * 0.56, W * 0.68, W * 0.14, W * 0.12); persona(g, W * 0.46, W * 0.6, W / 380, 'corre', NEGRO); });
DIB.montacargas = precaucion((g, W) => { g.fillRect(W * 0.34, W * 0.56, W * 0.22, W * 0.16); g.fillRect(W * 0.4, W * 0.44, W * 0.12, W * 0.12); g.fillRect(W * 0.58, W * 0.38, W * 0.03, W * 0.36);
  g.fillRect(W * 0.58, W * 0.7, W * 0.12, W * 0.025); [0.38, 0.52].forEach(x => { g.beginPath(); g.arc(W * x, W * 0.75, W * 0.045, 0, 7); g.fill(); }); });
DIB.no_agua = prohibicion((g, W) => { g.fillStyle = NEGRO; g.save(); g.translate(W * 0.4, W * 0.36); g.rotate(0.6); g.beginPath(); g.roundRect(-W * 0.08, -W * 0.06, W * 0.16, W * 0.12, W * 0.02); g.fill(); g.restore();
  for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(W * (0.48 + i * 0.025), W * (0.46 + i * 0.05), W * 0.016, 0, 7); g.fill(); } flama(g, W * 0.6, W * 0.66, W / 520, NEGRO); });

function canvas(id, px = 256) {
  const s = POR_ID[id]; const k = (s && s.ancho) || 1; const cv = document.createElement('canvas'); cv.width = Math.round(px * k); cv.height = px;
  const g = cv.getContext('2d'); if (!g.roundRect) g.roundRect = function (x, y, w, h) { this.rect(x, y, w, h); };
  (DIB[id] || DIB.prec_general)(g, cv.width, cv.height); return cv;
}
const dataURL = (id, px) => canvas(id, px).toDataURL('image/png');
window.Senales = { LISTA, POR_ID, canvas, dataURL, COLORES: { VERDE, ROJO, AZUL, AMARILLO } };
})();
