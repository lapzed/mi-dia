/* ---------- informacion minima de un servicio ----------
   Es la lista de "Titulo de servicio, direcciones, contactos..." que el libro
   Control Area Tecnica pide verificar en cada TKT nuevo, puesta en un solo
   lugar para que Captura y Programacion midan lo mismo.

   No bloquea nada (decision de Guillermo, 25-sep-2026): avisa. Primero se mide
   unas semanas y despues se decide si se aprieta.

   Cada dato dice QUIEN lo debe:
     ventas   lo da el ejecutivo en el CRM. Si falta, se le pide por WhatsApp
              y el lo corrige alla; Captura lo vuelve a copiar.
     captura  se calcula o se copia aqui (CP, coordenadas, TKT). Pedirselo a
              Ventas seria mandarle trabajo que no es suyo.

   Medido al 25-sep-2026 sobre lo capturado desde el 26-jun: en MANT falta el
   telefono en 52%, el correo en 53% y el CP en 72%. Por la API, el CRM trae
   contacto y telefono en casi el 100% de los tickets: la mayoria de los
   huecos son de captura, no de Ventas. */

const MINIMO_COORDS = ["LEV", "INST", "MANT"];   // CAT y PRY_ESP llevan su propia ficha

function _minTxt(v){
  v = (v == null ? "" : String(v)).trim();
  return /^(-+|n\/?a|na|s\/d|0)$/i.test(v) ? "" : v;
}

/* [campo, etiqueta, quien, prueba]. La prueba recibe el servicio y el
   catalogo de tipos de servicio. */
const MINIMO_REGLAS = [
  ["tkt", "TKT", "captura", x => !!_minTxt(x.tkt)],
  ["tipo_servicio", "tipo de servicio del catálogo", "ventas",
    (x, tipos) => {
      const t = _minTxt(x.tipo_servicio).toUpperCase();
      /* "PRIMER SERVICIO DE MANTENIMIENTO" escrito a mano no dice si es
         poliza o garantia; el catalogo si. Sin catalogo cargado, basta con
         que exista. */
      return !!t && (!tipos || !tipos.length || tipos.indexOf(t) >= 0);
    }],
  ["direccion", "dirección", "ventas", x => _minTxt(x.direccion).length >= 8],
  ["cp", "código postal", "captura", x => /^\d{5}$/.test(_minTxt(x.cp))],
  ["lat", "coordenadas", "captura", x => {
      const la = Number(x.lat), lo = Number(x.long);
      return la >= 14 && la <= 33 && lo >= -118 && lo <= -86;
    }],
  ["personal_atiende", "contacto en sitio", "ventas", x => !!_minTxt(x.personal_atiende)],
  ["telefono", "teléfono del contacto", "ventas",
    x => _minTxt(x.telefono).replace(/\D/g, "").length >= 10],
  ["horario_atencion", "horario de atención", "ventas", x => !!_minTxt(x.horario_atencion)],
  ["ejecutivo", "ejecutivo de cuenta", "captura", x => !!_minTxt(x.ejecutivo)],
  ["equipo", "equipo instalado", "ventas", x => !!_minTxt(x.equipo), ["MANT", "INST"]],
  ["serie", "número de serie", "ventas", x => !!_minTxt(x.serie), ["INST"]]
];

/* Los campos que hay que pedirle a la base para poder medir. */
const MINIMO_CAMPOS = "tkt,tipo_servicio,direccion,cp,lat,long,personal_atiende," +
                      "telefono,horario_atencion,ejecutivo,equipo,serie";

/* Lo que le falta al servicio: [{campo, etq, quien}]. null si su
   coordinacion no se mide. */
function faltantesMinimo(x, tipos){
  if (!x || MINIMO_COORDS.indexOf(x.coord) < 0) return null;
  return MINIMO_REGLAS
    .filter(r => !r[4] || r[4].indexOf(x.coord) >= 0)
    .filter(r => !r[3](x, tipos))
    .map(r => ({campo: r[0], etq: r[1], quien: r[2]}));
}

/* verde: completo · ambar: solo falta lo que se arregla en Captura ·
   rojo: falta algo que tiene que dar Ventas */
function semaforoMinimo(f){
  if (!f) return "";
  if (!f.length) return "verde";
  return f.some(z => z.quien === "ventas") ? "rojo" : "ambar";
}

function _minEsc(s){
  return String(s == null ? "" : s).replace(/[&<>"]/g,
    c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
}

/* El punto de color con la lista en el title, para las tablas. */
function puntoMinimo(f){
  const s = semaforoMinimo(f);
  if (!s) return "";
  const txt = !f.length ? "Información mínima completa"
    : "Falta: " + f.map(z => z.etq + (z.quien === "ventas" ? " (Ventas)" : "")).join(", ");
  return '<span class="minimo ' + s + '" title="' + _minEsc(txt) + '">●</span>';
}

/* El renglon de lo que falta, partido por quien lo debe. */
function detalleMinimo(f){
  if (!f || !f.length) return "";
  const v = f.filter(z => z.quien === "ventas").map(z => z.etq);
  const c = f.filter(z => z.quien === "captura").map(z => z.etq);
  return (v.length ? "Ventas: " + v.join(", ") : "") +
         (v.length && c.length ? " · " : "") +
         (c.length ? "Captura: " + c.join(", ") : "");
}

/* El WhatsApp al ejecutivo. Solo lleva lo que es de Ventas: el CP o las
   coordenadas se resuelven aqui. Si el ejecutivo tiene telefono en el
   catalogo el mensaje ya va dirigido; si no, WhatsApp pide elegir el chat. */
function mensajeVentas(x, f, ejecutivo){
  const v = (f || []).filter(z => z.quien === "ventas");
  if (!v.length) return "";
  const nom = (ejecutivo && ejecutivo.nombre) || _minTxt(x.ejecutivo);
  return (nom ? "Hola " + nom.split(" ")[0].charAt(0) +
                nom.split(" ")[0].slice(1).toLowerCase() + ", " : "Hola, ") +
    "para programar este servicio nos falta información en el CRM:\n\n" +
    "*" + (_minTxt(x.tkt) ? "TKT " + x.tkt + " · " : "") + (_minTxt(x.nombre) || "sin nombre") + "*\n" +
    v.map(z => "• " + _minPide(z, x)).join("\n") +
    "\n\n¿Nos ayudas a completarla en el ticket? En cuanto esté, lo programamos. Gracias.";
}

/* Al ejecutivo se le pide en sus palabras, no con la etiqueta del catalogo. */
function _minPide(z, x){
  if (z.campo === "tipo_servicio")
    return x.coord === "MANT"
      ? "Tipo de servicio: póliza o garantía, y qué número de mantenimiento"
      : "Tipo de servicio";
  if (z.campo === "horario_atencion") return "Horario en que nos pueden atender";
  if (z.campo === "personal_atiende") return "Quién nos recibe en el sitio";
  return z.etq.charAt(0).toUpperCase() + z.etq.slice(1);
}

function ligaWhatsApp(texto, telefono){
  let t = String(telefono || "").replace(/\D/g, "");
  if (t.length === 10) t = "52" + t;
  if (t.length !== 12) t = "";
  return "https://wa.me/" + t + "?text=" + encodeURIComponent(texto);
}
