/* Instalar Mi día en el teléfono
   =================================================================
   La app ya guardaba y ya abría sin señal, pero nadie se lo había ofrecido a
   nadie: había que saber que existía "Agregar a pantalla de inicio" y
   encontrarlo en el menú del navegador. Esto lo pone a la vista.

   Para qué sirve de verdad, por orden de importancia:

   1. En iPhone, Safari BORRA por su cuenta lo que una página guardó cuando
      pasan unos días sin abrirla, y ahí van los cierres que esperan señal. A
      una app agregada a la pantalla de inicio no le aplica esa limpieza. Un
      técnico que cierra sin señal un viernes y no vuelve a abrir hasta la otra
      semana puede perder evidencia que ya no se puede volver a tomar.
   2. Una app que se abre con un icono se usa; una que hay que ir a buscar
      entre treinta pestañas, no.
   3. Sin barra de navegador se gana la pantalla que en un celular hace falta.

   Android deja ofrecer la instalación desde la propia página; iPhone no, y por
   eso ahí lo único posible es explicarle los tres pasos.

   No se carga solo: la pantalla que lo quiera lo incluye con <script
   src="instalar.js" defer></script>. */
(function(){
  "use strict";

  /* Ya instalada: el navegador la abre en su propia ventana. Entonces no hay
     nada que ofrecer, y el aviso solo estorbaría. */
  function yaInstalada(){
    try{
      return (window.matchMedia &&
              window.matchMedia("(display-mode: standalone)").matches) ||
             window.navigator.standalone === true;
    }catch(e){ return false }
  }

  /* iPad con iPadOS 13 o mayor se presenta como Mac; lo que lo delata es que
     tiene pantalla táctil. Sin esto, a los iPad no les saldría nada. */
  function esApple(){
    const ua = navigator.userAgent || "";
    return /iPad|iPhone|iPod/.test(ua) ||
           (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  /* Solo teléfonos y tabletas. En la computadora de coordinación instalar no
     aporta -no hay señal que falte ni pantalla que ganar- y el aviso sería
     ruido en una pantalla que ya está llena. */
  function esDeMano(){
    return esApple() || /Android/i.test(navigator.userAgent || "");
  }

  /* Si lo cerró, no volver a insistir en dos semanas. Un aviso que reaparece
     cada vez que se entra se vuelve parte del paisaje y deja de leerse. */
  const CALLAR = "md_instalar_no";
  const QUINCE = 14 * 24 * 60 * 60 * 1000;
  function silenciado(){
    try{
      const t = parseInt(localStorage.getItem(CALLAR) || "0", 10);
      return t && (Date.now() - t) < QUINCE;
    }catch(e){ return false }
  }
  function silenciar(){
    try{ localStorage.setItem(CALLAR, String(Date.now())) }catch(e){}
  }

  let gatillo = null;          // el permiso que da Android para ofrecer la instalación

  function estilos(){
    if(document.getElementById("estInstalar")) return;
    const s = document.createElement("style");
    s.id = "estInstalar";
    s.textContent = [
      "#barraInstalar{position:fixed;left:10px;right:10px;bottom:10px;z-index:9998;",
      "  background:#12314F;border:1px solid #1D4267;border-radius:14px;",
      "  box-shadow:0 8px 28px rgba(0,0,0,.45);padding:13px 14px;",
      "  font:14px/1.45 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#EAF2FB;",
      "  display:flex;gap:12px;align-items:flex-start}",
      "#barraInstalar img{width:38px;height:38px;border-radius:9px;flex:none}",
      "#barraInstalar .tx{flex:1;min-width:0}",
      "#barraInstalar b{display:block;margin-bottom:2px}",
      "#barraInstalar .q{color:#9DB6D2;font-size:12.5px}",
      "#barraInstalar .bs{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}",
      "#barraInstalar button{border:0;border-radius:9px;padding:9px 14px;font-size:13px;",
      "  font-weight:700;cursor:pointer;font-family:inherit}",
      "#barraInstalar .si{background:#63B3FF;color:#07203A}",
      "#barraInstalar .no{background:transparent;color:#9DB6D2;border:1px solid #1D4267}",
      "#pasosApple{position:fixed;inset:0;z-index:9999;background:rgba(4,14,26,.82);",
      "  display:flex;align-items:center;justify-content:center;padding:18px}",
      "#pasosApple .caja{background:#12314F;border:1px solid #1D4267;border-radius:16px;",
      "  max-width:390px;width:100%;padding:20px;color:#EAF2FB;",
      "  font:14px/1.5 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}",
      "#pasosApple h3{margin:0 0 12px;font-size:16px}",
      "#pasosApple ol{margin:0;padding-left:20px}",
      "#pasosApple li{margin-bottom:11px}",
      "#pasosApple .ic{display:inline-block;background:#0B2038;border:1px solid #1D4267;",
      "  border-radius:6px;padding:1px 7px;margin:0 2px}",
      "#pasosApple .q{color:#9DB6D2;font-size:12.5px;margin-top:14px}",
      "#pasosApple button{margin-top:16px;width:100%;border:0;border-radius:10px;",
      "  padding:12px;background:#63B3FF;color:#07203A;font-weight:700;font-size:14px;",
      "  cursor:pointer;font-family:inherit}"
    ].join("\n");
    document.head.appendChild(s);
  }

  function quitar(){
    const b = document.getElementById("barraInstalar");
    if(b) b.remove();
  }

  function pintarBarra(){
    if(document.getElementById("barraInstalar")) return;
    estilos();
    const d = document.createElement("div");
    d.id = "barraInstalar";
    d.innerHTML =
      '<img src="icon-192.png" alt="">' +
      '<div class="tx"><b>Ten Mi día en tu pantalla de inicio</b>' +
      '<span class="q">Se abre con un toque, como WhatsApp, y lo que cierres sin ' +
      'señal queda a salvo hasta que haya con qué subirlo.</span>' +
      '<div class="bs">' +
        '<button class="si" id="btnInstalar">Instalar</button>' +
        '<button class="no" id="btnInstalarNo">Ahora no</button>' +
      '</div></div>';
    document.body.appendChild(d);
    document.getElementById("btnInstalar").addEventListener("click", instalar);
    document.getElementById("btnInstalarNo").addEventListener("click", function(){
      silenciar(); quitar();
    });
  }

  async function instalar(){
    /* Android: se le devuelve el permiso que el navegador nos dio. Solo sirve
       una vez, así que se suelta después de usarlo. */
    if(gatillo){
      const g = gatillo; gatillo = null;
      quitar();
      try{ g.prompt(); await g.userChoice }catch(e){}
      return;
    }
    pasosApple();
  }

  /* iPhone y iPad: Safari no deja que una página ofrezca instalarse, así que lo
     único que queda es enseñarle dónde está. Se dibuja el botón de Compartir
     con palabras porque el icono no tiene nombre y "el cuadrito con la flecha"
     es como lo reconoce la gente. */
  function pasosApple(){
    estilos();
    const m = document.createElement("div");
    m.id = "pasosApple";
    m.innerHTML =
      '<div class="caja"><h3>Para ponerla en tu pantalla de inicio</h3><ol>' +
      '<li>Toca <b>Compartir</b> <span class="ic">⬆</span>, el cuadrito con la ' +
      'flecha hacia arriba. En el iPhone está abajo; en el iPad, arriba.</li>' +
      '<li>Desliza la lista hacia abajo y elige <b>Agregar a inicio</b>.</li>' +
      '<li>Toca <b>Agregar</b>. Te queda el icono junto a tus otras apps: ' +
      'ábrela siempre desde ahí.</li>' +
      '</ol><div class="q">Hazlo una vez. Desde ese icono, lo que cierres sin ' +
      'señal se conserva hasta que tengas con qué subirlo.</div>' +
      '<button id="btnPasosOk">Entendido</button></div>';
    document.body.appendChild(m);
    document.getElementById("btnPasosOk").addEventListener("click", function(){
      silenciar(); m.remove(); quitar();
    });
  }

  /* Android avisa que se puede instalar; se le gana la mano al navegador para
     ofrecerlo con palabras nuestras y donde no estorbe. */
  window.addEventListener("beforeinstallprompt", function(e){
    e.preventDefault();
    gatillo = e;
    if(!yaInstalada() && !silenciado()) pintarBarra();
  });

  window.addEventListener("appinstalled", function(){ silenciar(); quitar() });

  /* A los Apple nadie les va a avisar: el aviso se les ofrece solo, pero sin
     apurarlos -cuatro segundos, para que primero vean de qué va la pantalla-. */
  function arrancar(){
    if(yaInstalada() || silenciado() || !esDeMano()) return;
    if(esApple()) setTimeout(pintarBarra, 4000);
    /* En Android no se pinta aquí: se espera a `beforeinstallprompt`. Pintarlo
       antes sería ofrecer un botón que a lo mejor no puede instalar nada. */
  }

  if(document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", arrancar);
  else arrancar();
})();
