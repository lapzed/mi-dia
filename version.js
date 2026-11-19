/* MD Control · qué versión traigo y avísame si hay una nueva
   ==========================================================================

   POR QUÉ EXISTE ESTE ARCHIVO

   El 14-nov-2026 Diego mandó una foto de su pantalla: no le aparecían los
   botones de Salí / Llegué / Terminé. No estaban rotos. Su teléfono traía una
   copia de la app de hacía SIETE SEMANAS, anterior al día en que se hicieron.

   Pasa porque el navegador solo busca versión nueva cuando hay una navegación
   de verdad. Si el técnico deja la pestaña abierta y nada más se cambia a
   ella, nunca se entera. Y nadie lo puede notar, porque la app no decía en
   ninguna parte qué versión traía: para diagnosticarlo hubo que comparar lo
   que se veía en la foto contra las fechas de los commits.

   Así que dos cosas, y ninguna recarga sola:

     1. El número de versión a la vista. Con una foto de la pantalla ya se
        sabe qué trae el teléfono.
     2. Una cinta que avisa cuando hay versión nueva, y se actualiza SOLO si
        el técnico la toca. Recargar por nuestra cuenta le borraría una
        captura a medias a alguien que está en una azotea.

   DE DÓNDE SALE EL NÚMERO

   De `caches.keys()`, que devuelve el nombre del almacén que el service worker
   creó: "mdcontrol-v240". Esa es la verdad de lo que ESTÁ CORRIENDO, no lo que
   debería. Si se escribiera aquí a mano, el día que alguien olvidara cambiarlo
   mentiría, que es peor que no decir nada.

   Si no aparece ningún almacén, la app está corriendo directo de la red y se
   dice así, sin inventar un número. */

(function () {
  "use strict";

  /* ---------------------------------------------------------------- versión */
  function versionDeLaCache() {
    if (!("caches" in window)) return Promise.resolve("");
    return caches.keys()
      .then(function (ks) {
        var m = ks.filter(function (k) { return k.indexOf("mdcontrol-") === 0; });
        return m.length ? m[0].replace("mdcontrol-", "") : "";
      })
      .catch(function () { return "" });
  }

  function mostrarVersion(v) {
    var txt = v || "sin copia guardada";
    /* Si la pantalla reservó su lugar, ahí va. Si no, una etiqueta discreta
       abajo a la izquierda: tiene que poder leerse en una foto, pero no
       estorbar a quien está trabajando. */
    var hueco = document.getElementById("mdver");
    if (hueco) { hueco.textContent = txt; return }

    var e = document.createElement("div");
    e.id = "mdver";
    e.textContent = txt;
    e.style.cssText = "position:fixed;left:6px;bottom:4px;z-index:40;" +
      "font:10px/1 system-ui,sans-serif;color:rgba(255,255,255,.30);" +
      "pointer-events:none;letter-spacing:.3px";
    document.body.appendChild(e);
  }

  /* ------------------------------------------------------------ la cinta ---
     Aparece abajo, encima de todo, y espera. No tiene botón de cerrar a
     propósito: si se pudiera esconder, volveríamos al problema de hoy. */
  function avisarVersionNueva() {
    if (document.getElementById("mdNueva")) return;
    var c = document.createElement("div");
    c.id = "mdNueva";
    c.setAttribute("role", "button");
    c.innerHTML = "<b>Hay una versión nueva de MD Control.</b>" +
                  "<span>Toca aquí para actualizar</span>";
    c.style.cssText = "position:fixed;left:10px;right:10px;bottom:10px;z-index:9999;" +
      "background:#1E6FD9;color:#fff;border-radius:12px;padding:11px 14px;" +
      "font:13px/1.35 system-ui,sans-serif;cursor:pointer;text-align:center;" +
      "box-shadow:0 6px 20px rgba(0,0,0,.45)";
    c.querySelector("span").style.cssText = "display:block;opacity:.85;font-size:11.5px;margin-top:2px";
    c.addEventListener("click", function () {
      c.querySelector("span").textContent = "actualizando…";
      location.reload();
    });
    document.body.appendChild(c);
  }

  /* ------------- si el menú de usuarios se quedó vacío -------------

     Desde el 19-nov-2026 la lista de quién puede entrar vive en usuarios.js,
     en un solo lugar en vez de trece copias. El precio de eso es que si ese
     archivo no carga —red que se cae a media descarga, caché a medio
     escribir—, el menú de acceso queda SIN OPCIONES y nadie puede entrar a
     ninguna pantalla. Dejar a toda el área afuera es peor que cualquier
     problema que esto resuelva.

     Así que si el menú está vacío, se convierte en un campo de texto: el
     usuario se escribe a mano. La clave se sigue pidiendo igual y quien
     decide es la base, no esta pantalla; el menú siempre fue comodidad.

     Esto vive aquí y no en usuarios.js a propósito: tiene que correr
     justamente cuando usuarios.js NO está. */
  function menuVacio(){
    try{
      const sel = document.getElementById("inUsr");
      if(!sel || sel.tagName !== "SELECT" || sel.options.length) return;
      const caja = document.createElement("input");
      caja.id = "inUsr";
      caja.type = "text";
      caja.autocomplete = "username";
      caja.placeholder = "escribe tu usuario";
      caja.value = (function(){ try{ return localStorage.getItem("md_quien") || "" }catch(e){ return "" } })();
      caja.className = sel.className;
      caja.setAttribute("style", sel.getAttribute("style") || "");
      sel.parentNode.replaceChild(caja, sel);
    }catch(e){}
  }
  if(document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", menuVacio);
  else menuVacio();

  /* ---------------------------------------------------------- service worker */
  if (!("serviceWorker" in navigator)) {
    mostrarVersion("");
    return;
  }

  /* La foto del momento en que abrió la pantalla: ¿ya había un worker
     mandando?

     Si NO lo había, lo que viene es la primera instalación, y ahí no hay nada
     que avisar: el código que se está viendo es el mismo que se acaba de
     guardar. Si SÍ lo había, cualquier worker nuevo significa que la pantalla
     quedó vieja.

     Preguntarlo después no sirve: el worker se adueña de la página en cuanto
     se instala (clients.claim), así que para cuando avisa ya parece que
     siempre hubo uno, y la cinta saldría en cada estreno. */
  var habiaControl = !!navigator.serviceWorker.controller;

  navigator.serviceWorker.register("./sw.js").then(function (reg) {

    versionDeLaCache().then(mostrarVersion);

    /* El worker nuevo ya está instalado. Solo es "actualización" si YA había
       uno mandando cuando abrió la pantalla. */
    function vigilar(w) {
      if (!w) return;
      w.addEventListener("statechange", function () {
        if (w.state === "installed" && habiaControl) avisarVersionNueva();
      });
    }
    vigilar(reg.installing);
    if (reg.waiting && habiaControl) avisarVersionNueva();
    reg.addEventListener("updatefound", function () { vigilar(reg.installing) });

    /* ÉSTE es el arreglo de lo de Diego. Cada vez que la pestaña vuelve a la
       vista —que es como se usa el teléfono: se deja abierta y uno regresa a
       ella— se pregunta si hay versión nueva. Sin esto puede pasar un mes sin
       que nadie pregunte. Cada 15 minutos como mucho, para no castigar los
       datos móviles. */
    var ultima = 0;
    function revisar() {
      if (document.hidden) return;
      var ahora = Date.now();
      if (ahora - ultima < 15 * 60 * 1000) return;
      ultima = ahora;
      reg.update().catch(function () {});
    }
    document.addEventListener("visibilitychange", revisar);
    window.addEventListener("online", revisar);
    setTimeout(revisar, 3000);

  }).catch(function () {
    mostrarVersion("");
  });

  /* El worker nuevo tomó el mando (otra pestaña se actualizó, o el anterior
     murió). Lo que se ve en pantalla ya no corresponde al código que manda.
     Otra vez: solo cuenta si ya había uno antes, porque en la instalación de
     estreno este evento también se dispara. */
  navigator.serviceWorker.addEventListener("controllerchange", function () {
    if (habiaControl) avisarVersionNueva();
  });
})();
