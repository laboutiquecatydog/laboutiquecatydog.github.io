# La Boutique Cat & Dog — Landing page + panel visual de contenido

Sitio web de una sola página (landing) para **La Boutique Cat & Dog**, tienda de productos para perros y gatos. HTML + CSS + JavaScript vanilla, **sin frameworks, sin dependencias y sin paso de build**.

El contenido (textos, imágenes, enlaces y secciones) **no está en el HTML**: vive en archivos JSON dentro de `data/` y se renderiza en el navegador con JavaScript. Sobre esa base hay un **panel de administración visual tipo constructor** en `/admin/editor.html` para que el cliente edite todo con su navegador: textos sobre la propia vista previa, imágenes, productos, orden de secciones y datos del local.

**Web:** <https://laboutiquecatydog.github.io/>
**Panel visual:** `https://laboutiquecatydog.github.io/admin/editor.html` *(requiere login con GitHub; ver [Panel visual de administración](#panel-visual-de-administración))*
**Panel avanzado (Sveltia):** <https://laboutiquecatydog.github.io/admin/> *(respaldo para casos avanzados)*

---

## Cómo funciona el sitio (arquitectura)

```
data/sitio.json   ─┐
                   ├─►  js/render.js  ─►  HTML de header, <main> y footer
data/pagina.json  ─┘        │
                            ▼
                    js/main.js  ─►  interacciones (menú, carruseles, WhatsApp…)
                            │
                    js/paw-trail.js  ─►  caminos decorativos de huellas
```

1. `index.html` es solo un **esqueleto**: contiene el `<head>` (SEO, fuentes, JSON-LD) y contenedores vacíos para el header, `<main>`, el footer y el botón flotante de WhatsApp.
2. `js/main.js` carga los dos JSON con `fetch()`.
3. `js/render.js` construye el HTML de la página a partir de esos datos.
4. Luego se inicializan las interacciones y se dibujan las huellas.

**Consecuencia importante:** al cargar datos por `fetch()`, el sitio **no funciona abriendo `index.html` con doble clic** (`file://`): hay que servirlo por HTTP (ver [Abrir el sitio en local](#abrir-el-sitio-en-local)).

---

## Contenido del sitio

Una sola página con navegación por anclas. Los bloques y su orden se definen en `data/pagina.json`:

| Sección (bloque) | Elemento | Contenido |
|---|---|---|
| Portada (`hero`) | `#inicio` | Carrusel de fotos, título, y botones de WhatsApp y "Ver productos" |
| Categorías (`categorias`) | `#categorias` | Tarjetas **Perros** y **Gatos** (con imagen) que enlazan a Productos |
| Productos (`productos`) | `#productos` | Catálogo con filtros **Todos / Perros / Gatos**, carrusel por producto y **paginación automática** (bloques de 6, páginas y flechas que se generan solas) |
| Nosotros (`imagenTexto`) | `#nosotros` | Foto a un lado y texto + viñetas + botón al otro |
| Contacto (`contacto`) | `#contacto` | WhatsApp, redes, ubicación/mapa, horarios, teléfono y correo |
| Header | `.site-header` | Logo, menú, botón de WhatsApp |
| Footer | `.site-footer` | Marca, secciones, datos de contacto, redes y año dinámico |

**Funcionalidades:** menú móvil con overlay y scroll-spy, carruseles con teclado/touch/autoplay (pausa al enfocar o pasar el mouse), animaciones de aparición al hacer scroll, barra de progreso de scroll, título de portada con efecto de escritura **y revelado del resto del contenido en paralelo** (todo visible en ~0,5 s, título completo en ~1,6 s), enlaces de WhatsApp/Google Maps generados desde los datos, filtros de productos por mascota con repaginación, secciones ocultables desde el panel (`oculto`), SEO dinámico desde `sitio.json` (título, descripción, Open Graph y JSON-LD `PetStore`), **caminos decorativos de huellas** de perro y gato entre las secciones, y **acceso discreto al panel: tres clics seguidos en el logo** (el login con GitHub sigue siendo obligatorio; desactivado dentro de la vista previa del editor).

---

## Estructura

```
la-boutique-cat-y-dog/
├── index.html                  # Esqueleto: <head> (SEO, fuentes, JSON-LD) y contenedores
├── robots.txt                  # Qué puede indexar Google (excluye /admin/)
├── sitemap.xml                 # Mapa del sitio (se envía en Search Console)
├── preview.cmd                 # Doble clic: servidor local + abre el SITIO en el navegador
├── "Abrir panel (local).cmd"   # Doble clic: servidor local + abre el PANEL VISUAL
├── README.md                   # Este archivo
├── BITACORA.md                 # Registro cronológico del proyecto
├── guias/
│   └── INFORME-SEGURIDAD.md    # Auditoría de seguridad (presentable al cliente)
├── css/
│   └── styles.css              # Todos los estilos (variables, layout, componentes)
├── js/
│   ├── render.js               # Motor de render: data/*.json  →  HTML
│   ├── main.js                 # Datos, interacciones, paginación, SEO dinámico y BQPreview
│   ├── paw-trail.js            # Caminos de huellas (siguen el orden y campo "huella")
│   └── config.js               # ⚠️ SIN USO (se conserva como referencia histórica)
├── data/
│   ├── sitio.json              # Datos globales + bloque "seo" editable
│   └── pagina.json             # Bloques/secciones de la portada, en orden
├── admin/
│   ├── index.html              # Redirect al editor visual (antes cargaba Sveltia)
│   ├── editor.html             # Panel visual (shell: vistas, topbar, modales)
│   ├── editor.css              # Estilos del panel
│   ├── editor.js               # Estado, GitHub API, lista, publicación, historial, copias
│   ├── editor-form.js          # Formularios por campo (textos + avanzados) + gestión de items
│   ├── editor-inline.js        # Edición directa sobre la vista previa (iframe)
│   └── editor-media.js         # Galería + subida optimizada de imágenes (BQMedia)
├── assets/
│   └── img/                    # Imágenes del sitio (subidas van acá) + og-image.jpg
└── tools/
    ├── serve.js                # Servidor estático local sin dependencias (Node)
    └── worker-editor.js        # Worker de Cloudflare extendido para el login del editor
```

> **Excluido del repo** (ver `.gitignore`): `Contenido Imagenes/` (26 MB de imágenes originales; las optimizadas ya están en `assets/img/`) y `_backup/` (copias de seguridad históricas de etapas previas).

---

## Abrir el sitio y el panel en local

No hay dependencias ni paso de compilación, pero **sí hace falta un servidor** porque el contenido se carga con `fetch()`.

**Windows (lo más fácil):**

- Sitio web: doble clic en **`preview.cmd`** → abre <http://localhost:8080/>.
- Panel visual: doble clic en **`Abrir panel (local).cmd`** → levanta el servidor (si no estaba) y abre <http://localhost:8080/admin/editor.html>.

**Manual (cualquier sistema):**

```bash
# Node (incluido en este repo, sin dependencias)
node tools/serve.js . 8080
# o con cualquier otro servidor estático
python -m http.server 8080
npx serve .
```

Luego visitá `http://localhost:8080` (web), `http://localhost:8080/admin/editor.html` (panel visual) o `http://localhost:8080/admin/` (Sveltia).

> **No uses `file://`** (abrir `index.html` con doble clic): el navegador bloquea `fetch()` de archivos locales y verás el mensaje *"No se pudo cargar el contenido"*.

---

## Cómo editar el contenido

Hay **dos formas**, según quién edite:

### 1. Para el cliente — Panel visual (la única herramienta)

Se edita **todo** con el navegador, sin tocar código: textos, fotos, productos, precios, orden de secciones, datos del local, SEO, y hasta los campos técnicos (en «Campos avanzados»). Entrada: `/admin/editor.html` (ver [Panel visual de administración](#panel-visual-de-administración)). El panel antiguo (Sveltia) fue retirado: todo está integrado en el editor visual.

### 2. Para el desarrollador — Archivos JSON directamente

Todo el contenido está en dos archivos. Se editan con cualquier editor de texto y el sitio se republica solo al hacer commit.

#### `data/sitio.json` — datos globales

| Clave | Para qué sirve |
|---|---|
| `marca` | Logo (`logo`, `logoAlt`), nombre (`nombre`, `nombreSecundario`) y etiqueta accesible (`ariaLabel`) |
| `negocio.whatsapp` | Número internacional **sin `+`, espacios ni guiones** (ej.: `543874578676`) |
| `negocio.whatsappDisplay` | El mismo número como se muestra (ej.: `+54 9 387 457-8676`) |
| `negocio.whatsappMensaje` | Mensaje inicial de la conversación de WhatsApp |
| `negocio.phone` | Teléfono fijo/alternativo. **Vacío = se oculta** |
| `negocio.email` | Correo de contacto. **Vacío = se oculta** |
| `negocio.address` | Dirección del local. **Vacía = se oculta** |
| `negocio.hours` | Horarios. **Vacío = se oculta** |
| `negocio.mapsQuery` | Coordenadas `lat,lng` o dirección para el botón "Cómo llegar" |
| `negocio.carouselDelay` | Milisegundos entre fotos del carrusel (3000 = 3 s) |
| `redes` | `instagram`, `tiktok`, `facebook`, cada una con `url` y `etiqueta` |
| `nav` | Lista del menú: `texto` + `ancla` (ej.: `#productos`) |
| `navCtaTexto` | Texto del botón de WhatsApp del menú |
| `footer` | Descripción, títulos de columnas, `ordenSocial`, `whatsappTexto` y `copyright` |

#### `data/pagina.json` — secciones de la portada

Es una lista `secciones`. **El orden de la lista es el orden en la web.** Cada sección tiene un `tipo` y campos propios:

| `tipo` | Qué renderiza | Campos principales |
|---|---|---|
| `hero` | Portada con carrusel | `id`, `aria`, `eyebrow`, `titulo`, `texto`, `botonPrincipal`, `botonSecundario`, `carruselAria`, `slides[]` |
| `categorias` | Dos tarjetas (Perros/Gatos) | `id`, `eyebrow`, `titulo`, `intro`, `ctaTexto`, `tarjetas[]` |
| `productos` | Galería con filtros | `id`, `eyebrow`, `titulo`, `intro`, `mostrarFiltros`, `ctaTexto`, `productos[]` |
| `imagenTexto` | Foto + texto | `id`, `eyebrow`, `titulo`, `texto`, `vinetas[]`, `imagen`, `imagenAlt`, `boton` |
| `contacto` | Datos de contacto | `id`, `eyebrow`, `titulo`, `intro`, `botonWhatsapp`, `botonMapsTexto`, `ordenSocial` |

**Detalle de campos con reglas especiales:**

- **`titulo` del `hero`** admite marcado mínimo: `**palabra**` la pone en color de acento y `*palabra*` en cursiva. En el resto de los campos el texto es plano.
- **`productos[].mascotas`**: es un **texto** con valores separados por espacios (`perro`, `gato`, o `perro gato`). Define en qué filtros aparece la tarjeta. No es una lista.
- **`productos[].precio`** (opcional): **texto libre**. Si queda vacío, el precio **no se muestra**.
- **`slides[].ancho` / `alto`**, **`tarjetas[].ancho` / `alto`**, **`imagenAncho` / `imagenAlto`**: opcionales. Ayudan a reservar el espacio de la imagen y evitar saltos de layout. El CSS fija la geometría con `aspect-ratio` + `object-fit`, así que **ocultarlos o dejarlos vacíos no deforma las imágenes**.
- **`slides[].srcset` / `sizes`**: opcionales, para servir la variante `-900` en pantallas chicas. En el panel figuran como campos ocultos.
- **`slides[].prioridad`**: reservado para marcar la primera foto como carga prioritaria.
- **`huella`** (en cada sección): `izquierda`, `derecha` o `ninguna`. Reservado para los caminos de huellas decorativos (ver [Pendientes](#pendientes--todo) — el paw-trail todavía usa posiciones fijas por ancla).

**Regla general:** cualquier campo de texto vacío (`""`) **no se muestra**; los botones y tarjetas asociados se ocultan automáticamente para no enlazar a destinos vacíos. Las imágenes se guardan en `assets/img/`.

---

## Panel visual de administración

`/admin/editor.html` es un **editor tipo constructor de páginas** hecho a medida, sin frameworks: lista de secciones + vista previa en vivo del sitio (un `iframe` del sitio real) + edición **directa sobre la vista previa**.

### Qué se puede hacer

| Acción | Cómo |
|---|---|
| Editar cualquier texto | Clic sobre el texto en la vista previa (títulos, párrafos, botones, menú, pie, viñetas, productos) y escribir encima. También en el modo «Textos» con formularios |
| Cambiar una imagen | Clic sobre la foto en la vista previa → galería del repo o subir una nueva |
| Subir imágenes | Pestaña «Subir desde la PC»: canvas la optimiza (JPEG 82 %, máx. 1600 px + variante `-900` cuando el campo la usa; el logo mantiene PNG). Va al repo en **un solo commit por imagen** (Git Data API) |
| Agregar / quitar / reordenar secciones | Lista de la izquierda: drag & drop, ↑ ↓, ocultar (ojo), duplicar, eliminar, «+ Agregar sección» |
| Agregar / quitar / reordenar productos | En el formulario («+ Agregar producto», «Quitar este producto») o con la insignia ✕ que aparece sobre el producto en la vista previa |
| Fotos de productos y carrusel | Agregar, quitar, reordenar y reemplazar fotos por producto y por slide del carrusel |
| Datos del local | Pestaña «Datos del local»: WhatsApp, dirección, horarios, redes, menú, pie (edita `data/sitio.json`) |
| Volver atrás | **Deshacer/rehacer** tipo Word: flechas ↶ ↷ en la barra superior, `Ctrl+Z` / `Ctrl+Y` (también con el foco en la vista previa). Historial de hasta 60 pasos |
| Recuperar algo ya publicado | **Historial de versiones** (ícono de reloj): lista las últimas versiones publicadas de cada archivo con fecha y mensaje; «Restaurar» carga la versión **como borrador** para revisarla en la vista previa — nada se publica solo y la restauración es deshacible |
| Copias de seguridad | Ícono de copias: copias locales del contenido en el navegador (hasta 15). Se guarda una **automática antes de cada publicación**; también manuales, **descargables a un archivo** y se pueden **subir desde archivo**. Restaurar carga como borrador |
| Campos avanzados | Todo lo que antes hacía el panel antiguo, integrado: `id`/anclas (con advertencia), `srcset`/`sizes`/medidas/prioridad en cajas plegables, `huella` del camino decorativo (con opción «ninguna») |
| SEO | En «Datos del local», bloque **SEO** con título y descripción (con pistas de longitud). JSON-LD con URLs absolutas, horarios leídos de los datos, `url`, `logo`, `priceRange` |
| Publicar | Botón «Publicar cambios» → 1 commit por archivo que haya cambiado (portada y/o datos del local). En ~1 min está en la web |
| Ayuda integrada | Botón **«?»** en la barra superior: guía corta y clara de todo el panel (textos, fotos, productos, publicar, deshacer, sesión) |

**Modelo de datos del editor:** los cambios viven como **borrador** en el navegador (borrador automático en `localStorage`, se recupera al volver a entrar) hasta «Publicar cambios» o «Descartar». La **única excepción** es la subida de imágenes nuevas, que se commitea en el momento (una imagen en borrador no tiene sentido). Si el archivo cambió en GitHub mientras editabas (p. ej. desde Sveltia), al publicar se detecta el conflicto y se ofrece recargar o quedarse con el borrador.

### Piezas

| Pieza | Rol |
|---|---|
| `admin/editor.html` + `editor.css` | Shell del panel: login, carga, topbar, pestañas, lista, vista previa, modales |
| `admin/editor.js` | Estado, API de GitHub, lista de secciones, borradores, publicación |
| `admin/editor-form.js` | Constructor de formularios a partir del JSON (reglas por campo, listas, items) |
| `admin/editor-inline.js` | Edición in situ en la vista previa: marca los textos editables, contenteditable, reconstruye `**negritas**` del hero, controla clic/foco/Escape |
| `admin/editor-media.js` | Selector de imágenes: galería (API) + subida optimizada con canvas |
| `tools/worker-editor.js` | Worker de Cloudflare **extendido** para el login del editor (el original de Sveltia sigue intacto para `/admin/`) |
| Cloudflare Worker `sveltia-cms-auth` | Solo gestiona el login con GitHub (OAuth). Modo `client=editor` redirige de vuelta al panel con el token en el fragmento (`#`), que nunca viaja a un servidor |
| OAuth App de GitHub | Autoriza el login (Client ID + Secret) |

### Flujo de login (panel visual)

1. En `/admin/editor.html`, clic en **«Iniciar sesión con GitHub»**.
2. Se navega (misma pestaña) al Worker con `provider=github`, `site_id=<dominio>`, `client=editor` y `redirect=<origen>`.
3. El Worker valida el dominio contra `ALLOWED_DOMAINS`, guarda una cookie de retorno y redirige a GitHub.
4. Al autorizar, GitHub vuelve al `/callback` del Worker, que canjea el código por un token y **redirige al editor** con `#access_token=…`.
5. El editor guarda el token en `sessionStorage` (vive en esa pestaña; «Salir» lo borra) y opera contra la API de GitHub.

También hay un **respaldo con token personal** (avanzado) para el caso en que el login fallé.

### Variables de entorno del Worker (Cloudflare → Production)

| Variable | Valor | ¿Secret? |
|---|---|---|
| `GITHUB_CLIENT_ID` | Client ID de la OAuth App | No |
| `GITHUB_CLIENT_SECRET` | Client Secret de la OAuth App | **Sí** |
| `ALLOWED_DOMAINS` | `laboutiquecatydog.github.io, localhost` — **`localhost` a secas** (el patrón se aplica al *hostname*, sin puerto; el comodín `localhost*` NO matchea) | No |

> Los nombres deben escribirse **exactos, en inglés y en mayúsculas**. Cloudflare suele traducir los nombres a español (p. ej. `ID_CLIENTE_GITHUB`) y entonces el Worker no los encuentra.
> El código a pegar en Cloudflare es `tools/worker-editor.js` (versión del worker oficial `sveltia-cms-auth` + modo editor; el flujo de Sveltia queda intacto).

### Sobre Sveltia CMS (retirado)

El proyecto arrancó con **Sveltia CMS** en `/admin/` como primer panel. Todo lo que hacía quedó integrado en el editor visual (formularios completos + «Campos avanzados»), así que se retiró: `admin/index.html` ahora solo redirige al editor y `admin/config.yml` se eliminó. El Worker de Cloudflare conserva el nombre `sveltia-cms-auth` porque maneja el login de ambos (y el de Sveltia sigue funcionando por si algún día hiciera falta restaurarlo desde el historial de git).

---

## Despliegue (GitHub Pages)

El sitio es 100 % estático y se publica como **sitio de usuario**: el repositorio `laboutiquecatydog.github.io` se sirve desde la rama `main` (raíz), sin build.

- **URL publicada:** <https://laboutiquecatydog.github.io/>
- Repositorio: `https://github.com/laboutiquecatydog/laboutiquecatydog.github.io`
- Configuración: **Settings → Pages → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)`; **HTTPS activado**.

Para actualizar, subí los cambios a `main` y Pages reconstruye automáticamente. Esto aplica también a los cambios que hace el panel: cada guardado es un commit y el sitio se republica.

---

## Imágenes

- Todo lo que se muestra está en `assets/img/`, ya **optimizado** (JPG + variantes `-900` para pantallas chicas).
- Las imágenes subidas desde el panel van directo a **`assets/img/`** (un commit por imagen, con `srcset`/medidas autogenerados).
- `assets/img/og-image.jpg` (1200×630): imagen dedicada para previews de WhatsApp/redes (Open Graph / Twitter Cards).
- Las **versiones originales de alta resolución** están en `Contenido Imagenes/` y **no se publican ni se versionan** (26 MB).
- Las imágenes de las tarjetas de categorías —`assets/img/seccion-perros.jpg` (1280×720) y `assets/img/seccion-gatos.jpg` (1280×698)— son **copias optimizadas** de los originales en `Contenido Imagenes/Secciones/`.
- Favicon en SVG (`assets/img/favicon.svg`) e icono para iOS (`assets/img/apple-touch-icon.png`).

---

## SEO y accesibilidad

**Metadatos y posicionamiento:**
- `robots.txt` (excluye `/admin/` y archivos internos) y **`sitemap.xml`** en la raíz — este es el que se envía en Search Console para pedir la indexación.
- Título y descripción **editables desde el panel** (bloque `seo` en `data/sitio.json`, con pistas de longitud: título ≤ 60, descripción ≤ 155 caracteres) y aplicados en vivo por `updateSEO()`.
- **Datos estructurados** JSON-LD de tipo `PetStore` regenerados con los datos reales: URLs absolutas, `url`, `logo`, `image`, `priceRange`, `@id`, **horarios leídos de `negocio.hours`** (no hardcodeados), dirección, geolocalización (`geo` + `hasMap`) y `sameAs` con las redes.
- Open Graph y Twitter Cards con `og-image.jpg` dedicada.
- Textos del contenido con intención local (Salta) en título, descripción, portada, contacto y pie.

**Accesibilidad:**
- `<html lang="es">`, encabezados jerárquicos, `alt` descriptivos, navegación con `aria-label`, botones con `aria-expanded`/`aria-controls`, y foco visible.
- Colores con contraste sobre fondos claros; el sitio es responsive (móvil/tablet/desktop) y respeta `prefers-reduced-motion`.

**Pendiente de SEO (fuera del código):** verificar en **Google Search Console** (enviar el sitemap y pedir indexación) y crear/reclamar la ficha de **Google Business Profile** — el factor #1 para búsquedas locales como "pet shop cerca mío". Guías paso a paso cuando el cliente esté listo.

---

## Seguridad

Auditoría completa (24/10/2026) con pruebas automáticas de vulnerabilidades — ver el informe detallado en **`guias/INFORME-SEGURIDAD.md`**. Síntesis:

- **XSS por contenido**: todos los textos del JSON se escapan al renderizar; los enlaces editables se sanitizan (`hrefSeguro`: solo `#`, rutas internas, `https:`, `mailto:`, `tel:` — `javascript:` queda en `#`). Probado con batería de 25+ payloads en todos los campos: 0 ejecuciones.
- **CSP activa** en sitio y panel (meta tag): bloquea scripts inline/externos no autorizados manteniendo todo funcional (verificado: 0 violaciones en consola).
- **Token de sesión**: OAuth por Worker de Cloudflare, vive solo en `sessionStorage`, nunca en la URL ni en localStorage, y se envía exclusivamente a `api.github.com` (verificado con instrumentación de red).
- **Servidor local**: blindado contra path traversal (10 variantes probadas, todas 403) + `nosniff`; solo escucha en 127.0.0.1.
- **Login**: contraseñas nunca tocan el sitio (GitHub OAuth); dominios validados en el Worker; cookies del flujo `HttpOnly` + `SameSite=Lax` + `Secure`.
- **Repositorio privado**: solo colaboradores pueden leer/escribir; cada cambio es un commit firmado con autor.
- Recomendación para el cliente: **2FA en la cuenta de GitHub** (la única llave del negocio).

---

## Componente: caminos de huellas (`js/paw-trail.js`)

Es el detalle visual característico del sitio: tramos de huellas serpenteantes que enlazan las secciones, como si un perro y un gato hubieran pasado por el margen de la página.

### Qué hace
- Dibuja **un único `<svg class="paw-trails">`** como último hijo de `<main>`, cubriendo todo el alto de la página.
- Genera **un tramo por sección VISIBLE**, siguiendo **el orden real de `data/pagina.json`** y el campo **`huella`** de cada sección (editable en el panel):
  - `huella: "izquierda"` o `"derecha"` → el camino va de ese lado.
  - `huella: "ninguna"` → esa sección no lleva camino.
  - Sin valor → se intercala solo para no repetir lado dos veces seguidas.
- Así, si el cliente reordena, agrega, oculta o duplica secciones desde el panel, el camino acompaña. (Antes usaba una tabla fija por ancla y quedaba desalineado al reordenar).
- En **móvil** (`<641px`) solo quedan el **primer y el último tramo** (lados opuestos), para no invadir el contenido.

### Reglas de dibujo
- **Sin `viewBox`**: el SVG usa píxeles reales 1:1 con `<main>`, evitando distorsión o escalado inesperado.
- La **Y es estrictamente lineal** dentro de la banda de su sección (`offsetTop` / `offsetHeight`); la **onda vive solo en X** (`sin`), así el tramo sigue el flujo vertical de la página.
- La **canaleta** (margen entre la ventana y el contenedor) se adapta al ancho de pantalla: en pantallas anchas el serpenteo usa amplitud completa; en angostas la senda se cierra contra el borde sin invadir texto ni fotos.
- **Orientación**: las huellas siempre apuntan con los **dedos hacia arriba**, con una inclinación suave que sigue la onda (acotada a ±22°) más un jitter de pisada ±12°.
- **Tamaño y opacidad** varían con una semilla fija (`0xC0FFEE`) mediante un PRNG determinista (`mulberry32`), así el patrón es natural pero **idéntico en cada carga** (reproducible y testeable). El fade de los extremos es **solo en opacidad**; el tamaño nunca se encoge.

### Las huellas
Dos formas en `<defs>`, reutilizadas con `<use>` (ligeras, sin imágenes ni emojis):

| Huella | Almohadilla | Distinguible por |
|---|---|---|
| **Perro** (`#pt-d`) | ancha, **dos lóbulos arriba con muesca central** | almohadilla más ancha y redondeada |
| **Gato** (`#pt-c`) | **triangular**, punta hacia arriba, base ligeramente trilobulada | más chica y angosta, punta arriba |

Ambas son 4 dedos en arco + almohadilla, en tinta plana azul `#315A9E`, escaladas para que se lean a ~15–20 px. Se alternan en toda la página (`perro → gato → perro → …`).

### Constantes a ajustar
Están al principio del archivo:

| Constante | Valor | Qué controla |
|---|---|---|
| `SEED` | `0xC0FFEE` | Semilla del PRNG (patrón reproducible) |
| `WAVES` | `2.2` | Ondas por tramo |
| `AMPLITUDE_MAX` | `55` | Amplitud máxima del serpenteo (px) |
| `STEP_OFFSET_MAX` | `14` | Zigzag de pisada por paso (px) |
| `STEP_JITTER` | `8` | Ruido por huella (±4 px) |
| `STEP_SPACING` | `56` | Separación vertical aproximada (px) |
| `CONTAINER_MAX` | `1180` | Ancho del contenedor (coincide con CSS) |

### Accesibilidad y rendimiento
- Decoration pura: `aria-hidden="true"`, `focusable="false"` y `pointer-events: none`.
- **Sin dependencias, sin `requestAnimationFrame` ni animaciones**: se dibuja una vez y en `resize` (con *debounce* de 250 ms).
- **Degradable**: si algo falla, el `try/catch` lo deja pasar y la página funciona igual.

---

## Detalles técnicos

- **Sin frameworks ni dependencias** (solo Google Fonts por CDN): sin `node_modules`, sin build, sin sorpresas al desplegar.
- **JavaScript ES5 estricto** (`var`, funciones, sin flechas ni *template literals*) dentro de IIFEs con `"use strict"`.
- **Escapado de seguridad** en `js/render.js`: los textos se escapan (`&`, `<`, `>`; comillas en atributos). El cliente **nunca** inyecta HTML crudo; solo `**negrita**` y `*cursiva*` generan marcado, y únicamente en el título del hero.
- **Render por strings**: `js/render.js` concatena HTML en lugar de usar plantillas, para no añadir dependencias.
- **Sin `viewBox` ni `preserveAspectRatio`** en el SVG de las huellas.
- **Sin z-index negativos** ni `main > *`: las huellas viven en `z-index: 0` dentro de `<main>` (`position: relative`).
- **`js/config.js` ya no se usa**: los datos se migraron a `data/*.json`. El archivo se conserva como referencia.

---

## Estado del proyecto

Sitio publicado en GitHub Pages con el contenido en JSON. **El rediseño de la landing y todo el panel visual (W1–W4) están terminados en local** y esperan el push final (W5).

| Etapa | Cambio | Estado |
|---|---|---|
| Portada / responsive / CSS | Hero en dos columnas, ajustes móviles, tokens de diseño | Publicado |
| **G1 — contenido a JSON** | Todo el contenido pasó a `data/*.json` con `js/render.js` (verificado A/B) | Publicado |
| **G2 — panel Sveltia** | `/admin/` con login GitHub vía Cloudflare Worker; campos de texto opcionales (`required: false`) | Publicado |
| **G3 — rediseño estético** | Typewriter del título (con watchdog), reveal escalonado, barra de progreso, SEO dinámico desde JSON, sección de productos rediseñada | Local (pendiente de push) |
| **W1 — editor visual** | Login, lista de secciones (reordenar/ocultar/duplicar/eliminar/agregar), vista previa, publicación por commits; Worker extendido (`client=editor`) | Local + Worker ya desplegado |
| **W2 — textos y datos** | Formularios por campo + pestaña «Datos del local» (`sitio.json`), publicación de ambos archivos | Local |
| **W2.5 — edición en la vista** | Edición in situ sobre la vista previa (`contenteditable`), re-render con los datos del editor, flag `oculto` respetado por el render | Local |
| **W3 — imágenes** | Galería del repo + subida optimizada (1600/900, JPEG 82 %), alta/baja/reorden de productos y fotos, cambio de logo | Local |
| **W4a — catálogo y control** | Paginación automática del catálogo (6 por página, filtros coordinados), quitar producto desde la vista previa | Local |
| **W4b — deshacer y conflictos** | Deshacer/rehacer (historial de instantáneas, `Ctrl+Z`/`Ctrl+Y` + botones), chip que refleja la diferencia real con lo publicado, chequeo de conflictos pre-publicación (SHA en GitHub vs. local) con opciones claras | Local |
| **W4c — seguridad total** | Flechas tipo Word (íconos ↶ ↷), atajos activos también dentro de la vista previa, e **Historial de versiones**: restaurar versiones publicadas desde el historial de commits (carga como borrador, deshacible) | Local |
| **W5a — SEO/GEO técnico** | `robots.txt` + `sitemap.xml`, bloque **`seo`** editable desde el panel (título/descripción con pistas), JSON-LD con URLs absolutas + `url`/`logo`/`priceRange`/`@id` + **horarios leídos de los datos**, `og-image.jpg` 1200×630, textos con intención local (Salta) | Local |
| **W5b — editor único** | **Sveltia retirado**: todo integrado en el editor visual (campos avanzados plegables, `id` editable con advertencia, `huella` con «ninguna»); `/admin/` redirige al editor; `config.yml` eliminado | Local |
| **W5c — copias + robustez** | **Copias de seguridad** en el navegador (auto antes de publicar, manuales, descargar/subir archivo, restaurar como borrador); la vista previa refleja reordenar/ocultar/agregar en vivo; paw-trail dinámico; `.gitignore` con `graphify-out/` | Local |
| **W5d — cierre** | Push general a producción, smoke test, guías de Search Console + Google Business Profile, guía del cliente | Pendiente |

---

## Pendientes / TODO

- [ ] **W5d — cierre y publicación (con instrucción del cliente):** push general a producción (rediseño + editor + SEO), smoke test en la web pública.
- [ ] **Search Console + Google Business Profile:** guías paso a paso para el cliente (verificación, envío de `sitemap.xml`, pedido de indexación, alta/reclamo de la ficha de Maps con NAP consistente). El cliente decidió dejarlo para después del push.
- [ ] **Guía del cliente:** video o PDF corto con la rutina del panel (entrar → editar → publicar).
- [ ] Verificar si los filtros comparten bien "Camas" y "Accesorios" (mapeo `mascotas` es supuesto).
- [ ] Verificar resolución de `assets/img/local.jpg` (449×660, podría verse baja como fondo).
- [ ] Revisar recorte/encuadre de las fotos de producto.
- [ ] Decidir si se limpia el Worker accidental `laboutiquecatydog-github-io` (ya no se usa; la web va por GitHub Pages).
- [ ] Considerar dominio propio + SSL si el negocio quiere una URL de marca.

---

## Licencia y contacto

Contenido y marca de **La Boutique Cat & Dog**. Para consultas: `laboutiquecatydog@gmail.com`.
