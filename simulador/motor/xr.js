// Modo INMERSIVO (WebXR) para cualquier sub-mundo del motor. Script clásico; lo carga motor.js cuando cfg.xr existe.
// Qué hace:
//  · Agrega a la barra los botones "🥽 VR" (immersive-vr) y "🔲 Mixta" (immersive-ar) si el navegador los soporta
//    (Meta Quest 3/3S: navegador del visor). En pantalla todo sigue igual.
//  · En el visor muestra un PANEL FLOTANTE que refleja en vivo lo que el motor pone en pantalla: el paso actual, las
//    preguntas y avisos (modal) y los mensajes de acierto/error (toast) con su fuente. Sus botones se eligen con el rayo
//    del control (gatillo) o con la mano (pellizco). No hay que reescribir los pasos de cada sub-mundo.
//  · El mismo rayo toca los objetos de la escena que brillan (los "tocables" del motor).
//  · Apuntar al piso y apretar el gatillo = desplazarse ahí (teletransporte). Botón lateral (squeeze) = traer el panel
//    al frente.
// cfg.xr del sub-mundo: { inicio: [x, z], piso: Mesh, entorno: [Mesh…] (se ocultan en realidad mixta) }
// Solo se ofrece VR / realidad mixta en visores (Meta Quest, Pico…) y computadoras. En celulares Android el navegador
// dice "soporta VR" (modo Cardboard) y la pantalla se partía en dos sin ocupar todo el espacio (07/10/2026).
// Forzar en cualquier equipo: agregar ?xr=1 a la dirección.
window.CampusXR = window.CampusXR || (() => { const ua = navigator.userAgent || '';
  const visor = /OculusBrowser|Quest|Pico|Wolvic|Vive|SamsungBrowser\/.*VR/i.test(ua);
  const movil = !visor && (/Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (navigator.maxTouchPoints > 1 && matchMedia('(pointer: coarse)').matches));
  return { visor, movil, permitir: visor || !movil || /[?&]xr=1/.test(location.search) }; })();
(function () {
  const ANCHO = 1024, ALTO = 1280, MW = 0.95, MH = MW * ALTO / ANCHO;

  function activar(W, opc = {}) {
    const { THREE, renderer, scene, camera, controls, $ } = W;
    renderer.xr.enabled = true;

    // ---------------------------------------------------------------- panel (canvas → textura)
    const cv = document.createElement('canvas'); cv.width = ANCHO; cv.height = ALTO; const g = cv.getContext('2d');
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(MW, MH), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    panel.visible = false; panel.renderOrder = 10; scene.add(panel);
    let botones = [];                       // [{x,y,w,h,el}] en coordenadas del canvas

    const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#154F90';
    function lineas(txt, max) {
      const out = []; String(txt || '').split('\n').forEach(par => {
        let l = ''; par.split(/\s+/).forEach(p => { const t = l ? l + ' ' + p : p; if (g.measureText(t).width > max && l) { out.push(l); l = p; } else l = t; });
        out.push(l); }); return out.filter((x, i, a) => x || (i && a[i - 1]));
    }
    function caja(x, y, w, h, r, color) { g.fillStyle = color; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); }
    function visible(el) { return el && getComputedStyle(el).display !== 'none'; }

    function leer() {   // qué hay en pantalla ahora
      const modal = $('modal'), toast = $('toast');
      let titulo, cuerpo, els;
      if (visible(modal)) {
        const c = $('mCont').cloneNode(true); c.querySelectorAll('button,input,script,style').forEach(e => e.remove());
        const h = c.querySelector('h2,h3'); titulo = h ? h.textContent : ''; if (h) h.remove();
        cuerpo = c.innerText.replace(/\n{2,}/g, '\n').trim();
        els = [...$('mCont').querySelectorAll('button')].filter(b => !/print\(/.test(b.getAttribute('onclick') || '') && b.id !== 'bCsv' && b.id !== 'bBorrar');
      } else {
        titulo = ($('pNum').textContent ? $('pNum').textContent + ' · ' : '') + $('pTit').textContent;
        cuerpo = $('pTxt').innerText + ($('pFuente').textContent ? '\n' + $('pFuente').textContent : '');
        els = [...$('acciones').querySelectorAll('button')];
      }
      return { titulo, cuerpo, els, toast: visible(toast) ? { tipo: toast.className, txt: toast.innerText } : null };
    }

    function pintar() {
      const d = leer(); botones = [];
      g.clearRect(0, 0, ANCHO, ALTO);
      caja(0, 0, ANCHO, ALTO, 36, 'rgba(255,255,255,0.96)');
      caja(0, 0, ANCHO, 120, 36, css('--navy')); g.fillRect(0, 80, ANCHO, 40);
      g.fillStyle = '#fff'; g.font = 'bold 40px Calibri, sans-serif'; g.textBaseline = 'middle';
      g.fillText((lineas(d.titulo, ANCHO - 60)[0] || '').slice(0, 60), 30, 60);
      let y = 140;
      if (d.toast) {
        g.font = '30px Calibri, sans-serif'; const ls = lineas(d.toast.txt, ANCHO - 80).slice(0, 4);
        const h = 24 + ls.length * 38; caja(20, y, ANCHO - 40, h, 20, d.toast.tipo === 'ok' ? '#2E7D32' : d.toast.tipo === 'no' ? '#C62828' : css('--azul'));
        g.fillStyle = '#fff'; ls.forEach((l, i) => g.fillText(l, 40, y + 30 + i * 38)); y += h + 16;
      }
      g.fillStyle = '#1B2633'; g.font = '32px Calibri, sans-serif';
      const nb = d.els.length, altoB = nb > 6 ? 66 : 80, zonaB = nb * (altoB + 12);
      const maxL = Math.max(2, Math.floor((ALTO - 40 - zonaB - y) / 40));
      const ls = lineas(d.cuerpo, ANCHO - 60); ls.slice(0, maxL).forEach((l, i) => g.fillText(i === maxL - 1 && ls.length > maxL ? l + ' …' : l, 30, y + 20 + i * 40));
      let by = ALTO - 30 - zonaB;
      d.els.forEach(el => {
        const sel = el.classList.contains('marcada'), prim = el.classList.contains('prim'), dis = el.disabled;
        caja(30, by, ANCHO - 60, altoB, 18, dis ? '#ccc' : sel ? '#D7ECF4' : prim ? css('--azul') : '#E8F0F4');
        if (sel) { g.strokeStyle = css('--azul'); g.lineWidth = 5; g.beginPath(); g.roundRect(30, by, ANCHO - 60, altoB, 18); g.stroke(); }
        g.fillStyle = prim && !sel ? '#fff' : '#1B2633'; g.font = (prim ? 'bold ' : '') + (nb > 6 ? '27px' : '30px') + ' Calibri, sans-serif';
        const t = lineas(el.textContent.trim(), ANCHO - 110); t.slice(0, 2).forEach((l, i) => g.fillText(l, 52, by + altoB / 2 + (t.length > 1 ? (i - 0.5) * 32 : 0)));
        botones.push({ x: 30, y: by, w: ANCHO - 60, h: altoB, el }); by += altoB + 12;
      });
      tex.needsUpdate = true;
    }
    let pendiente = false;
    const repintar = () => { if (pendiente || !renderer.xr.isPresenting) return; pendiente = true; requestAnimationFrame(() => { pendiente = false; pintar(); }); };
    new MutationObserver(repintar).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['style', 'class', 'disabled'] });

    function alFrente() {   // coloca el panel 1 m al frente de la vista, un poco abajo y a la izquierda
      const c = renderer.xr.getCamera(); const p = new THREE.Vector3(), q = new THREE.Quaternion(); c.getWorldPosition(p); c.getWorldQuaternion(q);
      const fr = new THREE.Vector3(0, 0, -1).applyQuaternion(q); fr.y = 0; fr.normalize(); const izq = new THREE.Vector3(fr.z, 0, -fr.x);
      panel.position.copy(p).addScaledVector(fr, 0.95).addScaledVector(izq, 0.35); panel.position.y = p.y - 0.15;
      panel.lookAt(p.x, panel.position.y, p.z);
    }

    // ---------------------------------------------------------------- controles (rayo + gatillo + squeeze)
    const ray = new THREE.Raycaster(), M4 = new THREE.Matrix4();
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
    const mira = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.035, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    mira.visible = false; scene.add(mira);
    function apuntar(c) { M4.identity().extractRotation(c.matrixWorld); ray.ray.origin.setFromMatrixPosition(c.matrixWorld); ray.ray.direction.set(0, 0, -1).applyMatrix4(M4); }
    function golpe(c) {
      apuntar(c);
      const hp = panel.visible ? ray.intersectObject(panel)[0] : null;
      const vis = o => { for (let p = o; p; p = p.parent) if (p.visible === false) return false; return true; };
      const ho = ray.intersectObjects(scene.children, true).find(h => h.object !== panel && h.object.userData.tipo && vis(h.object));
      const hs = opc.piso ? ray.intersectObject(opc.piso)[0] : null;
      if (hp && (!ho || hp.distance <= ho.distance)) return { tipo: 'panel', h: hp };
      if (ho) return { tipo: 'obj', h: ho };
      if (hs) return { tipo: 'piso', h: hs };
      return null;
    }
    let base = null; const ofs = { x: 0, z: 0 };   // desplazamiento del espacio físico dentro del mundo
    function irA(x, z) {   // teletransporte: el origen físico queda en (x, z) del mundo
      if (!base) base = renderer.xr.getReferenceSpace();
      ofs.x = x; ofs.z = z;
      renderer.xr.setReferenceSpace(base.getOffsetReferenceSpace(new XRRigidTransform({ x: -x, y: 0, z: -z, w: 1 })));
      setTimeout(alFrente, 120);
    }
    [0, 1].forEach(i => {
      const c = renderer.xr.getController(i); scene.add(c);
      const linea = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x9CC5A1 })); linea.scale.z = 4; c.add(linea);
      c.addEventListener('selectstart', () => {
        const r = golpe(c); if (!r) return;
        if (r.tipo === 'panel') { const u = r.h.uv, px = u.x * ANCHO, py = (1 - u.y) * ALTO;
          const b = botones.find(b => px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h); if (b && !b.el.disabled) b.el.click(); }
        else if (r.tipo === 'obj') W.tocar(r.h.object.userData.ref || r.h.object);
        else if (r.tipo === 'piso') {   // la persona queda parada donde apunta (descuenta lo que ya caminó en su cuarto)
          const p = r.h.point, cp = new THREE.Vector3(); renderer.xr.getCamera().getWorldPosition(cp);
          irA(p.x - (cp.x - ofs.x), p.z - (cp.z - ofs.z)); }
      });
      c.addEventListener('squeezestart', alFrente);
      W.cuadro.push(() => { if (!renderer.xr.isPresenting) return; const r = golpe(c);
        linea.scale.z = r ? r.h.distance : 4; if (i === 0) { mira.visible = !!r && r.tipo === 'piso'; if (mira.visible) { mira.position.copy(r.h.point).y += 0.01; mira.rotation.x = -Math.PI / 2; } } });
    });

    // ---------------------------------------------------------------- entrar / salir
    const fondo = scene.background;
    async function entrar(modo) {
      const s = await navigator.xr.requestSession(modo, { requiredFeatures: ['local-floor'], optionalFeatures: ['hand-tracking'] });
      renderer.xr.setReferenceSpaceType('local-floor'); await renderer.xr.setSession(s); base = null; ofs.x = ofs.z = 0;
      controls.enabled = false;
      if (modo === 'immersive-ar') { scene.background = null; (opc.entorno || []).forEach(o => o.visible = false); }
      const [x, z] = opc.inicio || [0, 0];
      setTimeout(() => { if (x || z) irA(x, z); else alFrente(); panel.visible = true; pintar(); }, 300);
      s.addEventListener('end', () => { renderer.xr.setReferenceSpace(null); scene.background = fondo; (opc.entorno || []).forEach(o => o.visible = true); panel.visible = false; mira.visible = false; controls.enabled = true; });
    }
    (async () => {
      if (!navigator.xr || !window.CampusXR.permitir) return;
      const der = document.querySelector('#barra .der'); if (!der) return;
      for (const [modo, txt, tit] of [['immersive-ar', '🔲', 'Realidad mixta: tu espacio real'], ['immersive-vr', '🥽 VR', 'Entrar en realidad virtual']]) {
        let ok = false; try { ok = await navigator.xr.isSessionSupported(modo); } catch (e) { }
        if (!ok) continue;
        const b = document.createElement('button'); b.className = 'sec peq'; b.textContent = txt; b.title = tit; b.style.fontWeight = '800';
        b.onclick = () => entrar(modo).catch(e => W.toast('no', 'No se pudo iniciar el modo inmersivo: ' + e.message)); der.prepend(b);
      }
    })();
    return { panel, pintar, alFrente, irA };
  }
  window.MotorXR = { activar };
})();
