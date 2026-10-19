# La Boutique Cat & Dog — Landing page

Sitio web de una sola página (landing) para **La Boutique Cat & Dog**, tienda de productos para perros y gatos. HTML + CSS + JavaScript vanilla, **sin frameworks ni build**: se abre directo en el navegador y se sirve tal cual desde cualquier servidor estático (GitHub Pages, Netlify, etc.).

**Vista previa:** <https://laboutiquecatydog.github.io/>
*(publicada con GitHub Pages, rama `main`, raíz; ver [Despliegue](#despliegue-github-pages)).*

---

## Contenido del sitio

Una sola página con navegación por anclas:

| Sección | Elemento | Contenido |
|---|---|---|
| Portada | `#inicio` (`.hero`) | Carrusel de fotos, título y botón de WhatsApp |
| Bienvenida | `.intro` | Texto de presentación del negocio |
| Categorías | `#categorias` | Tarjetas **Perros** y **Gatos** (con imagen) que enlazan a Productos |
| Productos | `#productos` | Galería de productos con carrusel |
| Nosotros | `#nosotros` | Información del local y foto |
| Contacto | `#contacto` | WhatsApp, redes, mapa y horarios |
| Pie | `.site-footer` | Datos de contacto y año dinámico |

**Funcionalidades:** menú móvil con overlay y scroll-spy, carruseles con teclado/touch/autoplay (pausa al enfocar o pasar el mouse), animaciones de aparición al hacer scroll, enlaces de WhatsApp/Google Maps generados desde la configuración, y **caminos decorativos de huellas** de perro y gato entre las secciones.

---

## Estructura

```
la-boutique-cat-y-dog/
├── index.html              # Única página: markup, SEO y JSON-LD
├── css/
│   └── styles.css          # Todos los estilos (variables, layout, componentes)
├── js/
│   ├── config.js           # ← ÚNICO archivo a editar para cambiar datos del negocio
│   ├── main.js             # Interacciones (menú, carruseles, reveal, enlaces)
│   └── paw-trail.js        # Caminos decorativos de huellas (SVG)
└── assets/
    └── img/                # Imágenes optimizadas usadas por el sitio
```

> **Excluido del repo** (ver `.gitignore`): `Contenido Imagenes/` (26 MB de imágenes originales; las optimizadas ya están en `assets/img/`) y `_backup/` (copias de seguridad históricas de etapas previas).

---

## Abrir el sitio en local

No hay dependencias ni paso de compilación.

1. Cloná o descargá el repositorio.
2. Abrí `index.html` con doble clic (funciona con `file://`), **o** servilo localmente para que todo cargue igual que en producción:

   ```bash
   # Python
   python -m http.server 8000
   # o Node
   npx serve .
   ```

3. Visitá `http://localhost:8000`.

> Con `file://` algunas APIs están limitadas; para revisar el sitio tal cual se publica, preferí un servidor local.

---

## Cambiar los datos del negocio

**Todo el contenido editable vive en [`js/config.js`](js/config.js).** No hay que tocar el HTML para actualizar datos.

```js
window.SITE_CONFIG = {
  whatsapp: "543874578676",          // formato internacional SIN "+"
  whatsappDisplay: "+54 9 387 457-8676",
  whatsappDefaultMessage: "Hola, quisiera consultar por sus productos para mascotas",
  phone: "",                          // vacío = se oculta el botón
  email: "laboutiquecatydog@gmail.com",
  address: "Diario La Nación y Diario El Litoral, Bº Periodista, Salta",
  hours: "Lun a Sáb de 10:00 a 13:00 h · Dom cerrado",
  mapsQuery: "-24.8445087,-65.4390905", // coordenadas del local en Google Maps
  instagram: "https://www.instagram.com/laboutiquecatydog/",
  tiktok: "https://www.tiktok.com/@laboutiquecatydog",
  facebook: "https://www.facebook.com/685608634637906",
  carouselDelay: 3000                // ms entre fotos del carrusel
};
```

**Regla importante:** cualquier campo vacío (`""`) **no se muestra** en el sitio. Los botones y tarjetas asociados se ocultan automáticamente para no enlazar a lados vacíos. Así, basta dejar un campo en blanco para quitarlo.

---

## Componente: caminos de huellas (`js/paw-trail.js`)

Es el detalle visual característico del sitio: tramos de huellas serpenteantes que enlazan las secciones, como si un perro y un gato hubieran pasado por el margen de la página.

### Qué hace
- Dibuja **un único `<svg class="paw-trails">`** como último hijo de `<main>`, cubriendo todo el alto de la página.
- Genera **varios tramos**, uno por sección, **intercalando lados** para que la senda no sea una línea recta continua:

  | Tramo | Sección | Lado |
  |---|---|---|
  | 1 | `.intro` | izquierda |
  | 2 | `#categorias` | derecha |
  | 3 | `#productos` | derecha |
  | 4 | `#nosotros` | izquierda |
  | 5 | `#contacto` | derecha |

- En **móvil** (`<641px`) solo quedan `.intro` (izq.) y `#contacto` (der.), para no invadir el contenido.

### Reglas de dibujo
- **Sin `viewBox`**: el SVG usa píxeles reales 1:1 con `<main>`, evitando distorsión o escalado inesperado.
- La **Y es estrictamente lineal** dentro de la banda de su sección (`offsetTop` / `offsetHeight`); la **onda vive solo en X** (`sin`), así el tramo sigue el flujo vertical de la página.
- La **canaleta** (margen entre la ventana y el contenedor) se adapta al ancho de pantalla: en pantallas anchas el serpenteo usa amplitud completa; en angostas la senda se cierra contra el borde sin invadir texto ni fotos.
- **Orientación**: las huellas siempre apuntan con los **dedos hacia arriba**, con una inclinación suave que sigue la onda (acotada a ±22°) más un jitter de pisada ±12°.
- **Tamaño y opacidad** varían con una semilla fija (`0xC0FFEE`) mediante un PRNG determinista (`mulberry32`), así el patrón es natural pero **idéntico en cada carga** (reproducible y testeable). El fade de los extremos es **solo en opacidad**; el tamaño nunca se encoge (no hay huellas diminutas).

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
| `WAVES` | `2.2` | Ondas por tramo (ni recto ni ruido) |
| `AMPLITUDE_MAX` | `55` | Amplitud máxima del serpenteo (px) |
| `STEP_OFFSET_MAX` | `14` | Zigzag de pisada por paso (px) |
| `STEP_JITTER` | `8` | Ruido por huella (±4 px) |
| `STEP_SPACING` | `56` | Separación vertical aproximada (px) |
| `CONTAINER_MAX` | `1180` | Ancho del contenedor (coincide con CSS) |

### Accesibilidad y rendimiento
- El SVG es **decoration pura**: `aria-hidden="true"`, `focusable="false"` y `pointer-events: none`, así no interfiere con lectores de pantalla ni con la interacción.
- **Sin dependencias, sin `requestAnimationFrame` ni animaciones**: se dibuja una vez y en `resize` (con *debounce* de 250 ms).
- **Degradable**: si algo falla, el `try/catch` lo deja pasar y la página funciona igual, sin los caminos.

### Cómo verificarlo
Además de la revisión visual:
- Sintaxis: `node --check js/paw-trail.js`.
- En DevTools, el `<svg class="paw-trails">` debe contener los `<use>` de cada huella con su `transform` (rotación cercana a 0° = dedos arriba).

---

## Imágenes

- Todo lo que se muestra está en `assets/img/`, ya **optimizado** (JPG + variantes `-900` para pantallas chicas, `srcset`/`imagesizes` en el HTML).
- Las **versiones originales de alta resolución** están en `Contenido Imagenes/` y **no se publican ni se versionan** (26 MB). Si se reemplaza una foto, se optimiza y se sube el resultado a `assets/img/`.
- Las imágenes de las tarjetas de categorías —`assets/img/seccion-perros.jpg` (1280×720) y `assets/img/seccion-gatos.jpg` (1280×698)— son **copias optimizadas** de los originales en `Contenido Imagenes/Secciones/` (`seccion perros.jpg`, `seccion gatos.jpg`); los originales no se versionan.
- Favicon en SVG (`assets/img/favicon.svg`) e icono para iOS (`apple-touch-icon.png`).

---

## SEO y accesibilidad

- **Meta** completas: `description`, `keywords`, `robots`, `theme-color`, Open Graph y Twitter Cards.
- **Datos estructurados** JSON-LD de tipo `PetStore` (SEO local) en `index.html`.
- `<html lang="es">`, encabezados jerárquicos, `alt` descriptivos, navegación con `aria-label`, botones con `aria-expanded`/`aria-controls`, y foco visible.
- Colores con contraste sobre fondos claros; el sitio es responsive (móvil/tablet/desktop) y respeta `prefers-reduced-motion` para las animaciones.

---

## Despliegue (GitHub Pages)

El sitio es 100 % estático y se publica como **sitio de usuario**: el repositorio `laboutiquecatydog.github.io` se sirve desde la rama `main` (raíz), sin build.

- **URL publicada:** <https://laboutiquecatydog.github.io/>
- Repositorio: `https://github.com/laboutiquecatydog/laboutiquecatydog.github.io`
- Configuración: **Settings → Pages → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)`; **HTTPS activado**.

Para actualizar, subí los cambios a `main` y Pages reconstruye automáticamente. La URL canónica y las etiquetas Open Graph / Twitter ya apuntan a la URL publicada.

---

## Decisiones técnicas

- **Sin frameworks ni dependencias** (solo Google Fonts por CDN): sin `node_modules`, sin paso de build, sin sorpresas al desplegar.
- **JavaScript ES5 estricto** (`var`, funciones, sin flechas ni *template literals*) dentro de una IIFE con `"use strict"`, por compatibilidad y consistencia con el resto del sitio.
- **Sin `viewBox` ni `preserveAspectRatio`** en el SVG de las huellas, para evitar escalado inesperado.
- **Sin z-index negativos** ni `main > *`: las huellas viven en `z-index: 0` dentro de `<main>` (`position: relative`), por encima de los fondos y por debajo del header.
- El contenido editable está aislado en `config.js` para que actualizar datos no exige tocar el markup.

---

## Estado del proyecto

Sitio publicado en GitHub Pages. Etapas completadas:

| Etapa | Cambio |
|---|---|
| Portada | Hero en dos columnas (texto + carrusel) |
| Responsive | Ajustes en móvil/tablet (hero, imágenes, sin scroll horizontal) |
| Limpieza CSS | Tokens y reglas sin uso eliminados; color de acento de marca |
| Categorías (C) | Nuevo encabezado y tarjetas como componentes tipo boutique; transición a Productos sin costura |
| Categorías (D1) | Imágenes **Perros** y **Gatos** integradas en las tarjetas |

---

## Pendientes / TODO

- [ ] Filtros **Todos / Perros / Gatos** en la sección de productos.
- [ ] Verificar resolución de `assets/img/local.jpg` (449×660, se ve algo baja para fondo).
- [ ] Revisar recorte/encuadre de las fotos de producto (proporciones dispares entre slides).
- [ ] Considerar dominio propio + SSL si el negocio quiere una URL de marca.

---

## Licencia y contacto

Contenido y marca de **La Boutique Cat & Dog**. Para consultas: `laboutiquecatydog@gmail.com`.
