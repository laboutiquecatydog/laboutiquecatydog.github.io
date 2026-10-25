/* ==========================================================================
   La Boutique Cat & Dog — Interacciones del sitio
   Menú móvil, carrusel de portada, enlaces de WhatsApp/Maps, visibilidad de
   datos configurables y animaciones de aparición.
   ========================================================================== */
(function () {
  "use strict";

  var config = {};

  function isConfigured(value) {
    return typeof value === "string" && value.trim() !== "";
  }

  /* ---------------------- WhatsApp y Google Maps ------------------------ */
  function buildWhatsAppUrl(message) {
    var number = String(config.whatsapp || "").replace(/[^0-9]/g, "");
    var text = encodeURIComponent(message || config.whatsappDefaultMessage || "");
    return "https://wa.me/" + number + "?text=" + text;
  }

  function setupWhatsAppLinks() {
    if (!isConfigured(config.whatsapp)) return;
    var links = document.querySelectorAll("[data-wa-link]");
    Array.prototype.forEach.call(links, function (el) {
      el.setAttribute("href", buildWhatsAppUrl(el.getAttribute("data-wa-msg")));
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener");
    });
  }

  function setupMapsLinks() {
    if (!isConfigured(config.mapsQuery)) return;
    var links = document.querySelectorAll("[data-maps-link]");
    Array.prototype.forEach.call(links, function (el) {
      el.setAttribute(
        "href",
        "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(config.mapsQuery)
      );
    });
  }

  /* ------------- Visibilidad según datos cargados en config.js ---------- */
  /* [data-if="clave"]      -> visible solo si esa clave tiene valor.
     [data-if-any="a,b"]    -> visible si al menos una clave tiene valor. */
  function setupVisibility() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-if]"), function (el) {
      el.hidden = !isConfigured(config[el.getAttribute("data-if")]);
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-if-any]"), function (el) {
      var keys = el.getAttribute("data-if-any").split(",");
      var any = keys.some(function (k) { return isConfigured(config[k.trim()]); });
      el.hidden = !any;
    });

    if (!isConfigured(config.whatsapp)) {
      Array.prototype.forEach.call(document.querySelectorAll("[data-wa-link]"), function (el) {
        el.hidden = true;
      });
    }
    Array.prototype.forEach.call(document.querySelectorAll("[data-maps-link]"), function (el) {
      el.hidden = !isConfigured(config.mapsQuery);
    });
  }

  /* ---------------- Campos de texto / enlaces configurables ------------- */
  function setupConfigFields() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-config]"), function (el) {
      var key = el.getAttribute("data-config");
      var value = config[key];
      if (!isConfigured(value)) return;

      var isLink = el.tagName === "A";
      var hasIcon = !!el.querySelector("svg");

      if (isLink) {
        el.setAttribute("href", key === "email" ? "mailto:" + value : value);
      }
      /* No pisar el texto interno de enlaces con íconos (redes sociales) */
      if (!hasIcon) {
        el.textContent = value;
      }
    });
  }

  /* ------------------------------ Año ----------------------------------- */
  function setupYear() {
    var nodes = document.querySelectorAll("[data-year]");
    var year = String(new Date().getFullYear());
    Array.prototype.forEach.call(nodes, function (el) { el.textContent = year; });
  }

  /* --------------------------- Carruseles ------------------------------- */
  /* Un mismo componente para la portada y para cada categoría de productos.
     La portada lleva el atributo [data-autoplay] y cambia sola cada
     config.carouselDelay ms (3 s). El resto se maneja con flechas, indicadores
     y teclado. Respeta "prefers-reduced-motion" y reinicia el temporizador
     tras una interacción manual. */
  function setupCarousels() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-carousel]"), initCarousel);
  }

  function initCarousel(root) {
    var slides = Array.prototype.slice.call(root.querySelectorAll("[data-slide]"));
    var dotsWrap = root.querySelector("[data-carousel-dots]");
    var prevBtn = root.querySelector("[data-carousel-prev]");
    var nextBtn = root.querySelector("[data-carousel-next]");
    if (!slides.length) return;

    var autoplay = root.hasAttribute("data-autoplay");

    slides.forEach(function (slide) {
      var img = slide.tagName === "IMG" ? slide : slide.querySelector("img");
      if (img) {
        img.addEventListener("error", function () { slide.classList.add("is-error"); });
      }
    });

    if (slides.length < 2) {
      slides[0].classList.add("is-active");
      if (prevBtn) prevBtn.hidden = true;
      if (nextBtn) nextBtn.hidden = true;
      return;
    }

    var reduce = false;
    try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
    var delay = (typeof config.carouselDelay === "number" && config.carouselDelay > 0)
      ? config.carouselDelay : 3000;

    var index = 0;
    var timer = null;
    var dots = [];

    if (dotsWrap) {
      slides.forEach(function (slide, i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel-dot";
        dot.setAttribute("aria-label", "Ir a la foto " + (i + 1) + " de " + slides.length);
        dot.addEventListener("click", function () { goTo(i, true); });
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    function render() {
      slides.forEach(function (slide, i) {
        var active = i === index;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", active ? "false" : "true");
      });
      dots.forEach(function (dot, i) {
        var active = i === index;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-current", active ? "true" : "false");
      });
    }

    function stop() {
      if (timer) { window.clearInterval(timer); timer = null; }
    }

    function start() {
      if (!autoplay || reduce) return;
      stop();
      timer = window.setInterval(function () { step(1); }, delay);
    }

    function goTo(i, user) {
      index = (i % slides.length + slides.length) % slides.length;
      render();
      if (user) start();
    }

    function step(delta) { goTo(index + delta, false); }

    if (nextBtn) nextBtn.addEventListener("click", function () { goTo(index + 1, true); });
    if (prevBtn) prevBtn.addEventListener("click", function () { goTo(index - 1, true); });

    root.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") { goTo(index - 1, true); }
      else if (event.key === "ArrowRight") { goTo(index + 1, true); }
    });

    /* Deslizar con el dedo (pantallas táctiles).
       Solo se activa con gestos claramente horizontales, para no
       interferir con el scroll vertical de la página. */
    var touchX = 0, touchY = 0, tracking = false;
    root.addEventListener("touchstart", function (event) {
      if (event.touches.length !== 1) return;
      touchX = event.touches[0].clientX;
      touchY = event.touches[0].clientY;
      tracking = true;
      stop();
    }, { passive: true });

    root.addEventListener("touchend", function (event) {
      if (!tracking) return;
      tracking = false;
      var touch = event.changedTouches[0];
      var dx = touch.clientX - touchX;
      var dy = touch.clientY - touchY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        goTo(dx < 0 ? index + 1 : index - 1, true);
      } else {
        start();
      }
    }, { passive: true });

    root.addEventListener("touchcancel", function () { tracking = false; start(); }, { passive: true });

    if (autoplay) {
      root.addEventListener("mouseenter", stop);
      root.addEventListener("mouseleave", start);
      root.addEventListener("focusin", stop);
      root.addEventListener("focusout", start);

      document.addEventListener("visibilitychange", function () {
        if (document.hidden) stop(); else start();
      });
    }

    render();
    start();
  }

  /* --------------------------- Menú móvil ------------------------------- */
  function setupMobileMenu() {
    var toggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("main-nav");
    var overlay = document.getElementById("nav-overlay");
    if (!toggle || !nav) return;

    function close() {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menú de navegación");
      document.body.style.overflow = "";
      if (overlay) {
        overlay.classList.remove("is-visible");
        window.setTimeout(function () { overlay.hidden = true; }, 300);
      }
    }

    function open() {
      nav.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Cerrar menú de navegación");
      document.body.style.overflow = "hidden";
      if (overlay) {
        overlay.hidden = false;
        window.requestAnimationFrame(function () { overlay.classList.add("is-visible"); });
      }
    }

    toggle.addEventListener("click", function () {
      if (nav.classList.contains("is-open")) close();
      else open();
    });

    if (overlay) overlay.addEventListener("click", close);

    Array.prototype.forEach.call(nav.querySelectorAll("a"), function (link) {
      link.addEventListener("click", close);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") close();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) close();
    });
  }

  /* --------------------- Header con sombra al scrollear ---------------- */
  function setupHeaderScroll() {
    var header = document.getElementById("site-header");
    if (!header) return;
    function update() {
      header.classList.toggle("is-scrolled", window.scrollY > 10);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ------------------- Enlace activo según la sección ------------------- */
  function setupScrollSpy() {
    var links = document.querySelectorAll(".nav-link");
    if (!links.length || !("IntersectionObserver" in window)) return;

    var map = {};
    Array.prototype.forEach.call(links, function (link) {
      var id = link.getAttribute("href");
      if (id && id.charAt(0) === "#") map[id.slice(1)] = link;
    });

    var sections = Object.keys(map)
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        Array.prototype.forEach.call(links, function (l) { l.classList.remove("is-active"); });
        if (map[entry.target.id]) map[entry.target.id].classList.add("is-active");
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

    sections.forEach(function (section) { observer.observe(section); });
  }

  /* ----------------------- Filtros de productos ------------------------- */
  /* Botonera Todos / Perros / Gatos. Clasifica cada tarjeta por su atributo
     [data-pet] (uno o varios valores separados por espacios: "perro gato").
     Los productos compartidos se muestran en ambas categorías. Si no hay
     markup de filtros, no hace nada (degradable). */
  function setupProductFilters() {
    var bar = document.querySelector("[data-product-filters]");
    if (!bar) return;

    var chips = Array.prototype.slice.call(bar.querySelectorAll("[data-filter]"));
    var cards = Array.prototype.slice.call(document.querySelectorAll(".product-card[data-pet]"));
    if (!chips.length || !cards.length) return;

    function apply(filter) {
      Array.prototype.forEach.call(chips, function (chip) {
        var active = chip.getAttribute("data-filter") === filter;
        chip.classList.toggle("is-active", active);
        chip.setAttribute("aria-pressed", active ? "true" : "false");
      });
      Array.prototype.forEach.call(cards, function (card) {
        var pets = (card.getAttribute("data-pet") || "").split(/\s+/);
        var show = filter === "all" || pets.indexOf(filter) !== -1;
        card.hidden = !show;
        /* Si la tarjeta vuelve a mostrarse, asegurar su animación de
           aparición (pudo quedar sin observar mientras estaba oculta). */
        if (show) card.classList.add("in-view");
      });
      /* El filtro cambia el catálogo visible: rearmar la paginación
         desde la primera página. */
      repaginarTodo();
    }

    Array.prototype.forEach.call(chips, function (chip, i) {
      chip.addEventListener("click", function () {
        apply(chip.getAttribute("data-filter"));
      });
      chip.addEventListener("keydown", function (event) {
        var dir = event.key === "ArrowRight" ? 1 : (event.key === "ArrowLeft" ? -1 : 0);
        if (!dir) return;
        event.preventDefault();
        var next = chips[(i + dir + chips.length) % chips.length];
        next.focus();
        apply(next.getAttribute("data-filter"));
      });
    });

    apply("all");
  }

  /* ---------------- Paginación del catálogo ------------------------------- */
  /* Bloques de 6 productos por página con flechas y números que se generan
     solos a medida que crece el catálogo. Pagina sobre los productos que el
     filtro deja visibles. Sin JS (o con ≤6 productos) no cambia nada. */
  var POR_PAGINA = 6;

  function repaginarTodo() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-product-pagination]"), function (z) {
      if (z.__bqIr) { z.__bqIr(1); }
    });
  }

  function setupProductPagination() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-product-pagination]"), function (zona) {
      var seccion = zona.closest ? (zona.closest("section") || document) : document;
      var grid = seccion.querySelector(".product-grid");
      if (!grid) return;

      var pagina = 1;

      function visibles() {
        return Array.prototype.filter.call(grid.querySelectorAll(".product-card"), function (c) {
          return !c.hidden;
        });
      }
      function totalPaginas() {
        return Math.max(1, Math.ceil(visibles().length / POR_PAGINA));
      }

      function boton(cls, texto, etiqueta, alClic, deshabilitado) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = cls;
        b.textContent = texto;
        if (etiqueta) { b.setAttribute("aria-label", etiqueta); }
        if (deshabilitado) { b.disabled = true; }
        b.addEventListener("click", alClic);
        return b;
      }

      function pintar() {
        var lista = visibles();
        var total = totalPaginas();

        Array.prototype.forEach.call(lista, function (card, i) {
          var paginaDeCard = Math.floor(i / POR_PAGINA) + 1;
          var mostrar = paginaDeCard === pagina;
          card.classList.toggle("fuera-de-pagina", !mostrar);
          if (mostrar) { card.classList.add("in-view"); }
        });

        if (total <= 1) {
          zona.hidden = true;
          zona.innerHTML = "";
          return;
        }

        zona.hidden = false;
        zona.innerHTML = "";

        zona.appendChild(boton("pp-btn", "‹", "Página anterior", function () { ir(pagina - 1); }, pagina === 1));

        /* Ventana de números: como máximo 7 botones, con «…» si hace falta */
        var desde = Math.max(1, pagina - 3);
        var hasta = Math.min(total, desde + 6);
        desde = Math.max(1, hasta - 6);

        if (desde > 1) {
          zona.appendChild(boton("pp-num", "1", "Página 1", function () { ir(1); }));
          var sep1 = document.createElement("span");
          sep1.className = "pp-sep";
          sep1.textContent = "…";
          zona.appendChild(sep1);
        }
        for (var n = desde; n <= hasta; n++) {
          (function (n) {
            zona.appendChild(boton(
              "pp-num" + (n === pagina ? " is-activa" : ""),
              String(n),
              "Página " + n,
              function () { ir(n); }
            ));
          })(n);
        }
        if (hasta < total) {
          var sep2 = document.createElement("span");
          sep2.className = "pp-sep";
          sep2.textContent = "…";
          zona.appendChild(sep2);
          zona.appendChild(boton("pp-num", String(total), "Página " + total, function () { ir(total); }));
        }

        zona.appendChild(boton("pp-btn", "›", "Página siguiente", function () { ir(pagina + 1); }, pagina === total));

        var info = document.createElement("span");
        info.className = "pp-info";
        info.setAttribute("aria-live", "polite");
        info.textContent = "Página " + pagina + " de " + total;
        zona.appendChild(info);
      }

      function ir(n) {
        var total = totalPaginas();
        pagina = Math.min(Math.max(1, n), total);
        pintar();
      }

      zona.__bqIr = ir;
      pintar();
    });
  }

  /* --------------------- Animaciones de aparición ----------------------- */
  function setupReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    function revealAll() {
      Array.prototype.forEach.call(items, function (el) { el.classList.add("in-view"); });
    }

    if (!("IntersectionObserver" in window)) { revealAll(); return; }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    Array.prototype.forEach.call(items, function (el) { observer.observe(el); });

    /* Red de seguridad: si algo falla, mostrar todo a los 1.6 s */
    window.setTimeout(revealAll, 1600);
  }

  /* --------------------- Secuencia de entrada (hero) -------------------- */
  /* El tÃtulo se escribe progresivamente y luego se revelan subtÃtulo y
     botones en cascada (controlados por CSS con .is-entered y --i).
     El texto real SIEMPRE estÃ¡ en el DOM: el efecto solo lo redibuja.
     Se respeta prefers-reduced-motion y, sin JS, todo se ve directamente. */
  function setupIntro() {
    var hero = document.querySelector(".hero.intro");
    if (!hero) return;

    var reduce = false;
    try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

    /* Mostrar el bloque (subtítulo, botones, imagen) siempre. */
    function enter() { hero.classList.add("is-entered"); }

    var title = hero.querySelector(".hero-title[data-type]");
    if (!title || reduce) { enter(); return; }

    /* El contenido acompaña a la escritura: aparece en paralelo con una
       entrada suave y escalonada, en vez de esperar al final del título.
       La página se siente lista en menos de un segundo. */
    window.setTimeout(enter, 90);

    /* El título puede tener marcado (**acento**). Se reconstruye como
       secuencia de nodos de texto repetibles respetando los <span>. */
    var caret = document.createElement("span");
    caret.className = "type-caret";
    caret.setAttribute("aria-hidden", "true");

    var steps = [];
    Array.prototype.forEach.call(title.childNodes, function (node) {
      var text = node.nodeType === 3 ? node.nodeValue : null;
      if (text != null) {
        steps.push({ parent: title, anchor: node, text: text });
      } else if (node.nodeType === 1) {
        steps.push({ parent: node, el: node, text: node.textContent || "" });
      }
    });

    /* Vaciar el texto conservando los contenedores, listo para reescribir. */
    steps.forEach(function (step) {
      if (step.anchor) { step.anchor.nodeValue = ""; }
      else if (step.el) { step.el.textContent = ""; }
    });
    var si = 0, ci = 0;
    var halted = false;
    /* Ritmo ágil: ~19 ms por carácter (antes 28), con arranque rápido. */
    var SPEED = 19;

    function placeCaret() {
      var step = steps[si];
      if (step && step.el) { step.el.appendChild(caret); }
      else { title.appendChild(caret); }
    }

    function tick() {
      /* halted: el watchdog ya resolvió la secuencia; no seguir escribiendo. */
      if (halted) return;
      if (si >= steps.length) {
        title.classList.add("is-typed");
        if (caret.parentNode) { caret.parentNode.removeChild(caret); }
        enter();
        return;
      }
      var step = steps[si];
      var full = step.text;
      var done = false;
      ci += 1;
      var slice = full.slice(0, ci);
      if (step.anchor) { step.anchor.nodeValue = slice; }
      else if (step.el) { step.el.textContent = slice; }

      if (ci >= full.length) { si += 1; ci = 0; done = true; }
      placeCaret();
      /* Pausa algo mayor al cerrar un segmento (**negrita**), casi nula
         entre caracteres: ritmo de escritura natural. */
      window.setTimeout(tick, done ? SPEED * 3 : SPEED);
    }

    /* Arranque rápido: la escritura empieza apenas se acomoda la página. */
    placeCaret();
    window.setTimeout(tick, 120);

    /* Red de seguridad de la secuencia completa: si la escritura no terminÃ³
       (pestaÃ±a en segundo plano, temporizadores limitados, cualquier fallo),
       a los 6 s se muestra el tÃtulo completo, se retira el cursor y se
       revela el resto del hero. Nunca deja botones invisibles esperando. */
    window.setTimeout(function () {
      if (!title.classList.contains("is-typed")) {
        halted = true;
        title.classList.add("is-typed");
        Array.prototype.forEach.call(steps, function (step) {
          if (step.anchor) { step.anchor.nodeValue = step.text; }
          else if (step.el) { step.el.textContent = step.text; }
        });
        if (caret.parentNode) { caret.parentNode.removeChild(caret); }
      }
      enter();
    }, 6000);
  }

  /* ------------------- Acceso discreto al panel -------------------------- */
  /* Tres clics seguidos en el logo (1,4 s) abren el panel de administración.
     Es solo un atajo discreto: el login con GitHub sigue siendo obligatorio
     y /admin/ está excluido de los buscadores. Desactivado si la página
     está embebida (la vista previa del editor). */
  function setupAccesoPanel() {
    var brand = document.querySelector(".brand");
    if (!brand || window.top !== window.self) { return; }
    var clicks = 0;
    var timer = null;
    brand.addEventListener("click", function () {
      clicks += 1;
      if (timer) { window.clearTimeout(timer); }
      if (clicks >= 3) {
        clicks = 0;
        window.location.href = "/admin/editor.html";
        return;
      }
      timer = window.setTimeout(function () { clicks = 0; }, 1400);
    });
  }

  /* ------------------------ Progreso de scroll -------------------------- */
  /* Barra fina de marca en el borde superior. Detalle funcional, sin costo. */
  function setupScrollProgress() {
    if (document.querySelector(".scroll-progress")) return;
    var bar = document.createElement("div");
    bar.className = "scroll-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);

    var ticking = false;
    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      var ratio = max > 0 ? (doc.scrollTop || window.pageYOffset) / max : 0;
      if (ratio < 0) ratio = 0; else if (ratio > 1) ratio = 1;
      bar.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
      ticking = false;
    }
    function onScroll() {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
  }

  /* ------------------------------- Datos -------------------------------- */
  /* Traduce data/sitio.json al formato que ya consumen las funciones de
     arriba, para no duplicar la lógica de WhatsApp / Maps / visibilidad. */
  function setConfig(sitio) {
    var neg = (sitio && sitio.negocio) || {};
    var redes = (sitio && sitio.redes) || {};
    function url(key) { return redes[key] && redes[key].url; }

    config = {
      whatsapp: neg.whatsapp,
      whatsappDisplay: neg.whatsappDisplay,
      whatsappDefaultMessage: neg.whatsappMensaje,
      phone: neg.phone,
      email: neg.email,
      address: neg.address,
      hours: neg.hours,
      mapsQuery: neg.mapsQuery,
      carouselDelay: neg.carouselDelay,
      instagram: url("instagram"),
      tiktok: url("tiktok"),
      facebook: url("facebook")
    };
    window.SITE_CONFIG = config;
  }

  /* ---------------------- Metadatos y SEO dinÃ¡micos --------------------- */
  /* Mantiene <title>, description y Open Graph sincronizados con
     data/sitio.json (evita que queden desactualizados). El <head> conserva
     valores estÃ¡ticos de respaldo para buscadores que no ejecutan JS. */
  function setMeta(selector, attr, value) {
    if (!isConfigured(value)) return;
    var el = document.querySelector(selector);
    if (el) el.setAttribute(attr, value);
  }

  function updateSEO(sitio) {
    var m = (sitio && sitio.marca) || {};
    var neg = (sitio && sitio.negocio) || {};
    var seo = (sitio && sitio.seo) || {};
    var nombre = ((m.nombre || "") + " " + (m.nombreSecundario || "")).trim();
    if (!nombre) nombre = "La Boutique Cat & Dog";

    /* Título y descripción: editables desde el panel (sitio.seo), con
       valores locales por defecto. Se recomienda título ≤ 60 caracteres
       y descripción ≤ 155 para que Google no los corte. */
    var title = isConfigured(seo.titulo)
      ? String(seo.titulo)
      : nombre + " | Tienda de mascotas en Salta";
    var descripcion = isConfigured(seo.descripcion)
      ? String(seo.descripcion)
      : "Alimento, accesorios y productos de cuidado para perros y gatos en Salta. " +
        "Consultanos por WhatsApp las marcas y la disponibilidad en el local.";

    document.title = title;
    setMeta('meta[name="description"]', "content", descripcion);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", descripcion);
    setMeta('meta[property="og:site_name"]', "content", nombre);
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", descripcion);
    setMeta('meta[name="author"]', "content", nombre);

    /* Datos estructurados (SEO local): se regeneran con los datos reales.
       Las URLs van absolutas (los rastreadores las prefieren) y los
       horarios se leen de negocio.hours, no hardcodeados. */
    var ld = document.querySelector('script[type="application/ld+json"]');
    if (ld && isConfigured(neg.whatsapp)) {
      try {
        var origen = location.origin;
        var redes = (sitio && sitio.redes) || {};
        var sameAs = ["instagram", "tiktok", "facebook"]
          .map(function (k) { return redes[k] && redes[k].url; })
          .filter(isConfigured);

        /* Horarios: "Lun a Sáb de 10:00 a 13:00" → días + apertura/cierre.
           Tolerante a variaciones; si no puede leerlos, usa el clásico
           Lun-Sáb 10:00-13:00 del local. */
        var dias = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        var abre = "10:00";
        var cierra = "13:00";
        var horasTexto = String(neg.hours || "");
        var mAbre = horasTexto.match(/(\d{1,2}:\d{2})\s*(?:a|-|a las|hasta)\s*(\d{1,2}:\d{2})/i);
        if (mAbre) {
          abre = mAbre[1].length === 4 ? "0" + mAbre[1] : mAbre[1];
          cierra = mAbre[2].length === 4 ? "0" + mAbre[2] : mAbre[2];
        }

        var data = {
          "@context": "https://schema.org",
          "@type": "PetStore",
          "@id": origen + "/#negocio",
          name: nombre,
          description: descripcion,
          url: origen + "/",
          logo: origen + "/" + String(m.logo || "assets/img/logo.png"),
          image: origen + "/assets/img/og-image.jpg",
          priceRange: "$",
          telephone: "+" + String(neg.whatsapp).replace(/[^0-9]/g, ""),
          email: neg.email,
          address: {
            "@type": "PostalAddress",
            streetAddress: neg.address,
            addressLocality: "Salta",
            addressRegion: "Salta",
            addressCountry: "AR"
          },
          openingHoursSpecification: [{
            "@type": "OpeningHoursSpecification",
            dayOfWeek: dias,
            opens: abre,
            closes: cierra
          }],
          sameAs: sameAs
        };
        if (isConfigured(neg.mapsQuery)) {
          var parts = String(neg.mapsQuery).split(",");
          var lat = parseFloat(parts[0]), lng = parseFloat(parts[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            data.geo = { "@type": "GeoCoordinates", latitude: lat, longitude: lng };
            data.hasMap = "https://www.google.com/maps/search/?api=1&query=" +
              encodeURIComponent(neg.mapsQuery);
          }
        }
        ld.textContent = JSON.stringify(data);
      } catch (e) { /* SEO nunca debe romper el sitio */ }
    }
  }

  function loadJSON(path) {
    return fetch(path, { cache: "no-store" }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status + " al cargar " + path);
      return res.json();
    });
  }

  /* ------------------------------- Init --------------------------------- */
  function startup() {
    try {
      setupVisibility();
      setupWhatsAppLinks();
      setupMapsLinks();
      setupConfigFields();
      setupYear();
    setupCarousels();
    setupProductFilters();
    setupProductPagination();
    setupAccesoPanel();
      setupMobileMenu();
      setupHeaderScroll();
      setupScrollSpy();
      setupReveal();
      setupIntro();
      setupScrollProgress();
    } catch (error) {
      /* Nunca dejar contenido oculto por un error de JS */
      document.documentElement.classList.remove("js");
      if (window.console) console.error("Error al iniciar el sitio:", error);
    }
  }

  function showLoadError(error) {
    document.documentElement.classList.remove("js");
    if (window.console) console.error("No se pudo cargar el contenido del sitio:", error);
    var main = document.querySelector("main");
    if (!main || main.innerHTML.trim() !== "") return;
    main.innerHTML =
      '<section class="section"><div class="container">' +
      "<h2>No se pudo cargar el contenido</h2>" +
      "<p>Este sitio carga sus datos desde archivos JSON y necesita abrirse desde un servidor web. " +
      "Si lo estás viendo de forma local, iniciá un servidor (por ejemplo <code>python -m http.server</code>) " +
      "y volvé a cargar la página.</p></div></section>";
  }

  /* 1) cargar datos  2) renderizar  3) iniciar interacciones  4) huellas */
  function boot() {
    Promise.all([loadJSON("data/sitio.json"), loadJSON("data/pagina.json")])
      .then(function (res) {
        setConfig(res[0]);
        updateSEO(res[0]);
        if (typeof window.renderSite === "function") {
          window.renderSite(res[0], res[1]);
        }
        startup();
      })
      .catch(showLoadError);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  /* Gancho para el panel visual (/admin/editor.html): permite re-renderizar
     la vista previa con los datos en edición y re-iniciar las interacciones
     (carruseles, reveal, menú, filtros). En el sitio público nadie lo
     llama; es inocuo. */
  window.BQPreview = {
    renderizar: function (sitio, pagina) {
      try {
        if (typeof window.renderSite === "function") {
          window.renderSite(sitio, pagina);
        }
        this.reiniciar();
      } catch (e) {
        if (window.console) { console.warn("BQPreview.renderizar:", e); }
      }
    },
    reiniciar: function () {
      try {
        setupVisibility();
        setupConfigFields();
        setupYear();
        setupWhatsAppLinks();
        setupMapsLinks();
        setupMobileMenu();
        setupCarousels();
        setupReveal();
        setupProductFilters();
        setupProductPagination();
        setupScrollSpy();
        setupScrollProgress();
        /* Sin typewriter en la vista previa: mostrar el hero completo */
        var hero = document.querySelector(".hero.intro");
        if (hero) {
          hero.classList.add("is-entered");
          var t = hero.querySelector(".hero-title[data-type]");
          if (t) { t.classList.add("is-typed"); }
        }
      } catch (e) {
        if (window.console) { console.warn("BQPreview.reiniciar:", e); }
      }
    }
  };
})();

