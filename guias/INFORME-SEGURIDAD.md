# Informe de seguridad — La Boutique Cat & Dog

**Fecha:** 24 de octubre de 2026 · **Alcance:** sitio público, panel de administración, login con GitHub, servidor local · **Resultado global: APROBADO** (3 hallazgos corregidos en la auditoría).

---

## 1. Resumen ejecutivo (para el cliente)

La página y el panel están construidos para que **solo personas autorizadas** (con la cuenta de GitHub del negocio) puedan cambiar el contenido. Se hicieron pruebas de "hackeo" simulando un atacante y **todas fueron bloqueadas**. Además, el sistema tiene varias capas de recuperación: deshacer, descartar, copias de seguridad y el historial completo de GitHub, así que **es prácticamente imposible perder contenido** por un error.

En esta auditoría se encontraron y corrigieron **3 debilidades menores** antes de que pudieran ser un problema.

---

## 2. Qué se protege y cómo (modelo de seguridad)

| Activo | Protección |
|---|---|
| Contenido del sitio | Repositorio **privado** en GitHub: nadie sin autorización puede editar ni ver los archivos |
| Login del panel | OAuth oficial de GitHub (contraseñas nunca pasan por el sitio) + Worker de Cloudflare que valida el dominio y devuelve el token **solo al panel** (nunca en la barra de direcciones ni en cookies legibles) |
| Token de sesión | Vive en `sessionStorage`: **se borra al cerrar la pestaña**, no queda guardado en la computadora, y solo se envía a `api.github.com` (verificado con instrumentación) |
| Página del panel | Marcada `noindex` + bloqueada en `robots.txt`: no aparece en Google |
| Escrituras | Solo colaboradores del repositorio pueden publicar (GitHub lo exige); cada cambio queda como commit con autor y fecha |

---

## 3. Pruebas de vulnerabilidad ejecutadas

### 3.1 Inyección de código malicioso a través del contenido (XSS) — **BLOQUEADO**

Se simuló un atacante que lograra editar el contenido con **código malicioso en todos los campos de texto** (títulos, botones, precios, redes, menú, WhatsApp, dirección, etc.), incluyendo scripts que intentaban robar la sesión del panel.

**Resultado:**
- Cero scripts ejecutados; cero elementos maliciosos en la página.
- Todos los textos se convierten en texto plano visible (inerte).
- Los enlaces con esquemas peligrosos (`javascript:…`) quedan **neutralizados en `#`** — corrección aplicada en esta auditoría (antes eran aceptados).
- Los intentos de inyectar scripts por consola también fueron **bloqueados por la CSP** (ver 3.3).

### 3.2 Acceso a archivos de la computadora desde el servidor local (path traversal) — **BLOQUEADO**

Se atacó el servidor de desarrollo con 10 variantes de rutas maliciosas (incluyendo codificaciones `%2e%2e`, barras invertidas para Windows y doble codificación) intentando leer archivos fuera de la carpeta del proyecto (p. ej. archivos del sistema).

**Resultado:** todas bloqueadas con "403 Prohibido". El servidor solo puede servir la carpeta del proyecto. Se agregó además la cabecera `X-Content-Type-Options: nosniff` como refuerzo.

> Nota técnica de la prueba: algunos clientes HTTP "aplana" las rutas antes de enviarlas, lo que produce falsos 200; la batería se re-corrió con `curl --path-as-is` (ruta literal) y dio 403 en todos los intentos.

### 3.3 Content Security Policy (CSP) — **ACTIVA Y VERIFICADA**

Se agregó CSP al sitio y al panel (solo scripts propios + API de GitHub + fuentes de Google; todo lo demás prohibido).

**Resultado de las pruebas:**
- Scripts inline no autorizados: **bloqueados**.
- Scripts externos inyectados: **bloqueados**.
- El sitio funciona al 100 % (render, carruseles, SEO, tipografías) — **cero violaciones en consola**.

### 3.4 Higiene del token de sesión — **APROBADO**

| Prueba | Resultado |
|---|---|
| ¿Queda el token en la URL después del login? | No — se limpia automáticamente |
| ¿Se guarda en almacenamiento persistente (localStorage)? | No — solo en `sessionStorage` (se borra al cerrar la pestaña) |
| ¿Se envía a algún servidor que no sea la API de GitHub? | No — instrumentación registró todas las peticiones con token: solo `api.github.com` |
| ¿Sale en logs, copias o borradores? | No — verificado por escaneo |

### 3.5 Otros escaneos — **LIMPIO**

- **Secretos hardcodeados** (tokens, contraseñas, client secrets): 0 hallazgos en todo el proyecto.
- **Contenido mixto** (carga HTTP en sitio HTTPS): 0 (solo namespaces XML internos, que no son recursos de red).
- **Enlaces externos**: todos abren con `rel="noopener"` (evita que la página abierta pueda manipular la nuestra).
- **Subida de imágenes**: solo imágenes reales re-codificadas por canvas (un archivo disfrazado se re-procesa y queda limpio); extensiones controladas (`.jpg`/`.png`).
- **Archivos subidos**: los nombres se normalizan (solo letras, números y guiones) — imposible inyectar rutas.
- **Panel antiguo (Sveltia)**: retirado — menos superficie de ataque.

---

## 4. Hallazgos corregidos en esta auditoría

| # | Hallazgo | Riesgo | Corrección |
|---|---|---|---|
| 1 | Los campos de enlace aceptaban URLs `javascript:` (botones, tarjetas, menú, redes) | Un contenido mal pegado podría ejecutar código al hacer clic | Sanitizador `hrefSeguro`: solo `#`, rutas internas, `https:`, `mailto:` y `tel:`; todo lo demás se neutraliza en `#` |
| 2 | La página de error del Worker mostraba el dominio solicitado sin escapar (inyección HTML teórica) | Bajo (página informativa, cookies inaccesibles) | `escapeHtml` aplicado; **requiere re-desplegar el Worker** con `tools/worker-editor.js` actualizado (paso 6) |
| 3 | Servidor local sin `nosniff` | Bajo | Cabecera `X-Content-Type-Options: nosniff` agregada |

---

## 5. Recomendaciones para el cliente

1. **Activa la verificación en dos pasos (2FA) en tu cuenta de GitHub** — es la única "llave" del negocio. Sin 2FA, un phishing a tu mail de GitHub sería el único camino real de ataque. (GitHub → Settings → Password and authentication → Two-factor authentication.)
2. **No compartas tu cuenta**: si mañana alguien más edita, invitalo como **colaborador** del repositorio (Settings → Collaborators), nunca prestes tu usuario.
3. **Cerrá sesión ("Salir") en computadoras compartidas** — aunque la sesión muere al cerrar la pestaña, es una costumbre sana.
4. Si un día usan dominio propio, mantener **HTTPS** (ya es el estándar del sitio).

---

## 6. Pendiente operativo (antes de publicar)

- [ ] **Re-desplegar el Worker** en Cloudflare con el archivo `tools/worker-editor.js` actualizado (incluye el escape del hallazgo #2). Los pasos son los mismos de la primera vez: Workers & Pages → `sveltia-cms-auth` → Edit code → pegar → Deploy. (La versión desplegada hoy ya **no refleja** datos del atacante, así que no hay prisa; es refuerzo.)
- [ ] Push a producción (cuando el cliente dé el visto bueno).
- [ ] Después del push: Search Console + Google Business Profile.

---

## 7. Metodología

Auditoría de caja blanca (revisión de código + pruebas automáticas en navegador real vía protocolo CDP, con GitHub simulado) ejecutada el 24/10/2026 sobre todo el código del proyecto. Pruebas: batería XSS de 25+ payloads en todos los campos editables, sanitización de enlaces, path traversal (10 variantes), inyección de scripts con CSP activa, higiene del token (URL, sessionStorage, localStorage, destinos de red), escaneo de secretos, contenido mixto y revisión de todos los `innerHTML` del panel. Código de prueba reutilizable en `%TEMP%\opencode\sec-check.js`.
