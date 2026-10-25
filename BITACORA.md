# Bitácora — La Boutique Cat & Dog

Registro cronológico del proyecto. Convenciones:
- **[prod]** = está en GitHub Pages (repo `laboutiquecatydog/laboutiquecatydog.github.io`, rama `main`).
- **[local]** = terminado pero esperando el push final (W5).
- **[worker]** = desplegado en Cloudflare (`sveltia-cms-auth.laboutiquecatydog10.workers.dev`).
- Cada etapa termina con backup en `_backup/pre-<etapa>-<fecha>/` y verificación automática headless (navegador Edge + protocolo CDP, con GitHub simulado) además de la prueba real del usuario.

---

## 2026-10-21 · Base publicada

- Sitio landing vanilla (HTML/CSS/JS, sin build) en GitHub Pages.
- **G1** [prod]: contenido migrado a `data/sitio.json` + `data/pagina.json`, render con `js/render.js` (verificado A/B contra el HTML original).
- **G2** [prod]: panel Sveltia en `/admin/` (config.yml, login OAuth vía Worker de Cloudflare).
- Guardado de Sveltia verificado end-to-end (commit de prueba `6f12746`); campos ocultos de imágenes preservados.

## 2026-10-22 · Robustez del panel + rediseño estético

- Fix **[prod]** (`09e7734`): Sveltia exigía los campos de texto → todos los `string/text` pasaron a `required: false, default: ''`. Validado con js-yaml y confirmado en producción.
- Definición de links: web pública = `https://laboutiquecatydog.github.io/`, panel = `/admin/`.
- **G3 — rediseño estético** [local] (backup `pre-estetica-2026-10-22_00-52-01`):
  - `setupIntro()` typewriter del título del hero con watchdog de 6 s y flag `halted` (nunca deja botones ocultos); `**negritas**` → spans de acento.
  - Reveal escalonado (`--reveal-delay`), barra de progreso de scroll, `prefers-reduced-motion`.
  - `updateSEO()` dinámico desde `sitio.json` (title, description, OG, JSON-LD `PetStore`) con fallback estático.
  - Sección productos rediseñada: grid `auto-fill minmax(280px,1fr)`, `.product-price`, badge de marca, CTA rojo, fotos `object-fit: cover`.
  - Verificación headless: 0 errores desktop + mobile, typewriter OK, reveal 19/19, 18/18 imágenes, geometría OK (3 por fila, 476 px, sin overlap).

## 2026-10-23 · W1 — Editor visual: fundación

Decisiones con el usuario: cobertura total (secciones + textos + imágenes + `sitio.json`), Sveltia queda como "modo avanzado", el Worker puede extenderse (solo login).

- **Worker extendido** [worker] (`tools/worker-editor.js`): flujo Sveltia intacto; modo `client=editor` agrega cookie `cms-back` y redirige la misma pestaña al editor con `#access_token=…`. Validación de dominio con las mismas reglas (`ALLOWED_DOMAINS`). Desplegado por el usuario en Cloudflare.
- **Fix de configuración**: `ALLOWED_DOMAINS` quedó `laboutiquecatydog.github.io, localhost` — **sin** asterisco (el patrón matchea hostname sin puerto; `localhost*` no matcheaba → pantalla en blanco al loguear en local). El worker local ahora muestra el error visible en vez de página blanca.
- **W1** [local] (backup `pre-editorW1-2026-10-23_00-56-52`):
  - `admin/editor.html` + `editor.css` + `editor.js`: login GitHub (token en `sessionStorage`), lista de secciones (drag & drop, ↑↓, ocultar, duplicar, eliminar, agregar por plantilla), vista previa iframe, publicación = commit por API (`Editor visual: actualizar secciones de la portada`), borrador automático en `localStorage`, descartar, manejo básico de conflictos (409/422).
  - Verificado: `node --check`, smoke headless y login real del usuario (el panel carga con sesión).
- Lanzadores locales: `preview.cmd` (sitio) y **`Abrir panel (local).cmd`** (levanta servidor + abre el panel).

## 2026-10-24 · W2 — Textos y datos del local

- `admin/editor-form.js` (nuevo): constructor de formularios guiado por reglas por campo (etiquetas en español, textareas, selects, checks, viñetas 1-por-línea, orden de redes). Solo actualiza claves existentes: el JSON conserva su forma exacta.
- Pestaña **«Datos del local»** habilitada: formulario completo de `data/sitio.json` (negocio, redes, menú, pie).
- Panel derecho con toggle **«Vista previa ⟷ Textos»**; publicación de 1–2 commits según qué cambió (mensajes distintos por archivo); borrador separado por archivo.
- Verificación headless (GitHub simulado): formulario con 14 campos + 2 grupos + carrusel; edición marca cambios; publicación doble con SHA y mensaje correctos; 0 errores.

## 2026-10-24 · W2.5 — Edición directa en la vista previa

Feedback del usuario: el clic en la lista no debe saltar a textos; editar lo más posible dentro de la vista previa.

- `admin/editor-inline.js` (nuevo): marca los textos editables del sitio renderizado y permite escribir sobre ellos (contenteditable `plaintext-only`); Enter confirma, Escape revierte; los enlaces no navegan dentro de la miniatura; el título del hero reconstruye `**negritas**` desde los `<span class="accent">`.
- `js/main.js`: gancho `BQPreview.renderizar/reiniciar` (re-render con los datos del editor + re-init de carruseles/reveal/filtros; sin typewriter en preview). Inocuo en producción.
- `js/render.js`: las secciones con `oculto: true` **dejan de renderizarse** (el botón del ojo ahora es real).
- El clic en la lista pasa a **seleccionar** (resalta en lista y en vista); el formulario queda como modo alternativo sincronizado.
- Bugfix del día: al quitar `contenteditable` el `focusout` re-entraba en `finalizar(true)` y pisaba la reversión de Escape → el estado se baja antes de tocar el DOM.
- Verificación headless: clic en lista no salta de modo; edición in situ actualiza modelo + chip; re-render refleja el cambio; edición del pie (sitio.json) en vivo; Escape revierte; 0 errores.

## 2026-10-24 · W3 — Imágenes

- `admin/editor-media.js` (nuevo) — **BQMedia**:
  - **Galería**: listado de `assets/img/` por API (funciona con repo privado; miniaturas por `Accept: raw`); detecta variantes `-900` para armar srcset.
  - **Subida**: archivo de la PC → canvas → JPEG 82 % máx. 1600 px (+ variante `-900` cuando el campo la usa; logo mantiene PNG máx. 600 px) → **un commit por imagen** vía Git Data API (blobs → tree → commit → ref).
- Imágenes editables por **dos caminos**: clic sobre la foto en la vista previa, o miniatura + «Cambiar…» en el formulario.
- Listas editables (fotos del carrusel, tarjetas, productos, fotos de producto): **↑ ↓ ✕** y **«+ Agregar …»** que exige elegir imagen primero (nada queda sin foto).
- Verificación headless con inyección de archivo real por CDP: 2000×1200 → 1600×960 + `-900`; secuencia git completa en un commit; 0 errores.

## 2026-10-24 · W4a — Catálogo ordenado y más control

Feedback del usuario: cómo quitar productos, y organizar el catálogo si crece.

- **Paginación del catálogo** [local, sitio público]: `js/render.js` agrega el contenedor y `js/main.js` pagina en **bloques de 6** con flechas ‹ ›, números (ventana de 7 con «…»), «Página X de Y» con `aria-live`; los **filtros repaginan** el resultado y vuelven a la página 1; con ≤6 no se muestra nada; degradable sin JS. Estilos en `css/styles.css` (`.product-pagination`).
- **Quitar productos** con tres caminos: insignia **✕** al pasar el mouse sobre el producto en la vista previa (con confirmación), botón **«Quitar este producto»** en el formulario, y ✕ de siempre.
- Verificación headless: 5 productos sin paginación → 7 = «Página 1 de 2» → página 2 muestra 1 → filtro «Gatos» repagina y oculta controles (1 página) → quitar producto vuelve a ajustar solo; 0 errores.

---

## 2026-10-24 · W4b — Deshacer/rehacer y conflictos

- **Historial de deshacer/rehacer**: instantáneas del modelo completo (`pagina.json` + `sitio.json`, separador `\u0000`), máximo 60, captura con *debounce* de 600 ms para que una ráfaga de teclas no llene el historial de micro-estados. Se accede con **`Ctrl+Z` / `Ctrl+Y`** (o `Ctrl+Shift+Z`) y con los botones **Deshacer/Rehacer** del topbar (con estado deshabilitado correcto). Mientras se escribe en un campo, el undo nativo del navegador no se intercepta (sus eventos `input` re-sincronizan el modelo).
- **Chip honesto**: `compararConPublicado()` recalcula los flags de borrador contra una instantánea base capturada al cargar y al publicar — si deshacer vuelve exactamente al estado publicado, el chip se apaga y el borrador local se limpia solo.
- **Conflictos pre-vuelo**: antes de publicar se compara el SHA remoto de cada archivo sucio con el local; si GitHub cambió mientras editabas (otra pestaña, Sveltia, commit directo) aparece un modal claro: «Aceptar» descarta y recarga, «Cancelar» conserva el borrador intacto. Nunca se pisa a ciegas (fallback por 409/422 conservado).
- **Bugfix importante (edición inline)**: `doc.body.click()` programático no mueve el foco → la edición quedaba "abierta"; al deshacer, el re-render arrancaba el `contenteditable` del DOM y un `focusout` tardío re-escribía el valor viejo sobre el modelo restaurado. Triple fix: `BQInline.cancelar()` (cierra sin escribir) llamado antes de restaurar/re-renderizar; guarda `isConnected` en `finalizar` (DOM desactualizado no escribe nada); y los re-renders programados cancelan la edición abierta primero.
- Documentación: README actualizado (panel visual, estructura, login, ALLOWED_DOMAINS sin asterisco, paginación, etapas W1–W4) y esta bitácora creada.
- Verificación headless: trayectoria del historial (editar → deshacer estable → rehacer), atajo `Ctrl+Z`, conflicto simulado cambiando el SHA remoto (modal + cancelar conserva + aceptar recarga limpia); 0 errores.

---

## 2026-10-24 · W4c — Flechas tipo Word + recuperación de lo publicado

Feedback del usuario: "si el cliente hace algo mal, tiene que poder volver atrás, como las flechas de Word". Dos capas nuevas sobre el deshacer de W4b:

- **Flechas tipo Word**: los botones Deshacer/Rehacer pasaron a ser íconos de flecha curva (↶ ↷) con tooltip del atajo. Además el atajo `Ctrl+Z`/`Ctrl+Y` ahora **también funciona mientras el foco está en la vista previa** (los eventos keydown del iframe se reenvían al editor; si el foco está en un texto editable de la vista, manda el deshacer nativo).
- **Historial de versiones** (ícono de reloj ⋾): la red de seguridad para errores **ya publicados**, que el deshacer de sesión no cubre. Lista las últimas 10 versiones publicadas de cada archivo (via `/commits?path=…`) con fecha legible y mensaje de commit; «Restaurar» trae el contenido de esa versión (`contents?ref=<sha>`) y lo carga **como borrador**: se revisa en la vista previa, no se publica nada solo, y la restauración misma entra al historial de deshacer (Ctrl+Z la revierte). Cero riesgo de perder nada: siempre hay que confirmar con «Publicar cambios».
- Sistema de seguridad resultante, en capas: 1) Deshacer/Rehacer (sesión), 2) Descartar (vuelve a lo publicado), 3) Historial de versiones (recupera incluso lo ya publicado), 4) respaldo final: el historial completo de commits de GitHub.
- Verificación headless: íconos presentes y funcionales; deshacer por botón-ícono; rehacer; editar de nuevo + `Ctrl+Z` con foco en el iframe revierte; modal de versiones con 2 grupos y 3 filas; restaurar la versión vieja del antetítulo → borador "VERSION-VIEJA" **visible en la vista previa**; deshacer la restauración vuelve al estado previo; 0 errores.

---

## 2026-10-24 · W5a/b/c — SEO técnico, editor único y copias de seguridad

Decisiones del cliente: videos de Instagram **descartados**; Search Console **para después del push**; WhatsApp como único teléfono (NAP). Objetivo de la vuelta: SEO/meta impecables para indexación, **un solo editor** con todo integrado, copias de seguridad del contenido, auditoría, docs. Todo en local.

### W5a — SEO/GEO técnico
- **`robots.txt`** (nuevo): permite la web, excluye `/admin/`, `/graphify-out/`, `/_backup/` y `*.cmd`; declara el sitemap.
- **`sitemap.xml`** (nuevo): URL única con lastmod — lo que se envía en Search Console.
- **Bloque `seo` editable** en `data/sitio.json` (título/descripción) → `updateSEO()` lo aplica en vivo con *fallback* local; el panel lo muestra con pistas de longitud (≤60 / ≤155).
- **JSON-LD mejorado**: URLs absolutas, `url`, `logo`, `image` (og-image), `priceRange: "$"`, `@id`, y **horarios parseados de `negocio.hours`** (antes fijos "10:00-13:00" aunque el cliente cambiara los horarios).
- **`assets/img/og-image.jpg`** (nuevo): 1200×630 recortada de slide-1 para previews de WhatsApp/redes; metas OG/Twitter apuntando a ella.
- Textos con intención local: portada, contacto y pie mencionan Salta.
- `.gitignore`: `graphify-out/`.

### W5b — Editor único (Sveltia retirado)
- **Campos avanzados integrados**: `srcset`/`sizes`/`ancho`/`alto`/`prioridad`/`imagenAncho`/`imagenAlto` dejan de estar ocultos y aparecen en cajas plegables «Campos avanzados» por item (el editor los completa solo al subir fotos, pero ya nada queda fuera del panel).
- `id`/ancla pasa a **editable con advertencia**; `huella` con opción **«ninguna»** y etiqueta corregida (es el lado del camino decorativo, no del texto).
- `/admin/` → `admin/index.html` es un redirect al editor; **`config.yml` eliminado**; fuera el link «Modo avanzado» del topbar.

### W5c — Copias de seguridad + robustez
- **Copias de seguridad** (ícono de copias): lista de copias locales en el navegador (máx. 15) con fecha y etiqueta; **auto-copia «Antes de publicar»** en cada publicación; copias manuales; **descargar a archivo JSON**; **subir desde archivo**; restaurar carga **como borrador** (deshacible, no publica). Red de seguridad completa en capas: deshacer → descartar → copias locales → versiones publicadas (Git) → historial del repo.
- **Auditoría y correcciones**: reordenar/ocultar/duplicar/eliminar/agregar ahora refrescan **la vista previa en vivo** (antes solo marcaban borrador); `irASeccion` alinea índices con secciones ocultas; `BQMedia.abrir()` resetea el estado de una apertura anterior.
- **Paw-trail dinámico (G4 cerrado)**: los tramos salen del orden real + campo `huella` (con «ninguna» y auto-intercalado); `main.js` pasa `pagina` a `renderPawTrails`; `BQPreview.renderizar` redibuja las huellas en la vista del editor (antes quedaban borradas tras el primer re-render); tabla clásica como *fallback*.
- **Bugfix crítico** encontrado por el E2E: `updateSEO` usaba `set()` (helper de render.js inexistente en main.js) → ReferenceError que rompía el arranque del sitio. Corregido a `isConfigured()`.

**Verificación E2E (0 errores):** sitio con SEO dinámico completo (title desde el bloque seo, JSON-LD con url/@id/priceRange/logo absolutos/horarios, og-image, huellas) · editor sin Sveltia · 3 cajas de avanzados con 5 campos c/u + id editable + huella con «ninguna» · grupo SEO con pistas · copia manual + auto-copia «Antes de publicar» al publicar · huellas redibujadas tras reordenar. `robots.txt`, `sitemap.xml`, `og-image.jpg` y el redirect de `/admin/` servidos por el servidor local.

---

## 2026-10-24 · Auditoría de seguridad completa

Objetivo: verificar que el sitio, el panel y el login sean seguros para el cliente, **probando vulnerabilidades reales**, y dejar todo listo para la presentación.

### Pruebas ejecutadas (navegador real por CDP + curl)
- **Batería XSS**: payloads `<img onerror>`, `<script>`, `<svg onload>`, `javascript:` en **todos los campos editables** de `pagina.json` y `sitio.json` (títulos, botones, precios, menú, redes, contacto…), renderizados por el propio motor del sitio vía `BQPreview`. Resultado: **0 ejecuciones**, 0 elementos maliciosos, 0 scripts inyectados, textos renderizados como texto inerte.
- **Path traversal** contra `tools/serve.js`: 10 variantes (`../`, `%2e%2e`, `..%5c` para Windows, doble codificación, rutas absolutas) con `curl --path-as-is`. Resultado: **todas 403**. (Hallazgo de metodología: los "200" iniciales eran normalización del cliente HTTP, no del servidor.)
- **CSP activa y verificada**: scripts inline dinámicos → bloqueados; scripts externos (`data:`) → bloqueados; sitio 100 % funcional (clase `js` por hash correcto, JSON-LD vivo, 0 violaciones en consola).
- **Higiene del token**: URL limpia post-login, token solo en `sessionStorage` (no en localStorage), y todas las peticiones con `Authorization` van **exclusivamente** a `api.github.com`.
- **Escaneos**: secretos hardcodeados (0), contenido mixto (0), `innerHTML` del panel revisado (solo constantes o contenido escapado), `rel="noopener"` en `_blank` ✓, subida de imágenes re-codificada por canvas ✓.

### Hallazgos corregidos
1. **Enlaces editables aceptaban `javascript:`** (botones del hero, tarjetas, menú/nav, redes) → sanitizador **`hrefSeguro()`** en `render.js`: solo `#`, rutas internas, `https:`, `mailto:`, `tel:`; el resto se neutraliza en `#`.
2. **Página de error del Worker** interpolaba el `site_id` sin escapar (inyección HTML teórica) → `escapeHtml()` en `tools/worker-editor.js`. El Worker desplegado hoy no refleja el dato (verificado con curl), así que es refuerzo pendiente de re-deploy (documentado en el informe).
3. **Servidor local sin `nosniff`** → cabecera `X-Content-Type-Options` agregada.

### Entregables
- **`guias/INFORME-SEGURIDAD.md`**: informe presentable (resumen ejecutivo para el cliente, qué se probó, hallazgos corregidos, recomendaciones — 2FA en GitHub — y checklist previo a publicación).
- README: nueva sección «Seguridad».
- Verificación final: sitio renderiza completo con CSP + sanitizador (0 errores, 0 violaciones), editor funcional.

**Estado**: APROBADO para presentar. Siguiente paso con visto bueno del cliente: push a producción → re-deploy del Worker hardenado → Search Console + Google Business Profile.
