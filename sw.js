/* MD Control - Mi dia
   El tecnico entra a sotanos y almacenes sin senal: la app debe abrir igual
   y mostrar lo ultimo que si alcanzo a bajar.

   Lo que fallaba en datos moviles: se pedia la red PRIMERO y sin limite de
   tiempo. Sin senal `fetch` falla rapido y se servia la copia guardada -por eso
   en modo avion si abria-, pero con senal MALA no falla: se queda esperando. El
   `.catch` nunca corria, la copia nunca se servia, y la pantalla se quedaba en
   blanco. Justo el caso de todos los dias -senal debil, no ausente- era el unico
   que rompia.

   Ahora es al reves: se sirve lo guardado de inmediato y la copia se refresca
   por detras. La app abre siempre, y como el CACHE cambia en cada publicacion,
   una version nueva se recoge igual. */
const CACHE  = "mdcontrol-v164";
const LIMITE = 8000;   // lo que se espera a la red cuando no hay copia guardada

const SHELL = ["./inicio.html", "./index.html", "./entregables.html", "./manifest.json",
               "./ayuda.html", "./levantamientos.html", "./supervision.html", "./demanda.html", "./tablero.html", "./proyectos.html", "./ventas.html", "./programacion.html", "./coordinacion.html", "./captura.html", "./cierre.html", "./cat.html", "./icon-192.png", "./icon-512.png"];

/* Uno por uno y aguantando fallas. `addAll` es todo-o-nada: en datos moviles
   basta que UNO de los dieciocho no baje para que no se guarde NINGUNO, y el
   telefono se queda sin respaldo sin que nada avise. */
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Red con reloj. Se usa solo cuando NO hay copia: si el telefono no contesta en
   `LIMITE`, mejor un error claro que una espera eterna. */
function redConReloj(req){
  return new Promise((ok, mal) => {
    const corta = new AbortController();
    const reloj = setTimeout(() => { corta.abort(); mal(new Error("tardo demasiado")) }, LIMITE);
    fetch(req, {signal: corta.signal})
      .then(r => { clearTimeout(reloj); ok(r) })
      .catch(x => { clearTimeout(reloj); mal(x) });
  });
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;                  // escrituras nunca se cachean

  /* Supabase no se toca. Antes se cacheaba y, peor, cuando fallaba se le
     devolvia `index.html`: la pantalla recibia HTML donde esperaba JSON y
     reventaba con un error que no se parecia en nada a "sin conexion". */
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(req, {ignoreSearch: true}).then(guardado => {
      /* `ignoreSearch` porque las pantallas se abren con cosas pegadas atras
         -captura.html?corregir=MANT-4821, inicio.html?salir=1-, y la cache
         compara la direccion COMPLETA: sin esto nunca encontraba la copia. */
      if (guardado) {
        /* Se entrega ya, y de paso se refresca por detras para la proxima. */
        e.waitUntil(
          fetch(req).then(r => {
            if (r && r.ok) return caches.open(CACHE).then(c => c.put(req, r.clone()));
          }).catch(() => null)
        );
        return guardado;
      }
      return redConReloj(req)
        .then(r => {
          if (r && r.ok) {
            const copia = r.clone();
            e.waitUntil(caches.open(CACHE).then(c => c.put(req, copia)));
          }
          return r;
        })
        /* El respaldo es una PANTALLA, asi que solo vale cuando lo que se pedia
           era una pantalla. A un icono que falta hay que contestarle con un
           error, no con HTML: quien lo pidio no sabe leerlo. */
        .catch(() => req.mode === "navigate"
          ? caches.match("./index.html").then(r => r || Response.error())
          : Response.error());
    })
  );
});
