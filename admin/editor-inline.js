/* ==========================================================================
   La Boutique Cat & Dog — Edición directa en la vista previa (W2.5)
   --------------------------------------------------------------------------
   Activa la edición "tipo constructor" dentro del iframe de vista previa:
   - Cada texto visible (títulos, párrafos, etiquetas, botones, menú, pie)
     se marca como editable: al pasar el mouse se resalta y con un clic se
     escribe directamente sobre la vista previa.
   - Los cambios se escriben en el modelo del editor (pagina.json /
     sitio.json) al instante; la vista se re-renderiza al terminar la
     edición con los datos del panel (BQPreview.renderizar).
   - El título del hero conserva el marcado **negritas**: al guardar se
     reconstruye el markdown desde los <span class="accent">.
   - Los enlaces de la vista previa no navegan: la miniatura es solo
     contexto de edición.
   Mapea el DOM que produce js/render.js; si el render cambia, se cambia
   este mapa en el mismo commit.
   ========================================================================== */
(function () {
  "use strict";

  /* Estado de la edición en curso (un solo campo a la vez) */
  var EDIT = { doc: null, hooks: null, el: null, objetivo: null, info: null, original: "" };
  var hoverPrevio = null;

  /* ------------------------- Estilos inyectados ------------------------- */
  function inyectarEstilos(doc) {
    var previo = doc.getElementById("bq-inline-estilos");
    if (previo && previo.parentNode) { previo.parentNode.removeChild(previo); }
    var st = doc.createElement("style");
    st.id = "bq-inline-estilos";
    st.textContent =
      "[data-bq-ruta]{cursor:text}" +
      "[data-bq-imagen]{cursor:pointer}" +
      ".bq-hover[data-bq-ruta],.bq-hover[data-bq-imagen]{outline:2px dashed rgba(192,39,45,.55);outline-offset:3px;border-radius:3px}" +
      "main > section.bq-selected{outline:2px solid rgba(192,39,45,.8);outline-offset:-4px}" +
      '[contenteditable="plaintext-only"],[contenteditable="true"]{' +
      "outline:2px solid #c0272d !important;outline-offset:3px;border-radius:3px;" +
      "background:rgba(192,39,45,.05)}" +
      /* Botón quitar producto: aparece al pasar el mouse por la tarjeta */
      ".product-card{position:relative}" +
      ".bq-quitar{position:absolute;top:10px;right:10px;z-index:6;width:28px;height:28px;" +
      "border:0;border-radius:50%;background:rgba(192,39,45,.92);color:#fff;" +
      "font-size:.8rem;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;" +
      "opacity:0;transition:opacity .15s;padding:0}" +
      ".product-card:hover .bq-quitar{opacity:1}" +
      ".bq-quitar:hover{background:#9c1d22}";
    doc.head.appendChild(st);
  }

  /* --------------------------- Marcado de campos ------------------------ */
  /* destino 0 = sección de pagina.json · 1 = sitio.json */
  function marcarCampo(el, destino, indice, ruta, tipo) {
    if (!el) { return; }
    el.setAttribute("data-bq-ruta", JSON.stringify({ d: destino, s: indice, r: ruta, t: tipo || "texto" }));
  }

  /* Imágenes: clic abre el selector (BQMedia) para reemplazarlas */
  function marcarImagen(el, destino, indice, ruta, conSrcset, dims, tipo, titulo) {
    if (!el) { return; }
    el.setAttribute("data-bq-imagen", JSON.stringify({
      d: destino, s: indice, r: ruta, x: !!conSrcset,
      k: dims || null, t: tipo || "foto", i: titulo || ""
    }));
  }

  function marcarSeccion(sec, el, indice) {
    var q = function (s) { return el.querySelector(s); };
    var qa = function (s) { return Array.prototype.slice.call(el.querySelectorAll(s)); };
    var C = function (nodo, ruta, tipo) { marcarCampo(nodo, 0, indice, ruta, tipo); };
    var S = function (nodo, ruta, tipo) { marcarCampo(nodo, 1, -1, ruta, tipo); };
    var IM = function (nodo, ruta, conSrcset, dims, tipo, titulo) {
      marcarImagen(nodo, 0, indice, ruta, conSrcset, dims, tipo, titulo);
    };

    if (sec.tipo === "hero") {
      C(q(".hero-copy > .eyebrow"), ["eyebrow"]);
      C(q(".hero-title"), ["titulo"], "rich");
      C(q(".hero-lead"), ["texto"]);
      C(q(".hero-actions .btn-whatsapp"), ["botonPrincipal", "texto"], "nodoTexto");
      C(q(".hero-actions .btn-outline"), ["botonSecundario", "texto"], "nodoTexto");
      qa(".carousel-slide img").forEach(function (im, i) {
        if (!(sec.slides || [])[i]) { return; }
        IM(im, ["slides", i, "imagen"], true, ["ancho", "alto"], "foto", "Foto del carrusel");
      });
      return;
    }

    if (sec.tipo === "categorias") {
      C(q(".section-head .eyebrow"), ["eyebrow"]);
      C(q(".section-head h2"), ["titulo"]);
      C(q(".section-head .section-intro"), ["intro"]);
      qa(".category-card").forEach(function (card, i) {
        if (!(sec.tarjetas || [])[i]) { return; }
        C(card.querySelector("h3"), ["tarjetas", i, "titulo"]);
        C(card.querySelector(".category-body p"), ["tarjetas", i, "texto"]);
        C(card.querySelector(".link-arrow"), ["ctaTexto"], "nodoTexto");
        IM(card.querySelector(".category-media"), ["tarjetas", i, "imagen"], false, ["ancho", "alto"], "foto", "Foto de la tarjeta");
      });
      return;
    }

    if (sec.tipo === "productos") {
      C(q(".section-head .eyebrow"), ["eyebrow"]);
      C(q(".section-head h2"), ["titulo"]);
      C(q(".section-head .section-intro"), ["intro"]);
      qa(".product-card").forEach(function (card, i) {
        if (!(sec.productos || [])[i]) { return; }
        C(card.querySelector(".product-tag"), ["productos", i, "etiqueta"]);
        C(card.querySelector(".product-body h3"), ["productos", i, "titulo"]);
        C(card.querySelector(".product-body > p"), ["productos", i, "descripcion"]);
        C(card.querySelector(".product-price"), ["productos", i, "precio"]);
        C(card.querySelector(".product-body .link-arrow"), ["ctaTexto"], "nodoTexto");
        var fotos = (sec.productos[i].fotos) || [];
        Array.prototype.forEach.call(card.querySelectorAll(".pc-slide"), function (im, j) {
          if (!fotos[j]) { return; }
          marcarImagen(im, 0, indice, ["productos", i, "fotos", j, "foto"], false, null, "foto", "Foto del producto");
        });
        /* Control rápido: quitar el producto desde la propia vista previa */
        if (!card.querySelector(".bq-quitar")) {
          var badge = el.ownerDocument.createElement("button");
          badge.type = "button";
          badge.className = "bq-quitar";
          badge.setAttribute("data-bq-quitar", JSON.stringify({ s: indice, i: i }));
          badge.setAttribute("aria-label", "Quitar producto");
          badge.title = "Quitar este producto";
          badge.textContent = "✕";
          card.appendChild(badge);
        }
      });
      return;
    }

    if (sec.tipo === "imagenTexto") {
      C(q(".about-content .eyebrow"), ["eyebrow"]);
      C(q(".about-content h2"), ["titulo"]);
      C(q(".about-content > p"), ["texto"]);
      qa(".about-list li").forEach(function (li, i) {
        if ((sec.vinetas || [])[i] != null) { C(li, ["vinetas", i]); }
      });
      C(q(".about-content .btn-dark"), ["boton", "texto"], "nodoTexto");
      IM(q(".about-media img"), ["imagen"], false, ["imagenAncho", "imagenAlto"], "foto", "Imagen de la sección");
      return;
    }

    if (sec.tipo === "contacto") {
      C(q(".section-head .eyebrow"), ["eyebrow"]);
      C(q(".section-head h2"), ["titulo"]);
      C(q(".section-head .section-intro"), ["intro"]);
      C(q(".contact-cta .btn-whatsapp"), ["botonWhatsapp", "texto"], "nodoTexto");
      C(q(".contact-cta .btn-outline"), ["botonMapsTexto"], "nodoTexto");
      /* Las tarjetas de info se reconocen por su título; algunas apuntan a
         datos del local (sitio.json), no a la sección. */
      qa(".info-card").forEach(function (card) {
        var h = card.querySelector("h3");
        var t = h ? String(h.textContent || "").trim() : "";
        if (t === "WhatsApp") { S(card.querySelector("p"), ["negocio", "whatsappDisplay"]); }
        if (t === "Horarios") { S(card.querySelector("p"), ["negocio", "hours"]); }
        if (t === "Ubicación") { S(card.querySelector("p"), ["negocio", "address"]); }
        if (t === "Seguinos") {
          var orden = sec.ordenSocial || [];
          var spans = card.querySelectorAll(".social-buttons li a span");
          Array.prototype.forEach.call(spans, function (sp, i) {
            if (orden[i]) { S(sp, ["redes", orden[i], "etiqueta"]); }
          });
        }
      });
    }
  }

  function marcarSitio(doc, sitio) {
    var S = function (el, ruta, tipo) { marcarCampo(el, 1, -1, ruta, tipo); };
    var IM = function (el, ruta, tipo, titulo) { marcarImagen(el, 1, -1, ruta, false, null, tipo, titulo); };

    var header = doc.querySelector("#site-header");
    if (header) {
      var brand = header.querySelector(".brand-name");
      if (brand) {
        S(brand, ["marca", "nombre"], "nodoTexto");
        S(brand.querySelector("em"), ["marca", "nombreSecundario"]);
      }
      var navs = header.querySelectorAll(".nav-list .nav-link");
      Array.prototype.forEach.call(navs, function (a, i) { S(a, ["nav", i, "texto"]); });
      S(header.querySelector(".nav-cta"), ["navCtaTexto"], "nodoTexto");
      IM(header.querySelector(".brand-logo"), ["marca", "logo"], "logo", "Logo");
    }

    var footer = doc.querySelector(".site-footer");
    if (!footer) { return; }
    S(footer.querySelector(".footer-brand p"), ["footer", "descripcion"]);
    IM(footer.querySelector(".footer-logo"), ["marca", "logo"], "logo", "Logo");

    var cols = footer.querySelectorAll(".footer-col");
    if (cols[0]) {
      S(cols[0].querySelector("h3"), ["footer", "seccionesTitulo"]);
      Array.prototype.forEach.call(cols[0].querySelectorAll("ul li a"), function (a, i) {
        S(a, ["nav", i, "texto"]);
      });
    }
    if (cols[1]) {
      S(cols[1].querySelector("h3"), ["footer", "contactoTitulo"]);
      var pos = 0;
      Array.prototype.forEach.call(cols[1].querySelectorAll("ul li"), function (li) {
        var mail = li.querySelector('a[href^="mailto:"]');
        if (mail) { S(mail, ["negocio", "email"]); return; }
        var wa = li.querySelector("a[data-wa-link]");
        if (wa) { S(wa, ["footer", "whatsappTexto"]); return; }
        var span = li.querySelector("span");
        if (!span) { return; }
        if (pos === 0) { S(span, ["negocio", "address"]); }
        else if (pos === 1) { S(span, ["negocio", "hours"]); }
        pos += 1;
      });
    }
    if (cols[2]) {
      S(cols[2].querySelector("h3"), ["footer", "seguinosTitulo"]);
      var orden = (sitio && sitio.footer && sitio.footer.ordenSocial) || [];
      var spans = cols[2].querySelectorAll(".social-list li a span");
      Array.prototype.forEach.call(spans, function (sp, i) {
        if (orden[i]) { S(sp, ["redes", orden[i], "etiqueta"]); }
      });
    }
    /* El copyright comparte <p> con el año: se edita el último nodo de
       texto (el que sigue al <span data-year>). */
    S(footer.querySelector(".footer-bottom p"), ["footer", "copyright"], "nodoTextoFin");
  }

  function marcarTodo(doc, hooks) {
    marcarSitio(doc, hooks.datosSitio ? hooks.datosSitio() : null);
    Array.prototype.forEach.call(doc.querySelectorAll("main > section"), function (el) {
      var info = hooks.getSeccion(el.id);
      if (info && info.seccion) { marcarSeccion(info.seccion, el, info.indice); }
    });
  }

  /* ------------------------------ Eventos ------------------------------- */
  function activarEventos(doc) {
    doc.addEventListener("click", alClic, true);
    doc.addEventListener("mouseover", alPasar, true);
    doc.addEventListener("input", alEscribir, true);
    doc.addEventListener("focusout", alPerderFoco, true);
    doc.addEventListener("keydown", alTecla, true);
    /* Deshacer/rehacer también mientras el foco está en la vista previa */
    doc.addEventListener("keydown", alAtajo, true);
  }

  function alAtajo(ev) {
    if (!(ev.ctrlKey || ev.metaKey)) { return; }
    var tecla = String(ev.key || "").toLowerCase();
    if (tecla !== "z" && tecla !== "y") { return; }
    /* Si el foco está en un texto editable, manda el deshacer nativo */
    if (EDIT.objetivo && ev.target === EDIT.objetivo) { return; }
    ev.preventDefault();
    ev.stopPropagation();
    if (EDIT.hooks && EDIT.hooks.alAtajo) {
      EDIT.hooks.alAtajo(tecla === "z" && !ev.shiftKey ? -1 : 1);
    }
  }

  function alClic(ev) {
    var t = ev.target;
    if (!t || !t.closest) { return; }

    /* Quitar un producto desde la vista previa (pide confirmación) */
    var quitar = t.closest("[data-bq-quitar]");
    if (quitar) {
      ev.preventDefault();
      ev.stopPropagation();
      if (EDIT.hooks && EDIT.hooks.alQuitarProducto) {
        var q;
        try { q = JSON.parse(quitar.getAttribute("data-bq-quitar")); } catch (e) { q = null; }
        if (q) { EDIT.hooks.alQuitarProducto(q.s, q.i); }
      }
      return;
    }

    /* Clic en una imagen: abrir el selector para cambiarla */
    var im = t.closest("[data-bq-imagen]");
    if (im) {
      ev.preventDefault();
      ev.stopPropagation();
      if (EDIT.hooks && EDIT.hooks.alPedirImagen) {
        var info;
        try { info = JSON.parse(im.getAttribute("data-bq-imagen")); } catch (e) { info = null; }
        if (info) { EDIT.hooks.alPedirImagen(info); }
      }
      /* También queda seleccionada la sección que la contiene */
      if (EDIT.hooks && EDIT.hooks.getSeccion && EDIT.hooks.alSeleccionar) {
        var cont = im.closest("main > section");
        if (cont && cont.id) {
          var inf = EDIT.hooks.getSeccion(cont.id);
          if (inf) { EDIT.hooks.alSeleccionar(inf.indice); }
        }
      }
      return;
    }

    /* Clic en un texto editable: empezar a editar ahí mismo */
    var ed = t.closest("[data-bq-ruta]");
    if (ed) {
      ev.preventDefault();
      ev.stopPropagation();
      iniciarEdicion(ed);
      return;
    }

    /* Enlaces internos / WhatsApp / Maps: no navegar dentro de la vista */
    var a = t.closest("a");
    if (a) {
      var href = a.getAttribute("href") || "";
      if (a.hasAttribute("data-wa-link") || a.hasAttribute("data-maps-link") || href === "" || href.charAt(0) === "#") {
        ev.preventDefault();
        ev.stopPropagation();
      }
    }

    /* Clic en el fondo de una sección: seleccionarla en la lista */
    if (EDIT.hooks && EDIT.hooks.alSeleccionar) {
      var sec = t.closest("main > section");
      if (sec && sec.id) {
        var info = EDIT.hooks.getSeccion(sec.id);
        if (info) { EDIT.hooks.alSeleccionar(info.indice); }
      }
    }
  }

  function alPasar(ev) {
    var t = ev.target;
    if (!t || !t.closest) { return; }
    var el = t.closest("[data-bq-ruta],[data-bq-imagen]");
    if (el === hoverPrevio) { return; }
    if (hoverPrevio && hoverPrevio.classList) { hoverPrevio.classList.remove("bq-hover"); }
    hoverPrevio = el;
    if (el) { el.classList.add("bq-hover"); }
  }

  function alEscribir(ev) {
    if (!EDIT.objetivo || ev.target !== EDIT.objetivo) { return; }
    aplicarCambio(EDIT.info, leerValor(EDIT.objetivo, EDIT.info.t));
  }

  function alPerderFoco(ev) {
    if (!EDIT.objetivo || ev.target !== EDIT.objetivo) { return; }
    finalizar(true);
  }

  function alTecla(ev) {
    if (!EDIT.objetivo || ev.target !== EDIT.objetivo) { return; }
    if (ev.key === "Enter") {
      /* Un solo renglón por campo: Enter confirma (el formulario admite
         textos largos con sus saltos). */
      ev.preventDefault();
      EDIT.objetivo.blur();
    }
    if (ev.key === "Escape") {
      ev.preventDefault();
      finalizar(false);
    }
  }

  /* ----------------------------- Edición --------------------------------- */
  function iniciarEdicion(el) {
    if (EDIT.el === el) { return; }
    if (EDIT.el) { finalizar(true); }

    var info;
    try { info = JSON.parse(el.getAttribute("data-bq-ruta")); } catch (e) { return; }

    var objetivo = el;
    if (info.t === "nodoTexto" || info.t === "nodoTextoFin") {
      objetivo = envolverTexto(el, info.t === "nodoTextoFin");
    }
    if (!objetivo) { return; }

    EDIT.el = el;
    EDIT.objetivo = objetivo;
    EDIT.info = info;
    EDIT.original = leerValor(objetivo, info.t);

    objetivo.setAttribute("contenteditable", "plaintext-only");
    if (objetivo.contentEditable !== "plaintext-only") {
      objetivo.setAttribute("contenteditable", "true");
    }
    objetivo.focus();
    ponerCaret(objetivo);
  }

  /* Convierte el texto en blanco editable, envolviendo el nodo de texto
     en un <span> para no arrastrar íconos SVG ni flechas al escribir. */
  function envolverTexto(el, alFinal) {
    var nodos = el.childNodes;
    var textoNodo = null;
    if (alFinal) {
      for (var i = nodos.length - 1; i >= 0; i--) {
        var n = nodos[i];
        if (n.nodeType === 3 && n.nodeValue && n.nodeValue.replace(/\s+/g, "") !== "") { textoNodo = n; break; }
      }
    } else {
      for (var j = 0; j < nodos.length; j++) {
        var m = nodos[j];
        if (m.nodeType === 3 && m.nodeValue && m.nodeValue.replace(/\s+/g, "") !== "") { textoNodo = m; break; }
      }
    }
    var span = el.ownerDocument.createElement("span");
    if (textoNodo) {
      textoNodo.parentNode.insertBefore(span, textoNodo);
      span.appendChild(textoNodo);
    } else {
      el.appendChild(span);
    }
    return span;
  }

  function ponerCaret(el) {
    var doc = el.ownerDocument;
    try {
      var r = doc.createRange();
      r.selectNodeContents(el);
      r.collapse(false);
      var s = doc.getSelection();
      s.removeAllRanges();
      s.addRange(r);
    } catch (e) { /* sin selección: no es fatal */ }
  }

  /* Lectura del valor según el tipo de campo */
  function leerValor(objetivo, tipo) {
    if (tipo === "rich") { return serializarRich(objetivo); }
    return String(objetivo.textContent || "").trim();
  }

  /* Reconstruye el markdown del título del hero: los <span class="accent">
     vuelven a **negrita** y los <em> a *cursiva*. */
  function serializarRich(nodo) {
    var fuera = "";
    Array.prototype.forEach.call(nodo.childNodes, function (h) {
      if (h.nodeType === 3) { fuera += h.nodeValue; return; }
      if (h.nodeType !== 1) { return; }
      if (h.classList && h.classList.contains("type-caret")) { return; }
      var txt = h.textContent || "";
      if (h.classList && h.classList.contains("accent")) { fuera += "**" + txt + "**"; }
      else if (h.tagName === "EM") { fuera += "*" + txt + "*"; }
      else { fuera += txt; }
    });
    return fuera.trim();
  }

  function aplicarCambio(info, valor) {
    if (!info || !EDIT.hooks) { return; }
    if (info.d === 0) { EDIT.hooks.alCambiarSeccion(info.s, info.r, valor); }
    else { EDIT.hooks.alCambiarSitio(info.r, valor); }
  }

  function finalizar(guardar) {
    if (!EDIT.el) { return; }
    var el = EDIT.el;
    var objetivo = EDIT.objetivo;
    var info = EDIT.info;
    var original = EDIT.original;
    var hooks = EDIT.hooks;

    /* Bajar el estado ANTES de tocar el DOM: quitar contenteditable dispara
       un focusout que no debe re-entrar en finalizar (guardaría el valor
       viejo por encima de una reversión con Escape). */
    EDIT.el = null;
    EDIT.objetivo = null;
    EDIT.info = null;
    EDIT.original = "";

    /* Si el elemento ya no está en el documento (un re-render lo sacó),
       el valor es de un DOM desactualizado: no se escribe nada, ni siquiera
       la reversión. */
    var desactualizado = !objetivo.isConnected;
    if (desactualizado) { guardar = false; }

    if (guardar) { aplicarCambio(info, leerValor(objetivo, info.t)); }
    else if (!desactualizado) { aplicarCambio(info, original); }

    objetivo.removeAttribute("contenteditable");
    if (objetivo !== el && objetivo.parentNode) {
      var padre = objetivo.parentNode;
      while (objetivo.firstChild) { padre.insertBefore(objetivo.firstChild, objetivo); }
      padre.removeChild(objetivo);
    }

    if (hooks && hooks.alTerminar && !desactualizado) { hooks.alTerminar(guardar); }
  }

  /* Cancela la edición abierta SIN escribir nada en el modelo.
     La usan deshacer/rehacer y los re-renders programados: evita que un
     foco perdido escriba su valor sobre un modelo recién restaurado. */
  function cancelarEdicion() {
    if (!EDIT.el) { return; }
    var el = EDIT.el;
    var objetivo = EDIT.objetivo;
    EDIT.el = null;
    EDIT.objetivo = null;
    EDIT.info = null;
    EDIT.original = "";
    objetivo.removeAttribute("contenteditable");
    if (objetivo !== el && objetivo.parentNode) {
      var padre = objetivo.parentNode;
      while (objetivo.firstChild) { padre.insertBefore(objetivo.firstChild, objetivo); }
      padre.removeChild(objetivo);
    }
  }

  /* --------------------------- API pública ------------------------------- */
  window.BQInline = {
    /* Marca los editables y conecta los eventos del documento del iframe */
    aplicar: function (marco, hooks) {
      var doc = marco.contentDocument;
      if (!doc || !doc.body || !hooks) { return; }
      EDIT.doc = doc;
      EDIT.hooks = hooks;
      inyectarEstilos(doc);
      marcarTodo(doc, hooks);
      if (!doc.__bqActivo) {
        doc.__bqActivo = true;
        activarEventos(doc);
      }
    },

    /* Resalta (y opcionalmente enfoca) la sección seleccionada */
    seleccionar: function (id, hacerScroll) {
      var doc = EDIT.doc;
      if (!doc) { return; }
      var previo = doc.querySelector("main > section.bq-selected");
      if (previo) { previo.classList.remove("bq-selected"); }
      if (!id) { return; }
      var el = doc.getElementById(id);
      if (!el) { return; }
      el.classList.add("bq-selected");
      if (hacerScroll && el.scrollIntoView) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },

    /* Cierra la edición en curso sin escribir en el modelo */
    cancelar: cancelarEdicion
  };
})();
