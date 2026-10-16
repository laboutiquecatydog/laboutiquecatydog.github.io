/* ==========================================================================
   La Boutique Cat & Dog — Configuración del sitio
   --------------------------------------------------------------------------
   Todos los datos del negocio se editan SOLO en este archivo.
   Los campos que queden vacíos ("") NO se muestran en el sitio: sus botones
   y tarjetas se ocultan automáticamente, para no mostrar enlaces falsos.
   ========================================================================== */

window.SITE_CONFIG = {
  /* --- WhatsApp -----------------------------------------------------------
     Número en formato internacional SIN "+", espacios ni guiones.
     El sitio arma el enlace https://wa.me/<whatsapp> con este valor. */
  whatsapp: "543874578676",
  /* Número tal como se muestra al usuario (con +, espacios y guiones). */
  whatsappDisplay: "+54 9 387 457-8676",
  /* Mensaje inicial que se escribe automáticamente en la conversación. */
  whatsappDefaultMessage: "Hola, quisiera consultar por sus productos para mascotas",

  /* --- Datos de contacto ------------------------------------------------ */
  phone: "",       // Ej: "+54 9 387 457-8676"  (teléfono fijo o alternativo)
  email: "laboutiquecatydog@gmail.com",
  address: "Diario La Nación y Diario El Litoral, Bº Periodista, Salta",
  hours: "Lun a Sáb de 10:00 a 13:00 h · Dom cerrado",

  /* Dirección para el botón "Cómo llegar" de Google Maps.
     Coordenadas del local (abren el punto exacto en Google Maps). */
  mapsQuery: "-24.8445087,-65.4390905",

  /* --- Redes sociales (URL completa, con https://) ---------------------- */
  instagram: "https://www.instagram.com/laboutiquecatydog/",
  tiktok: "https://www.tiktok.com/@laboutiquecatydog",
  facebook: "https://www.facebook.com/685608634637906",

  /* --- Carrusel de portada ----------------------------------------------
     Tiempo entre imágenes en milisegundos (3000 = 3 segundos). */
  carouselDelay: 3000
};
