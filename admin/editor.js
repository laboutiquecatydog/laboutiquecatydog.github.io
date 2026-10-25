/* ==========================================================================
   La Boutique Cat & Dog — Editor visual (W1: estructura de secciones)
   --------------------------------------------------------------------------
   Panel tipo constructor de páginas:
   - Login con GitHub (vía el Worker de Cloudflare extendido para el editor)
     o, como respaldo, con un token personal (PAT).
   - Carga data/pagina.json desde la API de GitHub.
   - Lista de secciones: reordenar (arrastrar o botones), ocultar/mostrar,
     duplicar, eliminar y agregar desde plantillas.
   - Vista previa del sitio publicado en un iframe (mismo origen).
   - Publicar = un commit a data/pagina.json por la API de GitHub.
   Sin dependencias, sin build. Los campos desconocidos del JSON se
   conservan tal cual (el editor solo toca la lista y los campos propios).
   ========================================================================== */
(function () {
  "use strict";

  /* ----------------------------- Constantes ----------------------------- */
  var WORKER_BASE = "https://sveltia-cms-auth.laboutiquecatydog10.workers.dev";
  var REPO = "laboutiquecatydog/laboutiquecatydog.github.io";
  var BRANCH = "main";
  var ARCHIVO_PAGINA = "data/pagina.json";
  var ARCHIVO_SITIO = "data/sitio.json";
  var ESTADO = "https://api.github.com";

  var CLAVE_TOKEN = "BQ_TOKEN";
  var CLAVE_BORRADOR = "BQ_DRAFT_PAGINA";
  var CLAVE_BORRADOR_SITIO = "BQ_DRAFT_SITIO";
  var CLAVE_COPIAS = "BQ_COPIAS";
  var MAX_COPIAS = 15;

  var TIPOS = ["hero", "categorias", "productos", "imagenTexto", "contacto"];

  /* Etiquetas legibles por tipo de bloque */
  var ETIQUETAS = {
    hero: "Portada con fotos",
    categorias: "Categorías (Perros y Gatos)",
    productos: "Productos",
    imagenTexto: "Imagen y texto",
    contacto: "Contacto"
  };

  /* Descripciones cortas para la vista de plantillas */
  var DESCRIPCIONES = {
    hero: "Título, botones y carrusel de imágenes.",
    categorias: "Tarjetas con foto para Perros y Gatos.",
    productos: "Galería con filtros y tarjetas de producto.",
    imagenTexto: "Foto a un lado y texto con viñetas al otro.",
    contacto: "WhatsApp, redes, ubicación y horarios."
  };

  /* Íconos (SVG de trazo, coherentes con el sitio) */
  var ICONOS = {
    hero: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M3 9h18"/><path d="M7 19h10"/></svg>',
    categorias: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>',
    productos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/></svg>',
    imagenTexto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="8" height="16" rx="1.5"/><path d="M14 6h7M14 10h7M14 14h4"/></svg>',
    contacto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.5L3 21l2-5.6A8.5 8.5 0 1 1 21 11.5z"/></svg>'
  };

  var SVG_ARRIBA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  var SVG_ABAJO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12l7 7 7-7"/></svg>';
  var SVG_TIRADOR = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/></svg>';
  var SVG_OJO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/></svg>';
  var SVG_OJO_CORTADO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><path d="M4 4l16 16"/></svg>';
  var SVG_COPIA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';
  var SVG_PAPELERA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></svg>';

  /* Plantillas para "Agregar sección": contenido inicial razonable en
     español, sin datos inventados más allá de lo que ya usa el sitio. */
  var PLANTILLAS = {
    hero: {
      tipo: "hero", id: "portada-nueva", aria: "Portada",
      eyebrow: "Nueva sección", titulo: "Título de la portada",
      texto: "Texto breve que explique qué ofrecen.",
      botonPrincipal: { texto: "Consultar por WhatsApp", mensaje: "" },
      botonSecundario: { texto: "Ver productos", enlace: "#productos" },
      carruselAria: "Fotografías del local", slides: []
    },
    categorias: {
      tipo: "categorias", id: "categorias-nueva",
      eyebrow: "Categorías", titulo: "¿Para quién estás buscando?",
      intro: "", ctaTexto: "Ver productos", tarjetas: []
    },
    productos: {
      tipo: "productos", id: "productos-nueva",
      eyebrow: "Productos", titulo: "Nuestra selección",
      intro: "", mostrarFiltros: true, ctaTexto: "Consultar disponibilidad",
      productos: []
    },
    imagenTexto: {
      tipo: "imagenTexto", id: "nosotros-nueva",
      eyebrow: "Nuestro local", titulo: "Una tienda pensada para ellos",
      texto: "", vinetas: [],
      imagen: "assets/img/local.jpg", imagenAlt: "",
      boton: { texto: "Hacé tu consulta", mensaje: "" }
    },
    contacto: {
      tipo: "contacto", id: "contacto-nueva",
      eyebrow: "Contacto", titulo: "¿Buscás algo en particular?",
      intro: "",
      botonWhatsapp: { texto: "Escribinos por WhatsApp", mensaje: "" },
      botonMapsTexto: "Cómo llegar",
      ordenSocial: ["instagram", "tiktok", "facebook"]
    }
  };

  /* ----------------------------- Utilidades ----------------------------- */
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  /* Escapa texto para insertarlo como HTML (los datos pueden venir del JSON) */
  function e(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function ea(v) { return e(v).replace(/"/g, "&quot;"); }

  /* Copia profunda simple (los datos son JSON puro) */
  function clon(o) { return JSON.parse(JSON.stringify(o)); }

  function unicaId(base, secciones) {
    var usadas = {};
    secciones.forEach(function (s) { if (s && s.id) { usadas[s.id] = true; } });
    var propuesto = base || "seccion";
    if (!usadas[propuesto]) { return propuesto; }
    propuesto += "-copia";
    var n = 2;
    while (usadas[propuesto + n]) { n += 1; }
    return propuesto + n;
  }

  /* Base64 <-> UTF-8 (los textos tienen acentos y ñ) */
  function b64DeTexto(texto) {
    var bytes = new TextEncoder().encode(texto);
    var bin = "";
    for (var i = 0; i < bytes.length; i++) { bin += String.fromCharCode(bytes[i]); }
    return btoa(bin);
  }
  function textoDeB64(b64) {
    var limpio = b64.replace(/\s/g, "");
    var bin = atob(limpio);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) { bytes[i] = bin.charCodeAt(i); }
    return new TextDecoder().decode(bytes);
  }
  function b64Url(valor) {
    return b64DeTexto(valor).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function deB64Url(valor) {
    var b64 = valor.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) { b64 += "="; }
    return textoDeB64(b64);
  }

  /* ------------------------------ Toasts -------------------------------- */
  function toast(texto, tipo, duracion) {
    var zona = $("#toasts");
    var t = document.createElement("div");
    t.className = "toast" + (tipo ? " is-" + tipo : "");
    t.textContent = texto;
    zona.appendChild(t);
    window.setTimeout(function () { t.classList.add("is-saliendo"); }, duracion || 3400);
    window.setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, (duracion || 3400) + 320);
  }

  /* --------------------------- Modal confirmar -------------------------- */
  var confirmarAccion = null;
  function pedirConfirmacion(texto, alAceptar) {
    confirmarAccion = alAceptar;
    $("#modal-confirmar-texto").textContent = texto;
    $("#modal-confirmar").hidden = false;
    $("#modal-confirmar-si").focus();
  }
  function cerrarConfirmar(ok) {
    $("#modal-confirmar").hidden = true;
    if (ok && confirmarAccion) { confirmarAccion(); }
    confirmarAccion = null;
  }

  /* ------------------------------- Estado ------------------------------- */
  var token = "";
  var shaPagina = "";
  var shaSitio = "";
  var datos = null;          // contenido completo de data/pagina.json
  var datosSitio = null;      // contenido completo de data/sitio.json
  var borrador = false;      // cambios en la portada sin publicar
  var borradorSitio = false; // cambios en datos del local sin publicar
  var seccionAbierta = -1;    // índice de la sección en el formulario
  var pestanaActual = "secciones"; // secciones | sitio
  var modoPanel = "vista";   // vista | texto (panel derecho)

  /* Historial de deshacer/rehacer: instantáneas del modelo (pagina + sitio) */
  var HISTORIAL_MAX = 60;
  var historial = [];
  var punteroHistorial = -1;
  var instantaneaPublicada = ""; // estado tal cual está en GitHub (base del chip)
  var timerCaptura = 0;

  function mismoOrigenDelSitio() {
    var esLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
    return esLocal ? location.protocol + "//" + location.host : "https://laboutiquecatydog.github.io";
  }
  var ORIGEN_SITIO = mismoOrigenDelSitio();

  /* ------------------------------ API GitHub ---------------------------- */
  function apiGet(ruta) {
    return fetch(ESTADO + ruta, {
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      }
    }).then(function (res) {
      if (res.status === 401) { throw new Error("TOKEN_INVALIDO"); }
      if (!res.ok) { throw new Error("HTTP " + res.status + " en " + ruta); }
      return res.json();
    });
  }

  function obtenerPagina() {
    return apiGet("/repos/" + REPO + "/contents/" + ARCHIVO_PAGINA + "?ref=" + BRANCH)
      .then(function (info) {
        shaPagina = info.sha;
        var json = JSON.parse(textoDeB64(info.content));
        if (!json || !Array.isArray(json.secciones)) { throw new Error("FORMATO"); }
        return json;
      });
  }

  function obtenerSitio() {
    return apiGet("/repos/" + REPO + "/contents/" + ARCHIVO_SITIO + "?ref=" + BRANCH)
      .then(function (info) {
        shaSitio = info.sha;
        var json = JSON.parse(textoDeB64(info.content));
        if (!json || typeof json !== "object") { throw new Error("FORMATO"); }
        return json;
      });
  }

  /* PUT del archivo que reciba; sirve para pagina.json y sitio.json */
  function guardarArchivo(ruta, shaActual, jsonDoc, mensaje) {
    var cuerpo = JSON.stringify(jsonDoc, null, 2) + "\n";
    return fetch(ESTADO + "/repos/" + REPO + "/contents/" + ruta, {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: mensaje,
        content: b64DeTexto(cuerpo),
        branch: BRANCH,
        sha: shaActual
      })
    }).then(function (res) {
      if (res.status === 409 || res.status === 422) { throw new Error("CONFLICTO"); }
      if (res.status === 401) { throw new Error("TOKEN_INVALIDO"); }
      if (!res.ok) { throw new Error("HTTP " + res.status + " al publicar"); }
      return res.json();
    }).then(function (info) {
      return info;
    });
  }

  function guardarPagina(jsonDoc, mensaje) {
    return guardarArchivo(ARCHIVO_PAGINA, shaPagina, jsonDoc, mensaje)
      .then(function (info) {
        if (info.content && info.content.sha) { shaPagina = info.content.sha; }
        return info;
      });
  }

  function guardarSitio(jsonDoc, mensaje) {
    return guardarArchivo(ARCHIVO_SITIO, shaSitio, jsonDoc, mensaje)
      .then(function (info) {
        if (info.content && info.content.sha) { shaSitio = info.content.sha; }
        return info;
      });
  }

  /* -------------------------------- Auth -------------------------------- */
  function tokenValidoSeparado() { return sessionStorage.getItem(CLAVE_TOKEN) || ""; }

  function capturarTokenDelHash() {
    /* El Worker redirige a esta página con el token en el fragmento (#).
       Nunca viaja por la red hacia un servidor: queda solo en el navegador. */
    var m = location.hash.match(/access_token=([^&]+)/);
    if (m) {
      sessionStorage.setItem(CLAVE_TOKEN, decodeURIComponent(m[1]));
      limpiarHash();
      return true;
    }
    var err = location.hash.match(/error=([^&]+)/);
    if (err) {
      limpiarHash();
      mostrarErrorAuth("El ingreso falló: " + decodeURIComponent(err[1]).replace(/[_]/g, " ") +
        ". Probá de nuevo o usá un token personal.");
      return false;
    }
    return false;
  }

  function limpiarHash() {
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e2) {}
  }

  function mostrarErrorAuth(texto) {
    var caja = $("#auth-error");
    caja.textContent = texto;
    caja.hidden = false;
  }

  function iniciarLogin() {
    var dominio = location.hostname;
    var url = WORKER_BASE + "/auth?provider=github&site_id=" + encodeURIComponent(dominio) +
      "&client=editor&redirect=" + encodeURIComponent(location.origin);
    /* Navegación en la misma pestaña: sin bloqueos de ventanas emergentes.
       Guardamos que venimos del login para restaurar la vista al volver. */
    try { sessionStorage.setItem("BQ_LOGIN", "1"); } catch (e2) {}
    location.href = url;
  }

  function iniciarLoginConToken() {
    var valor = $("#campo-token").value.trim();
    if (!valor) { mostrarErrorAuth("Pegá un token de acceso para entrar."); return; }
    sessionStorage.setItem(CLAVE_TOKEN, valor);
    cargarEditor();
  }

  /* ------------------------------- Vistas ------------------------------- */
  function mostrarVista(nombre) {
    ["vista-auth", "vista-carga", "vista-editor"].forEach(function (id) {
      document.getElementById(id).hidden = id !== nombre;
    });
  }

  /* ------------------------- Carga del contenido ------------------------ */
  function cargarEditor() {
    token = sessionStorage.getItem(CLAVE_TOKEN) || "";
    if (!token) { mostrarVista("vista-auth"); return; }
    mostrarVista("vista-carga");
    $("#boton-carga-reintentar").hidden = true;
    $("#carga-texto").textContent = "Cargando el contenido…";

    apiGet("/user").then(function (yo) {
      var cuenta = $("#estado-cuenta");
      cuenta.textContent = yo.login ? "@" + yo.login : "";
      cuenta.hidden = false;
    }).catch(function () { /* el nombre es cosmético: sin bloqueo */ });

    Promise.all([obtenerPagina(), obtenerSitio()]).then(function (resultados) {
      datos = resultados[0];
      datosSitio = resultados[1];

      /* Base del historial y del chip: el estado tal cual está en GitHub */
      historial = [];
      punteroHistorial = -1;
      instantaneaPublicada = instantaneaActual();

      /* Si quedó un borrador de una sesión anterior, se recupera. */
      var crudo = localStorage.getItem(CLAVE_BORRADOR);
      if (crudo) {
        try {
          var guardado = JSON.parse(crudo);
          if (guardado && Array.isArray(guardado.secciones)) {
            datos = guardado;
          }
        } catch (e2) { localStorage.removeItem(CLAVE_BORRADOR); }
      }
      var crudoSitio = localStorage.getItem(CLAVE_BORRADOR_SITIO);
      if (crudoSitio) {
        try {
          var guardadoSitio = JSON.parse(crudoSitio);
          if (guardadoSitio && typeof guardadoSitio === "object") {
            datosSitio = guardadoSitio;
          }
        } catch (e2) { localStorage.removeItem(CLAVE_BORRADOR_SITIO); }
      }

      /* El chip refleja la diferencia real con lo publicado */
      compararConPublicado();
      if (borrador || borradorSitio) {
        toast("Se restauró un borrador pendiente de publicar.", "ok");
      }

      capturarHistorial(true);
      seccionAbierta = -1;
      actualizarEstadoCambios();
      armarPlantillas();
      renderLista();
      actualizarModoPanel();
      arrancarVistaPrevia();
      mostrarVista("vista-editor");
    }).catch(function (err) {
      if (String(err.message).indexOf("TOKEN_INVALIDO") !== -1) {
        sessionStorage.removeItem(CLAVE_TOKEN);
        token = "";
        mostrarVista("vista-auth");
        mostrarErrorAuth("La sesión venció o el token no es válido. Volvé a iniciar sesión.");
        return;
      }
      mostrarVista("vista-carga");
      $("#carga-texto").textContent = "No se pudo cargar el contenido (" + err.message + ").";
      $("#boton-carga-reintentar").hidden = false;
    });
  }

  /* -------------------------- Lista de secciones ------------------------ */
  function etiquetaDe(seccion) {
    var tipo = ETIQUETAS[seccion.tipo] ? seccion.tipo : null;
    var nombre = tipo ? ETIQUETAS[tipo] : "Sección desconocida";
    return nombre;
  }

  function renderLista() {
    var lista = $("#lista-secciones");
    lista.innerHTML = "";
    datos.secciones.forEach(function (seccion, indice) {
      lista.appendChild(itemSeccion(seccion, indice));
    });
    /* La selección sobrevive a re-renderizaciones de la lista */
    if (seccionAbierta >= 0) {
      if (seccionAbierta < datos.secciones.length) {
        var liSel = document.querySelector('.item-seccion[data-indice="' + seccionAbierta + '"]');
        if (liSel) { liSel.classList.add("is-seleccionada"); }
        if (modoPanel === "texto") { actualizarFormularioActual(); }
      } else {
        seccionAbierta = -1;
        cerrarFormularioSeccion();
      }
    }
  }

  function itemSeccion(seccion, indice) {
    var li = document.createElement("li");
    li.className = "item-seccion";
    li.draggable = true;
    li.setAttribute("data-indice", String(indice));
    li.setAttribute("data-tipo", seccion.tipo || "");
    if (seccion.oculto) { li.classList.add("is-oculta"); }

    var oculta = !!seccion.oculto;
    var sub = "id: " + (seccion.id || "(sin ancla)") + (oculta ? " · oculta" : "");

    li.innerHTML =
      '<button class="tirador" type="button" aria-label="Arrastrar para reordenar ' + ea(etiquetaDe(seccion)) + '">' + SVG_TIRADOR + '</button>' +
      '<span class="item-ico" aria-hidden="true">' + (ICONOS[seccion.tipo] || "") + "</span>" +
      '<span class="item-texto"><strong>' + e(etiquetaDe(seccion)) + "</strong><small>" + e(sub) + "</small></span>" +
      '<span class="item-acciones">' +
      '<button type="button" class="btn-icono" data-accion="subir" aria-label="Subir" ' + (indice === 0 ? "disabled" : "") + ">" + SVG_ARRIBA + "</button>" +
      '<button type="button" class="btn-icono" data-accion="bajar" aria-label="Bajar" ' + (indice === datos.secciones.length - 1 ? "disabled" : "") + ">" + SVG_ABAJO + "</button>" +
      '<button type="button" class="btn-icono" data-accion="ocultar" aria-label="' + (oculta ? "Mostrar" : "Ocultar") + '" title="' + (oculta ? "Mostrar en la web" : "Ocultar de la web") + '">' + (oculta ? SVG_OJO_CORTADO : SVG_OJO) + "</button>" +
      '<button type="button" class="btn-icono" data-accion="duplicar" aria-label="Duplicar">' + SVG_COPIA + "</button>" +
      '<button type="button" class="btn-icono is-peligro" data-accion="eliminar" aria-label="Eliminar">' + SVG_PAPELERA + "</button>" +
      "</span>";

    /* Clic en el cuerpo (no en los botones) → selecciona la sección y la
        resalta en la vista previa. La edición de textos se hace directo
        en la vista (clic en el texto) o con el modo «Textos». */
    li.addEventListener("click", function (evento) {
      if (evento.target.closest("button")) { return; }
      seleccionarSeccion(indice);
    });

    /* Acciones de la fila */
    li.addEventListener("click", function (evento) {
      var boton = evento.target.closest("button[data-accion]");
      if (!boton) { return; }
      var accion = boton.getAttribute("data-accion");
      if (accion === "subir") { mover(indice, -1); }
      if (accion === "bajar") { mover(indice, 1); }
      if (accion === "ocultar") { alternarOcultar(seccion); }
      if (accion === "duplicar") { duplicar(indice, seccion); }
      if (accion === "eliminar") {
        pedirConfirmacion(
          "¿Eliminar la sección «" + etiquetaDe(seccion) + "»? El cambio se aplica cuando publiques.",
          function () { eliminar(indice); }
        );
      }
    });

    /* Reordenar arrastrando (más botones ↑ ↓ como alternativa accesible) */
    li.addEventListener("dragstart", function (evento) {
      evento.dataTransfer.setData("text/plain", String(indice));
      evento.dataTransfer.effectAllowed = "move";
      li.classList.add("is-drag");
    });
    li.addEventListener("dragend", function () {
      li.classList.remove("is-drag");
      $$(".item-seccion").forEach(function (otro) { otro.classList.remove("is-insercion"); });
    });
    li.addEventListener("dragover", function (evento) {
      evento.preventDefault();
      evento.dataTransfer.dropEffect = "move";
      var rec = li.getBoundingClientRect();
      var antes = evento.clientY < rec.top + rec.height / 2;
      li.classList.toggle("is-insercion", antes);
    });
    li.addEventListener("dragleave", function () { li.classList.remove("is-insercion"); });
    li.addEventListener("drop", function (evento) {
      evento.preventDefault();
      var desde = parseInt(evento.dataTransfer.getData("text/plain"), 10);
      li.classList.remove("is-insercion");
      if (isNaN(desde) || desde === indice) { return; }
      /* La posición de reemplazo depende si va antes o después del destino */
      var rec = li.getBoundingClientRect();
      var hacia = evento.clientY < rec.top + rec.height / 2 ? indice : indice + 1;
      if (desde < hacia) { hacia -= 1; }
      reordenar(desde, hacia);
    });

    return li;
  }

  /* ------------------------- Acciones de la lista ----------------------- */
  /* Estado central de cambios: chip + botones + borradores locales.
     Un cambio en la portada o en los datos del local deja todo “sucio”. */
  function actualizarEstadoCambios() {
    var sucio = borrador || borradorSitio;
    $("#chip-cambios").hidden = !sucio;
    $("#boton-publicar").disabled = !sucio;
    $("#boton-descartar").disabled = !sucio;
    try {
      if (borrador) { localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(datos)); }
      else { localStorage.removeItem(CLAVE_BORRADOR); }
      if (borradorSitio) { localStorage.setItem(CLAVE_BORRADOR_SITIO, JSON.stringify(datosSitio)); }
      else { localStorage.removeItem(CLAVE_BORRADOR_SITIO); }
    } catch (e2) { /* modo privado: sin borrador persistente */ }
  }

  function marcarCambios(sucio) {
    borrador = sucio;
    if (sucio) { capturarHistorial(); }
    actualizarEstadoCambios();
  }

  function marcarCambiosSitio(sucio) {
    borradorSitio = sucio;
    if (sucio) { capturarHistorial(); }
    actualizarEstadoCambios();
  }

  /* ---------------------- Historial: deshacer / rehacer ------------------ */
  /* Instantánea del modelo completo: pagina.json + sitio.json en un string.
     El separador \u0000 no puede aparecer en JSON, así es seguro. */
  function instantaneaActual() {
    return JSON.stringify(datos) + "\u0000" + JSON.stringify(datosSitio);
  }

  /* Recalcula los flags de borrador comparando con lo publicado (sirve
     después de deshacer: si volvés exactamente al estado publicado, el
     chip se apaga solo). */
  function compararConPublicado() {
    var base = instantaneaPublicada.split("\u0000");
    var actual = instantaneaActual().split("\u0000");
    borrador = actual[0] !== base[0];
    borradorSitio = actual[1] !== base[1];
  }

  /* Agrega una instantánea al historial. Con pausa corta para que una
     ráfaga de teclas no llene el historial de micro-estados. */
  function capturarHistorial(inmediato) {
    if (!datos || !datosSitio) { return; }
    var correr = function () {
      var snap = instantaneaActual();
      if (punteroHistorial >= 0 && historial[punteroHistorial] === snap) { return; }
      historial.splice(punteroHistorial + 1); /* corta la rama de rehacer */
      historial.push(snap);
      if (historial.length > HISTORIAL_MAX) { historial.shift(); }
      punteroHistorial = historial.length - 1;
      actualizarBotonesHistorial();
    };
    window.clearTimeout(timerCaptura);
    if (inmediato) { correr(); }
    else { timerCaptura = window.setTimeout(correr, 600); }
  }

  function actualizarBotonesHistorial() {
    var bDeshacer = $("#boton-deshacer");
    var bRehacer = $("#boton-rehacer");
    if (bDeshacer) { bDeshacer.disabled = punteroHistorial <= 0; }
    if (bRehacer) { bRehacer.disabled = punteroHistorial >= historial.length - 1; }
  }

  /* dirección: -1 deshacer · +1 rehacer */
  function restaurarHistorial(direccion) {
    var destino = punteroHistorial + direccion;
    if (!datos || !datosSitio || destino < 0 || destino >= historial.length) { return; }
    /* Si había una edición abierta en la vista, se cierra sin escribir:
       el re-render va a reemplazar ese DOM de todos modos. */
    if (window.BQInline) { BQInline.cancelar(); }
    punteroHistorial = destino;
    var partes = historial[punteroHistorial].split("\u0000");
    datos = JSON.parse(partes[0]);
    datosSitio = JSON.parse(partes[1]);

    /* La selección puede haber quedado fuera de rango */
    if (seccionAbierta >= datos.secciones.length) { seccionAbierta = -1; }

    compararConPublicado();
    renderLista();
    if (pestanaActual === "secciones" && modoPanel === "texto") { actualizarFormularioActual(); }
    if (pestanaActual === "sitio") { reconstruirFormSitio(); }
    actualizarEstadoCambios();
    actualizarBotonesHistorial();
    programarRerender();
    toast(direccion < 0 ? "Cambio deshecho." : "Cambio rehecho.", "ok", 1500);
  }

  function mover(indice, delta) {
    var destino = indice + delta;
    if (destino < 0 || destino >= datos.secciones.length) { return; }
    reordenar(indice, destino);
  }

  function reordenar(desde, hacia) {
    var secciones = datos.secciones;
    var sacada = secciones.splice(desde, 1)[0];
    secciones.splice(hacia, 0, sacada);
    renderLista();
    marcarCambios(true);
    programarRerender();
  }

  function alternarOcultar(seccion) {
    if (seccion.oculto) { delete seccion.oculto; }
    else { seccion.oculto = true; }
    renderLista();
    marcarCambios(true);
    programarRerender();
  }

  function duplicar(indice, seccion) {
    var copia = clon(seccion);
    if (copia.id) { copia.id = unicaId(copia.id, datos.secciones); }
    datos.secciones.splice(indice + 1, 0, copia);
    renderLista();
    marcarCambios(true);
    programarRerender();
    toast("Sección duplicada. Modificá su contenido antes de publicar.", "ok");
  }

  function eliminar(indice) {
    datos.secciones.splice(indice, 1);
    renderLista();
    marcarCambios(true);
    programarRerender();
  }

  /* ------------------------- Agregar sección ---------------------------- */
  function armarPlantillas() {
    var zona = $("#plantillas");
    zona.innerHTML = "";
    TIPOS.forEach(function (tipo) {
      var boton = document.createElement("button");
      boton.className = "plantilla";
      boton.type = "button";
      boton.innerHTML =
        '<span class="plantilla-ico" aria-hidden="true">' + ICONOS[tipo] + "</span>" +
        "<strong>" + e(ETIQUETAS[tipo]) + "</strong>" +
        "<small>" + e(DESCRIPCIONES[tipo]) + "</small>";
      boton.addEventListener("click", function () { agregarSeccion(tipo); });
      zona.appendChild(boton);
    });
  }

  function agregarSeccion(tipo) {
    var plantilla = clon(PLANTILLAS[tipo] || {});
    plantilla.id = unicaId(plantilla.id, datos.secciones);
    datos.secciones.push(plantilla);
    $("#modal-agregar").hidden = true;
    renderLista();
    marcarCambios(true);
    programarRerender();
    toast("Se agrega al final: movela arrastrándola hasta su lugar.", "ok");
  }

  /* --------------------------- Vista previa ----------------------------- */
  function arrancarVistaPrevia() {
    var marco = $("#marco-vista");
    marco.src = ORIGEN_SITIO + "/?t=" + Date.now();
  }

  function irASeccion(seccion) {
    var marco = $("#marco-vista");
    var ventana = marco.contentWindow;
    if (!ventana || !ventana.document) { return; }
    var destino = null;
    if (seccion.id) { destino = ventana.document.getElementById(seccion.id); }
    if (!destino) {
      /* La vista previa saltea las secciones ocultas: alinear el índice
         contra la lista de visibles, no contra todas. */
      var visibles = (datos && datos.secciones ? datos.secciones : []).filter(function (s) {
        return !(s && s.oculto);
      });
      var iv = visibles.indexOf(seccion);
      var todas = ventana.document.querySelectorAll("main > section");
      destino = todas[iv] || null;
    }
    if (destino && destino.scrollIntoView) { destino.scrollIntoView({ behavior: "smooth", block: "start" }); }
  }

  /* ------------------- Edición directa en la vista previa ---------------- */
  /* Escribe un valor en el modelo siguiendo una ruta: p. ej.
     ["botonPrincipal","texto"] dentro de una sección. */
  function escribirEn(obj, ruta, valor) {
    var actual = obj;
    for (var i = 0; i < ruta.length - 1; i++) { actual = actual[ruta[i]]; }
    actual[ruta[ruta.length - 1]] = valor;
  }

  function obtenerEn(obj, ruta) {
    var actual = obj;
    for (var i = 0; i < ruta.length; i++) { actual = actual[ruta[i]]; }
    return actual;
  }

  /* ------------------ Elección y aplicación de imágenes ----------------- */
  /* Abre el selector de imágenes y aplica el resultado en el campo del
     modelo indicado por ruta, completando srcset/sizes y medidas según
     el contexto (carrusel, tarjetas, producto, logo…). */
  function pedirImagen(destino, indice, ruta, opciones) {
    if (!window.BQMedia) { return; }
    var op = opciones || {};
    BQMedia.abrir({
      titulo: op.titulo || "Elegir imagen",
      tipo: op.tipo || "foto",
      conSrcset: !!op.conSrcset,
      alElegir: function (media) {
        var raiz = destino === 0 ? (datos && datos.secciones[indice]) : datosSitio;
        if (!raiz) { return; }
        escribirEn(raiz, ruta, media.imagen);

        var campo = ruta[ruta.length - 1];
        var contenedor = obtenerEn(raiz, ruta.slice(0, -1));
        if (op.conSrcset && media.srcset) {
          contenedor.srcset = media.srcset;
          contenedor.sizes = op.sizes || "(max-width: 860px) 100vw, 50vw";
        } else if (campo === "imagen") {
          /* Sin variante -900: limpiar restos para no mezclar tamaños */
          delete contenedor.srcset;
          delete contenedor.sizes;
        }
        if (op.dims && media.ancho) {
          contenedor[op.dims[0]] = media.ancho;
          contenedor[op.dims[1]] = media.alto;
        }

        if (destino === 0) {
          marcarCambios(true);
          if (modoPanel === "texto" && seccionAbierta === indice) { actualizarFormularioActual(); }
        } else {
          marcarCambiosSitio(true);
          if (pestanaActual === "sitio") { reconstruirFormSitio(); }
        }
        programarRerender();
      }
    });
  }

  /* Callbacks del formulario de la sección abierta */
  function alCambiarSeccionForm(esEstructural) {
    borrador = true;
    actualizarEstadoCambios();
    if (esEstructural) {
      actualizarFormularioActual();
      programarRerender();
    }
  }

  function alCambiarImagenSeccion(ruta, config) {
    pedirImagen(0, seccionAbierta, ruta, config);
  }

  /* Callbacks del formulario de datos del local */
  function reconstruirFormSitio() {
    if (!datosSitio) { return; }
    BQForm.construirSitio(datosSitio, $("#form-datos"), alCambiarSitioForm, alCambiarImagenSitio);
  }

  function alCambiarSitioForm(esEstructural) {
    borradorSitio = true;
    actualizarEstadoCambios();
    if (esEstructural) {
      reconstruirFormSitio();
      programarRerender();
    }
  }

  function alCambiarImagenSitio(ruta, config) {
    pedirImagen(1, -1, ruta, config);
  }

  function indicePorId(id) {
    if (!datos || !id) { return -1; }
    for (var i = 0; i < datos.secciones.length; i++) {
      if (datos.secciones[i] && datos.secciones[i].id === id) { return i; }
    }
    return -1;
  }

  var GANCHOS_INLINE = null;
  function ganchosInline() {
    if (GANCHOS_INLINE) { return GANCHOS_INLINE; }
    GANCHOS_INLINE = {
      getSeccion: function (id) {
        var i = indicePorId(id);
        return i >= 0 ? { indice: i, seccion: datos.secciones[i] } : null;
      },
      datosSitio: function () { return datosSitio; },
      alCambiarSeccion: function (indice, ruta, valor) {
        var sec = datos && datos.secciones[indice];
        if (!sec) { return; }
        escribirEn(sec, ruta, valor);
        marcarCambios(true);
        if (pestanaActual === "secciones" && modoPanel === "texto" && seccionAbierta === indice) {
          actualizarFormularioActual();
        }
      },
      alCambiarSitio: function (ruta, valor) {
        if (!datosSitio) { return; }
        escribirEn(datosSitio, ruta, valor);
        marcarCambiosSitio(true);
        if (pestanaActual === "sitio") { reconstruirFormSitio(); }
      },
      alPedirImagen: function (info) {
        pedirImagen(info.d, info.s, info.r, {
          titulo: info.i,
          tipo: info.t,
          conSrcset: !!info.x,
          dims: info.k
        });
      },
      alQuitarProducto: function (indice, i) {
        var sec = datos && datos.secciones[indice];
        if (!sec || !Array.isArray(sec.productos) || !sec.productos[i]) { return; }
        var producto = sec.productos[i];
        pedirConfirmacion(
          "¿Quitar el producto «" + (producto.titulo || "sin título") + "»? Deja de mostrarse cuando publiques.",
          function () {
            sec.productos.splice(i, 1);
            marcarCambios(true);
            if (modoPanel === "texto" && seccionAbierta === indice) { actualizarFormularioActual(); }
            programarRerender();
            toast("Producto quitado del borrador.", "ok");
          }
        );
      },
      alAtajo: function (direccion) {
        restaurarHistorial(direccion);
      },
      alSeleccionar: function (indice) {
        /* Clic dentro de la vista: resaltar sin mover la pantalla */
        seleccionarSeccion(indice, false);
        var li = document.querySelector('.item-seccion[data-indice="' + indice + '"]');
        if (li && li.scrollIntoView) { li.scrollIntoView({ block: "nearest" }); }
      },
      alTerminar: function () { programarRerender(); }
    };
    return GANCHOS_INLINE;
  }

  /* Las imágenes subidas viven en GitHub pero todavía no en este disco:
     BQMedia deja una copia en memoria y acá la inyectamos en la vista
     previa para ver el resultado al instante (en la web pública aparece
     sola cuando Pages reconstruye, ~1 minuto). */
  function aplicarSubidasEnVista(marco) {
    var doc = marco.contentDocument;
    var subidas = window.BQ_SUBIDAS;
    if (!doc || !subidas) { return; }
    Object.keys(subidas).forEach(function (ruta) {
      var imgs = doc.querySelectorAll('img[src="' + ruta + '"]');
      for (var i = 0; i < imgs.length; i++) {
        imgs[i].src = subidas[ruta];
      }
    });
  }

  /* Re-renderiza la vista previa con los datos del editor (con pausa
     corta para no pisar ediciones consecutivas). La posición de scroll
     se conserva: cambiar una foto no te puede mandar al inicio. */
  var timerRerender = 0;
  function programarRerender() {
    window.clearTimeout(timerRerender);
    timerRerender = window.setTimeout(function () {
      var marco = $("#marco-vista");
      var win = marco && marco.contentWindow;
      if (!win) { return; }
      /* El re-render reemplaza el DOM de la vista: cerrar la edición
         abierta (si quedara una) sin escribir su valor. */
      if (window.BQInline) { BQInline.cancelar(); }
      var y = win.scrollY || 0;
      if (win.BQPreview && datosSitio && datos) {
        try { win.BQPreview.renderizar(datosSitio, datos); } catch (e2) {}
      }
      aplicarSubidasEnVista(marco);
      BQInline.aplicar(marco, ganchosInline());
      if (seccionAbierta >= 0 && datos && datos.secciones[seccionAbierta]) {
        BQInline.seleccionar(datos.secciones[seccionAbierta].id, false);
      }
      if (y > 0) {
        try { win.scrollTo(0, y); } catch (e3) { /* best-effort */ }
      }
    }, 220);
  }

  /* Cuando la vista previa carga, se le aplican los datos del editor y
     se activa la edición directa sobre ella. */
  function prepararVistaPrevia() {
    var marco = $("#marco-vista");
    marco.addEventListener("load", function () {
      var win = marco.contentWindow;
      var intentos = 0;
      var esperar = function () {
        intentos += 1;
        var listo = win && win.BQPreview && win.SITE_CONFIG &&
          win.document.querySelector("main section");
        if (listo || intentos > 30) {
          if (win && win.BQPreview && datosSitio && datos) {
            try { win.BQPreview.renderizar(datosSitio, datos); } catch (e2) {}
          }
          aplicarSubidasEnVista(marco);
          BQInline.aplicar(marco, ganchosInline());
          if (seccionAbierta >= 0 && datos && datos.secciones[seccionAbierta]) {
            BQInline.seleccionar(datos.secciones[seccionAbierta].id, false);
          }
          return;
        }
        window.setTimeout(esperar, 120);
      };
      window.setTimeout(esperar, 150);
    });
  }

  /* --------------------- Selección y edición directa -------------------- */
  /* Selecciona una sección: resalta en la lista y en la vista previa.
     hacerScroll: true al elegir desde la LISTA (navega la vista hasta la
     sección); false cuando el clic vino de la propia vista — si estás
     mirando el 5º producto y tocás su foto, la pantalla no puede
     saltar hacia arriba. */
  function seleccionarSeccion(indice, hacerScroll) {
    if (!datos || !datos.secciones[indice]) { return; }
    seccionAbierta = indice;
    $$(".item-seccion").forEach(function (li) {
      li.classList.toggle("is-seleccionada", parseInt(li.getAttribute("data-indice"), 10) === indice);
    });
    BQInline.seleccionar(datos.secciones[indice].id, hacerScroll !== false);
    if (pestanaActual === "secciones" && modoPanel === "texto") {
      actualizarFormularioActual();
    }
  }

  /* Formulario de la sección seleccionada (modo «Textos» del panel) */
  function actualizarFormularioActual() {
    if (!datos || seccionAbierta < 0 || !datos.secciones[seccionAbierta]) {
      cerrarFormularioSeccion();
      return;
    }
    BQForm.construirSeccion(datos.secciones[seccionAbierta], $("#form-seccion"),
      alCambiarSeccionForm, alCambiarImagenSeccion);
  }

  function cerrarFormularioSeccion() {
    var caja = $("#form-seccion");
    if (caja) {
      caja.innerHTML = '<p class="form-vacio">Elegí una sección de la lista para editar sus textos.</p>';
    }
  }

  /* Alterna el panel derecho entre la vista previa y el formulario */
  function actualizarModoPanel() {
    if (pestanaActual !== "secciones") { return; }
    var esTexto = modoPanel === "texto";
    $("#modo-vista").classList.toggle("is-activo", !esTexto);
    $("#modo-texto").classList.toggle("is-activo", esTexto);
    document.querySelector(".vista-marco").hidden = esTexto;
    $("#form-seccion").hidden = !esTexto;
    if (esTexto) { actualizarFormularioActual(); }
    /* Al volver a la vista previa con una sección abierta, el iframe
       salta ahí para que veas el resultado de lo que editaste. */
    if (!esTexto && seccionAbierta >= 0 && datos && datos.secciones[seccionAbierta]) {
      irASeccion(datos.secciones[seccionAbierta]);
    }
  }

  /* Cambia entre “Secciones de la portada” y “Datos del local” */
  function activarPestana(nombre) {
    pestanaActual = nombre;
    $$(".pestana").forEach(function (p) {
      p.classList.toggle("is-activa", p.getAttribute("data-pestana") === nombre);
    });
    var esSitio = nombre === "sitio";
    document.querySelector(".cuerpo").hidden = esSitio;
    $("#panel-datos").hidden = !esSitio;
    if (esSitio) {
      if (datosSitio) {
        reconstruirFormSitio();
      }
    } else {
      actualizarModoPanel();
    }
  }

  /* ------------------------------ Publicar ------------------------------ */
  /* SHA actual del archivo en GitHub, sin tocar el estado del editor
     (si el archivo cambió afuera, hay conflicto y no se pisa a ciegas). */
  function vigilarSha(rutaArchivo) {
    return apiGet("/repos/" + REPO + "/contents/" + rutaArchivo + "?ref=" + BRANCH)
      .then(function (info) { return info.sha; });
  }

  /* ------------------- Historial de versiones (publicadas) --------------- */
  /* Lista los últimos commits que tocaron cada JSON y permite restaurar
     una versión: se carga COMO BORRADOR (nada se publica solo) y la propia
     restauración queda en el historial de deshacer. */
  function fechaLegible(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }) +
        " " + d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    } catch (e) { return ""; }
  }

  function listarVersiones() {
    $("#modal-versiones").hidden = false;
    var zona = $("#versiones-lista");
    zona.innerHTML = '<p class="form-vacio">Cargando el historial…</p>';

    var pedir = function (rutaArchivo, titulo) {
      return apiGet("/repos/" + REPO + "/commits?path=" + rutaArchivo + "&sha=" + BRANCH + "&per_page=10")
        .then(function (commits) {
          return {
            titulo: titulo,
            ruta: rutaArchivo,
            commits: (Array.isArray(commits) ? commits : []).map(function (c) {
              return {
                sha: c.sha,
                mensaje: String((c.commit && c.commit.message) || "(sin mensaje)").split("\n")[0],
                fecha: (c.commit && c.commit.author && c.commit.author.date) || ""
              };
            })
          };
        });
    };

    Promise.all([
      pedir(ARCHIVO_PAGINA, "Portada (pagina.json)"),
      pedir(ARCHIVO_SITIO, "Datos del local (sitio.json)")
    ]).then(function (listas) {
      zona.innerHTML = "";
      listas.forEach(function (grupo) {
        var bloque = document.createElement("div");
        bloque.className = "version-grupo";
        var titulo = document.createElement("h3");
        titulo.textContent = grupo.titulo;
        bloque.appendChild(titulo);
        if (!grupo.commits.length) {
          var vacio = document.createElement("p");
          vacio.className = "nota";
          vacio.textContent = "(sin versiones publicadas todavía)";
          bloque.appendChild(vacio);
        }
        grupo.commits.forEach(function (c) {
          var fila = document.createElement("div");
          fila.className = "version-fila";
          var info = document.createElement("div");
          info.className = "version-info";
          var mensaje = document.createElement("strong");
          mensaje.textContent = c.mensaje;
          mensaje.title = c.mensaje;
          info.appendChild(mensaje);
          var fecha = document.createElement("small");
          fecha.textContent = fechaLegible(c.fecha);
          info.appendChild(fecha);
          fila.appendChild(info);
          var boton = document.createElement("button");
          boton.type = "button";
          boton.className = "btn-borde btn-chico version-restaurar";
          boton.textContent = "Restaurar";
          (function (ruta, sha, fecha) {
            boton.addEventListener("click", function () { restaurarVersion(ruta, sha, fecha); });
          })(grupo.ruta, c.sha, c.fecha);
          fila.appendChild(boton);
          bloque.appendChild(fila);
        });
        zona.appendChild(bloque);
      });
    }).catch(function (err) {
      if (String(err.message).indexOf("TOKEN_INVALIDO") !== -1) {
        sessionStorage.removeItem(CLAVE_TOKEN);
        token = "";
        $("#modal-versiones").hidden = true;
        mostrarVista("vista-auth");
        mostrarErrorAuth("La sesión venció. Iniciá sesión de nuevo.");
        return;
      }
      zona.innerHTML = "";
      var aviso = document.createElement("p");
      aviso.className = "form-vacio";
      aviso.textContent = "No se pudo cargar el historial (" + err.message + ").";
      zona.appendChild(aviso);
    });
  }

  function restaurarVersion(rutaArchivo, sha, fecha) {
    apiGet("/repos/" + REPO + "/contents/" + rutaArchivo + "?ref=" + sha)
      .then(function (info) {
        var json = JSON.parse(textoDeB64(info.content));
        $("#modal-versiones").hidden = true;

        if (rutaArchivo === ARCHIVO_PAGINA) {
          if (!json || !Array.isArray(json.secciones)) { throw new Error("FORMATO"); }
          datos = json;
          seccionAbierta = -1;
          renderLista();
          if (pestanaActual === "secciones" && modoPanel === "texto") { actualizarFormularioActual(); }
          marcarCambios(true);
        } else {
          if (!json || typeof json !== "object") { throw new Error("FORMATO"); }
          datosSitio = json;
          if (pestanaActual === "sitio") { reconstruirFormSitio(); }
          marcarCambiosSitio(true);
        }

        /* La restauración entra al historial de deshacer: si era un error,
           Ctrl+Z la revierte igual que cualquier otro cambio. */
        capturarHistorial(true);
        programarRerender();
        toast("Versión del " + fechaLegible(fecha) + " restaurada como borrador. Revisala en la vista previa y publicá cuando estés conforme.", "ok", 6000);
      })
      .catch(function (err) {
        if (String(err.message).indexOf("TOKEN_INVALIDO") !== -1) {
          sessionStorage.removeItem(CLAVE_TOKEN);
          token = "";
          $("#modal-versiones").hidden = true;
          mostrarVista("vista-auth");
          mostrarErrorAuth("La sesión venció. Iniciá sesión de nuevo.");
          return;
        }
        toast("No se pudo restaurar la versión: " + err.message, "error", 6000);
      });
  }

  /* ---------------------- Copias de seguridad locales --------------------- */
  /* Copias del contenido guardadas en este navegador (portada + datos del
     local). Se guarda una automática antes de cada publicación y el cliente
     puede guardar más cuando quiera, descargarlas a un archivo o subir una
     guardada. Restaurar carga como borrador (desdeable), igual que las
     versiones de GitHub. */
  function leerCopias() {
    try {
      var lista = JSON.parse(localStorage.getItem(CLAVE_COPIAS) || "[]");
      return Array.isArray(lista) ? lista : [];
    } catch (e2) { return []; }
  }

  function escribirCopias(lista) {
    try { localStorage.setItem(CLAVE_COPIAS, JSON.stringify(lista)); }
    catch (e2) { toast("No se pudo guardar la copia (espacio del navegador lleno).", "error"); }
  }

  function guardarCopia(etiqueta, silencioso) {
    if (!datos && !datosSitio) { return null; }
    var lista = leerCopias();
    var copia = {
      id: String(Date.now()),
      fecha: new Date().toISOString(),
      etiqueta: etiqueta || "Copia manual",
      pagina: datos ? JSON.stringify(datos) : null,
      sitio: datosSitio ? JSON.stringify(datosSitio) : null
    };
    lista.unshift(copia);
    while (lista.length > MAX_COPIAS) { lista.pop(); }
    escribirCopias(lista);
    if (!silencioso) {
      toast("Copia guardada (" + MAX_COPIAS + " máximas, la más vieja se va borrando).", "ok");
    }
    return copia;
  }

  function pintarCopias() {
    var zona = $("#copias-lista");
    var lista = leerCopias();
    zona.innerHTML = "";
    if (!lista.length) {
      zona.innerHTML = '<p class="form-vacio">Todavía no hay copias guardadas.</p>';
      return;
    }
    lista.forEach(function (copia) {
      var fila = document.createElement("div");
      fila.className = "version-fila";
      var info = document.createElement("div");
      info.className = "version-info";
      var etiqueta = document.createElement("strong");
      etiqueta.textContent = copia.etiqueta;
      info.appendChild(etiqueta);
      var fecha = document.createElement("small");
      fecha.textContent = fechaLegible(copia.fecha) +
        " · " + (copia.pagina ? "portada" : "") + (copia.pagina && copia.sitio ? " + " : "") + (copia.sitio ? "datos del local" : "");
      info.appendChild(fecha);
      fila.appendChild(info);

      var restaurar = document.createElement("button");
      restaurar.type = "button";
      restaurar.className = "btn-borde btn-chico version-restaurar";
      restaurar.textContent = "Restaurar";
      restaurar.addEventListener("click", function () { restaurarCopia(copia.id); });
      fila.appendChild(restaurar);

      var descargar = document.createElement("button");
      descargar.type = "button";
      descargar.className = "btn-borde btn-chico version-restaurar";
      descargar.textContent = "Descargar";
      descargar.addEventListener("click", function () { descargarCopia(copia.id); });
      fila.appendChild(descargar);

      var borrar = document.createElement("button");
      borrar.type = "button";
      borrar.className = "mini-btn is-peligro";
      borrar.textContent = "✕";
      borrar.title = "Borrar esta copia";
      borrar.setAttribute("aria-label", "Borrar copia");
      borrar.addEventListener("click", function () { borrarCopia(copia.id); });
      fila.appendChild(borrar);

      zona.appendChild(fila);
    });
  }

  /* Carga una copia (o un archivo subido) como BORRADOR: nunca publica,
     y queda en el historial de deshacer. */
  function aplicarCopiaBorrador(objPagina, objSitio, aviso) {
    if (objPagina) {
      if (!objPagina.secciones || !Array.isArray(objPagina.secciones)) { throw new Error("FORMATO"); }
      datos = objPagina;
      seccionAbierta = -1;
      renderLista();
      if (pestanaActual === "secciones" && modoPanel === "texto") { actualizarFormularioActual(); }
      marcarCambios(true);
    }
    if (objSitio) {
      if (typeof objSitio !== "object") { throw new Error("FORMATO"); }
      datosSitio = objSitio;
      if (pestanaActual === "sitio") { reconstruirFormSitio(); }
      marcarCambiosSitio(true);
    }
    capturarHistorial(true);
    programarRerender();
    toast(aviso || "Copia cargada como borrador. Revisala antes de publicar.", "ok", 5200);
  }

  function restaurarCopia(id) {
    var copia = leerCopias().filter(function (c) { return c.id === id; })[0];
    if (!copia) { return; }
    try {
      $("#modal-copias").hidden = true;
      aplicarCopiaBorrador(
        copia.pagina ? JSON.parse(copia.pagina) : null,
        copia.sitio ? JSON.parse(copia.sitio) : null,
        "Copia del " + fechaLegible(copia.fecha) + " cargada como borrador."
      );
    } catch (e2) {
      toast("La copia está dañada y no se pudo cargar.", "error");
    }
  }

  function descargarCopia(id) {
    var copia = leerCopias().filter(function (c) { return c.id === id; })[0];
    if (!copia) { return; }
    var contenido = JSON.stringify({
      fecha: copia.fecha,
      etiqueta: copia.etiqueta,
      pagina: copia.pagina ? JSON.parse(copia.pagina) : null,
      sitio: copia.sitio ? JSON.parse(copia.sitio) : null
    }, null, 2);
    var blob = new Blob([contenido], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "copia-laboutique-" + String(copia.fecha).slice(0, 10) + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function borrarCopia(id) {
    escribirCopias(leerCopias().filter(function (c) { return c.id !== id; }));
    pintarCopias();
  }

  function importarCopia(archivo) {
    var lector = new FileReader();
    lector.onload = function () {
      try {
        var doc = JSON.parse(String(lector.result));
        var objPagina = doc.pagina || null;
        var objSitio = doc.sitio || null;
        if (!objPagina && !objSitio) { throw new Error("El archivo no tiene contenido reconocible."); }
        if (objPagina && !Array.isArray(objPagina.secciones)) {
          /* tolerancia: archivo con la portada sola */
          if (Array.isArray(doc)) { objPagina = { secciones: doc }; }
          else if (doc.secciones) { objPagina = doc; objSitio = objSitio || null; }
        }
        $("#modal-copias").hidden = true;
        aplicarCopiaBorrador(objPagina, objSitio, "Copia del archivo cargada como borrador.");
        guardarCopia("Subida desde archivo", true);
      } catch (e2) {
        toast("No se pudo leer el archivo: " + e2.message, "error");
      }
    };
    lector.readAsText(archivo);
  }

  function publicar() {
    pedirConfirmacion(
      "¿Publicar los cambios? Sí: crea un commit en GitHub y la web se actualiza en ~1 minuto.",
      function () {
        $("#carga-texto").textContent = "Publicando…";
        mostrarVista("vista-carga");

        /* Chequeo previo: ¿el archivo cambió en GitHub mientras editábamos?
           (otra pestaña del panel, el modo avanzado, un commit directo…) */
        var conflictoPagina = false;
        var conflictoSitio = false;
        var chequeo = Promise.resolve();
        if (borrador) {
          chequeo = chequeo.then(function () {
            return vigilarSha(ARCHIVO_PAGINA).then(function (remoto) {
              conflictoPagina = remoto !== shaPagina;
            });
          });
        }
        if (borradorSitio) {
          chequeo = chequeo.then(function () {
            return vigilarSha(ARCHIVO_SITIO).then(function (remoto) {
              conflictoSitio = remoto !== shaSitio;
            });
          });
        }

        chequeo.then(function () {
          if (conflictoPagina || conflictoSitio) {
            mostrarVista("vista-editor");
            pedirConfirmacion(
              "El contenido cambió en GitHub mientras lo editabas (por ejemplo desde el modo avanzado o desde otra pestaña). " +
              "«Aceptar» descarta tus cambios y recarga la última versión. «Cancelar» te deja en el editor con tu borrador intacto para reintentar más tarde.",
              function () { volverACargar(); }
            );
            return;
          }
          continuarPublicacion();
        }).catch(function (err) {
          /* si el chequeo falla (sin red), que lo resuelva el flujo normal */
          continuarPublicacion();
        });
      }
    );
  }

  function continuarPublicacion() {
    $("#carga-texto").textContent = "Publicando…";
    mostrarVista("vista-carga");

    /* Copia de seguridad automática antes de escribir en GitHub */
    guardarCopia("Antes de publicar", true);

    /* Publica primero la portada y después los datos del local:
       dos commits chicos y claros en el historial del repo. */
    var pasoPagina = borrador
      ? guardarPagina(datos, "Editor visual: actualizar secciones de la portada")
          .then(function () { borrador = false; })
      : Promise.resolve();

    pasoPagina
      .then(function () {
        if (borradorSitio) {
          return guardarSitio(datosSitio, "Editor visual: actualizar datos del local")
            .then(function () { borradorSitio = false; });
        }
      })
      .then(function () {
        /* El estado publicado pasa a ser la nueva base del historial */
        instantaneaPublicada = instantaneaActual();
        capturarHistorial(true);
        actualizarEstadoCambios();
        arrancarVistaPrevia();
        mostrarVista("vista-editor");
        $("#vista-aviso").hidden = false;
        toast("Cambios publicados. GitHub Pages los aplica en ~1 minuto.", "ok", 5200);
      }).catch(function (err) {
          mostrarVista("vista-editor");
          if (String(err.message) === "CONFLICTO") {
            pedirConfirmacion(
              "El archivo cambió en GitHub (¿quizás desde Sveltia?). Descartá tus cambios, revisá la nueva versión y aplicá las ediciones de nuevo.",
              function () { volverACargar(); }
            );
            return;
          }
          if (String(err.message) === "TOKEN_INVALIDO") {
            sessionStorage.removeItem(CLAVE_TOKEN);
            token = "";
            mostrarVista("vista-auth");
            mostrarErrorAuth("La sesión venció. Iniciá sesión de nuevo.");
            return;
          }
          toast("No se pudo publicar: " + err.message, "error", 6000);
        });
  }

  function volverACargar() {
    localStorage.removeItem(CLAVE_BORRADOR);
    localStorage.removeItem(CLAVE_BORRADOR_SITIO);
    cargarEditor();
  }

  /* Iniciales + conexiones de la interfaz */
  function conectarEventos() {
    $("#boton-login").addEventListener("click", iniciarLogin);
    $("#boton-token").addEventListener("click", iniciarLoginConToken);
    $("#boton-salir").addEventListener("click", function () {
      sessionStorage.removeItem(CLAVE_TOKEN);
      sessionStorage.removeItem("BQ_LOGIN");
      /* Los borradores quedan: si volvé a entrar, los recuperás. */
      location.reload();
    });
    $("#boton-carga-reintentar").addEventListener("click", cargarEditor);

    $("#boton-agregar").addEventListener("click", function () {
      $("#modal-agregar").hidden = false;
    });

    $("#boton-publicar").addEventListener("click", publicar);
    $("#boton-descartar").addEventListener("click", function () {
      pedirConfirmacion(
        "¿Descartar todos los cambios sin publicar? Se vuelve a la última versión en GitHub.",
        function () { volverACargar(); }
      );
    });
    $("#boton-recargar-vista").addEventListener("click", function () {
      arrancarVistaPrevia();
      $("#vista-aviso").hidden = true;
    });

    /* Deshacer / rehacer: botones + atajos de teclado */
    $("#boton-deshacer").addEventListener("click", function () { restaurarHistorial(-1); });
    $("#boton-rehacer").addEventListener("click", function () { restaurarHistorial(1); });
    $("#boton-versiones").addEventListener("click", listarVersiones);

    /* Copias de seguridad locales */
    $("#boton-copias").addEventListener("click", function () {
      pintarCopias();
      $("#modal-copias").hidden = false;
    });
    $("#copias-guardar").addEventListener("click", function () {
      guardarCopia("Copia manual");
      pintarCopias();
    });
    $("#copias-archivo").addEventListener("change", function (ev) {
      var f = ev.target.files && ev.target.files[0];
      if (f) { importarCopia(f); }
      ev.target.value = "";
    });

    /* Ayuda del panel */
    $("#boton-ayuda").addEventListener("click", function () {
      $("#modal-ayuda").hidden = false;
    });
    document.addEventListener("keydown", function (ev) {
      if (!(ev.ctrlKey || ev.metaKey)) { return; }
      var tecla = String(ev.key || "").toLowerCase();
      if (tecla !== "z" && tecla !== "y") { return; }
      /* Mientras se escribe en un campo, el deshacer nativo del navegador
         restaura el texto y nuestros listeners lo vuelven a sincronizar;
         no hay que interceptarlo. */
      var activo = document.activeElement;
      var escribiendo = activo && (activo.isContentEditable ||
        /^(input|textarea|select)$/i.test(activo.tagName));
      if (escribiendo) { return; }
      ev.preventDefault();
      if (tecla === "z" && !ev.shiftKey) { restaurarHistorial(-1); }
      else { restaurarHistorial(1); }
    });

    /* Vista previa: edición directa dentro del iframe */
    prepararVistaPrevia();

    /* Modos del panel derecho: Vista previa ⟷ Textos */
    $("#modo-vista").addEventListener("click", function () {
      modoPanel = "vista";
      actualizarModoPanel();
    });
    $("#modo-texto").addEventListener("click", function () {
      modoPanel = "texto";
      actualizarModoPanel();
    });

    /* Pestañas: Secciones de la portada / Datos del local */
    $$("[data-pestana]").forEach(function (pestana) {
      pestana.addEventListener("click", function () {
        activarPestana(pestana.getAttribute("data-pestana"));
      });
    });

    /* Modales: clic fuera y tecla Escape cierran; el de confirmación
       además cancela la acción pendiente. */
    $$(".modal").forEach(function (caja) {
      caja.addEventListener("click", function (evento) {
        if (evento.target === caja) { caja.hidden = true; if (caja.id === "modal-confirmar") { cerrarConfirmar(false); } }
      });
      caja.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape") {
          if (caja.id === "modal-confirmar") { cerrarConfirmar(false); }
          else { caja.hidden = true; }
        }
      });
    });
    $$(".boton-x").forEach(function (boton) {
      boton.addEventListener("click", function () { boton.closest(".modal").hidden = true; });
    });
    $("#modal-confirmar-si").addEventListener("click", function () { cerrarConfirmar(true); });
    $("#modal-confirmar-no").addEventListener("click", function () { cerrarConfirmar(false); });
  }

  /* -------------------------------- Init -------------------------------- */
  function init() {
    try {
      conectarEventos();
      var vinoPorLogin = sessionStorage.getItem("BQ_LOGIN") === "1";
      var trajoToken = capturarTokenDelHash();
      if (vinoPorLogin) { sessionStorage.removeItem("BQ_LOGIN"); }
      token = tokenValidoSeparado();
      if (!token) { mostrarVista("vista-auth"); return; }
      if (trajoToken) { toast("Sesión iniciada con GitHub.", "ok"); }
      cargarEditor();
    } catch (e2) {
      mostrarVista("vista-auth");
      mostrarErrorAuth("No se pudo iniciar el panel: " + e2.message);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
