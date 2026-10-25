/* ==========================================================================
   Servidor local de previsualización — La Boutique Cat & Dog
   --------------------------------------------------------------------------
   Sirve la carpeta del proyecto por HTTP para poder ver el sitio en local
   (el contenido se carga con fetch, por lo que file:// no funciona).

   Uso:  node tools/serve.js [rutaRaiz] [puerto]
   Sin dependencias: solo módulos de Node.
   ========================================================================== */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const root = path.resolve(process.argv[2] || process.cwd());
let port = parseInt(process.argv[3], 10) || 8080;
const host = "127.0.0.1";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".avif": "image/avif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

function send(res, status, body, type) {
  res.writeHead(status, { "Content-Type": type || "text/plain; charset=utf-8" });
  res.end(body);
}

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(req.url.split("?")[0]);
  } catch (e) {
    return send(res, 400, "Solicitud inválida");
  }
  if (urlPath === "/") urlPath = "/index.html";

  const filePath = path.join(root, urlPath);
  /* Evita salir de la carpeta raíz (path traversal). */
  if (!filePath.startsWith(root + path.sep) && filePath !== root) {
    return send(res, 403, "Prohibido");
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      /* Si la ruta es una carpeta, intenta servir su index.html (ej.: /admin/). */
      if (!err && stat.isDirectory()) {
        return serveFile(path.join(filePath, "index.html"), res, urlPath);
      }
      return send(res, 404, "404 — No encontrado: " + urlPath);
    }
    sendFile(filePath, stat, res);
  });

  function serveFile(fp, res, original) {
    fs.stat(fp, (e2, st2) => {
      if (e2 || !st2.isFile()) {
        return send(res, 404, "404 — No encontrado: " + original);
      }
      sendFile(fp, st2, res);
    });
  }

  function sendFile(fp, stat, res) {
    const type = TYPES[path.extname(fp).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": type,
      "Cache-Control": "no-store",
      /* Evita que el navegador "adivine" tipos de contenido (MIME sniffing) */
      "X-Content-Type-Options": "nosniff"
    });
    fs.createReadStream(fp).pipe(res).on("error", () => send(res, 500, "Error de lectura"));
  }
});

function listen() {
  server.once("error", (err) => {
    if (err.code === "EADDRINUSE" && port < 8090) {
      port += 1;
      listen();
    } else {
      console.error("No se pudo iniciar el servidor:", err.message);
      process.exit(1);
    }
  });
  server.listen(port, host, () => {
    const url = "http://" + host + ":" + port + "/";
    console.log("");
    console.log("  La Boutique Cat & Dog — servidor local");
    console.log("  Raíz: " + root);
    console.log("  Abierto en: " + url);
    console.log("");
    console.log("  (Dejá esta ventana abierta mientras mirás el sitio. Ctrl+C para salir)");
    console.log("");
    if (!process.env.NO_OPEN) exec('start "" "' + url + '"');
  });
}

listen();
