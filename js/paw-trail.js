/* ==========================================================================
   La Boutique Cat & Dog — Caminos decorativos de huellas
   --------------------------------------------------------------------------
   Dibuja VARIOS tramos de huellas (perro / gato alternados), uno por
   sección VISIBLE, siguiendo el orden real de data/pagina.json y el lado
   que indica el campo "huella" de cada sección (izquierda / derecha;
   "ninguna" saltea esa sección; sin valor se intercala solo). Así, si el
   cliente reordena, agrega, oculta o duplica secciones desde el panel, el
   camino acompaña en lugar de quedar desalineado.
   En móvil (<640px) quedan solo el primer y el último tramo. Reglas:
   - Cada tramo vive dentro de su banda de sección (offsetTop/offsetHeight)
     y serpentea en la canaleta del borde de ventana correspondiente.
   - Y lineal dentro de la banda; la onda senoidal vive SOLO en X.
   - La canaleta se adapta al ancho de ventana: pantallas anchas serpentean
     con amplitud completa; angostas la senda se cierra contra el borde sin
     invadir texto, fotos ni botones.
   - Un solo <svg> cubre <main>: px reales (sin viewBox ni
     preserveAspectRatio), 1:1, z-index 0 por encima de los fondos de
     sección y por debajo del header. pointer-events: none + aria-hidden.
   - ES5 estricto, sin dependencias, sin animaciones ni rAF. Degradable.
   ========================================================================== */
(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var XLINK_NS = "http://www.w3.org/1999/xlink";
  var PAW_BLUE = "#315A9E";
  var SEED = 0xC0FFEE;        // patrón natural pero reproducible
  var ONDA_PX = 340;           // px de sección por onda completa (antes: cantidad fija → onda "estirada" en secciones largas)
  var ONDAS_MIN = 1.15;
  var ONDAS_MAX = 4.6;
  var AMPLITUDE_MAX = 55;     // px de amplitud del serpenteo (tope)
  var STEP_OFFSET_MAX = 14;    // px de zigzag por paso (vaivén de pisada)
  var STEP_JITTER = 8;         // ±4px de ruido por huella
  var STEP_SPACING = 56;       // px verticales aproximados entre huellas
  var CONTAINER_MAX = 1180;    // coincide con --container del CSS
  var DOBLE_PROB = 0.08;       // probabilidad de pisada doble (pausa del animal)

  /* Tabla clásica de respaldo (si nadie pasa pagina.json, p. ej. el
     main.js publicado todavía no lo hace). El orden y los lados reales
     salen del campo "huella" de cada sección. */
  var SEGS_FALLBACK = [
    { huella: "izquierda" },
    { huella: "derecha" },
    { huella: "derecha" },
    { huella: "izquierda" },
    { huella: "derecha" }
  ];
  var PAGINA_ACTUAL = null;

  /* Tramos según el contenido real: una sección visible = un tramo, con el
     lado que diga "huella" (izquierda/derecha); "ninguna" lo saltea; sin
     valor se intercala solo para no repetir lado. */
  function segmentosDesde(pagina) {
    var secciones = (pagina && pagina.secciones) || null;
    var fuente = secciones ? secciones.filter(function (s) { return s && !s.oculto; }) : null;
    var datos = fuente && fuente.length ? fuente : SEGS_FALLBACK;

    var segs = [];
    var ultimoLado = null;
    datos.forEach(function (sec) {
      var huella = sec.huella;
      var lado = null;
      if (huella === "izquierda") { lado = "L"; }
      else if (huella === "derecha") { lado = "R"; }
      else if (huella === "ninguna") { return; } /* esta sección no lleva */
      else { lado = ultimoLado === "L" ? "R" : "L"; } /* auto-intercalado */
      segs.push({ side: lado });
      ultimoLado = lado;
    });
    return segs;
  }

  /* PRNG determinista (mulberry32). */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function svgEl(name, attrs) {
    var el = document.createElementNS(SVG_NS, name);
    if (attrs) {
      for (var key in attrs) {
        if (attrs.hasOwnProperty(key)) { el.setAttribute(key, attrs[key]); }
      }
    }
    return el;
  }

  function n1(v) { return Math.round(v * 10) / 10; }

  /* Formas de huella REALES (tinta plana, como las de la etapa 4b):
     perro = 4 dedos en arco + almohadilla ancha;
     gato = dedos más finos y juntos + almohadilla con dos lóbulos traseros.
     El grupo está escalado y centrado en el origen para que la rotación
     gire sobre la almohadilla y la huella apunte en la dirección del avance. */
  function createDefs() {
    var defs = svgEl("defs");

    // Perro: 4 dedos en arco + almohadilla clásica (dos lóbulos arriba con
    // muesca al centro y base ancha redondeada) en lugar de una elipse plana.
    var dog = svgEl("g", { id: "pt-d", fill: PAW_BLUE });
    var dg = svgEl("g", { transform: "scale(0.36) translate(-32 -37)" });
    dg.appendChild(svgEl("ellipse", { cx: "15.5", cy: "30", rx: "4.9", ry: "6.3", transform: "rotate(-26 15.5 30)" }));
    dg.appendChild(svgEl("ellipse", { cx: "26", cy: "20", rx: "5", ry: "6.8", transform: "rotate(-9 26 20)" }));
    dg.appendChild(svgEl("ellipse", { cx: "38", cy: "20", rx: "5", ry: "6.8", transform: "rotate(9 38 20)" }));
    dg.appendChild(svgEl("ellipse", { cx: "48.5", cy: "30", rx: "4.9", ry: "6.3", transform: "rotate(26 48.5 30)" }));
    dg.appendChild(svgEl("path", {
      d: "M32 43C29.5 39 24 39.5 21 43.5C17 48.5 17.5 55.5 21.5 58.8C25 61.8 39 61.8 42.5 58.8C46.5 55.5 47 48.5 43 43.5C40 39.5 34.5 39 32 43Z"
    }));
    dog.appendChild(dg);
    defs.appendChild(dog);

    // Gato
    var cat = svgEl("g", { id: "pt-c", fill: PAW_BLUE });
    var cg = svgEl("g", { transform: "scale(0.34) translate(-32 -34)" });
    cg.appendChild(svgEl("ellipse", { cx: "15", cy: "27", rx: "4.6", ry: "5.8", transform: "rotate(-24 15 27)" }));
    cg.appendChild(svgEl("ellipse", { cx: "27", cy: "17", rx: "5.1", ry: "6.4", transform: "rotate(-8 27 17)" }));
    cg.appendChild(svgEl("ellipse", { cx: "39", cy: "17", rx: "5.1", ry: "6.4", transform: "rotate(8 39 17)" }));
    cg.appendChild(svgEl("ellipse", { cx: "51", cy: "27", rx: "4.6", ry: "5.8", transform: "rotate(24 51 27)" }));
    cg.appendChild(svgEl("path", {
      d: "M32 36C28 36 23.5 39.5 22 44.5C20.8 48.5 21.5 52.5 24 54.2C26.5 55.9 29 54.3 32 54.3C35 54.3 37.5 55.9 40 54.2C42.5 52.5 43.2 48.5 42 44.5C40.5 39.5 36 36 32 36Z"
    }));
    cat.appendChild(cg);
    defs.appendChild(cat);

    return defs;
  }

  function renderTrails(mainEl) {
    var prev = mainEl.querySelector("svg.paw-trails");
    if (prev) { mainEl.removeChild(prev); }

    var rect = mainEl.getBoundingClientRect();
    var mainW = Math.floor(Math.max(rect.width, mainEl.scrollWidth || 0, window.innerWidth || 0));
    var mainH = Math.floor(Math.max(rect.height, mainEl.scrollHeight || 0));
    if (mainW < 320) { mainW = 320; }
    if (mainH < 400) { mainH = 400; }

    var svg = svgEl("svg", {
      "class": "paw-trails",
      "aria-hidden": "true",
      focusable: "false"
    });
    // Sin viewBox ni preserveAspectRatio: px reales, 1:1 con <main>
    svg.setAttribute("width", mainW);
    svg.setAttribute("height", mainH);
    svg.appendChild(createDefs());

    var isMobile = mainW < 641;

    // Canaleta: el margen entre la ventana y el borde interior del
    // contenedor. Pantalla ancha = margen grande = swing completo; angosta
    // = senda fina pegada al borde, sin invadir contenido.
    var gutter = Math.max(2, (mainW - CONTAINER_MAX) / 2);
    var laneHalf = Math.max(2, gutter / 2 + 3);
    var baseX = 4 + laneHalf;
    var amplitudeX = Math.min(AMPLITUDE_MAX, Math.max(0, (laneHalf - 4) * 0.7));
    var stepOffset = Math.min(STEP_OFFSET_MAX, Math.max(1, (laneHalf - 4) * 0.35));

    var prng = mulberry32(SEED);
    var pawCount = 0;

    /* Tramos dinámicos: una sección visible = un tramo. El DOM de <main>
       saltea las ocultas, así que emparejamos por posición. */
    var segs = segmentosDesde(PAGINA_ACTUAL);
    var domSecs = mainEl.querySelectorAll(":scope > section");
    if (!domSecs.length) { domSecs = document.querySelectorAll("main > section"); }

    for (var s = 0; s < segs.length && s < domSecs.length; s++) {
      var seg = segs[s];
      /* En móvil solo el primer y el último tramo */
      if (isMobile && s !== 0 && s !== segs.length - 1) { continue; }

      var sec = domSecs[s];
      if (!sec) { continue; }

      var bandTop = sec.offsetTop;   // relativo a <main> (offsetParent)
      var bandH = sec.offsetHeight;
      if (bandH < 80) { continue; }

      var steps = Math.round(bandH / STEP_SPACING);
      if (steps < 8) { steps = 8; }
      if (steps > 26) { steps = 26; }

      /* Onda orgánica: la cantidad de ciclos sale de la ALTURA de la
        sección (una onda completa cada ~340 px), acotada. Secciones
        largas ondean más veces en vez de estirar la misma onda. */
      var waves = bandH / ONDA_PX;
      if (waves < ONDAS_MIN) { waves = ONDAS_MIN; }
      if (waves > ONDAS_MAX) { waves = ONDAS_MAX; }

      var ds = 1 / (steps - 1 || 1);
      var phase = (prng() * 2 - 1) * Math.PI; // fase distinta por tramo
      var isRight = seg.side === "R";

      for (var i = 0; i < steps; i++) {
        var t = i * ds;

        // Y estrictamente lineal dentro de la banda de su sección
        var yFinal = bandTop + t * bandH;

        // X: un solo carril — onda (solo en X) + zigzag de paso + jitter
        var sine = Math.sin(t * Math.PI * 2 * waves + phase);
        var paso = (i % 2 === 1) ? stepOffset : -stepOffset;
        var xLane = baseX + sine * amplitudeX + paso +
          (prng() - 0.5) * STEP_JITTER;
        var xFinal = isRight ? (mainW - xLane) : xLane;

        // Orientación: la huella SIEMPRE con los dedos hacia arriba, con
        // una inclinación suave que sigue la onda (clamp ±22°) + jitter
        // de pisada ±12°. Nunca boca abajo.
        var sine2 = Math.sin((t + ds) * Math.PI * 2 * waves + phase);
        var xS1 = baseX + sine * amplitudeX;
        var xS2 = baseX + sine2 * amplitudeX;
        var dxPx = isRight ? (xS1 - xS2) : (xS2 - xS1);
        var dyPx = bandH * ds;
        var lean = Math.atan2(dxPx, dyPx) * 180 / Math.PI;
        if (lean > 22) { lean = 22; } else if (lean < -22) { lean = -22; }
        var angleFinal = lean + (prng() - 0.5) * 24;

        // Fade de extremos SOLO en opacidad: cada tramo nace y muere
        // invisible sin encoger las huellas (nada de huellas diminutas).
        var edgeFade = t < 0.06 ? (t / 0.06)
          : (t > 0.94 ? ((1 - t) / 0.06) : 1);
        /* Tamaño con variación marcada (0.8–1.25): natural, no uniforme */
        var pawScale = 0.8 + prng() * 0.45;
        var pawOpacity = (0.4 + prng() * 0.2) * edgeFade;  // 0–0.60
        if (pawOpacity < 0.05) { continue; }

        // Solo perro y gato, alternados en toda la página
        var href = (pawCount % 2 === 0) ? "#pt-d" : "#pt-c";
        pawCount++;

        var transform = "translate(" + n1(xFinal) + " " + n1(yFinal) +
          ") rotate(" + n1(angleFinal) + ") scale(" + pawScale.toFixed(3) + ")";
        var use = svgEl("use", {
          transform: transform,
          opacity: pawOpacity.toFixed(3),
          href: href
        });
        use.setAttributeNS(XLINK_NS, "xlink:href", href);
        svg.appendChild(use);

        /* Pisada doble ocasional (misma mascota): el animal apoyó las dos
           patas al frenar — igual lado de la canaleta, desplazada y con
           su propia inclinación. Suma vida sin ensuciar. */
        if (prng() < DOBLE_PROB) {
          var gemelaX = xLane + (prng() - 0.5) * 26 + (isRight ? 12 : -12);
          var gemelaFinalX = isRight ? (mainW - gemelaX) : gemelaX;
          var gemelaTransform = "translate(" + n1(gemelaFinalX) + " " +
            n1(yFinal + (prng() - 0.5) * 6) +
            ") rotate(" + n1(angleFinal + (prng() - 0.5) * 26) +
            ") scale(" + (pawScale * 0.86).toFixed(3) + ")";
          var gemela = svgEl("use", {
            transform: gemelaTransform,
            opacity: (pawOpacity * 0.75).toFixed(3),
            href: href
          });
          gemela.setAttributeNS(XLINK_NS, "xlink:href", href);
          svg.appendChild(gemela);
        }
      }
    }

    mainEl.appendChild(svg);
  }

  function init() {
    var mainEl = document.querySelector("main");
    if (!mainEl) { return; }
    renderTrails(mainEl);

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      if (resizeTimer) { window.clearTimeout(resizeTimer); }
      resizeTimer = window.setTimeout(function () {
        renderTrails(mainEl);
      }, 250);
    });
  }

  /* El contenido se renderiza de forma asíncrona desde data/*.json:
      main.js vuelve a dibujar las huellas cuando termina el render, pasando
      pagina.json para que los tramos sigan el orden y el campo "huella"
      reales. Sin argumento, usa la última recibida (o la tabla clásica). */
  window.renderPawTrails = function (pagina) {
    if (pagina && pagina.secciones) { PAGINA_ACTUAL = pagina; }
    var mainEl = document.querySelector("main");
    if (mainEl) { renderTrails(mainEl); }
  };

  try {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  } catch (err) {
    /* Degradable: sin caminos de huellas la página funciona igual. */
  }
})();
