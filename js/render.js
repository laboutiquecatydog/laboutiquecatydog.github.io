/* ==========================================================================
   La Boutique Cat & Dog — Motor de render
   --------------------------------------------------------------------------
   Construye el HTML de la página (header, bloques de <main>, footer) a
   partir de data/sitio.json y data/pagina.json.
   - Sin dependencias, sin plantillas: solo concatenación de strings.
   - Los campos de texto se escapan; solo **destacado** y *cursiva* producen
     marcado inline (nunca HTML crudo del cliente).
   - Reproduce exactamente el markup de la web original: mismas clases,
     mismos atributos, mismas animaciones. Degradable: si falla el render,
     js/main.js muestra un mensaje en su lugar.
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------- Íconos ------------------------------ */
  var SVG_WA_BTN =
    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.39c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2zm0 18.02c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.14.82.84-3.06-.2-.32a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.24-8.23 4.54 0 8.23 3.69 8.23 8.23s-3.69 8.25-8.21 8.25zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43-.14 0-.31-.02-.47-.02s-.43.06-.66.31c-.22.25-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z"/></svg>';

  var SVG_WA_INFO =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.39c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2zm0 18.02c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.14.82.84-3.06-.2-.32a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.24-8.23 4.54 0 8.23 3.69 8.23 8.23s-3.69 8.25-8.21 8.25z"/></svg>';

  /* Mismo trazo completo que el botón, pero sin class="icon": el FAB
     dimensiona el svg con su propia regla (.whatsapp-fab svg). */
  var SVG_WA_FAB =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.39c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2zm0 18.02c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.14.82.84-3.06-.2-.32a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.24-8.23 4.54 0 8.23 3.69 8.23 8.23s-3.69 8.25-8.21 8.25zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43-.14 0-.31-.02-.47-.02s-.43.06-.66.31c-.22.25-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z"/></svg>';

  var SVG_PREV =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M15 18l-6-6 6-6"/></svg>';

  var SVG_NEXT =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 6l6 6-6 6"/></svg>';

  var SVG_MAPS_INFO =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';

  var SVG_MAPS_BTN =
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';

  var SVG_CLOCK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

  var SVG_PHONE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>';

  var SVG_EMAIL =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>';

  var SOCIAL_SVG = {
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.1-.9 0-1.4.2-1.7.3-.4.2-.7.4-1 .7-.3.3-.5.6-.7 1-.1.3-.3.8-.3 1.7-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c0 .9.2 1.4.3 1.7.2.4.4.7.7 1 .3.3.6.5 1 .7.3.1.8.3 1.7.3 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c.9 0 1.4-.2 1.7-.3.4-.2.7-.4 1-.7.3-.3.5-.6.7-1 .1-.3.3-.8.3-1.7.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c0-.9-.2-1.4-.3-1.7-.2-.4-.4-.7-.7-1-.3-.3-.6-.5-1-.7-.3-.1-.8-.3-1.7-.3-1.2-.1-1.6-.1-4.7-.1zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8zm0 8.1a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zm6.2-8.3a1.1 1.1 0 1 1-2.3 0 1.1 1.1 0 0 1 2.3 0z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.5 3c.3 2.1 1.5 3.6 3.5 3.9v2.4c-1.2.1-2.3-.2-3.4-.8v5.7c0 3.4-2.3 5.8-5.4 5.8A5.4 5.4 0 0 1 5.7 13c0-3 2.4-5.5 5.7-5.1v2.6c-.3-.1-.6-.2-.9-.2-1.4 0-2.5 1.2-2.5 2.6s1.1 2.6 2.5 2.6c1.5 0 2.5-1.1 2.5-2.6V3h3.5z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg>'
  };

  /* ------------------------------ Helpers ------------------------------ */
  /* Texto: escapa & < >  (el cliente nunca inyecta HTML crudo). */
  function e(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  /* Atributos: además escapa comillas dobles. */
  function a(v) {
    return e(v).replace(/"/g, "&quot;");
  }
  function set(v) {
    return typeof v === "string" && v.trim() !== "";
  }

  /* Enlaces: solo esquemas seguros. Si el dato viniera contaminado con
     algo como "javascript:…", el enlace queda neutralizado en "#".
     (Defensa en profundidad: el panel solo deberían usarlo personas de
     confianza, pero un pegado accidental no debe poder ejecutar código.) */
  function hrefSeguro(v) {
    var s = String(v == null ? "" : v).trim();
    if (s === "") { return "#"; }
    if (s.charAt(0) === "#" || s.charAt(0) === "/") { return a(s); }
    if (/^(https?:|mailto:|tel:)/i.test(s)) { return a(s); }
    return "#";
  }

  /* Texto con marcado mínimo: **destacado** y *cursiva*. Escapa antes. */
  function rich(v) {
    var s = e(v);
    s = s.replace(/\*\*([^*]+)\*\*/g, '<span class="accent">$1</span>');
    s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    return s;
  }

  function wa(msg, sitio) {
    return a(set(msg) ? msg : (sitio.negocio && sitio.negocio.whatsappMensaje) || "");
  }

  /* ------------------------------- Header ------------------------------ */
  function buildHeader(sitio) {
    var m = sitio.marca || {};
    var n = sitio.nav || [];
    var neg = sitio.negocio || {};

    var links = n.map(function (item) {
      return '<li><a class="nav-link" href="' + hrefSeguro(item.ancla) + '">' + e(item.texto) + "</a></li>";
    }).join("");

    var cta = "";
    if (set(neg.whatsapp)) {
      cta =
        '<div class="nav-actions">' +
        '<a class="btn btn-whatsapp nav-cta" data-wa-link data-wa-msg="' + wa("", sitio) + '">' +
        SVG_WA_BTN + " " + e(sitio.navCtaTexto || "WhatsApp") +
        "</a></div>";
    }

    return (
      '<a class="brand" href="#inicio" aria-label="' + a(m.ariaLabel) + '">' +
      '<span class="brand-mark">' +
      '<img class="brand-logo" src="' + a(m.logo) + '" alt="' + a(m.logoAlt) + '" width="300" height="300" />' +
      "</span>" +
      '<span class="brand-name">' + e(m.nombre) + "<em>" + e(m.nombreSecundario) + "</em></span>" +
      "</a>" +
      '<nav class="main-nav" id="main-nav" aria-label="Navegación principal">' +
      '<ul class="nav-list">' + links + "</ul>" +
      cta +
      "</nav>" +
      '<button class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="main-nav" aria-label="Abrir menú de navegación">' +
      "<span></span><span></span><span></span>" +
      "</button>"
    );
  }

  /* ------------------------------- Footer ------------------------------ */
  function buildFooter(sitio) {
    var f = sitio.footer || {};
    var m = sitio.marca || {};
    var neg = sitio.negocio || {};
    var redes = sitio.redes || {};
    var n = sitio.nav || [];

    var secciones = n.map(function (item) {
      return "<li><a href=\"" + hrefSeguro(item.ancla) + '">' + e(item.texto) + "</a></li>";
    }).join("");

    var contacto = "";
    if (set(neg.address)) contacto += "<li><span>" + e(neg.address) + "</span></li>";
    if (set(neg.hours)) contacto += "<li><span>" + e(neg.hours) + "</span></li>";
    if (set(neg.phone)) contacto += "<li><span>" + e(neg.phone) + "</span></li>";
    if (set(neg.email)) contacto += '<li><a href="mailto:' + a(neg.email) + '">' + e(neg.email) + "</a></li>";
    if (set(neg.whatsapp)) {
      contacto += '<li><a data-wa-link data-wa-msg="' + wa("", sitio) + '">' + e(f.whatsappTexto || "WhatsApp") + "</a></li>";
    }

    var social = (f.ordenSocial || ["instagram", "facebook", "tiktok"]).map(function (key) {
      var r = redes[key];
      if (!r || !set(r.url)) return "";
      return (
        '<li><a href="' + hrefSeguro(r.url) + '" target="_blank" rel="noopener" aria-label="' + a(r.etiqueta) + '">' +
        (SOCIAL_SVG[key] || "") +
        "</a></li>"
      );
    }).join("");

    return (
      '<div class="container footer-grid">' +
      '<div class="footer-brand">' +
      '<span class="footer-mark">' +
      '<img class="footer-logo" src="' + a(m.logo) + '" alt="' + a(m.logoAlt) + '" width="300" height="300" />' +
      "</span>" +
      "<p>" + e(f.descripcion) + "</p>" +
      "</div>" +
      '<nav class="footer-col" aria-label="' + a(f.seccionesTitulo) + '">' +
      "<h3>" + e(f.seccionesTitulo) + "</h3>" +
      "<ul>" + secciones + "</ul>" +
      "</nav>" +
      '<div class="footer-col">' +
      "<h3>" + e(f.contactoTitulo) + "</h3>" +
      "<ul>" + contacto + "</ul>" +
      "</div>" +
      '<div class="footer-col">' +
      "<h3>" + e(f.seguinosTitulo) + "</h3>" +
      '<ul class="social-list">' + social + "</ul>" +
      "</div>" +
      "</div>" +
      '<div class="container footer-bottom">' +
      "<p>&copy; <span data-year>2026</span> " + e(f.copyright) + "</p>" +
      "</div>"
    );
  }

  /* ------------------------------- Bloques ----------------------------- */
  function sectionHead(b) {
    return (
      '<header class="section-head" data-reveal>' +
      '<p class="eyebrow">' + e(b.eyebrow) + "</p>" +
      "<h2>" + e(b.titulo) + "</h2>" +
      '<p class="section-intro">' + e(b.intro) + "</p>" +
      "</header>"
    );
  }

  function buildHero(b, sitio) {
    var slides = (b.slides || []).map(function (s, i) {
      var cls = "carousel-slide" + (i === 0 ? " is-active" : "");
      var aria = i === 0 ? "" : ' aria-hidden="true"';
      var load = i === 0
        ? (s.prioridad ? ' fetchpriority="high"' : "")
        : ' loading="lazy"';
      return (
        '<figure class="' + cls + '" data-slide' + aria + ">" +
        '<img src="' + a(s.imagen) + '"' +
        (s.srcset ? ' srcset="' + a(s.srcset) + '"' : "") +
        (s.sizes ? ' sizes="' + a(s.sizes) + '"' : "") +
        ' alt="' + a(s.alt) + '"' +
        (s.ancho ? ' width="' + s.ancho + '"' : "") +
        (s.alto ? ' height="' + s.alto + '"' : "") +
        load + ' decoding="async" />' +
        "</figure>"
      );
    }).join("");

    return (
      '<section class="hero intro" id="' + a(b.id || "inicio") + '" aria-label="' + a(b.aria) + '">' +
      '<div class="container hero-grid">' +
      '<div class="hero-copy">' +
      '<p class="eyebrow" style="--i:0">' + e(b.eyebrow) + "</p>" +
      '<h1 class="hero-title" style="--i:1" data-type>' + rich(b.titulo) + "</h1>" +
      '<p class="hero-lead" style="--i:2">' + e(b.texto) + "</p>" +
      '<div class="hero-actions" style="--i:3">' +
      '<a class="btn btn-whatsapp btn-lg" data-wa-link data-wa-msg="' + wa(b.botonPrincipal && b.botonPrincipal.mensaje, sitio) + '">' +
      SVG_WA_BTN + " " + e(b.botonPrincipal && b.botonPrincipal.texto) +
      "</a>" +
      '<a class="btn btn-outline btn-lg" href="' + hrefSeguro(b.botonSecundario && b.botonSecundario.enlace) + '">' +
      e(b.botonSecundario && b.botonSecundario.texto) +
      "</a>" +
      "</div></div>" +
      '<div class="hero-media">' +
      '<div class="carousel" data-carousel aria-roledescription="carrusel" aria-label="' + a(b.carruselAria) + '">' +
      '<div class="carousel-viewport">' + slides + "</div>" +
      '<button class="carousel-btn carousel-prev" type="button" data-carousel-prev aria-label="Imagen anterior">' + SVG_PREV + "</button>" +
      '<button class="carousel-btn carousel-next" type="button" data-carousel-next aria-label="Imagen siguiente">' + SVG_NEXT + "</button>" +
      '<div class="carousel-dots" data-carousel-dots role="group" aria-label="Seleccionar imagen"></div>' +
      "</div></div></div></section>"
    );
  }

  function buildCategorias(b) {
    var cards = (b.tarjetas || []).map(function (c, i) {
      return (
        '<a class="category-card" href="' + hrefSeguro(c.enlace) + '" data-reveal style="--reveal-delay:' + (i * 90) + 'ms">' +
        '<img class="category-media" src="' + a(c.imagen) + '" alt="' + a(c.alt) + '"' +
        (c.ancho ? ' width="' + c.ancho + '"' : "") +
        (c.alto ? ' height="' + c.alto + '"' : "") +
        ' loading="lazy" decoding="async" />' +
        '<span class="category-body">' +
        "<h3>" + e(c.titulo) + "</h3>" +
        "<p>" + e(c.texto) + "</p>" +
        '<span class="link-arrow">' + e(b.ctaTexto) + ' <span aria-hidden="true">&rarr;</span></span>' +
        "</span></a>"
      );
    }).join("");

    return (
      '<section class="section" id="' + a(b.id || "categorias") + '">' +
      '<div class="container">' + sectionHead(b) +
      '<div class="category-grid">' + cards + "</div>" +
      "</div></section>"
    );
  }

  function buildProductoCard(p, sitio, ctaTexto, index) {
    var fotos = p.fotos || [];
    var cta = set(ctaTexto) ? ctaTexto : "Consultar disponibilidad";
    var single = fotos.length < 2;
    var label = single ? "Foto de " : "Fotos de ";
    var hidden = single ? " hidden" : "";
    var delay = ((index || 0) % 4) * 80;

    var imgs = fotos.map(function (f, i) {
      var cls = "pc-slide" + (i === 0 ? " is-active" : "");
      var aria = i === 0 ? "" : ' aria-hidden="true"';
      return (
        '<img class="' + cls + '" data-slide src="' + a(f.foto) + '" alt="' + a(f.alt) +
        '" loading="lazy" decoding="async"' + aria + " />"
      );
    }).join("");

    var precio = set(p.precio) ? '<span class="product-price">' + e(p.precio) + "</span>" : "";

    return (
      '<article class="product-card" data-reveal data-pet="' + a(p.mascotas) + '" style="--reveal-delay:' + delay + 'ms">' +
      '<div class="product-carousel" data-carousel aria-roledescription="carrusel" aria-label="' + a(label + p.titulo) + '">' +
      '<div class="pc-viewport">' + imgs + "</div>" +
      '<button class="pc-btn pc-prev" type="button" data-carousel-prev aria-label="Foto anterior"' + hidden + ">" + SVG_PREV + "</button>" +
      '<button class="pc-btn pc-next" type="button" data-carousel-next aria-label="Foto siguiente"' + hidden + ">" + SVG_NEXT + "</button>" +
      '<div class="pc-dots" data-carousel-dots role="group" aria-label="Seleccionar foto"></div>' +
      "</div>" +
      '<div class="product-body">' +
      '<span class="product-tag">' + e(p.etiqueta) + "</span>" +
      "<h3>" + e(p.titulo) + "</h3>" +
      "<p>" + e(p.descripcion) + "</p>" +
      precio +
      '<a class="link-arrow" data-wa-link data-wa-msg="' + a(p.mensajeWhatsApp) + '">' + e(cta) + ' <span aria-hidden="true">&rarr;</span></a>' +
      "</div></article>"
    );
  }

  function buildProductos(b, sitio) {
    var filtros = "";
    if (b.mostrarFiltros) {
      filtros =
        '<div class="product-filters" data-product-filters role="group" aria-label="Filtrar productos por mascota" data-reveal>' +
        '<button class="filter-chip is-active" type="button" data-filter="all" aria-pressed="true">Todos</button>' +
        '<button class="filter-chip" type="button" data-filter="perro" aria-pressed="false">Perros</button>' +
        '<button class="filter-chip" type="button" data-filter="gato" aria-pressed="false">Gatos</button>' +
        "</div>";
    }

    var cards = (b.productos || []).map(function (p, i) {
      return buildProductoCard(p, sitio, b.ctaTexto, i);
    }).join("");

    /* Paginación del catálogo: JS la activa cuando hay más de 6 productos
       (bloques de 6 por página, respetando el filtro activo). */
    return (
      '<section class="section" id="' + a(b.id || "productos") + '">' +
      '<div class="container">' + sectionHead(b) +
      filtros +
      '<div class="product-grid">' + cards + "</div>" +
      '<nav class="product-pagination" data-product-pagination hidden aria-label="Páginas del catálogo"></nav>' +
      "</div></section>"
    );
  }

  function buildImagenTexto(b, sitio) {
    var viñetas = (b.vinetas || []).map(function (v) {
      return "<li>" + e(v) + "</li>";
    }).join("");

    return (
      '<section class="section section-alt" id="' + a(b.id || "nosotros") + '">' +
      '<div class="container about-grid">' +
      '<div class="about-media" data-reveal>' +
      '<img src="' + a(b.imagen) + '" alt="' + a(b.imagenAlt) + '" loading="lazy"' +
      (b.imagenAncho ? ' width="' + b.imagenAncho + '"' : "") +
      (b.imagenAlto ? ' height="' + b.imagenAlto + '"' : "") +
      ' decoding="async" />' +
      "</div>" +
      '<div class="about-content" data-reveal>' +
      '<p class="eyebrow">' + e(b.eyebrow) + "</p>" +
      "<h2>" + e(b.titulo) + "</h2>" +
      "<p>" + e(b.texto) + "</p>" +
      '<ul class="about-list">' + viñetas + "</ul>" +
      '<a class="btn btn-dark" data-wa-link data-wa-msg="' + wa(b.boton && b.boton.mensaje, sitio) + '">' + e(b.boton && b.boton.texto) + "</a>" +
      "</div></div></section>"
    );
  }

  function infoCard(icon, titulo, body) {
    return (
      '<div class="info-card" data-reveal>' +
      '<span class="info-icon" aria-hidden="true">' + icon + "</span>" +
      "<h3>" + e(titulo) + "</h3>" +
      body +
      "</div>"
    );
  }

  function buildContacto(b, sitio) {
    var neg = sitio.negocio || {};
    var redes = sitio.redes || {};
    var cards = "";

    if (set(neg.whatsapp)) {
      cards += infoCard(
        SVG_WA_INFO,
        "WhatsApp",
        "<p>" + e(neg.whatsappDisplay) + "</p>" +
        '<a class="btn btn-whatsapp btn-sm" data-wa-link data-wa-msg="' + wa("", sitio) + '">Abrir chat</a>'
      );
    }

    var items = (b.ordenSocial || ["instagram", "tiktok", "facebook"]).map(function (key) {
      var r = redes[key];
      if (!r || !set(r.url)) return "";
      return (
        "<li><a href=\"" + hrefSeguro(r.url) + '" target="_blank" rel="noopener">' +
        (SOCIAL_SVG[key] || "") +
        "<span>" + e(r.etiqueta) + "</span></a></li>"
      );
    }).join("");

    if (items) {
      cards += infoCard(SOCIAL_SVG.instagram, "Seguinos", '<ul class="social-buttons">' + items + "</ul>");
    }

    if (set(neg.address) || set(neg.mapsQuery)) {
      var ubic = "";
      if (set(neg.address)) ubic += "<p>" + e(neg.address) + "</p>";
      if (set(neg.mapsQuery)) {
        ubic +=
          '<a class="btn btn-outline btn-sm" data-maps-link href="#" target="_blank" rel="noopener">' +
          SVG_MAPS_BTN + " " + e(b.botonMapsTexto) + "</a>";
      }
      cards += infoCard(SVG_MAPS_INFO, "Ubicación", ubic);
    }

    if (set(neg.hours)) {
      cards += infoCard(SVG_CLOCK, "Horarios", "<p>" + e(neg.hours) + "</p>");
    }
    if (set(neg.phone)) {
      cards += infoCard(SVG_PHONE, "Teléfono", "<p><span>" + e(neg.phone) + "</span></p>");
    }
    if (set(neg.email)) {
      cards += infoCard(SVG_EMAIL, "Email", '<p><a href="mailto:' + a(neg.email) + '">' + e(neg.email) + "</a></p>");
    }

    var cta = '<div class="contact-cta" data-reveal>';
    if (set(neg.whatsapp)) {
      cta +=
        '<a class="btn btn-whatsapp btn-lg" data-wa-link data-wa-msg="' + wa(b.botonWhatsapp && b.botonWhatsapp.mensaje, sitio) + '">' +
        SVG_WA_BTN + " " + e(b.botonWhatsapp && b.botonWhatsapp.texto) + "</a>";
    }
    if (set(neg.mapsQuery)) {
      cta +=
        '<a class="btn btn-outline btn-lg" data-maps-link href="#" target="_blank" rel="noopener">' +
        SVG_MAPS_BTN + " " + e(b.botonMapsTexto) + "</a>";
    }
    cta += "</div>";

    return (
      '<section class="section" id="' + a(b.id || "contacto") + '">' +
      '<div class="container">' + sectionHead(b) +
      '<div class="info-grid">' + cards + "</div>" +
      cta +
      "</div></section>"
    );
  }

  var BLOCKS = {
    hero: buildHero,
    categorias: buildCategorias,
    productos: buildProductos,
    imagenTexto: buildImagenTexto,
    contacto: buildContacto
  };

  function buildBlock(b, sitio) {
    if (!b || !b.tipo) return "";
    var fn = BLOCKS[b.tipo];
    if (!fn) {
      if (window.console) console.warn("Bloque sin renderizador:", b.tipo);
      return "";
    }
    return fn(b, sitio);
  }

  /* ------------------------------- Render ------------------------------ */
  function buildFab(sitio) {
    var neg = sitio.negocio || {};
    if (!set(neg.whatsapp)) return "";
    return (
      '<a class="whatsapp-fab" data-wa-link data-wa-msg="' + wa("", sitio) + '" aria-label="Consultar por WhatsApp">' +
      SVG_WA_FAB +
      "</a>"
    );
  }

  function renderSite(sitio, pagina) {
    var header = document.querySelector("#site-header .header-inner");
    if (header) header.innerHTML = buildHeader(sitio);

    var main = document.querySelector("main");
    if (main) {
      var secciones = (pagina && pagina.secciones) || [];
      /* Secciones marcadas como ocultas desde el panel no se muestran */
      var visibles = secciones.filter(function (b) { return !(b && b.oculto); });
      main.innerHTML = visibles.map(function (b) { return buildBlock(b, sitio); }).join("");
    }

    var footer = document.querySelector(".site-footer");
    if (footer) footer.innerHTML = buildFooter(sitio);

    var fab = document.getElementById("site-fab");
    if (fab) fab.innerHTML = buildFab(sitio);

    return true;
  }

  window.renderSite = renderSite;
})();
