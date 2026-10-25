/* ==========================================================================
   La Boutique Cat & Dog — Motor de formularios del editor visual (W2/W3)
   --------------------------------------------------------------------------
   Construye formularios a partir del propio JSON: recorre los campos,
   aplica reglas por nombre de campo (etiquetas legibles, textarea para
   textos largos, selects, checks, listas) y escribe los cambios directo
   en el objeto de datos que le pasan. Solo actualiza claves existentes:
   nunca agrega ni borra campos de texto, así el JSON conserva su forma.
   Los campos de imagen (imagen, foto, logo) abren el selector BQMedia;
   los internos de tamaño (srcset, sizes, ancho, alto) los gestiona el
   editor automáticamente y quedan ocultos aquí.
   Las listas (fotos del carrusel, tarjetas, productos, fotos de producto)
   permiten agregar (eligiendo imagen), quitar y reordenar.
   ========================================================================== */
(function () {
  "use strict";

  /* Nombres legibles de grupos (objetos anidados) */
  var GRUPOS = {
    hero: "Portada de la sección hero",
    botonPrincipal: "Botón principal (WhatsApp)",
    botonSecundario: "Botón secundario",
    boton: "Botón de consulta",
    botonWhatsapp: "Botón de WhatsApp",
    marca: "Marca",
    negocio: "Datos del negocio",
    instagram: "Instagram",
    tiktok: "TikTok",
    facebook: "Facebook",
    footer: "Pie de página",
    nav: "Menú de navegación",
    seo: "SEO — cómo te encuentra Google"
  };

  /* Títulos legibles para las listas dentro de una sección */
  var DICT_LISTAS = {
    slides: "Fotos del carrusel",
    tarjetas: "Tarjetas de categoría",
    productos: "Productos",
    fotos: "Fotos del producto",
    nav: "Ítems del menú"
  };

  /* Campos técnicos de las imágenes: se administran solos al elegir una
     foto (el editor completa srcset, tamaños, etc.). Se muestran igual,
     pero aparte, en «Campos avanzados» — el editor ya cubre todo lo que
     hacía el panel antiguo. */
  var AVANZADOS = {
    srcset: 1, sizes: 1, ancho: 1, alto: 1,
    prioridad: 1, imagenAncho: 1, imagenAlto: 1
  };

  /* Listas que se pueden editar estructuralmente (agregar/quitar/mover) */
  var EDITABLES = { slides: 1, tarjetas: 1, productos: 1, fotos: 1 };
  var AGREGAR_TEXTO = {
    slides: "Agregar foto al carrusel",
    tarjetas: "Agregar tarjeta de categoría",
    productos: "Agregar producto (con su primera foto)",
    fotos: "Agregar foto al producto"
  };
  var AGREGAR_TITULO = {
    slides: "Foto del carrusel",
    tarjetas: "Foto de la tarjeta",
    productos: "Primera foto del producto",
    fotos: "Foto del producto"
  };

  /* Plantilla de cada item nuevo según la lista (la imagen la elige el
     usuario primero, así ninguna sección queda sin foto) */
  function plantillaDe(clave, media) {
    if (clave === "slides") {
      return {
        imagen: media.imagen,
        srcset: media.srcset || "",
        sizes: "(max-width: 860px) 100vw, 50vw",
        alt: "",
        ancho: media.ancho || 0,
        alto: media.alto || 0
      };
    }
    if (clave === "tarjetas") {
      return {
        imagen: media.imagen,
        alt: "",
        ancho: media.ancho || 0,
        alto: media.alto || 0,
        titulo: "Nueva categoría",
        texto: "",
        enlace: "#productos"
      };
    }
    if (clave === "fotos") {
      return { foto: media.imagen, alt: "" };
    }
    if (clave === "productos") {
      return {
        etiqueta: "Nuevo",
        titulo: "Producto nuevo",
        descripcion: "",
        mascotas: "perro gato",
        precio: "",
        mensajeWhatsApp: "",
        fotos: [{ foto: media.imagen, alt: "" }]
      };
    }
    return {};
  }

  /* Reglas por campo. Clave = nombre del campo en el JSON. Lo que no está
     acá recibe una etiqueta genérica derivada del nombre. */
  var REGLAS = {
    id: {
      etiqueta: "Identificador (ancla de la sección)",
      pista: "Con cuidado: los enlaces del menú apuntan a esta ancla (ej.: #productos). Cambiarla los rompe."
    },
    mostrarFiltros: { tipo: "check", etiqueta: "Mostrar los filtros de categoría" },
    srcset: { tipo: "textarea", filas: 2, etiqueta: "srcset (variantes de tamaño)", pista: "Lo completa solo el editor al subir la foto. Solo tocar si sabés lo que hacés." },
    sizes: { tipo: "textarea", filas: 2, etiqueta: "sizes (regla de elección)", pista: "Lo completa solo el editor al subir la foto. Solo tocar si sabés lo que hacés." },
    ancho: { tipo: "numero", etiqueta: "Ancho de la foto (px)" },
    alto: { tipo: "numero", etiqueta: "Alto de la foto (px)" },
    imagenAncho: { tipo: "numero", etiqueta: "Ancho de la imagen (px)" },
    imagenAlto: { tipo: "numero", etiqueta: "Alto de la imagen (px)" },
    prioridad: { tipo: "check", etiqueta: "Prioridad de carga (primera foto)" },
    eyebrow: { etiqueta: "Antetítulo (línea chica sobre el título)" },
    titulo: { etiqueta: "Título" },
    texto: { tipo: "textarea", filas: 3, etiqueta: "Texto" },
    intro: { tipo: "textarea", filas: 2, etiqueta: "Introducción" },
    descripcion: { tipo: "textarea", filas: 3, etiqueta: "Descripción" },
    aria: { tipo: "textarea", filas: 2, etiqueta: "Etiqueta técnica (para lectores de pantalla)" },
    ariaLabel: { tipo: "textarea", filas: 2, etiqueta: "Nombre técnico (para lectores de pantalla)" },
    carruselAria: { etiqueta: "Etiqueta técnica del carrusel" },
    mensaje: { tipo: "textarea", filas: 2, etiqueta: "Mensaje de WhatsApp pre-cargado" },
    mensajeWhatsApp: { tipo: "textarea", filas: 2, etiqueta: "Mensaje de WhatsApp pre-cargado" },
    whatsappMensaje: { tipo: "textarea", filas: 2, etiqueta: "Mensaje de WhatsApp pre-cargado" },
    ctaTexto: { etiqueta: "Texto del botón" },
    botonMapsTexto: { etiqueta: "Texto del botón de Maps" },
    enlace: { etiqueta: "Enlace", pista: "Ej.: #productos o https://…" },
    ancla: { etiqueta: "Ancla del menú", pista: "Ej.: #inicio" },
    alt: { etiqueta: "Texto alternativo de la foto" },
    imagenAlt: { etiqueta: "Texto alternativo de la foto" },
    logoAlt: { etiqueta: "Texto alternativo del logo" },
    etiqueta: { etiqueta: "Rótulo (etiqueta chica)" },
    mascotas: { etiqueta: "Para qué mascotas", pista: "palabras separadas por espacio: perro, gato" },
    precio: { etiqueta: "Precio (opcional)", pista: "se muestra con «$»: dejá vacío si no aplica" },
    whatsapp: { etiqueta: "WhatsApp (solo números)", pista: "con código de país, ej.: 543874578676" },
    whatsappDisplay: { etiqueta: "WhatsApp (cómo se muestra)", pista: "ej.: +54 9 387 457-8676" },
    phone: { etiqueta: "Teléfono (opcional, para datos estructurados)" },
    email: { etiqueta: "Correo electrónico" },
    address: { tipo: "textarea", filas: 2, etiqueta: "Dirección del local" },
    hours: { tipo: "textarea", filas: 2, etiqueta: "Horarios" },
    mapsQuery: { etiqueta: "Ubicación en Maps", pista: "“latitud,longitud” — ej.: -24.8445,-65.4390" },
    carouselDelay: { tipo: "numero", etiqueta: "Velocidad del carrusel (ms)", minimo: 1000, paso: 500 },
    vinetas: { tipo: "lista-texto", etiqueta: "Viñetas (una por línea)", pista: "Cada línea es una viñeta de la lista" },
    ordenSocial: { tipo: "orden-redes", etiqueta: "Redes mostradas y su orden", pista: "valores válidos: instagram, tiktok, facebook", opciones: ["instagram", "tiktok", "facebook"] },
    navCtaTexto: { etiqueta: "Texto del botón del menú" },
    seccionesTitulo: { etiqueta: "Título de la columna «Secciones»" },
    contactoTitulo: { etiqueta: "Título de la columna «Contacto»" },
    seguinosTitulo: { etiqueta: "Título de la columna «Seguinos»" },
    whatsappTexto: { etiqueta: "Texto del botón de WhatsApp del pie" },
    copyright: { tipo: "textarea", filas: 2, etiqueta: "Aviso de copyright" },
    nombre: { etiqueta: "Nombre" },
    nombreSecundario: { etiqueta: "Nombre secundario" },
    url: { etiqueta: "Dirección (URL)" }
  };

  /* Claves técnicas que no se muestran en ningún formulario. `huella` quedó
     en desuso (se retiró el camino decorativo de huellas): si algún
     borrador viejo la trae, no se muestra. */
  var TECNICOS = { tipo: 1, oculto: 1, huella: 1 };

  /* Configuración del selector de imágenes según el campo y su contexto */
  function configImagen(clave, contexto) {
    var lista = (contexto && contexto.lista) || "";
    if (clave === "logo") {
      return { titulo: "Logo", tipo: "logo", dims: null };
    }
    if (clave === "foto") {
      return { titulo: "Foto del producto", tipo: "foto", dims: null };
    }
    if (lista === "slides") {
      return { titulo: "Foto del carrusel", tipo: "foto", conSrcset: true, dims: ["ancho", "alto"] };
    }
    if (lista === "tarjetas") {
      return { titulo: "Foto de la tarjeta", tipo: "foto", dims: ["ancho", "alto"] };
    }
    /* imagen a nivel de sección (imagenTexto) */
    return { titulo: "Imagen de la sección", tipo: "foto", dims: ["imagenAncho", "imagenAlto"] };
  }

  function esCampoImagen(clave) {
    return clave === "imagen" || clave === "foto" || clave === "logo";
  }

  /* ------------------------- Utilidades DOM ------------------------------ */
  function crear(tag) { return document.createElement(tag); }

  function etiquetaDe(clave) {
    var r = REGLAS[clave];
    if (r && r.etiqueta) { return r.etiqueta; }
    var legible = String(clave).replace(/([a-z0-9])([A-Z])/g, "$1 $2");
    return legible.charAt(0).toUpperCase() + legible.slice(1);
  }

  function pistaDe(clave, contexto) {
    var r = REGLAS[clave];
    if (r && r.pista) { return r.pista; }
    if (contexto && contexto.esHero && clave === "titulo" && contexto.nivel === "raiz") {
      return "Podés marcar negritas entre doble asterisco, ej.: Todo para **perros** y **gatos**";
    }
    if (contexto && contexto.grupo === "seo") {
      if (clave === "titulo") { return "El título que muestra Google. Ideal: hasta 60 caracteres, con la ciudad."; }
      if (clave === "descripcion") { return "El resumen que muestra Google. Ideal: hasta 155 caracteres, con qué vendés y la ciudad."; }
    }
    return "";
  }

  /* Acceso por ruta: ["botonPrincipal","texto"] dentro del objeto raíz */
  function asignarValor(raiz, ruta, valor) {
    var actual = raiz;
    for (var i = 0; i < ruta.length - 1; i++) { actual = actual[ruta[i]]; }
    actual[ruta[ruta.length - 1]] = valor;
  }

  /* ------------------------ Campo simple ---------------------------------- */
  function crearCampo(clave, valor, raiz, ruta, alCambiar, contexto) {
    var regla = REGLAS[clave] || {};
    var tipo = regla.tipo || "input";
    var caja = crear("div");
    caja.className = "campo";

    /* Solo lectura (p. ej. el id/ancla) */
    if (tipo === "solo-lectura") {
      var rot = crear("label");
      rot.className = "campo-etiqueta";
      rot.textContent = etiquetaDe(clave);
      caja.appendChild(rot);
      var valorLectura = crear("p");
      valorLectura.className = "campo-lectura";
      valorLectura.textContent = valor == null || valor === "" ? "(vacío)" : String(valor);
      caja.appendChild(valorLectura);
      return caja;
    }

    /* Checkbox (booleanos) */
    if (tipo === "check") {
      var envoltura = crear("label");
      envoltura.className = "campo-check";
      var chk = crear("input");
      chk.type = "checkbox";
      chk.checked = !!valor;
      chk.addEventListener("change", function () {
        asignarValor(raiz, ruta, chk.checked);
        alCambiar();
      });
      envoltura.appendChild(chk);
      envoltura.appendChild(document.createTextNode(" " + etiquetaDe(clave)));
      caja.appendChild(envoltura);
      return caja;
    }

    /* Etiqueta común */
    var rotulo = crear("label");
    rotulo.className = "campo-etiqueta";
    rotulo.textContent = etiquetaDe(clave);
    caja.appendChild(rotulo);

    var control;
    var extraer = function (elm) { return elm.value; };

    if (tipo === "select") {
      control = crear("select");
      (regla.opciones || []).forEach(function (op) {
        var o = crear("option");
        o.value = op;
        o.textContent = op;
        if (op === valor) { o.selected = true; }
        control.appendChild(o);
      });
    } else if (tipo === "textarea") {
      control = crear("textarea");
      control.rows = regla.filas || 3;
      control.value = valor == null ? "" : String(valor);
    } else if (tipo === "numero") {
      control = crear("input");
      control.type = "number";
      if (regla.minimo != null) { control.min = String(regla.minimo); }
      if (regla.paso != null) { control.step = String(regla.paso); }
      control.value = valor == null ? "" : String(valor);
      extraer = function (elm) {
        var n = parseFloat(elm.value);
        return isNaN(n) ? valor : n;
      };
    } else if (tipo === "lista-texto") {
      control = crear("textarea");
      control.rows = Math.max(3, ((valor || []).length || 0) + 1);
      control.value = (valor || []).join("\n");
      extraer = function (elm) {
        return elm.value.split("\n").map(function (l) { return l.trim(); }).filter(Boolean);
      };
    } else if (tipo === "orden-redes") {
      control = crear("input");
      control.type = "text";
      control.value = (valor || []).join(", ");
      var permitidas = regla.opciones || [];
      extraer = function (elm) {
        return elm.value.split(/[\s,]+/).filter(Boolean).map(function (t) {
          return t.toLowerCase();
        }).filter(function (t) {
          return permitidas.indexOf(t) !== -1;
        });
      };
    } else {
      control = crear("input");
      control.type = "text";
      control.value = valor == null ? "" : String(valor);
    }

    var alTocar = function () {
      asignarValor(raiz, ruta, extraer(control));
      alCambiar();
    };
    control.addEventListener("input", alTocar);
    control.addEventListener("change", alTocar);

    caja.appendChild(control);

    var pista = pistaDe(clave, contexto);
    if (pista) {
      var ayuda = crear("p");
      ayuda.className = "campo-pista";
      ayuda.textContent = pista;
      caja.appendChild(ayuda);
    }

    return caja;
  }

  /* ------------------------ Campo de imagen (W3) -------------------------- */
  function crearCampoImagen(clave, valor, ruta, alCambiarImagen, contexto) {
    var config = configImagen(clave, contexto);
    var caja = crear("div");
    caja.className = "campo campo-imagen";

    var rotulo = crear("label");
    rotulo.className = "campo-etiqueta";
    rotulo.textContent = config.titulo;
    caja.appendChild(rotulo);

    var fila = crear("div");
    fila.className = "img-fila";

    if (valor) {
      var im = crear("img");
      im.className = "img-thumb";
      im.alt = "";
      try { im.src = new URL(valor, location.origin).href; } catch (e2) { im.hidden = true; }
      /* Imágenes recién subidas: mostrar la copia local en la miniatura
         (todavía no están en este disco) */
      if (window.BQ_SUBIDAS && window.BQ_SUBIDAS[valor]) {
        im.src = window.BQ_SUBIDAS[valor];
      }
      im.onerror = function () { im.hidden = true; };
      fila.appendChild(im);
    }

    var nombre = crear("span");
    nombre.className = "img-nombre";
    nombre.textContent = valor || "(sin imagen)";
    fila.appendChild(nombre);

    var boton = crear("button");
    boton.type = "button";
    boton.className = "btn-borde btn-chico";
    boton.textContent = valor ? "Cambiar…" : "Elegir imagen…";
    boton.addEventListener("click", function () {
      if (alCambiarImagen) { alCambiarImagen(ruta, config); }
    });
    fila.appendChild(boton);

    caja.appendChild(fila);
    return caja;
  }

  /* ------------------------ Listas de items -------------------------------- */
  function nombreDeItem(clave, item, i) {
    if (clave === "slides") { return "Foto " + (i + 1); }
    if (clave === "fotos") { return "Foto " + (i + 1); }
    if (item && typeof item === "object") {
      if (item.titulo) { return (i + 1) + ". " + item.titulo; }
      if (item.etiqueta) { return (i + 1) + ". " + item.etiqueta; }
      if (item.texto) { return (i + 1) + ". " + item.texto; }
    }
    return "Ítem " + (i + 1);
  }

  function botonMini(texto, titulo, alClic, peligro) {
    var b = crear("button");
    b.type = "button";
    b.className = "mini-btn" + (peligro ? " is-peligro" : "");
    b.textContent = texto;
    b.title = titulo;
    b.setAttribute("aria-label", titulo);
    b.addEventListener("click", alClic);
    return b;
  }

  function construirLista(clave, valor, raiz, ruta, contenedor, alCambiar, alCambiarImagen, contexto) {
    var regla = REGLAS[clave];

    /* Listas de texto plano (viñetas, redes) usan un solo campo */
    if (regla && (regla.tipo === "lista-texto" || regla.tipo === "orden-redes")) {
      contenedor.appendChild(crearCampo(clave, valor, raiz, ruta, alCambiar, contexto));
      return;
    }

    var caja = crear("div");
    caja.className = "lista-campo";

    var titulo = crear("h3");
    titulo.className = "lista-titulo";
    titulo.textContent = DICT_LISTAS[clave] || etiquetaDe(clave);
    caja.appendChild(titulo);

    if (!valor || valor.length === 0) {
      var vacio = crear("p");
      vacio.className = "nota";
      vacio.textContent = "(sin elementos todavía)";
      caja.appendChild(vacio);
    }

    var esEditable = EDITABLES[clave] && Array.isArray(valor);

    (valor || []).forEach(function (item, i) {
      var cajaItem = crear("details");
      cajaItem.className = "item-lista";
      cajaItem.open = (valor || []).length === 1;

      var resumen = crear("summary");
      resumen.textContent = nombreDeItem(clave, item, i);
      cajaItem.appendChild(resumen);

      if (item && typeof item === "object") {
        var cuerpo = crear("div");
        cuerpo.className = "item-lista-cuerpo";
        construirObjeto(item, raiz, ruta.concat([i]), cuerpo, alCambiar, alCambiarImagen, { lista: clave });
        cajaItem.appendChild(cuerpo);
      }

      /* Acciones del item: mover y quitar (solo listas editables) */
      if (esEditable) {
        var acciones = crear("div");
        acciones.className = "item-lista-acciones";
        acciones.appendChild(botonMini("↑", "Subir", function () {
          if (i === 0) { return; }
          var sacado = valor.splice(i, 1)[0];
          valor.splice(i - 1, 0, sacado);
          alCambiar(true);
        }));
        acciones.appendChild(botonMini("↓", "Bajar", function () {
          if (i >= valor.length - 1) { return; }
          var sacado2 = valor.splice(i, 1)[0];
          valor.splice(i + 1, 0, sacado2);
          alCambiar(true);
        }));
        acciones.appendChild(botonMini("✕", "Quitar", function () {
          valor.splice(i, 1);
          alCambiar(true);
        }, true));

        /* Productos: además del ✕, un botón claro con texto */
        if (clave === "productos") {
          var quitarProducto = crear("button");
          quitarProducto.type = "button";
          quitarProducto.className = "lista-quitar";
          quitarProducto.textContent = "Quitar este producto";
          quitarProducto.addEventListener("click", function () {
            valor.splice(i, 1);
            alCambiar(true);
          });
          acciones.appendChild(quitarProducto);
        }

        cajaItem.appendChild(acciones);
      }

      caja.appendChild(cajaItem);
    });

    /* Aviso para fotos internas sin edición de imagen directa */
    if (clave === "slides" || clave === "fotos") {
      /* (las fotos ya se administran acá: el aviso anterior quedó para
         campos internos como srcset/sizes, ocultos más arriba) */
    }

    /* Agregar: primero se elige la imagen, después se crea el item */
    if (esEditable && window.BQMedia) {
      var agregar = crear("button");
      agregar.type = "button";
      agregar.className = "btn-borde btn-bloque lista-agregar";
      agregar.textContent = "+ " + AGREGAR_TEXTO[clave];
      agregar.addEventListener("click", function () {
        window.BQMedia.abrir({
          titulo: AGREGAR_TITULO[clave],
          tipo: "foto",
          conSrcset: clave === "slides",
          alElegir: function (media) {
            valor.push(plantillaDe(clave, media));
            alCambiar(true);
          }
        });
      });
      caja.appendChild(agregar);
    }

    contenedor.appendChild(caja);
  }

  /* ------------------------ Recorrido del objeto --------------------------- */
  function construirGrupo(clave, objeto, raiz, ruta, contenedor, alCambiar, alCambiarImagen, contexto) {
    var fieldset = crear("fieldset");
    fieldset.className = "grupo";
    var leyenda = crear("legend");
    leyenda.textContent = GRUPOS[clave] || etiquetaDe(clave);
    fieldset.appendChild(leyenda);
    construirObjeto(objeto, raiz, ruta, fieldset, alCambiar, alCambiarImagen,
      { lista: contexto && contexto.lista, grupo: clave });
    contenedor.appendChild(fieldset);
  }

  function construirObjeto(objeto, raiz, ruta, contenedor, alCambiar, alCambiarImagen, contexto) {
    /* Los campos técnicos van aparte, al final, en «Campos avanzados»:
      el día a día se edita sin ruido, pero nada queda fuera del panel. */
    var avanzados = [];

    Object.keys(objeto).forEach(function (clave) {
      if (TECNICOS[clave]) { return; }
      if (AVANZADOS[clave] && typeof objeto[clave] !== "object") {
        avanzados.push(clave);
        return;
      }
      var valor = objeto[clave];
      var subRuta = ruta.concat([clave]);

      if (Array.isArray(valor)) {
        construirLista(clave, valor, raiz, subRuta, contenedor, alCambiar, alCambiarImagen, contexto);
        return;
      }
      if (valor && typeof valor === "object") {
        construirGrupo(clave, valor, raiz, subRuta, contenedor, alCambiar, alCambiarImagen, contexto);
        return;
      }
      if (esCampoImagen(clave)) {
        contenedor.appendChild(crearCampoImagen(clave, valor, subRuta, alCambiarImagen, contexto));
        return;
      }
      contenedor.appendChild(crearCampo(clave, valor, raiz, subRuta, alCambiar, contexto));
    });

    if (avanzados.length) {
      var cajaAv = crear("details");
      cajaAv.className = "grupo-avanzado";
      var resumen = crear("summary");
      resumen.textContent = "Campos avanzados (" + avanzados.length + ")";
      resumen.title = "Campos técnicos de la imagen: el editor los completa solo al elegir una foto.";
      cajaAv.appendChild(resumen);
      var cuerpoAv = crear("div");
      cuerpoAv.className = "item-lista-cuerpo";
      avanzados.forEach(function (clave) {
        var valor = objeto[clave];
        var subRuta = ruta.concat([clave]);
        cuerpoAv.appendChild(crearCampo(clave, valor, raiz, subRuta, alCambiar, contexto));
      });
      cajaAv.appendChild(cuerpoAv);
      contenedor.appendChild(cajaAv);
    }
  }

  /* --------------------------- API pública -------------------------------- */
  window.BQForm = {
    /* Formulario de una sección de la portada (data/pagina.json)
       alCambiar(esEstructural) · alCambiarImagen(ruta, config) */
    construirSeccion: function (seccion, contenedor, alCambiar, alCambiarImagen) {
      contenedor.innerHTML = "";
      var contexto = { esHero: seccion.tipo === "hero", nivel: "raiz" };

      var encabezado = crear("header");
      encabezado.className = "form-encabezado";
      var h2 = crear("h2");
      h2.textContent = "Textos de la sección";
      encabezado.appendChild(h2);
      var sub = crear("p");
      sub.className = "form-sub";
      sub.textContent = seccion.id ? "Ancla: #" + seccion.id : "Sección sin ancla";
      encabezado.appendChild(sub);
      contenedor.appendChild(encabezado);

      construirObjeto(seccion, seccion, [], contenedor, alCambiar, alCambiarImagen, contexto);
    },

    /* Formulario de datos del local (data/sitio.json) */
    construirSitio: function (datosSitio, contenedor, alCambiar, alCambiarImagen) {
      contenedor.innerHTML = "";
      var contexto = { nivel: "raiz" };
      construirObjeto(datosSitio, datosSitio, [], contenedor, alCambiar, alCambiarImagen, contexto);
    }
  };
})();
