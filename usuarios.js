/* MD Control · quién puede entrar, en UN solo lugar
   ==========================================================================

   POR QUÉ EXISTE ESTE ARCHIVO

   La lista de usuarios del recuadro de acceso estaba escrita a mano y copiada
   TRECE veces, una por pantalla. Se desviaron solas: inicio.html tenía quince
   usuarios y las demás tenían listas más cortas, hechas en otro momento.

   El 19-nov-2026 Mario Manríquez lo dijo así: "tengo que cerrar y abrir varias
   veces la aplicación porque mi usuario no aparece". No era intermitente. Su
   usuario nunca estuvo en la lista de Coordinación. Entraba por el inicio
   —ahí sí estaba— y trabajaba mientras la sesión aguantara; cuando se le
   vencía, el recuadro de la clave no tenía su nombre. Lo mismo le pasaba a
   Antonio Álvarez y a Fernando Yu, que ni lo reportaron.

   Ahora la lista vive aquí y las trece pantallas se alimentan de ella. Dar de
   alta a alguien es agregar UN renglón en este archivo.

   CÓMO SABE CADA PANTALLA A QUIÉN MOSTRAR

   Por grupos, no por nombres. Cada pantalla declara qué grupos ofrece:

       <select id="inUsr" data-grupos="MANT,LEV,INST,PRY,CAT,DIR">

   Los siete grupos de abajo reproducen EXACTAMENTE las trece listas que había
   antes de unificarlas; lo comprobé una por una. Lo único que cambia es el
   orden en un par de pantallas, que ahora es el mismo en todas.

   DIR va en todas: dirección y la gente que apoya a cualquier área. */

/* `g` es el grupo de acceso: decide en qué pantallas aparece.
   `s` es la sección del inicio, que agrupa por área para quien llega de
   fuera. `e` es cómo se lee en el menú de las pantallas de trabajo, y `ei`
   cómo se lee en el inicio cuando ahí se le llama distinto.

   Quien no tiene `g` solo existe en el inicio: el técnico de campo, que no
   lleva clave, y las cuentas de empresa externa. */
const MD_USUARIOS = [
  {u: "TECNICO",         s: "Campo",          ei: "Técnico de campo"},

  {u: "est.ivan",        e: "Iván · Mantenimientos",                   g: "MANT",   s: "Coordinaciones"},
  {u: "est.jair",        e: "Jair · Levantamientos",                   g: "LEV",    s: "Coordinaciones"},
  {u: "est.alin",        e: "Alin · Instalaciones",                    g: "INST",   s: "Coordinaciones"},
  {u: "est.proyectos",   e: "Karina · Proyectos especiales",           g: "PRY",    s: "Coordinaciones"},
  {u: "est.mario",       e: "Mario Manríquez · Proyectos especiales",  g: "PRY",    s: "Coordinaciones"},
  {u: "est.antonio",     e: "Antonio Álvarez · Proyectos especiales",  g: "PRY",    s: "Coordinaciones"},
  {u: "est.yu",          e: "Fernando Yu · Proyectos especiales",      g: "PRY",    s: "Coordinaciones"},
  {u: "est.ariana",      e: "Berenice · CAT",                          g: "CAT",    s: "Coordinaciones"},
  {u: "est.gloria",      e: "Monse · Mantenimientos",                  g: "DIR",    s: "Coordinaciones"},

  {u: "est.ventas",      e: "Ventas",                                  g: "VENTAS", s: "Ventas",
   ei: "Ventas · ejecutivos de cuenta"},
  {u: "est.joseluis",    e: "José Luis · Ventas",                      g: "VENTAS", s: "Ventas",
   ei: "José Luis García · Dirección"},

  {u: "est.ximena",      e: "Ximena · Captura · Mantenimientos",       g: "MANT",   s: "Administración"},
  {u: "est.jocelyn",     e: "Jocelyn · Aux administrativo · Gerencia", g: "DIR",    s: "Administración"},
  {u: "jesus.acosta",                                                               s: "Administración",
   ei: "Jesús · Aux administrativo"},
  {u: "est.subgerencia", e: "Subgerencia",                             g: "DIR",    s: "Administración"},
  {u: "est.gerencia",    e: "Gerencia",                                g: "DIR",    s: "Administración"},

  /* Una cuenta por empresa, no por brigada */
  {u: "ext.sore",        s: "Externos", ei: "Sore · Administrativo externo"},
  {u: "ext.possam",      s: "Externos", ei: "Possam · Administrativo externo"}
];

/* El orden de las secciones del inicio. Fuera de la lista para que agregar a
   alguien no obligue a acordarse de esto. */
const MD_SECCIONES = ["Campo", "Coordinaciones", "Ventas", "Administración", "Externos"];

/* Llena el recuadro de acceso de esta pantalla.

   Se llama sola al cargar el archivo, que va DESPUÉS del <select> en el
   cuerpo: así el menú ya está lleno cuando corre el resto de la pantalla y
   cuando se preselecciona a quien entró la última vez. */
function llenarUsuarios(){
  const sel = document.getElementById("inUsr");
  if(!sel) return;
  const pide = (sel.getAttribute("data-grupos") || "")
    .split(",").map(function(g){ return g.trim().toUpperCase() })
    .filter(Boolean);
  /* Sin declaración se muestran todos. Es lo que hace inicio.html, que es la
     puerta de la casa: ahí entra cualquiera que tenga cuenta. */
  const lista = pide.length
    ? MD_USUARIOS.filter(function(x){ return pide.indexOf(x.g) >= 0 })
    : MD_USUARIOS;
  sel.innerHTML = lista.map(function(x){
    return '<option value="' + x.u + '">' + (x.e || x.ei || x.u) + '</option>';
  }).join("");
}

/* El menú del inicio va agrupado por área, porque ahí llega cualquiera y
   buscarse en una lista de veinte nombres corridos es incómodo. Mismo origen,
   otra presentación. */
function llenarUsuariosInicio(){
  const sel = document.getElementById("inUsr");
  if(!sel) return;
  sel.innerHTML = MD_SECCIONES.map(function(sec){
    const dentro = MD_USUARIOS.filter(function(x){ return x.s === sec });
    if(!dentro.length) return "";
    return '<optgroup label="' + sec + '">' + dentro.map(function(x){
      return '<option value="' + x.u + '">' + (x.ei || x.e || x.u) + '</option>';
    }).join("") + '</optgroup>';
  }).join("");
}

/* Se llena solo al cargar. El inicio vuelve a llamar enseguida a
   llenarUsuariosInicio() para presentarlo por secciones: mismo contenido,
   otra forma. */
try{ llenarUsuarios() }catch(e){}
