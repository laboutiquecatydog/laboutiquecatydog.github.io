# Guía de entrega — cómo pasarle el proyecto al cliente

Respondé las preguntas clave antes de la entrega. Regla general que lo explica todo:

> **El cliente NO necesita instalar NADA en su computadora.** Su página y su panel viven en internet (GitHub Pages + GitHub + Cloudflare) y se usan desde el navegador, igual que Gmail o WhatsApp Web. La copia local del proyecto es solo para desarrolladores.

---

## 1. ¿Qué necesita el cliente SÍ o SÍ?

| Elemento | ¿Dónde se consigue? | Nota |
|---|---|---|
| **Cuenta de GitHub** (la de `laboutiquecatydog`) | Ya existe | Debe quedar **a nombre del cliente**, con su correo y su celular para recuperación |
| **Contraseña + 2FA activado** | GitHub → Settings → Password and authentication | El 2FA es la llave del negocio: sin él, su mail es el único candado |
| **Cuenta de Cloudflare** (la del Worker del login) | Ya existe | También a su nombre (es el correo que creó el worker) |
| Un navegador | Chrome/Edge/Safari | Celular o PC, indistinto |

Con eso y el link `https://laboutiquecatydog.github.io/admin/editor.html` el cliente puede **editar TODO su sitio desde cualquier dispositivo, para siempre**. No hay nada que instalar, mantener ni actualizar.

## 2. ¿Le instalo Node.js? ¿Git? ¿GitHub Desktop?

- **Node.js: NO** — solo sirve para el servidor de desarrollo local (el `preview.cmd`). El cliente jamás lo necesita.
- **Git (línea de comandos): NO** — el panel hace los commits por ella.
- **GitHub Desktop: NO recomendado** — es TU herramienta de desarrollador. En manos del cliente agrega riesgo (un push accidental fuera del panel puede romper el sitio) y complejidad. El editor visual ES su "git".

> Si algún día otro desarrollador continúa el proyecto, ESE desarrollador instala git/Node — y encuentra todo documentado en el README.

## 3. ¿Es mejor que ejecute todo en local con git?

**No — el flujo del cliente es 100 % web.** Ella edita en el panel de producción, publica, y listo. Ejecutar en local solo tiene sentido para desarrollar (vos). Para el cliente, "local" es agregar pasos y confusiones sin ningún beneficio.

## 4. ¿Para qué sirve el pendrive entonces?

Como **respaldo físico** de entrega (buena práctica), NO como requisito. Grabale:

1. **Copia completa del proyecto** (la carpeta, sin `_backup/`) — por si algún día quiere auditoría o cambio de proveedor.
2. `guias/` — el manual del panel, el informe de seguridad y la guía de presentación.
3. **Un archivo de credenciales** (o mejor: un sobre cerrado) con: usuario/contraseña de GitHub + códigos de recuperación del 2FA, usuario/contraseña de Cloudflare, y el mail asociado.

> Aclarale: "esto es un respaldo; tu página funciona igual sin el pendrive".

## 5. El acceso al panel

- **Atajo discreto (nuevo):** tres clics seguidos en el logo de la web → abre el panel. Sigue pidiendo login con GitHub.
- **Forma principal:** el link `…/admin/editor.html` guardado como **marcador/favorito** en su navegador y su celu (enseñale a guardarlo en la pantalla de inicio del celu — es un atajo de navegador, se llama "Agregar a la pantalla principal").
- `/admin/` también redirige al panel.
- Recordale: la sesión vive en la pestaña; si la cierra, vuelve a "Iniciar sesión".

## 6. Checklist de la reunión de entrega

- [ ] Entregar credenciales (sobre cerrado o gestor de contraseñas) y verificar que el cliente **inicia sesión él mismo** desde su propio celu.
- [ ] Activar 2FA juntos y guardar los códigos de recuperación.
- [ ] Guardar el marcador del panel en el celu del cliente.
- [ ] Practicar con él/ella un cambio real (un texto + una foto) y publicarlo.
- [ ] Mostrar el botón **«?»** del panel y regalarle el `guias/` impreso o en PDF.
- [ ] Dejar el pendrive de respaldo.
- [ ] Aclarar el plan de soporte acordado (ej.: ajustes incluidos por 30 días).

## 7. Qué hacer si mañana te llamás "desaparecido"

Nada se pierde: el cliente es dueño de las cuentas y del repositorio; el código es estándar (HTML/CSS/JS sin dependencias) y está documentado (README + bitácora). Cualquier desarrollador puede continuar. Ese es justamente el argumento de venta.
