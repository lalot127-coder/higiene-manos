// Sala en línea del Campus (script clásico): multijugador por internet sin cuentas ni servidor propio.
// Usa PeerJS (WebRTC): el servidor gratuito de PeerJS solo presenta a los dispositivos; los datos (nombre, avatar,
// posición) viajan directo entre ellos. La persona que CREA la sala es el anfitrión: reenvía las posiciones a todos
// y debe mantener su pantalla abierta. Límite práctico: ~20 personas. En redes muy restrictivas (algunas empresas o
// datos móviles) la conexión directa puede fallar: en ese caso usar el servidor de aula.
//   SalaLinea.crear() → Promise   SalaLinea.unir(codigo) → Promise   enviar(estado)   jugadores()   salir()
(function () {
const LIB = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
const PREFIJO = 'cers-campus-sst-';
let peer = null, anfitrion = false, codigoSala = '', conexiones = [], alHost = null, estados = new Map(), yo = null;
const cargar = () => new Promise((ok, no) => { if (window.Peer) return ok(); const s = document.createElement('script'); s.src = LIB; s.onload = ok; s.onerror = () => no(new Error('sin internet para cargar PeerJS')); document.head.appendChild(s); });
const nuevoCodigo = () => Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
const limpiar = j => (j && typeof j === 'object' && typeof j.id === 'string' && j.id.length < 20) ? j : null;
function abrirPeer(id) { return new Promise((ok, no) => { const p = id ? new Peer(id) : new Peer(); const t = setTimeout(() => no(new Error('tiempo de espera agotado')), 12000);
  p.on('open', () => { clearTimeout(t); ok(p); }); p.on('error', e => { clearTimeout(t); no(new Error(e.type === 'unavailable-id' ? 'ese código ya está en uso' : e.type === 'peer-unavailable' ? 'no existe esa sala (¿el anfitrión la cerró?)' : (e.message || e.type))); }); }); }
async function crear() {
  await cargar(); salir(); codigoSala = nuevoCodigo(); peer = await abrirPeer(PREFIJO + codigoSala); anfitrion = true;
  peer.on('connection', c => { conexiones.push(c); c.on('data', d => { const j = limpiar(d); if (j) estados.set(j.id, { ...j, t: Date.now() }); });
    c.on('close', () => { conexiones = conexiones.filter(x => x !== c); }); });
  setInterval(() => { if (!anfitrion) return; const ahora = Date.now(); estados.forEach((j, k) => { if (ahora - j.t > 8000) estados.delete(k); });
    const lista = [...estados.values()].concat(yo ? [yo] : []); conexiones.forEach(c => { try { c.open && c.send(lista); } catch (e) { } }); }, 700);
  return codigoSala;
}
async function unir(codigo) {
  codigo = String(codigo || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (codigo.length !== 6) throw new Error('el código tiene 6 caracteres');
  await cargar(); salir(); peer = await abrirPeer(); anfitrion = false; codigoSala = codigo;
  await new Promise((ok, no) => { const c = peer.connect(PREFIJO + codigo, { reliable: false }); const t = setTimeout(() => no(new Error('no respondió la sala')), 12000);
    c.on('open', () => { clearTimeout(t); alHost = c; ok(); }); c.on('error', e => { clearTimeout(t); no(e); });
    c.on('data', lista => { if (Array.isArray(lista)) { estados = new Map(lista.map(limpiar).filter(Boolean).map(j => [j.id, j])); } });
    c.on('close', () => { alHost = null; codigoSala = ''; }); peer.on('error', e => { clearTimeout(t); no(new Error(e.type === 'peer-unavailable' ? 'no existe esa sala (¿el anfitrión la cerró?)' : e.type)); }); });
  return codigoSala;
}
function enviar(estado) { yo = estado; if (anfitrion) return; if (alHost && alHost.open) try { alHost.send(estado); } catch (e) { } }
function salir() { try { peer && peer.destroy(); } catch (e) { } peer = null; anfitrion = false; codigoSala = ''; conexiones = []; alHost = null; estados = new Map(); }
window.SalaLinea = { crear, unir, enviar, salir, jugadores: () => [...estados.values()], activa: () => !!codigoSala && !!peer, codigo: () => codigoSala, soyAnfitrion: () => anfitrion };
})();
