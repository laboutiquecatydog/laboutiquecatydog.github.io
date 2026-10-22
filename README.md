# La Boutique Cat & Dog — Landing page + panel de contenido

Sitio web de una sola página (landing) para **La Boutique Cat & Dog**, tienda de productos para perros y gatos. HTML + CSS + JavaScript vanilla, **sin frameworks, sin dependencias y sin paso de build**.

El contenido (textos, imágenes, enlaces y secciones) **no está en el HTML**: vive en archivos JSON dentro de `data/` y se renderiza en el navegador con JavaScript. Sobre esa base hay un **panel de administración** en `/admin/` para que el cliente edite todo desde una interfaz gráfica, sin tocar código.

**Vista previa:** <https://laboutiquecatydog.github.io/>
**Panel:** <https://laboutiquecatydog.github.io/admin/> *(debés figurar como colaborador del repositorio; ver [Panel de administración](#panel-de-administración)).*

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
| Productos (`productos`) | `#productos` | Galería de productos con filtros **Todos / Perros / Gatos** y carrusel por producto |
| Nosotros (`imagenTexto`) | `#nosotros` | Foto a un lado y texto + viñetas + botón al otro |
| Contacto (`contacto`) | `#contacto` | WhatsApp, redes, ubicación/mapa, horarios, teléfono y correo |
| Header | `.site-header` | Logo, menú, botón de WhatsApp |
| Footer | `.site-footer` | Marca, secciones, datos de contacto, redes y año dinámico |

**Funcionalidades:** menú móvil con overlay y scroll-spy, carruseles con teclado/touch/autoplay (pausa al enfocar o pasar el mouse), animaciones de aparición al hacer scroll, enlaces de WhatsApp/Google Maps generados desde los datos, filtros de productos por mascota, y **caminos decorativos de huellas** de perro y gato entre las secciones.

---

## Estructura

```
la-boutique-cat-y-dog/
├── index.html              # Esqueleto: <head> (SEO, fuentes, JSON-LD) y contenedores
├── preview.cmd             # Doble clic: inicia el servidor local y abre el sitio
├── css/
│   └── styles.css          # Todos los estilos (variables, layout, componentes)
├── js/
│   ├── render.js           # Motor de render: data/*.json  →  HTML
│   ├── main.js             # Carga los datos, setConfig y todas las interacciones
│   ├── paw-trail.js        # Caminos decorativos de huellas (SVG)
│   └── config.js           # ⚠️ SIN USO (se conserva como referencia histórica)
├── data/
│   ├── sitio.json          # Datos globales: marca, negocio, redes, nav, footer
│   └── pagina.json         # Bloques/secciones de la portada, en orden
├── admin/
│   ├── index.html          # Carga Sveltia CMS por CDN
│   └── config.yml          # Configuración del panel (colecciones, campos, media)
├── assets/
│   └── img/
│       └── managed/         # Imágenes subidas desde el panel (.gitkeep inicial)
└── tools/
    └── serve.js            # Servidor estático local sin dependencias (Node)
```

> **Excluido del repo** (ver `.gitignore`): `Contenido Imagenes/` (26 MB de imágenes originales; las optimizadas ya están en `assets/img/`) y `_backup/` (copias de seguridad históricas de etapas previas).

---

## Abrir el sitio en local

No hay dependencias ni paso de compilación, pero **sí hace falta un servidor** porque el contenido se carga con `fetch()`.

**Windows (lo más fácil):** hacé doble clic en **`preview.cmd`**. Verifica que tengas Node.js, inicia `tools/serve.js` en el puerto 8080 y abre el navegador automáticamente en <http://localhost:8080/>.

**Manual (cualquier sistema):**

```bash
# Node (incluido en este repo, sin dependencias)
node tools/serve.js . 8080
# o con cualquier otro servidor estático
python -m http.server 8080
npx serve .
```

Luego visitá `http://localhost:8080`. El panel queda en `http://localhost:8080/admin/`.

> **No uses `file://`** (abrir `index.html` con doble clic): el navegador bloquea `fetch()` de archivos locales y verás el mensaje *"No se pudo cargar el contenido"*.

---

## Cómo editar el contenido

Hay **dos formas**, según quién edite:

### 1. Para el cliente — Panel de administración (recomendado)

Ver [Panel de administración](#panel-de-administración). Se edita todo (textos, datos, imágenes, precios, secciones) con formularios, en `https://laboutiquecatydog.github.io/admin/`.

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

## Panel de administración

El panel (`/admin/`) usa **Sveltia CMS**, un CMS de archivos que edita los JSON del repositorio por la API de GitHub y hace *commits*. No hay base de datos ni servidor propio: el contenido sigue siendo `data/*.json`.

### Piezas

| Pieza | Rol |
|---|---|
| `admin/index.html` | Carga Sveltia por CDN (`unpkg.com/@sveltia/cms`). Sin `type="module"`, sin CSS propio |
| `admin/config.yml` | Define las colecciones (`sitio` y `pagina`), los campos de cada una y la carpeta de medios |
| GitHub Pages | Sirve el sitio **y** el panel (estático) |
| Cloudflare Worker `sveltia-cms-auth` | **Solo** gestiona el login con GitHub (OAuth). No sirve contenido |
| OAuth App de GitHub | Autoriza el login (Client ID + Secret) |

### Flujo de login (resumen)

1. En `/admin/` clic en **"Iniciar sesión con GitHub"**.
2. Sveltia abre una ventana al Worker con `provider=github` y `site_id`.
3. El Worker redirige a GitHub; al autorizar, GitHub devuelve un código al Worker (`/callback`).
4. El Worker canjea el código por un token y lo entrega a Sveltia.
5. Sveltia queda autenticado y opera contra el repo.

### Variables de entorno del Worker (Cloudflare → Production)

| Variable | Valor | ¿Secret? |
|---|---|---|
| `GITHUB_CLIENT_ID` | Client ID de la OAuth App | No |
| `GITHUB_CLIENT_SECRET` | Client Secret de la OAuth App | **Sí** |
| `ALLOWED_DOMAINS` | Dominios permitidos, separados por coma. Para producción: `laboutiquecatydog.github.io`. Para pruebas locales: agregar `localhost*` (el `*` cubre el puerto) |

> Los nombres deben escribirse **exactos, en inglés y en mayúsculas**. Cloudflare suele traducir los nombres a español (p. ej. `ID_CLIENTE_GITHUB`) y entonces el Worker no los encuentra.

### Configuración del backend (`admin/config.yml`)

```yaml
backend:
  name: github
  repo: laboutiquecatydog/laboutiquecatydog.github.io
  branch: main
  base_url: https://sveltia-cms-auth.laboutiquecatydog10.workers.dev
  site_domain: laboutiquecatydog.github.io   # dominio que el Worker valida
media_folder: /assets/img/managed
public_folder: /assets/img/managed
```

- `site_domain` es necesario porque el Worker valida el dominio contra `ALLOWED_DOMAINS`.
- `media_folder` y `public_folder` deben ser **rutas absolutas** (empezar con `/`).
- Las colecciones son de tipo `files` (un archivo JSON fijo cada una): `sitio` → `data/sitio.json` y `pagina` → `data/pagina.json`.

### Requisitos para publicar el panel

Sveltia necesita que **el panel ya esté publicado** y que la persona que inicia sesión sea **colaboradora del repositorio** (rol Write, Maintain o Admin), porque los cambios se hacen por commits/API.

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
- Las imágenes subidas desde el panel van a **`assets/img/managed/`**.
- Las **versiones originales de alta resolución** están en `Contenido Imagenes/` y **no se publican ni se versionan** (26 MB).
- Las imágenes de las tarjetas de categorías —`assets/img/seccion-perros.jpg` (1280×720) y `assets/img/seccion-gatos.jpg` (1280×698)— son **copias optimizadas** de los originales en `Contenido Imagenes/Secciones/`.
- Favicon en SVG (`assets/img/favicon.svg`) e icono para iOS (`assets/img/apple-touch-icon.png`).

---

## SEO y accesibilidad

- **Meta** completas: `description`, `keywords`, `robots`, `theme-color`, Open Graph y Twitter Cards.
- **Datos estructurados** JSON-LD de tipo `PetStore` (SEO local) dentro de `index.html`.
- `<html lang="es">`, encabezados jerárquicos, `alt` descriptivos, navegación con `aria-label`, botones con `aria-expanded`/`aria-controls`, y foco visible.
- Colores con contraste sobre fondos claros; el sitio es responsive (móvil/tablet/desktop) y respeta `prefers-reduced-motion`.

> El contenido editable (SEO, Open Graph, JSON-LD) todavía vive en `index.html`, **no** en los JSON. El panel edita el contenido visible; cambiar metadatos de SEO requiere tocar `index.html`.

---

## Componente: caminos de huellas (`js/paw-trail.js`)

Es el detalle visual característico del sitio: tramos de huellas serpenteantes que enlazan las secciones, como si un perro y un gato hubieran pasado por el margen de la página.

### Qué hace
- Dibuja **un único `<svg class="paw-trails">`** como último hijo de `<main>`, cubriendo todo el alto de la página.
- Genera **varios tramos**, uno por sección, **intercalando lados**:

  | Tramo | Sección | Lado |
  |---|---|---|
  | 1 | `#inicio` (`.intro`) | izquierda |
  | 2 | `#categorias` | derecha |
  | 3 | `#productos` | derecha |
  | 4 | `#nosotros` | izquierda |
  | 5 | `#contacto` | derecha |

- En **móvil** (`<641px`) solo quedan `#inicio` y `#contacto` (lados opuestos), para no invadir el contenido.

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

Sitio publicado en GitHub Pages, con el contenido migrado a JSON y un panel de administración.

| Etapa | Cambio |
|---|---|
| Portada | Hero en dos columnas (texto + carrusel) |
| Responsive | Ajustes en móvil/tablet (hero, imágenes, sin scroll horizontal) |
| Limpieza CSS | Tokens y reglas sin uso eliminados; color de acento de marca |
| Categorías | Tarjetas tipo boutique con imágenes **Perros** y **Gatos** integradas |
| **G1 — contenido a JSON** | Todo el contenido pasó a `data/sitio.json` y `data/pagina.json`, con `js/render.js` como motor de render (verificado A/B: layout idéntico) |
| **G2 — panel** | `/admin/` con Sveltia CMS, login GitHub vía Cloudflare Worker y edición de ambos JSON |

---

## Pendientes / TODO

- [ ] **Bloques nuevos (G3):** catálogo ampliado (texto libre, imagen ancha, galería, franja CTA) y editor fino de bloques desde el panel.
- [ ] **Paw-trail dinámico (G4):** hoy usa posiciones y lados **fijos por ancla**, no lee el campo `huella` de `data/pagina.json`. Falta conectarlo (y su pulido visual).
- [ ] **Editor de contenido avanzado (G5) + guía del cliente:** instrucciones de uso del panel, del repositorio y de Cloudflare.
- [ ] **CSS `.product-price`:** falta el estilo del precio opcional de los productos.
- [ ] Verificar si los filtros comparten bien "Camas" y "Accesorios" (mapeo `mascotas` es supuesto).
- [ ] Verificar resolución de `assets/img/local.jpg` (449×660, podría verse baja como fondo).
- [ ] Revisar recorte/encuadre de las fotos de producto.
- [ ] Decidir si se limpia el Worker accidental `laboutiquecatydog-github-io` (ya no se usa; la web va por GitHub Pages).
- [ ] Considerar dominio propio + SSL si el negocio quiere una URL de marca.

---

## Licencia y contacto

Contenido y marca de **La Boutique Cat & Dog**. Para consultas: `laboutiquecatydog@gmail.com`.
