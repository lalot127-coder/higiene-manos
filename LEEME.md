# Publicar el manual digital y el simulador (GitHub Pages)

Los QR de la presentación apuntan a `https://lalot127-coder.github.io/higiene-manos/manual.html`
(con `#diagnostico`, `#m1`…`#m4` y `#evaluacion`). Hasta que publiques esta carpeta, los QR no abren nada.

**Qué se publica:** solo `manual.html`, `index.html` y la copia del simulador (`simulador/`). No contiene CURP, RFC
ni listas de participantes. Sí muestra el nombre del hospital y de la instructora.

## Pasos (una sola vez, ~10 minutos)
1. En github.com (cuenta lalot127-coder) → **New repository** → nombre `higiene-manos` → Public → Create.
2. **Add file → Upload files** → arrastra TODO el contenido de esta carpeta (`manual.html`, `index.html` y la
   carpeta `simulador`), excepto este LEEME → **Commit changes**.
3. **Settings → Pages** → Source: *Deploy from a branch* → Branch `main` / `(root)` → Save.
4. Espera 1–2 minutos y prueba con el celular **usando datos móviles**:
   https://lalot127-coder.github.io/higiene-manos/manual.html

## Si cambias el contenido
`python 05_herramientas/manual_digital.py 03_cursos/2026-10-30_lavado_de_manos_sante` vuelve a generar
`manual.html` aquí; súbelo de nuevo (Upload files → reemplaza).

## Registro de resultados
- Desde GitHub Pages: el examen se guarda en el celular y cada persona **descarga su comprobante**.
- Para registro automático en la computadora de la instructora: servidor de aula
  (`python 05_herramientas/servidor_aula.py 03_cursos/2026-10-30_lavado_de_manos_sante` → proyectar
  `http://localhost:8765/aula`, que muestra el QR del mismo manual en la red local).
- Respaldo: exámenes impresos (03_evaluaciones) y concentrador Excel.
