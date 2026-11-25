/* ---------- el inventario capturado se contradice solo ----------

   Esto no es la informacion minima -eso lo mide minimo.js y es lo que Ventas
   tiene que dar-. Aqui se revisa otra cosa: que lo capturado del equipo sea
   coherente con el aparato que se eligio y con lo que las casillas significan.

   Sale de medir la base el 25-nov-2026, contando el equipo una sola vez por
   sitio, con el inventario del servicio mas reciente:

     - 24 servicios traen WATTS en la casilla de CANTIDAD de amplificador:
       200, 400, 800 y uno con 200800. En los 24, la casilla de capacidad
       -que existe y esta al lado- quedo VACIA. Un solo renglon de "800" le
       sumaba 800 amplificadores a Soriana y otros 800 a Banjercito en el
       conteo de parque instalado.

     - Lo mismo con UPS en 5 servicios, con valores hasta 3000. Ahi es peor:
       el UPS no tiene casilla de capacidad, asi que ese dato no tiene a donde
       ir y lo unico correcto es poner cuantos hay.

     - El 92% de los sitios con PA20 no tiene antena capturada -promedio 0.08
       cuando la configuracion basica lleva una-. Solo en Walmart son unas 650
       antenas instaladas que no figuran en ninguna parte. Las trompetas y el
       estrobo si cuadran (1.86 y 0.79, contra 2 y 1 del basico): la antena es
       la unica pieza que se esta perdiendo.

   AVISA, NO BLOQUEA, igual que minimo.js: son preguntas, no errores. Un sitio
   puede de verdad no tener antena, y por eso la frase es una pregunta y el
   servicio se guarda igual. */

/* Arriba de esto, una cantidad deja de ser creible y huele a capacidad. El
   sitio con mas trompetas de toda la base tiene 48, y el de mas estrobos 41;
   de amplificadores, ninguno pasa de 3 cuando el dato esta bien puesto. */
const INV_TOPE = 10;

function _invNum(v){
  v = (v == null ? "" : String(v)).trim();
  return /^\d+(\.\d+)?$/.test(v) ? Number(v) : null;
}
function _invVacio(v){
  v = (v == null ? "" : String(v)).trim();
  return v === "" || /^(-+|n\/?a|na|s\/d|0)$/i.test(v);
}

/* Los PA llevan sus piezas por separado; el MDT10 viene integrado y por eso
   el 82% de sus sitios no tiene trompetas, que ahi no es un hueco. */
function _esPA(modelo){
  return /^PA\s*0?\d/i.test(String(modelo || "").trim());
}

/* [clave, prueba, texto]. La prueba recibe el servicio ya leido del formulario
   y devuelve true cuando hay algo que preguntar. */
const INVENTARIO_REGLAS = [
  ["ampli_watts",
    x => { const n = _invNum(x.amplificador); return n !== null && n > INV_TOPE },
    x => "En <b>Amplificador (cantidad)</b> dice <b>" + x.amplificador + "</b>. " +
         "¿Son piezas o watts? La capacidad va en el campo de abajo, " +
         "<b>Amplificador (capacidad)</b>; aquí va cuántos hay."],

  ["ups_va",
    x => { const n = _invNum(x.ups); return n !== null && n > INV_TOPE },
    x => "En <b>UPS</b> dice <b>" + x.ups + "</b>. Si son VA, aquí no van: " +
         "esta casilla es cuántos respaldos hay. El UPS no tiene campo de " +
         "capacidad — si hace falta anotarla, va en Materiales."],

  ["pa_sin_antena",
    x => _esPA(x.equipo) && _invVacio(x.antena),
    x => "El <b>" + x.equipo + "</b> lleva antena en su configuración básica, " +
         "y aquí viene vacía. ¿El sitio de verdad no la tiene?"]
];

/* Lo que hay que preguntarle a quien captura: [{clave, html}]. */
function revisarInventario(x){
  const out = [];
  INVENTARIO_REGLAS.forEach(function (r) {
    try { if (r[1](x)) out.push({clave: r[0], html: r[2](x)}) } catch (e) {}
  });
  return out;
}

/* Los campos que hay que leer para poder revisar. */
const INVENTARIO_CAMPOS = ["equipo", "amplificador", "amplificador_cap", "ups", "antena"];
