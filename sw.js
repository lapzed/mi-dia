/* MD Control - Mi dia
   El tecnico entra a sotanos y almacenes sin senal: la app debe abrir igual
   y mostrar lo ultimo que si alcanzo a bajar. */
const CACHE = "mdcontrol-v87";
const SHELL = ["./inicio.html", "./index.html", "./entregables.html", "./manifest.json",
               "./ayuda.html", "./levantamientos.html", "./supervision.html", "./demanda.html", "./tablero.html", "./ventas.html", "./programacion.html", "./coordinacion.html", "./captura.html", "./cierre.html", "./cat.html", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;                   // escrituras nunca se cachean

  // red primero y guarda copia; si no hay senal, lo ultimo conocido
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) {
          const copia = res.clone();
          caches.open(CACHE).then(c => c.put(req, copia));
        }
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
  );
});
