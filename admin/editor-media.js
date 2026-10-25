/* ==========================================================================
   La Boutique Cat & Dog — Motor de imágenes del editor (W3)
   --------------------------------------------------------------------------
   Selector de imágenes con dos orígenes:
   - Galería: las imágenes que ya viven en assets/img/ del repositorio
     (vía API de GitHub, funciona también con el repo privado).
   - Subida: archivo de la PC → canvas lo optimiza (JPEG 82 %, máximo
     1600 px de ancho + variante -900 cuando el campo la necesita) y lo
     sube con la API de Git Data en UN solo commit por imagen.
   El logo mantiene PNG (transparencia) con máximo 600 px.
   Al elegir, devuelve { imagen, srcset?, ancho, alto } y quien llamó
   decide en qué campo del modelo se aplica.
   ========================================================================== */
(function () {
  "use strict";

  var REPO = "laboutiquecatydog/laboutiquecatydog.github.io";
  var BRANCH = "main";
  var API = "https://api.github.com";
  var CARPETA = "assets/img";
  var CLAVE_TOKEN = "BQ_TOKEN";

  var EXTENSIONES = ["jpg", "jpeg", "png", "webp", "svg"];
  var TAMANO_MAX = 8 * 1024 * 1024;

  /* Estado del selector abierto */
  var ACTUAL = null;          /* configuración de la llamada en curso */
  var listaGaleria = null;     /* [{name, path, size}] */
  var miniaturas = {};         /* path -> objectURL */
  var pendiente = null;        /* archivo procesado listo para subir */

  /* ----------------------------- Base API ------------------------------- */
  function token() { return sessionStorage.getItem(CLAVE_TOKEN) || ""; }

  function apiFetch(ruta, opciones) {
    var ini = opciones || {};
    var cabeceras = {
      Authorization: "Bearer " + token(),
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    };
    Object.keys(ini.headers || {}).forEach(function (k) { cabeceras[k] = ini.headers[k]; });
    return fetch(API + ruta, { method: ini.method || "GET", headers: cabeceras, body: ini.body });
  }

  function alFallar(res) {
    if (res.status === 401) { throw new Error("La sesión venció: volvé a iniciar sesión."); }
    if (res.status === 409 || res.status === 422) { throw new Error("El repositorio cambió mientras subías (reintentá)."); }
    throw new Error("HTTP " + res.status + " al hablar con GitHub");
  }

  /* ----------------------------- Galería -------------------------------- */
  function listarGaleria() {
    if (listaGaleria) { return Promise.resolve(listaGaleria); }
    return apiFetch("/repos/" + REPO + "/contents/" + CARPETA + "?ref=" + BRANCH)
      .then(function (res) { if (!res.ok) { alFallar(res); } return res.json(); })
      .then(function (items) {
        listaGaleria = (Array.isArray(items) ? items : [])
          .filter(function (it) { return it.type === "file"; })
          .filter(function (it) {
            var ext = (it.name.split(".").pop() || "").toLowerCase();
            return EXTENSIONES.indexOf(ext) !== -1 && (it.size || 0) < TAMANO_MAX;
          })
          .map(function (it) { return { name: it.name, path: it.path, size: it.size }; });
        return listaGaleria;
      });
  }

  function miniaturaDe(item) {
    if (miniaturas[item.path]) { return Promise.resolve(miniaturas[item.path]); }
    return apiFetch("/repos/" + REPO + "/contents/" + item.path + "?ref=" + BRANCH,
      { headers: { Accept: "application/vnd.github.raw" } })
      .then(function (res) { if (!res.ok) { alFallar(res); } return res.blob(); })
      .then(function (blob) {
        var url = URL.createObjectURL(blob);
        miniaturas[item.path] = url;
        return url;
      });
  }

  /* Medidas reales de una miniatura (para completar ancho/alto del JSON) */
  function medidasDe(url) {
    return new Promise(function (ok) {
      var im = new Image();
      im.onload = function () { ok({ ancho: im.naturalWidth, alto: im.naturalHeight }); };
      im.onerror = function () { ok({ ancho: 0, alto: 0 }); };
      im.src = url;
    });
  }

  /* Variante -900 de una foto de galería (convención de nombres del sitio) */
  function variantesGaleria(item, ancho) {
    var m = item.name.match(/^(.*)(\.[a-z0-9]+)$/i);
    if (!m) { return null; }
    var candidata = m[1] + "-900" + m[2];
    var existe = listaGaleria && listaGaleria.some(function (o) { return o.name === candidata; });
    if (!existe) { return null; }
    return CARPETA + "/" + candidata + " 900w, " + item.path + " " + ancho + "w";
  }

  function pintarGaleria() {
    var zona = document.getElementById("media-galeria");
    zona.innerHTML = '<p class="form-vacio">Cargando la galería…</p>';
    listarGaleria().then(function (items) {
      if (!ACTUAL) { return; }
      zona.innerHTML = "";
      if (!items.length) {
        zona.innerHTML = '<p class="form-vacio">Todavía no hay imágenes: usá la pestaña «Subir desde la PC».</p>';
        return;
      }
      items.forEach(function (item) {
        var boton = document.createElement("button");
        boton.type = "button";
        boton.className = "media-item";
        boton.title = item.name;
        var img = document.createElement("img");
        img.alt = "";
        img.loading = "lazy";
        boton.appendChild(img);
        var pie = document.createElement("small");
        pie.textContent = item.name;
        boton.appendChild(pie);
        boton.addEventListener("click", function () {
          var url = miniaturas[item.path];
          if (!url) { return; }
          medidasDe(url).then(function (mm) {
            var cfg = ACTUAL;
            if (!cfg) { return; }
            var elegir = cfg.alElegir;
            cerrar();
            elegir({
              imagen: item.path,
              srcset: cfg.conSrcset ? variantesGaleria(item, mm.ancho) : null,
              ancho: mm.ancho,
              alto: mm.alto
            });
          });
        });
        zona.appendChild(boton);
        miniaturaDe(item).then(function (url) { img.src = url; }).catch(function () { img.src = ""; });
      });
    }).catch(function (err) {
      zona.innerHTML = "";
      var aviso = document.createElement("p");
      aviso.className = "form-vacio";
      aviso.textContent = err.message;
      zona.appendChild(aviso);
    });
  }

  /* ------------------------------ Subida -------------------------------- */
  function slug(nombre) {
    var base = nombre.replace(/\.[a-z0-9]+$/i, "");
    base = base.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    base = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!base) { base = "imagen"; }
    if (base.length > 40) { base = base.slice(0, 40); }
    return base;
  }

  function sufijo() {
    var bytes = new Uint8Array(3);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (var j = 0; j < bytes.length; j++) { bytes[j] = Math.floor(Math.random() * 256); }
    }
    var s = "";
    for (var i = 0; i < bytes.length; i++) { s += ("0" + bytes[i].toString(16)).slice(-2); }
    return s;
  }

  function cargarImagen(archivo) {
    return new Promise(function (ok, no) {
      var url = URL.createObjectURL(archivo);
      var im = new Image();
      im.onload = function () { ok({ img: im, url: url }); };
      im.onerror = function () { URL.revokeObjectURL(url); no(new Error("No se pudo leer la imagen.")); };
      im.src = url;
    });
  }

  function dibujar(im, anchoMax, tipo) {
    var w = im.naturalWidth || 1;
    var h = im.naturalHeight || 1;
    var escala = Math.min(1, anchoMax / w);
    var canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * escala));
    canvas.height = Math.max(1, Math.round(h * escala));
    var ctx = canvas.getContext("2d");
    if (tipo !== "logo") {
      /* El JPEG no tiene transparencia: fondo blanco */
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(im, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  /* Procesa el archivo elegido y deja todo listo para subir */
  function procesarPendiente(archivo) {
    var config = ACTUAL;
    cargarImagen(archivo).then(function (r) {
      var anchoMax = config.tipo === "logo" ? 600 : 1600;
      var formato = config.tipo === "logo" ? "image/png" : "image/jpeg";
      var ext = config.tipo === "logo" ? ".png" : ".jpg";
      var principal = dibujar(r.img, anchoMax, config.tipo);
      var nombre = slug(archivo.name) + "-" + sufijo();
      var archivos = [{
        ruta: CARPETA + "/" + nombre + ext,
        b64: principal.toDataURL(formato, 0.82).split(",")[1],
        ancho: principal.width,
        alto: principal.height
      }];
      var prevista = principal.toDataURL(formato, 0.82);

      /* Variante -900 solo cuando el campo la usa (fotos del carrusel) */
      if (config.conSrcset && (r.img.naturalWidth || 0) > 900) {
        var chica = dibujar(r.img, 900, config.tipo);
        archivos.push({
          ruta: CARPETA + "/" + nombre + "-900" + ext,
          b64: chica.toDataURL(formato, 0.82).split(",")[1]
        });
      }

      pendiente = {
        archivos: archivos,
        nombre: nombre + ext,
        ancho: archivos[0].ancho,
        alto: archivos[0].alto,
        srcset: archivos.length > 1
          ? archivos[1].ruta + " 900w, " + archivos[0].ruta + " " + archivos[0].ancho + "w"
          : null,
        prevista: prevista
      };

      document.getElementById("media-prevista").hidden = false;
      document.getElementById("media-prevista-img").src = prevista;
      document.getElementById("media-prevista-info").textContent =
        "Se subirá como " + pendiente.nombre + " (" + pendiente.ancho + "×" + pendiente.alto +
        (archivos.length > 1 ? " + variante -900" : "") + ")";
    }).catch(function (err) {
      document.getElementById("media-prevista").hidden = true;
      alerta(err.message);
    });
  }

  /* Un solo commit por imagen: blobs + árbol + commit + ref */
  function subirPendiente() {
    if (!pendiente || !ACTUAL) { return; }
    var boton = document.getElementById("media-subir-btn");
    boton.disabled = true;
    boton.textContent = "Subiendo…";

    var shas = [];
    var paso = Promise.resolve();

    pendiente.archivos.forEach(function (arch) {
      paso = paso.then(function () {
        return apiFetch("/repos/" + REPO + "/git/blobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: arch.b64, encoding: "base64" })
        }).then(function (res) {
          if (!res.ok) { alFallar(res); }
          return res.json();
        }).then(function (blob) { shas.push({ path: arch.ruta, sha: blob.sha }); });
      });
    });

    var base = null;
    paso
      .then(function () {
        return apiFetch("/repos/" + REPO + "/git/ref/heads/" + BRANCH);
      })
      .then(function (res) { if (!res.ok) { alFallar(res); } return res.json(); })
      .then(function (ref) {
        base = ref.object.sha;
        return apiFetch("/repos/" + REPO + "/git/commits/" + base);
      })
      .then(function (res) { if (!res.ok) { alFallar(res); } return res.json(); })
      .then(function (commit) {
        return apiFetch("/repos/" + REPO + "/git/trees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base_tree: commit.tree.sha,
            tree: shas.map(function (s) {
              return { path: s.path, mode: "100644", type: "blob", sha: s.sha };
            })
          })
        });
      })
      .then(function (res) { if (!res.ok) { alFallar(res); } return res.json(); })
      .then(function (tree) {
        return apiFetch("/repos/" + REPO + "/git/commits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "Editor visual: subir imagen " + pendiente.nombre,
            tree: tree.sha,
            parents: [base]
          })
        });
      })
      .then(function (res) { if (!res.ok) { alFallar(res); } return res.json(); })
      .then(function (commit) {
        return apiFetch("/repos/" + REPO + "/git/refs/heads/" + BRANCH, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sha: commit.sha, force: false })
        });
      })
      .then(function (res) {
        if (!res.ok) { alFallar(res); }
        /* La galería cambió: que la próxima apertura la vuelva a leer */
        listaGaleria = null;
        miniaturas = {};
        var resultado = {
          imagen: pendiente.archivos[0].ruta,
          srcset: pendiente.srcset,
          ancho: pendiente.ancho,
          alto: pendiente.alto
        };
        /* Copia local para la vista previa: el archivo ya está en GitHub
           pero todavía no en este disco — el editor la inyecta en la
           miniatura para verla al instante. */
        window.BQ_SUBIDAS = window.BQ_SUBIDAS || {};
        window.BQ_SUBIDAS[resultado.imagen] = pendiente.prevista;
        var elegir = ACTUAL.alElegir;
        cerrar();
        elegir(resultado);
      })
      .catch(function (err) {
        boton.disabled = false;
        boton.textContent = "Subir y usar";
        alerta(err.message);
      });
  }

  function alerta(texto) {
    /* Aviso simple dentro del modal de imágenes */
    var aviso = document.getElementById("media-aviso");
    if (!aviso) {
      aviso = document.createElement("p");
      aviso.id = "media-aviso";
      aviso.className = "auth-error";
      document.querySelector("#modal-imagenes .modal-caja").appendChild(aviso);
    }
    aviso.textContent = texto;
    aviso.hidden = false;
    window.setTimeout(function () { aviso.hidden = true; }, 6000);
  }

  /* --------------------------- Interfaz pública ------------------------- */
  function activarPestana(cual) {
    var galeria = document.getElementById("media-galeria");
    var subir = document.getElementById("media-subir");
    document.getElementById("media-tab-galeria").classList.toggle("is-activo", cual === "galeria");
    document.getElementById("media-tab-subir").classList.toggle("is-activo", cual === "subir");
    if (cual === "galeria") {
      subir.hidden = true;
      galeria.hidden = false;
      pintarGaleria();
    } else {
      galeria.hidden = true;
      subir.hidden = false;
    }
  }

  function cerrar() {
    pendiente = null;
    ACTUAL = null;
    document.getElementById("modal-imagenes").hidden = true;
    document.getElementById("media-prevista").hidden = true;
    document.getElementById("media-archivo").value = "";
    var b = document.getElementById("media-subir-btn");
    b.disabled = false;
    b.textContent = "Subir y usar";
  }

  var conectado = false;
  function conectarUnaVez() {
    if (conectado) { return; }
    conectado = true;
    document.getElementById("media-tab-galeria").addEventListener("click", function () { activarPestana("galeria"); });
    document.getElementById("media-tab-subir").addEventListener("click", function () { activarPestana("subir"); });
    document.getElementById("media-archivo").addEventListener("change", function (ev) {
      var f = ev.target.files && ev.target.files[0];
      if (f && ACTUAL) { procesarPendiente(f); }
    });
    document.getElementById("media-subir-btn").addEventListener("click", subirPendiente);
  }

  window.BQMedia = {
    /* config: { titulo, tipo: "foto"|"logo", conSrcset, alElegir(media) } */
    abrir: function (config) {
      ACTUAL = config || {};
      conectarUnaVez();
      document.getElementById("modal-imagenes-titulo").textContent = ACTUAL.titulo || "Elegir imagen";
      /* Reset del estado de una apertura anterior */
      pendiente = null;
      document.getElementById("media-prevista").hidden = true;
      document.getElementById("media-prevista-img").removeAttribute("src");
      document.getElementById("media-prevista-info").textContent = "";
      document.getElementById("media-archivo").value = "";
      var aviso = document.getElementById("media-aviso");
      if (aviso) { aviso.hidden = true; }
      var b = document.getElementById("media-subir-btn");
      b.disabled = false;
      b.textContent = "Subir y usar";
      document.getElementById("modal-imagenes").hidden = false;
      activarPestana("galeria");
    },
    cerrar: cerrar
  };
})();
