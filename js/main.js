/* ==========================================================================
   La Boutique Cat & Dog — Interacciones del sitio
   Menú móvil, carrusel de portada, enlaces de WhatsApp/Maps, visibilidad de
   datos configurables y animaciones de aparición.
   ========================================================================== */
(function () {
  "use strict";

  var config = window.SITE_CONFIG || {};

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

  /* ------------------------------- Init --------------------------------- */
  function init() {
    try {
      setupVisibility();
      setupWhatsAppLinks();
      setupMapsLinks();
      setupConfigFields();
      setupYear();
      setupCarousels();
      setupMobileMenu();
      setupHeaderScroll();
      setupScrollSpy();
      setupReveal();
    } catch (error) {
      /* Nunca dejar contenido oculto por un error de JS */
      document.documentElement.classList.remove("js");
      if (window.console) console.error("Error al iniciar el sitio:", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
